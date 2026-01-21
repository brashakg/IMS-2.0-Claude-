// ============================================================================
// IMS 2.0 - Customers Page
// ============================================================================

import { useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Users,
  Phone,
  Mail,
  MapPin,
  Eye,
  FileText,
  ChevronRight,
  X,
  User,
  Calendar,
  Edit2,
  Building2,
} from 'lucide-react';
import type { Customer, Patient, Prescription, ProductCategory } from '../../types';
import clsx from 'clsx';

// Mock customers data
const mockCustomers: Customer[] = [
  {
    id: 'cust-001',
    name: 'Rajesh Kumar',
    phone: '9876543210',
    email: 'rajesh.kumar@email.com',
    customerType: 'B2C',
    address: '123 Park Street',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700016',
    patients: [
      { id: 'pat-001', customerId: 'cust-001', name: 'Rajesh Kumar', relation: 'Self', dateOfBirth: '1985-06-15' },
      { id: 'pat-002', customerId: 'cust-001', name: 'Priya Kumar', relation: 'Wife', dateOfBirth: '1988-03-22' },
      { id: 'pat-003', customerId: 'cust-001', name: 'Aryan Kumar', relation: 'Son', dateOfBirth: '2012-09-10' },
    ],
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'cust-002',
    name: 'Sunita Sharma',
    phone: '9988776655',
    email: 'sunita.sharma@email.com',
    customerType: 'B2C',
    address: '45 Salt Lake, Sector V',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    patients: [
      { id: 'pat-004', customerId: 'cust-002', name: 'Sunita Sharma', relation: 'Self', dateOfBirth: '1975-11-20' },
    ],
    createdAt: '2024-02-20T14:15:00Z',
  },
  {
    id: 'cust-003',
    name: 'ABC Enterprises',
    phone: '9123456789',
    email: 'purchase@abcent.com',
    customerType: 'B2B',
    gstNumber: '19ABCDE1234F1Z5',
    address: '100 Industrial Area',
    city: 'Howrah',
    state: 'West Bengal',
    pincode: '711101',
    patients: [],
    createdAt: '2024-03-10T09:00:00Z',
  },
];

