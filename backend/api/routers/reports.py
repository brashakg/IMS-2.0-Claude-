"""
IMS 2.0 - Reports Router
"""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import date, datetime, timezone, timedelta
from .auth import get_current_user
from database.connection import get_db

router = APIRouter()


@router.get("/dashboard-stats")
async def dashboard_stats(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get dashboard statistics"""
    db = get_db()
    
    active_store = store_id or current_user.get("active_store_id")
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = today.replace(day=1)
    
    # Default stats
    stats = {
        "today_sales": 0,
        "today_orders": 0,
        "pending_jobs": 0,
        "low_stock_items": 0,
        "month_sales": 0,
        "month_target": 500000,  # Default target
        "pending_deliveries": 0,
        "urgent_jobs": 0,
    }
    
    if db.is_connected:
        # Build query filter
        store_filter = {"store_id": active_store} if active_store and active_store != "*" else {}
        
        # Today's orders and sales
        today_orders = list(db.orders.find({
            **store_filter,
            "created_at": {"$gte": today},
            "order_status": {"$ne": "CANCELLED"}
        }))
        stats["today_orders"] = len(today_orders)
        stats["today_sales"] = sum(o.get("grand_total", 0) for o in today_orders)
        
        # Month sales
        month_orders = list(db.orders.find({
            **store_filter,
            "created_at": {"$gte": month_start},
            "order_status": {"$ne": "CANCELLED"}
        }))
        stats["month_sales"] = sum(o.get("grand_total", 0) for o in month_orders)
        
        # Pending jobs
        if db.get_collection("workshop_jobs") is not None:
            stats["pending_jobs"] = db.get_collection("workshop_jobs").count_documents({
                **store_filter,
                "status": {"$in": ["PENDING", "IN_PROGRESS"]}
            })
            stats["urgent_jobs"] = db.get_collection("workshop_jobs").count_documents({
                **store_filter,
                "status": {"$in": ["PENDING", "IN_PROGRESS"]},
                "priority": "URGENT"
            })
        
        # Low stock items
        if db.stock_units is not None:
            stats["low_stock_items"] = db.stock_units.count_documents({
                **store_filter,
                "$expr": {"$lte": ["$quantity", "$reorder_level"]}
            })
        
        # Pending deliveries
        if db.orders is not None:
            stats["pending_deliveries"] = db.orders.count_documents({
                **store_filter,
                "order_status": "READY"
            })
    
    return stats


@router.get("/sales/summary")
async def sales_summary(
    store_id: Optional[str] = Query(None),
    from_date: date = Query(...),
    to_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return {"summary": {}}

@router.get("/sales/daily")
async def daily_sales(
    store_id: Optional[str] = Query(None),
    days: int = Query(30),
    current_user: dict = Depends(get_current_user)
):
    return {"data": []}

@router.get("/sales/by-salesperson")
async def sales_by_salesperson(
    store_id: Optional[str] = Query(None),
    from_date: date = Query(...),
    to_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return {"data": []}

@router.get("/sales/by-category")
async def sales_by_category(
    store_id: Optional[str] = Query(None),
    from_date: date = Query(...),
    to_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return {"data": []}

@router.get("/inventory/summary")
async def inventory_summary(store_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    return {"summary": {}}

@router.get("/inventory/valuation")
async def inventory_valuation(store_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    return {"valuation": {}}

@router.get("/clinical/eye-tests")
async def eye_test_report(
    store_id: Optional[str] = Query(None),
    from_date: date = Query(...),
    to_date: date = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return {"data": []}

@router.get("/hr/attendance")
async def attendance_report(
    store_id: Optional[str] = Query(None),
    year: int = Query(...),
    month: int = Query(...),
    current_user: dict = Depends(get_current_user)
):
    return {"data": []}

@router.get("/finance/outstanding")
async def outstanding_report(store_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    return {"data": []}

@router.get("/finance/gst")
async def gst_report(from_date: date = Query(...), to_date: date = Query(...), current_user: dict = Depends(get_current_user)):
    return {"data": []}

@router.get("/tasks/summary")
async def task_summary(store_id: Optional[str] = Query(None), current_user: dict = Depends(get_current_user)):
    return {"summary": {}}
