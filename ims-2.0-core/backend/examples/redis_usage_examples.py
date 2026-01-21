# ============================================================================
# IMS 2.0 - Redis Cache Usage Examples
# ============================================================================
"""
Practical examples of using Redis cache in IMS 2.0
"""

from core.cache import get_cache, CacheKeys, cache_result
from datetime import timedelta


# ============================================================================
# Example 1: Caching Product Data
# ============================================================================

def cache_product_example():
    """Cache product data to reduce database queries"""
    cache = get_cache()

    # Store product data
    product_data = {
        "product_id": "PROD-001",
        "name": "Ray-Ban Aviator",
        "mrp": 2500,
        "category": "SUNGLASS",
        "brand": "Ray-Ban"
    }

    # Cache for 1 hour
    cache_key = CacheKeys.format(CacheKeys.PRODUCT, product_id="PROD-001")
    cache.set(cache_key, product_data, ttl=3600)

    # Retrieve from cache
    cached_product = cache.get(cache_key)
    print(f"✅ Cached product: {cached_product}")


# ============================================================================
# Example 2: Using Decorator for Automatic Caching
# ============================================================================

@cache_result(ttl=600, key_prefix="product")
def get_product_by_id(product_id: str):
    """
    This function result will be cached for 10 minutes
    On subsequent calls with same product_id, cache is returned
    """
    print(f"🔍 Fetching product {product_id} from database...")
    # Simulate database query
    return {
        "product_id": product_id,
        "name": "Ray-Ban Aviator",
        "price": 2500
    }


def decorator_example():
    """Using @cache_result decorator"""
    # First call - hits database
    product1 = get_product_by_id("PROD-001")
    print(f"First call: {product1}")

    # Second call - hits cache
    product2 = get_product_by_id("PROD-001")
    print(f"Second call (from cache): {product2}")


# ============================================================================
# Example 3: Rate Limiting API Endpoints
# ============================================================================

def rate_limit_example(user_id: str, endpoint: str, max_requests: int = 100):
    """
    Rate limit: Allow max_requests per hour per user per endpoint
    """
    cache = get_cache()

    # Build rate limit key
    rate_key = CacheKeys.format(
        CacheKeys.RATE_LIMIT,
        endpoint=endpoint.replace("/", ":"),
        user_id=user_id
    )

    # Get current count
    current_count = cache.get(rate_key) or 0

    if int(current_count) >= max_requests:
        print(f"❌ Rate limit exceeded for user {user_id} on {endpoint}")
        return False

    # Increment counter
    cache.incr(rate_key)

    # Set expiration if first request
    if current_count == 0:
        cache.expire(rate_key, 3600)  # 1 hour

    print(f"✅ Request allowed. Count: {int(current_count) + 1}/{max_requests}")
    return True


# ============================================================================
# Example 4: Session Management
# ============================================================================

def session_example():
    """Store user session data in Redis"""
    cache = get_cache()

    user_id = "USER-123"
    session_data = {
        "user_id": user_id,
        "email": "manager@beautyvision.com",
        "role": "STORE_MANAGER",
        "store_id": "STR-001",
        "logged_in_at": "2024-01-21T10:00:00Z"
    }

    # Store session for 24 hours
    session_key = CacheKeys.format(CacheKeys.USER_SESSION, user_id=user_id)
    cache.set(session_key, session_data, ttl=86400)

    # Retrieve session
    session = cache.get(session_key)
    print(f"✅ User session: {session}")

    # Check if user is logged in
    is_logged_in = cache.exists(session_key)
    print(f"✅ User logged in: {is_logged_in}")


# ============================================================================
# Example 5: Inventory Cache (Real-time Stock Updates)
# ============================================================================

def inventory_cache_example():
    """Cache inventory data with automatic invalidation"""
    cache = get_cache()

    store_id = "STR-001"

    # Cache entire store inventory
    inventory_data = [
        {"product_id": "PROD-001", "quantity": 50},
        {"product_id": "PROD-002", "quantity": 30},
        {"product_id": "PROD-003", "quantity": 20}
    ]

    cache_key = CacheKeys.format(CacheKeys.STORE_STOCK, store_id=store_id)
    cache.set(cache_key, inventory_data, ttl=300)  # 5 minutes

    # When inventory changes (sale, transfer), invalidate cache
    # cache.delete(cache_key)

    print(f"✅ Cached inventory: {cache.get(cache_key)}")


# ============================================================================
# Example 6: Low Stock Alerts (Using Sets)
# ============================================================================

def low_stock_alerts_example():
    """Track low stock items using Redis sets"""
    cache = get_cache()

    store_id = "STR-001"
    low_stock_key = CacheKeys.format(CacheKeys.LOW_STOCK, store_id=store_id)

    # Add products with low stock
    cache.sadd(low_stock_key, "PROD-001", "PROD-005", "PROD-010")

    # Check if specific product is low
    is_low = cache.sismember(low_stock_key, "PROD-001")
    print(f"✅ PROD-001 low stock: {is_low}")

    # Get all low stock products
    low_stock_products = cache.smembers(low_stock_key)
    print(f"✅ All low stock: {low_stock_products}")

    # Remove from low stock when restocked
    cache.srem(low_stock_key, "PROD-001")


# ============================================================================
# Example 7: Recent Activity Feed (Using Lists)
# ============================================================================

