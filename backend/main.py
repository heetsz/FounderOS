from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.providers import ProviderError, get_provider
from app.schemas import (
    AgentRunRequest,
    AlertReviewRequest,
    ConversationCreate,
    DecisionApprovalRequest,
    MessageCreate,
    ProjectCreate,
    RecordCreate,
    TaskUpdate,
)
from app.store import Store, StoreError
from app.store_factory import create_store
from app.workflow import run_agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.store = create_store()
    app.state.store.initialize()
    yield
    app.state.store.close()


app = FastAPI(title="FounderOS API", version="1.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_store(request: Request) -> Store:
    return request.app.state.store


def identity(
    x_tenant_id: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
) -> tuple[str, str]:
    return x_tenant_id or settings.demo_tenant_id, x_user_id or settings.demo_user_id


def missing(message: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail={"error_code": "not_found", "message": message})


def bad_request(message: str, code: str = "validation_error") -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"error_code": code, "message": message})


@app.exception_handler(StoreError)
async def store_error_handler(_: Request, exc: StoreError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"error_code": exc.code, "message": str(exc)})


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": "FounderOS API is running", "docs": "/docs"}


@app.get("/health")
async def health_check(store: Store = Depends(get_store)) -> dict[str, str]:
    return {"status": "ok", "storage": store.status()}


