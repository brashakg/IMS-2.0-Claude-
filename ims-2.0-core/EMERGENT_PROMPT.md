# 🚀 IMS 2.0 - EMERGENT BUILD PROMPT

## 📌 PROJECT CONTEXT

You are continuing development on **IMS 2.0** - a comprehensive Retail Operating System for optical/lifestyle retail built for Beauty Vision stores across India. This is a handover from a completed session where **ALL P0 (Critical) and P1 (Essential)** features have been implemented and tested.

---

## ✅ CURRENT STATE (VERIFIED & WORKING)

### **Branch**: `claude/continue-ims-development-KktXu`
### **Last Commits**:
- `d4dcd91` - Task escalation automation (P1) ✅
- `012f10e` - Discount approval workflow (P1) ✅
- `43531ba` - MockDataContext replaced with real APIs ✅

### **Project Completion**: 90%
- ✅ **P0 (Critical)**: 100% Complete
- ✅ **P1 (Essential)**: 100% Complete
- ⏳ **P2 (Integrations)**: 0% (YOUR WORK)

---

## 🏗️ SYSTEM ARCHITECTURE OVERVIEW

### **Technology Stack**
```
Backend:
- FastAPI (Python 3.10+)
- MongoDB (primary database)
- Redis (caching)
- Bcrypt (password hashing)
- JWT (authentication)
- SlowAPI (rate limiting)

Frontend:
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- Tailwind CSS (styling)
- React Router (routing)
- Lucide React (icons)
```

### **Architecture Pattern**
```
backend/
├── api/
│   ├── routers/          # 15 routers (REST endpoints)
│   ├── middleware.py     # Security, rate limiting, sanitization
│   ├── main.py           # App entry, router registration
│   ├── config.py         # Environment configuration
│   └── database.py       # MongoDB & Redis connections
├── core/
│   └── *_engine.py       # 17 business logic engines
├── database/
│   └── repositories/     # 15 repositories (data access layer)
└── requirements.txt      # Python dependencies

frontend/
├── src/
│   ├── pages/            # 15+ page components
│   ├── components/       # 50+ reusable components
│   ├── services/         # API client (api.ts)
│   ├── utils/            # Validation, helpers
│   ├── context/          # React contexts
│   └── types/            # TypeScript types
└── package.json          # Node dependencies
```

---

## 📚 CRITICAL DOCUMENTATION

### **SUPREME AUTHORITY**: `/ims-2.0-core/docs/SYSTEM_INTENT.md`
**ALL business rules derive from this document. NEVER contradict it.**

Key sections:
- Section 3: Pricing Laws (MRP/Offer/Discount rules)
- Section 4: Prescription Validation (Axis 1-180, whole numbers)
- Section 7: Role Hierarchy (10 roles with permissions)
- Section 12: Task Escalation Matrix (P0/P1/P2 timing)

### **Test Credentials**: `/ims-2.0-core/TEST_CREDENTIALS.md`
**Complete test user accounts, barcodes, scenarios**

---

## ✅ COMPLETED FEATURES (DO NOT MODIFY)

### **P0 (Critical) - 100% Complete**

#### 1. **Security Infrastructure** ✅
- Bcrypt password hashing (auth.py:77-88)
- Rate limiting with SlowAPI (middleware.py:1-344)
- Input sanitization (XSS/SQL/NoSQL) (middleware.py:100-220)
- Geo-location login (500m radius, Haversine) (auth.py:90-106)
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)

#### 2. **Orders Router** ✅ (orders.py:168-329)
- Stock reservation with FIFO
- MRP/Offer price validation
- Workshop job auto-creation
- Payment validation (CASH requires CASHIER)
- Stock deduction on delivery

#### 3. **Frontend Validation** ✅
- `pricingValidation.ts` - Role-based discount caps
- `prescriptionValidation.ts` - Axis validation (1-180)
- Real-time validation in POS flow

