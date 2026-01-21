# CLAUDE CODE PROMPTS FOR IMS 2.0

## 📌 INITIAL SETUP PROMPT

```
I'm handing over an IMS 2.0 (Retail Operating System) project. This is a complete optical & lifestyle retail ERP/POS/CRM for Better Vision (5 stores) and WizOpt (1 store) in India.

**COMPLETED:**
- Phase 1: Database Layer (MongoDB schemas, 20 repositories)
- Phase 2: API Layer (FastAPI with 149 endpoints)

**REMAINING:**
- Phase 3: Frontend (React + Tailwind)
- Phase 4: Integrations (Shopify, Tally, Shiprocket, WhatsApp, Razorpay)
- Phase 5: AI Intelligence Module (read-only, Superadmin only)

I'm uploading the project zip file. Please:
1. Extract and review the project structure
2. Confirm you understand the codebase
3. List what's ready and what needs to be built
```

---

## 📌 FRONTEND KICKOFF PROMPT

```
Now let's start Phase 3: Frontend Development.

Requirements:
- React 18+ with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- JWT token management
- Role-based routing and component visibility

Brand Colors:
- Better Vision: #CD201A (Red), Black, White, Grey
- WizOpt: Teal/Blue palette (from wizopt.com)

Device Priority:
1. Tablet (iPad) - 50% usage - LANDSCAPE primary
2. Desktop - 30% usage
3. Mobile - 20% usage

Create the frontend project structure with:
1. Authentication context
2. Protected routes by role
3. Layout with sidebar navigation
4. Role-based dashboard routing

Start with the project setup and authentication flow.
```

---

## 📌 DASHBOARD SCREENS PROMPT

```
Create role-based dashboards for IMS 2.0.

Dashboard Types (7):
1. Staff Dashboard - Sales metrics, tasks, pending deliveries
2. Store Manager Dashboard - Store performance, staff performance, inventory alerts
3. Area Manager Dashboard - Multi-store view, regional performance
4. Admin Dashboard (HQ) - Enterprise metrics, approvals, system health
5. Superadmin Dashboard - Everything + AI Intelligence access
6. Catalog Manager Dashboard - Product management, pending activations
7. Accountant Dashboard - Financial summary, GST compliance, pending approvals

Each dashboard should have:
- Summary cards with key metrics
- Tasks/alerts section
- Quick action buttons
- Role-appropriate visibility

Use card-based layout similar to the existing software design.
Priority colors (non-customizable):
- P0: Dark Red (Business Risk)
- P1: Red (Urgent)
- P2: Orange (Important)
- P3: Yellow (Normal)
- P4: Blue (Informational)
```

---

## 📌 POS SCREEN PROMPT

```
Create the POS (Point of Sale) module for optical retail.

Optical Sale Flow:
1. Customer Selection/Creation
2. Patient Selection (customer can have multiple patients)
3. Prescription Selection/Creation (if TESTED_AT_STORE → require Optometrist)
4. Product Type Selection (Frame+Lens, Frame Only, Lens Only, Contact Lens, Accessory, Service)
5. For Frame+Lens:
   - Prescription MUST be attached before lens selection
   - Frame selection (search by brand/model or scan barcode)
   - Lens selection with power auto-populated from prescription
   - Coating options
6. Pricing & Discount validation
   - MRP vs Offer Price check
   - Role-based discount cap
   - Approval workflow if over limit
7. Payment collection (partial allowed)
8. Order confirmation

Key validations:
- Prescription axis must be whole number 1-180
- Discount cannot exceed role cap without approval
- Stock must be available
```

---

## 📌 INVENTORY SCREENS PROMPT

```
Create Inventory Management screens:

1. Stock List View
   - Filter by store, category, brand
   - Search by barcode, SKU, model
   - Show available quantity, reserved, location
   - Low stock highlighting

2. Stock Acceptance (GRN)
   - Accept stock from HQ/vendor
   - Verify count vs expected
   - Mark mismatches for escalation
   - Print barcodes at store level

3. Stock Transfer
   - Transfer request creation
   - Approval workflow
   - Send/receive confirmation
   - Barcode removal reminder at sender

4. Stock Count/Audit
   - Category-wise counting
   - Barcode scanning
   - Variance detection
   - Escalation for mismatches

5. Low Stock Alerts
   - Threshold-based alerts
   - Expiry warnings (30 days)
   - Reorder suggestions
```

---

## 📌 CLINICAL MODULE PROMPT

```
Create Clinical/Optometry screens:

1. Eye Test Entry
   - Patient selection
   - Source: TESTED_AT_STORE or FROM_DOCTOR
   - Optometrist selection (if store test)
   - Right eye: SPH, CYL, AXIS (whole number 1-180), ADD, PD, PRISM, BASE, ACUITY
   - Left eye: Same fields
   - Validity period (6-24 months, optometrist decides)
   - Lens recommendation
   - Coating recommendation
   - Remarks

2. Prescription History
   - View previous prescriptions
   - Compare changes over time
   - Print prescription

3. Optometrist Performance
   - Tests conducted
   - Redo rate tracking
   - Pattern detection (admin view only)

Validation:
- Axis MUST be whole number between 1 and 180
- If TESTED_AT_STORE, optometrist is mandatory
```

