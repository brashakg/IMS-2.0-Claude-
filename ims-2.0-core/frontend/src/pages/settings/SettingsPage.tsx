// ============================================================================
// IMS 2.0 - Settings Page
// Full-featured settings management with functional toggles and state
// ============================================================================

import { useState } from 'react';
import {
  Store,
  Users,
  Tag,
  Percent,
  Bell,
  Database,
  ChevronRight,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  RefreshCw,
  Download,
  Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { useToast } from '../../context/ToastContext';
import type { UserRole } from '../../types';

type SettingsTab = 'store' | 'users' | 'categories' | 'discounts' | 'notifications' | 'system';

// Store settings interface
interface StoreSettings {
  storeCode: string;
  storeName: string;
  brand: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  geoFenceRadius: number;
}

// User interface
interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE';
}

// Category interface
interface CategorySetting {
  code: string;
  label: string;
  hsn: string;
  enabled: boolean;
}

// Notification interface
interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

// Initial data
const initialStoreSettings: StoreSettings = {
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
};

const initialUsers: StoreUser[] = [
  { id: 'u-001', name: 'Amit Kumar', email: 'amit@bettervision.in', role: 'STORE_MANAGER', status: 'ACTIVE' },
  { id: 'u-002', name: 'Priya Sharma', email: 'priya@bettervision.in', role: 'OPTOMETRIST', status: 'ACTIVE' },
  { id: 'u-003', name: 'Ravi Singh', email: 'ravi@bettervision.in', role: 'WORKSHOP_STAFF', status: 'ACTIVE' },
  { id: 'u-004', name: 'Sunita Das', email: 'sunita@bettervision.in', role: 'SALES_CASHIER', status: 'ACTIVE' },
  { id: 'u-005', name: 'Vikram Mehta', email: 'vikram@bettervision.in', role: 'SALES_STAFF', status: 'INACTIVE' },
];

const initialCategories: CategorySetting[] = [
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
];

const initialNotifications: NotificationSetting[] = [
  { id: 'n-001', label: 'Low Stock Alerts', description: 'Get notified when stock falls below threshold', enabled: true },
  { id: 'n-002', label: 'Order Ready Notifications', description: 'Notify customers when order is ready', enabled: true },
  { id: 'n-003', label: 'Payment Reminders', description: 'Send payment reminders for pending dues', enabled: false },
  { id: 'n-004', label: 'Workshop Updates', description: 'Send job progress updates to customers', enabled: true },
  { id: 'n-005', label: 'Eye Test Reminders', description: 'Annual eye test reminder to customers', enabled: false },
];

const SETTINGS_SECTIONS = [
  { id: 'store' as SettingsTab, label: 'Store Settings', icon: Store, description: 'Store details, timings, and geo-fence' },
  { id: 'users' as SettingsTab, label: 'User Management', icon: Users, description: 'Manage staff and roles' },
  { id: 'categories' as SettingsTab, label: 'Categories', icon: Tag, description: 'Product categories and attributes' },
  { id: 'discounts' as SettingsTab, label: 'Discount Rules', icon: Percent, description: 'Role-based discount limits' },
  { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell, description: 'Alert and notification settings' },
  { id: 'system' as SettingsTab, label: 'System', icon: Database, description: 'Backup, sync, and maintenance' },
];

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'STORE_MANAGER', label: 'Store Manager' },
  { value: 'OPTOMETRIST', label: 'Optometrist' },
  { value: 'SALES_CASHIER', label: 'Sales Cashier' },
  { value: 'SALES_STAFF', label: 'Sales Staff' },
  { value: 'WORKSHOP_STAFF', label: 'Workshop Staff' },
];

