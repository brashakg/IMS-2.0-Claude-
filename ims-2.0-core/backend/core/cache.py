# ============================================================================
# IMS 2.0 - Redis Cache Configuration and Utilities
# ============================================================================
"""
Redis cache implementation for IMS 2.0
Provides caching, session storage, and pub/sub capabilities
"""

import json
import redis
from typing import Any, Optional, Union
from datetime import timedelta
import os
import logging

logger = logging.getLogger(__name__)


class RedisCache:
    """
    Redis cache wrapper with common operations
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        password: Optional[str] = None,
        decode_responses: bool = True
    ):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.Redis(
                host=host,
                port=port,
                db=db,
                password=password,
                decode_responses=decode_responses,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            self.redis_client.ping()
            logger.info(f"✅ Redis connected: {host}:{port} (DB: {db})")
        except redis.ConnectionError as e:
            logger.error(f"❌ Redis connection failed: {e}")
            raise

    def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache

        Args:
            key: Cache key

        Returns:
            Value if exists, None otherwise
        """
        try:
            value = self.redis_client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key '{key}': {e}")
            return None

    def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[Union[int, timedelta]] = None
    ) -> bool:
        """
        Set value in cache

        Args:
            key: Cache key
            value: Value to store (will be JSON serialized if dict/list)
            ttl: Time to live in seconds or timedelta

        Returns:
            True if successful, False otherwise
        """
        try:
            # Serialize complex types to JSON
            if isinstance(value, (dict, list)):
                value = json.dumps(value)

            # Convert timedelta to seconds
            if isinstance(ttl, timedelta):
                ttl = int(ttl.total_seconds())

            if ttl:
                return self.redis_client.setex(key, ttl, value)
            else:
                return self.redis_client.set(key, value)
        except Exception as e:
            logger.error(f"Redis SET error for key '{key}': {e}")
            return False

    def delete(self, *keys: str) -> int:
        """
        Delete one or more keys

        Args:
            keys: Keys to delete

        Returns:
            Number of keys deleted
        """
        try:
            return self.redis_client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis DELETE error: {e}")
            return 0

    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Redis EXISTS error for key '{key}': {e}")
            return False

    def expire(self, key: str, seconds: int) -> bool:
        """Set expiration time for key"""
        try:
            return bool(self.redis_client.expire(key, seconds))
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key '{key}': {e}")
            return False

    def ttl(self, key: str) -> int:
        """
        Get remaining time to live for key

        Returns:
            Seconds remaining, -1 if no expiration, -2 if key doesn't exist
        """
        try:
            return self.redis_client.ttl(key)
        except Exception as e:
            logger.error(f"Redis TTL error for key '{key}': {e}")
            return -2

    def keys(self, pattern: str = "*") -> list:
        """Get all keys matching pattern"""
        try:
            return self.redis_client.keys(pattern)
        except Exception as e:
            logger.error(f"Redis KEYS error for pattern '{pattern}': {e}")
            return []

    def flush_db(self) -> bool:
        """Clear all keys in current database (USE WITH CAUTION)"""
        try:
            return self.redis_client.flushdb()
        except Exception as e:
            logger.error(f"Redis FLUSHDB error: {e}")
            return False

    def incr(self, key: str, amount: int = 1) -> int:
        """Increment value (useful for counters, rate limiting)"""
        try:
            return self.redis_client.incr(key, amount)
        except Exception as e:
            logger.error(f"Redis INCR error for key '{key}': {e}")
            return 0

    def decr(self, key: str, amount: int = 1) -> int:
        """Decrement value"""
        try:
            return self.redis_client.decr(key, amount)
        except Exception as e:
            logger.error(f"Redis DECR error for key '{key}': {e}")
            return 0

    # ========================================================================
    # Hash Operations (useful for storing objects)
    # ========================================================================

    def hset(self, name: str, key: str, value: Any) -> int:
        """Set hash field"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            return self.redis_client.hset(name, key, value)
        except Exception as e:
            logger.error(f"Redis HSET error: {e}")
            return 0

    def hget(self, name: str, key: str) -> Optional[Any]:
        """Get hash field"""
        try:
            value = self.redis_client.hget(name, key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis HGET error: {e}")
            return None

    def hgetall(self, name: str) -> dict:
        """Get all hash fields"""
        try:
            return self.redis_client.hgetall(name)
        except Exception as e:
            logger.error(f"Redis HGETALL error: {e}")
            return {}

    def hdel(self, name: str, *keys: str) -> int:
        """Delete hash fields"""
        try:
            return self.redis_client.hdel(name, *keys)
        except Exception as e:
            logger.error(f"Redis HDEL error: {e}")
            return 0

    # ========================================================================
    # List Operations (useful for queues, recent items)
    # ========================================================================

    def lpush(self, key: str, *values: Any) -> int:
        """Push to left of list"""
        try:
            serialized = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in values]
            return self.redis_client.lpush(key, *serialized)
        except Exception as e:
            logger.error(f"Redis LPUSH error: {e}")
            return 0

    def rpush(self, key: str, *values: Any) -> int:
        """Push to right of list"""
        try:
            serialized = [json.dumps(v) if isinstance(v, (dict, list)) else v for v in values]
            return self.redis_client.rpush(key, *serialized)
        except Exception as e:
            logger.error(f"Redis RPUSH error: {e}")
            return 0

    def lpop(self, key: str) -> Optional[Any]:
        """Pop from left of list"""
        try:
            value = self.redis_client.lpop(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
            return None
        except Exception as e:
            logger.error(f"Redis LPOP error: {e}")
            return None

    def lrange(self, key: str, start: int = 0, end: int = -1) -> list:
        """Get range from list"""
        try:
            return self.redis_client.lrange(key, start, end)
        except Exception as e:
            logger.error(f"Redis LRANGE error: {e}")
            return []

    # ========================================================================
    # Set Operations (useful for unique collections)
    # ========================================================================

    def sadd(self, key: str, *members: Any) -> int:
        """Add members to set"""
        try:
            return self.redis_client.sadd(key, *members)
        except Exception as e:
            logger.error(f"Redis SADD error: {e}")
            return 0

    def smembers(self, key: str) -> set:
        """Get all set members"""
        try:
            return self.redis_client.smembers(key)
        except Exception as e:
            logger.error(f"Redis SMEMBERS error: {e}")
            return set()

    def sismember(self, key: str, member: Any) -> bool:
        """Check if member in set"""
        try:
            return bool(self.redis_client.sismember(key, member))
        except Exception as e:
            logger.error(f"Redis SISMEMBER error: {e}")
            return False

    def srem(self, key: str, *members: Any) -> int:
        """Remove members from set"""
        try:
            return self.redis_client.srem(key, *members)
        except Exception as e:
            logger.error(f"Redis SREM error: {e}")
            return 0

    # ========================================================================
    # Pub/Sub Operations (useful for real-time notifications)
    # ========================================================================

    def publish(self, channel: str, message: Any) -> int:
        """Publish message to channel"""
        try:
            if isinstance(message, (dict, list)):
                message = json.dumps(message)
            return self.redis_client.publish(channel, message)
        except Exception as e:
            logger.error(f"Redis PUBLISH error: {e}")
            return 0

    def get_pubsub(self):
        """Get pubsub instance for subscribing"""
        return self.redis_client.pubsub()

    # ========================================================================
    # Utility Methods
    # ========================================================================

    def ping(self) -> bool:
        """Test connection"""
        try:
            return self.redis_client.ping()
        except Exception as e:
            logger.error(f"Redis PING error: {e}")
            return False

    def info(self) -> dict:
        """Get Redis server info"""
        try:
            return self.redis_client.info()
        except Exception as e:
            logger.error(f"Redis INFO error: {e}")
            return {}

    def close(self):
        """Close connection"""
        try:
            self.redis_client.close()
            logger.info("Redis connection closed")
        except Exception as e:
            logger.error(f"Redis CLOSE error: {e}")


# ============================================================================
# Singleton instance
# ============================================================================

# Initialize from environment variables
_redis_cache: Optional[RedisCache] = None


def get_cache() -> RedisCache:
    """
    Get singleton Redis cache instance

    Returns:
        RedisCache instance
    """
    global _redis_cache

    if _redis_cache is None:
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        db = int(os.getenv("REDIS_DB", "0"))
        password = os.getenv("REDIS_PASSWORD")

        _redis_cache = RedisCache(
            host=host,
            port=port,
            db=db,
            password=password
        )

    return _redis_cache


# ============================================================================
# Convenience decorator for caching function results
# ============================================================================

def cache_result(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results

    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        key_prefix: Prefix for cache key

    Example:
        @cache_result(ttl=600, key_prefix="product")
        def get_product(product_id: str):
            return fetch_product_from_db(product_id)
    """
    def decorator(func):
        def wrapper(*args, **kwargs):
            cache = get_cache()

            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = cache.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache HIT: {cache_key}")
                return cached_value

            # Call function and cache result
            logger.debug(f"Cache MISS: {cache_key}")
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)

            return result
        return wrapper
    return decorator


