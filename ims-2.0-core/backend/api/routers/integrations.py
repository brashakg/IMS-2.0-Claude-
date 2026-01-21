"""
IMS 2.0 - Integrations API Router
=================================
Exposes IntegrationsEngine functionality via REST API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from .auth import get_current_user
from ...core.integrations_engine import (
    IntegrationsEngine,
    IntegrationType,
    IntegrationStatus,
    SyncDirection
)

router = APIRouter()

# Initialize engine (would be injected via DI in production)
integrations_engine = IntegrationsEngine()


# ============================================================================
# Request/Response Models
# ============================================================================

class ConfigureIntegrationRequest(BaseModel):
    credentials: Dict[str, str]
    settings: Optional[Dict[str, Any]] = None

class IntegrationToggleRequest(BaseModel):
    enabled: bool

class ShopifyInventorySyncRequest(BaseModel):
    products: List[Dict[str, Any]]

class TallyExportRequest(BaseModel):
    invoices: List[Dict[str, Any]]
    voucher_type: str = "Sales"

class RazorpayOrderRequest(BaseModel):
    amount: float
    currency: str = "INR"
    receipt: Optional[str] = None

class RazorpayVerifyRequest(BaseModel):
    order_id: str
    payment_id: str
    signature: str

class WhatsAppMessageRequest(BaseModel):
    phone: str
    template: str
    params: Optional[Dict[str, str]] = None

class WhatsAppOrderUpdateRequest(BaseModel):
    phone: str
    order_number: str
    status: str

class ShiprocketOrderRequest(BaseModel):
    order_data: Dict[str, Any]

class GSTINVerifyRequest(BaseModel):
    gstin: str


# ============================================================================
# Dashboard & Status Endpoints
# ============================================================================

@router.get("/dashboard")
async def get_integrations_dashboard(current_user: dict = Depends(get_current_user)):
    """Get integrations overview dashboard"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    return integrations_engine.get_integrations_dashboard()


