import logging
import re
import time
from typing import Any, Dict, List, Optional
from falkordb.asyncio import FalkorDB
from redis.asyncio import BlockingConnectionPool
from app.config import settings

logger = logging.getLogger("founderos.falkor")

# Connection pool setup
pool = BlockingConnectionPool(
    max_connections=100,
    timeout=20,
    decode_responses=True,
    host=settings.FALKOR_HOST,
    port=settings.FALKOR_PORT,
    username=settings.FALKOR_USERNAME or None,
    password=settings.FALKOR_PASSWORD if settings.FALKOR_PASSWORD else None,
)

db = FalkorDB(connection_pool=pool)

def graph_for(founder_id: str):
    """Returns the dedicated FalkorDB graph for a tenant/founder."""
    clean_id = founder_id.replace("-", "_")
    return db.select_graph(f"fos_{clean_id}")

def playbooks_graph():
    """Global template graph for standard playbooks."""
    return db.select_graph("fos_playbooks")

async def bootstrap(g) -> None:
    """Bootstrap indexes on the founder's graph."""
    try:
        await g.query("CREATE INDEX FOR (f:Fact) ON (f.key)")
    except Exception as e:
        logger.debug(f"Fact index creation note: {e}")
    try:
        await g.query("CREATE INDEX FOR (e:Episode) ON (e.id)")
    except Exception as e:
        logger.debug(f"Episode index creation note: {e}")
    try:
        await g.query("CREATE INDEX FOR (p:Playbook) ON (p.name)")
    except Exception as e:
        logger.debug(f"Playbook index note: {e}")
    try:
        await g.query("CREATE INDEX FOR (d:Decision) ON (d.id)")
    except Exception as e:
        logger.debug(f"Decision index note: {e}")
    try:
        await g.query("CREATE INDEX FOR (t:Task) ON (t.id)")
    except Exception as e:
        logger.debug(f"Task index note: {e}")

async def init_founder_graph(founder_id: str, name: str, startup_name: str, idea: str, stage: str = "ideation"):
    """Initialize a new founder graph with Founder, Startup, and initial Session."""
    g = graph_for(founder_id)
    await bootstrap(g)

    query = """
    MERGE (f:Founder {id: $fid})
    ON CREATE SET f.name = $name, f.created_at = $ts
    MERGE (s:Startup {id: $sid})
    ON CREATE SET s.name = $sname, s.idea = $idea, s.stage = $stage, s.created_at = $ts
    MERGE (f)-[:OWNS]->(s)
    MERGE (sess:Session {id: $sess_id})
    ON CREATE SET sess.created_at = $ts, sess.status = 'active'
    MERGE (s)-[:HAS_SESSION]->(sess)
    RETURN f.id, s.id, sess.id
    """
    ts = int(time.time() * 1000)
    sid = f"startup_{founder_id}"
    sess_id = f"sess_{founder_id}_main"
    params = {
        "fid": founder_id,
        "name": name,
        "sid": sid,
        "sname": startup_name or f"{name}'s Venture",
        "idea": idea,
        "stage": stage,
        "sess_id": sess_id,
        "ts": ts
    }
    await g.query(query, params)
    return {"founder_id": founder_id, "startup_id": sid, "session_id": sess_id}

def _legacy_numeric_value(key: Optional[str], text: Optional[str]) -> Optional[float]:
    """Read older score facts that predate the dedicated numeric_value property."""
    if key != "validation_score" or not text:
        return None
    match = re.search(r"(?:validation|viability)\s+score\s*:\s*(\d{1,3})\s*(?:/\s*100)?", text, re.IGNORECASE)
    return float(match.group(1)) if match else None

