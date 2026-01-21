// ============================================================================
// IMS 2.0 - Orders Page
// ============================================================================

import { useState } from 'react';
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
} from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../../types';
import clsx from 'clsx';

// Mock orders data
const mockOrders = [
  {
    id: 'ord-001',
    orderNumber: 'BV-KOL-001-2501-0001',
    storeId: 'BV-KOL-001',
    customerId: 'cust-001',
    customerName: 'Rajesh Kumar',
    customerPhone: '9876543210',
    patientName: 'Rajesh Kumar',
    items: [
      { name: 'Ray-Ban RB5154 Clubmaster', qty: 1, price: 6890 },
      { name: 'Essilor Crizal Prevencia (Pair)', qty: 1, price: 7000 },
    ],
    subtotal: 13890,
    discount: 1000,
    tax: 2320,
    grandTotal: 15210,
    amountPaid: 15210,
    balanceDue: 0,
    orderStatus: 'DELIVERED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    hasWorkshopJob: true,
    workshopStatus: 'DELIVERED',
    createdBy: 'Amit Sales',
    createdAt: '2025-01-18T10:30:00Z',
    deliveredAt: '2025-01-20T14:00:00Z',
  },
  {
    id: 'ord-002',
    orderNumber: 'BV-KOL-001-2501-0002',
    storeId: 'BV-KOL-001',
    customerId: 'cust-002',
    customerName: 'Sunita Sharma',
    customerPhone: '9988776655',
    patientName: 'Sunita Sharma',
    items: [
      { name: 'Zeiss DriveSafe (Pair)', qty: 1, price: 15000 },
      { name: 'Titan Frame Premium', qty: 1, price: 8500 },
    ],
    subtotal: 23500,
    discount: 2000,
    tax: 3870,
    grandTotal: 25370,
    amountPaid: 10000,
    balanceDue: 15370,
    orderStatus: 'READY' as OrderStatus,
    paymentStatus: 'PARTIAL' as PaymentStatus,
    hasWorkshopJob: true,
    workshopStatus: 'READY',
    createdBy: 'Priya Sales',
    createdAt: '2025-01-19T15:45:00Z',
  },
  {
    id: 'ord-003',
    orderNumber: 'BV-KOL-001-2501-0003',
    storeId: 'BV-KOL-001',
    customerId: 'cust-003',
    customerName: 'Vikram Mehta',
    customerPhone: '9123456789',
    items: [
      { name: 'Apple Watch Series 9', qty: 1, price: 42900 },
    ],
    subtotal: 42900,
    discount: 0,
    tax: 7722,
    grandTotal: 50622,
    amountPaid: 50622,
    balanceDue: 0,
    orderStatus: 'DELIVERED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    hasWorkshopJob: false,
    createdBy: 'Amit Sales',
    createdAt: '2025-01-20T11:00:00Z',
    deliveredAt: '2025-01-20T11:30:00Z',
  },
  {
    id: 'ord-004',
    orderNumber: 'BV-KOL-001-2501-0004',
    storeId: 'BV-KOL-001',
    customerId: 'cust-004',
    customerName: 'Ananya Das',
    customerPhone: '9876512345',
    patientName: 'Ananya Das',
    items: [
      { name: 'Acuvue Oasys (6 pack)', qty: 2, price: 3600 },
    ],
    subtotal: 3600,
    discount: 200,
    tax: 612,
    grandTotal: 4012,
    amountPaid: 4012,
    balanceDue: 0,
    orderStatus: 'CONFIRMED' as OrderStatus,
    paymentStatus: 'PAID' as PaymentStatus,
    hasWorkshopJob: false,
    createdBy: 'Priya Sales',
    createdAt: '2025-01-21T09:15:00Z',
  },
  {
    id: 'ord-005',
    orderNumber: 'BV-KOL-001-2501-0005',
    storeId: 'BV-KOL-001',
    customerId: 'cust-005',
    customerName: 'Rahul Singh',
    customerPhone: '9988112233',
    patientName: 'Rahul Singh',
    items: [
      { name: 'Ray-Ban Meta Smart Glasses', qty: 1, price: 29990 },
    ],
    subtotal: 29990,
    discount: 0,
    tax: 5398,
    grandTotal: 35388,
    amountPaid: 0,
    balanceDue: 35388,
    orderStatus: 'IN_PROGRESS' as OrderStatus,
    paymentStatus: 'PENDING' as PaymentStatus,
    hasWorkshopJob: true,
    workshopStatus: 'IN_PROGRESS',
    createdBy: 'Amit Sales',
    createdAt: '2025-01-21T14:30:00Z',
  },
];

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

export function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);

  // Filter orders
  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = !searchQuery ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || order.orderStatus === statusFilter;

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

    return matchesSearch && matchesStatus && matchesDate;
  });

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
  const todayOrders = mockOrders.filter(o => {
    const orderDate = new Date(o.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  });
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const pendingDelivery = mockOrders.filter(o => ['CONFIRMED', 'IN_PROGRESS', 'READY'].includes(o.orderStatus)).length;
  const pendingPayments = mockOrders.filter(o => o.balanceDue > 0).reduce((sum, o) => sum + o.balanceDue, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500">Manage and track all orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Today's Orders</p>
              <p className="text-xl font-bold text-gray-900">{todayOrders.length}</p>
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
              <p className="text-xl font-bold text-gray-900">{formatCurrency(todaySales)}</p>
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
              <p className="text-xl font-bold text-yellow-600">{pendingDelivery}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(pendingPayments)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row gap-4">
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
                  className="p-4 hover:bg-gray-50 transition-colors"
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
                          <Calendar className="w-3 h-3" />
                          {formatDate(order.createdAt)}
                        </span>
                        {order.hasWorkshopJob && (
                          <span className="text-purple-600">Workshop: {order.workshopStatus}</span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        {order.items.map((item, i) => (
                          <span key={i}>
                            {i > 0 && ', '}
                            {item.name} × {item.qty}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(order.grandTotal)}</p>
                      {order.balanceDue > 0 && (
                        <p className="text-sm text-red-600">Due: {formatCurrency(order.balanceDue)}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors" title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
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
