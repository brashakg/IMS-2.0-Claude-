// ============================================================================
// IMS 2.0 - Approvals Management Page
// ============================================================================
// Allows managers to view and approve/reject pending discount approvals
// Filters by user's role authority

import { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  User,
  Package,
  Calendar,
  Percent,
  Filter,
  RefreshCw,
  Eye,
} from 'lucide-react';
import clsx from 'clsx';
import { approvalApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Approval {
  approval_id: string;
  approval_number: string;
  product_name: string;
  product_id: string;
  mrp: number;
  offer_price: number;
  requested_discount_percent: number;
  requester_max_discount: number;
  discounted_price: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  priority: string;
  required_role: string;
  requested_by: string;
  requester_name?: string;
  requester_email?: string;
  created_at: string;
  expires_at: string;
  items?: any[];
}

export function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [approvedDiscount, setApprovedDiscount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'ALL'>('PENDING');

  useEffect(() => {
    fetchApprovals();
  }, [filterStatus]);

  const fetchApprovals = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (filterStatus === 'PENDING') {
        const response = await approvalApi.getPendingApprovals();
        setApprovals(response.approvals || []);
      } else {
        const response = await approvalApi.getApprovalHistory({
          storeId: user?.active_store_id,
        });
        setApprovals(response.approvals || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch approvals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;

    try {
      setIsSubmitting(true);
      await approvalApi.approveDiscount(
        selectedApproval.approval_id,
        approvedDiscount || selectedApproval.requested_discount_percent,
        actionRemarks
      );

      // Refresh list
      await fetchApprovals();
      closeActionDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval || !actionRemarks.trim()) {
      setError('Rejection reason is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await approvalApi.rejectDiscount(selectedApproval.approval_id, actionRemarks);

      // Refresh list
      await fetchApprovals();
      closeActionDialog();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openApproveDialog = (approval: Approval) => {
    setSelectedApproval(approval);
    setActionType('approve');
    setApprovedDiscount(approval.requested_discount_percent);
    setActionRemarks('');
  };

  const openRejectDialog = (approval: Approval) => {
    setSelectedApproval(approval);
    setActionType('reject');
    setActionRemarks('');
  };

  const closeActionDialog = () => {
    setSelectedApproval(null);
    setActionType(null);
    setActionRemarks('');
    setApprovedDiscount(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P0':
        return 'text-red-600';
      case 'P1':
        return 'text-orange-600';
      case 'P2':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const hoursLeft = (expiryTime - now) / (1000 * 60 * 60);
    return hoursLeft < 4 && hoursLeft > 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discount Approvals</h1>
        <p className="text-gray-600 mt-1">Review and approve discount requests</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as 'PENDING' | 'ALL')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="PENDING">Pending Only</option>
          <option value="ALL">All Statuses</option>
        </select>
        <button
          onClick={fetchApprovals}
          className="ml-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading approvals...</p>
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No {filterStatus === 'PENDING' ? 'pending' : ''} approvals found</p>
        </div>
      ) : (
        /* Approvals List */
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.approval_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {approval.approval_number}
                      </h3>
                      <span
                        className={clsx(
                          'px-2 py-1 text-xs font-medium rounded-full',
                          getStatusColor(approval.status)
                        )}
                      >
                        {approval.status}
                      </span>
                      <span className={clsx('text-sm font-medium', getPriorityColor(approval.priority))}>
                        {approval.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{approval.product_name}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div className="flex items-center gap-1 justify-end">
                      <Calendar className="h-4 w-4" />
                      {formatDate(approval.created_at)}
                    </div>
                    {approval.status === 'PENDING' && (
                      <div
                        className={clsx(
                          'flex items-center gap-1 justify-end mt-1',
                          isExpiringSoon(approval.expires_at) ? 'text-red-600' : 'text-gray-500'
                        )}
                      >
                        <Clock className="h-4 w-4" />
                        Expires {formatDate(approval.expires_at)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-gray-500">Requested By</span>
                    <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {approval.requester_name || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Base Price</span>
                    <p className="text-sm font-medium text-gray-900">
                      ₹{approval.offer_price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Requested Discount</span>
                    <p className="text-sm font-semibold text-orange-600 flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {approval.requested_discount_percent.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Final Price</span>
                    <p className="text-sm font-semibold text-green-600">
                      ₹{approval.discounted_price.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <span className="text-xs font-medium text-gray-700">Justification:</span>
                  <p className="text-sm text-gray-900 mt-1">{approval.reason}</p>
                </div>

                {/* Actions */}
                {approval.status === 'PENDING' && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => openApproveDialog(approval)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectDialog(approval)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      {selectedApproval && actionType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionType === 'approve' ? 'Approve Discount' : 'Reject Discount'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{selectedApproval.approval_number}</p>
            </div>

            <div className="p-6 space-y-4">
              {actionType === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Approved Discount %
                  </label>
                  <input
                    type="number"
                    value={approvedDiscount}
                    onChange={(e) => setApprovedDiscount(parseFloat(e.target.value))}
                    min={0}
                    max={selectedApproval.requested_discount_percent}
                    step={0.1}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: {selectedApproval.requested_discount_percent}%
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionType === 'approve' ? 'Remarks (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  rows={3}
                  placeholder={
                    actionType === 'approve'
                      ? 'Add any remarks...'
                      : 'Explain why this request is being rejected...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required={actionType === 'reject'}
                />
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={closeActionDialog}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={isSubmitting || (actionType === 'reject' && !actionRemarks.trim())}
                className={clsx(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50',
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                )}
              >
                {isSubmitting ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
