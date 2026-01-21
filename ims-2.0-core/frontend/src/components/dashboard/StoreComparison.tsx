// ============================================================================
// IMS 2.0 - Store Comparison Component
// ============================================================================
// Shows comparative performance across stores for Area Managers/Admins

import { Building2, TrendingUp, TrendingDown, Users, ShoppingCart } from 'lucide-react';
import clsx from 'clsx';

interface StorePerformance {
  storeId: string;
  storeName: string;
  brand: 'BETTER_VISION' | 'WIZOPT';
  todaySales: number;
  monthSales: number;
  monthTarget: number;
  orderCount: number;
  footfall: number;
  conversion: number;
  trend: number; // vs yesterday
  rank: number;
}

interface StoreComparisonProps {
  stores: StorePerformance[];
  metric: 'sales' | 'orders' | 'conversion';
  period: 'today' | 'week' | 'month';
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function StoreComparison({ stores, metric, period }: StoreComparisonProps) {
  // Sort stores by the selected metric
  const sortedStores = [...stores].sort((a, b) => {
    if (metric === 'sales') {
      return period === 'today' ? b.todaySales - a.todaySales : b.monthSales - a.monthSales;
    }
    if (metric === 'orders') return b.orderCount - a.orderCount;
    return b.conversion - a.conversion;
  });

  // Assign ranks
  sortedStores.forEach((store, idx) => {
    store.rank = idx + 1;
  });

  // Find best performer for the metric
  const maxValue = Math.max(...sortedStores.map(s =>
    metric === 'sales' ? (period === 'today' ? s.todaySales : s.monthSales) :
    metric === 'orders' ? s.orderCount : s.conversion
  ));

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-bv-red-600" />
          <h2 className="font-semibold text-gray-900">Store Performance</h2>
        </div>
        <span className="text-xs text-gray-500 capitalize">{period === 'today' ? "Today" : period === 'week' ? 'This Week' : 'This Month'}</span>
      </div>

      <div className="space-y-3">
        {sortedStores.map((store) => {
          const value = metric === 'sales'
            ? (period === 'today' ? store.todaySales : store.monthSales)
            : metric === 'orders' ? store.orderCount : store.conversion;

          const percentage = (value / maxValue) * 100;
          const targetAchievement = Math.round((store.monthSales / store.monthTarget) * 100);

          return (
            <div key={store.storeId} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Rank Badge */}
                  <span className={clsx(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    store.rank === 1 && 'bg-yellow-400 text-yellow-900',
                    store.rank === 2 && 'bg-gray-300 text-gray-700',
                    store.rank === 3 && 'bg-orange-300 text-orange-800',
                    store.rank > 3 && 'bg-gray-100 text-gray-600'
                  )}>
                    {store.rank}
                  </span>

                  <div>
                    <span className="font-medium text-gray-900 text-sm">{store.storeName}</span>
                    <span className={clsx(
                      'ml-2 text-xs px-1 rounded',
                      store.brand === 'BETTER_VISION' ? 'bg-bv-red-100 text-bv-red-700' : 'bg-blue-100 text-blue-700'
                    )}>
                      {store.brand === 'BETTER_VISION' ? 'BV' : 'WO'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Trend */}
                  <span className={clsx(
                    'flex items-center text-xs',
                    store.trend >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {store.trend >= 0 ? (
                      <TrendingUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <TrendingDown className="w-3 h-3 mr-0.5" />
                    )}
                    {Math.abs(store.trend)}%
                  </span>

                  {/* Value */}
                  <span className="font-bold text-gray-900 min-w-[60px] text-right">
                    {metric === 'sales' ? formatCurrency(value) :
                     metric === 'conversion' ? `${value}%` : value}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full transition-all',
                      store.brand === 'BETTER_VISION' ? 'bg-bv-red-500' : 'bg-blue-500'
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 min-w-[40px]">
                  {targetAchievement}% tgt
                </span>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pl-8">
                <span className="flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" />
                  {store.orderCount} orders
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {store.footfall} footfall
                </span>
                <span>{store.conversion}% conv</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default StoreComparison;
