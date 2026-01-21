// ============================================================================
// IMS 2.0 - Store Settings Component
// ============================================================================
// Store-level configuration: Operating hours, geofencing, staff limits, etc.

import { useState } from 'react';
import {
  Store,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  Globe,
  Save,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';

// Store Types
interface StoreHours {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  address: string;
}

interface StoreConfig {
  id: string;
  name: string;
  code: string;
  type: 'FLAGSHIP' | 'REGULAR' | 'KIOSK';
  status: 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_CLOSED';

  // Contact
  phone: string;
  email: string;
  whatsapp?: string;

  // Location
  address: string;
  city: string;
  state: string;
  pincode: string;
  geofence: GeofenceConfig;

  // Operations
  operatingHours: StoreHours[];
  maxStaffPerShift: number;
  minStaffPerShift: number;
  targetFootfall: number;
  targetSales: number;

  // Settings
  allowCashPayments: boolean;
  allowCreditSales: boolean;
  maxCreditLimit: number;
  autoCloseRegister: boolean;
  requirePhotoAttendance: boolean;

  // Tax
  gstin: string;
  stateTaxCode: string;
}

// Default Store Data
const defaultStore: StoreConfig = {
  id: 'store-001',
  name: 'Mumbai Central Store',
  code: 'MUM-01',
  type: 'FLAGSHIP',
  status: 'ACTIVE',
  phone: '+91 22 1234 5678',
  email: 'mumbai.central@brahmaoptics.com',
  whatsapp: '+91 98765 43210',
  address: '123, Ground Floor, ABC Complex',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  geofence: {
    latitude: 18.9388,
    longitude: 72.8354,
    radiusMeters: 100,
    address: '123, Ground Floor, ABC Complex, Mumbai - 400001',
  },
  operatingHours: [
    { day: 'Monday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
    { day: 'Tuesday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
    { day: 'Wednesday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
    { day: 'Thursday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
    { day: 'Friday', isOpen: true, openTime: '10:00', closeTime: '21:00' },
    { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '22:00' },
    { day: 'Sunday', isOpen: true, openTime: '11:00', closeTime: '20:00' },
  ],
  maxStaffPerShift: 6,
  minStaffPerShift: 2,
  targetFootfall: 50,
  targetSales: 100000,
  allowCashPayments: true,
  allowCreditSales: true,
  maxCreditLimit: 50000,
  autoCloseRegister: true,
  requirePhotoAttendance: true,
  gstin: '27AABCU9603R1ZM',
  stateTaxCode: 'MH',
};

// Section Component
function SettingsSection({
  title,
  icon: Icon,
  children,
  defaultExpanded = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-bv-red-50 rounded-lg">
            <Icon className="w-5 h-5 text-bv-red-600" />
          </div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>
      {expanded && <div className="mt-4">{children}</div>}
    </div>
  );
}

// Toggle Switch
function Toggle({
  enabled,
  onChange,
  label,
  description,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={clsx(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-bv-red-600' : 'bg-gray-300'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}

// Main Store Settings Component
export function StoreSettings() {
  const [store, setStore] = useState<StoreConfig>(defaultStore);
  const [hasChanges, setHasChanges] = useState(false);

  const updateStore = <K extends keyof StoreConfig>(key: K, value: StoreConfig[K]) => {
    setStore({ ...store, [key]: value });
    setHasChanges(true);
  };

  const updateHours = (dayIndex: number, field: keyof StoreHours, value: any) => {
    const newHours = [...store.operatingHours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    updateStore('operatingHours', newHours);
  };

  const handleSave = () => {
    alert('Store settings saved successfully!');
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-500 mt-1">Configure store-level settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            store.status === 'ACTIVE' && 'bg-green-100 text-green-700',
            store.status === 'INACTIVE' && 'bg-gray-100 text-gray-700',
            store.status === 'TEMPORARILY_CLOSED' && 'bg-yellow-100 text-yellow-700'
          )}>
            {store.status.replace('_', ' ')}
          </span>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              hasChanges
                ? 'bg-bv-red-600 text-white hover:bg-bv-red-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Basic Info */}
      <SettingsSection title="Basic Information" icon={Store}>
        <div className="grid tablet:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              value={store.name}
              onChange={(e) => updateStore('name', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
            <input
              type="text"
              value={store.code}
              onChange={(e) => updateStore('code', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store Type</label>
            <select
              value={store.type}
              onChange={(e) => updateStore('type', e.target.value as StoreConfig['type'])}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="FLAGSHIP">Flagship Store</option>
              <option value="REGULAR">Regular Store</option>
              <option value="KIOSK">Kiosk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={store.status}
              onChange={(e) => updateStore('status', e.target.value as StoreConfig['status'])}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
            </select>
          </div>
        </div>
      </SettingsSection>

      {/* Contact Info */}
      <SettingsSection title="Contact Information" icon={Phone}>
        <div className="grid tablet:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={store.phone}
              onChange={(e) => updateStore('phone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={store.whatsapp || ''}
              onChange={(e) => updateStore('whatsapp', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="tablet:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={store.email}
              onChange={(e) => updateStore('email', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Location & Geofence */}
      <SettingsSection title="Location & Geofencing" icon={MapPin}>
        <div className="space-y-4">
          <div className="grid tablet:grid-cols-2 gap-4">
            <div className="tablet:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={store.address}
                onChange={(e) => updateStore('address', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={store.city}
                onChange={(e) => updateStore('city', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={store.state}
                onChange={(e) => updateStore('state', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={store.pincode}
                onChange={(e) => updateStore('pincode', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {/* Geofence Settings */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-3">Geofence for Attendance</h4>
            <div className="grid tablet:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={store.geofence.latitude}
                  onChange={(e) => updateStore('geofence', { ...store.geofence, latitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={store.geofence.longitude}
                  onChange={(e) => updateStore('geofence', { ...store.geofence, longitude: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
                <input
                  type="number"
                  value={store.geofence.radiusMeters}
                  onChange={(e) => updateStore('geofence', { ...store.geofence, radiusMeters: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Employees must be within {store.geofence.radiusMeters}m of store location to check in/out
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Operating Hours */}
      <SettingsSection title="Operating Hours" icon={Clock}>
        <div className="space-y-3">
          {store.operatingHours.map((hours, index) => (
            <div
              key={hours.day}
              className={clsx(
                'flex flex-wrap items-center gap-4 p-3 rounded-lg',
                hours.isOpen ? 'bg-green-50' : 'bg-gray-50'
              )}
            >
              <div className="w-24">
                <span className="font-medium text-gray-900">{hours.day}</span>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hours.isOpen}
                  onChange={(e) => updateHours(index, 'isOpen', e.target.checked)}
                  className="rounded text-bv-red-600"
                />
                <span className="text-sm text-gray-600">Open</span>
              </label>
              {hours.isOpen && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={hours.openTime}
                      onChange={(e) => updateHours(index, 'openTime', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="time"
                      value={hours.closeTime}
                      onChange={(e) => updateHours(index, 'closeTime', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Staff Settings */}
      <SettingsSection title="Staff Settings" icon={Users}>
        <div className="grid tablet:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Staff per Shift</label>
            <input
              type="number"
              min="1"
              value={store.minStaffPerShift}
              onChange={(e) => updateStore('minStaffPerShift', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Staff per Shift</label>
            <input
              type="number"
              min="1"
              value={store.maxStaffPerShift}
              onChange={(e) => updateStore('maxStaffPerShift', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Footfall Target</label>
            <input
              type="number"
              value={store.targetFootfall}
              onChange={(e) => updateStore('targetFootfall', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Sales Target (₹)</label>
            <input
              type="number"
              value={store.targetSales}
              onChange={(e) => updateStore('targetSales', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <Toggle
            enabled={store.requirePhotoAttendance}
            onChange={(val) => updateStore('requirePhotoAttendance', val)}
            label="Require Photo for Attendance"
            description="Employees must take a selfie when checking in/out"
          />
        </div>
      </SettingsSection>

      {/* Payment Settings */}
      <SettingsSection title="Payment & Credit Settings" icon={Globe} defaultExpanded={false}>
        <Toggle
          enabled={store.allowCashPayments}
          onChange={(val) => updateStore('allowCashPayments', val)}
          label="Allow Cash Payments"
          description="Enable cash payment option at POS"
        />
        <Toggle
          enabled={store.allowCreditSales}
          onChange={(val) => updateStore('allowCreditSales', val)}
          label="Allow Credit Sales"
          description="Enable selling on credit to customers"
        />
        {store.allowCreditSales && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Credit Limit (₹)</label>
            <input
              type="number"
              value={store.maxCreditLimit}
              onChange={(e) => updateStore('maxCreditLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        )}
        <Toggle
          enabled={store.autoCloseRegister}
          onChange={(val) => updateStore('autoCloseRegister', val)}
          label="Auto-Close Register"
          description="Automatically close register at store closing time"
        />
      </SettingsSection>

      {/* Tax Settings */}
      <SettingsSection title="Tax & GST Settings" icon={Globe} defaultExpanded={false}>
        <div className="grid tablet:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input
              type="text"
              value={store.gstin}
              onChange={(e) => updateStore('gstin', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-mono"
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State Tax Code</label>
            <input
              type="text"
              value={store.stateTaxCode}
              onChange={(e) => updateStore('stateTaxCode', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          GST @ 18% will be split as CGST (9%) + SGST (9%) for intra-state or IGST (18%) for inter-state
        </p>
      </SettingsSection>
    </div>
  );
}

export default StoreSettings;
