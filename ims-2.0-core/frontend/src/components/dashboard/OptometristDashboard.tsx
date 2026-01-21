// ============================================================================
// IMS 2.0 - Optometrist Dashboard
// ============================================================================
// Shows eye tests today, appointments, clinical tasks, prescriptions

import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Clock,
  Users,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskSummary } from './TaskSummary';
import { TaskPriority } from '../../types';
import clsx from 'clsx';

// Appointment type
interface Appointment {
  id: string;
  time: string;
  customerName: string;
  phone: string;
  type: 'EYE_TEST' | 'FOLLOW_UP' | 'CONTACT_LENS_FITTING' | 'CONSULTATION';
  status: 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
}

// Recent Prescription
interface RecentPrescription {
  id: string;
  customerName: string;
  date: string;
  rightSph: string;
  leftSph: string;
  type: 'SPECTACLE' | 'CONTACT_LENS';
}

// Appointment List Component
function AppointmentList({ appointments, onSelect }: { appointments: Appointment[]; onSelect: (apt: Appointment) => void }) {
  const typeLabels = {
    EYE_TEST: 'Eye Test',
    FOLLOW_UP: 'Follow-up',
    CONTACT_LENS_FITTING: 'CL Fitting',
    CONSULTATION: 'Consultation',
  };

  const statusStyles = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-yellow-100 text-yellow-700',
    IN_PROGRESS: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    NO_SHOW: 'bg-gray-100 text-gray-500',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Today's Appointments</h2>
        <span className="text-sm text-gray-500">
          {appointments.filter(a => a.status === 'COMPLETED').length}/{appointments.length} done
        </span>
      </div>
      <div className="space-y-2">
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No appointments today</p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              onClick={() => onSelect(apt)}
              className={clsx(
                'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:shadow-sm',
                apt.status === 'IN_PROGRESS' && 'border-purple-300 bg-purple-50',
                apt.status === 'CHECKED_IN' && 'border-yellow-300 bg-yellow-50',
                apt.status !== 'IN_PROGRESS' && apt.status !== 'CHECKED_IN' && 'border-gray-200'
              )}
            >
              <div className="w-16 text-center">
                <p className="text-sm font-bold text-gray-900">{apt.time}</p>
                <span className={clsx('text-xs px-1.5 py-0.5 rounded', statusStyles[apt.status])}>
                  {apt.status === 'CHECKED_IN' ? 'Ready' : apt.status === 'IN_PROGRESS' ? 'Now' : apt.status.toLowerCase().replace('_', ' ')}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{apt.customerName}</p>
                <p className="text-sm text-gray-500">{typeLabels[apt.type]}</p>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Recent Prescriptions Component
function RecentPrescriptions({ prescriptions }: { prescriptions: RecentPrescription[] }) {
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 mb-4">Recent Prescriptions</h2>
      <div className="space-y-3">
        {prescriptions.map((rx) => (
          <div key={rx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
            <div>
              <p className="font-medium text-gray-900">{rx.customerName}</p>
              <p className="text-xs text-gray-500">{rx.date} • {rx.type === 'SPECTACLE' ? 'Spectacle Rx' : 'Contact Lens Rx'}</p>
            </div>
            <div className="text-right text-sm">
              <p className="text-gray-600">R: {rx.rightSph} | L: {rx.leftSph}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OptometristDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data
  const stats = {
    todayTests: 8,
    completedTests: 5,
    pendingTests: 3,
    avgTestTime: 25, // minutes
    prescriptionsGiven: 5,
    followUpsScheduled: 2,
  };

  const appointments: Appointment[] = [
    { id: '1', time: '10:00', customerName: 'Rajesh Kumar', phone: '9876543210', type: 'EYE_TEST', status: 'COMPLETED' },
    { id: '2', time: '10:30', customerName: 'Priya Sharma', phone: '9876543211', type: 'EYE_TEST', status: 'COMPLETED' },
    { id: '3', time: '11:00', customerName: 'Amit Patel', phone: '9876543212', type: 'CONTACT_LENS_FITTING', status: 'COMPLETED' },
    { id: '4', time: '11:30', customerName: 'Sneha Gupta', phone: '9876543213', type: 'FOLLOW_UP', status: 'COMPLETED' },
    { id: '5', time: '12:00', customerName: 'Vikram Singh', phone: '9876543214', type: 'EYE_TEST', status: 'COMPLETED' },
    { id: '6', time: '02:00', customerName: 'Meera Joshi', phone: '9876543215', type: 'EYE_TEST', status: 'IN_PROGRESS' },
    { id: '7', time: '02:30', customerName: 'Karan Malhotra', phone: '9876543216', type: 'CONSULTATION', status: 'CHECKED_IN' },
    { id: '8', time: '03:00', customerName: 'Deepa Verma', phone: '9876543217', type: 'EYE_TEST', status: 'SCHEDULED' },
  ];

  const recentPrescriptions: RecentPrescription[] = [
    { id: '1', customerName: 'Rajesh Kumar', date: 'Today', rightSph: '-2.25', leftSph: '-2.50', type: 'SPECTACLE' },
    { id: '2', customerName: 'Priya Sharma', date: 'Today', rightSph: '-1.00', leftSph: '-0.75', type: 'SPECTACLE' },
    { id: '3', customerName: 'Amit Patel', date: 'Today', rightSph: '-3.50', leftSph: '-3.25', type: 'CONTACT_LENS' },
  ];

  const tasks = [
    { id: '1', title: 'Complete pending test for Meera Joshi', priority: 'P1' as TaskPriority, dueTime: 'Now', type: 'MANUAL' as const, status: 'IN_PROGRESS' as const },
    { id: '2', title: 'Review contact lens order for Amit Patel', priority: 'P2' as TaskPriority, dueTime: '3:00 PM', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '3', title: 'Update clinical records', priority: 'P3' as TaskPriority, dueTime: 'EOD', type: 'SOP' as const, status: 'PENDING' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, Dr. {user?.name?.split(' ').slice(-1)[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your clinical schedule for today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Today's Tests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTests}/{stats.todayTests}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pendingTests} remaining</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Test Time</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.avgTestTime} min</p>
              <p className="text-xs text-green-600 mt-1">On track</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Prescriptions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.prescriptionsGiven}</p>
              <p className="text-xs text-gray-500 mt-1">Given today</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.followUpsScheduled}</p>
              <p className="text-xs text-gray-500 mt-1">Scheduled</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Appointments */}
        <AppointmentList
          appointments={appointments}
          onSelect={(apt) => navigate(`/clinical?appointment=${apt.id}`)}
        />

        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />
      </div>

      {/* Recent Prescriptions */}
      <RecentPrescriptions prescriptions={recentPrescriptions} />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-4 gap-3">
          <QuickAction label="New Eye Test" icon={Eye} onClick={() => navigate('/clinical')} />
          <QuickAction label="Patients" icon={Users} onClick={() => navigate('/customers')} />
          <QuickAction label="Prescriptions" icon={FileText} onClick={() => navigate('/clinical')} />
          <QuickAction label="Schedule" icon={Calendar} onClick={() => navigate('/clinical')} />
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

export default OptometristDashboard;
