"""
IMS 2.0 - Task Escalation Service
==================================
Automatic escalation of overdue tasks based on priority

Escalation Rules (SYSTEM_INTENT.md Section 12):
- P0 (Critical): 4 hours
- P1 (Essential): 24 hours
- P2 (Important): 3 days (72 hours)
- P3+: No auto-escalation

Escalation Chain:
SALES_STAFF → STORE_MANAGER → AREA_MANAGER → ADMIN → SUPERADMIN
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from enum import Enum
import uuid


class EscalationLevel(Enum):
    """Escalation hierarchy levels"""
    LEVEL_0 = 0  # Original assignee
    LEVEL_1 = 1  # Store Manager
    LEVEL_2 = 2  # Area Manager
    LEVEL_3 = 3  # Admin/Superadmin


# Role hierarchy for escalation
ESCALATION_HIERARCHY = {
    EscalationLevel.LEVEL_1: ["STORE_MANAGER", "SALES_CASHIER"],
    EscalationLevel.LEVEL_2: ["AREA_MANAGER"],
    EscalationLevel.LEVEL_3: ["ADMIN", "SUPERADMIN"]
}

# Priority-based escalation times (in hours)
ESCALATION_TIMES = {
    "P0": 4,   # Critical: 4 hours
    "P1": 24,  # Essential: 24 hours
    "P2": 72,  # Important: 3 days
}


class TaskEscalationService:
    """
    Service for handling task escalation logic
    """

    def __init__(self, task_repo, user_repo):
        """
        Initialize with repositories

        Args:
            task_repo: TaskRepository instance
            user_repo: UserRepository instance
        """
        self.task_repo = task_repo
        self.user_repo = user_repo

    def should_escalate(self, task: Dict) -> Tuple[bool, Optional[int]]:
        """
        Check if a task should be escalated

        Args:
            task: Task document

        Returns:
            Tuple of (should_escalate, new_escalation_level)
        """
        priority = task.get("priority")
        created_at = task.get("created_at")
        current_level = task.get("escalation_level", 0)
        status = task.get("status")

        # Don't escalate completed/cancelled tasks
        if status in ["COMPLETED", "CANCELLED", "FORCE_CLOSED"]:
            return False, None

        # Don't escalate beyond level 3
        if current_level >= 3:
            return False, None

        # Check if priority has escalation rule
        if priority not in ESCALATION_TIMES:
            return False, None

        # Calculate time since creation
        if not created_at:
            return False, None

        time_elapsed = datetime.now() - created_at
        hours_elapsed = time_elapsed.total_seconds() / 3600

        # Get escalation threshold for this priority
        escalation_hours = ESCALATION_TIMES[priority]

        # Check if enough time has passed for next escalation level
        # Each level escalates at the same interval
        # Level 0 → 1: after escalation_hours
        # Level 1 → 2: after 2 * escalation_hours
        # Level 2 → 3: after 3 * escalation_hours
        next_level = current_level + 1
        required_hours = escalation_hours * next_level

        if hours_elapsed >= required_hours:
            return True, next_level

        return False, None

    def get_escalation_recipients(
        self,
        store_id: str,
        escalation_level: int
    ) -> List[Dict]:
        """
        Get list of users who should receive escalation at this level

        Args:
            store_id: Store ID
            escalation_level: Target escalation level (1, 2, or 3)

        Returns:
            List of user documents
        """
        try:
            level_enum = EscalationLevel(escalation_level)
            required_roles = ESCALATION_HIERARCHY.get(level_enum, [])

            if not required_roles:
                return []

            # Find users with required roles in this store
            users_collection = self.user_repo.collection

            query = {
                "accessible_stores": store_id,
                "roles": {"$in": required_roles},
                "is_active": True
            }

            return list(users_collection.find(query))

        except Exception as e:
            print(f"Error getting escalation recipients: {e}")
            return []

    def escalate_task(
        self,
        task: Dict,
        new_level: int,
        escalated_by: str = "SYSTEM"
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Escalate a task to the next level

        Args:
            task: Task document
            new_level: New escalation level
            escalated_by: User ID who triggered escalation

        Returns:
            Tuple of (success, notification_task_id, escalated_to_user_id)
        """
        try:
            task_id = task.get("task_id")
            store_id = task.get("store_id")
            priority = task.get("priority")

            # Get escalation recipients
            recipients = self.get_escalation_recipients(store_id, new_level)

            if not recipients:
                return False, None, None

            # Choose primary recipient (first user with highest role)
            primary_recipient = recipients[0]
            escalated_to_user_id = primary_recipient.get("user_id")
            escalated_to_name = primary_recipient.get("full_name")

            # Update task with escalation
            reason = f"Auto-escalated due to {priority} priority timeout"
            success = self.task_repo.record_escalation(
                task_id=task_id,
                escalate_to=escalated_to_user_id,
                level=new_level,
                reason=reason
            )

            if not success:
                return False, None, None

            # Create notification task for escalation recipient
            notification_task_id = self._create_escalation_notification(
                task=task,
                escalation_level=new_level,
                recipient_user_id=escalated_to_user_id,
                recipient_name=escalated_to_name
            )

            return True, notification_task_id, escalated_to_user_id

        except Exception as e:
            print(f"Error escalating task: {e}")
            return False, None, None

    def _create_escalation_notification(
        self,
        task: Dict,
        escalation_level: int,
        recipient_user_id: str,
        recipient_name: str
    ) -> Optional[str]:
        """
        Create a notification task for escalation

        Args:
            task: Original task that was escalated
            escalation_level: Level it was escalated to
            recipient_user_id: User who should receive notification
            recipient_name: Name of recipient

        Returns:
            Notification task ID
        """
        try:
            task_id = task.get("task_id")
            task_number = task.get("task_number")
            task_title = task.get("title")
            priority = task.get("priority")
            store_id = task.get("store_id")

            level_names = {
                1: "Store Manager",
                2: "Area Manager",
                3: "Admin/Superadmin"
            }

            notification_task = {
                "task_id": str(uuid.uuid4()),
                "task_number": f"NOTIF-ESC-{task_number}",
                "title": f"Task Escalated to Level {escalation_level}",
                "description": (
                    f"Task '{task_title}' ({task_number}) has been escalated to "
                    f"Level {escalation_level} ({level_names.get(escalation_level, 'Unknown')}) "
                    f"due to {priority} priority timeout. Immediate attention required."
                ),
                "category": "ESCALATION",
                "priority": priority,  # Inherit priority from original task
                "status": "OPEN",
                "store_id": store_id,
                "assigned_to": recipient_user_id,
                "created_by": "SYSTEM",
                "linked_entity_type": "TASK",
                "linked_entity_id": task_id,
                "due_at": datetime.now() + timedelta(hours=4),  # 4 hour response time
                "metadata": {
                    "original_task_id": task_id,
                    "original_task_number": task_number,
                    "escalation_level": escalation_level,
                    "escalation_reason": f"{priority} priority timeout"
                },
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }

            created_task = self.task_repo.create(notification_task)
            return created_task["task_id"] if created_task else None

        except Exception as e:
            print(f"Error creating escalation notification: {e}")
            return None

    def process_all_escalations(
        self,
        store_id: Optional[str] = None,
        priority: Optional[str] = None
    ) -> Dict:
        """
        Process escalations for all eligible tasks

        Args:
            store_id: Optional store filter
            priority: Optional priority filter (P0, P1, P2)

        Returns:
            Summary dict with escalation results
        """
        try:
            results = {
                "total_checked": 0,
                "escalated": 0,
                "failed": 0,
                "escalations": []
            }

            # Find tasks needing escalation
            tasks = self.task_repo.find_tasks_needing_escalation(priority=priority)

            # Filter by store if specified
            if store_id:
                tasks = [t for t in tasks if t.get("store_id") == store_id]

            results["total_checked"] = len(tasks)

            for task in tasks:
                # Check if should escalate
                should_escalate, new_level = self.should_escalate(task)

                if not should_escalate:
                    continue

                # Escalate
                success, notif_task_id, escalated_to = self.escalate_task(
                    task=task,
                    new_level=new_level,
                    escalated_by="SYSTEM"
                )

                if success:
                    results["escalated"] += 1
                    results["escalations"].append({
                        "task_id": task.get("task_id"),
                        "task_number": task.get("task_number"),
                        "title": task.get("title"),
                        "priority": task.get("priority"),
                        "escalation_level": new_level,
                        "escalated_to": escalated_to,
                        "notification_task_id": notif_task_id
                    })
                else:
                    results["failed"] += 1

            return results

        except Exception as e:
            print(f"Error processing escalations: {e}")
            return {
                "total_checked": 0,
                "escalated": 0,
                "failed": 0,
                "error": str(e)
            }

    def get_escalation_status(self, task_id: str) -> Dict:
        """
        Get escalation status for a task

        Args:
            task_id: Task ID

        Returns:
            Escalation status dict
        """
        task = self.task_repo.find_by_id(task_id)

        if not task:
            return {"error": "Task not found"}

        priority = task.get("priority")
        created_at = task.get("created_at")
        current_level = task.get("escalation_level", 0)
        status = task.get("status")

        # Check if task has escalation rules
        if priority not in ESCALATION_TIMES:
            return {
                "task_id": task_id,
                "escalation_enabled": False,
                "reason": f"Priority {priority} does not have escalation rules"
            }

        # Calculate time elapsed
        time_elapsed = datetime.now() - created_at
        hours_elapsed = time_elapsed.total_seconds() / 3600

        # Calculate next escalation time
        escalation_hours = ESCALATION_TIMES[priority]
        next_level = current_level + 1
        hours_until_next_escalation = (escalation_hours * next_level) - hours_elapsed

        return {
            "task_id": task_id,
            "task_number": task.get("task_number"),
            "priority": priority,
            "status": status,
            "escalation_enabled": True,
            "current_escalation_level": current_level,
            "next_escalation_level": next_level if next_level <= 3 else None,
            "hours_elapsed": round(hours_elapsed, 2),
            "hours_until_next_escalation": (
                round(hours_until_next_escalation, 2)
                if next_level <= 3 and hours_until_next_escalation > 0
                else None
            ),
            "escalated_to": task.get("escalated_to"),
            "escalated_at": task.get("escalated_at"),
            "escalation_reason": task.get("escalation_reason")
        }
