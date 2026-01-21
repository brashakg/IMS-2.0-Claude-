"""
IMS 2.0 - Database Connection Management
=========================================
MongoDB and Redis connection handling with health checks
"""
import logging
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from redis import asyncio as aioredis
from redis.asyncio import Redis

from .config import settings

logger = logging.getLogger(__name__)


class Database:
    """MongoDB database connection manager"""

    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls):
        """Establish MongoDB connection"""
        try:
            cls.client = AsyncIOMotorClient(
                settings.mongodb_url,
                minPoolSize=settings.mongodb_min_pool_size,
                maxPoolSize=settings.mongodb_max_pool_size,
            )
            cls.db = cls.client[settings.mongodb_db_name]

            # Verify connection
            await cls.client.admin.command("ping")
            logger.info(f"✅ Connected to MongoDB: {settings.mongodb_db_name}")
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {e}")
            raise

    @classmethod
    async def disconnect(cls):
        """Close MongoDB connection"""
        if cls.client:
            cls.client.close()
            logger.info("🔌 Disconnected from MongoDB")

    @classmethod
    async def health_check(cls) -> dict:
        """Check MongoDB health"""
        try:
            if cls.client:
                await cls.client.admin.command("ping")
                return {"status": "healthy", "type": "mongodb"}
            return {"status": "disconnected", "type": "mongodb"}
        except Exception as e:
            return {"status": "unhealthy", "type": "mongodb", "error": str(e)}

    @classmethod
    def get_collection(cls, name: str):
        """Get a collection from the database"""
        if cls.db is None:
            raise RuntimeError("Database not connected")
        return cls.db[name]


class Cache:
    """Redis cache connection manager"""

    client: Optional[Redis] = None

    @classmethod
    async def connect(cls):
        """Establish Redis connection"""
        try:
            cls.client = await aioredis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                encoding="utf-8",
                decode_responses=True,
            )
            # Verify connection
            await cls.client.ping()
            logger.info("✅ Connected to Redis")
        except Exception as e:
            logger.warning(f"⚠️ Redis connection failed (non-critical): {e}")
            cls.client = None

    @classmethod
    async def disconnect(cls):
        """Close Redis connection"""
        if cls.client:
            await cls.client.close()
            logger.info("🔌 Disconnected from Redis")

    @classmethod
    async def health_check(cls) -> dict:
        """Check Redis health"""
        try:
            if cls.client:
                await cls.client.ping()
                return {"status": "healthy", "type": "redis"}
            return {"status": "disconnected", "type": "redis"}
        except Exception as e:
            return {"status": "unhealthy", "type": "redis", "error": str(e)}

    @classmethod
    async def get(cls, key: str) -> Optional[str]:
        """Get value from cache"""
        if cls.client:
            return await cls.client.get(key)
        return None

    @classmethod
    async def set(cls, key: str, value: str, ttl: int = None):
        """Set value in cache"""
        if cls.client:
            ttl = ttl or settings.redis_cache_ttl
            await cls.client.setex(key, ttl, value)

    @classmethod
    async def delete(cls, key: str):
        """Delete value from cache"""
        if cls.client:
            await cls.client.delete(key)


# Dependency injection helpers
async def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency for database access"""
    if Database.db is None:
        raise RuntimeError("Database not initialized")
    return Database.db


async def get_cache() -> Optional[Redis]:
    """FastAPI dependency for cache access"""
    return Cache.client
