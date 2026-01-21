// ============================================================================
// IMS 2.0 - Point of Sale Page
// ============================================================================
// Implements the optical sale flow:
// Customer → Patient → Eye Test/Prescription → Frame → Lens → Payment

import { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CustomerSearch } from '../../components/pos/CustomerSearch';
import { PatientSelector } from '../../components/pos/PatientSelector';
import { ProductSearch } from '../../components/pos/ProductSearch';
import { Cart } from '../../components/pos/Cart';
import { PrescriptionModal } from '../../components/pos/PrescriptionModal';
import { PaymentModal } from '../../components/pos/PaymentModal';
import { DiscountModal } from '../../components/pos/DiscountModal';
import { OrderSummary } from '../../components/pos/OrderSummary';
import type { Customer, Patient, Prescription, Payment, ProductCategory, CartItem } from '../../types';
import { User, ShoppingCart, CreditCard, Percent, FileText, X, AlertCircle } from 'lucide-react';

// ============================================================================
// POS State Types
// ============================================================================

interface POSState {
  // Customer & Patient
  customer: Customer | null;
  selectedPatient: Patient | null;

  // Prescription
  prescription: Prescription | null;

  // Cart
  items: CartItem[];

  // Payments
  payments: Payment[];

  // UI State
  step: 'customer' | 'products' | 'payment' | 'complete';
}

// Categories that require prescription
const PRESCRIPTION_REQUIRED_CATEGORIES: ProductCategory[] = [
  'OPTICAL_LENS',
  'CONTACT_LENS',
  'COLORED_CONTACT_LENS',
];

// ============================================================================
// POS Page Component
// ============================================================================

