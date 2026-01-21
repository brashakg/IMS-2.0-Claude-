// ============================================================================
// IMS 2.0 - Order Items Table for POS
// ============================================================================
// Displays order items in a table format with Brand, Model, Color, Qty, Price
// Includes real-time pricing validation based on SYSTEM_INTENT.md rules

import { useState, useCallback, useMemo } from 'react';
import { Trash2, Plus, Minus, Scan, Eye, Settings2, AlertTriangle } from 'lucide-react';
import type { CartItem, UserRole } from '../../types';
import clsx from 'clsx';
import {
  validateMRPOfferPrice,
  validateCartItemPricing,
  getDiscountCapMessage,
  type DiscountCategory,
} from '../../utils/pricingValidation';

interface OrderItemsTableProps {
  items: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onUpdateItemPrice: (itemId: string, newPrice: number, discountPercent: number) => void;
  onAddByBarcode: (barcode: string) => void;
  onOpenLensDetails: (itemId: string) => void;
  userRole: UserRole;
  userDiscountCap?: number;
}

export function OrderItemsTable({
  items,
  onRemoveItem,
  onUpdateQuantity,
  onUpdateItemPrice,
  onAddByBarcode,
  onOpenLensDetails,
  userRole,
  userDiscountCap,
}: OrderItemsTableProps) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<number>(0);
  const [editingDiscount, setEditingDiscount] = useState<number>(0);
  const [pricingErrors, setPricingErrors] = useState<Map<string, string>>(new Map());

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

  // Validate MRP vs Offer Price for an item
  const validateItemMRPOfferprice = useCallback(
    (item: CartItem): { isValid: boolean; error?: string } => {
      return validateMRPOfferPrice(item.mrp || item.unitPrice, item.offerPrice || item.unitPrice);
    },
    []
  );

  // Validate discount for an item
  const validateItemDiscount = useCallback(
    (item: CartItem, requestedDiscount: number) => {
      // Map CartItem category to DiscountCategory
      const discountCategory: DiscountCategory =
        item.category === 'SERVICES' ? 'SERVICE' :
        item.category === 'ACCESSORIES' ? 'MASS' :
        item.category === 'CONTACT_LENS' || item.category === 'COLORED_CONTACT_LENS' ? 'MASS' :
        item.category === 'FRAME' || item.category === 'OPTICAL_LENS' ? 'PREMIUM' :
        item.category === 'WATCH' || item.category === 'SMARTWATCH' || item.category === 'SMARTGLASSES' ? 'LUXURY' :
        'PREMIUM';

      return validateCartItemPricing({
        mrp: item.mrp || item.unitPrice,
        offerPrice: item.offerPrice || item.unitPrice,
        quantity: item.quantity,
        requestedDiscountPercent: requestedDiscount,
        userRole,
        userDiscountCap,
        productCategory: discountCategory,
        brandName: item.brand,
      });
    },
    [userRole, userDiscountCap]
  );

  // Handle price change
  const handlePriceChange = useCallback(
    (item: CartItem, newPrice: number) => {
      const basePrice = item.offerPrice || item.unitPrice;

      // Calculate discount percentage
      const discountPercent = basePrice > 0 ? ((basePrice - newPrice) / basePrice) * 100 : 0;

      // Validate
      const validation = validateItemDiscount(item, discountPercent);

      if (validation.decision === 'BLOCKED') {
        setPricingErrors(prev => new Map(prev).set(item.id, validation.reason || 'Invalid pricing'));
        return;
      }

      if (validation.decision === 'REQUIRES_APPROVAL') {
        setPricingErrors(prev => new Map(prev).set(item.id, validation.reason || 'Requires approval'));
        // In future, trigger approval request here
        return;
      }

      // Valid - update
      setPricingErrors(prev => {
        const newMap = new Map(prev);
        newMap.delete(item.id);
        return newMap;
      });

      onUpdateItemPrice(item.id, newPrice, discountPercent);
    },
    [validateItemDiscount, onUpdateItemPrice]
  );

  // Get discount cap message for item
  const getItemDiscountMessage = useCallback(
    (item: CartItem): string => {
      const discountCategory: DiscountCategory =
        item.category === 'SERVICES' ? 'SERVICE' :
        item.category === 'ACCESSORIES' ? 'MASS' :
        item.category === 'CONTACT_LENS' || item.category === 'COLORED_CONTACT_LENS' ? 'MASS' :
        item.category === 'FRAME' || item.category === 'OPTICAL_LENS' ? 'PREMIUM' :
        item.category === 'WATCH' || item.category === 'SMARTWATCH' || item.category === 'SMARTGLASSES' ? 'LUXURY' :
        'PREMIUM';

      return getDiscountCapMessage({
        userRole,
        productCategory: discountCategory,
        brandName: item.brand,
      });
    },
    [userRole]
  );

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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-gray-500">₹</span>
                          <input
                            type="number"
                            defaultValue={item.finalPrice}
                            onBlur={(e) => {
                              const newPrice = parseFloat(e.target.value) || 0;
                              if (newPrice !== item.finalPrice) {
                                handlePriceChange(item, newPrice);
                              }
                            }}
                            className={clsx(
                              'w-20 px-2 py-1 text-right text-sm border rounded focus:outline-none',
                              pricingErrors.has(item.id)
                                ? 'border-red-500 bg-red-50 focus:border-red-600'
                                : 'border-gray-200 focus:border-bv-red-500'
                            )}
                            title={getItemDiscountMessage(item)}
                          />
                        </div>
                        {item.discountAmount > 0 && !pricingErrors.has(item.id) && (
                          <p className="text-xs text-green-600">
                            -{item.discountPercent}% off
                          </p>
                        )}
                        {pricingErrors.has(item.id) && (
                          <div className="flex items-start gap-1 text-xs text-red-600 max-w-[150px]">
                            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{pricingErrors.get(item.id)}</span>
                          </div>
                        )}
                        {/* Show MRP/Offer price validation warning */}
                        {(() => {
                          const mrpValidation = validateItemMRPOfferprice(item);
                          if (!mrpValidation.isValid) {
                            return (
                              <div className="flex items-start gap-1 text-xs text-orange-600 max-w-[150px]">
                                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span className="break-words">{mrpValidation.error}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
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
