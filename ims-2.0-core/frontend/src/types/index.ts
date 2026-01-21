// ============================================================================
// IMS 2.0 - TypeScript Type Definitions
// ============================================================================

// Brands
export type Brand = 'BETTER_VISION' | 'WIZOPT';

// User Roles - matching backend exactly
export type UserRole =
  | 'SUPERADMIN'
  | 'ADMIN'
  | 'AREA_MANAGER'
  | 'STORE_MANAGER'
  | 'ACCOUNTANT'
  | 'CATALOG_MANAGER'
  | 'OPTOMETRIST'
  | 'SALES_CASHIER'
  | 'SALES_STAFF'
  | 'WORKSHOP_STAFF';

// Product Categories - complete list
export type ProductCategory =
  | 'FRAME'
  | 'SUNGLASS'
  | 'READING_GLASSES'
  | 'OPTICAL_LENS'
  | 'CONTACT_LENS'
  | 'COLORED_CONTACT_LENS'
  | 'WATCH'
  | 'SMARTWATCH'
  | 'SMARTGLASSES'
  | 'WALL_CLOCK'
  | 'ACCESSORIES'
  | 'SERVICES';

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  roles: UserRole[];
  activeRole: UserRole;
  storeIds: string[];
  activeStoreId: string;
  discountCap: number;
  isActive: boolean;
  geoRestricted: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  storeId?: string;
  latitude?: number;
  longitude?: number;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  requiresStoreSelection?: boolean;
  availableStores?: Store[];
}

// ============================================================================
// Store Types
// ============================================================================

export interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  brand: Brand;
  gstin: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
  latitude: number;
  longitude: number;
  geoFenceRadius: number;
  isActive: boolean;
  isHQ: boolean;
  enabledCategories: ProductCategory[];
  openingTime: string;
  closingTime: string;
}

// ============================================================================
// Product Types
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  category: ProductCategory;
  brand: string;
  model: string;
  variant: string;
  name: string;
  description: string;
  mrp: number;
  offerPrice: number;
  discountCategory: 'MASS' | 'PREMIUM' | 'LUXURY' | 'SERVICE';
  hsnCode: string;
  gstRate: number;
  attributes: Record<string, string>;
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export interface StockUnit {
  id: string;
  productId: string;
  storeId: string;
  barcode: string;
  quantity: number;
  reservedQuantity: number;
  locationCode: string;
  batchNumber?: string;
  expiryDate?: string;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'TRANSFERRED' | 'DAMAGED';
  barcodeprinted: boolean;
}

// ============================================================================
// Customer Types
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  customerType: 'B2C' | 'B2B';
  gstNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  patients: Patient[];
  createdAt: string;
}

export interface Patient {
  id: string;
  customerId: string;
  name: string;
  relation?: string;
  dateOfBirth?: string;
  phone?: string;
}

// ============================================================================
// Prescription Types
// ============================================================================

