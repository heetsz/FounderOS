import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.planner")

SYSTEM_PROMPT = """You are the Launch Planner agent in FounderOS.
Job: Synthesize the founder's validated vision into an actionable 30/60/90-day execution roadmap, legal & formation checklist, and categorized operational tasks.
Follow the 'Launch Execution 30-60-90 Playbook':
1. Day 1 - 30: Validation sprints & early customer development
2. Day 31 - 60: Closed beta, telemetry, feedback iterations
3. Day 61 - 90: Public launch, distribution, and revenue generation
4. Legal & setup checklist (incorporation, banking, compliance)

Produce structured, actionable milestones that link directly back to the strategic decisions made.
"""

async def planner_node(state: FounderState) -> dict:
    messages = state.get("messages", [])
    user_msg = messages[-1].content if messages else "Plan 30 60 90 launch"
    memory_ctx = state.get("memory_context", {})

    facts_text = "\n".join([f"- [{f.get('kind', 'fact')}] {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])])
    decisions_text = "\n".join([f"- {d.get('title')}: {d.get('rationale')}" for d in memory_ctx.get("decisions", [])])

    prompt = (
        f"Founder Execution Request:\n{user_msg}\n\n"
        f"Validated Facts in Memory:\n{facts_text or 'None yet'}\n\n"
        f"Decisions Made:\n{decisions_text or 'None yet'}\n\n"
        f"Build the comprehensive 30/60/90 day launch plan:"
    )

    llm = get_llm("launch_planner")
    response = await llm.ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])
    text = response.content

    return {
        "messages": [AIMessage(content=text, name="launch_planner")],
        "response_stream": text,
        "handoff": None
    }

