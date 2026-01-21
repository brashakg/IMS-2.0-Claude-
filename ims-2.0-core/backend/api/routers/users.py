"""
IMS 2.0 - Users Router
=======================
User management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime
import uuid
import bcrypt

from .auth import get_current_user
from ..database import Database
from ...database.repositories.user_repository import UserRepository

router = APIRouter()

# Initialize repository
user_repo = None

def get_user_repository():
    """Initialize user repository with database connection"""
    global user_repo
    if user_repo is None:
        db = Database.get_collection("users")
        user_repo = UserRepository(db)
    return user_repo

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )


# ============================================================================
# SCHEMAS
# ============================================================================

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    roles: List[str] = Field(default=["SALES_STAFF"])
    store_ids: List[str] = Field(default=[])
    primary_store_id: Optional[str] = None
    discount_cap: float = Field(default=10.0, ge=0, le=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    roles: Optional[List[str]] = None
    store_ids: Optional[List[str]] = None
    primary_store_id: Optional[str] = None
    discount_cap: Optional[float] = Field(default=None, ge=0, le=100)
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    user_id: str
    username: str
    email: str
    full_name: str
    phone: Optional[str]
    roles: List[str]
    store_ids: List[str]
    primary_store_id: Optional[str]
    discount_cap: float
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]


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

@router.get("/", response_model=List[dict])
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
    repo = get_user_repository()

    # Build filter
    filter_dict = {}
    if active_only:
        filter_dict["is_active"] = True
    if role:
        filter_dict["roles"] = role
    if store_id:
        filter_dict["accessible_stores"] = store_id

    # Query users
    users = repo.find_many(filter_dict, skip=skip, limit=limit)

    # Remove password from response
    for user in users:
        user.pop("password", None)

    return users


@router.post("/", response_model=dict, status_code=201)
async def create_user(
    user: UserCreate,
    current_user: dict = Depends(require_admin)
):
    """
    Create new user (Admin only)
    """
    repo = get_user_repository()

    # Check if username already exists
    existing = repo.find_by_username(user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check if email already exists
    existing = repo.find_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Hash password using bcrypt
    hashed_password = hash_password(user.password)

    # Create user document
    user_doc = {
        "user_id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password": hashed_password,  # Bcrypt hashed
        "full_name": user.full_name,
        "phone": user.phone,
        "roles": user.roles,
        "accessible_stores": user.store_ids,
        "primary_store_id": user.primary_store_id or (user.store_ids[0] if user.store_ids else None),
        "discount_cap": user.discount_cap,
        "is_active": True,
        "created_at": datetime.now(),
        "created_by": current_user.get("user_id"),
        "updated_at": datetime.now(),
        "last_login": None
    }

    # Save to database
    result = repo.create(user_doc)

    return {
        "user_id": user_doc["user_id"],
        "username": user.username,
        "email": user.email,
        "roles": user.roles,
        "message": "User created successfully"
    }


@router.get("/{user_id}", response_model=dict)
async def get_user(
    user_id: str,
    current_user: dict = Depends(require_manager)
):
    """
    Get user by ID
    """
    repo = get_user_repository()

    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Remove password from response
    user.pop("password", None)

    return user


@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: str,
    user: UserUpdate,
    current_user: dict = Depends(require_admin)
):
    """
    Update user (Admin only)
    """
    repo = get_user_repository()

    # Check if user exists
    existing = repo.find_by_id(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    # Build update data (only include non-None fields)
    update_data = {}
    if user.full_name is not None:
        update_data["full_name"] = user.full_name
    if user.phone is not None:
        update_data["phone"] = user.phone
    if user.roles is not None:
        update_data["roles"] = user.roles
    if user.store_ids is not None:
        update_data["accessible_stores"] = user.store_ids
    if user.primary_store_id is not None:
        update_data["primary_store_id"] = user.primary_store_id
    if user.discount_cap is not None:
        update_data["discount_cap"] = user.discount_cap
    if user.is_active is not None:
        update_data["is_active"] = user.is_active

    update_data["updated_at"] = datetime.now()
    update_data["updated_by"] = current_user.get("user_id")

    # Update in database
    success = repo.update(user_id, update_data)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update user")

    return {
        "user_id": user_id,
        "message": "User updated successfully",
        "updated_fields": list(update_data.keys())
    }


@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Deactivate user (soft delete)
    """
    repo = get_user_repository()

    # Check if user exists
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Don't allow self-deactivation
    if user_id == current_user.get("user_id"):
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    # Soft delete - set is_active to False
    success = repo.update(user_id, {
        "is_active": False,
        "deactivated_at": datetime.now(),
        "deactivated_by": current_user.get("user_id")
    })

    if not success:
        raise HTTPException(status_code=500, detail="Failed to deactivate user")

    return {
        "user_id": user_id,
        "message": "User deactivated successfully"
    }


