# IMS 2.0 - Retail Operating System

## Overview

IMS 2.0 is a comprehensive **Retail Operating System** for optical and lifestyle retail businesses. 
This is NOT just a POS - it's a complete retail governance system.

**Core Philosophy**: Control > Convenience | Explicit > Implicit | Audit Everything

## Backend Modules (Complete)

| Module | File | Lines | Features |
|--------|------|-------|----------|
| Main App | ims_app.py | 303 | Unified system, workflows |
| Inventory | inventory_engine.py | 1255 | Stock, transfers, alerts |
| POS | pos_engine.py | 933 | Sales, orders, payments |
| Pricing | pricing_engine.py | 640 | Discounts, approvals |
| Clinical | clinical_engine.py | 443 | Eye tests, prescriptions |
| HR | hr_engine.py | 377 | Attendance, payroll |
| Finance | finance_engine.py | 891 | Invoices, GST, till |
| Tasks | tasks_engine.py | 1165 | SOPs, escalations |
| Marketplace | marketplace_engine.py | 401 | Shopify, shipping |

**Total**: ~7000 lines of Python backend code

## Product Categories
1. Frame/Sunglass
2. Optical Lens
3. Contact Lens
4. Watches
5. Accessories
6. Services

## Role Hierarchy
1. Superadmin → Admin → Area Manager → Store Manager
2. Accountant, Catalog Manager, Optometrist
3. Sales Cashier, Sales Staff, Workshop Staff

## Business Rules
- MRP < Offer Price → BLOCK
- Role-based discount caps
- AI is READ-ONLY, Superadmin-only

## Run Demo
```bash
cd backend/core && python3 ims_app.py
```

## Tech Stack
- Backend: Python 3.11+
- Frontend: React + Tailwind (Emergent)
- Database: PostgreSQL
