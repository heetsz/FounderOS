import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.memory.falkor import graph_for, get_graph_visualization

logger = logging.getLogger("founderos.api.memory")
router = APIRouter(prefix="/api/memory", tags=["memory"])

@router.get("/graph")
async def get_memory_graph(founder_id: str = Query("demo_founder")):
    """Returns nodes and edges formatted for interactive graph visualization in Memory Explorer."""
    try:
        data = await get_graph_visualization(founder_id)
        return data
    except Exception as e:
        logger.error(f"Error fetching memory graph: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/facts")
async def get_facts(founder_id: str = Query("demo_founder")):
    """Returns all non-superseded facts for the founder."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (f:Fact)
        WHERE NOT (f)<-[:SUPERSEDES]-()
        OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
        RETURN f.key, f.kind, f.text, f.confidence, f.updated_at, e.id, e.agent
        ORDER BY f.updated_at DESC
        LIMIT 50
        """)
        facts = []
        for r in (res.result_set or []):
            facts.append({
                "key": r[0],
                "kind": r[1] or "general",
                "text": r[2],
                "confidence": r[3] or 0.9,
                "updated_at": r[4],
                "source_episode": r[5],
                "source_agent": r[6]
            })
        return facts
    except Exception as e:
        logger.error(f"Error fetching facts: {e}")
        return []

@router.get("/episodes")
async def get_episodes(founder_id: str = Query("demo_founder")):
    """Returns all episodes for timeline & history."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (e:Episode)
        OPTIONAL MATCH (e)-[:BY]->(ag:Agent)
        RETURN e.id, coalesce(ag.name, e.agent), e.summary, e.ts
        ORDER BY e.ts DESC
        LIMIT 50
        """)
        episodes = []
        for r in (res.result_set or []):
            episodes.append({
                "id": r[0],
                "agent": r[1] or "validator",
                "summary": r[2] or "Agent reflection turn.",
                "ts": r[3]
            })
        return episodes
    except Exception as e:
        logger.error(f"Error fetching episodes: {e}")
        return []

@router.get("/handoffs")
async def get_handoffs(founder_id: str = Query("demo_founder")):
    """Returns handoff history between specialist agents."""
    g = graph_for(founder_id)
    try:
        res = await g.query("""
        MATCH (a:Episode)-[h:HANDOFF]->(b:Episode)
        RETURN a.agent, b.agent, h.reason, b.ts, a.id, b.id
        ORDER BY b.ts DESC
        LIMIT 30
        """)
        handoffs = []
        for r in (res.result_set or []):
            handoffs.append({
                "from_agent": r[0],
                "to_agent": r[1],
                "reason": r[2],
                "ts": r[3],
                "from_episode": r[4],
                "to_episode": r[5]
            })
        return handoffs
    except Exception as e:
        logger.error(f"Error fetching handoffs: {e}")
        return []

@router.get("/explain")
async def explain_decision(founder_id: str = Query("demo_founder"), decision_id: Optional[str] = None):
    """
    Explainability query: Why did the agent recommend this decision?
    Traverses from Decision -> BASED_ON -> Fact <- LEARNED <- Episode.
    """
    g = graph_for(founder_id)
    try:
        if decision_id:
            query = """
            MATCH (d:Decision {id: $did})
            OPTIONAL MATCH (d)-[:BASED_ON]->(f:Fact)
            OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
            RETURN d.id, d.title, d.rationale, collect(f.key), collect(f.text), collect(e.agent)
            """
            res = await g.query(query, {"did": decision_id})
        else:
            query = """
            MATCH (d:Decision)
            OPTIONAL MATCH (d)-[:BASED_ON]->(f:Fact)
            OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
            RETURN d.id, d.title, d.rationale, collect(f.key), collect(f.text), collect(e.agent)
            LIMIT 5
            """
            res = await g.query(query)

        explanations = []
        for r in (res.result_set or []):
            explanations.append({
                "decision_id": r[0],
                "title": r[1],
                "rationale": r[2],
                "fact_keys": r[3] or [],
                "fact_texts": r[4] or [],
                "agents_involved": list(set(r[5] or []))
            })
        return explanations
    except Exception as e:
        logger.error(f"Error fetching explanation: {e}")
        return []