async def load_memory_context(founder_id: str) -> Dict[str, Any]:
    """
    Reads from FalkorDB:
    - Current (non-superseded) Facts
    - Last 5 Decisions
    - Open Tasks
    - Last 5 Episodes
    - Last Handoffs
    """
    g = graph_for(founder_id)
    now = int(time.time() * 1000)

    # 1. Non-superseded facts
    facts_query = """
    MATCH (f:Fact)
    WHERE NOT (f)<-[:SUPERSEDES]-()
    OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
    RETURN f.key AS key, f.kind AS kind, f.text AS text, f.confidence AS confidence, f.numeric_value AS numeric_value,
           f.updated_at AS updated_at, e.id AS source_episode, e.agent AS source_agent
    ORDER BY f.updated_at DESC
    LIMIT 25
    """
    try:
        facts_res = await g.query(facts_query)
        facts = [
            {
                "key": r[0],
                "kind": r[1],
                "text": r[2],
                "confidence": r[3],
                "numeric_value": r[4] if r[4] is not None else _legacy_numeric_value(r[0], r[2]),
                "updated_at": r[5],
                "source_episode": r[6],
                "source_agent": r[7],
            }
            for r in facts_res.result_set
        ] if facts_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading facts: {e}")
        facts = []

    # 2. Last decisions
    decisions_query = """
    MATCH (d:Decision)
    RETURN d.id AS id, d.title AS title, d.rationale AS rationale, d.ts AS ts
    ORDER BY d.ts DESC
    LIMIT 5
    """
    try:
        decisions_res = await g.query(decisions_query)
        decisions = [
            {"id": r[0], "title": r[1], "rationale": r[2], "ts": r[3]}
            for r in decisions_res.result_set
        ] if decisions_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading decisions: {e}")
        decisions = []

    # 3. Open tasks
    tasks_query = """
    MATCH (t:Task)
    WHERE t.status <> 'done'
    RETURN t.id AS id, t.title AS title, t.status AS status, t.timeframe AS timeframe, t.owner AS owner
    LIMIT 10
    """
    try:
        tasks_res = await g.query(tasks_query)
        tasks = [
            {"id": r[0], "title": r[1], "status": r[2], "timeframe": r[3], "owner": r[4]}
            for r in tasks_res.result_set
        ] if tasks_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading tasks: {e}")
        tasks = []

    # 4. Last 5 episodes
    episodes_query = """
    MATCH (e:Episode)
    RETURN e.id AS id, e.agent AS agent, e.summary AS summary, e.ts AS ts
    ORDER BY e.ts DESC
    LIMIT 5
    """
    try:
        episodes_res = await g.query(episodes_query)
        episodes = [
            {"id": r[0], "agent": r[1], "summary": r[2], "ts": r[3]}
            for r in episodes_res.result_set
        ] if episodes_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading episodes: {e}")
        episodes = []

    # 5. Last handoffs
    handoffs_query = """
    MATCH (a:Episode)-[h:HANDOFF]->(b:Episode)
    RETURN a.agent AS from_agent, b.agent AS to_agent, h.reason AS reason, b.ts AS ts
    ORDER BY b.ts DESC
    LIMIT 10
    """
    try:
        handoffs_res = await g.query(handoffs_query)
        handoffs = [
            {"from_agent": r[0], "to_agent": r[1], "reason": r[2], "ts": r[3]}
            for r in handoffs_res.result_set
        ] if handoffs_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading handoffs: {e}")
        handoffs = []

    # 6. Read Playbooks in the founder's graph
    playbooks_query = """
    MATCH (p:Playbook)
    RETURN p.name AS name, p.steps AS steps, p.version AS version
    """
    try:
        pb_res = await g.query(playbooks_query)
        playbooks = [
            {"name": r[0], "steps": r[1], "version": r[2]}
            for r in pb_res.result_set
        ] if pb_res.result_set else []
    except Exception as e:
        logger.warning(f"Error reading playbooks: {e}")
        playbooks = []

    return {
        "facts": facts,
        "decisions": decisions,
        "tasks": tasks,
        "episodes": episodes,
        "handoffs": handoffs,
        "playbooks": playbooks,
        "timestamp": now
    }

