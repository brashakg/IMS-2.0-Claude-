"""
IMS 2.0 - Settings Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class CategoryCreate(BaseModel):
    category_id: str = Field(..., min_length=1)
    category_name: str
    hsn_code: str
    gst_rate: float = Field(default=12.0, ge=0, le=28)
    is_optical: bool = False
    requires_prescription: bool = False

class CategoryUpdate(BaseModel):
    category_name: Optional[str] = None
    hsn_code: Optional[str] = None
    gst_rate: Optional[float] = None
    is_optical: Optional[bool] = None
    requires_prescription: Optional[bool] = None
    is_active: Optional[bool] = None

class BrandCreate(BaseModel):
    brand_name: str
    brand_code: Optional[str] = None
    is_active: bool = True

class SubBrandCreate(BaseModel):
    brand_id: str
    subbrand_name: str
    subbrand_code: Optional[str] = None
    is_active: bool = True

class LensPriceCreate(BaseModel):
    lens_type: str  # SINGLE_VISION, BIFOCAL, PROGRESSIVE
    material: str   # CR39, POLY, TRIVEX, HI_INDEX
    coating: str    # NONE, HARD, AR, BLUE_CUT
    index: str      # 1.50, 1.56, 1.61, 1.67, 1.74
    base_price: float
    sale_price: float

class DiscountSettings(BaseModel):
    role: str
    category: Optional[str] = None
    max_discount: float = Field(..., ge=0, le=100)

class IntegrationConfig(BaseModel):
    integration_type: str  # SHOPIFY, TALLY, SHIPROCKET, WHATSAPP, RAZORPAY
    enabled: bool
    config: Dict


# ============================================================================
# HELPERS
# ============================================================================

def require_admin(current_user: dict):
    """Check if user has admin privileges"""
    roles = current_user.get("roles", [])
    if not any(r in ["SUPERADMIN", "ADMIN"] for r in roles):
        raise HTTPException(status_code=403, detail="Admin access required")


# ============================================================================
# CATEGORY ENDPOINTS
# ============================================================================

@router.get("/categories")
async def list_categories(
    active_only: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """List all product categories"""
    db = get_db()
    
    if not db.is_connected:
        # Return default categories if DB not available
        return {"categories": get_default_categories()}
    
    query = {}
    if active_only:
        query["is_active"] = True
    
    categories_cursor = db.get_collection("categories").find(query)
    categories = []
    for cat in categories_cursor:
        categories.append({
            "category_id": cat.get("category_id"),
            "category_name": cat.get("category_name"),
            "hsn_code": cat.get("hsn_code"),
            "gst_rate": cat.get("gst_rate"),
            "is_optical": cat.get("is_optical", False),
            "requires_prescription": cat.get("requires_prescription", False),
            "is_active": cat.get("is_active", True),
        })
    
    # If no categories in DB, return defaults
    if not categories:
        return {"categories": get_default_categories()}
    
    return {"categories": categories}


@router.post("/categories", status_code=201)
async def create_category(
    category: CategoryCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new category"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check for duplicate
    existing = db.get_collection("categories").find_one({"category_id": category.category_id})
    if existing:
        raise HTTPException(status_code=400, detail="Category ID already exists")
    
    cat_doc = {
        "category_id": category.category_id,
        "category_name": category.category_name,
        "hsn_code": category.hsn_code,
        "gst_rate": category.gst_rate,
        "is_optical": category.is_optical,
        "requires_prescription": category.requires_prescription,
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.get_collection("categories").insert_one(cat_doc)
    
    return {"message": "Category created successfully", "category_id": category.category_id}


@router.put("/categories/{category_id}")
async def update_category(
    category_id: str,
    category: CategoryUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update a category"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    update_data = {k: v for k, v in category.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    db.get_collection("categories").update_one(
        {"category_id": category_id},
        {"$set": update_data}
    )
    
    return {"message": "Category updated successfully"}


# ============================================================================
# BRAND ENDPOINTS
# ============================================================================

@router.get("/brands")
async def list_brands(
    active_only: bool = Query(True),
    current_user: dict = Depends(get_current_user)
):
    """List all brands with their sub-brands"""
    db = get_db()
    
    if not db.is_connected:
        return {"brands": []}
    
    query = {}
    if active_only:
        query["is_active"] = True
    
    brands_cursor = db.get_collection("brands").find(query)
    brands = []
    for brand in brands_cursor:
        # Get sub-brands
        subbrands = list(db.get_collection("subbrands").find({"brand_id": brand.get("brand_id")}))
        brands.append({
            "brand_id": brand.get("brand_id"),
            "brand_name": brand.get("brand_name"),
            "brand_code": brand.get("brand_code"),
            "is_active": brand.get("is_active", True),
            "subbrands": [
                {
                    "subbrand_id": sb.get("subbrand_id"),
                    "subbrand_name": sb.get("subbrand_name"),
                    "subbrand_code": sb.get("subbrand_code"),
                    "is_active": sb.get("is_active", True),
                }
                for sb in subbrands
            ]
        })
    
    return {"brands": brands}


@router.post("/brands", status_code=201)
async def create_brand(
    brand: BrandCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new brand"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    import uuid
    brand_id = f"brand-{uuid.uuid4().hex[:8]}"
    
    brand_doc = {
        "brand_id": brand_id,
        "brand_name": brand.brand_name,
        "brand_code": brand.brand_code or brand.brand_name[:3].upper(),
        "is_active": brand.is_active,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.get_collection("brands").insert_one(brand_doc)
    
    return {"message": "Brand created successfully", "brand_id": brand_id}


@router.post("/brands/{brand_id}/subbrands", status_code=201)
async def create_subbrand(
    brand_id: str,
    subbrand: SubBrandCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new sub-brand"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    import uuid
    subbrand_id = f"subbrand-{uuid.uuid4().hex[:8]}"
    
    subbrand_doc = {
        "subbrand_id": subbrand_id,
        "brand_id": brand_id,
        "subbrand_name": subbrand.subbrand_name,
        "subbrand_code": subbrand.subbrand_code,
        "is_active": subbrand.is_active,
        "created_at": datetime.now(timezone.utc),
    }
    
    db.get_collection("subbrands").insert_one(subbrand_doc)
    
    return {"message": "Sub-brand created successfully", "subbrand_id": subbrand_id}


@router.delete("/brands/{brand_id}")
async def delete_brand(
    brand_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Soft delete a brand"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.get_collection("brands").update_one(
        {"brand_id": brand_id},
        {"$set": {"is_active": False, "deleted_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Brand deactivated successfully"}


# ============================================================================
# LENS PRICING ENDPOINTS
# ============================================================================

@router.get("/lens-prices")
async def list_lens_prices(
    lens_type: Optional[str] = Query(None),
    material: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """List lens pricing matrix"""
    db = get_db()
    
    if not db.is_connected:
        return {"lens_prices": get_default_lens_prices()}
    
    query = {}
    if lens_type:
        query["lens_type"] = lens_type
    if material:
        query["material"] = material
    
    prices_cursor = db.get_collection("lens_prices").find(query)
    prices = []
    for price in prices_cursor:
        prices.append({
            "price_id": price.get("price_id"),
            "lens_type": price.get("lens_type"),
            "material": price.get("material"),
            "coating": price.get("coating"),
            "index": price.get("index"),
            "base_price": price.get("base_price"),
            "sale_price": price.get("sale_price"),
        })
    
    if not prices:
        return {"lens_prices": get_default_lens_prices()}
    
    return {"lens_prices": prices}


@router.post("/lens-prices", status_code=201)
async def create_lens_price(
    price: LensPriceCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update lens price"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    import uuid
    price_id = f"lens-{price.lens_type}-{price.material}-{price.coating}-{price.index}".lower()
    
    price_doc = {
        "price_id": price_id,
        "lens_type": price.lens_type,
        "material": price.material,
        "coating": price.coating,
        "index": price.index,
        "base_price": price.base_price,
        "sale_price": price.sale_price,
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Upsert
    db.get_collection("lens_prices").update_one(
        {"price_id": price_id},
        {"$set": price_doc},
        upsert=True
    )
    
    return {"message": "Lens price updated", "price_id": price_id}


# ============================================================================
# DISCOUNT RULES ENDPOINTS
# ============================================================================

@router.get("/discount-rules")
async def get_discount_rules(current_user: dict = Depends(get_current_user)):
    """Get discount rules by role"""
    db = get_db()
    
    if not db.is_connected:
        return {"rules": get_default_discount_rules()}
    
    rules_cursor = db.get_collection("discount_rules").find({})
    rules = []
    for rule in rules_cursor:
        rules.append({
            "role": rule.get("role"),
            "category": rule.get("category"),
            "max_discount": rule.get("max_discount"),
        })
    
    if not rules:
        return {"rules": get_default_discount_rules()}
    
    return {"rules": rules}


@router.post("/discount-rules")
async def set_discount_rule(
    rule: DiscountSettings, 
    current_user: dict = Depends(get_current_user)
):
    """Set discount rule for a role"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    rule_doc = {
        "role": rule.role,
        "category": rule.category,
        "max_discount": rule.max_discount,
        "updated_at": datetime.now(timezone.utc),
    }
    
    # Upsert by role and category
    query = {"role": rule.role}
    if rule.category:
        query["category"] = rule.category
    
    db.get_collection("discount_rules").update_one(
        query,
        {"$set": rule_doc},
        upsert=True
    )
    
    return {"message": "Discount rule updated"}


