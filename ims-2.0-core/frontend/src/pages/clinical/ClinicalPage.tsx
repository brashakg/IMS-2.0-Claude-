// ============================================================================
// IMS 2.0 - Clinical / Eye Tests Page
// Full-featured clinical module with queue, eye tests, history, and print
// ============================================================================

import { useState, useRef, useMemo } from 'react';
import {
  Eye,
  User,
  Clock,
  CheckCircle,
  Play,
  Plus,
  Search,
  FileText,
  Phone,
  History,
  Printer,
  X,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { EyeTestForm } from '../../components/clinical/EyeTestForm';
import { PrescriptionHistory } from '../../components/clinical/PrescriptionHistory';
import { PrescriptionPrint } from '../../components/clinical/PrescriptionPrint';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';

// Types
interface QueueItem {
  id: string;
  tokenNumber: string;
  patientName: string;
  customerId: string;
  customerPhone: string;
  age: number;
  reason: string;
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  waitTime: number;
  createdAt: string;
  hasPreviousRx: boolean;
}

interface CompletedTest {
  id: string;
  patientName: string;
  customerId: string;
  customerPhone: string;
  completedAt: string;
  rightEye: { sphere: number | null; cylinder: number | null; axis: number | null; add?: number | null; pd?: number };
  leftEye: { sphere: number | null; cylinder: number | null; axis: number | null; add?: number | null; pd?: number };
  optometristName: string;
  recommendation?: string;
}

interface PrescriptionRecord {
  id: string;
  testDate: string;
  expiryDate: string;
  optometristName: string;
  source: 'TESTED_AT_STORE' | 'FROM_DOCTOR';
  doctorName?: string;
  rightEye: any;
  leftEye: any;
  lensRecommendation: string;
  coatingRecommendation: string;
  validityMonths: number;
  remarks: string;
  isExpired: boolean;
}

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', class: 'bg-yellow-100 text-yellow-600' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-100 text-blue-600' },
  COMPLETED: { label: 'Completed', class: 'bg-green-100 text-green-600' },
};

// Initial mock data
const initialQueue: QueueItem[] = [
  {
    id: 'q-001',
    tokenNumber: 'T-001',
    patientName: 'Rajesh Kumar',
    customerId: 'cust-001',
    customerPhone: '9876543210',
    age: 39,
    reason: 'New Glasses',
    status: 'WAITING',
    waitTime: 15,
    createdAt: '2025-01-21T10:00:00Z',
    hasPreviousRx: true,
  },
  {
    id: 'q-002',
    tokenNumber: 'T-002',
    patientName: 'Priya Sharma',
    customerId: 'cust-002',
    customerPhone: '9988776655',
    age: 28,
    reason: 'Eye Strain',
    status: 'IN_PROGRESS',
    waitTime: 5,
    createdAt: '2025-01-21T10:15:00Z',
    hasPreviousRx: false,
  },
];

const initialCompleted: CompletedTest[] = [
  {
    id: 'rx-t001',
    patientName: 'Amit Singh',
    customerId: 'cust-005',
    customerPhone: '9876500001',
    completedAt: '2025-01-21T09:45:00Z',
    rightEye: { sphere: -1.50, cylinder: -0.50, axis: 90, pd: 31 },
    leftEye: { sphere: -1.75, cylinder: -0.25, axis: 85, pd: 31 },
    optometristName: 'Dr. Sharma',
    recommendation: 'Single Vision with Anti-Reflective coating',
  },
];

const mockPreviousPrescriptions: PrescriptionRecord[] = [
  {
    id: 'rx-hist-001',
    testDate: '2024-06-15',
    expiryDate: '2025-06-15',
    optometristName: 'Dr. Sharma',
    source: 'TESTED_AT_STORE',
    rightEye: { sphere: '-1.25', cylinder: '-0.50', axis: '90', add: '', pd: '31', prism: '', base: '', acuity: '6/6' },
    leftEye: { sphere: '-1.50', cylinder: '-0.25', axis: '85', add: '', pd: '31', prism: '', base: '', acuity: '6/6' },
    lensRecommendation: 'Single Vision',
    coatingRecommendation: 'Anti-Reflective',
    validityMonths: 12,
    remarks: 'Recommend annual check-up',
    isExpired: false,
  },
];