#### 4. **API Integration** ✅
- POSPage.tsx - Real API calls (no mocks)
- OrdersPage.tsx - Real API calls
- CustomersPage.tsx - Real API calls

### **P1 (Essential) - 100% Complete**

#### 1. **Discount Approval Workflow** ✅ (Commit: 012f10e)
**Backend**: `/backend/api/routers/approvals.py` (674 lines)
- POST `/api/v1/approvals/discount` - Create request
- GET `/api/v1/approvals/discount/pending` - Get pending
- POST `/api/v1/approvals/discount/{id}/approve` - Approve
- POST `/api/v1/approvals/discount/{id}/reject` - Reject
- GET `/api/v1/approvals/discount/history` - Audit trail
- GET `/api/v1/approvals/discount/my-requests` - User's requests
- POST `/api/v1/approvals/discount/expire-old` - Admin cleanup

**Repository**: `/backend/database/repositories/approval_repository.py` (253 lines)
- Full CRUD operations
- Status queries (pending, expired, escalated)
- Analytics (approval rates, response times)

**Frontend**:
- `/frontend/src/pages/ApprovalPage.tsx` (469 lines) - Management interface
- `/frontend/src/components/pos/ApprovalRequestModal.tsx` (272 lines) - Request modal
- Route: `/approvals` (STORE_MANAGER+ access)

**Business Rules**:
- Role-based caps: SALES(10%), STORE_MANAGER(20%), AREA_MANAGER(25%), ADMIN(100%)
- 24-hour automatic expiry
- Task auto-creation (P1 priority)
- Approval hierarchy validation
- Full audit trail

#### 2. **Task Escalation Automation** ✅ (Commit: d4dcd91)
**Backend**: `/backend/core/task_escalation_service.py` (341 lines)
- Time-based escalation logic (P0: 4hrs, P1: 24hrs, P2: 72hrs)
- Role hierarchy selection (Store → Area → Admin)
- Notification task creation
- Batch processing for cron jobs

**Router**: `/backend/api/routers/tasks.py` (449 lines)
- POST `/api/v1/tasks/escalation/process` - Batch process (cron-callable)
- GET `/api/v1/tasks/escalation/{id}/status` - Check status
- POST `/api/v1/tasks/{id}/escalate` - Manual escalation
- GET `/api/v1/tasks/escalation/stats` - Statistics
- Complete CRUD endpoints for task management

**Repository**: `/backend/database/repositories/task_repository.py` (+68 lines)
- `find_tasks_needing_escalation()` - Query by priority & time
- `find_tasks_by_escalation_level()` - Level filtering
- `record_escalation()` - Audit trail

**Escalation Rules**:
```
P0 (Critical)  → 4 hours  → Store Manager → Area Manager → Admin
P1 (Essential) → 24 hours → Store Manager → Area Manager → Admin
P2 (Important) → 72 hours → Store Manager → Area Manager → Admin
P3+ (Normal)   → No escalation
```

---

## 🎯 YOUR MISSION: P2 INTEGRATIONS (Next Phase)

### **Priority Order** (Start with #1)

#### **1. Razorpay Payment Gateway Integration** 🔥 HIGH PRIORITY
**Why First**: Critical for production, impacts revenue

**Requirements**:
- Payment link generation
- Callback handling (success/failure)
- Payment verification
- Refund processing
- Transaction ledger
- Multiple payment methods (UPI, Cards, Net Banking, Wallets)

**Files to Create**:
```
backend/core/payment_gateway_engine.py
backend/api/routers/payments.py
frontend/src/components/pos/RazorpayPaymentModal.tsx
```

**API Endpoints**:
```
POST /api/v1/payments/razorpay/create-order
POST /api/v1/payments/razorpay/verify
POST /api/v1/payments/razorpay/refund
GET  /api/v1/payments/razorpay/status/{order_id}
```

