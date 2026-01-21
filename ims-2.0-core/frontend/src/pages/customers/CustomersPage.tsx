// ============================================================================
// IMS 2.0 - Customers Page
// Full-featured customer management with MockDataContext integration
// ============================================================================

import { useState, useMemo } from 'react';
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
  Trash2,
  ShoppingBag,
  MessageSquare,
  ArrowLeft,
  Save,
  UserPlus,
} from 'lucide-react';
import type { Customer, Patient, Prescription } from '../../types';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';
import clsx from 'clsx';

type ViewMode = 'list' | 'detail' | 'add' | 'edit';

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
};

export function CustomersPage() {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer, searchCustomers } = useMockData();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filterType, setFilterType] = useState<'ALL' | 'B2C' | 'B2B'>('ALL');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    email: string;
    customerType: 'B2C' | 'B2B';
    gstNumber: string;
    address: { line1: string; line2?: string; city: string; state: string; pincode: string; country: string };
  }>({
    name: '',
    phone: '',
    email: '',
    customerType: 'B2C',
    gstNumber: '',
    address: { line1: '', city: '', state: '', pincode: '', country: 'India' },
  });

  const [patientForm, setPatientForm] = useState({
    name: '',
    relation: 'Self',
    dateOfBirth: '',
  });

  // Filter customers
  const filteredCustomers = useMemo(() => {
    let result = customers;
    if (searchQuery) {
      result = searchCustomers(searchQuery);
    }
    if (filterType !== 'ALL') {
      result = result.filter(c => c.customerType === filterType);
    }
    return result;
  }, [customers, searchQuery, filterType, searchCustomers]);

  // Stats
  const stats = useMemo(() => ({
    totalCustomers: customers.length,
    b2cCount: customers.filter(c => c.customerType === 'B2C').length,
    b2bCount: customers.filter(c => c.customerType === 'B2B').length,
    totalPatients: customers.reduce((sum, c) => sum + c.patients.length, 0),
    activeCustomers: customers.filter(c => orders.some(o => o.customerId === c.id)).length,
  }), [customers, orders]);

  const getCustomerOrders = (customerId: string) => orders.filter(o => o.customerId === customerId);

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;
  const formatPower = (value: number | null) => value === null ? '-' : (value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2));

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

  const handleAddCustomer = () => {
    setFormData({ name: '', phone: '', email: '', customerType: 'B2C', gstNumber: '', address: { line1: '', city: '', state: '', pincode: '', country: 'India' } });
    setViewMode('add');
  };

  const handleEditCustomer = () => {
    if (!selectedCustomer) return;
    setFormData({
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email || '',
      customerType: selectedCustomer.customerType,
      gstNumber: selectedCustomer.gstNumber || '',
      address: selectedCustomer.address || { line1: '', city: '', state: '', pincode: '', country: 'India' },
    });
    setViewMode('edit');
  };

  const handleSaveCustomer = () => {
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    if (viewMode === 'add') {
      const newCustomer = addCustomer({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        customerType: formData.customerType,
        gstNumber: formData.customerType === 'B2B' ? formData.gstNumber : undefined,
        address: formData.address,
        patients: [],
      });
      toast.success(`Customer ${newCustomer.name} created`);
      setSelectedCustomer(newCustomer);
      setViewMode('detail');
    } else if (viewMode === 'edit' && selectedCustomer) {
      updateCustomer(selectedCustomer.id, {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        customerType: formData.customerType,
        gstNumber: formData.customerType === 'B2B' ? formData.gstNumber : undefined,
        address: formData.address,
      });
      toast.success('Customer updated');
      const updated = customers.find(c => c.id === selectedCustomer.id);
      if (updated) setSelectedCustomer(updated);
      setViewMode('detail');
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer) return;
    if (window.confirm(`Delete ${selectedCustomer.name}?`)) {
      deleteCustomer(selectedCustomer.id);
      toast.success('Customer deleted');
      handleBack();
    }
  };

  const handleAddPatient = () => {
    if (!selectedCustomer || !patientForm.name) {
      toast.error('Patient name is required');
      return;
    }

    const newPatient: Patient = {
      id: `pat-${Date.now()}`,
      customerId: selectedCustomer.id,
      name: patientForm.name,
      relation: patientForm.relation,
      dateOfBirth: patientForm.dateOfBirth || undefined,
    };

    updateCustomer(selectedCustomer.id, { patients: [...selectedCustomer.patients, newPatient] });
    toast.success(`Patient ${newPatient.name} added`);
    setShowAddPatientModal(false);
    setPatientForm({ name: '', relation: 'Self', dateOfBirth: '' });

    const updated = customers.find(c => c.id === selectedCustomer.id);
    if (updated) {
      setSelectedCustomer(updated);
      setSelectedPatient(newPatient);
    }
  };

  // Add/Edit Form View
  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => viewMode === 'add' ? setViewMode('list') : setViewMode('detail')} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{viewMode === 'add' ? 'Add Customer' : `Edit ${selectedCustomer?.name}`}</h1>
        </div>

        <div className="card max-w-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="input-field" placeholder="Customer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-field" placeholder="10-digit number" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="input-field" placeholder="email@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={formData.customerType} onChange={e => setFormData({ ...formData, customerType: e.target.value as 'B2C' | 'B2B' })} className="input-field">
                  <option value="B2C">B2C (Individual)</option>
                  <option value="B2B">B2B (Business)</option>
                </select>
              </div>
              {formData.customerType === 'B2B' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <input type="text" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} className="input-field" placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
              )}
            </div>

            <hr />
            <h3 className="font-medium">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <input type="text" value={formData.address.line1} onChange={e => setFormData({ ...formData, address: { ...formData.address, line1: e.target.value } })} className="input-field" placeholder="Address Line 1" />
              </div>
              <div>
                <input type="text" value={formData.address.city} onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })} className="input-field" placeholder="City" />
              </div>
              <div>
                <input type="text" value={formData.address.state} onChange={e => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })} className="input-field" placeholder="State" />
              </div>
              <div>
                <input type="text" value={formData.address.pincode} onChange={e => setFormData({ ...formData, address: { ...formData.address, pincode: e.target.value } })} className="input-field" placeholder="Pincode" maxLength={6} />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={handleSaveCustomer} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                {viewMode === 'add' ? 'Create' : 'Save'}
              </button>
              <button onClick={() => viewMode === 'add' ? setViewMode('list') : setViewMode('detail')} className="btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detail View
  if (viewMode === 'detail' && selectedCustomer) {
    const customerOrders = getCustomerOrders(selectedCustomer.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const pendingBalance = customerOrders.reduce((sum, o) => sum + o.balanceDue, 0);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={handleBack} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
              <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', selectedCustomer.customerType === 'B2B' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600')}>{selectedCustomer.customerType}</span>
            </div>
            <p className="text-gray-500">{selectedCustomer.phone}</p>
          </div>
          <button onClick={() => toast.success(`WhatsApp sent to ${selectedCustomer.phone}`)} className="btn-outline text-green-600 border-green-200 hover:bg-green-50"><MessageSquare className="w-4 h-4" /></button>
          <button onClick={handleEditCustomer} className="btn-outline"><Edit2 className="w-4 h-4" /></button>
          <button onClick={handleDeleteCustomer} className="btn-outline text-red-600 border-red-200 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card"><p className="text-sm text-gray-500">Orders</p><p className="text-2xl font-bold">{customerOrders.length}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Total Spent</p><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSpent)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Pending</p><p className={clsx('text-2xl font-bold', pendingBalance > 0 ? 'text-red-600' : 'text-gray-900')}>{formatCurrency(pendingBalance)}</p></div>
          <div className="card"><p className="text-sm text-gray-500">Patients</p><p className="text-2xl font-bold">{selectedCustomer.patients.length}</p></div>
        </div>

        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
          {/* Customer Info */}
          <div className="card">
            <h2 className="font-semibold mb-4">Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{selectedCustomer.phone}</div>
              {selectedCustomer.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{selectedCustomer.email}</div>}
              {selectedCustomer.address && (
                <div className="flex items-start gap-2"><MapPin className="w-4 h-4 text-gray-400 mt-0.5" /><span>{selectedCustomer.address.line1}, {selectedCustomer.address.city} - {selectedCustomer.address.pincode}</span></div>
              )}
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" />Since {formatDate(selectedCustomer.createdAt)}</div>
              {selectedCustomer.gstNumber && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" />GST: {selectedCustomer.gstNumber}</div>}
            </div>
          </div>

          {/* Patients */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Patients</h2>
              <button onClick={() => setShowAddPatientModal(true)} className="text-sm text-bv-red-600 flex items-center gap-1"><Plus className="w-4 h-4" />Add</button>
            </div>
            <div className="space-y-2">
              {selectedCustomer.patients.map(patient => (
                <button key={patient.id} onClick={() => setSelectedPatient(patient)} className={clsx('w-full p-3 rounded-lg text-left', selectedPatient?.id === patient.id ? 'bg-bv-red-50 border border-bv-red-200' : 'bg-gray-50 hover:bg-gray-100')}>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-gray-500">{patient.relation}{patient.dateOfBirth && ` • ${formatDate(patient.dateOfBirth)}`}</p>
                </button>
              ))}
              {selectedCustomer.patients.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No patients</p>}
            </div>
          </div>

          {/* Prescriptions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Prescriptions {selectedPatient && `(${selectedPatient.name})`}</h2>
              <button className="text-sm text-bv-red-600 flex items-center gap-1"><Eye className="w-4 h-4" />Eye Test</button>
            </div>
            {selectedPatient ? (
              <div className="space-y-3">
                {(mockPrescriptions[selectedPatient.id] || []).map(rx => (
                  <div key={rx.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between mb-2 text-sm">
                      <span className="font-medium">{formatDate(rx.testDate)}</span>
                      <span className="text-gray-500">by {rx.optometristName}</span>
                    </div>
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-500"><th className="text-left">Eye</th><th>SPH</th><th>CYL</th><th>AXIS</th><th>PD</th></tr></thead>
                      <tbody>
                        <tr><td className="font-medium">R</td><td className="text-center">{formatPower(rx.rightEye.sphere)}</td><td className="text-center">{formatPower(rx.rightEye.cylinder)}</td><td className="text-center">{rx.rightEye.axis || '-'}°</td><td className="text-center">{rx.rightEye.pd}</td></tr>
                        <tr><td className="font-medium">L</td><td className="text-center">{formatPower(rx.leftEye.sphere)}</td><td className="text-center">{formatPower(rx.leftEye.cylinder)}</td><td className="text-center">{rx.leftEye.axis || '-'}°</td><td className="text-center">{rx.leftEye.pd}</td></tr>
                      </tbody>
                    </table>
                  </div>
                ))}
                {(!mockPrescriptions[selectedPatient.id] || mockPrescriptions[selectedPatient.id].length === 0) && <p className="text-sm text-gray-500 text-center py-4">No prescriptions</p>}
              </div>
            ) : <p className="text-sm text-gray-500 text-center py-4">Select a patient</p>}
          </div>
        </div>

        {/* Orders */}
        <div className="card">
          <h2 className="font-semibold mb-4">Purchase History</h2>
          {customerOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>No orders</p></div>
          ) : (
            <div className="divide-y">
              {customerOrders.map(order => (
                <div key={order.id} className="py-4 flex justify-between">
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)} • {order.items.length} items • {order.orderStatus}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(order.grandTotal)}</p>
                    {order.balanceDue > 0 && <p className="text-sm text-red-600">Due: {formatCurrency(order.balanceDue)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Patient Modal */}
        {showAddPatientModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Add Patient</h2>
                <button onClick={() => setShowAddPatientModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input type="text" value={patientForm.name} onChange={e => setPatientForm({ ...patientForm, name: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relation</label>
                  <select value={patientForm.relation} onChange={e => setPatientForm({ ...patientForm, relation: e.target.value })} className="input-field">
                    {['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth</label>
                  <input type="date" value={patientForm.dateOfBirth} onChange={e => setPatientForm({ ...patientForm, dateOfBirth: e.target.value })} className="input-field" />
                </div>
                <button onClick={handleAddPatient} className="w-full btn-primary flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" />Add Patient</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Customers</h1><p className="text-gray-500">Manage customers and patients</p></div>
        <button onClick={handleAddCustomer} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" />New Customer</button>
      </div>

      <div className="grid grid-cols-2 laptop:grid-cols-5 gap-4">
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-sm text-gray-500">Total</p><p className="text-xl font-bold">{stats.totalCustomers}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><User className="w-5 h-5 text-green-600" /></div><div><p className="text-sm text-gray-500">B2C</p><p className="text-xl font-bold">{stats.b2cCount}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Building2 className="w-5 h-5 text-purple-600" /></div><div><p className="text-sm text-gray-500">B2B</p><p className="text-xl font-bold">{stats.b2bCount}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-orange-600" /></div><div><p className="text-sm text-gray-500">Patients</p><p className="text-xl font-bold">{stats.totalPatients}</p></div></div></div>
        <div className="card"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-teal-600" /></div><div><p className="text-sm text-gray-500">Active</p><p className="text-xl font-bold">{stats.activeCustomers}</p></div></div></div>
      </div>

      <div className="card">
        <div className="flex flex-col tablet:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-field pl-10" placeholder="Search by name, phone, email..." />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'B2C', 'B2B'] as const).map(type => (
              <button key={type} onClick={() => setFilterType(type)} className={clsx('px-4 py-2 rounded-lg text-sm font-medium', filterType === type ? 'bg-bv-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>{type}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No customers found</p>
            <button onClick={handleAddCustomer} className="mt-4 btn-primary">Add First Customer</button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCustomers.map(customer => {
              const custOrders = getCustomerOrders(customer.id);
              const totalSpent = custOrders.reduce((sum, o) => sum + o.grandTotal, 0);
              return (
                <button key={customer.id} onClick={() => handleSelectCustomer(customer)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left">
                  <div className="flex items-center gap-4">
                    <div className={clsx('w-12 h-12 rounded-full flex items-center justify-center', customer.customerType === 'B2B' ? 'bg-blue-100' : 'bg-bv-red-100')}>
                      {customer.customerType === 'B2B' ? <Building2 className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-bv-red-600" />}
                    </div>
                    <div>
                      <p className="font-medium">{customer.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>
                        {customer.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{customer.patients.length} patients • {custOrders.length} orders</p>
                      {totalSpent > 0 && <p className="text-sm font-medium text-green-600">{formatCurrency(totalSpent)}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomersPage;
