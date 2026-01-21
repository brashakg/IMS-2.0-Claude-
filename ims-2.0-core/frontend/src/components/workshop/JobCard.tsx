// ============================================================================
// IMS 2.0 - Workshop Job Card Component
// ============================================================================
// Complete job card for workshop with status tracking and timeline

import { useState } from 'react';
import {
  Wrench,
  Clock,
  User,
  Phone,
  Eye,
  Package,
  CheckCircle,
  AlertTriangle,
  Camera,
  MessageSquare,
  ChevronRight,
  Play,
  Pause,
  Check,
  X,
  Truck,
  PhoneCall,
} from 'lucide-react';
import clsx from 'clsx';

// Job Types
type JobType = 'NEW_FITTING' | 'REPAIR' | 'LENS_REPLACEMENT' | 'ADJUSTMENT' | 'CLEANING';
type JobStatus = 'PENDING' | 'IN_PROGRESS' | 'QUALITY_CHECK' | 'READY' | 'DELIVERED' | 'HOLD';
type JobPriority = 'URGENT' | 'NORMAL' | 'LOW';

interface JobStep {
  id: string;
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

interface JobData {
  id: string;
  jobNo: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;

  // Customer
  customer: {
    name: string;
    phone: string;
    email?: string;
  };

  // Product
  frame: {
    brand: string;
    model: string;
    color: string;
    isCustomerOwned: boolean;
  };
  lens?: {
    type: string;
    brand: string;
    coating?: string;
  };

  // Prescription (if applicable)
  prescription?: {
    rightSph: string;
    rightCyl: string;
    rightAxis: string;
    rightAdd?: string;
    leftSph: string;
    leftCyl: string;
    leftAxis: string;
    leftAdd?: string;
    pd: string;
  };

  // Dates
  receivedDate: string;
  promisedDate: string;
  promisedTime: string;
  completedDate?: string;

  // Assignment
  assignedTo?: string;
  createdBy: string;

  // Workflow
  steps: JobStep[];

  // Additional
  specialInstructions?: string;
  internalNotes?: string;
  photos?: string[];

  // Status
  isOverdue: boolean;
  customerNotified: boolean;
}

// Mock Job Data
const mockJob: JobData = {
  id: 'job-001',
  jobNo: 'WS-2026-0123',
  type: 'NEW_FITTING',
  status: 'IN_PROGRESS',
  priority: 'URGENT',
  customer: {
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@email.com',
  },
  frame: {
    brand: 'Ray-Ban',
    model: 'RB5154 Clubmaster',
    color: 'Tortoise/Gold',
    isCustomerOwned: false,
  },
  lens: {
    type: 'Progressive',
    brand: 'Essilor',
    coating: 'Crizal Sapphire HR',
  },
  prescription: {
    rightSph: '-2.50',
    rightCyl: '-0.75',
    rightAxis: '90',
    rightAdd: '+2.00',
    leftSph: '-2.25',
    leftCyl: '-0.50',
    leftAxis: '85',
    leftAdd: '+2.00',
    pd: '64',
  },
  receivedDate: '20-Jan-2026 10:30 AM',
  promisedDate: '21-Jan-2026',
  promisedTime: '4:00 PM',
  assignedTo: 'Ramesh (Workshop)',
  createdBy: 'Priya Sharma',
  steps: [
    { id: 's1', name: 'Order Received', status: 'COMPLETED', completedAt: '20-Jan 10:30 AM', completedBy: 'Priya Sharma' },
    { id: 's2', name: 'Lens Ordered', status: 'COMPLETED', completedAt: '20-Jan 11:00 AM', completedBy: 'System' },
    { id: 's3', name: 'Lens Received', status: 'COMPLETED', completedAt: '21-Jan 9:00 AM', completedBy: 'Ramesh' },
    { id: 's4', name: 'Fitting & Assembly', status: 'IN_PROGRESS' },
    { id: 's5', name: 'Quality Check', status: 'PENDING' },
    { id: 's6', name: 'Ready for Pickup', status: 'PENDING' },
    { id: 's7', name: 'Delivered', status: 'PENDING' },
  ],
  specialInstructions: 'Customer prefers tight fitting. Check PD twice before cutting.',
  internalNotes: 'Progressive lens - verify near & distance zones',
  isOverdue: false,
  customerNotified: false,
};

// Status Badge
function StatusBadge({ status }: { status: JobStatus }) {
  const styles = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    QUALITY_CHECK: 'bg-purple-100 text-purple-700',
    READY: 'bg-green-100 text-green-700',
    DELIVERED: 'bg-gray-100 text-gray-500',
    HOLD: 'bg-red-100 text-red-700',
  };

