import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    FALKOR_HOST: str = os.getenv("FALKOR_HOST", "localhost")
    FALKOR_PORT: int = int(os.getenv("FALKOR_PORT", "6379"))
    FALKOR_USERNAME: str = os.getenv("FALKOR_USERNAME", "")
    FALKOR_PASSWORD: str = os.getenv("FALKOR_PASSWORD", "")
    API_PORT: int = int(os.getenv("PORT", "8000"))
    API_HOST: str = os.getenv("HOST", "0.0.0.0")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
