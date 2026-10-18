import logging
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from app.graph.state import FounderState
from app.graph.nodes import (
    load_memory_node,
    supervisor_node,
    validator_node,
    market_node,
    model_node,
    brand_node,
    planner_node,
    curator_node
)

logger = logging.getLogger("founderos.graph.builder")

AGENTS = {
    "validator": validator_node,
    "market_scout": market_node,
    "business_model": model_node,
    "brand_pitch": brand_node,
    "launch_planner": planner_node
}

def build_founder_graph():
    """Builds and compiles the complete LangGraph orchestrator with memory loop and multi-hop handoffs."""
    builder = StateGraph(FounderState)

    # 1. Add foundational nodes
    builder.add_node("load_memory", load_memory_node)
    builder.add_node("supervisor", supervisor_node)
    builder.add_node("curator", curator_node)

    # 2. Add all specialist nodes
    for name, node_fn in AGENTS.items():
        builder.add_node(name, node_fn)

    # 3. Connect entry edges
    builder.add_edge(START, "load_memory")
    builder.add_edge("load_memory", "supervisor")

    # 4. Supervisor routes to active specialist
    def route_supervisor(state: FounderState):
        agent = state.get("active_agent", "validator")
        if agent not in AGENTS:
            agent = "validator"
        return agent

    builder.add_conditional_edges("supervisor", route_supervisor, list(AGENTS.keys()))

    # 5. Every specialist routes to curator
    for name in AGENTS:
        builder.add_edge(name, "curator")

    # 6. Curator conditional edge: handoff loop (max 3 hops) or end
    def after_curator(state: FounderState):
        h = state.get("handoff")
        hops = state.get("hops", 0)
        if h and h.get("to") in AGENTS and hops < 3:
            logger.info(f"Handoff activated: routing to {h['to']} (hop {hops})")
            return h["to"]
        return "end"

    builder.add_conditional_edges(
        "curator",
        after_curator,
        {**{n: n for n in AGENTS}, "end": END}
    )

    checkpointer = MemorySaver()
    app = builder.compile(checkpointer=checkpointer)
    logger.info("LangGraph orchestrator built and compiled successfully.")
    return app

# Singleton compiled instance
orchestrator = build_founder_graph()