export interface EyePower {
  sphere: number;
  cylinder: number | null;
  axis: number | null;
  add: number | null;
  pd: number;
  va?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  customerId: string;
  storeId: string;
  optometristId?: string;
  optometristName?: string;
  testDate: string;
  rightEye: EyePower;
  leftEye: EyePower;
  recommendation?: string;
  status: 'PENDING' | 'COMPLETED' | 'EXTERNAL';
  isExternal?: boolean;
  externalSource?: string;
  validityMonths?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Order Types
// ============================================================================

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID';

export type PaymentMode =
  | 'CASH'
  | 'UPI'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'EMI'
  | 'CREDIT'
  | 'GIFT_VOUCHER';

export interface OrderItem {
  id: string;
  itemType: ProductCategory | 'LENS' | 'SERVICE';
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  prescriptionId?: string;
}

export interface Payment {
  id: string;
  mode: PaymentMode;
  amount: number;
  reference?: string;
  paidAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  patientId?: string;
  patientName?: string;
  items: OrderItem[];
  payments: Payment[];
  subtotal: number;
  totalDiscount: number;
  taxAmount: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  createdBy: string;
  createdAt: string;
  deliveredAt?: string;
}

// ============================================================================
// Workshop Types
// ============================================================================

export type JobStatus =
  | 'CREATED'
  | 'LENS_ORDERED'
  | 'LENS_RECEIVED'
  | 'IN_PROGRESS'
  | 'QC_PENDING'
  | 'QC_PASSED'
  | 'QC_FAILED'
  | 'READY'
  | 'DELIVERED'
  | 'CANCELLED';

export type JobPriority = 'NORMAL' | 'EXPRESS' | 'URGENT';

export interface WorkshopJob {
  id: string;
  jobNumber: string;
  jobType: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  frameBarcode?: string;
  frameName?: string;
  prescriptionId?: string;
  status: JobStatus;
  priority: JobPriority;
  assignedTo?: string;
  assignedName?: string;
  expectedDate: string;
  promisedDate: string;
  completedAt?: string;
  deliveredAt?: string;
  notes?: string;
  qcNotes?: string;
}

// ============================================================================
// HR Types
// ============================================================================

export interface Attendance {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLat?: number;
  checkInLon?: number;
  lateMinutes: number;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
}

export interface Leave {
  id: string;
  userId: string;
  userName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardStats {
  todaySales: number;
  todayOrders: number;
  pendingJobs: number;
  lowStockItems: number;
  todayFootfall: number;
  monthSales: number;
  monthTarget: number;
  targetAchievement: number;
}

export interface SalesTrend {
  date: string;
  amount: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  revenue: number;
}

// ============================================================================
// Task Types with P0-P4 Priority System
// ============================================================================

export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED' | 'CANCELLED';
export type TaskType = 'FOLLOW_UP' | 'CALLBACK' | 'DELIVERY' | 'REMINDER' | 'STOCK_COUNT' | 'ESCALATION' | 'SYSTEM' | 'OTHER';

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bgColor: string; description: string }> = {
  P0: { label: 'P0 - Critical', color: 'text-red-900', bgColor: 'bg-red-900', description: 'Business Risk - Immediate action required' },
  P1: { label: 'P1 - Urgent', color: 'text-red-600', bgColor: 'bg-red-600', description: 'Urgent - Same day resolution' },
  P2: { label: 'P2 - Important', color: 'text-orange-500', bgColor: 'bg-orange-500', description: 'Important - Within 24 hours' },
  P3: { label: 'P3 - Normal', color: 'text-yellow-500', bgColor: 'bg-yellow-500', description: 'Normal - Within 48 hours' },
  P4: { label: 'P4 - Low', color: 'text-blue-500', bgColor: 'bg-blue-500', description: 'Informational - When time permits' },
};

export interface Task {
  id: string;
  taskNumber: string;
  type: TaskType;
  priority: TaskPriority;
  title: string;
  description: string;
  storeId: string;
  assignedTo: string;
  assignedName: string;
  createdBy: string;
  createdByName: string;
  dueDate: string;
  dueTime?: string;
  status: TaskStatus;
  linkedEntityType?: 'ORDER' | 'STOCK' | 'CUSTOMER' | 'PRESCRIPTION' | 'JOB';
  linkedEntityId?: string;
  escalationLevel: number;
  escalationHistory: TaskEscalation[];
  isSystemGenerated: boolean;
  completedAt?: string;
  completedBy?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskEscalation {
  level: number;
  escalatedTo: string;
  escalatedToName: string;
  escalatedBy: string;
  escalatedByName: string;
  reason: string;
  escalatedAt: string;
}

// ============================================================================
// Discount & Approval Types
// ============================================================================

export type DiscountCategory = 'MASS' | 'PREMIUM' | 'LUXURY' | 'SERVICE' | 'NON_DISCOUNTABLE';

export interface DiscountRule {
  id: string;
  role: UserRole;
  category: ProductCategory;
  discountCategory: DiscountCategory;
  maxDiscountPercent: number;
  brandOverrides?: Record<string, number>; // brand name -> max discount
  requiresApproval: boolean;
  createdAt: string;
}

export const CATEGORY_DISCOUNT_CAPS: Record<DiscountCategory, number> = {
  MASS: 15,
  PREMIUM: 20,
  LUXURY: 5,
  SERVICE: 10,
  NON_DISCOUNTABLE: 0,
};

export const LUXURY_BRAND_CAPS: Record<string, number> = {
  'Cartier': 2,
  'Chopard': 2,
  'Bvlgari': 2,
  'Gucci': 5,
  'Prada': 5,
  'Versace': 5,
  'Burberry': 5,
};

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DiscountApproval {
  id: string;
  orderId?: string;
  orderItemId?: string;
  storeId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: UserRole;
  productId: string;
  productName: string;
  mrp: number;
  offerPrice: number;
  requestedDiscount: number;
  roleCap: number;
  categoryCap: number;
  brandCap?: number;
  effectiveCap: number;
  reason: string;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  approvedByRole?: UserRole;
  approvedDiscount?: number;
  approvalRemarks?: string;
  createdAt: string;
  processedAt?: string;
}

// ============================================================================
// Stock Transfer Types
// ============================================================================

export type TransferStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SENT' | 'RECEIVED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromStoreId: string;
  fromStoreName: string;
  toStoreId: string;
  toStoreName: string;
  status: TransferStatus;
  items: StockTransferItem[];
  totalItems: number;
  totalQuantity: number;
  barcodeRemovedConfirmed: boolean;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
  sentAt?: string;
  sentBy?: string;
  receivedAt?: string;
  receivedBy?: string;
  receivedByName?: string;
  mismatchNotes?: string;
  hasMismatch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransferItem {
  id: string;
  stockUnitId: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  sentQuantity: number;
  receivedQuantity?: number;
  hasMismatch: boolean;
  mismatchReason?: string;
}

// ============================================================================
// Stock Count/Audit Types
// ============================================================================

export type StockCountStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'ADJUSTMENT_REQUIRED';

export interface StockCount {
  id: string;
  countNumber: string;
  storeId: string;
  storeName: string;
  category?: ProductCategory;
  locationCode?: string;
  status: StockCountStatus;
  conductedBy: string;
  conductedByName: string;
  items: StockCountItem[];
  totalSystemQty: number;
  totalPhysicalQty: number;
  totalVariance: number;
  hasVariance: boolean;
  approvedBy?: string;
  approvedByName?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface StockCountItem {
  id: string;
  stockUnitId: string;
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  locationCode: string;
  systemQuantity: number;
  physicalQuantity: number;
  variance: number;
  scannedAt?: string;
  notes?: string;
}

// ============================================================================
// Extended Prescription Types (with PRISM, BASE, ACUITY)
// ============================================================================

export interface ExtendedEyePower {
  sphere: number | null;
  cylinder: number | null;
  axis: number | null; // Must be whole number 1-180
  add: number | null;
  pd: number | null;
  prism?: number | null;
  base?: 'UP' | 'DOWN' | 'IN' | 'OUT' | null;
  va?: string; // Visual Acuity e.g., "6/6", "6/9"
}

export interface ExtendedPrescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  customerId: string;
  customerName: string;
  storeId: string;
  storeName: string;
  source: 'TESTED_AT_STORE' | 'FROM_DOCTOR';
  optometristId?: string;
  optometristName?: string;
  externalDoctorName?: string;
  externalDoctorClinic?: string;
  testDate: string;
  rightEye: ExtendedEyePower;
  leftEye: ExtendedEyePower;
  lensRecommendation?: string;
  coatingRecommendation?: string;
  remarks?: string;
  validityMonths: number; // 6-24 months, optometrist decides
  expiryDate: string;
  isExpired: boolean;
  previousPrescriptionId?: string;
  status: 'PENDING' | 'COMPLETED' | 'EXTERNAL';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// HR Extended Types (Payroll, Leave Balance, Shifts)
// ============================================================================

export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' | 'MATERNITY' | 'PATERNITY';

export interface LeaveBalance {
  userId: string;
  year: number;
  casual: { total: number; used: number; balance: number };
  sick: { total: number; used: number; balance: number };
  earned: { total: number; used: number; balance: number };
  unpaid: { total: number; used: number; balance: number };
  maternity?: { total: number; used: number; balance: number };
  paternity?: { total: number; used: number; balance: number };
}

export interface ExtendedLeave {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  storeId: string;
  storeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedByName?: string;
  approvalRemarks?: string;
  appliedAt: string;
  processedAt?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:MM format
  endTime: string;
  breakMinutes: number;
  isDefault: boolean;
}

export interface ShiftAssignment {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  shiftId: string;
  shiftName: string;
  date: string;
  weekday: string;
  originalShiftId?: string; // If swapped
  swapApprovedBy?: string;
}

export interface Payroll {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  storeId: string;
  storeName: string;
  month: number;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  otherAllowances: number;
  grossSalary: number;
  attendanceDeduction: number;
  lateDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  incentiveAmount: number;
  overtimeAmount: number;
  netSalary: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID';
  calculatedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  paymentRef?: string;
}

export interface SalesTarget {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  month: number;
  year: number;
  targetAmount: number;
  achievedAmount: number;
  achievementPercent: number;
  incentiveSlabs: IncentiveSlab[];
  earnedIncentive: number;
}

export interface IncentiveSlab {
  minPercent: number;
  maxPercent: number;
  incentivePercent: number;
}

// ============================================================================
// GST & Invoice Types
// ============================================================================

export type GSTType = 'CGST_SGST' | 'IGST';
export type InvoiceType = 'TAX_INVOICE' | 'DELIVERY_CHALLAN' | 'CREDIT_NOTE' | 'DEBIT_NOTE';

export interface GSTDetails {
  type: GSTType;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalGST: number;
  hsnCode: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  storeGSTIN: string;
  storeAddress: string;
  customerId: string;
  customerName: string;
  customerGSTIN?: string;
  customerAddress?: string;
  isB2B: boolean;
  items: InvoiceItem[];
  subtotal: number;
  discountAmount: number;
  gstDetails: GSTDetails;
  grandTotal: number;
  amountInWords: string;
  invoiceDate: string;
  createdBy: string;
  createdAt: string;
}

export interface InvoiceItem {
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  total: number;
}

// ============================================================================
// Settings/Configuration Types
// ============================================================================

export interface StoreSettings {
  storeId: string;
  enabledCategories: ProductCategory[];
  geoFenceRadius: number;
  latitude: number;
  longitude: number;
  openingTime: string;
  closingTime: string;
  autoGenerateTasks: boolean;
  prescriptionValidityDefault: number;
  escalationTimeframes: EscalationTimeframe[];
}

export interface EscalationTimeframe {
  priority: TaskPriority;
  escalateAfterMinutes: number;
  notifyRoles: UserRole[];
}

export interface DiscountSettings {
  roleDiscountCaps: Record<UserRole, number>;
  categoryDiscountCaps: Record<DiscountCategory, number>;
  brandDiscountCaps: Record<string, number>;
  requireApprovalAbove: number;
}

export interface IntegrationSettings {
  shopify: {
    enabled: boolean;
    shopUrl?: string;
    apiKey?: string;
    autoSync: boolean;
  };
  tally: {
    enabled: boolean;
    companyName?: string;
    exportPath?: string;
  };
  shiprocket: {
    enabled: boolean;
    email?: string;
    apiToken?: string;
  };
  whatsapp: {
    enabled: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
  };
  razorpay: {
    enabled: boolean;
    keyId?: string;
    testMode: boolean;
  };
  gstPortal: {
    enabled: boolean;
    gstin?: string;
    username?: string;
  };
}

// ============================================================================
// Notification/Toast Types
// ============================================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Outstanding/Credit Types
// ============================================================================

export interface OutstandingBalance {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalOutstanding: number;
  orders: OutstandingOrder[];
  lastPaymentDate?: string;
  oldestDueDate: string;
  daysOverdue: number;
  agingBucket: '0-30' | '31-60' | '61-90' | '90+';
}

export interface OutstandingOrder {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  dueDate?: string;
  daysOverdue: number;
}

// ============================================================================
// Employee Self-Service Types
// ============================================================================

export interface EmployeeSelfService {
  userId: string;
  userName: string;
  userRole: UserRole;
  storeId: string;
  storeName: string;
  attendance: {
    thisMonth: AttendanceSummary;
    lastMonth: AttendanceSummary;
  };
  leaveBalance: LeaveBalance;
  salarySlips: SalarySlipSummary[];
  assignedStock: AssignedStockSummary;
  targets: SalesTarget;
}

export interface AttendanceSummary {
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  averageCheckIn: string;
  averageCheckOut: string;
}

export interface SalarySlipSummary {
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  status: string;
}

export interface AssignedStockSummary {
  totalItems: number;
  totalValue: number;
  categories: { category: ProductCategory; count: number; value: number }[];
}
