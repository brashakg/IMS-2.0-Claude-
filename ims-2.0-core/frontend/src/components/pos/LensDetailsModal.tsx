// ============================================================================
// IMS 2.0 - Add Lens Details Modal
// ============================================================================
// Modal for entering lens specifications matching Emergent design

import { useState, useCallback } from 'react';
import { X, Eye } from 'lucide-react';

interface LensDetailsModalProps {
  onSave: (lensDetails: LensDetails) => void;
  onClose: () => void;
  initialDetails?: Partial<LensDetails>;
}

export interface LensDetails {
  index: string;
  brand: string;
  subbrand: string;
  coating: string;
  addOn1: string;
  addOn2: string;
  addOn3: string;
  addOn4: string;
  offerApplied: string;
  lensPrice: number;
}

const LENS_INDEX_OPTIONS = ['1.56', '1.60', '1.67', '1.74'];
const LENS_BRANDS = ['Essilor', 'Zeiss', 'Hoya', 'Nikon', 'Kodak', 'Vision Rx'];
const COATING_OPTIONS = ['Anti-Reflective', 'Blue Light', 'UV Protection', 'Scratch Resistant', 'Hydrophobic'];
const ADDON_OPTIONS = ['Blue Cut', 'Photochromic', 'UV Protection', 'Scratch Resistant', 'Anti-Smudge', 'Water Repellent'];
const OFFER_OPTIONS = ['No Offer', 'Buy 1 Get 1', '10% Off', '20% Off', 'Diwali Special', 'Summer Sale'];

export function LensDetailsModal({ onSave, onClose, initialDetails }: LensDetailsModalProps) {
  const [formData, setFormData] = useState<LensDetails>({
    index: initialDetails?.index || '',
    brand: initialDetails?.brand || '',
    subbrand: initialDetails?.subbrand || '',
    coating: initialDetails?.coating || '',
    addOn1: initialDetails?.addOn1 || '',
    addOn2: initialDetails?.addOn2 || '',
    addOn3: initialDetails?.addOn3 || '',
    addOn4: initialDetails?.addOn4 || '',
    offerApplied: initialDetails?.offerApplied || 'No Offer',
    lensPrice: initialDetails?.lensPrice || 0,
  });

  const updateField = (field: keyof LensDetails, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(() => {
    if (!formData.index || !formData.brand) {
      return;
    }
    onSave(formData);
  }, [formData, onSave]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-bv-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">Add Lens Details</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Index, Brand, Subbrand Row */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Index *</label>
              <select
                value={formData.index}
                onChange={e => updateField('index', e.target.value)}
                className="input-field"
              >
                <option value="">Select</option>
                {LENS_INDEX_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., 1.56, 1.60, 1.67</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
              <select
                value={formData.brand}
                onChange={e => updateField('brand', e.target.value)}
                className="input-field"
              >
                <option value="">Select</option>
                {LENS_BRANDS.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., Hoya, Essilor</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subbrand</label>
              <input
                type="text"
                value={formData.subbrand}
                onChange={e => updateField('subbrand', e.target.value)}
                className="input-field"
                placeholder="e.g., Definity"
              />
              <p className="text-xs text-gray-400 mt-1">e.g., Definity</p>
            </div>
          </div>

          {/* Coating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coating</label>
            <select
              value={formData.coating}
              onChange={e => updateField('coating', e.target.value)}
              className="input-field"
            >
              <option value="">Select coating</option>
              {COATING_OPTIONS.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">e.g., Anti-Reflective, Blue Light</p>
          </div>

          {/* Add-ons Row */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add On 1</label>
              <select
                value={formData.addOn1}
                onChange={e => updateField('addOn1', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">None</option>
                {ADDON_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., Blue Cut</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add On 2</label>
              <select
                value={formData.addOn2}
                onChange={e => updateField('addOn2', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">None</option>
                {ADDON_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., Photochromic</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add On 3</label>
              <select
                value={formData.addOn3}
                onChange={e => updateField('addOn3', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">None</option>
                {ADDON_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., UV Protection</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Add On 4</label>
              <select
                value={formData.addOn4}
                onChange={e => updateField('addOn4', e.target.value)}
                className="input-field text-sm"
              >
                <option value="">None</option>
                {ADDON_OPTIONS.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">e.g., Scratch Resistant</p>
            </div>
          </div>

          {/* Offer and Price Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Offer Applied</label>
              <select
                value={formData.offerApplied}
                onChange={e => updateField('offerApplied', e.target.value)}
                className="input-field"
              >
                {OFFER_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lens Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                <input
                  type="number"
                  value={formData.lensPrice}
                  onChange={e => updateField('lensPrice', parseInt(e.target.value) || 0)}
                  className="input-field pl-8"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.index || !formData.brand}
            className="btn-primary disabled:opacity-50"
          >
            Save Lens Details
          </button>
        </div>
      </div>
    </div>
  );
}

export default LensDetailsModal;
