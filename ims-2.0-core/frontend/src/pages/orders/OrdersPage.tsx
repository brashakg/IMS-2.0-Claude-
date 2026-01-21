// ============================================================================
// IMS 2.0 - Orders Page
// Full-featured order management with MockDataContext integration
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  ChevronRight,
  Filter,
  Calendar,
  User,
  CreditCard,
  Eye,
  Printer,
  RefreshCw,
  X,
  Phone,
  MapPin,
  Download,
  Send,
  MessageSquare,
  IndianRupee,
  Receipt,
  ArrowLeft,
  Edit2,
  Trash2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import type { OrderStatus, PaymentStatus, PaymentMode, Order } from '../../types';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';
import clsx from 'clsx';

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: React.ComponentType<any>; class: string }> = {
  DRAFT: { label: 'Draft', icon: FileText, class: 'bg-gray-100 text-gray-600' },
  CONFIRMED: { label: 'Confirmed', icon: CheckCircle, class: 'bg-blue-100 text-blue-600' },
  IN_PROGRESS: { label: 'In Progress', icon: RefreshCw, class: 'bg-yellow-100 text-yellow-600' },
  READY: { label: 'Ready', icon: Package, class: 'bg-green-100 text-green-600' },
  DELIVERED: { label: 'Delivered', icon: Truck, class: 'bg-emerald-100 text-emerald-600' },
  CANCELLED: { label: 'Cancelled', icon: XCircle, class: 'bg-red-100 text-red-600' },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; class: string }> = {
  PENDING: { label: 'Unpaid', class: 'badge-error' },
  PARTIAL: { label: 'Partial', class: 'badge-warning' },
  PAID: { label: 'Paid', class: 'badge-success' },
};

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'EMI', label: 'EMI' },
];

