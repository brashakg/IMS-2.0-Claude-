"""
IMS 2.0 - API Middleware
=========================
Security middleware for rate limiting and input sanitization
"""
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import bleach
import re
from typing import Any, Dict
import json


# ============================================================================
# RATE LIMITING
# ============================================================================

def get_identifier(request: Request) -> str:
    """
    Get identifier for rate limiting
    Uses user_id if authenticated, otherwise IP address
    """
    # Try to get user from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        try:
            # In a real scenario, decode JWT to get user_id
            # For now, use the token itself as identifier
            return f"user:{auth_header[7:20]}"  # Use first 13 chars of token
        except:
            pass

    # Fall back to IP address
    return get_remote_address(request)


# Create rate limiter instance
limiter = Limiter(
    key_func=get_identifier,
    default_limits=["100/minute", "1000/hour"],  # Default limits
    storage_uri="memory://",  # Use Redis in production
    strategy="fixed-window"
)


# ============================================================================
# INPUT SANITIZATION
# ============================================================================

# Allowed HTML tags (for rich text fields only)
ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote'
]

ALLOWED_ATTRIBUTES = {
    '*': ['class'],
}

# SQL Injection patterns to detect
SQL_INJECTION_PATTERNS = [
    r"(\bUNION\b.*\bSELECT\b)",
    r"(\bSELECT\b.*\bFROM\b.*\bWHERE\b)",
    r"(\bINSERT\b.*\bINTO\b)",
    r"(\bDELETE\b.*\bFROM\b)",
    r"(\bDROP\b.*\bTABLE\b)",
    r"(\bUPDATE\b.*\bSET\b)",
    r"(--|#|/\*|\*/)",  # SQL comments
    r"(\bOR\b.*=.*)",
    r"(\bAND\b.*=.*)",
    r"('.*--)",
    r"(\bEXEC\b|\bEXECUTE\b)",
]

# XSS patterns to detect
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"onerror\s*=",
    r"onload\s*=",
    r"onclick\s*=",
    r"<iframe[^>]*>",
    r"<object[^>]*>",
    r"<embed[^>]*>",
]

# NoSQL Injection patterns (MongoDB)
NOSQL_INJECTION_PATTERNS = [
    r"\$where",
    r"\$ne",
    r"\$gt",
    r"\$lt",
    r"\$regex",
    r"\$or",
    r"\$and",
]


def sanitize_html(text: str, allow_html: bool = False) -> str:
    """
    Sanitize HTML content to prevent XSS attacks

    Args:
        text: Input text
        allow_html: If True, allows safe HTML tags. If False, strips all HTML.

    Returns:
        Sanitized text
    """
    if not text:
        return text

    if allow_html:
        # Allow safe HTML tags
        return bleach.clean(
            text,
            tags=ALLOWED_TAGS,
            attributes=ALLOWED_ATTRIBUTES,
            strip=True
        )
    else:
        # Strip all HTML tags
        return bleach.clean(text, tags=[], strip=True)


def detect_sql_injection(value: str) -> bool:
    """
    Detect potential SQL injection attempts

    Returns:
        True if injection pattern detected
    """
    if not isinstance(value, str):
        return False

    value_upper = value.upper()

    for pattern in SQL_INJECTION_PATTERNS:
        if re.search(pattern, value_upper, re.IGNORECASE):
            return True

    return False


def detect_xss(value: str) -> bool:
    """
    Detect potential XSS attacks

    Returns:
        True if XSS pattern detected
    """
    if not isinstance(value, str):
        return False

    for pattern in XSS_PATTERNS:
        if re.search(pattern, value, re.IGNORECASE):
            return True

    return False


def detect_nosql_injection(value: Any) -> bool:
    """
    Detect potential NoSQL injection attempts

    Returns:
        True if injection pattern detected
    """
    if isinstance(value, dict):
        # Check for MongoDB operators in keys
        for key in value.keys():
            if key.startswith('$'):
                # Allow only safe operators
                safe_operators = ['$eq', '$in', '$nin']
                if key not in safe_operators:
                    return True

        # Recursively check nested dicts
        for v in value.values():
            if detect_nosql_injection(v):
                return True

    elif isinstance(value, str):
        # Check for MongoDB operators in strings
        for pattern in NOSQL_INJECTION_PATTERNS:
            if pattern in value:
                return True

    return False


def sanitize_string(value: str, field_name: str = "", allow_html: bool = False) -> str:
    """
    Sanitize a string value

    Args:
        value: Input string
        field_name: Name of the field (for error messages)
        allow_html: Whether to allow safe HTML

    Returns:
        Sanitized string

    Raises:
        HTTPException: If injection attempt detected
    """
    if not isinstance(value, str):
        return value

    # Detect SQL injection
    if detect_sql_injection(value):
        raise HTTPException(
            status_code=400,
            detail=f"Potential SQL injection detected in {field_name or 'input'}"
        )

    # Detect XSS
    if not allow_html and detect_xss(value):
        raise HTTPException(
            status_code=400,
            detail=f"Potential XSS attack detected in {field_name or 'input'}"
        )

    # Sanitize HTML
    return sanitize_html(value, allow_html=allow_html)


def sanitize_dict(data: Dict[str, Any], allow_html_fields: list = None) -> Dict[str, Any]:
    """
    Sanitize all string values in a dictionary

    Args:
        data: Input dictionary
        allow_html_fields: List of field names that can contain HTML

    Returns:
        Sanitized dictionary
    """
    if not isinstance(data, dict):
        return data

    allow_html_fields = allow_html_fields or []
    sanitized = {}

    for key, value in data.items():
        # Detect NoSQL injection in the structure
        if detect_nosql_injection({key: value}):
            raise HTTPException(
                status_code=400,
                detail=f"Potential NoSQL injection detected in {key}"
            )

        if isinstance(value, str):
            allow_html = key in allow_html_fields
            sanitized[key] = sanitize_string(value, field_name=key, allow_html=allow_html)
        elif isinstance(value, dict):
            sanitized[key] = sanitize_dict(value, allow_html_fields)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_dict(item, allow_html_fields) if isinstance(item, dict)
                else sanitize_string(item, field_name=key) if isinstance(item, str)
                else item
                for item in value
            ]
        else:
            sanitized[key] = value

    return sanitized


async def sanitize_request_body(request: Request) -> None:
    """
    Middleware to sanitize request body

    This should be called before processing the request
    """
    # Only sanitize POST, PUT, PATCH requests with JSON body
    if request.method in ["POST", "PUT", "PATCH"]:
        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type:
            try:
                body = await request.body()
                if body:
                    data = json.loads(body)

                    # Fields that can contain HTML (rich text)
                    html_fields = ['description', 'notes', 'remarks', 'content']

                    # Sanitize the data
                    sanitized_data = sanitize_dict(data, allow_html_fields=html_fields)

                    # Update request state with sanitized data
                    request.state.sanitized_body = sanitized_data
            except json.JSONDecodeError:
                pass  # Invalid JSON, will be caught by FastAPI validation


# ============================================================================
# SECURITY HEADERS
# ============================================================================

SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "geolocation=(self), microphone=(), camera=()",
}


async def add_security_headers(request: Request, call_next):
    """
    Add security headers to all responses
    """
    response = await call_next(request)

    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value

    return response
