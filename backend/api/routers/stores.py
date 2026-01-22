"""
IMS 2.0 - Stores Router
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()

class StoreCreate(BaseModel):
    store_code: str = Field(..., min_length=2, max_length=10)
    store_name: str
    brand: str  # BETTER_VISION, WIZOPT
    address: str
    city: str
    state: str
    pincode: str
    phone: str
    email: Optional[str] = None
    gstin: str
    enabled_categories: List[str] = []
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo_radius: Optional[int] = 100  # meters for geo-fencing

class StoreUpdate(BaseModel):
    store_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    enabled_categories: Optional[List[str]] = None
    is_active: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    geo_radius: Optional[int] = None

def check_admin_role(current_user: dict):
    """Check if user has admin privileges"""
    roles = current_user.get("roles", [])
    if not any(r in ["SUPERADMIN", "ADMIN"] for r in roles):
        raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/")
async def list_stores(
    brand: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    active_only: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """List all stores with optional filters"""
    db = get_db()
    
    if not db.is_connected:
        return {"stores": [], "total": 0}
    
    # Build query filter
    query = {}
    if brand:
        query["brand"] = brand
    if city:
        query["city"] = city
    if active_only:
        query["is_active"] = True
    
    # Get stores
    stores_cursor = db.stores.find(query)
    stores = []
    for store in stores_cursor:
        store_data = {
            "store_id": store.get("store_id"),
            "store_code": store.get("store_code"),
            "store_name": store.get("store_name"),
            "brand": store.get("brand"),
            "address": store.get("address"),
            "city": store.get("city"),
            "state": store.get("state"),
            "pincode": store.get("pincode"),
            "phone": store.get("phone"),
            "email": store.get("email"),
            "gstin": store.get("gstin"),
            "enabled_categories": store.get("enabled_categories", []),
            "is_active": store.get("is_active", True),
            "latitude": store.get("latitude"),
            "longitude": store.get("longitude"),
            "geo_radius": store.get("geo_radius"),
            "created_at": store.get("created_at"),
        }
        stores.append(store_data)
    
    return {"stores": stores, "total": len(stores)}


@router.post("/", status_code=201)
async def create_store(store: StoreCreate, current_user: dict = Depends(get_current_user)):
    """Create a new store"""
    check_admin_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check for duplicate store_code
    existing = db.stores.find_one({"store_code": store.store_code})
    if existing:
        raise HTTPException(status_code=400, detail="Store code already exists")
    
    # Generate store_id
    store_id = f"store-{store.store_code.lower()}"
    
    store_doc = {
        "store_id": store_id,
        "store_code": store.store_code,
        "store_name": store.store_name,
        "brand": store.brand,
        "address": store.address,
        "city": store.city,
        "state": store.state,
        "pincode": store.pincode,
        "phone": store.phone,
        "email": store.email,
        "gstin": store.gstin,
        "enabled_categories": store.enabled_categories,
        "latitude": store.latitude,
        "longitude": store.longitude,
        "geo_radius": store.geo_radius or 100,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.stores.insert_one(store_doc)
    
    return {"store_id": store_id, "message": "Store created successfully"}


@router.get("/{store_id}")
async def get_store(store_id: str, current_user: dict = Depends(get_current_user)):
    """Get store details"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    store = db.stores.find_one({"store_id": store_id})
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {
        "store_id": store.get("store_id"),
        "store_code": store.get("store_code"),
        "store_name": store.get("store_name"),
        "brand": store.get("brand"),
        "address": store.get("address"),
        "city": store.get("city"),
        "state": store.get("state"),
        "pincode": store.get("pincode"),
        "phone": store.get("phone"),
        "email": store.get("email"),
        "gstin": store.get("gstin"),
        "enabled_categories": store.get("enabled_categories", []),
        "is_active": store.get("is_active", True),
        "latitude": store.get("latitude"),
        "longitude": store.get("longitude"),
        "geo_radius": store.get("geo_radius"),
        "created_at": store.get("created_at"),
    }


@router.put("/{store_id}")
async def update_store(store_id: str, store: StoreUpdate, current_user: dict = Depends(get_current_user)):
    """Update store details"""
    check_admin_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.stores.find_one({"store_id": store_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Build update document
    update_data = {}
    for field, value in store.model_dump(exclude_unset=True).items():
        if value is not None:
            update_data[field] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_user.get("user_id")
    
    db.stores.update_one({"store_id": store_id}, {"$set": update_data})
    
    return {"message": "Store updated successfully"}


@router.delete("/{store_id}")
async def delete_store(store_id: str, current_user: dict = Depends(get_current_user)):
    """Soft delete a store"""
    check_admin_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.stores.find_one({"store_id": store_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Soft delete
    db.stores.update_one(
        {"store_id": store_id}, 
        {"$set": {
            "is_active": False, 
            "deleted_at": datetime.now(timezone.utc),
            "deleted_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Store deactivated successfully"}


@router.post("/{store_id}/categories/{category}")
async def enable_category(store_id: str, category: str, current_user: dict = Depends(get_current_user)):
    """Enable a category for a store"""
    check_admin_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.stores.update_one(
        {"store_id": store_id},
        {"$addToSet": {"enabled_categories": category}}
    )
    
    return {"message": f"Category {category} enabled"}


@router.delete("/{store_id}/categories/{category}")
async def disable_category(store_id: str, category: str, current_user: dict = Depends(get_current_user)):
    """Disable a category for a store"""
    check_admin_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.stores.update_one(
        {"store_id": store_id},
        {"$pull": {"enabled_categories": category}}
    )
    
    return {"message": f"Category {category} disabled"}