export function OrdersPage() {
  const { orders, updateOrderStatus, addPaymentToOrder, getCustomerById } = useMockData();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Payment form
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [paymentReference, setPaymentReference] = useState('');

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchQuery ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone?.includes(searchQuery);

      const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;
      const matchesPayment = paymentFilter === 'ALL' || order.paymentStatus === paymentFilter;

      // Date filtering
      let matchesDate = true;
      const orderDate = new Date(order.createdAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = orderDate >= weekAgo;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        matchesDate = orderDate >= monthAgo;
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, dateFilter]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const pendingDelivery = orders.filter(o => ['CONFIRMED', 'IN_PROGRESS', 'READY'].includes(o.orderStatus)).length;
    const pendingPayments = orders.filter(o => o.balanceDue > 0).reduce((sum, o) => sum + o.balanceDue, 0);
    const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + o.grandTotal, 0) / orders.length : 0;

    return { todayOrders: todayOrders.length, todaySales, pendingDelivery, pendingPayments, avgOrderValue };
  }, [orders]);

  // Handle status update
  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    toast.success(`Order status updated to ${STATUS_CONFIG[newStatus].label}`);
    setShowStatusModal(false);
  };

  // Handle payment collection
  const handleCollectPayment = () => {
    if (!selectedOrder || paymentAmount <= 0) return;

    if (paymentAmount > selectedOrder.balanceDue) {
      toast.error('Payment amount cannot exceed balance due');
      return;
    }

    addPaymentToOrder(selectedOrder.id, {
      mode: paymentMode,
      amount: paymentAmount,
      reference: paymentReference || undefined,
    });

    toast.success(`Payment of ${formatCurrency(paymentAmount)} collected successfully`);
    setShowPaymentModal(false);
    setPaymentAmount(0);
    setPaymentReference('');

    // Refresh selected order
    const updatedOrder = orders.find(o => o.id === selectedOrder.id);
    if (updatedOrder) setSelectedOrder(updatedOrder);
  };

  // Send WhatsApp notification
  const sendWhatsAppNotification = (order: Order, type: 'ready' | 'reminder') => {
    const message = type === 'ready'
      ? `Hi ${order.customerName}, your order ${order.orderNumber} is ready for pickup! Visit our store to collect.`
      : `Hi ${order.customerName}, this is a reminder about your pending balance of ${formatCurrency(order.balanceDue)} for order ${order.orderNumber}.`;

    // In production, this would call the WhatsApp API
    toast.success(`WhatsApp notification sent to ${order.customerPhone}`);
  };

  // Print invoice
  const printInvoice = (order: Order) => {
    toast.info(`Printing invoice for ${order.orderNumber}`);
    // In production, this would trigger print dialog
  };

  // Order Detail View
  if (selectedOrder) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedOrder(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{selectedOrder.orderNumber}</h1>
            <p className="text-gray-500">Created {formatDate(selectedOrder.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => printInvoice(selectedOrder)}
              className="btn-outline flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={() => sendWhatsAppNotification(selectedOrder, 'ready')}
              className="btn-outline flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
          {/* Order Info */}
          <div className="laptop:col-span-2 space-y-4">
            {/* Status & Customer */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Order Details</h2>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    'px-3 py-1 rounded-full text-sm font-medium',
                    STATUS_CONFIG[selectedOrder.orderStatus].class
                  )}>
                    {STATUS_CONFIG[selectedOrder.orderStatus].label}
                  </span>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {selectedOrder.customerPhone}
                  </p>
                </div>
                {selectedOrder.patientName && (
                  <div>
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium">{selectedOrder.patientName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Items</h2>
              <div className="divide-y divide-gray-200">
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.productName}</p>
                      <p className="text-sm text-gray-500">SKU: {item.sku} • Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item.finalPrice)}</p>
                      {item.discountAmount > 0 && (
                        <p className="text-sm text-green-600">-{formatCurrency(item.discountAmount)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.totalDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax (18%)</span>
                  <span>{formatCurrency(selectedOrder.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Grand Total</span>
                  <span>{formatCurrency(selectedOrder.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900">Payment History</h2>
                <span className={PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus].class}>
                  {PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus].label}
                </span>
              </div>

              {selectedOrder.payments.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No payments recorded</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {selectedOrder.payments.map(payment => (
                    <div key={payment.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{payment.mode}</p>
                        <p className="text-sm text-gray-500">
                          {formatDate(payment.paidAt)}
                          {payment.reference && ` • Ref: ${payment.reference}`}
                        </p>
                      </div>
                      <p className="font-medium text-green-600">{formatCurrency(payment.amount)}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Amount Paid</p>
                  <p className="font-bold text-green-600">{formatCurrency(selectedOrder.amountPaid)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Balance Due</p>
                  <p className={clsx('font-bold', selectedOrder.balanceDue > 0 ? 'text-red-600' : 'text-gray-900')}>
                    {formatCurrency(selectedOrder.balanceDue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {selectedOrder.balanceDue > 0 && (
                  <button
                    onClick={() => {
                      setPaymentAmount(selectedOrder.balanceDue);
                      setShowPaymentModal(true);
                    }}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <IndianRupee className="w-4 h-4" />
                    Collect Payment
                  </button>
                )}

                {selectedOrder.orderStatus === 'READY' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'DELIVERED')}
                    className="w-full btn-outline flex items-center justify-center gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Truck className="w-4 h-4" />
                    Mark Delivered
                  </button>
                )}

                {selectedOrder.orderStatus === 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedOrder.id, 'READY')}
                    className="w-full btn-outline flex items-center justify-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Mark Ready
                  </button>
                )}

                <button
                  onClick={() => sendWhatsAppNotification(selectedOrder, selectedOrder.balanceDue > 0 ? 'reminder' : 'ready')}
                  className="w-full btn-outline flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Notification
                </button>

                <button
                  onClick={() => printInvoice(selectedOrder)}
                  className="w-full btn-outline flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Print Receipt
                </button>

                <button className="w-full btn-outline flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Invoice
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <h2 className="font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Order Created</p>
                    <p className="text-xs text-gray-500">{formatDate(selectedOrder.createdAt)}</p>
                  </div>
                </div>
                {selectedOrder.deliveredAt && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Delivered</p>
                      <p className="text-xs text-gray-500">{formatDate(selectedOrder.deliveredAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Collect Payment</h2>
                <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={e => setPaymentAmount(Number(e.target.value))}
                    max={selectedOrder.balanceDue}
                    className="input-field"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Balance due: {formatCurrency(selectedOrder.balanceDue)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                    className="input-field"
                  >
                    {PAYMENT_MODES.map(mode => (
                      <option key={mode.value} value={mode.value}>{mode.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reference (Optional)</label>
                  <input
                    type="text"
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                    className="input-field"
                    placeholder="Transaction ID, Cheque no., etc."
                  />
                </div>

                <button
                  onClick={handleCollectPayment}
                  disabled={paymentAmount <= 0}
                  className="w-full btn-primary"
                >
                  Collect {formatCurrency(paymentAmount)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Update Status</h2>
                <button onClick={() => setShowStatusModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {(Object.keys(STATUS_CONFIG) as OrderStatus[]).map(status => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                      className={clsx(
                        'w-full p-3 rounded-lg flex items-center gap-3 transition-colors',
                        selectedOrder.orderStatus === status
                          ? 'bg-bv-red-50 border-2 border-bv-red-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      )}
                    >
                      <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center', config.class)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Orders List View
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track all orders</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 laptop:grid-cols-5 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-xl font-bold text-gray-900">{stats.todayOrders}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Sales</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.todaySales)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Delivery</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pendingDelivery}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(stats.pendingPayments)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col laptop:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Search by order number, customer..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as OrderStatus | 'ALL')}
              className="input-field w-auto"
            >
              <option value="ALL">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            {/* Payment Filter */}
            <select
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value as PaymentStatus | 'ALL')}
              className="input-field w-auto"
            >
              <option value="ALL">All Payments</option>
              {Object.entries(PAYMENT_STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as typeof dateFilter)}
              className="input-field w-auto"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map(order => {
              const statusConfig = STATUS_CONFIG[order.orderStatus];
              const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-gray-900">{order.orderNumber}</span>
                        <span className={clsx('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', statusConfig.class)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </span>
                        <span className={paymentConfig.class}>{paymentConfig.label}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {order.customerPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {order.items.slice(0, 2).map((item, i) => (
                          <span key={item.id}>
                            {i > 0 && ', '}
                            {item.productName} × {item.quantity}
                          </span>
                        ))}
                        {order.items.length > 2 && ` +${order.items.length - 2} more`}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(order.grandTotal)}</p>
                      {order.balanceDue > 0 && (
                        <p className="text-sm text-red-600">Due: {formatCurrency(order.balanceDue)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); printInvoice(order); }}
                          className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors"
                          title="Print"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {order.balanceDue > 0 && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setPaymentAmount(order.balanceDue);
                              setShowPaymentModal(true);
                            }}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Collect Payment"
                          >
                            <IndianRupee className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
