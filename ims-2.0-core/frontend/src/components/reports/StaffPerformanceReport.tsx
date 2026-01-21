// ============================================================================
// IMS 2.0 - Staff Performance Report Component
// ============================================================================
// Staff KPIs, attendance, sales performance, and task completion

import { useState } from 'react';
import {
  Users,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  Star,
  Download,
  Calendar,
  Award,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface StaffPerformance {
  id: string;
  name: string;
  role: string;
  store: string;
  avatar?: string;
  // Attendance
  presentDays: number;
  totalDays: number;
  lateDays: number;
  avgCheckInTime: string;
  // Sales
  totalSales: number;
  salesTarget: number;
  ordersCount: number;
  avgOrderValue: number;
  conversion: number;
  // Tasks
  tasksCompleted: number;
  tasksAssigned: number;
  avgTaskRating: number;
  overdueTaskCount: number;
  // Overall
  performanceScore: number;
}

// Mock Data
const mockStaffPerformance: StaffPerformance[] = [
  {
    id: 's1', name: 'Priya Sharma', role: 'Sales Staff', store: 'Mumbai Central',
    presentDays: 24, totalDays: 26, lateDays: 2, avgCheckInTime: '09:05',
    totalSales: 485000, salesTarget: 450000, ordersCount: 108, avgOrderValue: 4491, conversion: 68,
    tasksCompleted: 45, tasksAssigned: 48, avgTaskRating: 8.5, overdueTaskCount: 1,
    performanceScore: 92
  },
  {
    id: 's2', name: 'Amit Patel', role: 'Optometrist', store: 'Mumbai Central',
    presentDays: 25, totalDays: 26, lateDays: 0, avgCheckInTime: '08:55',
    totalSales: 0, salesTarget: 0, ordersCount: 0, avgOrderValue: 0, conversion: 0,
    tasksCompleted: 156, tasksAssigned: 160, avgTaskRating: 9.2, overdueTaskCount: 0,
    performanceScore: 95
  },
  {
    id: 's3', name: 'Sneha Gupta', role: 'Sales Staff', store: 'Mumbai Central',
    presentDays: 22, totalDays: 26, lateDays: 4, avgCheckInTime: '09:15',
    totalSales: 320000, salesTarget: 400000, ordersCount: 72, avgOrderValue: 4444, conversion: 55,
    tasksCompleted: 38, tasksAssigned: 45, avgTaskRating: 7.8, overdueTaskCount: 3,
    performanceScore: 75
  },
  {
    id: 's4', name: 'Vikram Singh', role: 'Cashier', store: 'Mumbai Central',
    presentDays: 26, totalDays: 26, lateDays: 1, avgCheckInTime: '09:00',
    totalSales: 0, salesTarget: 0, ordersCount: 0, avgOrderValue: 0, conversion: 0,
    tasksCompleted: 52, tasksAssigned: 52, avgTaskRating: 8.9, overdueTaskCount: 0,
    performanceScore: 94
  },
  {
    id: 's5', name: 'Meera Joshi', role: 'Sales Staff', store: 'Andheri',
    presentDays: 23, totalDays: 26, lateDays: 3, avgCheckInTime: '09:10',
    totalSales: 380000, salesTarget: 400000, ordersCount: 85, avgOrderValue: 4470, conversion: 62,
    tasksCompleted: 42, tasksAssigned: 46, avgTaskRating: 8.2, overdueTaskCount: 2,
    performanceScore: 85
  },
];

// Performance Badge
function PerformanceBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 90) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 75) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s >= 60) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getLabel = (s: number) => {
    if (s >= 90) return 'Excellent';
    if (s >= 75) return 'Good';
    if (s >= 60) return 'Average';
    return 'Needs Improvement';
  };

  return (
    <span className={clsx('px-2 py-1 rounded border text-xs font-medium', getColor(score))}>
      {score}% - {getLabel(score)}
    </span>
  );
}

// Progress Bar
function ProgressBar({ value, max, color = 'bg-bv-red-500' }: { value: number; max: number; color?: string }) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className={clsx('h-full rounded-full', color)} style={{ width: `${percentage}%` }} />
    </div>
  );
}

// Star Rating Display
function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={clsx(
            'w-3 h-3',
            rating >= star * 2 ? 'fill-yellow-400 text-yellow-400' :
            rating >= star * 2 - 1 ? 'fill-yellow-400/50 text-yellow-400' :
            'text-gray-300'
          )}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating}/10</span>
    </div>
  );
}

