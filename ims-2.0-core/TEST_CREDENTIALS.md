# IMS 2.0 - Test Credentials & System Access

## 🔐 Test User Accounts

### SUPERADMIN (Full System Access)
```
Email: superadmin@beautyvision.in
Password: Super@2024!Vision
Role: SUPERADMIN
Permissions: ALL
Store Access: ALL
Discount Cap: 100%
```

### ADMIN (Administrative Access)
```
Email: admin@beautyvision.in
Password: Admin@2024!BV
Role: ADMIN
Permissions: ALL except system settings
Store Access: ALL
Discount Cap: 100%
```

### AREA MANAGER (Multi-Store Management)
```
Email: area.manager@beautyvision.in
Password: Area@2024!Manager
Role: AREA_MANAGER
Permissions: Multiple store oversight, approvals, reports
Store Access: ALL stores in assigned area
Discount Cap: 25%
```

### STORE MANAGER (Single Store Management)
```
Email: store.manager@beautyvision.in
Password: Store@2024!Manager
Role: STORE_MANAGER
Permissions: Store operations, staff management, local approvals
Store Access: Assigned store only
Discount Cap: 20%
Can Approve: Up to 20% discount requests
```

### SALES CASHIER (POS + Cash Handling)
```
Email: cashier@beautyvision.in
Password: Cashier@2024!BV
Role: SALES_CASHIER
Permissions: POS, payments, customer management
Store Access: Assigned store only
Discount Cap: 10%
Can Handle: Cash payments, UPI, card
```

### SALES STAFF (Basic Sales)
```
Email: sales@beautyvision.in
Password: Sales@2024!Staff
Role: SALES_STAFF
Permissions: POS, customer management
Store Access: Assigned store only
Discount Cap: 10%
Cannot Handle: Cash payments (needs CASHIER approval)
```

### OPTOMETRIST (Clinical)
```
Email: optometrist@beautyvision.in
Password: Opto@2024!BV
Role: OPTOMETRIST
Permissions: Eye tests, prescriptions, POS
Store Access: Assigned store only
Discount Cap: 10%
Special: Can create/edit prescriptions
```

### CATALOG MANAGER (Inventory)
```
Email: catalog@beautyvision.in
Password: Catalog@2024!Manager
Role: CATALOG_MANAGER
Permissions: Product catalog, inventory, transfers
Store Access: Multiple stores (HQ level)
Discount Cap: 0%
Special: Cannot discount, focuses on inventory
```

### WORKSHOP STAFF (Workshop Operations)
```
Email: workshop@beautyvision.in
Password: Workshop@2024!Staff
Role: WORKSHOP_STAFF
Permissions: Workshop jobs, frame assembly, lens processing
Store Access: Assigned store only
Discount Cap: 0%
Special: Manages workshop queue
```

### ACCOUNTANT (Financial)
```
Email: accountant@beautyvision.in
Password: Account@2024!BV
Role: ACCOUNTANT
Permissions: Financial reports, expense approval, payroll
Store Access: ALL stores
Discount Cap: 0%
Special: Cannot create orders, views-only access to sales
```

---

## 🏪 Test Store IDs

```
store-bv-001: Beauty Vision - Indiranagar (Flagship)
store-bv-002: Beauty Vision - Koramangala
store-bv-003: Beauty Vision - Whitefield
store-bv-004: Beauty Vision - JP Nagar
store-bv-005: Beauty Vision - HSR Layout
```

---

## 📦 Test Product Barcodes

### Frames (Optical)
```
BV-FRAME-001: Ray-Ban Wayfarer (MASS) - MRP: ₹5,000
BV-FRAME-002: Oakley Holbrook (PREMIUM) - MRP: ₹8,500
BV-FRAME-003: Gucci GG0001O (LUXURY) - MRP: ₹35,000
BV-FRAME-004: Cartier CT0001O (LUXURY) - MRP: ₹95,000
```

### Sunglasses
```
BV-SUN-001: Ray-Ban Aviator (MASS) - MRP: ₹6,500
BV-SUN-002: Prada SPR01O (LUXURY) - MRP: ₹28,000
```

### Contact Lenses
```
BV-CL-001: Acuvue Oasys (MASS) - MRP: ₹1,200 (box)
BV-CL-002: Bausch & Lomb Ultra (PREMIUM) - MRP: ₹2,500 (box)
```

### Accessories
```
BV-ACC-001: Microfiber Cloth (MASS) - MRP: ₹100
BV-ACC-002: Lens Solution 360ml (MASS) - MRP: ₹250
BV-ACC-003: Designer Case (PREMIUM) - MRP: ₹1,500
```

---

## 🧪 Test Scenarios

### Scenario 1: Basic Sale (Within Discount Cap)
```
User: sales@beautyvision.in
Product: BV-FRAME-001 (₹5,000)
Discount: 8% (within 10% cap)
Expected: Order completes normally
```

### Scenario 2: Approval Required (Exceeds Discount Cap)
```
User: sales@beautyvision.in
Product: BV-FRAME-002 (₹8,500)
Discount: 15% (exceeds 10% cap)
Expected: Approval request created, task assigned to Store Manager
```

### Scenario 3: Luxury Brand Restriction
```
User: store.manager@beautyvision.in
Product: BV-FRAME-004 (Cartier ₹95,000)
Discount: 3% (within 20% cap BUT exceeds Cartier 2% cap)
Expected: Blocked or requires ADMIN approval
```