# ============================================================================
# Cache key builders (to maintain consistency)
# ============================================================================

class CacheKeys:
    """Standard cache key patterns"""

    # Products
    PRODUCT = "product:{product_id}"
    PRODUCT_LIST = "products:all"
    PRODUCT_CATEGORY = "products:category:{category}"
    PRODUCT_BARCODE = "product:barcode:{barcode}"

    # Inventory
    STOCK = "stock:{stock_id}"
    STORE_STOCK = "stock:store:{store_id}"
    LOW_STOCK = "stock:low:store:{store_id}"

    # Orders
    ORDER = "order:{order_id}"
    ORDER_LIST = "orders:store:{store_id}"

    # Customers
    CUSTOMER = "customer:{customer_id}"
    CUSTOMER_PHONE = "customer:phone:{phone}"

    # Sessions
    USER_SESSION = "session:{user_id}"

    # Rate limiting
    RATE_LIMIT = "ratelimit:{endpoint}:{user_id}"

    # Payments
    PAYMENT = "payment:{payment_id}"
    PAYMENT_ORDER = "payment:order:{order_id}"

    @staticmethod
    def format(pattern: str, **kwargs) -> str:
        """Format cache key with parameters"""
        return pattern.format(**kwargs)


# ============================================================================
# Example Usage
# ============================================================================

if __name__ == "__main__":
    # Basic usage
    cache = get_cache()

    # Simple key-value
    cache.set("greeting", "Hello World", ttl=60)
    print(cache.get("greeting"))

    # Store complex data
    user_data = {"name": "John", "email": "john@example.com"}
    cache.set("user:123", user_data, ttl=300)
    print(cache.get("user:123"))

    # Counter (rate limiting)
    cache.incr("api:calls:user123")
    print(f"API calls: {cache.get('api:calls:user123')}")

    # Hash (object storage)
    cache.hset("product:456", "name", "Ray-Ban Aviator")
    cache.hset("product:456", "price", 2500)
    print(cache.hgetall("product:456"))

    # List (recent items queue)
    cache.lpush("recent:views", "product:123")
    cache.lpush("recent:views", "product:456")
    print(cache.lrange("recent:views", 0, 9))

    # Set (unique collections)
    cache.sadd("online:users", "user123", "user456")
    print(cache.smembers("online:users"))

    print("\n✅ Redis cache working perfectly!")
