import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.model")

SYSTEM_PROMPT = """You are the Business Model agent in FounderOS.
Job: Shape the Lean Canvas, formulate pricing packages/tiers, estimate unit economics (CAC, LTV, Gross Margins, Payback period).
Follow the 'Business Model & Unit Economics Playbook':
1. Lean Canvas summary
2. 3-tier pricing structure
3. Unit economics projection & early break-even milestones

Incorporate existing facts from memory. If pitch deck or naming is requested, suggest handoff to 'brand_pitch'.
"""

async def model_node(state: FounderState) -> dict:
    messages = state.get("messages", [])
    user_msg = messages[-1].content if messages else "Structure business model"
    memory_ctx = state.get("memory_context", {})

    facts_text = "\n".join([f"- [{f.get('kind', 'fact')}] {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])])

    prompt = (
        f"Founder Context:\n{user_msg}\n\n"
        f"Memory Facts from Graph:\n{facts_text or 'None yet'}\n\n"
        f"Provide the complete business model & pricing structure:"
    )

    llm = get_llm("business_model")
    response = await llm.ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])
    text = response.content

    handoff = None
    if state.get("hops", 0) < 2 and ("pitch" in user_msg.lower() or "deck" in user_msg.lower() or "brand" in user_msg.lower()):
        handoff = {
            "to": "brand_pitch",
            "reason": "Business model and pricing formulated. Handoff to Brand & Pitch agent for investor storytelling.",
            "payload": {"source": "business_model"}
        }

    return {
        "messages": [AIMessage(content=text, name="business_model")],
        "response_stream": text,
        "handoff": handoff
    }

