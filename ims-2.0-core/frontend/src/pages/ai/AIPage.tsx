// ============================================================================
// IMS 2.0 - AI Intelligence Page
// ============================================================================
// Superadmin-only AI Intelligence dashboard

import { useAuth } from '../../context/AuthContext';
import { AIIntelligenceDashboard } from '../../components/admin/AIIntelligenceDashboard';
import { AlertTriangle, Brain } from 'lucide-react';

export function AIPage() {
  const { user, hasRole } = useAuth();

  // Only Superadmin can access AI Intelligence
  if (!hasRole(['SUPERADMIN'])) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Superadmin Access Required</h2>
          <p className="text-gray-600">
            AI Intelligence is available only for Superadmin users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Intelligence</h1>
              <p className="text-gray-500 text-sm">
                AI-powered insights, predictions, and recommendations (Read-only, Advisory mode)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard */}
      <AIIntelligenceDashboard
        storeId={user?.activeStoreId}
        userRole={user?.activeRole || 'SUPERADMIN'}
      />
    </div>
  );
}

export default AIPage;
