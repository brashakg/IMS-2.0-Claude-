"""
IMS 2.0 - Approvals Router
============================
Discount approval workflow endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal
from enum import Enum
import uuid

from .auth import get_current_user
from ..database import Database
from ...database.repositories.approval_repository import ApprovalRepository
from ...database.repositories.order_repository import OrderRepository
from ...database.repositories.user_repository import UserRepository
from ...database.repositories.task_repository import TaskRepository

router = APIRouter()

# Initialize repositories
approval_repo = None
order_repo = None
user_repo = None
task_repo = None


def get_repositories():
    """Initialize repositories with database connection"""
    global approval_repo, order_repo, user_repo, task_repo
    if approval_repo is None:
        approval_repo = ApprovalRepository(Database.get_collection("approvals"))
        order_repo = OrderRepository(Database.get_collection("orders"))
        user_repo = UserRepository(Database.get_collection("users"))
        task_repo = TaskRepository(Database.get_collection("tasks"))
    return approval_repo, order_repo, user_repo, task_repo


# ============================================================================
# ENUMS & SCHEMAS
# ============================================================================

class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class ApprovalPriority(str, Enum):
    P0 = "P0"  # Critical - 4 hour escalation
    P1 = "P1"  # High - 24 hour expiry
    P2 = "P2"  # Medium


class DiscountApprovalRequest(BaseModel):
    order_id: Optional[str] = None
    product_id: str
    product_name: str
    mrp: float = Field(..., gt=0)
    offer_price: float = Field(..., gt=0)
    requested_discount_percent: float = Field(..., ge=0, le=100)
    reason: str = Field(..., min_length=10)
    items: List[dict] = Field(default_factory=list)  # For bulk approval (all items in cart)


class ApprovalDecision(BaseModel):
    approved_discount_percent: Optional[float] = Field(None, ge=0, le=100)
    remarks: Optional[str] = None


class ApprovalRejection(BaseModel):
    rejection_reason: str = Field(..., min_length=10)


# ============================================================================
# ROLE HIERARCHY MAPPING
# ============================================================================

ROLE_HIERARCHY = {
    "SUPERADMIN": 1,
    "ADMIN": 2,
    "AREA_MANAGER": 3,
    "STORE_MANAGER": 4,
    "ACCOUNTANT": 5,
    "CATALOG_MANAGER": 5,
    "OPTOMETRIST": 6,
    "SALES_CASHIER": 7,
    "SALES_STAFF": 7,
    "WORKSHOP_STAFF": 8
}

ROLE_DISCOUNT_CAPS = {
    "SUPERADMIN": 100,
    "ADMIN": 100,
    "AREA_MANAGER": 25,
    "STORE_MANAGER": 20,
    "SALES_CASHIER": 10,
    "SALES_STAFF": 10,
    "OPTOMETRIST": 10,
}


def get_user_hierarchy_level(roles: List[str]) -> int:
    """Get user's highest hierarchy level (lowest number = highest authority)"""
    if not roles:
        return 999
    return min([ROLE_HIERARCHY.get(role, 999) for role in roles])


def get_required_approver_role(requested_discount: float) -> str:
    """Determine which role is required to approve this discount"""
    if requested_discount > 25:
        return "ADMIN"  # ADMIN or SUPERADMIN
    elif requested_discount > 20:
        return "AREA_MANAGER"
    elif requested_discount > 10:
        return "STORE_MANAGER"
    else:
        return "SALES_STAFF"  # Should not reach here


def can_approve(approver_roles: List[str], requester_roles: List[str],
                requested_discount: float) -> bool:
    """
    Check if approver has authority to approve this request

    Rules:
    1. Approver must be higher in hierarchy than requester
    2. Approver's discount cap must be >= requested discount
    """
    approver_level = get_user_hierarchy_level(approver_roles)
    requester_level = get_user_hierarchy_level(requester_roles)

    # Must be higher in hierarchy
    if approver_level >= requester_level:
        return False

    # Must have sufficient discount cap
    max_approver_cap = max([ROLE_DISCOUNT_CAPS.get(role, 0) for role in approver_roles] + [0])
    if max_approver_cap < requested_discount:
        return False

    return True


