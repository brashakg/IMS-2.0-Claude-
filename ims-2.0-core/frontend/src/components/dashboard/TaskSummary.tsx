// ============================================================================
// IMS 2.0 - Task Summary Component with P0-P4 Priority Colors
// ============================================================================

import { Clock, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import { TASK_PRIORITY_CONFIG, TaskPriority } from '../../types';
import clsx from 'clsx';

interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  dueTime?: string;
  assignedBy?: string;
  type: 'MANUAL' | 'SYSTEM' | 'SOP';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ESCALATED';
}

interface TaskSummaryProps {
  tasks: Task[];
  showAll?: boolean;
  onViewAll?: () => void;
  onTaskClick?: (task: Task) => void;
}

// Priority badge component
function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = TASK_PRIORITY_CONFIG[priority];

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-bold text-white',
        config.bgColor
      )}
    >
      {priority}
    </span>
  );
}

// Priority summary count
function PriorityCount({ priority, count }: { priority: TaskPriority; count: number }) {
  const config = TASK_PRIORITY_CONFIG[priority];

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx('w-3 h-3 rounded-full', config.bgColor)} />
      <span className="text-sm font-medium text-gray-700">{count}</span>
    </div>
  );
}

export function TaskSummary({ tasks, showAll = false, onViewAll, onTaskClick }: TaskSummaryProps) {
  // Sort by priority (P0 first) and then by status
  const sortedTasks = [...tasks].sort((a, b) => {
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const displayTasks = showAll ? sortedTasks : sortedTasks.slice(0, 5);

  // Count by priority
  const priorityCounts = {
    P0: tasks.filter(t => t.priority === 'P0' && t.status !== 'COMPLETED').length,
    P1: tasks.filter(t => t.priority === 'P1' && t.status !== 'COMPLETED').length,
    P2: tasks.filter(t => t.priority === 'P2' && t.status !== 'COMPLETED').length,
    P3: tasks.filter(t => t.priority === 'P3' && t.status !== 'COMPLETED').length,
    P4: tasks.filter(t => t.priority === 'P4' && t.status !== 'COMPLETED').length,
  };

  const pendingCount = tasks.filter(t => t.status !== 'COMPLETED').length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Tasks</h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {pendingCount} pending
            </span>
          )}
        </div>

        {/* Priority summary */}
        <div className="flex items-center gap-3">
          <PriorityCount priority="P0" count={priorityCounts.P0} />
          <PriorityCount priority="P1" count={priorityCounts.P1} />
          <PriorityCount priority="P2" count={priorityCounts.P2} />
          <PriorityCount priority="P3" count={priorityCounts.P3} />
          <PriorityCount priority="P4" count={priorityCounts.P4} />
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {displayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
            <p>All tasks completed!</p>
          </div>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                task.status === 'COMPLETED' && 'bg-gray-50 border-gray-200 opacity-60',
                task.status === 'ESCALATED' && 'bg-red-50 border-red-200',
                task.status === 'IN_PROGRESS' && 'bg-blue-50 border-blue-200',
                task.status === 'PENDING' && task.priority === 'P0' && 'bg-red-50 border-red-300',
                task.status === 'PENDING' && task.priority === 'P1' && 'bg-orange-50 border-orange-200',
                task.status === 'PENDING' && task.priority !== 'P0' && task.priority !== 'P1' && 'bg-white border-gray-200',
                'hover:shadow-sm'
              )}
            >
              <PriorityBadge priority={task.priority} />

              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'font-medium truncate',
                  task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'
                )}>
                  {task.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {task.type === 'SYSTEM' && (
                    <span className="text-blue-600">System Task</span>
                  )}
                  {task.type === 'SOP' && (
                    <span className="text-purple-600">SOP</span>
                  )}
                  {task.dueTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.dueTime}
                    </span>
                  )}
                  {task.assignedBy && (
                    <span>by {task.assignedBy}</span>
                  )}
                </div>
              </div>

              {task.status === 'ESCALATED' && (
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}

              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))
        )}
      </div>

      {/* View All */}
      {!showAll && tasks.length > 5 && onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 py-2 text-sm text-bv-red-600 hover:text-bv-red-700 font-medium"
        >
          View all {tasks.length} tasks
        </button>
      )}
    </div>
  );
}

export default TaskSummary;
