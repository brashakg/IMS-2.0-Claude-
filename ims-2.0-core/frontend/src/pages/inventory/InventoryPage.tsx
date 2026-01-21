// ============================================================================
// IMS 2.0 - Inventory Page
// ============================================================================

import { useState } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Filter,
  Download,
  BarChart3,
  Tag,
  Boxes,
  TrendingDown,
  Eye,
} from 'lucide-react';
import type { ProductCategory } from '../../types';
import clsx from 'clsx';

// Category configuration
const CATEGORIES: { code: ProductCategory; label: string; icon: string }[] = [
  { code: 'FRAME', label: 'Frames', icon: '👓' },
  { code: 'SUNGLASS', label: 'Sunglasses', icon: '🕶️' },
  { code: 'READING_GLASSES', label: 'Reading Glasses', icon: '📖' },
  { code: 'OPTICAL_LENS', label: 'Optical Lenses', icon: '🔍' },
  { code: 'CONTACT_LENS', label: 'Contact Lenses', icon: '👁️' },
  { code: 'COLORED_CONTACT_LENS', label: 'Colored CL', icon: '🎨' },
  { code: 'WATCH', label: 'Watches', icon: '⌚' },
  { code: 'SMARTWATCH', label: 'Smartwatches', icon: '📱' },
  { code: 'SMARTGLASSES', label: 'Smart Glasses', icon: '🥽' },
  { code: 'WALL_CLOCK', label: 'Wall Clocks', icon: '🕐' },
  { code: 'ACCESSORIES', label: 'Accessories', icon: '🧴' },
  { code: 'SERVICES', label: 'Services', icon: '🔧' },
];

// Mock inventory data
const mockInventory = [
  { id: 'stk-001', sku: 'RB-5154-BLK', name: 'Ray-Ban RB5154 Clubmaster', category: 'FRAME' as ProductCategory, brand: 'Ray-Ban', mrp: 8990, offerPrice: 6890, stock: 5, reserved: 1, location: 'A1-01', lowStockThreshold: 3 },
  { id: 'stk-002', sku: 'RB-3025-GLD', name: 'Ray-Ban Aviator Classic', category: 'SUNGLASS' as ProductCategory, brand: 'Ray-Ban', mrp: 12990, offerPrice: 9990, stock: 3, reserved: 0, location: 'A1-02', lowStockThreshold: 3 },
  { id: 'stk-003', sku: 'OAK-HOL-001', name: 'Oakley Holbrook', category: 'SUNGLASS' as ProductCategory, brand: 'Oakley', mrp: 15000, offerPrice: 12000, stock: 2, reserved: 1, location: 'A1-03', lowStockThreshold: 2 },
  { id: 'stk-004', sku: 'ESS-CP-STD', name: 'Essilor Crizal Prevencia', category: 'OPTICAL_LENS' as ProductCategory, brand: 'Essilor', mrp: 4500, offerPrice: 3500, stock: 20, reserved: 3, location: 'B1-01', lowStockThreshold: 10 },
  { id: 'stk-005', sku: 'ZS-DS-PRO', name: 'Zeiss DriveSafe', category: 'OPTICAL_LENS' as ProductCategory, brand: 'Zeiss', mrp: 8500, offerPrice: 7500, stock: 8, reserved: 0, location: 'B1-02', lowStockThreshold: 5 },
  { id: 'stk-006', sku: 'ACV-OAS-6', name: 'Acuvue Oasys (6 pack)', category: 'CONTACT_LENS' as ProductCategory, brand: 'Acuvue', mrp: 2100, offerPrice: 1800, stock: 50, reserved: 5, location: 'C1-01', lowStockThreshold: 20 },
  { id: 'stk-007', sku: 'FL-CB-BLU', name: 'FreshLook Colorblends - Blue', category: 'COLORED_CONTACT_LENS' as ProductCategory, brand: 'FreshLook', mrp: 1800, offerPrice: 1500, stock: 15, reserved: 2, location: 'C1-02', lowStockThreshold: 10 },
  { id: 'stk-008', sku: 'TIT-EDG-CER', name: 'Titan Edge Ceramic', category: 'WATCH' as ProductCategory, brand: 'Titan', mrp: 15995, offerPrice: 13995, stock: 4, reserved: 0, location: 'D1-01', lowStockThreshold: 2 },
  { id: 'stk-009', sku: 'APL-W9-45', name: 'Apple Watch Series 9', category: 'SMARTWATCH' as ProductCategory, brand: 'Apple', mrp: 45900, offerPrice: 42900, stock: 2, reserved: 1, location: 'D1-02', lowStockThreshold: 2 },
  { id: 'stk-010', sku: 'RB-META-BLK', name: 'Ray-Ban Meta Smart Glasses', category: 'SMARTGLASSES' as ProductCategory, brand: 'Ray-Ban', mrp: 32990, offerPrice: 29990, stock: 1, reserved: 0, location: 'D1-03', lowStockThreshold: 1 },
  { id: 'stk-011', sku: 'RG-150-STD', name: 'Reading Glasses +1.50', category: 'READING_GLASSES' as ProductCategory, brand: 'Generic', mrp: 599, offerPrice: 499, stock: 30, reserved: 0, location: 'E1-01', lowStockThreshold: 15 },
  { id: 'stk-012', sku: 'ACC-LCK-01', name: 'Lens Cleaning Kit', category: 'ACCESSORIES' as ProductCategory, brand: 'Generic', mrp: 299, offerPrice: 199, stock: 100, reserved: 0, location: 'E1-02', lowStockThreshold: 30 },
];

