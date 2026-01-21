// ============================================================================
// IMS 2.0 - Inventory Report Component
// ============================================================================
// Stock levels, movement, valuation, and aging reports

import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Filter,
  Search,
  BarChart3,
  Clock,
  IndianRupee,
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface StockItem {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  mrp: number;
  costPrice: number;
  lastReceived: string;
  lastSold: string;
  stockValue: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'CRITICAL' | 'OUT_OF_STOCK' | 'OVERSTOCK';
  daysInStock: number;
}

interface StockMovement {
  date: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  quantity: number;
  reference: string;
  reason?: string;
}

// Mock Data
const mockStockItems: StockItem[] = [
  { id: '1', sku: 'RB-3025-001', name: 'Ray-Ban Aviator Gold', brand: 'Ray-Ban', category: 'Sunglasses', currentStock: 2, minStock: 5, maxStock: 15, mrp: 12990, costPrice: 7500, lastReceived: '2026-01-10', lastSold: '2026-01-20', stockValue: 15000, status: 'CRITICAL', daysInStock: 11 },
  { id: '2', sku: 'OAK-9102-002', name: 'Oakley Holbrook Black', brand: 'Oakley', category: 'Sunglasses', currentStock: 8, minStock: 5, maxStock: 15, mrp: 11490, costPrice: 6800, lastReceived: '2026-01-15', lastSold: '2026-01-19', stockValue: 54400, status: 'IN_STOCK', daysInStock: 6 },
  { id: '3', sku: 'TIT-EP-003', name: 'Titan Eyeplus Rectangle', brand: 'Titan', category: 'Frames', currentStock: 12, minStock: 8, maxStock: 20, mrp: 3990, costPrice: 2200, lastReceived: '2026-01-18', lastSold: '2026-01-21', stockValue: 26400, status: 'IN_STOCK', daysInStock: 3 },
  { id: '4', sku: 'VGE-FL-004', name: 'Vogue Full Rim Cat Eye', brand: 'Vogue', category: 'Frames', currentStock: 4, minStock: 5, maxStock: 12, mrp: 4990, costPrice: 2800, lastReceived: '2026-01-05', lastSold: '2026-01-15', stockValue: 11200, status: 'LOW_STOCK', daysInStock: 16 },
  { id: '5', sku: 'ESS-CRZ-005', name: 'Essilor Crizal Sapphire', brand: 'Essilor', category: 'Lenses', currentStock: 45, minStock: 20, maxStock: 50, mrp: 8500, costPrice: 5200, lastReceived: '2026-01-12', lastSold: '2026-01-21', stockValue: 234000, status: 'IN_STOCK', daysInStock: 9 },
  { id: '6', sku: 'ZSS-PRG-006', name: 'Zeiss Progressive Plus', brand: 'Zeiss', category: 'Lenses', currentStock: 0, minStock: 10, maxStock: 30, mrp: 15990, costPrice: 9500, lastReceived: '2025-12-20', lastSold: '2026-01-18', stockValue: 0, status: 'OUT_OF_STOCK', daysInStock: 0 },
  { id: '7', sku: 'FST-SG-007', name: 'Fastrack Square Grey', brand: 'Fastrack', category: 'Sunglasses', currentStock: 25, minStock: 10, maxStock: 20, mrp: 1790, costPrice: 950, lastReceived: '2026-01-08', lastSold: '2026-01-12', stockValue: 23750, status: 'OVERSTOCK', daysInStock: 13 },
  { id: '8', sku: 'ACU-DLY-008', name: 'Acuvue Dailies 30pk', brand: 'Acuvue', category: 'Contact Lenses', currentStock: 18, minStock: 15, maxStock: 40, mrp: 1290, costPrice: 850, lastReceived: '2026-01-19', lastSold: '2026-01-21', stockValue: 15300, status: 'IN_STOCK', daysInStock: 2 },
];