**Environment Variables**:
```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

**Business Logic**:
- Create Razorpay order on POS checkout
- Store payment_id, order_id in database
- Verify payment signature on callback
- Update order status on successful payment
- Handle failed payments (retry logic)
- Refund processing for returns

#### **2. Shopify Inventory Sync** 🔥 HIGH PRIORITY
**Why Second**: Inventory accuracy is critical

**Requirements**:
- Real-time stock sync (bidirectional)
- Product catalog sync
- Order sync from Shopify to IMS
- Webhook handling
- Conflict resolution (IMS vs Shopify)

**Files to Create**:
```
backend/core/shopify_sync_engine.py
backend/api/routers/shopify.py
backend/database/repositories/shopify_mapping_repository.py
```

**API Endpoints**:
```
POST /api/v1/integrations/shopify/sync-products
POST /api/v1/integrations/shopify/sync-inventory
POST /api/v1/integrations/shopify/webhooks/orders
POST /api/v1/integrations/shopify/webhooks/inventory
GET  /api/v1/integrations/shopify/sync-status
```

**Webhook Events to Handle**:
- `orders/create` - New order from Shopify
- `inventory_levels/update` - Stock changed on Shopify
- `products/create` - New product on Shopify
- `products/update` - Product updated on Shopify

**Conflict Resolution**:
- IMS is source of truth for in-store sales
- Shopify is source of truth for online sales
- Last-write-wins with timestamp comparison
- Manual review queue for major conflicts

#### **3. WhatsApp Notifications** 🔥 MEDIUM PRIORITY
**Why Third**: Improves customer experience and staff efficiency

**Requirements**:
- Order confirmation messages
- Payment reminders
- Delivery notifications
- Approval request notifications
- Task escalation alerts
- Template message management

**Files to Create**:
```
backend/core/whatsapp_engine.py
backend/api/routers/notifications.py
backend/database/repositories/notification_template_repository.py
```

**API Endpoints**:
```
POST /api/v1/notifications/whatsapp/send
POST /api/v1/notifications/whatsapp/send-template
GET  /api/v1/notifications/whatsapp/templates
POST /api/v1/notifications/whatsapp/webhooks/status
```

**WhatsApp Providers** (Choose One):
- Twilio WhatsApp API
- MessageBird WhatsApp Business
- Meta WhatsApp Business API (Direct)
- Gupshup

**Message Templates**:
```
ORDER_CONFIRMATION:
"Hi {name}, your order {order_number} for ₹{amount} is confirmed. Expected delivery: {date}. Track: {link}"

PAYMENT_REMINDER:
"Hi {name}, payment pending for order {order_number}. Amount due: ₹{amount}. Pay now: {link}"

APPROVAL_REQUEST:
"Hi {manager_name}, discount approval needed for {product_name}. Requested: {discount}%. Approve: {link}"

TASK_ESCALATION:
"URGENT: Task {task_number} escalated to you. Priority: {priority}. View: {link}"
```

#### **4. Tally Accounting Export** 🔥 MEDIUM PRIORITY
**Why Fourth**: Financial compliance, tax filing

**Requirements**:
- XML export for Tally import
- Voucher generation (Sales, Purchase, Payment, Receipt)
- Ledger mapping
- GST compliance
- Trial balance reconciliation

**Files to Create**:
```
backend/core/tally_export_engine.py
backend/api/routers/tally.py
backend/database/repositories/tally_mapping_repository.py
```

**API Endpoints**:
```
POST /api/v1/integrations/tally/export-sales
POST /api/v1/integrations/tally/export-purchases
POST /api/v1/integrations/tally/export-expenses
GET  /api/v1/integrations/tally/export-status
```

**Tally Voucher Types**:
- Sales Voucher (from orders)
- Purchase Voucher (from GRNs)
- Payment Voucher (expenses, vendor payments)
- Receipt Voucher (customer payments)
- Journal Voucher (adjustments)

**XML Format** (Tally 9.0):
```xml
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE>
          <VOUCHER>
            <DATE>{date}</DATE>
            <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
            <PARTYLEDGERNAME>{customer_name}</PARTYLEDGERNAME>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Sales</LEDGERNAME>
              <AMOUNT>-{amount}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>
