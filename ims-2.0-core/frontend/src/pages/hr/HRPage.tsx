// ============================================================================
// IMS 2.0 - HR Management Page
// Full-featured HR with attendance and leave management
// ============================================================================

import { useState, useMemo } from 'react';
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
  X,
  Check,
  Search,
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | 'LATE';
type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  role: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  geoVerified?: boolean;
  leaveType?: string;
}

interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  role: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  rejectedBy?: string;
  rejectionReason?: string;
}

// Initial mock data
const initialAttendance: AttendanceRecord[] = [
  { id: 'att-001', userId: 'user-001', userName: 'Amit Kumar', role: 'Sales Staff', checkInTime: '09:05', checkOutTime: null, status: 'PRESENT', lateMinutes: 5, geoVerified: true },
  { id: 'att-002', userId: 'user-002', userName: 'Priya Sharma', role: 'Optometrist', checkInTime: '09:00', checkOutTime: null, status: 'PRESENT', lateMinutes: 0, geoVerified: true },
  { id: 'att-003', userId: 'user-003', userName: 'Ravi Singh', role: 'Workshop Staff', checkInTime: '09:30', checkOutTime: null, status: 'LATE', lateMinutes: 30, geoVerified: true },
  { id: 'att-004', userId: 'user-004', userName: 'Sunita Das', role: 'Sales Cashier', checkInTime: null, checkOutTime: null, status: 'LEAVE', lateMinutes: 0, leaveType: 'Sick Leave' },
  { id: 'att-005', userId: 'user-005', userName: 'Vikram Mehta', role: 'Sales Staff', checkInTime: null, checkOutTime: null, status: 'ABSENT', lateMinutes: 0 },
];

