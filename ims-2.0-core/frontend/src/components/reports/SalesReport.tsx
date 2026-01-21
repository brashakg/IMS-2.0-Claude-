// ============================================================================
// IMS 2.0 - Sales Report Component
// ============================================================================
// Comprehensive sales reports with filters, charts, and export

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  IndianRupee,
  ShoppingBag,
  Users,
  CreditCard,
  Eye,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import clsx from 'clsx';

// Report Types
interface SalesData {
  date: string;
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  creditSales: number;
  discountGiven: number;
  gstCollected: number;
  netRevenue: number;
}

interface CategorySales {
  category: string;
  sales: number;
  quantity: number;
  percentage: number;
}

interface StaffSales {
  staffId: string;
  staffName: string;
  totalSales: number;
  ordersCount: number;
  avgOrderValue: number;
  discountsGiven: number;
  conversion: number;
}

// Mock Data
const mockDailySales: SalesData[] = [
  { date: '2026-01-21', totalSales: 125000, totalOrders: 28, avgOrderValue: 4464, cashSales: 35000, cardSales: 45000, upiSales: 30000, creditSales: 15000, discountGiven: 8500, gstCollected: 19067, netRevenue: 116500 },
  { date: '2026-01-20', totalSales: 98000, totalOrders: 22, avgOrderValue: 4454, cashSales: 28000, cardSales: 38000, upiSales: 22000, creditSales: 10000, discountGiven: 6200, gstCollected: 14949, netRevenue: 91800 },
  { date: '2026-01-19', totalSales: 156000, totalOrders: 35, avgOrderValue: 4457, cashSales: 42000, cardSales: 58000, upiSales: 36000, creditSales: 20000, discountGiven: 11000, gstCollected: 23797, netRevenue: 145000 },
  { date: '2026-01-18', totalSales: 112000, totalOrders: 25, avgOrderValue: 4480, cashSales: 32000, cardSales: 42000, upiSales: 28000, creditSales: 10000, discountGiven: 7800, gstCollected: 17085, netRevenue: 104200 },
  { date: '2026-01-17', totalSales: 89000, totalOrders: 20, avgOrderValue: 4450, cashSales: 25000, cardSales: 35000, upiSales: 20000, creditSales: 9000, discountGiven: 5500, gstCollected: 13576, netRevenue: 83500 },
];

const mockCategorySales: CategorySales[] = [
  { category: 'Frames', sales: 245000, quantity: 82, percentage: 42 },
  { category: 'Lenses', sales: 186000, quantity: 145, percentage: 32 },
  { category: 'Sunglasses', sales: 89000, quantity: 35, percentage: 15 },
  { category: 'Contact Lenses', sales: 45000, quantity: 120, percentage: 8 },
  { category: 'Accessories', sales: 18000, quantity: 65, percentage: 3 },
];

const mockStaffSales: StaffSales[] = [
  { staffId: 's1', staffName: 'Priya Sharma', totalSales: 185000, ordersCount: 42, avgOrderValue: 4404, discountsGiven: 12000, conversion: 68 },
  { staffId: 's2', staffName: 'Amit Patel', totalSales: 156000, ordersCount: 35, avgOrderValue: 4457, discountsGiven: 9500, conversion: 62 },
  { staffId: 's3', staffName: 'Sneha Gupta', totalSales: 142000, ordersCount: 32, avgOrderValue: 4437, discountsGiven: 8200, conversion: 58 },
  { staffId: 's4', staffName: 'Vikram Singh', totalSales: 98000, ordersCount: 21, avgOrderValue: 4666, discountsGiven: 5800, conversion: 54 },
];

