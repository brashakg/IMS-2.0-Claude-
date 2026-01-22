"""
IMS 2.0 - Orders Router
========================
Sales order management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timezone, timedelta
from decimal import Decimal
from enum import Enum
import uuid

from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# ENUMS & SCHEMAS
# ============================================================================

class OrderStatus(str, Enum):
    DRAFT = "DRAFT"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    READY = "READY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    PAID = "PAID"
    REFUNDED = "REFUNDED"

class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    EMI = "EMI"
    CREDIT = "CREDIT"
    GIFT_VOUCHER = "GIFT_VOUCHER"
    STORE_CREDIT = "STORE_CREDIT"

class OrderItemCreate(BaseModel):
    item_type: str  # FRAME, LENS, CONTACT_LENS, ACCESSORY, SERVICE
    product_id: str
    stock_id: Optional[str] = None
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0)
    discount_percent: float = Field(default=0, ge=0, le=100)
    prescription_id: Optional[str] = None
    lens_options: Optional[Dict[str, Any]] = None  # coating, tint, etc.

class PaymentCreate(BaseModel):
    method: PaymentMethod
    amount: float = Field(..., gt=0)
    reference: Optional[str] = None

class OrderCreate(BaseModel):
    customer_id: str
    patient_id: Optional[str] = None
    items: List[OrderItemCreate]
    notes: Optional[str] = None
    expected_delivery_days: int = Field(default=7, ge=1)

class OrderUpdate(BaseModel):
    notes: Optional[str] = None
    expected_delivery: Optional[date] = None


# ============================================================================
# HELPERS
# ============================================================================

def generate_order_number(store_id: str, db) -> str:
    """Generate unique order number"""
    today = datetime.now(timezone.utc)
    prefix = f"ORD-{today.strftime('%y%m%d')}"
    
    # Get count for today
    count = db.orders.count_documents({
        "order_number": {"$regex": f"^{prefix}"}
    }) + 1
    
    return f"{prefix}-{count:04d}"


def calculate_order_totals(items: List[Dict]) -> Dict:
    """Calculate order totals from items"""
    subtotal = 0
    total_discount = 0
    total_tax = 0
    
    for item in items:
        item_total = item.get("unit_price", 0) * item.get("quantity", 1)
        discount_amount = item_total * (item.get("discount_percent", 0) / 100)
        taxable_amount = item_total - discount_amount
        tax_amount = taxable_amount * (item.get("tax_rate", 18) / 100)
        
        subtotal += item_total
        total_discount += discount_amount
        total_tax += tax_amount
    
    return {
        "subtotal": round(subtotal, 2),
        "total_discount": round(total_discount, 2),
        "total_tax": round(total_tax, 2),
        "grand_total": round(subtotal - total_discount + total_tax, 2),
    }


def get_discount_cap(roles: List[str]) -> float:
    """Get maximum discount percentage based on user role"""
    if any(r in ["SUPERADMIN", "ADMIN"] for r in roles):
        return 100.0
    if "AREA_MANAGER" in roles:
        return 25.0
    if "STORE_MANAGER" in roles:
        return 20.0
    return 10.0  # Default for SALES_STAFF, etc.


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_orders(
    store_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    customer_id: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List orders with filters"""
    db = get_db()
    
    if not db.is_connected:
        return {"orders": [], "total": 0}
    
    # Build query
    query = {}
    
    # Use active store from token if not provided
    active_store = store_id or current_user.get("active_store_id")
    if active_store:
        query["store_id"] = active_store
    
    if status:
        query["order_status"] = status
    if payment_status:
        query["payment_status"] = payment_status
    if customer_id:
        query["customer_id"] = customer_id
    if from_date:
        query["created_at"] = {"$gte": datetime.combine(from_date, datetime.min.time())}
    if to_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.combine(to_date, datetime.max.time())
        else:
            query["created_at"] = {"$lte": datetime.combine(to_date, datetime.max.time())}
    if search:
        query["$or"] = [
            {"order_number": {"$regex": search, "$options": "i"}},
            {"customer_name": {"$regex": search, "$options": "i"}},
            {"customer_mobile": {"$regex": search}},
        ]
    
    # Get orders
    orders_cursor = db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit)
    total = db.orders.count_documents(query)
    
    orders = []
    for order in orders_cursor:
        orders.append({
            "order_id": order.get("order_id"),
            "order_number": order.get("order_number"),
            "customer_id": order.get("customer_id"),
            "customer_name": order.get("customer_name"),
            "customer_mobile": order.get("customer_mobile"),
            "store_id": order.get("store_id"),
            "order_status": order.get("order_status"),
            "payment_status": order.get("payment_status"),
            "items_count": len(order.get("items", [])),
            "subtotal": order.get("subtotal"),
            "total_discount": order.get("total_discount"),
            "total_tax": order.get("total_tax"),
            "grand_total": order.get("grand_total"),
            "amount_paid": order.get("amount_paid", 0),
            "balance_due": order.get("grand_total", 0) - order.get("amount_paid", 0),
            "expected_delivery": order.get("expected_delivery"),
            "created_at": order.get("created_at"),
            "salesperson_name": order.get("salesperson_name"),
        })
    
    return {"orders": orders, "total": total}


