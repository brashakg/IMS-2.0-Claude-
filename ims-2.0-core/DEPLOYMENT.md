# IMS 2.0 - Deployment Guide

Complete deployment guide for the IMS 2.0 Retail Operating System.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Docker)](#quick-start-docker)
3. [Manual Deployment](#manual-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Storage | 20 GB | 50 GB SSD |
| OS | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Software Requirements

- Docker 24.0+ & Docker Compose 2.0+
- Node.js 20 LTS (for local development)
- Python 3.11+ (for local development)
- MongoDB 7.0+
- Redis 7.0+

---

## Quick Start (Docker)

### 1. Clone and Configure

```bash
# Clone repository
git clone <repository-url>
cd ims-2.0-core

# Create environment files
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit environment files with your configuration
nano backend/.env
```

### 2. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 4. Stop Services

```bash
docker-compose down

# With volume cleanup (WARNING: deletes data)
docker-compose down -v
```

---

## Manual Deployment

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# .\venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Run development server
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# Run production server
uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit configuration

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Production Frontend with Nginx

```bash
# Build frontend
cd frontend && npm run build

# Copy to nginx
sudo cp -r dist/* /var/www/ims/

# Configure nginx (see nginx.conf in frontend/)
sudo cp frontend/nginx.conf /etc/nginx/sites-available/ims
sudo ln -s /etc/nginx/sites-available/ims /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT secret key (min 32 chars) |
| `MONGODB_URL` | Yes | MongoDB connection string |
| `MONGODB_DB_NAME` | Yes | Database name |
| `REDIS_URL` | No | Redis connection string |
| `ENVIRONMENT` | No | production/staging/development |
| `DEBUG` | No | Enable debug mode (default: false) |
| `CORS_ORIGINS` | No | Allowed origins JSON array |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL |
| `VITE_ENABLE_PWA` | No | Enable PWA features |
| `VITE_DEFAULT_BRAND` | No | Default brand theme |

### Integration API Keys

Configure these in `backend/.env` for third-party integrations:

```bash
# Payment Gateway
RAZORPAY_KEY_ID=rzp_live_xxx
RAZORPAY_KEY_SECRET=xxx

# Communication
WHATSAPP_ACCESS_TOKEN=xxx
SMS_AUTH_KEY=xxx
SENDGRID_API_KEY=xxx

# E-commerce
SHOPIFY_API_KEY=xxx
SHOPIFY_API_SECRET=xxx

# Shipping
SHIPROCKET_EMAIL=xxx
SHIPROCKET_PASSWORD=xxx
```

---

## Database Setup

### MongoDB

```bash
# Docker (recommended)
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=secure_password \
  mongo:7

# Create application user
mongosh -u admin -p secure_password --authenticationDatabase admin
use ims2
db.createUser({
  user: "ims_app",
  pwd: "app_password",
  roles: [{ role: "readWrite", db: "ims2" }]
})
```

### Redis

```bash
# Docker (recommended)
docker run -d \
  --name redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7 redis-server --appendonly yes
```

### Database Indexes (Recommended)

```javascript
// MongoDB indexes for optimal performance
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ phone: 1 }, { unique: true })
db.customers.createIndex({ phone: 1 })
db.customers.createIndex({ "storeIds": 1 })
db.orders.createIndex({ orderNumber: 1 }, { unique: true })
db.orders.createIndex({ storeId: 1, createdAt: -1 })
db.orders.createIndex({ customerId: 1, createdAt: -1 })
db.inventory.createIndex({ storeId: 1, sku: 1 }, { unique: true })
db.inventory.createIndex({ barcode: 1 })
db.products.createIndex({ sku: 1 }, { unique: true })
db.products.createIndex({ category: 1, isActive: 1 })
```

---

## Production Checklist

### Security

- [ ] Change default `SECRET_KEY` to a secure random string
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS origins properly (remove `*`)
- [ ] Set `DEBUG=false` in production
- [ ] Use strong MongoDB and Redis passwords
- [ ] Configure firewall rules
- [ ] Enable rate limiting

### Performance

- [ ] Enable MongoDB connection pooling
- [ ] Configure Redis caching
- [ ] Enable gzip compression in nginx
- [ ] Set up CDN for static assets
- [ ] Configure proper cache headers

### Reliability

- [ ] Set up database backups (daily)
- [ ] Configure health check monitoring
- [ ] Set up log aggregation
- [ ] Configure alerting for critical errors
- [ ] Test disaster recovery procedures

### SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d ims.yourdomain.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Basic health check |
| `GET /health/detailed` | Detailed with dependencies |
| `GET /ready` | Kubernetes readiness probe |
| `GET /live` | Kubernetes liveness probe |

### Prometheus Metrics (Optional)

Add to `requirements.txt`:
```
prometheus-client>=0.19.0
```

### Log Configuration

Logs are written to stdout by default. For file logging:

```bash
# Backend logs
uvicorn api.main:app 2>&1 | tee -a /var/log/ims/api.log

# Or use systemd
sudo systemctl status ims-api
sudo journalctl -u ims-api -f
```

### Systemd Service (Backend)

```ini
# /etc/systemd/system/ims-api.service
[Unit]
Description=IMS 2.0 API Server
After=network.target mongodb.service redis.service

[Service]
User=ims
Group=ims
WorkingDirectory=/opt/ims/backend
Environment="PATH=/opt/ims/backend/venv/bin"
ExecStart=/opt/ims/backend/venv/bin/uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

---

## Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB is running
docker ps | grep mongo
# or
sudo systemctl status mongod

# Test connection
mongosh "mongodb://localhost:27017"
```

**Redis Connection Failed**
```bash
# Check Redis is running
docker ps | grep redis
redis-cli ping
```

**Frontend Build Fails**
```bash
# Clear node_modules and cache
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run build
```

**API Not Responding**
```bash
# Check backend logs
docker-compose logs backend
# or
journalctl -u ims-api -n 100
```

### Support

For issues, please:
1. Check the logs for error messages
2. Verify environment configuration
3. Test database connectivity
4. Open an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (nginx)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │   Frontend       │         │   Backend API    │         │
│  │   (React/Vite)   │ ──────▶ │   (FastAPI)      │         │
│  │   Port: 3000     │         │   Port: 8000     │         │
│  └──────────────────┘         └────────┬─────────┘         │
│                                        │                    │
│                    ┌───────────────────┼───────────────┐   │
│                    │                   │               │   │
│            ┌───────▼──────┐   ┌───────▼──────┐       │   │
│            │   MongoDB    │   │    Redis     │       │   │
│            │   Port: 27017│   │   Port: 6379 │       │   │
│            └──────────────┘   └──────────────┘       │   │
│                                                       │   │
└───────────────────────────────────────────────────────────┘
```

---

**Version**: 2.0.0
**Last Updated**: January 2026