// Status Badge
function StockStatusBadge({ status }: { status: StockItem['status'] }) {
  const styles = {
    IN_STOCK: 'bg-green-100 text-green-700',
    LOW_STOCK: 'bg-yellow-100 text-yellow-700',
    CRITICAL: 'bg-red-100 text-red-700',
    OUT_OF_STOCK: 'bg-gray-100 text-gray-700',
    OVERSTOCK: 'bg-blue-100 text-blue-700',
  };

  const labels = {
    IN_STOCK: 'In Stock',
    LOW_STOCK: 'Low Stock',
    CRITICAL: 'Critical',
    OUT_OF_STOCK: 'Out of Stock',
    OVERSTOCK: 'Overstock',
  };

  return (
    <span className={clsx('px-2 py-0.5 rounded text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

// Stock Level Bar
function StockLevelBar({ current, min, max }: { current: number; min: number; max: number }) {
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const minPercentage = max > 0 ? (min / max) * 100 : 0;

  return (
    <div className="w-32 relative">
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all',
            current === 0 && 'bg-gray-400',
            current > 0 && current < min && 'bg-red-500',
            current >= min && current <= max && 'bg-green-500',
            current > max && 'bg-blue-500'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className="absolute top-0 w-0.5 h-2 bg-yellow-500"
        style={{ left: `${minPercentage}%` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
        <span>{current}</span>
        <span>/{max}</span>
      </div>
    </div>
  );
}

// Main Inventory Report Component
export function InventoryReport() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockItem['status'] | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Filter items
  const filteredItems = mockStockItems.filter(item => {
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase()) && !item.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  // Calculate stats
  const stats = {
    totalItems: mockStockItems.length,
    totalValue: mockStockItems.reduce((sum, item) => sum + item.stockValue, 0),
    lowStock: mockStockItems.filter(i => i.status === 'LOW_STOCK' || i.status === 'CRITICAL').length,
    outOfStock: mockStockItems.filter(i => i.status === 'OUT_OF_STOCK').length,
    overstock: mockStockItems.filter(i => i.status === 'OVERSTOCK').length,
    avgDaysInStock: Math.round(mockStockItems.reduce((sum, i) => sum + i.daysInStock, 0) / mockStockItems.length),
  };

  const categories = ['ALL', ...Array.from(new Set(mockStockItems.map(i => i.category)))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Report</h1>
          <p className="text-gray-500 mt-1">Stock levels, valuation, and movement analysis</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalItems}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <IndianRupee className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Value</p>
              <p className="text-xl font-bold text-gray-900">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
        <div className={clsx('card', (stats.lowStock + stats.outOfStock) > 0 && 'border-red-300')}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Need Reorder</p>
              <p className="text-xl font-bold text-red-600">{stats.lowStock + stats.outOfStock}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Days in Stock</p>
              <p className="text-xl font-bold text-gray-900">{stats.avgDaysInStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col tablet:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-4 py-2 border rounded-lg"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="ALL">All Status</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="LOW_STOCK">Low Stock</option>
          <option value="CRITICAL">Critical</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="OVERSTOCK">Overstock</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">SKU</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Stock Level</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">MRP</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">Stock Value</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Days</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.brand}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{item.sku}</td>
                  <td className="py-3 px-4">{item.category}</td>
                  <td className="py-3 px-4">
                    <StockLevelBar current={item.currentStock} min={item.minStock} max={item.maxStock} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StockStatusBadge status={item.status} />
                  </td>
                  <td className="py-3 px-4 text-right">₹{item.mrp.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right font-medium">₹{item.stockValue.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={clsx(
                      'text-xs',
                      item.daysInStock > 30 && 'text-orange-600 font-medium',
                      item.daysInStock <= 30 && 'text-gray-500'
                    )}>
                      {item.daysInStock}d
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary by Category */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Stock Value by Category</h3>
        <div className="grid tablet:grid-cols-2 laptop:grid-cols-4 gap-4">
          {Array.from(new Set(mockStockItems.map(i => i.category))).map(category => {
            const categoryItems = mockStockItems.filter(i => i.category === category);
            const value = categoryItems.reduce((sum, i) => sum + i.stockValue, 0);
            const count = categoryItems.length;
            return (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{category}</p>
                <p className="text-lg font-bold text-gray-900 mt-1">₹{value.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500">{count} SKUs</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default InventoryReport;
