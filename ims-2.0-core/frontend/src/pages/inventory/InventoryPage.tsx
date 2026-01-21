// ============================================================================
// IMS 2.0 - Inventory Page
// Full-featured inventory management with stock tracking
// ============================================================================

import { useState, useMemo } from 'react';
import {
  Search,
  Package,
  AlertTriangle,
  ArrowRightLeft,
  Plus,
  Download,
  BarChart3,
  Tag,
  Boxes,
  TrendingDown,
  Eye,
  X,
  Minus,
  ArrowDown,
  ArrowUp,
  Edit2,
} from 'lucide-react';
import type { ProductCategory, Product } from '../../types';
import clsx from 'clsx';
import { useMockData } from '../../context/MockDataContext';
import { useToast } from '../../context/ToastContext';

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

// Stock movement types
interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  reason: string;
  performedBy: string;
  timestamp: string;
}

// Initial mock movements
const initialMovements: StockMovement[] = [
  { id: 'mov-001', productId: 'prod-001', productName: 'Ray-Ban RB5154 Clubmaster', sku: 'RB-5154-BLK', type: 'IN', quantity: 10, reason: 'Stock received from vendor', performedBy: 'Admin', timestamp: '2025-01-21T10:00:00Z' },
  { id: 'mov-002', productId: 'prod-002', productName: 'Essilor Crizal Prevencia', sku: 'ESS-CRZ-PRV', type: 'OUT', quantity: 2, reason: 'Sale - Order BV-001', performedBy: 'Sales', timestamp: '2025-01-21T11:30:00Z' },
  { id: 'mov-003', productId: 'prod-003', productName: 'Zeiss DriveSafe', sku: 'ZSS-DRV-SF', type: 'ADJUSTMENT', quantity: -1, reason: 'Damage write-off', performedBy: 'Manager', timestamp: '2025-01-21T14:00:00Z' },
];

type ViewTab = 'catalog' | 'low-stock' | 'movements';

