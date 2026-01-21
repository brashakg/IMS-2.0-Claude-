// ============================================================================
// IMS 2.0 - Workshop Staff Dashboard
// ============================================================================
// Shows job queue, repair status, deadlines, lens orders

import { useNavigate } from 'react-router-dom';
import {
  Wrench,
  Clock,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  Eye,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskSummary } from './TaskSummary';
import { TaskPriority } from '../../types';
import clsx from 'clsx';

// Workshop Job
interface WorkshopJob {
  id: string;
  jobNo: string;
  customerName: string;
  phone: string;
  type: 'NEW_FITTING' | 'REPAIR' | 'LENS_REPLACEMENT' | 'ADJUSTMENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'READY' | 'DELIVERED';
  priority: 'URGENT' | 'NORMAL' | 'LOW';
  dueDate: string;
  dueTime: string;
  overdue: boolean;
  product: string;
  notes?: string;
}

// Job Card Component
function JobCard({ job, onSelect }: { job: WorkshopJob; onSelect: (job: WorkshopJob) => void }) {
  const typeLabels = {
    NEW_FITTING: 'New Fitting',
    REPAIR: 'Repair',
    LENS_REPLACEMENT: 'Lens Replace',
    ADJUSTMENT: 'Adjustment',
  };

  const statusStyles = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    QUALITY_CHECK: 'bg-purple-100 text-purple-700',
    READY: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-gray-50 text-gray-500',
  };

  const priorityStyles = {
    URGENT: 'bg-red-500 text-white',
    NORMAL: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-gray-100 text-gray-600',
  };

  return (
    <div
      onClick={() => onSelect(job)}
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-sm',
        job.overdue && 'border-red-300 bg-red-50',
        job.priority === 'URGENT' && !job.overdue && 'border-orange-300 bg-orange-50',
        job.status === 'IN_PROGRESS' && 'border-blue-300 bg-blue-50',
        !job.overdue && job.priority !== 'URGENT' && job.status !== 'IN_PROGRESS' && 'border-gray-200'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gray-700">{job.jobNo}</span>
          <span className={clsx('text-xs px-1.5 py-0.5 rounded', priorityStyles[job.priority])}>
            {job.priority}
          </span>
          {job.overdue && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-500 text-white flex items-center gap-0.5">
              <AlertTriangle className="w-3 h-3" />
              OVERDUE
            </span>
          )}
        </div>
        <span className={clsx('text-xs px-2 py-0.5 rounded', statusStyles[job.status])}>
          {job.status.replace('_', ' ')}
        </span>
      </div>

      <p className="font-medium text-gray-900">{job.customerName}</p>
      <p className="text-sm text-gray-600">{job.product}</p>
      <p className="text-xs text-gray-500 mt-1">{typeLabels[job.type]}</p>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          Due: {job.dueDate} {job.dueTime}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

// Jobs Queue Component
function JobsQueue({ jobs, title, onSelectJob }: { jobs: WorkshopJob[]; title: string; onSelectJob: (job: WorkshopJob) => void }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
            <p>No pending jobs</p>
          </div>
        ) : (
          jobs.map((job) => (
            <JobCard key={job.id} job={job} onSelect={onSelectJob} />
          ))
        )}
      </div>
    </div>
  );
}

