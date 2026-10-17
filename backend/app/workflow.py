from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, TypedDict
from uuid import uuid4

from langgraph.graph import END, START, StateGraph

from .providers import ProviderError, get_provider
from .store import Store


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def run_agent(store: Store, project_id: str, conversation_id: str | None, task: str, agent_type: str, tenant_id: str, user_id: str, record_ids: list[str] | None = None) -> dict[str, Any]:
    run_id = f"run_{uuid4().hex}"
    store.create_record("run", run_id, project_id, tenant_id, user_id, {"agent_type": agent_type, "status": "running", "provider": "mock", "task": task, "started_at": now()})

    class AgentState(TypedDict, total=False):
        context: list[dict[str, Any]]
        context_ids: set[str]
        passport: dict[str, Any]
        output: dict[str, Any]
        provider: str
        saved: list[str]
        alerts: list[str]

    async def retrieve(state: AgentState) -> AgentState:
        context = store.context(project_id, tenant_id, user_id, record_ids or [])
        return {"context": context, "context_ids": {item["id"] for item in context}}

    async def build_passport(state: AgentState) -> AgentState:
        return {"passport": store.create_passport(project_id, run_id, agent_type, task, list(state["context_ids"]), tenant_id, user_id)}

    async def execute(state: AgentState) -> AgentState:
        provider = get_provider(agent_type)
        output = await provider.generate(agent_type, task, state["context"])
        return {"output": output, "provider": provider.name}

    async def validate(state: AgentState) -> AgentState:
        evidence_ids = set(state["output"].get("recommendation", {}).get("evidence_ids", []))
        if not evidence_ids.issubset(state["context_ids"]):
            raise ProviderError("Provider cited a record outside the authorized context")
        return {}

    async def persist(state: AgentState) -> AgentState:
        saved = store.persist_agent_output(project_id, run_id, conversation_id, agent_type, task, state["output"], tenant_id, user_id)
        return {"saved": saved}

    async def drift(state: AgentState) -> AgentState:
        return {"alerts": store.check_drift(project_id, state["saved"], tenant_id, user_id)}

    graph = StateGraph(AgentState)
    graph.add_node("retrieve_memory", retrieve)
    graph.add_node("build_passport", build_passport)
    graph.add_node("run_agent", execute)
    graph.add_node("validate_output", validate)
    graph.add_node("persist_outputs", persist)
    graph.add_node("check_drift", drift)
    graph.add_edge(START, "retrieve_memory")
    graph.add_edge("retrieve_memory", "build_passport")
    graph.add_edge("build_passport", "run_agent")
    graph.add_edge("run_agent", "validate_output")
    graph.add_edge("validate_output", "persist_outputs")
    graph.add_edge("persist_outputs", "check_drift")
    graph.add_edge("check_drift", END)

    try:
        state = await graph.compile().ainvoke({})
        output = state["output"]
        store.update_record("run", run_id, {"status": "completed", "provider": state["provider"], "output": output, "completed_at": now()})
        return {"run_id": run_id, "status": "completed", "output": output, "passport_id": state["passport"]["id"], "saved_record_ids": state["saved"], "alerts_created": state["alerts"], "evidence_path": store.path(project_id, state["saved"][0], tenant_id, user_id) if state["saved"] else {"nodes": [], "edges": []}}
    except (ProviderError, ValueError) as exc:
        store.update_record("run", run_id, {"status": "failed", "error": str(exc), "completed_at": now()})
        return {"run_id": run_id, "status": "failed", "error": str(exc)}
