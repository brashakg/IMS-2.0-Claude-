/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================================
// IMS 2.0 - Customer Profile Component
// ============================================================================
// Complete customer profile with purchase history, prescriptions, and loyalty

import { useState } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  ShoppingBag,
  CreditCard,
  Gift,
  History,
  Edit2,
  Star,
  Clock,
  ChevronRight,
  AlertTriangle,
  FileText,
  Tag,
} from 'lucide-react';
import clsx from 'clsx';

// Customer Types
interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  anniversary?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;

  // Loyalty
  loyaltyPoints: number;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  memberSince: string;

  // Stats
  totalPurchases: number;
  totalSpent: number;
  avgOrderValue: number;
  lastVisit: string;
  visitCount: number;

  // Preferences
  preferredBrands?: string[];
  preferredCategories?: string[];
  notes?: string;

  // Status
  hasActiveOrder: boolean;
  hasPendingPayment: boolean;
  prescriptionExpiring: boolean;
}

interface PurchaseHistory {
  id: string;
  date: string;
  invoiceNo: string;
  items: string[];
  total: number;
  paymentMode: string;
  status: 'COMPLETED' | 'PARTIAL' | 'DELIVERED';
}

interface PrescriptionSummary {
  id: string;
  date: string;
  optometrist: string;
  rightSph: string;
  rightCyl: string;
  leftSph: string;
  leftCyl: string;
  expiryDate: string;
  isExpired: boolean;
}

// Mock Data
const mockCustomer: CustomerData = {
  id: 'cust-001',
  name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
  email: 'rajesh.kumar@email.com',
  dateOfBirth: '15-Mar-1985',
  anniversary: '20-Nov-2010',
  address: '123, ABC Apartments, MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  loyaltyPoints: 2450,
  loyaltyTier: 'GOLD',
  memberSince: 'Jan 2022',
  totalPurchases: 12,
  totalSpent: 156000,
  avgOrderValue: 13000,
  lastVisit: '15-Jan-2026',
  visitCount: 18,
  preferredBrands: ['Ray-Ban', 'Titan', 'Essilor'],
  preferredCategories: ['Frames', 'Progressive Lenses'],
  notes: 'Prefers premium brands. Works in IT, needs computer glasses.',
  hasActiveOrder: true,
  hasPendingPayment: false,
  prescriptionExpiring: true,
};

const mockPurchases: PurchaseHistory[] = [
  { id: 'p1', date: '15-Jan-2026', invoiceNo: 'INV-2026-00123', items: ['Ray-Ban RB3025', 'Essilor Crizal'], total: 21490, paymentMode: 'Card', status: 'DELIVERED' },
  { id: 'p2', date: '10-Aug-2025', invoiceNo: 'INV-2025-00456', items: ['Titan Rectangle Frame', 'Single Vision Lenses'], total: 8500, paymentMode: 'UPI', status: 'COMPLETED' },
  { id: 'p3', date: '22-Feb-2025', invoiceNo: 'INV-2025-00089', items: ['Oakley Sunglasses'], total: 12990, paymentMode: 'Cash', status: 'COMPLETED' },
];

const mockPrescriptions: PrescriptionSummary[] = [
  { id: 'rx1', date: '15-Jan-2026', optometrist: 'Dr. Amit Patel', rightSph: '-2.50', rightCyl: '-0.75', leftSph: '-2.25', leftCyl: '-0.50', expiryDate: '15-Jan-2027', isExpired: false },
  { id: 'rx2', date: '10-Aug-2024', optometrist: 'Dr. Amit Patel', rightSph: '-2.25', rightCyl: '-0.75', leftSph: '-2.00', leftCyl: '-0.50', expiryDate: '10-Aug-2025', isExpired: true },
];

// Tier Badge Component
function TierBadge({ tier }: { tier: CustomerData['loyaltyTier'] }) {
  const styles = {
    BRONZE: 'bg-orange-100 text-orange-700 border-orange-300',
    SILVER: 'bg-gray-100 text-gray-700 border-gray-300',
    GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    PLATINUM: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <span className={clsx('px-3 py-1 rounded-full text-sm font-bold border', styles[tier])}>
      {tier}
    </span>
  );
}