  return (
    <span className={clsx('px-3 py-1 rounded-full text-sm font-medium', styles[status])}>
      {status.replace('_', ' ')}
    </span>
  );
}

// Priority Badge
function PriorityBadge({ priority }: { priority: JobPriority }) {
  const styles = {
    URGENT: 'bg-red-500 text-white',
    NORMAL: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', styles[priority])}>
      {priority}
    </span>
  );
}

// Step Timeline
function StepTimeline({ steps, onUpdateStep }: { steps: JobStep[]; onUpdateStep: (stepId: string, status: JobStep['status']) => void }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex items-start gap-3">
          {/* Timeline Line */}
          {index < steps.length - 1 && (
            <div className={clsx(
              'absolute left-3 top-6 w-0.5 h-full -ml-px',
              step.status === 'COMPLETED' ? 'bg-green-300' : 'bg-gray-200'
            )} />
          )}

          {/* Status Icon */}
          <div className={clsx(
            'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
            step.status === 'COMPLETED' && 'bg-green-500 text-white',
            step.status === 'IN_PROGRESS' && 'bg-blue-500 text-white animate-pulse',
            step.status === 'PENDING' && 'bg-gray-200 text-gray-400',
            step.status === 'SKIPPED' && 'bg-gray-300 text-gray-500'
          )}>
            {step.status === 'COMPLETED' && <Check className="w-4 h-4" />}
            {step.status === 'IN_PROGRESS' && <Play className="w-3 h-3" />}
            {step.status === 'PENDING' && <span className="text-xs">{index + 1}</span>}
            {step.status === 'SKIPPED' && <X className="w-4 h-4" />}
          </div>

          {/* Step Content */}
          <div className="flex-1 min-w-0 pb-4">
            <div className="flex items-center justify-between">
              <h4 className={clsx(
                'font-medium',
                step.status === 'COMPLETED' && 'text-green-700',
                step.status === 'IN_PROGRESS' && 'text-blue-700',
                step.status === 'PENDING' && 'text-gray-500',
                step.status === 'SKIPPED' && 'text-gray-400 line-through'
              )}>
                {step.name}
              </h4>

              {/* Actions */}
              {step.status === 'PENDING' && index === steps.findIndex(s => s.status === 'PENDING') && (
                <button
                  onClick={() => onUpdateStep(step.id, 'IN_PROGRESS')}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  Start
                </button>
              )}
              {step.status === 'IN_PROGRESS' && (
                <button
                  onClick={() => onUpdateStep(step.id, 'COMPLETED')}
                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  Complete
                </button>
              )}
            </div>

            {step.completedAt && (
              <p className="text-xs text-gray-500 mt-0.5">
                {step.completedAt} {step.completedBy && `by ${step.completedBy}`}
              </p>
            )}

            {step.notes && (
              <p className="text-sm text-gray-600 mt-1">{step.notes}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Job Card Component
export function JobCard() {
  const [job, setJob] = useState<JobData>(mockJob);

  const typeLabels = {
    NEW_FITTING: 'New Fitting',
    REPAIR: 'Repair',
    LENS_REPLACEMENT: 'Lens Replacement',
    ADJUSTMENT: 'Adjustment',
    CLEANING: 'Cleaning',
  };

  const handleUpdateStep = (stepId: string, status: JobStep['status']) => {
    setJob({
      ...job,
      steps: job.steps.map(s =>
        s.id === stepId
          ? { ...s, status, completedAt: new Date().toLocaleString(), completedBy: 'Current User' }
          : s
      ),
    });
  };

  const completedSteps = job.steps.filter(s => s.status === 'COMPLETED').length;
  const progress = Math.round((completedSteps / job.steps.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row tablet:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job.jobNo}</h1>
              <StatusBadge status={job.status} />
              <PriorityBadge priority={job.priority} />
            </div>
            <p className="text-gray-500 mt-1">{typeLabels[job.type]}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <PhoneCall className="w-4 h-4" />
              Call Customer
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Camera className="w-4 h-4" />
              Add Photo
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Add Note
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Deadline Alert */}
        {job.isOverdue ? (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">OVERDUE</span> - Promised delivery was {job.promisedDate} at {job.promisedTime}
          </div>
        ) : (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="w-5 h-5" />
              <span>Promised: {job.promisedDate} at {job.promisedTime}</span>
            </div>
            {job.assignedTo && (
              <span className="text-sm text-blue-600">Assigned to: {job.assignedTo}</span>
            )}
          </div>
        )}
      </div>

      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Customer & Product Info */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Customer
            </h3>
            <div className="space-y-2">
              <p className="font-medium text-lg">{job.customer.name}</p>
              <p className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                {job.customer.phone}
              </p>
              {!job.customerNotified && job.status === 'READY' && (
                <button className="mt-2 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  Notify Customer - Ready for Pickup
                </button>
              )}
            </div>
          </div>

          {/* Frame & Lens */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-500" />
              Product Details
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Frame</p>
                <p className="font-medium">{job.frame.brand} {job.frame.model}</p>
                <p className="text-sm text-gray-600">{job.frame.color}</p>
                {job.frame.isCustomerOwned && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded mt-1 inline-block">
                    Customer's Own Frame
                  </span>
                )}
              </div>
              {job.lens && (
                <div>
                  <p className="text-sm text-gray-500">Lens</p>
                  <p className="font-medium">{job.lens.brand} {job.lens.type}</p>
                  {job.lens.coating && <p className="text-sm text-gray-600">{job.lens.coating}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Prescription */}
          {job.prescription && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-gray-500" />
                Prescription
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2"></th>
                      <th className="text-center py-2">SPH</th>
                      <th className="text-center py-2">CYL</th>
                      <th className="text-center py-2">AXIS</th>
                      {job.prescription.rightAdd && <th className="text-center py-2">ADD</th>}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 font-medium">Right (OD)</td>
                      <td className="text-center">{job.prescription.rightSph}</td>
                      <td className="text-center">{job.prescription.rightCyl}</td>
                      <td className="text-center">{job.prescription.rightAxis}°</td>
                      {job.prescription.rightAdd && <td className="text-center">{job.prescription.rightAdd}</td>}
                    </tr>
                    <tr>
                      <td className="py-2 font-medium">Left (OS)</td>
                      <td className="text-center">{job.prescription.leftSph}</td>
                      <td className="text-center">{job.prescription.leftCyl}</td>
                      <td className="text-center">{job.prescription.leftAxis}°</td>
                      {job.prescription.leftAdd && <td className="text-center">{job.prescription.leftAdd}</td>}
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-sm text-gray-600">PD: {job.prescription.pd}mm</p>
            </div>
          )}
        </div>

        {/* Workflow Timeline */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-gray-500" />
            Workflow Progress
          </h3>
          <StepTimeline steps={job.steps} onUpdateStep={handleUpdateStep} />
        </div>
      </div>

      {/* Notes */}
      {(job.specialInstructions || job.internalNotes) && (
        <div className="grid tablet:grid-cols-2 gap-4">
          {job.specialInstructions && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-800 mb-2">Special Instructions</h3>
              <p className="text-yellow-700">{job.specialInstructions}</p>
            </div>
          )}
          {job.internalNotes && (
            <div className="card bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Internal Notes</h3>
              <p className="text-blue-700">{job.internalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default JobCard;
