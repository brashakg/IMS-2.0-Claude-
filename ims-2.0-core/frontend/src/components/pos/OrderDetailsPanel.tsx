// ============================================================================
// IMS 2.0 - Order Details Panel for POS
// ============================================================================
// Right panel with Delivery Date, Sales Person, Notes

import { useState } from 'react';
import { Calendar, User, FileText, Clock, Zap } from 'lucide-react';

interface OrderDetailsData {
  deliveryDate: string;
  deliveryTime: string;
  salesPerson: string;
  notes: string;
  isExpress: boolean;
  isUrgent: boolean;
}

interface OrderDetailsPanelProps {
  orderDetails: OrderDetailsData;
  onChange: (details: OrderDetailsData) => void;
  salesPersonOptions?: { id: string; name: string }[];
}

// Mock sales persons
const defaultSalesPersons = [
  { id: 'sp-001', name: 'Rahul Sharma' },
  { id: 'sp-002', name: 'Priya Patel' },
  { id: 'sp-003', name: 'Amit Singh' },
  { id: 'sp-004', name: 'Neha Gupta' },
];

export function OrderDetailsPanel({
  orderDetails,
  onChange,
  salesPersonOptions = defaultSalesPersons,
}: OrderDetailsPanelProps) {
  const updateField = <K extends keyof OrderDetailsData>(
    field: K,
    value: OrderDetailsData[K]
  ) => {
    onChange({ ...orderDetails, [field]: value });
  };

  // Get today and tomorrow dates for quick selection
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const in3Days = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  return (
    <div className="border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h3 className="font-medium text-gray-900 text-sm">Order Details</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Delivery Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delivery Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={orderDetails.deliveryDate}
              onChange={e => updateField('deliveryDate', e.target.value)}
              min={today}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
            />
          </div>
          {/* Quick date selection */}
          <div className="flex gap-2 mt-2">
            {[
              { label: 'Today', value: today },
              { label: 'Tomorrow', value: tomorrow },
              { label: '3 Days', value: in3Days },
              { label: '1 Week', value: in7Days },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => updateField('deliveryDate', opt.value)}
                className={`px-2 py-1 text-xs rounded ${
                  orderDetails.deliveryDate === opt.value
                    ? 'bg-bv-red-100 text-bv-red-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Express/Urgent Toggle */}
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={orderDetails.isExpress}
              onChange={e => updateField('isExpress', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Zap className="w-4 h-4 text-orange-500" />
              Express
            </span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={orderDetails.isUrgent}
              onChange={e => updateField('isUrgent', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm text-gray-700 flex items-center gap-1">
              <Clock className="w-4 h-4 text-red-500" />
              Urgent
            </span>
          </label>
        </div>

        {/* Sales Person */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sales Person
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={orderDetails.salesPerson}
              onChange={e => updateField('salesPerson', e.target.value)}
              className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none appearance-none bg-white"
            >
              <option value="">Select Sales Person</option>
              {salesPersonOptions.map(sp => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <div className="relative">
            <textarea
              value={orderDetails.notes}
              onChange={e => updateField('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none resize-none"
              placeholder="Any special instructions..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsPanel;
