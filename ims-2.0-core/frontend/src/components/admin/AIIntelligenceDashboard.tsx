// ============================================================================
// IMS 2.0 - AI Intelligence Dashboard
// AI-powered insights, predictions, and recommendations for retail operations
// ============================================================================

import React, { useState, useEffect } from 'react';
import { aiApi } from '../../services/api';

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation' | 'alert';
  category: 'sales' | 'inventory' | 'customer' | 'staff' | 'finance';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  confidence: number;
  action_items: string[];
  data_points?: Record<string, any>;
  created_at: string;
  expires_at?: string;
  dismissed: boolean;
}

interface SalesPrediction {
  date: string;
  predicted_revenue: number;
  lower_bound: number;
  upper_bound: number;
  factors: string[];
}

interface InventoryRecommendation {
  sku: string;
  product_name: string;
  current_stock: number;
  predicted_demand: number;
  reorder_quantity: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
}

interface CustomerSegment {
  segment_id: string;
  name: string;
  description: string;
  customer_count: number;
  avg_order_value: number;
  purchase_frequency: number;
  churn_risk: number;
  recommended_actions: string[];
}

interface StaffPerformanceInsight {
  employee_id: string;
  employee_name: string;
  performance_score: number;
  trend: 'improving' | 'stable' | 'declining';
  strengths: string[];
  areas_for_improvement: string[];
  recommended_training: string[];
}

interface Props {
  storeId?: string;
  userRole: string;
}