```

#### **5. Shiprocket Shipping Integration** 🔥 LOW PRIORITY
**Why Fifth**: Only for online orders, can be manual initially

**Requirements**:
- Order forwarding to Shiprocket
- AWB generation
- Shipment tracking
- Delivery status webhooks
- Returns management

**Files to Create**:
```
backend/core/shiprocket_engine.py
backend/api/routers/shipping.py
```

**API Endpoints**:
```
POST /api/v1/shipping/shiprocket/create-order
GET  /api/v1/shipping/shiprocket/track/{awb}
POST /api/v1/shipping/shiprocket/cancel
POST /api/v1/shipping/shiprocket/webhooks/status
```

#### **6. GST Portal Integration** 🔥 LOW PRIORITY
**Why Last**: Quarterly/monthly process, not real-time

**Requirements**:
- GSTR-1 report generation
- B2B/B2C invoice classification
- HSN code validation
- E-Way Bill generation (for interstate)
- GSTIN verification

**Files to Create**:
```
backend/core/gst_compliance_engine.py
backend/api/routers/gst.py
```

---

## 🛠️ DEVELOPMENT GUIDELINES

### **Architecture Patterns (MUST FOLLOW)**

#### 1. **Repository Pattern**
```python
# ALWAYS use repositories, NEVER use Database.get_collection() directly in routers
class MyRepository(BaseRepository):
    @property
    def entity_name(self) -> str:
        return "MyEntity"

    @property
    def id_field(self) -> str:
        return "entity_id"

    def custom_query(self, param: str) -> List[Dict]:
        return self.find_many({"field": param})
```

#### 2. **Engine-Based Business Logic**
```python
# Complex business rules go in engines, NOT in routers
class MyEngine:
    def __init__(self, repository):
        self.repo = repository

    def process_business_logic(self, data: Dict) -> Tuple[bool, str]:
        # Validation
        # Calculation
        # State management
        return success, message
```

#### 3. **Router Pattern**
```python
# Routers are thin - just validation and delegation
@router.post("/endpoint")
async def endpoint(data: Schema, user: dict = Depends(get_current_user)):
    # 1. Validate permissions
    if not has_permission(user, "ACTION"):
        raise HTTPException(403, "Access denied")

    # 2. Delegate to engine/repository
    result = engine.process(data)

    # 3. Return response
    return {"success": True, "data": result}
```

### **Code Quality Standards**

#### **Security** (P0 - NEVER COMPROMISE)
```python
# ✅ ALWAYS sanitize input
sanitized_input = sanitize_string(user_input)

# ✅ ALWAYS validate permissions
if user_role not in ALLOWED_ROLES:
    raise HTTPException(403)

# ✅ ALWAYS use parameterized queries
collection.find({"field": value})  # ✅ Safe
collection.find(f"{{field: '{value}'}}")  # ❌ SQL injection

# ✅ ALWAYS hash passwords
hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())

# ✅ ALWAYS validate JWT
token = verify_jwt(request.headers.get("Authorization"))
```

#### **Error Handling**
```python
# ✅ ALWAYS try-except external APIs
try:
    response = requests.post(external_api_url, json=data)
    response.raise_for_status()
except requests.RequestException as e:
    logger.error(f"External API failed: {e}")
    raise HTTPException(503, "Service unavailable")
```

#### **Logging**
```python
# ✅ ALWAYS log important actions
logger.info(f"User {user_id} created order {order_id}")
logger.error(f"Payment failed for order {order_id}: {error}")
logger.warning(f"Stock low for product {product_id}: {quantity} units")
```

### **Frontend Guidelines**

#### **Component Structure**
```typescript
// ✅ Reusable components in /components
// ✅ Page components in /pages
// ✅ Use TypeScript for all new code
// ✅ Use TanStack Query for data fetching

