import time
import asyncio
import logging
from typing import Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter
from app.memory.falkor import graph_for, bootstrap, write_curation, init_founder_graph

logger = logging.getLogger("founderos.api.simulate")
router = APIRouter(prefix="/api/simulate", tags=["simulate"])

class SimulateRequest(BaseModel):
    num_founders: int = Field(default=50, ge=1, le=100, description="Number of parallel founder tenants to simulate")

async def simulate_single_founder(idx: int) -> Dict[str, Any]:
    """Simulates a full onboarding, graph creation, and episodic turn for a single founder tenant."""
    start_t = time.perf_counter()
    founder_id = f"sim_founder_{idx}"
    startup_name = f"Venture_{idx}"
    idea = f"Autonomous AI solution #{idx} with persistent FalkorDB memory."

    g = graph_for(founder_id)
    await bootstrap(g)

    # 1. Initialize tenant graph
    await init_founder_graph(
        founder_id=founder_id,
        name=f"Founder #{idx}",
        startup_name=startup_name,
        idea=idea,
        stage="Validation"
    )

    # 2. Write an Episode and Facts
    facts = [
        {"key": f"tam_metric_{idx}", "kind": "market", "text": f"Estimated initial TAM of ${idx * 1.5:.1f}B", "confidence": 0.92},
        {"key": f"wedge_{idx}", "kind": "strategy", "text": f"Differentiated vertical entry wedge #{idx}", "confidence": 0.88}
    ]
    decisions = [
        {"title": f"Strategic Initiative #{idx}", "rationale": "High-margin defensible position", "fact_keys": [f"tam_metric_{idx}"]}
    ]
    tasks = [
        {"title": f"Complete customer discovery interview #{idx}", "timeframe": "30_days", "status": "todo"}
    ]

    await write_curation(
        founder_id=founder_id,
        session_id=f"sess_{founder_id}_main",
        agent="validator",
        summary=f"Validation completed for simulated founder #{idx}.",
        new_facts=facts,
        decisions=decisions,
        tasks=tasks
    )

    elapsed_ms = (time.perf_counter() - start_t) * 1000
    return {
        "founder_id": founder_id,
        "latency_ms": elapsed_ms,
        "writes_count": 4  # Founder/Startup + Episode + Facts + Decision/Tasks
    }

@router.post("")
async def run_simulation(req: SimulateRequest):
    """
    Spawns N concurrent founder tenants simultaneously in FalkorDB.
    Measures writes per second, p95 latency, and isolated graph creation.
    """
    n = req.num_founders
    start_time = time.perf_counter()

    # Run all N concurrent founder simulations in parallel
    tasks = [simulate_single_founder(i + 1) for i in range(n)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_time = time.perf_counter() - start_time
    valid_results = [r for r in results if isinstance(r, dict)]
    total_writes = sum(r["writes_count"] for r in valid_results)
    latencies = sorted([r["latency_ms"] for r in valid_results])

    p50_latency = latencies[len(latencies) // 2] if latencies else 0
    p95_index = int(len(latencies) * 0.95)
    p95_latency = latencies[p95_index] if latencies else 0
    writes_per_sec = total_writes / total_time if total_time > 0 else 0

    return {
        "simulated_founders": len(valid_results),
        "total_time_seconds": round(total_time, 2),
        "writes_per_second": round(writes_per_sec, 1),
        "p50_latency_ms": round(p50_latency, 1),
        "p95_latency_ms": round(p95_latency, 1),
        "active_graphs_created": len(valid_results),
        "errors": len(results) - len(valid_results)
    }

