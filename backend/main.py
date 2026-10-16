from fastapi import FastAPI

app = FastAPI(title="FounderOS API")


@app.get("/")
async def read_root() -> dict[str, str]:
    return {"message": "FounderOS API is running"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
