import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.memory.falkor import graph_for

logger = logging.getLogger("founderos.api.artifacts")
router = APIRouter(prefix="/api/artifacts", tags=["artifacts"])

@router.get("")
async def get_artifacts(founder_id: str = Query("demo_founder")):
    """Returns all generated artifacts (Lean Canvas, Pitch Deck, Roadmap, One Pager) with version info."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (a:Artifact)
        RETURN a.id, a.type, a.title, a.content, coalesce(a.version, 1), coalesce(a.updated_at, a.created_at)
        ORDER BY a.version DESC
        """)
        artifacts = []
        for r in (res.result_set or []):
            artifacts.append({
                "id": r[0],
                "type": r[1],
                "title": r[2],
                "content": r[3],
                "version": r[4],
                "updated_at": r[5]
            })
        return artifacts
    except Exception as e:
        logger.error(f"Error fetching artifacts: {e}")
        return []

@router.post("/{artifact_id}/regenerate")
async def regenerate_artifact(artifact_id: str, founder_id: str = Query("demo_founder")):
    """Bumps version of an artifact after revising it."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (a:Artifact {id: $aid})
        SET a.version = a.version + 1, a.updated_at = timestamp()
        RETURN a.id, a.version, a.title
        """, {"aid": artifact_id})
        if not res.result_set:
            raise HTTPException(status_code=404, detail="Artifact not found")
        row = res.result_set[0]
        return {
            "status": "regenerated",
            "id": row[0],
            "version": row[1],
            "title": row[2]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