def activity_feed_example():
    """Store recent activities using Redis lists"""
    cache = get_cache()

    user_id = "USER-123"
    activity_key = f"activity:{user_id}"

    # Add new activities (most recent first)
    activities = [
        {"action": "order_created", "order_id": "ORD-001", "timestamp": "2024-01-21T10:30:00Z"},
        {"action": "payment_received", "amount": 2500, "timestamp": "2024-01-21T10:35:00Z"},
        {"action": "product_added", "product_id": "PROD-001", "timestamp": "2024-01-21T10:40:00Z"}
    ]

    for activity in activities:
        cache.lpush(activity_key, activity)

    # Get last 10 activities
    recent_activities = cache.lrange(activity_key, 0, 9)
    print(f"✅ Recent activities: {recent_activities}")

    # Set expiration for old activities
    cache.expire(activity_key, 86400)  # Keep for 24 hours


# ============================================================================
# Example 8: Real-time Notifications (Pub/Sub)
# ============================================================================

def pubsub_publisher_example():
    """Publish notifications to subscribers"""
    cache = get_cache()

    # Publish order notification
    notification = {
        "type": "order_completed",
        "order_id": "ORD-001",
        "store_id": "STR-001",
        "message": "Order #ORD-001 completed successfully"
    }

    subscribers_count = cache.publish("notifications:store:STR-001", notification)
    print(f"✅ Notification sent to {subscribers_count} subscribers")


def pubsub_subscriber_example():
    """Subscribe to notifications"""
    cache = get_cache()

    # Get pubsub instance
    pubsub = cache.get_pubsub()

    # Subscribe to channel
    pubsub.subscribe("notifications:store:STR-001")

    print("👂 Listening for notifications...")
    # In real application, this would run in background thread/task
    # for message in pubsub.listen():
    #     if message['type'] == 'message':
    #         print(f"📬 Received: {message['data']}")


# ============================================================================
# Example 9: Distributed Lock (Prevent Concurrent Operations)
# ============================================================================

def distributed_lock_example():
    """Prevent concurrent inventory updates"""
    cache = get_cache()

    product_id = "PROD-001"
    lock_key = f"lock:product:{product_id}"

    # Try to acquire lock
    lock_acquired = cache.set(lock_key, "locked", ttl=10)

    if lock_acquired:
        print("🔒 Lock acquired - performing inventory update...")
        # Perform critical operation
        # ... update inventory ...
        # Release lock
        cache.delete(lock_key)
        print("🔓 Lock released")
    else:
        print("⏳ Another process is updating this product. Please wait...")


# ============================================================================
# Example 10: Cache Invalidation Pattern
# ============================================================================

def cache_invalidation_example():
    """Invalidate cache when data changes"""
    cache = get_cache()

    product_id = "PROD-001"

    def get_product_from_cache(product_id: str):
        """Try cache first, fallback to database"""
        cache_key = CacheKeys.format(CacheKeys.PRODUCT, product_id=product_id)

        # Try cache
        product = cache.get(cache_key)
        if product:
            print("✅ From cache")
            return product

        # Fallback to database
        print("🔍 From database")
        product = {"product_id": product_id, "name": "Ray-Ban Aviator", "price": 2500}

        # Store in cache
        cache.set(cache_key, product, ttl=3600)

        return product

    def update_product_price(product_id: str, new_price: float):
        """Update product and invalidate cache"""
        # Update in database
        print(f"💾 Updating price in database to {new_price}")

        # Invalidate cache
        cache_key = CacheKeys.format(CacheKeys.PRODUCT, product_id=product_id)
        cache.delete(cache_key)
        print("🗑️  Cache invalidated")

    # First fetch (from database)
    product1 = get_product_from_cache(product_id)

    # Second fetch (from cache)
    product2 = get_product_from_cache(product_id)

    # Update product
    update_product_price(product_id, 2800)

    # Third fetch (from database again, cache was invalidated)
    product3 = get_product_from_cache(product_id)


# ============================================================================
# Run All Examples
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("IMS 2.0 - Redis Cache Usage Examples")
    print("=" * 60)

    print("\n1. Product Caching")
    print("-" * 60)
    cache_product_example()

    print("\n2. Decorator Caching")
    print("-" * 60)
    decorator_example()

    print("\n3. Rate Limiting")
    print("-" * 60)
    rate_limit_example("USER-123", "/api/v1/products", max_requests=5)
    rate_limit_example("USER-123", "/api/v1/products", max_requests=5)

    print("\n4. Session Management")
    print("-" * 60)
    session_example()

    print("\n5. Inventory Caching")
    print("-" * 60)
    inventory_cache_example()

    print("\n6. Low Stock Alerts")
    print("-" * 60)
    low_stock_alerts_example()

    print("\n7. Activity Feed")
    print("-" * 60)
    activity_feed_example()

    print("\n8. Pub/Sub Notifications")
    print("-" * 60)
    pubsub_publisher_example()

    print("\n9. Distributed Lock")
    print("-" * 60)
    distributed_lock_example()

    print("\n10. Cache Invalidation")
    print("-" * 60)
    cache_invalidation_example()

    print("\n" + "=" * 60)
    print("✅ All Redis cache examples completed successfully!")
    print("=" * 60)