def get_potential_approvers(requested_discount: float) -> List[str]:
    """Get list of roles that can approve this discount"""
    approvers = []

    # SUPERADMIN and ADMIN can approve anything
    approvers.extend(["SUPERADMIN", "ADMIN"])

    # AREA_MANAGER can approve up to 25%
    if requested_discount <= 25:
        approvers.append("AREA_MANAGER")

    # STORE_MANAGER can approve up to 20%
    if requested_discount <= 20:
        approvers.append("STORE_MANAGER")

    return approvers


# ============================================================================
# TASK CREATION HELPER
# ============================================================================

def create_approval_task(
    approval_id: str,
    approval_number: str,
    store_id: str,
    requester_id: str,
    requested_discount: float,
    product_name: str,
    potential_approvers: List[str]
) -> str:
    """
    Create task for approval request
    Returns task_id
    """
    try:
        _, _, _, tasks_repo = get_repositories()

        # Find users with potential approver roles in this store
        users_collection = Database.get_collection("users")
        potential_approver_users = list(users_collection.find({
            "accessible_stores": store_id,
            "roles": {"$in": potential_approvers},
            "is_active": True
        }))

        # Assign to Store Manager by default, or first potential approver
        assigned_to = None
        for user in potential_approver_users:
            if "STORE_MANAGER" in user.get("roles", []):
                assigned_to = user.get("user_id")
                break

        if not assigned_to and potential_approver_users:
            assigned_to = potential_approver_users[0].get("user_id")

        if not assigned_to:
            raise Exception("No potential approvers found in store")

        # Create task
        task_doc = {
            "task_id": str(uuid.uuid4()),
            "task_number": f"TASK-DA-{approval_number.split('-')[-1]}",
            "title": f"Approve Discount: {requested_discount}% on {product_name}",
            "description": f"Discount approval request for {requested_discount}% on {product_name}. Please review and approve/reject.",
            "category": "DISCOUNT_APPROVAL",
            "priority": "P1",  # P1 = 24 hour response expected
            "status": "OPEN",
            "store_id": store_id,
            "assigned_to": assigned_to,
            "created_by": requester_id,
            "linked_entity_type": "APPROVAL",
            "linked_entity_id": approval_id,
            "due_at": datetime.now() + timedelta(hours=24),
            "metadata": {
                "approval_id": approval_id,
                "approval_number": approval_number,
                "requested_discount": requested_discount,
                "potential_approvers": potential_approvers
            }
        }

        created_task = tasks_repo.create(task_doc)
        return created_task["task_id"] if created_task else None

    except Exception as e:
        print(f"Error creating approval task: {e}")
        return None


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/discount", status_code=201)
async def request_discount_approval(
    request: DiscountApprovalRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Request discount approval

    Creates approval request and auto-creates task for potential approvers.
    Approval expires after 24 hours if not acted upon.
    """
    approvals_repo, orders_repo, users_repo, _ = get_repositories()

    store_id = current_user.get("active_store_id")
    requester_id = current_user.get("user_id")
    requester_roles = current_user.get("roles", [])

    if not store_id:
        raise HTTPException(status_code=400, detail="No active store selected")

    # Validate MRP vs Offer Price
    if request.offer_price > request.mrp:
        raise HTTPException(
            status_code=400,
            detail="Offer price cannot exceed MRP"
        )

    if request.offer_price < request.mrp:
        raise HTTPException(
            status_code=400,
            detail="Product is already discounted by HQ. No further discount allowed."
        )

    # Get requester's max discount cap
    requester_max_discount = max(
        [ROLE_DISCOUNT_CAPS.get(role, 0) for role in requester_roles] + [0]
    )

    # Check if approval is actually needed
    if request.requested_discount_percent <= requester_max_discount:
        raise HTTPException(
            status_code=400,
            detail=f"Approval not needed. Your discount cap is {requester_max_discount}%"
        )

    # Validate discount doesn't exceed 100%
    if request.requested_discount_percent > 100:
        raise HTTPException(
            status_code=400,
            detail="Discount cannot exceed 100%"
        )

    # Get potential approvers
    potential_approvers = get_potential_approvers(request.requested_discount_percent)
    required_role = get_required_approver_role(request.requested_discount_percent)

    # Generate approval number
    approval_count = approvals_repo.count({"store_id": store_id})
    approval_number = f"DA-{store_id[:3].upper()}-{datetime.now().strftime('%Y%m')}-{approval_count + 1:04d}"

    # Calculate final price after discount
    discounted_price = request.offer_price * (1 - request.requested_discount_percent / 100)

    # Create approval document
    approval_doc = {
        "approval_id": str(uuid.uuid4()),
        "approval_number": approval_number,
        "approval_type": "DISCOUNT",
        "store_id": store_id,
        "order_id": request.order_id,
        "product_id": request.product_id,
        "product_name": request.product_name,
        "mrp": request.mrp,
        "offer_price": request.offer_price,
        "requested_discount_percent": request.requested_discount_percent,
        "requester_max_discount": requester_max_discount,
        "discounted_price": discounted_price,
        "reason": request.reason,
        "items": request.items,  # For bulk approval
        "status": "PENDING",
        "priority": "P1",
        "requested_by": requester_id,
        "requester_roles": requester_roles,
        "required_role": required_role,
        "potential_approvers": potential_approvers,
        "escalation_level": 0,
        "expires_at": datetime.now() + timedelta(hours=24),
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    # Save approval
    created_approval = approvals_repo.create(approval_doc)
    if not created_approval:
        raise HTTPException(status_code=500, detail="Failed to create approval request")

    # Create task for approvers
    task_id = create_approval_task(
        approval_id=approval_doc["approval_id"],
        approval_number=approval_number,
        store_id=store_id,
        requester_id=requester_id,
        requested_discount=request.requested_discount_percent,
        product_name=request.product_name,
        potential_approvers=potential_approvers
    )

    if task_id:
        # Update approval with task ID
        approvals_repo.update(approval_doc["approval_id"], {"task_id": task_id})

    return {
        "approval_id": approval_doc["approval_id"],
        "approval_number": approval_number,
        "status": "PENDING",
        "requested_discount": request.requested_discount_percent,
        "expires_at": approval_doc["expires_at"].isoformat(),
        "required_approver": required_role,
        "task_created": task_id is not None,
        "message": f"Discount approval request created. Requires {required_role} approval."
    }


@router.get("/discount/pending")
async def get_pending_approvals(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get pending discount approvals

    Filters by:
    - User's roles (only shows approvals they can approve)
    - Excludes approvals created by user themselves
    - Active store if no store_id provided
    """
    approvals_repo, _, users_repo, _ = get_repositories()

    user_id = current_user.get("user_id")
    user_roles = current_user.get("roles", [])

    # Use active store if not provided
    if not store_id:
        store_id = current_user.get("active_store_id")

    # Check if user has access to this store
    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    # Find pending approvals that user can approve
    approvals = approvals_repo.find_pending_for_user(user_id, user_roles)

    # Filter by store
    approvals = [a for a in approvals if a.get("store_id") == store_id]

    # Enrich with requester info
    for approval in approvals:
        requester = users_repo.find_by_id(approval.get("requested_by"))
        if requester:
            approval["requester_name"] = requester.get("full_name")
            approval["requester_email"] = requester.get("email")

    return {
        "approvals": approvals,
        "total": len(approvals),
        "store_id": store_id
    }


@router.get("/discount/{approval_id}")
async def get_approval(
    approval_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get approval details"""
    approvals_repo, _, users_repo, _ = get_repositories()

    approval = approvals_repo.find_by_id(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    # Check if user has access to this approval's store
    if approval.get("store_id") not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this approval")

    # Enrich with user info
    requester = users_repo.find_by_id(approval.get("requested_by"))
    if requester:
        approval["requester_name"] = requester.get("full_name")
        approval["requester_email"] = requester.get("email")

    if approval.get("approved_by"):
        approver = users_repo.find_by_id(approval.get("approved_by"))
        if approver:
            approval["approver_name"] = approver.get("full_name")

    if approval.get("rejected_by"):
        rejector = users_repo.find_by_id(approval.get("rejected_by"))
        if rejector:
            approval["rejector_name"] = rejector.get("full_name")

    return approval


@router.post("/discount/{approval_id}/approve")
async def approve_discount(
    approval_id: str,
    decision: ApprovalDecision,
    current_user: dict = Depends(get_current_user)
):
    """
    Approve discount request

    Validates:
    - Approver has authority
    - Approver is not the requester
    - Approval is still pending
    - Approval has not expired
    """
    approvals_repo, orders_repo, _, tasks_repo = get_repositories()

    approver_id = current_user.get("user_id")
    approver_roles = current_user.get("roles", [])

    # Get approval
    approval = approvals_repo.find_by_id(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    # Check if approval is pending
    if approval.get("status") != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Approval is not pending. Current status: {approval.get('status')}"
        )

    # Check if expired
    if approval.get("expires_at") and approval["expires_at"] < datetime.now():
        # Auto-expire
        approvals_repo.expire(approval_id)
        raise HTTPException(
            status_code=400,
            detail="Approval has expired. Requester must create a new request."
        )

    # Check if approver is the requester
    if approver_id == approval.get("requested_by"):
        raise HTTPException(
            status_code=403,
            detail="You cannot approve your own request"
        )

    # Check if approver has authority
    requester_roles = approval.get("requester_roles", [])
    requested_discount = approval.get("requested_discount_percent", 0)

    if not can_approve(approver_roles, requester_roles, requested_discount):
        max_cap = max([ROLE_DISCOUNT_CAPS.get(role, 0) for role in approver_roles] + [0])
        raise HTTPException(
            status_code=403,
            detail=f"Insufficient authority. Your max discount cap is {max_cap}%, but {requested_discount}% was requested."
        )

    # Determine approved discount
    approved_discount = decision.approved_discount_percent
    if approved_discount is None:
        # If not specified, approve the requested amount
        approved_discount = requested_discount

    # Validate approved discount doesn't exceed requested
    if approved_discount > requested_discount:
        raise HTTPException(
            status_code=400,
            detail="Approved discount cannot exceed requested discount"
        )

    # Approve the request
    success = approvals_repo.approve(
        approval_id=approval_id,
        approved_by=approver_id,
        approved_discount=approved_discount,
        remarks=decision.remarks
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to approve request")

    # Complete associated task
    if approval.get("task_id"):
        tasks_repo.complete_task(
            approval["task_id"],
            notes=f"Approved by {current_user.get('full_name')} with {approved_discount}% discount"
        )

    # If linked to an order, update order with approved discount
    if approval.get("order_id"):
        order = orders_repo.find_by_id(approval["order_id"])
        if order and order.get("status") == "DRAFT":
            # Update order with approved discount
            orders_repo.update(approval["order_id"], {
                "discount_approved": True,
                "approved_discount_percent": approved_discount,
                "discount_approved_by": approver_id,
                "discount_approved_at": datetime.now()
            })

    return {
        "approval_id": approval_id,
        "approval_number": approval.get("approval_number"),
        "status": "APPROVED",
        "approved_discount": approved_discount,
        "approved_by": approver_id,
        "approved_at": datetime.now().isoformat(),
        "message": f"Discount of {approved_discount}% approved successfully"
    }


@router.post("/discount/{approval_id}/reject")
async def reject_discount(
    approval_id: str,
    rejection: ApprovalRejection,
    current_user: dict = Depends(get_current_user)
):
    """
    Reject discount request

    Validates:
    - Approver has authority
    - Approver is not the requester
    - Approval is still pending
    """
    approvals_repo, _, _, tasks_repo = get_repositories()

    rejector_id = current_user.get("user_id")
    rejector_roles = current_user.get("roles", [])

    # Get approval
    approval = approvals_repo.find_by_id(approval_id)
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    # Check if approval is pending
    if approval.get("status") != "PENDING":
        raise HTTPException(
            status_code=400,
            detail=f"Approval is not pending. Current status: {approval.get('status')}"
        )

    # Check if rejector is the requester
    if rejector_id == approval.get("requested_by"):
        raise HTTPException(
            status_code=403,
            detail="You cannot reject your own request"
        )

    # Check if rejector has authority (same rules as approval)
    requester_roles = approval.get("requester_roles", [])
    requested_discount = approval.get("requested_discount_percent", 0)

    if not can_approve(rejector_roles, requester_roles, requested_discount):
        raise HTTPException(
            status_code=403,
            detail="Insufficient authority to reject this request"
        )

    # Reject the request
    success = approvals_repo.reject(
        approval_id=approval_id,
        rejected_by=rejector_id,
        rejection_reason=rejection.rejection_reason
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to reject request")

    # Complete associated task
    if approval.get("task_id"):
        tasks_repo.complete_task(
            approval["task_id"],
            notes=f"Rejected by {current_user.get('full_name')}: {rejection.rejection_reason}"
        )

    # Create notification task for requester
    requester_id = approval.get("requested_by")
    if requester_id:
        notification_task = {
            "task_id": str(uuid.uuid4()),
            "task_number": f"NOTIF-{approval.get('approval_number')}",
            "title": f"Discount Request Rejected",
            "description": f"Your discount request for {approval.get('product_name')} has been rejected. Reason: {rejection.rejection_reason}",
            "category": "NOTIFICATION",
            "priority": "P2",
            "status": "OPEN",
            "store_id": approval.get("store_id"),
            "assigned_to": requester_id,
            "created_by": rejector_id,
            "linked_entity_type": "APPROVAL",
            "linked_entity_id": approval_id,
            "due_at": datetime.now() + timedelta(hours=24)
        }
        tasks_repo.create(notification_task)

    return {
        "approval_id": approval_id,
        "approval_number": approval.get("approval_number"),
        "status": "REJECTED",
        "rejected_by": rejector_id,
        "rejected_at": datetime.now().isoformat(),
        "rejection_reason": rejection.rejection_reason,
        "message": "Discount request rejected"
    }


@router.get("/discount/history")
async def get_approval_history(
    store_id: Optional[str] = Query(None),
    status: Optional[ApprovalStatus] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Get approval history with filters
    """
    approvals_repo, _, users_repo, _ = get_repositories()

    # Use active store if not provided
    if not store_id:
        store_id = current_user.get("active_store_id")

    # Check if user has access to this store
    if store_id not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this store")

    # Parse dates
    from_datetime = datetime.fromisoformat(from_date) if from_date else None
    to_datetime = datetime.fromisoformat(to_date) if to_date else None

    # Get approvals
    approvals = approvals_repo.find_by_store(
        store_id=store_id,
        status=status.value if status else None,
        from_date=from_datetime,
        to_date=to_datetime
    )

    # Enrich with user info
    for approval in approvals:
        requester = users_repo.find_by_id(approval.get("requested_by"))
        if requester:
            approval["requester_name"] = requester.get("full_name")

        if approval.get("approved_by"):
            approver = users_repo.find_by_id(approval.get("approved_by"))
            if approver:
                approval["approver_name"] = approver.get("full_name")

    # Get summary statistics
    summary = approvals_repo.get_approval_summary(
        store_id=store_id,
        from_date=from_datetime,
        to_date=to_datetime
    )

    return {
        "approvals": approvals,
        "total": len(approvals),
        "summary": summary,
        "store_id": store_id
    }


@router.get("/discount/my-requests")
async def get_my_approval_requests(
    status: Optional[ApprovalStatus] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get approvals requested by current user"""
    approvals_repo, _, _, _ = get_repositories()

    user_id = current_user.get("user_id")

    approvals = approvals_repo.find_by_requester(
        user_id=user_id,
        status=status.value if status else None
    )

    return {
        "approvals": approvals,
        "total": len(approvals)
    }


@router.post("/discount/expire-old")
async def expire_old_approvals(current_user: dict = Depends(get_current_user)):
    """
    Expire old pending approvals (24+ hours)

    This can be called by a cron job or manually by admins.
    Only ADMIN/SUPERADMIN can trigger this.
    """
    user_roles = current_user.get("roles", [])

    if not any(role in ["SUPERADMIN", "ADMIN"] for role in user_roles):
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN or SUPERADMIN can expire old approvals"
        )

    approvals_repo, _, _, _ = get_repositories()

    # Find expired approvals
    expired_approvals = approvals_repo.find_expired()

    expired_count = 0
    for approval in expired_approvals:
        success = approvals_repo.expire(approval["approval_id"])
        if success:
            expired_count += 1

    return {
        "message": f"Expired {expired_count} old approval requests",
        "expired_count": expired_count
    }
