// ============================================================================
// IMS 2.0 - Order Items Table for POS
// ============================================================================
// Displays order items in a table format with Brand, Model, Color, Qty, Price

import { useState, useCallback } from 'react';
import { Trash2, Plus, Minus, Scan, Eye, Settings2 } from 'lucide-react';
import type { CartItem } from '../../types';
import clsx from 'clsx';

interface OrderItemsTableProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onAddByBarcode: (barcode: string) => void;
  onOpenLensDetails: (itemId: string) => void;
}

export function OrderItemsTable({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onAddByBarcode,
  onOpenLensDetails,
}: OrderItemsTableProps) {
  const [barcodeInput, setBarcodeInput] = useState('');

  const handleBarcodeSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onAddByBarcode(barcodeInput.trim());
      setBarcodeInput('');
    }
  }, [barcodeInput, onAddByBarcode]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Parse product name to extract brand, model, color
  const parseProductDetails = (item: CartItem) => {
    // Try to extract from product name or use available fields
    const brand = item.brand || '-';
    // For demo, split name to get model and color
    const nameParts = item.productName.split(' ');
    const model = nameParts.length > 1 ? nameParts.slice(1, -1).join(' ') || '-' : '-';
    const color = nameParts.length > 2 ? nameParts[nameParts.length - 1] : '-';
    return { brand, model, color };
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 text-sm">Order Items</h3>
          <span className="text-xs text-gray-500">{items.length} item(s)</span>
        </div>
      </div>

      {/* Quick Add by Barcode */}
      <div className="p-3 border-b border-gray-100">
        <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Scan className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={barcodeInput}
              onChange={e => setBarcodeInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
              placeholder="Scan barcode..."
            />
          </div>
          <button
            type="submit"
            disabled={!barcodeInput.trim()}
            className="px-3 py-2 bg-bv-red-600 text-white text-sm rounded-lg hover:bg-bv-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </form>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-600">BRAND</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">MODEL</th>
              <th className="text-left py-2 px-3 font-medium text-gray-600">COLOR</th>
              <th className="text-center py-2 px-3 font-medium text-gray-600 w-24">QTY</th>
              <th className="text-right py-2 px-3 font-medium text-gray-600 w-28">PRICE</th>
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <Scan className="w-8 h-8 mb-2 opacity-50" />
                    <p>No items added</p>
                    <p className="text-xs mt-1">Scan barcode or select products</p>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const details = parseProductDetails(item);
                const isLensItem = item.category === 'OPTICAL_LENS' || item.category === 'CONTACT_LENS';

                return (
                  <tr
                    key={item.id}
                    className={clsx(
                      'border-b border-gray-100 hover:bg-gray-50',
                      item.requiresPrescription && !item.prescriptionLinked && 'bg-yellow-50'
                    )}
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={details.brand}
                          className="w-24 px-2 py-1 text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none bg-transparent"
                          placeholder="Brand"
                        />
                        {isLensItem && (
                          <button
                            onClick={() => onOpenLensDetails(item.id)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Lens Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        defaultValue={details.model}
                        className="w-32 px-2 py-1 text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none bg-transparent"
                        placeholder="Model"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        defaultValue={details.color}
                        className="w-24 px-2 py-1 text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none bg-transparent"
                        placeholder="Color"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={e => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                          min="1"
                          className="w-12 px-1 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                        />
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-gray-500">₹</span>
                        <input
                          type="number"
                          defaultValue={item.finalPrice}
                          className="w-20 px-2 py-1 text-right text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                        />
                      </div>
                      {item.discountAmount > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          -{item.discountPercent}% off
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <div className="p-3 border-t border-gray-200">
        <button className="w-full py-2 text-sm text-bv-red-600 border border-dashed border-bv-red-300 rounded-lg hover:bg-bv-red-50 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>
    </div>
  );
}

export default OrderItemsTable;
