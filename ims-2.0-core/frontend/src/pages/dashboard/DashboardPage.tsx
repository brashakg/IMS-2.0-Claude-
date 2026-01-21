// ============================================================================
// IMS 2.0 - Dashboard Page
// ============================================================================

import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  AlertTriangle,
  Wrench,
  IndianRupee,
  Target,
} from 'lucide-react';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', subtitle }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {change && (
            <p
              className={`text-sm mt-1 ${
                changeType === 'positive'
                  ? 'text-green-600'
                  : changeType === 'negative'
                  ? 'text-red-600'
                  : 'text-gray-500'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-bv-red-50 rounded-lg">
          <Icon className="w-6 h-6 text-bv-red-600" />
        </div>
      </div>
    </div>
  );
}

// Quick Action Button
interface QuickActionProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

function QuickAction({ label, icon: Icon, onClick }: QuickActionProps) {
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

export function DashboardPage() {
  const { user, hasRole } = useAuth();

  // Mock data - would come from API
  const stats = {
    todaySales: 45678,
    todayOrders: 12,
    pendingJobs: 8,
    lowStockItems: 15,
    monthSales: 567890,
    monthTarget: 700000,
  };

  const targetAchievement = Math.round((stats.monthSales / stats.monthTarget) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening at your store today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          change="+12% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Today's Orders"
          value={stats.todayOrders}
          icon={ShoppingCart}
          subtitle="3 pending delivery"
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={Wrench}
          subtitle="2 urgent"
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStockItems}
          icon={AlertTriangle}
          changeType={stats.lowStockItems > 10 ? 'negative' : 'neutral'}
        />
      </div>

      {/* Target Progress */}
      {hasRole(['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER']) && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-bv-red-600" />
              <h2 className="font-semibold text-gray-900">Monthly Target</h2>
            </div>
            <span className="text-2xl font-bold text-gray-900">{targetAchievement}%</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-bv-red-600 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(targetAchievement, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>₹{stats.monthSales.toLocaleString('en-IN')} achieved</span>
            <span>Target: ₹{stats.monthTarget.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-6 gap-3">
          {hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'OPTOMETRIST', 'SALES_CASHIER', 'SALES_STAFF']) && (
            <QuickAction label="New Sale" icon={ShoppingCart} />
          )}
          <QuickAction label="Add Customer" icon={Users} />
          {hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'CATALOG_MANAGER']) && (
            <QuickAction label="Stock In" icon={Package} />
          )}
          {hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'WORKSHOP_STAFF']) && (
            <QuickAction label="Workshop" icon={Wrench} />
          )}
          {hasRole(['SUPERADMIN', 'ADMIN', 'AREA_MANAGER', 'STORE_MANAGER', 'ACCOUNTANT']) && (
            <QuickAction label="Reports" icon={TrendingUp} />
          )}
        </div>
      </div>

      {/* Recent Activity / Alerts */}
      <div className="grid tablet:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">Order #{1000 + i}</p>
                  <p className="text-sm text-gray-500">Rajesh Kumar</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{(i * 2500).toLocaleString('en-IN')}</p>
                  <span className="badge-success">Confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800">Low Stock Alert</p>
                <p className="text-sm text-yellow-700">15 items below minimum stock level</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <Wrench className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Jobs Ready</p>
                <p className="text-sm text-blue-700">3 jobs ready for customer pickup</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default DashboardPage;
