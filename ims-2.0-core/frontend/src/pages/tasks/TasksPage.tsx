// ============================================================================
// IMS 2.0 - Tasks Page
// Full-featured task management with MockDataContext integration
// ============================================================================

import { useState, useMemo } from 'react';
import {
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  Phone,
  X,
  ClipboardCheck,
  ListTodo,
  MessageSquare,
  Eye,
  ArrowLeft,
  Edit2,
} from 'lucide-react';
import clsx from 'clsx';
import { SOPChecklist } from '../../components/sop/SOPChecklist';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';
import type { Task, TaskType, TaskPriority, TaskStatus } from '../../types';
import { TASK_PRIORITY_CONFIG } from '../../types';

const TYPE_CONFIG: Record<TaskType, { label: string; color: string }> = {
  FOLLOW_UP: { label: 'Follow Up', color: 'bg-blue-100 text-blue-600' },
  CALLBACK: { label: 'Callback', color: 'bg-purple-100 text-purple-600' },
  DELIVERY: { label: 'Delivery', color: 'bg-green-100 text-green-600' },
  REMINDER: { label: 'Reminder', color: 'bg-orange-100 text-orange-600' },
  STOCK_COUNT: { label: 'Stock Count', color: 'bg-cyan-100 text-cyan-600' },
  ESCALATION: { label: 'Escalation', color: 'bg-red-100 text-red-600' },
  SYSTEM: { label: 'System', color: 'bg-gray-100 text-gray-600' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-600' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-600' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-600' },
  COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-600' },
  ESCALATED: { label: 'Escalated', color: 'bg-red-100 text-red-600' },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600' },
};

type ViewMode = 'list' | 'detail' | 'add' | 'edit';

export function TasksPage() {
  const { tasks, customers, addTask, updateTask, completeTask } = useMockData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'tasks' | 'sop'>('tasks');
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new/edit task
  const [formData, setFormData] = useState({
    type: 'FOLLOW_UP' as TaskType,
    priority: 'P2' as TaskPriority,
    title: '',
    description: '',
    customerId: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '',
  });

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesStatus = filter === 'all' ||
        (filter === 'pending' && (task.status === 'PENDING' || task.status === 'IN_PROGRESS')) ||
        (filter === 'completed' && task.status === 'COMPLETED');

      const matchesType = typeFilter === 'ALL' || task.type === typeFilter;

      return matchesStatus && matchesType;
    });
  }, [tasks, filter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const pendingCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
    const overdueCount = tasks.filter(t => {
      return (t.status === 'PENDING' || t.status === 'IN_PROGRESS') && new Date(t.dueDate) < new Date();
    }).length;
    const todayCount = tasks.filter(t => {
      return (t.status === 'PENDING' || t.status === 'IN_PROGRESS') && t.dueDate === today;
    }).length;

    return { pendingCount, overdueCount, todayCount };
  }, [tasks]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const isOverdue = (dueDate: string, status: TaskStatus) => {
    return (status === 'PENDING' || status === 'IN_PROGRESS') && new Date(dueDate) < new Date();
  };

  const handleToggleComplete = (task: Task) => {
    if (task.status === 'COMPLETED') {
      updateTask(task.id, { status: 'PENDING' });
      toast.info(`Task "${task.title}" marked as pending`);
    } else {
      completeTask(task.id);
      toast.success(`Task "${task.title}" completed`);
    }
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedTask(null);
    setViewMode('list');
  };

  const handleAddTask = () => {
    setFormData({
      type: 'FOLLOW_UP',
      priority: 'P2',
      title: '',
      description: '',
      customerId: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '',
    });
    setShowAddModal(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      type: task.type,
      priority: task.priority,
      title: task.title,
      description: task.description,
      customerId: task.linkedEntityId || '',
      dueDate: task.dueDate,
      dueTime: task.dueTime || '',
    });
    setViewMode('edit');
  };

  const handleSaveTask = () => {
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }

    const customer = customers.find(c => c.id === formData.customerId);

    if (viewMode === 'edit' && selectedTask) {
      updateTask(selectedTask.id, {
        type: formData.type,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        linkedEntityId: formData.customerId || undefined,
        linkedEntityType: formData.customerId ? 'CUSTOMER' : undefined,
      });
      toast.success('Task updated successfully');
      setViewMode('detail');
    } else {
      addTask({
        type: formData.type,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        storeId: 'store-001',
        assignedTo: 'current-user',
        assignedName: 'You',
        createdBy: 'current-user',
        createdByName: 'You',
        dueDate: formData.dueDate,
        dueTime: formData.dueTime || undefined,
        status: 'PENDING',
        linkedEntityType: formData.customerId ? 'CUSTOMER' : undefined,
        linkedEntityId: formData.customerId || undefined,
        escalationLevel: 0,
        escalationHistory: [],
        isSystemGenerated: false,
      });
      toast.success('Task created successfully');
      setShowAddModal(false);
    }

    setFormData({
      type: 'FOLLOW_UP',
      priority: 'P2',
      title: '',
      description: '',
      customerId: '',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '',
    });
  };

  const handleUpdateStatus = (task: Task, newStatus: TaskStatus) => {
    updateTask(task.id, { status: newStatus });
    toast.success(`Task status updated to ${STATUS_CONFIG[newStatus].label}`);
    if (selectedTask?.id === task.id) {
      setSelectedTask({ ...task, status: newStatus });
    }
  };

  const handleWhatsAppReminder = (task: Task) => {
    const customer = customers.find(c => c.id === task.linkedEntityId);
    const phone = customer?.phone || '';
    if (phone) {
      toast.success(`WhatsApp reminder sent to ${phone}`);
    } else {
      toast.error('No phone number associated with this task');
    }
  };

  // Detail View
  if (viewMode === 'detail' && selectedTask) {
    const overdue = isOverdue(selectedTask.dueDate, selectedTask.status);
    const customer = customers.find(c => c.id === selectedTask.linkedEntityId);

    return (
      <div className="space-y-4">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </button>

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', TYPE_CONFIG[selectedTask.type].color)}>
                  {TYPE_CONFIG[selectedTask.type].label}
                </span>
                <span className={clsx('px-2 py-1 rounded text-xs font-medium', TASK_PRIORITY_CONFIG[selectedTask.priority].bgColor, TASK_PRIORITY_CONFIG[selectedTask.priority].textColor)}>
                  {TASK_PRIORITY_CONFIG[selectedTask.priority].label}
                </span>
                <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', STATUS_CONFIG[selectedTask.status].color)}>
                  {STATUS_CONFIG[selectedTask.status].label}
                </span>
                {overdue && <span className="badge-error">Overdue</span>}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
              <p className="text-gray-500">{selectedTask.taskNumber}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEditTask(selectedTask)} className="btn-secondary flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              {selectedTask.status !== 'COMPLETED' && (
                <button onClick={() => handleToggleComplete(selectedTask)} className="btn-primary flex items-center gap-2">
                  <CheckSquare className="w-4 h-4" />
                  Complete
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{selectedTask.description || 'No description'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className={clsx('font-medium flex items-center gap-1', overdue ? 'text-red-600' : 'text-gray-900')}>
                <Clock className="w-4 h-4" />
                {formatDate(selectedTask.dueDate)}
                {selectedTask.dueTime && ` at ${selectedTask.dueTime}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="font-medium flex items-center gap-1">
                <User className="w-4 h-4" />
                {selectedTask.assignedName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="font-medium">{selectedTask.createdByName}</p>
            </div>
            {customer && (
              <>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {customer.phone}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {selectedTask.status === 'PENDING' && (
                <button onClick={() => handleUpdateStatus(selectedTask, 'IN_PROGRESS')} className="btn-secondary text-sm">
                  Start Working
                </button>
              )}
              {selectedTask.status === 'IN_PROGRESS' && (
                <button onClick={() => handleUpdateStatus(selectedTask, 'PENDING')} className="btn-secondary text-sm">
                  Pause
                </button>
              )}
              {customer && (
                <button onClick={() => handleWhatsAppReminder(selectedTask)} className="btn-secondary text-sm flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Send WhatsApp
                </button>
              )}
              {selectedTask.status !== 'CANCELLED' && selectedTask.status !== 'COMPLETED' && (
                <button onClick={() => handleUpdateStatus(selectedTask, 'CANCELLED')} className="text-red-600 hover:text-red-800 text-sm px-3 py-1.5">
                  Cancel Task
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Edit View
  if (viewMode === 'edit' && selectedTask) {
    return (
      <div className="space-y-4">
        <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Task
        </button>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Edit Task</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as TaskType }))}
                  className="input-field"
                >
                  {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                    <option key={type} value={type}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                  className="input-field"
                >
                  {Object.entries(TASK_PRIORITY_CONFIG).map(([priority, config]) => (
                    <option key={priority} value={priority}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="Task description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Time (optional)</label>
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={e => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Customer (optional)</label>
              <select
                value={formData.customerId}
                onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className="input-field"
              >
                <option value="">No customer linked</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={handleBack} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveTask} className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks & SOP</h1>
          <p className="text-gray-500">Manage follow-ups, reminders, and operational checklists</p>
        </div>
        {activeTab === 'tasks' && (
          <button onClick={handleAddTask} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('tasks')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'tasks'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <ListTodo className="w-4 h-4" />
          Tasks
          {stats.pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-xs">
              {stats.pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sop')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'sop'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <ClipboardCheck className="w-4 h-4" />
          SOP Checklists
        </button>
      </div>

      {/* SOP Tab Content */}
      {activeTab === 'sop' && <SOPChecklist />}

      {/* Tasks Tab Content */}
      {activeTab === 'tasks' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingCount}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due Today</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.todayCount}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdueCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="card">
            <div className="flex flex-col tablet:flex-row gap-4 items-center justify-between">
              <div className="flex gap-2">
                {(['pending', 'completed', 'all'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize',
                      filter === f
                        ? 'bg-bv-red-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
                className="input-field w-auto"
              >
                <option value="ALL">All Types</option>
                {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                  <option key={type} value={type}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-3">
            {filteredTasks.length === 0 ? (
              <div className="card text-center py-12 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const typeConfig = TYPE_CONFIG[task.type];
                const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
                const overdue = isOverdue(task.dueDate, task.status);
                const customer = customers.find(c => c.id === task.linkedEntityId);

                return (
                  <div
                    key={task.id}
                    className={clsx(
                      'card cursor-pointer hover:shadow-md transition-shadow',
                      task.status === 'COMPLETED' && 'opacity-60',
                      overdue && 'border-red-300 bg-red-50'
                    )}
                    onClick={() => handleViewTask(task)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(task);
                        }}
                        className="mt-1"
                      >
                        {task.status === 'COMPLETED' ? (
                          <CheckSquare className="w-5 h-5 text-green-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 hover:text-bv-red-600" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-xs font-medium',
                            typeConfig.color
                          )}>
                            {typeConfig.label}
                          </span>
                          <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', priorityConfig.bgColor, priorityConfig.textColor)}>
                            {priorityConfig.label.split(' - ')[0]}
                          </span>
                          {overdue && (
                            <span className="badge-error">Overdue</span>
                          )}
                        </div>

                        <p className={clsx(
                          'font-medium text-gray-900',
                          task.status === 'COMPLETED' && 'line-through'
                        )}>
                          {task.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>

                        {customer && (
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {customer.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Due Date */}
                      <div className="text-right">
                        <div className={clsx(
                          'flex items-center gap-1 text-sm font-medium',
                          overdue ? 'text-red-600' : 'text-gray-600'
                        )}>
                          <Clock className="w-4 h-4" />
                          {formatDate(task.dueDate)}
                        </div>
                        {task.completedAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            Completed {formatDate(task.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">New Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as TaskType }))}
                    className="input-field"
                  >
                    {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                      <option key={type} value={type}>{config.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as TaskPriority }))}
                    className="input-field"
                  >
                    {Object.entries(TASK_PRIORITY_CONFIG).map(([priority, config]) => (
                      <option key={priority} value={priority}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field"
                  placeholder="Task title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Time (optional)</label>
                  <input
                    type="time"
                    value={formData.dueTime}
                    onChange={e => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Customer (optional)</label>
                <select
                  value={formData.customerId}
                  onChange={e => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">No customer linked</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveTask} className="btn-primary">Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TasksPage;