@app.get("/api/v1/projects")
async def list_projects(store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    return store.list_projects(*user)


@app.post("/api/v1/projects", status_code=201)
async def create_project(payload: ProjectCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    return store.create_project(payload, *user)


@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    project = store.get_project(project_id, *user)
    if not project:
        raise missing("Project not found")
    return project


@app.get("/api/v1/projects/{project_id}/summary")
async def project_summary(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    records = {kind: store.list_records(kind, project_id, *user) for kind in ("conversation", "finding", "source", "decision", "task", "alert", "run")}
    tasks = records["task"]
    return {
        "project_id": project_id,
        "counts": {
            "conversations": len(records["conversation"]),
            "memory": len(records["finding"]) + len(records["source"]),
            "decisions": len(records["decision"]),
            "tasks": len(tasks),
            "alerts": len([item for item in records["alert"] if item.get("status", "open") == "open"]),
        },
        "recent_runs": records["run"][:10],
        "recent_decisions": records["decision"][:10],
        "recent_tasks": tasks[:20],
        "recent_alerts": records["alert"][:10],
    }


def create_project_record(project_id: str, kind: str, payload: RecordCreate, store: Store, user: tuple[str, str]) -> dict[str, Any]:
    tenant_id, user_id = user
    record_id = f"{kind}_{uuid4().hex}"
    data = {"title": payload.title, "content": payload.content, "status": payload.status, "owner": payload.owner}
    if kind == "finding":
        data.update({"claim": payload.content, "epistemic_status": "reported"})
    if kind == "decision":
        data.update({"rationale": payload.content, "evidence_ids": payload.evidence_ids})
    if kind == "task":
        data.update({"description": payload.content, "version": 1})
    record = store.create_record(kind, record_id, project_id, tenant_id, user_id, data)
    for related_id in [*payload.source_ids, *payload.evidence_ids]:
        if store._scoped_id(related_id, project_id, tenant_id, user_id):
            relation = "SUPPORTED_BY" if kind == "finding" else "INFORMS" if kind == "decision" else "IMPLEMENTS"
            store.add_edge(record_id, related_id, relation, tenant_id, project_id)
    return record


@app.post("/api/v1/projects/{project_id}/memory/findings", status_code=201)
async def create_finding(project_id: str, payload: RecordCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return create_project_record(project_id, "finding", payload, store, user)


@app.post("/api/v1/projects/{project_id}/memory/sources", status_code=201)
async def create_source(project_id: str, payload: RecordCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return create_project_record(project_id, "source", payload, store, user)


@app.post("/api/v1/projects/{project_id}/decisions", status_code=201)
async def create_decision(project_id: str, payload: RecordCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return create_project_record(project_id, "decision", payload, store, user)


@app.post("/api/v1/projects/{project_id}/tasks", status_code=201)
async def create_task(project_id: str, payload: RecordCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return create_project_record(project_id, "task", payload, store, user)


@app.get("/api/v1/projects/{project_id}/conversations")
async def list_conversations(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    store.require_project(project_id, *user)
    return store.list_records("conversation", project_id, *user)


@app.post("/api/v1/projects/{project_id}/conversations", status_code=201)
async def create_conversation(project_id: str, payload: ConversationCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.create_conversation(project_id, payload, *user)


@app.get("/api/v1/conversations/{conversation_id}/messages")
async def list_messages(conversation_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    conversation = store.get_record("conversation", conversation_id, *user)
    if not conversation:
        raise missing("Conversation not found")
    return store.list_messages(conversation_id, *user)


@app.post("/api/v1/conversations/{conversation_id}/messages", status_code=202)
async def create_message(conversation_id: str, payload: MessageCreate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    conversation = store.get_record("conversation", conversation_id, *user)
    if not conversation:
        raise missing("Conversation not found")
    message = store.create_message(conversation_id, "user", payload.content, *user)
    run = await run_agent(store, conversation["project_id"], conversation_id, payload.content, payload.agent_type, *user)
    return {"message_id": message["id"], **run}


@app.get("/api/v1/runs/{run_id}")
async def get_run(run_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    run = store.get_record("run", run_id, *user)
    if not run:
        raise missing("Agent run not found")
    return run


@app.post("/api/v1/projects/{project_id}/agents/{agent_type}/run", status_code=202)
async def agent_run(project_id: str, agent_type: str, payload: AgentRunRequest, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    if agent_type not in {"research", "strategy", "execution"}:
        raise bad_request("agent_type must be research, strategy, or execution")
    return await run_agent(store, project_id, payload.conversation_id, payload.task, agent_type, *user, record_ids=payload.record_ids)


@app.get("/api/v1/projects/{project_id}/memory/search")
async def search_memory(project_id: str, q: str = Query(min_length=1), store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    store.require_project(project_id, *user)
    return store.search(project_id, q, *user)


@app.get("/api/v1/projects/{project_id}/memory/graph")
async def graph(project_id: str, root_id: str | None = None, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.graph(project_id, root_id, *user)


@app.get("/api/v1/projects/{project_id}/passports/{passport_id}")
async def passport(project_id: str, passport_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    result = store.get_record("passport", passport_id, *user)
    if not result:
        raise missing("Context Passport not found")
    return result


@app.get("/api/v1/projects/{project_id}/decisions")
async def decisions(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    store.require_project(project_id, *user)
    return store.list_records("decision", project_id, *user)


@app.post("/api/v1/projects/{project_id}/decisions/{decision_id}/approve")
async def approve_decision(project_id: str, decision_id: str, payload: DecisionApprovalRequest, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.update_decision(decision_id, project_id, "approved", payload.note, *user)


@app.get("/api/v1/projects/{project_id}/tasks")
async def tasks(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    store.require_project(project_id, *user)
    return store.list_records("task", project_id, *user)


@app.patch("/api/v1/projects/{project_id}/tasks/{task_id}")
async def update_task(project_id: str, task_id: str, payload: TaskUpdate, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.update_task(task_id, project_id, payload, *user)


@app.get("/api/v1/projects/{project_id}/alerts")
async def alerts(project_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> list[dict[str, Any]]:
    store.require_project(project_id, *user)
    return store.list_records("alert", project_id, *user)


@app.post("/api/v1/projects/{project_id}/alerts/{alert_id}/review")
async def review_alert(project_id: str, alert_id: str, payload: AlertReviewRequest, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.review_alert(alert_id, project_id, payload.status, *user)


@app.get("/api/v1/projects/{project_id}/records/{record_id}/path")
async def record_path(project_id: str, record_id: str, store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    return store.path(project_id, record_id, *user)


@app.get("/api/v1/projects/{project_id}/export")
async def export_project(project_id: str, scope: str = Query(default="project"), store: Store = Depends(get_store), user: tuple[str, str] = Depends(identity)) -> dict[str, Any]:
    store.require_project(project_id, *user)
    if scope not in {"project", "context", "provenance", "audit"}:
        raise bad_request("scope must be project, context, provenance, or audit")
    return store.export_project(project_id, scope, *user)


@app.post("/api/v1/seed", status_code=201)
async def seed(store: Store = Depends(get_store)) -> dict[str, Any]:
    return store.seed_demo()
