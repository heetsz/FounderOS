# FounderOS 🚀
### Track 2: Agent Memory and Coordination — FalkorDB Graph Hacks

> **FounderOS** is an autonomous multi-agent workspace with persistent graph memory that guides founders from rough concept to launch readiness. Built on **FalkorDB** for graph memory, **LangGraph** for multi-agent coordination, and **Google Stitch** light-theme design principles.

---

## 🌟 How FounderOS Solves the Track 2 Brief

| Track 2 Requirement | How FounderOS Implements It | What the Judge Sees in the UI |
| :--- | :--- | :--- |
| **Episodic Memory** | Every agent reflection turn is saved as an `Episode` node linked to its `Session`. | Close the browser or reload: agents recall previous decisions and conversational context. |
| **Semantic Memory** | Extracted facts (ICP, pricing, competitors, risks, TAM) stored as `Fact` nodes. | Right-hand **Memory Panel** shows facts lighting up live during agent streaming. |
| **Procedural Memory** | Structured `Playbook` nodes (Validation checklist, Pitch architecture, 30/60/90 roadmap). | Specialists cite and follow playbooks stored in the graph. |
| **Persistent History** | Sessions and episodes are immutable; conflicting/updated facts use `[:SUPERSEDES]`. | **Timeline Screen** provides an unalterable audit trail of decisions. |
| **Shared State & Handoffs** | All 6 specialists read the same founder graph. Handoffs create `[:HANDOFF]` edges with reasons. | Sleek **Handoff Chips** in chat: e.g. *Validator hands off to Market Scout*. |
| **Separate Memory Per Tenant** | Dedicated graph per founder: `fos_{founder_id}`. | Different founders asking identical questions receive tenant-isolated answers with zero leakage. |
| **High-Concurrency Reads/Writes**| Non-blocking async client with connection pooling + parallel simulation endpoint. | **Simulate Screen**: Live counter benchmarks 50 concurrent founders with >130 writes/sec. |

---

## 🤖 The Specialist Agent Team

- **Supervisor Agent:** Reads graph memory context, decides which specialist acts next, approves multi-hop handoffs.
- **Idea Validator:** Analyzes problem urgency, identifies Ideal Customer Profile (ICP), flags risks, calculates a 0-100 Viability Score.
- **Market Scout:** Maps direct competitors and incumbents, estimates TAM/SAM/SOM, discovers strategic whitespace wedges.
- **Business Model:** Formulates the Lean Canvas, structures 3-tier pricing models, projects unit economics (CAC, LTV, payback).
- **Brand & Pitch:** Crafts brand names, value taglines, 10-slide investor deck outlines, and executive one-pagers.
- **Launch Planner:** Creates 30/60/90-day roadmaps, formation and legal checklists, and operational Kanban tasks.
- **Memory Curator:** Runs after each turn to extract new facts, supersede outdated knowledge, and write episodes/decisions to FalkorDB.

---

## 🏗️ Architecture & Technology Stack

