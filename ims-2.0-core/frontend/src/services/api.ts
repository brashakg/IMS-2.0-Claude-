// ============================================================================
// IMS 2.0 - API Service
// ============================================================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, LoginCredentials, LoginResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';

// Create axios instance
// If API_BASE_URL is set (e.g., http://localhost:8001), use it with /api/v1
// If empty, use proxy path /api/v1
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api/${API_VERSION}` : `/api/${API_VERSION}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('ims_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; detail?: string }>) => {
    if (error.response?.status === 401) {
      // Clear auth state on unauthorized
      localStorage.removeItem('ims_token');
      localStorage.removeItem('ims_user');
      window.location.href = '/login';
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'An error occurred';

    return Promise.reject(new Error(message));
  }
);

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Backend expects 'username' instead of 'email'
    const payload = {
      username: credentials.email,
      password: credentials.password,
      store_id: credentials.storeId,
      latitude: credentials.latitude,
      longitude: credentials.longitude,
    };
    const response = await api.post<LoginResponse>('/auth/login', payload);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('ims_token');
    localStorage.removeItem('ims_user');
  },

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await api.post<{ token: string }>('/auth/refresh');
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

// ============================================================================
// Store API
// ============================================================================

export const storeApi = {
  getStores: async () => {
    const response = await api.get('/stores');
    return response.data;
  },

  getStore: async (storeId: string) => {
    const response = await api.get(`/stores/${storeId}`);
    return response.data;
  },

  getStoreStats: async (storeId: string) => {
    const response = await api.get(`/stores/${storeId}/stats`);
    return response.data;
  },
};

// ============================================================================
// Product API
// ============================================================================

export const productApi = {
  getProducts: async (params?: { category?: string; brand?: string; search?: string }) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  getProduct: async (productId: string) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/products/categories/list');
    return response.data;
  },

  getBrands: async (category?: string) => {
    const response = await api.get('/products/brands/list', { params: { category } });
    return response.data;
  },

  searchProducts: async (query: string, category?: string) => {
    const response = await api.get('/products/search', { params: { q: query, category } });
    return response.data;
  },
};

// ============================================================================
// Inventory API
// ============================================================================

export const inventoryApi = {
  getStock: async (storeId: string, productId?: string) => {
    const response = await api.get('/inventory/stock', { params: { store_id: storeId, product_id: productId } });
    return response.data;
  },

  getStockByBarcode: async (barcode: string) => {
    const response = await api.get(`/inventory/barcode/${barcode}`);
    return response.data;
  },

  getLowStock: async (storeId: string) => {
    const response = await api.get('/inventory/low-stock', { params: { store_id: storeId } });
    return response.data;
  },

  getExpiringStock: async (storeId: string, days: number = 30) => {
    const response = await api.get('/inventory/expiring', { params: { store_id: storeId, days } });
    return response.data;
  },

  createTransfer: async (data: { fromStoreId: string; toStoreId: string; items: Array<{ stockId: string; quantity: number }> }) => {
    const response = await api.post('/inventory/transfers', data);
    return response.data;
  },

  getTransfers: async (storeId: string, direction: 'incoming' | 'outgoing') => {
    const response = await api.get('/inventory/transfers', { params: { store_id: storeId, direction } });
    return response.data;
  },
};

// ============================================================================
// Customer API
// ============================================================================

export const customerApi = {
  getCustomers: async (params?: { search?: string; page?: number; pageSize?: number }) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },

  getCustomer: async (customerId: string) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (data: Partial<import('../types').Customer>) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (customerId: string, data: Partial<import('../types').Customer>) => {
    const response = await api.put(`/customers/${customerId}`, data);
    return response.data;
  },

  searchByPhone: async (phone: string) => {
    const response = await api.get('/customers/search/phone', { params: { phone } });
    return response.data;
  },

  addPatient: async (customerId: string, patient: Partial<import('../types').Patient>) => {
    const response = await api.post(`/customers/${customerId}/patients`, patient);
    return response.data;
  },
};

// ============================================================================
// Order API
// ============================================================================