// Stat Card Component
function StatCard({
  title,
  value,
  change,
  icon: Icon,
  iconBg,
  format = 'currency',
}: {
  title: string;
  value: number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  format?: 'currency' | 'number' | 'percentage';
}) {
  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0,
        }).format(val);
      case 'percentage':
        return `${val}%`;
      default:
        return val.toLocaleString('en-IN');
    }
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatValue(value)}</p>
          {change !== undefined && (
            <div className={clsx(
              'flex items-center gap-1 mt-1 text-sm font-medium',
              change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {Math.abs(change)}% vs last period
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-lg', iconBg)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

// Simple Bar Chart Component
function SimpleBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value));

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">{item.label}</span>
            <span className="font-medium">₹{item.value.toLocaleString('en-IN')}</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all', item.color)}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Main Sales Report Component
export function SalesReport() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('week');
  const [selectedStore, setSelectedStore] = useState<string>('all');

  // Calculate totals
  const totals = mockDailySales.reduce(
    (acc, day) => ({
      sales: acc.sales + day.totalSales,
      orders: acc.orders + day.totalOrders,
      discount: acc.discount + day.discountGiven,
      gst: acc.gst + day.gstCollected,
    }),
    { sales: 0, orders: 0, discount: 0, gst: 0 }
  );

  const avgOrderValue = totals.orders > 0 ? Math.round(totals.sales / totals.orders) : 0;

  // Payment method breakdown
  const paymentBreakdown = [
    { label: 'Card Payments', value: mockDailySales.reduce((s, d) => s + d.cardSales, 0), color: 'bg-blue-500' },
    { label: 'Cash Payments', value: mockDailySales.reduce((s, d) => s + d.cashSales, 0), color: 'bg-green-500' },
    { label: 'UPI Payments', value: mockDailySales.reduce((s, d) => s + d.upiSales, 0), color: 'bg-purple-500' },
    { label: 'Credit Sales', value: mockDailySales.reduce((s, d) => s + d.creditSales, 0), color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Report</h1>
          <p className="text-gray-500 mt-1">Comprehensive sales analytics and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">All Stores</option>
            <option value="mumbai">Mumbai Central</option>
            <option value="andheri">Andheri</option>
            <option value="thane">Thane</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={totals.sales}
          change={12}
          icon={IndianRupee}
          iconBg="bg-green-500"
        />
        <StatCard
          title="Total Orders"
          value={totals.orders}
          change={8}
          icon={ShoppingBag}
          iconBg="bg-blue-500"
          format="number"
        />
        <StatCard
          title="Avg Order Value"
          value={avgOrderValue}
          change={3}
          icon={TrendingUp}
          iconBg="bg-purple-500"
        />
        <StatCard
          title="GST Collected"
          value={totals.gst}
          icon={CreditCard}
          iconBg="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <SimpleBarChart data={paymentBreakdown} />
        </div>

        {/* Category Sales */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
          <div className="space-y-3">
            {mockCategorySales.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-bv-red-500" style={{ opacity: cat.percentage / 50 + 0.3 }} />
                  <span className="text-sm text-gray-600">{cat.category}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">₹{cat.sales.toLocaleString('en-IN')}</span>
                  <span className="text-xs text-gray-500 w-12 text-right">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Sales Table */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Sales Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium text-gray-700">Date</th>
                <th className="text-right py-3 font-medium text-gray-700">Total Sales</th>
                <th className="text-right py-3 font-medium text-gray-700">Orders</th>
                <th className="text-right py-3 font-medium text-gray-700">AOV</th>
                <th className="text-right py-3 font-medium text-gray-700">Discount</th>
                <th className="text-right py-3 font-medium text-gray-700">GST</th>
                <th className="text-right py-3 font-medium text-gray-700">Net Revenue</th>
              </tr>
            </thead>
            <tbody>
              {mockDailySales.map((day) => (
                <tr key={day.date} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 font-medium">{day.date}</td>
                  <td className="py-3 text-right text-green-600 font-medium">₹{day.totalSales.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right">{day.totalOrders}</td>
                  <td className="py-3 text-right">₹{day.avgOrderValue.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-red-600">-₹{day.discountGiven.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-blue-600">₹{day.gstCollected.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right font-medium">₹{day.netRevenue.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="py-3">Total</td>
                <td className="py-3 text-right text-green-600">₹{totals.sales.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right">{totals.orders}</td>
                <td className="py-3 text-right">₹{avgOrderValue.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right text-red-600">-₹{totals.discount.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right text-blue-600">₹{totals.gst.toLocaleString('en-IN')}</td>
                <td className="py-3 text-right">₹{(totals.sales - totals.discount).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Staff Performance */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Staff Sales Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 font-medium text-gray-700">Staff Name</th>
                <th className="text-right py-3 font-medium text-gray-700">Total Sales</th>
                <th className="text-right py-3 font-medium text-gray-700">Orders</th>
                <th className="text-right py-3 font-medium text-gray-700">AOV</th>
                <th className="text-right py-3 font-medium text-gray-700">Discounts</th>
                <th className="text-right py-3 font-medium text-gray-700">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {mockStaffSales.map((staff, index) => (
                <tr key={staff.staffId} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                        index === 0 && 'bg-yellow-100 text-yellow-700',
                        index === 1 && 'bg-gray-200 text-gray-700',
                        index === 2 && 'bg-orange-100 text-orange-700',
                        index > 2 && 'bg-gray-100 text-gray-600'
                      )}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{staff.staffName}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right text-green-600 font-medium">₹{staff.totalSales.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right">{staff.ordersCount}</td>
                  <td className="py-3 text-right">₹{staff.avgOrderValue.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right text-red-600">₹{staff.discountsGiven.toLocaleString('en-IN')}</td>
                  <td className="py-3 text-right">
                    <span className={clsx(
                      'px-2 py-0.5 rounded text-xs font-medium',
                      staff.conversion >= 60 && 'bg-green-100 text-green-700',
                      staff.conversion >= 50 && staff.conversion < 60 && 'bg-yellow-100 text-yellow-700',
                      staff.conversion < 50 && 'bg-red-100 text-red-700'
                    )}>
                      {staff.conversion}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SalesReport;