// Main Customer Profile Component
export function CustomerProfile() {
  const [activeTab, setActiveTab] = useState<'overview' | 'purchases' | 'prescriptions'>('overview');
  const customer = mockCustomer;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col tablet:flex-row tablet:items-start justify-between gap-4">
          {/* Customer Info */}
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full bg-bv-red-100 flex items-center justify-center text-bv-red-600 font-bold text-2xl">
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <TierBadge tier={customer.loyaltyTier} />
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {customer.phone}
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {customer.email}
                  </span>
                )}
              </div>
              {customer.address && (
                <p className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {customer.address}, {customer.city} - {customer.pincode}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Member since {customer.memberSince} • {customer.visitCount} visits
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors">
              <ShoppingBag className="w-4 h-4" />
              New Order
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Eye className="w-4 h-4" />
              Eye Exam
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(customer.hasActiveOrder || customer.hasPendingPayment || customer.prescriptionExpiring) && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            {customer.hasActiveOrder && (
              <span className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                <ShoppingBag className="w-3 h-3" />
                Active Order
              </span>
            )}
            {customer.hasPendingPayment && (
              <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <CreditCard className="w-3 h-3" />
                Pending Payment
              </span>
            )}
            {customer.prescriptionExpiring && (
              <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                <AlertTriangle className="w-3 h-3" />
                Prescription Expiring Soon
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 laptop:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-xl font-bold text-gray-900">{customer.totalPurchases}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Loyalty Points</p>
              <p className="text-xl font-bold text-gray-900">{customer.loyaltyPoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Visit</p>
              <p className="text-xl font-bold text-gray-900">{customer.lastVisit}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {(['overview', 'purchases', 'prescriptions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize',
                activeTab === tab
                  ? 'border-bv-red-600 text-bv-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid laptop:grid-cols-2 gap-6">
          {/* Personal Details */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Personal Details
            </h3>
            <div className="space-y-3">
              {customer.dateOfBirth && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Date of Birth</span>
                  <span className="font-medium">{customer.dateOfBirth}</span>
                </div>
              )}
              {customer.anniversary && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Anniversary</span>
                  <span className="font-medium">{customer.anniversary}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Avg Order Value</span>
                <span className="font-medium">{formatCurrency(customer.avgOrderValue)}</span>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-gray-500" />
              Preferences
            </h3>
            {customer.preferredBrands && (
              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">Preferred Brands</p>
                <div className="flex flex-wrap gap-2">
                  {customer.preferredBrands.map((brand) => (
                    <span key={brand} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {customer.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Purchase History</h3>
          <div className="space-y-3">
            {mockPurchases.map((purchase) => (
              <div key={purchase.id} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{purchase.invoiceNo}</span>
                      <span className={clsx(
                        'px-2 py-0.5 rounded text-xs',
                        purchase.status === 'COMPLETED' && 'bg-green-100 text-green-700',
                        purchase.status === 'DELIVERED' && 'bg-blue-100 text-blue-700',
                        purchase.status === 'PARTIAL' && 'bg-yellow-100 text-yellow-700'
                      )}>
                        {purchase.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{purchase.date}</p>
                    <p className="text-sm text-gray-600 mt-1">{purchase.items.join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(purchase.total)}</p>
                    <p className="text-xs text-gray-500">{purchase.paymentMode}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'prescriptions' && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Prescription History</h3>
          <div className="space-y-3">
            {mockPrescriptions.map((rx) => (
              <div
                key={rx.id}
                className={clsx(
                  'p-4 border rounded-lg',
                  rx.isExpired ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rx.date}</span>
                      {rx.isExpired ? (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Expired</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Active</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">By {rx.optometrist}</p>
                    <p className="text-xs text-gray-400 mt-1">Valid until {rx.expiryDate}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p><span className="text-gray-500">R:</span> {rx.rightSph} / {rx.rightCyl}</p>
                    <p><span className="text-gray-500">L:</span> {rx.leftSph} / {rx.leftCyl}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerProfile;