async def write_curation(
    founder_id: str,
    session_id: str,
    agent: str,
    summary: str,
    new_facts: List[Dict[str, Any]],
    decisions: List[Dict[str, Any]] = None,
    tasks: List[Dict[str, Any]] = None,
    artifacts: List[Dict[str, Any]] = None,
    handoff: Optional[Dict[str, Any]] = None,
    prev_episode_id: Optional[str] = None,
    user_message: str = "",
    response: str = ""
) -> Dict[str, Any]:
    """Curator writes the Episode, Facts (with SUPERSEDES), Decisions, Tasks, and Artifacts."""
    g = graph_for(founder_id)
    now = int(time.time() * 1000)
    episode_id = f"ep_{int(now)}_{agent}"

    # Ensure Session exists
    sess_query = """
    MERGE (s:Session {id: $sid})
    ON CREATE SET s.created_at = $ts, s.status = 'active'
    CREATE (e:Episode {id: $eid, agent: $agent, summary: $summary, user_message: $user_message, response: $response, ts: $ts})
    MERGE (s)-[:HAS_EPISODE]->(e)
    MERGE (ag:Agent {id: $agent})
    ON CREATE SET ag.name = $agent
    MERGE (e)-[:BY]->(ag)
    RETURN e.id
    """
    await g.query(sess_query, {
        "sid": session_id,
        "eid": episode_id,
        "agent": agent,
        "summary": summary,
        "user_message": user_message,
        "response": response,
        "ts": now
    })

    # Link Startup to Episode learned facts
    sid = f"startup_{founder_id}"
    await g.query("""
    MERGE (st:Startup {id: $sid})
    """, {"sid": sid})

    written_facts = []
    # Write Facts with SUPERSEDES logic
    for fact in (new_facts or []):
        key = fact.get("key", "").strip()
        kind = fact.get("kind", "general").strip()
        text = fact.get("text", "").strip()
        confidence = float(fact.get("confidence", 0.9))
        numeric_value = fact.get("numeric_value")
        if not key or not text:
            continue

        # Look for existing fact with same key to supersede
        supersede_query = """
        MATCH (old:Fact {key: $key})
        WHERE NOT (old)<-[:SUPERSEDES]-()
        CREATE (new:Fact {key: $key, kind: $kind, text: $text, confidence: $conf, numeric_value: $numeric_value, updated_at: $ts})
        CREATE (new)-[:SUPERSEDES]->(old)
        WITH new
        MATCH (e:Episode {id: $eid}), (st:Startup {id: $sid})
        CREATE (e)-[:LEARNED]->(new)
        CREATE (new)-[:ABOUT]->(st)
        RETURN new.key
        """
        res = await g.query(supersede_query, {
            "key": key,
            "kind": kind,
            "text": text,
            "conf": confidence,
            "numeric_value": numeric_value,
            "ts": now,
            "eid": episode_id,
            "sid": sid
        })

        if not res.result_set:
            # First time writing this fact key
            create_query = """
            CREATE (f:Fact {key: $key, kind: $kind, text: $text, confidence: $conf, numeric_value: $numeric_value, updated_at: $ts})
            WITH f
            MATCH (e:Episode {id: $eid}), (st:Startup {id: $sid})
            CREATE (e)-[:LEARNED]->(f)
            CREATE (f)-[:ABOUT]->(st)
            RETURN f.key
            """
            await g.query(create_query, {
                "key": key,
                "kind": kind,
                "text": text,
                "conf": confidence,
                "numeric_value": numeric_value,
                "ts": now,
                "eid": episode_id,
                "sid": sid
            })

        written_facts.append({
            "key": key,
            "kind": kind,
            "text": text,
            "confidence": confidence,
            "numeric_value": numeric_value,
            "source_episode": episode_id,
            "timestamp": now
        })

    # Write Decisions
    for dec in (decisions or []):
        d_id = dec.get("id") or f"dec_{int(time.time() * 1000)}"
        d_title = dec.get("title", "Strategic Decision")
        d_rationale = dec.get("rationale", "")
        d_fact_keys = dec.get("fact_keys", [])

        dec_query = """
        CREATE (d:Decision {id: $did, title: $title, rationale: $rationale, ts: $ts})
        WITH d
        MATCH (e:Episode {id: $eid})
        CREATE (e)-[:RESULTED_IN]->(d)
        """
        await g.query(dec_query, {
            "did": d_id,
            "title": d_title,
            "rationale": d_rationale,
            "ts": now,
            "eid": episode_id
        })

        # Link decision to supporting facts
        for fkey in d_fact_keys:
            await g.query("""
            MATCH (d:Decision {id: $did}), (f:Fact {key: $fkey})
            WHERE NOT (f)<-[:SUPERSEDES]-()
            CREATE (d)-[:BASED_ON]->(f)
            """, {"did": d_id, "fkey": fkey})

    # Write Tasks
    for tsk in (tasks or []):
        t_id = tsk.get("id") or f"task_{int(time.time() * 1000)}_{len(tsk.get('title', ''))}"
        t_title = tsk.get("title", "")
        t_timeframe = tsk.get("timeframe", "30_days")  # 30_days, 60_days, 90_days
        t_status = tsk.get("status", "todo")
        t_owner = tsk.get("owner", agent)

        task_query = """
        CREATE (t:Task {id: $tid, title: $title, timeframe: $timeframe, status: $status, owner: $owner, created_at: $ts})
        WITH t
        MATCH (e:Episode {id: $eid})
        CREATE (e)-[:GENERATED_TASK]->(t)
        """
        await g.query(task_query, {
            "tid": t_id,
            "title": t_title,
            "timeframe": t_timeframe,
            "status": t_status,
            "owner": t_owner,
            "ts": now,
            "eid": episode_id
        })

    # Write Artifacts
    for art in (artifacts or []):
        art_id = art.get("id") or f"art_{art.get('type', 'doc')}"
        art_type = art.get("type", "document")
        art_title = art.get("title", "Document")
        art_content = art.get("content", "")
        art_version = int(art.get("version", 1))

        art_query = """
        MERGE (a:Artifact {id: $aid})
        ON CREATE SET a.type = $type, a.title = $title, a.content = $content, a.version = $ver, a.created_at = $ts
        ON MATCH SET a.content = $content, a.version = a.version + 1, a.updated_at = $ts
        WITH a
        MATCH (e:Episode {id: $eid})
        CREATE (a)-[:PRODUCED_BY]->(e)
        """
        await g.query(art_query, {
            "aid": art_id,
            "type": art_type,
            "title": art_title,
            "content": art_content,
            "ver": art_version,
            "ts": now,
            "eid": episode_id
        })

    # Write Handoff edge if there was a previous episode in this chain
    if prev_episode_id and handoff:
        handoff_query = """
        MATCH (prev:Episode {id: $prev_id}), (curr:Episode {id: $curr_id})
        CREATE (prev)-[h:HANDOFF {reason: $reason, ts: $ts}]->(curr)
        """
        await g.query(handoff_query, {
            "prev_id": prev_episode_id,
            "curr_id": episode_id,
            "reason": handoff.get("reason", "Specialist handoff"),
            "ts": now
        })

    return {
        "episode_id": episode_id,
        "written_facts": written_facts,
        "timestamp": now
    }

