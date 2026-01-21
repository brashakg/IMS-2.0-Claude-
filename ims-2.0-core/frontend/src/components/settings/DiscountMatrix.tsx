// ============================================================================
// IMS 2.0 - Discount Matrix Configuration
// ============================================================================
// Multi-dimensional discount caps: Role × Category × Brand
// Rule: Effective cap = MIN(role cap, category cap, brand cap)

import { useState } from 'react';
import {
  Percent,
  Users,
  Tag,
  Award,
  Save,
  RefreshCw,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { UserRole } from '../../types';

// Discount Types
interface RoleDiscountCap {
  role: UserRole;
  maxDiscount: number;
  requiresApproval: number; // Above this % needs approval
}

interface CategoryDiscountCap {
  categoryId: string;
  categoryName: string;
  maxDiscount: number;
  minMargin: number; // Minimum margin to maintain
}

interface BrandDiscountCap {
  brandId: string;
  brandName: string;
  maxDiscount: number;
  isProtected: boolean; // No discounts allowed
}

// Default Role Discount Caps (from SYSTEM_INTENT.md)
const defaultRoleDiscounts: RoleDiscountCap[] = [
  { role: 'SUPERADMIN', maxDiscount: 100, requiresApproval: 100 },
  { role: 'ADMIN', maxDiscount: 50, requiresApproval: 50 },
  { role: 'AREA_MANAGER', maxDiscount: 25, requiresApproval: 20 },
  { role: 'STORE_MANAGER', maxDiscount: 15, requiresApproval: 12 },
  { role: 'ACCOUNTANT', maxDiscount: 0, requiresApproval: 0 },
  { role: 'CATALOG_MANAGER', maxDiscount: 0, requiresApproval: 0 },
  { role: 'OPTOMETRIST', maxDiscount: 5, requiresApproval: 5 },
  { role: 'SALES_CASHIER', maxDiscount: 10, requiresApproval: 8 },
  { role: 'SALES_STAFF', maxDiscount: 10, requiresApproval: 8 },
  { role: 'WORKSHOP_STAFF', maxDiscount: 0, requiresApproval: 0 },
];

// Default Category Discount Caps
const defaultCategoryDiscounts: CategoryDiscountCap[] = [
  { categoryId: 'frames', categoryName: 'Frames', maxDiscount: 20, minMargin: 25 },
  { categoryId: 'sunglasses', categoryName: 'Sunglasses', maxDiscount: 15, minMargin: 30 },
  { categoryId: 'lenses', categoryName: 'Lenses', maxDiscount: 10, minMargin: 40 },
  { categoryId: 'contact-lenses', categoryName: 'Contact Lenses', maxDiscount: 5, minMargin: 20 },
  { categoryId: 'solutions', categoryName: 'Lens Solutions', maxDiscount: 10, minMargin: 15 },
  { categoryId: 'accessories', categoryName: 'Accessories', maxDiscount: 25, minMargin: 20 },
  { categoryId: 'reading-glasses', categoryName: 'Reading Glasses', maxDiscount: 20, minMargin: 25 },
];

// Default Brand Discount Caps
const defaultBrandDiscounts: BrandDiscountCap[] = [
  { brandId: 'ray-ban', brandName: 'Ray-Ban', maxDiscount: 10, isProtected: false },
  { brandId: 'oakley', brandName: 'Oakley', maxDiscount: 10, isProtected: false },
  { brandId: 'gucci', brandName: 'Gucci', maxDiscount: 5, isProtected: true },
  { brandId: 'prada', brandName: 'Prada', maxDiscount: 5, isProtected: true },
  { brandId: 'titan', brandName: 'Titan', maxDiscount: 15, isProtected: false },
  { brandId: 'fastrack', brandName: 'Fastrack', maxDiscount: 20, isProtected: false },
  { brandId: 'vogue', brandName: 'Vogue', maxDiscount: 15, isProtected: false },
  { brandId: 'essilor', brandName: 'Essilor Lenses', maxDiscount: 8, isProtected: false },
  { brandId: 'zeiss', brandName: 'Zeiss Lenses', maxDiscount: 5, isProtected: true },
  { brandId: 'crizal', brandName: 'Crizal Coatings', maxDiscount: 5, isProtected: false },
];

// Role Label Helper
const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Admin',
    AREA_MANAGER: 'Area Manager',
    STORE_MANAGER: 'Store Manager',
    ACCOUNTANT: 'Accountant',
    CATALOG_MANAGER: 'Catalog Manager',
    OPTOMETRIST: 'Optometrist',
    SALES_CASHIER: 'Sales Cashier',
    SALES_STAFF: 'Sales Staff',
    WORKSHOP_STAFF: 'Workshop Staff',
  };
  return labels[role];
};

