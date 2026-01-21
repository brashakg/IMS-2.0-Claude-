// ============================================================================
// IMS 2.0 - System Tasks Component
// ============================================================================
// Auto-generated tasks based on system events and triggers
// Examples: Low stock alerts, pending approvals, overdue payments, etc.

import { useState } from 'react';
import {
  Zap,
  Package,
  AlertTriangle,
  Clock,
  CreditCard,
  UserCheck,
  Eye,
  Truck,
  Bell,
  Settings,
  ChevronRight,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import { TaskPriority, TASK_PRIORITY_CONFIG } from '../../types';

// System Task Trigger Types
export type SystemTaskTrigger =
  | 'STOCK_LOW'
  | 'STOCK_CRITICAL'
  | 'APPROVAL_PENDING'
  | 'PAYMENT_DUE'
  | 'PAYMENT_OVERDUE'
  | 'ORDER_READY'
  | 'ORDER_OVERDUE'
  | 'TRANSFER_PENDING'
  | 'LENS_ORDER_RECEIVED'
  | 'CUSTOMER_FOLLOWUP'
  | 'WARRANTY_EXPIRING'
  | 'PRESCRIPTION_EXPIRING';

// System Task Configuration
export interface SystemTaskConfig {
  id: string;
  trigger: SystemTaskTrigger;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultPriority: TaskPriority;
  autoAssignTo: 'STORE_MANAGER' | 'ASSIGNED_STAFF' | 'OPTOMETRIST' | 'WORKSHOP' | 'CASHIER';
  isEnabled: boolean;
  conditions?: {
    threshold?: number;
    daysBeforeExpiry?: number;
  };
}

// Generated System Task
export interface GeneratedSystemTask {
  id: string;
  configId: string;
  trigger: SystemTaskTrigger;
  title: string;
  description: string;
  priority: TaskPriority;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';
  createdAt: string;
  dueDate?: string;
  assignee?: string;
  store: string;
  relatedEntity: {
    type: string;
    id: string;
    label: string;
  };
  metadata?: Record<string, any>;
}

// Default System Task Configurations
const defaultSystemTaskConfigs: SystemTaskConfig[] = [
  {
    id: 'sys-stock-low',
    trigger: 'STOCK_LOW',
    name: 'Low Stock Alert',
    description: 'Create task when stock falls below minimum threshold',
    icon: Package,
    defaultPriority: 'P2',
    autoAssignTo: 'STORE_MANAGER',
    isEnabled: true,
    conditions: { threshold: 5 },
  },
  {
    id: 'sys-stock-critical',
    trigger: 'STOCK_CRITICAL',
    name: 'Critical Stock Alert',
    description: 'Urgent task when stock is zero or near-zero',
    icon: AlertTriangle,
    defaultPriority: 'P1',
    autoAssignTo: 'STORE_MANAGER',
    isEnabled: true,
    conditions: { threshold: 2 },
  },
  {
    id: 'sys-approval-pending',
    trigger: 'APPROVAL_PENDING',
    name: 'Pending Approval',
    description: 'Task for discount or refund approvals',
    icon: UserCheck,
    defaultPriority: 'P1',
    autoAssignTo: 'STORE_MANAGER',
    isEnabled: true,
  },
  {
    id: 'sys-payment-due',
    trigger: 'PAYMENT_DUE',
    name: 'Payment Due Reminder',
    description: 'Reminder for pending customer payments',
    icon: CreditCard,
    defaultPriority: 'P2',
    autoAssignTo: 'ASSIGNED_STAFF',
    isEnabled: true,
  },
  {
    id: 'sys-payment-overdue',
    trigger: 'PAYMENT_OVERDUE',
    name: 'Overdue Payment Alert',
    description: 'Urgent task for overdue payments',
    icon: CreditCard,
    defaultPriority: 'P1',
    autoAssignTo: 'STORE_MANAGER',
    isEnabled: true,
  },
  {
    id: 'sys-order-ready',
    trigger: 'ORDER_READY',
    name: 'Order Ready for Pickup',
    description: 'Notify customer when order is ready',
    icon: CheckCircle,
    defaultPriority: 'P2',
    autoAssignTo: 'ASSIGNED_STAFF',
    isEnabled: true,
  },
  {
    id: 'sys-order-overdue',
    trigger: 'ORDER_OVERDUE',
    name: 'Overdue Order Alert',
    description: 'Alert for orders past delivery date',
    icon: Clock,
    defaultPriority: 'P1',
    autoAssignTo: 'WORKSHOP',
    isEnabled: true,
  },
  {
    id: 'sys-transfer-pending',
    trigger: 'TRANSFER_PENDING',
    name: 'Stock Transfer Pending',
    description: 'Task to process incoming stock transfers',
    icon: Truck,
    defaultPriority: 'P2',
    autoAssignTo: 'STORE_MANAGER',
    isEnabled: true,
  },
  {
    id: 'sys-lens-received',
    trigger: 'LENS_ORDER_RECEIVED',
    name: 'Lens Order Received',
    description: 'Workshop task when lens order arrives',
    icon: Eye,
    defaultPriority: 'P2',
    autoAssignTo: 'WORKSHOP',
    isEnabled: true,
  },
  {
    id: 'sys-customer-followup',
    trigger: 'CUSTOMER_FOLLOWUP',
    name: 'Customer Follow-up',
    description: 'Follow up with customer after purchase',
    icon: Bell,
    defaultPriority: 'P3',
    autoAssignTo: 'ASSIGNED_STAFF',
    isEnabled: true,
  },
  {
    id: 'sys-warranty-expiring',
    trigger: 'WARRANTY_EXPIRING',
    name: 'Warranty Expiring Soon',
    description: 'Notify customer about expiring warranty',
    icon: AlertTriangle,
    defaultPriority: 'P3',
    autoAssignTo: 'ASSIGNED_STAFF',
    isEnabled: false,
    conditions: { daysBeforeExpiry: 30 },
  },
  {
    id: 'sys-prescription-expiring',
    trigger: 'PRESCRIPTION_EXPIRING',
    name: 'Prescription Expiring',
    description: 'Remind customer about prescription renewal',
    icon: Eye,
    defaultPriority: 'P3',
    autoAssignTo: 'OPTOMETRIST',
    isEnabled: true,
    conditions: { daysBeforeExpiry: 30 },
  },
];

// Mock Generated System Tasks
const mockGeneratedTasks: GeneratedSystemTask[] = [
  {
    id: 'gen1',
    configId: 'sys-stock-critical',
    trigger: 'STOCK_CRITICAL',
    title: 'Critical: Ray-Ban Aviator RB3025 - Only 1 left',
    description: 'Stock is critically low and needs immediate reorder',
    priority: 'P1',
    status: 'PENDING',
    createdAt: '2026-01-21 09:30',
    store: 'Mumbai Central',
    relatedEntity: { type: 'PRODUCT', id: 'prod-001', label: 'Ray-Ban RB3025' },
    metadata: { currentStock: 1, minStock: 5 },
  },
  {
    id: 'gen2',
    configId: 'sys-approval-pending',
    trigger: 'APPROVAL_PENDING',
    title: 'Discount Approval: 15% on Order #ORD-1234',
    description: 'Staff requested 15% discount exceeding their limit',
    priority: 'P1',
    status: 'PENDING',
    createdAt: '2026-01-21 10:15',
    store: 'Mumbai Central',
    relatedEntity: { type: 'ORDER', id: 'ord-1234', label: 'Order #ORD-1234' },
    metadata: { requestedDiscount: 15, staffLimit: 10, customerName: 'Amit Kumar' },
  },
  {
    id: 'gen3',
    configId: 'sys-order-overdue',
    trigger: 'ORDER_OVERDUE',
    title: 'Order Overdue: Job #WS-089 - 2 days late',
    description: 'Workshop job missed delivery deadline',
    priority: 'P1',
    status: 'IN_PROGRESS',
    createdAt: '2026-01-19 18:00',
    dueDate: '2026-01-19',
    assignee: 'Workshop Team',
    store: 'Mumbai Central',
    relatedEntity: { type: 'JOB', id: 'ws-089', label: 'Job #WS-089' },
    metadata: { customerName: 'Priya Sharma', phone: '9876543210', daysOverdue: 2 },
  },
  {
    id: 'gen4',
    configId: 'sys-order-ready',
    trigger: 'ORDER_READY',
    title: 'Order Ready: Call Rajesh Kumar for pickup',
    description: 'Order ready for customer pickup, needs notification',
    priority: 'P2',
    status: 'PENDING',
    createdAt: '2026-01-21 11:00',
    store: 'Mumbai Central',
    relatedEntity: { type: 'ORDER', id: 'ord-1230', label: 'Order #ORD-1230' },
    metadata: { customerName: 'Rajesh Kumar', phone: '9876543211', product: 'Titan Eyeplus + Crizal' },
  },
  {
    id: 'gen5',
    configId: 'sys-transfer-pending',
    trigger: 'TRANSFER_PENDING',
    title: 'Stock Transfer Received: 15 items from Warehouse',
    description: 'Verify and accept incoming stock transfer',
    priority: 'P2',
    status: 'PENDING',
    createdAt: '2026-01-21 08:00',
    store: 'Mumbai Central',
    relatedEntity: { type: 'TRANSFER', id: 'tf-456', label: 'Transfer #TF-456' },
    metadata: { itemCount: 15, fromLocation: 'Central Warehouse' },
  },
  {
    id: 'gen6',
    configId: 'sys-prescription-expiring',
    trigger: 'PRESCRIPTION_EXPIRING',
    title: 'Prescription Expiring: Meera Joshi - in 15 days',
    description: 'Schedule eye checkup reminder for customer',
    priority: 'P3',
    status: 'PENDING',
    createdAt: '2026-01-21 07:00',
    store: 'Mumbai Central',
    relatedEntity: { type: 'CUSTOMER', id: 'cust-789', label: 'Meera Joshi' },
    metadata: { prescriptionDate: '2025-02-05', expiryDate: '2026-02-05', daysRemaining: 15 },
  },
];

// System Task Config Card
function SystemTaskConfigCard({
  config,
  onToggle,
  generatedCount,
}: {
  config: SystemTaskConfig;
  onToggle: () => void;
  generatedCount: number;
}) {
  const Icon = config.icon;
  const priorityConfig = TASK_PRIORITY_CONFIG[config.defaultPriority];

  return (
    <div className={clsx(
      'p-4 border rounded-lg transition-all',
      !config.isEnabled && 'opacity-50 bg-gray-50'
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={clsx('p-2 rounded-lg', priorityConfig.bgColor)}>
            <Icon className={clsx('w-5 h-5', priorityConfig.textColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-gray-900">{config.name}</h3>
              <span className={clsx(
                'px-1.5 py-0.5 rounded text-xs font-medium',
                priorityConfig.bgColor,
                priorityConfig.textColor
              )}>
                {config.defaultPriority}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{config.description}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span>Auto-assign: {config.autoAssignTo.replace('_', ' ')}</span>
              {config.conditions?.threshold && (
                <span>Threshold: {config.conditions.threshold} units</span>
              )}
              {config.conditions?.daysBeforeExpiry && (
                <span>{config.conditions.daysBeforeExpiry} days before expiry</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {generatedCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
              {generatedCount} active
            </span>
          )}
          <button
            onClick={onToggle}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              config.isEnabled ? 'bg-bv-red-600' : 'bg-gray-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                config.isEnabled ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// Generated Task Card
function GeneratedTaskCard({
  task,
  onComplete,
  onDismiss,
}: {
  task: GeneratedSystemTask;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const config = defaultSystemTaskConfigs.find(c => c.id === task.configId);
  const Icon = config?.icon || Zap;
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <div className={clsx(
      'p-4 border rounded-lg',
      task.priority === 'P0' && 'border-red-400 bg-red-50',
      task.priority === 'P1' && 'border-orange-300 bg-orange-50',
      task.status === 'IN_PROGRESS' && 'border-blue-300 bg-blue-50'
    )}>
      <div className="flex items-start gap-3">
        <div className={clsx('p-2 rounded-lg flex-shrink-0', priorityConfig.bgColor)}>
          <Icon className={clsx('w-5 h-5', priorityConfig.textColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={clsx(
                  'px-1.5 py-0.5 rounded text-xs font-bold',
                  priorityConfig.bgColor,
                  priorityConfig.textColor
                )}>
                  {task.priority}
                </span>
                <span className="text-xs text-gray-500">{task.store}</span>
                <span className={clsx(
                  'px-1.5 py-0.5 rounded text-xs',
                  task.status === 'PENDING' && 'bg-yellow-100 text-yellow-700',
                  task.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-700'
                )}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mt-1">{task.title}</h3>
              <p className="text-sm text-gray-600 mt-0.5">{task.description}</p>
            </div>
          </div>

          {/* Metadata */}
          {task.metadata && (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(task.metadata).map(([key, value]) => (
                <span key={key} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                  {key.replace(/([A-Z])/g, ' $1').trim()}: {String(value)}
                </span>
              ))}
            </div>
          )}

          {/* Related Entity */}
          <div className="flex items-center justify-between mt-3">
            <button className="text-sm text-bv-red-600 hover:underline flex items-center gap-1">
              View {task.relatedEntity.type.toLowerCase()}: {task.relatedEntity.label}
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-xs text-gray-500">{task.createdAt}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t">
            <button
              onClick={onComplete}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Complete
            </button>
            <button
              onClick={onDismiss}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main System Tasks Component
export function SystemTasks() {
  const [configs, setConfigs] = useState<SystemTaskConfig[]>(defaultSystemTaskConfigs);
  const [tasks, setTasks] = useState<GeneratedSystemTask[]>(mockGeneratedTasks);
  const [activeTab, setActiveTab] = useState<'tasks' | 'config'>('tasks');
  const [filterTrigger, setFilterTrigger] = useState<SystemTaskTrigger | 'ALL'>('ALL');

  const handleToggleConfig = (configId: string) => {
    setConfigs(configs.map(c =>
      c.id === configId ? { ...c, isEnabled: !c.isEnabled } : c
    ));
  };

  const handleCompleteTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'COMPLETED' } : t
    ));
  };

  const handleDismissTask = (taskId: string) => {
    setTasks(tasks.map(t =>
      t.id === taskId ? { ...t, status: 'DISMISSED' } : t
    ));
  };

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'DISMISSED');
  const filteredTasks = filterTrigger === 'ALL'
    ? activeTasks
    : activeTasks.filter(t => t.trigger === filterTrigger);

  // Stats
  const stats = {
    totalActive: activeTasks.length,
    p0Count: activeTasks.filter(t => t.priority === 'P0').length,
    p1Count: activeTasks.filter(t => t.priority === 'P1').length,
    enabledConfigs: configs.filter(c => c.isEnabled).length,
  };

  // Get count per config
  const getGeneratedCount = (configId: string) => {
    return activeTasks.filter(t => t.configId === configId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Tasks</h1>
          <p className="text-gray-500 mt-1">Auto-generated tasks from system events</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Tasks</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalActive}</p>
            </div>
          </div>
        </div>
        <div className={clsx('card', stats.p0Count > 0 && 'border-red-300')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical (P0)</p>
              <p className="text-xl font-bold text-red-600">{stats.p0Count}</p>
            </div>
          </div>
        </div>
        <div className={clsx('card', stats.p1Count > 0 && 'border-orange-300')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">High (P1)</p>
              <p className="text-xl font-bold text-orange-600">{stats.p1Count}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Settings className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Enabled Rules</p>
              <p className="text-xl font-bold text-gray-900">{stats.enabledConfigs}/{configs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('tasks')}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tasks'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Active Tasks
          {stats.totalActive > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              {stats.totalActive}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'config'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Task Triggers
        </button>
      </div>

      {/* Content */}
      {activeTab === 'tasks' ? (
        <div className="space-y-4">
          {/* Filter */}
          <select
            value={filterTrigger}
            onChange={(e) => setFilterTrigger(e.target.value as SystemTaskTrigger | 'ALL')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="STOCK_CRITICAL">Stock Critical</option>
            <option value="STOCK_LOW">Stock Low</option>
            <option value="APPROVAL_PENDING">Approval Pending</option>
            <option value="ORDER_READY">Order Ready</option>
            <option value="ORDER_OVERDUE">Order Overdue</option>
            <option value="TRANSFER_PENDING">Transfer Pending</option>
            <option value="PRESCRIPTION_EXPIRING">Prescription Expiring</option>
          </select>

          {/* Tasks */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 opacity-50 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No active system tasks</h3>
              <p className="text-gray-500 mt-1">All system-generated tasks have been handled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <GeneratedTaskCard
                  key={task.id}
                  task={task}
                  onComplete={() => handleCompleteTask(task.id)}
                  onDismiss={() => handleDismissTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Configure which system events automatically generate tasks
          </p>
          {configs.map((config) => (
            <SystemTaskConfigCard
              key={config.id}
              config={config}
              onToggle={() => handleToggleConfig(config.id)}
              generatedCount={getGeneratedCount(config.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SystemTasks;
