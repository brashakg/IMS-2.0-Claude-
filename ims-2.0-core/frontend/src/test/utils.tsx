// ============================================================================
// IMS 2.0 - Test Utilities
// ============================================================================

import type { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// Create a new QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

interface WrapperProps {
  children: ReactNode;
}

// All providers wrapper
const AllProviders = ({ children }: WrapperProps) => {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
};

// Custom render function with providers
const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  rtlRender(ui, { wrapper: AllProviders, ...options });

// Re-export everything from testing-library
export * from '@testing-library/react';
// Override render with custom render
export { customRender as render };

// Mock user for authenticated tests
export const mockUser = {
  id: 'user-001',
  email: 'admin@bettervision.com',
  name: 'Admin User',
  phone: '9876543210',
  roles: ['SUPERADMIN'] as const,
  activeRole: 'SUPERADMIN' as const,
  storeIds: ['store-001'],
  activeStoreId: 'store-001',
  discountCap: 20,
  isActive: true,
  geoRestricted: false,
  createdAt: '2024-01-01T00:00:00Z',
};

// Mock store data
export const mockStore = {
  id: 'store-001',
  storeCode: 'BV-BOK-001',
  storeName: 'Better Vision Bokaro',
  brand: 'BETTER_VISION' as const,
  gstin: '20AABCU9603R1ZM',
  address: '123 Main Street',
  city: 'Bokaro',
  state: 'Jharkhand',
  stateCode: '20',
  pincode: '827001',
  latitude: 23.6693,
  longitude: 86.1511,
  geoFenceRadius: 100,
  isActive: true,
  isHQ: false,
  enabledCategories: ['FRAME', 'SUNGLASS', 'OPTICAL_LENS', 'CONTACT_LENS'],
  openingTime: '10:00',
  closingTime: '20:00',
};

// Mock product data
export const mockProduct = {
  id: 'prod-001',
  sku: 'RB-5154-2000',
  category: 'FRAME' as const,
  brand: 'Ray-Ban',
  model: 'Clubmaster',
  variant: '51mm Black',
  name: 'Ray-Ban Clubmaster RB5154',
  description: 'Classic clubmaster frame',
  mrp: 8990,
  offerPrice: 8990,
  discountCategory: 'PREMIUM' as const,
  hsnCode: '9004',
  gstRate: 18,
  attributes: { color: 'Black', size: '51' },
  images: [],
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

// Mock order data
export const mockOrder = {
  id: 'order-001',
  orderNumber: 'BV-ORD-2024-0001',
  storeId: 'store-001',
  customerId: 'cust-001',
  customerName: 'Rajesh Kumar',
  customerPhone: '9876543210',
  items: [],
  payments: [],
  subtotal: 10000,
  totalDiscount: 500,
  taxAmount: 1710,
  grandTotal: 11210,
  amountPaid: 11210,
  balanceDue: 0,
  orderStatus: 'CONFIRMED' as const,
  paymentStatus: 'PAID' as const,
  createdBy: 'user-001',
  createdAt: '2024-01-15T10:30:00Z',
};
