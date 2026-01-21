"""
IMS 2.0 - Payment Repository
=============================
Payment transaction data access operations
"""
from typing import List, Optional, Dict
from datetime import datetime, timedelta
from decimal import Decimal
from .base_repository import BaseRepository


class PaymentRepository(BaseRepository):
    """Repository for Payment Transaction operations"""

    @property
    def entity_name(self) -> str:
        return "Payment"

    @property
    def id_field(self) -> str:
        return "payment_id"

    # =========================================================================
    # Payment-specific queries
    # =========================================================================

    def find_by_transaction_id(self, transaction_id: str) -> Optional[Dict]:
        """Find payment by transaction ID (Razorpay payment_id)"""
        return self.find_one({"transaction_id": transaction_id})

    def find_by_order(self, order_id: str) -> List[Dict]:
        """Find all payments for an order"""
        return self.find_many(
            {"order_id": order_id},
            sort=[("created_at", -1)]
        )

    def find_by_razorpay_order(self, razorpay_order_id: str) -> Optional[Dict]:
        """Find payment by Razorpay order ID"""
        return self.find_one({"razorpay_order_id": razorpay_order_id})

    def find_by_store(self, store_id: str,
                     from_date: datetime = None,
                     to_date: datetime = None,
                     status: str = None) -> List[Dict]:
        """Find payments for store with optional filters"""
        filter_dict = {"store_id": store_id}

        if from_date:
            filter_dict["created_at"] = {"$gte": from_date}
        if to_date:
            filter_dict.setdefault("created_at", {})["$lte"] = to_date
        if status:
            filter_dict["status"] = status

        return self.find_many(filter_dict, sort=[("created_at", -1)])

    # =========================================================================
    # Status-based queries
    # =========================================================================

    def find_pending(self, store_id: str = None) -> List[Dict]:
        """Find pending payments"""
        filter_dict = {"status": "PENDING"}
        if store_id:
            filter_dict["store_id"] = store_id
        return self.find_many(filter_dict, sort=[("created_at", 1)])

    def find_successful(self, store_id: str = None,
                       from_date: datetime = None,
                       to_date: datetime = None) -> List[Dict]:
        """Find successful payments"""
        filter_dict = {"status": "CAPTURED"}

        if store_id:
            filter_dict["store_id"] = store_id
        if from_date:
            filter_dict["created_at"] = {"$gte": from_date}
        if to_date:
            filter_dict.setdefault("created_at", {})["$lte"] = to_date

        return self.find_many(filter_dict, sort=[("created_at", -1)])

    def find_failed(self, store_id: str = None,
                   from_date: datetime = None) -> List[Dict]:
        """Find failed payments"""
        filter_dict = {"status": "FAILED"}

        if store_id:
            filter_dict["store_id"] = store_id
        if from_date:
            filter_dict["created_at"] = {"$gte": from_date}

        return self.find_many(filter_dict, sort=[("created_at", -1)])

    def find_refunded(self, store_id: str = None) -> List[Dict]:
        """Find refunded payments"""
        filter_dict = {"status": "REFUNDED"}
        if store_id:
            filter_dict["store_id"] = store_id
        return self.find_many(filter_dict, sort=[("refunded_at", -1)])

    # =========================================================================
    # Payment operations
    # =========================================================================

    def update_status(self, payment_id: str, status: str,
                     metadata: Dict = None) -> bool:
        """Update payment status"""
        update_data = {
            "status": status,
            "updated_at": datetime.now()
        }

        if status == "CAPTURED":
            update_data["captured_at"] = datetime.now()
        elif status == "FAILED":
            update_data["failed_at"] = datetime.now()
        elif status == "REFUNDED":
            update_data["refunded_at"] = datetime.now()

        if metadata:
            update_data["metadata"] = metadata

        return self.update(payment_id, update_data)

    def record_refund(self, payment_id: str, refund_id: str,
                     refund_amount: float, reason: str) -> bool:
        """Record refund transaction"""
        update_data = {
            "status": "REFUNDED",
            "refund_id": refund_id,
            "refund_amount": refund_amount,
            "refund_reason": reason,
            "refunded_at": datetime.now(),
            "updated_at": datetime.now()
        }
        return self.update(payment_id, update_data)

    def record_callback(self, payment_id: str, callback_data: Dict) -> bool:
        """Record payment gateway callback"""
        update_data = {
            "callback_received_at": datetime.now(),
            "callback_data": callback_data,
            "updated_at": datetime.now()
        }
        return self.update(payment_id, update_data)

    # =========================================================================
    # Analytics
    # =========================================================================

    def get_payment_summary(self, store_id: str,
                           from_date: datetime,
                           to_date: datetime) -> Dict:
        """Get payment summary for period"""
        pipeline = [
            {"$match": {
                "store_id": store_id,
                "created_at": {
                    "$gte": from_date,
                    "$lte": to_date
                }
            }},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$amount"}
            }}
        ]

        results = self.aggregate(pipeline)

        summary = {
            "PENDING": {"count": 0, "amount": 0},
            "CAPTURED": {"count": 0, "amount": 0},
            "FAILED": {"count": 0, "amount": 0},
            "REFUNDED": {"count": 0, "amount": 0}
        }

        for result in results:
            status = result["_id"]
            if status in summary:
                summary[status]["count"] = result["count"]
                summary[status]["amount"] = result["total_amount"]

        return summary

    def get_payment_method_distribution(self, store_id: str,
                                       from_date: datetime = None,
                                       to_date: datetime = None) -> List[Dict]:
        """Get distribution of payment methods"""
        filter_dict = {
            "store_id": store_id,
            "status": "CAPTURED"
        }

        if from_date:
            filter_dict["captured_at"] = {"$gte": from_date}
        if to_date:
            filter_dict.setdefault("captured_at", {})["$lte"] = to_date

        pipeline = [
            {"$match": filter_dict},
            {"$group": {
                "_id": "$payment_method",
                "count": {"$sum": 1},
                "total_amount": {"$sum": "$amount"}
            }},
            {"$sort": {"total_amount": -1}}
        ]

        return self.aggregate(pipeline)

    def get_daily_revenue(self, store_id: str, days: int = 30) -> List[Dict]:
        """Get daily payment revenue"""
        start_date = datetime.now() - timedelta(days=days)

        pipeline = [
            {"$match": {
                "store_id": store_id,
                "status": "CAPTURED",
                "captured_at": {"$gte": start_date}
            }},
            {"$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$captured_at"
                    }
                },
                "count": {"$sum": 1},
                "revenue": {"$sum": "$amount"}
            }},
            {"$sort": {"_id": 1}}
        ]

        return self.aggregate(pipeline)

    def get_failure_rate(self, store_id: str,
                        from_date: datetime = None) -> Dict:
        """Get payment failure rate"""
        filter_dict = {"store_id": store_id}

        if from_date:
            filter_dict["created_at"] = {"$gte": from_date}

        total = self.count(filter_dict)
        failed = self.count({**filter_dict, "status": "FAILED"})
        captured = self.count({**filter_dict, "status": "CAPTURED"})

        failure_rate = (failed / total * 100) if total > 0 else 0
        success_rate = (captured / total * 100) if total > 0 else 0

        return {
            "total_attempts": total,
            "successful": captured,
            "failed": failed,
            "failure_rate": round(failure_rate, 2),
            "success_rate": round(success_rate, 2)
        }