@router.post("/", status_code=201)
async def create_order(
    order: OrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new sales order"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    store_id = current_user.get("active_store_id")
    if not store_id:
        raise HTTPException(status_code=400, detail="No active store selected")
    
    # Validate items
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")
    
    # Get customer details
    customer = db.customers.find_one({"customer_id": order.customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Validate discounts against user's cap
    discount_cap = get_discount_cap(current_user.get("roles", []))
    for item in order.items:
        if item.discount_percent > discount_cap:
            raise HTTPException(
                status_code=403, 
                detail=f"Discount {item.discount_percent}% exceeds your limit of {discount_cap}%"
            )
    
    # Build items with product details
    order_items = []
    for item in order.items:
        product = db.products.find_one({"product_id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        item_doc = {
            "item_id": f"itm-{uuid.uuid4().hex[:8]}",
            "item_type": item.item_type,
            "product_id": item.product_id,
            "stock_id": item.stock_id,
            "sku": product.get("sku"),
            "brand": product.get("brand"),
            "model": product.get("model"),
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "mrp": product.get("mrp"),
            "discount_percent": item.discount_percent,
            "tax_rate": product.get("tax_rate", 18),
            "hsn_code": product.get("hsn_code"),
            "prescription_id": item.prescription_id,
            "lens_options": item.lens_options,
        }
        order_items.append(item_doc)
    
    # Calculate totals
    totals = calculate_order_totals(order_items)
    
    # Generate order number and ID
    order_id = f"ord-{uuid.uuid4().hex[:8]}"
    order_number = generate_order_number(store_id, db)
    
    # Calculate expected delivery
    expected_delivery = datetime.now(timezone.utc) + timedelta(days=order.expected_delivery_days)
    
    order_doc = {
        "order_id": order_id,
        "order_number": order_number,
        "store_id": store_id,
        "customer_id": order.customer_id,
        "customer_name": customer.get("name"),
        "customer_mobile": customer.get("mobile"),
        "patient_id": order.patient_id,
        "items": order_items,
        "order_status": "DRAFT",
        "payment_status": "PENDING",
        "subtotal": totals["subtotal"],
        "total_discount": totals["total_discount"],
        "total_tax": totals["total_tax"],
        "grand_total": totals["grand_total"],
        "amount_paid": 0,
        "payments": [],
        "notes": order.notes,
        "expected_delivery": expected_delivery,
        "salesperson_id": current_user.get("user_id"),
        "salesperson_name": current_user.get("username"),
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.orders.insert_one(order_doc)
    
    return {
        "order_id": order_id,
        "order_number": order_number,
        "status": "DRAFT",
        "grand_total": totals["grand_total"],
        "message": "Order created successfully"
    }


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get order details"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {
        "order_id": order.get("order_id"),
        "order_number": order.get("order_number"),
        "store_id": order.get("store_id"),
        "customer_id": order.get("customer_id"),
        "customer_name": order.get("customer_name"),
        "customer_mobile": order.get("customer_mobile"),
        "patient_id": order.get("patient_id"),
        "items": order.get("items", []),
        "order_status": order.get("order_status"),
        "payment_status": order.get("payment_status"),
        "subtotal": order.get("subtotal"),
        "total_discount": order.get("total_discount"),
        "total_tax": order.get("total_tax"),
        "grand_total": order.get("grand_total"),
        "amount_paid": order.get("amount_paid", 0),
        "balance_due": order.get("grand_total", 0) - order.get("amount_paid", 0),
        "payments": order.get("payments", []),
        "notes": order.get("notes"),
        "expected_delivery": order.get("expected_delivery"),
        "salesperson_name": order.get("salesperson_name"),
        "created_at": order.get("created_at"),
        "confirmed_at": order.get("confirmed_at"),
        "delivered_at": order.get("delivered_at"),
    }


@router.put("/{order_id}")
async def update_order(
    order_id: str,
    order: OrderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update order (only DRAFT orders)"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.orders.find_one({"order_id": order_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if existing.get("order_status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Can only update DRAFT orders")
    
    update_data = {k: v for k, v in order.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    db.orders.update_one({"order_id": order_id}, {"$set": update_data})
    
    return {"order_id": order_id, "message": "Order updated"}


@router.post("/{order_id}/items")
async def add_order_item(
    order_id: str,
    item: OrderItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add item to order (only DRAFT orders)"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Can only add items to DRAFT orders")
    
    # Validate discount
    discount_cap = get_discount_cap(current_user.get("roles", []))
    if item.discount_percent > discount_cap:
        raise HTTPException(status_code=403, detail=f"Discount exceeds your limit of {discount_cap}%")
    
    # Get product details
    product = db.products.find_one({"product_id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    item_doc = {
        "item_id": f"itm-{uuid.uuid4().hex[:8]}",
        "item_type": item.item_type,
        "product_id": item.product_id,
        "stock_id": item.stock_id,
        "sku": product.get("sku"),
        "brand": product.get("brand"),
        "model": product.get("model"),
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "mrp": product.get("mrp"),
        "discount_percent": item.discount_percent,
        "tax_rate": product.get("tax_rate", 18),
        "hsn_code": product.get("hsn_code"),
        "prescription_id": item.prescription_id,
        "lens_options": item.lens_options,
    }
    
    # Add item and recalculate totals
    items = order.get("items", []) + [item_doc]
    totals = calculate_order_totals(items)
    
    db.orders.update_one(
        {"order_id": order_id},
        {
            "$push": {"items": item_doc},
            "$set": {**totals, "updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {"message": "Item added to order", "item_id": item_doc["item_id"]}


@router.delete("/{order_id}/items/{item_id}")
async def remove_order_item(
    order_id: str,
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove item from order (only DRAFT orders)"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Can only remove items from DRAFT orders")
    
    # Remove item and recalculate
    items = [i for i in order.get("items", []) if i.get("item_id") != item_id]
    totals = calculate_order_totals(items)
    
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"items": items, **totals, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"message": "Item removed from order"}


@router.post("/{order_id}/confirm")
async def confirm_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Confirm order (DRAFT -> CONFIRMED)"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") != "DRAFT":
        raise HTTPException(status_code=400, detail="Order is not in DRAFT status")
    
    # Reserve stock for each item
    for item in order.get("items", []):
        if item.get("stock_id"):
            db.stock_units.update_one(
                {"stock_id": item["stock_id"]},
                {
                    "$inc": {
                        "available_quantity": -item.get("quantity", 1),
                        "reserved_quantity": item.get("quantity", 1)
                    }
                }
            )
    
    # Create workshop job if lenses involved
    has_lenses = any(i.get("item_type") in ["LENS", "LENSES"] for i in order.get("items", []))
    if has_lenses:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        db.get_collection("workshop_jobs").insert_one({
            "job_id": job_id,
            "order_id": order_id,
            "order_number": order.get("order_number"),
            "store_id": order.get("store_id"),
            "customer_name": order.get("customer_name"),
            "priority": "NORMAL",
            "status": "PENDING",
            "created_at": datetime.now(timezone.utc),
        })
    
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": "CONFIRMED",
            "confirmed_at": datetime.now(timezone.utc),
            "confirmed_by": current_user.get("user_id"),
        }}
    )
    
    return {"order_id": order_id, "status": "CONFIRMED"}


@router.post("/{order_id}/payments")
async def add_payment(
    order_id: str,
    payment: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add payment to order"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Validate payment doesn't exceed balance
    balance_due = order.get("grand_total", 0) - order.get("amount_paid", 0)
    if payment.amount > balance_due:
        raise HTTPException(status_code=400, detail=f"Payment exceeds balance due of ₹{balance_due}")
    
    payment_doc = {
        "payment_id": f"pay-{uuid.uuid4().hex[:8]}",
        "method": payment.method,
        "amount": payment.amount,
        "reference": payment.reference,
        "received_by": current_user.get("user_id"),
        "received_at": datetime.now(timezone.utc),
    }
    
    new_amount_paid = order.get("amount_paid", 0) + payment.amount
    new_balance = order.get("grand_total", 0) - new_amount_paid
    
    # Determine payment status
    if new_balance <= 0:
        new_payment_status = "PAID"
    elif new_amount_paid > 0:
        new_payment_status = "PARTIAL"
    else:
        new_payment_status = "PENDING"
    
    db.orders.update_one(
        {"order_id": order_id},
        {
            "$push": {"payments": payment_doc},
            "$set": {
                "amount_paid": new_amount_paid,
                "payment_status": new_payment_status,
            }
        }
    )
    
    return {
        "payment_id": payment_doc["payment_id"],
        "message": "Payment recorded",
        "amount_paid": new_amount_paid,
        "balance_due": new_balance,
        "payment_status": new_payment_status,
    }


@router.post("/{order_id}/ready")
async def mark_ready(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark order as ready for delivery"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") not in ["CONFIRMED", "PROCESSING"]:
        raise HTTPException(status_code=400, detail="Order must be CONFIRMED or PROCESSING")
    
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": "READY",
            "ready_at": datetime.now(timezone.utc),
            "ready_by": current_user.get("user_id"),
        }}
    )
    
    return {"order_id": order_id, "status": "READY"}


@router.post("/{order_id}/deliver")
async def deliver_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deliver order to customer"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") != "READY":
        raise HTTPException(status_code=400, detail="Order must be READY for delivery")
    
    # Check payment (allow CREDIT customers to have balance)
    if order.get("payment_status") not in ["PAID", "PARTIAL"]:
        raise HTTPException(status_code=400, detail="Order requires at least partial payment")
    
    # Deduct reserved stock
    for item in order.get("items", []):
        if item.get("stock_id"):
            db.stock_units.update_one(
                {"stock_id": item["stock_id"]},
                {"$inc": {
                    "quantity": -item.get("quantity", 1),
                    "reserved_quantity": -item.get("quantity", 1)
                }}
            )
    
    # Update customer totals
    db.customers.update_one(
        {"customer_id": order.get("customer_id")},
        {"$inc": {
            "total_orders": 1,
            "total_spent": order.get("grand_total", 0),
        }}
    )
    
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": "DELIVERED",
            "delivered_at": datetime.now(timezone.utc),
            "delivered_by": current_user.get("user_id"),
        }}
    )
    
    return {"order_id": order_id, "status": "DELIVERED"}


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    reason: str = Query(..., min_length=5),
    current_user: dict = Depends(get_current_user)
):
    """Cancel order"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.get("order_status") in ["DELIVERED", "CANCELLED"]:
        raise HTTPException(status_code=400, detail="Cannot cancel delivered or already cancelled orders")
    
    # Release reserved stock
    for item in order.get("items", []):
        if item.get("stock_id"):
            db.stock_units.update_one(
                {"stock_id": item["stock_id"]},
                {"$inc": {
                    "available_quantity": item.get("quantity", 1),
                    "reserved_quantity": -item.get("quantity", 1)
                }}
            )
    
    db.orders.update_one(
        {"order_id": order_id},
        {"$set": {
            "order_status": "CANCELLED",
            "cancellation_reason": reason,
            "cancelled_at": datetime.now(timezone.utc),
            "cancelled_by": current_user.get("user_id"),
        }}
    )
    
    return {"order_id": order_id, "status": "CANCELLED"}


@router.get("/{order_id}/invoice")
async def get_invoice(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get/generate invoice for order"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    order = db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Generate invoice number if not exists
    invoice_number = order.get("invoice_number")
    if not invoice_number:
        today = datetime.now(timezone.utc)
        count = db.orders.count_documents({"invoice_number": {"$exists": True}}) + 1
        invoice_number = f"INV/{today.strftime('%Y%m')}/{count:05d}"
        
        db.orders.update_one(
            {"order_id": order_id},
            {"$set": {"invoice_number": invoice_number, "invoice_date": today}}
        )
    
    return {
        "invoice_number": invoice_number,
        "order_id": order_id,
        "order_number": order.get("order_number"),
        "invoice_date": order.get("invoice_date"),
        "customer_name": order.get("customer_name"),
        "items": order.get("items"),
        "subtotal": order.get("subtotal"),
        "total_discount": order.get("total_discount"),
        "total_tax": order.get("total_tax"),
        "grand_total": order.get("grand_total"),
    }


@router.get("/pending/delivery")
async def get_pending_deliveries(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get orders pending delivery"""
    db = get_db()
    
    if not db.is_connected:
        return {"orders": [], "total": 0}
    
    query = {"order_status": "READY"}
    if store_id:
        query["store_id"] = store_id
    elif current_user.get("active_store_id"):
        query["store_id"] = current_user["active_store_id"]
    
    orders = list(db.orders.find(query).sort("created_at", 1).limit(100))
    
    return {
        "orders": [
            {
                "order_id": o.get("order_id"),
                "order_number": o.get("order_number"),
                "customer_name": o.get("customer_name"),
                "customer_mobile": o.get("customer_mobile"),
                "grand_total": o.get("grand_total"),
                "balance_due": o.get("grand_total", 0) - o.get("amount_paid", 0),
                "expected_delivery": o.get("expected_delivery"),
            }
            for o in orders
        ],
        "total": len(orders)
    }


