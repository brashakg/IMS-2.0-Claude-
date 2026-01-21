"""
IMS 2.0 - FastAPI Main Application
===================================
Main entry point for the API server
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging
from datetime import datetime

from .config import settings
from .database import Database, Cache
from .middleware import (
    limiter,
    sanitize_request_body,
    add_security_headers
)
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import routers
from .routers import (
    auth_router,
    users_router,
    stores_router,
    products_router,
    inventory_router,
    customers_router,
    orders_router,
    prescriptions_router,
    vendors_router,
    tasks_router,
    expenses_router,
    hr_router,
    workshop_router,
    reports_router,
    settings_router,
    integrations_router,
    ai_router,
    approvals_router,
    payments_router
)

# Track startup time
startup_time: datetime = None


# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    global startup_time
    # Startup
    logger.info("🚀 Starting IMS 2.0 API Server...")
    logger.info(f"   Environment: {settings.environment}")
    logger.info(f"   Debug: {settings.debug}")
    startup_time = datetime.utcnow()

    # Connect to databases
    try:
        await Database.connect()
        await Cache.connect()
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        if settings.environment == "production":
            raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down IMS 2.0 API Server...")
    await Database.disconnect()
    await Cache.disconnect()


# Create FastAPI application
app = FastAPI(
    title="IMS 2.0 - Retail Operating System",
    description="Complete Optical & Lifestyle Retail Operating System API",
    version=settings.app_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    return await add_security_headers(request, call_next)

# Input sanitization middleware
@app.middleware("http")
async def input_sanitization_middleware(request: Request, call_next):
    await sanitize_request_body(request)
    return await call_next(request)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.debug else "An error occurred"
        }
    )


# Health check endpoint - basic
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check for load balancers"""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "version": settings.app_version
    }


# Health check endpoint - detailed
@app.get("/health/detailed", tags=["Health"])
async def health_check_detailed():
    """Detailed health check with dependency status"""
    mongo_health = await Database.health_check()
    redis_health = await Cache.health_check()

    # Determine overall status
    overall_status = "healthy"
    if mongo_health["status"] != "healthy":
        overall_status = "degraded" if redis_health["status"] == "healthy" else "unhealthy"

    uptime = None
    if startup_time:
        uptime = (datetime.utcnow() - startup_time).total_seconds()

    return {
        "status": overall_status,
        "service": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": uptime,
        "dependencies": {
            "mongodb": mongo_health,
            "redis": redis_health
        }
    }


# Ready check for Kubernetes
@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Kubernetes readiness probe"""
    mongo_health = await Database.health_check()

    if mongo_health["status"] != "healthy":
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "reason": "database_unavailable"}
        )

    return {"status": "ready"}


# Live check for Kubernetes
@app.get("/live", tags=["Health"])
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "IMS 2.0 - Retail Operating System API",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else None,
        "health": "/health"
    }


# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])
app.include_router(stores_router, prefix="/api/v1/stores", tags=["Stores"])
app.include_router(products_router, prefix="/api/v1/products", tags=["Products"])
app.include_router(inventory_router, prefix="/api/v1/inventory", tags=["Inventory"])
app.include_router(customers_router, prefix="/api/v1/customers", tags=["Customers"])
app.include_router(orders_router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(prescriptions_router, prefix="/api/v1/prescriptions", tags=["Prescriptions"])
app.include_router(vendors_router, prefix="/api/v1/vendors", tags=["Vendors"])
app.include_router(tasks_router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(expenses_router, prefix="/api/v1/expenses", tags=["Expenses"])
app.include_router(hr_router, prefix="/api/v1/hr", tags=["HR"])
app.include_router(workshop_router, prefix="/api/v1/workshop", tags=["Workshop"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(settings_router, prefix="/api/v1/settings", tags=["Settings"])
app.include_router(integrations_router, prefix="/api/v1/integrations", tags=["Integrations"])
app.include_router(ai_router, prefix="/api/v1/ai", tags=["AI Intelligence"])
app.include_router(approvals_router, prefix="/api/v1/approvals", tags=["Approvals"])
app.include_router(payments_router, prefix="/api/v1/payments", tags=["Payments"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        workers=1 if settings.debug else settings.workers
    )
