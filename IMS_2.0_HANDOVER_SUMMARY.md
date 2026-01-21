# IMS 2.0 - COMPLETE PROJECT HANDOVER SUMMARY

## 📋 Project Overview

**Name:** IMS 2.0 - Retail Operating System  
**Type:** Complete Optical & Lifestyle Retail ERP/POS/CRM  
**Brands:** Better Vision (5 stores) & WizOpt (1 store)  
**Categories:** Frames, Sunglasses, Optical Lenses, Contact Lenses, Watches, Smartwatches, Accessories, Services

---

## ✅ COMPLETED PHASES

### Phase 1: Database Layer ✅
- MongoDB schemas for 19 collections
- 70+ indexes for performance
- 20 repository classes with CRUD operations
- Mock database for testing without MongoDB

### Phase 2: API Layer ✅  
- FastAPI application with 149 endpoints
- JWT authentication with role-based access
- 15 router modules covering all business functions

---

## 📁 PROJECT STRUCTURE

```
ims-2.0-core/
├── backend/
│   ├── api/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── routers/
│   │   │   ├── auth.py          # Login, logout, tokens
│   │   │   ├── users.py         # User management
│   │   │   ├── stores.py        # Store configuration
│   │   │   ├── products.py      # Product catalog
│   │   │   ├── inventory.py     # Stock management
│   │   │   ├── customers.py     # Customer & patients
│   │   │   ├── orders.py        # Sales orders
│   │   │   ├── prescriptions.py # Eye prescriptions
│   │   │   ├── vendors.py       # Vendors, POs, GRNs
│   │   │   ├── tasks.py         # Task management
│   │   │   ├── expenses.py      # Expenses & advances
│   │   │   ├── hr.py            # Attendance, leaves, payroll
│   │   │   ├── workshop.py      # Lens fitting jobs
│   │   │   ├── reports.py       # All reports
│   │   │   └── settings.py      # System configuration
│   │   └── __init__.py
│   ├── core/
│   │   ├── auth_system.py       # Authentication logic
│   │   ├── pos_engine.py        # Sales engine
│   │   ├── inventory_engine.py  # Stock management
│   │   ├── pricing_engine.py    # MRP/Discount logic
│   │   ├── clinical_engine.py   # Eye test management
│   │   ├── customer_engine.py   # CRM functions
│   │   ├── vendor_engine.py     # Purchase management
│   │   ├── tasks_engine.py      # Task/SOP engine
│   │   ├── expense_engine.py    # Expense tracking
│   │   ├── hr_engine.py         # HR functions
│   │   ├── finance_engine.py    # Accounting/GST
│   │   ├── workshop_engine.py   # Job management
│   │   ├── reports_engine.py    # Report generation
│   │   ├── notification_engine.py
│   │   ├── audit_engine.py      # Activity logging
│   │   ├── ai_intelligence_engine.py  # AI insights (read-only)
│   │   ├── integrations_engine.py     # Shopify, Tally, etc.
│   │   ├── marketplace_engine.py
│   │   ├── settings_engine.py
│   │   └── printables_engine.py
│   └── database/
│       ├── connection.py        # MongoDB connection
│       ├── schemas.py           # 19 collection schemas
│       ├── migrations.py        # Database setup
│       └── repositories/
│           ├── base_repository.py
│           ├── user_repository.py
│           ├── store_repository.py
│           ├── product_repository.py
│           ├── customer_repository.py
│           ├── order_repository.py
│           ├── prescription_repository.py
│           ├── vendor_repository.py
│           ├── task_repository.py
│           ├── expense_repository.py
│           ├── audit_repository.py
│           ├── hr_repository.py
│           └── workshop_repository.py
└── docs/
    └── SYSTEM_INTENT.md         # Supreme authority document
```

---

## 🔑 KEY BUSINESS RULES (NON-NEGOTIABLE)

### Pricing Logic
- **MRP < Offer Price → BLOCK** (Cannot sell)
- **MRP > Offer Price → No further discounts allowed**
- **MRP == Offer Price → Role-based discounts apply**

### Discount Authority (Role × Category × Context)
- Sales Staff: 0-10%
- Store Manager: 0-20%
- Area Manager: 0-25%
- Admin/Superadmin: Full authority
- Luxury items: Always require approval

### Core Principles
- **Control > Convenience** - Explicit authority always
- **No Silent Defaults** - Everything must be configured
- **Audit Everything** - Who, What, When, Where, Previous, New
- **AI is READ-ONLY** - Superadmin only, advisory mode

---

## 📊 STATISTICS

| Component | Count |
|-----------|-------|
| Core Modules | 21 |
| Database Collections | 19 |
| Repositories | 20 classes |
| API Endpoints | 149 |
| Total Python Lines | ~18,200 |

---

## 🚧 REMAINING PHASES

### Phase 3: Frontend (React + Tailwind)
- Role-based dashboards (7 types)
- POS interface with optical flow
- Inventory management screens
- Clinical/optometry screens
- HR & payroll screens
- Task management
- Reports & analytics
- Settings & configuration

### Phase 4: Integration Layer
- Shopify sync
- Tally export
- Shiprocket shipping
- WhatsApp Business
- Razorpay payments
- Google/Meta marketing

### Phase 5: AI Intelligence Module
- Pattern detection (read-only)
- Discount abuse detection
- Inventory optimization
- Sales forecasting

---

## 🎨 BRAND COLORS

### Better Vision
- Primary: #CD201A (Red)
- Secondary: Black, White, Grey

### WizOpt
- Primary: Based on wizopt.com palette
- Improved contrast

---

## 👥 USER ROLES

1. **SUPERADMIN** - CEO, full control, AI access
2. **ADMIN** - Directors, HQ level
3. **AREA_MANAGER** - Multi-store oversight
4. **STORE_MANAGER** - Store operations
5. **ACCOUNTANT** - Finance/GST
6. **CATALOG_MANAGER** - Product management
7. **OPTOMETRIST** - Eye tests
8. **SALES_STAFF** - Sales
9. **CASHIER** - Payments
10. **WORKSHOP_STAFF** - Lens fitting

Users can have **multiple roles** (e.g., Store Manager + Optometrist)

---

## 🗄️ DATABASE COLLECTIONS

1. users
2. stores
3. products
4. stock_units
5. customers
6. prescriptions
7. orders
8. vendors
9. purchase_orders
10. grns
11. tasks
12. expenses
13. advances
14. attendance
15. leaves
16. payroll
17. workshop_jobs
18. audit_logs
19. notifications

---

## 🔧 TECH STACK

- **Backend:** Python 3.12, FastAPI
- **Database:** MongoDB
- **Auth:** JWT tokens
- **Frontend:** React + Tailwind CSS (to be built)
- **Deployment:** Render / Railway

---

## 📝 DEPENDENCIES

```
fastapi
pydantic
pyjwt
pymongo
email-validator
python-multipart
uvicorn
```

---

## 🚀 HOW TO RUN

```bash
# Install dependencies
pip install fastapi pydantic pyjwt pymongo email-validator python-multipart uvicorn

# Run API server
cd ims-2.0-core/backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

# API docs available at:
# http://localhost:8000/docs
```

---

## 📄 REFERENCE DOCUMENTS

The original ChatGPT transcript contains extensive Q&A about:
- Detailed business requirements
- Excel sheet analysis (SOP, salary, targets, walkouts)
- Store setup requirements
- Product category attributes
- Discount rules by category
- Clinical workflow
- HR/attendance requirements
- Integration specifications

**These should be referenced for any clarification needed during frontend development.**
