// ============================================================================
// IMS 2.0 - Target Progress Component
// ============================================================================
// Shows personal, store, and area targets with progress

import { Target, TrendingUp, TrendingDown, Award } from 'lucide-react';
import clsx from 'clsx';

interface TargetData {
  label: string;
  current: number;
  target: number;
  previousPeriod?: number;
  type: 'PERSONAL' | 'STORE' | 'AREA' | 'COMPANY';
}

interface TargetProgressProps {
  targets: TargetData[];
  period: 'daily' | 'weekly' | 'monthly';
  showIncentive?: boolean;
  incentiveAmount?: number;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

function TargetBar({ target }: { target: TargetData }) {
  const percentage = Math.min(Math.round((target.current / target.target) * 100), 100);
  const isAchieved = percentage >= 100;
  const isClose = percentage >= 80 && percentage < 100;

  // Determine color based on progress
  const getColor = () => {
    if (isAchieved) return 'bg-green-500';
    if (isClose) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-bv-red-500';
    return 'bg-red-500';
  };

  // Compare with previous period
  const trend = target.previousPeriod
    ? ((target.current - target.previousPeriod) / target.previousPeriod) * 100
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{target.label}</span>
          {target.type === 'PERSONAL' && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">You</span>
          )}
          {target.type === 'STORE' && (
            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Store</span>
          )}
          {target.type === 'AREA' && (
            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">Area</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-lg font-bold',
            isAchieved ? 'text-green-600' : 'text-gray-900'
          )}>
            {percentage}%
          </span>
          {isAchieved && <Award className="w-4 h-4 text-yellow-500" />}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Details */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {formatCurrency(target.current)} / {formatCurrency(target.target)}
        </span>
        {trend !== null && (
          <span className={clsx(
            'flex items-center gap-1',
            trend >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {trend >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend).toFixed(1)}% vs prev
          </span>
        )}
      </div>
    </div>
  );
}

export function TargetProgress({ targets, period, showIncentive, incentiveAmount }: TargetProgressProps) {
  const periodLabel = period === 'daily' ? 'Today' : period === 'weekly' ? 'This Week' : 'This Month';

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-bv-red-600" />
          <h2 className="font-semibold text-gray-900">{periodLabel}'s Targets</h2>
        </div>
        {showIncentive && incentiveAmount !== undefined && incentiveAmount > 0 && (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-lg">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Incentive: {formatCurrency(incentiveAmount)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {targets.map((target, idx) => (
          <TargetBar key={idx} target={target} />
        ))}
      </div>
    </div>
  );
}

export default TargetProgress;
