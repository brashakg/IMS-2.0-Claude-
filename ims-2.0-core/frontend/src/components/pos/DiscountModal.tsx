// ============================================================================
// IMS 2.0 - Enhanced Discount Modal Component
// ============================================================================
// Implements FULL pricing logic from SYSTEM_INTENT.md:
// - MRP vs Offer Price validation
// - Role-based discount caps
// - Category discount caps (MASS, PREMIUM, LUXURY, SERVICE)
// - Brand-level caps for luxury brands
// - Approval workflow when exceeding limits

import { useState, useMemo } from 'react';
import {
  X,
  Percent,
  AlertTriangle,
  Tag,
  ShieldX,
  ShieldAlert,
  Send,
  CheckCircle,
  Ban,
  Info,
} from 'lucide-react';
import clsx from 'clsx';
import type { UserRole, ProductCategory, DiscountCategory } from '../../types';
import {
  validatePricing,
  calculateDiscount,
  getEffectiveDiscountCap,
  isLuxuryBrand,
  formatCurrency,
  ROLE_DISCOUNT_CAPS,
  CATEGORY_TO_DISCOUNT_CATEGORY,
  CATEGORY_DISCOUNT_CAPS,
  LUXURY_BRAND_CAPS,
} from '../../utils/pricing';

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: ProductCategory;
  brand: string;
  mrp: number;
  offerPrice: number;
  unitPrice: number;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  prescriptionId?: string;
}

interface DiscountModalProps {
  item: CartItem;
  userRole: UserRole;
  maxDiscountPercent: number; // From user.discountCap
  onApply: (discountPercent: number, discountAmount: number) => void;
  onRequestApproval?: (reason: string, requestedDiscount: number) => Promise<void>;
  onClose: () => void;
}

// Quick discount percentage options
const QUICK_DISCOUNTS = [5, 10, 15, 20];

