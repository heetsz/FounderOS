import logging
import json
from langchain_core.messages import SystemMessage, HumanMessage
from app.graph.state import FounderState
from app.llm.router import get_llm
from app.memory.falkor import write_curation

logger = logging.getLogger("founderos.node.curator")

CURATOR_SYSTEM_PROMPT = """You are the Memory Curator for FounderOS.
After every specialist agent acts, your job is to extract:
1. 'summary': 1-sentence synopsis of what was learned or decided in this episode.
2. 'new_facts': List of distinct factual claims (e.g. ICP, pricing, competitors, risk, metric, market_size).
   Each fact MUST have:
   - 'key': concise lowercase identifier (e.g. 'icp', 'pricing_starter', 'tam_size', 'core_pain', 'competitors')
   - 'kind': category like 'customer', 'pricing', 'competitor', 'market', 'risk', 'metric', 'strategy'
   - 'text': crisp statement of the fact
   - 'confidence': float between 0.8 and 1.0
3. 'decisions': Any concrete strategic choices made (e.g. choosing a specific pricing model or wedge).
   - 'title': short title
   - 'rationale': why this choice was made
   - 'fact_keys': list of fact keys that supported this decision
4. 'tasks': Action items created for the founder or team.
   - 'title': task description
   - 'timeframe': '30_days' | '60_days' | '90_days'
   - 'status': 'todo'
5. 'artifacts': Any formal document produced or updated (e.g. 'lean_canvas', 'pitch_deck', 'roadmap', 'one_pager').
   - 'type': 'lean_canvas' | 'pitch_deck' | 'roadmap' | 'one_pager'
   - 'title': document title
   - 'content': structured markdown content

Respond with ONLY valid JSON:
{
  "summary": "...",
  "new_facts": [...],
  "decisions": [...],
  "tasks": [...],
  "artifacts": [...]
}
"""

async def curator_node(state: FounderState) -> dict:
    founder_id = state.get("founder_id", "demo_founder")
    session_id = state.get("thread_id", f"sess_{founder_id}_main")
    agent = state.get("active_agent", "supervisor")
    messages = state.get("messages", [])
    last_response = state.get("response_stream") or (messages[-1].content if messages else "")

    llm = get_llm("extract")
    prompt = f"Agent '{agent}' produced the following assessment:\n\n{last_response}\n\nExtract the structured memory elements now:"

    try:
        res = await llm.ainvoke([
            SystemMessage(content=CURATOR_SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ])
        content = res.content.strip()
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
    except Exception as e:
        logger.warning(f"Curator extraction fallback triggered: {e}")
        data = {
            "summary": f"Turn completed by {agent} on founder strategy.",
            "new_facts": [
                {
                    "key": f"insight_{agent}",
                    "kind": "strategy",
                    "text": last_response[:140] if last_response else "Strategy validated.",
                    "confidence": 0.90
                }
            ],
            "decisions": [],
            "tasks": [],
            "artifacts": []
        }

    summary = data.get("summary", f"{agent} provided recommendations.")
    new_facts = data.get("new_facts", [])
    validation_score = state.get("validation_score")
    if agent == "validator" and isinstance(validation_score, int):
        new_facts = [fact for fact in new_facts if fact.get("key") != "validation_score"]
        new_facts.append({
            "key": "validation_score",
            "kind": "metric",
            "text": f"Idea viability score: {validation_score}/100",
            "numeric_value": validation_score,
            "confidence": 0.9,
        })
    decisions = data.get("decisions", [])
    tasks = data.get("tasks", [])
    artifacts = data.get("artifacts", [])
    handoff = state.get("handoff")

    # If the response produced a comprehensive section, auto-generate an artifact for it
    if "Lean Canvas" in last_response or agent == "business_model":
        artifacts.append({
            "type": "lean_canvas",
            "title": "Lean Canvas Architecture",
            "content": last_response,
            "version": 1
        })
    elif "Pitch" in last_response or agent == "brand_pitch":
        artifacts.append({
            "type": "pitch_deck",
            "title": "10-Slide Pitch Blueprint",
            "content": last_response,
            "version": 1
        })
    elif "Roadmap" in last_response or agent == "launch_planner":
        artifacts.append({
            "type": "roadmap",
            "title": "30-60-90 Day Execution Roadmap",
            "content": last_response,
            "version": 1
        })

    # Persist all memory into FalkorDB
    curation_result = await write_curation(
        founder_id=founder_id,
        session_id=session_id,
        agent=agent,
        summary=summary,
        new_facts=new_facts,
        decisions=decisions,
        tasks=tasks,
        artifacts=artifacts,
        handoff=handoff,
        user_message=next((message.content for message in reversed(messages) if isinstance(message, HumanMessage)), ""),
        response=last_response,
    )

    logger.info(f"Curator successfully committed episode {curation_result.get('episode_id')} to FalkorDB for {founder_id}")

    return {
        "new_facts": curation_result.get("written_facts", new_facts)
    }

