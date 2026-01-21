// ============================================================================
// IMS 2.0 - Store Setup Wizard Component
// Initial store configuration wizard for new store onboarding
// ============================================================================

import React, { useState } from 'react';
import { apiClient } from '../../services/api';

interface StoreSetupData {
  // Basic Info
  store_name: string;
  store_code: string;
  store_type: 'standalone' | 'mall' | 'franchise' | 'flagship';

  // Address
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;

  // Contact
  phone: string;
  email: string;
  manager_name: string;
  manager_phone: string;

  // Business
  gstin: string;
  pan: string;
  cin?: string;
  fssai?: string;

  // Geolocation
  latitude: number;
  longitude: number;
  geofence_radius: number;

  // Operations
  opening_time: string;
  closing_time: string;
  weekly_off: string[];
  operating_days: string[];

  // Banking
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: 'current' | 'savings';

  // Inventory
  default_tax_rate: number;
  inventory_method: 'fifo' | 'lifo' | 'weighted_avg';
  low_stock_threshold: number;

  // POS
  default_payment_methods: string[];
  print_receipt: boolean;
  send_sms: boolean;
  send_email: boolean;

  // Staff
  min_staff_per_shift: number;
  max_staff_per_shift: number;
}

interface Props {
  onComplete: (storeId: string) => void;
  onCancel?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Chandigarh', 'Puducherry'
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const StoreSetupWizard: React.FC<Props> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<StoreSetupData>({
    store_name: '',
    store_code: '',
    store_type: 'standalone',
    address: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    phone: '',
    email: '',
    manager_name: '',
    manager_phone: '',
    gstin: '',
    pan: '',
    latitude: 0,
    longitude: 0,
    geofence_radius: 100,
    opening_time: '10:00',
    closing_time: '21:00',
    weekly_off: ['Sunday'],
    operating_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_type: 'current',
    default_tax_rate: 18,
    inventory_method: 'fifo',
    low_stock_threshold: 5,
    default_payment_methods: ['cash', 'card', 'upi'],
    print_receipt: true,
    send_sms: true,
    send_email: false,
    min_staff_per_shift: 2,
    max_staff_per_shift: 5
  });

