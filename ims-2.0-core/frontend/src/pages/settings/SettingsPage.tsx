// ============================================================================
// IMS 2.0 - Settings Page
// ============================================================================

import { useState } from 'react';
import {
  Settings,
  Store,
  Users,
  Tag,
  Percent,
  Bell,
  Shield,
  Database,
  Globe,
  ChevronRight,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import clsx from 'clsx';

type SettingsTab = 'store' | 'users' | 'categories' | 'discounts' | 'notifications' | 'system';

// Mock store settings
const mockStoreSettings = {
  storeCode: 'BV-KOL-001',
  storeName: 'Better Vision - Park Street',
  brand: 'BETTER_VISION',
  gstin: '19ABCDE1234F1Z5',
  address: '123 Park Street, Kolkata',
  phone: '033-2222-3333',
  email: 'parkstreet@bettervision.in',
  openingTime: '10:00',
  closingTime: '20:00',
  geoFenceRadius: 100,
  enabledCategories: ['FRAME', 'SUNGLASS', 'OPTICAL_LENS', 'CONTACT_LENS', 'ACCESSORIES'],
};

// Mock users
const mockUsers = [
  { id: 'u-001', name: 'Amit Kumar', email: 'amit@bettervision.in', role: 'STORE_MANAGER', status: 'ACTIVE' },
  { id: 'u-002', name: 'Priya Sharma', email: 'priya@bettervision.in', role: 'OPTOMETRIST', status: 'ACTIVE' },
  { id: 'u-003', name: 'Ravi Singh', email: 'ravi@bettervision.in', role: 'WORKSHOP_STAFF', status: 'ACTIVE' },
  { id: 'u-004', name: 'Sunita Das', email: 'sunita@bettervision.in', role: 'SALES_CASHIER', status: 'ACTIVE' },
  { id: 'u-005', name: 'Vikram Mehta', email: 'vikram@bettervision.in', role: 'SALES_STAFF', status: 'INACTIVE' },
];

// Mock discount rules
const mockDiscountRules = [
  { role: 'SALES_STAFF', maxPercent: 5, category: 'MASS' },
  { role: 'SALES_STAFF', maxPercent: 3, category: 'PREMIUM' },
  { role: 'SALES_STAFF', maxPercent: 0, category: 'LUXURY' },
  { role: 'STORE_MANAGER', maxPercent: 15, category: 'MASS' },
  { role: 'STORE_MANAGER', maxPercent: 10, category: 'PREMIUM' },
  { role: 'STORE_MANAGER', maxPercent: 5, category: 'LUXURY' },
];

const SETTINGS_SECTIONS = [
  { id: 'store' as SettingsTab, label: 'Store Settings', icon: Store, description: 'Store details, timings, and geo-fence' },
  { id: 'users' as SettingsTab, label: 'User Management', icon: Users, description: 'Manage staff and roles' },
  { id: 'categories' as SettingsTab, label: 'Categories', icon: Tag, description: 'Product categories and attributes' },
  { id: 'discounts' as SettingsTab, label: 'Discount Rules', icon: Percent, description: 'Role-based discount limits' },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell, description: 'Alert and notification settings' },
  { id: 'system' as SettingsTab, label: 'System', icon: Database, description: 'Backup, sync, and maintenance' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage store configuration and system settings</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <div className="card p-2">
            {SETTINGS_SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveTab(section.id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors',
                  activeTab === section.id
                    ? 'bg-bv-red-50 text-bv-red-600'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <section.icon className="w-5 h-5" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{section.label}</p>
                  <p className="text-xs text-gray-400 truncate">{section.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Store Settings */}
          {activeTab === 'store' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Store Settings</h2>
                <button className="btn-outline flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Store Code</label>
                  <p className="font-medium">{mockStoreSettings.storeCode}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Store Name</label>
                  <p className="font-medium">{mockStoreSettings.storeName}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">GSTIN</label>
                  <p className="font-medium">{mockStoreSettings.gstin}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Brand</label>
                  <p className="font-medium">{mockStoreSettings.brand.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Address</label>
                  <p className="font-medium">{mockStoreSettings.address}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Phone</label>
                  <p className="font-medium">{mockStoreSettings.phone}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Email</label>
                  <p className="font-medium">{mockStoreSettings.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Opening Time</label>
                  <p className="font-medium">{mockStoreSettings.openingTime}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Closing Time</label>
                  <p className="font-medium">{mockStoreSettings.closingTime}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Geo-Fence Radius</label>
                  <p className="font-medium">{mockStoreSettings.geoFenceRadius} meters</p>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <label className="block text-sm text-gray-500 mb-2">Enabled Categories</label>
                <div className="flex flex-wrap gap-2">
                  {mockStoreSettings.enabledCategories.map(cat => (
                    <span key={cat} className="badge-success">{cat.replace('_', ' ')}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <button className="btn-primary flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {mockUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={user.status === 'ACTIVE' ? 'badge-success' : 'badge-error'}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-gray-400 hover:text-bv-red-600">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Discounts */}
          {activeTab === 'discounts' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Discount Rules</h2>
                <button className="btn-outline flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Rules
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Maximum discount percentages by role and product category (Mass, Premium, Luxury)
              </p>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mass</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Premium</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Luxury</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium">Sales Staff</td>
                      <td className="px-4 py-3 text-center">5%</td>
                      <td className="px-4 py-3 text-center">3%</td>
                      <td className="px-4 py-3 text-center text-red-500">0%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Sales Cashier</td>
                      <td className="px-4 py-3 text-center">10%</td>
                      <td className="px-4 py-3 text-center">5%</td>
                      <td className="px-4 py-3 text-center">3%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Store Manager</td>
                      <td className="px-4 py-3 text-center">15%</td>
                      <td className="px-4 py-3 text-center">10%</td>
                      <td className="px-4 py-3 text-center">5%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">Admin</td>
                      <td className="px-4 py-3 text-center text-green-600">Unlimited</td>
                      <td className="px-4 py-3 text-center text-green-600">Unlimited</td>
                      <td className="px-4 py-3 text-center text-green-600">Unlimited</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Categories */}
          {activeTab === 'categories' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Product Categories</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { code: 'FRAME', label: 'Frames', hsn: '900311', enabled: true },
                  { code: 'SUNGLASS', label: 'Sunglasses', hsn: '900410', enabled: true },
                  { code: 'READING_GLASSES', label: 'Reading Glasses', hsn: '900490', enabled: true },
                  { code: 'OPTICAL_LENS', label: 'Optical Lenses', hsn: '900150', enabled: true },
                  { code: 'CONTACT_LENS', label: 'Contact Lenses', hsn: '90013100', enabled: true },
                  { code: 'COLORED_CONTACT_LENS', label: 'Colored Contact Lenses', hsn: '90013100', enabled: true },
                  { code: 'WATCH', label: 'Watches', hsn: '9101', enabled: true },
                  { code: 'SMARTWATCH', label: 'Smartwatches', hsn: '8517', enabled: true },
                  { code: 'SMARTGLASSES', label: 'Smart Glasses', hsn: '900490', enabled: false },
                  { code: 'WALL_CLOCK', label: 'Wall Clocks', hsn: '9105', enabled: true },
                  { code: 'ACCESSORIES', label: 'Accessories', hsn: '9004', enabled: true },
                  { code: 'SERVICES', label: 'Services', hsn: '9987', enabled: true },
                ].map(cat => (
                  <div key={cat.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500">HSN: {cat.hsn}</p>
                    </div>
                    {cat.enabled ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Notification Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Low Stock Alerts', description: 'Get notified when stock falls below threshold', enabled: true },
                  { label: 'Order Ready Notifications', description: 'Notify customers when order is ready', enabled: true },
                  { label: 'Payment Reminders', description: 'Send payment reminders for pending dues', enabled: false },
                  { label: 'Workshop Updates', description: 'Send job progress updates to customers', enabled: true },
                  { label: 'Eye Test Reminders', description: 'Annual eye test reminder to customers', enabled: false },
                ].map((setting, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    {setting.enabled ? (
                      <ToggleRight className="w-6 h-6 text-green-600 cursor-pointer" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400 cursor-pointer" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Database</p>
                    <p className="font-medium text-green-600">Connected</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Last Sync</p>
                    <p className="font-medium text-green-600">2 min ago</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">API Status</p>
                    <p className="font-medium text-green-600">Healthy</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h2>
                <div className="space-y-3">
                  <button className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Backup Data</p>
                      <p className="text-sm text-gray-500">Create a backup of store data</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Clear Cache</p>
                      <p className="text-sm text-gray-500">Clear application cache</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Sync Products</p>
                      <p className="text-sm text-gray-500">Sync product catalog from HQ</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
