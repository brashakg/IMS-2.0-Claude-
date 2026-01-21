// ============================================================================
// IMS 2.0 - Task Details Component
// ============================================================================
// Full task view with start/end time, notes, and rating system (1-10)

import { useState } from 'react';
import {
  Clock,
  Calendar,
  User,
  Tag,
  MessageSquare,
  Star,
  Play,
  Pause,
  CheckCircle,
  X,
  Save,
  AlertTriangle,
  ChevronRight,
  Timer,
  Edit2,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';
import { TaskPriority, TASK_PRIORITY_CONFIG } from '../../types';
import { Task, TaskStatus, TaskType } from './TaskList';

// Extended Task with additional fields
export interface TaskWithDetails extends Task {
  startTime?: string; // Actual start time
  endTime?: string; // Actual end time
  scheduledStart?: string; // Planned start
  scheduledEnd?: string; // Planned end (deadline)
  notes: TaskNote[];
  rating?: TaskRating;
  timeSpent?: number; // Total seconds
  checklistItems?: ChecklistItem[];
}

export interface TaskNote {
  id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  isPrivate: boolean;
}

export interface TaskRating {
  score: number; // 1-10
  ratedBy: string;
  ratedAt: string;
  feedback?: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

interface TaskDetailsProps {
  task: TaskWithDetails;
  onClose: () => void;
  onUpdate: (task: TaskWithDetails) => void;
  canRate: boolean; // Only Store Manager and above
}

// Star Rating Component
function StarRating({
  value,
  onChange,
  disabled = false,
  size = 'md',
}: {
  value: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [hoverValue, setHoverValue] = useState(0);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onMouseEnter={() => !disabled && setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          onClick={() => onChange?.(star)}
          className={clsx(
            'transition-colors',
            disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={clsx(
              sizeClasses[size],
              'transition-colors',
              (hoverValue || value) >= star
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-lg font-bold text-gray-700">
        {hoverValue || value || '-'}/10
      </span>
    </div>
  );
}

// Time Input Component
function TimeInput({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          'w-full px-3 py-2 border rounded-lg text-sm',
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-bv-red-500'
        )}
      />
    </div>
  );
}

// Note Card Component
function NoteCard({ note }: { note: TaskNote }) {
  return (
    <div className={clsx(
      'p-3 rounded-lg',
      note.isPrivate ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
    )}>
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-800">{note.text}</p>
        {note.isPrivate && (
          <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">Private</span>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <User className="w-3 h-3" />
        <span>{note.createdBy}</span>
        <span>•</span>
        <span>{note.createdAt}</span>
      </div>
    </div>
  );
}

// Main Task Details Component
export function TaskDetails({ task, onClose, onUpdate, canRate }: TaskDetailsProps) {
  const [editedTask, setEditedTask] = useState<TaskWithDetails>(task);
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);
  const [ratingFeedback, setRatingFeedback] = useState(task.rating?.feedback || '');
  const [showRatingForm, setShowRatingForm] = useState(false);

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const handleStartTask = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setEditedTask({
      ...editedTask,
      startTime: now,
      status: 'IN_PROGRESS' as TaskStatus,
    });
  };

  const handleCompleteTask = () => {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setEditedTask({
      ...editedTask,
      endTime: now,
      status: 'COMPLETED' as TaskStatus,
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: TaskNote = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      createdBy: 'Current User', // Would come from auth context
      createdAt: new Date().toLocaleString(),
      isPrivate: isPrivateNote,
    };
    setEditedTask({
      ...editedTask,
      notes: [...editedTask.notes, note],
    });
    setNewNote('');
    setIsPrivateNote(false);
  };

  const handleRatingChange = (score: number) => {
    setEditedTask({
      ...editedTask,
      rating: {
        score,
        ratedBy: 'Store Manager', // Would come from auth context
        ratedAt: new Date().toLocaleString(),
        feedback: ratingFeedback,
      },
    });
  };

  const handleSave = () => {
    onUpdate(editedTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <span className={clsx(
              'px-2 py-1 rounded text-xs font-bold',
              priorityConfig.bgColor,
              priorityConfig.textColor
            )}>
              {task.priority}
            </span>
            <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status & Basic Info */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={clsx(
              'px-3 py-1 rounded-full text-sm font-medium',
              editedTask.status === 'PENDING' && 'bg-gray-100 text-gray-700',
              editedTask.status === 'IN_PROGRESS' && 'bg-blue-100 text-blue-700',
              editedTask.status === 'COMPLETED' && 'bg-green-100 text-green-700',
              editedTask.status === 'OVERDUE' && 'bg-red-100 text-red-700'
            )}>
              {editedTask.status.replace('_', ' ')}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {task.type}
            </span>
            {task.assignee && (
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <User className="w-4 h-4" />
                {task.assignee.name}
              </span>
            )}
            {task.store && (
              <span className="text-sm text-gray-500">{task.store}</span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600">{task.description}</p>
            </div>
          )}

          {/* Time Management */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time Management
            </h3>
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Scheduled Start</label>
                <input
                  type="time"
                  value={editedTask.scheduledStart || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, scheduledStart: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deadline</label>
                <input
                  type="time"
                  value={editedTask.scheduledEnd || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, scheduledEnd: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Actual Start</label>
                <input
                  type="time"
                  value={editedTask.startTime || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, startTime: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm bg-green-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Actual End</label>
                <input
                  type="time"
                  value={editedTask.endTime || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, endTime: e.target.value })}
                  className="w-full px-2 py-1.5 border rounded text-sm bg-green-50"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4">
              {editedTask.status === 'PENDING' && (
                <button
                  onClick={handleStartTask}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Task
                </button>
              )}
              {editedTask.status === 'IN_PROGRESS' && (
                <button
                  onClick={handleCompleteTask}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Task
                </button>
              )}
              {editedTask.timeSpent && (
                <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm">
                  <Timer className="w-4 h-4" />
                  Time spent: {formatDuration(editedTask.timeSpent)}
                </div>
              )}
            </div>
          </div>

          {/* Checklist */}
          {editedTask.checklistItems && editedTask.checklistItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Checklist ({editedTask.checklistItems.filter(i => i.completed).length}/{editedTask.checklistItems.length})
              </h3>
              <div className="space-y-2">
                {editedTask.checklistItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => {
                        setEditedTask({
                          ...editedTask,
                          checklistItems: editedTask.checklistItems?.map(i =>
                            i.id === item.id
                              ? { ...i, completed: e.target.checked, completedAt: e.target.checked ? new Date().toLocaleString() : undefined }
                              : i
                          ),
                        });
                      }}
                      className="w-4 h-4 text-bv-red-600 rounded"
                    />
                    <span className={clsx(item.completed && 'line-through text-gray-400')}>
                      {item.title}
                    </span>
                    {item.completedAt && (
                      <span className="text-xs text-gray-400 ml-auto">{item.completedAt}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Notes ({editedTask.notes.length})
            </h3>

            {/* Existing Notes */}
            {editedTask.notes.length > 0 && (
              <div className="space-y-2 mb-4">
                {editedTask.notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}

            {/* Add Note */}
            <div className="border rounded-lg p-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivateNote}
                    onChange={(e) => setIsPrivateNote(e.target.checked)}
                    className="rounded"
                  />
                  Private note (only visible to managers)
                </label>
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Note
                </button>
              </div>
            </div>
          </div>

          {/* Rating Section (Only for Store Manager and above) */}
          {canRate && editedTask.status === 'COMPLETED' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Task Performance Rating
              </h3>

              {editedTask.rating ? (
                <div>
                  <StarRating value={editedTask.rating.score} disabled />
                  {editedTask.rating.feedback && (
                    <p className="mt-2 text-sm text-gray-600 italic">"{editedTask.rating.feedback}"</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Rated by {editedTask.rating.ratedBy} on {editedTask.rating.ratedAt}
                  </p>
                  <button
                    onClick={() => setShowRatingForm(true)}
                    className="mt-2 text-sm text-bv-red-600 hover:underline"
                  >
                    Edit Rating
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-3">Rate this task's completion (1-10):</p>
                  <StarRating
                    value={editedTask.rating?.score || 0}
                    onChange={handleRatingChange}
                  />
                  <textarea
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    placeholder="Optional feedback for the employee..."
                    className="w-full mt-3 px-3 py-2 border rounded-lg text-sm resize-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}

          {/* Existing Rating Display (for non-managers) */}
          {!canRate && editedTask.rating && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Your Rating
              </h3>
              <StarRating value={editedTask.rating.score} disabled size="sm" />
              {editedTask.rating.feedback && (
                <p className="mt-2 text-sm text-gray-600 italic">"{editedTask.rating.feedback}"</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            Created: {task.createdAt}
            {task.completedAt && ` • Completed: ${task.completedAt}`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskDetails;
