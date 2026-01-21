// ============================================================================
// IMS 2.0 - Approval Queue Component
// ============================================================================
// Shows pending approvals for managers and admins

import { useState } from 'react';
import {
  Check,
  X,
  Clock,
  Percent,
  CreditCard,
  ArrowRightLeft,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';

type ApprovalType = 'DISCOUNT' | 'CREDIT' | 'TRANSFER' | 'WRITE_OFF' | 'RETURN';

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  requestedByRole: string;
  requestedAt: string;
  details: {
    description: string;
    amount?: number;
    percentage?: number;
    reason: string;
    customerName?: string;
    productName?: string;
  };
  urgency: 'normal' | 'urgent';
}

interface ApprovalQueueProps {
  approvals: ApprovalItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (item: ApprovalItem) => void;
}

const typeConfig: Record<ApprovalType, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  DISCOUNT: { icon: Percent, label: 'Discount', color: 'text-orange-600 bg-orange-100' },
  CREDIT: { icon: CreditCard, label: 'Credit', color: 'text-purple-600 bg-purple-100' },
  TRANSFER: { icon: ArrowRightLeft, label: 'Transfer', color: 'text-blue-600 bg-blue-100' },
  WRITE_OFF: { icon: Trash2, label: 'Write-off', color: 'text-red-600 bg-red-100' },
  RETURN: { icon: ArrowRightLeft, label: 'Return', color: 'text-green-600 bg-green-100' },
};

export function ApprovalQueue({ approvals, onApprove, onReject, onViewDetails }: ApprovalQueueProps) {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    await onApprove(id);
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    setProcessing(id);
    await onReject(id);
    setProcessing(null);
  };

  const pendingCount = approvals.length;
  const urgentCount = approvals.filter(a => a.urgency === 'urgent').length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">Pending Approvals</h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              {pendingCount} pending
            </span>
          )}
          {urgentCount > 0 && (
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {approvals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Check className="w-10 h-10 mx-auto mb-2 text-green-500 opacity-50" />
            <p>No pending approvals</p>
          </div>
        ) : (
          approvals.map((item) => {
            const config = typeConfig[item.type];
            const Icon = config.icon;
            const isProcessing = processing === item.id;

            return (
              <div
                key={item.id}
                className={clsx(
                  'border rounded-lg p-3 transition-colors',
                  item.urgency === 'urgent' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={clsx('p-2 rounded-lg', config.color)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Details */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onViewDetails(item)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{config.label} Request</span>
                      {item.urgency === 'urgent' && (
                        <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{item.details.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>By {item.requestedBy}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.requestedAt}
                      </span>
                    </div>
                    {item.details.amount && (
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        ₹{item.details.amount.toLocaleString('en-IN')}
                        {item.details.percentage && ` (${item.details.percentage}%)`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={isProcessing}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      disabled={isProcessing}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Reject"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onViewDetails(item)}
                      className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ApprovalQueue;
