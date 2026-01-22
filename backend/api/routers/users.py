"""
IMS 2.0 - Users Router
=======================
User management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone
import uuid
import bcrypt

from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: Optional[str] = None
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    roles: List[str] = Field(default=["SALES_STAFF"])
    store_ids: List[str] = Field(default=[])
    primary_store_id: Optional[str] = None
    discount_cap: float = Field(default=10.0, ge=0, le=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    roles: Optional[List[str]] = None
    store_ids: Optional[List[str]] = None
    primary_store_id: Optional[str] = None
    discount_cap: Optional[float] = Field(default=None, ge=0, le=100)
    is_active: Optional[bool] = None

class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)


# ============================================================================
# HELPERS
# ============================================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


# ============================================================================
# ROLE CHECKS
# ============================================================================

def require_admin(current_user: dict = Depends(get_current_user)):
    """Require ADMIN or SUPERADMIN role"""
    if not any(r in ["ADMIN", "SUPERADMIN"] for r in current_user.get("roles", [])):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

def require_manager(current_user: dict = Depends(get_current_user)):
    """Require STORE_MANAGER or higher"""
    allowed = ["STORE_MANAGER", "AREA_MANAGER", "ADMIN", "SUPERADMIN"]
    if not any(r in allowed for r in current_user.get("roles", [])):
        raise HTTPException(status_code=403, detail="Manager access required")
    return current_user


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_users(
    store_id: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_manager)
):
    """
    List users with filters
    """
    db = get_db()
    
    if not db.is_connected:
        return {"users": [], "total": 0}
    
    # Build query
    query = {}
    if store_id:
        query["store_ids"] = store_id
    if role:
        query["roles"] = role
    if active_only:
        query["is_active"] = True
    
    # Get users
    users_cursor = db.users.find(query).skip(skip).limit(limit)
    total = db.users.count_documents(query)
    
    users = []
    for user in users_cursor:
        user_data = {
            "user_id": str(user.get("_id", user.get("user_id", ""))),
            "username": user.get("username"),
            "email": user.get("email"),
            "full_name": user.get("full_name"),
            "phone": user.get("phone"),
            "roles": user.get("roles", []),
            "store_ids": user.get("store_ids", []),
            "primary_store_id": user.get("primary_store_id"),
            "discount_cap": user.get("discount_cap", 10),
            "is_active": user.get("is_active", True),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login"),
        }
        users.append(user_data)
    
    return {"users": users, "total": total}


@router.post("/", status_code=201)
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Create new user (Admin only)
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check for duplicate username
    existing = db.users.find_one({"username": user.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Generate user_id
    user_id = f"user-{uuid.uuid4().hex[:8]}"
    
    user_doc = {
        "user_id": user_id,
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "full_name": user.full_name,
        "phone": user.phone,
        "roles": user.roles,
        "store_ids": user.store_ids,
        "primary_store_id": user.primary_store_id or (user.store_ids[0] if user.store_ids else None),
        "discount_cap": user.discount_cap,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.users.insert_one(user_doc)
    
    return {
        "user_id": user_id,
        "username": user.username,
        "message": "User created successfully"
    }


@router.get("/{user_id}")
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_manager)
):
    """
    Get user by ID
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    user = db.users.find_one({"$or": [{"user_id": user_id}, {"username": user_id}]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "user_id": str(user.get("_id", user.get("user_id", ""))),
        "username": user.get("username"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "phone": user.get("phone"),
        "roles": user.get("roles", []),
        "store_ids": user.get("store_ids", []),
        "primary_store_id": user.get("primary_store_id"),
        "discount_cap": user.get("discount_cap", 10),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
        "last_login": user.get("last_login"),
    }


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    user: UserUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Update user (Admin only)
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.users.find_one({"$or": [{"user_id": user_id}, {"username": user_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update document
    update_data = {}
    for field, value in user.model_dump(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_user.get("user_id")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]}, 
        {"$set": update_data}
    )
    
    return {"user_id": user_id, "message": "User updated successfully"}


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Deactivate user (soft delete)
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.users.find_one({"$or": [{"user_id": user_id}, {"username": user_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$set": {
            "is_active": False, 
            "deleted_at": datetime.now(timezone.utc),
            "deleted_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "User deactivated"}


@router.post("/{user_id}/reset-password")
async def reset_password(
    user_id: str,
    request: ResetPasswordRequest,
    current_user: dict = Depends(require_admin)
):
    """
    Reset user password (Admin only)
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.users.find_one({"$or": [{"user_id": user_id}, {"username": user_id}]})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$set": {
            "password_hash": hash_password(request.new_password),
            "updated_at": datetime.now(timezone.utc),
            "updated_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Password reset successfully"}


@router.post("/{user_id}/roles/{role}")
async def add_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_admin)
):
    """
    Add role to user
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$addToSet": {"roles": role}}
    )
    
    return {"message": f"Role {role} added to user"}


@router.delete("/{user_id}/roles/{role}")
async def remove_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_admin)
):
    """
    Remove role from user
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$pull": {"roles": role}}
    )
    
    return {"message": f"Role {role} removed from user"}


@router.post("/{user_id}/stores/{store_id}")
async def add_store_access(
    user_id: str,
    store_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Add store access to user
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$addToSet": {"store_ids": store_id}}
    )
    
    return {"message": f"Store {store_id} access granted"}


@router.delete("/{user_id}/stores/{store_id}")
async def remove_store_access(
    user_id: str,
    store_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Remove store access from user
    """
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.users.update_one(
        {"$or": [{"user_id": user_id}, {"username": user_id}]},
        {"$pull": {"store_ids": store_id}}
    )
    
    return {"message": f"Store {store_id} access revoked"}


@router.get("/store/{store_id}")
async def get_store_users(
    store_id: str,
    role: Optional[str] = Query(None),
    current_user: dict = Depends(require_manager)
):
    """
    Get users for a specific store
    """
    db = get_db()
    
    if not db.is_connected:
        return []
    
    query = {"store_ids": store_id, "is_active": True}
    if role:
        query["roles"] = role
    
    users_cursor = db.users.find(query)
    
    users = []
    for user in users_cursor:
        users.append({
            "user_id": str(user.get("_id", user.get("user_id", ""))),
            "username": user.get("username"),
            "full_name": user.get("full_name"),
            "roles": user.get("roles", []),
        })
    
    return users


@router.get("/role/{role}")
async def get_users_by_role(
    role: str,
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_manager)
):
    """
    Get users by role
    """
    db = get_db()
    
    if not db.is_connected:
        return []
    
    query = {"roles": role, "is_active": True}
    if store_id:
        query["store_ids"] = store_id
    
    users_cursor = db.users.find(query)
    
    users = []
    for user in users_cursor:
        users.append({
            "user_id": str(user.get("_id", user.get("user_id", ""))),
            "username": user.get("username"),
            "full_name": user.get("full_name"),
            "store_ids": user.get("store_ids", []),
        })
    
    return users
