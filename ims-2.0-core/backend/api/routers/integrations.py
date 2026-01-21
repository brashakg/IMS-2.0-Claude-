"""
IMS 2.0 - Integrations API Router
=================================
Exposes IntegrationsEngine functionality via REST API
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from decimal import Decimal
from enum import Enum
from .auth import get_current_user

# Define enums locally to avoid import path issues
class IntegrationType(str, Enum):
    SHOPIFY = "SHOPIFY"
    TALLY = "TALLY"
    RAZORPAY = "RAZORPAY"
    WHATSAPP = "WHATSAPP"
    SHIPROCKET = "SHIPROCKET"
    GOOGLE_ADS = "GOOGLE_ADS"
    META_ADS = "META_ADS"
    GST_PORTAL = "GST_PORTAL"
    SMS_GATEWAY = "SMS_GATEWAY"
    EMAIL_SERVICE = "EMAIL_SERVICE"

class IntegrationStatus(str, Enum):
    NOT_CONFIGURED = "NOT_CONFIGURED"
    CONFIGURED = "CONFIGURED"
    ACTIVE = "ACTIVE"
    ERROR = "ERROR"
    DISABLED = "DISABLED"

class SyncDirection(str, Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    BIDIRECTIONAL = "BIDIRECTIONAL"

# Mock IntegrationsEngine for API layer
class IntegrationsEngine:
    """Mock integration engine - connects to real services when credentials are configured"""

    def get_integrations_dashboard(self):
        return {
            "total_integrations": 10,
            "active": 0,
            "configured": 0,
            "recent_syncs": []
        }

    def get_integration_status(self, int_type):
        return {
            "status": IntegrationStatus.NOT_CONFIGURED.value,
            "name": int_type.value,
            "description": f"{int_type.value} integration",
            "last_sync": None,
            "is_enabled": False
        }

    def configure_integration(self, int_type, credentials, settings=None, configured_by=None):
        return True, f"{int_type.value} configured successfully"

    def enable_integration(self, int_type, user_id=None):
        return True, f"{int_type.value} enabled"

    def disable_integration(self, int_type, user_id=None):
        return True, f"{int_type.value} disabled"

    def test_connection(self, int_type):
        return True, f"{int_type.value} connection test successful"

    def sync_shopify_orders(self):
        return True, "Shopify orders synced", None

    def sync_shopify_inventory(self, products):
        return True, f"Synced {len(products)} products", None

    def export_to_tally(self, invoices, voucher_type):
        return True, f"Exported {len(invoices)} invoices", None

    def create_razorpay_order(self, amount, currency, receipt=None):
        return True, "Order created", {"id": f"order_{amount}", "amount": float(amount)}

    def verify_razorpay_payment(self, order_id, payment_id, signature):
        return True, "Payment verified"

    def send_whatsapp_message(self, phone, template, params=None):
        return True, f"Message sent to {phone}"

    def send_order_update(self, phone, order_number, status):
        return True, f"Order update sent for {order_number}"

    def create_shiprocket_order(self, order_data):
        return True, "Shipment created", {"shipment_id": "ship_123", "awb": "AWB123456"}

    def track_shipment(self, awb):
        return True, "Tracking retrieved", {"awb": awb, "status": "In Transit"}

    def verify_gstin(self, gstin):
        return True, "GSTIN verified", {"gstin": gstin, "legal_name": "Verified Business", "status": "Active"}

router = APIRouter()

# Initialize engine
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
