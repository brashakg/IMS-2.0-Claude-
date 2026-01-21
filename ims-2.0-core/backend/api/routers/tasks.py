"""
IMS 2.0 - Tasks Router
================================
Task management with escalation automation
"""
from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid

from .auth import get_current_user
from ..database import Database
from database.repositories.task_repository import TaskRepository
from database.repositories.user_repository import UserRepository
from core.task_escalation_service import TaskEscalationService

router = APIRouter()

# Initialize repositories
task_repo = None
user_repo = None
escalation_service = None


def get_repositories():
    """Initialize repositories with database connection"""
    global task_repo, user_repo, escalation_service
    if task_repo is None:
        task_repo = TaskRepository(Database.get_collection("tasks"))
        user_repo = UserRepository(Database.get_collection("users"))
        escalation_service = TaskEscalationService(task_repo, user_repo)
    return task_repo, user_repo, escalation_service


# ============================================================================
# SCHEMAS
# ============================================================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    priority: str = "P3"
    assigned_to: str
    due_at: datetime
    linked_entity_type: Optional[str] = None
    linked_entity_id: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_at: Optional[datetime] = None


class TaskComplete(BaseModel):
    resolution_notes: str


# ============================================================================
# BASIC TASK ENDPOINTS
# ============================================================================

@router.get("/")
async def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assigned_to: Optional[str] = Query(None),
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """List tasks with optional filters"""
    tasks_repo, _, _ = get_repositories()

    user_store = store_id or current_user.get("active_store_id")

    if not user_store:
        raise HTTPException(status_code=400, detail="No active store selected")

    # Build filter
    filter_dict = {"store_id": user_store}

    if status:
        filter_dict["status"] = status
    if priority:
        filter_dict["priority"] = priority
    if assigned_to:
        filter_dict["assigned_to"] = assigned_to

    tasks = tasks_repo.find_many(filter_dict, sort=[("priority", 1), ("due_at", 1)])

    return {"tasks": tasks, "total": len(tasks)}