const initialLeaveRequests: LeaveRequest[] = [
  { id: 'leave-001', userId: 'user-006', userName: 'Neha Gupta', role: 'Sales Staff', leaveType: 'Casual Leave', startDate: '2025-01-25', endDate: '2025-01-26', days: 2, reason: 'Family function', status: 'PENDING', appliedAt: '2025-01-20T10:00:00Z' },
  { id: 'leave-002', userId: 'user-007', userName: 'Rahul Verma', role: 'Workshop Staff', leaveType: 'Sick Leave', startDate: '2025-01-22', endDate: '2025-01-22', days: 1, reason: 'Feeling unwell', status: 'PENDING', appliedAt: '2025-01-21T08:00:00Z' },
  { id: 'leave-003', userId: 'user-004', userName: 'Sunita Das', role: 'Sales Cashier', leaveType: 'Sick Leave', startDate: '2025-01-21', endDate: '2025-01-21', days: 1, reason: 'Doctor appointment', status: 'APPROVED', appliedAt: '2025-01-20T18:00:00Z', approvedBy: 'Store Manager' },
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
  const toast = useToast();

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(initialAttendance);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(initialLeaveRequests);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave'>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Stats
  const stats = useMemo(() => {
    const presentCount = attendance.filter(a => ['PRESENT', 'LATE'].includes(a.status)).length;
    const absentCount = attendance.filter(a => a.status === 'ABSENT').length;
    const onLeaveCount = attendance.filter(a => a.status === 'LEAVE').length;
    const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING').length;
    return { presentCount, absentCount, onLeaveCount, pendingLeaves };
  }, [attendance, leaveRequests]);

  // Filtered data
  const filteredAttendance = useMemo(() => {
    if (!searchQuery) return attendance;
    const q = searchQuery.toLowerCase();
    return attendance.filter(a =>
      a.userName.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    );
  }, [attendance, searchQuery]);

  const filteredLeaves = useMemo(() => {
    if (!searchQuery) return leaveRequests;
    const q = searchQuery.toLowerCase();
    return leaveRequests.filter(l =>
      l.userName.toLowerCase().includes(q) ||
      l.role.toLowerCase().includes(q) ||
      l.leaveType.toLowerCase().includes(q)
    );
  }, [leaveRequests, searchQuery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handleApproveLeave = (leave: LeaveRequest) => {
    setLeaveRequests(prev => prev.map(l =>
      l.id === leave.id
        ? { ...l, status: 'APPROVED' as LeaveStatus, approvedBy: 'Current User' }
        : l
    ));
    toast.success(`Leave approved for ${leave.userName}`);
  };

  const handleRejectLeave = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleConfirmReject = () => {
    if (!selectedLeave) return;

    setLeaveRequests(prev => prev.map(l =>
      l.id === selectedLeave.id
        ? { ...l, status: 'REJECTED' as LeaveStatus, rejectedBy: 'Current User', rejectionReason }
        : l
    ));
    toast.info(`Leave rejected for ${selectedLeave.userName}`);
    setShowRejectModal(false);
    setSelectedLeave(null);
    setRejectionReason('');
  };

  const handleMarkAttendance = (record: AttendanceRecord, newStatus: AttendanceStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    setAttendance(prev => prev.map(a => {
      if (a.id !== record.id) return a;

      if (newStatus === 'PRESENT' && !a.checkInTime) {
        return { ...a, status: newStatus, checkInTime: timeStr, geoVerified: true };
      }
      return { ...a, status: newStatus };
    }));

    toast.success(`${record.userName} marked as ${ATTENDANCE_STATUS_CONFIG[newStatus].label}`);
  };

  const handleCheckOut = (record: AttendanceRecord) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });

    setAttendance(prev => prev.map(a =>
      a.id === record.id ? { ...a, checkOutTime: timeStr } : a
    ));

    toast.success(`${record.userName} checked out at ${timeStr}`);
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
              <p className="text-2xl font-bold text-green-600">{stats.presentCount}</p>
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
              <p className="text-2xl font-bold text-red-600">{stats.absentCount}</p>
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
              <p className="text-2xl font-bold text-blue-600">{stats.onLeaveCount}</p>
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
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingLeaves}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="input-field pl-10 w-full"
          placeholder="Search by name or role..."
        />
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
          {stats.pendingLeaves > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-600 text-xs">
              {stats.pendingLeaves}
            </span>
          )}
        </button>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="card overflow-hidden">
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No attendance records found</p>
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAttendance.map(record => {
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
                                <span className="ml-1 text-xs text-red-500">(+{record.lateMinutes}m)</span>
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
                        <td className="px-4 py-3 text-center">
                          {record.status === 'ABSENT' && (
                            <button
                              onClick={() => handleMarkAttendance(record, 'PRESENT')}
                              className="text-xs text-green-600 hover:text-green-800 font-medium"
                            >
                              Mark Present
                            </button>
                          )}
                          {(record.status === 'PRESENT' || record.status === 'LATE') && !record.checkOutTime && (
                            <button
                              onClick={() => handleCheckOut(record)}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Check Out
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <div className="space-y-3">
          {filteredLeaves.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No leave requests found</p>
            </div>
          ) : (
            filteredLeaves.map(leave => {
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
                          {leave.rejectionReason && (
                            <p className="text-red-500 mt-1">Rejection reason: {leave.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {leave.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectLeave(leave)}
                          className="btn-outline text-sm text-red-600 border-red-300 hover:bg-red-50 flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveLeave(leave)}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    )}
                    {leave.status === 'APPROVED' && leave.approvedBy && (
                      <p className="text-xs text-gray-400">Approved by {leave.approvedBy}</p>
                    )}
                    {leave.status === 'REJECTED' && leave.rejectedBy && (
                      <p className="text-xs text-gray-400">Rejected by {leave.rejectedBy}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedLeave && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Reject Leave Request</h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">{selectedLeave.userName}</p>
                <p className="text-sm text-gray-500">
                  {selectedLeave.leaveType} - {selectedLeave.days} day(s)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (optional)</label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  placeholder="Provide a reason for rejection..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowRejectModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleConfirmReject} className="btn-primary bg-red-600 hover:bg-red-700">Confirm Rejection</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HRPage;
