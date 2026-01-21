// ============================================================================
// IMS 2.0 - Workshop Page
// ============================================================================

import { useState } from 'react';
import {
  Wrench,
  Clock,
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Play,
  Eye,
  Phone,
  User,
  Calendar,
  Zap,
  Timer,
} from 'lucide-react';
import type { JobStatus, JobPriority } from '../../types';
import clsx from 'clsx';

// Mock workshop jobs
const mockJobs = [
  {
    id: 'job-001',
    jobNumber: 'WS-2501-001',
    orderNumber: 'BV-KOL-001-2501-0002',
    customerId: 'cust-002',
    customerName: 'Sunita Sharma',
    customerPhone: '9988776655',
    frameName: 'Titan Premium Frame',
    frameBarcode: 'TIT-PRE-001',
    lensType: 'Zeiss DriveSafe Progressive',
    status: 'IN_PROGRESS' as JobStatus,
    priority: 'NORMAL' as JobPriority,
    assignedTo: 'Ravi Workshop',
    expectedDate: '2025-01-22',
    promisedDate: '2025-01-23',
    createdAt: '2025-01-19T15:45:00Z',
    notes: 'High power, check fitting carefully',
  },
  {
    id: 'job-002',
    jobNumber: 'WS-2501-002',
    orderNumber: 'BV-KOL-001-2501-0005',
    customerId: 'cust-005',
    customerName: 'Rahul Singh',
    customerPhone: '9988112233',
    frameName: 'Ray-Ban Meta Smart Glasses',
    frameBarcode: 'RB-META-001',
    lensType: 'Essilor Crizal UV',
    status: 'LENS_ORDERED' as JobStatus,
    priority: 'EXPRESS' as JobPriority,
    expectedDate: '2025-01-21',
    promisedDate: '2025-01-22',
    createdAt: '2025-01-21T14:30:00Z',
  },
  {
    id: 'job-003',
    jobNumber: 'WS-2501-003',
    orderNumber: 'BV-KOL-001-2501-0006',
    customerId: 'cust-006',
    customerName: 'Anita Roy',
    customerPhone: '9876500123',
    frameName: 'Oakley Custom',
    frameBarcode: 'OAK-CUS-001',
    lensType: 'Zeiss Individual',
    status: 'QC_PENDING' as JobStatus,
    priority: 'URGENT' as JobPriority,
    assignedTo: 'Ravi Workshop',
    expectedDate: '2025-01-21',
    promisedDate: '2025-01-21',
    createdAt: '2025-01-20T09:00:00Z',
  },
  {
    id: 'job-004',
    jobNumber: 'WS-2501-004',
    orderNumber: 'BV-KOL-001-2501-0007',
    customerId: 'cust-007',
    customerName: 'Vikram Patel',
    customerPhone: '9123400567',
    frameName: 'Ray-Ban Clubmaster',
    frameBarcode: 'RB-CLB-001',
    lensType: 'Essilor Varilux',
    status: 'READY' as JobStatus,
    priority: 'NORMAL' as JobPriority,
    assignedTo: 'Suresh Workshop',
    expectedDate: '2025-01-20',
    promisedDate: '2025-01-21',
    createdAt: '2025-01-18T11:00:00Z',
    completedAt: '2025-01-21T10:00:00Z',
  },
  {
    id: 'job-005',
    jobNumber: 'WS-2501-005',
    orderNumber: 'BV-KOL-001-2501-0008',
    customerId: 'cust-008',
    customerName: 'Meera Iyer',
    customerPhone: '9876501234',
    frameName: 'Titan Lite',
    frameBarcode: 'TIT-LT-001',
    lensType: 'Crizal Easy Pro',
    status: 'CREATED' as JobStatus,
    priority: 'NORMAL' as JobPriority,
    expectedDate: '2025-01-24',
    promisedDate: '2025-01-25',
    createdAt: '2025-01-21T16:00:00Z',
  },
];

const STATUS_CONFIG: Record<JobStatus, { label: string; class: string; step: number }> = {
  CREATED: { label: 'Created', class: 'bg-gray-100 text-gray-600', step: 1 },
  LENS_ORDERED: { label: 'Lens Ordered', class: 'bg-blue-100 text-blue-600', step: 2 },
  LENS_RECEIVED: { label: 'Lens Received', class: 'bg-indigo-100 text-indigo-600', step: 3 },
  IN_PROGRESS: { label: 'Fitting', class: 'bg-yellow-100 text-yellow-600', step: 4 },
  QC_PENDING: { label: 'QC Pending', class: 'bg-orange-100 text-orange-600', step: 5 },
  QC_PASSED: { label: 'QC Passed', class: 'bg-teal-100 text-teal-600', step: 6 },
  QC_FAILED: { label: 'QC Failed', class: 'bg-red-100 text-red-600', step: 5 },
  READY: { label: 'Ready', class: 'bg-green-100 text-green-600', step: 7 },
  DELIVERED: { label: 'Delivered', class: 'bg-emerald-100 text-emerald-600', step: 8 },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-100 text-red-600', step: 0 },
};

