// ============================================================================
// IMS 2.0 - Reports Page
// ============================================================================

import { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Eye,
  Printer,
  Filter,
} from 'lucide-react';
import clsx from 'clsx';

type ReportType = 'sales' | 'inventory' | 'customers' | 'gst';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'custom';

// Mock sales data
const mockSalesSummary = {
  totalSales: 485000,
  orderCount: 45,
  averageOrderValue: 10777,
  topCategory: 'Frames',
  grossProfit: 145000,
  gstCollected: 87300,
};

// Mock category breakdown
const mockCategoryBreakdown = [
  { category: 'Frames', sales: 185000, units: 25, percentage: 38 },
  { category: 'Optical Lenses', sales: 145000, units: 32, percentage: 30 },
  { category: 'Sunglasses', sales: 85000, units: 12, percentage: 18 },
  { category: 'Contact Lenses', sales: 45000, units: 40, percentage: 9 },
  { category: 'Accessories', sales: 15000, units: 28, percentage: 3 },
  { category: 'Watches', sales: 10000, units: 2, percentage: 2 },
];

// Mock daily trend
const mockDailyTrend = [
  { date: '15 Jan', sales: 42000 },
  { date: '16 Jan', sales: 58000 },
  { date: '17 Jan', sales: 35000 },
  { date: '18 Jan', sales: 72000 },
  { date: '19 Jan', sales: 48000 },
  { date: '20 Jan', sales: 95000 },
  { date: '21 Jan', sales: 135000 },
];

// Report cards
const REPORT_CARDS = [
  {
    id: 'daily-sales',
    title: 'Daily Sales Report',
    description: 'Day-wise sales breakdown with payment modes',
    icon: BarChart3,
    category: 'sales' as ReportType,
  },
  {
    id: 'monthly-sales',
    title: 'Monthly Sales Summary',
    description: 'Monthly sales with category and brand analysis',
    icon: TrendingUp,
    category: 'sales' as ReportType,
  },
  {
    id: 'stock-report',
    title: 'Stock Report',
    description: 'Current stock levels by category and brand',
    icon: Package,
    category: 'inventory' as ReportType,
  },
  {
    id: 'stock-movement',
    title: 'Stock Movement',
    description: 'Stock in/out movements and transfers',
    icon: Package,
    category: 'inventory' as ReportType,
  },
  {
    id: 'customer-report',
    title: 'Customer Report',
    description: 'Customer acquisition and purchase patterns',
    icon: Users,
    category: 'customers' as ReportType,
  },
  {
    id: 'gst-report',
    title: 'GST Report',
    description: 'GSTR-1 and GSTR-3B data for filing',
    icon: FileText,
    category: 'gst' as ReportType,
  },
];

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [showDetailedReport, setShowDetailedReport] = useState(false);

  const filteredReports = REPORT_CARDS.filter(r => r.category === activeTab);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Analytics and business reports</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value as DateRange)}
            className="input-field w-auto"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(mockSalesSummary.totalSales)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Orders</p>
              <p className="text-xl font-bold text-gray-900">{mockSalesSummary.orderCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(mockSalesSummary.averageOrderValue)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">GST Collected</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(mockSalesSummary.gstCollected)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {[
          { id: 'sales' as ReportType, label: 'Sales', icon: BarChart3 },
          { id: 'inventory' as ReportType, label: 'Inventory', icon: Package },
          { id: 'customers' as ReportType, label: 'Customers', icon: Users },
          { id: 'gst' as ReportType, label: 'GST', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-bv-red-600 text-bv-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      {activeTab === 'sales' && (
        <div className="grid grid-cols-1 laptop:grid-cols-2 gap-4">
          {/* Sales Trend */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Sales Trend</h3>
              <button className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="h-48 flex items-end gap-2">
              {mockDailyTrend.map((day, index) => {
                const maxSales = Math.max(...mockDailyTrend.map(d => d.sales));
                const height = (day.sales / maxSales) * 100;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-bv-red-600 rounded-t transition-all hover:bg-bv-red-700"
                      style={{ height: `${height}%` }}
                      title={formatCurrency(day.sales)}
                    />
                    <span className="text-xs text-gray-500">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Category Breakdown</h3>
            </div>
            <div className="space-y-3">
              {mockCategoryBreakdown.map((cat, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{cat.category}</span>
                    <span className="font-medium">{formatCurrency(cat.sales)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bv-red-600 rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Cards */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Available Reports</h3>
        <div className="grid grid-cols-1 tablet:grid-cols-2 laptop:grid-cols-3 gap-4">
          {filteredReports.map(report => (
            <div key={report.id} className="card hover:border-bv-red-300 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-bv-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <report.icon className="w-5 h-5 text-bv-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900">{report.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1">
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1">
                      <Printer className="w-4 h-4" />
                      Print
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GST Reports Section (when GST tab selected) */}
      {activeTab === 'gst' && (
        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">GST Filing Data Ready</h4>
              <p className="text-sm text-gray-600 mt-1">
                GST data for the period has been compiled. Download the reports for GSTR-1 and GSTR-3B filing.
              </p>
              <div className="flex gap-3 mt-3">
                <button className="btn-primary text-sm">
                  Download GSTR-1
                </button>
                <button className="btn-outline text-sm">
                  Download GSTR-3B
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
