// ============================================================================
// IMS 2.0 - Workshop Page
// Full-featured workshop management with MockDataContext integration
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Wrench,
  Clock,
  Package,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Phone,
  User,
  Zap,
  Timer,
  X,
  ArrowLeft,
  MessageSquare,
  Play,
  Pause,
  SkipForward,
  Edit2,
  Printer,
} from 'lucide-react';
import type { JobStatus, JobPriority, WorkshopJob } from '../../types';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';
import clsx from 'clsx';

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

const STATUS_FLOW: JobStatus[] = ['CREATED', 'LENS_ORDERED', 'LENS_RECEIVED', 'IN_PROGRESS', 'QC_PENDING', 'QC_PASSED', 'READY', 'DELIVERED'];

export function WorkshopPage() {
  const { workshopJobs, updateJobStatus, getOrderById } = useMockData();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL' | 'ACTIVE'>('ACTIVE');
  const [priorityFilter, setPriorityFilter] = useState<JobPriority | 'ALL'>('ALL');
  const [selectedJob, setSelectedJob] = useState<WorkshopJob | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return workshopJobs.filter(job => {
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
  }, [workshopJobs, searchQuery, statusFilter, priorityFilter]);

  // Stats
  const stats = useMemo(() => {
    const activeJobs = workshopJobs.filter(j => !['DELIVERED', 'CANCELLED'].includes(j.status));
    const urgentJobs = activeJobs.filter(j => j.priority === 'URGENT');
    const readyJobs = workshopJobs.filter(j => j.status === 'READY');
    const overdueJobs = activeJobs.filter(j => j.promisedDate && new Date(j.promisedDate) < new Date());

    return { activeJobs: activeJobs.length, urgentJobs: urgentJobs.length, readyJobs: readyJobs.length, overdueJobs: overdueJobs.length };
  }, [workshopJobs]);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const isOverdue = (promisedDate?: string) => promisedDate && new Date(promisedDate) < new Date();

  const handleStatusUpdate = (jobId: string, newStatus: JobStatus) => {
    updateJobStatus(jobId, newStatus);
    toast.success(`Job status updated to ${STATUS_CONFIG[newStatus].label}`);
    setShowStatusModal(false);

    // Refresh selected job
    const updated = workshopJobs.find(j => j.id === jobId);
    if (updated) setSelectedJob(updated);
  };

  const getNextStatus = (currentStatus: JobStatus): JobStatus | null => {
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex === -1 || currentIndex >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[currentIndex + 1];
  };

  const handleMoveToNextStatus = (job: WorkshopJob) => {
    const nextStatus = getNextStatus(job.status);
    if (nextStatus) {
      handleStatusUpdate(job.id, nextStatus);
    }
  };

  const sendWhatsAppNotification = (phone: string, message: string) => {
    toast.success(`WhatsApp sent to ${phone}`);
  };

  // Job Detail View
  if (selectedJob) {
    const order = getOrderById(selectedJob.orderId);
    const overdue = isOverdue(selectedJob.promisedDate) && !['READY', 'DELIVERED', 'CANCELLED'].includes(selectedJob.status);
    const nextStatus = getNextStatus(selectedJob.status);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{selectedJob.jobNumber}</h1>
              <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_CONFIG[selectedJob.status].class)}>
                {STATUS_CONFIG[selectedJob.status].label}
              </span>
              {overdue && <span className="badge-error flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Overdue</span>}
            </div>
            <p className="text-gray-500">Order: {selectedJob.orderNumber}</p>
          </div>
          <button onClick={() => sendWhatsAppNotification(selectedJob.customerPhone, 'Update')} className="btn-outline text-green-600 border-green-200 hover:bg-green-50">
            <MessageSquare className="w-4 h-4" />
          </button>
          <button onClick={() => toast.info('Printing job card...')} className="btn-outline">
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
          {/* Job Details */}
          <div className="laptop:col-span-2 space-y-4">
            <div className="card">
              <h2 className="font-semibold mb-4">Job Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedJob.customerName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />{selectedJob.customerPhone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Priority</p>
                  <p className={clsx('font-medium flex items-center gap-1', PRIORITY_CONFIG[selectedJob.priority].class)}>
                    {React.createElement(PRIORITY_CONFIG[selectedJob.priority].icon, { className: 'w-4 h-4' })}
                    {PRIORITY_CONFIG[selectedJob.priority].label}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Frame</p>
                  <p className="font-medium">{selectedJob.frameName}</p>
                  {selectedJob.frameBarcode && <p className="text-xs text-gray-400">Barcode: {selectedJob.frameBarcode}</p>}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Type</p>
                  <p className="font-medium">{selectedJob.jobType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Promise Date</p>
                  <p className={clsx('font-medium', overdue ? 'text-red-600' : 'text-gray-900')}>
                    {selectedJob.promisedDate ? formatDate(selectedJob.promisedDate) : 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{selectedJob.assignedTo || 'Unassigned'}</p>
                </div>
              </div>
              {selectedJob.notes && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800"><strong>Notes:</strong> {selectedJob.notes}</p>
                </div>
              )}
            </div>

            {/* Progress */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Progress</h2>
                <button onClick={() => setShowStatusModal(true)} className="text-sm text-bv-red-600 flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />Update Status
                </button>
              </div>
              <div className="space-y-2">
                {STATUS_FLOW.map((status, index) => {
                  const config = STATUS_CONFIG[status];
                  const isActive = selectedJob.status === status;
                  const isPast = STATUS_CONFIG[selectedJob.status].step > config.step;

                  return (
                    <div key={status} className={clsx('flex items-center gap-3 p-2 rounded-lg', isActive ? 'bg-bv-red-50' : isPast ? 'bg-green-50' : 'bg-gray-50')}>
                      <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', isPast ? 'bg-green-500 text-white' : isActive ? 'bg-bv-red-500 text-white' : 'bg-gray-300 text-gray-600')}>
                        {isPast ? '✓' : index + 1}
                      </div>
                      <span className={clsx('text-sm', isActive ? 'font-medium text-bv-red-700' : isPast ? 'text-green-700' : 'text-gray-500')}>{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="card">
              <h2 className="font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {nextStatus && (
                  <button onClick={() => handleMoveToNextStatus(selectedJob)} className="w-full btn-primary flex items-center justify-center gap-2">
                    <SkipForward className="w-4 h-4" />
                    Move to {STATUS_CONFIG[nextStatus].label}
                  </button>
                )}

                {selectedJob.status === 'QC_PENDING' && (
                  <>
                    <button onClick={() => handleStatusUpdate(selectedJob.id, 'QC_PASSED')} className="w-full btn-outline text-green-600 border-green-200 hover:bg-green-50 flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />QC Pass
                    </button>
                    <button onClick={() => handleStatusUpdate(selectedJob.id, 'QC_FAILED')} className="w-full btn-outline text-red-600 border-red-200 hover:bg-red-50 flex items-center justify-center gap-2">
                      <AlertTriangle className="w-4 h-4" />QC Fail
                    </button>
                  </>
                )}

                {selectedJob.status === 'READY' && (
                  <button onClick={() => sendWhatsAppNotification(selectedJob.customerPhone, 'Ready for pickup')} className="w-full btn-outline text-green-600 border-green-200 hover:bg-green-50 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />Notify Ready
                  </button>
                )}

                <button onClick={() => toast.info('Printing job card...')} className="w-full btn-outline flex items-center justify-center gap-2">
                  <Printer className="w-4 h-4" />Print Job Card
                </button>
              </div>
            </div>

            {/* Order Info */}
            {order && (
              <div className="card">
                <h2 className="font-semibold mb-4">Order Info</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Order Total</span><span className="font-medium">₹{order.grandTotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="text-green-600">₹{order.amountPaid.toLocaleString()}</span></div>
                  {order.balanceDue > 0 && <div className="flex justify-between"><span className="text-gray-500">Balance</span><span className="text-red-600">₹{order.balanceDue.toLocaleString()}</span></div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Update Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-2">
                {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(status => {
                  const config = STATUS_CONFIG[status];
                  return (
                    <button key={status} onClick={() => handleStatusUpdate(selectedJob.id, status)} className={clsx('w-full p-3 rounded-lg flex items-center gap-3', selectedJob.status === status ? 'bg-bv-red-50 border-2 border-bv-red-500' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent')}>
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', config.class)}>
                        {config.step}
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Jobs List View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Workshop</h1><p className="text-gray-500">Manage lens fitting and job orders</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Wrench className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Active Jobs</p><p className="text-2xl font-bold">{stats.activeJobs}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><Zap className="w-5 h-5 text-red-600" /></div><div><p className="text-sm text-gray-500">Urgent</p><p className="text-2xl font-bold text-red-600">{stats.urgentJobs}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-gray-500">Ready</p><p className="text-2xl font-bold text-green-600">{stats.readyJobs}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-orange-600" /></div><div><p className="text-sm text-gray-500">Overdue</p><p className="text-2xl font-bold text-orange-600">{stats.overdueJobs}</p></div></div></div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10" placeholder="Search jobs..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)} className="input-field w-auto">
              <option value="ACTIVE">Active Jobs</option>
              <option value="ALL">All Status</option>
              {(Object.keys(STATUS_CONFIG) as JobStatus[]).map(status => <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)} className="input-field w-auto">
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
          <div className="card text-center py-12 text-gray-500"><Wrench className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No jobs found</p></div>
        ) : (
          filteredJobs.map(job => {
            const statusConfig = STATUS_CONFIG[job.status];
            const priorityConfig = PRIORITY_CONFIG[job.priority];
            const PriorityIcon = priorityConfig.icon;
            const overdue = isOverdue(job.promisedDate) && !['READY', 'DELIVERED', 'CANCELLED'].includes(job.status);

            return (
              <div key={job.id} onClick={() => setSelectedJob(job)} className={clsx('card cursor-pointer hover:shadow-md transition-shadow', job.priority === 'URGENT' && 'border-red-300 bg-red-50', overdue && job.priority !== 'URGENT' && 'border-orange-300 bg-orange-50')}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900">{job.jobNumber}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.class)}>{statusConfig.label}</span>
                      <span className={clsx('flex items-center gap-1 text-xs font-medium', priorityConfig.class)}><PriorityIcon className="w-3 h-3" />{priorityConfig.label}</span>
                      {overdue && <span className="badge-error flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Overdue</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium flex items-center gap-1"><User className="w-3 h-3" />{job.customerName}</p>
                        <p className="text-gray-500 flex items-center gap-1"><Phone className="w-3 h-3" />{job.customerPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Frame & Job Type</p>
                        <p className="font-medium">{job.frameName}</p>
                        <p className="text-gray-500">{job.jobType || 'N/A'}</p>
                      </div>
                    </div>
                    {job.notes && <p className="mt-2 text-sm text-yellow-700 bg-yellow-50 px-2 py-1 rounded">Note: {job.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Promise</p>
                    <p className={clsx('font-medium', overdue ? 'text-red-600' : 'text-gray-900')}>{job.promisedDate ? formatDate(job.promisedDate) : '-'}</p>
                    {job.assignedTo && <p className="text-xs text-gray-500 mt-2">{job.assignedTo}</p>}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-500">{statusConfig.label}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className={clsx('h-full transition-all', job.status === 'QC_FAILED' ? 'bg-red-500' : 'bg-bv-red-600')} style={{ width: `${(statusConfig.step / 8) * 100}%` }} />
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
