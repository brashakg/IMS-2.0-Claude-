"""
IMS 2.0 - Payments Router
==========================
Razorpay payment gateway endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Header
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
import uuid
import json
import os

from .auth import get_current_user
from ..database import Database
from database.repositories.payment_repository import PaymentRepository
from database.repositories.order_repository import OrderRepository
from core.payment_gateway_engine import PaymentGatewayEngine

router = APIRouter()

# Initialize repositories and engine
payment_repo = None
order_repo = None
payment_engine = None


def get_repositories():
    """Initialize repositories with database connection"""
    global payment_repo, order_repo, payment_engine
    if payment_repo is None:
        payment_repo = PaymentRepository(Database.get_collection("payments"))
        order_repo = OrderRepository(Database.get_collection("orders"))

        # Initialize payment engine with environment variables
        # In production, use actual keys from environment
        key_id = os.getenv("RAZORPAY_KEY_ID", "rzp_test_xxxxx")
        key_secret = os.getenv("RAZORPAY_KEY_SECRET", "test_secret_key")
        webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET", "webhook_secret")

        payment_engine = PaymentGatewayEngine(key_id, key_secret, webhook_secret)

    return payment_repo, order_repo, payment_engine


# ============================================================================
# SCHEMAS
# ============================================================================

class CreatePaymentOrderRequest(BaseModel):
    order_id: str
    amount: float = Field(..., gt=0)
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_contact: Optional[str] = None
    notes: Optional[Dict] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str


class RefundRequest(BaseModel):
    payment_id: str  # Internal payment ID
    amount: Optional[float] = None  # None for full refund
    reason: str


class PaymentStatusResponse(BaseModel):
    payment_id: str
    status: str
    amount: float
    razorpay_payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    created_at: datetime
    captured_at: Optional[datetime] = None


# ============================================================================
# PAYMENT ENDPOINTS
# ============================================================================

@router.post("/razorpay/create-order", status_code=201)
async def create_payment_order(
    request: CreatePaymentOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create Razorpay order for payment

    This endpoint is called when customer clicks "Pay Now" on POS
    It creates both Razorpay order and internal payment record

    Returns Razorpay order details needed for frontend checkout
    """
    payments_repo, orders_repo, engine = get_repositories()

    user_id = current_user.get("user_id")
    store_id = current_user.get("active_store_id")

    # Validate order exists
    order = orders_repo.find_by_id(request.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Check if order belongs to user's store
    if order.get("store_id") != store_id:
        raise HTTPException(status_code=403, detail="Access denied to this order")

    # Check if order is already paid
    if order.get("payment_status") == "PAID":
        raise HTTPException(status_code=400, detail="Order already paid")

    # Validate amount matches order total
    if abs(request.amount - order.get("grand_total", 0)) > 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (₹{request.amount}) doesn't match order total (₹{order.get('grand_total')})"
        )

    # Create Razorpay order
    success, razorpay_order, error = engine.create_order(
        amount=request.amount,
        receipt=order.get("order_number"),
        notes=request.notes or {
            "order_id": request.order_id,
            "order_number": order.get("order_number"),
            "store_id": store_id
        }
    )

    if not success:
        raise HTTPException(status_code=500, detail=error)

    # Create internal payment record
    payment_doc = {
        "payment_id": str(uuid.uuid4()),
        "payment_number": f"PAY-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "order_id": request.order_id,
        "store_id": store_id,
        "razorpay_order_id": razorpay_order["id"],
        "amount": request.amount,
        "currency": "INR",
        "status": "PENDING",
        "payment_method": None,  # Will be updated after payment
        "transaction_id": None,  # Razorpay payment_id (after payment)
        "customer_name": request.customer_name,
        "customer_email": request.customer_email,
        "customer_contact": request.customer_contact,
        "notes": request.notes,
        "razorpay_response": razorpay_order,
        "created_by": user_id,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    created_payment = payments_repo.create(payment_doc)

    if not created_payment:
        raise HTTPException(status_code=500, detail="Failed to create payment record")

    # Generate checkout options for frontend
    checkout_options = engine.generate_checkout_options(
        razorpay_order_id=razorpay_order["id"],
        amount=request.amount,
        customer_name=request.customer_name,
        customer_email=request.customer_email,
        customer_contact=request.customer_contact,
        description=f"Order {order.get('order_number')}"
    )

    return {
        "payment_id": payment_doc["payment_id"],
        "razorpay_order_id": razorpay_order["id"],
        "amount": request.amount,
        "currency": "INR",
        "checkout_options": checkout_options,
        "message": "Payment order created successfully"
    }


@router.post("/razorpay/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify Razorpay payment signature

    This endpoint is called after payment completion on frontend
    It verifies the payment is authentic and updates order status

    CRITICAL: Signature verification prevents payment fraud
    """
    payments_repo, orders_repo, engine = get_repositories()

    # Find payment record
    payment = payments_repo.find_by_razorpay_order(request.razorpay_order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    # Verify order belongs to user's store
    user_store = current_user.get("active_store_id")
    if payment.get("store_id") != user_store:
        raise HTTPException(status_code=403, detail="Access denied to this payment")

    # Verify signature
    is_valid, error = engine.verify_payment_signature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature
    )

    if not is_valid:
        # Update payment status to FAILED
        payments_repo.update_status(
            payment["payment_id"],
            "FAILED",
            {"error": error, "signature_invalid": True}
        )
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {error}")

    # Fetch payment details from Razorpay
    success, payment_details, error = engine.fetch_payment(request.razorpay_payment_id)

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payment details: {error}")

    # Update payment record
    update_data = {
        "transaction_id": request.razorpay_payment_id,
        "status": "CAPTURED",
        "payment_method": payment_details.get("method", "unknown"),
        "razorpay_payment_response": payment_details,
        "captured_at": datetime.now(),
        "updated_at": datetime.now()
    }

    success = payments_repo.update(payment["payment_id"], update_data)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to update payment record")

    # Update order payment status
    order = orders_repo.find_by_id(request.order_id)
    if order:
        # Add payment to order
        payment_entry = {
            "payment_id": payment["payment_id"],
            "payment_number": payment["payment_number"],
            "razorpay_payment_id": request.razorpay_payment_id,
            "amount": payment["amount"],
            "method": "RAZORPAY_" + payment_details.get("method", "ONLINE").upper(),
            "status": "CAPTURED",
            "captured_at": datetime.now()
        }

        orders_repo.add_payment(request.order_id, payment_entry)

    return {
        "payment_id": payment["payment_id"],
        "razorpay_payment_id": request.razorpay_payment_id,
        "status": "CAPTURED",
        "amount": payment["amount"],
        "method": payment_details.get("method"),
        "message": "Payment verified and captured successfully"
    }


@router.get("/status/{payment_id}")
async def get_payment_status(
    payment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get payment status by internal payment ID"""
    payments_repo, _, _ = get_repositories()

    payment = payments_repo.find_by_id(payment_id)

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Check if user has access to this payment's store
    user_store = current_user.get("active_store_id")
    if payment.get("store_id") != user_store:
        raise HTTPException(status_code=403, detail="Access denied to this payment")

    return {
        "payment_id": payment["payment_id"],
        "payment_number": payment["payment_number"],
        "order_id": payment["order_id"],
        "razorpay_order_id": payment.get("razorpay_order_id"),
        "razorpay_payment_id": payment.get("transaction_id"),
        "amount": payment["amount"],
        "currency": payment["currency"],
        "status": payment["status"],
        "payment_method": payment.get("payment_method"),
        "created_at": payment["created_at"],
        "captured_at": payment.get("captured_at"),
        "refund_id": payment.get("refund_id"),
        "refund_amount": payment.get("refund_amount")
    }


# ============================================================================
# REFUND ENDPOINTS
# ============================================================================

@router.post("/razorpay/refund")
async def process_refund(
    request: RefundRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Process refund for a payment

    Can be full or partial refund
    Requires STORE_MANAGER or higher role
    """
    user_roles = current_user.get("roles", [])

    # Only STORE_MANAGER and above can process refunds
    if not any(role in ["SUPERADMIN", "ADMIN", "AREA_MANAGER", "STORE_MANAGER", "ACCOUNTANT"] for role in user_roles):
        raise HTTPException(
            status_code=403,
            detail="Only STORE_MANAGER or higher can process refunds"
        )

    payments_repo, orders_repo, engine = get_repositories()

    # Find payment
    payment = payments_repo.find_by_id(request.payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Check if user has access to this payment's store
    user_store = current_user.get("active_store_id")
    if payment.get("store_id") != user_store:
        raise HTTPException(status_code=403, detail="Access denied to this payment")

    # Check if payment is captured
    if payment.get("status") != "CAPTURED":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot refund payment with status: {payment.get('status')}"
        )

    # Check if already refunded
    if payment.get("status") == "REFUNDED":
        raise HTTPException(status_code=400, detail="Payment already refunded")

    # Validate refund amount
    refund_amount = request.amount or payment["amount"]
    if refund_amount > payment["amount"]:
        raise HTTPException(
            status_code=400,
            detail=f"Refund amount (₹{refund_amount}) exceeds payment amount (₹{payment['amount']})"
        )

    # Create refund on Razorpay
    razorpay_payment_id = payment.get("transaction_id")
    if not razorpay_payment_id:
        raise HTTPException(status_code=400, detail="Razorpay payment ID not found")

    success, refund_data, error = engine.create_refund(
        payment_id=razorpay_payment_id,
        amount=refund_amount,
        notes={"reason": request.reason, "requested_by": current_user.get("user_id")}
    )

    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to create refund: {error}")

    # Update payment record
    payments_repo.record_refund(
        payment_id=request.payment_id,
        refund_id=refund_data["id"],
        refund_amount=refund_amount,
        reason=request.reason
    )

    return {
        "payment_id": request.payment_id,
        "refund_id": refund_data["id"],
        "refund_amount": refund_amount,
        "status": refund_data["status"],
        "message": "Refund processed successfully"
    }


# ============================================================================
# WEBHOOK ENDPOINTS
# ============================================================================

@router.post("/razorpay/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None)
):
    """
    Handle Razorpay webhooks

    Razorpay sends webhooks for payment events:
    - payment.captured
    - payment.failed
    - refund.created
    - refund.processed
    - etc.

    CRITICAL: Must verify webhook signature for security
    """
    payments_repo, _, engine = get_repositories()

    # Get raw body
    body = await request.body()
    payload = body.decode()

    # Verify webhook signature
    if x_razorpay_signature:
        is_valid, error = engine.verify_webhook_signature(payload, x_razorpay_signature)
        if not is_valid:
            raise HTTPException(status_code=401, detail=f"Invalid webhook signature: {error}")

    # Parse webhook data
    try:
        webhook_data = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = webhook_data.get("event")
    payload_data = webhook_data.get("payload", {})
    payment_entity = payload_data.get("payment", {}).get("entity", {})

    # Find payment by Razorpay payment ID
    razorpay_payment_id = payment_entity.get("id")
    if not razorpay_payment_id:
        return {"status": "ignored", "reason": "No payment ID in webhook"}

    # Try to find payment record
    payment = payments_repo.find_by_transaction_id(razorpay_payment_id)

    # Handle different events
    if event == "payment.captured":
        if payment:
            payments_repo.update_status(
                payment["payment_id"],
                "CAPTURED",
                {"webhook_data": webhook_data}
            )
        return {"status": "processed", "event": event}

    elif event == "payment.failed":
        if payment:
            payments_repo.update_status(
                payment["payment_id"],
                "FAILED",
                {"webhook_data": webhook_data, "error": payment_entity.get("error_description")}
            )
        return {"status": "processed", "event": event}

    elif event == "refund.created" or event == "refund.processed":
        # Handle refund webhooks
        refund_entity = payload_data.get("refund", {}).get("entity", {})
        if payment:
            payments_repo.record_callback(
                payment["payment_id"],
                {"event": event, "refund_data": refund_entity}
            )
        return {"status": "processed", "event": event}

    # Unknown event
    return {"status": "ignored", "event": event}


# ============================================================================
# ANALYTICS ENDPOINTS
# ============================================================================

@router.get("/analytics/summary")
async def get_payment_analytics(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get payment analytics summary"""
    payments_repo, _, _ = get_repositories()

    user_store = current_user.get("active_store_id")

    # Parse dates
    from_datetime = datetime.fromisoformat(from_date) if from_date else datetime.now().replace(day=1, hour=0, minute=0, second=0)
    to_datetime = datetime.fromisoformat(to_date) if to_date else datetime.now()

    # Get summary
    summary = payments_repo.get_payment_summary(user_store, from_datetime, to_datetime)

    # Get payment method distribution
    methods = payments_repo.get_payment_method_distribution(user_store, from_datetime, to_datetime)

    # Get failure rate
    failure_stats = payments_repo.get_failure_rate(user_store, from_datetime)

    return {
        "store_id": user_store,
        "period": {
            "from": from_datetime.isoformat(),
            "to": to_datetime.isoformat()
        },
        "summary": summary,
        "payment_methods": methods,
        "failure_stats": failure_stats
    }