export const orderApi = {
  getOrders: async (params?: { storeId?: string; status?: string; date?: string }) => {
    const response = await api.get('/orders', { params });
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  createOrder: async (data: Partial<import('../types').Order>) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  addOrderItem: async (orderId: string, item: Partial<import('../types').OrderItem>) => {
    const response = await api.post(`/orders/${orderId}/items`, item);
    return response.data;
  },

  removeOrderItem: async (orderId: string, itemId: string) => {
    const response = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return response.data;
  },

  addPayment: async (orderId: string, payment: Partial<import('../types').Payment>) => {
    const response = await api.post(`/orders/${orderId}/payments`, payment);
    return response.data;
  },

  confirmOrder: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/confirm`);
    return response.data;
  },

  deliverOrder: async (orderId: string) => {
    const response = await api.post(`/orders/${orderId}/deliver`);
    return response.data;
  },

  cancelOrder: async (orderId: string, reason: string) => {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data;
  },
};

// ============================================================================
// Prescription API
// ============================================================================

export const prescriptionApi = {
  getPrescriptions: async (patientId: string) => {
    const response = await api.get('/prescriptions', { params: { patient_id: patientId } });
    return response.data;
  },

  getPrescription: async (prescriptionId: string) => {
    const response = await api.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  createPrescription: async (data: Partial<import('../types').Prescription>) => {
    const response = await api.post('/prescriptions', data);
    return response.data;
  },

  validatePrescription: async (prescriptionId: string) => {
    const response = await api.get(`/prescriptions/${prescriptionId}/validate`);
    return response.data;
  },
};

// ============================================================================
// Workshop API
// ============================================================================

export const workshopApi = {
  getJobs: async (storeId: string, status?: string) => {
    const response = await api.get('/workshop/jobs', { params: { store_id: storeId, status } });
    return response.data;
  },

  getJob: async (jobId: string) => {
    const response = await api.get(`/workshop/jobs/${jobId}`);
    return response.data;
  },

  updateJobStatus: async (jobId: string, status: string, notes?: string) => {
    const response = await api.patch(`/workshop/jobs/${jobId}/status`, { status, notes });
    return response.data;
  },

  assignJob: async (jobId: string, staffId: string) => {
    const response = await api.post(`/workshop/jobs/${jobId}/assign`, { staff_id: staffId });
    return response.data;
  },
};

// ============================================================================
// Reports API
// ============================================================================

export const reportsApi = {
  getSalesSummary: async (storeId: string, startDate: string, endDate: string) => {
    const response = await api.get('/reports/sales/summary', {
      params: { store_id: storeId, start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  getDashboardStats: async (storeId: string) => {
    const response = await api.get('/reports/dashboard', { params: { store_id: storeId } });
    return response.data;
  },

  getInventoryReport: async (storeId: string) => {
    const response = await api.get('/reports/inventory', { params: { store_id: storeId } });
    return response.data;
  },
};

// ============================================================================
// HR API
// ============================================================================

export const hrApi = {
  getAttendance: async (storeId: string, date?: string) => {
    const response = await api.get('/hr/attendance', { params: { store_id: storeId, date } });
    return response.data;
  },

  checkIn: async (storeId: string, latitude: number, longitude: number) => {
    const response = await api.post('/hr/attendance/check-in', {
      store_id: storeId,
      latitude,
      longitude,
    });
    return response.data;
  },

  checkOut: async (attendanceId: string) => {
    const response = await api.post(`/hr/attendance/${attendanceId}/check-out`);
    return response.data;
  },

  getLeaves: async (params?: { userId?: string; status?: string }) => {
    const response = await api.get('/hr/leaves', { params });
    return response.data;
  },

  applyLeave: async (data: Partial<import('../types').Leave>) => {
    const response = await api.post('/hr/leaves', data);
    return response.data;
  },

  approveLeave: async (leaveId: string, approved: boolean, remarks?: string) => {
    const response = await api.post(`/hr/leaves/${leaveId}/approve`, { approved, remarks });
    return response.data;
  },
};

// ============================================================================
// Task API
// ============================================================================

export const taskApi = {
  getTasks: async (params?: { storeId?: string; status?: string; assignedTo?: string; priority?: string }) => {
    const response = await api.get('/tasks', { params });
    return response.data;
  },

  getTask: async (taskId: string) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  createTask: async (data: Partial<import('../types').Task>) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  updateTask: async (taskId: string, data: Partial<import('../types').Task>) => {
    const response = await api.patch(`/tasks/${taskId}`, data);
    return response.data;
  },

  completeTask: async (taskId: string, remarks?: string) => {
    const response = await api.post(`/tasks/${taskId}/complete`, { remarks });
    return response.data;
  },

  escalateTask: async (taskId: string, reason: string, escalateTo?: string) => {
    const response = await api.post(`/tasks/${taskId}/escalate`, { reason, escalate_to: escalateTo });
    return response.data;
  },

  reassignTask: async (taskId: string, assignTo: string) => {
    const response = await api.post(`/tasks/${taskId}/reassign`, { assign_to: assignTo });
    return response.data;
  },

  getMyTasks: async (status?: string) => {
    const response = await api.get('/tasks/my', { params: { status } });
    return response.data;
  },

  getEscalatedTasks: async () => {
    const response = await api.get('/tasks/escalated');
    return response.data;
  },
};

// ============================================================================
// Discount Approval API
// ============================================================================

export const approvalApi = {
  requestDiscountApproval: async (data: {
    orderId?: string;
    orderItemId?: string;
    productId: string;
    productName: string;
    mrp: number;
    offerPrice: number;
    requestedDiscount: number;
    reason: string;
  }) => {
    const response = await api.post('/approvals/discount', data);
    return response.data;
  },

  getPendingApprovals: async (storeId?: string) => {
    const response = await api.get('/approvals/discount/pending', { params: { store_id: storeId } });
    return response.data;
  },

  approveDiscount: async (approvalId: string, approvedDiscount: number, remarks?: string) => {
    const response = await api.post(`/approvals/discount/${approvalId}/approve`, {
      approved_discount: approvedDiscount,
      remarks,
    });
    return response.data;
  },

  rejectDiscount: async (approvalId: string, remarks: string) => {
    const response = await api.post(`/approvals/discount/${approvalId}/reject`, { remarks });
    return response.data;
  },

  getApprovalHistory: async (params?: { storeId?: string; status?: string; startDate?: string; endDate?: string }) => {
    const response = await api.get('/approvals/discount/history', { params });
    return response.data;
  },
};

// ============================================================================
// Stock Transfer API
// ============================================================================

export const transferApi = {
  getTransfers: async (storeId: string, direction: 'incoming' | 'outgoing' | 'all') => {
    const response = await api.get('/inventory/transfers', { params: { store_id: storeId, direction } });
    return response.data;
  },

  getTransfer: async (transferId: string) => {
    const response = await api.get(`/inventory/transfers/${transferId}`);
    return response.data;
  },

  createTransfer: async (data: {
    fromStoreId: string;
    toStoreId: string;
    items: Array<{ stockUnitId: string; quantity: number }>;
  }) => {
    const response = await api.post('/inventory/transfers', data);
    return response.data;
  },

  approveTransfer: async (transferId: string) => {
    const response = await api.post(`/inventory/transfers/${transferId}/approve`);
    return response.data;
  },

  confirmBarcodeRemoval: async (transferId: string) => {
    const response = await api.post(`/inventory/transfers/${transferId}/confirm-barcode-removal`);
    return response.data;
  },

  sendTransfer: async (transferId: string) => {
    const response = await api.post(`/inventory/transfers/${transferId}/send`);
    return response.data;
  },

  receiveTransfer: async (transferId: string, items: Array<{ itemId: string; receivedQuantity: number; mismatchReason?: string }>) => {
    const response = await api.post(`/inventory/transfers/${transferId}/receive`, { items });
    return response.data;
  },

  completeTransfer: async (transferId: string) => {
    const response = await api.post(`/inventory/transfers/${transferId}/complete`);
    return response.data;
  },
};

// ============================================================================
// Stock Count API
// ============================================================================

export const stockCountApi = {
  getCounts: async (storeId: string, status?: string) => {
    const response = await api.get('/inventory/counts', { params: { store_id: storeId, status } });
    return response.data;
  },

  getCount: async (countId: string) => {
    const response = await api.get(`/inventory/counts/${countId}`);
    return response.data;
  },

  startCount: async (storeId: string, category?: string, locationCode?: string) => {
    const response = await api.post('/inventory/counts', { store_id: storeId, category, location_code: locationCode });
    return response.data;
  },

  scanItem: async (countId: string, barcode: string, physicalQuantity: number, notes?: string) => {
    const response = await api.post(`/inventory/counts/${countId}/scan`, { barcode, physical_quantity: physicalQuantity, notes });
    return response.data;
  },

  submitCount: async (countId: string) => {
    const response = await api.post(`/inventory/counts/${countId}/submit`);
    return response.data;
  },

  approveCount: async (countId: string, adjustStock: boolean) => {
    const response = await api.post(`/inventory/counts/${countId}/approve`, { adjust_stock: adjustStock });
    return response.data;
  },
};

// ============================================================================
// Payroll API
// ============================================================================

export const payrollApi = {
  getPayrolls: async (params?: { storeId?: string; month?: number; year?: number; status?: string }) => {
    const response = await api.get('/hr/payroll', { params });
    return response.data;
  },

  getPayroll: async (payrollId: string) => {
    const response = await api.get(`/hr/payroll/${payrollId}`);
    return response.data;
  },

  calculatePayroll: async (userId: string, month: number, year: number) => {
    const response = await api.post('/hr/payroll/calculate', { user_id: userId, month, year });
    return response.data;
  },

  calculateStorePayroll: async (storeId: string, month: number, year: number) => {
    const response = await api.post('/hr/payroll/calculate-store', { store_id: storeId, month, year });
    return response.data;
  },

  approvePayroll: async (payrollId: string) => {
    const response = await api.post(`/hr/payroll/${payrollId}/approve`);
    return response.data;
  },

  markPaid: async (payrollId: string, paymentRef: string) => {
    const response = await api.post(`/hr/payroll/${payrollId}/mark-paid`, { payment_ref: paymentRef });
    return response.data;
  },

  getSalarySlip: async (payrollId: string) => {
    const response = await api.get(`/hr/payroll/${payrollId}/slip`);
    return response.data;
  },

  getLeaveBalance: async (userId: string, year?: number) => {
    const response = await api.get(`/hr/leave-balance/${userId}`, { params: { year } });
    return response.data;
  },
};

// ============================================================================
// Target & Incentive API
// ============================================================================

export const targetApi = {
  getTargets: async (params?: { storeId?: string; userId?: string; month?: number; year?: number }) => {
    const response = await api.get('/hr/targets', { params });
    return response.data;
  },

  setTarget: async (userId: string, month: number, year: number, targetAmount: number) => {
    const response = await api.post('/hr/targets', { user_id: userId, month, year, target_amount: targetAmount });
    return response.data;
  },

  getMyTarget: async (month?: number, year?: number) => {
    const response = await api.get('/hr/targets/my', { params: { month, year } });
    return response.data;
  },

  getIncentiveSlabs: async () => {
    const response = await api.get('/hr/incentive-slabs');
    return response.data;
  },

  setIncentiveSlabs: async (slabs: Array<{ minPercent: number; maxPercent: number; incentivePercent: number }>) => {
    const response = await api.post('/hr/incentive-slabs', { slabs });
    return response.data;
  },
};

// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
  getStoreSettings: async (storeId: string) => {
    const response = await api.get(`/settings/store/${storeId}`);
    return response.data;
  },

  updateStoreSettings: async (storeId: string, settings: Partial<import('../types').StoreSettings>) => {
    const response = await api.patch(`/settings/store/${storeId}`, settings);
    return response.data;
  },

  getDiscountSettings: async () => {
    const response = await api.get('/settings/discounts');
    return response.data;
  },

  updateDiscountSettings: async (settings: Partial<import('../types').DiscountSettings>) => {
    const response = await api.patch('/settings/discounts', settings);
    return response.data;
  },

  getIntegrationSettings: async () => {
    const response = await api.get('/settings/integrations');
    return response.data;
  },

  updateIntegrationSettings: async (integration: string, settings: Record<string, unknown>) => {
    const response = await api.patch(`/settings/integrations/${integration}`, settings);
    return response.data;
  },

  testIntegration: async (integration: string) => {
    const response = await api.post(`/settings/integrations/${integration}/test`);
    return response.data;
  },
};

// ============================================================================
// Outstanding/Credit API
// ============================================================================

export const outstandingApi = {
  getOutstanding: async (params?: { storeId?: string; agingBucket?: string }) => {
    const response = await api.get('/finance/outstanding', { params });
    return response.data;
  },

  getCustomerOutstanding: async (customerId: string) => {
    const response = await api.get(`/finance/outstanding/${customerId}`);
    return response.data;
  },

  getAgingReport: async (storeId?: string) => {
    const response = await api.get('/finance/outstanding/aging', { params: { store_id: storeId } });
    return response.data;
  },

  recordPayment: async (orderId: string, payment: Partial<import('../types').Payment>) => {
    const response = await api.post(`/orders/${orderId}/payments`, payment);
    return response.data;
  },
};

// ============================================================================
// Employee Self-Service API
// ============================================================================

export const selfServiceApi = {
  getMyDashboard: async () => {
    const response = await api.get('/self-service/dashboard');
    return response.data;
  },

  getMyAttendance: async (month?: number, year?: number) => {
    const response = await api.get('/self-service/attendance', { params: { month, year } });
    return response.data;
  },

  getMyLeaveBalance: async () => {
    const response = await api.get('/self-service/leave-balance');
    return response.data;
  },

  getMySalarySlips: async () => {
    const response = await api.get('/self-service/salary-slips');
    return response.data;
  },

  getMyAssignedStock: async () => {
    const response = await api.get('/self-service/assigned-stock');
    return response.data;
  },

  getMyTarget: async () => {
    const response = await api.get('/self-service/target');
    return response.data;
  },
};

// ============================================================================
// GRN (Goods Receipt Note) API
// ============================================================================

export const grnApi = {
  getPendingGRN: async (storeId: string) => {
    const response = await api.get('/vendors/grn/pending', { params: { store_id: storeId } });
    return response.data;
  },

  getGRN: async (grnId: string) => {
    const response = await api.get(`/vendors/grn/${grnId}`);
    return response.data;
  },

  verifyGRNItem: async (grnId: string, itemId: string, receivedQty: number) => {
    const response = await api.post(`/vendors/grn/${grnId}/items/${itemId}/verify`, { received_qty: receivedQty });
    return response.data;
  },

  assignLocation: async (grnId: string, itemId: string, locationCode: string) => {
    const response = await api.post(`/vendors/grn/${grnId}/items/${itemId}/location`, { location_code: locationCode });
    return response.data;
  },

  printBarcode: async (grnId: string, itemId: string) => {
    const response = await api.post(`/vendors/grn/${grnId}/items/${itemId}/print-barcode`);
    return response.data;
  },

  acceptGRN: async (grnId: string) => {
    const response = await api.post(`/vendors/grn/${grnId}/accept`);
    return response.data;
  },

  escalateMismatch: async (grnId: string, itemId: string, notes: string) => {
    const response = await api.post(`/vendors/grn/${grnId}/items/${itemId}/escalate`, { notes });
    return response.data;
  },
};

// ============================================================================
// Print API
// ============================================================================

export const printApi = {
  generateInvoice: async (orderId: string) => {
    const response = await api.get(`/print/invoice/${orderId}`, { responseType: 'blob' });
    return response.data;
  },

  generateDeliveryChallan: async (transferId: string) => {
    const response = await api.get(`/print/challan/${transferId}`, { responseType: 'blob' });
    return response.data;
  },

  generateBarcode: async (stockUnitId: string) => {
    const response = await api.get(`/print/barcode/${stockUnitId}`, { responseType: 'blob' });
    return response.data;
  },

  generatePrescription: async (prescriptionId: string) => {
    const response = await api.get(`/print/prescription/${prescriptionId}`, { responseType: 'blob' });
    return response.data;
  },

  generateJobCard: async (jobId: string) => {
    const response = await api.get(`/print/job-card/${jobId}`, { responseType: 'blob' });
    return response.data;
  },

  generateSalarySlip: async (payrollId: string) => {
    const response = await api.get(`/print/salary-slip/${payrollId}`, { responseType: 'blob' });
    return response.data;
  },

  generateEstimate: async (orderId: string) => {
    const response = await api.get(`/print/estimate/${orderId}`, { responseType: 'blob' });
    return response.data;
  },
};

// ============================================================================
// Integrations API
// ============================================================================

export const integrationsApi = {
  getDashboard: async () => {
    const response = await api.get('/integrations/dashboard');
    return response.data;
  },

  listIntegrations: async () => {
    const response = await api.get('/integrations');
    return response.data;
  },

  getIntegrationStatus: async (integrationType: string) => {
    const response = await api.get(`/integrations/${integrationType}`);
    return response.data;
  },

  configureIntegration: async (integrationType: string, credentials: Record<string, string>, settings?: Record<string, unknown>) => {
    const response = await api.post(`/integrations/${integrationType}/configure`, { credentials, settings });
    return response.data;
  },

  toggleIntegration: async (integrationType: string, enabled: boolean) => {
    const response = await api.post(`/integrations/${integrationType}/toggle`, { enabled });
    return response.data;
  },

  testConnection: async (integrationType: string) => {
    const response = await api.post(`/integrations/${integrationType}/test`);
    return response.data;
  },

  // Shopify
  syncShopifyOrders: async () => {
    const response = await api.post('/integrations/shopify/sync-orders');
    return response.data;
  },

  syncShopifyInventory: async (products: Array<Record<string, unknown>>) => {
    const response = await api.post('/integrations/shopify/sync-inventory', { products });
    return response.data;
  },

  // Tally
  exportToTally: async (invoices: Array<Record<string, unknown>>, voucherType = 'Sales') => {
    const response = await api.post('/integrations/tally/export', { invoices, voucher_type: voucherType });
    return response.data;
  },

  // Razorpay
  createRazorpayOrder: async (amount: number, currency = 'INR', receipt?: string) => {
    const response = await api.post('/integrations/razorpay/create-order', { amount, currency, receipt });
    return response.data;
  },

  verifyRazorpayPayment: async (orderId: string, paymentId: string, signature: string) => {
    const response = await api.post('/integrations/razorpay/verify-payment', { order_id: orderId, payment_id: paymentId, signature });
    return response.data;
  },

  // WhatsApp
  sendWhatsAppMessage: async (phone: string, template: string, params?: Record<string, string>) => {
    const response = await api.post('/integrations/whatsapp/send-message', { phone, template, params });
    return response.data;
  },

  sendOrderUpdate: async (phone: string, orderNumber: string, status: string) => {
    const response = await api.post('/integrations/whatsapp/order-update', { phone, order_number: orderNumber, status });
    return response.data;
  },

  // Shiprocket
  createShipment: async (orderData: Record<string, unknown>) => {
    const response = await api.post('/integrations/shiprocket/create-order', { order_data: orderData });
    return response.data;
  },

  trackShipment: async (awb: string) => {
    const response = await api.get(`/integrations/shiprocket/track/${awb}`);
    return response.data;
  },

  // GST Portal
  verifyGSTIN: async (gstin: string) => {
    const response = await api.post('/integrations/gst/verify-gstin', { gstin });
    return response.data;
  },
};

// ============================================================================
// AI Intelligence API
// ============================================================================

export const aiApi = {
  // Dashboard
  getDashboard: async () => {
    const response = await api.get('/ai/dashboard');
    return response.data;
  },

  // Insights
  listInsights: async (params?: { category?: string; severity?: string; status?: string; limit?: number }) => {
    const response = await api.get('/ai/insights', { params });
    return response.data;
  },

  getInsight: async (insightId: string) => {
    const response = await api.get(`/ai/insights/${insightId}`);
    return response.data;
  },

  generateInsight: async (data: {
    category: string;
    severity: string;
    title: string;
    description: string;
    dataPoints?: Record<string, unknown>;
    recommendation?: string;
  }) => {
    const response = await api.post('/ai/insights/generate', data);
    return response.data;
  },

  generateDailyInsights: async (data: Record<string, unknown>) => {
    const response = await api.post('/ai/insights/generate-daily', data);
    return response.data;
  },

  dismissInsight: async (insightId: string) => {
    const response = await api.post(`/ai/insights/${insightId}/dismiss`);
    return response.data;
  },

  markInsightActioned: async (insightId: string) => {
    const response = await api.post(`/ai/insights/${insightId}/action`);
    return response.data;
  },

  // Recommendations
  listRecommendations: async (params?: { status?: string; recType?: string; limit?: number }) => {
    const response = await api.get('/ai/recommendations', { params });
    return response.data;
  },

  createRecommendation: async (data: {
    recommendationType: string;
    title: string;
    description: string;
    rationale: string;
    expectedImpact: string;
    implementationSteps: string[];
  }) => {
    const response = await api.post('/ai/recommendations/create', {
      recommendation_type: data.recommendationType,
      title: data.title,
      description: data.description,
      rationale: data.rationale,
      expected_impact: data.expectedImpact,
      implementation_steps: data.implementationSteps,
    });
    return response.data;
  },

  approveRecommendation: async (recommendationId: string) => {
    const response = await api.post(`/ai/recommendations/${recommendationId}/approve`);
    return response.data;
  },

  rejectRecommendation: async (recommendationId: string) => {
    const response = await api.post(`/ai/recommendations/${recommendationId}/reject`);
    return response.data;
  },

  // Patterns
  listPatterns: async (acknowledged?: boolean) => {
    const response = await api.get('/ai/patterns', { params: { acknowledged } });
    return response.data;
  },

  detectPatterns: async (patternType: string, data: Array<Record<string, unknown>>) => {
    const response = await api.post('/ai/patterns/detect', { pattern_type: patternType, data });
    return response.data;
  },

  acknowledgePattern: async (patternId: string) => {
    const response = await api.post(`/ai/patterns/${patternId}/acknowledge`);
    return response.data;
  },

  // Ask Intelligence (Natural Language)
  askIntelligence: async (query: string, contextData?: Record<string, unknown>) => {
    const response = await api.post('/ai/ask', { query, context_data: contextData });
    return response.data;
  },

  listQueries: async (limit = 50) => {
    const response = await api.get('/ai/queries', { params: { limit } });
    return response.data;
  },

  // Purchase Advisor
  getPurchaseAdvice: async (productDescription: string, estimatedPrice: number, category: string) => {
    const response = await api.post('/ai/purchase-advice', {
      product_description: productDescription,
      estimated_price: estimatedPrice,
      category,
    });
    return response.data;
  },

  // Marketing Insights
  getMarketingInsights: async () => {
    const response = await api.get('/ai/marketing-insights');
    return response.data;
  },

  // Forecasts
  getSalesForecast: async (storeId?: string, days = 30) => {
    const response = await api.get('/ai/forecasts/sales', { params: { store_id: storeId, days } });
    return response.data;
  },

  getInventoryRecommendations: async (storeId?: string, category?: string) => {
    const response = await api.get('/ai/forecasts/inventory', { params: { store_id: storeId, category } });
    return response.data;
  },

  // Customer Segments
  getCustomerSegments: async () => {
    const response = await api.get('/ai/segments/customers');
    return response.data;
  },

  // Staff Performance
  getStaffPerformanceInsights: async (storeId?: string) => {
    const response = await api.get('/ai/insights/staff-performance', { params: { store_id: storeId } });
    return response.data;
  },
};

// ============================================================================
// Payment API (Razorpay Integration)
// ============================================================================

export const paymentApi = {
  createPaymentOrder: async (data: {
    orderId: string;
    amount: number;
    customerName?: string;
    customerEmail?: string;
    customerContact?: string;
    notes?: Record<string, unknown>;
  }) => {
    const response = await api.post('/payments/razorpay/create-order', {
      order_id: data.orderId,
      amount: data.amount,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_contact: data.customerContact,
      notes: data.notes,
    });
    return response.data;
  },

  verifyPayment: async (data: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    orderId: string;
  }) => {
    const response = await api.post('/payments/razorpay/verify', {
      razorpay_order_id: data.razorpayOrderId,
      razorpay_payment_id: data.razorpayPaymentId,
      razorpay_signature: data.razorpaySignature,
      order_id: data.orderId,
    });
    return response.data;
  },

  getPaymentStatus: async (paymentId: string) => {
    const response = await api.get(`/payments/status/${paymentId}`);
    return response.data;
  },

  processRefund: async (data: {
    paymentId: string;
    amount?: number;
    reason: string;
  }) => {
    const response = await api.post('/payments/razorpay/refund', {
      payment_id: data.paymentId,
      amount: data.amount,
      reason: data.reason,
    });
    return response.data;
  },

  getPaymentAnalytics: async (params?: {
    fromDate?: string;
    toDate?: string;
  }) => {
    const response = await api.get('/payments/analytics/summary', { params });
    return response.data;
  },
};

// Named export alias for components using apiClient
export { api as apiClient };

export default api;
