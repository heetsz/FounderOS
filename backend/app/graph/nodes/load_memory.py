import logging
from app.graph.state import FounderState
from app.memory.falkor import load_memory_context

logger = logging.getLogger("founderos.node.load_memory")

async def load_memory_node(state: FounderState) -> dict:
    founder_id = state.get("founder_id", "demo_founder")
    logger.info(f"Loading memory for founder: {founder_id}")
    context = await load_memory_context(founder_id)
    return {
        "memory_context": context
    }