export const AIIntelligenceDashboard: React.FC<Props> = ({
  storeId,
  userRole
}) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'predictions' | 'inventory' | 'customers' | 'staff'>('insights');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<SalesPrediction[]>([]);
  const [inventoryRecs, setInventoryRecs] = useState<InventoryRecommendation[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [staffInsights, setStaffInsights] = useState<StaffPerformanceInsight[]>([]);

  // Filter states
  const [insightFilter, setInsightFilter] = useState<string>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [storeId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadInsights(),
        loadPredictions(),
        loadInventoryRecommendations(),
        loadCustomerSegments(),
        loadStaffInsights()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await aiApi.listInsights({ limit: 20 });
      // Transform API response to component format
      const transformedInsights = (response.insights || []).map((i: any) => ({
        id: i.id,
        type: i.severity === 'CRITICAL' ? 'alert' : i.severity === 'WARNING' ? 'risk' : 'recommendation',
        category: i.category?.toLowerCase() || 'sales',
        priority: i.severity === 'CRITICAL' ? 'high' : i.severity === 'WARNING' ? 'medium' : 'low',
        title: i.title,
        description: i.description,
        impact: i.recommendation || 'Review recommended',
        confidence: 85,
        action_items: i.recommendation ? [i.recommendation] : [],
        data_points: i.data_points || {},
        created_at: i.created_at,
        dismissed: i.status === 'DISMISSED'
      }));
      setInsights(transformedInsights.length > 0 ? transformedInsights : []);
    } catch (error) {
      // Mock data
      setInsights([
        {
          id: 'INS001',
          type: 'opportunity',
          category: 'sales',
          priority: 'high',
          title: 'Weekend Sales Opportunity',
          description: 'Historical data shows 35% higher footfall on upcoming long weekend. Stock up on fast-moving items.',
          impact: 'Potential revenue increase of ₹2.5L',
          confidence: 87,
          action_items: [
            'Increase staff scheduling by 20%',
            'Stock up on Ray-Ban and Titan frames',
            'Prepare promotional offers'
          ],
          created_at: new Date().toISOString(),
          dismissed: false
        },
        {
          id: 'INS002',
          type: 'risk',
          category: 'inventory',
          priority: 'high',
          title: 'Stock-out Risk: Contact Lenses',
          description: 'Bausch & Lomb monthly disposables likely to stock out within 5 days based on current velocity.',
          impact: 'Potential loss of ₹85,000 in sales',
          confidence: 92,
          action_items: [
            'Place urgent reorder with distributor',
            'Consider inter-store transfer',
            'Prepare alternative product recommendations'
          ],
          created_at: new Date().toISOString(),
          dismissed: false
        },
        {
          id: 'INS003',
          type: 'trend',
          category: 'customer',
          priority: 'medium',
          title: 'Rising Demand for Blue-Light Glasses',
          description: 'Search queries and purchases for blue-light blocking glasses up 45% MoM. Consider expanding range.',
          impact: 'Growing market segment',
          confidence: 78,
          action_items: [
            'Review current blue-light lens inventory',
            'Explore new supplier options',
            'Train staff on benefits explanation'
          ],
          created_at: new Date().toISOString(),
          dismissed: false
        },
        {
          id: 'INS004',
          type: 'alert',
          category: 'finance',
          priority: 'high',
          title: 'High Outstanding from Corporate Client',
          description: 'ABC Corporation has ₹2.5L outstanding for 90+ days. Credit limit utilization at 85%.',
          impact: 'Cash flow risk',
          confidence: 100,
          action_items: [
            'Schedule follow-up call',
            'Review credit terms',
            'Consider hold on new orders'
          ],
          created_at: new Date().toISOString(),
          dismissed: false
        },
        {
          id: 'INS005',
          type: 'recommendation',
          category: 'staff',
          priority: 'medium',
          title: 'Training Opportunity: Upselling',
          description: 'Analysis shows 3 sales staff have below-average lens upgrade conversion rates.',
          impact: 'Potential 15% increase in average order value',
          confidence: 82,
          action_items: [
            'Schedule lens technology training',
            'Share best practices from top performers',
            'Set conversion targets with incentives'
          ],
          created_at: new Date().toISOString(),
          dismissed: false
        }
      ]);
    }
  };

  const loadPredictions = async () => {
    try {
      const response = await aiApi.getSalesForecast(storeId, 7);
      // Transform API response to component format
      const transformedPredictions = (response.forecasts || []).map((f: any) => ({
        date: f.date,
        predicted_revenue: f.predicted_amount || f.predictedAmount,
        lower_bound: f.lower_bound || f.lowerBound,
        upper_bound: f.upper_bound || f.upperBound,
        factors: ['AI forecast based on historical data']
      }));
      setPredictions(transformedPredictions.length > 0 ? transformedPredictions : []);
    } catch (error) {
      // Mock 7-day forecast
      const today = new Date();
      const mockPredictions: SalesPrediction[] = [];
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const baseRevenue = isWeekend ? 85000 : 65000;
        mockPredictions.push({
          date: date.toISOString().split('T')[0],
          predicted_revenue: baseRevenue + Math.random() * 10000,
          lower_bound: baseRevenue - 10000,
          upper_bound: baseRevenue + 20000,
          factors: isWeekend
            ? ['Weekend footfall', 'Promotional offers']
            : ['Regular weekday', 'Corporate orders expected']
        });
      }
      setPredictions(mockPredictions);
    }
  };

  const loadInventoryRecommendations = async () => {
    try {
      const response = await aiApi.getInventoryRecommendations(storeId);
      // Transform API response to component format
      const transformedRecs = (response.recommendations || []).map((r: any) => ({
        sku: r.product_id || r.productId,
        product_name: r.product_name || r.productName,
        current_stock: r.current_stock || r.currentStock,
        predicted_demand: r.predicted_demand || r.predictedDemand,
        reorder_quantity: r.reorder_quantity || r.reorderQuantity,
        urgency: (r.urgency || 'medium').toLowerCase(),
        reason: r.reason
      }));
      setInventoryRecs(transformedRecs.length > 0 ? transformedRecs : []);
    } catch (error) {
      setInventoryRecs([
        {
          sku: 'SKU001',
          product_name: 'Ray-Ban Aviator Classic',
          current_stock: 3,
          predicted_demand: 12,
          reorder_quantity: 15,
          urgency: 'critical',
          reason: 'High velocity SKU, weekend sale expected'
        },
        {
          sku: 'SKU002',
          product_name: 'Bausch & Lomb Monthly - PWR -3.00',
          current_stock: 8,
          predicted_demand: 20,
          reorder_quantity: 25,
          urgency: 'high',
          reason: 'Stock-out predicted in 5 days'
        },
        {
          sku: 'SKU003',
          product_name: 'Titan Progressive Lenses',
          current_stock: 15,
          predicted_demand: 18,
          reorder_quantity: 10,
          urgency: 'medium',
          reason: 'Lead time consideration'
        },
        {
          sku: 'SKU004',
          product_name: 'Crizal Anti-Reflective Coating',
          current_stock: 25,
          predicted_demand: 30,
          reorder_quantity: 20,
          urgency: 'low',
          reason: 'Regular replenishment'
        }
      ]);
    }
  };

  const loadCustomerSegments = async () => {
    try {
      const response = await aiApi.getCustomerSegments();
      // Transform API response to component format
      const transformedSegments = (response.segments || []).map((s: any) => ({
        segment_id: s.segment_id || s.segmentId,
        name: s.name,
        description: s.description,
        customer_count: s.customer_count || s.customerCount,
        avg_order_value: s.avg_order_value || s.avgOrderValue,
        purchase_frequency: 1.5, // Default
        churn_risk: s.churn_risk === 'HIGH' ? 0.7 : s.churn_risk === 'MEDIUM' ? 0.4 : 0.1,
        recommended_actions: s.recommended_actions || s.recommendedActions || []
      }));
      setCustomerSegments(transformedSegments.length > 0 ? transformedSegments : []);
    } catch (error) {
      setCustomerSegments([
        {
          segment_id: 'SEG001',
          name: 'High-Value Loyalists',
          description: 'Regular customers with high spend and prescription renewals',
          customer_count: 245,
          avg_order_value: 15000,
          purchase_frequency: 2.5,
          churn_risk: 0.08,
          recommended_actions: [
            'Priority service and early access to new products',
            'Personalized lens upgrade recommendations',
            'Loyalty program tier upgrades'
          ]
        },
        {
          segment_id: 'SEG002',
          name: 'Corporate Buyers',
          description: 'B2B customers with bulk orders',
          customer_count: 42,
          avg_order_value: 75000,
          purchase_frequency: 4.2,
          churn_risk: 0.15,
          recommended_actions: [
            'Dedicated account management',
            'Volume-based discounts',
            'Extended credit terms review'
          ]
        },
        {
          segment_id: 'SEG003',
          name: 'Price-Sensitive',
          description: 'Value-conscious customers looking for deals',
          customer_count: 520,
          avg_order_value: 4500,
          purchase_frequency: 1.2,
          churn_risk: 0.35,
          recommended_actions: [
            'Target with promotional offers',
            'Bundle deals on frames + lenses',
            'EMI options highlighting'
          ]
        },
        {
          segment_id: 'SEG004',
          name: 'At-Risk Churners',
          description: 'Previously active customers with declining engagement',
          customer_count: 180,
          avg_order_value: 8000,
          purchase_frequency: 0.5,
          churn_risk: 0.72,
          recommended_actions: [
            'Win-back campaign with special offers',
            'Prescription renewal reminders',
            'Personal outreach from store manager'
          ]
        }
      ]);
    }
  };

  const loadStaffInsights = async () => {
    try {
      const response = await aiApi.getStaffPerformanceInsights(storeId);
      // Transform API response to component format
      const insights = response.insights || {};
      const topPerformers = insights.top_performers || [];
      const improvementAreas = insights.improvement_areas || [];
      const allStaff = [...topPerformers, ...improvementAreas].map((s: any) => ({
        employee_id: s.staff_id || s.staffId,
        employee_name: s.name,
        performance_score: s.metrics?.sales_this_month ? Math.min(100, Math.round(s.metrics.conversion_rate || 75)) : 75,
        trend: s.metrics?.conversion_rate > 70 ? 'improving' : s.areas ? 'declining' : 'stable',
        strengths: s.strengths || [],
        areas_for_improvement: s.areas || [],
        recommended_training: s.recommended_training || s.recommendedTraining || []
      }));
      setStaffInsights(allStaff.length > 0 ? allStaff : []);
    } catch (error) {
      setStaffInsights([
        {
          employee_id: 'EMP001',
          employee_name: 'Rajesh Kumar',
          performance_score: 92,
          trend: 'improving',
          strengths: ['Customer rapport', 'Premium upselling', 'Product knowledge'],
          areas_for_improvement: ['Inventory management'],
          recommended_training: ['Advanced lens technology']
        },
        {
          employee_id: 'EMP002',
          employee_name: 'Priya Sharma',
          performance_score: 88,
          trend: 'stable',
          strengths: ['Eye examination accuracy', 'Patient communication'],
          areas_for_improvement: ['Time management'],
          recommended_training: ['Specialized contact lens fitting']
        },
        {
          employee_id: 'EMP003',
          employee_name: 'Amit Patel',
          performance_score: 75,
          trend: 'declining',
          strengths: ['Process compliance'],
          areas_for_improvement: ['Conversion rate', 'Upselling'],
          recommended_training: ['Sales techniques', 'Product benefits']
        }
      ]);
    }
  };

  const handleDismissInsight = async (insightId: string) => {
    try {
      await aiApi.dismissInsight(insightId);
      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, dismissed: true } : i)
      );
    } catch (error) {
      // Update locally anyway for demo
      setInsights(prev =>
        prev.map(i => i.id === insightId ? { ...i, dismissed: true } : i)
      );
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInsightIcon = (type: AIInsight['type']): string => {
    const icons: Record<string, string> = {
      opportunity: '💡',
      risk: '⚠️',
      trend: '📈',
      recommendation: '💬',
      alert: '🚨'
    };
    return icons[type] || '📊';
  };

  const getInsightColor = (type: AIInsight['type']): string => {
    const colors: Record<string, string> = {
      opportunity: 'border-green-200 bg-green-50',
      risk: 'border-red-200 bg-red-50',
      trend: 'border-blue-200 bg-blue-50',
      recommendation: 'border-purple-200 bg-purple-50',
      alert: 'border-orange-200 bg-orange-50'
    };
    return colors[type] || 'border-gray-200 bg-gray-50';
  };

  const getPriorityBadge = (priority: AIInsight['priority']): string => {
    const badges: Record<string, string> = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-gray-100 text-gray-700'
    };
    return badges[priority] || 'bg-gray-100 text-gray-700';
  };

  const getUrgencyColor = (urgency: InventoryRecommendation['urgency']): string => {
    const colors: Record<string, string> = {
      critical: 'bg-red-600 text-white',
      high: 'bg-orange-500 text-white',
      medium: 'bg-yellow-500 text-black',
      low: 'bg-green-500 text-white'
    };
    return colors[urgency] || 'bg-gray-500 text-white';
  };

  const getTrendIcon = (trend: StaffPerformanceInsight['trend']): string => {
    const icons: Record<string, string> = {
      improving: '📈',
      stable: '➡️',
      declining: '📉'
    };
    return icons[trend] || '➡️';
  };

  const getTrendColor = (trend: StaffPerformanceInsight['trend']): string => {
    const colors: Record<string, string> = {
      improving: 'text-green-600',
      stable: 'text-blue-600',
      declining: 'text-red-600'
    };
    return colors[trend] || 'text-gray-600';
  };

  const filteredInsights = insights.filter(i => {
    if (!showDismissed && i.dismissed) return false;
    if (insightFilter === 'all') return true;
    return i.category === insightFilter;
  });

  const renderInsightsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'sales', 'inventory', 'customer', 'staff', 'finance'].map(filter => (
            <button
              key={filter}
              onClick={() => setInsightFilter(filter)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                insightFilter === filter
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            className="rounded"
          />
          Show dismissed
        </label>
      </div>

      {/* Insights Grid */}
      {filteredInsights.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No active insights for the selected category
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map(insight => (
            <div
              key={insight.id}
              className={`border rounded-xl p-4 ${getInsightColor(insight.type)} ${
                insight.dismissed ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getPriorityBadge(insight.priority)}`}>
                        {insight.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{insight.category}</span>
                      <span className="text-xs text-gray-500">
                        {insight.confidence}% confidence
                      </span>
                    </div>
                  </div>
                </div>
                {!insight.dismissed && (
                  <button
                    onClick={() => handleDismissInsight(insight.id)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                )}
              </div>

              <p className="text-gray-700 mb-3">{insight.description}</p>

              <div className="bg-white/50 rounded-lg p-3 mb-3">
                <span className="text-sm font-medium text-gray-700">Impact: </span>
                <span className="text-sm text-gray-600">{insight.impact}</span>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</h4>
                <ul className="space-y-1">
                  {insight.action_items.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-600">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">7-Day Sales Forecast</h3>

      {/* Forecast Chart (simplified visual) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-end justify-between h-48 gap-2">
          {predictions.map((pred, idx) => {
            const maxRevenue = Math.max(...predictions.map(p => p.upper_bound));
            const height = (pred.predicted_revenue / maxRevenue) * 100;
            const date = new Date(pred.date);
            const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div key={pred.date} className="flex-1 flex flex-col items-center">
                <div className="relative w-full" style={{ height: `${height}%` }}>
                  <div
                    className={`absolute inset-x-1 bottom-0 rounded-t-lg ${
                      isWeekend ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ height: '100%' }}
                  />
                  <div className="absolute -top-6 inset-x-0 text-center">
                    <span className="text-xs font-medium text-gray-700">
                      {formatCurrency(pred.predicted_revenue).replace('₹', '')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <span className={`text-xs font-medium ${isWeekend ? 'text-green-600' : 'text-gray-600'}`}>
                    {dayName}
                  </span>
                  <p className="text-xs text-gray-400">
                    {date.getDate()}/{date.getMonth() + 1}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Forecast Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {predictions.map(pred => {
          const date = new Date(pred.date);
          return (
            <div key={pred.date} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900">
                  {date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-lg font-bold text-blue-600">
                  {formatCurrency(pred.predicted_revenue)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Range: {formatCurrency(pred.lower_bound)} - {formatCurrency(pred.upper_bound)}
              </div>
              <div className="flex flex-wrap gap-1">
                {pred.factors.map((factor, idx) => (
                  <span key={idx} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">7-Day Forecast Summary</h4>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-sm text-blue-600">Total Predicted</span>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(predictions.reduce((sum, p) => sum + p.predicted_revenue, 0))}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Daily Average</span>
            <p className="text-xl font-bold text-blue-900">
              {formatCurrency(predictions.reduce((sum, p) => sum + p.predicted_revenue, 0) / 7)}
            </p>
          </div>
          <div>
            <span className="text-sm text-blue-600">Peak Day</span>
            <p className="text-xl font-bold text-blue-900">
              {new Date(predictions.reduce((max, p) =>
                p.predicted_revenue > max.predicted_revenue ? p : max
              ).date).toLocaleDateString('en-IN', { weekday: 'short' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Reorder Recommendations</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Generate PO
        </button>
      </div>

      <div className="space-y-3">
        {inventoryRecs.map(item => (
          <div
            key={item.sku}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs font-bold rounded ${getUrgencyColor(item.urgency)}`}>
                  {item.urgency.toUpperCase()}
                </span>
                <div>
                  <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                  <p className="text-xs text-gray-500">SKU: {item.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">Order: {item.reorder_quantity} units</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm mb-3">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500">Current Stock</span>
                <p className="font-medium text-gray-900">{item.current_stock} units</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500">Predicted Demand</span>
                <p className="font-medium text-orange-600">{item.predicted_demand} units</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-gray-500">Coverage</span>
                <p className={`font-medium ${
                  item.current_stock < item.predicted_demand ? 'text-red-600' : 'text-green-600'
                }`}>
                  {Math.round((item.current_stock / item.predicted_demand) * 100)}%
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              <span className="font-medium">Reason: </span>{item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCustomersTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Customer Segmentation Analysis</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {customerSegments.map(segment => (
          <div
            key={segment.segment_id}
            className="bg-white border border-gray-200 rounded-xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{segment.name}</h4>
                <p className="text-sm text-gray-500">{segment.description}</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">{segment.customer_count}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Avg Order</span>
                <p className="font-medium text-gray-900">{formatCurrency(segment.avg_order_value)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Frequency</span>
                <p className="font-medium text-gray-900">{segment.purchase_frequency}x/yr</p>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="text-xs text-gray-500">Churn Risk</span>
                <p className={`font-medium ${
                  segment.churn_risk > 0.5 ? 'text-red-600' :
                  segment.churn_risk > 0.25 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {(segment.churn_risk * 100).toFixed(0)}%
                </p>
              </div>
            </div>

            {/* Churn Risk Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Churn Risk</span>
                <span>{(segment.churn_risk * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    segment.churn_risk > 0.5 ? 'bg-red-500' :
                    segment.churn_risk > 0.25 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${segment.churn_risk * 100}%` }}
                />
              </div>
            </div>

            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Recommended Actions:</h5>
              <ul className="space-y-1">
                {segment.recommended_actions.map((action, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-blue-500">→</span>
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStaffTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Staff Performance Insights</h3>

      <div className="space-y-4">
        {staffInsights.map(staff => (
          <div
            key={staff.employee_id}
            className="bg-white border border-gray-200 rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{staff.employee_name}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${getTrendColor(staff.trend)}`}>
                      {getTrendIcon(staff.trend)} {staff.trend.charAt(0).toUpperCase() + staff.trend.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">{staff.performance_score}</div>
                <span className="text-xs text-gray-500">Performance Score</span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="mb-4">
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    staff.performance_score >= 85 ? 'bg-green-500' :
                    staff.performance_score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${staff.performance_score}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h5 className="text-xs font-medium text-green-700 mb-2">Strengths</h5>
                <ul className="space-y-1">
                  {staff.strengths.map((s, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-green-500">✓</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-orange-700 mb-2">Areas for Improvement</h5>
                <ul className="space-y-1">
                  {staff.areas_for_improvement.map((a, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-orange-500">!</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-blue-700 mb-2">Recommended Training</h5>
                <ul className="space-y-1">
                  {staff.recommended_training.map((t, idx) => (
                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                      <span className="text-blue-500">📚</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Intelligence Dashboard</h2>
            <p className="text-gray-600">AI-powered insights and recommendations for your business</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <span className="text-sm opacity-80">Active Insights</span>
          <p className="text-2xl font-bold">{insights.filter(i => !i.dismissed).length}</p>
        </div>
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <span className="text-sm opacity-80">7-Day Forecast</span>
          <p className="text-2xl font-bold">
            {formatCurrency(predictions.reduce((sum, p) => sum + p.predicted_revenue, 0)).replace('₹', '₹')}
          </p>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <span className="text-sm opacity-80">Reorder Alerts</span>
          <p className="text-2xl font-bold">{inventoryRecs.filter(i => i.urgency === 'critical' || i.urgency === 'high').length}</p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
          <span className="text-sm opacity-80">At-Risk Customers</span>
          <p className="text-2xl font-bold">
            {customerSegments.find(s => s.churn_risk > 0.5)?.customer_count || 0}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { id: 'insights', label: 'Insights', icon: '💡' },
          { id: 'predictions', label: 'Sales Forecast', icon: '📈' },
          { id: 'inventory', label: 'Inventory', icon: '📦' },
          { id: 'customers', label: 'Customers', icon: '👥' },
          { id: 'staff', label: 'Staff', icon: '👤' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'insights' && renderInsightsTab()}
        {activeTab === 'predictions' && renderPredictionsTab()}
        {activeTab === 'inventory' && renderInventoryTab()}
        {activeTab === 'customers' && renderCustomersTab()}
        {activeTab === 'staff' && renderStaffTab()}
      </div>
    </div>
  );
};