### Scenario 4: HQ Discounted Product (No Further Discount)
```
Product: BV-FRAME-001
MRP: ₹5,000
Offer Price: ₹4,500 (HQ already gave 10%)
User attempts: Additional 5% discount
Expected: BLOCKED - "Product already discounted by HQ"
```

### Scenario 5: Task Escalation (P1 Priority)
```
Task: Stock Mismatch Detected
Priority: P1
Created: 2024-01-21 10:00:00
Assigned: store.manager@beautyvision.in
Not Completed After: 24 hours
Expected: Auto-escalate to Area Manager (Level 1)
After 48 hours: Escalate to Admin (Level 2)
```

### Scenario 6: Cash Payment Restriction
```
User: sales@beautyvision.in (SALES_STAFF, not CASHIER)
Payment Method: CASH
Expected: BLOCKED - "Only CASHIER role can accept cash payments"
```

### Scenario 7: Prescription with Optical Lens
```
Product: BV-FRAME-001 + Lenses
Has Prescription: Yes
Expected: Workshop job auto-created on order confirmation
Workshop Status: PENDING
```

---

## 🔑 API Authentication

### JWT Token Format
```
Authorization: Bearer <jwt_token>
```

### Token Payload Structure
```json
{
  "user_id": "user-xxx",
  "email": "user@example.com",
  "roles": ["STORE_MANAGER"],
  "active_store_id": "store-bv-001",
  "accessible_stores": ["store-bv-001"],
  "exp": 1234567890
}
```

### Login Endpoint
```
POST /api/v1/auth/login
Body: {
  "email": "sales@beautyvision.in",
  "password": "Sales@2024!Staff",
  "store_id": "store-bv-001",
  "latitude": 12.9716,
  "longitude": 77.5946
}
```

**Geo-Location Requirements:**
- Must be within 500m of store location
- Uses Haversine formula for distance calculation
- Failure returns: "Login location too far from store"

---

## 📊 Database Collections

```
users              - User accounts and authentication
stores             - Store locations and configuration
products           - Product catalog
stock              - Inventory with FIFO tracking
customers          - Customer database
orders             - Order transactions
order_items        - Line items with stock reservation
prescriptions      - Optical prescriptions
tasks              - Task management with escalation
approvals          - Discount approval requests (NEW)
vendors            - Supplier management
purchases          - Purchase orders
grns               - Goods Receipt Notes
expenses           - Expense tracking
advances           - Staff advances
attendance         - HR attendance
leaves             - Leave management
payroll            - Payroll processing
workshop_jobs      - Workshop job queue
audit_logs         - Complete audit trail
notifications      - System notifications
```

---

## 🚀 Quick Start Commands

### Start Backend
```bash
cd /home/user/IMS-2.0-Claude-/ims-2.0-core/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd /home/user/IMS-2.0-Claude-/ims-2.0-core/frontend
npm install
npm run dev
```

### Access Points
```
Frontend: http://localhost:5173
Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs
Health Check: http://localhost:8000/health
```

---

## 🧩 Feature Testing Checklist

### ✅ Discount Approval Workflow
- [ ] Sales staff requests discount above cap
- [ ] Approval request created with task
- [ ] Store Manager sees pending approval
- [ ] Store Manager can approve/reject
- [ ] Approved discount applies to order
- [ ] Rejected request notifies requester
- [ ] Approval expires after 24 hours

### ✅ Task Escalation
- [ ] P0 task escalates after 4 hours
- [ ] P1 task escalates after 24 hours
- [ ] P2 task escalates after 72 hours
- [ ] Escalation creates notification task
- [ ] Escalation follows hierarchy (Store → Area → Admin)
- [ ] Manual escalation works
- [ ] Escalation stats endpoint returns correct data

### ✅ Pricing Validation
- [ ] MRP > Offer = BLOCKED
- [ ] MRP > Offer = NO additional discount
- [ ] Discount within cap = allowed
- [ ] Discount exceeds cap = approval required
- [ ] Luxury brand caps enforced (Cartier 2%, Gucci 5%)
- [ ] Category caps enforced (MASS 15%, PREMIUM 20%)

### ✅ Stock Reservation
- [ ] Stock reserved on order confirmation
- [ ] FIFO logic for batch selection
- [ ] Stock deducted on delivery
- [ ] Stock released on cancellation
- [ ] Low stock warnings work

### ✅ Workshop Integration
- [ ] Workshop job created for optical lens orders
- [ ] Job includes frame barcode + prescription
- [ ] Job tracks status (PENDING → PROCESSING → COMPLETED)
- [ ] Workshop staff can see job queue

---

## 🐛 Known Limitations (P2 Features Not Yet Implemented)

1. **Payment Gateways**: Razorpay integration pending
2. **WhatsApp Notifications**: Notification stubs in place, actual sending not implemented
3. **Shopify Sync**: Inventory sync not implemented
4. **Tally Export**: Accounting export not implemented
5. **Shiprocket**: Shipping integration not implemented
6. **GST Portal**: Tax verification not implemented

---

## 📞 Support Contacts

```
Technical Lead: Brashak G (brashak@beautyvision.in)
System Admin: admin@beautyvision.in
Help Desk: support@beautyvision.in
Emergency: +91-XXXX-XXXXXX
```

---

**Last Updated**: 2026-01-21
**System Version**: 2.0.0-alpha
**Deployment**: Development Environment
