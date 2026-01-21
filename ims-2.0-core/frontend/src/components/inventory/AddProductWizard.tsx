// ============================================================================
// IMS 2.0 - Add Product Wizard (Single Step)
// ============================================================================
// All-in-one product creation form with master data validation
// Fields must match master data or form won't submit

import { useState, useMemo } from 'react';
import {
  X, Package, Tag, Barcode, DollarSign, Layers, Image, Upload,
  Globe, AlertCircle, Check, RefreshCw, Sparkles, ExternalLink
} from 'lucide-react';
import { useProductMasterData } from '../../context/ProductMasterDataContext';
import { useToast } from '../../context/ToastContext';
import clsx from 'clsx';

interface AddProductWizardProps {
  onClose: () => void;
  onSave: (product: ProductFormData) => void;
}

interface ProductFormData {
  // Basic Info
  categoryId: string;
  locationId: string;
  brandId: string;
  subBrand: string;
  model: string;
  title: string;
  barcode: string;
  sku: string;

  // Specifications
  genderId: string;
  frameTypeId: string;
  shapeId: string;
  frameColorId: string;
  templeColorId: string;
  lensColorId: string;
  frameMaterialId: string;
  lensMaterialId: string;
  originId: string;
  frameSize: string;
  bridge: string;
  templeLength: string;
  warrantyId: string;

  // Pricing
  mrp: number;
  sellingPrice: number;
  quantity: number;
  hsnCode: string;

  // Images & Description
  seoDescription: string;
  images: string[];

  // Integrations
  syncToShopify: boolean;
  syncToTally: boolean;
  syncToAmazon: boolean;
  syncToFlipkart: boolean;
  syncToWooCommerce: boolean;
}

const initialFormData: ProductFormData = {
  categoryId: '',
  locationId: '',
  brandId: '',
  subBrand: '',
  model: '',
  title: '',
  barcode: '',
  sku: '',
  genderId: '',
  frameTypeId: '',
  shapeId: '',
  frameColorId: '',
  templeColorId: '',
  lensColorId: '',
  frameMaterialId: '',
  lensMaterialId: '',
  originId: '',
  frameSize: '',
  bridge: '',
  templeLength: '',
  warrantyId: '',
  mrp: 0,
  sellingPrice: 0,
  quantity: 1,
  hsnCode: '',
  seoDescription: '',
  images: [],
  syncToShopify: false,
  syncToTally: false,
  syncToAmazon: false,
  syncToFlipkart: false,
  syncToWooCommerce: false,
};

