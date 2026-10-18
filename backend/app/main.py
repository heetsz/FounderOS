import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.memory.seed import seed_global_playbooks, seed_demo_founder
from app.api.founders import router as founders_router
from app.api.chat import router as chat_router
from app.api.memory import router as memory_router
from app.api.artifacts import router as artifacts_router
from app.api.tasks import router as tasks_router
from app.api.simulate import router as simulate_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("founderos.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FounderOS backend...")
    try:
        await seed_global_playbooks()
        # Ensure demo founder exists for immediate zero-config demoing
        await seed_demo_founder("demo_founder")
        logger.info("FalkorDB initialized and demo founder seeded successfully.")
    except Exception as e:
        logger.warning(f"Note during startup initialization: {e}")
    yield
    logger.info("Shutting down FounderOS backend...")

app = FastAPI(
    title="FounderOS API",
    description="Track 2: Agent Memory and Coordination backend backed by FalkorDB graph memory",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(founders_router)
app.include_router(chat_router)
app.include_router(memory_router)
app.include_router(artifacts_router)
app.include_router(tasks_router)
app.include_router(simulate_router)

@app.get("/")
async def root():
    return {
        "app": "FounderOS",
        "description": "Autonomous AI Co-Founder Team with Persistent FalkorDB Memory",
        "track": "Track 2: Agent Memory and Coordination",
        "status": "online"
    }

@app.get("/health")
async def health():
    return {"status": "ok", "falkordb_host": settings.FALKOR_HOST, "falkordb_port": settings.FALKOR_PORT}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)

