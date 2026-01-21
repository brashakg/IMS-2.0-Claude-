"""
IMS 2.0 - Configuration Management
===================================
Centralized configuration with environment variable support
"""
from pydantic_settings import BaseSettings
from typing import List, Optional
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application
    app_name: str = "IMS 2.0 API"
    app_version: str = "2.0.0"
    debug: bool = False
    environment: str = "production"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4

    # Security
    secret_key: str = "change-this-in-production"
    access_token_expire_minutes: int = 480
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # MongoDB
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "ims2"
    mongodb_min_pool_size: int = 5
    mongodb_max_pool_size: int = 50

    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_password: Optional[str] = None
    redis_cache_ttl: int = 3600

    # Integrations
    shopify_api_key: Optional[str] = None
    shopify_api_secret: Optional[str] = None
    shopify_store_url: Optional[str] = None

    tally_server_url: str = "http://localhost:9000"
    tally_company_name: Optional[str] = None

    razorpay_key_id: Optional[str] = None
    razorpay_key_secret: Optional[str] = None
    razorpay_webhook_secret: Optional[str] = None

    whatsapp_api_url: str = "https://graph.facebook.com/v18.0"
    whatsapp_phone_number_id: Optional[str] = None
    whatsapp_access_token: Optional[str] = None

    shiprocket_email: Optional[str] = None
    shiprocket_password: Optional[str] = None
    shiprocket_api_url: str = "https://apiv2.shiprocket.in/v1"

    sms_auth_key: Optional[str] = None
    sms_sender_id: str = "BVISION"

    sendgrid_api_key: Optional[str] = None
    sendgrid_from_email: str = "noreply@bettervision.in"

    # Storage
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "ap-south-1"
    aws_s3_bucket: str = "ims-uploads"

    # Monitoring
    sentry_dsn: Optional[str] = None
    log_level: str = "INFO"
    log_format: str = "json"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Convenience access
settings = get_settings()