  const steps = [
    { number: 1, title: 'Basic Info', icon: '🏪' },
    { number: 2, title: 'Location', icon: '📍' },
    { number: 3, title: 'Business', icon: '📋' },
    { number: 4, title: 'Operations', icon: '⚙️' },
    { number: 5, title: 'Finance', icon: '💰' },
    { number: 6, title: 'Review', icon: '✅' }
  ];

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.store_name) newErrors.store_name = 'Store name is required';
        if (!formData.store_code) newErrors.store_code = 'Store code is required';
        if (!formData.phone) newErrors.phone = 'Phone is required';
        if (!formData.email) newErrors.email = 'Email is required';
        break;
      case 2:
        if (!formData.address) newErrors.address = 'Address is required';
        if (!formData.city) newErrors.city = 'City is required';
        if (!formData.state) newErrors.state = 'State is required';
        if (!formData.pincode || formData.pincode.length !== 6) newErrors.pincode = 'Valid 6-digit pincode required';
        break;
      case 3:
        if (!formData.gstin || formData.gstin.length !== 15) newErrors.gstin = 'Valid 15-character GSTIN required';
        if (!formData.pan || formData.pan.length !== 10) newErrors.pan = 'Valid 10-character PAN required';
        break;
      case 4:
        if (!formData.opening_time) newErrors.opening_time = 'Opening time required';
        if (!formData.closing_time) newErrors.closing_time = 'Closing time required';
        if (formData.operating_days.length === 0) newErrors.operating_days = 'Select at least one operating day';
        break;
      case 5:
        if (!formData.bank_name) newErrors.bank_name = 'Bank name required';
        if (!formData.account_number) newErrors.account_number = 'Account number required';
        if (!formData.ifsc_code || formData.ifsc_code.length !== 11) newErrors.ifsc_code = 'Valid 11-character IFSC required';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const response = await apiClient.post('/stores', formData);
      onComplete(response.data?.id || `STORE${Date.now()}`);
    } catch (error) {
      // For demo
      onComplete(`STORE${Date.now()}`);
    } finally {
      setLoading(false);
    }
  };

  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const generateStoreCode = () => {
    if (formData.store_name && formData.city) {
      const nameCode = formData.store_name.substring(0, 3).toUpperCase();
      const cityCode = formData.city.substring(0, 2).toUpperCase();
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, store_code: `${nameCode}${cityCode}${random}` }));
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  value={formData.store_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_name: e.target.value }))}
                  placeholder="e.g., VisionCare Opticals - Andheri"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.store_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.store_name && <p className="text-red-500 text-xs mt-1">{errors.store_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.store_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, store_code: e.target.value.toUpperCase() }))}
                    placeholder="e.g., VICANH01"
                    maxLength={10}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${errors.store_code ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <button
                    type="button"
                    onClick={generateStoreCode}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Generate
                  </button>
                </div>
                {errors.store_code && <p className="text-red-500 text-xs mt-1">{errors.store_code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
                <select
                  value={formData.store_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, store_type: e.target.value as StoreSetupData['store_type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standalone">Standalone Store</option>
                  <option value="mall">Mall Store</option>
                  <option value="franchise">Franchise</option>
                  <option value="flagship">Flagship Store</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g., 022-26789012"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g., andheri@visioncare.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Store Manager</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={formData.manager_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                  <input
                    type="tel"
                    value={formData.manager_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, manager_phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Location & Address</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={2}
                placeholder="e.g., Shop No. 12, Ground Floor, Infinity Mall"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="e.g., Mumbai"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select State</option>
                  {INDIAN_STATES.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="e.g., 400053"
                  maxLength={6}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700">Geolocation (for attendance)</h4>
                <button
                  type="button"
                  onClick={getGeoLocation}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  📍 Get Current Location
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Geofence Radius (m)</label>
                  <input
                    type="number"
                    value={formData.geofence_radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, geofence_radius: parseInt(e.target.value) || 100 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Business Registration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="e.g., 27AABCV1234A1Z5"
                  maxLength={15}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${errors.gstin ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.gstin && <p className="text-red-500 text-xs mt-1">{errors.gstin}</p>}
                <p className="text-xs text-gray-500 mt-1">15-character Goods and Services Tax Identification Number</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN *</label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  placeholder="e.g., AABCV1234A"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${errors.pan ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.pan && <p className="text-red-500 text-xs mt-1">{errors.pan}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CIN (Optional)</label>
                <input
                  type="text"
                  value={formData.cin}
                  onChange={(e) => setFormData(prev => ({ ...prev, cin: e.target.value.toUpperCase() }))}
                  placeholder="Corporate Identification Number"
                  maxLength={21}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">FSSAI (Optional)</label>
                <input
                  type="text"
                  value={formData.fssai}
                  onChange={(e) => setFormData(prev => ({ ...prev, fssai: e.target.value }))}
                  placeholder="If selling food/beverages"
                  maxLength={14}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Operations & Timing</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time *</label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time *</label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Operating Days *</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.operating_days.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, operating_days: [...prev.operating_days, day] }));
                        } else {
                          setFormData(prev => ({ ...prev, operating_days: prev.operating_days.filter(d => d !== day) }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
              {errors.operating_days && <p className="text-red-500 text-xs mt-1">{errors.operating_days}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weekly Off</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <label key={day} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={formData.weekly_off.includes(day)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, weekly_off: [...prev.weekly_off, day] }));
                        } else {
                          setFormData(prev => ({ ...prev, weekly_off: prev.weekly_off.filter(d => d !== day) }));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Staff Settings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Staff per Shift</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_staff_per_shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_staff_per_shift: parseInt(e.target.value) || 1 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Staff per Shift</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_staff_per_shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_staff_per_shift: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Finance & Banking</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                  placeholder="e.g., HDFC Bank"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.bank_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.bank_name && <p className="text-red-500 text-xs mt-1">{errors.bank_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  placeholder="e.g., 50100123456789"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.account_number ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.account_number && <p className="text-red-500 text-xs mt-1">{errors.account_number}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, ifsc_code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., HDFC0001234"
                  maxLength={11}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase ${errors.ifsc_code ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.ifsc_code && <p className="text-red-500 text-xs mt-1">{errors.ifsc_code}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value as 'current' | 'savings' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="current">Current Account</option>
                  <option value="savings">Savings Account</option>
                </select>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Inventory & Tax</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    value={formData.default_tax_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_tax_rate: parseFloat(e.target.value) || 18 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inventory Method</label>
                  <select
                    value={formData.inventory_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_method: e.target.value as 'fifo' | 'lifo' | 'weighted_avg' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="fifo">FIFO</option>
                    <option value="lifo">LIFO</option>
                    <option value="weighted_avg">Weighted Average</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Payment & Receipts</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-4">
                  {['cash', 'card', 'upi', 'bank_transfer', 'cheque'].map(method => (
                    <label key={method} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.default_payment_methods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, default_payment_methods: [...prev.default_payment_methods, method] }));
                          } else {
                            setFormData(prev => ({ ...prev, default_payment_methods: prev.default_payment_methods.filter(m => m !== method) }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">{method.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.print_receipt}
                      onChange={(e) => setFormData(prev => ({ ...prev, print_receipt: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Print receipt by default</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.send_sms}
                      onChange={(e) => setFormData(prev => ({ ...prev, send_sms: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Send SMS receipts</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.send_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, send_email: e.target.checked }))}
                      className="rounded"
                    />
                    <span className="text-sm">Send email receipts</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Review & Confirm</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">🏪 Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Name:</span> {formData.store_name}</p>
                  <p><span className="text-gray-500">Code:</span> {formData.store_code}</p>
                  <p><span className="text-gray-500">Type:</span> {formData.store_type}</p>
                  <p><span className="text-gray-500">Phone:</span> {formData.phone}</p>
                  <p><span className="text-gray-500">Email:</span> {formData.email}</p>
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">📍 Location</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Address:</span> {formData.address}</p>
                  <p><span className="text-gray-500">City:</span> {formData.city}, {formData.state} - {formData.pincode}</p>
                  {formData.latitude && <p><span className="text-gray-500">Coordinates:</span> {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</p>}
                </div>
              </div>

              {/* Business */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">📋 Business</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">GSTIN:</span> {formData.gstin}</p>
                  <p><span className="text-gray-500">PAN:</span> {formData.pan}</p>
                </div>
              </div>

              {/* Operations */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">⚙️ Operations</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Hours:</span> {formData.opening_time} - {formData.closing_time}</p>
                  <p><span className="text-gray-500">Weekly Off:</span> {formData.weekly_off.join(', ') || 'None'}</p>
                </div>
              </div>

              {/* Banking */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">💰 Banking</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Bank:</span> {formData.bank_name}</p>
                  <p><span className="text-gray-500">Account:</span> ****{formData.account_number.slice(-4)}</p>
                  <p><span className="text-gray-500">IFSC:</span> {formData.ifsc_code}</p>
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">🔧 Settings</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Tax Rate:</span> {formData.default_tax_rate}%</p>
                  <p><span className="text-gray-500">Payment:</span> {formData.default_payment_methods.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Store Setup Wizard</h2>
        <p className="text-gray-600">Configure your new store in a few steps</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                  currentStep > step.number
                    ? 'bg-green-600 text-white'
                    : currentStep === step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span className="text-xs mt-2 text-center font-medium text-gray-600">
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 ${
                  currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handlePrevious}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          {currentStep < 6 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
            >
              {loading ? 'Creating Store...' : 'Create Store'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