type ViewTab = 'catalog' | 'low-stock' | 'movements';

export function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('catalog');
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Filter inventory
  const filteredInventory = mockInventory.filter(item => {
    const matchesSearch = !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Get low stock items
  const lowStockItems = mockInventory.filter(item => item.stock <= item.lowStockThreshold);

  // Calculate stats
  const totalSKUs = mockInventory.length;
  const totalValue = mockInventory.reduce((sum, item) => sum + (item.offerPrice * item.stock), 0);
  const lowStockCount = lowStockItems.length;

  const getStockStatus = (item: typeof mockInventory[0]) => {
    if (item.stock === 0) return { label: 'Out of Stock', class: 'badge-error' };
    if (item.stock <= item.lowStockThreshold) return { label: 'Low Stock', class: 'badge-warning' };
    return { label: 'In Stock', class: 'badge-success' };
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-500">Manage products and stock levels</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="btn-outline flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 tablet:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Boxes className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total SKUs</p>
              <p className="text-xl font-bold text-gray-900">{totalSKUs}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Stock Value</p>
              <p className="text-xl font-bold text-gray-900">₹{(totalValue / 100000).toFixed(1)}L</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Low Stock</p>
              <p className="text-xl font-bold text-yellow-600">{lowStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Categories</p>
              <p className="text-xl font-bold text-gray-900">{CATEGORIES.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'catalog' as ViewTab, label: 'Catalog', icon: Package },
          { id: 'low-stock' as ViewTab, label: `Low Stock (${lowStockCount})`, icon: AlertTriangle },
          { id: 'movements' as ViewTab, label: 'Movements', icon: ArrowRightLeft },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
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

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10"
              placeholder="Search by name, SKU, or brand..."
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
              !selectedCategory
                ? 'bg-bv-red-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.code}
              onClick={() => setSelectedCategory(cat.code)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1',
                selectedCategory === cat.code
                  ? 'bg-bv-red-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inventory Table */}
      {activeTab === 'catalog' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">MRP</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Offer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventory.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.brand}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.sku}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm">
                          {CATEGORIES.find(c => c.code === item.category)?.icon}{' '}
                          {CATEGORIES.find(c => c.code === item.category)?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">
                        ₹{item.mrp.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        ₹{item.offerPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{item.stock}</span>
                        {item.reserved > 0 && (
                          <span className="text-xs text-gray-400 ml-1">({item.reserved} reserved)</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{item.location}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={status.class}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="p-2 text-gray-400 hover:text-bv-red-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'low-stock' && (
        <div className="card">
          {lowStockItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No low stock items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sku} • {item.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-yellow-600">{item.stock} left</p>
                    <p className="text-xs text-gray-500">Min: {item.lowStockThreshold}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {activeTab === 'movements' && (
        <div className="card">
          <div className="text-center py-12 text-gray-500">
            <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Stock movement history will appear here</p>
            <p className="text-sm">Transfers, adjustments, and sales</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
