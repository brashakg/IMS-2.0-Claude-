// ============================================================================
// IMS 2.0 - Approval Request Modal Component
// ============================================================================
// Allows sales staff to request discount approval when exceeding their cap
// Follows SYSTEM_INTENT.md approval rules and role hierarchy

import { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle, Info } from 'lucide-react';
import clsx from 'clsx';
import type { CartItem, UserRole } from '../../types';
import { approvalApi } from '../../services/api';

interface ApprovalRequestModalProps {
  item: CartItem;
  requestedDiscount: number;
  maxAllowedDiscount: number;
  requiredApproverRole: string;
  orderId?: string;
  onClose: () => void;
  onSuccess?: (approvalId: string) => void;
}

export function ApprovalRequestModal({
  item,
  requestedDiscount,
  maxAllowedDiscount,
  requiredApproverRole,
  orderId,
  onClose,
  onSuccess,
}: ApprovalRequestModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await approvalApi.requestDiscountApproval({
        orderId,
        productId: item.productId,
        productName: item.productName,
        mrp: item.mrp || item.unitPrice,
        offerPrice: item.offerPrice || item.unitPrice,
        requestedDiscount: requestedDiscount,
        reason: reason.trim(),
      });

      setSuccess(true);

      // Show success for 2 seconds then close
      setTimeout(() => {
        if (onSuccess && response.approval_id) {
          onSuccess(response.approval_id);
        }
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit approval request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const basePrice = item.offerPrice || item.unitPrice;
  const discountedPrice = basePrice * (1 - requestedDiscount / 100);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Request Discount Approval</h2>
              <p className="text-sm text-gray-600">Exceeds your discount limit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          // Success State
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Your approval request has been sent to {requiredApproverRole}. You will be notified when it's reviewed.
            </p>
            <p className="text-sm text-gray-500">
              A task has been created for the approver. This window will close automatically.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Product Details */}
            <div className="p-6 border-b border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Product:</span>
                    <p className="font-medium text-gray-900">{item.productName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Brand:</span>
                    <p className="font-medium text-gray-900">{item.brand || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">MRP:</span>
                    <p className="font-medium text-gray-900">₹{basePrice.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <p className="font-medium text-gray-900">{item.quantity}</p>
                  </div>
                </div>
              </div>

              {/* Discount Details */}
              <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Your Max Discount:</span>
                  <span className="font-semibold text-gray-900">{maxAllowedDiscount.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Requested Discount:</span>
                  <span className="font-semibold text-orange-600">{requestedDiscount.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">Discounted Price:</span>
                  <span className="font-semibold text-gray-900">₹{discountedPrice.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-3 border-t border-orange-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">Total Savings:</span>
                    <span className="font-semibold text-green-600">
                      ₹{((basePrice - discountedPrice) * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Info */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Approval Required</p>
                  <p className="text-blue-700">
                    This discount requires approval from <span className="font-semibold">{requiredApproverRole}</span> or higher.
                    A task will be created for them to review your request.
                  </p>
                  <p className="text-blue-600 mt-2">
                    Approval expires in 24 hours if not actioned.
                  </p>
                </div>
              </div>
            </div>

            {/* Reason Input */}
            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Justification / Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this discount is justified (min. 10 characters)...&#10;Examples:&#10;- Competitor pricing match&#10;- Bulk purchase discount&#10;- Loyal customer retention&#10;- Product defect/damage"
                  rows={5}
                  disabled={isSubmitting}
                  className={clsx(
                    'w-full px-3 py-2 border rounded-lg text-sm',
                    'focus:outline-none focus:ring-2 focus:ring-brand-500',
                    'placeholder:text-gray-400',
                    'disabled:bg-gray-100 disabled:cursor-not-allowed',
                    error && reason.length < 10 ? 'border-red-300' : 'border-gray-300'
                  )}
                  required
                  minLength={10}
                />
                <div className="mt-1 flex items-center justify-between">
                  <span
                    className={clsx(
                      'text-xs',
                      reason.length < 10 ? 'text-red-600' : 'text-gray-500'
                    )}
                  >
                    {reason.length}/10 characters minimum
                  </span>
                  {reason.length >= 10 && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Valid
                    </span>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || reason.length < 10}
                className={clsx(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                  'flex items-center gap-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  isSubmitting
                    ? 'bg-orange-400'
                    : 'bg-orange-600 hover:bg-orange-700'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Request Approval
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
