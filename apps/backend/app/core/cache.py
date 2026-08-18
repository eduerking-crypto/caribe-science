"""CacheProvider abstraction — in-memory dict by default; Redis-compatible interface for production."""
import time
from typing import Any, Optional

_cache: dict[str, tuple[float, Any]] = {}


class CacheProvider:
    """Intercambiable por mejor de Redis; misma interfaz (get/set/delete/clear)."""

    def get(self, key: str) -> Any:
        item = _cache.get(key)
        if item is None:
            return None
        expires_at, value = item
        if expires_at is not None and time.time() > expires_at:
            _cache.pop(key, None)
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        expires: float = time.time() + ttl if ttl else 0.0
        _cache[key] = (expires, value)

    def delete(self, key: str) -> None:
        _cache.pop(key, None)

    def clear(self) -> None:
        _cache.clear()


cache: CacheProvider = CacheProvider()

# Aliases usados por proveedores externos (semántica Redis)
get_cache = cache.get
set_cache = cache.set