@router.get("/unpaid/list")
async def get_unpaid_orders(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get unpaid/partially paid orders"""
    db = get_db()
    
    if not db.is_connected:
        return {"orders": [], "total": 0}
    
    query = {"payment_status": {"$in": ["PENDING", "PARTIAL"]}}
    if store_id:
        query["store_id"] = store_id
    elif current_user.get("active_store_id"):
        query["store_id"] = current_user["active_store_id"]
    
    orders = list(db.orders.find(query).sort("created_at", 1).limit(100))
    
    return {
        "orders": [
            {
                "order_id": o.get("order_id"),
                "order_number": o.get("order_number"),
                "customer_name": o.get("customer_name"),
                "customer_mobile": o.get("customer_mobile"),
                "grand_total": o.get("grand_total"),
                "amount_paid": o.get("amount_paid", 0),
                "balance_due": o.get("grand_total", 0) - o.get("amount_paid", 0),
                "payment_status": o.get("payment_status"),
            }
            for o in orders
        ],
        "total": len(orders)
    }


@router.get("/overdue/list")
async def get_overdue_orders(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get overdue orders"""
    db = get_db()
    
    if not db.is_connected:
        return {"orders": [], "total": 0}
    
    now = datetime.now(timezone.utc)
    query = {
        "order_status": {"$nin": ["DELIVERED", "CANCELLED"]},
        "expected_delivery": {"$lt": now}
    }
    if store_id:
        query["store_id"] = store_id
    elif current_user.get("active_store_id"):
        query["store_id"] = current_user["active_store_id"]
    
    orders = list(db.orders.find(query).sort("expected_delivery", 1).limit(100))
    
    return {
        "orders": [
            {
                "order_id": o.get("order_id"),
                "order_number": o.get("order_number"),
                "customer_name": o.get("customer_name"),
                "customer_mobile": o.get("customer_mobile"),
                "order_status": o.get("order_status"),
                "expected_delivery": o.get("expected_delivery"),
                "days_overdue": (now - o.get("expected_delivery")).days if o.get("expected_delivery") else 0,
            }
            for o in orders
        ],
        "total": len(orders)
    }
