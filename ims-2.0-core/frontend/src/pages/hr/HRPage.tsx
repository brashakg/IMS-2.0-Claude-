// ============================================================================
// IMS 2.0 - HR Management Page
// ============================================================================

import { useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  MapPin,
  User,
  AlertTriangle,
  FileText,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'LATE';
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Mock attendance data for today
const mockTodayAttendance = [
  {
    id: 'att-001',
    userId: 'user-001',
    userName: 'Amit Kumar',
    role: 'Sales Staff',
    checkInTime: '09:05',
    checkOutTime: null,
    status: 'PRESENT' as AttendanceStatus,
    lateMinutes: 5,
    geoVerified: true,
  },
  {
    id: 'att-002',
    userId: 'user-002',
    userName: 'Priya Sharma',
    role: 'Optometrist',
    checkInTime: '09:00',
    checkOutTime: null,
    status: 'PRESENT' as AttendanceStatus,
    lateMinutes: 0,
    geoVerified: true,
  },
  {
    id: 'att-003',
    userId: 'user-003',
    userName: 'Ravi Singh',
    role: 'Workshop Staff',
    checkInTime: '09:30',
    checkOutTime: null,
    status: 'LATE' as AttendanceStatus,
    lateMinutes: 30,
    geoVerified: true,
  },
  {
    id: 'att-004',
    userId: 'user-004',
    userName: 'Sunita Das',
    role: 'Sales Cashier',
    checkInTime: null,
    checkOutTime: null,
    status: 'LEAVE' as AttendanceStatus,
    lateMinutes: 0,
    leaveType: 'Sick Leave',
  },
  {
    id: 'att-005',
    userId: 'user-005',
    userName: 'Vikram Mehta',
    role: 'Sales Staff',
    checkInTime: null,
    checkOutTime: null,
    status: 'ABSENT' as AttendanceStatus,
    lateMinutes: 0,
  },
];

// Mock leave requests
const mockLeaveRequests = [
  {
    id: 'leave-001',
    userId: 'user-006',
    userName: 'Neha Gupta',
    role: 'Sales Staff',
    leaveType: 'Casual Leave',
    startDate: '2025-01-25',
    endDate: '2025-01-26',
    days: 2,
    reason: 'Family function',
    status: 'PENDING' as LeaveStatus,
    appliedAt: '2025-01-20T10:00:00Z',
  },
  {
    id: 'leave-002',
    userId: 'user-007',
    userName: 'Rahul Verma',
    role: 'Workshop Staff',
    leaveType: 'Sick Leave',
    startDate: '2025-01-22',
    endDate: '2025-01-22',
    days: 1,
    reason: 'Feeling unwell',
    status: 'PENDING' as LeaveStatus,
    appliedAt: '2025-01-21T08:00:00Z',
  },
  {
    id: 'leave-003',
    userId: 'user-004',
    userName: 'Sunita Das',
    role: 'Sales Cashier',
    leaveType: 'Sick Leave',
    startDate: '2025-01-21',
    endDate: '2025-01-21',
    days: 1,
    reason: 'Doctor appointment',
    status: 'APPROVED' as LeaveStatus,
    appliedAt: '2025-01-20T18:00:00Z',
    approvedBy: 'Store Manager',
  },
];

const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, { label: string; class: string }> = {
  PRESENT: { label: 'Present', class: 'bg-green-100 text-green-600' },
  ABSENT: { label: 'Absent', class: 'bg-red-100 text-red-600' },
  HALF_DAY: { label: 'Half Day', class: 'bg-yellow-100 text-yellow-600' },
  LEAVE: { label: 'On Leave', class: 'bg-blue-100 text-blue-600' },
  LATE: { label: 'Late', class: 'bg-orange-100 text-orange-600' },
};

const LEAVE_STATUS_CONFIG: Record<LeaveStatus, { label: string; class: string }> = {
  PENDING: { label: 'Pending', class: 'badge-warning' },
  APPROVED: { label: 'Approved', class: 'badge-success' },
  REJECTED: { label: 'Rejected', class: 'badge-error' },
};

export function HRPage() {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');

  // Stats
  const presentCount = mockTodayAttendance.filter(a => ['PRESENT', 'LATE'].includes(a.status)).length;
  const absentCount = mockTodayAttendance.filter(a => a.status === 'ABSENT').length;
  const onLeaveCount = mockTodayAttendance.filter(a => a.status === 'LEAVE').length;
  const pendingLeaves = mockLeaveRequests.filter(l => l.status === 'PENDING').length;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR Management</h1>
          <p className="text-gray-500">Attendance tracking and leave management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">{absentCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-2xl font-bold text-blue-600">{onLeaveCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Leaves</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('attendance')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'attendance'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Clock className="w-4 h-4" />
          Today's Attendance
        </button>
        <button
          onClick={() => setActiveTab('leave')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'leave'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Calendar className="w-4 h-4" />
          Leave Requests
          {pendingLeaves > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 text-xs">
              {pendingLeaves}
            </span>
          )}
        </button>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Geo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mockTodayAttendance.map(record => {
                  const statusConfig = ATTENDANCE_STATUS_CONFIG[record.status];
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-900">{record.userName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record.role}</td>
                      <td className="px-4 py-3 text-center">
                        {record.checkInTime ? (
                          <div>
                            <span className="font-medium">{record.checkInTime}</span>
                            {record.lateMinutes > 0 && (
                              <span className="ml-1 text-xs text-red-500">
                                (+{record.lateMinutes}m)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.checkOutTime || <span className="text-gray-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', statusConfig.class)}>
                          {statusConfig.label}
                        </span>
                        {record.leaveType && (
                          <span className="block text-xs text-gray-400 mt-1">{record.leaveType}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.geoVerified ? (
                          <MapPin className="w-4 h-4 text-green-500 mx-auto" />
                        ) : record.status === 'LEAVE' ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mx-auto" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-3">
          {mockLeaveRequests.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No leave requests</p>
            </div>
          ) : (
            mockLeaveRequests.map(leave => {
              const statusConfig = LEAVE_STATUS_CONFIG[leave.status];
              return (
                <div key={leave.id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{leave.userName}</span>
                          <span className={statusConfig.class}>{statusConfig.label}</span>
                        </div>
                        <p className="text-sm text-gray-500">{leave.role}</p>
                        <div className="mt-2 text-sm">
                          <p className="font-medium">{leave.leaveType}</p>
                          <p className="text-gray-500">
                            {formatDate(leave.startDate)}
                            {leave.startDate !== leave.endDate && ` - ${formatDate(leave.endDate)}`}
                            <span className="ml-2">({leave.days} day{leave.days > 1 ? 's' : ''})</span>
                          </p>
                          <p className="text-gray-500 mt-1">Reason: {leave.reason}</p>
                        </div>
                      </div>
                    </div>

                    {leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50">
                          Reject
                        </button>
                        <button className="btn-primary text-sm">
                          Approve
                        </button>
                      </div>
                    )}
                    {leave.status === 'APPROVED' && leave.approvedBy && (
                      <p className="text-xs text-gray-400">
                        Approved by {leave.approvedBy}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default HRPage;