// Staff Card Component
function StaffCard({ staff }: { staff: StaffPerformance }) {
  const salesAchievement = staff.salesTarget > 0 ? Math.round((staff.totalSales / staff.salesTarget) * 100) : 100;
  const attendanceRate = Math.round((staff.presentDays / staff.totalDays) * 100);
  const taskCompletionRate = Math.round((staff.tasksCompleted / staff.tasksAssigned) * 100);

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-bv-red-100 flex items-center justify-center text-bv-red-600 font-bold text-lg">
            {staff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{staff.name}</h3>
            <p className="text-sm text-gray-500">{staff.role} • {staff.store}</p>
          </div>
        </div>
        <PerformanceBadge score={staff.performanceScore} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attendance */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Attendance</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{attendanceRate}%</span>
            <span className="text-xs text-gray-500">({staff.presentDays}/{staff.totalDays} days)</span>
          </div>
          {staff.lateDays > 0 && (
            <p className="text-xs text-orange-600 mt-1">{staff.lateDays} late arrivals</p>
          )}
        </div>

        {/* Sales (if applicable) */}
        {staff.salesTarget > 0 ? (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Sales Target</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={clsx(
                'text-xl font-bold',
                salesAchievement >= 100 ? 'text-green-600' : salesAchievement >= 80 ? 'text-yellow-600' : 'text-red-600'
              )}>
                {salesAchievement}%
              </span>
            </div>
            <ProgressBar
              value={staff.totalSales}
              max={staff.salesTarget}
              color={salesAchievement >= 100 ? 'bg-green-500' : salesAchievement >= 80 ? 'bg-yellow-500' : 'bg-red-500'}
            />
            <p className="text-xs text-gray-500 mt-1">₹{(staff.totalSales/1000).toFixed(0)}K / ₹{(staff.salesTarget/1000).toFixed(0)}K</p>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Exams Done</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">{staff.tasksCompleted}</span>
              <span className="text-xs text-gray-500">this month</span>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Task Completion</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold text-gray-900">{taskCompletionRate}%</span>
            <span className="text-xs text-gray-500">({staff.tasksCompleted}/{staff.tasksAssigned})</span>
          </div>
          {staff.overdueTaskCount > 0 && (
            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {staff.overdueTaskCount} overdue
            </p>
          )}
        </div>

        {/* Rating */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-700">Avg Task Rating</span>
          </div>
          <StarRatingDisplay rating={staff.avgTaskRating} />
        </div>
      </div>

      {/* Additional Stats for Sales Staff */}
      {staff.salesTarget > 0 && (
        <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold text-gray-900">{staff.ordersCount}</p>
            <p className="text-xs text-gray-500">Orders</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">₹{staff.avgOrderValue}</p>
            <p className="text-xs text-gray-500">AOV</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{staff.conversion}%</p>
            <p className="text-xs text-gray-500">Conversion</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Component
export function StaffPerformanceReport() {
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'sales' | 'attendance'>('score');

  // Filter and sort
  let filteredStaff = mockStaffPerformance.filter(s => {
    if (selectedStore !== 'all' && s.store !== selectedStore) return false;
    if (selectedRole !== 'all' && s.role !== selectedRole) return false;
    return true;
  });

  filteredStaff = [...filteredStaff].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.performanceScore - a.performanceScore;
      case 'sales': return b.totalSales - a.totalSales;
      case 'attendance': return (b.presentDays / b.totalDays) - (a.presentDays / a.totalDays);
      default: return 0;
    }
  });

  // Stats
  const avgPerformance = Math.round(mockStaffPerformance.reduce((s, p) => s + p.performanceScore, 0) / mockStaffPerformance.length);
  const totalSales = mockStaffPerformance.reduce((s, p) => s + p.totalSales, 0);
  const avgAttendance = Math.round(mockStaffPerformance.reduce((s, p) => s + (p.presentDays / p.totalDays * 100), 0) / mockStaffPerformance.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Performance</h1>
          <p className="text-gray-500 mt-1">Individual performance metrics and KPIs</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Performance</p>
              <p className="text-xl font-bold text-gray-900">{avgPerformance}%</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">₹{(totalSales / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Attendance</p>
              <p className="text-xl font-bold text-gray-900">{avgAttendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All Stores</option>
          <option value="Mumbai Central">Mumbai Central</option>
          <option value="Andheri">Andheri</option>
        </select>
        <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">All Roles</option>
          <option value="Sales Staff">Sales Staff</option>
          <option value="Optometrist">Optometrist</option>
          <option value="Cashier">Cashier</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="score">Sort by Score</option>
          <option value="sales">Sort by Sales</option>
          <option value="attendance">Sort by Attendance</option>
        </select>
      </div>

      {/* Staff Cards */}
      <div className="grid tablet:grid-cols-2 gap-4">
        {filteredStaff.map((staff) => (
          <StaffCard key={staff.id} staff={staff} />
        ))}
      </div>
    </div>
  );
}

export default StaffPerformanceReport;
