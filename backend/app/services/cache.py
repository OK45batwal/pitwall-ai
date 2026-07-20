import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

_redis: Redis | None = None


async def _get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return _redis


async def get_json(key: str) -> Any | None:
    client = await _get_redis()
    value = await client.get(key)
    return json.loads(value) if value else None


async def set_json(key: str, value: Any, ttl_seconds: int = 60) -> None:
    client = await _get_redis()
    await client.set(key, json.dumps(value), ex=ttl_seconds)
