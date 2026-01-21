// ============================================================================
// IMS 2.0 - Vendor Management Component
// Supplier/vendor CRUD with performance tracking and order history
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface Vendor {
  id: string;
  vendor_code: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  pan?: string;
  payment_terms: number; // days
  credit_limit: number;
  current_outstanding: number;
  categories: string[];
  brands: string[];
  status: 'active' | 'inactive' | 'blacklisted';
  rating: number;
  total_orders: number;
  total_value: number;
  avg_lead_time: number; // days
  on_time_delivery_rate: number;
  quality_rating: number;
  created_at: string;
  last_order_date?: string;
  bank_details?: {
    account_name: string;
    account_number: string;
    bank_name: string;
    ifsc: string;
  };
  notes?: string;
}

interface VendorOrder {
  id: string;
  po_number: string;
  order_date: string;
  expected_date: string;
  received_date?: string;
  total_value: number;
  status: 'pending' | 'partial' | 'received' | 'cancelled';
  items_count: number;
}

interface Props {
  onVendorSelect?: (vendorId: string) => void;
}

export const VendorManagement: React.FC<Props> = ({ onVendorSelect }) => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'performance'>('list');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [vendorOrders, setVendorOrders] = useState<VendorOrder[]>([]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    pan: '',
    payment_terms: 30,
    credit_limit: 0,
    categories: [],
    brands: [],
    status: 'active',
    notes: ''
  });
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');

  const categories = ['Frames', 'Sunglasses', 'Lenses', 'Contact Lenses', 'Solutions', 'Accessories'];
  const brands = ['Ray-Ban', 'Titan', 'Vogue', 'Oakley', 'Bausch & Lomb', 'Johnson & Johnson', 'Essilor', 'Zeiss'];

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vendors, searchQuery, statusFilter, categoryFilter]);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory/vendors');
      setVendors(response.data || []);
    } catch (error) {
      // Mock data
      setVendors([
        {
          id: 'VND001',
          vendor_code: 'VND001',
          name: 'Luxottica India Pvt. Ltd.',
          contact_person: 'Rakesh Sharma',
          phone: '9876543210',
          email: 'orders@luxottica.in',
          address: '123, Industrial Area',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400059',
          gstin: '27AABCL1234A1Z5',
          pan: 'AABCL1234A',
          payment_terms: 45,
          credit_limit: 1000000,
          current_outstanding: 450000,
          categories: ['Frames', 'Sunglasses'],
          brands: ['Ray-Ban', 'Oakley', 'Vogue'],
          status: 'active',
          rating: 4.5,
          total_orders: 156,
          total_value: 15600000,
          avg_lead_time: 7,
          on_time_delivery_rate: 92,
          quality_rating: 4.8,
          created_at: '2022-01-15',
          last_order_date: '2024-02-18'
        },
        {
          id: 'VND002',
          vendor_code: 'VND002',
          name: 'Titan Eyeplus Distributors',
          contact_person: 'Priya Gupta',
          phone: '9123456789',
          email: 'supply@titaneyeplus.com',
          address: '456, MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          gstin: '29AABCT5678B1Z2',
          pan: 'AABCT5678B',
          payment_terms: 30,
          credit_limit: 500000,
          current_outstanding: 125000,
          categories: ['Frames', 'Sunglasses'],
          brands: ['Titan'],
          status: 'active',
          rating: 4.2,
          total_orders: 89,
          total_value: 8500000,
          avg_lead_time: 5,
          on_time_delivery_rate: 88,
          quality_rating: 4.5,
          created_at: '2022-06-20',
          last_order_date: '2024-02-15'
        },
        {
          id: 'VND003',
          vendor_code: 'VND003',
          name: 'Essilor India Pvt. Ltd.',
          contact_person: 'Amit Patel',
          phone: '9988776655',
          email: 'lenses@essilor.in',
          address: '789, Cyber City',
          city: 'Gurgaon',
          state: 'Haryana',
          pincode: '122002',
          gstin: '06AABCE9012C1Z3',
          pan: 'AABCE9012C',
          payment_terms: 60,
          credit_limit: 2000000,
          current_outstanding: 800000,
          categories: ['Lenses'],
          brands: ['Essilor', 'Crizal'],
          status: 'active',
          rating: 4.7,
          total_orders: 234,
          total_value: 28000000,
          avg_lead_time: 3,
          on_time_delivery_rate: 96,
          quality_rating: 4.9,
          created_at: '2021-03-10',
          last_order_date: '2024-02-20'
        },
        {
          id: 'VND004',
          vendor_code: 'VND004',
          name: 'Johnson & Johnson Vision',
          contact_person: 'Sunita Verma',
          phone: '9111222333',
          email: 'contactlens@jnj.com',
          address: '101, Sector 18',
          city: 'Noida',
          state: 'Uttar Pradesh',
          pincode: '201301',
          gstin: '09AABCJ3456D1Z4',
          pan: 'AABCJ3456D',
          payment_terms: 30,
          credit_limit: 750000,
          current_outstanding: 0,
          categories: ['Contact Lenses', 'Solutions'],
          brands: ['Acuvue', 'Johnson & Johnson'],
          status: 'active',
          rating: 4.6,
          total_orders: 178,
          total_value: 12500000,
          avg_lead_time: 4,
          on_time_delivery_rate: 94,
          quality_rating: 4.7,
          created_at: '2021-09-01',
          last_order_date: '2024-02-19'
        },
        {
          id: 'VND005',
          vendor_code: 'VND005',
          name: 'Local Frames Supplier',
          contact_person: 'Raju Bhai',
          phone: '9444555666',
          email: 'local@frames.com',
          address: '50, Crawford Market',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          payment_terms: 15,
          credit_limit: 100000,
          current_outstanding: 75000,
          categories: ['Frames', 'Accessories'],
          brands: [],
          status: 'inactive',
          rating: 3.2,
          total_orders: 45,
          total_value: 450000,
          avg_lead_time: 2,
          on_time_delivery_rate: 70,
          quality_rating: 3.0,
          created_at: '2023-01-01',
          last_order_date: '2023-12-15'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorOrders = async (vendorId: string) => {
    try {
      const response = await apiClient.get(`/inventory/vendors/${vendorId}/orders`);
      setVendorOrders(response.data || []);
    } catch (error) {
      // Mock data
      setVendorOrders([
        {
          id: 'PO001',
          po_number: 'PO/2024/0125',
          order_date: '2024-02-18',
          expected_date: '2024-02-25',
          total_value: 125000,
          status: 'pending',
          items_count: 15
        },
        {
          id: 'PO002',
          po_number: 'PO/2024/0098',
          order_date: '2024-02-10',
          expected_date: '2024-02-17',
          received_date: '2024-02-16',
          total_value: 89000,
          status: 'received',
          items_count: 12
        },
        {
          id: 'PO003',
          po_number: 'PO/2024/0075',
          order_date: '2024-02-01',
          expected_date: '2024-02-08',
          received_date: '2024-02-09',
          total_value: 156000,
          status: 'received',
          items_count: 20
        }
      ]);
    }
  };

  const applyFilters = () => {
    let filtered = [...vendors];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(query) ||
        v.vendor_code.toLowerCase().includes(query) ||
        v.contact_person.toLowerCase().includes(query) ||
        v.phone.includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(v => v.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(v => v.categories.includes(categoryFilter));
    }

    setFilteredVendors(filtered);
  };

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    loadVendorOrders(vendor.id);
    onVendorSelect?.(vendor.id);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setFormData(vendor);
    setFormMode('edit');
    setActiveTab('add');
  };

  const handleSubmit = async () => {
    try {
      if (formMode === 'add') {
        const response = await apiClient.post('/inventory/vendors', formData);
        setVendors(prev => [...prev, { ...formData, id: response.data?.id || `VND${Date.now()}` } as Vendor]);
      } else {
        await apiClient.put(`/inventory/vendors/${formData.id}`, formData);
        setVendors(prev => prev.map(v => v.id === formData.id ? { ...v, ...formData } as Vendor : v));
      }
      resetForm();
      setActiveTab('list');
    } catch (error) {
      // For demo, update locally
      if (formMode === 'add') {
        const newVendor: Vendor = {
          ...formData,
          id: `VND${Date.now()}`,
          vendor_code: `VND${vendors.length + 1}`.padStart(6, '0'),
          rating: 0,
          total_orders: 0,
          total_value: 0,
          avg_lead_time: 0,
          on_time_delivery_rate: 0,
          quality_rating: 0,
          current_outstanding: 0,
          created_at: new Date().toISOString()
        } as Vendor;
        setVendors(prev => [...prev, newVendor]);
      } else {
        setVendors(prev => prev.map(v => v.id === formData.id ? { ...v, ...formData } as Vendor : v));
      }
      resetForm();
      setActiveTab('list');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      pan: '',
      payment_terms: 30,
      credit_limit: 0,
      categories: [],
      brands: [],
      status: 'active',
      notes: ''
    });
    setFormMode('add');
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: Vendor['status']): string => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      blacklisted: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getOrderStatusColor = (status: VendorOrder['status']): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      partial: 'bg-blue-100 text-blue-700',
      received: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-sm ${
            i < fullStars ? 'text-yellow-400' :
            i === fullStars && hasHalfStar ? 'text-yellow-400' : 'text-gray-300'
          }`}>
            ★
          </span>
        ))}
        <span className="text-xs text-gray-500 ml-1">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const renderVendorList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendors..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button
          onClick={() => { resetForm(); setActiveTab('add'); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Vendor
        </button>
      </div>

      {/* Vendor Cards */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No vendors found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              onClick={() => handleSelectVendor(vendor)}
              className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow ${
                selectedVendor?.id === vendor.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{vendor.name}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{vendor.vendor_code}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditVendor(vendor); }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ✏️
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-500">Contact:</span>
                  <p className="font-medium">{vendor.contact_person}</p>
                  <p className="text-gray-600">{vendor.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Outstanding:</span>
                  <p className={`font-medium ${
                    vendor.current_outstanding > vendor.credit_limit * 0.8 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(vendor.current_outstanding)}
                  </p>
                  <p className="text-xs text-gray-500">of {formatCurrency(vendor.credit_limit)} limit</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {vendor.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {cat}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  {renderRatingStars(vendor.rating)}
                  <span className="text-xs text-gray-500">{vendor.total_orders} orders</span>
                </div>
                <span className="text-xs text-gray-500">
                  Lead: {vendor.avg_lead_time}d • OTD: {vendor.on_time_delivery_rate}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Vendor Details */}
      {selectedVendor && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{selectedVendor.name}</h3>
              <p className="text-gray-500">{selectedVendor.address}, {selectedVendor.city}, {selectedVendor.state} - {selectedVendor.pincode}</p>
            </div>
            <button
              onClick={() => setSelectedVendor(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Total Orders</span>
              <p className="text-xl font-bold text-gray-900">{selectedVendor.total_orders}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Total Value</span>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(selectedVendor.total_value)}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">On-Time Delivery</span>
              <p className="text-xl font-bold text-green-600">{selectedVendor.on_time_delivery_rate}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <span className="text-xs text-gray-500">Quality Rating</span>
              <p className="text-xl font-bold text-blue-600">{selectedVendor.quality_rating}/5</p>
            </div>
          </div>

          {/* Recent Orders */}
          <h4 className="font-medium text-gray-900 mb-3">Recent Orders</h4>
          <div className="space-y-2">
            {vendorOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.po_number}</p>
                  <p className="text-xs text-gray-500">
                    Ordered: {order.order_date} • Expected: {order.expected_date}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium">{formatCurrency(order.total_value)}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${getOrderStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAddEditForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {formMode === 'add' ? 'Add New Vendor' : 'Edit Vendor'}
        </h3>
        <button
          onClick={() => { resetForm(); setActiveTab('list'); }}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 border-b pb-2">Basic Information</h4>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700 border-b pb-2">Business Information</h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                maxLength={15}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                maxLength={10}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.payment_terms}
                onChange={(e) => setFormData(prev => ({ ...prev, payment_terms: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit</label>
              <input
                type="number"
                value={formData.credit_limit}
                onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Vendor['status'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={formData.categories?.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, categories: [...(prev.categories || []), cat] }));
                      } else {
                        setFormData(prev => ({ ...prev, categories: prev.categories?.filter(c => c !== cat) || [] }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brands</label>
            <div className="flex flex-wrap gap-2">
              {brands.map(brand => (
                <label key={brand} className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={formData.brands?.includes(brand)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, brands: [...(prev.brands || []), brand] }));
                      } else {
                        setFormData(prev => ({ ...prev, brands: prev.brands?.filter(b => b !== brand) || [] }));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          onClick={() => { resetForm(); setActiveTab('list'); }}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.contact_person || !formData.phone}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
        >
          {formMode === 'add' ? 'Add Vendor' : 'Save Changes'}
        </button>
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Vendor Performance Overview</h3>

      {/* Performance Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Lead Time</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">OTD %</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Overall Rating</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vendors
              .filter(v => v.status === 'active')
              .sort((a, b) => b.rating - a.rating)
              .map(vendor => (
                <tr key={vendor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.vendor_code}</p>
                  </td>
                  <td className="px-4 py-3 text-center">{vendor.total_orders}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(vendor.total_value)}</td>
                  <td className="px-4 py-3 text-center">{vendor.avg_lead_time} days</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-medium ${
                      vendor.on_time_delivery_rate >= 90 ? 'text-green-600' :
                      vendor.on_time_delivery_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {vendor.on_time_delivery_rate}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{vendor.quality_rating}/5</td>
                  <td className="px-4 py-3 text-center">{renderRatingStars(vendor.rating)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
        <p className="text-gray-600">Manage suppliers and track performance</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'list', label: 'Vendor List' },
          { id: 'add', label: formMode === 'edit' ? 'Edit Vendor' : 'Add Vendor' },
          { id: 'performance', label: 'Performance' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'list' && renderVendorList()}
        {activeTab === 'add' && renderAddEditForm()}
        {activeTab === 'performance' && renderPerformance()}
      </div>
    </div>
  );
};