@router.get("/")
async def list_all_integrations(current_user: dict = Depends(get_current_user)):
    """List all available integrations with their status"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    integrations = []
    for int_type in IntegrationType:
        status = integrations_engine.get_integration_status(int_type)
        integrations.append({
            "type": int_type.value,
            **status
        })

    return {"integrations": integrations}


@router.get("/{integration_type}")
async def get_integration_status(
    integration_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed status of a specific integration"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        int_type = IntegrationType(integration_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown integration type: {integration_type}")

    return integrations_engine.get_integration_status(int_type)


# ============================================================================
# Configuration Endpoints
# ============================================================================

@router.post("/{integration_type}/configure")
async def configure_integration(
    integration_type: str,
    request: ConfigureIntegrationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Configure integration credentials"""
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Superadmin access required")

    try:
        int_type = IntegrationType(integration_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown integration type: {integration_type}")

    success, message = integrations_engine.configure_integration(
        int_type,
        request.credentials,
        request.settings,
        configured_by=current_user.get("user_id")
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


@router.post("/{integration_type}/toggle")
async def toggle_integration(
    integration_type: str,
    request: IntegrationToggleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Enable or disable an integration"""
    if current_user.get("role") != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Superadmin access required")

    try:
        int_type = IntegrationType(integration_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown integration type: {integration_type}")

    user_id = current_user.get("user_id")

    if request.enabled:
        success, message = integrations_engine.enable_integration(int_type, user_id)
    else:
        success, message = integrations_engine.disable_integration(int_type, user_id)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


@router.post("/{integration_type}/test")
async def test_integration_connection(
    integration_type: str,
    current_user: dict = Depends(get_current_user)
):
    """Test integration connection"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    try:
        int_type = IntegrationType(integration_type.upper())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Unknown integration type: {integration_type}")

    success, message = integrations_engine.test_connection(int_type)

    return {"success": success, "message": message}


# ============================================================================
# Shopify Endpoints
# ============================================================================

@router.post("/shopify/sync-orders")
async def sync_shopify_orders(current_user: dict = Depends(get_current_user)):
    """Import orders from Shopify"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    success, message, log = integrations_engine.sync_shopify_orders()

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "sync_log": {
            "id": log.id,
            "records_processed": log.records_processed,
            "records_success": log.records_success,
            "records_failed": log.records_failed,
            "status": log.status
        } if log else None
    }


@router.post("/shopify/sync-inventory")
async def sync_shopify_inventory(
    request: ShopifyInventorySyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """Export inventory to Shopify"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access required")

    success, message, log = integrations_engine.sync_shopify_inventory(request.products)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "sync_log": {
            "id": log.id,
            "records_processed": log.records_processed,
            "records_success": log.records_success,
            "status": log.status
        } if log else None
    }


# ============================================================================
# Tally Endpoints
# ============================================================================

@router.post("/tally/export")
async def export_to_tally(
    request: TallyExportRequest,
    current_user: dict = Depends(get_current_user)
):
    """Export invoices to Tally"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN", "ACCOUNTANT"]:
        raise HTTPException(status_code=403, detail="Accountant access required")

    success, message, log = integrations_engine.export_to_tally(
        request.invoices,
        request.voucher_type
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {
        "success": True,
        "message": message,
        "sync_log": {
            "id": log.id,
            "records_processed": log.records_processed,
            "status": log.status,
            "details": log.details
        } if log else None
    }


# ============================================================================
# Razorpay Endpoints
# ============================================================================

@router.post("/razorpay/create-order")
async def create_razorpay_order(
    request: RazorpayOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create Razorpay payment order"""
    success, message, order = integrations_engine.create_razorpay_order(
        Decimal(str(request.amount)),
        request.currency,
        request.receipt
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message, "order": order}


@router.post("/razorpay/verify-payment")
async def verify_razorpay_payment(
    request: RazorpayVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify Razorpay payment signature"""
    success, message = integrations_engine.verify_razorpay_payment(
        request.order_id,
        request.payment_id,
        request.signature
    )

    return {"success": success, "message": message}


# ============================================================================
# WhatsApp Endpoints
# ============================================================================

@router.post("/whatsapp/send-message")
async def send_whatsapp_message(
    request: WhatsAppMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send WhatsApp message using template"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Manager access required")

    success, message = integrations_engine.send_whatsapp_message(
        request.phone,
        request.template,
        request.params
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


@router.post("/whatsapp/order-update")
async def send_order_update(
    request: WhatsAppOrderUpdateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send order status update via WhatsApp"""
    success, message = integrations_engine.send_order_update(
        request.phone,
        request.order_number,
        request.status
    )

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message}


# ============================================================================
# Shiprocket Endpoints
# ============================================================================

@router.post("/shiprocket/create-order")
async def create_shiprocket_order(
    request: ShiprocketOrderRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create shipment in Shiprocket"""
    if current_user.get("role") not in ["SUPERADMIN", "ADMIN", "STORE_MANAGER"]:
        raise HTTPException(status_code=403, detail="Manager access required")

    success, message, shipment = integrations_engine.create_shiprocket_order(request.order_data)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message, "shipment": shipment}


@router.get("/shiprocket/track/{awb}")
async def track_shipment(
    awb: str,
    current_user: dict = Depends(get_current_user)
):
    """Track shipment status"""
    success, message, tracking = integrations_engine.track_shipment(awb)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message, "tracking": tracking}


# ============================================================================
# GST Portal Endpoints
# ============================================================================

@router.post("/gst/verify-gstin")
async def verify_gstin(
    request: GSTINVerifyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify GSTIN from GST Portal"""
    success, message, gst_data = integrations_engine.verify_gstin(request.gstin)

    if not success:
        raise HTTPException(status_code=400, detail=message)

    return {"success": True, "message": message, "data": gst_data}
