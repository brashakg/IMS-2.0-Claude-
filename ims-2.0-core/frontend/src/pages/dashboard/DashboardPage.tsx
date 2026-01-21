// ============================================================================
// IMS 2.0 - Dashboard Page
// ============================================================================
// Routes to role-specific dashboard based on user's role

import { useAuth } from '../../context/AuthContext';
import {
  StaffDashboard,
  StoreManagerDashboard,
  AreaManagerDashboard,
  AdminDashboard,
  OptometristDashboard,
  AccountantDashboard,
  CatalogManagerDashboard,
  WorkshopDashboard,
} from '../../components/dashboard';

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  // Render role-specific dashboard based on user's primary role
  // Priority order: Higher privilege roles first

  // Superadmin or Admin - Full system dashboard
  if (hasRole(['SUPERADMIN', 'ADMIN'])) {
    return <AdminDashboard />;
  }

  // Area Manager - Multi-store dashboard
  if (hasRole(['AREA_MANAGER'])) {
    return <AreaManagerDashboard />;
  }

  // Store Manager - Store-level dashboard
  if (hasRole(['STORE_MANAGER'])) {
    return <StoreManagerDashboard />;
  }

  // Accountant - Financial dashboard
  if (hasRole(['ACCOUNTANT'])) {
    return <AccountantDashboard />;
  }

  // Catalog Manager - Product/inventory dashboard
  if (hasRole(['CATALOG_MANAGER'])) {
    return <CatalogManagerDashboard />;
  }

  // Optometrist - Clinical dashboard
  if (hasRole(['OPTOMETRIST'])) {
    return <OptometristDashboard />;
  }

  // Workshop Staff - Workshop dashboard
  if (hasRole(['WORKSHOP_STAFF'])) {
    return <WorkshopDashboard />;
  }

  // Sales Staff and Cashiers - Staff dashboard
  if (hasRole(['SALES_STAFF', 'SALES_CASHIER'])) {
    return <StaffDashboard />;
  }

  // Default fallback - Staff dashboard
  return <StaffDashboard />;
}

export default DashboardPage;
