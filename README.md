
# FounderOS 🚀

> An AI co-founder workspace that turns startup ideas into validated decisions, clear roadmaps, and launch-ready artifacts.

FounderOS combines a LangGraph specialist team with persistent, tenant-isolated FalkorDB graph memory. Every founder gets a dedicated graph, so conversations, decisions, facts, and tasks remain connected over time.

## 🔗 Try it

| Resource | Link |
| --- | --- |
| **Live application** | [Open FounderOS](https://founderos-frontend-g1yf.onrender.com/) |
| **Source repository** | [github.com/heetsz/FounderOS](https://github.com/heetsz/FounderOS) |
| **Demo video** | [Watch FounderOS Demo on YouTube](https://www.youtube.com/watch?v=pZT5mFh1x5U) |
| **Medium article** | [I Built an AI Co-Founder That Never Forgets](https://medium.com/@heet.shah123/i-built-an-ai-co-founder-that-never-forgets-d1d398198317?sharedUserId=heet.shah123) |
| **Hackathon track** | **Track 2 - Agent Memory and Coordination** |

<details>
<summary><strong>Quick navigation</strong></summary>

- [What FounderOS does](#what-founderos-does)
- [How it works](#how-it-works)
- [Graph data model](#graph-data-model)
- [Core Cypher queries](#core-cypher-queries)
- [Run locally](#run-locally)
- [Live deployment](#live-deployment)
- [Demo flow](#demo-flow)

</details>

## What FounderOS does

FounderOS gives founders a team of focused AI specialists instead of one generic chatbot:

- **Episodic memory:** Agent turns are stored as immutable `Episode` nodes.
- **Semantic memory:** Facts such as ICP, pricing, competitors, risks, and TAM are stored as `Fact` nodes.
- **Procedural memory:** Reusable specialist playbooks are stored as `Playbook` nodes.
- **Persistent history:** New facts supersede older facts instead of deleting history.
- **Shared coordination:** Specialist agents share the same founder graph and record `HANDOFF` relationships.
- **Tenant isolation:** Each founder receives a separate graph named `fos_{founder_id}`.
- **Execution support:** Decisions, artifacts, and 30/60/90-day tasks are persisted and displayed in the UI.
- **Concurrency demo:** The Simulate screen creates and writes to multiple founder graphs concurrently.

## How it works

```text
Next.js frontend
       |
       | REST + Server-Sent Events
       v
FastAPI backend
       |
       +--> LangGraph supervisor and specialist agents
       |
       +--> FalkorDB / Redis protocol
              |
              +--> fos_{founder_id} tenant graphs
```

### Technology stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** FastAPI, Python, Uvicorn, SSE
- **Agent orchestration:** LangGraph and LangChain
- **Graph memory:** FalkorDB with the asynchronous Python client
- **LLM providers:** Groq and Google Gemini, with a built-in fallback simulation engine
- **Deployment:** Render frontend and backend services, with FalkorDB Cloud for persistent graph storage

## 🧑‍🚀 Specialist team

| Agent | Responsibility |
| --- | --- |
| Supervisor | Reads memory and routes each request to the appropriate specialist |
| Idea Validator | Validates urgency, ICP, risks, and viability |
| Market Scout | Analyzes competitors and TAM/SAM/SOM |
| Business Model | Builds pricing, Lean Canvas, and unit economics |
| Brand and Pitch | Creates positioning, taglines, pitch structure, and investor materials |
| Launch Planner | Produces launch checklists and 30/60/90-day execution plans |
| Memory Curator | Extracts facts, records episodes, writes decisions, and manages supersession |

## 🧠 Graph data model

FounderOS uses one FalkorDB graph per founder. For a founder ID such as `demo_founder`, the graph is `fos_demo_founder`. This provides tenant isolation without mixing unrelated founder memories.

### Memory lifecycle

```text
Founder idea
    ↓
Agent episode
    ↓
Facts + decisions + tasks + artifacts
    ↓
New evidence supersedes old facts
    ↓
Persistent founder memory
```

### Node types

| Node | Important properties | Purpose |
| --- | --- | --- |
| `Founder` | `id`, `name`, `created_at` | Founder identity |
| `Startup` | `id`, `name`, `idea`, `stage` | Startup context |
| `Session` | `id`, `status`, `created_at` | Conversation or work session |
| `Agent` | `id`, `name` | Specialist identity |
| `Episode` | `id`, `agent`, `summary`, `ts` | Immutable agent reflection or response |
| `Fact` | `key`, `kind`, `text`, `confidence`, `updated_at` | Semantic memory |
| `Playbook` | `name`, `steps`, `version`, `agent` | Procedural memory |
| `Decision` | `id`, `title`, `rationale`, `ts` | Strategic decisions |
| `Task` | `id`, `title`, `timeframe`, `status`, `owner` | Execution work |
| `Artifact` | `id`, `type`, `title`, `content`, `version` | Generated documents |

### Relationship types

```text
(Founder)-[:OWNS]->(Startup)
(Startup)-[:HAS_SESSION]->(Session)
(Session)-[:HAS_EPISODE]->(Episode)
(Episode)-[:BY]->(Agent)
(Episode)-[:LEARNED]->(Fact)
(Fact)-[:ABOUT]->(Startup)
(Fact)-[:SUPERSEDES]->(Fact)
(Episode)-[:RESULTED_IN]->(Decision)
(Decision)-[:BASED_ON]->(Fact)
(Episode)-[:GENERATED_TASK]->(Task)
(Artifact)-[:PRODUCED_BY]->(Episode)
(Episode)-[:HANDOFF]->(Episode)
```

## ⚙️ Core Cypher queries

The backend uses parameterized Cypher queries through `backend/app/memory/falkor.py`.

<details>
<summary><strong>Why this graph model?</strong></summary>

- Episodes preserve the history of what an agent said or learned.
- Facts provide reusable semantic memory across future conversations.
- `SUPERSEDES` preserves old information while exposing the latest version.
- Decisions can be traced back to the facts and episodes that supported them.
- Handoffs make multi-agent coordination visible and explainable.

</details>

### Create a founder graph

```cypher
MERGE (f:Founder {id: $fid})
ON CREATE SET f.name = $name, f.created_at = $ts
MERGE (s:Startup {id: $sid})
ON CREATE SET
    s.name = $sname,
    s.idea = $idea,
    s.stage = $stage,
    s.created_at = $ts
MERGE (f)-[:OWNS]->(s)
MERGE (sess:Session {id: $sess_id})
ON CREATE SET sess.created_at = $ts, sess.status = 'active'
MERGE (s)-[:HAS_SESSION]->(sess)
RETURN f.id, s.id, sess.id
```

### Read current facts

Facts are append-only. A newer fact points to the previous fact with `SUPERSEDES`, so the current state can be read without destroying history.

```cypher
MATCH (f:Fact)
WHERE NOT (f)<-[:SUPERSEDES]-()
OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
RETURN
    f.key,
    f.kind,
    f.text,
    f.confidence,
    f.updated_at,
    e.id,
    e.agent
ORDER BY f.updated_at DESC
LIMIT 25
```

### Supersede an existing fact

```cypher
MATCH (old:Fact {key: $key})
WHERE NOT (old)<-[:SUPERSEDES]-()
CREATE (new:Fact {
    key: $key,
    kind: $kind,
    text: $text,
    confidence: $conf,
    updated_at: $ts
})
CREATE (new)-[:SUPERSEDES]->(old)
```

### Record an agent handoff

```cypher
MATCH (previous:Episode {id: $prev_id}),
      (current:Episode {id: $curr_id})
CREATE (previous)-[:HANDOFF {
    reason: $reason,
    ts: $ts
}]->(current)
```

### Explain a decision

```cypher
MATCH (d:Decision {id: $decision_id})
OPTIONAL MATCH (d)-[:BASED_ON]->(f:Fact)
OPTIONAL MATCH (e:Episode)-[:LEARNED]->(f)
RETURN
    d.id,
    d.title,
    d.rationale,
    collect(f.key),
    collect(f.text),
    collect(e.agent)
```

### Graph visualization

The Memory Explorer traverses nodes and relationships from the current founder graph.

```cypher
MATCH (n)
RETURN id(n), labels(n), properties(n)
LIMIT 200

MATCH (n)-[r]->(m)
RETURN id(n), type(r), id(m), properties(r)
LIMIT 400
```

## 🛠️ Run locally

### Prerequisites

- Python 3.11 or newer
- Node.js 18 or newer
- Docker Desktop, for local FalkorDB
- Optional Groq and Google Gemini API keys

### 1. Start FalkorDB

Using Docker Compose:

```bash
docker compose up -d falkordb
```

Or run FalkorDB directly:

```bash
docker pull falkordb/falkordb:latest

docker run -d \
  -p 6379:6379 \
  -p 3001:3000 \
  -v founderos_falkor_data:/data \
  --name founderos-falkordb \
  falkordb/falkordb:latest
```

### 2. Configure the backend

Create `backend/.env` or export these variables in your shell.

```env
FALKOR_HOST=localhost
FALKOR_PORT=6379
FALKOR_USERNAME=
FALKOR_PASSWORD=
GROQ_API_KEY=
GOOGLE_API_KEY=
```

For FalkorDB Cloud, use the connection details shown by your instance.

```env
FALKOR_HOST=your-cloud-host
FALKOR_PORT=your-cloud-port
FALKOR_USERNAME=falkordb
FALKOR_PASSWORD=your-cloud-password
```

Never commit `.env` files or API keys.

Install and start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend initializes graph indexes and seeds the demo founder on startup.

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start Next.js:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### One-command backend + database

To run the local FalkorDB and backend together:

```bash
docker compose up --build
```

Then start the frontend separately from `frontend`.

## ☁️ Live deployment

The current production deployment uses:

- **Frontend:** [https://founderos-frontend-g1yf.onrender.com/](https://founderos-frontend-g1yf.onrender.com/)
- **Backend:** [https://founderos-backend-bs5z.onrender.com/](https://founderos-backend-bs5z.onrender.com/)
- **Database:** FalkorDB Cloud

The Render backend requires these environment variables:

```text
FALKOR_HOST
FALKOR_PORT
FALKOR_USERNAME
FALKOR_PASSWORD
GROQ_API_KEY
GOOGLE_API_KEY
```

The Render frontend requires:

```env
NEXT_PUBLIC_API_URL=https://founderos-backend-bs5z.onrender.com
```

## 🎬 Demo flow

1. Open the [live application](https://founderos-frontend-g1yf.onrender.com/).
2. Create or select a founder workspace.
3. Ask the specialist team a startup question.
4. Observe streaming agent responses and visible handoffs.
5. Open Memory Explorer to inspect facts, episodes, and graph relationships.
6. Review generated artifacts and roadmap tasks.
7. Open Simulate to exercise concurrent founder graph writes.

### 🎥 Demo video

[![Watch FounderOS Demo](https://img.youtube.com/vi/pZT5mFh1x5U/hqdefault.jpg)](https://www.youtube.com/watch?v=pZT5mFh1x5U)

**Watch the full demo:** [FounderOS on YouTube](https://www.youtube.com/watch?v=pZT5mFh1x5U)

### 📝 Read the story behind FounderOS

[I Built an AI Co-Founder That Never Forgets — Read on Medium](https://medium.com/@heet.shah123/i-built-an-ai-co-founder-that-never-forgets-d1d398198317?sharedUserId=heet.shah123)

## 📁 Project structure

```text
FounderOS/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes
│   │   ├── graph/            # LangGraph state, routing, and specialist nodes
│   │   ├── llm/              # Groq, Gemini, and fallback model routing
│   │   ├── memory/           # FalkorDB client, Cypher, seed data
│   │   ├── config.py
│   │   └── main.py
│   ├── scripts/load_test.py  # Concurrent founder simulation
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/app/              # Next.js app router
│   ├── src/components/       # Screens and reusable UI components
│   ├── src/lib/api.ts        # REST and SSE client
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 🏆 Hackathon

**Track 2 - Agent Memory and Coordination**

FounderOS demonstrates how graph-based persistent memory enables AI agents to retain knowledge across sessions, coordinate through shared state, and produce explainable decisions grounded in connected facts and history.

## 📄 License

This project is provided for the hackathon submission and demonstration.
