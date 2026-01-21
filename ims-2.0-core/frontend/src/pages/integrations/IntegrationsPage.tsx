// ============================================================================
// IMS 2.0 - Integrations Management Page
// ============================================================================
// Configure and manage all third-party integrations from a single dashboard

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import type { IntegrationConfig, IntegrationType, IntegrationStatus } from '../../types';
import clsx from 'clsx';
import {
  Settings,
  Check,
  X,
  RefreshCw,
  AlertTriangle,
  Zap,
  ShoppingCart,
  Calculator,
  CreditCard,
  MessageCircle,
  Truck,
  BarChart3,
  Instagram,
  Building2,
  MessageSquare,
  Mail,
  ChevronRight,
  Eye,
  EyeOff,
  Save,
  TestTube,
  Activity,
  Clock,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// Integration Metadata
// ============================================================================

interface IntegrationMeta {
  type: IntegrationType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  category: 'ecommerce' | 'accounting' | 'payments' | 'communication' | 'shipping' | 'marketing' | 'compliance';
  fields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'email' | 'number' | 'url';
    placeholder: string;
    required: boolean;
  }[];
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    type: 'SHOPIFY',
    name: 'Shopify',
    description: 'E-commerce platform for online orders and inventory sync',
    icon: ShoppingCart,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    category: 'ecommerce',
    fields: [
      { key: 'store_url', label: 'Store URL', type: 'url', placeholder: 'your-store.myshopify.com', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key', required: true },
      { key: 'api_secret', label: 'API Secret', type: 'password', placeholder: 'Enter API secret', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'shpat_xxxxx', required: true },
    ],
  },
  {
    type: 'TALLY',
    name: 'Tally Prime',
    description: 'Accounting software integration for financial sync',
    icon: Calculator,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'accounting',
    fields: [
      { key: 'server_url', label: 'Server URL', type: 'url', placeholder: 'http://localhost', required: true },
      { key: 'company_name', label: 'Company Name', type: 'text', placeholder: 'Your Company Pvt Ltd', required: true },
      { key: 'port', label: 'Port', type: 'number', placeholder: '9000', required: true },
    ],
  },
  {
    type: 'RAZORPAY',
    name: 'Razorpay',
    description: 'Payment gateway for online and POS payments',
    icon: CreditCard,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    category: 'payments',
    fields: [
      { key: 'key_id', label: 'Key ID', type: 'text', placeholder: 'rzp_live_xxxxx', required: true },
      { key: 'key_secret', label: 'Key Secret', type: 'password', placeholder: 'Enter key secret', required: true },
      { key: 'webhook_secret', label: 'Webhook Secret', type: 'password', placeholder: 'Enter webhook secret', required: true },
    ],
  },
  {
    type: 'WHATSAPP',
    name: 'WhatsApp Business',
    description: 'Customer communications and order updates',
    icon: MessageCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    category: 'communication',
    fields: [
      { key: 'phone_number_id', label: 'Phone Number ID', type: 'text', placeholder: '1234567890', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'EAAxxxx', required: true },
      { key: 'business_id', label: 'Business Account ID', type: 'text', placeholder: '9876543210', required: true },
    ],
  },
  {
    type: 'SHIPROCKET',
    name: 'Shiprocket',
    description: 'Shipping and logistics for order fulfillment',
    icon: Truck,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    category: 'shipping',
    fields: [
      { key: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com', required: true },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
      { key: 'pickup_location_id', label: 'Pickup Location ID', type: 'text', placeholder: 'Location ID', required: true },
    ],
  },
  {
    type: 'GOOGLE_ADS',
    name: 'Google Ads',
    description: 'Marketing performance tracking and ROI analysis',
    icon: BarChart3,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    category: 'marketing',
    fields: [
      { key: 'customer_id', label: 'Customer ID', type: 'text', placeholder: '123-456-7890', required: true },
      { key: 'developer_token', label: 'Developer Token', type: 'password', placeholder: 'Enter developer token', required: true },
      { key: 'refresh_token', label: 'Refresh Token', type: 'password', placeholder: 'Enter refresh token', required: true },
    ],
  },
  {
    type: 'META_ADS',
    name: 'Meta (Facebook/Instagram)',
    description: 'Social media marketing and ad tracking',
    icon: Instagram,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    category: 'marketing',
    fields: [
      { key: 'app_id', label: 'App ID', type: 'text', placeholder: 'App ID', required: true },
      { key: 'app_secret', label: 'App Secret', type: 'password', placeholder: 'Enter app secret', required: true },
      { key: 'access_token', label: 'Access Token', type: 'password', placeholder: 'Enter access token', required: true },
      { key: 'ad_account_id', label: 'Ad Account ID', type: 'text', placeholder: 'act_123456789', required: true },
    ],
  },
  {
    type: 'GST_PORTAL',
    name: 'GST Portal',
    description: 'GSTIN verification and compliance',
    icon: Building2,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    category: 'compliance',
    fields: [
      { key: 'gstin', label: 'GSTIN', type: 'text', placeholder: '20AABCU9603R1ZM', required: true },
      { key: 'username', label: 'Username', type: 'text', placeholder: 'GST portal username', required: true },
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key', required: true },
    ],
  },
  {
    type: 'SMS_GATEWAY',
    name: 'SMS Gateway',
    description: 'Transactional and promotional SMS',
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    category: 'communication',
    fields: [
      { key: 'api_key', label: 'API Key', type: 'password', placeholder: 'Enter API key', required: true },
      { key: 'sender_id', label: 'Sender ID', type: 'text', placeholder: 'BTRVSN', required: true },
      { key: 'template_ids', label: 'Template IDs (comma-separated)', type: 'text', placeholder: 'TPL001,TPL002', required: false },
    ],
  },
  {
    type: 'EMAIL_SERVICE',
    name: 'Email Service',
    description: 'Transactional emails and notifications',
    icon: Mail,
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    category: 'communication',
    fields: [
      { key: 'smtp_host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com', required: true },
      { key: 'smtp_port', label: 'SMTP Port', type: 'number', placeholder: '587', required: true },
      { key: 'username', label: 'Username', type: 'email', placeholder: 'your@email.com', required: true },
      { key: 'password', label: 'Password', type: 'password', placeholder: 'Enter password', required: true },
    ],
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Integrations' },
  { key: 'ecommerce', label: 'E-commerce' },
  { key: 'accounting', label: 'Accounting' },
  { key: 'payments', label: 'Payments' },
  { key: 'communication', label: 'Communication' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'marketing', label: 'Marketing' },
  { key: 'compliance', label: 'Compliance' },
];

// ============================================================================
// Status Badge Component
// ============================================================================

function StatusBadge({ status }: { status: IntegrationStatus }) {
  const config = {
    NOT_CONFIGURED: { label: 'Not Configured', color: 'bg-gray-100 text-gray-600', icon: Settings },
    CONFIGURED: { label: 'Configured', color: 'bg-blue-100 text-blue-700', icon: Check },
    ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', icon: Zap },
    ERROR: { label: 'Error', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    DISABLED: { label: 'Disabled', color: 'bg-gray-100 text-gray-500', icon: X },
  }[status];

  const Icon = config.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// ============================================================================
// Integration Card Component
// ============================================================================

interface IntegrationCardProps {
  meta: IntegrationMeta;
  config?: IntegrationConfig;
  onConfigure: () => void;
}

function IntegrationCard({ meta, config, onConfigure }: IntegrationCardProps) {
  const Icon = meta.icon;
  const status: IntegrationStatus = config?.status || 'NOT_CONFIGURED';

  return (
    <div
      className={clsx(
        'bg-white rounded-xl border p-5 hover:shadow-md transition-all cursor-pointer',
        status === 'ACTIVE' && 'border-green-200',
        status === 'ERROR' && 'border-red-200'
      )}
      onClick={onConfigure}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-12 h-12 rounded-lg flex items-center justify-center', meta.bgColor)}>
          <Icon className={clsx('w-6 h-6', meta.color)} />
        </div>
        <StatusBadge status={status} />
      </div>

      <h3 className="font-semibold text-gray-900 mb-1">{meta.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{meta.description}</p>

      {config?.lastSync && (
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          Last sync: {new Date(config.lastSync).toLocaleString()}
        </div>
      )}

      <div className="flex items-center justify-end mt-4 text-sm text-bv-red-600 font-medium">
        Configure <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
}

// ============================================================================
// Integration Configuration Modal
// ============================================================================

interface ConfigModalProps {
  meta: IntegrationMeta;
  config?: IntegrationConfig;
  onClose: () => void;
  onSave: (credentials: Record<string, string>) => Promise<void>;
  onTest: () => Promise<{ success: boolean; message: string }>;
  onToggle: (enabled: boolean) => Promise<void>;
}

function ConfigModal({ meta, config, onClose, onSave, onTest, onToggle }: ConfigModalProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const Icon = meta.icon;
  const status: IntegrationStatus = config?.status || 'NOT_CONFIGURED';
  const isConfigured = status !== 'NOT_CONFIGURED';

  const handleFieldChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(credentials);
      setTestResult({ success: true, message: 'Configuration saved successfully' });
    } catch {
      setTestResult({ success: false, message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: 'Connection test failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', meta.bgColor)}>
                <Icon className={clsx('w-5 h-5', meta.color)} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{meta.name}</h2>
                <p className="text-sm text-gray-500">{meta.description}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status & Toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <StatusBadge status={status} />
            {isConfigured && (
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm text-gray-600">
                  {config?.isEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => onToggle(!config?.isEnabled)}
                  className={clsx(
                    'relative w-11 h-6 rounded-full transition-colors',
                    config?.isEnabled ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                      config?.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </label>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[400px]">
          <div className="space-y-4">
            {meta.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    value={credentials[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-bv-red-500 focus:border-transparent"
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.key)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={clsx(
                'mt-4 p-3 rounded-lg flex items-center gap-2',
                testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}
            >
              {testResult.success ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              <span className="text-sm">{testResult.message}</span>
            </div>
          )}

          {/* Recent Syncs */}
          {config?.recentSyncs && config.recentSyncs.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Sync History</h4>
              <div className="space-y-2">
                {config.recentSyncs.map((sync, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                    <span className="text-gray-600">{new Date(sync.started).toLocaleString()}</span>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded text-xs',
                        sync.status === 'SUCCESS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}
                    >
                      {sync.status} ({sync.records} records)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
          <button
            onClick={handleTest}
            disabled={testing || !isConfigured}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              isConfigured
                ? 'text-gray-700 hover:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed'
            )}
          >
            {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            Test Connection
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Integrations Page
// ============================================================================

export function IntegrationsPage() {
  const { user, hasRole } = useAuth();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationMeta | null>(null);

  // Access control - only Superadmin and Admin can access
  const canAccess = hasRole(['SUPERADMIN', 'ADMIN']);

  const fetchIntegrations = useCallback(async () => {
    try {
      const response = await apiClient.get('/integrations');
      setIntegrations(response.data.integrations || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      // Use empty array if API fails
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canAccess) {
      fetchIntegrations();
    } else {
      setLoading(false);
    }
  }, [canAccess, fetchIntegrations]);

  const getConfigForIntegration = (type: IntegrationType): IntegrationConfig | undefined => {
    return integrations.find((i) => i.type === type);
  };

  const handleConfigure = (meta: IntegrationMeta) => {
    setSelectedIntegration(meta);
  };

  const handleSaveConfig = async (credentials: Record<string, string>) => {
    if (!selectedIntegration) return;

    await apiClient.post(`/integrations/${selectedIntegration.type.toLowerCase()}/configure`, {
      credentials,
      settings: {},
    });

    await fetchIntegrations();
  };

  const handleTestConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!selectedIntegration) return { success: false, message: 'No integration selected' };

    try {
      const response = await apiClient.post(`/integrations/${selectedIntegration.type.toLowerCase()}/test`);
      return { success: response.data.success, message: response.data.message };
    } catch {
      return { success: false, message: 'Connection test failed' };
    }
  };

  const handleToggle = async (enabled: boolean) => {
    if (!selectedIntegration) return;

    await apiClient.post(`/integrations/${selectedIntegration.type.toLowerCase()}/toggle`, { enabled });
    await fetchIntegrations();
  };

  const filteredIntegrations =
    selectedCategory === 'all'
      ? INTEGRATIONS
      : INTEGRATIONS.filter((i) => i.category === selectedCategory);

  // Stats
  const activeCount = integrations.filter((i) => i.status === 'ACTIVE').length;
  const configuredCount = integrations.filter((i) => i.status === 'CONFIGURED').length;
  const errorCount = integrations.filter((i) => i.status === 'ERROR').length;

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only Superadmin and Admin can access integrations settings.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-bv-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
              <p className="text-gray-600 mt-1">Manage third-party integrations and API connections</p>
            </div>
            <a
              href="https://docs.ims-retail.com/integrations"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-bv-red-600 hover:text-bv-red-700"
            >
              <ExternalLink className="w-4 h-4" />
              Documentation
            </a>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              <span className="text-sm">
                <span className="font-semibold text-green-600">{activeCount}</span> Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                <span className="font-semibold text-blue-600">{configuredCount}</span> Configured
              </span>
            </div>
            {errorCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">
                  <span className="font-semibold text-red-600">{errorCount}</span> Errors
                </span>
              </div>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === cat.key
                    ? 'bg-bv-red-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((meta) => (
            <IntegrationCard
              key={meta.type}
              meta={meta}
              config={getConfigForIntegration(meta.type)}
              onConfigure={() => handleConfigure(meta)}
            />
          ))}
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <ConfigModal
          meta={selectedIntegration}
          config={getConfigForIntegration(selectedIntegration.type)}
          onClose={() => setSelectedIntegration(null)}
          onSave={handleSaveConfig}
          onTest={handleTestConnection}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}

export default IntegrationsPage;