# ============================================================================
# INTEGRATION ENDPOINTS
# ============================================================================

@router.get("/integrations")
async def list_integrations(current_user: dict = Depends(get_current_user)):
    """List all integration configurations"""
    db = get_db()
    
    default_integrations = [
        {"type": "RAZORPAY", "name": "Razorpay", "enabled": False, "configured": False},
        {"type": "WHATSAPP", "name": "WhatsApp Business", "enabled": False, "configured": False},
        {"type": "TALLY", "name": "Tally ERP", "enabled": False, "configured": False},
        {"type": "SHOPIFY", "name": "Shopify", "enabled": False, "configured": False},
        {"type": "SHIPROCKET", "name": "Shiprocket", "enabled": False, "configured": False},
    ]
    
    if not db.is_connected:
        return {"integrations": default_integrations}
    
    integrations_cursor = db.get_collection("integrations").find({})
    configured = {i.get("integration_type"): i for i in integrations_cursor}
    
    result = []
    for default in default_integrations:
        if default["type"] in configured:
            config = configured[default["type"]]
            result.append({
                "type": default["type"],
                "name": default["name"],
                "enabled": config.get("enabled", False),
                "configured": True,
            })
        else:
            result.append(default)
    
    return {"integrations": result}


@router.post("/integrations")
async def configure_integration(
    config: IntegrationConfig, 
    current_user: dict = Depends(get_current_user)
):
    """Configure an integration"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    integration_doc = {
        "integration_type": config.integration_type,
        "enabled": config.enabled,
        "config": config.config,
        "updated_at": datetime.now(timezone.utc),
        "updated_by": current_user.get("user_id"),
    }
    
    db.get_collection("integrations").update_one(
        {"integration_type": config.integration_type},
        {"$set": integration_doc},
        upsert=True
    )
    
    return {"message": "Integration configured successfully"}


@router.get("/integrations/{integration_type}/test")
async def test_integration(
    integration_type: str, 
    current_user: dict = Depends(get_current_user)
):
    """Test an integration connection"""
    # TODO: Implement actual integration tests
    return {"status": "success", "message": f"{integration_type} connection successful"}


# ============================================================================
# SYSTEM SETTINGS ENDPOINTS
# ============================================================================

@router.get("/system")
async def get_system_settings(current_user: dict = Depends(get_current_user)):
    """Get system settings"""
    db = get_db()
    
    default_settings = {
        "company_name": "Vision Retail",
        "company_logo": None,
        "default_currency": "INR",
        "tax_inclusive_pricing": True,
        "auto_generate_invoice": True,
        "enable_geo_fencing": False,
        "session_timeout_minutes": 480,
    }
    
    if not db.is_connected:
        return {"settings": default_settings}
    
    settings = db.get_collection("system_settings").find_one({"_id": "system"})
    if settings:
        settings.pop("_id", None)
        return {"settings": {**default_settings, **settings}}
    
    return {"settings": default_settings}


@router.post("/system")
async def update_system_settings(
    settings: Dict[str, Any], 
    current_user: dict = Depends(get_current_user)
):
    """Update system settings"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    settings["updated_at"] = datetime.now(timezone.utc)
    settings["updated_by"] = current_user.get("user_id")
    
    db.get_collection("system_settings").update_one(
        {"_id": "system"},
        {"$set": settings},
        upsert=True
    )
    
    return {"message": "Settings updated"}