const MyComponent = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['resource', id],
    queryFn: () => api.getResource(id)
  });

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return <div>{/* Component JSX */}</div>;
};
```

#### **API Integration**
```typescript
// ✅ ALWAYS use api.ts for API calls
// ✅ ALWAYS handle loading and error states
// ✅ ALWAYS show user feedback (toast notifications)

export const integrationApi = {
  doSomething: async (data: MyData) => {
    const response = await api.post('/endpoint', data);
    return response.data;
  }
};
```

---

## 🚨 CRITICAL RULES (NEVER BREAK)

### **DO NOT:**
1. ❌ Modify `SYSTEM_INTENT.md` (it's the supreme authority)
2. ❌ Change existing business rules without explicit approval
3. ❌ Remove audit logging
4. ❌ Bypass approval chains
5. ❌ Use `Database.get_collection()` directly in routers (use repositories)
6. ❌ Store passwords in plain text
7. ❌ Skip input validation
8. ❌ Hardcode secrets in code (use environment variables)
9. ❌ Delete existing tests
10. ❌ Push directly to main branch

### **ALWAYS:**
1. ✅ Follow repository pattern for data access
2. ✅ Use engines for complex business logic
3. ✅ Validate user permissions
4. ✅ Log important actions
5. ✅ Handle errors gracefully
6. ✅ Write descriptive commit messages
7. ✅ Test with different role scenarios
8. ✅ Check SYSTEM_INTENT.md for business rules
9. ✅ Use TEST_CREDENTIALS.md for testing
10. ✅ Push to feature branches (claude/* pattern)

---

## 🔍 TESTING APPROACH

### **Test Each Integration**
1. **API Testing**: Use `/docs` (Swagger UI) or Postman
2. **Unit Tests**: `pytest` for Python
3. **Integration Tests**: End-to-end flows
4. **Role Tests**: Test with different user roles
5. **Error Tests**: Test failure scenarios

### **Example Test Scenarios**
```python
# Test Razorpay integration
def test_razorpay_payment_success():
    # Create order
    # Initiate payment
    # Verify callback
    # Check order status updated

def test_razorpay_payment_failure():
    # Create order
    # Simulate failed payment
    # Verify order status remains pending
    # Check retry mechanism
```

---

## 📦 GIT WORKFLOW

### **Branch Naming**
```bash
# MUST start with "claude/" and end with session ID
git checkout -b claude/razorpay-integration-ABC123

# DO NOT use these patterns (will fail push)
git checkout -b feature/razorpay  # ❌ Wrong
git checkout -b razorpay  # ❌ Wrong
```

### **Commit Messages**
```bash
# Format: feat|fix|docs|refactor: Description - Details
git commit -m "feat: Implement Razorpay payment gateway - P2 Integration

- Create payment order endpoint
- Add callback verification
- Implement refund processing
- Add payment status tracking

Files:
- backend/core/payment_gateway_engine.py (NEW)
- backend/api/routers/payments.py (NEW)
- frontend/src/components/pos/RazorpayPaymentModal.tsx (NEW)

Refs: P2 Integration #1 (Razorpay)
"
```

### **Push with Retry**
```bash
#!/bin/bash
BRANCH="claude/your-branch-SessionID"
MAX_RETRIES=4
ATTEMPT=1
DELAY=2

while [ $ATTEMPT -le $MAX_RETRIES ]; do
  echo "Attempt $ATTEMPT: Pushing to origin/$BRANCH..."

  if git push -u origin "$BRANCH"; then
    echo "✓ Push successful!"
    exit 0
  else
    if [ $ATTEMPT -lt $MAX_RETRIES ]; then
      echo "✗ Push failed. Retrying in ${DELAY}s..."
      sleep $DELAY
      DELAY=$((DELAY * 2))
    else
      echo "✗ Push failed after $MAX_RETRIES attempts."
      exit 1
    fi
  fi

  ATTEMPT=$((ATTEMPT + 1))
