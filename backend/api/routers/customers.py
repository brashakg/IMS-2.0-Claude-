"""
IMS 2.0 - Customers Router
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime, timezone
import uuid
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


# ============================================================================
# SCHEMAS
# ============================================================================

class PatientCreate(BaseModel):
    name: str
    mobile: Optional[str] = None
    dob: Optional[date] = None
    anniversary: Optional[date] = None
    gender: Optional[str] = None
    relation: Optional[str] = None  # Self, Spouse, Child, Parent, etc.

class CustomerCreate(BaseModel):
    customer_type: str = "B2C"  # B2C, B2B
    name: str = Field(..., min_length=2)
    mobile: str = Field(..., min_length=10, max_length=10)
    email: Optional[str] = None
    gstin: Optional[str] = None
    billing_address: Optional[dict] = None
    patients: List[PatientCreate] = []

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    gstin: Optional[str] = None
    billing_address: Optional[dict] = None
    customer_type: Optional[str] = None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/")
async def list_customers(
    search: Optional[str] = Query(None),
    customer_type: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List customers with filters"""
    db = get_db()
    
    if not db.is_connected:
        return {"customers": [], "total": 0}
    
    query = {}
    if customer_type:
        query["customer_type"] = customer_type
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"mobile": {"$regex": search}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    
    customers_cursor = db.customers.find(query).skip(skip).limit(limit)
    total = db.customers.count_documents(query)
    
    customers = []
    for cust in customers_cursor:
        customers.append({
            "customer_id": cust.get("customer_id"),
            "customer_type": cust.get("customer_type", "B2C"),
            "name": cust.get("name"),
            "mobile": cust.get("mobile"),
            "email": cust.get("email"),
            "gstin": cust.get("gstin"),
            "loyalty_points": cust.get("loyalty_points", 0),
            "store_credit": cust.get("store_credit", 0),
            "total_orders": cust.get("total_orders", 0),
            "total_spent": cust.get("total_spent", 0),
            "created_at": cust.get("created_at"),
        })
    
    return {"customers": customers, "total": total}


