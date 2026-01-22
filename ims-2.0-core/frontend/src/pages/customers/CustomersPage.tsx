// ============================================================================
// IMS 2.0 - Customers Page
// ============================================================================
// NO MOCK DATA - All data from API

import { useState, useEffect, useCallback } from 'react';
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
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { Customer, Patient, Prescription } from '../../types';
import { customerApi, prescriptionApi, orderApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AddCustomerModal } from '../../components/pos/AddCustomerModal';
import clsx from 'clsx';

// ============================================================================
// Add Patient Modal Component
// ============================================================================
interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customerId: string;
  customerName: string;
}

function AddPatientModal({ isOpen, onClose, onSuccess, customerId, customerName }: AddPatientModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    relation: 'SELF',
    dateOfBirth: '',
    phone: '',
  });

  const relationOptions = [
    { value: 'SELF', label: 'Self' },
    { value: 'SPOUSE', label: 'Spouse' },
    { value: 'CHILD', label: 'Child' },
    { value: 'PARENT', label: 'Parent' },
    { value: 'SIBLING', label: 'Sibling' },
    { value: 'OTHER', label: 'Other' },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Patient name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await customerApi.addPatient(customerId, {
        name: formData.name.trim(),
        relation: formData.relation,
        dateOfBirth: formData.dateOfBirth || undefined,
        phone: formData.phone.trim() || undefined,
      });
      toast.success('Patient added successfully');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        relation: 'SELF',
        dateOfBirth: '',
        phone: '',
      });
    } catch (err) {
      console.error('Failed to add patient:', err);
      toast.error('Failed to add patient. Please try again.');
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
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Patient</h2>
            <p className="text-sm text-gray-500">For: {customerName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Patient Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter patient name"
            />
          </div>

          {/* Relation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
            <select
              name="relation"
              value={formData.relation}
              onChange={handleChange}
              className="input-field"
            >
              {relationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="input-field"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Phone (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input-field"
              placeholder="If different from customer"
              maxLength={10}
            />
          </div>

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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Add Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type ViewMode = 'list' | 'detail';

export function CustomersPage() {
  const { user, hasRole } = useAuth();
  const toast = useToast();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<Array<{ id: string; orderNumber: string; date: string; total: number; items: number }>>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');

  // Modal state
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerApi.getCustomers({
        storeId: user?.activeStoreId,
        limit: 100,
      });
      setCustomers(response.customers || response || []);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError('Failed to load customers. Please try again.');
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load prescriptions when patient is selected
  const loadPrescriptions = useCallback(async (patientId: string) => {
    setIsLoadingPrescriptions(true);
    try {
      const response = await prescriptionApi.getPrescriptions(patientId);
      setPrescriptions(response.prescriptions || response || []);
    } catch (err) {
      console.error('Failed to load prescriptions:', err);
      setPrescriptions([]);
    } finally {
      setIsLoadingPrescriptions(false);
    }
  }, []);

  // Load purchase history when customer is selected
  const loadPurchaseHistory = useCallback(async (customerId: string) => {
    setIsLoadingHistory(true);
    try {
      const response = await orderApi.getOrders({ customerId, limit: 10 });
      const orders = response.orders || response || [];
      setPurchaseHistory(orders.map((order: { id: string; orderNumber: string; createdAt: string; grandTotal: number; items: unknown[] }) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        total: order.grandTotal,
        items: order.items?.length || 0,
      })));
    } catch (err) {
      console.error('Failed to load purchase history:', err);
      setPurchaseHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Filter customers locally
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !searchQuery ||
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || customer.customerType === filterType;

    return matchesSearch && matchesType;
  });

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setSelectedPatient(customer.patients?.[0] || null);
    setViewMode('detail');
    loadPurchaseHistory(customer.id);
    if (customer.patients?.[0]) {
      loadPrescriptions(customer.patients[0].id);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    loadPrescriptions(patient.id);
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setSelectedPatient(null);
    setPrescriptions([]);
    setPurchaseHistory([]);
    setViewMode('list');
  };

  // Refresh selected customer after adding a patient
  const refreshSelectedCustomer = async () => {
    if (!selectedCustomer) return;
    try {
      const response = await customerApi.getCustomer(selectedCustomer.id);
      const customer = response.customer || response;
      setSelectedCustomer(customer);
      // If we just added the first patient, auto-select them
      if (customer.patients?.length > 0 && !selectedPatient) {
        setSelectedPatient(customer.patients[customer.patients.length - 1]);
        loadPrescriptions(customer.patients[customer.patients.length - 1].id);
      }
    } catch (err) {
      console.error('Failed to refresh customer:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPower = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Check if user can add customers (role-based)
  const canAddCustomer = hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_CASHIER', 'SALES_STAFF']);
  const canEditCustomer = hasRole(['SUPERADMIN', 'ADMIN', 'STORE_MANAGER']);

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
          {canAddCustomer && (
            <button
              onClick={() => setIsAddCustomerModalOpen(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Customer
            </button>
          )}
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

        {/* Error State */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <p>{error}</p>
              <button onClick={loadCustomers} className="ml-auto text-sm underline">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Customer List */}
        <div className="card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-bv-red-600" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>{searchQuery ? 'No customers found matching your search' : 'No customers yet'}</p>
              {canAddCustomer && !searchQuery && (
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="mt-4 text-bv-red-600 hover:text-bv-red-700"
                >
                  Add your first customer
                </button>
              )}
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
                        {customer.patients?.length || 0} patient{(customer.patients?.length || 0) !== 1 ? 's' : ''}
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

        {/* Add Customer Modal */}
        {isAddCustomerModalOpen && (
          <AddCustomerModal
            onClose={() => setIsAddCustomerModalOpen(false)}
            onSave={() => {
              loadCustomers();
              setIsAddCustomerModalOpen(false);
            }}
          />
        )}
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
        {canEditCustomer && (
          <button
            onClick={() => toast.info(`Edit customer: ${selectedCustomer?.name}`)}
            className="btn-outline flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        )}
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
            {canAddCustomer && (
              <button
                onClick={() => setIsAddPatientModalOpen(true)}
                className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            )}
          </div>
          <div className="space-y-2">
            {selectedCustomer?.patients?.map(patient => (
              <button
                key={patient.id}
                onClick={() => handleSelectPatient(patient)}
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
            {(!selectedCustomer?.patients || selectedCustomer.patients.length === 0) && (
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
            <button
              onClick={() => toast.info('Eye test feature coming soon')}
              className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Eye Test
            </button>
          </div>
          {selectedPatient ? (
            isLoadingPrescriptions ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-bv-red-600" />
              </div>
            ) : prescriptions.length > 0 ? (
              <div className="space-y-3">
                {prescriptions.map(rx => (
                  <div key={rx.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{formatDate(rx.testDate)}</span>
                      <span className="text-xs text-gray-500">by {rx.optometristName || 'Unknown'}</span>
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
                          <td className="text-center">{formatPower(rx.rightEye?.sphere)}</td>
                          <td className="text-center">{formatPower(rx.rightEye?.cylinder)}</td>
                          <td className="text-center">{rx.rightEye?.axis || '-'}°</td>
                          <td className="text-center">{rx.rightEye?.pd || '-'}</td>
                        </tr>
                        <tr>
                          <td className="font-medium">L</td>
                          <td className="text-center">{formatPower(rx.leftEye?.sphere)}</td>
                          <td className="text-center">{formatPower(rx.leftEye?.cylinder)}</td>
                          <td className="text-center">{rx.leftEye?.axis || '-'}°</td>
                          <td className="text-center">{rx.leftEye?.pd || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No prescriptions</p>
            )
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Select a patient to view prescriptions</p>
          )}
        </div>
      </div>

      {/* Purchase History */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Purchase History</h2>
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-bv-red-600" />
          </div>
        ) : purchaseHistory.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {purchaseHistory.map(order => (
              <div key={order.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{order.orderNumber}</p>
                  <p className="text-sm text-gray-500">{formatDate(order.date)} • {order.items} items</p>
                </div>
                <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No purchase history available</p>
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddCustomerModalOpen && (
        <AddCustomerModal
          onClose={() => setIsAddCustomerModalOpen(false)}
          onSave={() => {
            loadCustomers();
            setIsAddCustomerModalOpen(false);
          }}
        />
      )}

      {/* Add Patient Modal */}
      {selectedCustomer && (
        <AddPatientModal
          isOpen={isAddPatientModalOpen}
          onClose={() => setIsAddPatientModalOpen(false)}
          onSuccess={refreshSelectedCustomer}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
        />
      )}
    </div>
  );
}

export default CustomersPage;
