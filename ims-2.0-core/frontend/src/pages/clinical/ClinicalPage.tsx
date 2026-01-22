// ============================================================================
// IMS 2.0 - Clinical / Eye Tests Page
// ============================================================================
// NO MOCK DATA - All data from API

import { useState, useEffect } from 'react';
import {
  Eye,
  User,
  Clock,
  CheckCircle,
  Play,
  Plus,
  FileText,
  Phone,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
  Search,
  UserPlus,
} from 'lucide-react';
import { clinicalApi, customerApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import type { Customer, Patient } from '../../types';
import clsx from 'clsx';

// ============================================================================
// Add to Queue Modal Component
// ============================================================================
interface AddToQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
}

function AddToQueueModal({ isOpen, onClose, onSuccess, storeId }: AddToQueueModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [reason, setReason] = useState('Eye Test');

  const COMMON_REASONS = [
    'Eye Test',
    'Prescription Check',
    'Contact Lens Fitting',
    'Follow-up',
    'Complaint',
    'Other',
  ];

  const handleSearch = async () => {
    if (searchQuery.length < 3) return;

    setIsSearching(true);
    try {
      const response = await customerApi.getCustomers({ search: searchQuery });
      const customers = response?.customers || response || [];
      setSearchResults(Array.isArray(customers) ? customers : []);
    } catch (err) {
      console.error('Failed to search customers:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Auto-select first patient if exists
    if (customer.patients?.length > 0) {
      setSelectedPatient(customer.patients[0]);
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }

    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }

    setIsSubmitting(true);
    try {
      await clinicalApi.addToQueue({
        storeId: storeId,
        customerId: selectedCustomer.id,
        patientName: selectedPatient.name,
        customerPhone: selectedCustomer.phone,
        reason: reason,
      });
      toast.success(`${selectedPatient.name} added to queue`);
      onSuccess();
      onClose();
      // Reset form
      setSelectedCustomer(null);
      setSelectedPatient(null);
      setReason('Eye Test');
    } catch (err) {
      console.error('Failed to add to queue:', err);
      toast.error('Failed to add patient to queue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Patient to Queue</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Customer Search */}
          {!selectedCustomer ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  className="input-field pl-10"
                  placeholder="Search by name or phone..."
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={searchQuery.length < 3 || isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary py-1 px-3 text-sm"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map(customer => (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => handleSelectCustomer(customer)}
                      className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-bv-red-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-bv-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Selected Customer */
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bv-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-bv-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setSelectedPatient(null); }}
                  className="text-sm text-bv-red-600 hover:underline"
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Patient Selection */}
          {selectedCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Patient <span className="text-red-500">*</span>
              </label>
              {selectedCustomer.patients && selectedCustomer.patients.length > 0 ? (
                <div className="space-y-2">
                  {selectedCustomer.patients.map(patient => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => setSelectedPatient(patient)}
                      className={clsx(
                        'w-full p-3 text-left rounded-lg border-2 transition-colors',
                        selectedPatient?.id === patient.id
                          ? 'border-bv-red-600 bg-bv-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className={clsx(
                          'w-5 h-5',
                          selectedPatient?.id === patient.id ? 'text-bv-red-600' : 'text-gray-400'
                        )} />
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          {patient.relation && (
                            <p className="text-sm text-gray-500">{patient.relation}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 p-3 bg-yellow-50 rounded-lg">
                  No patients found for this customer. Please add a patient first.
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          {selectedPatient && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
              >
                {COMMON_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={isSubmitting || !selectedCustomer || !selectedPatient}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Types
interface QueueItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  customerPhone: string;
  age?: number;
  reason?: string;
  status: QueueStatus;
  waitTime: number;
  createdAt: string;
}

interface CompletedTest {
  id: string;
  patientName: string;
  customerPhone: string;
  completedAt: string;
  rightEye: { sphere: number | null; cylinder: number | null; axis: number | null };
  leftEye: { sphere: number | null; cylinder: number | null; axis: number | null };
}

type QueueStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';

const STATUS_CONFIG: Record<QueueStatus, { label: string; class: string }> = {
  WAITING: { label: 'Waiting', class: 'bg-yellow-100 text-yellow-600' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-100 text-blue-600' },
  COMPLETED: { label: 'Completed', class: 'bg-green-100 text-green-600' },
};

export function ClinicalPage() {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  // Data state
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<'queue' | 'completed'>('queue');

  // Modal state
  const [showAddToQueueModal, setShowAddToQueueModal] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Role-based permissions
  const canStartTest = hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'OPTOMETRIST']);
  const canAddPatient = hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'OPTOMETRIST', 'SALES_CASHIER', 'SALES_STAFF']);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [user?.activeStoreId]);

  const loadData = async () => {
    if (!user?.activeStoreId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [queueData, testsData] = await Promise.all([
        clinicalApi.getQueue(user.activeStoreId).catch(() => ({ queue: [] })),
        clinicalApi.getTodayTests(user.activeStoreId).catch(() => ({ tests: [] })),
      ]);

      const queueItems = queueData?.queue || queueData || [];
      setQueue(Array.isArray(queueItems) ? queueItems : []);

      const tests = testsData?.tests || testsData || [];
      setCompletedTests(Array.isArray(tests) ? tests : []);
    } catch (err) {
      console.error('Failed to load clinical data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTest = async (queueId: string) => {
    setActionLoading(queueId);
    try {
      await clinicalApi.startTest(queueId);
      await loadData();
    } catch (err) {
      console.error('Failed to start test:', err);
      setError('Failed to start test.');
    } finally {
      setActionLoading(null);
    }
  };

  const waitingCount = queue.filter(q => q.status === 'WAITING').length;
  const inProgressCount = queue.filter(q => q.status === 'IN_PROGRESS').length;
  const completedCount = completedTests.length;

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPower = (value: number | null) => {
    if (value === null) return '-';
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eye Tests</h1>
          <p className="text-gray-500">Manage patient queue and eye examinations</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-outline flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
          {canAddPatient && (
            <button
              onClick={() => setShowAddToQueueModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Patient
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <p>{error}</p>
            <button onClick={loadData} className="ml-auto text-sm underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-2xl font-bold text-yellow-600">{waitingCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'queue'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <Clock className="w-4 h-4" />
          Queue ({waitingCount + inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={clsx(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          <CheckCircle className="w-4 h-4" />
          Completed Today ({completedCount})
        </button>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="card flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-bv-red-600" />
            </div>
          ) : queue.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No patients in queue</p>
            </div>
          ) : (
            queue.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status] || { label: item.status, class: 'bg-gray-100 text-gray-600' };
              const isActionLoading = actionLoading === item.id;
              return (
                <div
                  key={item.id}
                  className={clsx(
                    'card',
                    item.status === 'IN_PROGRESS' && 'border-blue-300 bg-blue-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Token Number */}
                      <div className={clsx(
                        'w-14 h-14 rounded-lg flex items-center justify-center font-bold text-lg',
                        item.status === 'IN_PROGRESS'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {item.tokenNumber}
                      </div>

                      {/* Patient Info */}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{item.patientName}</p>
                          <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.class)}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {item.customerPhone}
                          </span>
                          {item.age && <span>Age: {item.age}</span>}
                          {item.reason && <span>{item.reason}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Wait Time */}
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Wait Time</p>
                        <p className={clsx(
                          'font-medium',
                          item.waitTime > 10 ? 'text-red-600' : 'text-gray-600'
                        )}>
                          {item.waitTime} min
                        </p>
                      </div>

                      {/* Actions */}
                      {item.status === 'WAITING' && canStartTest && (
                        <button
                          onClick={() => handleStartTest(item.id)}
                          disabled={isActionLoading}
                          className="btn-primary flex items-center gap-2 disabled:opacity-50"
                        >
                          {isActionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Start Test
                        </button>
                      )}
                      {item.status === 'IN_PROGRESS' && canStartTest && (
                        <button
                          onClick={() => toast.info(`Continue eye test for ${item.patientName}`)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Continue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <div className="card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-bv-red-600" />
            </div>
          ) : completedTests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tests completed today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {completedTests.map(test => (
                <div key={test.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{test.patientName}</p>
                        <p className="text-sm text-gray-500">
                          Completed at {formatTime(test.completedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Rx Preview */}
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
                        <p className="text-gray-500">R: {formatPower(test.rightEye.sphere)} / {formatPower(test.rightEye.cylinder)}</p>
                        <p className="text-gray-500">L: {formatPower(test.leftEye.sphere)} / {formatPower(test.leftEye.cylinder)}</p>
                      </div>
                      <button
                        onClick={() => toast.info(`View prescription for ${test.patientName}`)}
                        className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors"
                      >
                        <FileText className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add to Queue Modal */}
      {user?.activeStoreId && (
        <AddToQueueModal
          isOpen={showAddToQueueModal}
          onClose={() => setShowAddToQueueModal(false)}
          onSuccess={loadData}
          storeId={user.activeStoreId}
        />
      )}
    </div>
  );
}

export default ClinicalPage;
