from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from .schemas import ConversationCreate, ProjectCreate, TaskUpdate


class StoreError(RuntimeError):
    def __init__(self, message: str, code: str = "store_error"):
        super().__init__(message)
        self.code = code


def timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


class Store:
    def __init__(self, path: str):
        self.path_value = path
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row

    def initialize(self) -> None:
        self.db.executescript(
            """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS records (
                id TEXT PRIMARY KEY, type TEXT NOT NULL, tenant_id TEXT NOT NULL,
                project_id TEXT, user_id TEXT NOT NULL, data TEXT NOT NULL,
                version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS edges (
                source_id TEXT NOT NULL, target_id TEXT NOT NULL, relation TEXT NOT NULL,
                tenant_id TEXT NOT NULL, project_id TEXT NOT NULL,
                PRIMARY KEY (source_id, target_id, relation)
            );
            CREATE INDEX IF NOT EXISTS records_scope ON records (tenant_id, project_id, type);
            CREATE INDEX IF NOT EXISTS edges_scope ON edges (tenant_id, project_id);
            """
        )
        self.db.commit()

    def close(self) -> None:
        self.db.close()

    def status(self) -> str:
        return "sqlite"

    def _row(self, row: sqlite3.Row | None) -> dict[str, Any] | None:
        if not row:
            return None
        result = dict(row)
        result["data"] = json.loads(result.pop("data"))
        result.update(result.pop("data"))
        return result

    def create_record(self, type_: str, record_id: str, project_id: str | None, tenant_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        current = timestamp()
        self.db.execute(
            "INSERT OR IGNORE INTO records (id,type,tenant_id,project_id,user_id,data,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
            (record_id, type_, tenant_id, project_id, user_id, json.dumps(data), current, current),
        )
        self.db.commit()
        return self.get_record(type_, record_id, tenant_id, user_id) or {}

    def update_record(self, type_: str, record_id: str, data: dict[str, Any]) -> dict[str, Any]:
        row = self.db.execute("SELECT data, version FROM records WHERE id=? AND type=?", (record_id, type_)).fetchone()
        if not row:
            raise StoreError("Record not found", "not_found")
        current = json.loads(row["data"])
        current.update(data)
        self.db.execute("UPDATE records SET data=?, version=version+1, updated_at=? WHERE id=? AND type=?", (json.dumps(current), timestamp(), record_id, type_))
        self.db.commit()
        result = self.db.execute("SELECT * FROM records WHERE id=?", (record_id,)).fetchone()
        return self._row(result) or {}

    def get_record(self, type_: str, record_id: str, tenant_id: str, user_id: str) -> dict[str, Any] | None:
        row = self.db.execute("SELECT * FROM records WHERE id=? AND type=? AND tenant_id=?", (record_id, type_, tenant_id)).fetchone()
        return self._row(row)

    def require_project(self, project_id: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        project = self.get_project(project_id, tenant_id, user_id)
        if not project:
            raise StoreError("Project not found or not accessible", "not_found")
        return project

    def get_project(self, project_id: str, tenant_id: str, user_id: str) -> dict[str, Any] | None:
        return self.get_record("project", project_id, tenant_id, user_id)

    def list_projects(self, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        return self.list_records("project", None, tenant_id, user_id)

    def list_records(self, type_: str, project_id: str | None, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        query = "SELECT * FROM records WHERE type=? AND tenant_id=?"
        params: list[Any] = [type_, tenant_id]
        if project_id:
            query += " AND project_id=?"
            params.append(project_id)
        query += " ORDER BY created_at DESC"
        return [self._row(row) for row in self.db.execute(query, params).fetchall()]

    def create_project(self, payload: ProjectCreate, tenant_id: str, user_id: str) -> dict[str, Any]:
        project_id = f"project_{uuid4().hex}"
        return self.create_record("project", project_id, project_id, tenant_id, user_id, payload.model_dump())

    def create_conversation(self, project_id: str, payload: ConversationCreate, tenant_id: str, user_id: str) -> dict[str, Any]:
        conversation_id = f"conversation_{uuid4().hex}"
        result = self.create_record("conversation", conversation_id, project_id, tenant_id, user_id, payload.model_dump())
        self.add_edge(project_id, conversation_id, "HAS_CONVERSATION", tenant_id, project_id)
        return result

    def create_message(self, conversation_id: str, role: str, content: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        conversation = self.get_record("conversation", conversation_id, tenant_id, user_id)
        if not conversation:
            raise StoreError("Conversation not found", "not_found")
        message_id = f"message_{uuid4().hex}"
        result = self.create_record("message", message_id, conversation["project_id"], tenant_id, user_id, {"conversation_id": conversation_id, "role": role, "content": content})
        self.add_edge(conversation_id, message_id, "HAS_MESSAGE", tenant_id, conversation["project_id"])
        return result

    def list_messages(self, conversation_id: str, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        return [item for item in self.list_records("message", None, tenant_id, user_id) if item.get("conversation_id") == conversation_id]

    def add_edge(self, source_id: str, target_id: str, relation: str, tenant_id: str, project_id: str) -> None:
        self.db.execute("INSERT OR IGNORE INTO edges VALUES (?,?,?,?,?)", (source_id, target_id, relation, tenant_id, project_id))
        self.db.commit()

    def context(self, project_id: str, tenant_id: str, user_id: str, record_ids: list[str]) -> list[dict[str, Any]]:
        if record_ids:
            return [item for record_id in record_ids if (item := self._scoped_id(record_id, project_id, tenant_id, user_id))]
        records = self.list_records("finding", project_id, tenant_id, user_id) + self.list_records("source", project_id, tenant_id, user_id) + self.list_records("decision", project_id, tenant_id, user_id)
        return records[:20]

    def _scoped_id(self, record_id: str, project_id: str, tenant_id: str, user_id: str) -> dict[str, Any] | None:
        row = self.db.execute("SELECT * FROM records WHERE id=? AND project_id=? AND tenant_id=?", (record_id, project_id, tenant_id)).fetchone()
        return self._row(row)

    def persist_agent_output(self, project_id: str, run_id: str, conversation_id: str | None, agent_type: str, task: str, output: dict[str, Any], tenant_id: str, user_id: str) -> list[str]:
        saved: list[str] = []
        if conversation_id:
            self.create_message(conversation_id, "assistant", output.get("summary", task), tenant_id, user_id)
        source_ids: list[str] = []
        for source in output.get("sources", []):
            record_id = source.get("source_id") or f"source_{uuid4().hex}"
            self.create_record("source", record_id, project_id, tenant_id, user_id, source)
            self.add_edge(run_id, record_id, "PRODUCED", tenant_id, project_id)
            source_ids.append(record_id)
            saved.append(record_id)
        for finding in output.get("findings", []):
            record_id = f"finding_{uuid4().hex}"
            finding_data = {**finding, "source_ids": [item for item in finding.get("source_ids", []) if item in source_ids]}
            self.create_record("finding", record_id, project_id, tenant_id, user_id, finding_data)
            self.add_edge(run_id, record_id, "PRODUCED", tenant_id, project_id)
            for source_id in finding_data["source_ids"]:
                self.add_edge(record_id, source_id, "SUPPORTED_BY", tenant_id, project_id)
            saved.append(record_id)
        recommendation = output.get("recommendation")
        if recommendation:
            record_id = f"decision_{uuid4().hex}"
            data = {**recommendation, "status": "draft", "title": recommendation.get("title", task)}
            self.create_record("decision", record_id, project_id, tenant_id, user_id, data)
            self.add_edge(run_id, record_id, "PRODUCED", tenant_id, project_id)
            for evidence_id in recommendation.get("evidence_ids", []):
                if self._scoped_id(evidence_id, project_id, tenant_id, user_id):
                    self.add_edge(record_id, evidence_id, "SUPPORTED_BY", tenant_id, project_id)
            saved.append(record_id)
        for proposed in output.get("proposed_tasks", []):
            record_id = f"task_{uuid4().hex}"
            self.create_record("task", record_id, project_id, tenant_id, user_id, {**proposed, "status": "todo", "version": 1})
            self.add_edge(run_id, record_id, "PRODUCED", tenant_id, project_id)
            saved.append(record_id)
        self.update_record("run", run_id, {"saved_record_ids": saved})
        return saved

    def create_passport(self, project_id: str, run_id: str, agent_type: str, objective: str, record_ids: list[str], tenant_id: str, user_id: str) -> dict[str, Any]:
        passport_id = f"passport_{uuid4().hex}"
        passport = self.create_record("passport", passport_id, project_id, tenant_id, user_id, {
            "from_run_id": run_id,
            "to_agent": agent_type,
            "objective": objective,
            "record_ids": record_ids,
            "memory_version": self.memory_version(project_id, tenant_id, user_id),
        })
        self.add_edge(run_id, passport_id, "HANDED_OFF_TO", tenant_id, project_id)
        for record_id in record_ids:
            if self._scoped_id(record_id, project_id, tenant_id, user_id):
                self.add_edge(passport_id, record_id, "CITES", tenant_id, project_id)
        return passport

    def memory_version(self, project_id: str, tenant_id: str, user_id: str) -> int:
        return len(self.graph(project_id, None, tenant_id, user_id)["nodes"])

    def check_drift(self, project_id: str, new_record_ids: list[str], tenant_id: str, user_id: str) -> list[str]:
        alerts: list[str] = []
        markers = ("contradict", "decrease", "drop", "not ", "failed", "insufficient")
        for record_id in new_record_ids:
            finding = self._scoped_id(record_id, project_id, tenant_id, user_id)
            if not finding or finding.get("type") != "finding":
                continue
            text = f"{finding.get('claim', '')} {finding.get('detail', '')}".lower()
            if not any(marker in text for marker in markers):
                continue
            for decision in self.list_records("decision", project_id, tenant_id, user_id):
                alert_id = f"alert_{record_id}_{decision['id']}"
                alert = self.create_record("alert", alert_id, project_id, tenant_id, user_id, {
                    "alert_type": "decision_drift",
                    "severity": "medium",
                    "status": "open",
                    "explanation": f"Finding {record_id} may contradict or weaken decision {decision['id']}.",
                    "new_record_id": record_id,
                    "affected_decision_id": decision["id"],
                })
                self.add_edge(record_id, decision["id"], "AFFECTS", tenant_id, project_id)
                alerts.append(alert["id"])
        return alerts

    def search(self, project_id: str, query: str, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        needle = f"%{query.lower()}%"
        rows = self.db.execute("SELECT * FROM records WHERE project_id=? AND tenant_id=? AND lower(data) LIKE ? ORDER BY updated_at DESC LIMIT 50", (project_id, tenant_id, needle)).fetchall()
        return [self._row(row) for row in rows]

    def graph(self, project_id: str, root_id: str | None, tenant_id: str, user_id: str) -> dict[str, Any]:
        records = {item["id"]: item for item in self.list_records("project", project_id, tenant_id, user_id)}
        for type_ in ("conversation", "message", "run", "finding", "source", "decision", "task", "alert"):
            records.update({item["id"]: item for item in self.list_records(type_, project_id, tenant_id, user_id)})
        edges = [dict(row) for row in self.db.execute("SELECT source_id, target_id, relation FROM edges WHERE project_id=? AND tenant_id=?", (project_id, tenant_id)).fetchall()]
        if root_id:
            edges = [edge for edge in edges if edge["source_id"] == root_id or edge["target_id"] == root_id]
            ids = {root_id} | {edge["source_id"] for edge in edges} | {edge["target_id"] for edge in edges}
            records = {key: value for key, value in records.items() if key in ids}
        return {"nodes": list(records.values()), "edges": edges}

    def path(self, project_id: str, record_id: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        graph = self.graph(project_id, None, tenant_id, user_id)
        nodes = {node["id"]: node for node in graph["nodes"]}
        selected = {record_id}
        changed = True
        while changed:
            changed = False
            for edge in graph["edges"]:
                if edge["source_id"] in selected or edge["target_id"] in selected:
                    before = len(selected)
                    selected.update((edge["source_id"], edge["target_id"]))
                    changed = changed or len(selected) != before
        return {"nodes": [nodes[item] for item in selected if item in nodes], "edges": [edge for edge in graph["edges"] if edge["source_id"] in selected and edge["target_id"] in selected]}

    def update_decision(self, decision_id: str, project_id: str, status: str, note: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        decision = self._scoped_id(decision_id, project_id, tenant_id, user_id)
        if not decision or decision.get("type") != "decision":
            raise StoreError("Decision not found", "not_found")
        return self.update_record("decision", decision_id, {"status": status, "approval_note": note, "approved_by": user_id})

    def update_task(self, task_id: str, project_id: str, payload: TaskUpdate, tenant_id: str, user_id: str) -> dict[str, Any]:
        task = self._scoped_id(task_id, project_id, tenant_id, user_id)
        if not task or task.get("type") != "task":
            raise StoreError("Task not found", "not_found")
        if task["version"] != payload.expected_version:
            raise StoreError("Task was changed by another request", "version_conflict")
        changes = payload.model_dump(exclude_none=True)
        changes["version"] = payload.expected_version + 1
        return self.update_record("task", task_id, changes)

    def review_alert(self, alert_id: str, project_id: str, status: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        alert = self._scoped_id(alert_id, project_id, tenant_id, user_id)
        if not alert or alert.get("type") != "alert":
            raise StoreError("Alert not found", "not_found")
        return self.update_record("alert", alert_id, {"status": status, "reviewed_by": user_id})

    def export_project(self, project_id: str, scope: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        graph = self.graph(project_id, None, tenant_id, user_id)
        if scope == "project":
            return {"format": "founderos-json", "scope": scope, "project_id": project_id, **graph}
        if scope == "provenance":
            return {"format": "founderos-json", "scope": scope, "project_id": project_id, "edges": graph["edges"]}
        if scope == "context":
            return {"format": "founderos-json", "scope": scope, "project_id": project_id, "records": self.context(project_id, tenant_id, user_id, [])}
        return {"format": "founderos-json", "scope": "audit", "project_id": project_id, "records": [node for node in graph["nodes"] if node["type"] in {"run", "decision", "alert", "message"}]}

    def seed_demo(self) -> dict[str, Any]:
        tenant_id, user_id = "tenant_demo", "user_demo"
        project = self.get_project("project_parakh_ai", tenant_id, user_id)
        if not project:
            project = self.create_record("project", "project_parakh_ai", "project_parakh_ai", tenant_id, user_id, {"name": "Parakh AI", "description": "Deterministic FounderOS demo project", "goals": ["Validate repeat usage"], "constraints": ["Small founding team"], "status": "active"})
            source = self.create_record("source", "source_demo_interviews", project["id"], tenant_id, user_id, {"title": "Demo customer interviews", "source_type": "demo", "url": "https://example.com/founderos-demo", "excerpt": "Customers need a shorter onboarding flow."})
            finding = self.create_record("finding", "finding_demo_onboarding", project["id"], tenant_id, user_id, {"title": "Onboarding friction", "claim": "Long onboarding may reduce repeat usage.", "epistemic_status": "reported", "confidence": 0.72})
            decision = self.create_record("decision", "decision_demo_onboarding", project["id"], tenant_id, user_id, {"title": "Test shorter onboarding", "rationale": "Validate repeat usage before scaling acquisition.", "status": "approved", "approved_by": user_id})
            task = self.create_record("task", "task_demo_prototype", project["id"], tenant_id, user_id, {"title": "Build a three-step onboarding prototype", "status": "todo", "owner": "execution", "version": 1})
            self.add_edge(finding["id"], source["id"], "SUPPORTED_BY", tenant_id, project["id"])
            self.add_edge(decision["id"], finding["id"], "INFORMS", tenant_id, project["id"])
            self.add_edge(task["id"], decision["id"], "IMPLEMENTS", tenant_id, project["id"])
        return {"project_id": project["id"], "seeded": True, "records": len(self.graph(project["id"], None, tenant_id, user_id)["nodes"])}
