// ============================================================================
// IMS 2.0 - Enhanced Payment Modal Component
// ============================================================================
// Supports all payment methods:
// - Cash, UPI, Card, Bank Transfer
// - EMI (with tenure selection)
// - Credit (for known customers)
// - Gift Voucher (with code validation)
// - Partial payments and advance payments

import { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Calendar,
  UserCheck,
  Gift,
  Info,
  AlertTriangle,
} from 'lucide-react';
import type { Payment, PaymentMode, Customer } from '../../types';
import clsx from 'clsx';
import { formatCurrency } from '../../utils/pricing';

interface PaymentModalProps {
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  payments: Payment[];
  customer?: Customer | null;
  allowPartialPayment?: boolean;
  minimumAdvance?: number; // For order confirmation
  onAddPayment: (payment: Omit<Payment, 'id' | 'paidAt'>) => void;
  onRemovePayment: (paymentId: string) => void;
  onComplete: (isPartialPayment?: boolean) => void;
  onClose: () => void;
}

// Extended payment mode configuration
const PAYMENT_MODES: {
  mode: PaymentMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiresRef: boolean;
  refLabel?: string;
  refPlaceholder?: string;
  description?: string;
}[] = [
  {
    mode: 'CASH',
    label: 'Cash',
    icon: Banknote,
    color: 'bg-green-100 text-green-600',
    requiresRef: false,
  },
  {
    mode: 'UPI',
    label: 'UPI',
    icon: Smartphone,
    color: 'bg-purple-100 text-purple-600',
    requiresRef: true,
    refLabel: 'UPI Transaction ID',
    refPlaceholder: 'e.g., 123456789012',
  },
  {
    mode: 'CARD',
    label: 'Card',
    icon: CreditCard,
    color: 'bg-blue-100 text-blue-600',
    requiresRef: true,
    refLabel: 'Card Last 4 / Auth Code',
    refPlaceholder: 'e.g., 4242 / A12345',
  },
  {
    mode: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    icon: Building2,
    color: 'bg-orange-100 text-orange-600',
    requiresRef: true,
    refLabel: 'Transfer Reference',
    refPlaceholder: 'e.g., NEFT123456',
  },
  {
    mode: 'EMI',
    label: 'EMI',
    icon: Calendar,
    color: 'bg-indigo-100 text-indigo-600',
    requiresRef: true,
    refLabel: 'EMI Details',
    refPlaceholder: 'Bank, Tenure',
    description: 'Bank EMI with tenure',
  },
  {
    mode: 'CREDIT',
    label: 'Credit',
    icon: UserCheck,
    color: 'bg-amber-100 text-amber-600',
    requiresRef: false,
    description: 'For known customers only',
  },
  {
    mode: 'GIFT_VOUCHER',
    label: 'Gift Voucher',
    icon: Gift,
    color: 'bg-pink-100 text-pink-600',
    requiresRef: true,
    refLabel: 'Voucher Code',
    refPlaceholder: 'e.g., GV-12345',
  },
];

// EMI tenure options
const EMI_TENURES = [
  { months: 3, label: '3 Months' },
  { months: 6, label: '6 Months' },
  { months: 9, label: '9 Months' },
  { months: 12, label: '12 Months' },
  { months: 18, label: '18 Months' },
  { months: 24, label: '24 Months' },
];

// EMI partner banks
const EMI_BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI Cards',
  'Axis Bank',
  'Kotak Bank',
  'Bajaj Finserv',
];

// Quick amount options
const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

