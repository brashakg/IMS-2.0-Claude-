// ============================================================================
// IMS 2.0 - Main Application Entry
// ============================================================================

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { POSPage } from './pages/pos/POSPage';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Placeholder pages (to be implemented)
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="card">
    <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-gray-500">This page is under development.</p>
  </div>
);

// Unauthorized page
const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
      <p className="text-gray-500 mb-4">You don't have permission to access this page.</p>
      <a href="/dashboard" className="btn-primary">
        Go to Dashboard
      </a>
    </div>
  </div>
);

// Not Found page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-4">Page not found.</p>
      <a href="/dashboard" className="btn-primary">
        Go to Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Redirect root to dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />

              {/* POS */}
              <Route
                path="pos"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'OPTOMETRIST', 'SALES_CASHIER', 'SALES_STAFF']}
                  >
                    <POSPage />
                  </ProtectedRoute>
                }
              />

              {/* Customers */}
              <Route path="customers" element={<PlaceholderPage title="Customers" />} />

              {/* Inventory */}
              <Route
                path="inventory"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER', 'CATALOG_MANAGER', 'WORKSHOP_STAFF']}
                  >
                    <PlaceholderPage title="Inventory" />
                  </ProtectedRoute>
                }
              />

              {/* Orders */}
              <Route
                path="orders"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER', 'SALES_CASHIER']}
                  >
                    <PlaceholderPage title="Orders" />
                  </ProtectedRoute>
                }
              />

              {/* Clinical / Eye Tests */}
              <Route
                path="clinical"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'OPTOMETRIST']}
                  >
                    <PlaceholderPage title="Eye Tests & Prescriptions" />
                  </ProtectedRoute>
                }
              />

              {/* Workshop */}
              <Route
                path="workshop"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'WORKSHOP_STAFF']}
                  >
                    <PlaceholderPage title="Workshop" />
                  </ProtectedRoute>
                }
              />

              {/* Tasks */}
              <Route path="tasks" element={<PlaceholderPage title="Tasks" />} />

              {/* HR */}
              <Route
                path="hr"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER', 'ACCOUNTANT']}
                  >
                    <PlaceholderPage title="HR Management" />
                  </ProtectedRoute>
                }
              />

              {/* Reports */}
              <Route
                path="reports"
                element={
                  <ProtectedRoute
                    allowedRoles={['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER', 'ACCOUNTANT']}
                  >
                    <PlaceholderPage title="Reports" />
                  </ProtectedRoute>
                }
              />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                    <PlaceholderPage title="Settings" />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
