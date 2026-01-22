"""
IMS 2.0 - Products Router
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class ProductCreate(BaseModel):
    sku: str
    barcode: Optional[str] = None
    category: str
    brand: str
    subbrand: Optional[str] = None
    model: str
    variant: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    mrp: float = Field(..., gt=0)
    offer_price: float = Field(..., gt=0)
    hsn_code: Optional[str] = None
    tax_rate: float = Field(default=18.0)
    attributes: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    image_url: Optional[str] = None

class ProductUpdate(BaseModel):
    brand: Optional[str] = None
    subbrand: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    color: Optional[str] = None
    size: Optional[str] = None
    mrp: Optional[float] = Field(None, gt=0)
    offer_price: Optional[float] = Field(None, gt=0)
    hsn_code: Optional[str] = None
    tax_rate: Optional[float] = None
    attributes: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


# ============================================================================
# HELPERS
# ============================================================================

def generate_barcode():
    """Generate a unique barcode"""
    import random
    return f"890{random.randint(1000000000, 9999999999)}"


def require_catalog_role(current_user: dict):
    """Check if user can manage catalog"""
    roles = current_user.get("roles", [])
    allowed = ["SUPERADMIN", "ADMIN", "CATALOG_MANAGER"]
    if not any(r in allowed for r in roles):
        raise HTTPException(status_code=403, detail="Catalog management access required")


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_products(
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    active_only: bool = Query(True),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List products with filters"""
    db = get_db()
    
    if not db.is_connected:
        return {"products": [], "total": 0}
    
    # Build query
    query = {}
    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
    if active_only:
        query["is_active"] = True
    if search:
        query["$or"] = [
            {"sku": {"$regex": search, "$options": "i"}},
            {"barcode": {"$regex": search, "$options": "i"}},
            {"model": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
        ]
    
    # Get products
    products_cursor = db.products.find(query).skip(skip).limit(limit)
    total = db.products.count_documents(query)
    
    products = []
    for product in products_cursor:
        products.append({
            "product_id": product.get("product_id"),
            "sku": product.get("sku"),
            "barcode": product.get("barcode"),
            "category": product.get("category"),
            "brand": product.get("brand"),
            "subbrand": product.get("subbrand"),
            "model": product.get("model"),
            "variant": product.get("variant"),
            "color": product.get("color"),
            "size": product.get("size"),
            "mrp": product.get("mrp"),
            "offer_price": product.get("offer_price"),
            "hsn_code": product.get("hsn_code"),
            "tax_rate": product.get("tax_rate"),
            "attributes": product.get("attributes"),
            "description": product.get("description"),
            "image_url": product.get("image_url"),
            "is_active": product.get("is_active", True),
        })
    
    return {"products": products, "total": total}


@router.post("/", status_code=201)
async def create_product(
    product: ProductCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new product"""
    require_catalog_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Validate MRP >= Offer Price
    if product.offer_price > product.mrp:
        raise HTTPException(status_code=400, detail="Offer price cannot exceed MRP")
    
    # Check for duplicate SKU
    existing = db.products.find_one({"sku": product.sku})
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    product_id = f"prod-{uuid.uuid4().hex[:8]}"
    barcode = product.barcode or generate_barcode()
    
    product_doc = {
        "product_id": product_id,
        "sku": product.sku,
        "barcode": barcode,
        "category": product.category,
        "brand": product.brand,
        "subbrand": product.subbrand,
        "model": product.model,
        "variant": product.variant,
        "color": product.color,
        "size": product.size,
        "mrp": product.mrp,
        "offer_price": product.offer_price,
        "hsn_code": product.hsn_code,
        "tax_rate": product.tax_rate,
        "attributes": product.attributes or {},
        "description": product.description,
        "image_url": product.image_url,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.products.insert_one(product_doc)
    
    return {
        "product_id": product_id,
        "sku": product.sku,
        "barcode": barcode,
        "message": "Product created successfully"
    }


@router.get("/sku/{sku}")
async def get_product_by_sku(
    sku: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get product by SKU"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    product = db.products.find_one({"sku": sku})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "product_id": product.get("product_id"),
        "sku": product.get("sku"),
        "barcode": product.get("barcode"),
        "category": product.get("category"),
        "brand": product.get("brand"),
        "subbrand": product.get("subbrand"),
        "model": product.get("model"),
        "variant": product.get("variant"),
        "color": product.get("color"),
        "size": product.get("size"),
        "mrp": product.get("mrp"),
        "offer_price": product.get("offer_price"),
        "hsn_code": product.get("hsn_code"),
        "tax_rate": product.get("tax_rate"),
        "attributes": product.get("attributes"),
        "is_active": product.get("is_active", True),
    }


@router.get("/barcode/{barcode}")
async def get_product_by_barcode(
    barcode: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get product by barcode"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    product = db.products.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "product_id": product.get("product_id"),
        "sku": product.get("sku"),
        "barcode": product.get("barcode"),
        "category": product.get("category"),
        "brand": product.get("brand"),
        "model": product.get("model"),
        "mrp": product.get("mrp"),
        "offer_price": product.get("offer_price"),
        "tax_rate": product.get("tax_rate"),
        "is_active": product.get("is_active", True),
    }


@router.get("/{product_id}")
async def get_product(
    product_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get product by ID"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    product = db.products.find_one({"product_id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "product_id": product.get("product_id"),
        "sku": product.get("sku"),
        "barcode": product.get("barcode"),
        "category": product.get("category"),
        "brand": product.get("brand"),
        "subbrand": product.get("subbrand"),
        "model": product.get("model"),
        "variant": product.get("variant"),
        "color": product.get("color"),
        "size": product.get("size"),
        "mrp": product.get("mrp"),
        "offer_price": product.get("offer_price"),
        "hsn_code": product.get("hsn_code"),
        "tax_rate": product.get("tax_rate"),
        "attributes": product.get("attributes"),
        "description": product.get("description"),
        "image_url": product.get("image_url"),
        "is_active": product.get("is_active", True),
        "created_at": product.get("created_at"),
    }


@router.put("/{product_id}")
async def update_product(
    product_id: str, 
    product: ProductUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update a product"""
    require_catalog_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.products.find_one({"product_id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Validate MRP >= Offer Price if both provided
    update_data = product.model_dump(exclude_unset=True)
    mrp = update_data.get("mrp", existing.get("mrp"))
    offer_price = update_data.get("offer_price", existing.get("offer_price"))
    if offer_price > mrp:
        raise HTTPException(status_code=400, detail="Offer price cannot exceed MRP")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_user.get("user_id")
    
    db.products.update_one({"product_id": product_id}, {"$set": update_data})
    
    return {"message": "Product updated", "product_id": product_id}


@router.delete("/{product_id}")
async def delete_product(
    product_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a product"""
    require_catalog_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.products.update_one(
        {"product_id": product_id},
        {"$set": {
            "is_active": False,
            "deleted_at": datetime.now(timezone.utc),
            "deleted_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Product deactivated"}


@router.get("/brands/list")
async def list_brands(
    category: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    """List distinct brands from products"""
    db = get_db()
    
    if not db.is_connected:
        return {"brands": []}
    
    match_stage = {"is_active": True}
    if category:
        match_stage["category"] = category
    
    brands = db.products.distinct("brand", match_stage)
    
    return {"brands": sorted(brands)}


@router.get("/categories/list")
async def list_categories(current_user: dict = Depends(get_current_user)):
    """List all product categories"""
    return {
        "categories": [
            "SPECTACLES", "SUNGLASSES", "CONTACT_LENS", "READING_GLASSES",
            "SMART_GLASSES", "SMART_SUNGLASSES", "WRIST_WATCH", "SMART_WATCH",
            "CLOCKS", "HEARING_AID", "ACCESSORIES", "LENSES", "SERVICES"
        ]
    }
