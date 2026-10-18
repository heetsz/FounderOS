from typing import TypedDict, Annotated, Optional, Dict, Any, List
from langgraph.graph.message import add_messages

class FounderState(TypedDict):
    founder_id: str
    startup_id: str
    thread_id: str
    messages: Annotated[List[Any], add_messages]
    memory_context: Dict[str, Any]       # facts, decisions, open tasks, recent handoffs, playbooks
    active_agent: str                    # chosen by supervisor: 'validator', 'market_scout', 'business_model', 'brand_pitch', 'launch_planner'
    routing_reason: Optional[str]        # why the supervisor selected this agent
    handoff: Optional[Dict[str, Any]]    # {"to": "market_scout", "reason": "...", "payload": {...}}
    new_facts: List[Dict[str, Any]]      # produced by the curator
    hops: int                            # count to prevent loops (max 3 hops)
    response_stream: Optional[str]       # text produced by specialist

