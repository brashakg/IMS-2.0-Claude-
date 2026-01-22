// ============================================================================
// IMS 2.0 - Add New Customer Modal
// ============================================================================
// Comprehensive customer creation form matching Emergent design

import { useState, useCallback } from 'react';
import { X, User, Building2, UserPlus, MapPin, Hash, Loader2 } from 'lucide-react';
import { customerApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface AddCustomerModalProps {
  onSave: () => void;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
}

type CustomerType = 'B2C' | 'B2B';

interface CustomerFormData {
  customerType: CustomerType;
  // B2C fields
  fullName: string;
  mobileNumber: string;
  alternatePhone: string;
  email: string;
  customerGroup: string;
  sendSmsAlerts: boolean;
  sendEmailAlerts: boolean;
  // B2B fields
  businessName: string;
  legalName: string;
  gstinStatus: 'registered' | 'unregistered' | 'composition';
  gstin: string;
  panNumber: string;
  // Address
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  // Patient
  patientName: string;
  patientRelation: string;
}

const CUSTOMER_GROUPS = [
  { value: 'CG1', label: 'CG1 - Regular (0% discount)' },
  { value: 'CG2', label: 'CG2 - Silver (5% discount)' },
  { value: 'CG3', label: 'CG3 - Gold (10% discount)' },
  { value: 'CG4', label: 'CG4 - Platinum (15% discount)' },
];

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

const RELATIONS = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Other'];

export function AddCustomerModal({ onSave, onClose, initialPhone = '', initialName = '' }: AddCustomerModalProps) {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    customerType: 'B2C',
    fullName: initialName,
    mobileNumber: initialPhone,
    alternatePhone: '',
    email: '',
    customerGroup: 'CG1',
    sendSmsAlerts: true,
    sendEmailAlerts: false,
    businessName: '',
    legalName: '',
    gstinStatus: 'unregistered',
    gstin: '',
    panNumber: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    pincode: '',
    city: '',
    state: '',
    country: 'India',
    patientName: initialName,
    patientRelation: 'Self',
  });

  const [patients, setPatients] = useState<Array<{ name: string; relation: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePincodeChange = async (pincode: string) => {
    updateField('pincode', pincode);
    if (pincode.length === 6) {
      // Auto-fetch city/state from pincode API
      try {
        // Simulated - in production, call actual API
        // For now, just clear state/city for manual entry
      } catch {
        // Ignore error
      }
    }
  };

  const addPatient = () => {
    if (formData.patientName && formData.patientRelation) {
      setPatients(prev => [...prev, { name: formData.patientName, relation: formData.patientRelation }]);
      setFormData(prev => ({ ...prev, patientName: '', patientRelation: 'Self' }));
    }
  };

  const removePatient = (index: number) => {
    setPatients(prev => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.customerType === 'B2C') {
      if (!formData.fullName.trim()) newErrors.fullName = 'Name is required';
      if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
        newErrors.mobileNumber = 'Valid 10-digit mobile number is required';
      }
    } else {
      if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
      if (!formData.mobileNumber || formData.mobileNumber.length !== 10) {
        newErrors.mobileNumber = 'Valid 10-digit mobile number is required';
      }
      if (formData.gstinStatus === 'registered' && !formData.gstin) {
        newErrors.gstin = 'GSTIN is required for registered businesses';
      }
    }

    if (formData.addressLine1 && !formData.pincode) {
      newErrors.pincode = 'Pincode is required with address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const customerName = formData.customerType === 'B2C' ? formData.fullName : formData.businessName;

      // Build full address string
      const addressParts = [
        formData.addressLine1,
        formData.addressLine2,
        formData.landmark ? `Near ${formData.landmark}` : '',
      ].filter(Boolean);
      const fullAddress = addressParts.join(', ') || undefined;

      // Create customer via API - only send fields that exist in the Customer type
      const response = await customerApi.createCustomer({
        name: customerName,
        phone: formData.mobileNumber,
        email: formData.email || undefined,
        customerType: formData.customerType,
        gstNumber: formData.customerType === 'B2B' && formData.gstinStatus === 'registered'
          ? formData.gstin
          : undefined,
        address: fullAddress,
        city: formData.city || undefined,
        state: formData.state || undefined,
        pincode: formData.pincode || undefined,
      });

      const customerId = response.customer?.id || response.id;

      // Add patients if B2C and we have the customer ID
      if (formData.customerType === 'B2C' && customerId) {
        // Add self as first patient
        await customerApi.addPatient(customerId, {
          name: formData.fullName,
          relation: 'Self',
        });

        // Add additional patients
        for (const patient of patients) {
          await customerApi.addPatient(customerId, {
            name: patient.name,
            relation: patient.relation,
          });
        }
      }

      toast.success('Customer created successfully');
      onSave();
      onClose();
    } catch (err) {
      console.error('Failed to create customer:', err);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, patients, onSave, onClose, toast]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add New Customer</h2>
            <p className="text-sm text-gray-500">Create a new customer record</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Customer Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updateField('customerType', 'B2C')}
                className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${
                  formData.customerType === 'B2C'
                    ? 'border-bv-red-500 bg-bv-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.customerType === 'B2C' ? 'bg-bv-red-100' : 'bg-gray-100'
                }`}>
                  <User className={`w-5 h-5 ${formData.customerType === 'B2C' ? 'text-bv-red-600' : 'text-gray-500'}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Individual (B2C)</p>
                  <p className="text-sm text-gray-500">Personal customer account</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateField('customerType', 'B2B')}
                className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${
                  formData.customerType === 'B2B'
                    ? 'border-bv-red-500 bg-bv-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  formData.customerType === 'B2B' ? 'bg-bv-red-100' : 'bg-gray-100'
                }`}>
                  <Building2 className={`w-5 h-5 ${formData.customerType === 'B2B' ? 'text-bv-red-600' : 'text-gray-500'}`} />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Business (B2B)</p>
                  <p className="text-sm text-gray-500">Corporate/business account</p>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Information */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {formData.customerType === 'B2C' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={e => updateField('fullName', e.target.value)}
                      className={`input-field ${errors.fullName ? 'border-red-500' : ''}`}
                      placeholder="Enter full name"
                    />
                    {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={e => updateField('businessName', e.target.value)}
                      className={`input-field ${errors.businessName ? 'border-red-500' : ''}`}
                      placeholder="Enter business name"
                    />
                    {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                    <input
                      type="text"
                      value={formData.legalName}
                      onChange={e => updateField('legalName', e.target.value)}
                      className="input-field"
                      placeholder="As per GST registration"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={e => updateField('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className={`input-field rounded-l-none flex-1 ${errors.mobileNumber ? 'border-red-500' : ''}`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                </div>
                {errors.mobileNumber && <p className="text-xs text-red-500 mt-1">{errors.mobileNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                <input
                  type="tel"
                  value={formData.alternatePhone}
                  onChange={e => updateField('alternatePhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="input-field"
                  placeholder="Alternate phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => updateField('email', e.target.value)}
                  className="input-field"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Group *</label>
                <select
                  value={formData.customerGroup}
                  onChange={e => updateField('customerGroup', e.target.value)}
                  className="input-field"
                >
                  {CUSTOMER_GROUPS.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alert Preferences */}
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendSmsAlerts}
                  onChange={e => updateField('sendSmsAlerts', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-bv-red-600 focus:ring-bv-red-500"
                />
                <span className="text-sm text-gray-700">Send SMS alerts</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sendEmailAlerts}
                  onChange={e => updateField('sendEmailAlerts', e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-bv-red-600 focus:ring-bv-red-500"
                />
                <span className="text-sm text-gray-700">Send email alerts</span>
              </label>
            </div>
          </div>

          {/* GST Details (B2B only) */}
          {formData.customerType === 'B2B' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                GST Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GSTIN Status *</label>
                  <div className="flex gap-4">
                    {(['registered', 'unregistered', 'composition'] as const).map(status => (
                      <label key={status} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gstinStatus"
                          checked={formData.gstinStatus === status}
                          onChange={() => updateField('gstinStatus', status)}
                          className="w-4 h-4 border-gray-300 text-bv-red-600 focus:ring-bv-red-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{status === 'unregistered' ? 'Un-Registered' : status}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                  <input
                    type="text"
                    value={formData.panNumber}
                    onChange={e => updateField('panNumber', e.target.value.toUpperCase())}
                    className="input-field"
                    placeholder="AAAAA9999A"
                    maxLength={10}
                  />
                </div>

                {formData.gstinStatus === 'registered' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={e => updateField('gstin', e.target.value.toUpperCase())}
                      className={`input-field ${errors.gstin ? 'border-red-500' : ''}`}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                    {errors.gstin && <p className="text-xs text-red-500 mt-1">{errors.gstin}</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing Address */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Billing Address
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={e => updateField('addressLine1', e.target.value)}
                  className="input-field"
                  placeholder="Building, Street, Area"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={e => updateField('addressLine2', e.target.value)}
                  className="input-field"
                  placeholder="Locality, Sector"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Landmark</label>
                <input
                  type="text"
                  value={formData.landmark}
                  onChange={e => updateField('landmark', e.target.value)}
                  className="input-field"
                  placeholder="Near..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={e => handlePincodeChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`input-field flex-1 ${errors.pincode ? 'border-red-500' : ''}`}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                    Fetch
                  </button>
                </div>
                {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => updateField('city', e.target.value)}
                  className="input-field"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  value={formData.state}
                  onChange={e => updateField('state', e.target.value)}
                  className="input-field"
                >
                  <option value="">Select State</option>
                  {STATES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={e => updateField('country', e.target.value)}
                  className="input-field bg-gray-50"
                  readOnly
                />
              </div>
            </div>
          </div>

          {/* Patient Details (B2C only) */}
          {formData.customerType === 'B2C' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Patient Details
                  </h3>
                  <p className="text-sm text-gray-500">Add family members or patients</p>
                </div>
                <button
                  onClick={addPatient}
                  disabled={!formData.patientName}
                  className="px-3 py-1.5 text-sm bg-bv-red-50 text-bv-red-600 rounded-lg hover:bg-bv-red-100 disabled:opacity-50 flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Patient
                </button>
              </div>

              {/* Added Patients List */}
              {patients.length > 0 && (
                <div className="mb-4 space-y-2">
                  {patients.map((patient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium text-gray-900">{patient.name}</span>
                        <span className="text-gray-500 text-sm ml-2">({patient.relation})</span>
                      </div>
                      <button
                        onClick={() => removePatient(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={e => updateField('patientName', e.target.value)}
                    className="input-field"
                    placeholder="Family member name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <select
                    value={formData.patientRelation}
                    onChange={e => updateField('patientRelation', e.target.value)}
                    className="input-field"
                  >
                    {RELATIONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-outline" disabled={isSubmitting}>
            Cancel
          </button>
          <button onClick={handleSubmit} className="btn-primary flex items-center gap-2" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Customer'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddCustomerModal;
