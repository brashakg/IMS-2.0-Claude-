// ============================================================================
// IMS 2.0 - Task Escalation Component
// ============================================================================
// Escalation rules, timers, and notification management
// Escalation hierarchy: Staff -> Store Manager -> Area Manager -> Admin

import { useState } from 'react';
import {
  Bell,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Users,
  Settings,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import clsx from 'clsx';
import { TaskPriority, TASK_PRIORITY_CONFIG } from '../../types';

// Escalation Rule Types
export interface EscalationRule {
  id: string;
  name: string;
  description: string;
  priority: TaskPriority;
  isActive: boolean;
  levels: EscalationLevel[];
}

export interface EscalationLevel {
  level: number;
  escalateTo: 'STORE_MANAGER' | 'AREA_MANAGER' | 'ADMIN';
  afterMinutes: number;
  notifyVia: ('APP' | 'SMS' | 'EMAIL' | 'WHATSAPP')[];
  autoReassign: boolean;
}

// Escalated Task for display
export interface EscalatedTask {
  id: string;
  title: string;
  priority: TaskPriority;
  originalAssignee: string;
  currentLevel: number;
  escalatedTo: string;
  escalatedAt: string;
  reason: string;
  overdueBy: number; // minutes
  store: string;
}

// Default Escalation Rules based on Priority
const defaultEscalationRules: EscalationRule[] = [
  {
    id: 'rule-p0',
    name: 'P0 Critical Escalation',
    description: 'Immediate escalation for business-critical tasks',
    priority: 'P0',
    isActive: true,
    levels: [
      { level: 1, escalateTo: 'STORE_MANAGER', afterMinutes: 15, notifyVia: ['APP', 'SMS', 'WHATSAPP'], autoReassign: false },
      { level: 2, escalateTo: 'AREA_MANAGER', afterMinutes: 30, notifyVia: ['APP', 'SMS', 'WHATSAPP', 'EMAIL'], autoReassign: true },
      { level: 3, escalateTo: 'ADMIN', afterMinutes: 60, notifyVia: ['APP', 'SMS', 'WHATSAPP', 'EMAIL'], autoReassign: true },
    ],
  },
  {
    id: 'rule-p1',
    name: 'P1 High Priority Escalation',
    description: 'Fast escalation for high priority tasks',
    priority: 'P1',
    isActive: true,
    levels: [
      { level: 1, escalateTo: 'STORE_MANAGER', afterMinutes: 30, notifyVia: ['APP', 'SMS'], autoReassign: false },
      { level: 2, escalateTo: 'AREA_MANAGER', afterMinutes: 60, notifyVia: ['APP', 'SMS', 'EMAIL'], autoReassign: true },
      { level: 3, escalateTo: 'ADMIN', afterMinutes: 120, notifyVia: ['APP', 'EMAIL'], autoReassign: false },
    ],
  },
  {
    id: 'rule-p2',
    name: 'P2 Medium Priority Escalation',
    description: 'Standard escalation for medium priority tasks',
    priority: 'P2',
    isActive: true,
    levels: [
      { level: 1, escalateTo: 'STORE_MANAGER', afterMinutes: 60, notifyVia: ['APP'], autoReassign: false },
      { level: 2, escalateTo: 'AREA_MANAGER', afterMinutes: 180, notifyVia: ['APP', 'EMAIL'], autoReassign: false },
    ],
  },
  {
    id: 'rule-p3',
    name: 'P3 Low Priority Escalation',
    description: 'Relaxed escalation for low priority tasks',
    priority: 'P3',
    isActive: true,
    levels: [
      { level: 1, escalateTo: 'STORE_MANAGER', afterMinutes: 240, notifyVia: ['APP'], autoReassign: false },
    ],
  },
  {
    id: 'rule-p4',
    name: 'P4 Optional Escalation',
    description: 'Minimal escalation for optional tasks',
    priority: 'P4',
    isActive: false,
    levels: [
      { level: 1, escalateTo: 'STORE_MANAGER', afterMinutes: 480, notifyVia: ['APP'], autoReassign: false },
    ],
  },
];

// Mock Escalated Tasks
const mockEscalatedTasks: EscalatedTask[] = [
  {
    id: 'esc1',
    title: 'Urgent customer complaint - Wrong prescription delivered',
    priority: 'P0',
    originalAssignee: 'Priya Sharma',
    currentLevel: 2,
    escalatedTo: 'Rajesh Kumar (Area Manager)',
    escalatedAt: '10:30 AM',
    reason: 'No response for 45 minutes',
    overdueBy: 45,
    store: 'Mumbai Central',
  },
  {
    id: 'esc2',
    title: 'Cash drawer discrepancy - ₹2,500 short',
    priority: 'P1',
    originalAssignee: 'Amit Patel',
    currentLevel: 1,
    escalatedTo: 'Vikram Singh (Store Manager)',
    escalatedAt: '11:15 AM',
    reason: 'Not started within deadline',
    overdueBy: 35,
    store: 'Mumbai Central',
  },
  {
    id: 'esc3',
    title: 'Weekly inventory count incomplete',
    priority: 'P2',
    originalAssignee: 'Sneha Gupta',
    currentLevel: 1,
    escalatedTo: 'Vikram Singh (Store Manager)',
    escalatedAt: 'Yesterday 6:00 PM',
    reason: 'Task overdue',
    overdueBy: 120,
    store: 'Andheri',
  },
];

// Escalation Rule Card
function EscalationRuleCard({
  rule,
  onEdit,
  onToggle,
}: {
  rule: EscalationRule;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TASK_PRIORITY_CONFIG[rule.priority];

  const roleLabels = {
    STORE_MANAGER: 'Store Manager',
    AREA_MANAGER: 'Area Manager',
    ADMIN: 'Admin',
  };

  const formatMinutes = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
  };

  return (
    <div className={clsx(
      'border rounded-lg transition-all',
      !rule.isActive && 'opacity-50'
    )}>
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={clsx('p-2 rounded-lg', config.bgColor)}>
            <ArrowUpRight className={clsx('w-5 h-5', config.textColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', config.bgColor, config.textColor)}>
                {rule.priority}
              </span>
              <h3 className="font-medium text-gray-900">{rule.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{rule.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{rule.levels.length} levels</span>
          <ChevronRight className={clsx('w-5 h-5 text-gray-400 transition-transform', expanded && 'rotate-90')} />
        </div>
      </div>

      {expanded && (
        <div className="border-t px-4 pb-4">
          {/* Escalation Levels Timeline */}
          <div className="mt-4 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            {rule.levels.map((level, index) => (
              <div key={level.level} className="relative pl-10 pb-4 last:pb-0">
                <div className={clsx(
                  'absolute left-2 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700'
                )}>
                  {level.level}
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Escalate to {roleLabels[level.escalateTo]}
                      </p>
                      <p className="text-sm text-gray-500">
                        After {formatMinutes(level.afterMinutes)} of no action
                      </p>
                    </div>
                    {level.autoReassign && (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        Auto-reassign
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {level.notifyVia.map((method) => (
                      <span key={method} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors',
                rule.isActive
                  ? 'text-orange-600 hover:bg-orange-50'
                  : 'text-green-600 hover:bg-green-50'
              )}
            >
              {rule.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
              {rule.isActive ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors"
            >
              <Edit2 className="w-4 h-4" />
              Edit Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Escalated Task Card
function EscalatedTaskCard({ task }: { task: EscalatedTask }) {
  const config = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <div className={clsx(
      'p-4 border rounded-lg',
      task.priority === 'P0' && 'border-red-300 bg-red-50',
      task.priority === 'P1' && 'border-orange-300 bg-orange-50'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('px-2 py-0.5 rounded text-xs font-bold', config.bgColor, config.textColor)}>
              {task.priority}
            </span>
            <span className="text-xs text-gray-500">{task.store}</span>
          </div>
          <h3 className="font-medium text-gray-900">{task.title}</h3>
          <div className="mt-2 space-y-1 text-sm">
            <p className="text-gray-600">
              <span className="text-gray-500">Originally assigned to:</span> {task.originalAssignee}
            </p>
            <p className="text-gray-600">
              <span className="text-gray-500">Escalated to:</span>{' '}
              <span className="font-medium">{task.escalatedTo}</span>
            </p>
            <p className="text-gray-600">
              <span className="text-gray-500">Reason:</span> {task.reason}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 text-red-600 font-medium">
            <AlertTriangle className="w-4 h-4" />
            Level {task.currentLevel}
          </div>
          <p className="text-xs text-gray-500 mt-1">at {task.escalatedAt}</p>
          <p className="text-xs text-red-600 mt-1">
            Overdue by {task.overdueBy} min
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
        <button className="flex-1 py-2 bg-bv-red-600 text-white rounded-lg text-sm font-medium hover:bg-bv-red-700 transition-colors">
          Take Action
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
          Reassign
        </button>
      </div>
    </div>
  );
}

// Main Task Escalation Component
export function TaskEscalation() {
  const [rules, setRules] = useState<EscalationRule[]>(defaultEscalationRules);
  const [escalatedTasks] = useState<EscalatedTask[]>(mockEscalatedTasks);
  const [activeTab, setActiveTab] = useState<'rules' | 'escalated'>('escalated');

  const handleToggleRule = (ruleId: string) => {
    setRules(rules.map(r =>
      r.id === ruleId ? { ...r, isActive: !r.isActive } : r
    ));
  };

  // Stats
  const stats = {
    activeRules: rules.filter(r => r.isActive).length,
    totalRules: rules.length,
    escalatedCount: escalatedTasks.length,
    criticalCount: escalatedTasks.filter(t => t.priority === 'P0').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Escalation</h1>
          <p className="text-gray-500 mt-1">Manage escalation rules and view escalated tasks</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Rules</p>
              <p className="text-xl font-bold text-gray-900">{stats.activeRules}/{stats.totalRules}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Escalated</p>
              <p className="text-xl font-bold text-orange-600">{stats.escalatedCount}</p>
            </div>
          </div>
        </div>
        <div className={clsx('card', stats.criticalCount > 0 && 'border-red-300')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical (P0)</p>
              <p className="text-xl font-bold text-red-600">{stats.criticalCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Notifications</p>
              <p className="text-xl font-bold text-gray-900">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('escalated')}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'escalated'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Escalated Tasks
          {stats.escalatedCount > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
              {stats.escalatedCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={clsx(
            'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'rules'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Escalation Rules
        </button>
      </div>

      {/* Content */}
      {activeTab === 'escalated' ? (
        <div className="space-y-4">
          {escalatedTasks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto text-green-500 opacity-50 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No escalated tasks</h3>
              <p className="text-gray-500 mt-1">All tasks are being handled on time</p>
            </div>
          ) : (
            <>
              <div className="text-sm text-gray-500 mb-2">
                Showing {escalatedTasks.length} escalated task(s) requiring attention
              </div>
              {escalatedTasks.map((task) => (
                <EscalatedTaskCard key={task.id} task={task} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Configure automatic escalation based on task priority
            </p>
          </div>
          {rules.map((rule) => (
            <EscalationRuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => console.log('Edit rule:', rule.id)}
              onToggle={() => handleToggleRule(rule.id)}
            />
          ))}
        </div>
      )}

      {/* Escalation Flow Info */}
      <div className="card bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Escalation Hierarchy</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              <Users className="w-4 h-4" />
            </div>
            <span>Staff</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700">
              <Users className="w-4 h-4" />
            </div>
            <span>Store Manager</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-200 flex items-center justify-center text-orange-700">
              <Users className="w-4 h-4" />
            </div>
            <span>Area Manager</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center text-red-700">
              <Users className="w-4 h-4" />
            </div>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskEscalation;
