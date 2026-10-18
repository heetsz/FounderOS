import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.brand")

SYSTEM_PROMPT = """You are the Brand & Pitch agent in FounderOS.
Job: Generate punchy startup name ideas, memorable positioning taglines, a structured 10-slide investor pitch deck outline, and a concise 1-page founder memo.
Follow the 'Brand & Pitch Architecture Playbook':
1. Naming & positioning tagline
2. 10-slide standard pitch deck outline
3. One-pager executive summary

Ground all branding in the founder's validated problem and business model from the graph.
Recommend handoff to 'launch_planner' when ready for operational execution.
"""

async def brand_node(state: FounderState) -> dict:
    messages = state.get("messages", [])
    user_msg = messages[-1].content if messages else "Craft pitch and brand"
    memory_ctx = state.get("memory_context", {})

    facts_text = "\n".join([f"- [{f.get('kind', 'fact')}] {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])])

    prompt = (
        f"Founder Context:\n{user_msg}\n\n"
        f"Memory Facts from Graph:\n{facts_text or 'None yet'}\n\n"
        f"Craft the brand and pitch outline:"
    )

    llm = get_llm("brand_pitch")
    response = await llm.ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])
    text = response.content

    handoff = None
    if state.get("hops", 0) < 2 and ("roadmap" in user_msg.lower() or "launch" in user_msg.lower() or "timeline" in user_msg.lower()):
        handoff = {
            "to": "launch_planner",
            "reason": "Brand and pitch ready. Handoff to Launch Planner to establish 30/60/90 day execution milestones.",
            "payload": {"source": "brand_pitch"}
        }

    return {
        "messages": [AIMessage(content=text, name="brand_pitch")],
        "response_stream": text,
        "handoff": handoff
    }