export function AddProductWizard({ onClose, onSave }: AddProductWizardProps) {
  const masterData = useProductMasterData();
  const toast = useToast();
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGeneratingSKU, setIsGeneratingSKU] = useState(false);

  // Get brands for selected category
  const availableBrands = useMemo(() => {
    if (!formData.categoryId) return [];
    return masterData.getBrandsForCategory(formData.categoryId);
  }, [formData.categoryId, masterData]);

  // Get sub-brands for selected brand
  const availableSubBrands = useMemo(() => {
    if (!formData.brandId) return [];
    return masterData.getSubBrandsForBrand(formData.brandId);
  }, [formData.brandId, masterData]);

  // Get frame materials only
  const frameMaterials = useMemo(() => {
    return masterData.materials.filter(m => m.type === 'FRAME' || m.type === 'BOTH');
  }, [masterData.materials]);

  // Get lens materials only
  const lensMaterials = useMemo(() => {
    return masterData.materials.filter(m => m.type === 'LENS' || m.type === 'BOTH');
  }, [masterData.materials]);

  // Update form field
  const updateField = <K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Clear dependent fields when category changes
      if (field === 'categoryId') {
        updated.brandId = '';
        updated.subBrand = '';
        // Update HSN code from category
        const category = masterData.getCategoryById(value as string);
        if (category) {
          updated.hsnCode = category.hsnCode;
        }
      }

      // Clear sub-brand when brand changes
      if (field === 'brandId') {
        updated.subBrand = '';
      }

      return updated;
    });

    // Clear error for field
    if (errors[field]) {
      setErrors(prev => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  // Generate SKU
  const handleGenerateSKU = () => {
    if (!formData.categoryId || !formData.brandId) {
      toast.warning('Select category and brand first');
      return;
    }

    setIsGeneratingSKU(true);
    const category = masterData.getCategoryById(formData.categoryId);
    const brand = masterData.getBrandById(formData.brandId);

    if (category && brand) {
      const sku = masterData.generateSKU(category.code, brand.name);
      updateField('sku', sku);
      toast.success('SKU generated!');
    }

    setTimeout(() => setIsGeneratingSKU(false), 500);
  };

  // Generate AI description
  const handleGenerateDescription = () => {
    const brand = masterData.getBrandById(formData.brandId);
    const category = masterData.getCategoryById(formData.categoryId);
    const frameType = masterData.frameTypes.find(ft => ft.id === formData.frameTypeId);
    const shape = masterData.shapes.find(s => s.id === formData.shapeId);
    const frameColor = masterData.colors.find(c => c.id === formData.frameColorId);

    if (!brand || !category) {
      toast.warning('Fill basic info first');
      return;
    }

    const description = `${brand.name} ${formData.subBrand || ''} ${formData.model || ''} - ${category.name}. ${frameType?.name || ''} ${shape?.name || ''} frame in ${frameColor?.name || ''} color. Premium quality eyewear for everyday wear.`.trim();
    updateField('seoDescription', description);
    toast.success('Description generated');
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.locationId) newErrors.locationId = 'Location is required';
    if (!formData.brandId) newErrors.brandId = 'Brand is required';
    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.mrp || formData.mrp <= 0) newErrors.mrp = 'MRP is required';

    // Validate against master data
    if (formData.brandId && formData.categoryId) {
      const brand = masterData.getBrandById(formData.brandId);
      if (!brand || !brand.categoryIds.includes(formData.categoryId)) {
        newErrors.brandId = 'Brand not valid for this category';
      }
    }

    if (formData.subBrand && formData.brandId) {
      const brand = masterData.getBrandById(formData.brandId);
      if (brand && !brand.subBrands.includes(formData.subBrand) && brand.subBrands.length > 0) {
        newErrors.subBrand = 'Sub-brand must be from master list';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    onSave(formData);
    toast.success('Product created successfully!');
    onClose();
  };

  // Check if a category requires frame specs
  const isFrameCategory = useMemo(() => {
    const category = masterData.getCategoryById(formData.categoryId);
    return category && ['FRAME', 'SUNGLASS', 'READING_GLASSES'].includes(category.code);
  }, [formData.categoryId, masterData]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bv-red-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-bv-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Add Product</h2>
              <p className="text-sm text-gray-500">All fields must match master data</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Basic Info & Specs */}
            <div className="col-span-8 space-y-6">
              {/* Basic Information */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={e => updateField('categoryId', e.target.value)}
                      className={clsx(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none',
                        errors.categoryId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                      )}
                    >
                      <option value="">Select Category</option>
                      {masterData.categories.filter(c => c.isActive).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.locationId}
                      onChange={e => updateField('locationId', e.target.value)}
                      className={clsx(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none',
                        errors.locationId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                      )}
                    >
                      <option value="">Select Location</option>
                      {masterData.locations.filter(l => l.isActive).map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                      ))}
                    </select>
                    {errors.locationId && <p className="mt-1 text-xs text-red-500">{errors.locationId}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.brandId}
                      onChange={e => updateField('brandId', e.target.value)}
                      disabled={!formData.categoryId}
                      className={clsx(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none disabled:bg-gray-50',
                        errors.brandId ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                      )}
                    >
                      <option value="">Select Brand</option>
                      {availableBrands.map(brand => (
                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                      ))}
                    </select>
                    {errors.brandId && <p className="mt-1 text-xs text-red-500">{errors.brandId}</p>}
                  </div>

                  {/* Sub-Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sub-Brand</label>
                    <select
                      value={formData.subBrand}
                      onChange={e => updateField('subBrand', e.target.value)}
                      disabled={!formData.brandId || availableSubBrands.length === 0}
                      className={clsx(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none disabled:bg-gray-50',
                        errors.subBrand ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                      )}
                    >
                      <option value="">Select Sub-Brand</option>
                      {availableSubBrands.map(sb => (
                        <option key={sb} value={sb}>{sb}</option>
                      ))}
                    </select>
                    {errors.subBrand && <p className="mt-1 text-xs text-red-500">{errors.subBrand}</p>}
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={e => updateField('model', e.target.value)}
                      placeholder="e.g., RB3025"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={e => updateField('title', e.target.value)}
                      placeholder="Product display name"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                    />
                  </div>

                  {/* Barcode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.barcode}
                        onChange={e => updateField('barcode', e.target.value)}
                        placeholder="Scan or enter barcode"
                        className="w-full pl-3 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      />
                      <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={e => updateField('sku', e.target.value)}
                        placeholder="Auto-generate or enter"
                        className={clsx(
                          'flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none',
                          errors.sku ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                        )}
                      />
                      <button
                        type="button"
                        onClick={handleGenerateSKU}
                        disabled={isGeneratingSKU}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1 text-sm"
                      >
                        <RefreshCw className={clsx('w-4 h-4', isGeneratingSKU && 'animate-spin')} />
                        Auto
                      </button>
                    </div>
                    {errors.sku && <p className="mt-1 text-xs text-red-500">{errors.sku}</p>}
                  </div>
                </div>
              </section>

              {/* Specifications - Show for frame categories */}
              {isFrameCategory && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Specifications
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Gender */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={formData.genderId}
                        onChange={e => updateField('genderId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.genders.map(g => (
                          <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Frame Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frame Type</label>
                      <select
                        value={formData.frameTypeId}
                        onChange={e => updateField('frameTypeId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.frameTypes.filter(ft => ft.isActive).map(ft => (
                          <option key={ft.id} value={ft.id}>{ft.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Shape */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
                      <select
                        value={formData.shapeId}
                        onChange={e => updateField('shapeId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.shapes.filter(s => s.isActive).map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Frame Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frame Color</label>
                      <select
                        value={formData.frameColorId}
                        onChange={e => updateField('frameColorId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.colors.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Temple Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temple Color</label>
                      <select
                        value={formData.templeColorId}
                        onChange={e => updateField('templeColorId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.colors.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lens Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lens Color</label>
                      <select
                        value={formData.lensColorId}
                        onChange={e => updateField('lensColorId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.colors.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Frame Material */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frame Material</label>
                      <select
                        value={formData.frameMaterialId}
                        onChange={e => updateField('frameMaterialId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {frameMaterials.filter(m => m.isActive).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Lens Material */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lens Material</label>
                      <select
                        value={formData.lensMaterialId}
                        onChange={e => updateField('lensMaterialId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {lensMaterials.filter(m => m.isActive).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Origin */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Origin</label>
                      <select
                        value={formData.originId}
                        onChange={e => updateField('originId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.origins.filter(o => o.isActive).map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Frame Size */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frame Size</label>
                      <input
                        type="text"
                        value={formData.frameSize}
                        onChange={e => updateField('frameSize', e.target.value)}
                        placeholder="e.g., 52"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      />
                    </div>

                    {/* Bridge */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bridge</label>
                      <input
                        type="text"
                        value={formData.bridge}
                        onChange={e => updateField('bridge', e.target.value)}
                        placeholder="e.g., 18"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      />
                    </div>

                    {/* Temple Length */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Temple Length</label>
                      <input
                        type="text"
                        value={formData.templeLength}
                        onChange={e => updateField('templeLength', e.target.value)}
                        placeholder="e.g., 140"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      />
                    </div>

                    {/* Warranty */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                      <select
                        value={formData.warrantyId}
                        onChange={e => updateField('warrantyId', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {masterData.warranties.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>
              )}

              {/* Pricing */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.mrp || ''}
                      onChange={e => updateField('mrp', Number(e.target.value))}
                      placeholder="0"
                      className={clsx(
                        'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none',
                        errors.mrp ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-bv-red-500'
                      )}
                    />
                    {errors.mrp && <p className="mt-1 text-xs text-red-500">{errors.mrp}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                    <input
                      type="number"
                      value={formData.sellingPrice || ''}
                      onChange={e => updateField('sellingPrice', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={e => updateField('quantity', Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                    <input
                      type="text"
                      value={formData.hsnCode}
                      onChange={e => updateField('hsnCode', e.target.value)}
                      placeholder="Auto from category"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none bg-gray-50"
                      readOnly
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Right Column - Images, Description, Integrations */}
            <div className="col-span-4 space-y-6">
              {/* SEO Description */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">SEO Description</label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    className="text-xs text-bv-red-600 hover:text-bv-red-700 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate with AI
                  </button>
                </div>
                <textarea
                  value={formData.seoDescription}
                  onChange={e => updateField('seoDescription', e.target.value)}
                  rows={4}
                  placeholder="AI-powered SEO description will appear here..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:border-bv-red-500 focus:outline-none resize-none"
                />
              </section>

              {/* Product Images */}
              <section>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-gray-300 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-1">Drag & drop images or click to upload</p>
                  <p className="text-xs text-gray-400">Supports JPG, PNG, WebP</p>
                  <button
                    type="button"
                    className="mt-3 px-4 py-2 text-sm text-bv-red-600 border border-bv-red-200 rounded-lg hover:bg-bv-red-50"
                  >
                    Upload Images
                  </button>
                </div>
              </section>

              {/* Sync to Integrations */}
              <section>
                <label className="block text-sm font-medium text-gray-700 mb-3">Sync to Platforms</label>
                <div className="space-y-3">
                  {masterData.integrations.map(integration => (
                    <label
                      key={integration.id}
                      className={clsx(
                        'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                        integration.enabled
                          ? 'border-gray-200 hover:border-bv-red-200 hover:bg-bv-red-50'
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={
                          integration.id === 'int-001' ? formData.syncToShopify :
                          integration.id === 'int-002' ? formData.syncToTally :
                          integration.id === 'int-003' ? formData.syncToAmazon :
                          integration.id === 'int-004' ? formData.syncToFlipkart :
                          integration.id === 'int-005' ? formData.syncToWooCommerce : false
                        }
                        onChange={e => {
                          const field = integration.id === 'int-001' ? 'syncToShopify' :
                            integration.id === 'int-002' ? 'syncToTally' :
                            integration.id === 'int-003' ? 'syncToAmazon' :
                            integration.id === 'int-004' ? 'syncToFlipkart' : 'syncToWooCommerce';
                          updateField(field, e.target.checked);
                        }}
                        disabled={!integration.enabled}
                        className="w-4 h-4 text-bv-red-600 border-gray-300 rounded focus:ring-bv-red-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{integration.name}</p>
                        <p className="text-xs text-gray-500">{integration.description}</p>
                      </div>
                      {!integration.enabled && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Coming Soon</span>
                      )}
                    </label>
                  ))}
                </div>
              </section>

              {/* Product Summary */}
              {formData.sku && (
                <section className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Product Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">SKU:</span>
                      <span className="text-gray-900 font-medium">{formData.sku}</span>
                    </div>
                    {formData.categoryId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-900">{masterData.getCategoryById(formData.categoryId)?.name}</span>
                      </div>
                    )}
                    {formData.brandId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Brand:</span>
                        <span className="text-gray-900">{masterData.getBrandById(formData.brandId)?.name}</span>
                      </div>
                    )}
                    {formData.mrp > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">MRP:</span>
                        <span className="text-gray-900 font-medium">₹{formData.mrp.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2"
          >
            ← Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 flex items-center gap-2 font-medium"
          >
            <Check className="w-4 h-4" />
            Create Product
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddProductWizard;