const PRIORITY_CONFIG: Record<JobPriority, { label: string; class: string; icon: React.ComponentType<any> }> = {
  NORMAL: { label: 'Normal', class: 'text-gray-500', icon: Clock },
  EXPRESS: { label: 'Express', class: 'text-orange-500', icon: Timer },
  URGENT: { label: 'Urgent', class: 'text-red-500', icon: Zap },
};

export function WorkshopPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL' | 'ACTIVE'>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'ALL'>('ALL');

  // Filter jobs
  const filteredJobs = mockJobs.filter(job => {
    const matchesSearch = !searchQuery ||
      job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === 'ACTIVE') {
      matchesStatus = !['DELIVERED', 'CANCELLED'].includes(job.status);
    } else if (statusFilter !== 'ALL') {
      matchesStatus = job.status === statusFilter;
    }

    const matchesPriority = priorityFilter === 'ALL' || job.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Stats
  const activeJobs = mockJobs.filter(j => !['DELIVERED', 'CANCELLED'].includes(j.status));
  const urgentJobs = activeJobs.filter(j => j.priority === 'URGENT');
  const readyJobs = mockJobs.filter(j => j.status === 'READY');
  const overdueJobs = activeJobs.filter(j => new Date(j.promisedDate) < new Date());

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const isOverdue = (promisedDate: string) => {
    return new Date(promisedDate) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop</h1>
          <p className="text-gray-500">Manage lens fitting and job orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{activeJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{urgentJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ready for Pickup</p>
              <p className="text-2xl font-bold text-green-600">{readyJobs.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-orange-600">{overdueJobs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Search by job number, customer, order..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-field w-auto"
            >
              <option value="ACTIVE">Active Jobs</option>
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
              className="input-field w-auto"
            >
              <option value="ALL">All Priority</option>
              <option value="URGENT">Urgent</option>
              <option value="EXPRESS">Express</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        {filteredJobs.length === 0 ? (
          <div className="card text-center py-12 text-gray-500">
            <Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No jobs found</p>
          </div>
        ) : (
          filteredJobs.map(job => {
            const statusConfig = STATUS_CONFIG[job.status];
            const priorityConfig = PRIORITY_CONFIG[job.priority];
            const PriorityIcon = priorityConfig.icon;
            const overdue = isOverdue(job.promisedDate) && !['READY', 'DELIVERED', 'CANCELLED'].includes(job.status);

            return (
              <div
                key={job.id}
                className={clsx(
                  'card',
                  job.priority === 'URGENT' && 'border-red-300 bg-red-50',
                  overdue && job.priority !== 'URGENT' && 'border-orange-300 bg-orange-50'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{job.jobNumber}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.class)}>
                        {statusConfig.label}
                      </span>
                      <span className={clsx('flex items-center gap-1 text-xs font-medium', priorityConfig.class)}>
                        <PriorityIcon className="w-3 h-3" />
                        {priorityConfig.label}
                      </span>
                      {overdue && (
                        <span className="badge-error flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Overdue
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {job.customerName}
                        </p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {job.customerPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Frame & Lens</p>
                        <p className="font-medium">{job.frameName}</p>
                        <p className="text-gray-500">{job.lensType}</p>
                      </div>
                    </div>

                    {job.notes && (
                      <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">
                        Note: {job.notes}
                      </p>
                    )}
                  </div>

                  {/* Dates & Actions */}
                  <div className="text-right">
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Promise Date</p>
                      <p className={clsx(
                        'font-medium',
                        overdue ? 'text-red-600' : 'text-gray-900'
                      )}>
                        {formatDate(job.promisedDate)}
                      </p>
                    </div>
                    {job.assignedTo && (
                      <p className="text-xs text-gray-500 mb-3">
                        Assigned: {job.assignedTo}
                      </p>
                    )}
                    <button className="btn-outline text-sm flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-500">{statusConfig.label}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full transition-all duration-300',
                        job.status === 'QC_FAILED' ? 'bg-red-500' : 'bg-bv-red-600'
                      )}
                      style={{ width: `${(statusConfig.step / 8) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default WorkshopPage;
