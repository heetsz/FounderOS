import logging
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException
from app.memory.falkor import init_founder_graph, graph_for
from app.memory.seed import copy_playbooks_to_founder, seed_demo_founder

logger = logging.getLogger("founderos.api.founders")
router = APIRouter(prefix="/api/founders", tags=["founders"])

class CreateFounderRequest(BaseModel):
    name: str = Field(..., description="Founder's full name")
    startup_name: str = Field(default="", description="Name of the startup")
    idea: str = Field(..., description="One-line elevator pitch or idea description")
    stage: str = Field(default="Ideation", description="Current stage: Ideation, Validation, Prototype, Launch")
    founder_id: str = Field(default="", description="Optional custom ID")

@router.post("")
async def create_founder(req: CreateFounderRequest):
    """
    Creates a new founder, initializes their dedicated FalkorDB graph (fos_{founder_id}),
    and copies standard playbooks.
    """
    try:
        import uuid
        fid = req.founder_id.strip() if req.founder_id.strip() else f"founder_{uuid.uuid4().hex[:8]}"
        res = await init_founder_graph(
            founder_id=fid,
            name=req.name,
            startup_name=req.startup_name,
            idea=req.idea,
            stage=req.stage
        )
        await copy_playbooks_to_founder(fid)
        return {
            "status": "success",
            "founder_id": fid,
            "startup_id": res["startup_id"],
            "session_id": res["session_id"],
            "name": req.name,
            "startup_name": req.startup_name or f"{req.name}'s Venture",
            "idea": req.idea,
            "stage": req.stage
        }
    except Exception as e:
        logger.error(f"Error creating founder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed-demo")
async def seed_demo():
    """Seeds the pre-configured demo founder for immediate testing."""
    try:
        res = await seed_demo_founder("demo_founder")
        return {"status": "success", "data": res}
    except Exception as e:
        logger.error(f"Error seeding demo founder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{founder_id}")
async def get_founder_info(founder_id: str):
    """Retrieves founder and startup metadata from their graph."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (f:Founder)-[:OWNS]->(s:Startup)
        RETURN f.name, s.name, s.idea, s.stage
        """)
        if not res.result_set:
            raise HTTPException(status_code=404, detail="Founder not found")
        row = res.result_set[0]
        return {
            "founder_id": founder_id,
            "name": row[0],
            "startup_name": row[1],
            "idea": row[2],
            "stage": row[3]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

