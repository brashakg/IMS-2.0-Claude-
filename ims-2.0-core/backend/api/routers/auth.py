"""
IMS 2.0 - Authentication Router
================================
Login, logout, token management
"""
from fastapi import APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from math import radians, cos, sin, asin, sqrt

from ..database import Database
from database.repositories.user_repository import UserRepository
from ..middleware import limiter

router = APIRouter()
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ims-2.0-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

# Initialize repository
user_repo = None

def get_user_repository():
    """Initialize user repository with database connection"""
    global user_repo
    if user_repo is None:
        db = Database.get_collection("users")
        user_repo = UserRepository(db)
    return user_repo


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

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates in meters using Haversine formula
    """
    # Convert decimal degrees to radians
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    # Radius of earth in meters
    r = 6371000

    return c * r

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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
# ENDPOINTS
# ============================================================================

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Max 5 login attempts per minute
async def login(request: LoginRequest, req: Request):
    """
    Authenticate user and return JWT token
    Validates geo-location for store staff
    Rate limited to 5 attempts per minute to prevent brute force attacks
    """
    repo = get_user_repository()

    # Lookup user by username
    user = repo.find_by_username(request.username)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Verify password using bcrypt
    if not verify_password(request.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Check if account is active
    if not user.get("is_active", False):
        raise HTTPException(status_code=403, detail="User account is disabled")

    # Get user roles and accessible stores
    roles = user.get("roles", [])
    accessible_stores = user.get("accessible_stores", [])

    # Validate store access if store_id provided
    active_store = request.store_id
    if active_store:
        if active_store not in accessible_stores:
            # Allow ADMIN/SUPERADMIN to access any store
            if not any(r in ["ADMIN", "SUPERADMIN"] for r in roles):
                raise HTTPException(status_code=403, detail="No access to this store")
    else:
        # Use primary store if no store_id provided
        active_store = user.get("primary_store_id") or (accessible_stores[0] if accessible_stores else None)

    # Geo-location validation for store staff
    # HQ roles (ADMIN, SUPERADMIN, AREA_MANAGER, ACCOUNTANT, CATALOG_MANAGER) are exempt
    hq_roles = ["ADMIN", "SUPERADMIN", "AREA_MANAGER", "ACCOUNTANT", "CATALOG_MANAGER"]
    is_store_staff = not any(r in hq_roles for r in roles)

    if is_store_staff and active_store and request.latitude and request.longitude:
        # Get store location
        store = Database.get_collection("stores").find_one({"store_id": active_store})

        if store and store.get("latitude") and store.get("longitude"):
            store_lat = store["latitude"]
            store_lon = store["longitude"]
            geo_radius = store.get("geo_radius_meters", 500)  # Default 500m

            # Calculate distance
            distance = calculate_distance(
                request.latitude,
                request.longitude,
                store_lat,
                store_lon
            )

            if distance > geo_radius:
                raise HTTPException(
                    status_code=403,
                    detail=f"You must be within {geo_radius}m of the store to login. Current distance: {int(distance)}m"
                )

    # Update last login
    repo.update(user["user_id"], {
        "last_login": datetime.now(),
        "last_login_location": {
            "latitude": request.latitude,
            "longitude": request.longitude
        } if request.latitude and request.longitude else None
    })

    # Create token
    token_data = {
        "user_id": user["user_id"],
        "username": user["username"],
        "roles": roles,
        "accessible_stores": accessible_stores,
        "active_store_id": active_store
    }

    access_token = create_access_token(token_data)

    return LoginResponse(
        access_token=access_token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user={
            "user_id": user["user_id"],
            "username": user["username"],
            "full_name": user.get("full_name"),
            "email": user.get("email"),
            "roles": roles,
            "accessible_stores": accessible_stores,
            "active_store_id": active_store,
            "discount_cap": user.get("discount_cap", 0)
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
@limiter.limit("3/hour")  # Max 3 password changes per hour
async def change_password(
    request: ChangePasswordRequest,
    req: Request,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password
    Verifies current password before updating with bcrypt
    Rate limited to 3 attempts per hour
    """
    repo = get_user_repository()

    # Get user from database
    user = repo.find_by_id(current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify current password
    if not verify_password(request.current_password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    # Hash new password with bcrypt
    new_password_hash = hash_password(request.new_password)

    # Update in database
    success = repo.update(current_user["user_id"], {
        "password": new_password_hash,
        "password_changed_at": datetime.now(),
        "updated_at": datetime.now()
    })

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update password")

    return {
        "message": "Password changed successfully",
        "changed_at": datetime.now().isoformat()
    }


@router.post("/switch-store/{store_id}")
async def switch_store(store_id: str, current_user: dict = Depends(get_current_user)):
    """
    Switch active store context
    """
    if store_id not in current_user["store_ids"]:
        if not any(r in ["ADMIN", "SUPERADMIN"] for r in current_user["roles"]):
            raise HTTPException(status_code=403, detail="No access to this store")
    
    # Create new token with updated store
    token_data = {
        "user_id": current_user["user_id"],
        "username": current_user["username"],
        "roles": current_user["roles"],
        "store_ids": current_user["store_ids"],
        "active_store_id": store_id
    }
    
    new_token = create_access_token(token_data)
    
    return {
        "access_token": new_token,
        "active_store_id": store_id
    }
