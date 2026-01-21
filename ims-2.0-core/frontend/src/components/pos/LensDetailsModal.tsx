// ============================================================================
// IMS 2.0 - Add Lens Details Modal (Master Data Driven)
// ============================================================================
// All lens details are populated from master data only
// No free text allowed - data must match master
// Price auto-calculated based on selection
// Master data managed by Superadmin in Settings

import { useState, useCallback, useMemo, useEffect } from 'react';
import { X, Eye, AlertTriangle, Settings, Info } from 'lucide-react';

interface LensDetailsModalProps {
  onSave: (lensDetails: LensDetails) => void;
  onClose: () => void;
  initialDetails?: Partial<LensDetails>;
}

export interface LensDetails {
  indexId: string;
  brandId: string;
  subbrandId: string;
  coatingId: string;
  addOn1Id: string;
  addOn2Id: string;
  addOn3Id: string;
  addOn4Id: string;
  offerId: string;
  // Computed display values
  indexLabel: string;
  brandLabel: string;
  subbrandLabel: string;
  coatingLabel: string;
  addOns: string[];
  offerLabel: string;
  // Pricing
  basePrice: number;
  coatingPrice: number;
  addOnsPrice: number;
  totalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

// ============================================================================
// Master Data Types
// ============================================================================

interface LensMasterData {
  indexes: LensIndex[];
  brands: LensBrand[];
  coatings: LensCoating[];
  addOns: LensAddOn[];
  offers: LensOffer[];
}

interface LensIndex {
  id: string;
  value: string;
  label: string;
  priceMultiplier: number;
  isActive: boolean;
}

interface LensBrand {
  id: string;
  name: string;
  subbrands: LensSubbrand[];
  isActive: boolean;
}

interface LensSubbrand {
  id: string;
  brandId: string;
  name: string;
  basePrice: number;
  description?: string;
  isActive: boolean;
}

interface LensCoating {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
}

interface LensAddOn {
  id: string;
  name: string;
  price: number;
  description?: string;
  isActive: boolean;
}

interface LensOffer {
  id: string;
  name: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
}

// ============================================================================
// Master Data (In production, this comes from API/Settings)
// ============================================================================

const LENS_MASTER_DATA: LensMasterData = {
  indexes: [
    { id: 'idx-156', value: '1.56', label: '1.56 (Standard)', priceMultiplier: 1.0, isActive: true },
    { id: 'idx-160', value: '1.60', label: '1.60 (Thin)', priceMultiplier: 1.3, isActive: true },
    { id: 'idx-167', value: '1.67', label: '1.67 (Ultra Thin)', priceMultiplier: 1.6, isActive: true },
    { id: 'idx-174', value: '1.74', label: '1.74 (Super Thin)', priceMultiplier: 2.0, isActive: true },
  ],
  brands: [
    {
      id: 'brand-essilor',
      name: 'Essilor',
      isActive: true,
      subbrands: [
        { id: 'sub-ess-crizal', brandId: 'brand-essilor', name: 'Crizal', basePrice: 2500, description: 'Standard clarity', isActive: true },
        { id: 'sub-ess-prevencia', brandId: 'brand-essilor', name: 'Crizal Prevencia', basePrice: 3500, description: 'Blue light protection', isActive: true },
        { id: 'sub-ess-sapphire', brandId: 'brand-essilor', name: 'Crizal Sapphire', basePrice: 4500, description: 'Premium clarity', isActive: true },
        { id: 'sub-ess-varilux', brandId: 'brand-essilor', name: 'Varilux', basePrice: 8000, description: 'Progressive lens', isActive: true },
        { id: 'sub-ess-eyezen', brandId: 'brand-essilor', name: 'Eyezen', basePrice: 5500, description: 'Digital eye strain', isActive: true },
      ],
    },
    {
      id: 'brand-zeiss',
      name: 'Zeiss',
      isActive: true,
      subbrands: [
        { id: 'sub-zeiss-clear', brandId: 'brand-zeiss', name: 'ClearView', basePrice: 3000, description: 'Standard', isActive: true },
        { id: 'sub-zeiss-drive', brandId: 'brand-zeiss', name: 'DriveSafe', basePrice: 6000, description: 'Driving optimized', isActive: true },
        { id: 'sub-zeiss-prog', brandId: 'brand-zeiss', name: 'Progressive Plus', basePrice: 9000, description: 'Premium progressive', isActive: true },
        { id: 'sub-zeiss-smart', brandId: 'brand-zeiss', name: 'SmartLife', basePrice: 12000, description: 'Digital lifestyle', isActive: true },
      ],
    },
    {
      id: 'brand-hoya',
      name: 'Hoya',
      isActive: true,
      subbrands: [
        { id: 'sub-hoya-hi', brandId: 'brand-hoya', name: 'Hi-Vision', basePrice: 2800, description: 'Standard', isActive: true },
        { id: 'sub-hoya-blue', brandId: 'brand-hoya', name: 'BlueControl', basePrice: 3800, description: 'Blue light filter', isActive: true },
        { id: 'sub-hoya-sync', brandId: 'brand-hoya', name: 'Sync III', basePrice: 5000, description: 'Digital strain relief', isActive: true },
        { id: 'sub-hoya-hoyalux', brandId: 'brand-hoya', name: 'Hoyalux iD', basePrice: 10000, description: 'Premium progressive', isActive: true },
      ],
    },
    {
      id: 'brand-nikon',
      name: 'Nikon',
      isActive: true,
      subbrands: [
        { id: 'sub-nikon-lite', brandId: 'brand-nikon', name: 'Lite AS', basePrice: 2200, description: 'Aspherical', isActive: true },
        { id: 'sub-nikon-seecoat', brandId: 'brand-nikon', name: 'SeeCoat Blue', basePrice: 3200, description: 'Blue light protection', isActive: true },
        { id: 'sub-nikon-presio', brandId: 'brand-nikon', name: 'Presio Power', basePrice: 7500, description: 'Premium progressive', isActive: true },
      ],
    },
    {
      id: 'brand-kodak',
      name: 'Kodak',
      isActive: true,
      subbrands: [
        { id: 'sub-kodak-clean', brandId: 'brand-kodak', name: 'CleanCut', basePrice: 1800, description: 'Budget friendly', isActive: true },
        { id: 'sub-kodak-total', brandId: 'brand-kodak', name: 'Total Blue', basePrice: 2500, description: 'Blue light filter', isActive: true },
        { id: 'sub-kodak-unique', brandId: 'brand-kodak', name: 'Unique', basePrice: 5500, description: 'Progressive', isActive: true },
      ],
    },
    {
      id: 'brand-vision',
      name: 'Vision Rx',
      isActive: true,
      subbrands: [
        { id: 'sub-vrx-basic', brandId: 'brand-vision', name: 'Basic', basePrice: 800, description: 'Economy', isActive: true },
        { id: 'sub-vrx-hmc', brandId: 'brand-vision', name: 'HMC', basePrice: 1200, description: 'Hard multi-coat', isActive: true },
        { id: 'sub-vrx-blue', brandId: 'brand-vision', name: 'Blue Cut', basePrice: 1500, description: 'Blue light', isActive: true },
        { id: 'sub-vrx-photo', brandId: 'brand-vision', name: 'Photochromic', basePrice: 2200, description: 'Light adaptive', isActive: true },
      ],
    },
  ],
  coatings: [
    { id: 'coat-none', name: 'No Coating', price: 0, isActive: true },
    { id: 'coat-ar', name: 'Anti-Reflective (AR)', price: 500, description: 'Reduces glare', isActive: true },
    { id: 'coat-blue', name: 'Blue Light Filter', price: 800, description: 'Blocks harmful blue light', isActive: true },
    { id: 'coat-uv', name: 'UV Protection', price: 400, description: '100% UV protection', isActive: true },
    { id: 'coat-scratch', name: 'Scratch Resistant', price: 300, description: 'Hardened surface', isActive: true },
    { id: 'coat-hydro', name: 'Hydrophobic', price: 600, description: 'Water repellent', isActive: true },
    { id: 'coat-oleo', name: 'Oleophobic', price: 700, description: 'Smudge resistant', isActive: true },
  ],
  addOns: [
    { id: 'addon-photo', name: 'Photochromic', price: 1500, description: 'Darkens in sunlight', isActive: true },
    { id: 'addon-polar', name: 'Polarized', price: 2000, description: 'Reduces glare', isActive: true },
    { id: 'addon-tint', name: 'Tint', price: 500, description: 'Fashion tint', isActive: true },
    { id: 'addon-mirror', name: 'Mirror Coating', price: 800, description: 'Reflective mirror', isActive: true },
    { id: 'addon-drive', name: 'Drive Safe', price: 1200, description: 'Night driving', isActive: true },
    { id: 'addon-office', name: 'Office Lens', price: 1000, description: 'Computer optimized', isActive: true },
  ],
  offers: [
    { id: 'offer-none', name: 'No Offer', discountType: 'PERCENT', discountValue: 0, isActive: true },
    { id: 'offer-bogo', name: 'Buy 1 Get 1 Free', discountType: 'PERCENT', discountValue: 50, isActive: true },
    { id: 'offer-10', name: '10% Off', discountType: 'PERCENT', discountValue: 10, isActive: true },
    { id: 'offer-20', name: '20% Off', discountType: 'PERCENT', discountValue: 20, isActive: true },
    { id: 'offer-flat500', name: 'Flat ₹500 Off', discountType: 'FLAT', discountValue: 500, isActive: true },
    { id: 'offer-flat1000', name: 'Flat ₹1000 Off', discountType: 'FLAT', discountValue: 1000, isActive: true },
  ],
};

// ============================================================================
// Component
// ============================================================================

export function LensDetailsModal({ onSave, onClose, initialDetails }: LensDetailsModalProps) {
  // Form state
  const [selectedIndex, setSelectedIndex] = useState(initialDetails?.indexId || '');
  const [selectedBrand, setSelectedBrand] = useState(initialDetails?.brandId || '');
  const [selectedSubbrand, setSelectedSubbrand] = useState(initialDetails?.subbrandId || '');
  const [selectedCoating, setSelectedCoating] = useState(initialDetails?.coatingId || 'coat-none');
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([
    initialDetails?.addOn1Id || '',
    initialDetails?.addOn2Id || '',
    initialDetails?.addOn3Id || '',
    initialDetails?.addOn4Id || '',
  ].filter(Boolean));
  const [selectedOffer, setSelectedOffer] = useState(initialDetails?.offerId || 'offer-none');

  // Get available subbrands based on selected brand
  const availableSubbrands = useMemo(() => {
    const brand = LENS_MASTER_DATA.brands.find(b => b.id === selectedBrand);
    return brand?.subbrands.filter(s => s.isActive) || [];
  }, [selectedBrand]);

  // Reset subbrand when brand changes
  useEffect(() => {
    if (selectedBrand && availableSubbrands.length > 0) {
      if (!availableSubbrands.find(s => s.id === selectedSubbrand)) {
        setSelectedSubbrand('');
      }
    }
  }, [selectedBrand, availableSubbrands, selectedSubbrand]);

  // Calculate pricing
  const pricing = useMemo(() => {
    const index = LENS_MASTER_DATA.indexes.find(i => i.id === selectedIndex);
    const subbrand = availableSubbrands.find(s => s.id === selectedSubbrand);
    const coating = LENS_MASTER_DATA.coatings.find(c => c.id === selectedCoating);
    const offer = LENS_MASTER_DATA.offers.find(o => o.id === selectedOffer);

    const basePrice = subbrand?.basePrice || 0;
    const multiplier = index?.priceMultiplier || 1;
    const coatingPrice = coating?.price || 0;
    const addOnsPrice = selectedAddOns.reduce((sum, addonId) => {
      const addon = LENS_MASTER_DATA.addOns.find(a => a.id === addonId);
      return sum + (addon?.price || 0);
    }, 0);

    const subtotal = Math.round(basePrice * multiplier) + coatingPrice + addOnsPrice;

    let discountAmount = 0;
    if (offer) {
      if (offer.discountType === 'PERCENT') {
        discountAmount = Math.round(subtotal * (offer.discountValue / 100));
      } else {
        discountAmount = offer.discountValue;
      }
    }

    const finalPrice = Math.max(0, subtotal - discountAmount);

    return {
      basePrice: Math.round(basePrice * multiplier),
      coatingPrice,
      addOnsPrice,
      totalPrice: subtotal,
      discountAmount,
      finalPrice,
    };
  }, [selectedIndex, selectedSubbrand, selectedCoating, selectedAddOns, selectedOffer, availableSubbrands]);

  // Toggle add-on selection
  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns(prev => {
      if (prev.includes(addonId)) {
        return prev.filter(id => id !== addonId);
      }
      if (prev.length < 4) {
        return [...prev, addonId];
      }
      return prev;
    });
  };

