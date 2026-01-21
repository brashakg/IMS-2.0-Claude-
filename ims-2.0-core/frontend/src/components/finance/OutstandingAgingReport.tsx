/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
// ============================================================================
// IMS 2.0 - Outstanding Aging Report Component
// Accounts receivable aging analysis by customer and age buckets
// ============================================================================

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';

interface AgingBucket {
  label: string;
  min_days: number;
  max_days: number | null;
  amount: number;
  count: number;
}

interface CustomerAging {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_type: 'regular' | 'corporate' | 'walk_in';
  total_outstanding: number;
  current: number; // 0-30 days
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
  oldest_invoice_date: string;
  oldest_invoice_days: number;
  last_payment_date?: string;
  invoices: OutstandingInvoice[];
}

interface OutstandingInvoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  days_overdue: number;
  original_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  order_type: 'sale' | 'emi' | 'credit';
}

interface AgingSummary {
  total_outstanding: number;
  total_customers: number;
  buckets: AgingBucket[];
  overdue_percentage: number;
  average_days_outstanding: number;
}

interface Props {
  storeId?: string;
  onCustomerClick?: (customerId: string) => void;
}

export const OutstandingAgingReport: React.FC<Props> = ({
  storeId,
  onCustomerClick
}) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AgingSummary | null>(null);
  const [customers, setCustomers] = useState<CustomerAging[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerAging[]>([]);

  // Filters
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'days' | 'name'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [customerType, setCustomerType] = useState<string>('all');
  const [minAmount, setMinAmount] = useState<string>('');

  // Expanded customer
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    loadAgingData();
  }, [storeId]);

  useEffect(() => {
    applyFilters();
  }, [customers, selectedBucket, searchQuery, sortBy, sortOrder, customerType, minAmount]);

  const loadAgingData = async () => {
    setLoading(true);
    try {
      const params = storeId ? `?store_id=${storeId}` : '';
      const response = await apiClient.get(`/finance/aging-report${params}`);
      setSummary(response.data.summary);
      setCustomers(response.data.customers || []);
    } catch (error) {
      // Mock data
      const mockCustomers: CustomerAging[] = [
        {
          customer_id: 'CUST001',
          customer_name: 'Ramesh Agarwal',
          customer_phone: '9876543210',
          customer_type: 'regular',
          total_outstanding: 45000,
          current: 15000,
          days_31_60: 20000,
          days_61_90: 10000,
          days_90_plus: 0,
          oldest_invoice_date: '2024-01-05',
          oldest_invoice_days: 47,
          last_payment_date: '2024-01-20',
          invoices: [
            {
              invoice_id: 'INV001',
              invoice_number: 'INV-2024-0105',
              invoice_date: '2024-01-05',
              due_date: '2024-01-20',
              days_overdue: 32,
              original_amount: 30000,
              paid_amount: 10000,
              outstanding_amount: 20000,
              order_type: 'sale'
            },
            {
              invoice_id: 'INV002',
              invoice_number: 'INV-2024-0150',
              invoice_date: '2024-01-25',
              due_date: '2024-02-09',
              days_overdue: 12,
              original_amount: 25000,
              paid_amount: 0,
              outstanding_amount: 25000,
              order_type: 'sale'
            }
          ]
        },
        {
          customer_id: 'CUST002',
          customer_name: 'ABC Corporation',
          customer_phone: '9123456780',
          customer_type: 'corporate',
          total_outstanding: 125000,
          current: 50000,
          days_31_60: 25000,
          days_61_90: 0,
          days_90_plus: 50000,
          oldest_invoice_date: '2023-10-15',
          oldest_invoice_days: 110,
          last_payment_date: '2023-12-15',
          invoices: [
            {
              invoice_id: 'INV003',
              invoice_number: 'INV-2023-0892',
              invoice_date: '2023-10-15',
              due_date: '2023-11-14',
              days_overdue: 99,
              original_amount: 75000,
              paid_amount: 25000,
              outstanding_amount: 50000,
              order_type: 'credit'
            },
            {
              invoice_id: 'INV004',
              invoice_number: 'INV-2024-0078',
              invoice_date: '2024-01-10',
              due_date: '2024-02-09',
              days_overdue: 12,
              original_amount: 75000,
              paid_amount: 0,
              outstanding_amount: 75000,
              order_type: 'credit'
            }
          ]
        },
        {
          customer_id: 'CUST003',
          customer_name: 'Sunita Verma',
          customer_phone: '9988776655',
          customer_type: 'regular',
          total_outstanding: 8500,
          current: 8500,
          days_31_60: 0,
          days_61_90: 0,
          days_90_plus: 0,
          oldest_invoice_date: '2024-02-10',
          oldest_invoice_days: 12,
          invoices: [
            {
              invoice_id: 'INV005',
              invoice_number: 'INV-2024-0210',
              invoice_date: '2024-02-10',
              due_date: '2024-02-25',
              days_overdue: 0,
              original_amount: 8500,
              paid_amount: 0,
              outstanding_amount: 8500,
              order_type: 'emi'
            }
          ]
        },
        {
          customer_id: 'CUST004',
          customer_name: 'Vikram Industries',
          customer_phone: '9111222333',
          customer_type: 'corporate',
          total_outstanding: 250000,
          current: 0,
          days_31_60: 100000,
          days_61_90: 100000,
          days_90_plus: 50000,
          oldest_invoice_date: '2023-09-20',
          oldest_invoice_days: 135,
          last_payment_date: '2023-11-01',
          invoices: [
            {
              invoice_id: 'INV006',
              invoice_number: 'INV-2023-0756',
              invoice_date: '2023-09-20',
              due_date: '2023-10-20',
              days_overdue: 124,
              original_amount: 100000,
              paid_amount: 50000,
              outstanding_amount: 50000,
              order_type: 'credit'
            },
            {
              invoice_id: 'INV007',
              invoice_number: 'INV-2023-0890',
              invoice_date: '2023-11-15',
              due_date: '2023-12-15',
              days_overdue: 69,
              original_amount: 100000,
              paid_amount: 0,
              outstanding_amount: 100000,
              order_type: 'credit'
            },
            {
              invoice_id: 'INV008',
              invoice_number: 'INV-2023-0950',
              invoice_date: '2023-12-20',
              due_date: '2024-01-19',
              days_overdue: 33,
              original_amount: 100000,
              paid_amount: 0,
              outstanding_amount: 100000,
              order_type: 'credit'
            }
          ]
        }
      ];

      setCustomers(mockCustomers);

      // Calculate summary
      const totalOutstanding = mockCustomers.reduce((sum, c) => sum + c.total_outstanding, 0);
      const buckets: AgingBucket[] = [
        {
          label: 'Current (0-30)',
          min_days: 0,
          max_days: 30,
          amount: mockCustomers.reduce((sum, c) => sum + c.current, 0),
          count: mockCustomers.filter(c => c.current > 0).length
        },
        {
          label: '31-60 Days',
          min_days: 31,
          max_days: 60,
          amount: mockCustomers.reduce((sum, c) => sum + c.days_31_60, 0),
          count: mockCustomers.filter(c => c.days_31_60 > 0).length
        },
        {
          label: '61-90 Days',
          min_days: 61,
          max_days: 90,
          amount: mockCustomers.reduce((sum, c) => sum + c.days_61_90, 0),
          count: mockCustomers.filter(c => c.days_61_90 > 0).length
        },
        {
          label: '90+ Days',
          min_days: 91,
          max_days: null,
          amount: mockCustomers.reduce((sum, c) => sum + c.days_90_plus, 0),
          count: mockCustomers.filter(c => c.days_90_plus > 0).length
        }
      ];

      const overdueAmount = buckets.slice(1).reduce((sum, b) => sum + b.amount, 0);

      setSummary({
        total_outstanding: totalOutstanding,
        total_customers: mockCustomers.length,
        buckets,
        overdue_percentage: (overdueAmount / totalOutstanding) * 100,
        average_days_outstanding: Math.round(
          mockCustomers.reduce((sum, c) => sum + c.oldest_invoice_days, 0) / mockCustomers.length
        )
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...customers];

    // Filter by bucket
    if (selectedBucket !== 'all') {
      filtered = filtered.filter(c => {
        switch (selectedBucket) {
          case 'current': return c.current > 0;
          case '31_60': return c.days_31_60 > 0;
          case '61_90': return c.days_61_90 > 0;
          case '90_plus': return c.days_90_plus > 0;
          default: return true;
        }
      });
    }

    // Filter by customer type
    if (customerType !== 'all') {
      filtered = filtered.filter(c => c.customer_type === customerType);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.customer_name.toLowerCase().includes(query) ||
        c.customer_phone.includes(query) ||
        c.customer_id.toLowerCase().includes(query)
      );
    }

    // Filter by minimum amount
    if (minAmount) {
      const min = parseFloat(minAmount);
      if (!isNaN(min)) {
        filtered = filtered.filter(c => c.total_outstanding >= min);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'amount':
          comparison = a.total_outstanding - b.total_outstanding;
          break;
        case 'days':
          comparison = a.oldest_invoice_days - b.oldest_invoice_days;
          break;
        case 'name':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    setFilteredCustomers(filtered);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getBucketColor = (bucket: string): string => {
    const colors: Record<string, string> = {
      'current': 'bg-green-500',
      '31_60': 'bg-yellow-500',
      '61_90': 'bg-orange-500',
      '90_plus': 'bg-red-500'
    };
    return colors[bucket] || 'bg-gray-500';
  };

  const getAgingColor = (days: number): string => {
    if (days <= 30) return 'text-green-600';
    if (days <= 60) return 'text-yellow-600';
    if (days <= 90) return 'text-orange-600';
    return 'text-red-600';
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Customer', 'Phone', 'Type', 'Total Outstanding', '0-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Oldest Invoice'];
    const rows = filteredCustomers.map(c => [
      c.customer_name,
      c.customer_phone,
      c.customer_type,
      c.total_outstanding,
      c.current,
      c.days_31_60,
      c.days_61_90,
      c.days_90_plus,
      c.oldest_invoice_date
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aging-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Outstanding Aging Report</h2>
          <p className="text-gray-600">Accounts receivable analysis by aging buckets</p>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <span>📥</span> Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <span className="text-sm text-gray-500">Total Outstanding</span>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary.total_outstanding)}
            </p>
            <span className="text-xs text-gray-500">{summary.total_customers} customers</span>
          </div>
          {summary.buckets.map((bucket, idx) => (
            <div key={bucket.label} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${
                  idx === 0 ? 'bg-green-500' :
                  idx === 1 ? 'bg-yellow-500' :
                  idx === 2 ? 'bg-orange-500' : 'bg-red-500'
                }`} />
                <span className="text-sm text-gray-500">{bucket.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(bucket.amount)}</p>
              <span className="text-xs text-gray-500">
                {((bucket.amount / summary.total_outstanding) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Aging Distribution Bar */}
      {summary && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Aging Distribution</h3>
          <div className="h-8 flex rounded-lg overflow-hidden">
            {summary.buckets.map((bucket, idx) => {
              const percentage = (bucket.amount / summary.total_outstanding) * 100;
              if (percentage === 0) return null;
              return (
                <div
                  key={bucket.label}
                  className={`${
                    idx === 0 ? 'bg-green-500' :
                    idx === 1 ? 'bg-yellow-500' :
                    idx === 2 ? 'bg-orange-500' : 'bg-red-500'
                  } flex items-center justify-center text-white text-xs font-medium`}
                  style={{ width: `${percentage}%` }}
                  title={`${bucket.label}: ${formatCurrency(bucket.amount)}`}
                >
                  {percentage >= 10 && `${percentage.toFixed(0)}%`}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Current: {formatCurrency(summary.buckets[0].amount)}</span>
            <span className="text-red-600">
              Overdue: {formatCurrency(summary.buckets.slice(1).reduce((sum, b) => sum + b.amount, 0))}
              ({summary.overdue_percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, phone, ID..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Age Bucket</label>
            <select
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Buckets</option>
              <option value="current">Current (0-30)</option>
              <option value="31_60">31-60 Days</option>
              <option value="61_90">61-90 Days</option>
              <option value="90_plus">90+ Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Customer Type</label>
            <select
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="regular">Regular</option>
              <option value="corporate">Corporate</option>
              <option value="walk_in">Walk-in</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Min Amount</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="amount">Amount</option>
                <option value="days">Days Overdue</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="text-green-600">0-30</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="text-yellow-600">31-60</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="text-orange-600">61-90</span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <span className="text-red-600">90+</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Oldest
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No outstanding receivables found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <React.Fragment key={customer.customer_id}>
                    <tr
                      className={`hover:bg-gray-50 cursor-pointer ${
                        expandedCustomer === customer.customer_id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setExpandedCustomer(
                        expandedCustomer === customer.customer_id ? null : customer.customer_id
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            customer.customer_type === 'corporate' ? 'bg-blue-600' :
                            customer.customer_type === 'regular' ? 'bg-green-600' : 'bg-gray-500'
                          }`}>
                            {customer.customer_type === 'corporate' ? '🏢' : '👤'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.customer_name}</p>
                            <p className="text-xs text-gray-500">{customer.customer_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          {formatCurrency(customer.total_outstanding)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {customer.current > 0 && (
                          <span className="text-green-600">{formatCurrency(customer.current)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {customer.days_31_60 > 0 && (
                          <span className="text-yellow-600">{formatCurrency(customer.days_31_60)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {customer.days_61_90 > 0 && (
                          <span className="text-orange-600">{formatCurrency(customer.days_61_90)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {customer.days_90_plus > 0 && (
                          <span className="text-red-600 font-medium">{formatCurrency(customer.days_90_plus)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium ${getAgingColor(customer.oldest_invoice_days)}`}>
                          {customer.oldest_invoice_days} days
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCustomerClick?.(customer.customer_id);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Customer"
                          >
                            👁️
                          </button>
                          <button
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Record Payment"
                          >
                            💳
                          </button>
                          <button
                            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                            title="Send Reminder"
                          >
                            📧
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Invoice Details */}
                    {expandedCustomer === customer.customer_id && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            <h4 className="font-medium text-gray-900">Outstanding Invoices</h4>
                            <div className="space-y-2">
                              {customer.invoices.map(invoice => (
                                <div
                                  key={invoice.invoice_id}
                                  className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                                      <p className="text-xs text-gray-500">
                                        {formatDate(invoice.invoice_date)} • Due: {formatDate(invoice.due_date)}
                                      </p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                                      invoice.order_type === 'emi' ? 'bg-purple-100 text-purple-700' :
                                      invoice.order_type === 'credit' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {invoice.order_type.toUpperCase()}
                                    </span>
                                    {invoice.days_overdue > 0 && (
                                      <span className={`text-xs font-medium ${getAgingColor(invoice.days_overdue)}`}>
                                        {invoice.days_overdue} days overdue
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-gray-900">
                                      {formatCurrency(invoice.outstanding_amount)}
                                    </p>
                                    {invoice.paid_amount > 0 && (
                                      <p className="text-xs text-gray-500">
                                        of {formatCurrency(invoice.original_amount)}
                                        <span className="text-green-600 ml-1">
                                          (Paid: {formatCurrency(invoice.paid_amount)})
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                            {customer.last_payment_date && (
                              <p className="text-xs text-gray-500">
                                Last payment: {formatDate(customer.last_payment_date)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Footer */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </span>
            <span className="font-medium text-gray-900">
              Total: {formatCurrency(filteredCustomers.reduce((sum, c) => sum + c.total_outstanding, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