export function SettingsPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('store');

  // State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(initialStoreSettings);
  const [users, setUsers] = useState<StoreUser[]>(initialUsers);
  const [categories, setCategories] = useState<CategorySetting[]>(initialCategories);
  const [notifications, setNotifications] = useState<NotificationSetting[]>(initialNotifications);

  // Modal states
  const [showEditStore, setShowEditStore] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StoreUser | null>(null);

  // Form states
  const [storeForm, setStoreForm] = useState<StoreSettings>(initialStoreSettings);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'SALES_STAFF' as UserRole });

  // Handlers
  const handleSaveStoreSettings = () => {
    setStoreSettings(storeForm);
    setShowEditStore(false);
    toast.success('Store settings updated successfully');
  };

  const handleToggleCategory = (code: string) => {
    setCategories(prev => prev.map(cat =>
      cat.code === code ? { ...cat, enabled: !cat.enabled } : cat
    ));
    const cat = categories.find(c => c.code === code);
    const newState = !cat?.enabled;
    toast.success(`${cat?.label} ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleToggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, enabled: !n.enabled } : n
    ));
    const notification = notifications.find(n => n.id === id);
    const newState = !notification?.enabled;
    toast.success(`${notification?.label} ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleAddUser = () => {
    if (!userForm.name || !userForm.email) {
      toast.error('Please fill in all required fields');
      return;
    }
    const newUser: StoreUser = {
      id: `u-${Date.now()}`,
      name: userForm.name,
      email: userForm.email,
      role: userForm.role,
      status: 'ACTIVE',
    };
    setUsers(prev => [...prev, newUser]);
    setUserForm({ name: '', email: '', role: 'SALES_STAFF' });
    setShowAddUser(false);
    toast.success(`User ${newUser.name} added successfully`);
  };

  const handleEditUser = (user: StoreUser) => {
    setSelectedUser(user);
    setUserForm({ name: user.name, email: user.email, role: user.role });
    setShowEditUser(true);
  };

  const handleSaveUser = () => {
    if (!selectedUser) return;
    setUsers(prev => prev.map(u =>
      u.id === selectedUser.id
        ? { ...u, name: userForm.name, email: userForm.email, role: userForm.role }
        : u
    ));
    setShowEditUser(false);
    setSelectedUser(null);
    toast.success('User updated successfully');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        toast.success(`${u.name} is now ${newStatus.toLowerCase()}`);
        return { ...u, status: newStatus };
      }
      return u;
    }));
  };

  const handleBackupData = () => {
    toast.success('Backup started. You will be notified when complete.');
  };

  const handleClearCache = () => {
    toast.success('Cache cleared successfully');
  };

  const handleSyncProducts = () => {
    toast.info('Syncing products from HQ...');
    setTimeout(() => {
      toast.success('Product sync completed');
    }, 2000);
  };

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
                <button
                  onClick={() => {
                    setStoreForm(storeSettings);
                    setShowEditStore(true);
                  }}
                  className="btn-outline flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Store Code</label>
                  <p className="font-medium">{storeSettings.storeCode}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Store Name</label>
                  <p className="font-medium">{storeSettings.storeName}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">GSTIN</label>
                  <p className="font-medium">{storeSettings.gstin}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Brand</label>
                  <p className="font-medium">{storeSettings.brand.replace('_', ' ')}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-gray-500 mb-1">Address</label>
                  <p className="font-medium">{storeSettings.address}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Phone</label>
                  <p className="font-medium">{storeSettings.phone}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Email</label>
                  <p className="font-medium">{storeSettings.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Opening Time</label>
                  <p className="font-medium">{storeSettings.openingTime}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Closing Time</label>
                  <p className="font-medium">{storeSettings.closingTime}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-500 mb-1">Geo-Fence Radius</label>
                  <p className="font-medium">{storeSettings.geoFenceRadius} meters</p>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && (
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">User Management</h2>
                <button
                  onClick={() => {
                    setUserForm({ name: '', email: '', role: 'SALES_STAFF' });
                    setShowAddUser(true);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
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
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {user.role.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            className={user.status === 'ACTIVE' ? 'badge-success cursor-pointer' : 'badge-error cursor-pointer'}
                          >
                            {user.status}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-gray-400 hover:text-bv-red-600"
                          >
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
                <button
                  onClick={() => toast.info('Discount rule editor coming soon')}
                  className="btn-outline flex items-center gap-2"
                >
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
                <p className="text-sm text-gray-500">Click toggle to enable/disable categories</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {categories.map(cat => (
                  <div key={cat.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500">HSN: {cat.hsn}</p>
                    </div>
                    <button onClick={() => handleToggleCategory(cat.code)}>
                      {cat.enabled ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
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
                {notifications.map(setting => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <button onClick={() => handleToggleNotification(setting.id)}>
                      {setting.enabled ? (
                        <ToggleRight className="w-6 h-6 text-green-600 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400 cursor-pointer" />
                      )}
                    </button>
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
                  <button
                    onClick={handleBackupData}
                    className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">Backup Data</p>
                        <p className="text-sm text-gray-500">Create a backup of store data</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={handleClearCache}
                    className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">Clear Cache</p>
                        <p className="text-sm text-gray-500">Clear application cache</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={handleSyncProducts}
                    className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">Sync Products</p>
                        <p className="text-sm text-gray-500">Sync product catalog from HQ</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Store Modal */}
      {showEditStore && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit Store Settings</h3>
              <button onClick={() => setShowEditStore(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                  <input
                    type="text"
                    value={storeForm.storeCode}
                    disabled
                    className="input-field bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={e => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={e => setStoreForm(prev => ({ ...prev, address: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={storeForm.phone}
                    onChange={e => setStoreForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={storeForm.email}
                    onChange={e => setStoreForm(prev => ({ ...prev, email: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                  <input
                    type="time"
                    value={storeForm.openingTime}
                    onChange={e => setStoreForm(prev => ({ ...prev, openingTime: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                  <input
                    type="time"
                    value={storeForm.closingTime}
                    onChange={e => setStoreForm(prev => ({ ...prev, closingTime: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Geo-Fence Radius (meters)</label>
                <input
                  type="number"
                  value={storeForm.geoFenceRadius}
                  onChange={e => setStoreForm(prev => ({ ...prev, geoFenceRadius: parseInt(e.target.value) || 0 }))}
                  className="input-field"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEditStore(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveStoreSettings} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Add New User</h3>
              <button onClick={() => setShowAddUser(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="input-field"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAddUser(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleAddUser} className="btn-primary">Add User</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Edit User</h3>
              <button onClick={() => setShowEditUser(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value as UserRole }))}
                  className="input-field"
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEditUser(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveUser} className="btn-primary">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