  // Validation
  const isValid = selectedIndex && selectedBrand && selectedSubbrand;

  // Handle save
  const handleSubmit = useCallback(() => {
    if (!isValid) return;

    const index = LENS_MASTER_DATA.indexes.find(i => i.id === selectedIndex)!;
    const brand = LENS_MASTER_DATA.brands.find(b => b.id === selectedBrand)!;
    const subbrand = availableSubbrands.find(s => s.id === selectedSubbrand)!;
    const coating = LENS_MASTER_DATA.coatings.find(c => c.id === selectedCoating);
    const offer = LENS_MASTER_DATA.offers.find(o => o.id === selectedOffer);

    const lensDetails: LensDetails = {
      indexId: selectedIndex,
      brandId: selectedBrand,
      subbrandId: selectedSubbrand,
      coatingId: selectedCoating,
      addOn1Id: selectedAddOns[0] || '',
      addOn2Id: selectedAddOns[1] || '',
      addOn3Id: selectedAddOns[2] || '',
      addOn4Id: selectedAddOns[3] || '',
      offerId: selectedOffer,
      indexLabel: index.label,
      brandLabel: brand.name,
      subbrandLabel: subbrand.name,
      coatingLabel: coating?.name || 'None',
      addOns: selectedAddOns.map(id => LENS_MASTER_DATA.addOns.find(a => a.id === id)?.name || '').filter(Boolean),
      offerLabel: offer?.name || 'None',
      ...pricing,
    };

    onSave(lensDetails);
  }, [isValid, selectedIndex, selectedBrand, selectedSubbrand, selectedCoating, selectedAddOns, selectedOffer, availableSubbrands, pricing, onSave]);

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-bv-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Lens Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Settings className="w-3 h-3" />
              Master data from Settings
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Info Notice */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>All fields are populated from master data. Contact Superadmin to add new options.</span>
          </div>

