# IMS 2.0 - Inventory Management System PRD

## Project Overview
Inventory Management System for optical retail stores with comprehensive features for POS, inventory, orders, clinical, workshop, and HR management.

## Original Problem Statement
Build an IMS for optical retail stores with:
- React + TypeScript + Vite frontend
- Tailwind CSS styling
- FastAPI backend with JWT authentication
- MongoDB database
- Multi-role system (10 roles)
- POS, Inventory, Orders, Clinical, Workshop, HR modules

## Architecture

### Tech Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI (Python) + JWT Authentication
- **Database**: MongoDB
- **State Management**: React Context + TanStack Query

### Directory Structure
```
/app/
├── backend/
│   ├── api/
│   │   ├── main.py          # FastAPI app entry
│   │   └── routers/         # API routes
│   ├── database/
│   │   └── connection.py    # MongoDB connection
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React contexts
│   │   └── types/           # TypeScript types
│   └── package.json
└── memory/
    └── PRD.md
```

## User Personas & Roles
1. **SUPERADMIN** - Full system access, manage all settings
2. **ADMIN** - Store management, user management
3. **AREA_MANAGER** - Multi-store oversight
4. **STORE_MANAGER** - Single store operations
5. **CATALOG_MANAGER** - Product catalog management
6. **ACCOUNTANT** - Financial operations
7. **OPTOMETRIST** - Eye tests and prescriptions
8. **SALES_CASHIER** - POS and payments
9. **SALES_STAFF** - Sales operations
10. **WORKSHOP_STAFF** - Lens fitting and repairs

## Core Requirements

### Authentication
- [x] JWT-based authentication
- [x] Role-based access control
- [x] Default superadmin account (superadmin/Super@123)
- [x] Multi-role user support

### Settings/Admin Panel
- [x] Store Management (CRUD)
- [x] User Management (CRUD)
- [x] Category Master
- [x] Brand/Subbrand Master
- [x] Lens Pricing Matrix
- [x] Discount Rules (role-based)
- [x] Integration Settings
- [x] System Settings

### POS
- [x] Customer search by phone
- [x] Barcode scanning
- [x] 13 product categories
- [x] Add lens to frame
- [x] Prescription linking
- [x] Role-based discount caps
- [x] Multiple payment modes

### Inventory
- [x] Stock tracking per store
- [x] Low stock alerts
- [x] Stock transfers
- [x] Category-based filtering
- [x] Barcode lookup

### Orders
- [x] Order creation with items
- [x] Status tracking (Draft → Confirmed → Processing → Ready → Delivered)
- [x] Payment tracking
- [x] Invoice generation

### Clinical/Eye Tests
- [x] Patient queue management
- [x] Eye test recording (sphere, cylinder, axis)
- [x] Prescription management

### Workshop
- [x] Job tracking for lens fitting
- [x] Priority levels
- [x] Job status workflow

### HR
- [x] Employee listing
- [x] Attendance tracking
- [x] Leave management

## What's Been Implemented (Jan 22, 2026)

### Backend
- [x] MongoDB connection with proper error handling
- [x] Auth router with superadmin fallback
- [x] Stores router with full CRUD
- [x] Users router with full CRUD
- [x] Settings router with categories, brands, lens prices
- [x] Products router with CRUD and barcode lookup
- [x] Inventory router with stock management
- [x] Orders router with full workflow
- [x] Customers router with patient management
- [x] Reports router with dashboard stats
- [x] HR router with employee listing
- [x] Workshop router
- [x] Prescriptions router

### Frontend
- [x] Login page with username authentication
- [x] Dashboard with real-time stats
- [x] Settings page with all configuration modules
- [x] POS page with customer search
- [x] Inventory page
- [x] Orders page
- [x] Clinical/Eye Tests page
- [x] Workshop page
- [x] HR page
- [x] Reports page
- [x] Navigation sidebar with role-based filtering

## Prioritized Backlog

### P0 (Critical)
- None - Core functionality complete

### P1 (High Priority)
- [ ] Complete POS checkout flow with payment processing
- [ ] Barcode scanner integration
- [ ] Invoice PDF generation
- [ ] WhatsApp notification integration

### P2 (Medium Priority)
- [ ] Razorpay payment integration
- [ ] Tally ERP integration
- [ ] Stock count functionality
- [ ] Purchase order management

### P3 (Low Priority)
- [ ] Shopify integration
- [ ] Advanced reporting with charts
- [ ] Customer loyalty program
- [ ] SMS notifications

## Test Credentials
- **Superadmin**: superadmin / Super@123

## API Endpoints
- Health: GET /health
- Auth: POST /api/v1/auth/login
- Stores: /api/v1/stores/
- Users: /api/v1/users/
- Products: /api/v1/products/
- Inventory: /api/v1/inventory/
- Orders: /api/v1/orders/
- Customers: /api/v1/customers/
- Settings: /api/v1/settings/
- Reports: /api/v1/reports/
- HR: /api/v1/hr/
- Workshop: /api/v1/workshop/

## Next Tasks
1. Test store creation through Settings
2. Test user creation through Settings
3. Test customer creation through POS
4. Complete POS checkout flow
5. Add more comprehensive error handling
