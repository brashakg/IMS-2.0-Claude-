// ============================================================================
// IMS 2.0 - Stock Count / Audit Component
// ============================================================================
// Physical stock count and variance reporting

import { useState } from 'react';
import {
  ClipboardList,
  Package,
  CheckCircle,
  AlertTriangle,
  Save,
  Scan,
  Plus,
  Search,
  Calendar,
  User,
  X,
} from 'lucide-react';
import clsx from 'clsx';

// Types
type CountStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';

interface CountItem {
  productId: string;
  productName: string;
  sku: string;
  location: string;
  systemQty: number;
  countedQty: number | null;
  variance: number;
  varianceValue: number;
  notes?: string;
}

interface StockCount {
  id: string;
  countNo: string;
  storeId: string;
  storeName: string;
  countType: 'FULL' | 'PARTIAL' | 'CATEGORY' | 'LOCATION';
  category?: string;
  location?: string;
  status: CountStatus;
  items: CountItem[];
  startedBy: string;
  startedAt: string;
  completedAt?: string;
  verifiedBy?: string;
  totalVariance: number;
  totalVarianceValue: number;
}

interface StockCountProps {
  currentCount?: StockCount;
  previousCounts: StockCount[];
  onStartCount: (type: StockCount['countType'], filter?: string) => void;
  onUpdateItem: (itemId: string, countedQty: number, notes?: string) => void;
  onCompleteCount: () => void;
  onVerifyCount: () => void;
}

// Status config
const statusConfig: Record<CountStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', color: 'bg-yellow-100 text-yellow-700' },
  VERIFIED: { label: 'Verified', color: 'bg-green-100 text-green-700' },
};

