/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================================
// IMS 2.0 - Store Manager Dashboard
// ============================================================================
// Shows store KPIs, team performance, pending approvals, alerts

import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ShoppingCart,
  IndianRupee,
  Users,
  AlertTriangle,
  Wrench,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  UserCog,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskSummary } from './TaskSummary';
import { TargetProgress } from './TargetProgress';
import { ApprovalQueue } from './ApprovalQueue';
import { TaskPriority } from '../../types';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  alert?: boolean;
}

function StatCard({ title, value, icon: Icon, change, changeType = 'neutral', subtitle, alert }: StatCardProps) {
  return (
    <div className={`card ${alert ? 'ring-2 ring-red-500' : ''}`}>
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
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-50' : 'bg-bv-red-50'}`}>
          <Icon className={`w-6 h-6 ${alert ? 'text-red-600' : 'text-bv-red-600'}`} />
        </div>
      </div>
    </div>
  );
}

// Team Member Performance Card
interface TeamMember {
  id: string;
  name: string;
  role: string;
  todaySales: number;
  ordersCount: number;
  targetProgress: number;
  status: 'online' | 'offline' | 'break';
}

function TeamPerformanceCard({ members }: { members: TeamMember[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Team Performance</h2>
        <span className="text-sm text-gray-500">{members.filter(m => m.status === 'online').length} online</span>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
            {/* Status Indicator */}
            <div className="relative">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                member.status === 'online' ? 'bg-green-500' :
                member.status === 'break' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{member.name}</p>
              <p className="text-xs text-gray-500">{member.role}</p>
            </div>

            <div className="text-right">
              <p className="font-medium text-gray-900">₹{(member.todaySales / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500">{member.ordersCount} orders</p>
            </div>

            {/* Progress Mini Bar */}
            <div className="w-16">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    member.targetProgress >= 100 ? 'bg-green-500' :
                    member.targetProgress >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(member.targetProgress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center mt-0.5">{member.targetProgress}%</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StoreManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Mock data
  const stats = {
    todaySales: 156780,
    todayOrders: 32,
    footfall: 85,
    conversion: 38,
    pendingJobs: 12,
    lowStock: 8,
    monthSales: 2345000,
    monthTarget: 3000000,
  };

  const teamMembers: TeamMember[] = [
    { id: '1', name: 'Rahul Sharma', role: 'Sales Staff', todaySales: 45000, ordersCount: 8, targetProgress: 92, status: 'online' },
    { id: '2', name: 'Priya Singh', role: 'Cashier', todaySales: 38000, ordersCount: 10, targetProgress: 85, status: 'online' },
    { id: '3', name: 'Amit Kumar', role: 'Sales Staff', todaySales: 32000, ordersCount: 6, targetProgress: 68, status: 'break' },
    { id: '4', name: 'Sneha Patel', role: 'Optometrist', todaySales: 28000, ordersCount: 5, targetProgress: 75, status: 'online' },
  ];

  const tasks = [
    { id: '1', title: 'Review discount approval requests', priority: 'P1' as TaskPriority, dueTime: '1:00 PM', type: 'SYSTEM' as const, status: 'PENDING' as const, assignedBy: 'System' },
    { id: '2', title: 'Daily cash reconciliation', priority: 'P1' as TaskPriority, dueTime: '6:00 PM', type: 'SOP' as const, status: 'PENDING' as const },
    { id: '3', title: 'Stock count verification', priority: 'P2' as TaskPriority, dueTime: '4:00 PM', type: 'MANUAL' as const, status: 'IN_PROGRESS' as const },
    { id: '4', title: 'Staff attendance review', priority: 'P3' as TaskPriority, type: 'SOP' as const, status: 'PENDING' as const },
  ];

  const approvals = [
    {
      id: '1',
      type: 'DISCOUNT' as const,
      requestedBy: 'Rahul Sharma',
      requestedByRole: 'Sales Staff',
      requestedAt: '10 min ago',
      details: {
        description: '15% discount on Ray-Ban Aviator',
        amount: 2250,
        percentage: 15,
        reason: 'Customer is a doctor, regular buyer',
        customerName: 'Dr. Anil Mehta',
        productName: 'Ray-Ban Aviator RB3025',
      },
      urgency: 'normal' as const,
    },
    {
      id: '2',
      type: 'CREDIT' as const,
      requestedBy: 'Priya Singh',
      requestedByRole: 'Cashier',
      requestedAt: '25 min ago',
      details: {
        description: 'Credit sale for existing customer',
        amount: 15000,
        reason: 'Regular customer, good payment history',
        customerName: 'Vikram Industries',
      },
      urgency: 'urgent' as const,
    },
  ];

  const targets = [
    { label: 'Store Sales', current: stats.monthSales, target: stats.monthTarget, type: 'STORE' as const, previousPeriod: 2100000 },
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
            <Building2 className="w-4 h-4" />
            Better Vision - Vijay Nagar
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium text-green-700">Store Open</span>
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={`₹${(stats.todaySales / 1000).toFixed(1)}K`}
          icon={IndianRupee}
          change="+18% vs yesterday"
          changeType="positive"
        />
        <StatCard
          title="Orders / Footfall"
          value={`${stats.todayOrders} / ${stats.footfall}`}
          icon={ShoppingCart}
          subtitle={`${stats.conversion}% conversion`}
        />
        <StatCard
          title="Pending Jobs"
          value={stats.pendingJobs}
          icon={Wrench}
          subtitle="3 urgent"
          alert={stats.pendingJobs > 10}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock}
          icon={AlertTriangle}
          changeType={stats.lowStock > 5 ? 'negative' : 'neutral'}
          alert={stats.lowStock > 5}
        />
      </div>

      {/* Target Progress */}
      <TargetProgress targets={targets} period="monthly" />

      {/* Main Content Grid */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Approval Queue */}
        <ApprovalQueue
          approvals={approvals}
          onApprove={handleApprove}
          onReject={handleReject}
          onViewDetails={(item) => toast.info(`Viewing ${item.type} approval: ${item.details.description}`)}
        />

        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />
      </div>

      {/* Team Performance */}
      <TeamPerformanceCard members={teamMembers} />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-6 gap-3">
          <QuickAction label="New Sale" icon={ShoppingCart} onClick={() => navigate('/pos')} />
          <QuickAction label="Stock In" icon={Package} onClick={() => navigate('/inventory')} />
          <QuickAction label="Workshop" icon={Wrench} onClick={() => navigate('/workshop')} />
          <QuickAction label="Team" icon={UserCog} onClick={() => navigate('/hr')} />
          <QuickAction label="Reports" icon={TrendingUp} onClick={() => navigate('/reports')} />
          <QuickAction label="Tasks" icon={Clock} onClick={() => navigate('/tasks')} />
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

export default StoreManagerDashboard;
