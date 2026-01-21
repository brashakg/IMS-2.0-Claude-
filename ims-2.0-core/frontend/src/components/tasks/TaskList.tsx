// ============================================================================
// IMS 2.0 - Task List Component
// ============================================================================
// Comprehensive task list with P0-P4 priorities, filtering, and actions

import { useState, useMemo } from 'react';
import {
  CheckCircle,
  Circle,
  Clock,
  AlertTriangle,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  User,
  Tag,
  Calendar,
  MoreVertical,
  Play,
  Pause,
  CheckSquare,
  ArrowUpRight,
  Timer,
  Bell,
} from 'lucide-react';
import clsx from 'clsx';
import { TaskPriority, TASK_PRIORITY_CONFIG } from '../../types';

// Task Types
export type TaskType = 'SYSTEM' | 'MANUAL' | 'SOP' | 'ESCALATED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'ESCALATED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  type: TaskType;
  status: TaskStatus;
  assignee?: {
    id: string;
    name: string;
  };
  creator?: {
    id: string;
    name: string;
  };
  dueDate?: string;
  dueTime?: string;
  createdAt: string;
  completedAt?: string;
  store?: string;
  category?: string;
  tags?: string[];
  escalationLevel?: number;
  timerStarted?: string;
  timerDuration?: number; // seconds elapsed
  sopId?: string;
  relatedEntity?: {
    type: 'ORDER' | 'CUSTOMER' | 'STOCK' | 'JOB';
    id: string;
    label: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onStartTimer?: (taskId: string) => void;
  showFilters?: boolean;
}

// Priority Badge Component
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = TASK_PRIORITY_CONFIG[priority];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold',
        config.bgColor,
        config.textColor
      )}
    >
      {priority}
    </span>
  );
}

// Task Type Badge
function TypeBadge({ type }: { type: TaskType }) {
  const styles = {
    SYSTEM: 'bg-purple-100 text-purple-700',
    MANUAL: 'bg-blue-100 text-blue-700',
    SOP: 'bg-green-100 text-green-700',
    ESCALATED: 'bg-red-100 text-red-700',
  };

  const labels = {
    SYSTEM: 'System',
    MANUAL: 'Manual',
    SOP: 'SOP',
    ESCALATED: 'Escalated',
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', styles[type])}>
      {labels[type]}
    </span>
  );
}

// Status Badge
function StatusBadge({ status }: { status: TaskStatus }) {
  const styles = {
    PENDING: 'bg-gray-100 text-gray-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    ESCALATED: 'bg-orange-100 text-orange-700',
  };

  const icons = {
    PENDING: <Circle className="w-3 h-3" />,
    IN_PROGRESS: <Play className="w-3 h-3" />,
    COMPLETED: <CheckCircle className="w-3 h-3" />,
    OVERDUE: <AlertTriangle className="w-3 h-3" />,
    ESCALATED: <ArrowUpRight className="w-3 h-3" />,
  };

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {icons[status]}
      {status.replace('_', ' ')}
    </span>
  );
}

// Timer Display
function TaskTimer({ task }: { task: Task }) {
  const [elapsed, setElapsed] = useState(task.timerDuration || 0);

  // In real implementation, this would update in real-time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  };

  if (!task.timerStarted) return null;

  return (
    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
      <Timer className="w-3 h-3 animate-pulse" />
      {formatTime(elapsed)}
    </div>
  );
}

// Single Task Row
function TaskRow({
  task,
  onClick,
  onStatusChange,
  onStartTimer,
}: {
  task: Task;
  onClick?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
  onStartTimer?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOverdue = task.status !== 'COMPLETED' && task.dueDate && new Date(`${task.dueDate}T${task.dueTime || '23:59'}`) < new Date();

  return (
    <div
      className={clsx(
        'border rounded-lg transition-all',
        task.status === 'COMPLETED' && 'opacity-60',
        isOverdue && task.status !== 'COMPLETED' && 'border-red-300 bg-red-50',
        task.priority === 'P0' && task.status !== 'COMPLETED' && 'border-red-400 shadow-sm',
        task.status === 'ESCALATED' && 'border-orange-400 bg-orange-50'
      )}
    >
      {/* Main Row */}
      <div
        className="p-3 cursor-pointer"
        onClick={() => onClick?.()}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange?.(task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED');
            }}
            className={clsx(
              'mt-0.5 p-1 rounded-full transition-colors',
              task.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'
            )}
          >
            {task.status === 'COMPLETED' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={clsx(
                  'font-medium text-gray-900',
                  task.status === 'COMPLETED' && 'line-through text-gray-500'
                )}>
                  {task.title}
                </h3>
                {task.description && expanded && (
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                <TypeBadge type={task.type} />
              </div>
            </div>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              {task.dueDate && (
                <span className={clsx(
                  'flex items-center gap-1',
                  isOverdue && task.status !== 'COMPLETED' && 'text-red-600 font-medium'
                )}>
                  <Calendar className="w-3 h-3" />
                  {task.dueDate} {task.dueTime && `at ${task.dueTime}`}
                  {isOverdue && task.status !== 'COMPLETED' && ' (OVERDUE)'}
                </span>
              )}
              {task.assignee && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {task.assignee.name}
                </span>
              )}
              {task.store && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {task.store}
                </span>
              )}
              {task.relatedEntity && (
                <span className="text-bv-red-600 hover:underline cursor-pointer">
                  {task.relatedEntity.type}: {task.relatedEntity.label}
                </span>
              )}
              <TaskTimer task={task} />
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {task.tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {task.status === 'PENDING' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStartTimer?.();
                }}
                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                title="Start Timer"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Start Work
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <CheckSquare className="w-4 h-4" />
                    Mark Complete
                  </button>
                  <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-orange-600">
                    <ArrowUpRight className="w-4 h-4" />
                    Escalate
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Escalation Warning */}
      {task.escalationLevel && task.escalationLevel > 0 && (
        <div className="px-3 pb-2">
          <div className="flex items-center gap-2 p-2 bg-orange-100 rounded text-xs text-orange-700">
            <Bell className="w-3 h-3" />
            Escalation Level {task.escalationLevel} - {task.escalationLevel === 1 ? 'Store Manager' : task.escalationLevel === 2 ? 'Area Manager' : 'Admin'} notified
          </div>
        </div>
      )}
    </div>
  );
}

