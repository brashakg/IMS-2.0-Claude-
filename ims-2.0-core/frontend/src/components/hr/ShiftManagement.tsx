// ============================================================================
// IMS 2.0 - Shift Management Component
// ============================================================================
// Shift scheduling, roster management, and employee shift assignments

import { useState } from 'react';
import {
  Calendar,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Sun,
  Moon,
  Sunrise,
  X,
  Save,
  UserPlus,
} from 'lucide-react';
import clsx from 'clsx';

// Shift Types
interface ShiftTemplate {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // minutes
  color: string;
  icon: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface ShiftAssignment {
  id: string;
  employeeId: string;
  shiftId: string;
  date: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'ABSENT' | 'LEAVE';
  notes?: string;
}

interface DaySchedule {
  date: Date;
  assignments: (ShiftAssignment & { employee: Employee; shift: ShiftTemplate })[];
}

// Default shift templates
const defaultShiftTemplates: ShiftTemplate[] = [
  { id: 's1', name: 'Morning Shift', code: 'MS', startTime: '09:00', endTime: '17:00', breakDuration: 60, color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: 'morning' },
  { id: 's2', name: 'Afternoon Shift', code: 'AS', startTime: '13:00', endTime: '21:00', breakDuration: 60, color: 'bg-orange-100 text-orange-700 border-orange-300', icon: 'afternoon' },
  { id: 's3', name: 'Evening Shift', code: 'ES', startTime: '16:00', endTime: '00:00', breakDuration: 45, color: 'bg-purple-100 text-purple-700 border-purple-300', icon: 'evening' },
  { id: 's4', name: 'Split Shift', code: 'SP', startTime: '10:00', endTime: '14:00', breakDuration: 0, color: 'bg-blue-100 text-blue-700 border-blue-300', icon: 'morning' },
  { id: 's5', name: 'Weekend Special', code: 'WS', startTime: '10:00', endTime: '20:00', breakDuration: 90, color: 'bg-green-100 text-green-700 border-green-300', icon: 'morning' },
];

// Mock employees
const mockEmployees: Employee[] = [
  { id: 'e1', name: 'Rajesh Kumar', role: 'Store Manager' },
  { id: 'e2', name: 'Priya Sharma', role: 'Sales Staff' },
  { id: 'e3', name: 'Amit Patel', role: 'Optometrist' },
  { id: 'e4', name: 'Sneha Gupta', role: 'Sales Staff' },
  { id: 'e5', name: 'Vikram Singh', role: 'Cashier' },
  { id: 'e6', name: 'Meera Joshi', role: 'Sales Staff' },
];

// Shift Icon Component
function ShiftIcon({ type }: { type: ShiftTemplate['icon'] }) {
  switch (type) {
    case 'morning':
      return <Sunrise className="w-3 h-3" />;
    case 'afternoon':
      return <Sun className="w-3 h-3" />;
    case 'evening':
    case 'night':
      return <Moon className="w-3 h-3" />;
  }
}

// Shift Template Card
function ShiftTemplateCard({
  shift,
  selected,
  onClick
}: {
  shift: ShiftTemplate;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-all',
        shift.color,
        selected && 'ring-2 ring-offset-2 ring-bv-red-500'
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <ShiftIcon type={shift.icon} />
        <span className="font-medium text-sm">{shift.name}</span>
        <span className="text-xs opacity-75">({shift.code})</span>
      </div>
      <div className="flex items-center gap-1 text-xs opacity-75">
        <Clock className="w-3 h-3" />
        {shift.startTime} - {shift.endTime}
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  weekStart,
  employees,
  assignments,
  shifts,
  onAssign,
  onRemove,
}: {
  weekStart: Date;
  employees: Employee[];
  assignments: ShiftAssignment[];
  shifts: ShiftTemplate[];
  onAssign: (employeeId: string, date: string, shiftId: string) => void;
  onRemove: (assignmentId: string) => void;
}) {
  const [selectedCell, setSelectedCell] = useState<{ employeeId: string; date: string } | null>(null);
  const [selectedShift, setSelectedShift] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'short' });
  const formatDayNumber = (date: Date) => date.getDate();
  const isToday = (date: Date) => formatDate(date) === formatDate(new Date());
  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const getAssignment = (employeeId: string, date: string) => {
    return assignments.find(a => a.employeeId === employeeId && a.date === date);
  };

  const handleCellClick = (employeeId: string, date: string) => {
    const existing = getAssignment(employeeId, date);
    if (existing) {
      onRemove(existing.id);
    } else {
      setSelectedCell({ employeeId, date });
    }
  };

  const handleShiftSelect = (shiftId: string) => {
    if (selectedCell) {
      onAssign(selectedCell.employeeId, selectedCell.date, shiftId);
      setSelectedCell(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] border-collapse">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white z-10 p-3 text-left border-b border-r w-48">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-700">Employee</span>
              </div>
            </th>
            {days.map((day) => (
              <th
                key={formatDate(day)}
                className={clsx(
                  'p-3 text-center border-b min-w-[100px]',
                  isToday(day) && 'bg-bv-red-50',
                  isWeekend(day) && 'bg-gray-50'
                )}
              >
                <div className={clsx(
                  'text-xs uppercase',
                  isToday(day) ? 'text-bv-red-600' : 'text-gray-500'
                )}>
                  {formatDayName(day)}
                </div>
                <div className={clsx(
                  'text-lg font-bold',
                  isToday(day) ? 'text-bv-red-600' : 'text-gray-900'
                )}>
                  {formatDayNumber(day)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50">
              <td className="sticky left-0 bg-white z-10 p-3 border-b border-r">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-bv-red-100 flex items-center justify-center text-bv-red-600 font-medium text-sm">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.role}</p>
                  </div>
                </div>
              </td>
              {days.map((day) => {
                const dateStr = formatDate(day);
                const assignment = getAssignment(employee.id, dateStr);
                const shift = assignment ? shifts.find(s => s.id === assignment.shiftId) : null;
                const isSelected = selectedCell?.employeeId === employee.id && selectedCell?.date === dateStr;

                return (
                  <td
                    key={dateStr}
                    className={clsx(
                      'p-1 border-b text-center cursor-pointer transition-colors',
                      isToday(day) && 'bg-bv-red-50/50',
                      isWeekend(day) && !isToday(day) && 'bg-gray-50/50',
                      isSelected && 'bg-blue-100'
                    )}
                    onClick={() => handleCellClick(employee.id, dateStr)}
                  >
                    {assignment && shift ? (
                      <div className={clsx(
                        'p-2 rounded-lg text-xs',
                        shift.color,
                        'border'
                      )}>
                        <div className="flex items-center justify-center gap-1 font-medium">
                          <ShiftIcon type={shift.icon} />
                          {shift.code}
                        </div>
                        <div className="text-[10px] opacity-75">
                          {shift.startTime}
                        </div>
                        {assignment.status === 'LEAVE' && (
                          <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1 rounded mt-1 inline-block">
                            Leave
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="p-2 text-gray-300 hover:text-gray-400">
                        <Plus className="w-4 h-4 mx-auto" />
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Shift Selection Popup */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedCell(null)}>
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-md w-full m-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Select Shift</h3>
              <button onClick={() => setSelectedCell(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {shifts.map((shift) => (
                <ShiftTemplateCard
                  key={shift.id}
                  shift={shift}
                  onClick={() => handleShiftSelect(shift.id)}
                />
              ))}
            </div>
            <button
              onClick={() => setSelectedCell(null)}
              className="mt-4 w-full py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Shift Management Component
export function ShiftManagement() {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  });

  const [shifts] = useState<ShiftTemplate[]>(defaultShiftTemplates);
  const [employees] = useState<Employee[]>(mockEmployees);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([
    // Sample assignments
    { id: 'a1', employeeId: 'e1', shiftId: 's1', date: formatDateStr(0), status: 'SCHEDULED' },
    { id: 'a2', employeeId: 'e1', shiftId: 's1', date: formatDateStr(1), status: 'SCHEDULED' },
    { id: 'a3', employeeId: 'e1', shiftId: 's1', date: formatDateStr(2), status: 'SCHEDULED' },
    { id: 'a4', employeeId: 'e2', shiftId: 's2', date: formatDateStr(0), status: 'SCHEDULED' },
    { id: 'a5', employeeId: 'e2', shiftId: 's2', date: formatDateStr(1), status: 'SCHEDULED' },
    { id: 'a6', employeeId: 'e3', shiftId: 's1', date: formatDateStr(0), status: 'SCHEDULED' },
    { id: 'a7', employeeId: 'e3', shiftId: 's1', date: formatDateStr(2), status: 'SCHEDULED' },
    { id: 'a8', employeeId: 'e3', shiftId: 's1', date: formatDateStr(4), status: 'LEAVE' },
    { id: 'a9', employeeId: 'e4', shiftId: 's1', date: formatDateStr(0), status: 'SCHEDULED' },
    { id: 'a10', employeeId: 'e4', shiftId: 's3', date: formatDateStr(3), status: 'SCHEDULED' },
    { id: 'a11', employeeId: 'e5', shiftId: 's2', date: formatDateStr(1), status: 'SCHEDULED' },
    { id: 'a12', employeeId: 'e5', shiftId: 's2', date: formatDateStr(2), status: 'SCHEDULED' },
    { id: 'a13', employeeId: 'e6', shiftId: 's5', date: formatDateStr(5), status: 'SCHEDULED' },
    { id: 'a14', employeeId: 'e6', shiftId: 's5', date: formatDateStr(6), status: 'SCHEDULED' },
  ]);

  const [showTemplates, setShowTemplates] = useState(false);

  function formatDateStr(daysFromWeekStart: number): string {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) + daysFromWeekStart;
    date.setDate(diff);
    return date.toISOString().split('T')[0];
  }

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(newDate);
  };

  const handleAssign = (employeeId: string, date: string, shiftId: string) => {
    const newAssignment: ShiftAssignment = {
      id: `a${Date.now()}`,
      employeeId,
      shiftId,
      date,
      status: 'SCHEDULED',
    };
    setAssignments([...assignments, newAssignment]);
  };

  const handleRemove = (assignmentId: string) => {
    setAssignments(assignments.filter(a => a.id !== assignmentId));
  };

  const getWeekLabel = () => {
    const endOfWeek = new Date(currentWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    const startMonth = currentWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = currentWeek.getDate();
    const endDay = endOfWeek.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} - ${endDay}, ${currentWeek.getFullYear()}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${currentWeek.getFullYear()}`;
  };

  // Stats
  const totalShifts = assignments.filter(a => {
    const d = new Date(a.date);
    return d >= currentWeek && d < new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  }).length;

  const leaveCount = assignments.filter(a => {
    const d = new Date(a.date);
    return d >= currentWeek && d < new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000) && a.status === 'LEAVE';
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-500 mt-1">Schedule and manage employee shifts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clock className="w-4 h-4" />
            Shift Templates
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors">
            <Copy className="w-4 h-4" />
            Copy Previous Week
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Employees</p>
              <p className="text-xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Shifts</p>
              <p className="text-xl font-bold text-gray-900">{totalShifts}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">On Leave</p>
              <p className="text-xl font-bold text-gray-900">{leaveCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Shift Types</p>
              <p className="text-xl font-bold text-gray-900">{shifts.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">{getWeekLabel()}</h2>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              const day = today.getDay();
              const diff = today.getDate() - day + (day === 0 ? -6 : 1);
              setCurrentWeek(new Date(today.setDate(diff)));
            }}
            className="text-sm text-bv-red-600 hover:text-bv-red-700 font-medium"
          >
            Today
          </button>
        </div>

        {/* Week View */}
        <WeekView
          weekStart={currentWeek}
          employees={employees}
          assignments={assignments}
          shifts={shifts}
          onAssign={handleAssign}
          onRemove={handleRemove}
        />

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium text-gray-700 mb-2">Shift Types:</p>
          <div className="flex flex-wrap gap-2">
            {shifts.map((shift) => (
              <div
                key={shift.id}
                className={clsx(
                  'flex items-center gap-1.5 px-2 py-1 rounded text-xs border',
                  shift.color
                )}
              >
                <ShiftIcon type={shift.icon} />
                <span>{shift.code}</span>
                <span className="opacity-75">({shift.startTime}-{shift.endTime})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Shift Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Shift Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                {shifts.map((shift) => (
                  <div
                    key={shift.id}
                    className={clsx(
                      'p-4 rounded-lg border',
                      shift.color
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ShiftIcon type={shift.icon} />
                        <div>
                          <h3 className="font-semibold">{shift.name}</h3>
                          <p className="text-sm opacity-75">Code: {shift.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-white/50 rounded-lg">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-white/50 rounded-lg text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shift.startTime} - {shift.endTime}
                      </span>
                      <span>Break: {shift.breakDuration} min</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-bv-red-300 hover:text-bv-red-600 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add New Shift Template
              </button>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowTemplates(false)}
                className="w-full py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShiftManagement;
