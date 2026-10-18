import asyncio
import time
import httpx
import sys

# Force safe utf-8 encoding on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

API_URL = "http://127.0.0.1:8000/api/simulate"

async def run_load_test(num_founders: int = 50):
    print(f"[*] Launching FounderOS Load Test with {num_founders} simulated founders...")
    start = time.perf_counter()
    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            resp = await client.post(API_URL, json={"num_founders": num_founders})
            data = resp.json()
            total_sec = time.perf_counter() - start
            print("=" * 60)
            print("CONCURRENCY & TENANCY LOAD TEST RESULTS")
            print("=" * 60)
            print(f"Total simulated founders: {data.get('simulated_founders')}")
            print(f"Active tenant graphs:    {data.get('active_graphs_created')}")
            print(f"Execution time:          {data.get('total_time_seconds')}s")
            print(f"Writes per second:       {data.get('writes_per_second')}/sec")
            print(f"p50 latency:             {data.get('p50_latency_ms')}ms")
            print(f"p95 latency:             {data.get('p95_latency_ms')}ms")
            print(f"Errors:                  {data.get('errors')}")
            print("=" * 60)
        except Exception as e:
            print(f"Load test request failed: {e}")

if __name__ == "__main__":
    asyncio.run(run_load_test(50))

