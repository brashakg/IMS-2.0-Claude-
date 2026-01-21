// ============================================================================
// IMS 2.0 - SOP Templates Component
// ============================================================================
// Standard Operating Procedure templates with checklist items and auto-scheduling

import { useState } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Clock,
  CheckSquare,
  Calendar,
  Users,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  X,
  Save,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import clsx from 'clsx';
import { TaskPriority, TASK_PRIORITY_CONFIG } from '../../types';

// SOP Types
export interface SOPChecklistItem {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  estimatedMinutes?: number;
  order: number;
}

export interface SOPTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ON_DEMAND' | 'EVENT_TRIGGERED';
  triggerEvent?: string; // e.g., "STORE_OPEN", "STOCK_LOW", "NEW_ORDER"
  defaultPriority: TaskPriority;
  estimatedDuration: number; // minutes
  assigneeRole?: string;
  checklist: SOPChecklistItem[];
  isActive: boolean;
  scheduledTime?: string; // HH:MM for daily/weekly
  scheduledDays?: number[]; // 0-6 for weekly (0 = Sunday)
  createdAt: string;
  updatedAt: string;
}

// Mock SOP Templates
const mockSOPTemplates: SOPTemplate[] = [
  {
    id: 'sop1',
    name: 'Store Opening Checklist',
    description: 'Daily tasks to perform when opening the store',
    category: 'Operations',
    frequency: 'DAILY',
    defaultPriority: 'P1',
    estimatedDuration: 30,
    assigneeRole: 'SALES_STAFF',
    scheduledTime: '09:00',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    checklist: [
      { id: 'c1', title: 'Turn on all lights and AC', required: true, estimatedMinutes: 2, order: 1 },
      { id: 'c2', title: 'Check display cases are clean', required: true, estimatedMinutes: 5, order: 2 },
      { id: 'c3', title: 'Verify cash float in register', required: true, estimatedMinutes: 5, order: 3 },
      { id: 'c4', title: 'Review pending customer pickups', required: true, estimatedMinutes: 5, order: 4 },
      { id: 'c5', title: 'Check workshop job status', required: false, estimatedMinutes: 5, order: 5 },
      { id: 'c6', title: 'Update promotional displays', required: false, estimatedMinutes: 8, order: 6 },
    ],
  },
  {
    id: 'sop2',
    name: 'Store Closing Checklist',
    description: 'End of day tasks before closing the store',
    category: 'Operations',
    frequency: 'DAILY',
    defaultPriority: 'P1',
    estimatedDuration: 45,
    assigneeRole: 'STORE_MANAGER',
    scheduledTime: '20:30',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    checklist: [
      { id: 'c1', title: 'Count and verify cash drawer', required: true, estimatedMinutes: 10, order: 1 },
      { id: 'c2', title: 'Complete daily sales reconciliation', required: true, estimatedMinutes: 10, order: 2 },
      { id: 'c3', title: 'Secure high-value inventory', required: true, estimatedMinutes: 5, order: 3 },
      { id: 'c4', title: 'Review tomorrow\'s appointments', required: true, estimatedMinutes: 5, order: 4 },
      { id: 'c5', title: 'Turn off displays and AC', required: true, estimatedMinutes: 3, order: 5 },
      { id: 'c6', title: 'Set store alarm', required: true, estimatedMinutes: 2, order: 6 },
      { id: 'c7', title: 'Submit closing report', required: true, estimatedMinutes: 10, order: 7 },
    ],
  },
  {
    id: 'sop3',
    name: 'Weekly Inventory Check',
    description: 'Weekly physical inventory count for high-value items',
    category: 'Inventory',
    frequency: 'WEEKLY',
    defaultPriority: 'P2',
    estimatedDuration: 120,
    assigneeRole: 'STORE_MANAGER',
    scheduledTime: '10:00',
    scheduledDays: [1], // Monday
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    checklist: [
      { id: 'c1', title: 'Count all frames in display', required: true, estimatedMinutes: 30, order: 1 },
      { id: 'c2', title: 'Count premium brand inventory', required: true, estimatedMinutes: 20, order: 2 },
      { id: 'c3', title: 'Verify lens stock levels', required: true, estimatedMinutes: 20, order: 3 },
      { id: 'c4', title: 'Check accessories inventory', required: false, estimatedMinutes: 15, order: 4 },
      { id: 'c5', title: 'Update system with any discrepancies', required: true, estimatedMinutes: 15, order: 5 },
      { id: 'c6', title: 'Submit inventory report', required: true, estimatedMinutes: 20, order: 6 },
    ],
  },
  {
    id: 'sop4',
    name: 'Low Stock Alert Response',
    description: 'Steps to take when stock falls below minimum threshold',
    category: 'Inventory',
    frequency: 'EVENT_TRIGGERED',
    triggerEvent: 'STOCK_LOW',
    defaultPriority: 'P2',
    estimatedDuration: 20,
    assigneeRole: 'STORE_MANAGER',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    checklist: [
      { id: 'c1', title: 'Review current stock levels', required: true, estimatedMinutes: 5, order: 1 },
      { id: 'c2', title: 'Check pending transfer requests', required: true, estimatedMinutes: 3, order: 2 },
      { id: 'c3', title: 'Create reorder request if needed', required: true, estimatedMinutes: 5, order: 3 },
      { id: 'c4', title: 'Notify area manager if critical', required: false, estimatedMinutes: 2, order: 4 },
      { id: 'c5', title: 'Update display if item unavailable', required: true, estimatedMinutes: 5, order: 5 },
    ],
  },
  {
    id: 'sop5',
    name: 'New Customer Onboarding',
    description: 'Process for registering new customers with complete profile',
    category: 'Sales',
    frequency: 'ON_DEMAND',
    defaultPriority: 'P3',
    estimatedDuration: 15,
    assigneeRole: 'SALES_STAFF',
    isActive: true,
    createdAt: '2025-01-01',
    updatedAt: '2025-01-15',
    checklist: [
      { id: 'c1', title: 'Collect customer basic info', required: true, estimatedMinutes: 3, order: 1 },
      { id: 'c2', title: 'Verify mobile number with OTP', required: true, estimatedMinutes: 2, order: 2 },
      { id: 'c3', title: 'Add date of birth for offers', required: false, estimatedMinutes: 1, order: 3 },
      { id: 'c4', title: 'Ask about prescription if needed', required: true, estimatedMinutes: 3, order: 4 },
      { id: 'c5', title: 'Explain loyalty program', required: true, estimatedMinutes: 3, order: 5 },
      { id: 'c6', title: 'Add to WhatsApp updates list', required: false, estimatedMinutes: 2, order: 6 },
    ],
  },
];

