import logging
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query, HTTPException
from app.memory.falkor import graph_for

logger = logging.getLogger("founderos.api.tasks")
router = APIRouter(prefix="/api/tasks", tags=["tasks"])

class UpdateTaskRequest(BaseModel):
    status: str = Field(..., description="'todo', 'in_progress', or 'done'")

class CreateTaskRequest(BaseModel):
    title: str
    timeframe: str = "30_days"  # 30_days, 60_days, 90_days
    owner: str = "validator"

@router.get("")
async def get_tasks(founder_id: str = Query("demo_founder")):
    """Returns tasks for the Kanban roadmap (30 / 60 / 90 days)."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (t:Task)
        OPTIONAL MATCH (e:Episode)-[:GENERATED_TASK]->(t)
        RETURN t.id, t.title, coalesce(t.timeframe, '30_days'), coalesce(t.status, 'todo'), coalesce(t.owner, 'agent'), e.summary
        ORDER BY t.created_at DESC
        """)
        tasks = []
        for r in (res.result_set or []):
            tasks.append({
                "id": r[0],
                "title": r[1],
                "timeframe": r[2],
                "status": r[3],
                "owner": r[4],
                "source_decision": r[5] or "Strategic milestone"
            })
        return tasks
    except Exception as e:
        logger.error(f"Error fetching tasks: {e}")
        return []

@router.patch("/{task_id}")
async def update_task(task_id: str, req: UpdateTaskRequest, founder_id: str = Query("demo_founder")):
    """Updates task status for the Kanban board."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (t:Task {id: $tid})
        SET t.status = $status, t.updated_at = timestamp()
        RETURN t.id, t.status
        """, {"tid": task_id, "status": req.status})
        if not res.result_set:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"status": "success", "task_id": task_id, "new_status": req.status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