export function InventoryPage() {
  const { products, searchProducts } = useMockData();
  const toast = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('catalog');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);

  // Adjustment form
  const [adjustForm, setAdjustForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    quantity: 1,
    reason: '',
  });

  // Filter inventory using context
  const filteredInventory = useMemo(() => {
    let filtered = searchQuery ? searchProducts(searchQuery) : products;

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, searchProducts]);

  // Mock stock data - in production this would come from backend
  const [stockData] = useState<Record<string, { available: number; reserved: number }>>(() => {
    const data: Record<string, { available: number; reserved: number }> = {};
    products.forEach(p => {
      data[p.id] = { available: Math.floor(Math.random() * 20) + 1, reserved: Math.floor(Math.random() * 3) };
    });
    return data;
  });

  // Get low stock items
  const lowStockItems = useMemo(() => {
    return products.filter(item => {
      const available = stockData[item.id]?.available || 0;
      const lowThreshold = 5;
      return available <= lowThreshold;
    });
  }, [products, stockData]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSKUs = products.length;
    const totalValue = products.reduce((sum, item) => {
      const stock = stockData[item.id]?.available || 0;
      const price = item.offerPrice || item.mrp;
      return sum + (price * stock);
    }, 0);
    const lowStockCount = lowStockItems.length;

    return { totalSKUs, totalValue, lowStockCount };
  }, [products, lowStockItems, stockData]);

  const getStockStatus = (productId: string) => {
    const stock = stockData[productId]?.available || 0;
    if (stock === 0) return { label: 'Out of Stock', class: 'badge-error' };
    if (stock <= 5) return { label: 'Low Stock', class: 'badge-warning' };
    return { label: 'In Stock', class: 'badge-success' };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailModal(true);
  };

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setAdjustForm({ type: 'IN', quantity: 1, reason: '' });
    setShowAdjustModal(true);
  };

  const handleSaveAdjustment = () => {
    if (!selectedProduct) return;
    if (!adjustForm.reason) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      type: adjustForm.type,
      quantity: adjustForm.type === 'OUT' ? -adjustForm.quantity : adjustForm.quantity,
      reason: adjustForm.reason,
      performedBy: 'Current User',
      timestamp: new Date().toISOString(),
    };

    setMovements(prev => [movement, ...prev]);
    setShowAdjustModal(false);
    setSelectedProduct(null);

    const action = adjustForm.type === 'IN' ? 'added to' : adjustForm.type === 'OUT' ? 'removed from' : 'adjusted in';
    toast.success(`${adjustForm.quantity} units ${action} ${selectedProduct.name}`);
  };

  const handleExport = () => {
    toast.success('Inventory export started. Check your downloads.');
  };

  const handleTransfer = () => {
    toast.info('Stock transfer feature - select products and destination store');
    setShowTransferModal(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <button onClick={handleExport} className="btn-outline flex items-center gap-2">
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
          <button
            onClick={() => toast.info('Use Product Master to add new products')}
            className="btn-primary flex items-center gap-2"
          >
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
              <p className="text-xl font-bold text-gray-900">{stats.totalSKUs}</p>
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
              <p className="text-xl font-bold text-gray-900">₹{(stats.totalValue / 100000).toFixed(1)}L</p>
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
              <p className="text-xl font-bold text-yellow-600">{stats.lowStockCount}</p>
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
          { id: 'low-stock' as ViewTab, label: `Low Stock (${stats.lowStockCount})`, icon: AlertTriangle },
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
          {filteredInventory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
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
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInventory.map(item => {
                    const status = getStockStatus(item.id);
                    const stock = stockData[item.id]?.available || 0;
                    const reserved = stockData[item.id]?.reserved || 0;
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{item.name}</p>
                            <p className="text-sm text-gray-500">{item.brand}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.sku}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm">
                            {CATEGORIES.find(c => c.code === item.category)?.icon}{' '}
                            {CATEGORIES.find(c => c.code === item.category)?.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-500">
                          {formatPrice(item.mrp)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {formatPrice(item.offerPrice || item.mrp)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-medium">{stock}</span>
                          {reserved > 0 && (
                            <span className="text-xs text-gray-400 ml-1">({reserved} reserved)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={status.class}>{status.label}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleViewProduct(item)}
                              className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(item)}
                              className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                              title="Adjust stock"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                      <p className="text-sm text-gray-500">{item.sku} {item.brand}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-600">{stockData[item.id]?.available || 0} left</p>
                      <p className="text-xs text-gray-500">Min: 5</p>
                    </div>
                    <button
                      onClick={() => handleAdjustStock(item)}
                      className="btn-secondary text-sm"
                    >
                      Add Stock
                    </button>
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
          {movements.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Stock movement history will appear here</p>
              <p className="text-sm">Transfers, adjustments, and sales</p>
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map(mov => (
                <div key={mov.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      mov.type === 'IN' ? 'bg-green-100' : mov.type === 'OUT' ? 'bg-red-100' : 'bg-blue-100'
                    )}>
                      {mov.type === 'IN' ? (
                        <ArrowDown className="w-5 h-5 text-green-600" />
                      ) : mov.type === 'OUT' ? (
                        <ArrowUp className="w-5 h-5 text-red-600" />
                      ) : (
                        <Edit2 className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{mov.productName}</p>
                      <p className="text-sm text-gray-500">{mov.sku} {mov.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx(
                      'text-lg font-bold',
                      mov.quantity > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {mov.quantity > 0 ? '+' : ''}{mov.quantity}
                    </p>
                    <p className="text-xs text-gray-500">{formatTime(mov.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Adjust Stock</h3>
              <button onClick={() => setShowAdjustModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
                <p className="text-sm text-gray-500 mt-1">Current stock: <span className="font-medium">{stockData[selectedProduct.id]?.available || 0}</span></p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adjustment Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'IN', label: 'Stock In', icon: ArrowDown, color: 'green' },
                    { value: 'OUT', label: 'Stock Out', icon: ArrowUp, color: 'red' },
                    { value: 'ADJUSTMENT', label: 'Adjustment', icon: Edit2, color: 'blue' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setAdjustForm(prev => ({ ...prev, type: opt.value as any }))}
                      className={clsx(
                        'flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-colors',
                        adjustForm.type === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-50`
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <opt.icon className={`w-5 h-5 ${adjustForm.type === opt.value ? `text-${opt.color}-600` : 'text-gray-400'}`} />
                      <span className="text-sm font-medium">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAdjustForm(prev => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={adjustForm.quantity}
                    onChange={e => setAdjustForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="input-field text-center w-20"
                    min="1"
                  />
                  <button
                    onClick={() => setAdjustForm(prev => ({ ...prev, quantity: prev.quantity + 1 }))}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                <select
                  value={adjustForm.reason}
                  onChange={e => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select reason...</option>
                  <option value="Stock received from vendor">Stock received from vendor</option>
                  <option value="Return from customer">Return from customer</option>
                  <option value="Damaged / Write-off">Damaged / Write-off</option>
                  <option value="Physical count correction">Physical count correction</option>
                  <option value="Transfer to another store">Transfer to another store</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowAdjustModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleSaveAdjustment} className="btn-primary">Save Adjustment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Product Details</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{selectedProduct.name}</h4>
                <p className="text-gray-500">{selectedProduct.brand}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">SKU</p>
                  <p className="font-mono font-medium">{selectedProduct.sku}</p>
                </div>
                <div>
                  <p className="text-gray-500">Category</p>
                  <p className="font-medium">{CATEGORIES.find(c => c.code === selectedProduct.category)?.label}</p>
                </div>
                <div>
                  <p className="text-gray-500">MRP</p>
                  <p className="font-medium">{formatPrice(selectedProduct.mrp)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Offer Price</p>
                  <p className="font-medium text-green-600">{formatPrice(selectedProduct.offerPrice || selectedProduct.mrp)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Available Stock</p>
                  <p className="font-medium">{stockData[selectedProduct.id]?.available || 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Reserved</p>
                  <p className="font-medium">{stockData[selectedProduct.id]?.reserved || 0}</p>
                </div>
              </div>

              {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Specifications</p>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowDetailModal(false)} className="btn-secondary">Close</button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleAdjustStock(selectedProduct);
                  }}
                  className="btn-primary"
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold">Stock Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-gray-600">Transfer stock between stores or warehouses.</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
                <select className="input-field">
                  <option>Current Store (Kolkata Main)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
                <select className="input-field">
                  <option value="">Select destination...</option>
                  <option value="store-2">Kolkata South</option>
                  <option value="store-3">Mumbai Central</option>
                  <option value="warehouse">Central Warehouse</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                After selecting destination, you'll be able to choose products and quantities to transfer.
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowTransferModal(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleTransfer} className="btn-primary">Continue</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryPage;
