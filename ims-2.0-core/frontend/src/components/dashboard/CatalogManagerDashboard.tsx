// ============================================================================
// IMS 2.0 - Catalog Manager Dashboard
// ============================================================================
// Shows product catalog stats, pending items, stock levels, vendor orders

import { useNavigate } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Plus,
  Edit,
  Barcode,
  Truck,
  Database,
  TrendingUp,
  Clock,
  Tags,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TaskSummary } from './TaskSummary';
import { TaskPriority } from '../../types';
import clsx from 'clsx';

// Stock Alert
interface StockAlert {
  id: string;
  productName: string;
  sku: string;
  category: string;
  currentStock: number;
  minStock: number;
  storeId?: string;
  storeName?: string;
}

// Pending Catalog Item
interface PendingCatalogItem {
  id: string;
  productName: string;
  brand: string;
  category: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED';
  createdAt: string;
}

// Stock Alerts Component
function StockAlerts({ alerts }: { alerts: StockAlert[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Low Stock Alerts</h2>
        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
          {alerts.length} items
        </span>
      </div>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={clsx(
              'flex items-center justify-between p-3 rounded-lg border',
              alert.currentStock === 0 ? 'border-red-300 bg-red-50' : 'border-yellow-200 bg-yellow-50'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{alert.productName}</p>
              <p className="text-xs text-gray-500">{alert.sku} • {alert.category}</p>
              {alert.storeName && (
                <p className="text-xs text-gray-400">{alert.storeName}</p>
              )}
            </div>
            <div className="text-right ml-3">
              <p className={clsx(
                'font-bold',
                alert.currentStock === 0 ? 'text-red-600' : 'text-yellow-600'
              )}>
                {alert.currentStock}
              </p>
              <p className="text-xs text-gray-500">min: {alert.minStock}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pending Catalog Items
function PendingCatalogItems({ items, onEdit }: { items: PendingCatalogItem[]; onEdit: (item: PendingCatalogItem) => void }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Pending Catalog Items</h2>
        <span className="text-sm text-gray-500">{items.length} items</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No pending items</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => onEdit(item)}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-bv-red-200 cursor-pointer transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.brand} • {item.category}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={clsx(
                  'text-xs px-2 py-0.5 rounded',
                  item.status === 'DRAFT' && 'bg-gray-100 text-gray-600',
                  item.status === 'PENDING_APPROVAL' && 'bg-yellow-100 text-yellow-700',
                  item.status === 'APPROVED' && 'bg-green-100 text-green-700'
                )}>
                  {item.status.replace('_', ' ')}
                </span>
                <Edit className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function CatalogManagerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock data
  const stats = {
    totalProducts: 2456,
    activeProducts: 2380,
    draftProducts: 45,
    pendingApproval: 31,
    lowStockItems: 28,
    outOfStock: 12,
    pendingGRN: 5,
    recentlyAdded: 15,
  };

  const stockAlerts: StockAlert[] = [
    { id: '1', productName: 'Ray-Ban RB5154 Clubmaster', sku: 'RB-5154-BLK', category: 'Frame', currentStock: 0, minStock: 5, storeName: 'Vijay Nagar' },
    { id: '2', productName: 'Essilor Crizal Sapphire', sku: 'ESS-CS-STD', category: 'Optical Lens', currentStock: 3, minStock: 10, storeName: 'All Stores' },
    { id: '3', productName: 'Acuvue Oasys (6 pack)', sku: 'ACV-OAS-6', category: 'Contact Lens', currentStock: 5, minStock: 15, storeName: 'Palasia' },
    { id: '4', productName: 'Titan Aviator Classic', sku: 'TIT-AV-GLD', category: 'Sunglass', currentStock: 2, minStock: 8, storeName: 'Vijay Nagar' },
    { id: '5', productName: 'Oakley Half Jacket 2.0', sku: 'OAK-HJ-BLK', category: 'Frame', currentStock: 1, minStock: 5, storeName: 'Sapna Sangeeta' },
  ];

  const pendingItems: PendingCatalogItem[] = [
    { id: '1', productName: 'Gucci GG0010S Sunglasses', brand: 'Gucci', category: 'Sunglass', status: 'PENDING_APPROVAL', createdAt: '2 hours ago' },
    { id: '2', productName: 'Zeiss DriveSafe Lens', brand: 'Zeiss', category: 'Optical Lens', status: 'DRAFT', createdAt: 'Yesterday' },
    { id: '3', productName: 'Bausch+Lomb Ultra', brand: 'Bausch+Lomb', category: 'Contact Lens', status: 'PENDING_APPROVAL', createdAt: '3 days ago' },
  ];

  const tasks = [
    { id: '1', title: 'Review and approve pending products', priority: 'P1' as TaskPriority, dueTime: 'Today', type: 'SYSTEM' as const, status: 'PENDING' as const },
    { id: '2', title: 'Complete GRN for shipment #GRN-2501-045', priority: 'P1' as TaskPriority, dueTime: '2:00 PM', type: 'SYSTEM' as const, status: 'IN_PROGRESS' as const },
    { id: '3', title: 'Update pricing for Q1 2025', priority: 'P2' as TaskPriority, dueTime: 'This Week', type: 'MANUAL' as const, status: 'PENDING' as const },
    { id: '4', title: 'Audit product images', priority: 'P3' as TaskPriority, type: 'SOP' as const, status: 'PENDING' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 mt-1">Product Catalog & Inventory Management</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProducts.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.activeProducts} active</p>
            </div>
            <div className="p-3 bg-bv-red-50 rounded-lg">
              <Database className="w-6 h-6 text-bv-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pendingApproval}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.draftProducts} drafts</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card border-red-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.lowStockItems}</p>
              <p className="text-xs text-red-500 mt-1">{stats.outOfStock} out of stock</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending GRN</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.pendingGRN}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting acceptance</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid laptop:grid-cols-2 gap-6">
        {/* Tasks */}
        <TaskSummary
          tasks={tasks}
          onViewAll={() => navigate('/tasks')}
          onTaskClick={() => navigate('/tasks')}
        />

        {/* Pending Catalog Items */}
        <PendingCatalogItems
          items={pendingItems}
          onEdit={(item) => navigate(`/inventory?edit=${item.id}`)}
        />
      </div>

      {/* Stock Alerts */}
      <StockAlerts alerts={stockAlerts} />

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 tablet:grid-cols-6 gap-3">
          <QuickAction label="Add Product" icon={Plus} onClick={() => navigate('/inventory?action=add')} />
          <QuickAction label="Stock In (GRN)" icon={Truck} onClick={() => navigate('/inventory?tab=grn')} />
          <QuickAction label="Print Barcodes" icon={Barcode} onClick={() => navigate('/inventory?action=barcode')} />
          <QuickAction label="Categories" icon={Tags} onClick={() => navigate('/inventory?tab=categories')} />
          <QuickAction label="Inventory" icon={Package} onClick={() => navigate('/inventory')} />
          <QuickAction label="Reports" icon={TrendingUp} onClick={() => navigate('/reports')} />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ label, icon: Icon, onClick }: { label: string; icon: React.ComponentType<{ className?: string }>; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:border-bv-red-200 hover:bg-bv-red-50 transition-colors touch-target"
    >
      <div className="p-3 bg-gray-100 rounded-lg">
        <Icon className="w-6 h-6 text-gray-600" />
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

export default CatalogManagerDashboard;
