from pathlib import Path

from fastapi.testclient import TestClient

import main
from app.store import Store


def client(tmp_path: Path) -> TestClient:
    main.app.state.store = Store(str(tmp_path / "test.db"))
    main.app.state.store.initialize()
    return TestClient(main.app)


def test_project_memory_and_isolation(tmp_path: Path) -> None:
    api = client(tmp_path)
    created = api.post("/api/v1/projects", json={"name": "Test project"}).json()
    project_id = created["id"]
    assert api.get(f"/api/v1/projects/{project_id}").status_code == 200
    assert api.get(f"/api/v1/projects/{project_id}", headers={"X-Tenant-ID": "other"}).status_code == 404
    main.app.state.store.close()


def test_seed_and_agent_run(tmp_path: Path) -> None:
    api = client(tmp_path)
    seed = api.post("/api/v1/seed")
    assert seed.status_code == 201
    project_id = seed.json()["project_id"]
    result = api.post(f"/api/v1/projects/{project_id}/agents/strategy/run", json={"task": "Choose the next experiment"})
    assert result.status_code == 202
    assert result.json()["status"] == "completed"
    assert api.get(f"/api/v1/projects/{project_id}/passports/{result.json()['passport_id']}").status_code == 200
    export = api.get(f"/api/v1/projects/{project_id}/export?scope=project")
    assert export.status_code == 200
    assert export.json()["nodes"]
    research = api.post(f"/api/v1/projects/{project_id}/agents/research/run", json={"task": "Contradictory evidence: repeat usage dropped"})
    assert research.json()["alerts_created"]
    main.app.state.store.close()
