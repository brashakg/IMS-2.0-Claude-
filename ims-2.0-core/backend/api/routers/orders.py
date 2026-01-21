"""
IMS 2.0 - Orders Router
========================
Sales order management endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
from enum import Enum
import uuid

from .auth import get_current_user
from ..database import Database
from database.repositories.order_repository import OrderRepository
from database.repositories.product_repository import ProductRepository
from database.repositories.prescription_repository import PrescriptionRepository
from database.repositories.user_repository import UserRepository
from ...core.pricing_engine import (
    PricingEngine,
    Product as PricingProduct,
    Role as PricingRole,
    DiscountRequest,
    PricingDecision,
    DiscountClass
)
from ...core.inventory_engine import InventoryEngine
from ...core.workshop_engine import WorkshopEngine

router = APIRouter()

# Initialize repositories
order_repo = None
product_repo = None
prescription_repo = None
user_repo = None

# Initialize engines
pricing_engine = PricingEngine()
inventory_engine = InventoryEngine()
workshop_engine = WorkshopEngine()

def get_repositories():
    """Initialize repositories with database connection"""
    global order_repo, product_repo, prescription_repo, user_repo
    if order_repo is None:
        db = Database.get_collection("orders")
        order_repo = OrderRepository(db)
        product_repo = ProductRepository(Database.get_collection("products"))
        prescription_repo = PrescriptionRepository(Database.get_collection("prescriptions"))
        user_repo = UserRepository(Database.get_collection("users"))
    return order_repo, product_repo, prescription_repo, user_repo


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

class PaymentMethod(str, Enum):
    CASH = "CASH"
    UPI = "UPI"
    CARD = "CARD"
    BANK_TRANSFER = "BANK_TRANSFER"
    EMI = "EMI"
    CREDIT = "CREDIT"
    GIFT_VOUCHER = "GIFT_VOUCHER"

class OrderItemCreate(BaseModel):
    item_type: str  # FRAME, LENS, CONTACT_LENS, ACCESSORY, SERVICE
    product_id: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0)
    discount_percent: float = Field(default=0, ge=0, le=100)
    prescription_id: Optional[str] = None
    lens_options: Optional[dict] = None  # coating, tint, etc.

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
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_orders(
    store_id: Optional[str] = Query(None),
    status: Optional[OrderStatus] = Query(None),
    customer_id: Optional[str] = Query(None),
    from_date: Optional[date] = Query(None),
    to_date: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    List orders with filters
    """
    orders_repo, _, _, _ = get_repositories()

    # Use active store from token if not provided
    if not store_id:
        store_id = current_user.get("active_store_id")

    # Check if user has access to this store
    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    # Query orders based on filters
    if customer_id:
        orders = orders_repo.find_by_customer(customer_id, limit=limit)
    else:
        orders = orders_repo.find_by_store(
            store_id=store_id,
            from_date=from_date,
            to_date=to_date,
            status=status.value if status else None
        )

    # Apply pagination
    total = len(orders)
    orders = orders[skip:skip+limit]

    return {
        "orders": orders,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.post("/", status_code=201)
async def create_order(
    order: OrderCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create new sales order with full validation
    """
    orders_repo, products_repo, prescriptions_repo, users_repo = get_repositories()

    store_id = current_user.get("active_store_id")
    salesperson_id = current_user.get("user_id")
    user_roles = current_user.get("roles", [])

    if not store_id:
        raise HTTPException(status_code=400, detail="No active store selected")

    # Validate items
    if not order.items:
        raise HTTPException(status_code=400, detail="Order must have at least one item")

    # Get user's highest role for discount validation
    user = users_repo.find_by_id(salesperson_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Determine highest role discount cap
    role_caps = {
        "SUPERADMIN": Decimal("100"), "ADMIN": Decimal("100"),
        "AREA_MANAGER": Decimal("25"), "STORE_MANAGER": Decimal("20"),
        "SALES_CASHIER": Decimal("10"), "SALES_STAFF": Decimal("10")
    }
    max_user_discount = max([role_caps.get(r, Decimal("0")) for r in user_roles] + [Decimal("0")])

    # Create user role object for pricing engine
    user_role = PricingRole(
        code=user_roles[0] if user_roles else "SALES_STAFF",
        name=user_roles[0] if user_roles else "Sales Staff",
        max_discount_percent=max_user_discount,
        hierarchy_level=1,
        can_approve_discounts=False
    )

    validated_items = []
    total_amount = Decimal("0")
    requires_approval = []

    # Validate each item
    for idx, item in enumerate(order.items):
        # Get product
        product = products_repo.find_by_id(item.product_id)
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found"
            )

        # Validate prescription for lens items
        if item.item_type in ["OPTICAL_LENS", "CONTACT_LENS"] and not item.prescription_id:
            raise HTTPException(
                status_code=400,
                detail=f"Item {idx + 1}: Prescription required for {item.item_type}"
            )

        # Validate prescription if provided
        if item.prescription_id:
            prescription = prescriptions_repo.find_by_id(item.prescription_id)
            if not prescription:
                raise HTTPException(
                    status_code=404,
                    detail=f"Item {idx + 1}: Prescription {item.prescription_id} not found"
                )

            # Check prescription validity
            if prescription.get("valid_until"):
                valid_until = prescription["valid_until"]
                if isinstance(valid_until, str):
                    valid_until = datetime.fromisoformat(valid_until)
                if valid_until < datetime.now():
                    raise HTTPException(
                        status_code=400,
                        detail=f"Item {idx + 1}: Prescription has expired"
                    )

        # Check stock availability
        stock_filter = {"product_id": item.product_id, "store_id": store_id}
        stock_units = list(Database.get_collection("stock_units").find(stock_filter))

        total_available = sum(
            max(0, s.get("quantity", 0) - s.get("reserved_quantity", 0))
            for s in stock_units
        )

        if total_available < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Item {idx + 1}: Insufficient stock. Available: {total_available}, Requested: {item.quantity}"
            )

        # Apply MRP/Offer price logic and validate discount
        pricing_product = PricingProduct(
            id=product["_id"],
            sku=product.get("sku", ""),
            name=product.get("name", ""),
            mrp=Decimal(str(product.get("mrp", 0))),
            offer_price=Decimal(str(product.get("offer_price", 0))),
            category_code=product.get("category_code", ""),
            discount_class=DiscountClass.PREMIUM,  # Default, should come from product
            brand_code=product.get("brand_code"),
            is_luxury_brand=product.get("is_luxury_brand", False),
            brand_max_discount=Decimal(str(product.get("brand_max_discount", 0))) if product.get("brand_max_discount") else None
        )

        discount_request = DiscountRequest(
            product=pricing_product,
            requested_discount_percent=Decimal(str(item.discount_percent)),
            user_role=user_role,
            store_id=store_id,
            reason=None
        )

        pricing_result = pricing_engine.calculate_pricing(discount_request)

        # Check pricing decision
        if pricing_result.decision == PricingDecision.BLOCKED:
            raise HTTPException(
                status_code=400,
                detail=f"Item {idx + 1}: {pricing_result.reason}"
            )

        if pricing_result.decision == PricingDecision.REQUIRES_APPROVAL:
            requires_approval.append({
                "item_index": idx,
                "product_name": product.get("name"),
                "requested_discount": item.discount_percent,
                "max_allowed": float(pricing_result.allowed_discount_percent),
                "reason": pricing_result.reason,
                "approval_id": pricing_result.approval_id
            })
            # Use max allowed discount for now
            item.discount_percent = float(pricing_result.allowed_discount_percent)

        # Calculate item total
        item_price = pricing_result.final_unit_price * item.quantity
        total_amount += item_price

        validated_items.append({
            "item_type": item.item_type,
            "product_id": item.product_id,
            "product_name": product.get("name"),
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "discount_percent": item.discount_percent,
            "final_price": float(pricing_result.final_unit_price),
            "line_total": float(item_price),
            "prescription_id": item.prescription_id,
            "lens_options": item.lens_options,
            "gst_rate": float(pricing_result.gst_rate),
            "gst_amount": float(pricing_result.gst_amount)
        })

    # Generate order number
    order_count = orders_repo.count({"store_id": store_id})
    order_number = f"ORD-{store_id[:3].upper()}-{datetime.now().strftime('%Y%m')}-{order_count + 1:04d}"

    # Calculate totals
    subtotal = total_amount
    gst_amount = sum(Decimal(str(item["gst_amount"])) * item["quantity"] for item in validated_items)
    grand_total = subtotal + gst_amount

    # Create order document
    order_doc = {
        "order_id": str(uuid.uuid4()),
        "order_number": order_number,
        "store_id": store_id,
        "customer_id": order.customer_id,
        "patient_id": order.patient_id,
        "salesperson_id": salesperson_id,
        "items": validated_items,
        "subtotal": float(subtotal),
        "gst_amount": float(gst_amount),
        "grand_total": float(grand_total),
        "amount_paid": 0.0,
        "balance_due": float(grand_total),
        "payment_status": "UNPAID",
        "status": "DRAFT",
        "notes": order.notes,
        "expected_delivery": datetime.now() + timedelta(days=order.expected_delivery_days),
        "requires_approval": len(requires_approval) > 0,
        "approval_requests": requires_approval,
        "payments": [],
        "created_at": datetime.now(),
        "updated_at": datetime.now(),
        "created_by": salesperson_id
    }

    # Save to database
    result = orders_repo.create(order_doc)

    response = {
        "order_id": order_doc["order_id"],
        "order_number": order_number,
        "status": "DRAFT",
        "grand_total": float(grand_total),
        "message": "Order created successfully"
    }

    if requires_approval:
        response["requires_approval"] = True
        response["approval_requests"] = requires_approval
        response["message"] += ". Some items require discount approval."

    return response


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get order details
    """
    orders_repo, _, _, _ = get_repositories()

    order = orders_repo.find_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if user has access to this order's store
    if order.get("store_id") not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this order")

    return order


@router.put("/{order_id}")
async def update_order(
    order_id: str,
    order: OrderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update order (only DRAFT orders)
    """
    return {"order_id": order_id, "message": "Order updated"}


@router.post("/{order_id}/items")
async def add_order_item(
    order_id: str,
    item: OrderItemCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Add item to order (only DRAFT orders)
    """
    return {"message": "Item added to order"}


@router.delete("/{order_id}/items/{item_id}")
async def remove_order_item(
    order_id: str,
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove item from order (only DRAFT orders)
    """
    return {"message": "Item removed from order"}


@router.post("/{order_id}/confirm")
async def confirm_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Confirm order (DRAFT -> CONFIRMED)
    Reserves stock and creates workshop jobs if needed
    """
    orders_repo, _, _, _ = get_repositories()

    # Get order
    order = orders_repo.find_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify order is in DRAFT status
    if order.get("status") != "DRAFT":
        raise HTTPException(
            status_code=400,
            detail=f"Order cannot be confirmed. Current status: {order.get('status')}"
        )

    # Check if discount approval is pending
    if order.get("requires_approval") and not order.get("discount_approved"):
        raise HTTPException(
            status_code=400,
            detail="Order has pending discount approvals. Cannot confirm until approved."
        )

    # Check if minimum payment is received (at least advance)
    if order.get("amount_paid", 0) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Order requires at least an advance payment before confirmation"
        )

    store_id = order.get("store_id")
    items = order.get("items", [])

    # Reserve stock for all items
    stock_collection = Database.get_collection("stock_units")
    reserved_units = []

    try:
        for item in items:
            product_id = item["product_id"]
            quantity_needed = item["quantity"]

            # Find available stock units
            stock_units = list(stock_collection.find({
                "product_id": product_id,
                "store_id": store_id,
                "acceptance_status": "ACCEPTED"
            }))

            # Sort by expiry (if applicable) - use oldest first
            stock_units.sort(key=lambda x: x.get("expiry_date") or datetime.max)

            quantity_reserved = 0
            for stock_unit in stock_units:
                if quantity_reserved >= quantity_needed:
                    break

                available = stock_unit.get("quantity", 0) - stock_unit.get("reserved_quantity", 0)
                if available <= 0:
                    continue

                reserve_qty = min(available, quantity_needed - quantity_reserved)

                # Update stock unit
                stock_collection.update_one(
                    {"_id": stock_unit["_id"]},
                    {
                        "$inc": {"reserved_quantity": reserve_qty},
                        "$push": {
                            "reservations": {
                                "order_id": order_id,
                                "quantity": reserve_qty,
                                "reserved_at": datetime.now(),
                                "reserved_by": current_user.get("user_id")
                            }
                        }
                    }
                )

                reserved_units.append({
                    "stock_unit_id": str(stock_unit["_id"]),
                    "product_id": product_id,
                    "quantity": reserve_qty
                })

                quantity_reserved += reserve_qty

            if quantity_reserved < quantity_needed:
                # Rollback reservations
                for reserved in reserved_units:
                    stock_collection.update_one(
                        {"_id": reserved["stock_unit_id"]},
                        {"$inc": {"reserved_quantity": -reserved["quantity"]}}
                    )
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for product {item.get('product_name')}. Cannot confirm order."
                )

        # Create workshop jobs for lens items
        workshop_jobs = []
        workshop_collection = Database.get_collection("workshop_jobs")

        for item in items:
            if item["item_type"] in ["OPTICAL_LENS", "FRAME"]:
                # If it's a frame with lenses or just lenses, create workshop job
                if item.get("prescription_id") and item.get("lens_options"):
                    job_doc = {
                        "job_id": str(uuid.uuid4()),
                        "order_id": order_id,
                        "store_id": store_id,
                        "customer_id": order.get("customer_id"),
                        "patient_id": order.get("patient_id"),
                        "product_id": item["product_id"],
                        "prescription_id": item["prescription_id"],
                        "lens_options": item.get("lens_options", {}),
                        "status": "PENDING",
                        "priority": "NORMAL",
                        "expected_completion": datetime.now() + timedelta(days=3),
                        "created_at": datetime.now(),
                        "created_by": current_user.get("user_id")
                    }
                    workshop_collection.insert_one(job_doc)
                    workshop_jobs.append(job_doc["job_id"])

        # Update order status
        update_data = {
            "status": "CONFIRMED",
            "confirmed_at": datetime.now(),
            "confirmed_by": current_user.get("user_id"),
            "reserved_stock": reserved_units,
            "workshop_jobs": workshop_jobs,
            "updated_at": datetime.now()
        }

        orders_repo.update(order_id, update_data)

        return {
            "order_id": order_id,
            "order_number": order.get("order_number"),
            "status": "CONFIRMED",
            "reserved_items": len(reserved_units),
            "workshop_jobs_created": len(workshop_jobs),
            "message": "Order confirmed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        # Rollback any reservations on error
        for reserved in reserved_units:
            stock_collection.update_one(
                {"_id": reserved["stock_unit_id"]},
                {"$inc": {"reserved_quantity": -reserved["quantity"]}}
            )
        raise HTTPException(status_code=500, detail=f"Error confirming order: {str(e)}")


@router.post("/{order_id}/payments")
async def add_payment(
    order_id: str,
    payment: PaymentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Add payment to order
    """
    orders_repo, _, _, _ = get_repositories()

    # Get order
    order = orders_repo.find_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Validate CASH payment requires CASHIER or higher role
    user_roles = current_user.get("roles", [])
    if payment.method == PaymentMethod.CASH:
        allowed_roles = ["SUPERADMIN", "ADMIN", "STORE_MANAGER", "SALES_CASHIER"]
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=403,
                detail="CASH payments require CASHIER role or higher"
            )

    # Validate payment amount doesn't exceed balance
    balance_due = order.get("balance_due", 0)
    if payment.amount > balance_due:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (₹{payment.amount}) exceeds balance due (₹{balance_due})"
        )

    # Create payment record
    payment_doc = {
        "payment_id": str(uuid.uuid4()),
        "method": payment.method.value,
        "amount": payment.amount,
        "reference": payment.reference,
        "received_by": current_user.get("user_id"),
        "received_at": datetime.now()
    }

    # Add payment using repository method
    success = orders_repo.add_payment(order_id, payment_doc)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to record payment")

    # Get updated order
    updated_order = orders_repo.find_by_id(order_id)

    return {
        "payment_id": payment_doc["payment_id"],
        "amount_paid": updated_order.get("amount_paid"),
        "balance_due": updated_order.get("balance_due"),
        "payment_status": updated_order.get("payment_status"),
        "message": "Payment recorded successfully"
    }


@router.post("/{order_id}/ready")
async def mark_ready(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark order as ready for delivery
    """
    return {"order_id": order_id, "status": "READY"}


@router.post("/{order_id}/deliver")
async def deliver_order(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Deliver order to customer
    Verifies full payment (or credit approval) before delivery
    """
    orders_repo, _, _, _ = get_repositories()

    # Get order
    order = orders_repo.find_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify order is READY
    if order.get("status") != "READY":
        raise HTTPException(
            status_code=400,
            detail=f"Order is not ready for delivery. Current status: {order.get('status')}"
        )

    # Verify payment (unless credit customer)
    is_credit_customer = order.get("is_credit_customer", False)
    payment_status = order.get("payment_status")

    if not is_credit_customer and payment_status != "PAID":
        balance_due = order.get("balance_due", 0)
        raise HTTPException(
            status_code=400,
            detail=f"Full payment required before delivery. Balance due: ₹{balance_due}"
        )

    # If credit customer, verify credit approval
    if is_credit_customer and not order.get("credit_approved"):
        raise HTTPException(
            status_code=400,
            detail="Credit approval required for credit customers"
        )

    # Deduct reserved stock (convert reserved to sold)
    stock_collection = Database.get_collection("stock_units")
    reserved_units = order.get("reserved_stock", [])

    for reserved in reserved_units:
        # Decrease both quantity and reserved_quantity
        stock_collection.update_one(
            {"_id": reserved["stock_unit_id"]},
            {
                "$inc": {
                    "quantity": -reserved["quantity"],
                    "reserved_quantity": -reserved["quantity"]
                },
                "$pull": {"reservations": {"order_id": order_id}}
            }
        )

        # Create stock movement record
        movement_doc = {
            "movement_id": str(uuid.uuid4()),
            "stock_unit_id": reserved["stock_unit_id"],
            "product_id": reserved["product_id"],
            "store_id": order.get("store_id"),
            "movement_type": "SALE_OUT",
            "quantity": -reserved["quantity"],
            "reference_type": "ORDER",
            "reference_id": order_id,
            "created_at": datetime.now(),
            "created_by": current_user.get("user_id")
        }
        Database.get_collection("stock_movements").insert_one(movement_doc)

    # Update order status
    success = orders_repo.update_status(
        order_id,
        "DELIVERED",
        by_user=current_user.get("user_id")
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update order status")

    return {
        "order_id": order_id,
        "order_number": order.get("order_number"),
        "status": "DELIVERED",
        "delivered_at": datetime.now().isoformat(),
        "items_delivered": len(reserved_units),
        "message": "Order delivered successfully"
    }


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: str,
    reason: str = Query(..., min_length=10),
    current_user: dict = Depends(get_current_user)
):
    """
    Cancel order
    Releases reserved stock and processes refunds if applicable
    """
    orders_repo, _, _, _ = get_repositories()

    # Get order
    order = orders_repo.find_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Verify order can be cancelled
    if order.get("status") == "DELIVERED":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel delivered order. Use returns process instead."
        )

    if order.get("status") == "CANCELLED":
        raise HTTPException(status_code=400, detail="Order already cancelled")

    # Check authorization - only STORE_MANAGER+ can cancel confirmed orders
    if order.get("status") in ["CONFIRMED", "PROCESSING", "READY"]:
        user_roles = current_user.get("roles", [])
        allowed_roles = ["SUPERADMIN", "ADMIN", "AREA_MANAGER", "STORE_MANAGER"]
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=403,
                detail="Only Store Manager or above can cancel confirmed orders"
            )

    # Release reserved stock
    stock_collection = Database.get_collection("stock_units")
    reserved_units = order.get("reserved_stock", [])

    for reserved in reserved_units:
        stock_collection.update_one(
            {"_id": reserved["stock_unit_id"]},
            {
                "$inc": {"reserved_quantity": -reserved["quantity"]},
                "$pull": {"reservations": {"order_id": order_id}}
            }
        )

    # Cancel workshop jobs
    workshop_collection = Database.get_collection("workshop_jobs")
    workshop_jobs = order.get("workshop_jobs", [])

    for job_id in workshop_jobs:
        workshop_collection.update_one(
            {"job_id": job_id},
            {
                "$set": {
                    "status": "CANCELLED",
                    "cancelled_at": datetime.now(),
                    "cancelled_by": current_user.get("user_id"),
                    "cancellation_reason": reason
                }
            }
        )

    # Handle refund if payment was made
    amount_paid = order.get("amount_paid", 0)
    refund_status = "NO_REFUND_NEEDED"

    if amount_paid > 0:
        # Create refund record
        refund_status = "REFUND_PENDING"
        # In a real system, integrate with payment gateway for refund processing

    # Update order
    update_data = {
        "status": "CANCELLED",
        "cancelled_at": datetime.now(),
        "cancelled_by": current_user.get("user_id"),
        "cancellation_reason": reason,
        "refund_status": refund_status,
        "refund_amount": amount_paid,
        "updated_at": datetime.now()
    }

    orders_repo.update(order_id, update_data)

    return {
        "order_id": order_id,
        "order_number": order.get("order_number"),
        "status": "CANCELLED",
        "stock_released": len(reserved_units),
        "workshop_jobs_cancelled": len(workshop_jobs),
        "refund_status": refund_status,
        "refund_amount": amount_paid,
        "message": "Order cancelled successfully"
    }


@router.get("/{order_id}/invoice")
async def get_invoice(
    order_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get/generate invoice for order
    """
    return {"invoice_number": "BV/INV/2024/0001", "order_id": order_id}


@router.get("/pending/delivery")
async def get_pending_deliveries(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get orders pending delivery (READY status)
    """
    orders_repo, _, _, _ = get_repositories()

    if not store_id:
        store_id = current_user.get("active_store_id")

    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    orders = orders_repo.find_ready_for_delivery(store_id)

    return {
        "orders": orders,
        "total": len(orders),
        "store_id": store_id
    }


@router.get("/unpaid/list")
async def get_unpaid_orders(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get unpaid/partially paid orders
    """
    orders_repo, _, _, _ = get_repositories()

    if not store_id:
        store_id = current_user.get("active_store_id")

    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    orders = orders_repo.find_unpaid(store_id)

    # Calculate totals
    total_outstanding = sum(order.get("balance_due", 0) for order in orders)

    return {
        "orders": orders,
        "total": len(orders),
        "total_outstanding": total_outstanding,
        "store_id": store_id
    }


@router.get("/overdue/list")
async def get_overdue_orders(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get overdue orders (past expected delivery)
    """
    orders_repo, _, _, _ = get_repositories()

    if not store_id:
        store_id = current_user.get("active_store_id")

    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    orders = orders_repo.find_overdue(store_id)

    return {
        "orders": orders,
        "total": len(orders),
        "store_id": store_id
    }