async def get_graph_visualization(founder_id: str) -> Dict[str, Any]:
    """
    Returns nodes and edges formatted for react-force-graph-2d / cytoscape / canvas.
    Colors match the spec:
    - Episode: #0EA5E9
    - Fact: #6366F1
    - Playbook: #10B981
    - Decision: #F59E0B
    - Task: #EC4899
    - Artifact: #64748B
    - Founder / Startup / Agent: specialized
    """
    g = graph_for(founder_id)

    COLOR_MAP = {
        "Episode": "#0EA5E9",
        "Fact": "#6366F1",
        "Playbook": "#10B981",
        "Decision": "#F59E0B",
        "Task": "#EC4899",
        "Artifact": "#64748B",
        "Founder": "#8B5CF6",
        "Startup": "#3B82F6",
        "Agent": "#475569",
        "Session": "#94A3B8"
    }

    nodes = {}
    edges = []

    # Get nodes
    try:
        nodes_res = await g.query("""
        MATCH (n)
        RETURN id(n), labels(n), properties(n)
        LIMIT 200
        """)
        for r in (nodes_res.result_set or []):
            internal_id = str(r[0])
            labels = r[1]
            props = r[2] or {}
            primary_label = labels[0] if labels else "Node"
            
            # Determine title/label for UI
            title = props.get("name") or props.get("title") or props.get("key") or props.get("id") or primary_label
            color = COLOR_MAP.get(primary_label, "#94A3B8")

            nodes[internal_id] = {
                "id": internal_id,
                "label": primary_label,
                "title": title,
                "color": color,
                "properties": props
            }

        # Get edges
        edges_res = await g.query("""
        MATCH (n)-[r]->(m)
        RETURN id(n), type(r), id(m), properties(r)
        LIMIT 300
        """)
        for r in (edges_res.result_set or []):
            src = str(r[0])
            rel = r[1]
            tgt = str(r[2])
            props = r[3] or {}
            edges.append({
                "source": src,
                "target": tgt,
                "label": rel,
                "properties": props
            })
    except Exception as e:
        logger.error(f"Error building graph visualization: {e}")

    return {
        "nodes": list(nodes.values()),
        "edges": edges
    }