// Editable Cell Component
function EditablePercentCell({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleSave = () => {
    const num = parseFloat(tempValue);
    if (!isNaN(num) && num >= 0 && num <= 100) {
      onChange(num);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          min="0"
          max="100"
          className="w-16 px-2 py-1 border rounded text-sm"
          autoFocus
        />
        <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-50 rounded">
          <Check className="w-4 h-4" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-red-600 hover:bg-red-50 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className={clsx(
        'px-3 py-1 rounded text-sm font-medium transition-colors',
        disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
      )}
    >
      {value}%
    </button>
  );
}

// Role Discounts Section
function RoleDiscountsSection({
  discounts,
  onChange,
}: {
  discounts: RoleDiscountCap[];
  onChange: (discounts: RoleDiscountCap[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateDiscount = (role: UserRole, field: 'maxDiscount' | 'requiresApproval', value: number) => {
    onChange(discounts.map(d =>
      d.role === role ? { ...d, [field]: value } : d
    ));
  };

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Role-Based Discount Caps</h3>
            <p className="text-sm text-gray-500">Maximum discount each role can apply</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-700">Role</th>
                <th className="text-center py-2 font-medium text-gray-700">Max Discount</th>
                <th className="text-center py-2 font-medium text-gray-700">Requires Approval Above</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.role} className="border-b last:border-0">
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{getRoleLabel(d.role)}</span>
                  </td>
                  <td className="py-3 text-center">
                    <EditablePercentCell
                      value={d.maxDiscount}
                      onChange={(val) => updateDiscount(d.role, 'maxDiscount', val)}
                      disabled={d.role === 'SUPERADMIN'}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <EditablePercentCell
                      value={d.requiresApproval}
                      onChange={(val) => updateDiscount(d.role, 'requiresApproval', val)}
                      disabled={d.role === 'SUPERADMIN'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Category Discounts Section
function CategoryDiscountsSection({
  discounts,
  onChange,
}: {
  discounts: CategoryDiscountCap[];
  onChange: (discounts: CategoryDiscountCap[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateDiscount = (categoryId: string, field: 'maxDiscount' | 'minMargin', value: number) => {
    onChange(discounts.map(d =>
      d.categoryId === categoryId ? { ...d, [field]: value } : d
    ));
  };

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Tag className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Category-Based Discount Caps</h3>
            <p className="text-sm text-gray-500">Maximum discount per product category</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-700">Category</th>
                <th className="text-center py-2 font-medium text-gray-700">Max Discount</th>
                <th className="text-center py-2 font-medium text-gray-700">Min Margin</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.categoryId} className="border-b last:border-0">
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{d.categoryName}</span>
                  </td>
                  <td className="py-3 text-center">
                    <EditablePercentCell
                      value={d.maxDiscount}
                      onChange={(val) => updateDiscount(d.categoryId, 'maxDiscount', val)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <EditablePercentCell
                      value={d.minMargin}
                      onChange={(val) => updateDiscount(d.categoryId, 'minMargin', val)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Brand Discounts Section
function BrandDiscountsSection({
  discounts,
  onChange,
}: {
  discounts: BrandDiscountCap[];
  onChange: (discounts: BrandDiscountCap[]) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  const updateDiscount = (brandId: string, field: 'maxDiscount' | 'isProtected', value: number | boolean) => {
    onChange(discounts.map(d =>
      d.brandId === brandId ? { ...d, [field]: value } : d
    ));
  };

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Award className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-900">Brand-Based Discount Caps</h3>
            <p className="text-sm text-gray-500">Maximum discount per brand (premium brands protected)</p>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-700">Brand</th>
                <th className="text-center py-2 font-medium text-gray-700">Max Discount</th>
                <th className="text-center py-2 font-medium text-gray-700">Protected</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr key={d.brandId} className={clsx('border-b last:border-0', d.isProtected && 'bg-yellow-50')}>
                  <td className="py-3">
                    <span className="font-medium text-gray-900">{d.brandName}</span>
                    {d.isProtected && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-yellow-200 text-yellow-800 rounded">Premium</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    <EditablePercentCell
                      value={d.maxDiscount}
                      onChange={(val) => updateDiscount(d.brandId, 'maxDiscount', val)}
                      disabled={d.isProtected}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => updateDiscount(d.brandId, 'isProtected', !d.isProtected)}
                      className={clsx(
                        'px-3 py-1 rounded text-xs font-medium transition-colors',
                        d.isProtected
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      )}
                    >
                      {d.isProtected ? 'Yes' : 'No'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Discount Calculator Demo
function DiscountCalculator({
  roleDiscounts,
  categoryDiscounts,
  brandDiscounts,
}: {
  roleDiscounts: RoleDiscountCap[];
  categoryDiscounts: CategoryDiscountCap[];
  brandDiscounts: BrandDiscountCap[];
}) {
  const [selectedRole, setSelectedRole] = useState<UserRole>('SALES_STAFF');
  const [selectedCategory, setSelectedCategory] = useState('frames');
  const [selectedBrand, setSelectedBrand] = useState('titan');

  const roleCap = roleDiscounts.find(r => r.role === selectedRole)?.maxDiscount || 0;
  const categoryCap = categoryDiscounts.find(c => c.categoryId === selectedCategory)?.maxDiscount || 0;
  const brandCap = brandDiscounts.find(b => b.brandId === selectedBrand)?.maxDiscount || 0;
  const brandProtected = brandDiscounts.find(b => b.brandId === selectedBrand)?.isProtected || false;

  const effectiveCap = brandProtected ? 0 : Math.min(roleCap, categoryCap, brandCap);

  return (
    <div className="card bg-gray-50">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Effective Discount Calculator</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Test the effective discount cap for any combination of role, category, and brand.
      </p>

      <div className="grid grid-cols-1 tablet:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {roleDiscounts.map((r) => (
              <option key={r.role} value={r.role}>{getRoleLabel(r.role)}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Cap: {roleCap}%</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {categoryDiscounts.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Cap: {categoryCap}%</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            {brandDiscounts.map((b) => (
              <option key={b.brandId} value={b.brandId}>{b.brandName}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Cap: {brandCap}% {brandProtected && '(Protected)'}
          </p>
        </div>
      </div>

      <div className={clsx(
        'p-4 rounded-lg text-center',
        brandProtected ? 'bg-red-100' : 'bg-green-100'
      )}>
        <p className="text-sm text-gray-600 mb-1">Effective Maximum Discount</p>
        <p className={clsx(
          'text-3xl font-bold',
          brandProtected ? 'text-red-700' : 'text-green-700'
        )}>
          {effectiveCap}%
        </p>
        <p className="text-xs text-gray-500 mt-2">
          = MIN(Role: {roleCap}%, Category: {categoryCap}%, Brand: {brandCap}%)
          {brandProtected && ' - Brand Protected'}
        </p>
      </div>
    </div>
  );
}

// Main Discount Matrix Component
export function DiscountMatrix() {
  const [roleDiscounts, setRoleDiscounts] = useState<RoleDiscountCap[]>(defaultRoleDiscounts);
  const [categoryDiscounts, setCategoryDiscounts] = useState<CategoryDiscountCap[]>(defaultCategoryDiscounts);
  const [brandDiscounts, setBrandDiscounts] = useState<BrandDiscountCap[]>(defaultBrandDiscounts);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    // In real implementation, this would save to API
    alert('Discount matrix saved successfully!');
    setHasChanges(false);
  };

  const handleReset = () => {
    setRoleDiscounts(defaultRoleDiscounts);
    setCategoryDiscounts(defaultCategoryDiscounts);
    setBrandDiscounts(defaultBrandDiscounts);
    setHasChanges(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col tablet:flex-row tablet:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Matrix</h1>
          <p className="text-gray-500 mt-1">Configure discount caps by role, category, and brand</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Important Note */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">Pricing Rules (Non-Negotiable)</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• If <strong>offer_price &gt; MRP</strong> → Sale BLOCKED completely</li>
              <li>• If <strong>offer_price &lt; MRP</strong> → Already HQ discounted, NO further discounts allowed</li>
              <li>• If <strong>offer_price = MRP</strong> → Role-based discounts from this matrix apply</li>
              <li>• <strong>Effective cap = MIN(role cap, category cap, brand cap)</strong></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calculator */}
      <DiscountCalculator
        roleDiscounts={roleDiscounts}
        categoryDiscounts={categoryDiscounts}
        brandDiscounts={brandDiscounts}
      />

      {/* Discount Sections */}
      <RoleDiscountsSection
        discounts={roleDiscounts}
        onChange={(d) => { setRoleDiscounts(d); setHasChanges(true); }}
      />

      <CategoryDiscountsSection
        discounts={categoryDiscounts}
        onChange={(d) => { setCategoryDiscounts(d); setHasChanges(true); }}
      />

      <BrandDiscountsSection
        discounts={brandDiscounts}
        onChange={(d) => { setBrandDiscounts(d); setHasChanges(true); }}
      />
    </div>
  );
}

export default DiscountMatrix;