export function WorkshopDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data
  const stats = {
    pendingJobs: 12,
    inProgress: 5,
    qualityCheck: 3,
    readyForPickup: 8,
    overdueJobs: 2,
    completedToday: 15,
    avgTurnaround: 2.5, // hours
  };

  const allJobs: WorkshopJob[] = [
    // Urgent / In Progress
    { id: '1', jobNo: 'WS-001', customerName: 'Rajesh Kumar', phone: '9876543210', type: 'NEW_FITTING', status: 'IN_PROGRESS', priority: 'URGENT', dueDate: 'Today', dueTime: '2:00 PM', overdue: false, product: 'Ray-Ban + Crizal Sapphire', notes: 'Customer waiting' },
    { id: '2', jobNo: 'WS-002', customerName: 'Priya Sharma', phone: '9876543211', type: 'REPAIR', status: 'PENDING', priority: 'URGENT', dueDate: 'Today', dueTime: '12:00 PM', overdue: true, product: 'Oakley Frame - Hinge repair' },

    // Normal Priority
    { id: '3', jobNo: 'WS-003', customerName: 'Amit Patel', phone: '9876543212', type: 'LENS_REPLACEMENT', status: 'QUALITY_CHECK', priority: 'NORMAL', dueDate: 'Today', dueTime: '4:00 PM', overdue: false, product: 'Titan Frame + Progressive' },
    { id: '4', jobNo: 'WS-004', customerName: 'Sneha Gupta', phone: '9876543213', type: 'NEW_FITTING', status: 'IN_PROGRESS', priority: 'NORMAL', dueDate: 'Today', dueTime: '5:00 PM', overdue: false, product: 'John Jacobs + Single Vision' },
    { id: '5', jobNo: 'WS-005', customerName: 'Vikram Singh', phone: '9876543214', type: 'ADJUSTMENT', status: 'PENDING', priority: 'NORMAL', dueDate: 'Tomorrow', dueTime: '10:00 AM', overdue: false, product: 'Gucci Frame adjustment' },

    // Ready for Pickup
    { id: '6', jobNo: 'WS-006', customerName: 'Meera Joshi', phone: '9876543215', type: 'NEW_FITTING', status: 'READY', priority: 'NORMAL', dueDate: 'Today', dueTime: '11:00 AM', overdue: false, product: 'Vogue Frame + Essilor' },
    { id: '7', jobNo: 'WS-007', customerName: 'Karan Malhotra', phone: '9876543216', type: 'LENS_REPLACEMENT', status: 'READY', priority: 'LOW', dueDate: 'Yesterday', dueTime: '6:00 PM', overdue: false, product: 'Customer Frame + Zeiss' },
  ];

  const activeJobs = allJobs.filter(j => j.status !== 'READY' && j.status !== 'DELIVERED');
  const readyJobs = allJobs.filter(j => j.status === 'READY');

  const tasks = [
    { id: '1', title: 'Complete urgent job WS-002 - OVERDUE', priority: 'P0' as TaskPriority, dueTime: 'NOW', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '2', title: 'Quality check for WS-003', priority: 'P1' as TaskPriority, dueTime: '3:00 PM', type: 'MANUAL' as const, status: 'IN_PROGRESS' as const },
    { id: '3', title: 'Call customers for ready pickups', priority: 'P2' as TaskPriority, dueTime: 'Today', type: 'SOP' as const, status: 'PENDING' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Workshop Job Queue</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Jobs</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingJobs}</p>
              <p className="text-xs text-blue-600 mt-1">{stats.inProgress} in progress</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <Wrench className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className={clsx('card', stats.overdueJobs > 0 && 'border-red-300')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className={clsx('text-2xl font-bold mt-1', stats.overdueJobs > 0 ? 'text-red-600' : 'text-green-600')}>
                {stats.overdueJobs}
              </p>
              <p className="text-xs text-gray-500 mt-1">Need immediate attention</p>
            </div>
            <div className={clsx('p-3 rounded-lg', stats.overdueJobs > 0 ? 'bg-red-50' : 'bg-green-50')}>
              <AlertTriangle className={clsx('w-6 h-6', stats.overdueJobs > 0 ? 'text-red-600' : 'text-green-600')} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Ready for Pickup</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.readyForPickup}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting customer</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Turnaround</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgTurnaround}h</p>
              <p className="text-xs text-green-600 mt-1">{stats.completedToday} done today</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Active Jobs Queue */}
        <JobsQueue
          jobs={activeJobs}
          title="Active Jobs"
          onSelectJob={(job) => navigate(`/workshop?job=${job.id}`)}
        />

        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />
      </div>

      {/* Ready for Pickup */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Ready for Pickup</h2>
          <span className="text-sm text-green-600 font-medium">{readyJobs.length} ready</span>
        </div>
        <div className="grid tablet:grid-cols-2 laptop:grid-cols-3 gap-3">
          {readyJobs.map((job) => (
            <div key={job.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm font-bold text-gray-700">{job.jobNo}</span>
                <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">READY</span>
              </div>
              <p className="font-medium text-gray-900">{job.customerName}</p>
              <p className="text-sm text-gray-600 truncate">{job.product}</p>
              <div className="flex items-center gap-2 mt-2">
                <button className="flex-1 text-xs py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1">
                  <PhoneCall className="w-3 h-3" />
                  Call
                </button>
                <button className="flex-1 text-xs py-1.5 bg-white border border-green-600 text-green-700 rounded hover:bg-green-50 transition-colors">
                  Mark Delivered
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-5 gap-3">
          <QuickAction label="New Job" icon={Wrench} onClick={() => navigate('/workshop?action=new')} />
          <QuickAction label="Lens Orders" icon={Eye} onClick={() => navigate('/workshop?tab=orders')} />
          <QuickAction label="Stock Check" icon={Package} onClick={() => navigate('/inventory')} />
          <QuickAction label="Deliveries" icon={Truck} onClick={() => navigate('/workshop?tab=delivery')} />
          <QuickAction label="Call List" icon={PhoneCall} onClick={() => navigate('/workshop?tab=calls')} />
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

export default WorkshopDashboard;