@router.get("/my")
async def my_tasks(
    status: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks assigned to current user"""
    tasks_repo, _, _ = get_repositories()

    user_id = current_user.get("user_id")

    tasks = tasks_repo.find_by_assignee(
        user_id=user_id,
        status=status,
        include_completed=False
    )

    return {"tasks": tasks, "total": len(tasks)}


@router.post("/", status_code=201)
async def create_task(
    task: TaskCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new task"""
    tasks_repo, users_repo, _ = get_repositories()

    store_id = current_user.get("active_store_id")
    created_by = current_user.get("user_id")

    if not store_id:
        raise HTTPException(status_code=400, detail="No active store selected")

    # Validate assignee
    assignee = users_repo.find_by_id(task.assigned_to)
    if not assignee:
        raise HTTPException(status_code=404, detail="Assignee not found")

    # Create task document
    task_doc = {
        "task_id": str(uuid.uuid4()),
        "task_number": f"TASK-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
        "title": task.title,
        "description": task.description or "",
        "category": task.category,
        "priority": task.priority,
        "status": "OPEN",
        "store_id": store_id,
        "assigned_to": task.assigned_to,
        "created_by": created_by,
        "due_at": task.due_at,
        "linked_entity_type": task.linked_entity_type,
        "linked_entity_id": task.linked_entity_id,
        "escalation_level": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    created_task = tasks_repo.create(task_doc)

    if not created_task:
        raise HTTPException(status_code=500, detail="Failed to create task")

    return created_task


@router.get("/{task_id}")
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get task by ID"""
    tasks_repo, _, _ = get_repositories()

    task = tasks_repo.find_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if user has access to this task's store
    if task.get("store_id") not in current_user.get("accessible_stores", []):
        raise HTTPException(status_code=403, detail="Access denied to this task")

    return task


@router.post("/{task_id}/start")
async def start_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Start a task"""
    tasks_repo, _, _ = get_repositories()

    task = tasks_repo.find_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.get("status") != "OPEN":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start task in {task.get('status')} status"
        )

    success = tasks_repo.start_task(task_id)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to start task")

    return {"message": "Task started", "task_id": task_id}


@router.post("/{task_id}/complete")
async def complete_task(
    task_id: str,
    completion: TaskComplete,
    current_user: dict = Depends(get_current_user)
):
    """Complete a task"""
    tasks_repo, _, _ = get_repositories()

    task = tasks_repo.find_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if task.get("status") in ["COMPLETED", "CANCELLED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Task already {task.get('status')}"
        )

    success = tasks_repo.complete_task(task_id, notes=completion.resolution_notes)

    if not success:
        raise HTTPException(status_code=500, detail="Failed to complete task")

    return {"message": "Task completed", "task_id": task_id}


@router.post("/{task_id}/reassign")
async def reassign_task(
    task_id: str,
    new_assignee: str,
    current_user: dict = Depends(get_current_user)
):
    """Reassign a task"""
    tasks_repo, users_repo, _ = get_repositories()

    task = tasks_repo.find_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Validate new assignee
    assignee = users_repo.find_by_id(new_assignee)
    if not assignee:
        raise HTTPException(status_code=404, detail="New assignee not found")

    success = tasks_repo.reassign_task(
        task_id=task_id,
        new_assignee=new_assignee,
        reassigned_by=current_user.get("user_id")
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to reassign task")

    return {"message": "Task reassigned", "task_id": task_id, "new_assignee": new_assignee}


# ============================================================================
# QUERY ENDPOINTS
# ============================================================================

@router.get("/query/overdue")
async def get_overdue_tasks(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get overdue tasks"""
    tasks_repo, _, _ = get_repositories()

    user_store = store_id or current_user.get("active_store_id")

    tasks = tasks_repo.find_overdue(store_id=user_store)

    return {"tasks": tasks, "total": len(tasks)}


@router.get("/query/escalated")
async def get_escalated_tasks(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get escalated tasks"""
    tasks_repo, _, _ = get_repositories()

    user_id = current_user.get("user_id")
    user_store = store_id or current_user.get("active_store_id")

    tasks = tasks_repo.find_escalated(user_id=user_id)

    # Filter by store
    if user_store:
        tasks = [t for t in tasks if t.get("store_id") == user_store]

    return {"tasks": tasks, "total": len(tasks)}


@router.get("/query/by-priority/{priority}")
async def get_tasks_by_priority(
    priority: str,
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get tasks by priority"""
    tasks_repo, _, _ = get_repositories()

    user_store = store_id or current_user.get("active_store_id")

    tasks = tasks_repo.find_by_priority(priority=priority, store_id=user_store)

    return {"tasks": tasks, "total": len(tasks), "priority": priority}


# ============================================================================
# ESCALATION ENDPOINTS
# ============================================================================

@router.post("/escalation/process")
async def process_task_escalations(
    priority: Optional[str] = Query(None),
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Process task escalations (can be called by cron job or manually)

    Only ADMIN/SUPERADMIN can trigger escalation processing.
    """
    user_roles = current_user.get("roles", [])

    if not any(role in ["SUPERADMIN", "ADMIN", "AREA_MANAGER"] for role in user_roles):
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN, SUPERADMIN, or AREA_MANAGER can process escalations"
        )

    _, _, escalation_svc = get_repositories()

    user_store = store_id or current_user.get("active_store_id")

    results = escalation_svc.process_all_escalations(
        store_id=user_store,
        priority=priority
    )

    return {
        "message": f"Processed {results['total_checked']} tasks, escalated {results['escalated']}",
        "results": results
    }


@router.get("/escalation/{task_id}/status")
async def get_escalation_status(
    task_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get escalation status for a specific task"""
    _, _, escalation_svc = get_repositories()

    status = escalation_svc.get_escalation_status(task_id)

    return status


@router.post("/{task_id}/escalate")
async def manually_escalate_task(
    task_id: str,
    reason: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """
    Manually escalate a task

    Any user can escalate a task they're working on.
    """
    tasks_repo, _, escalation_svc = get_repositories()

    task = tasks_repo.find_by_id(task_id)

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Check if task can be escalated
    should_escalate, new_level = escalation_svc.should_escalate(task)

    if task.get("escalation_level", 0) >= 3:
        raise HTTPException(
            status_code=400,
            detail="Task already at maximum escalation level"
        )

    # Force escalate to next level
    current_level = task.get("escalation_level", 0)
    new_level = current_level + 1

    success, notif_task_id, escalated_to = escalation_svc.escalate_task(
        task=task,
        new_level=new_level,
        escalated_by=current_user.get("user_id")
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to escalate task")

    return {
        "message": f"Task escalated to level {new_level}",
        "task_id": task_id,
        "escalation_level": new_level,
        "escalated_to": escalated_to,
        "notification_task_id": notif_task_id
    }


@router.get("/escalation/stats")
async def get_escalation_statistics(
    store_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get escalation statistics for a store"""
    tasks_repo, _, _ = get_repositories()

    user_store = store_id or current_user.get("active_store_id")

    # Get tasks by escalation level
    level_0 = tasks_repo.find_many({"store_id": user_store, "escalation_level": 0})
    level_1 = tasks_repo.find_tasks_by_escalation_level(1, user_store)
    level_2 = tasks_repo.find_tasks_by_escalation_level(2, user_store)
    level_3 = tasks_repo.find_tasks_by_escalation_level(3, user_store)

    # Get overdue count
    overdue_count = tasks_repo.get_overdue_count(store_id=user_store)

    return {
        "store_id": user_store,
        "escalation_levels": {
            "level_0": len(level_0),
            "level_1": len(level_1),
            "level_2": len(level_2),
            "level_3": len(level_3)
        },
        "overdue_count": overdue_count,
        "total_escalated": len(level_1) + len(level_2) + len(level_3)
    }
