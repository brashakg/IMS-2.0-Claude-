// ============================================================================
// IMS 2.0 - Point of Sale Page (Comprehensive)
// ============================================================================
// Full-featured POS with: Customer Search, Category Tabs, Prescription Panel,
// Order Items Table, Order Details, Payment Collection, Lens Details Modal

import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CustomerSearch } from '../../components/pos/CustomerSearch';
import { PrescriptionPanel } from '../../components/pos/PrescriptionPanel';
import { OrderItemsTable } from '../../components/pos/OrderItemsTable';
import { OrderDetailsPanel } from '../../components/pos/OrderDetailsPanel';
import { PaymentCollectionPanel } from '../../components/pos/PaymentCollectionPanel';
import { LensDetailsModal } from '../../components/pos/LensDetailsModal';
import type { Customer, Patient, Prescription, Payment, PaymentMode, CartItem, ProductCategory } from '../../types';
import { inventoryApi, orderApi, prescriptionApi } from '../../services/api';
import {
  User, ShoppingCart, X, AlertCircle, Check,
  Glasses, Sun, Eye, Watch, Ear, Package, Wrench, Barcode,
  Plus, Printer, Save, RotateCcw
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface OrderDetailsData {
  deliveryDate: string;
  deliveryTime: string;
  salesPerson: string;
  notes: string;
  isExpress: boolean;
  isUrgent: boolean;
}

// Category definitions with icons
const CATEGORIES = [
  { id: 'spectacles', label: 'Spectacles', icon: Glasses, color: 'text-blue-600 bg-blue-50', productCategory: 'FRAME' as ProductCategory },
  { id: 'sunglasses', label: 'Sunglasses', icon: Sun, color: 'text-amber-600 bg-amber-50', productCategory: 'SUNGLASS' as ProductCategory },
  { id: 'contact-lens', label: 'Contact Lens', icon: Eye, color: 'text-green-600 bg-green-50', productCategory: 'CONTACT_LENS' as ProductCategory },
  { id: 'watch', label: 'Watch', icon: Watch, color: 'text-purple-600 bg-purple-50', productCategory: 'WATCH' as ProductCategory },
  { id: 'hearing-aid', label: 'Hearing Aid', icon: Ear, color: 'text-pink-600 bg-pink-50', productCategory: 'ACCESSORIES' as ProductCategory },
  { id: 'accessories', label: 'Accessories', icon: Package, color: 'text-gray-600 bg-gray-50', productCategory: 'ACCESSORIES' as ProductCategory },
  { id: 'repair', label: 'Repair', icon: Wrench, color: 'text-orange-600 bg-orange-50', productCategory: 'SERVICES' as ProductCategory },
];

// Categories requiring prescription
const PRESCRIPTION_CATEGORIES = ['spectacles', 'contact-lens'];

// ============================================================================
// POS Page Component
// ============================================================================

export function POSPage() {
  const { user } = useAuth();
  const toast = useToast();

  // Customer state
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Category state
  const [activeCategory, setActiveCategory] = useState('spectacles');

  // Prescription state
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Order items state
  const [orderItems, setOrderItems] = useState<CartItem[]>([]);

  // Order details state
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [orderDetails, setOrderDetails] = useState<OrderDetailsData>({
    deliveryDate: tomorrow,
    deliveryTime: '',
    salesPerson: '',
    notes: '',
    isExpress: false,
    isUrgent: false,
  });

  // Payment state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [orderDiscount, setOrderDiscount] = useState({ percent: 0, amount: 0 });

  // Modal states
  const [showLensModal, setShowLensModal] = useState(false);
  const [selectedItemForLens, setSelectedItemForLens] = useState<string | null>(null);

  // Barcode input
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Order complete state
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrderNumber, setCompletedOrderNumber] = useState<string | null>(null);

  // Draft order for online payment
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [draftOrderNumber, setDraftOrderNumber] = useState<string | null>(null);

  // ============================================================================
  // Calculations
  // ============================================================================

  const subtotal = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + gstAmount - orderDiscount.amount;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balanceDue = grandTotal - totalPaid;

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCustomerSelect = useCallback((selectedCustomer: Customer) => {
    setCustomer(selectedCustomer);
    setSelectedPatient(selectedCustomer.patients?.[0] || null);
    setError(null);
    toast.success(`Customer selected: ${selectedCustomer.name}`);
  }, [toast]);

  const handleClearCustomer = useCallback(() => {
    setCustomer(null);
    setSelectedPatient(null);
    setPrescription(null);
    setOrderItems([]);
    setOrderDetails({
      deliveryDate: tomorrow,
      deliveryTime: '',
      salesPerson: '',
      notes: '',
      isExpress: false,
      isUrgent: false,
    });
    setPayments([]);
    setOrderDiscount({ percent: 0, amount: 0 });
    setError(null);
  }, [tomorrow]);

  const handlePrescriptionChange = useCallback((newPrescription: Prescription) => {
    setPrescription(newPrescription);
  }, []);

  const handleBarcodeSubmit = useCallback(async (barcode: string) => {
    if (!barcode.trim()) return;

    try {
      setError(null);

      // Fetch product from API by barcode
      const stockUnit = await inventoryApi.getStockByBarcode(barcode);

      if (!stockUnit) {
        throw new Error(`Product not found for barcode: ${barcode}`);
      }

      // Check if product is available
      if (stockUnit.status !== 'AVAILABLE' || stockUnit.quantity < 1) {
        throw new Error(`Product is not available (Status: ${stockUnit.status})`);
      }

      // Get product details - assuming stockUnit has product info or we need another API call
      // For now, using stockUnit data directly
      const activeCat = CATEGORIES.find(c => c.id === activeCategory);
      const productCategory = activeCat?.productCategory || 'FRAME';
      const requiresPrescription = PRESCRIPTION_CATEGORIES.includes(activeCategory);

      const newItem: CartItem = {
        id: `item-${Date.now()}`,
        itemType: productCategory,
        productId: stockUnit.productId,
        productName: stockUnit.productName || `Product ${stockUnit.productId}`,
        sku: stockUnit.sku || barcode,
        category: productCategory,
        brand: stockUnit.brand || '',
        quantity: 1,
        unitPrice: stockUnit.price || 0,
        mrp: stockUnit.mrp || stockUnit.price || 0,
        offerPrice: stockUnit.offerPrice || stockUnit.price || 0,
        discountPercent: 0,
        discountAmount: 0,
        finalPrice: stockUnit.offerPrice || stockUnit.price || 0,
        barcode,
        requiresPrescription,
        prescriptionLinked: requiresPrescription && !!prescription,
        prescriptionId: prescription?.id,
      };

      setOrderItems(prev => [...prev, newItem]);
      setBarcodeInput('');
      toast.success(`Added: ${newItem.productName}`);

      // If spectacles/contact lens, prompt for lens details
      if (requiresPrescription && !prescription) {
        setSelectedItemForLens(newItem.id);
        setShowLensModal(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to lookup product';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [activeCategory, prescription, toast]);

  const handleAddManualItem = useCallback(() => {
    const activeCat = CATEGORIES.find(c => c.id === activeCategory);
    const productCategory = activeCat?.productCategory || 'FRAME';
    const requiresPrescription = PRESCRIPTION_CATEGORIES.includes(activeCategory);

    const newItem: CartItem = {
      id: `item-${Date.now()}`,
      itemType: productCategory,
      productId: '',
      productName: 'New Item',
      sku: '',
      category: productCategory,
      brand: '',
      quantity: 1,
      unitPrice: 0,
      mrp: 0,
      offerPrice: 0,
      discountPercent: 0,
      discountAmount: 0,
      finalPrice: 0,
      requiresPrescription,
      prescriptionLinked: false,
    };
    setOrderItems(prev => [...prev, newItem]);
  }, [activeCategory]);

  const handleUpdateItemQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity < 1) return;

    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const basePrice = item.unitPrice * quantity;
      const discountAmount = Math.round(basePrice * item.discountPercent / 100);
      const finalPrice = basePrice - discountAmount;

      return { ...item, quantity, finalPrice };
    }));
  }, []);

  const handleUpdateItemPrice = useCallback((itemId: string, newPrice: number, discountPercent: number) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;

      const basePrice = item.offerPrice || item.unitPrice;
      const discountAmount = Math.round((basePrice * item.quantity * discountPercent) / 100);
      const finalPrice = newPrice * item.quantity;

      return {
        ...item,
        discountPercent,
        discountAmount,
        finalPrice,
      };
    }));
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed');
  }, [toast]);

  const handleOpenLensDetails = useCallback((itemId: string) => {
    setSelectedItemForLens(itemId);
    setShowLensModal(true);
  }, []);

  const handleSaveLensDetails = useCallback((lensDetails: any) => {
    if (selectedItemForLens) {
      setOrderItems(prev => prev.map(item => {
        if (item.id !== selectedItemForLens) return item;
        // Update item with lens details - in real app, this would update pricing too
        return {
          ...item,
          prescriptionLinked: true,
          prescriptionId: prescription?.id,
        };
      }));
      toast.success('Lens details saved');
    }
    setShowLensModal(false);
    setSelectedItemForLens(null);
  }, [selectedItemForLens, prescription, toast]);

  const handleAddPayment = useCallback((payment: Omit<Payment, 'id' | 'paidAt'>) => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      paidAt: new Date().toISOString(),
    };
    setPayments(prev => [...prev, newPayment]);
  }, []);

  const handleRemovePayment = useCallback((paymentId: string) => {
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  }, []);

  const handleInitiateOnlinePayment = useCallback(async (): Promise<{ orderId: string; orderNumber: string }> => {
    // Return existing draft order if available
    if (draftOrderId && draftOrderNumber) {
      return { orderId: draftOrderId, orderNumber: draftOrderNumber };
    }

    // Validation - same as handleCompleteOrder
    if (!customer) {
      setError('Please select a customer');
      toast.error('Please select a customer');
      throw new Error('Please select a customer');
    }

    if (orderItems.length === 0) {
      setError('Please add items to the order');
      toast.error('Please add items to the order');
      throw new Error('Please add items to the order');
    }

    // Check for items requiring prescription
    const itemsNeedingPrescription = orderItems.filter(
      item => item.requiresPrescription && !item.prescriptionLinked
    );
    if (itemsNeedingPrescription.length > 0) {
      setError('Please link prescription for all optical items');
      toast.error('Please link prescription for all optical items');
      throw new Error('Please link prescription for all optical items');
    }

    try {
      setError(null);

      // Prepare order data for API
      const orderData = {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name,
        storeId: user?.activeStoreId || '',
        items: orderItems.map(item => ({
          itemType: item.itemType,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          mrp: item.mrp,
          offerPrice: item.offerPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
          finalPrice: item.finalPrice,
          prescriptionId: item.prescriptionId,
          lensOptions: item.lensOptions,
        })),
        payments: [], // Payments will be added after online payment
        subtotal,
        totalDiscount: orderDiscount.amount,
        taxAmount: gstAmount,
        grandTotal,
        amountPaid: 0,
        balanceDue: grandTotal,
        orderStatus: 'DRAFT',
        paymentStatus: 'UNPAID',
        notes: orderDetails.notes,
        expectedDelivery: orderDetails.deliveryDate
          ? new Date(`${orderDetails.deliveryDate}T${orderDetails.deliveryTime || '00:00'}`).toISOString()
          : undefined,
        isExpress: orderDetails.isExpress,
        isUrgent: orderDetails.isUrgent,
      };

      // Create draft order via API
      const createdOrder = await orderApi.createOrder(orderData);

      // Save draft order info
      setDraftOrderId(createdOrder.id);
      setDraftOrderNumber(createdOrder.orderNumber);

      toast.success(`Draft order ${createdOrder.orderNumber} created`);

      return {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create draft order';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  }, [
    draftOrderId,
    draftOrderNumber,
    customer,
    selectedPatient,
    orderItems,
    subtotal,
    orderDiscount,
    gstAmount,
    grandTotal,
    orderDetails,
    user?.activeStoreId,
    toast,
  ]);

  const handleHoldOrder = useCallback(() => {
    // Save to local storage or API
    toast.success('Order held for later');
  }, [toast]);

  const handlePrintBill = useCallback(() => {
    window.print();
  }, []);

  const handleCompleteOrder = useCallback(async () => {
    // Validation
    if (!customer) {
      setError('Please select a customer');
      return;
    }

    if (orderItems.length === 0) {
      setError('Please add items to the order');
      return;
    }

    // Check for items requiring prescription
    const itemsNeedingPrescription = orderItems.filter(
      item => item.requiresPrescription && !item.prescriptionLinked
    );
    if (itemsNeedingPrescription.length > 0) {
      setError('Please link prescription for all optical items');
      return;
    }

    // Check payment - allow credit
    const creditPayment = payments.find(p => p.mode === 'CREDIT');
    if (balanceDue > 0 && !creditPayment) {
      setError(`Balance due: ₹${balanceDue.toLocaleString('en-IN')}. Add payment or mark as credit.`);
      return;
    }

    try {
      setError(null);

      let finalOrderId: string;
      let finalOrderNumber: string;

      // Check if draft order exists (from online payment)
      if (draftOrderId && draftOrderNumber) {
        // Use existing draft order
        finalOrderId = draftOrderId;
        finalOrderNumber = draftOrderNumber;

        // Add any manual payments that were added after online payment
        const manualPayments = payments.filter(p => p.mode !== 'UPI'); // Razorpay payments are marked as UPI
        for (const payment of manualPayments) {
          await orderApi.addPayment(finalOrderId, {
            mode: payment.mode,
            amount: payment.amount,
            reference: payment.reference,
            notes: payment.notes,
          });
        }

        // Confirm the order if fully paid
        if (balanceDue <= 0) {
          await orderApi.confirmOrder(finalOrderId);
        }

        toast.success(`Order ${finalOrderNumber} completed successfully!`);
      } else {
        // Create new order (original flow)
        const orderData = {
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone,
          patientId: selectedPatient?.id,
          patientName: selectedPatient?.name,
          storeId: user?.activeStoreId || '',
          items: orderItems.map(item => ({
            itemType: item.itemType,
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            mrp: item.mrp,
            offerPrice: item.offerPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            finalPrice: item.finalPrice,
            prescriptionId: item.prescriptionId,
            lensOptions: item.lensOptions,
          })),
          payments: payments.map(p => ({
            mode: p.mode,
            amount: p.amount,
            reference: p.reference,
            notes: p.notes,
          })),
          subtotal,
          totalDiscount: orderDiscount.amount,
          taxAmount: gstAmount,
          grandTotal,
          amountPaid: totalPaid,
          balanceDue: Math.max(0, balanceDue),
          orderStatus: 'DRAFT',
          paymentStatus: balanceDue <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
          notes: orderDetails.notes,
          expectedDelivery: orderDetails.deliveryDate
            ? new Date(`${orderDetails.deliveryDate}T${orderDetails.deliveryTime || '00:00'}`).toISOString()
            : undefined,
          isExpress: orderDetails.isExpress,
          isUrgent: orderDetails.isUrgent,
        };

        // Create order via API
        const createdOrder = await orderApi.createOrder(orderData);
        finalOrderId = createdOrder.id;
        finalOrderNumber = createdOrder.orderNumber;

        // If we have full payment, confirm the order immediately
        if (balanceDue <= 0) {
          await orderApi.confirmOrder(finalOrderId);
        }

        toast.success(`Order ${finalOrderNumber} created successfully!`);
      }

      setCompletedOrderNumber(finalOrderNumber);
      setOrderComplete(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create order';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [
    draftOrderId,
    draftOrderNumber,
    customer,
    selectedPatient,
    orderItems,
    payments,
    balanceDue,
    subtotal,
    gstAmount,
    grandTotal,
    totalPaid,
    orderDiscount,
    orderDetails,
    user,
    toast,
  ]);

  const handleNewOrder = useCallback(() => {
    handleClearCustomer();
    setOrderComplete(false);
    setCompletedOrderNumber(null);
    setDraftOrderId(null);
    setDraftOrderNumber(null);
  }, [handleClearCustomer]);

  // Focus barcode input on mount and category change
  useEffect(() => {
    if (customer && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [customer, activeCategory]);

  // ============================================================================
  // Order Complete Screen
  // ============================================================================

  if (orderComplete) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Complete!</h1>
          <p className="text-lg text-gray-700 mb-1">Order #{completedOrderNumber}</p>
          <p className="text-gray-500 mb-6">
            Customer: {customer?.name} | Total: ₹{grandTotal.toLocaleString('en-IN')}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              className="btn-outline flex items-center gap-2"
              onClick={handlePrintBill}
            >
              <Printer className="w-4 h-4" />
              Print Invoice
            </button>
            <button
              className="btn-primary flex items-center gap-2"
              onClick={handleNewOrder}
            >
              <Plus className="w-4 h-4" />
              New Order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main POS Layout
  // ============================================================================

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col gap-4">
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm text-red-700 flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Section: Customer + Category Tabs */}
      <div className="flex gap-4">
        {/* Customer Section */}
        <div className="flex-1">
          {!customer ? (
            <CustomerSearch onSelect={handleCustomerSelect} />
          ) : (
            <div className="card py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-bv-red-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-bv-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                  {customer.customerType === 'B2B' && (
                    <span className="badge-info">B2B</span>
                  )}
                  {orderDetails.isExpress && (
                    <span className="badge-warning">Express</span>
                  )}
                  {orderDetails.isUrgent && (
                    <span className="badge-error">Urgent</span>
                  )}
                </div>

                {/* Patient selector if multiple patients */}
                {customer.patients && customer.patients.length > 1 && (
                  <select
                    value={selectedPatient?.id || ''}
                    onChange={(e) => {
                      const patient = customer.patients?.find(p => p.id === e.target.value);
                      if (patient) setSelectedPatient(patient);
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    {customer.patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={handleClearCustomer}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Clear and start new"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Show rest of POS only when customer is selected */}
      {customer && (
        <>
          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-bv-red-600 text-white shadow-md'
                      : `${cat.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Content Area - 3 Column Layout */}
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
            {/* Left Column: Prescription (if optical) + Barcode + Items */}
            <div className="col-span-7 flex flex-col gap-4 min-h-0 overflow-y-auto">
              {/* Prescription Panel - Only for optical categories */}
              {PRESCRIPTION_CATEGORIES.includes(activeCategory) && (
                <PrescriptionPanel
                  prescription={prescription}
                  onPrescriptionChange={handlePrescriptionChange}
                  onOpenModal={() => setShowPrescriptionModal(true)}
                  patientName={selectedPatient?.name}
                />
              )}

              {/* Barcode Scanner Input */}
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleBarcodeSubmit(barcodeInput);
                        }
                      }}
                      placeholder="Scan barcode or enter product code..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleBarcodeSubmit(barcodeInput)}
                    className="btn-primary px-4 py-2.5"
                  >
                    Add
                  </button>
                  <button
                    onClick={handleAddManualItem}
                    className="btn-outline px-4 py-2.5"
                    title="Add item manually"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Items Table */}
              <div className="flex-1 min-h-0">
                <OrderItemsTable
                  items={orderItems}
                  onRemoveItem={handleRemoveItem}
                  onUpdateQuantity={handleUpdateItemQuantity}
                  onUpdateItemPrice={handleUpdateItemPrice}
                  onAddByBarcode={handleBarcodeSubmit}
                  onOpenLensDetails={handleOpenLensDetails}
                  userRole={user?.activeRole || 'SALES_STAFF'}
                  userDiscountCap={user?.discountCap}
                />
              </div>
            </div>

            {/* Right Column: Order Details + Payment */}
            <div className="col-span-5 flex flex-col gap-4 min-h-0 overflow-y-auto">
              {/* Order Details Panel */}
              <OrderDetailsPanel
                orderDetails={orderDetails}
                onChange={setOrderDetails}
              />

              {/* Payment Collection Panel */}
              <PaymentCollectionPanel
                grandTotal={grandTotal}
                payments={payments}
                onAddPayment={handleAddPayment}
                onRemovePayment={handleRemovePayment}
                customerName={customer?.name}
                customerEmail={customer?.email}
                customerContact={customer?.phone}
                orderId={draftOrderId || undefined}
                orderNumber={draftOrderNumber || undefined}
                onInitiateOnlinePayment={handleInitiateOnlinePayment}
                allowCredit={true}
              />

              {/* Order Summary & Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                {/* Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal ({orderItems.length} items)</span>
                    <span className="text-gray-900">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {orderDiscount.amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount ({orderDiscount.percent}%)</span>
                      <span className="text-green-600">-₹{orderDiscount.amount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">GST (18%)</span>
                    <span className="text-gray-900">₹{gstAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold border-t pt-2">
                    <span>Grand Total</span>
                    <span className="text-bv-red-600">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="text-green-600">₹{totalPaid.toLocaleString('en-IN')}</span>
                  </div>
                  {balanceDue > 0 && (
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-red-600">Balance Due</span>
                      <span className="text-red-600">₹{balanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleHoldOrder}
                    className="btn-outline py-2.5 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Hold
                  </button>
                  <button
                    onClick={handlePrintBill}
                    className="btn-outline py-2.5 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  <button
                    onClick={handleCompleteOrder}
                    disabled={orderItems.length === 0}
                    className="col-span-2 btn-primary py-3 flex items-center justify-center gap-2 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-5 h-5" />
                    Complete Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lens Details Modal */}
      {showLensModal && (
        <LensDetailsModal
          onClose={() => {
            setShowLensModal(false);
            setSelectedItemForLens(null);
          }}
          onSave={handleSaveLensDetails}
        />
      )}
    </div>
  );
}

export default POSPage;
