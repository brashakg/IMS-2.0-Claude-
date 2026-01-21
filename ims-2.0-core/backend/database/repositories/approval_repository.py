"""
IMS 2.0 - Approval Repository
==============================
Discount approval data access operations
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from .base_repository import BaseRepository


class ApprovalRepository(BaseRepository):
    """Repository for Discount Approval operations"""

    @property
    def entity_name(self) -> str:
        return "DiscountApproval"

    @property
    def id_field(self) -> str:
        return "approval_id"

    # =========================================================================
    # Approval-specific queries
    # =========================================================================

    def find_by_approval_number(self, approval_number: str) -> Optional[Dict]:
        """Find approval by approval number"""
        return self.find_one({"approval_number": approval_number})

    def find_by_order(self, order_id: str) -> List[Dict]:
        """Find approvals for specific order"""
        return self.find_many(
            {"order_id": order_id},
            sort=[("created_at", -1)]
        )

    def find_by_requester(self, user_id: str, status: str = None) -> List[Dict]:
        """Find approvals requested by user"""
        filter = {"requested_by": user_id}
        if status:
            filter["status"] = status
        return self.find_many(filter, sort=[("created_at", -1)])

    def find_by_store(self, store_id: str, status: str = None,
                     from_date: datetime = None, to_date: datetime = None) -> List[Dict]:
        """Find approvals for store with optional filters"""
        filter = {"store_id": store_id}

        if status:
            filter["status"] = status
        if from_date:
            filter["created_at"] = {"$gte": from_date}
        if to_date:
            filter.setdefault("created_at", {})["$lte"] = to_date

        return self.find_many(filter, sort=[("created_at", -1)])

    # =========================================================================
    # Status-based queries
    # =========================================================================

    def find_pending(self, store_id: str = None, approvable_by: str = None) -> List[Dict]:
        """
        Find pending approvals
        If approvable_by is provided, filter by user's role in potential_approvers
        """
        filter = {"status": "PENDING"}

        if store_id:
            filter["store_id"] = store_id

        if approvable_by:
            filter["potential_approvers"] = {"$in": [approvable_by]}

        return self.find_many(filter, sort=[("priority", 1), ("created_at", 1)])

    def find_pending_for_user(self, user_id: str, user_roles: List[str]) -> List[Dict]:
        """
        Find pending approvals that user can approve based on their roles
        Excludes approvals requested by the user themselves
        """
        filter = {
            "status": "PENDING",
            "requested_by": {"$ne": user_id},
            "required_role": {"$in": user_roles}
        }

        return self.find_many(filter, sort=[("priority", 1), ("created_at", 1)])

    def find_expired(self, store_id: str = None) -> List[Dict]:
        """Find expired approvals (24 hours old and still pending)"""
        expiry_time = datetime.now() - timedelta(hours=24)
        filter = {
            "status": "PENDING",
            "created_at": {"$lt": expiry_time}
        }

        if store_id:
            filter["store_id"] = store_id

        return self.find_many(filter, sort=[("created_at", 1)])

    def find_needs_escalation(self, hours: int = 4) -> List[Dict]:
        """
        Find approvals that need escalation
        (pending for more than specified hours)
        """
        escalation_time = datetime.now() - timedelta(hours=hours)
        filter = {
            "status": "PENDING",
            "created_at": {"$lt": escalation_time},
            "escalation_level": {"$lt": 3}  # Max 3 escalation levels
        }

        return self.find_many(filter, sort=[("created_at", 1)])

    # =========================================================================
    # Approval operations
    # =========================================================================

    def approve(self, approval_id: str, approved_by: str,
                approved_discount: float, remarks: str = None) -> bool:
        """Approve discount request"""
        update_data = {
            "status": "APPROVED",
            "approved_by": approved_by,
            "approved_at": datetime.now(),
            "approved_discount_percent": approved_discount,
            "approval_remarks": remarks
        }
        return self.update(approval_id, update_data)

    def reject(self, approval_id: str, rejected_by: str,
               rejection_reason: str) -> bool:
        """Reject discount request"""
        update_data = {
            "status": "REJECTED",
            "rejected_by": rejected_by,
            "rejected_at": datetime.now(),
            "rejection_reason": rejection_reason
        }
        return self.update(approval_id, update_data)

    def expire(self, approval_id: str) -> bool:
        """Mark approval as expired"""
        update_data = {
            "status": "EXPIRED",
            "expired_at": datetime.now()
        }
        return self.update(approval_id, update_data)

    def escalate(self, approval_id: str, escalated_to_role: str,
                 escalation_level: int) -> bool:
        """Escalate approval to higher authority"""
        update_data = {
            "escalated_to_role": escalated_to_role,
            "escalation_level": escalation_level,
            "escalated_at": datetime.now()
        }
        return self.update(approval_id, update_data)

    # =========================================================================
    # Analytics
    # =========================================================================

    def get_approval_summary(self, store_id: str = None,
                            from_date: datetime = None,
                            to_date: datetime = None) -> Dict:
        """Get approval statistics"""
        filter = {}

        if store_id:
            filter["store_id"] = store_id
        if from_date:
            filter["created_at"] = {"$gte": from_date}
        if to_date:
            filter.setdefault("created_at", {})["$lte"] = to_date

        pipeline = [
            {"$match": filter},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "avg_requested_discount": {"$avg": "$requested_discount_percent"},
                "avg_approved_discount": {"$avg": "$approved_discount_percent"}
            }}
        ]

        results = self.aggregate(pipeline)
        summary = {}
        for r in results:
            summary[r["_id"]] = {
                "count": r["count"],
                "avg_requested": round(r.get("avg_requested_discount", 0), 2),
                "avg_approved": round(r.get("avg_approved_discount", 0), 2)
            }

        return summary

    def get_approval_rate(self, user_id: str = None,
                         from_date: datetime = None,
                         to_date: datetime = None) -> Dict:
        """Get approval/rejection rate"""
        filter = {}

        if user_id:
            filter["approved_by"] = user_id
        if from_date:
            filter["approved_at"] = {"$gte": from_date}
        if to_date:
            filter.setdefault("approved_at", {})["$lte"] = to_date

        total = self.count(filter)
        approved = self.count({**filter, "status": "APPROVED"})
        rejected = self.count({**filter, "status": "REJECTED"})

        return {
            "total": total,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": round((approved / total * 100) if total > 0 else 0, 2)
        }

    def get_average_response_time(self, store_id: str = None) -> float:
        """Get average time to approve/reject (in hours)"""
        filter = {
            "status": {"$in": ["APPROVED", "REJECTED"]}
        }

        if store_id:
            filter["store_id"] = store_id

        pipeline = [
            {"$match": filter},
            {"$project": {
                "response_time": {
                    "$subtract": [
                        {"$ifNull": ["$approved_at", "$rejected_at"]},
                        "$created_at"
                    ]
                }
            }},
            {"$group": {
                "_id": None,
                "avg_response_ms": {"$avg": "$response_time"}
            }}
        ]

        results = self.aggregate(pipeline)
        if results and results[0].get("avg_response_ms"):
            # Convert milliseconds to hours
            return round(results[0]["avg_response_ms"] / (1000 * 60 * 60), 2)

        return 0.0
