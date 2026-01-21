// ============================================================================
// IMS 2.0 - API Service
// ============================================================================

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, LoginCredentials, LoginResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
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
    const response = await api.post<LoginResponse>('/auth/login', credentials);
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

export default api;
