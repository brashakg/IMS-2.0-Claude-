// ============================================================================
// IMS 2.0 - EMI Management Component
// EMI order tracking, installment management, collection workflows
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface EMIOrder {
  id: string;
  order_id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  order_date: string;
  total_amount: number;
  down_payment: number;
  emi_amount: number;
  tenure_months: number;
  interest_rate: number;
  total_payable: number;
  paid_installments: number;
  total_installments: number;
  next_due_date: string;
  last_payment_date?: string;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  installments: EMIInstallment[];
}

interface EMIInstallment {
  installment_number: number;
  due_date: string;
  amount: number;
  principal: number;
  interest: number;
  paid_amount: number;
  paid_date?: string;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  late_fee?: number;
  payment_mode?: string;
  receipt_number?: string;
}

interface Props {
  storeId?: string;
  onOrderSelect?: (orderId: string) => void;
}

export const EMIManagement: React.FC<Props> = ({ storeId, onOrderSelect }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'overdue' | 'completed' | 'all'>('active');
  const [emiOrders, setEmiOrders] = useState<EMIOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<EMIOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<EMIOrder | null>(null);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<string>('cash');
  const [selectedInstallment, setSelectedInstallment] = useState<EMIInstallment | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'all' | 'this_month' | 'overdue'>('all');

  useEffect(() => {
    loadEMIOrders();
  }, [storeId]);

  useEffect(() => {
    applyFilters();
  }, [emiOrders, activeTab, searchQuery, dateRange]);

  const loadEMIOrders = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/finance/emi-orders?store_id=${storeId || ''}`);
      setEmiOrders(response.data || []);
    } catch (error) {
      // Mock data
      setEmiOrders([
        {
          id: 'EMI001',
          order_id: 'ORD001',
          order_number: 'ORD/2024/1234',
          customer_id: 'CUST001',
          customer_name: 'Ramesh Agarwal',
          customer_phone: '9876543210',
          order_date: '2024-01-15',
          total_amount: 25000,
          down_payment: 5000,
          emi_amount: 3500,
          tenure_months: 6,
          interest_rate: 0,
          total_payable: 26000,
          paid_installments: 2,
          total_installments: 6,
          next_due_date: '2024-04-15',
          last_payment_date: '2024-03-15',
          status: 'active',
          installments: [
            { installment_number: 1, due_date: '2024-02-15', amount: 3500, principal: 3333, interest: 167, paid_amount: 3500, paid_date: '2024-02-14', status: 'paid', payment_mode: 'UPI', receipt_number: 'RCP001' },
            { installment_number: 2, due_date: '2024-03-15', amount: 3500, principal: 3333, interest: 167, paid_amount: 3500, paid_date: '2024-03-15', status: 'paid', payment_mode: 'Cash', receipt_number: 'RCP002' },
            { installment_number: 3, due_date: '2024-04-15', amount: 3500, principal: 3333, interest: 167, paid_amount: 0, status: 'pending' },
            { installment_number: 4, due_date: '2024-05-15', amount: 3500, principal: 3333, interest: 167, paid_amount: 0, status: 'pending' },
            { installment_number: 5, due_date: '2024-06-15', amount: 3500, principal: 3334, interest: 166, paid_amount: 0, status: 'pending' },
            { installment_number: 6, due_date: '2024-07-15', amount: 3500, principal: 3334, interest: 166, paid_amount: 0, status: 'pending' }
          ]
        },
        {
          id: 'EMI002',
          order_id: 'ORD002',
          order_number: 'ORD/2024/1189',
          customer_id: 'CUST002',
          customer_name: 'Sunita Verma',
          customer_phone: '9988776655',
          order_date: '2023-12-01',
          total_amount: 18000,
          down_payment: 3000,
          emi_amount: 2600,
          tenure_months: 6,
          interest_rate: 0,
          total_payable: 18600,
          paid_installments: 3,
          total_installments: 6,
          next_due_date: '2024-03-01',
          last_payment_date: '2024-02-01',
          status: 'active',
          installments: [
            { installment_number: 1, due_date: '2024-01-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 2600, paid_date: '2024-01-01', status: 'paid', payment_mode: 'Cash' },
            { installment_number: 2, due_date: '2024-02-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 2600, paid_date: '2024-02-01', status: 'paid', payment_mode: 'UPI' },
            { installment_number: 3, due_date: '2024-03-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 2600, paid_date: '2024-02-28', status: 'paid', payment_mode: 'Card' },
            { installment_number: 4, due_date: '2024-04-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 0, status: 'overdue', late_fee: 100 },
            { installment_number: 5, due_date: '2024-05-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 0, status: 'pending' },
            { installment_number: 6, due_date: '2024-06-01', amount: 2600, principal: 2500, interest: 100, paid_amount: 0, status: 'pending' }
          ]
        },
        {
          id: 'EMI003',
          order_id: 'ORD003',
          order_number: 'ORD/2023/0987',
          customer_id: 'CUST003',
          customer_name: 'Vikram Singh',
          customer_phone: '9111222333',
          order_date: '2023-09-15',
          total_amount: 35000,
          down_payment: 10000,
          emi_amount: 4200,
          tenure_months: 6,
          interest_rate: 0,
          total_payable: 35200,
          paid_installments: 6,
          total_installments: 6,
          next_due_date: '-',
          last_payment_date: '2024-02-15',
          status: 'completed',
          installments: [
            { installment_number: 1, due_date: '2023-10-15', amount: 4200, principal: 4167, interest: 33, paid_amount: 4200, paid_date: '2023-10-15', status: 'paid', payment_mode: 'Cash' },
            { installment_number: 2, due_date: '2023-11-15', amount: 4200, principal: 4167, interest: 33, paid_amount: 4200, paid_date: '2023-11-14', status: 'paid', payment_mode: 'UPI' },
            { installment_number: 3, due_date: '2023-12-15', amount: 4200, principal: 4167, interest: 33, paid_amount: 4200, paid_date: '2023-12-15', status: 'paid', payment_mode: 'Cash' },
            { installment_number: 4, due_date: '2024-01-15', amount: 4200, principal: 4167, interest: 33, paid_amount: 4200, paid_date: '2024-01-14', status: 'paid', payment_mode: 'Card' },
            { installment_number: 5, due_date: '2024-02-15', amount: 4200, principal: 4166, interest: 34, paid_amount: 4200, paid_date: '2024-02-15', status: 'paid', payment_mode: 'UPI' },
            { installment_number: 6, due_date: '2024-03-15', amount: 4200, principal: 4166, interest: 34, paid_amount: 4200, paid_date: '2024-02-15', status: 'paid', payment_mode: 'Cash' }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...emiOrders];

    // Tab filter
    if (activeTab === 'active') {
      filtered = filtered.filter(o => o.status === 'active');
    } else if (activeTab === 'overdue') {
      filtered = filtered.filter(o =>
        o.status === 'active' && o.installments.some(i => i.status === 'overdue')
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(o => o.status === 'completed');
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_phone.includes(query) ||
        o.order_number.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !selectedInstallment || !paymentAmount) return;

    try {
      await apiClient.post(`/finance/emi-orders/${selectedOrder.id}/payment`, {
        installment_number: selectedInstallment.installment_number,
        amount: parseFloat(paymentAmount),
        payment_mode: paymentMode
      });

      // Update locally for demo
      setEmiOrders(prev => prev.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            paid_installments: order.paid_installments + 1,
            last_payment_date: new Date().toISOString().split('T')[0],
            installments: order.installments.map(inst => {
              if (inst.installment_number === selectedInstallment.installment_number) {
                return {
                  ...inst,
                  paid_amount: parseFloat(paymentAmount),
                  paid_date: new Date().toISOString().split('T')[0],
                  status: 'paid' as const,
                  payment_mode: paymentMode
                };
              }
              return inst;
            })
          };
        }
        return order;
      }));

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedInstallment(null);
    } catch (error) {
      // For demo, update locally anyway
      setEmiOrders(prev => prev.map(order => {
        if (order.id === selectedOrder.id) {
          return {
            ...order,
            paid_installments: order.paid_installments + 1,
            last_payment_date: new Date().toISOString().split('T')[0],
            installments: order.installments.map(inst => {
              if (inst.installment_number === selectedInstallment.installment_number) {
                return {
                  ...inst,
                  paid_amount: parseFloat(paymentAmount),
                  paid_date: new Date().toISOString().split('T')[0],
                  status: 'paid' as const,
                  payment_mode: paymentMode
                };
              }
              return inst;
            })
          };
        }
        return order;
      }));

      setShowPaymentModal(false);
      setPaymentAmount('');
      setSelectedInstallment(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    if (dateStr === '-') return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: EMIOrder['status']): string => {
    const colors: Record<string, string> = {
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-green-100 text-green-700',
      defaulted: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getInstallmentStatusColor = (status: EMIInstallment['status']): string => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      overdue: 'bg-red-100 text-red-700',
      partial: 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getOverdueCount = (): number => {
    return emiOrders.filter(o =>
      o.status === 'active' && o.installments.some(i => i.status === 'overdue')
    ).length;
  };

  const getTotalOverdueAmount = (): number => {
    return emiOrders.reduce((total, order) => {
      if (order.status === 'active') {
        return total + order.installments
          .filter(i => i.status === 'overdue')
          .reduce((sum, i) => sum + (i.amount - i.paid_amount) + (i.late_fee || 0), 0);
      }
      return total;
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">EMI Management</h2>
        <p className="text-gray-600">Track and manage EMI orders and installments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-sm text-blue-600">Active EMIs</span>
          <p className="text-2xl font-bold text-blue-700">
            {emiOrders.filter(o => o.status === 'active').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <span className="text-sm text-red-600">Overdue</span>
          <p className="text-2xl font-bold text-red-700">{getOverdueCount()}</p>
          <span className="text-xs text-red-500">{formatCurrency(getTotalOverdueAmount())}</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-sm text-green-600">Completed</span>
          <p className="text-2xl font-bold text-green-700">
            {emiOrders.filter(o => o.status === 'completed').length}
          </p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <span className="text-sm text-purple-600">Total Outstanding</span>
          <p className="text-2xl font-bold text-purple-700">
            {formatCurrency(
              emiOrders
                .filter(o => o.status === 'active')
                .reduce((sum, o) => sum + (o.total_payable - o.down_payment - (o.paid_installments * o.emi_amount)), 0)
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'active', label: 'Active' },
          { id: 'overdue', label: `Overdue (${getOverdueCount()})` },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, phone, or order number..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No EMI orders found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map(order => (
              <div key={order.id} className="p-4">
                {/* Order Header */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold">
                        {order.customer_name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{order.customer_name}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {order.order_number} • {order.customer_phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total_payable)}</p>
                    <p className="text-sm text-gray-500">
                      {order.paid_installments}/{order.total_installments} EMIs paid
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((order.paid_installments / order.total_installments) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(order.paid_installments / order.total_installments) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedOrder?.id === order.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* Order Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-500">Order Amount</span>
                        <p className="font-medium">{formatCurrency(order.total_amount)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Down Payment</span>
                        <p className="font-medium">{formatCurrency(order.down_payment)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">EMI Amount</span>
                        <p className="font-medium">{formatCurrency(order.emi_amount)}/month</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Next Due</span>
                        <p className="font-medium">{formatDate(order.next_due_date)}</p>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <h4 className="font-medium text-gray-900 mb-2">Installment Schedule</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Due Date</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Paid On</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {order.installments.map(inst => (
                            <tr key={inst.installment_number} className="hover:bg-gray-50">
                              <td className="px-3 py-2">{inst.installment_number}</td>
                              <td className="px-3 py-2">{formatDate(inst.due_date)}</td>
                              <td className="px-3 py-2 text-right">
                                {formatCurrency(inst.amount)}
                                {inst.late_fee && (
                                  <span className="text-red-500 text-xs ml-1">
                                    +{formatCurrency(inst.late_fee)}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getInstallmentStatusColor(inst.status)}`}>
                                  {inst.status}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {inst.paid_date ? (
                                  <div>
                                    <p>{formatDate(inst.paid_date)}</p>
                                    <p className="text-xs text-gray-400">{inst.payment_mode}</p>
                                  </div>
                                ) : '-'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {(inst.status === 'pending' || inst.status === 'overdue') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInstallment(inst);
                                      setPaymentAmount(String(inst.amount + (inst.late_fee || 0)));
                                      setShowPaymentModal(true);
                                    }}
                                    className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                  >
                                    Collect
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedOrder && selectedInstallment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Record EMI Payment
            </h3>

            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p><strong>Customer:</strong> {selectedOrder.customer_name}</p>
                <p><strong>Order:</strong> {selectedOrder.order_number}</p>
                <p><strong>Installment:</strong> #{selectedInstallment.installment_number}</p>
                <p><strong>Due Date:</strong> {formatDate(selectedInstallment.due_date)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {selectedInstallment.late_fee && (
                  <p className="text-xs text-red-500 mt-1">
                    Includes late fee of {formatCurrency(selectedInstallment.late_fee)}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode *
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentAmount('');
                  setSelectedInstallment(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={!paymentAmount}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Record Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