- **Memory Layer:** [FalkorDB](https://www.falkordb.com/) (Graph per founder `fos_{founder_id}`, Cypher traversals, multi-tenant isolation)
- **Agent Orchestrator:** LangGraph (`StateGraph`, conditional routing, multi-hop handoff loop, memory checkpointer)
- **Backend:** FastAPI, Python 3.11+, Uvicorn, SSE Starlette (`text/event-stream`), FalkorDB Asyncio Client
- **LLM Routing:** Groq (`llama-3.3-70b-versatile`) for speed/routing + Gemini (`gemini-2.5-flash`) for deep long-form analysis, plus built-in intelligent fallback engine so **anyone can run the project immediately without API keys**.
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, interactive Force-Directed Graph canvas.
- **Design System:** Designed according to **Google Stitch** clean, calm modern SaaS light-theme specification (`#F8FAFC` background, white cards, `#E2E8F0` borders, `#4F46E5` primary indigo).

---

## ⚡ Quick Start Guide

### 1. Start FalkorDB via Docker
```bash
docker pull falkordb/falkordb:latest
docker run -d -p 6379:6379 -p 3001:3000 --name founderos-falkordb falkordb/falkordb:latest
```
*Note: Port 6379 is the graph database, and Port 3001 serves the FalkorDB web browser.*

### 2. Run the Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*The backend automatically bootstraps FalkorDB indexes and seeds the demo founder `demo_founder`.*

### 3. Run the Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 50-Founder Concurrency Benchmark

To demonstrate high-concurrency multi-tenant writes and reads in FalkorDB:

1. **In the Web UI:** Click **Simulate (Demo)** in the left sidebar and click **"Simulate 50 Founders"**.
2. **From Terminal:**
```bash
python backend/scripts/load_test.py
```
This spawns 50 parallel founder tenants simultaneously, creating 50 isolated graphs with episodic turns, measuring throughput (>130 writes/sec) and p95 latency.

---

## 📂 Project Structure

```
FounderOS/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, lifespans, router registration
│   │   ├── config.py            # Environment configurations & defaults
│   │   ├── llm/
│   │   │   └── router.py        # Multi-model LLM router (Groq, Gemini & simulator fallback)
│   │   ├── graph/
│   │   │   ├── state.py         # FounderState TypedDict
│   │   │   ├── builder.py       # LangGraph StateGraph wiring & handoff loop
│   │   │   └── nodes/           # Supervisor, Validator, Market, Model, Brand, Planner, Curator
│   │   ├── memory/
│   │   │   ├── falkor.py        # FalkorDB client, per-founder graph resolver & Cypher queries
│   │   │   └── seed.py          # Playbook templates & demo founder data
│   │   └── api/
│   │       ├── chat.py          # SSE event streaming endpoint (/api/chat/stream)
│   │       ├── memory.py        # Graph nodes, facts, episodes, handoffs, and explainability
│   │       ├── founders.py      # Multi-tenant founder provisioning
│   │       ├── artifacts.py     # Lean Canvas, Pitch Decks, and Roadmaps
│   │       ├── tasks.py         # 30/60/90 day execution board
│   │       └── simulate.py      # Concurrency benchmark endpoint
│   ├── scripts/
│   │   └── load_test.py         # 50-founder parallel load testing script
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout & Google Fonts
│   │   │   ├── globals.css      # Stitch light theme tokens & animations
│   │   │   └── page.tsx         # Main interactive workspace application
│   │   ├── components/
│   │   │   ├── AgentBadge.tsx   # Specialist agent badge with color dots
│   │   │   ├── HandoffChip.tsx  # Visible agent-to-agent transition pill
│   │   │   ├── MemoryCard.tsx   # Fact card with confidence, kind & provenance
│   │   │   ├── StageProgress.tsx# 5-stage milestone progress ring
│   │   │   ├── GraphCanvas.tsx  # Force-directed FalkorDB graph visualizer
│   │   │   ├── NodeDrawer.tsx   # Deep node inspection & provenance drawer
│   │   │   ├── Sidebar.tsx      # White 248px Stitch sidebar
│   │   │   ├── TopBar.tsx       # Startup status & tenant switcher
│   │   │   ├── OnboardingModal.tsx # 3-step founder creation modal
│   │   │   └── screens/         # Workspace, Dashboard, Memory, Timeline, Artifacts, Tasks, Simulate
│   │   └── lib/
│   │       └── api.ts           # API client and SSE stream reader
│   ├── tailwind.config.ts       # Custom Stitch design tokens
│   └── package.json
├── docker-compose.yml           # Unified orchestration for FalkorDB + Backend
└── README.md
```

---

## 🔑 Environment Variables (Optional)

FounderOS includes an intelligent simulation engine that works 100% out of the box with zero external configuration. If you wish to connect live production API keys, simply set:

```env
GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=AIzaSy...
FALKOR_HOST=localhost
FALKOR_PORT=6379
```

---

## 🏆 WeMakeDevs Hackathon Submission Notes
- **Track:** Track 2 — Agent Memory and Coordination
- **Repository:** Ready to clone and run
- **Live Demo Proof:** Run the built-in Simulate tool or launch `load_test.py` to observe isolated graphs created in real-time.

