// ============================================================================
// IMS 2.0 - Clinical / Eye Tests Page
// ============================================================================
// Comprehensive clinical module with queue, eye tests, history, and print

import { useState, useRef } from 'react';
import {
  Eye,
  User,
  Clock,
  CheckCircle,
  Play,
  Plus,
  Search,
  FileText,
  Calendar,
  Phone,
  ChevronRight,
  History,
  Printer,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { EyeTestForm } from '../../components/clinical/EyeTestForm';
import { PrescriptionHistory } from '../../components/clinical/PrescriptionHistory';
import { PrescriptionPrint } from '../../components/clinical/PrescriptionPrint';

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
  rightEye: { sphere: number | null; cylinder: number | null; axis: number | null };
  leftEye: { sphere: number | null; cylinder: number | null; axis: number | null };
  optometristName: string;
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

// Mock data
const mockQueue: QueueItem[] = [
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
  {
    id: 'q-003',
    tokenNumber: 'T-003',
    patientName: 'Arjun Mehta',
    customerId: 'cust-003',
    customerPhone: '9123456789',
    age: 45,
    reason: 'Progressive Lenses',
    status: 'WAITING',
    waitTime: 8,
    createdAt: '2025-01-21T10:22:00Z',
    hasPreviousRx: true,
  },
  {
    id: 'q-004',
    tokenNumber: 'T-004',
    patientName: 'Sunita Das',
    customerId: 'cust-004',
    customerPhone: '9876512345',
    age: 52,
    reason: 'Contact Lens Fitting',
    status: 'WAITING',
    waitTime: 3,
    createdAt: '2025-01-21T10:27:00Z',
    hasPreviousRx: false,
  },
];

const mockCompletedToday: CompletedTest[] = [
  {
    id: 'rx-t001',
    patientName: 'Amit Singh',
    customerId: 'cust-005',
    customerPhone: '9876500001',
    completedAt: '2025-01-21T09:45:00Z',
    rightEye: { sphere: -1.50, cylinder: -0.50, axis: 90 },
    leftEye: { sphere: -1.75, cylinder: -0.25, axis: 85 },
    optometristName: 'Dr. Sharma',
  },
  {
    id: 'rx-t002',
    patientName: 'Neha Gupta',
    customerId: 'cust-006',
    customerPhone: '9876500002',
    completedAt: '2025-01-21T09:15:00Z',
    rightEye: { sphere: 0.50, cylinder: null, axis: null },
    leftEye: { sphere: 0.75, cylinder: -0.25, axis: 180 },
    optometristName: 'Dr. Sharma',
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
  {
    id: 'rx-hist-002',
    testDate: '2023-03-20',
    expiryDate: '2024-03-20',
    optometristName: 'Dr. Patel',
    source: 'TESTED_AT_STORE',
    rightEye: { sphere: '-1.00', cylinder: '-0.50', axis: '90', add: '', pd: '31', prism: '', base: '', acuity: '6/9' },
    leftEye: { sphere: '-1.25', cylinder: '-0.25', axis: '85', add: '', pd: '31', prism: '', base: '', acuity: '6/9' },
    lensRecommendation: 'Single Vision',
    coatingRecommendation: 'UV Protection',
    validityMonths: 12,
    remarks: '',
    isExpired: true,
  },
];

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', class: 'bg-yellow-100 text-yellow-600' },
  IN_PROGRESS: { label: 'In Progress', class: 'bg-blue-100 text-blue-600' },
  COMPLETED: { label: 'Completed', class: 'bg-green-100 text-green-600' },
};

export function ClinicalPage() {
  const [activeTab, setActiveTab] = useState<'queue' | 'completed'>('queue');
  const [showTestModal, setShowTestModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<QueueItem | null>(null);
  const [selectedTest, setSelectedTest] = useState<CompletedTest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const printRef = useRef<HTMLDivElement>(null);

  const waitingCount = mockQueue.filter(q => q.status === 'WAITING').length;
  const inProgressCount = mockQueue.filter(q => q.status === 'IN_PROGRESS').length;
  const completedCount = mockCompletedToday.length;

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

  const handleStartTest = (patient: QueueItem) => {
    setSelectedPatient(patient);
    setShowTestModal(true);
  };

  const handleViewHistory = (patient: QueueItem) => {
    setSelectedPatient(patient);
    setShowHistoryModal(true);
  };

  const handleSavePrescription = (data: any) => {
    console.log('Saving prescription:', data);
    setShowTestModal(false);
    setSelectedPatient(null);
    // In production, would call API and refresh data
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
  };

  const handleCopyPrescription = (rx: PrescriptionRecord) => {
    console.log('Copying prescription values:', rx);
    setShowHistoryModal(false);
    // Would pre-fill the test form with these values
    setShowTestModal(true);
  };

  // Filter queue by search
  const filteredQueue = mockQueue.filter(item =>
    item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.customerPhone.includes(searchQuery) ||
    item.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eye Tests</h1>
          <p className="text-gray-500">Manage patient queue and eye examinations</p>
        </div>
        <button
          onClick={() => {
            setSelectedPatient(null);
            setShowTestModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Patient
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
          {filteredQueue.length === 0 ? (
            <div className="card text-center py-12 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No patients in queue</p>
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
                          <span>Age: {item.age}</span>
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
          {mockCompletedToday.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No tests completed today</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {mockCompletedToday.map(test => (
                <div key={test.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{test.patientName}</p>
                        <p className="text-sm text-gray-500">
                          Completed at {formatTime(test.completedAt)} • by {test.optometristName}
                        </p>
                      </div>
                    </div>

                    {/* Quick Rx Preview */}
                    <div className="flex items-center gap-6">
                      <div className="text-sm">
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
                        <button className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors">
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

      {/* Eye Test Form Modal */}
      {showTestModal && (
        <EyeTestForm
          patientName={selectedPatient?.patientName || 'New Patient'}
          patientId={selectedPatient?.customerId || ''}
          onSave={handleSavePrescription}
          onClose={() => {
            setShowTestModal(false);
            setSelectedPatient(null);
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
                    add: '',
                    pd: '31',
                    prism: '',
                    base: '',
                    acuity: '6/6',
                  }}
                  leftEye={{
                    sphere: selectedTest.leftEye.sphere?.toString() || '',
                    cylinder: selectedTest.leftEye.cylinder?.toString() || '',
                    axis: selectedTest.leftEye.axis?.toString() || '',
                    add: '',
                    pd: '31',
                    prism: '',
                    base: '',
                    acuity: '6/6',
                  }}
                  totalPD="62"
                  lensRecommendation="Single Vision"
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