// Count Item Row
function CountItemRow({
  item,
  onUpdate,
  disabled,
}: {
  item: CountItem;
  onUpdate: (countedQty: number, notes?: string) => void;
  disabled: boolean;
}) {
  const [localQty, setLocalQty] = useState(item.countedQty?.toString() ?? '');
  const [notes, setNotes] = useState(item.notes ?? '');

  const handleBlur = () => {
    const qty = parseInt(localQty, 10);
    if (!isNaN(qty)) {
      onUpdate(qty, notes || undefined);
    }
  };

  const variance = item.countedQty !== null ? item.countedQty - item.systemQty : null;

  return (
    <tr className={clsx(
      'border-t border-gray-100',
      variance !== null && variance < 0 && 'bg-red-50',
      variance !== null && variance > 0 && 'bg-green-50'
    )}>
      <td className="px-3 py-2">
        <p className="font-medium text-gray-900">{item.productName}</p>
        <p className="text-xs text-gray-500">{item.sku}</p>
      </td>
      <td className="px-3 py-2 text-center text-sm text-gray-600">{item.location}</td>
      <td className="px-3 py-2 text-center font-medium text-gray-900">{item.systemQty}</td>
      <td className="px-3 py-2 text-center">
        <input
          type="number"
          min="0"
          value={localQty}
          onChange={(e) => setLocalQty(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className={clsx(
            'input-field w-20 text-center',
            disabled && 'bg-gray-100'
          )}
        />
      </td>
      <td className="px-3 py-2 text-center">
        {variance !== null && (
          <span className={clsx(
            'font-bold',
            variance < 0 && 'text-red-600',
            variance > 0 && 'text-green-600',
            variance === 0 && 'text-gray-500'
          )}>
            {variance > 0 ? '+' : ''}{variance}
          </span>
        )}
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={handleBlur}
          placeholder="Notes..."
          disabled={disabled}
          className="input-field text-sm w-full"
        />
      </td>
    </tr>
  );
}

// New Count Modal
function NewCountModal({
  onClose,
  onStart,
}: {
  onClose: () => void;
  onStart: (type: StockCount['countType'], filter?: string) => void;
}) {
  const [countType, setCountType] = useState<StockCount['countType']>('FULL');
  const [filter, setFilter] = useState('');

  const categories = [
    'FRAME', 'SUNGLASS', 'OPTICAL_LENS', 'CONTACT_LENS', 'WATCH', 'ACCESSORIES'
  ];

  const locations = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Start Stock Count</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Count Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Count Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'FULL', label: 'Full Count', desc: 'All inventory' },
                { value: 'PARTIAL', label: 'Partial', desc: 'Selected items' },
                { value: 'CATEGORY', label: 'By Category', desc: 'Single category' },
                { value: 'LOCATION', label: 'By Location', desc: 'Single location' },
              ].map(type => (
                <button
                  key={type.value}
                  onClick={() => {
                    setCountType(type.value as StockCount['countType']);
                    setFilter('');
                  }}
                  className={clsx(
                    'p-3 rounded-lg border text-left transition-colors',
                    countType === type.value
                      ? 'border-bv-red-500 bg-bv-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <p className="font-medium text-gray-900">{type.label}</p>
                  <p className="text-xs text-gray-500">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          {countType === 'CATEGORY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="">Choose category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          )}

          {/* Location Selection */}
          {countType === 'LOCATION' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Location</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="">Choose location</option>
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button
            onClick={() => onStart(countType, filter || undefined)}
            disabled={(countType === 'CATEGORY' || countType === 'LOCATION') && !filter}
            className="btn-primary disabled:opacity-50"
          >
            Start Count
          </button>
        </div>
      </div>
    </div>
  );
}

export function StockCount({
  currentCount,
  previousCounts,
  onStartCount,
  onUpdateItem,
  onCompleteCount,
  onVerifyCount,
}: StockCountProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = currentCount?.items.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  ) ?? [];

  const countedItems = currentCount?.items.filter(i => i.countedQty !== null).length ?? 0;
  const totalItems = currentCount?.items.length ?? 0;
  const progress = totalItems > 0 ? Math.round((countedItems / totalItems) * 100) : 0;

  const isDisabled = !currentCount || currentCount.status === 'VERIFIED';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Stock Count</h2>
        {!currentCount && (
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Count
          </button>
        )}
      </div>

      {/* Current Count */}
      {currentCount ? (
        <div className="card">
          {/* Count Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-gray-700">{currentCount.countNo}</span>
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[currentCount.status].color)}>
                    {statusConfig[currentCount.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {currentCount.countType} Count • Started by {currentCount.startedBy}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              <p className="text-xs text-gray-500">{countedItems}/{totalItems} items</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-bv-red-600 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="input-field pl-9"
            />
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-gray-500">Product</th>
                  <th className="px-3 py-2 text-center text-gray-500">Location</th>
                  <th className="px-3 py-2 text-center text-gray-500">System</th>
                  <th className="px-3 py-2 text-center text-gray-500">Counted</th>
                  <th className="px-3 py-2 text-center text-gray-500">Variance</th>
                  <th className="px-3 py-2 text-left text-gray-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <CountItemRow
                    key={item.productId}
                    item={item}
                    onUpdate={(qty, notes) => onUpdateItem(item.productId, qty, notes)}
                    disabled={isDisabled}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Variance Summary */}
          {currentCount.status !== 'DRAFT' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Variance</p>
                  <p className={clsx(
                    'text-lg font-bold',
                    currentCount.totalVariance < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    {currentCount.totalVariance > 0 ? '+' : ''}{currentCount.totalVariance} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Variance Value</p>
                  <p className={clsx(
                    'text-lg font-bold',
                    currentCount.totalVarianceValue < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    ₹{Math.abs(currentCount.totalVarianceValue).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4">
            {currentCount.status === 'IN_PROGRESS' && (
              <button
                onClick={onCompleteCount}
                disabled={countedItems < totalItems}
                className="btn-primary disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Complete Count
              </button>
            )}
            {currentCount.status === 'COMPLETED' && (
              <button onClick={onVerifyCount} className="btn-primary">
                <CheckCircle className="w-4 h-4 mr-1" />
                Verify & Adjust
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No active stock count</p>
          <p className="text-sm">Start a new count to verify inventory levels</p>
        </div>
      )}

      {/* Previous Counts */}
      {previousCounts.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Previous Counts</h3>
          <div className="space-y-2">
            {previousCounts.slice(0, 5).map(count => (
              <div key={count.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{count.countNo}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(count.completedAt!).toLocaleDateString('en-IN')} • {count.countType}
                  </p>
                </div>
                <div className="text-right">
                  <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig[count.status].color)}>
                    {statusConfig[count.status].label}
                  </span>
                  <p className={clsx(
                    'text-sm font-medium mt-1',
                    count.totalVariance < 0 ? 'text-red-600' : 'text-green-600'
                  )}>
                    Variance: {count.totalVariance}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Count Modal */}
      {showNewModal && (
        <NewCountModal
          onClose={() => setShowNewModal(false)}
          onStart={(type, filter) => {
            onStartCount(type, filter);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}

export default StockCount;
