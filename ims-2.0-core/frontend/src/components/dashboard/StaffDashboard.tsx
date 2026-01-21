// ============================================================================
// IMS 2.0 - Staff Dashboard (SALES_STAFF, SALES_CASHIER)
// ============================================================================
// Shows personal targets, recent sales, assigned tasks

import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  Users,
  Clock,
  Award,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskSummary } from './TaskSummary';
import { TargetProgress } from './TargetProgress';
import { TaskPriority } from '../../types';

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

// Recent Sale Item
interface RecentSale {
  id: string;
  invoiceNo: string;
  customerName: string;
  amount: number;
  items: number;
  time: string;
}

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data - would come from API
  const stats = {
    todaySales: 23450,
    todayOrders: 6,
    avgOrderValue: 3908,
    monthSales: 287650,
    monthTarget: 350000,
    incentiveEarned: 2450,
  };

  const recentSales: RecentSale[] = [
    { id: '1', invoiceNo: 'INV-2501-001', customerName: 'Rajesh Kumar', amount: 12500, items: 3, time: '10:30 AM' },
    { id: '2', invoiceNo: 'INV-2501-002', customerName: 'Priya Sharma', amount: 4500, items: 1, time: '11:15 AM' },
    { id: '3', invoiceNo: 'INV-2501-003', customerName: 'Amit Patel', amount: 6450, items: 2, time: '12:45 PM' },
  ];

  const tasks = [
    { id: '1', title: 'Complete customer follow-up calls', priority: 'P2' as TaskPriority, dueTime: '2:00 PM', type: 'MANUAL' as const, status: 'PENDING' as const },
    { id: '2', title: 'Daily SOP: Clean display cases', priority: 'P3' as TaskPriority, dueTime: '5:00 PM', type: 'SOP' as const, status: 'IN_PROGRESS' as const },
    { id: '3', title: 'Update customer database', priority: 'P4' as TaskPriority, type: 'SYSTEM' as const, status: 'PENDING' as const },
  ];

  const targets = [
    { label: 'Personal Sales', current: stats.monthSales, target: stats.monthTarget, type: 'PERSONAL' as const, previousPeriod: 265000 },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 mt-1">Here's your sales performance today</p>
        </div>
        {stats.incentiveEarned > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
            <Award className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-green-700">Incentive Earned</p>
              <p className="font-bold text-green-800">₹{stats.incentiveEarned.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`₹${stats.todaySales.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          change="+15% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Orders Today"
          value={stats.todayOrders}
          icon={ShoppingCart}
          subtitle={`Avg: ₹${stats.avgOrderValue.toLocaleString('en-IN')}`}
        />
        <StatCard
          title="Month Sales"
          value={`₹${(stats.monthSales / 1000).toFixed(1)}K`}
          icon={TrendingUp}
          subtitle={`${Math.round((stats.monthSales / stats.monthTarget) * 100)}% of target`}
        />
        <StatCard
          title="Customers Served"
          value={stats.todayOrders}
          icon={Users}
          change="3 new customers"
          changeType="positive"
        />
      </div>

      {/* Target Progress */}
      <TargetProgress
        targets={targets}
        period="monthly"
        showIncentive
        incentiveAmount={stats.incentiveEarned}
      />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-5 gap-3">
          <QuickAction label="New Sale" icon={ShoppingCart} onClick={() => navigate('/pos')} />
          <QuickAction label="Add Customer" icon={Users} onClick={() => navigate('/customers')} />
          <QuickAction label="My Orders" icon={Clock} onClick={() => navigate('/orders')} />
        </div>
      </div>

      <div className="grid tablet:grid-cols-2 gap-6">
        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />

        {/* Recent Sales */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">{sale.invoiceNo}</p>
                  <p className="text-sm text-gray-500">{sale.customerName} • {sale.items} item(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{sale.amount.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-500">{sale.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default StaffDashboard;
