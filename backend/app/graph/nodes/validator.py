import logging
import re
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from app.graph.state import FounderState
from app.llm.router import get_llm

logger = logging.getLogger("founderos.node.validator")

SYSTEM_PROMPT = """You are the Idea Validator agent in FounderOS.
Job: Thoroughly critique and validate the founder's idea, analyze the problem urgency, define the Ideal Customer Profile (ICP), identify critical adoption risks, and output a 0-100 Validation Score with precise rationale.
Follow the 'Idea Validation Playbook':
1. Pain point severity & alternatives
2. Hyper-specific ICP
3. Technical/Regulatory/Adoption risks
4. Viability score (0-100)

Include exactly one line formatted as `Validation Score: <integer>/100` in your assessment. The integer must be a numeric score from 0 through 100, based on the evidence provided. Do not use a range or percentage word in place of the number.

Always ground your feedback in known facts stored in the founder's graph memory.
If the founder's idea is solid and needs competitive analysis or market sizing, recommend handing off to 'market_scout'.
"""

async def validator_node(state: FounderState) -> dict:
    messages = state.get("messages", [])
    user_msg = messages[-1].content if messages else "Validate my idea"
    memory_ctx = state.get("memory_context", {})

    facts_text = "\n".join([f"- [{f.get('kind', 'fact')}] {f.get('key')}: {f.get('text')}" for f in memory_ctx.get("facts", [])])
    decisions_text = "\n".join([f"- {d.get('title')}: {d.get('rationale')}" for d in memory_ctx.get("decisions", [])])

    prompt = (
        f"Founder Query / Idea:\n{user_msg}\n\n"
        f"Current Graph Memory Facts:\n{facts_text or 'None yet'}\n\n"
        f"Prior Decisions:\n{decisions_text or 'None yet'}\n\n"
        f"Provide your deep validation assessment now:"
    )

    llm = get_llm("validate")
    response = await llm.ainvoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt)
    ])
    text = response.content

    score_match = re.search(r"(?im)^\s*(?:\*{0,2})?(?:\d+\.\s*)?(?:validation|viability)\s+score\s*(?:\*{0,2})\s*:\s*(\d{1,3})\s*(?:/\s*100)?", text)
    validation_score = min(100, max(0, int(score_match.group(1)))) if score_match else None

    # Determine if handoff should occur (if hops < 2 and competitive research needed)
    handoff = None
    if state.get("hops", 0) < 2 and ("market" in text.lower() or "competitor" in text.lower() or "score" in text.lower()):
        handoff = {
            "to": "market_scout",
            "reason": "Idea validated. Handoff to Market Scout to analyze competitor landscape and TAM/SAM sizing.",
            "payload": {"source": "validator"}
        }

    return {
        "messages": [AIMessage(content=text, name="validator")],
        "response_stream": text,
        "handoff": handoff,
        "validation_score": validation_score
    }

