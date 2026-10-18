import logging
import json
from langchain_core.messages import SystemMessage, HumanMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.supervisor")

SYSTEM_PROMPT = """You are the FounderOS Supervisor Agent.
Your job is to read the startup's current memory context and the founder's message, then determine which specialist agent is best suited to act next:
1. 'validator': Problems, ideal customer profile (ICP), value proposition, initial validation score, risks.
2. 'market_scout': Competitors, market sizing (TAM/SAM/SOM), trends, landscape, defensible wedge.
3. 'business_model': Monetization, pricing tiers, unit economics, lean canvas, CAC/LTV.
4. 'brand_pitch': Naming, tagline, 10-slide pitch deck outline, investor one-pager, elevator pitch.
5. 'launch_planner': 30/60/90 day roadmap, execution checklist, tactical tasks, milestones.

Respond with ONLY valid JSON:
{
  "active_agent": "validator" | "market_scout" | "business_model" | "brand_pitch" | "launch_planner",
  "reasoning": "Brief 1-sentence reason for this specialist selection"
}
"""

async def supervisor_node(state: FounderState) -> dict:
    # If there's an active handoff target requested by a previous specialist, honor it
    handoff = state.get("handoff")
    if handoff and handoff.get("to"):
        to_agent = handoff["to"]
        logger.info(f"Supervisor routing via handoff to: {to_agent}")
        return {
            "active_agent": to_agent,
            "hops": state.get("hops", 0) + 1
        }

    # Otherwise route using the LLM
    messages = state.get("messages", [])
    user_query = messages[-1].content if messages else "Help me build my startup"
    memory_ctx = state.get("memory_context", {})

    facts_summary = "\n".join([f"- {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])[:10]])
    prompt = f"Founder Message: {user_query}\n\nKnown Facts:\n{facts_summary or 'No prior facts'}"

    llm = get_llm("route")
    try:
        response = await llm.ainvoke([
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=prompt)
        ])
        content = response.content.strip()
        # Parse JSON
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

        data = json.loads(content)
        selected_agent = data.get("active_agent", "validator")
        if selected_agent not in ["validator", "market_scout", "business_model", "brand_pitch", "launch_planner"]:
            selected_agent = "validator"
    except Exception as e:
        logger.warning(f"Supervisor parsing error, defaulting to validator: {e}")
        selected_agent = "validator"

    return {
        "active_agent": selected_agent,
        "hops": state.get("hops", 0) + 1
    }

