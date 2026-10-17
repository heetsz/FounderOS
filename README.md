# FounderOS

FounderOS is a full-stack application with a React frontend and a FastAPI
backend backed by FalkorDB for shared, relationship-aware memory.

## Project structure

```text
FounderOS/
├── Frontend/    # React + Vite application
└── Backend/     # FastAPI application
```

## Prerequisites

- Node.js and npm
- Python 3.12 or later

## Frontend

Install dependencies and start the Vite development server:

```powershell
cd Frontend
npm install
npm run dev
```

The frontend is served at the URL displayed by Vite, typically
`http://localhost:5173`.

To create a production build:

```powershell
npm run build
```

## Backend

Create and activate the Python virtual environment, then install dependencies:

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Start FalkorDB from the repository root before starting the API:

```powershell
docker compose up -d falkordb
```

Start the FastAPI development server:

```powershell
uvicorn main:app --reload
```

The API is served at `http://127.0.0.1:8000`.

- API documentation: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

The backend defaults to FalkorDB and uses mock agent responses until
`PROVIDER_MODE=real` is configured with Groq and/or Gemini credentials. Seed
the deterministic graph demo with:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:8000/api/v1/seed
```

Use `STORAGE_BACKEND=sqlite` only for offline tests when FalkorDB is not
available.