          {/* Index Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lens Index *</label>
            <div className="grid grid-cols-4 gap-2">
              {LENS_MASTER_DATA.indexes.filter(i => i.isActive).map(index => (
                <button
                  key={index.id}
                  type="button"
                  onClick={() => setSelectedIndex(index.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedIndex === index.id
                      ? 'border-bv-red-500 bg-bv-red-50 text-bv-red-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-bold block">{index.value}</span>
                  <span className="text-xs text-gray-500">{index.priceMultiplier}x</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Brand *</label>
            <div className="grid grid-cols-3 gap-2">
              {LENS_MASTER_DATA.brands.filter(b => b.isActive).map(brand => (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => setSelectedBrand(brand.id)}
                  className={`p-3 rounded-lg border-2 text-center transition-all ${
                    selectedBrand === brand.id
                      ? 'border-bv-red-500 bg-bv-red-50 text-bv-red-700 font-medium'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {brand.name}
                </button>
              ))}
            </div>
          </div>

          {/* Subbrand/Product Selection */}
          {selectedBrand && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Line *</label>
              {availableSubbrands.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No products available for this brand</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {availableSubbrands.map(subbrand => (
                    <button
                      key={subbrand.id}
                      type="button"
                      onClick={() => setSelectedSubbrand(subbrand.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedSubbrand === subbrand.id
                          ? 'border-bv-red-500 bg-bv-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-medium block">{subbrand.name}</span>
                      <span className="text-xs text-gray-500 block">{subbrand.description}</span>
                      <span className="text-sm font-bold text-bv-red-600 block mt-1">
                        Base: {formatCurrency(subbrand.basePrice)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Coating Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Coating</label>
            <select
              value={selectedCoating}
              onChange={e => setSelectedCoating(e.target.value)}
              className="input-field"
            >
              {LENS_MASTER_DATA.coatings.filter(c => c.isActive).map(coating => (
                <option key={coating.id} value={coating.id}>
                  {coating.name} {coating.price > 0 ? `(+${formatCurrency(coating.price)})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Add-ons Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add-ons (Select up to 4)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LENS_MASTER_DATA.addOns.filter(a => a.isActive).map(addon => {
                const isSelected = selectedAddOns.includes(addon.id);
                const isDisabled = !isSelected && selectedAddOns.length >= 4;
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => toggleAddOn(addon.id)}
                    disabled={isDisabled}
                    className={`p-2 rounded-lg border-2 text-left text-sm transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium block">{addon.name}</span>
                    <span className="text-xs text-gray-500">+{formatCurrency(addon.price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Offer Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Apply Offer</label>
            <select
              value={selectedOffer}
              onChange={e => setSelectedOffer(e.target.value)}
              className="input-field"
            >
              {LENS_MASTER_DATA.offers.filter(o => o.isActive).map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.name}
                  {offer.discountValue > 0 && (
                    offer.discountType === 'PERCENT'
                      ? ` (-${offer.discountValue}%)`
                      : ` (-${formatCurrency(offer.discountValue)})`
                  )}
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-gray-900">Price Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Price (with index)</span>
                <span>{formatCurrency(pricing.basePrice)}</span>
              </div>
              {pricing.coatingPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coating</span>
                  <span>+{formatCurrency(pricing.coatingPrice)}</span>
                </div>
              )}
              {pricing.addOnsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Add-ons</span>
                  <span>+{formatCurrency(pricing.addOnsPrice)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-900">Subtotal</span>
                <span className="font-medium">{formatCurrency(pricing.totalPrice)}</span>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(pricing.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                <span>Final Price</span>
                <span className="text-bv-red-600">{formatCurrency(pricing.finalPrice)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
          {!isValid && (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Please select Index, Brand, and Product</span>
            </div>
          )}
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={onClose} className="btn-outline">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isValid}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Lens ({formatCurrency(pricing.finalPrice)})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LensDetailsModal;
