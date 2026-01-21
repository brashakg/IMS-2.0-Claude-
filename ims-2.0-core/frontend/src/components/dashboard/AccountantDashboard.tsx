// ============================================================================
// IMS 2.0 - Accountant Dashboard
// ============================================================================
// Shows financial metrics, GST status, outstanding payments, reconciliation

import { useNavigate } from 'react-router-dom';
import {
  IndianRupee,
  FileText,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Receipt,
  Download,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { TaskSummary } from './TaskSummary';
import { TaskPriority } from '../../types';
import clsx from 'clsx';

// Outstanding Payment
interface OutstandingPayment {
  id: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  invoiceNo: string;
}

// GST Status
interface GSTStatus {
  period: string;
  type: string;
  status: 'FILED' | 'PENDING' | 'OVERDUE';
  dueDate: string;
  amount: number;
}

// Outstanding Payments Component
function OutstandingPayments({ payments }: { payments: OutstandingPayment[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Outstanding Receivables</h2>
        <span className="text-sm text-red-600 font-medium">
          ₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString('en-IN')}
        </span>
      </div>
      <div className="space-y-2">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg border',
              payment.daysOverdue > 30 ? 'border-red-200 bg-red-50' :
              payment.daysOverdue > 7 ? 'border-yellow-200 bg-yellow-50' :
              'border-gray-200'
            )}
          >
            <div>
              <p className="font-medium text-gray-900">{payment.customerName}</p>
              <p className="text-xs text-gray-500">{payment.invoiceNo} • Due: {payment.dueDate}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">₹{payment.amount.toLocaleString('en-IN')}</p>
              {payment.daysOverdue > 0 && (
                <p className={clsx(
                  'text-xs',
                  payment.daysOverdue > 30 ? 'text-red-600' : 'text-yellow-600'
                )}>
                  {payment.daysOverdue} days overdue
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// GST Status Component
function GSTStatusPanel({ statuses }: { statuses: GSTStatus[] }) {
  const statusStyles = {
    FILED: { icon: CheckCircle, color: 'text-green-600 bg-green-100' },
    PENDING: { icon: Clock, color: 'text-yellow-600 bg-yellow-100' },
    OVERDUE: { icon: XCircle, color: 'text-red-600 bg-red-100' },
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">GST Filing Status</h2>
      </div>
      <div className="space-y-2">
        {statuses.map((status, idx) => {
          const style = statusStyles[status.status];
          const Icon = style.icon;
          return (
            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={clsx('p-2 rounded-lg', style.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{status.type}</p>
                  <p className="text-xs text-gray-500">{status.period} • Due: {status.dueDate}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">₹{status.amount.toLocaleString('en-IN')}</p>
                <p className={clsx(
                  'text-xs',
                  status.status === 'FILED' ? 'text-green-600' :
                  status.status === 'OVERDUE' ? 'text-red-600' : 'text-yellow-600'
                )}>
                  {status.status}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AccountantDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Mock data
  const stats = {
    todayCollection: 245000,
    monthCollection: 7850000,
    monthTarget: 9000000,
    outstandingTotal: 1250000,
    overdueTotal: 450000,
    gstPayable: 185000,
    pendingReconciliation: 3,
  };

  const outstandingPayments: OutstandingPayment[] = [
    { id: '1', customerName: 'TCS Corporate', amount: 350000, dueDate: '15 Dec 2024', daysOverdue: 35, invoiceNo: 'INV-2412-045' },
    { id: '2', customerName: 'Infosys Ltd', amount: 180000, dueDate: '28 Dec 2024', daysOverdue: 22, invoiceNo: 'INV-2412-078' },
    { id: '3', customerName: 'Wipro Technologies', amount: 95000, dueDate: '05 Jan 2025', daysOverdue: 14, invoiceNo: 'INV-2501-012' },
    { id: '4', customerName: 'Reliance Retail', amount: 75000, dueDate: '10 Jan 2025', daysOverdue: 9, invoiceNo: 'INV-2501-023' },
  ];

  const gstStatuses: GSTStatus[] = [
    { period: 'December 2024', type: 'GSTR-3B', status: 'PENDING', dueDate: '20 Jan 2025', amount: 185000 },
    { period: 'December 2024', type: 'GSTR-1', status: 'FILED', dueDate: '11 Jan 2025', amount: 185000 },
    { period: 'November 2024', type: 'GSTR-3B', status: 'FILED', dueDate: '20 Dec 2024', amount: 168000 },
  ];

  const tasks = [
    { id: '1', title: 'File GSTR-3B for December', priority: 'P0' as TaskPriority, dueTime: '20 Jan', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '2', title: 'Reconcile bank statement - HDFC', priority: 'P1' as TaskPriority, dueTime: 'Today', type: 'MANUAL' as const, status: 'IN_PROGRESS' as const },
    { id: '3', title: 'Follow up on TCS overdue payment', priority: 'P1' as TaskPriority, dueTime: 'Today', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '4', title: 'Process salary disbursement', priority: 'P2' as TaskPriority, dueTime: '25 Jan', type: 'SOP' as const, status: 'PENDING' as const },
    { id: '5', title: 'Update vendor payments register', priority: 'P3' as TaskPriority, type: 'MANUAL' as const, status: 'PENDING' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Finance & Accounts Overview</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(stats.todayCollection / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-green-600 mt-1">+8% vs yesterday</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Month Collection</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ₹{(stats.monthCollection / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((stats.monthCollection / stats.monthTarget) * 100)}% of target
              </p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ₹{(stats.outstandingTotal / 100000).toFixed(1)}L
              </p>
              <p className="text-xs text-red-500 mt-1">
                ₹{(stats.overdueTotal / 1000).toFixed(0)}K overdue
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">GST Payable</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">
                ₹{(stats.gstPayable / 1000).toFixed(0)}K
              </p>
              <p className="text-xs text-orange-500 mt-1">Due 20 Jan</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Receipt className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />

        {/* GST Status */}
        <GSTStatusPanel statuses={gstStatuses} />
      </div>

      {/* Outstanding Payments */}
      <OutstandingPayments payments={outstandingPayments} />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-5 gap-3">
          <QuickAction label="Reports" icon={TrendingUp} onClick={() => navigate('/reports')} />
          <QuickAction label="Invoices" icon={FileText} onClick={() => navigate('/orders')} />
          <QuickAction label="Payments" icon={CreditCard} onClick={() => navigate('/reports')} />
          <QuickAction label="Export Data" icon={Download} onClick={() => toast.success('Exporting data. Check your downloads shortly.')} />
          <QuickAction label="GST Reports" icon={Receipt} onClick={() => navigate('/reports')} />
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

export default AccountantDashboard;