---

## 📌 HR MODULE PROMPT

```
Create HR & Attendance screens:

1. Attendance
   - Check-in/Check-out (geo-location validation)
   - Daily attendance view
   - Late mark tracking
   - Manual marking by manager

2. Leave Management
   - Apply leave request
   - Approval workflow
   - Leave balance tracking
   - Leave types: Casual, Sick, Earned, Unpaid, Maternity, Paternity

3. Payroll
   - Monthly salary calculation
   - Attendance-based deductions
   - Incentive calculation
   - Advance deductions
   - Salary slip generation

4. Employee Self-Service
   - View own attendance
   - View salary slips
   - View leave balance
   - Apply for leave
   - View assigned stock (for sales staff)

All employees should see their own data on mobile-friendly screens.
```

---

## 📌 TASK MANAGEMENT PROMPT

```
Create Task & SOP screens:

1. Task List
   - Filter by status, priority, assignee
   - Color-coded by priority (system-enforced)
   - Overdue highlighting
   - Countdown timers

2. Task Detail
   - Title, description, category
   - Priority (P0-P4)
   - Assigned to, due date
   - Linked entity (order, stock, etc.)
   - Escalation history
   - Action buttons: Start, Complete, Reassign

3. SOP Checklists
   - Daily opening checklist
   - Closing till checklist
   - Stock acceptance checklist
   - Mandatory items enforcement

4. Escalation View
   - Tasks escalated to current user
   - Escalation reason
   - Action required

System-generated tasks cannot be deleted, only completed or escalated.
```

---

## 📌 SETTINGS/CONFIGURATION PROMPT

```
Create Superadmin Settings screens:

1. Store Configuration
   - Add/edit stores
   - Enable/disable product categories per store
   - Set store coordinates for geo-fencing
   - GST details

2. User Management
   - Create users with multiple roles
   - Assign stores
   - Set discount caps per user
   - Geo-restriction settings

3. Discount Rules
   - Role × Category matrix
   - Set max discount per combination
   - Luxury item special rules

4. Integration Settings
   - Shopify connection
   - Tally export settings
   - Shiprocket API
   - WhatsApp Business
   - Razorpay configuration
   - GST Portal API

5. System Settings
   - Default validity periods
   - Escalation timeframes
   - Notification preferences
   - Audit retention

Each setting should have detailed sub-options (3-8 layers deep for complex setups).
```

---

## 📌 CONNECT API PROMPT

```
Connect the frontend to the backend API.

API Base URL: http://localhost:8000/api/v1

Authentication:
- POST /auth/login → Returns JWT token
- Store token in localStorage
- Add to Authorization header: Bearer {token}
- Handle token refresh
- Handle 401 errors → redirect to login

API Service Setup:
- Create axios instance with interceptors
- Add loading states
- Handle errors gracefully
- Show toast notifications for success/error

Test users (for development):
- admin / admin123 → ADMIN, SUPERADMIN
- manager / manager123 → STORE_MANAGER
- staff / staff123 → SALES_STAFF
```

---

## 📌 TESTING PROMPT

```
Run comprehensive testing:

1. Backend Tests
   - Run repository tests: python backend/database/test_repositories.py
   - Test API endpoints with curl or Postman
   - Verify JWT authentication flow

2. Frontend Tests
   - Login flow for all 3 test users
   - Role-based dashboard rendering
   - POS optical flow end-to-end
   - Form validations (especially prescription axis)

3. Integration Tests
   - Create order → verify stock reserved
   - Complete order → verify stock sold
   - Discount over cap → verify approval request

Report any issues found.
```

---

## 📌 DEPLOYMENT PROMPT

```
Prepare for deployment:

Backend (Render/Railway):
1. Create requirements.txt
2. Create Procfile or render.yaml
3. Set environment variables:
   - MONGO_URI
   - JWT_SECRET_KEY
   - CORS_ORIGINS

Frontend (Vercel/Netlify):
1. Build production bundle
2. Configure environment variables
3. Set API base URL

MongoDB:
- MongoDB Atlas for production
- Create indexes from schemas.py

Provide deployment configuration files.
```

---

## 🔴 IMPORTANT REMINDERS FOR CLAUDE CODE

1. **SYSTEM_INTENT.md is supreme authority** - Read it first
2. **Control > Convenience** - Never add silent defaults
3. **MRP/Offer Price logic is non-negotiable**
4. **AI is READ-ONLY** - Never auto-execute
5. **Audit everything** - Log all actions
6. **Tablet-first design** - 50% users on iPad
7. **Multi-role users** - One user can have many roles
8. **Indian GST compliance** - Keep in mind for all financial features

---

## 📂 FILES TO UPLOAD TO CLAUDE CODE

1. `ims-2.0-core-complete.zip` - Complete project
2. `IMS_2.0_HANDOVER_SUMMARY.md` - This summary
3. `CLAUDE_CODE_PROMPTS.md` - These prompts
4. `ChatGPT_Transcript_.txt` - Original requirements (from project files)