@router.post("/", status_code=201)
async def create_customer(
    customer: CustomerCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new customer"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    # Check if customer exists with same mobile
    existing = db.customers.find_one({"mobile": customer.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Customer with this mobile already exists")
    
    customer_id = f"cust-{uuid.uuid4().hex[:8]}"
    
    # Process patients
    patients = []
    for idx, patient in enumerate(customer.patients):
        patients.append({
            "patient_id": f"pat-{uuid.uuid4().hex[:8]}",
            "name": patient.name,
            "mobile": patient.mobile or customer.mobile,
            "dob": patient.dob.isoformat() if patient.dob else None,
            "anniversary": patient.anniversary.isoformat() if patient.anniversary else None,
            "gender": patient.gender,
            "relation": patient.relation or ("Self" if idx == 0 else "Family"),
        })
    
    # If no patients provided, create one with customer as self
    if not patients:
        patients.append({
            "patient_id": f"pat-{uuid.uuid4().hex[:8]}",
            "name": customer.name,
            "mobile": customer.mobile,
            "relation": "Self",
        })
    
    customer_doc = {
        "customer_id": customer_id,
        "customer_type": customer.customer_type,
        "name": customer.name,
        "mobile": customer.mobile,
        "email": customer.email,
        "gstin": customer.gstin,
        "billing_address": customer.billing_address,
        "patients": patients,
        "loyalty_points": 0,
        "store_credit": 0,
        "total_orders": 0,
        "total_spent": 0,
        "created_at": datetime.now(timezone.utc),
        "created_by": current_user.get("user_id"),
    }
    
    db.customers.insert_one(customer_doc)
    
    return {
        "customer_id": customer_id, 
        "name": customer.name,
        "message": "Customer created successfully"
    }


@router.get("/search")
async def search_customers(
    q: str = Query(..., min_length=2), 
    current_user: dict = Depends(get_current_user)
):
    """Search customers by name, mobile, or email"""
    db = get_db()
    
    if not db.is_connected:
        return {"customers": []}
    
    query = {
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"mobile": {"$regex": q}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    }
    
    customers_cursor = db.customers.find(query).limit(20)
    
    customers = []
    for cust in customers_cursor:
        customers.append({
            "customer_id": cust.get("customer_id"),
            "name": cust.get("name"),
            "mobile": cust.get("mobile"),
            "email": cust.get("email"),
            "customer_type": cust.get("customer_type", "B2C"),
            "patients": cust.get("patients", []),
        })
    
    return {"customers": customers}


@router.get("/mobile/{mobile}")
async def get_customer_by_mobile(
    mobile: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get customer by mobile number"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    customer = db.customers.find_one({"mobile": mobile})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {
        "customer_id": customer.get("customer_id"),
        "customer_type": customer.get("customer_type", "B2C"),
        "name": customer.get("name"),
        "mobile": customer.get("mobile"),
        "email": customer.get("email"),
        "gstin": customer.get("gstin"),
        "billing_address": customer.get("billing_address"),
        "patients": customer.get("patients", []),
        "loyalty_points": customer.get("loyalty_points", 0),
        "store_credit": customer.get("store_credit", 0),
        "total_orders": customer.get("total_orders", 0),
        "total_spent": customer.get("total_spent", 0),
    }


@router.get("/{customer_id}")
async def get_customer(
    customer_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get customer by ID"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    customer = db.customers.find_one({"customer_id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {
        "customer_id": customer.get("customer_id"),
        "customer_type": customer.get("customer_type", "B2C"),
        "name": customer.get("name"),
        "mobile": customer.get("mobile"),
        "email": customer.get("email"),
        "gstin": customer.get("gstin"),
        "billing_address": customer.get("billing_address"),
        "patients": customer.get("patients", []),
        "loyalty_points": customer.get("loyalty_points", 0),
        "store_credit": customer.get("store_credit", 0),
        "total_orders": customer.get("total_orders", 0),
        "total_spent": customer.get("total_spent", 0),
        "created_at": customer.get("created_at"),
    }


@router.put("/{customer_id}")
async def update_customer(
    customer_id: str, 
    customer: CustomerUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update customer details"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.customers.find_one({"customer_id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = {k: v for k, v in customer.model_dump(exclude_unset=True).items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data["updated_by"] = current_user.get("user_id")
    
    db.customers.update_one({"customer_id": customer_id}, {"$set": update_data})
    
    return {"message": "Customer updated"}


@router.post("/{customer_id}/patients")
async def add_patient(
    customer_id: str, 
    patient: PatientCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Add a patient to customer"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    existing = db.customers.find_one({"customer_id": customer_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    patient_id = f"pat-{uuid.uuid4().hex[:8]}"
    
    patient_doc = {
        "patient_id": patient_id,
        "name": patient.name,
        "mobile": patient.mobile or existing.get("mobile"),
        "dob": patient.dob.isoformat() if patient.dob else None,
        "anniversary": patient.anniversary.isoformat() if patient.anniversary else None,
        "gender": patient.gender,
        "relation": patient.relation,
    }
    
    db.customers.update_one(
        {"customer_id": customer_id},
        {"$push": {"patients": patient_doc}}
    )
    
    return {"patient_id": patient_id, "message": "Patient added"}


@router.get("/{customer_id}/orders")
async def get_customer_orders(
    customer_id: str, 
    current_user: dict = Depends(get_current_user)
):
    """Get all orders for a customer"""
    db = get_db()
    
    if not db.is_connected:
        return {"orders": []}
    
    orders_cursor = db.orders.find({"customer_id": customer_id}).sort("created_at", -1).limit(50)
    
    orders = []
    for order in orders_cursor:
        orders.append({
            "order_id": order.get("order_id"),
            "order_number": order.get("order_number"),
            "grand_total": order.get("grand_total"),
            "order_status": order.get("order_status"),
            "payment_status": order.get("payment_status"),
            "created_at": order.get("created_at"),
        })
    
    return {"orders": orders}


@router.get("/{customer_id}/prescriptions")
async def get_customer_prescriptions(
    customer_id: str, 
    patient_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get prescriptions for customer/patient"""
    db = get_db()
    
    if not db.is_connected:
        return {"prescriptions": []}
    
    query = {"customer_id": customer_id}
    if patient_id:
        query["patient_id"] = patient_id
    
    prescriptions_cursor = db.prescriptions.find(query).sort("created_at", -1).limit(50)
    
    prescriptions = []
    for rx in prescriptions_cursor:
        prescriptions.append({
            "prescription_id": rx.get("prescription_id"),
            "patient_id": rx.get("patient_id"),
            "patient_name": rx.get("patient_name"),
            "prescription_date": rx.get("prescription_date"),
            "right_eye": rx.get("right_eye"),
            "left_eye": rx.get("left_eye"),
            "optometrist": rx.get("optometrist"),
            "created_at": rx.get("created_at"),
        })
    
    return {"prescriptions": prescriptions}


@router.post("/{customer_id}/loyalty/add")
async def add_loyalty_points(
    customer_id: str, 
    points: int = Query(..., ge=1), 
    current_user: dict = Depends(get_current_user)
):
    """Add loyalty points to customer"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.customers.update_one(
        {"customer_id": customer_id},
        {"$inc": {"loyalty_points": points}}
    )
    
    return {"message": f"Added {points} loyalty points"}


@router.post("/{customer_id}/store-credit/add")
async def add_store_credit(
    customer_id: str, 
    amount: float = Query(..., gt=0), 
    current_user: dict = Depends(get_current_user)
):
    """Add store credit to customer"""
    db = get_db()
    
    if not db.is_connected:
        raise HTTPException(status_code=503, detail="Database not available")
    
    db.customers.update_one(
        {"customer_id": customer_id},
        {"$inc": {"store_credit": amount}}
    )
    
    return {"message": f"Added ₹{amount} store credit"}