export function ClinicalPage() {
  const { customers } = useMockData();
  const toast = useToast();

  // Queue and completed tests state
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [completedTests, setCompletedTests] = useState<CompletedTest[]>(initialCompleted);
  const [tokenCounter, setTokenCounter] = useState(3);

  const [activeTab, setActiveTab] = useState<'queue' | 'completed'>('queue');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null);
  const [selectedTest, setSelectedTest] = useState<CompletedTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPrescription, setCopiedPrescription] = useState<PrescriptionRecord | null>(null);

  // Add patient form
  const [newPatientForm, setNewPatientForm] = useState({
    customerId: '',
    patientName: '',
    phone: '',
    age: '',
    reason: 'New Glasses',
  });

  const printRef = useRef<HTMLDivElement>(null);

  // Stats
  const stats = useMemo(() => {
    const waitingCount = queue.filter(q => q.status === 'WAITING').length;
    const inProgressCount = queue.filter(q => q.status === 'IN_PROGRESS').length;
    const completedCount = completedTests.length;
    return { waitingCount, inProgressCount, completedCount };
  }, [queue, completedTests]);

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

  // Add patient to queue
  const handleAddPatientToQueue = () => {
    if (!newPatientForm.patientName || !newPatientForm.phone) {
      toast.error('Name and phone are required');
      return;
    }

    const tokenNum = String(tokenCounter).padStart(3, '0');
    const newItem: QueueItem = {
      id: `q-${Date.now()}`,
      tokenNumber: `T-${tokenNum}`,
      patientName: newPatientForm.patientName,
      customerId: newPatientForm.customerId || `temp-${Date.now()}`,
      customerPhone: newPatientForm.phone,
      age: parseInt(newPatientForm.age) || 0,
      reason: newPatientForm.reason,
      status: 'WAITING',
      waitTime: 0,
      createdAt: new Date().toISOString(),
      hasPreviousRx: false,
    };

    setQueue(prev => [...prev, newItem]);
    setTokenCounter(c => c + 1);
    setShowAddPatientModal(false);
    setNewPatientForm({ customerId: '', patientName: '', phone: '', age: '', reason: 'New Glasses' });
    toast.success(`Patient ${newItem.patientName} added to queue (${newItem.tokenNumber})`);
  };

  // Select existing customer
  const handleSelectCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setNewPatientForm(prev => ({
        ...prev,
        customerId: customer.id,
        patientName: customer.name,
        phone: customer.phone,
      }));
    }
  };

  const handleStartTest = (patient: QueueItem) => {
    // Mark as in progress
    setQueue(prev => prev.map(q =>
      q.id === patient.id ? { ...q, status: 'IN_PROGRESS' as const } : q
    ));
    setSelectedPatient(patient);
    setShowTestModal(true);
  };

  const handleViewHistory = (patient: QueueItem) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
  };

  const handleSavePrescription = (data: any) => {
    if (!selectedPatient) {
      toast.error('No patient selected');
      return;
    }

    // Create completed test record
    const completedTest: CompletedTest = {
      id: `rx-${Date.now()}`,
      patientName: selectedPatient.patientName,
      customerId: selectedPatient.customerId,
      customerPhone: selectedPatient.customerPhone,
      completedAt: new Date().toISOString(),
      rightEye: {
        sphere: parseFloat(data.rightEye?.sphere) || null,
        cylinder: parseFloat(data.rightEye?.cylinder) || null,
        axis: parseInt(data.rightEye?.axis) || null,
        add: parseFloat(data.rightEye?.add) || null,
        pd: parseFloat(data.rightEye?.pd) || 31,
      },
      leftEye: {
        sphere: parseFloat(data.leftEye?.sphere) || null,
        cylinder: parseFloat(data.leftEye?.cylinder) || null,
        axis: parseInt(data.leftEye?.axis) || null,
        add: parseFloat(data.leftEye?.add) || null,
        pd: parseFloat(data.leftEye?.pd) || 31,
      },
      optometristName: data.optometristName || 'Dr. Current User',
      recommendation: data.lensRecommendation,
    };

    // Add to completed tests
    setCompletedTests(prev => [completedTest, ...prev]);

    // Remove from queue
    setQueue(prev => prev.filter(q => q.id !== selectedPatient.id));

    setShowTestModal(false);
    setSelectedPatient(null);
    setCopiedPrescription(null);
    toast.success(`Eye test completed for ${selectedPatient.patientName}`);
  };

  const handleRemoveFromQueue = (patient: QueueItem) => {
    setQueue(prev => prev.filter(q => q.id !== patient.id));
    toast.info(`${patient.patientName} removed from queue`);
  };

  const handlePrintPrescription = (test: CompletedTest) => {
    setSelectedTest(test);
    setShowPrintPreview(true);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Prescription - ${selectedTest?.patientName}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
                table { width: 100%; border-collapse: collapse; }
                th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
                th { background: #f5f5f5; }
                .font-mono { font-family: monospace; }
                @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    toast.success('Print dialog opened');
  };

  const handleCopyPrescription = (rx: PrescriptionRecord) => {
    setCopiedPrescription(rx);
    setShowHistoryModal(false);
    toast.info('Previous prescription values will be pre-filled');
    setShowTestModal(true);
  };

  // Filter queue by search
  const filteredQueue = useMemo(() => {
    return queue.filter(item =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.customerPhone.includes(searchQuery) ||
      item.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [queue, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eye Tests</h1>
          <p className="text-gray-500">Manage patient queue and eye examinations</p>
        </div>
        <button
          onClick={() => setShowAddPatientModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add to Queue
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Waiting</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.waitingCount}</p>
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
              <p className="text-2xl font-bold text-blue-600">{stats.inProgressCount}</p>
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
              <p className="text-2xl font-bold text-green-600">{stats.completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, phone, or token..."
          className="input-field pl-10 w-full"
        />
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
          Queue ({stats.waitingCount + stats.inProgressCount})
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
          Completed Today ({stats.completedCount})
        </button>
      </div>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {filteredQueue.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No patients in queue</p>
              <button
                onClick={() => setShowAddPatientModal(true)}
                className="mt-4 btn-primary"
              >
                Add Patient
              </button>
            </div>
          ) : (
            filteredQueue.map((item) => {
              const statusConfig = STATUS_CONFIG[item.status];
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
                          {item.hasPreviousRx && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                              Has Rx History
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {item.customerPhone}
                          </span>
                          {item.age > 0 && <span>Age: {item.age}</span>}
                          <span>{item.reason}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
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

                      {/* History Button */}
                      {item.hasPreviousRx && (
                        <button
                          onClick={() => handleViewHistory(item)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View prescription history"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      )}

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFromQueue(item)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      {/* Actions */}
                      {item.status === 'WAITING' && (
                        <button
                          onClick={() => handleStartTest(item)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Test
                        </button>
                      )}
                      {item.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStartTest(item)}
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
          {completedTests.length === 0 ? (
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
                          Completed at {formatTime(test.completedAt)} by {test.optometristName}
                        </p>
                      </div>
                    </div>

                    {/* Quick Rx Preview */}
                    <div className="flex items-center gap-6">
                      <div className="text-sm font-mono">
                        <p className="text-gray-500">R: {formatPower(test.rightEye.sphere)} / {formatPower(test.rightEye.cylinder)}</p>
                        <p className="text-gray-500">L: {formatPower(test.leftEye.sphere)} / {formatPower(test.leftEye.cylinder)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintPrescription(test)}
                          className="p-2 text-bv-red-600 hover:bg-bv-red-50 rounded-lg transition-colors"
                          title="Print prescription"
                        >
                          <Printer className="w-5 h-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors"
                          title="View details"
                        >
                          <FileText className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Patient to Queue Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Add Patient to Queue</h3>
              <button onClick={() => setShowAddPatientModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Existing Customer (optional)</label>
                <select
                  value={newPatientForm.customerId}
                  onChange={e => handleSelectCustomer(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- New Patient --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={newPatientForm.patientName}
                  onChange={e => setNewPatientForm(prev => ({ ...prev, patientName: e.target.value }))}
                  className="input-field"
                  placeholder="Enter patient name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={newPatientForm.phone}
                  onChange={e => setNewPatientForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newPatientForm.age}
                    onChange={e => setNewPatientForm(prev => ({ ...prev, age: e.target.value }))}
                    className="input-field"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select
                    value={newPatientForm.reason}
                    onChange={e => setNewPatientForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="input-field"
                  >
                    <option value="New Glasses">New Glasses</option>
                    <option value="Eye Strain">Eye Strain</option>
                    <option value="Progressive Lenses">Progressive Lenses</option>
                    <option value="Contact Lens Fitting">Contact Lens Fitting</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="General Checkup">General Checkup</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAddPatientModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddPatientToQueue} className="btn-primary">Add to Queue</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Eye Test Form Modal */}
      {showTestModal && (
        <EyeTestForm
          patientName={selectedPatient?.patientName || 'New Patient'}
          patientId={selectedPatient?.customerId || ''}
          onSave={handleSavePrescription}
          onClose={() => {
            setShowTestModal(false);
            setSelectedPatient(null);
            setCopiedPrescription(null);
          }}
        />
      )}

      {/* Prescription History Modal */}
      {showHistoryModal && selectedPatient && (
        <PrescriptionHistory
          customerId={selectedPatient.customerId}
          customerName={selectedPatient.patientName}
          prescriptions={mockPreviousPrescriptions}
          onCopyPrescription={handleCopyPrescription}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedPatient(null);
          }}
        />
      )}

      {/* Print Preview Modal */}
      {showPrintPreview && selectedTest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Print Preview</h2>
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  setSelectedTest(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <div ref={printRef}>
                <PrescriptionPrint
                  storeName="Better Vision"
                  storeAddress="Vijay Nagar, Indore, MP 452010"
                  storePhone="+91 731 4012345"
                  storeGSTIN="23AABCU9603R1ZM"
                  patientName={selectedTest.patientName}
                  patientPhone={selectedTest.customerPhone}
                  prescriptionId={selectedTest.id}
                  testDate={selectedTest.completedAt}
                  expiryDate={new Date(new Date(selectedTest.completedAt).setFullYear(new Date(selectedTest.completedAt).getFullYear() + 1)).toISOString()}
                  optometristName={selectedTest.optometristName}
                  optometristRegNo="MP/OPT/2020/1234"
                  rightEye={{
                    sphere: selectedTest.rightEye.sphere?.toString() || '',
                    cylinder: selectedTest.rightEye.cylinder?.toString() || '',
                    axis: selectedTest.rightEye.axis?.toString() || '',
                    add: selectedTest.rightEye.add?.toString() || '',
                    pd: selectedTest.rightEye.pd?.toString() || '31',
                    prism: '',
                    base: '',
                    acuity: '6/6',
                  }}
                  leftEye={{
                    sphere: selectedTest.leftEye.sphere?.toString() || '',
                    cylinder: selectedTest.leftEye.cylinder?.toString() || '',
                    axis: selectedTest.leftEye.axis?.toString() || '',
                    add: selectedTest.leftEye.add?.toString() || '',
                    pd: selectedTest.leftEye.pd?.toString() || '31',
                    prism: '',
                    base: '',
                    acuity: '6/6',
                  }}
                  totalPD="62"
                  lensRecommendation={selectedTest.recommendation || 'Single Vision'}
                  coatingRecommendation="Anti-Reflective"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowPrintPreview(false);
                  setSelectedTest(null);
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={handlePrint}
                className="btn-primary flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClinicalPage;
