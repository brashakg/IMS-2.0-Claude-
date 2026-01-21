// ============================================================================
// IMS 2.0 - Admin Dashboard (ADMIN / SUPERADMIN)
// ============================================================================
// Shows company-wide metrics, all stores, system alerts, configurations

import { useNavigate } from 'react-router-dom';
import {
  Building2,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Settings,
  ShieldCheck,
  Globe,
  Wrench,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskSummary } from './TaskSummary';
import { TargetProgress } from './TargetProgress';
import { StoreComparison } from './StoreComparison';
import { ApprovalQueue } from './ApprovalQueue';
import { TaskPriority } from '../../types';

// System Alert Component
interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  source: string;
}

function SystemAlerts({ alerts }: { alerts: SystemAlert[] }) {
  const alertStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 mb-4">System Alerts</h2>
      <div className="space-y-2">
        {alerts.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p>All systems operational</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className={`p-3 rounded-lg border ${alertStyles[alert.type]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm opacity-80">{alert.message}</p>
                </div>
                <span className="text-xs">{alert.timestamp}</span>
              </div>
              <p className="text-xs mt-1 opacity-60">{alert.source}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function AdminDashboard() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isSuperAdmin = hasRole(['SUPERADMIN']);

  // Mock data - company-wide metrics
  const companyStats = {
    totalSales: 786540,
    totalOrders: 156,
    totalStores: 6,
    activeStores: 6,
    totalStaff: 45,
    activeStaff: 42,
    monthSales: 12500000,
    monthTarget: 15000000,
    gstPending: 245000,
    outstandingReceivables: 850000,
  };

  const stores = [
    { storeId: 's1', storeName: 'Vijay Nagar', brand: 'BETTER_VISION' as const, todaySales: 186780, monthSales: 3200000, monthTarget: 3500000, orderCount: 38, footfall: 95, conversion: 40, trend: 12, rank: 1 },
    { storeId: 's2', storeName: 'Palasia', brand: 'BETTER_VISION' as const, todaySales: 165890, monthSales: 2800000, monthTarget: 3000000, orderCount: 35, footfall: 88, conversion: 40, trend: 8, rank: 2 },
    { storeId: 's3', storeName: 'Sapna Sangeeta', brand: 'BETTER_VISION' as const, todaySales: 133000, monthSales: 1850000, monthTarget: 2500000, orderCount: 25, footfall: 75, conversion: 33, trend: -5, rank: 3 },
    { storeId: 's4', storeName: 'Treasure Island', brand: 'BETTER_VISION' as const, todaySales: 145670, monthSales: 2100000, monthTarget: 2500000, orderCount: 28, footfall: 80, conversion: 35, trend: 6, rank: 4 },
    { storeId: 's5', storeName: 'MG Road', brand: 'BETTER_VISION' as const, todaySales: 98200, monthSales: 1550000, monthTarget: 2000000, orderCount: 20, footfall: 60, conversion: 33, trend: 2, rank: 5 },
    { storeId: 's6', storeName: 'WizOpt HQ', brand: 'WIZOPT' as const, todaySales: 57000, monthSales: 1000000, monthTarget: 1500000, orderCount: 10, footfall: 35, conversion: 29, trend: -3, rank: 6 },
  ];

  const systemAlerts: SystemAlert[] = [
    { id: '1', type: 'warning', title: 'GST Return Due', message: 'GSTR-3B for December 2024 due in 3 days', timestamp: '1 hour ago', source: 'Finance Module' },
    { id: '2', type: 'error', title: 'Stock Alert', message: '15 items below minimum stock level across 3 stores', timestamp: '2 hours ago', source: 'Inventory Module' },
    { id: '3', type: 'info', title: 'Backup Completed', message: 'Daily database backup completed successfully', timestamp: '6 hours ago', source: 'System' },
  ];

  const tasks = [
    { id: '1', title: 'Review GST compliance report', priority: 'P0' as TaskPriority, dueTime: 'TODAY', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '2', title: 'Approve bulk discount requests', priority: 'P1' as TaskPriority, dueTime: '3:00 PM', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '3', title: 'Monthly target setting for Jan', priority: 'P2' as TaskPriority, type: 'MANUAL' as const, status: 'IN_PROGRESS' as const },
    { id: '4', title: 'System audit review', priority: 'P3' as TaskPriority, type: 'SOP' as const, status: 'PENDING' as const },
  ];

  const approvals = [
    {
      id: '1',
      type: 'DISCOUNT' as const,
      requestedBy: 'Area Manager - Indore',
      requestedByRole: 'Area Manager',
      requestedAt: '1 hour ago',
      details: {
        description: 'Bulk discount approval for corporate order',
        amount: 125000,
        percentage: 22,
        reason: 'Corporate order - TCS Indore, 50 frames',
        customerName: 'TCS Indore',
      },
      urgency: 'urgent' as const,
    },
    {
      id: '2',
      type: 'WRITE_OFF' as const,
      requestedBy: 'Store Manager - Vijay Nagar',
      requestedByRole: 'Store Manager',
      requestedAt: '3 hours ago',
      details: {
        description: 'Write-off expired contact lenses',
        amount: 15000,
        reason: 'Batch expired - 30 units',
      },
      urgency: 'normal' as const,
    },
  ];

  const targets = [
    { label: 'Company Sales', current: companyStats.monthSales, target: companyStats.monthTarget, type: 'COMPANY' as const, previousPeriod: 11200000 },
  ];

  const handleApprove = async (id: string) => {
    // TODO: Connect to API when backend is ready
    toast.success('Request Approved', 'The request has been approved successfully');
  };

  const handleReject = async (id: string) => {
    // TODO: Connect to API when backend is ready
    toast.warning('Request Rejected', 'The request has been rejected');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isSuperAdmin ? 'Superadmin' : 'Admin'} Dashboard
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Better Vision + WizOpt • {companyStats.totalStores} Stores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-500">Outstanding</p>
            <p className="font-bold text-red-600">₹{(companyStats.outstandingReceivables / 100000).toFixed(1)}L</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">GST Pending</p>
            <p className="font-bold text-orange-600">₹{(companyStats.gstPending / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Sales (All)</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(companyStats.totalSales / 100000).toFixed(2)}L
              </p>
              <p className="text-sm text-green-600 mt-1">+11% vs yesterday</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <IndianRupee className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{companyStats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">Across {companyStats.activeStores} active stores</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <Package className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Staff</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{companyStats.activeStaff}/{companyStats.totalStaff}</p>
              <p className="text-xs text-gray-500 mt-1">{companyStats.totalStaff - companyStats.activeStaff} on leave</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <Users className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Month Target</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round((companyStats.monthSales / companyStats.monthTarget) * 100)}%
              </p>
              <p className="text-sm text-green-600 mt-1">
                ₹{((companyStats.monthTarget - companyStats.monthSales) / 100000).toFixed(1)}L to go
              </p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Target Progress */}
      <TargetProgress targets={targets} period="monthly" />

      {/* Store Comparison */}
      <StoreComparison stores={stores} metric="sales" period="today" />

      {/* Main Content Grid */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* System Alerts */}
        <SystemAlerts alerts={systemAlerts} />

        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />
      </div>

      {/* Approvals */}
      <ApprovalQueue
        approvals={approvals}
        onApprove={handleApprove}
        onReject={handleReject}
        onViewDetails={(item) => console.log('View details:', item)}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-6 gap-3">
          <QuickAction label="Reports" icon={TrendingUp} onClick={() => navigate('/reports')} />
          <QuickAction label="HR" icon={Users} onClick={() => navigate('/hr')} />
          <QuickAction label="Inventory" icon={Package} onClick={() => navigate('/inventory')} />
          <QuickAction label="Workshop" icon={Wrench} onClick={() => navigate('/workshop')} />
          <QuickAction label="Invoices" icon={FileText} onClick={() => navigate('/orders')} />
          {isSuperAdmin && <QuickAction label="Settings" icon={Settings} onClick={() => navigate('/settings')} />}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-bv-red-200 hover:bg-bv-red-50 transition-colors touch-target"
    >
      <div className="p-3 bg-gray-100 rounded-lg">
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

export default AdminDashboard;