@router.post("/{user_id}/roles/{role}")
async def add_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_admin)
):
    """
    Add role to user
    """
    repo = get_user_repository()

    # Check if user exists
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate role
    valid_roles = [
        "SUPERADMIN", "ADMIN", "AREA_MANAGER", "STORE_MANAGER",
        "ACCOUNTANT", "CATALOG_MANAGER", "OPTOMETRIST",
        "SALES_CASHIER", "SALES_STAFF", "WORKSHOP_STAFF"
    ]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    # Check if role already exists
    current_roles = user.get("roles", [])
    if role in current_roles:
        return {"message": f"User already has role {role}"}

    # Add role
    success = repo.add_role(user_id, role)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to add role")

    return {"message": f"Role {role} added to user successfully"}


@router.delete("/{user_id}/roles/{role}")
async def remove_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(require_admin)
):
    """
    Remove role from user
    """
    repo = get_user_repository()

    # Check if user exists
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has the role
    current_roles = user.get("roles", [])
    if role not in current_roles:
        return {"message": f"User does not have role {role}"}

    # Don't allow removing the last role
    if len(current_roles) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove user's last role")

    # Remove role
    success = repo.remove_role(user_id, role)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to remove role")

    return {"message": f"Role {role} removed from user successfully"}


@router.post("/{user_id}/stores/{store_id}")
async def add_store_access(
    user_id: str,
    store_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Add store access to user
    """
    repo = get_user_repository()

    # Check if user exists
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if store exists
    store = Database.get_collection("stores").find_one({"store_id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Check if user already has access
    accessible_stores = user.get("accessible_stores", [])
    if store_id in accessible_stores:
        return {"message": f"User already has access to store {store_id}"}

    # Add store access
    success = repo.grant_store_access(user_id, store_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to grant store access")

    return {"message": f"Store {store_id} access granted successfully"}


@router.delete("/{user_id}/stores/{store_id}")
async def remove_store_access(
    user_id: str,
    store_id: str,
    current_user: dict = Depends(require_admin)
):
    """
    Remove store access from user
    """
    repo = get_user_repository()

    # Check if user exists
    user = repo.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has access to this store
    accessible_stores = user.get("accessible_stores", [])
    if store_id not in accessible_stores:
        return {"message": f"User does not have access to store {store_id}"}

    # Don't allow removing access to primary store
    if user.get("primary_store_id") == store_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot remove access to primary store. Change primary store first."
        )

    # Don't allow removing the last store
    if len(accessible_stores) <= 1:
        raise HTTPException(status_code=400, detail="Cannot remove user's last store access")

    # Remove store access
    success = repo.revoke_store_access(user_id, store_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to revoke store access")

    return {"message": f"Store {store_id} access revoked successfully"}


@router.get("/store/{store_id}", response_model=List[dict])
async def get_store_users(
    store_id: str,
    role: Optional[str] = Query(None),
    current_user: dict = Depends(require_manager)
):
    """
    Get users for a specific store
    """
    repo = get_user_repository()

    # Check if current user has access to this store
    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    # Query users for this store
    users = repo.find_by_store(store_id)

    # Filter by role if provided
    if role:
        users = [u for u in users if role in u.get("roles", [])]

    # Remove passwords
    for user in users:
        user.pop("password", None)

    return users


@router.get("/role/{role}", response_model=List[dict])
async def get_users_by_role(
    role: str,
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(require_manager)
):
    """
    Get users by role
    """
    repo = get_user_repository()

    # Query users by role
    users = repo.find_by_role(role)

    # Filter by store if provided
    if store_id:
        # Check if current user has access to this store
        if store_id not in current_user.get("accessible_stores", []):
            raise HTTPException(status_code=403, detail="Access denied to this store")

        users = [u for u in users if store_id in u.get("accessible_stores", [])]

    # Remove passwords
    for user in users:
        user.pop("password", None)

    return users
