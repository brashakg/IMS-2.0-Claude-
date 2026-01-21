// ============================================================================
// IMS 2.0 - Razorpay Payment Modal
// ============================================================================
// Handles Razorpay payment gateway integration for POS orders

import { useState, useEffect, useCallback } from 'react';
import { X, CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface RazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerContact?: string;
  orderNumber?: string;
  onPaymentSuccess: (paymentData: {
    paymentId: string;
    razorpayPaymentId: string;
    amount: number;
    method: string;
  }) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

type PaymentStatus = 'idle' | 'loading' | 'success' | 'error' | 'verifying';

export function RazorpayPaymentModal({
  isOpen,
  onClose,
  orderId,
  amount,
  customerName,
  customerEmail,
  customerContact,
  orderNumber,
  onPaymentSuccess,
}: RazorpayPaymentModalProps) {
  const toast = useToast();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    if (isOpen && !razorpayLoaded) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setRazorpayLoaded(true);
      script.onerror = () => {
        setStatus('error');
        setErrorMessage('Failed to load Razorpay. Please check your internet connection.');
      };
      document.body.appendChild(script);
      return () => {
        document.body.removeChild(script);
      };
    }
  }, [isOpen, razorpayLoaded]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  const initiatePayment = useCallback(async () => {
    if (!razorpayLoaded) {
      setErrorMessage('Razorpay is still loading. Please wait...');
      return;
    }

    try {
      setStatus('loading');
      setErrorMessage('');

      // Step 1: Create Razorpay order
      const orderResponse = await paymentApi.createPaymentOrder({
        orderId,
        amount,
        customerName,
        customerEmail,
        customerContact,
        notes: {
          orderNumber: orderNumber || orderId,
        },
      });

      const { payment_id, razorpay_order_id, checkout_options } = orderResponse;

      // Step 2: Open Razorpay Checkout
      const options = {
        ...checkout_options,
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Payment successful, verify signature
          setStatus('verifying');

          try {
            const verifyResponse = await paymentApi.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
            });

            // Payment verified
            setStatus('success');
            toast.success('Payment successful!');

            // Callback with payment data
            onPaymentSuccess({
              paymentId: payment_id,
              razorpayPaymentId: verifyResponse.razorpay_payment_id,
              amount: verifyResponse.amount,
              method: verifyResponse.method || 'RAZORPAY',
            });

            // Close modal after 2 seconds
            setTimeout(() => {
              onClose();
            }, 2000);
          } catch (error) {
            setStatus('error');
            const errorMsg = error instanceof Error ? error.message : 'Payment verification failed';
            setErrorMessage(errorMsg);
            toast.error(errorMsg);
          }
        },
        modal: {
          ondismiss: () => {
            setStatus('idle');
            toast.warning('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Failed to initiate payment';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  }, [
    razorpayLoaded,
    orderId,
    amount,
    customerName,
    customerEmail,
    customerContact,
    orderNumber,
    onPaymentSuccess,
    onClose,
    toast,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Pay with Razorpay
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={status === 'loading' || status === 'verifying'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {orderNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium text-gray-900">{orderNumber}</span>
              </div>
            )}
            {customerName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{customerName}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold border-t border-gray-200 pt-2 mt-2">
              <span className="text-gray-700">Amount to Pay:</span>
              <span className="text-blue-600">₹{amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Status Messages */}
          {status === 'loading' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <span className="text-sm text-blue-700">Creating payment order...</span>
            </div>
          )}

          {status === 'verifying' && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
              <span className="text-sm text-amber-700">Verifying payment...</span>
            </div>
          )}

          {status === 'success' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Payment Successful!</p>
                <p className="text-xs text-green-600 mt-1">Order will be confirmed shortly.</p>
              </div>
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Payment Failed</p>
                <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Payment Methods Info */}
          {status === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                You can pay using any of the following methods:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>UPI</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Cards</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Net Banking</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>Wallets</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={status === 'loading' || status === 'verifying'}
          >
            Cancel
          </button>
          <button
            onClick={initiatePayment}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            disabled={
              status === 'loading' ||
              status === 'verifying' ||
              status === 'success' ||
              !razorpayLoaded
            }
          >
            {status === 'loading' || status === 'verifying' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Completed
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay ₹{amount.toLocaleString('en-IN')}
              </>
            )}
          </button>
        </div>

        {/* Razorpay Branding */}
        <div className="px-4 pb-3 text-center">
          <p className="text-xs text-gray-400">
            Secured by <span className="font-semibold text-blue-600">Razorpay</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RazorpayPaymentModal;
