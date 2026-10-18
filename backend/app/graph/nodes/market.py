import logging
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.market")

SYSTEM_PROMPT = """You are the Market Scout agent in FounderOS.
Job: Map direct competitors, indirect substitutes, estimate market size (TAM, SAM, SOM), pinpoint industry tailwinds/trends, and identify the defensible wedge.
Follow the 'Market Intelligence Playbook':
1. Competitor breakdown (strengths, vulnerabilities, pricing)
2. Sizing: TAM ($B), SAM ($B), SOM ($M)
3. Strategic gap & defensible wedge

Cite relevant facts already in memory.
If the founder needs business model or pricing design, recommend handoff to 'business_model'.
"""

async def market_node(state: FounderState) -> dict:
    messages = state.get("messages", [])
    user_msg = messages[-1].content if messages else "Analyze market"
    memory_ctx = state.get("memory_context", {})

    facts_text = "\n".join([f"- [{f.get('kind', 'fact')}] {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])])

    prompt = (
        f"Founder Query / Context:\n{user_msg}\n\n"
        f"Memory Facts from Graph:\n{facts_text or 'None yet'}\n\n"
        f"Provide your market intelligence analysis:"
    )

    llm = get_llm("market")
    response = await llm.ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])
    text = response.content

    handoff = None
    if state.get("hops", 0) < 2 and ("pricing" in user_msg.lower() or "revenue" in user_msg.lower() or "model" in user_msg.lower()):
        handoff = {
            "to": "business_model",
            "reason": "Market sized and landscape mapped. Handoff to Business Model agent to define pricing and unit economics.",
            "payload": {"source": "market_scout"}
        }

    return {
        "messages": [AIMessage(content=text, name="market_scout")],
        "response_stream": text,
        "handoff": handoff
    }

