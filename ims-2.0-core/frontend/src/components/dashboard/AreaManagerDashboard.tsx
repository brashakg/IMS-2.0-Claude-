/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================================
// IMS 2.0 - Area Manager Dashboard
// ============================================================================
// Shows multi-store comparative metrics, area-level KPIs

import { useNavigate } from 'react-router-dom';
import {
  Building2,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Package,
  Target,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskSummary } from './TaskSummary';
import { TargetProgress } from './TargetProgress';
import { StoreComparison } from './StoreComparison';
import { ApprovalQueue } from './ApprovalQueue';
import { TaskPriority } from '../../types';

export function AreaManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Mock data - multi-store metrics
  const areaStats = {
    totalSales: 485670,
    totalOrders: 98,
    totalStores: 3,
    avgConversion: 35,
    monthSales: 7850000,
    monthTarget: 9000000,
    topStore: 'Vijay Nagar',
    lowStore: 'Sapna Sangeeta',
  };

  const stores = [
    {
      storeId: 's1',
      storeName: 'Vijay Nagar',
      brand: 'BETTER_VISION' as const,
      todaySales: 186780,
      monthSales: 3200000,
      monthTarget: 3500000,
      orderCount: 38,
      footfall: 95,
      conversion: 40,
      trend: 12,
      rank: 1,
    },
    {
      storeId: 's2',
      storeName: 'Palasia',
      brand: 'BETTER_VISION' as const,
      todaySales: 165890,
      monthSales: 2800000,
      monthTarget: 3000000,
      orderCount: 35,
      footfall: 88,
      conversion: 40,
      trend: 8,
      rank: 2,
    },
    {
      storeId: 's3',
      storeName: 'Sapna Sangeeta',
      brand: 'BETTER_VISION' as const,
      todaySales: 133000,
      monthSales: 1850000,
      monthTarget: 2500000,
      orderCount: 25,
      footfall: 75,
      conversion: 33,
      trend: -5,
      rank: 3,
    },
  ];

  const tasks = [
    { id: '1', title: 'Review Sapna Sangeeta performance - below target', priority: 'P0' as TaskPriority, dueTime: 'TODAY', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '2', title: 'Approve stock transfer requests', priority: 'P1' as TaskPriority, dueTime: '2:00 PM', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '3', title: 'Weekly store visits', priority: 'P2' as TaskPriority, type: 'SOP' as const, status: 'IN_PROGRESS' as const },
    { id: '4', title: 'Staff allocation review', priority: 'P3' as TaskPriority, type: 'MANUAL' as const, status: 'PENDING' as const },
  ];

  const approvals = [
    {
      id: '1',
      type: 'TRANSFER' as const,
      requestedBy: 'Amit (Vijay Nagar)',
      requestedByRole: 'Store Manager',
      requestedAt: '30 min ago',
      details: {
        description: 'Transfer 5x Ray-Ban frames to Sapna Sangeeta',
        reason: 'Stock out at destination store',
      },
      urgency: 'urgent' as const,
    },
    {
      id: '2',
      type: 'WRITE_OFF' as const,
      requestedBy: 'Priya (Palasia)',
      requestedByRole: 'Store Manager',
      requestedAt: '2 hours ago',
      details: {
        description: 'Write-off damaged contact lenses',
        amount: 2500,
        reason: 'Storage temperature issue',
      },
      urgency: 'normal' as const,
    },
  ];

  const targets = [
    { label: 'Area Sales', current: areaStats.monthSales, target: areaStats.monthTarget, type: 'AREA' as const, previousPeriod: 7200000 },
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
            Good {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Indore Region • {areaStats.totalStores} Stores
          </p>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Area Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(areaStats.totalSales / 1000).toFixed(1)}K
              </p>
              <p className="text-sm text-green-600 mt-1">+14% vs yesterday</p>
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
              <p className="text-2xl font-bold text-gray-900 mt-1">{areaStats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-1">{areaStats.avgConversion}% avg conversion</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <Users className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Top Performer</p>
              <p className="text-xl font-bold text-green-800 mt-1">{areaStats.topStore}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                91% of target
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-700">Needs Attention</p>
              <p className="text-xl font-bold text-red-800 mt-1">{areaStats.lowStore}</p>
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                74% of target
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
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
        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />

        {/* Approvals */}
        <ApprovalQueue
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewDetails={(item) => console.log('View details:', item)}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-6 gap-3">
          <QuickAction label="Store Visits" icon={Building2} onClick={() => navigate('/reports')} />
          <QuickAction label="Transfers" icon={Package} onClick={() => navigate('/inventory')} />
          <QuickAction label="Reports" icon={TrendingUp} onClick={() => navigate('/reports')} />
          <QuickAction label="Targets" icon={Target} onClick={() => navigate('/hr')} />
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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default AreaManagerDashboard;
