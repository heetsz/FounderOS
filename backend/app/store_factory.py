from .config import settings
from .store import Store


def create_store() -> Store:
    if settings.storage_backend.lower() == "falkordb":
        from .falkor_store import FalkorStore

        return FalkorStore()
    return Store(settings.database_path)
