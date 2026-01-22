"""
IMS 2.0 - Inventory Router
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import date, datetime, timezone, timedelta
import uuid
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class StockAddRequest(BaseModel):
    product_id: str
    store_id: str
    quantity: int = Field(..., ge=1)
    cost_price: Optional[float] = None
    location_code: Optional[str] = None
    batch_code: Optional[str] = None
    expiry_date: Optional[date] = None

class StockTransferRequest(BaseModel):
    from_store_id: str
    to_store_id: str
    items: List[Dict]  # [{"stock_id": "...", "quantity": 5}]
    notes: Optional[str] = None

class StockCountItem(BaseModel):
    product_id: str
    counted_quantity: int

class StockAdjustRequest(BaseModel):
    stock_id: str
    adjustment: int  # Can be positive or negative
    reason: str


# ============================================================================
# HELPERS
# ============================================================================

def require_inventory_role(current_user: dict):
    """Check if user can manage inventory"""
    roles = current_user.get("roles", [])
    allowed = ["SUPERADMIN", "ADMIN", "STORE_MANAGER", "CATALOG_MANAGER"]
    if not any(r in allowed for r in roles):
        raise HTTPException(status_code=403, detail="Inventory management access required")


# ============================================================================
# STOCK ENDPOINTS
# ============================================================================

@router.get("/stock")
async def get_stock(
    store_id: Optional[str] = Query(None),
    product_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """Get stock with filters"""
    db = get_db()
    
    if not db.is_connected:
        return {"stock": [], "total": 0}
    
    # Build query
    query = {"quantity": {"$gt": 0}}
    
    # Use active store from token if not specified
    if store_id:
        query["store_id"] = store_id
    elif current_user.get("active_store_id"):
        query["store_id"] = current_user["active_store_id"]
    
    if product_id:
        query["product_id"] = product_id
    if category:
        query["category"] = category
    if brand:
        query["brand"] = brand
    if low_stock:
        query["$expr"] = {"$lte": ["$quantity", "$reorder_level"]}
    
    # Get stock items with product details
    stock_cursor = db.stock_units.find(query).skip(skip).limit(limit)
    total = db.stock_units.count_documents(query)
    
    stock_items = []
    for item in stock_cursor:
        # Get product details
        product = db.products.find_one({"product_id": item.get("product_id")})
        
        stock_items.append({
            "stock_id": item.get("stock_id"),
            "product_id": item.get("product_id"),
            "store_id": item.get("store_id"),
            "sku": product.get("sku") if product else None,
            "barcode": item.get("barcode") or (product.get("barcode") if product else None),
            "brand": product.get("brand") if product else item.get("brand"),
            "model": product.get("model") if product else None,
            "category": product.get("category") if product else item.get("category"),
            "quantity": item.get("quantity", 0),
            "available_quantity": item.get("available_quantity", item.get("quantity", 0)),
            "reserved_quantity": item.get("reserved_quantity", 0),
            "mrp": product.get("mrp") if product else item.get("mrp"),
            "offer_price": product.get("offer_price") if product else item.get("offer_price"),
            "cost_price": item.get("cost_price"),
            "reorder_level": item.get("reorder_level", 5),
            "location_code": item.get("location_code"),
            "batch_code": item.get("batch_code"),
            "expiry_date": item.get("expiry_date"),
        })
    
    return {"stock": stock_items, "total": total}


@router.get("/stock/barcode/{barcode}")
async def get_stock_by_barcode(
    barcode: str, 
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get stock item by barcode for POS"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Determine store
    active_store = store_id or current_user.get("active_store_id")
    
    # First find the product
    product = db.products.find_one({"barcode": barcode})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Then find stock for this product in the store
    query = {"product_id": product.get("product_id")}
    if active_store:
        query["store_id"] = active_store
    
    stock = db.stock_units.find_one(query)
    
    return {
        "product_id": product.get("product_id"),
        "sku": product.get("sku"),
        "barcode": barcode,
        "brand": product.get("brand"),
        "model": product.get("model"),
        "category": product.get("category"),
        "color": product.get("color"),
        "size": product.get("size"),
        "mrp": product.get("mrp"),
        "offer_price": product.get("offer_price"),
        "tax_rate": product.get("tax_rate"),
        "hsn_code": product.get("hsn_code"),
        "stock_id": stock.get("stock_id") if stock else None,
        "quantity": stock.get("quantity", 0) if stock else 0,
        "available_quantity": stock.get("available_quantity", 0) if stock else 0,
    }


@router.post("/stock/add")
async def add_stock(
    request: StockAddRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Add stock to inventory"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Verify product exists
    product = db.products.find_one({"product_id": request.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Check if stock entry exists for this product in this store
    existing = db.stock_units.find_one({
        "product_id": request.product_id,
        "store_id": request.store_id
    })
    
    if existing:
        # Update quantity
        db.stock_units.update_one(
            {"stock_id": existing.get("stock_id")},
            {
                "$inc": {"quantity": request.quantity, "available_quantity": request.quantity},
                "$set": {
                    "updated_at": datetime.now(timezone.utc),
                    "updated_by": current_user.get("user_id")
                }
            }
        )
        return {
            "stock_id": existing.get("stock_id"),
            "message": "Stock quantity updated",
            "new_quantity": existing.get("quantity", 0) + request.quantity
        }
    else:
        # Create new stock entry
        stock_id = f"stk-{uuid.uuid4().hex[:8]}"
        
        stock_doc = {
            "stock_id": stock_id,
            "product_id": request.product_id,
            "store_id": request.store_id,
            "barcode": product.get("barcode"),
            "brand": product.get("brand"),
            "category": product.get("category"),
            "quantity": request.quantity,
            "available_quantity": request.quantity,
            "reserved_quantity": 0,
            "cost_price": request.cost_price,
            "reorder_level": 5,
            "location_code": request.location_code,
            "batch_code": request.batch_code,
            "expiry_date": request.expiry_date,
            "created_at": datetime.now(timezone.utc),
            "created_by": current_user.get("user_id"),
        }
        
        db.stock_units.insert_one(stock_doc)
        
        return {
            "stock_id": stock_id,
            "barcode": product.get("barcode"),
            "message": "Stock added successfully"
        }


@router.post("/stock/adjust")
async def adjust_stock(
    request: StockAdjustRequest,
    current_user: dict = Depends(get_current_user)
):
    """Adjust stock quantity (for corrections, damage, etc.)"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    stock = db.stock_units.find_one({"stock_id": request.stock_id})
    if not stock:
        raise HTTPException(status_code=404, detail="Stock item not found")
    
    new_quantity = stock.get("quantity", 0) + request.adjustment
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Adjustment would result in negative stock")
    
    db.stock_units.update_one(
        {"stock_id": request.stock_id},
        {
            "$set": {
                "quantity": new_quantity,
                "available_quantity": new_quantity - stock.get("reserved_quantity", 0),
                "updated_at": datetime.now(timezone.utc),
            },
            "$push": {
                "adjustments": {
                    "adjustment": request.adjustment,
                    "reason": request.reason,
                    "adjusted_by": current_user.get("user_id"),
                    "adjusted_at": datetime.now(timezone.utc),
                }
            }
        }
    )
    
    return {"message": "Stock adjusted", "new_quantity": new_quantity}