// Category Badge
function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    Operations: 'bg-purple-100 text-purple-700',
    Inventory: 'bg-blue-100 text-blue-700',
    Sales: 'bg-green-100 text-green-700',
    Clinical: 'bg-yellow-100 text-yellow-700',
    Finance: 'bg-orange-100 text-orange-700',
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', colors[category] || 'bg-gray-100 text-gray-700')}>
      {category}
    </span>
  );
}

// Frequency Badge
function FrequencyBadge({ frequency, triggerEvent }: { frequency: SOPTemplate['frequency']; triggerEvent?: string }) {
  const labels: Record<string, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    ON_DEMAND: 'On Demand',
    EVENT_TRIGGERED: triggerEvent || 'Event',
  };

  const icons: Record<string, React.ReactNode> = {
    DAILY: <RotateCcw className="w-3 h-3" />,
    WEEKLY: <Calendar className="w-3 h-3" />,
    MONTHLY: <Calendar className="w-3 h-3" />,
    ON_DEMAND: <Play className="w-3 h-3" />,
    EVENT_TRIGGERED: <AlertTriangle className="w-3 h-3" />,
  };

  return (
    <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
      {icons[frequency]}
      {labels[frequency]}
    </span>
  );
}

// SOP Template Card
function SOPTemplateCard({
  template,
  onEdit,
  onDuplicate,
  onToggleActive,
  onStartNow,
  onDelete,
}: {
  template: SOPTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onStartNow: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = TASK_PRIORITY_CONFIG[template.defaultPriority];

  return (
    <div className={clsx(
      'border rounded-lg transition-all',
      !template.isActive && 'opacity-60'
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={clsx(
              'p-2 rounded-lg',
              config.bgColor
            )}>
              <FileText className={clsx('w-5 h-5', config.textColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                {!template.isActive && (
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">Inactive</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <CategoryBadge category={template.category} />
                <FrequencyBadge frequency={template.frequency} triggerEvent={template.triggerEvent} />
                <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', config.bgColor, config.textColor)}>
                  {template.defaultPriority}
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  ~{template.estimatedDuration} min
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <CheckSquare className="w-3 h-3" />
                  {template.checklist.length} items
                </span>
                {template.scheduledTime && (
                  <span className="text-xs text-gray-500">
                    at {template.scheduledTime}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onStartNow}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Start Now"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t">
          {/* Checklist Preview */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Checklist Items</h4>
            <div className="space-y-2">
              {template.checklist.map((item, index) => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-600">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <span className={clsx(!item.required && 'text-gray-500')}>
                      {item.title}
                    </span>
                    {item.required && (
                      <span className="ml-1 text-red-500 text-xs">*</span>
                    )}
                    {item.estimatedMinutes && (
                      <span className="ml-2 text-xs text-gray-400">({item.estimatedMinutes} min)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors border"
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button
                onClick={onDuplicate}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 hover:bg-white rounded-lg transition-colors border"
              >
                <Copy className="w-3 h-3" />
                Duplicate
              </button>
              <button
                onClick={onToggleActive}
                className={clsx(
                  'flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors border',
                  template.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                )}
              >
                {template.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {template.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
            <button
              onClick={onDelete}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main SOP Templates Component
export function SOPTemplates() {
  const [templates, setTemplates] = useState<SOPTemplate[]>(mockSOPTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const categories = ['ALL', ...Array.from(new Set(templates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'ALL'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(t =>
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handleDuplicate = (template: SOPTemplate) => {
    const newTemplate: SOPTemplate = {
      ...template,
      id: `sop${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([...templates, newTemplate]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this SOP template?')) {
      setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const handleStartNow = (template: SOPTemplate) => {
    // In real implementation, this would create a task from the SOP
    alert(`Starting SOP: ${template.name}\nThis would create a new task with ${template.checklist.length} checklist items.`);
  };

  // Stats
  const stats = {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    daily: templates.filter(t => t.frequency === 'DAILY' && t.isActive).length,
    weekly: templates.filter(t => t.frequency === 'WEEKLY' && t.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOP Templates</h1>
          <p className="text-gray-500 mt-1">Manage standard operating procedures and checklists</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create SOP
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total SOPs</p>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <RotateCcw className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Daily Tasks</p>
              <p className="text-xl font-bold text-gray-900">{stats.daily}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Weekly Tasks</p>
              <p className="text-xl font-bold text-gray-900">{stats.weekly}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              selectedCategory === category
                ? 'bg-bv-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category}
            {category !== 'ALL' && (
              <span className="ml-1 opacity-75">
                ({templates.filter(t => t.category === category).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Templates List */}
      <div className="space-y-3">
        {filteredTemplates.map((template) => (
          <SOPTemplateCard
            key={template.id}
            template={template}
            onEdit={() => console.log('Edit:', template.id)}
            onDuplicate={() => handleDuplicate(template)}
            onToggleActive={() => handleToggleActive(template.id)}
            onStartNow={() => handleStartNow(template)}
            onDelete={() => handleDelete(template.id)}
          />
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No SOP templates found</h3>
          <p className="text-gray-500 mt-1">
            {selectedCategory !== 'ALL' ? 'Try selecting a different category' : 'Create your first SOP template'}
          </p>
        </div>
      )}
    </div>
  );
}

export default SOPTemplates;
