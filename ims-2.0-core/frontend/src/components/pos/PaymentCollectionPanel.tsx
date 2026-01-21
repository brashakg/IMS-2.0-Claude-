// ============================================================================
// IMS 2.0 - Payment Collection Panel for POS
// ============================================================================
// Inline payment collection matching Emergent design - Cash, Card, UPI, Credit

import { useState, useCallback, useEffect } from 'react';
import { Banknote, CreditCard, Smartphone, UserCheck, Calculator, AlertCircle } from 'lucide-react';
import type { Payment, PaymentMode } from '../../types';

interface PaymentCollectionPanelProps {
  grandTotal: number;
  payments: Payment[];
  onAddPayment: (payment: Omit<Payment, 'id' | 'paidAt'>) => void;
  onRemovePayment: (paymentId: string) => void;
  customerName?: string;
  allowCredit?: boolean;
}

interface PaymentField {
  mode: PaymentMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder: string;
  color: string;
}

const PAYMENT_FIELDS: PaymentField[] = [
  { mode: 'CASH', label: 'Cash', icon: Banknote, placeholder: '₹ 0', color: 'bg-green-50 border-green-200 focus:border-green-500' },
  { mode: 'CARD', label: 'Card', icon: CreditCard, placeholder: '₹ 0', color: 'bg-blue-50 border-blue-200 focus:border-blue-500' },
  { mode: 'UPI', label: 'Upi', icon: Smartphone, placeholder: '₹ 0', color: 'bg-purple-50 border-purple-200 focus:border-purple-500' },
  { mode: 'CREDIT', label: 'Credit', icon: UserCheck, placeholder: '₹ 0', color: 'bg-amber-50 border-amber-200 focus:border-amber-500' },
];

export function PaymentCollectionPanel({
  grandTotal,
  payments,
  onAddPayment,
  onRemovePayment,
  customerName,
  allowCredit = true,
}: PaymentCollectionPanelProps) {
  // Individual payment amounts
  const [amounts, setAmounts] = useState<Record<PaymentMode, string>>({
    CASH: '',
    CARD: '',
    UPI: '',
    CREDIT: '',
    BANK_TRANSFER: '',
    EMI: '',
    GIFT_VOUCHER: '',
  });

  // Calculate totals
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = grandTotal - totalCollected;

  // Calculate from input fields
  const inputTotal = Object.entries(amounts).reduce((sum, [_, value]) => {
    const num = parseFloat(value) || 0;
    return sum + num;
  }, 0);

  // Update amount for a payment mode
  const updateAmount = (mode: PaymentMode, value: string) => {
    // Only allow numbers and decimals
    const sanitized = value.replace(/[^0-9.]/g, '');
    setAmounts(prev => ({ ...prev, [mode]: sanitized }));
  };

  // Handle adding all payments at once
  const handleCollectPayments = useCallback(() => {
    Object.entries(amounts).forEach(([mode, value]) => {
      const amount = parseFloat(value);
      if (amount > 0) {
        onAddPayment({
          mode: mode as PaymentMode,
          amount,
        });
      }
    });
    // Reset amounts
    setAmounts({
      CASH: '',
      CARD: '',
      UPI: '',
      CREDIT: '',
      BANK_TRANSFER: '',
      EMI: '',
      GIFT_VOUCHER: '',
    });
  }, [amounts, onAddPayment]);

  // Quick fill remaining balance
  const fillBalance = (mode: PaymentMode) => {
    const currentTotal = Object.entries(amounts).reduce((sum, [m, v]) => {
      if (m !== mode) return sum + (parseFloat(v) || 0);
      return sum;
    }, 0);
    const remaining = Math.max(0, balanceDue - currentTotal);
    setAmounts(prev => ({ ...prev, [mode]: remaining > 0 ? remaining.toString() : '' }));
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-900 text-sm">Payment Collection</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Payment Input Fields */}
        {PAYMENT_FIELDS.map(({ mode, label, icon: Icon, placeholder, color }) => {
          // Skip credit if not allowed
          if (mode === 'CREDIT' && !allowCredit) return null;

          return (
            <div key={mode}>
              <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
              <div className="relative">
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={amounts[mode]}
                  onChange={e => updateAmount(mode, e.target.value)}
                  onDoubleClick={() => fillBalance(mode)}
                  className={`w-full pl-10 pr-3 py-2.5 text-sm border rounded-lg focus:outline-none ${color}`}
                  placeholder={placeholder}
                  title="Double-click to fill remaining balance"
                />
              </div>
            </div>
          );
        })}

        {/* Credit warning */}
        {amounts.CREDIT && parseFloat(amounts.CREDIT) > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-amber-700">
              {customerName ? `${customerName}'s` : 'Customer'} outstanding will increase
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          {/* Total Collected */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-green-600 font-medium">Total Collected:</span>
            <span className="font-bold text-green-600">
              {formatCurrency(totalCollected + inputTotal)}
            </span>
          </div>

          {/* Summary Section */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sub Total</span>
              <span className="font-medium">{formatCurrency(grandTotal)}</span>
            </div>

            {/* Discount Row - Placeholder for now */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Discount</span>
              <div className="flex items-center gap-2">
                <select className="px-2 py-1 text-xs border border-gray-200 rounded">
                  <option value="%">%</option>
                  <option value="₹">₹</option>
                </select>
                <input
                  type="number"
                  defaultValue={0}
                  className="w-16 px-2 py-1 text-right text-sm border border-gray-200 rounded"
                  min="0"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between">
              <span className="font-medium text-gray-900">Net Total</span>
              <span className="font-bold text-gray-900 text-lg">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className={`font-medium ${balanceDue - inputTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Balance Due
              </span>
              <span className={`font-bold text-lg ${balanceDue - inputTotal > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(Math.max(0, balanceDue - inputTotal))}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Payments */}
        {payments.length > 0 && (
          <div className="space-y-2 pt-2">
            <p className="text-xs text-gray-500">Collected Payments:</p>
            {payments.map(payment => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-2 bg-green-50 border border-green-100 rounded text-sm"
              >
                <span className="text-green-700">
                  {payment.mode}: {formatCurrency(payment.amount)}
                </span>
                <button
                  onClick={() => onRemovePayment(payment.id)}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentCollectionPanel;