# ============================================================================
# TRANSFER ENDPOINTS
# ============================================================================

@router.get("/transfers")
async def list_transfers(
    store_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),  # incoming, outgoing
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List stock transfers"""
    db = get_db()
    
    if not db.is_connected:
        return {"transfers": [], "total": 0}
    
    query = {}
    active_store = store_id or current_user.get("active_store_id")
    
    if active_store:
        if direction == "incoming":
            query["to_store_id"] = active_store
        elif direction == "outgoing":
            query["from_store_id"] = active_store
        else:
            query["$or"] = [{"from_store_id": active_store}, {"to_store_id": active_store}]
    
    if status:
        query["status"] = status
    
    transfers_cursor = db.get_collection("stock_transfers").find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = db.get_collection("stock_transfers").count_documents(query)
    
    transfers = []
    for transfer in transfers_cursor:
        transfers.append({
            "transfer_id": transfer.get("transfer_id"),
            "transfer_number": transfer.get("transfer_number"),
            "from_store_id": transfer.get("from_store_id"),
            "to_store_id": transfer.get("to_store_id"),
            "status": transfer.get("status"),
            "items_count": len(transfer.get("items", [])),
            "notes": transfer.get("notes"),
            "created_at": transfer.get("created_at"),
            "sent_at": transfer.get("sent_at"),
            "received_at": transfer.get("received_at"),
        })
    
    return {"transfers": transfers, "total": total}


@router.post("/transfers")
async def create_transfer(
    request: StockTransferRequest, 
    current_user: dict = Depends(get_current_user)
):
    """Create a stock transfer request"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Generate transfer number
    count = db.get_collection("stock_transfers").count_documents({}) + 1
    transfer_number = f"TRF-{count:05d}"
    transfer_id = f"trf-{uuid.uuid4().hex[:8]}"
    
    transfer_doc = {
        "transfer_id": transfer_id,
        "transfer_number": transfer_number,
        "from_store_id": request.from_store_id,
        "to_store_id": request.to_store_id,
        "items": request.items,
        "status": "DRAFT",
        "notes": request.notes,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.get_collection("stock_transfers").insert_one(transfer_doc)
    
    return {"transfer_id": transfer_id, "transfer_number": transfer_number}


@router.post("/transfers/{transfer_id}/send")
async def send_transfer(
    transfer_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Send transfer (deduct stock from source)"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    transfer = db.get_collection("stock_transfers").find_one({"transfer_id": transfer_id})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.get("status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Transfer already sent")
    
    # Deduct stock from source store
    for item in transfer.get("items", []):
        db.stock_units.update_one(
            {"stock_id": item.get("stock_id")},
            {"$inc": {"quantity": -item.get("quantity", 0), "available_quantity": -item.get("quantity", 0)}}
        )
    
    db.get_collection("stock_transfers").update_one(
        {"transfer_id": transfer_id},
        {"$set": {
            "status": "IN_TRANSIT",
            "sent_at": datetime.now(timezone.utc),
            "sent_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Transfer sent"}


@router.post("/transfers/{transfer_id}/receive")
async def receive_transfer(
    transfer_id: str, 
    items: List[Dict],  # [{"stock_id": "...", "received_quantity": 5}]
    current_user: dict = Depends(get_current_user)
):
    """Receive transfer (add stock to destination)"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    transfer = db.get_collection("stock_transfers").find_one({"transfer_id": transfer_id})
    if not transfer:
        raise HTTPException(status_code=404, detail="Transfer not found")
    
    if transfer.get("status") != "IN_TRANSIT":
        raise HTTPException(status_code=400, detail="Transfer not in transit")
    
    # Add stock to destination store
    for item in items:
        # Find original stock to get product details
        original_stock = db.stock_units.find_one({"stock_id": item.get("stock_id")})
        if original_stock:
            # Check if stock exists in destination
            existing = db.stock_units.find_one({
                "product_id": original_stock.get("product_id"),
                "store_id": transfer.get("to_store_id")
            })
            
            if existing:
                db.stock_units.update_one(
                    {"stock_id": existing.get("stock_id")},
                    {"$inc": {
                        "quantity": item.get("received_quantity", 0),
                        "available_quantity": item.get("received_quantity", 0)
                    }}
                )
            else:
                # Create new stock entry
                new_stock_id = f"stk-{uuid.uuid4().hex[:8]}"
                db.stock_units.insert_one({
                    "stock_id": new_stock_id,
                    "product_id": original_stock.get("product_id"),
                    "store_id": transfer.get("to_store_id"),
                    "barcode": original_stock.get("barcode"),
                    "brand": original_stock.get("brand"),
                    "category": original_stock.get("category"),
                    "quantity": item.get("received_quantity", 0),
                    "available_quantity": item.get("received_quantity", 0),
                    "reserved_quantity": 0,
                    "cost_price": original_stock.get("cost_price"),
                    "created_at": datetime.now(timezone.utc),
                })
    
    db.get_collection("stock_transfers").update_one(
        {"transfer_id": transfer_id},
        {"$set": {
            "status": "RECEIVED",
            "received_items": items,
            "received_at": datetime.now(timezone.utc),
            "received_by": current_user.get("user_id")
        }}
    )
    
    return {"message": "Transfer received"}


# ============================================================================
# STOCK COUNT ENDPOINTS
# ============================================================================

@router.get("/stock-count")
async def list_stock_counts(
    store_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """List stock counts"""
    db = get_db()
    
    if not db.is_connected:
        return {"counts": []}
    
    query = {}
    if store_id:
        query["store_id"] = store_id
    if status:
        query["status"] = status
    
    counts = list(db.get_collection("stock_counts").find(query).sort("created_at", -1).limit(50))
    
    return {"counts": [
        {
            "count_id": c.get("count_id"),
            "store_id": c.get("store_id"),
            "category": c.get("category"),
            "status": c.get("status"),
            "items_counted": len(c.get("items", [])),
            "created_at": c.get("created_at"),
            "completed_at": c.get("completed_at"),
        }
        for c in counts
    ]}


@router.post("/stock-count/start")
async def start_stock_count(
    store_id: str,
    category: str, 
    current_user: dict = Depends(get_current_user)
):
    """Start a new stock count"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    count_id = f"cnt-{uuid.uuid4().hex[:8]}"
    
    count_doc = {
        "count_id": count_id,
        "store_id": store_id,
        "category": category,
        "status": "IN_PROGRESS",
        "items": [],
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.get_collection("stock_counts").insert_one(count_doc)
    
    return {"count_id": count_id}


@router.post("/stock-count/{count_id}/items")
async def record_count_item(
    count_id: str, 
    item: StockCountItem, 
    current_user: dict = Depends(get_current_user)
):
    """Record a counted item"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.get_collection("stock_counts").update_one(
        {"count_id": count_id},
        {"$push": {
            "items": {
                "product_id": item.product_id,
                "counted_quantity": item.counted_quantity,
                "counted_at": datetime.now(timezone.utc),
                "counted_by": current_user.get("user_id"),
            }
        }}
    )
    
    return {"message": "Item counted"}


@router.post("/stock-count/{count_id}/complete")
async def complete_stock_count(
    count_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Complete stock count and calculate variances"""
    require_inventory_role(current_user)
    
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    count = db.get_collection("stock_counts").find_one({"count_id": count_id})
    if not count:
        raise HTTPException(status_code=404, detail="Stock count not found")
    
    variances = []
    for item in count.get("items", []):
        # Get system stock
        stock = db.stock_units.find_one({
            "product_id": item.get("product_id"),
            "store_id": count.get("store_id")
        })
        
        system_qty = stock.get("quantity", 0) if stock else 0
        counted_qty = item.get("counted_quantity", 0)
        variance = counted_qty - system_qty
        
        if variance != 0:
            variances.append({
                "product_id": item.get("product_id"),
                "system_quantity": system_qty,
                "counted_quantity": counted_qty,
                "variance": variance,
            })
    
    db.get_collection("stock_counts").update_one(
        {"count_id": count_id},
        {"$set": {
            "status": "COMPLETED",
            "variances": variances,
            "completed_at": datetime.now(timezone.utc),
            "completed_by": current_user.get("user_id"),
        }}
    )
    
    return {"message": "Stock count completed", "variances": variances}


# ============================================================================
# ALERTS ENDPOINTS
# ============================================================================

@router.get("/low-stock")
async def get_low_stock_alerts(
    store_id: Optional[str] = Query(None), 
    current_user: dict = Depends(get_current_user)
):
    """Get low stock alerts"""
    db = get_db()
    
    if not db.is_connected:
        return {"alerts": [], "total": 0}
    
    query = {"$expr": {"$lte": ["$quantity", "$reorder_level"]}}
    if store_id:
        query["store_id"] = store_id
    elif current_user.get("active_store_id"):
        query["store_id"] = current_user["active_store_id"]
    
    alerts_cursor = db.stock_units.find(query).limit(100)
    
    alerts = []
    for item in alerts_cursor:
        product = db.products.find_one({"product_id": item.get("product_id")})
        alerts.append({
            "stock_id": item.get("stock_id"),
            "product_id": item.get("product_id"),
            "sku": product.get("sku") if product else None,
            "brand": product.get("brand") if product else None,
            "model": product.get("model") if product else None,
            "store_id": item.get("store_id"),
            "current_quantity": item.get("quantity", 0),
            "reorder_level": item.get("reorder_level", 5),
        })
    
    return {"alerts": alerts, "total": len(alerts)}


@router.get("/expiring")
async def get_expiring_stock(
    days: int = Query(30),
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get expiring stock items"""
    db = get_db()
    
    if not db.is_connected:
        return {"items": [], "total": 0}
    
    expiry_threshold = datetime.now(timezone.utc) + timedelta(days=days)
    
    query = {
        "expiry_date": {"$lte": expiry_threshold, "$ne": None},
        "quantity": {"$gt": 0}
    }
    if store_id:
        query["store_id"] = store_id
    
    items_cursor = db.stock_units.find(query).sort("expiry_date", 1).limit(100)
    
    items = []
    for item in items_cursor:
        product = db.products.find_one({"product_id": item.get("product_id")})
        items.append({
            "stock_id": item.get("stock_id"),
            "product_id": item.get("product_id"),
            "sku": product.get("sku") if product else None,
            "brand": product.get("brand") if product else None,
            "store_id": item.get("store_id"),
            "quantity": item.get("quantity", 0),
            "expiry_date": item.get("expiry_date"),
            "batch_code": item.get("batch_code"),
        })
    
    return {"items": items, "total": len(items)}