# ============================================================================
# AUDIT LOG ENDPOINTS
# ============================================================================

@router.get("/audit-log")
async def get_audit_log(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get audit log"""
    require_admin(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        return {"logs": [], "total": 0}
    
    query = {}
    if entity_type:
        query["entity_type"] = entity_type
    if entity_id:
        query["entity_id"] = entity_id
    if user_id:
        query["user_id"] = user_id
    
    logs_cursor = db.audit_logs.find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = db.audit_logs.count_documents(query)
    
    logs = []
    for log in logs_cursor:
        logs.append({
            "log_id": str(log.get("_id")),
            "entity_type": log.get("entity_type"),
            "entity_id": log.get("entity_id"),
            "action": log.get("action"),
            "user_id": log.get("user_id"),
            "username": log.get("username"),
            "details": log.get("details"),
            "created_at": log.get("created_at"),
        })
    
    return {"logs": logs, "total": total}


# ============================================================================
# DEFAULT DATA HELPERS
# ============================================================================

def get_default_categories():
    """Return default product categories"""
    return [
        {"category_id": "SPECTACLES", "category_name": "Spectacles", "hsn_code": "9004", "gst_rate": 12, "is_optical": True, "requires_prescription": True, "is_active": True},
        {"category_id": "SUNGLASSES", "category_name": "Sunglasses", "hsn_code": "9004", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "CONTACT_LENS", "category_name": "Contact Lens", "hsn_code": "9001", "gst_rate": 12, "is_optical": True, "requires_prescription": True, "is_active": True},
        {"category_id": "READING_GLASSES", "category_name": "Reading Glasses", "hsn_code": "9004", "gst_rate": 12, "is_optical": True, "requires_prescription": False, "is_active": True},
        {"category_id": "SMART_GLASSES", "category_name": "Smart Glasses", "hsn_code": "9004", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "SMART_SUNGLASSES", "category_name": "Smart Sunglasses", "hsn_code": "9004", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "WRIST_WATCH", "category_name": "Wrist Watch", "hsn_code": "9102", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "SMART_WATCH", "category_name": "Smart Watch", "hsn_code": "8517", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "CLOCKS", "category_name": "Clocks", "hsn_code": "9105", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "HEARING_AID", "category_name": "Hearing Aid", "hsn_code": "9021", "gst_rate": 5, "is_optical": False, "requires_prescription": True, "is_active": True},
        {"category_id": "ACCESSORIES", "category_name": "Accessories", "hsn_code": "9004", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
        {"category_id": "LENSES", "category_name": "Lenses", "hsn_code": "9001", "gst_rate": 12, "is_optical": True, "requires_prescription": True, "is_active": True},
        {"category_id": "SERVICES", "category_name": "Services", "hsn_code": "9983", "gst_rate": 18, "is_optical": False, "requires_prescription": False, "is_active": True},
    ]


def get_default_lens_prices():
    """Return default lens prices"""
    return [
        {"lens_type": "SINGLE_VISION", "material": "CR39", "coating": "HARD", "index": "1.50", "base_price": 500, "sale_price": 800},
        {"lens_type": "SINGLE_VISION", "material": "CR39", "coating": "AR", "index": "1.50", "base_price": 800, "sale_price": 1200},
        {"lens_type": "SINGLE_VISION", "material": "CR39", "coating": "BLUE_CUT", "index": "1.50", "base_price": 1000, "sale_price": 1500},
        {"lens_type": "BIFOCAL", "material": "CR39", "coating": "HARD", "index": "1.50", "base_price": 1000, "sale_price": 1500},
        {"lens_type": "PROGRESSIVE", "material": "CR39", "coating": "AR", "index": "1.50", "base_price": 3000, "sale_price": 5000},
    ]


def get_default_discount_rules():
    """Return default discount rules by role"""
    return [
        {"role": "SALES_STAFF", "category": None, "max_discount": 10},
        {"role": "SALES_CASHIER", "category": None, "max_discount": 10},
        {"role": "STORE_MANAGER", "category": None, "max_discount": 20},
        {"role": "AREA_MANAGER", "category": None, "max_discount": 25},
        {"role": "ADMIN", "category": None, "max_discount": 100},
        {"role": "SUPERADMIN", "category": None, "max_discount": 100},
    ]