// Mock prescriptions
const mockPrescriptions: Record<string, Prescription[]> = {
  'pat-001': [
    {
      id: 'rx-001',
      patientId: 'pat-001',
      customerId: 'cust-001',
      storeId: 'BV-KOL-001',
      optometristName: 'Dr. Sharma',
      testDate: '2025-01-15',
      rightEye: { sphere: -2.25, cylinder: -0.75, axis: 180, add: null, pd: 32, va: '6/6' },
      leftEye: { sphere: -2.50, cylinder: -0.50, axis: 175, add: null, pd: 31, va: '6/6' },
      recommendation: 'Anti-fatigue lenses recommended',
      status: 'COMPLETED',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    },
  ],
  'pat-002': [
    {
      id: 'rx-002',
      patientId: 'pat-002',
      customerId: 'cust-001',
      storeId: 'BV-KOL-001',
      optometristName: 'Dr. Sharma',
      testDate: '2025-01-15',
      rightEye: { sphere: -1.00, cylinder: -0.25, axis: 90, add: null, pd: 30, va: '6/6' },
      leftEye: { sphere: -1.25, cylinder: null, axis: null, add: null, pd: 30, va: '6/6' },
      status: 'COMPLETED',
      createdAt: '2025-01-15T11:30:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    },
  ],
};

type ViewMode = 'list' | 'detail';

export function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');

  // Filter customers
  const filteredCustomers = mockCustomers.filter(customer => {
    const matchesSearch = !searchQuery ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || customer.customerType === filterType;

    return matchesSearch && matchesType;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedPatient(customer.patients[0] || null);
    setViewMode('detail');
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setSelectedPatient(null);
    setViewMode('list');
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPower = (value: number | null) => {
    if (value === null) return '-';
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  // Customer List View
  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-500">Manage customers and patients</p>
          </div>
          <button
            onClick={() => setShowNewCustomerModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Customer
          </button>
        </div>

        {/* Search and Filters */}
        <div className="card">
          <div className="flex flex-col tablet:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Search by name, phone, or email..."
              />
            </div>
            <div className="flex gap-2">
              {(['ALL', 'B2C', 'B2B'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    filterType === type
                      ? 'bg-bv-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customer List */}
        <div className="card">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCustomers.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      customer.customerType === 'B2B' ? 'bg-blue-100' : 'bg-bv-red-100'
                    )}>
                      {customer.customerType === 'B2B' ? (
                        <Building2 className="w-6 h-6 text-blue-600" />
                      ) : (
                        <User className="w-6 h-6 text-bv-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{customer.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {customer.patients.length} patient{customer.patients.length !== 1 ? 's' : ''}
                      </p>
                      {customer.customerType === 'B2B' && customer.gstNumber && (
                        <p className="text-xs text-gray-400">GST: {customer.gstNumber}</p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Customer Detail View
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer?.name}</h1>
          <p className="text-gray-500">{selectedCustomer?.phone}</p>
        </div>
        <button className="btn-outline flex items-center gap-2">
          <Edit2 className="w-4 h-4" />
          Edit
        </button>
      </div>

      <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
        {/* Customer Info */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{selectedCustomer?.phone}</span>
            </div>
            {selectedCustomer?.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{selectedCustomer.email}</span>
              </div>
            )}
            {selectedCustomer?.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span>
                  {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.state} - {selectedCustomer.pincode}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Customer since {formatDate(selectedCustomer?.createdAt || '')}</span>
            </div>
            {selectedCustomer?.customerType === 'B2B' && selectedCustomer.gstNumber && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span>GST: {selectedCustomer.gstNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Patients */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Patients</h2>
            <button
              onClick={() => setShowNewPatientModal(true)}
              className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
          <div className="space-y-2">
            {selectedCustomer?.patients.map(patient => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={clsx(
                  'w-full p-3 rounded-lg text-left transition-colors',
                  selectedPatient?.id === patient.id
                    ? 'bg-bv-red-50 border border-bv-red-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                )}
              >
                <p className="font-medium text-gray-900">{patient.name}</p>
                <p className="text-sm text-gray-500">
                  {patient.relation}
                  {patient.dateOfBirth && ` • Born ${formatDate(patient.dateOfBirth)}`}
                </p>
              </button>
            ))}
            {selectedCustomer?.patients.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No patients added</p>
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">
              Prescriptions {selectedPatient && `(${selectedPatient.name})`}
            </h2>
            <button className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Eye Test
            </button>
          </div>
          {selectedPatient ? (
            <div className="space-y-3">
              {(mockPrescriptions[selectedPatient.id] || []).map(rx => (
                <div key={rx.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{formatDate(rx.testDate)}</span>
                    <span className="text-xs text-gray-500">by {rx.optometristName}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500">
                        <th className="text-left">Eye</th>
                        <th className="text-center">SPH</th>
                        <th className="text-center">CYL</th>
                        <th className="text-center">AXIS</th>
                        <th className="text-center">PD</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-medium">R</td>
                        <td className="text-center">{formatPower(rx.rightEye.sphere)}</td>
                        <td className="text-center">{formatPower(rx.rightEye.cylinder)}</td>
                        <td className="text-center">{rx.rightEye.axis || '-'}°</td>
                        <td className="text-center">{rx.rightEye.pd}</td>
                      </tr>
                      <tr>
                        <td className="font-medium">L</td>
                        <td className="text-center">{formatPower(rx.leftEye.sphere)}</td>
                        <td className="text-center">{formatPower(rx.leftEye.cylinder)}</td>
                        <td className="text-center">{rx.leftEye.axis || '-'}°</td>
                        <td className="text-center">{rx.leftEye.pd}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ))}
              {(!mockPrescriptions[selectedPatient.id] || mockPrescriptions[selectedPatient.id].length === 0) && (
                <p className="text-sm text-gray-500 text-center py-4">No prescriptions</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Select a patient to view prescriptions</p>
          )}
        </div>
      </div>

      {/* Purchase History would go here */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Purchase History</h2>
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No purchase history available</p>
        </div>
      </div>
    </div>
  );
}

export default CustomersPage;
