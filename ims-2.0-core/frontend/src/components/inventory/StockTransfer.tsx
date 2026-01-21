// ============================================================================
// IMS 2.0 - Stock Transfer Component
// ============================================================================
// Request, approve, and receive stock transfers between stores

import { useState } from 'react';
import {
  ArrowRightLeft,
  Building2,
  Package,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Plus,
  X,
  Search,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';

// Types
type TransferStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'PARTIALLY_RECEIVED';

interface TransferItem {
  productId: string;
  productName: string;
  sku: string;
  requestedQty: number;
  approvedQty?: number;
  receivedQty?: number;
}

interface StockTransfer {
  id: string;
  transferNo: string;
  fromStoreId: string;
  fromStoreName: string;
  toStoreId: string;
  toStoreName: string;
  items: TransferItem[];
  status: TransferStatus;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  reason: string;
}

interface StockTransferProps {
  mode: 'outgoing' | 'incoming' | 'all';
  currentStoreId: string;
  transfers: StockTransfer[];
  onApprove: (transfer: StockTransfer, approvedItems: TransferItem[]) => void;
  onReject: (transferId: string, reason: string) => void;
  onReceive: (transfer: StockTransfer, receivedItems: TransferItem[]) => void;
  onCreateRequest: (data: Partial<StockTransfer>) => void;
}

// Status configuration
const statusConfig: Record<TransferStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  REQUESTED: { label: 'Requested', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  IN_TRANSIT: { label: 'In Transit', color: 'bg-purple-100 text-purple-700', icon: Truck },
  RECEIVED: { label: 'Received', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  PARTIALLY_RECEIVED: { label: 'Partial', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
};

// Mock stores for selection
const STORES = [
  { id: 'store-001', name: 'Better Vision - Vijay Nagar' },
  { id: 'store-002', name: 'Better Vision - Palasia' },
  { id: 'store-003', name: 'Better Vision - Sapna Sangeeta' },
  { id: 'store-004', name: 'WizOpt - MG Road' },
  { id: 'hq', name: 'HQ Warehouse' },
];

// Transfer Card Component
function TransferCard({
  transfer,
  currentStoreId,
  onApprove,
  onReject,
  onReceive,
}: {
  transfer: StockTransfer;
  currentStoreId: string;
  onApprove: (transfer: StockTransfer) => void;
  onReject: (transfer: StockTransfer) => void;
  onReceive: (transfer: StockTransfer) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[transfer.status];
  const StatusIcon = config.icon;

  const isOutgoing = transfer.fromStoreId === currentStoreId;
  const isIncoming = transfer.toStoreId === currentStoreId;

  const canApprove = isOutgoing && transfer.status === 'REQUESTED';
  const canReceive = isIncoming && (transfer.status === 'APPROVED' || transfer.status === 'IN_TRANSIT');

  return (
    <div className={clsx(
      'border rounded-lg overflow-hidden',
      transfer.status === 'REQUESTED' && isOutgoing && 'border-yellow-300 bg-yellow-50',
      (transfer.status === 'APPROVED' || transfer.status === 'IN_TRANSIT') && isIncoming && 'border-blue-300 bg-blue-50'
    )}>
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center', config.color)}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-gray-700">{transfer.transferNo}</span>
                <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium', config.color)}>
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3" />
                {transfer.fromStoreName}
                <ArrowRightLeft className="w-3 h-3 mx-1" />
                {transfer.toStoreName}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{transfer.items.length} item(s)</p>
            <p className="text-xs text-gray-500">{new Date(transfer.requestedAt).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Reason */}
        <p className="text-sm text-gray-600 mt-2">{transfer.reason}</p>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Items Table */}
          <table className="w-full mt-3 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left text-gray-500">Product</th>
                <th className="px-2 py-1 text-center text-gray-500">Requested</th>
                {transfer.items.some(item => item.approvedQty !== undefined) && (
                  <th className="px-2 py-1 text-center text-gray-500">Approved</th>
                )}
                {transfer.status === 'RECEIVED' && (
                  <th className="px-2 py-1 text-center text-gray-500">Received</th>
                )}
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="px-2 py-2">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                  </td>
                  <td className="px-2 py-2 text-center">{item.requestedQty}</td>
                  {item.approvedQty !== undefined && (
                    <td className={clsx(
                      'px-2 py-2 text-center font-medium',
                      item.approvedQty < item.requestedQty ? 'text-orange-600' : 'text-green-600'
                    )}>
                      {item.approvedQty}
                    </td>
                  )}
                  {item.receivedQty !== undefined && (
                    <td className="px-2 py-2 text-center font-medium text-green-600">
                      {item.receivedQty}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Actions */}
          <div className="flex justify-end gap-2 mt-4">
            {canApprove && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(transfer); }}
                  className="btn-outline text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(transfer); }}
                  className="btn-primary"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </button>
              </>
            )}
            {canReceive && (
              <button
                onClick={(e) => { e.stopPropagation(); onReceive(transfer); }}
                className="btn-primary"
              >
                <Package className="w-4 h-4 mr-1" />
                Mark Received
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// New Transfer Request Modal
function NewTransferModal({
  currentStoreId,
  onClose,
  onCreate,
}: {
  currentStoreId: string;
  onClose: () => void;
  onCreate: (data: Partial<StockTransfer>) => void;
}) {
  const [toStoreId, setToStoreId] = useState('');
  const [reason, setReason] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock products for selection
  const mockProducts = [
    { productId: 'p1', productName: 'Ray-Ban RB5154 Clubmaster', sku: 'RB-5154-BLK', stock: 5 },
    { productId: 'p2', productName: 'Ray-Ban Aviator Classic', sku: 'RB-3025-GLD', stock: 3 },
    { productId: 'p3', productName: 'Essilor Crizal Prevencia', sku: 'ESS-CP-STD', stock: 20 },
  ];

  const addItem = (product: typeof mockProducts[0]) => {
    if (!items.find(i => i.productId === product.productId)) {
      setItems([...items, {
        productId: product.productId,
        productName: product.productName,
        sku: product.sku,
        requestedQty: 1,
      }]);
    }
  };

  const updateQty = (productId: string, qty: number) => {
    setItems(items.map(i =>
      i.productId === productId ? { ...i, requestedQty: qty } : i
    ));
  };

  const removeItem = (productId: string) => {
    setItems(items.filter(i => i.productId !== productId));
  };

  const handleSubmit = () => {
    if (!toStoreId || !reason || items.length === 0) return;

    onCreate({
      fromStoreId: currentStoreId,
      toStoreId,
      reason,
      items,
    });
  };

  const availableStores = STORES.filter(s => s.id !== currentStoreId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Request Stock Transfer</h2>
              <p className="text-sm text-gray-500">Request items from another store or HQ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* From/To Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request From</label>
              <select
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="input-field"
              >
                <option value="">Select source store</option>
                {availableStores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                placeholder="e.g., Stock out, Customer request"
              />
            </div>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-9"
                placeholder="Search products..."
              />
            </div>

            {/* Product List */}
            <div className="mt-2 border rounded-lg divide-y max-h-40 overflow-y-auto">
              {mockProducts
                .filter(p => p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(product => (
                  <div
                    key={product.productId}
                    className="p-2 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    onClick={() => addItem(product)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.productName}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
            </div>
          </div>

          {/* Selected Items */}
          {items.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Items to Transfer</label>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.productId} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={item.requestedQty}
                      onChange={(e) => updateQty(item.productId, parseInt(e.target.value) || 1)}
                      className="input-field w-20 text-center"
                    />
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button onClick={onClose} className="btn-outline">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!toStoreId || !reason || items.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
}

export function StockTransfer({
  mode,
  currentStoreId,
  transfers,
  onApprove,
  onReject,
  onReceive,
  onCreateRequest,
}: StockTransferProps) {
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  // Filter transfers based on mode
  const filteredTransfers = transfers.filter(t => {
    if (mode === 'outgoing') return t.fromStoreId === currentStoreId;
    if (mode === 'incoming') return t.toStoreId === currentStoreId;
    return true;
  });

  const pendingTransfers = filteredTransfers.filter(t =>
    ['REQUESTED', 'APPROVED', 'IN_TRANSIT'].includes(t.status)
  );

  const completedTransfers = filteredTransfers.filter(t =>
    ['RECEIVED', 'REJECTED', 'PARTIALLY_RECEIVED'].includes(t.status)
  );

  const displayTransfers = activeTab === 'pending' ? pendingTransfers : completedTransfers;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Stock Transfers</h2>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'pending'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Pending ({pendingTransfers.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-bv-red-600 text-bv-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          )}
        >
          Completed ({completedTransfers.length})
        </button>
      </div>

      {/* Transfer List */}
      <div className="space-y-3">
        {displayTransfers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No {activeTab} transfers</p>
          </div>
        ) : (
          displayTransfers.map(transfer => (
            <TransferCard
              key={transfer.id}
              transfer={transfer}
              currentStoreId={currentStoreId}
              onApprove={(t) => onApprove(t, t.items)}
              onReject={(t) => onReject(t.id, 'Rejected by manager')}
              onReceive={(t) => onReceive(t, t.items)}
            />
          ))
        )}
      </div>

      {/* New Transfer Modal */}
      {showNewModal && (
        <NewTransferModal
          currentStoreId={currentStoreId}
          onClose={() => setShowNewModal(false)}
          onCreate={(data) => {
            onCreateRequest(data);
            setShowNewModal(false);
          }}
        />
      )}
    </div>
  );
}

export default StockTransfer;
