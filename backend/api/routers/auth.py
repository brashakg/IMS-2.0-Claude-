"""
IMS 2.0 - Authentication Router
================================
Login, logout, token management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta, timezone
import jwt
import hashlib
import os
import bcrypt

from database.connection import get_db

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ims-2.0-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours


# ============================================================================
# SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    store_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict

class TokenData(BaseModel):
    user_id: str
    username: str
    roles: List[str]
    store_ids: List[str]
    active_store_id: Optional[str]
    exp: datetime

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class RefreshTokenRequest(BaseModel):
    token: str


# ============================================================================
# HELPERS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    # Support both bcrypt and legacy sha256
    if hashed_password.startswith('$2'):
        return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())
    else:
        # Legacy sha256 fallback
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = decode_token(token)
    return payload


# ============================================================================
# DEFAULT SUPERADMIN
# ============================================================================

# This is the bootstrap superadmin - can be used to create initial setup
# After creating users in MongoDB, this will be bypassed if username exists in DB
DEFAULT_SUPERADMIN = {
    "user_id": "superadmin-001",
    "username": "superadmin",
    "password": "Super@123",  # Default password - should be changed after first login
    "full_name": "Super Administrator",
    "roles": ["SUPERADMIN"],
    "store_ids": ["*"],  # Access to all stores
    "is_active": True
}


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT token
    """
    db = get_db()
    user = None
    
    # First check MongoDB for user
    if db.is_connected and db.users is not None:
        user_doc = db.users.find_one({"username": request.username})
        if user_doc:
            user = {
                "user_id": str(user_doc.get("_id", user_doc.get("user_id", ""))),
                "username": user_doc["username"],
                "password_hash": user_doc.get("password_hash", ""),
                "full_name": user_doc.get("full_name", user_doc.get("name", "")),
                "roles": user_doc.get("roles", []),
                "store_ids": user_doc.get("store_ids", []),
                "is_active": user_doc.get("is_active", True)
            }
    
    # Fallback to default superadmin if not found in DB
    if not user and request.username == DEFAULT_SUPERADMIN["username"]:
        user = {
            "user_id": DEFAULT_SUPERADMIN["user_id"],
            "username": DEFAULT_SUPERADMIN["username"],
            "password_hash": DEFAULT_SUPERADMIN["password"],  # Plain text comparison for default
            "full_name": DEFAULT_SUPERADMIN["full_name"],
            "roles": DEFAULT_SUPERADMIN["roles"],
            "store_ids": DEFAULT_SUPERADMIN["store_ids"],
            "is_active": DEFAULT_SUPERADMIN["is_active"],
            "is_default": True
        }
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Verify password
    if user.get("is_default"):
        # Direct comparison for default superadmin
        if request.password != user["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid username or password")
    else:
        if not verify_password(request.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="User account is disabled")
    
    # Determine store_ids - SUPERADMIN can access all stores
    user_store_ids = user["store_ids"]
    if "*" in user_store_ids or "SUPERADMIN" in user["roles"]:
        # Fetch all stores for superadmin
        all_stores = []
        if db.is_connected and db.stores:
            stores_cursor = db.stores.find({}, {"_id": 0, "store_id": 1})
            all_stores = [s["store_id"] for s in stores_cursor]
        user_store_ids = all_stores if all_stores else ["*"]
    
    # Validate store access if store_id provided
    active_store = request.store_id
    if active_store and active_store not in user_store_ids and "*" not in user_store_ids:
        if not any(r in ["ADMIN", "SUPERADMIN"] for r in user["roles"]):
            raise HTTPException(status_code=403, detail="No access to this store")
    
    # Create token
    token_data = {
        "user_id": user["user_id"],
        "username": user["username"],
        "roles": user["roles"],
        "store_ids": user_store_ids,
        "active_store_id": active_store or (user_store_ids[0] if user_store_ids and user_store_ids[0] != "*" else None)
    }
    
    access_token = create_access_token(token_data)
    
    return LoginResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "user_id": user["user_id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "roles": user["roles"],
            "store_ids": user_store_ids,
            "active_store_id": token_data["active_store_id"]
        }
    )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout user (invalidate token)
    """
    # In production, add token to blacklist
    return {"message": "Successfully logged out"}


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """
    Get current user info from token
    """
    return current_user


@router.post("/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token
    """
    payload = decode_token(request.token)
    
    # Create new token
    token_data = {
        "user_id": payload["user_id"],
        "username": payload["username"],
        "roles": payload["roles"],
        "store_ids": payload["store_ids"],
        "active_store_id": payload.get("active_store_id")
    }
    
    new_token = create_access_token(token_data)
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest, 
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password
    """
    db = get_db()
    
    if db.is_connected and db.users:
        # Find user
        user = db.users.find_one({"username": current_user["username"]})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify current password
        if not verify_password(request.current_password, user.get("password_hash", "")):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        
        # Update password
        new_hash = hash_password(request.new_password)
        db.users.update_one(
            {"username": current_user["username"]},
            {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}}
        )
        
        return {"message": "Password changed successfully"}
    
    raise HTTPException(status_code=503, detail="Database not available")


@router.post("/switch-store/{store_id}")
async def switch_store(store_id: str, current_user: dict = Depends(get_current_user)):
    """
    Switch active store context
    """
    user_store_ids = current_user.get("store_ids", [])
    
    if store_id not in user_store_ids and "*" not in user_store_ids:
        if not any(r in ["ADMIN", "SUPERADMIN"] for r in current_user["roles"]):
            raise HTTPException(status_code=403, detail="No access to this store")
    
    # Create new token with updated store
    token_data = {
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "roles": current_user["roles"],
        "store_ids": user_store_ids,
        "active_store_id": store_id
    }
    
    new_token = create_access_token(token_data)
    
    return {
        "access_token": new_token,
        "active_store_id": store_id
    }
