from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent.parent / ".env")

def _list_env(name: str, default: str) -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    database_path: str = os.getenv("FOUNDEROS_DATABASE_PATH", str(Path(__file__).resolve().parent.parent / "founderos.db"))
    storage_backend: str = os.getenv("STORAGE_BACKEND", "falkordb")
    falkordb_host: str = os.getenv("FALKORDB_HOST", "localhost")
    falkordb_port: int = int(os.getenv("FALKORDB_PORT", "6379"))
    falkordb_username: str = os.getenv("FALKORDB_USERNAME", "")
    falkordb_password: str = os.getenv("FALKORDB_PASSWORD", "")
    falkordb_graph_name: str = os.getenv("FALKORDB_GRAPH_NAME", "founderos")
    cors_origins: list[str] = None  # type: ignore[assignment]
    demo_tenant_id: str = os.getenv("DEMO_TENANT_ID", "tenant_demo")
    demo_user_id: str = os.getenv("DEMO_USER_ID", "user_demo")
    provider_mode: str = os.getenv("PROVIDER_MODE", "mock")
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    groq_model: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

    def __post_init__(self) -> None:
        if self.cors_origins is None:
            origins = _list_env("CORS_ORIGINS", "http://localhost:5173")
            for local_origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
                if local_origin not in origins:
                    origins.append(local_origin)
            object.__setattr__(
                self,
                "cors_origins",
                origins,
            )


settings = Settings()