export function DiscountModal({
  item,
  userRole,
  maxDiscountPercent,
  onApply,
  onRequestApproval,
  onClose,
}: DiscountModalProps) {
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [inputValue, setInputValue] = useState<string>(
    item.discountPercent > 0 ? item.discountPercent.toString() : ''
  );
  const [approvalReason, setApprovalReason] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate pricing rules first
  const priceValidation = useMemo(() => {
    return validatePricing(
      item.mrp,
      item.offerPrice,
      userRole,
      item.category,
      item.brand
    );
  }, [item.mrp, item.offerPrice, userRole, item.category, item.brand]);

  // Get discount category info
  const discountCategory = CATEGORY_TO_DISCOUNT_CATEGORY[item.category];
  const isLuxury = isLuxuryBrand(item.brand);

  // Calculate effective cap (minimum of role, category, brand)
  const effectiveCap = useMemo(() => {
    return getEffectiveDiscountCap(userRole, item.category, item.brand);
  }, [userRole, item.category, item.brand]);

  // Calculate discount values based on input
  const calculations = useMemo(() => {
    const itemTotal = item.offerPrice * item.quantity;
    const numValue = parseFloat(inputValue) || 0;

    let discountPercent: number;
    let discountAmount: number;

    if (discountType === 'percent') {
      discountPercent = Math.min(numValue, 100);
      discountAmount = Math.round((itemTotal * discountPercent) / 100);
    } else {
      discountAmount = Math.min(numValue, itemTotal);
      discountPercent = itemTotal > 0 ? (discountAmount / itemTotal) * 100 : 0;
    }

    const finalPrice = itemTotal - discountAmount;
    const exceedsLimit = discountPercent > effectiveCap;

    // Determine what's exceeded
    let exceedsRole = false;
    let exceedsCategory = false;
    let exceedsBrand = false;

    if (exceedsLimit) {
      exceedsRole = discountPercent > ROLE_DISCOUNT_CAPS[userRole];
      exceedsCategory = discountPercent > CATEGORY_DISCOUNT_CAPS[discountCategory];
      if (isLuxury && LUXURY_BRAND_CAPS[item.brand]) {
        exceedsBrand = discountPercent > LUXURY_BRAND_CAPS[item.brand];
      }
    }

    return {
      itemTotal,
      discountPercent,
      discountAmount,
      finalPrice,
      exceedsLimit,
      exceedsRole,
      exceedsCategory,
      exceedsBrand,
    };
  }, [item, inputValue, discountType, effectiveCap, userRole, discountCategory, isLuxury]);

  const handleQuickDiscount = (percent: number) => {
    setDiscountType('percent');
    setInputValue(percent.toString());
    setShowApprovalForm(false);
  };

  const handleApply = () => {
    if (!priceValidation.canDiscount || calculations.exceedsLimit) return;
    onApply(
      Math.round(calculations.discountPercent * 100) / 100,
      calculations.discountAmount
    );
  };

  const handleRequestApproval = async () => {
    if (!onRequestApproval || !approvalReason.trim()) return;

    setIsSubmitting(true);
    try {
      await onRequestApproval(approvalReason, calculations.discountPercent);
      onClose();
    } catch (error) {
      console.error('Failed to request approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearDiscount = () => {
    onApply(0, 0);
  };

  // If product can't be sold at all (offer > mrp)
  if (!priceValidation.canSell) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Product Blocked</h2>
            <p className="text-gray-600 mb-4">{priceValidation.error}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left text-sm mb-4">
              <p><span className="font-medium">MRP:</span> {formatCurrency(item.mrp)}</p>
              <p><span className="font-medium">Offer Price:</span> {formatCurrency(item.offerPrice)}</p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If product is already discounted by HQ (offer < mrp)
  if (!priceValidation.canDiscount && item.offerPrice < item.mrp) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldX className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Further Discounts</h2>
            <p className="text-gray-600 mb-4">
              This product is already discounted by HQ. Store-level discounts are not permitted.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-left text-sm mb-4">
              <p><span className="font-medium">MRP:</span> {formatCurrency(item.mrp)}</p>
              <p><span className="font-medium">HQ Offer Price:</span> {formatCurrency(item.offerPrice)}</p>
              <p className="text-green-600 font-medium mt-1">
                HQ Discount: {((1 - item.offerPrice / item.mrp) * 100).toFixed(1)}%
              </p>
            </div>
            <button onClick={onClose} className="btn-primary w-full">
              Understood
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bv-red-100 rounded-full flex items-center justify-center">
              <Percent className="w-5 h-5 text-bv-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Apply Discount</h2>
              <p className="text-sm text-gray-500 truncate max-w-[200px]">
                {item.productName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Item Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Unit Price (MRP = Offer)</span>
              <span className="font-medium">{formatCurrency(item.offerPrice)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Quantity</span>
              <span className="font-medium">{item.quantity}</span>
            </div>
            <div className="flex justify-between text-sm mt-1 pt-2 border-t border-gray-200">
              <span className="font-medium text-gray-900">Item Total</span>
              <span className="font-bold">{formatCurrency(calculations.itemTotal)}</span>
            </div>
          </div>

          {/* Discount Caps Info */}
          <div className="space-y-2 mb-4">
            {/* Role Cap */}
            <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <Tag className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-blue-700">
                Your role cap: <strong>{ROLE_DISCOUNT_CAPS[userRole]}%</strong>
              </span>
            </div>

            {/* Category Cap */}
            <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <Info className="w-4 h-4 text-purple-600 flex-shrink-0" />
              <span className="text-purple-700">
                Category ({discountCategory}): <strong>{CATEGORY_DISCOUNT_CAPS[discountCategory]}%</strong>
              </span>
            </div>

            {/* Luxury Brand Cap */}
            {isLuxury && LUXURY_BRAND_CAPS[item.brand] && (
              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-amber-700">
                  Luxury brand ({item.brand}): <strong>{LUXURY_BRAND_CAPS[item.brand]}% max</strong>
                </span>
              </div>
            )}

            {/* Effective Cap */}
            <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-green-700">
                Effective discount cap: <strong>{effectiveCap}%</strong>
              </span>
            </div>
          </div>

          {/* Discount Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setDiscountType('percent')}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                discountType === 'percent'
                  ? 'bg-bv-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Percentage (%)
            </button>
            <button
              onClick={() => setDiscountType('amount')}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                discountType === 'amount'
                  ? 'bg-bv-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              Amount (₹)
            </button>
          </div>

          {/* Discount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {discountType === 'percent' ? 'Discount Percentage' : 'Discount Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                {discountType === 'percent' ? '%' : '₹'}
              </span>
              <input
                type="number"
                value={inputValue}
                onChange={e => {
                  setInputValue(e.target.value);
                  setShowApprovalForm(false);
                }}
                className={clsx(
                  'input-field pl-8 text-lg font-bold',
                  calculations.exceedsLimit && 'border-red-500 focus:border-red-500 focus:ring-red-200'
                )}
                placeholder="0"
                min="0"
                max={discountType === 'percent' ? 100 : calculations.itemTotal}
                step={discountType === 'percent' ? '0.5' : '1'}
              />
            </div>

            {/* Exceeds Limit Warning */}
            {calculations.exceedsLimit && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Exceeds discount limits!
                </div>
                <ul className="text-sm text-red-600 space-y-1 ml-6">
                  {calculations.exceedsRole && (
                    <li>• Role cap ({ROLE_DISCOUNT_CAPS[userRole]}%) exceeded</li>
                  )}
                  {calculations.exceedsCategory && (
                    <li>• Category cap ({CATEGORY_DISCOUNT_CAPS[discountCategory]}%) exceeded</li>
                  )}
                  {calculations.exceedsBrand && (
                    <li>• Brand cap ({LUXURY_BRAND_CAPS[item.brand]}%) exceeded</li>
                  )}
                </ul>
              </div>
            )}
          </div>

          {/* Quick Discount Buttons */}
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-2">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {QUICK_DISCOUNTS.filter(d => d <= effectiveCap).map(percent => (
                <button
                  key={percent}
                  onClick={() => handleQuickDiscount(percent)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    discountType === 'percent' && parseFloat(inputValue) === percent
                      ? 'bg-bv-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  {percent}%
                </button>
              ))}
              {effectiveCap > 0 && !QUICK_DISCOUNTS.includes(effectiveCap) && (
                <button
                  onClick={() => handleQuickDiscount(effectiveCap)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                    discountType === 'percent' && parseFloat(inputValue) === effectiveCap
                      ? 'bg-bv-red-600 text-white'
                      : 'bg-bv-red-100 text-bv-red-600 hover:bg-bv-red-200'
                  )}
                >
                  Max ({effectiveCap}%)
                </button>
              )}
            </div>
          </div>

          {/* Calculation Preview */}
          {parseFloat(inputValue) > 0 && (
            <div className={clsx(
              'rounded-lg p-3 mb-4 border',
              calculations.exceedsLimit
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            )}>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount</span>
                <span className={clsx(
                  'font-medium',
                  calculations.exceedsLimit ? 'text-red-600' : 'text-green-600'
                )}>
                  -{calculations.discountPercent.toFixed(1)}% ({formatCurrency(calculations.discountAmount)})
                </span>
              </div>
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-900">Final Price</span>
                <span className={clsx(
                  'font-bold',
                  calculations.exceedsLimit ? 'text-red-700' : 'text-green-700'
                )}>
                  {formatCurrency(calculations.finalPrice)}
                </span>
              </div>
            </div>
          )}

          {/* Approval Request Form */}
          {calculations.exceedsLimit && onRequestApproval && (
            <div className="mb-4">
              {!showApprovalForm ? (
                <button
                  onClick={() => setShowApprovalForm(true)}
                  className="w-full py-3 px-4 bg-amber-100 border border-amber-300 rounded-lg text-amber-700 font-medium flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Request Manager Approval
                </button>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <h4 className="font-medium text-amber-800 mb-2">Request Approval</h4>
                  <p className="text-sm text-amber-700 mb-3">
                    Requesting {calculations.discountPercent.toFixed(1)}% discount (Cap: {effectiveCap}%)
                  </p>
                  <textarea
                    value={approvalReason}
                    onChange={e => setApprovalReason(e.target.value)}
                    placeholder="Reason for higher discount (e.g., customer loyalty, bulk order, price match)..."
                    className="input-field text-sm mb-3"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowApprovalForm(false)}
                      className="flex-1 btn-outline text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRequestApproval}
                      disabled={!approvalReason.trim() || isSubmitting}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between sticky bottom-0 bg-white">
          {item.discountAmount > 0 && (
            <button
              onClick={handleClearDiscount}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove Discount
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={calculations.exceedsLimit || parseFloat(inputValue) <= 0}
              className="btn-primary"
            >
              Apply {calculations.exceedsLimit ? `(Max ${effectiveCap}%)` : 'Discount'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscountModal;