// Main Task List Component
export function TaskList({
  tasks,
  onTaskClick,
  onStatusChange,
  onStartTimer,
  showFilters = true,
}: TaskListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          task.assignee?.name.toLowerCase().includes(query) ||
          task.store?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Priority
      if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;

      // Type
      if (typeFilter !== 'ALL' && task.type !== typeFilter) return false;

      return true;
    });
  }, [tasks, searchQuery, priorityFilter, statusFilter, typeFilter]);

  // Group by priority
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskPriority, Task[]> = {
      P0: [],
      P1: [],
      P2: [],
      P3: [],
      P4: [],
    };

    filteredTasks.forEach((task) => {
      groups[task.priority].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    overdue: tasks.filter(t => {
      if (t.status === 'COMPLETED') return false;
      if (!t.dueDate) return false;
      return new Date(`${t.dueDate}T${t.dueTime || '23:59'}`) < new Date();
    }).length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length,
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      {showFilters && (
        <div className="flex flex-col tablet:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bv-red-500 focus:border-transparent"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bv-red-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="P0">P0 - Critical</option>
              <option value="P1">P1 - High</option>
              <option value="P2">P2 - Medium</option>
              <option value="P3">P3 - Low</option>
              <option value="P4">P4 - Optional</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bv-red-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="OVERDUE">Overdue</option>
              <option value="ESCALATED">Escalated</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TaskType | 'ALL')}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-bv-red-500"
            >
              <option value="ALL">All Types</option>
              <option value="SYSTEM">System</option>
              <option value="MANUAL">Manual</option>
              <option value="SOP">SOP</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-sm whitespace-nowrap">
          <span className="text-gray-500">Total:</span>
          <span className="font-semibold">{stats.total}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 rounded-full text-sm whitespace-nowrap">
          <span className="text-yellow-700">Pending:</span>
          <span className="font-semibold text-yellow-800">{stats.pending}</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 rounded-full text-sm whitespace-nowrap">
          <span className="text-blue-700">In Progress:</span>
          <span className="font-semibold text-blue-800">{stats.inProgress}</span>
        </div>
        {stats.overdue > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 rounded-full text-sm whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span className="text-red-700">Overdue:</span>
            <span className="font-semibold text-red-800">{stats.overdue}</span>
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-full text-sm whitespace-nowrap">
          <CheckCircle className="w-3 h-3 text-green-600" />
          <span className="text-green-700">Done:</span>
          <span className="font-semibold text-green-800">{stats.completed}</span>
        </div>
      </div>

      {/* Task List by Priority */}
      <div className="space-y-6">
        {(['P0', 'P1', 'P2', 'P3', 'P4'] as TaskPriority[]).map((priority) => {
          const priorityTasks = groupedTasks[priority];
          if (priorityTasks.length === 0) return null;

          const config = TASK_PRIORITY_CONFIG[priority];

          return (
            <div key={priority}>
              <div className="flex items-center gap-2 mb-2">
                <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', config.bgColor, config.textColor)}>
                  {priority}
                </span>
                <span className="text-sm font-medium text-gray-700">{config.label}</span>
                <span className="text-xs text-gray-500">({priorityTasks.length})</span>
              </div>
              <div className="space-y-2">
                {priorityTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                    onStatusChange={(status) => onStatusChange?.(task.id, status)}
                    onStartTimer={() => onStartTimer?.(task.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto text-green-500 opacity-50 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
          <p className="text-gray-500 mt-1">
            {searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || typeFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'All caught up!'}
          </p>
        </div>
      )}
    </div>
  );
}

export default TaskList;