export function PaymentModal({
  grandTotal,
  amountPaid,
  balanceDue,
  payments,
  customer,
  allowPartialPayment = false,
  minimumAdvance,
  onAddPayment,
  onRemovePayment,
  onComplete,
  onClose,
}: PaymentModalProps) {
  const [selectedMode, setSelectedMode] = useState<PaymentMode>('CASH');
  const [amount, setAmount] = useState<string>(balanceDue > 0 ? balanceDue.toString() : '');
  const [reference, setReference] = useState('');

  // EMI specific state
  const [emiBank, setEmiBank] = useState('');
  const [emiTenure, setEmiTenure] = useState(6);

  // Gift voucher state
  const [voucherCode, setVoucherCode] = useState('');
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState('');

  // Get current mode config
  const currentModeConfig = useMemo(() => {
    return PAYMENT_MODES.find(m => m.mode === selectedMode);
  }, [selectedMode]);

  // Check if credit is allowed (only for known customers)
  const canUseCredit = useMemo(() => {
    return customer && customer.id;
  }, [customer]);

  // Calculate minimum payment required
  const minPaymentRequired = useMemo(() => {
    if (minimumAdvance && minimumAdvance > 0) {
      return Math.max(0, minimumAdvance - amountPaid);
    }
    return balanceDue;
  }, [minimumAdvance, amountPaid, balanceDue]);

  const handleModeSelect = (mode: PaymentMode) => {
    // Check credit eligibility
    if (mode === 'CREDIT' && !canUseCredit) {
      return;
    }
    setSelectedMode(mode);
    setReference('');
    setVoucherCode('');
    setVoucherError('');
  };

  const handleAddPayment = () => {
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) return;

    // Build reference based on payment type
    let paymentRef = reference;
    if (selectedMode === 'EMI') {
      paymentRef = `${emiBank} - ${emiTenure} months`;
    } else if (selectedMode === 'GIFT_VOUCHER') {
      paymentRef = voucherCode;
    }

    onAddPayment({
      mode: selectedMode,
      amount: paymentAmount,
      reference: paymentRef || undefined,
    });

    // Reset form
    setAmount('');
    setReference('');
    setVoucherCode('');
    setEmiBank('');
    setEmiTenure(6);

    // Update amount to remaining balance
    const newBalance = balanceDue - paymentAmount;
    if (newBalance > 0) {
      setAmount(newBalance.toString());
    }
  };

  const handleValidateVoucher = async () => {
    if (!voucherCode) return;

    setIsValidatingVoucher(true);
    setVoucherError('');

    // TODO: Call API to validate voucher
    // For now, simulate validation
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock validation - accept codes starting with 'GV-'
    if (!voucherCode.startsWith('GV-')) {
      setVoucherError('Invalid voucher code');
    }

    setIsValidatingVoucher(false);
  };

  const handleQuickAmount = (quickAmount: number) => {
    setAmount(quickAmount.toString());
  };

  const handlePayExact = () => {
    setAmount(balanceDue.toString());
  };

  const isPaymentComplete = balanceDue <= 0;
  const canAddPayment = parseFloat(amount) > 0 && !isNaN(parseFloat(amount)) &&
    (selectedMode !== 'EMI' || (emiBank && emiTenure)) &&
    (selectedMode !== 'GIFT_VOUCHER' || (voucherCode && !voucherError));

  // Check if minimum advance is met for partial payment
  const canProceedPartial = allowPartialPayment && amountPaid >= (minimumAdvance || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bv-red-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-bv-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Payment</h2>
              <p className="text-sm text-gray-500">
                Total: {formatCurrency(grandTotal)}
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 laptop:grid-cols-2 gap-6">
            {/* Left - Payment Entry */}
            <div>
              {/* Payment Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_MODES.map(({ mode, label, icon: Icon, color, description }) => {
                    const isDisabled = mode === 'CREDIT' && !canUseCredit;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleModeSelect(mode)}
                        disabled={isDisabled}
                        className={clsx(
                          'flex items-center gap-2 p-3 rounded-lg border transition-colors text-left',
                          selectedMode === mode
                            ? 'border-bv-red-500 bg-bv-red-50'
                            : isDisabled
                            ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        title={isDisabled ? 'Only available for registered customers' : undefined}
                      >
                        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-medium text-sm block">{label}</span>
                          {description && (
                            <span className="text-xs text-gray-400 truncate block">{description}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="input-field pl-8 text-lg font-bold"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_AMOUNTS.map(quickAmount => (
                    <button
                      key={quickAmount}
                      onClick={() => handleQuickAmount(quickAmount)}
                      className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      +₹{quickAmount.toLocaleString('en-IN')}
                    </button>
                  ))}
                  <button
                    onClick={handlePayExact}
                    className="px-3 py-1.5 text-sm bg-bv-red-100 text-bv-red-600 hover:bg-bv-red-200 rounded-lg transition-colors font-medium"
                  >
                    Exact ({formatCurrency(balanceDue)})
                  </button>
                </div>
              </div>

              {/* EMI Options */}
              {selectedMode === 'EMI' && (
                <div className="space-y-4 mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Bank
                    </label>
                    <select
                      value={emiBank}
                      onChange={e => setEmiBank(e.target.value)}
                      className="input-field"
                    >
                      <option value="">Choose bank...</option>
                      {EMI_BANKS.map(bank => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tenure
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {EMI_TENURES.map(({ months, label }) => (
                        <button
                          key={months}
                          onClick={() => setEmiTenure(months)}
                          className={clsx(
                            'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                            emiTenure === months
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {emiBank && emiTenure && parseFloat(amount) > 0 && (
                    <div className="p-3 bg-white rounded-lg text-sm">
                      <p className="text-gray-600">
                        EMI: <strong>{formatCurrency(parseFloat(amount) / emiTenure)}/month</strong> for {emiTenure} months
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Gift Voucher */}
              {selectedMode === 'GIFT_VOUCHER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={e => {
                        setVoucherCode(e.target.value.toUpperCase());
                        setVoucherError('');
                      }}
                      className={clsx(
                        'input-field flex-1',
                        voucherError && 'border-red-500'
                      )}
                      placeholder="Enter voucher code"
                    />
                    <button
                      onClick={handleValidateVoucher}
                      disabled={!voucherCode || isValidatingVoucher}
                      className="btn-outline"
                    >
                      {isValidatingVoucher ? 'Checking...' : 'Validate'}
                    </button>
                  </div>
                  {voucherError && (
                    <p className="text-sm text-red-500 mt-1">{voucherError}</p>
                  )}
                </div>
              )}

              {/* Credit Warning */}
              {selectedMode === 'CREDIT' && (
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-700">
                      <p className="font-medium">Credit Payment</p>
                      <p className="mt-1">
                        This amount will be added to customer's outstanding balance.
                        {customer && (
                          <span className="block mt-1 font-medium">
                            Customer: {customer.name} ({customer.phone})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reference for other modes */}
              {currentModeConfig?.requiresRef && selectedMode !== 'EMI' && selectedMode !== 'GIFT_VOUCHER' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {currentModeConfig.refLabel}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="input-field"
                    placeholder={currentModeConfig.refPlaceholder}
                  />
                </div>
              )}

              {/* Add Payment Button */}
              <button
                onClick={handleAddPayment}
                disabled={!canAddPayment || isPaymentComplete}
                className="btn-primary w-full py-3"
              >
                Add Payment
              </button>
            </div>

            {/* Right - Payment Summary */}
            <div>
              {/* Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Grand Total</span>
                    <span className="font-bold">{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(amountPaid)}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="font-medium text-gray-900">Balance Due</span>
                    <span className={clsx(
                      'font-bold text-lg',
                      balanceDue > 0 ? 'text-red-600' : 'text-green-600'
                    )}>
                      {balanceDue > 0 ? formatCurrency(balanceDue) : 'PAID'}
                    </span>
                  </div>
                </div>

                {/* Minimum Advance Info */}
                {allowPartialPayment && minimumAdvance && minimumAdvance > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm">
                      <Info className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-600">
                        Min. advance: {formatCurrency(minimumAdvance)}
                      </span>
                      {amountPaid >= minimumAdvance && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment List */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Payments</h3>
                {payments.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                    No payments added yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {payments.map(payment => {
                      const modeConfig = PAYMENT_MODES.find(m => m.mode === payment.mode);
                      const Icon = modeConfig?.icon || Banknote;
                      return (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={clsx(
                              'w-8 h-8 rounded-lg flex items-center justify-center',
                              modeConfig?.color || 'bg-gray-100'
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {modeConfig?.label}
                                {payment.reference && ` • ${payment.reference}`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onRemovePayment(payment.id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {isPaymentComplete ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Payment Complete</span>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-outline">
                  Back
                </button>
                <button onClick={() => onComplete(false)} className="btn-primary">
                  Complete Order
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  {formatCurrency(balanceDue)} remaining
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-outline">
                  Back
                </button>
                {allowPartialPayment && canProceedPartial ? (
                  <button
                    onClick={() => onComplete(true)}
                    className="btn-outline border-bv-red-300 text-bv-red-600 hover:bg-bv-red-50"
                  >
                    Save as Partial ({formatCurrency(balanceDue)} due)
                  </button>
                ) : null}
                <button
                  onClick={() => onComplete(false)}
                  disabled={!isPaymentComplete}
                  className="btn-primary opacity-50 cursor-not-allowed"
                  title="Complete payment to proceed"
                >
                  Complete Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