done
```

---

## 📂 FILE LOCATIONS REFERENCE

```
PROJECT ROOT: /home/user/IMS-2.0-Claude-/ims-2.0-core/

Backend Key Files:
├── backend/api/main.py                           # Router registration
├── backend/api/routers/*.py                      # 15 routers
├── backend/core/*_engine.py                      # Business logic engines
├── backend/database/repositories/*.py            # Data access layer
├── backend/api/middleware.py                     # Security, rate limiting
└── backend/requirements.txt                      # Dependencies

Frontend Key Files:
├── frontend/src/App.tsx                          # Route definitions
├── frontend/src/services/api.ts                  # API client
├── frontend/src/pages/*.tsx                      # Page components
├── frontend/src/components/*/*.tsx               # Reusable components
├── frontend/src/utils/*.ts                       # Utilities
└── frontend/package.json                         # Dependencies

Documentation:
├── ims-2.0-core/docs/SYSTEM_INTENT.md           # SUPREME AUTHORITY
├── ims-2.0-core/TEST_CREDENTIALS.md             # Test accounts
└── EMERGENT_PROMPT.md                           # This file
```

---

## 🎯 SESSION START CHECKLIST

### **Before Starting Code**
- [ ] Read TEST_CREDENTIALS.md for test data
- [ ] Verify git branch is correct format (claude/*-SessionID)
- [ ] Check SYSTEM_INTENT.md for relevant business rules
- [ ] Review existing similar implementations (e.g., check orders.py for API pattern)
- [ ] Plan architecture (repository → engine → router → frontend)

### **During Development**
- [ ] Follow repository pattern (no direct DB access in routers)
- [ ] Add error handling for all external API calls
- [ ] Log important actions
- [ ] Validate user permissions
- [ ] Test with different role scenarios

### **Before Committing**
- [ ] Syntax check: `python3 -m py_compile file.py`
- [ ] Test endpoints: `/docs` Swagger UI
- [ ] Verify imports work
- [ ] Write descriptive commit message
- [ ] Push with retry logic

### **After Pushing**
- [ ] Verify push succeeded: `git status`
- [ ] Update documentation if needed
- [ ] Create handover notes for next session

---

## 💡 QUICK START COMMANDS

```bash
# Navigate to project
cd /home/user/IMS-2.0-Claude-/ims-2.0-core

# Check current branch
git branch --show-current

# Create new feature branch
git checkout -b claude/razorpay-integration-XYZ123

# Verify backend syntax
python3 -m py_compile backend/api/routers/new_router.py

# Check git status
git status --short

# Commit changes
git add .
git commit -m "feat: Your feature - Details"

# Push with retry
git push -u origin claude/razorpay-integration-XYZ123

# View recent commits
git log --oneline -5
```

---

## 🎊 SUCCESS CRITERIA

Your work is complete when:
1. ✅ All P2 integrations implemented
2. ✅ All endpoints tested and working
3. ✅ Error handling in place
4. ✅ User permissions validated
5. ✅ Audit logging added
6. ✅ Frontend components created
7. ✅ API integration complete
8. ✅ Documentation updated
9. ✅ All changes committed and pushed
10. ✅ Handover notes prepared

---

## 📞 SUPPORT

- **Documentation**: `/docs/SYSTEM_INTENT.md`
- **Test Data**: `/TEST_CREDENTIALS.md`
- **API Docs**: `http://localhost:8000/docs`
- **Git History**: `git log --graph --oneline`

---

## 🚀 START BUILDING!

Begin with **Razorpay Payment Gateway Integration** (highest priority P2 feature).

Good luck! 🎉

---

**Created**: 2026-01-21
**Session**: Continue IMS Development
**Branch**: `claude/continue-ims-development-KktXu`
**Status**: Ready for next phase
