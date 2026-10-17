from __future__ import annotations

import json
import re
from typing import Any

from falkordb import FalkorDB

from .config import settings
from .store import Store, StoreError, timestamp


class FalkorStore(Store):
    """FalkorDB-backed implementation of the FounderOS graph store.

    All domain records are `Record` graph nodes and all domain relationships
    are typed graph edges. The SQLite Store remains available for isolated
    tests and offline development only.
    """

    def __init__(self) -> None:
        self.client = FalkorDB(
            host=settings.falkordb_host,
            port=settings.falkordb_port,
            username=settings.falkordb_username or None,
            password=settings.falkordb_password or None,
            socket_timeout=5,
        )
        self.graph_client = self.client.select_graph(settings.falkordb_graph_name)

    def initialize(self) -> None:
        for property_name in ("id", "tenant_id", "project_id"):
            try:
                self._query(f"CREATE INDEX ON :Record({property_name})")
            except StoreError as exc:
                message = str(exc).lower()
                if "already exists" not in message and "already indexed" not in message:
                    raise

    def close(self) -> None:
        self.client.connection.close()

    def status(self) -> str:
        self._query("RETURN 1 AS ready")
        return f"falkordb:{settings.falkordb_graph_name}"

    def _query(self, query: str, params: dict[str, Any] | None = None) -> list[list[Any]]:
        try:
            return self.graph_client.query(query, params=params).result_set
        except Exception as exc:
            raise StoreError(f"FalkorDB query failed: {exc}", "graph_unavailable") from exc

    @staticmethod
    def _record(row: list[Any]) -> dict[str, Any]:
        data = json.loads(row[5]) if isinstance(row[5], str) else (row[5] or {})
        return {
            "id": row[0],
            "type": row[1],
            "tenant_id": row[2],
            "project_id": row[3],
            "user_id": row[4],
            **data,
            "version": row[6],
            "created_at": row[7],
            "updated_at": row[8],
        }

    def _rows(self, query: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        return [self._record(row) for row in self._query(query, params)]

    def create_record(self, type_: str, record_id: str, project_id: str | None, tenant_id: str, user_id: str, data: dict[str, Any]) -> dict[str, Any]:
        current = timestamp()
        self._query(
            """
            MERGE (n:Record {id: $id})
            ON CREATE SET n.type=$type, n.project_id=$project_id, n.tenant_id=$tenant_id,
              n.user_id=$user_id, n.data=$data, n.version=1, n.created_at=$now, n.updated_at=$now
            RETURN n.id
            """,
            {"id": record_id, "type": type_, "project_id": project_id or "", "tenant_id": tenant_id, "user_id": user_id, "data": json.dumps(data), "now": current},
        )
        return self.get_record(type_, record_id, tenant_id, user_id) or {}

    def update_record(self, type_: str, record_id: str, data: dict[str, Any]) -> dict[str, Any]:
        existing = self._query("MATCH (n:Record {id:$id, type:$type}) RETURN n.data, n.version", {"id": record_id, "type": type_})
        if not existing:
            raise StoreError("Record not found", "not_found")
        current = json.loads(existing[0][0]) if isinstance(existing[0][0], str) else {}
        current.update(data)
        self._query("MATCH (n:Record {id:$id, type:$type}) SET n.data=$data, n.version=n.version+1, n.updated_at=$now RETURN n.id", {"id": record_id, "type": type_, "data": json.dumps(current), "now": timestamp()})
        row = self._query("MATCH (n:Record {id:$id}) RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at", {"id": record_id})
        return self._record(row[0])

    def get_record(self, type_: str, record_id: str, tenant_id: str, user_id: str) -> dict[str, Any] | None:
        rows = self._rows(
            "MATCH (n:Record) WHERE n.id=$id AND n.type=$type AND n.tenant_id=$tenant_id RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at",
            {"id": record_id, "type": type_, "tenant_id": tenant_id},
        )
        return rows[0] if rows else None

    def list_records(self, type_: str, project_id: str | None, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        project_filter = " AND n.project_id=$project_id" if project_id else ""
        params: dict[str, Any] = {"type": type_, "tenant_id": tenant_id}
        if project_id:
            params["project_id"] = project_id
        return self._rows(
            f"MATCH (n:Record) WHERE n.type=$type AND n.tenant_id=$tenant_id{project_filter} RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at ORDER BY n.created_at DESC",
            params,
        )

    def add_edge(self, source_id: str, target_id: str, relation: str, tenant_id: str, project_id: str) -> None:
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", relation):
            raise StoreError("Invalid relationship type", "validation_error")
        self._query(
            f"MATCH (a:Record {{id:$source_id, tenant_id:$tenant_id, project_id:$project_id}}), (b:Record {{id:$target_id, tenant_id:$tenant_id, project_id:$project_id}}) MERGE (a)-[:{relation}]->(b)",
            {"source_id": source_id, "target_id": target_id, "tenant_id": tenant_id, "project_id": project_id},
        )

    def _scoped_id(self, record_id: str, project_id: str, tenant_id: str, user_id: str) -> dict[str, Any] | None:
        rows = self._rows(
            "MATCH (n:Record) WHERE n.id=$id AND n.project_id=$project_id AND n.tenant_id=$tenant_id RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at",
            {"id": record_id, "project_id": project_id, "tenant_id": tenant_id},
        )
        return rows[0] if rows else None

    def context(self, project_id: str, tenant_id: str, user_id: str, record_ids: list[str]) -> list[dict[str, Any]]:
        if record_ids:
            return [record for record_id in record_ids if (record := self._scoped_id(record_id, project_id, tenant_id, user_id))]
        return self._rows(
            "MATCH (n:Record) WHERE n.project_id=$project_id AND n.tenant_id=$tenant_id AND n.type IN ['finding','source','decision','question','task'] RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at ORDER BY n.updated_at DESC LIMIT 30",
            {"project_id": project_id, "tenant_id": tenant_id},
        )

    def search(self, project_id: str, query: str, tenant_id: str, user_id: str) -> list[dict[str, Any]]:
        return self._rows(
            "MATCH (n:Record) WHERE n.project_id=$project_id AND n.tenant_id=$tenant_id AND toLower(n.data) CONTAINS toLower($query) RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at ORDER BY n.updated_at DESC LIMIT 50",
            {"project_id": project_id, "tenant_id": tenant_id, "query": query},
        )

    def graph(self, project_id: str, root_id: str | None, tenant_id: str, user_id: str) -> dict[str, Any]:
        if root_id:
            query = """
            MATCH (root:Record {id:$root_id, project_id:$project_id, tenant_id:$tenant_id})-[*0..3]-(n:Record)
            WHERE n.project_id=$project_id AND n.tenant_id=$tenant_id
            WITH collect(DISTINCT root) + collect(DISTINCT n) AS ns
            UNWIND ns AS node
            RETURN DISTINCT node.id,node.type,node.tenant_id,node.project_id,node.user_id,node.data,node.version,node.created_at,node.updated_at
            """
            nodes = self._rows(query, {"root_id": root_id, "project_id": project_id, "tenant_id": tenant_id})
            ids = {node["id"] for node in nodes}
            edges = self._edge_rows(project_id, tenant_id, ids)
        else:
            nodes = self._rows(
                "MATCH (n:Record) WHERE n.project_id=$project_id AND n.tenant_id=$tenant_id RETURN n.id,n.type,n.tenant_id,n.project_id,n.user_id,n.data,n.version,n.created_at,n.updated_at LIMIT 500",
                {"project_id": project_id, "tenant_id": tenant_id},
            )
            edges = self._edge_rows(project_id, tenant_id, {node["id"] for node in nodes})
        return {"nodes": nodes, "edges": edges}

    def _edge_rows(self, project_id: str, tenant_id: str, ids: set[str]) -> list[dict[str, str]]:
        if not ids:
            return []
        rows = self._query(
            "MATCH (a:Record)-[r]->(b:Record) WHERE a.project_id=$project_id AND a.tenant_id=$tenant_id AND b.project_id=$project_id AND b.tenant_id=$tenant_id RETURN a.id, type(r), b.id",
            {"project_id": project_id, "tenant_id": tenant_id},
        )
        return [{"source_id": row[0], "relation": row[1], "target_id": row[2]} for row in rows if row[0] in ids and row[2] in ids]

    def path(self, project_id: str, record_id: str, tenant_id: str, user_id: str) -> dict[str, Any]:
        return self.graph(project_id, record_id, tenant_id, user_id)

    def seed_demo(self) -> dict[str, Any]:
        return Store.seed_demo(self)
