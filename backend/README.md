# FounderOS backend

The backend is a FastAPI service with tenant-scoped FalkorDB project memory,
graph records and relationships, provider adapters for Groq and Gemini, and a
deterministic mock mode. SQLite is available only as an offline test fallback.

## Setup

```powershell
docker compose up -d falkordb
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Set `STORAGE_BACKEND=falkordb` to use the canonical graph store. The default
`.env.example` selects FalkorDB. The default `PROVIDER_MODE=mock` requires no API keys. Set
`PROVIDER_MODE=real`, configure the provider variables, and choose
`RESEARCH_PROVIDER`, `STRATEGY_PROVIDER`, and `EXECUTION_PROVIDER` to call
Groq or Gemini.

## Run

```powershell
uvicorn main:app --reload
```

The API is available at `http://127.0.0.1:8000`. FalkorDB is stored in the configured `FALKORDB_GRAPH_NAME` graph. Set
`STORAGE_BACKEND=sqlite` only for offline tests; SQLite data is stored at
`founderos.db` unless `FOUNDEROS_DATABASE_PATH` is set.

## Demo and tests

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/v1/seed
python -m pytest -q
```

The seed endpoint is idempotent and creates the Parakh AI demo project with a
source, finding, approved decision, task, and provenance edges.

## Main API routes

- `GET/POST /api/v1/projects`
- `GET/POST /api/v1/projects/{project_id}/conversations`
- `GET/POST /api/v1/conversations/{conversation_id}/messages`
- `POST /api/v1/projects/{project_id}/agents/{agent_type}/run`
- `GET /api/v1/projects/{project_id}/memory/search?q=...`
- `GET /api/v1/projects/{project_id}/memory/graph`
- `GET /api/v1/projects/{project_id}/passports/{passport_id}`
- `GET /api/v1/projects/{project_id}/records/{record_id}/path`
- `GET /api/v1/projects/{project_id}/export?scope=project|context|provenance|audit`
- `GET/POST /api/v1/projects/{project_id}/decisions`
- `GET/PATCH /api/v1/projects/{project_id}/tasks`
- `GET/POST /api/v1/projects/{project_id}/alerts`

Development identity is supplied by `X-Tenant-ID` and `X-User-ID` headers.
When absent, the configured demo identity is used. Production authentication
must replace this development mechanism.

The workflow is implemented with LangGraph and follows:

```text
scope → retrieve graph memory → Context Passport → agent provider
→ validate evidence IDs → persist graph records → Drift Radar → provenance response
```