export function POSPage() {
  const { user, hasRole } = useAuth();

  // Main POS state
  const [state, setState] = useState<POSState>({
    customer: null,
    selectedPatient: null,
    prescription: null,
    items: [],
    payments: [],
    step: 'customer',
  });

  // Modal states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);

  // Pending lens item (waiting for prescription)
  const [pendingLensItem, setPendingLensItem] = useState<Partial<CartItem> | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // Customer Selection
  // ============================================================================

  const handleCustomerSelect = useCallback((customer: Customer) => {
    setState(prev => ({
      ...prev,
      customer,
      selectedPatient: customer.patients?.[0] || null, // Auto-select first patient
      step: 'products',
    }));
    setError(null);
  }, []);

  const handlePatientSelect = useCallback((patient: Patient) => {
    setState(prev => ({
      ...prev,
      selectedPatient: patient,
      prescription: null, // Reset prescription when patient changes
    }));
  }, []);

  const handleClearCustomer = useCallback(() => {
    setState({
      customer: null,
      selectedPatient: null,
      prescription: null,
      items: [],
      payments: [],
      step: 'customer',
    });
    setError(null);
  }, []);

  // ============================================================================
  // Product/Item Management
  // ============================================================================

  const handleAddProduct = useCallback((product: {
    id: string;
    name: string;
    sku: string;
    category: ProductCategory;
    mrp: number;
    offerPrice: number;
    stockId?: string;
    barcode?: string;
  }) => {
    const requiresPrescription = PRESCRIPTION_REQUIRED_CATEGORIES.includes(product.category);

    // If prescription required and not yet linked, show prescription modal
    if (requiresPrescription && !state.prescription) {
      setPendingLensItem({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        quantity: 1,
        unitPrice: product.offerPrice,
        discountPercent: 0,
        discountAmount: 0,
        finalPrice: product.offerPrice,
        requiresPrescription: true,
        prescriptionLinked: false,
        stockId: product.stockId,
        barcode: product.barcode,
      });
      setShowPrescriptionModal(true);
      return;
    }

    // Add item to cart
    const newItem: CartItem = {
      id: `item-${Date.now()}`,
      itemType: product.category,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      quantity: 1,
      unitPrice: product.offerPrice,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: product.offerPrice,
      requiresPrescription,
      prescriptionLinked: requiresPrescription && !!state.prescription,
      prescriptionId: requiresPrescription ? state.prescription?.id : undefined,
      stockId: product.stockId,
      barcode: product.barcode,
    };

    setState(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  }, [state.prescription]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  }, []);

  const handleUpdateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setState(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        const finalPrice = (item.unitPrice * quantity) - item.discountAmount;
        return { ...item, quantity, finalPrice };
      }),
    }));
  }, []);

  // ============================================================================
  // Prescription Management
  // ============================================================================

  const handlePrescriptionSelect = useCallback((prescription: Prescription) => {
    setState(prev => ({
      ...prev,
      prescription,
      // Update all lens items to link prescription
      items: prev.items.map(item => {
        if (item.requiresPrescription) {
          return { ...item, prescriptionLinked: true, prescriptionId: prescription.id };
        }
        return item;
      }),
    }));

    // If there was a pending lens item, add it now
    if (pendingLensItem) {
      const newItem: CartItem = {
        ...pendingLensItem as CartItem,
        id: `item-${Date.now()}`,
        prescriptionLinked: true,
        prescriptionId: prescription.id,
      };
      setState(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }));
      setPendingLensItem(null);
    }

    setShowPrescriptionModal(false);
  }, [pendingLensItem]);

  const handlePrescriptionModalClose = useCallback(() => {
    setShowPrescriptionModal(false);
    setPendingLensItem(null);
  }, []);

  // ============================================================================
  // Discount Management
  // ============================================================================

  const handleApplyDiscount = useCallback((itemId: string, discountPercent: number, discountAmount: number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id !== itemId) return item;
        const finalPrice = (item.unitPrice * item.quantity) - discountAmount;
        return { ...item, discountPercent, discountAmount, finalPrice };
      }),
    }));
    setShowDiscountModal(false);
    setSelectedItemForDiscount(null);
  }, []);

  const openDiscountModal = useCallback((itemId: string) => {
    setSelectedItemForDiscount(itemId);
    setShowDiscountModal(true);
  }, []);

  // ============================================================================
  // Payment Management
  // ============================================================================

  const handleAddPayment = useCallback((payment: Omit<Payment, 'id' | 'paidAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      paidAt: new Date().toISOString(),
    };

    setState(prev => ({
      ...prev,
      payments: [...prev.payments, newPayment],
    }));
  }, []);

  const handleRemovePayment = useCallback((paymentId: string) => {
    setState(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== paymentId),
    }));
  }, []);

  // ============================================================================
  // Order Calculations
  // ============================================================================

  const subtotal = state.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalDiscount = state.items.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxableAmount = subtotal - totalDiscount;
  const gstAmount = Math.round(taxableAmount * 0.18 * 100) / 100; // 18% GST
  const grandTotal = Math.round(taxableAmount + gstAmount);
  const amountPaid = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = grandTotal - amountPaid;

  // ============================================================================
  // Order Submission
  // ============================================================================

  const handleProceedToPayment = useCallback(() => {
    // Validate cart
    if (state.items.length === 0) {
      setError('Please add items to cart');
      return;
    }

    // Check if all lens items have prescription
    const unlinkedLensItems = state.items.filter(
      item => item.requiresPrescription && !item.prescriptionLinked
    );

    if (unlinkedLensItems.length > 0) {
      setError('Prescription is mandatory for lens items. Please add a prescription.');
      setShowPrescriptionModal(true);
      return;
    }

    setError(null);
    setShowPaymentModal(true);
  }, [state.items]);

  const handleCompleteOrder = useCallback(async () => {
    // Validate payment
    if (balanceDue > 0) {
      setError(`Balance due: ₹${balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    try {
      // Here we would call the API to create the order
      // const order = await orderApi.createOrder({...});

      // For now, just show success
      setState(prev => ({ ...prev, step: 'complete' }));
      setShowPaymentModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    }
  }, [balanceDue]);

  const handleNewOrder = useCallback(() => {
    setState({
      customer: null,
      selectedPatient: null,
      prescription: null,
      items: [],
      payments: [],
      step: 'customer',
    });
    setError(null);
  }, []);

  // ============================================================================
  // Render
  // ============================================================================

  // Order complete screen
  if (state.step === 'complete') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Complete!</h1>
          <p className="text-gray-500 mb-6">Order has been placed successfully.</p>
          <div className="space-x-3">
            <button className="btn-outline" onClick={() => window.print()}>
              Print Invoice
            </button>
            <button className="btn-primary" onClick={handleNewOrder}>
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Error Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main POS Layout - Split View */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Panel - Customer & Products */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Customer Section */}
          <div className="card mb-4">
            {!state.customer ? (
              <CustomerSearch onSelect={handleCustomerSelect} />
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-bv-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-bv-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{state.customer.name}</p>
                    <p className="text-sm text-gray-500">{state.customer.phone}</p>
                  </div>
                </div>

                {/* Patient Selector */}
                {state.customer.patients && state.customer.patients.length > 0 && (
                  <PatientSelector
                    patients={state.customer.patients}
                    selectedPatient={state.selectedPatient}
                    onSelect={handlePatientSelect}
                  />
                )}

                {/* Prescription Badge */}
                {state.prescription && (
                  <div className="badge-success flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Rx Linked
                  </div>
                )}

                <button
                  onClick={handleClearCustomer}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Change customer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Product Search - Only show after customer selected */}
          {state.customer && (
            <div className="flex-1 min-h-0">
              <ProductSearch
                onAddProduct={handleAddProduct}
                onAddPrescription={() => setShowPrescriptionModal(true)}
                hasPrescription={!!state.prescription}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Cart & Summary */}
        <div className="w-96 flex flex-col min-h-0">
          <div className="card flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({state.items.length})
              </h2>
              {state.items.length > 0 && (
                <button
                  onClick={() => setState(prev => ({ ...prev, items: [] }))}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <Cart
                items={state.items}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateItemQuantity}
                onApplyDiscount={openDiscountModal}
              />
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <OrderSummary
                subtotal={subtotal}
                totalDiscount={totalDiscount}
                gstAmount={gstAmount}
                grandTotal={grandTotal}
                amountPaid={amountPaid}
                balanceDue={balanceDue}
              />

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={handleProceedToPayment}
                  disabled={state.items.length === 0}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPrescriptionModal && state.selectedPatient && (
        <PrescriptionModal
          patient={state.selectedPatient}
          existingPrescription={state.prescription}
          onSelect={handlePrescriptionSelect}
          onClose={handlePrescriptionModalClose}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          grandTotal={grandTotal}
          amountPaid={amountPaid}
          balanceDue={balanceDue}
          payments={state.payments}
          onAddPayment={handleAddPayment}
          onRemovePayment={handleRemovePayment}
          onComplete={handleCompleteOrder}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {showDiscountModal && selectedItemForDiscount && (
        <DiscountModal
          item={state.items.find(i => i.id === selectedItemForDiscount)!}
          maxDiscountPercent={user?.discountCap || 10}
          onApply={(percent, amount) => handleApplyDiscount(selectedItemForDiscount, percent, amount)}
          onClose={() => {
            setShowDiscountModal(false);
            setSelectedItemForDiscount(null);
          }}
        />
      )}
    </div>
  );
}

export default POSPage;
