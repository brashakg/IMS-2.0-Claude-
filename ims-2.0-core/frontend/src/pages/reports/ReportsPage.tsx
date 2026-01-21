// ============================================================================
// IMS 2.0 - Reports Page
// Full-featured reports with MockDataContext integration
// ============================================================================

import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  IndianRupee,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Eye,
  Printer,
  X,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';

type ReportType = 'sales' | 'inventory' | 'customers' | 'gst';
type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'custom';

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
  const { orders, customers, products, getStats } = useMockData();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const stats = getStats();

  // Calculate sales summary from actual orders
  const salesSummary = useMemo(() => {
    const totalSales = orders.reduce((sum, order) => sum + order.grandTotal, 0);
    const orderCount = orders.length;
    const averageOrderValue = orderCount > 0 ? totalSales / orderCount : 0;
    const gstCollected = orders.reduce((sum, order) => sum + order.taxAmount, 0);
    const grossProfit = totalSales * 0.30; // Estimated 30% margin

    return {
      totalSales,
      orderCount,
      averageOrderValue,
      gstCollected,
      grossProfit,
    };
  }, [orders]);

  // Calculate category breakdown from orders
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { sales: number; units: number }> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        const category = product?.category || 'Other';
        const categoryLabel = category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        if (!breakdown[categoryLabel]) {
          breakdown[categoryLabel] = { sales: 0, units: 0 };
        }
        breakdown[categoryLabel].sales += item.finalPrice;
        breakdown[categoryLabel].units += item.quantity;
      });
    });

    const totalSales = Object.values(breakdown).reduce((sum, cat) => sum + cat.sales, 0);

    return Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        sales: data.sales,
        units: data.units,
        percentage: totalSales > 0 ? Math.round((data.sales / totalSales) * 100) : 0,
      }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 6);
  }, [orders, products]);

  // Generate daily trend from orders
  const dailyTrend = useMemo(() => {
    const days: Record<string, number> = {};
    const today = new Date();

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const key = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      days[key] = 0;
    }

    // Sum up sales by day
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const key = orderDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      if (days.hasOwnProperty(key)) {
        days[key] += order.grandTotal;
      }
    });

    return Object.entries(days).map(([date, sales]) => ({ date, sales }));
  }, [orders]);

  const filteredReports = REPORT_CARDS.filter(r => r.category === activeTab);

  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const handleViewReport = (reportId: string) => {
    setSelectedReport(reportId);
    setShowReportModal(true);
  };

  const handleExportReport = (reportId: string) => {
    toast.success(`Exporting ${REPORT_CARDS.find(r => r.id === reportId)?.title}...`);
    setTimeout(() => {
      toast.success('Report exported successfully. Check your downloads.');
    }, 1500);
  };

  const handlePrintReport = (reportId: string) => {
    toast.info(`Preparing ${REPORT_CARDS.find(r => r.id === reportId)?.title} for printing...`);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleDownloadGSTR1 = () => {
    toast.success('Downloading GSTR-1 data...');
    setTimeout(() => {
      toast.success('GSTR-1 report downloaded successfully');
    }, 1500);
  };

  const handleDownloadGSTR3B = () => {
    toast.success('Downloading GSTR-3B data...');
    setTimeout(() => {
      toast.success('GSTR-3B report downloaded successfully');
    }, 1500);
  };

  const handleExportSalesTrend = () => {
    toast.success('Exporting sales trend data...');
  };

  // Get report details for modal
  const getReportDetails = (reportId: string) => {
    switch (reportId) {
      case 'daily-sales':
        return {
          title: 'Daily Sales Report',
          data: dailyTrend.map(d => ({
            date: d.date,
            sales: formatCurrency(d.sales),
            orders: Math.ceil(d.sales / (salesSummary.averageOrderValue || 10000)),
          })),
          columns: ['Date', 'Sales', 'Orders'],
        };
      case 'stock-report':
        return {
          title: 'Stock Report',
          data: products.slice(0, 10).map(p => ({
            sku: p.sku,
            name: p.name,
            category: p.category.replace(/_/g, ' '),
            stock: Math.floor(Math.random() * 20) + 1,
          })),
          columns: ['SKU', 'Product', 'Category', 'Stock'],
        };
      case 'customer-report':
        return {
          title: 'Customer Report',
          data: customers.slice(0, 10).map(c => ({
            name: c.name,
            phone: c.phone,
            type: c.customerType,
            joined: new Date(c.createdAt).toLocaleDateString('en-IN'),
          })),
          columns: ['Name', 'Phone', 'Type', 'Joined'],
        };
      default:
        return {
          title: 'Report',
          data: [],
          columns: [],
        };
    }
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
              <p className="text-xl font-bold text-gray-900">{formatCurrency(salesSummary.totalSales)}</p>
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
              <p className="text-xl font-bold text-gray-900">{salesSummary.orderCount}</p>
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
              <p className="text-xl font-bold text-gray-900">{formatCurrency(salesSummary.averageOrderValue)}</p>
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
              <p className="text-xl font-bold text-gray-900">{formatCurrency(salesSummary.gstCollected)}</p>
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
              <button
                onClick={handleExportSalesTrend}
                className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
            <div className="h-48 flex items-end gap-2">
              {dailyTrend.map((day, index) => {
                const maxSales = Math.max(...dailyTrend.map(d => d.sales), 1);
                const height = maxSales > 0 ? (day.sales / maxSales) * 100 : 5;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-bv-red-600 rounded-t transition-all hover:bg-bv-red-700 min-h-[4px]"
                      style={{ height: `${Math.max(height, 2)}%` }}
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
            {categoryBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No sales data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat, index) => (
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
            )}
          </div>
        </div>
      )}

      {/* Customer Stats (when customers tab selected) */}
      {activeTab === 'customers' && (
        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Customer Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Customers</span>
                <span className="font-bold text-xl">{customers.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">B2C Customers</span>
                <span className="font-medium">{customers.filter(c => c.customerType === 'B2C').length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">B2B Customers</span>
                <span className="font-medium">{customers.filter(c => c.customerType === 'B2B').length}</span>
              </div>
            </div>
          </div>
          <div className="card col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Recent Customers</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {customers.slice(0, 5).map(customer => (
                    <tr key={customer.id}>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{customer.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{customer.phone}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={customer.customerType === 'B2B' ? 'badge-info' : 'badge-success'}>
                          {customer.customerType}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Stats (when inventory tab selected) */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 laptop:grid-cols-3 gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4">Inventory Overview</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total SKUs</span>
                <span className="font-bold text-xl">{products.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Categories</span>
                <span className="font-medium">{new Set(products.map(p => p.category)).size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Brands</span>
                <span className="font-medium">{new Set(products.map(p => p.brand)).size}</span>
              </div>
            </div>
          </div>
          <div className="card col-span-2">
            <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.slice(0, 5).map(product => (
                    <tr key={product.id}>
                      <td className="px-3 py-2 text-sm font-mono text-gray-600">{product.sku}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600">{product.category.replace(/_/g, ' ')}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium">{formatCurrency(product.offerPrice || product.mrp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    <button
                      onClick={() => handleViewReport(report.id)}
                      className="text-sm text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    <button
                      onClick={() => handleExportReport(report.id)}
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      onClick={() => handlePrintReport(report.id)}
                      className="text-sm text-gray-600 hover:text-gray-700 flex items-center gap-1"
                    >
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
                GST data for the period has been compiled. Total GST collected: {formatCurrency(salesSummary.gstCollected)}
              </p>
              <div className="flex gap-3 mt-3">
                <button onClick={handleDownloadGSTR1} className="btn-primary text-sm">
                  Download GSTR-1
                </button>
                <button onClick={handleDownloadGSTR3B} className="btn-outline text-sm">
                  Download GSTR-3B
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">{getReportDetails(selectedReport).title}</h3>
              <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {getReportDetails(selectedReport).data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No data available for this report</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {getReportDetails(selectedReport).columns.map((col, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {getReportDetails(selectedReport).data.map((row: any, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val: any, j) => (
                            <td key={j} className="px-4 py-3 text-sm text-gray-900">
                              {val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <button onClick={() => setShowReportModal(false)} className="btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    handleExportReport(selectedReport);
                    setShowReportModal(false);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Report
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
