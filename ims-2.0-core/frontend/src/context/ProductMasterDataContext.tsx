// ============================================================================
// IMS 2.0 - Product Master Data Context
// ============================================================================
// Manages master data for products - Categories, Brands, Specs, etc.
// Only SUPERADMIN can edit master data

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ProductCategory } from '../types';

// ============================================================================
// Master Data Types
// ============================================================================

export interface CategoryMaster {
  id: string;
  name: string;
  code: ProductCategory;
  hsnCode: string;
  gstRate: number;
  isActive: boolean;
}

export interface BrandMaster {
  id: string;
  name: string;
  categoryIds: string[]; // Which categories this brand applies to
  subBrands: string[];
  isActive: boolean;
}

export interface FrameTypeMaster {
  id: string;
  name: string;
  isActive: boolean;
}

export interface ShapeMaster {
  id: string;
  name: string;
  isActive: boolean;
}

export interface MaterialMaster {
  id: string;
  name: string;
  type: 'FRAME' | 'LENS' | 'BOTH';
  isActive: boolean;
}

export interface ColorMaster {
  id: string;
  name: string;
  hexCode?: string;
  isActive: boolean;
}

export interface GenderOption {
  id: string;
  name: string;
}

export interface LocationMaster {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

export interface WarrantyOption {
  id: string;
  name: string;
  months: number;
}

export interface OriginMaster {
  id: string;
  name: string;
  isActive: boolean;
}

export interface LensIndexMaster {
  id: string;
  value: string; // "1.56", "1.60", "1.67", "1.74"
  multiplier: number;
  isActive: boolean;
}

export interface LensCoatingMaster {
  id: string;
  name: string;
  price: number;
  isActive: boolean;
}

export interface IntegrationOption {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  description: string;
}

// ============================================================================
// Initial Master Data
// ============================================================================

const initialCategories: CategoryMaster[] = [
  { id: 'cat-001', name: 'Spectacles', code: 'FRAME', hsnCode: '9004', gstRate: 18, isActive: true },
  { id: 'cat-002', name: 'Sunglasses', code: 'SUNGLASS', hsnCode: '9004', gstRate: 18, isActive: true },
  { id: 'cat-003', name: 'Reading Glasses', code: 'READING_GLASSES', hsnCode: '9004', gstRate: 18, isActive: true },
  { id: 'cat-004', name: 'Optical Lens', code: 'OPTICAL_LENS', hsnCode: '9001', gstRate: 18, isActive: true },
  { id: 'cat-005', name: 'Contact Lens', code: 'CONTACT_LENS', hsnCode: '9001', gstRate: 18, isActive: true },
  { id: 'cat-006', name: 'Colored Contact Lens', code: 'COLORED_CONTACT_LENS', hsnCode: '9001', gstRate: 18, isActive: true },
  { id: 'cat-007', name: 'Watch', code: 'WATCH', hsnCode: '9102', gstRate: 18, isActive: true },
  { id: 'cat-008', name: 'Smartwatch', code: 'SMARTWATCH', hsnCode: '8517', gstRate: 18, isActive: true },
  { id: 'cat-009', name: 'Smart Glasses', code: 'SMARTGLASSES', hsnCode: '8517', gstRate: 18, isActive: true },
  { id: 'cat-010', name: 'Wall Clock', code: 'WALL_CLOCK', hsnCode: '9105', gstRate: 18, isActive: true },
  { id: 'cat-011', name: 'Accessories', code: 'ACCESSORIES', hsnCode: '9004', gstRate: 18, isActive: true },
  { id: 'cat-012', name: 'Services', code: 'SERVICES', hsnCode: '9987', gstRate: 18, isActive: true },
];

const initialBrands: BrandMaster[] = [
  { id: 'brand-001', name: 'Ray-Ban', categoryIds: ['cat-001', 'cat-002'], subBrands: ['Aviator', 'Wayfarer', 'Clubmaster', 'Round', 'Justin', 'Erika'], isActive: true },
  { id: 'brand-002', name: 'Oakley', categoryIds: ['cat-001', 'cat-002'], subBrands: ['Holbrook', 'Frogskins', 'Radar', 'Flak', 'Sutro'], isActive: true },
  { id: 'brand-003', name: 'Titan', categoryIds: ['cat-001', 'cat-007'], subBrands: ['Eye Plus', 'Fastrack', 'Titan Eye+', 'Raga', 'Edge'], isActive: true },
  { id: 'brand-004', name: 'Essilor', categoryIds: ['cat-004'], subBrands: ['Crizal', 'Varilux', 'Eyezen', 'Transitions', 'Prevencia'], isActive: true },
  { id: 'brand-005', name: 'Zeiss', categoryIds: ['cat-004'], subBrands: ['DriveSafe', 'EnergizeMe', 'Digital Lens', 'SmartLife', 'Precision'], isActive: true },
  { id: 'brand-006', name: 'Hoya', categoryIds: ['cat-004'], subBrands: ['Blue Control', 'Sensity', 'Sync III', 'iD MyStyle', 'Nulux'], isActive: true },
  { id: 'brand-007', name: 'Nikon', categoryIds: ['cat-004'], subBrands: ['SeeMax', 'Presio', 'Relaxsee', 'Lite AS'], isActive: true },
  { id: 'brand-008', name: 'Johnson & Johnson', categoryIds: ['cat-005', 'cat-006'], subBrands: ['Acuvue', 'Acuvue Oasys', 'Acuvue Define', '1-Day Acuvue'], isActive: true },
  { id: 'brand-009', name: 'Bausch & Lomb', categoryIds: ['cat-005', 'cat-006'], subBrands: ['SofLens', 'PureVision', 'Biotrue', 'ULTRA'], isActive: true },
  { id: 'brand-010', name: 'Apple', categoryIds: ['cat-008'], subBrands: ['Watch SE', 'Watch Series 9', 'Watch Ultra'], isActive: true },
  { id: 'brand-011', name: 'Samsung', categoryIds: ['cat-008'], subBrands: ['Galaxy Watch', 'Galaxy Fit'], isActive: true },
  { id: 'brand-012', name: 'Fossil', categoryIds: ['cat-007', 'cat-008'], subBrands: ['Gen 6', 'Hybrid HR', 'Sport'], isActive: true },
  { id: 'brand-013', name: 'Gucci', categoryIds: ['cat-001', 'cat-002'], subBrands: [], isActive: true },
  { id: 'brand-014', name: 'Prada', categoryIds: ['cat-001', 'cat-002'], subBrands: [], isActive: true },
  { id: 'brand-015', name: 'Versace', categoryIds: ['cat-001', 'cat-002'], subBrands: [], isActive: true },
];

const initialFrameTypes: FrameTypeMaster[] = [
  { id: 'ft-001', name: 'Full Rim', isActive: true },
  { id: 'ft-002', name: 'Half Rim', isActive: true },
  { id: 'ft-003', name: 'Rimless', isActive: true },
  { id: 'ft-004', name: 'Semi-Rimless', isActive: true },
];

const initialShapes: ShapeMaster[] = [
  { id: 'shape-001', name: 'Round', isActive: true },
  { id: 'shape-002', name: 'Square', isActive: true },
  { id: 'shape-003', name: 'Rectangle', isActive: true },
  { id: 'shape-004', name: 'Oval', isActive: true },
  { id: 'shape-005', name: 'Cat Eye', isActive: true },
  { id: 'shape-006', name: 'Aviator', isActive: true },
  { id: 'shape-007', name: 'Wayfarer', isActive: true },
  { id: 'shape-008', name: 'Browline', isActive: true },
  { id: 'shape-009', name: 'Geometric', isActive: true },
  { id: 'shape-010', name: 'Oversized', isActive: true },
];

const initialMaterials: MaterialMaster[] = [
  { id: 'mat-001', name: 'Metal', type: 'FRAME', isActive: true },
  { id: 'mat-002', name: 'Acetate', type: 'FRAME', isActive: true },
  { id: 'mat-003', name: 'Titanium', type: 'FRAME', isActive: true },
  { id: 'mat-004', name: 'Plastic', type: 'FRAME', isActive: true },
  { id: 'mat-005', name: 'TR90', type: 'FRAME', isActive: true },
  { id: 'mat-006', name: 'Carbon Fiber', type: 'FRAME', isActive: true },
  { id: 'mat-007', name: 'Wood', type: 'FRAME', isActive: true },
  { id: 'mat-008', name: 'Glass', type: 'LENS', isActive: true },
  { id: 'mat-009', name: 'Polycarbonate', type: 'LENS', isActive: true },
  { id: 'mat-010', name: 'CR-39', type: 'LENS', isActive: true },
  { id: 'mat-011', name: 'Trivex', type: 'LENS', isActive: true },
  { id: 'mat-012', name: 'High-Index', type: 'LENS', isActive: true },
];

const initialColors: ColorMaster[] = [
  { id: 'color-001', name: 'Black', hexCode: '#000000', isActive: true },
  { id: 'color-002', name: 'Gold', hexCode: '#FFD700', isActive: true },
  { id: 'color-003', name: 'Silver', hexCode: '#C0C0C0', isActive: true },
  { id: 'color-004', name: 'Brown', hexCode: '#8B4513', isActive: true },
  { id: 'color-005', name: 'Tortoise', hexCode: '#704214', isActive: true },
  { id: 'color-006', name: 'Blue', hexCode: '#0000FF', isActive: true },
  { id: 'color-007', name: 'Green', hexCode: '#008000', isActive: true },
  { id: 'color-008', name: 'Red', hexCode: '#FF0000', isActive: true },
  { id: 'color-009', name: 'Pink', hexCode: '#FFC0CB', isActive: true },
  { id: 'color-010', name: 'Purple', hexCode: '#800080', isActive: true },
  { id: 'color-011', name: 'Gunmetal', hexCode: '#2C3539', isActive: true },
  { id: 'color-012', name: 'Rose Gold', hexCode: '#B76E79', isActive: true },
  { id: 'color-013', name: 'Transparent', hexCode: '#FFFFFF', isActive: true },
  { id: 'color-014', name: 'Matte Black', hexCode: '#28282B', isActive: true },
];

const genderOptions: GenderOption[] = [
  { id: 'gender-001', name: 'Unisex' },
  { id: 'gender-002', name: 'Men' },
  { id: 'gender-003', name: 'Women' },
  { id: 'gender-004', name: 'Kids' },
];

const initialLocations: LocationMaster[] = [
  { id: 'loc-001', name: 'Warehouse', code: 'WH', isActive: true },
  { id: 'loc-002', name: 'Store Display', code: 'SD', isActive: true },
  { id: 'loc-003', name: 'Storage Room', code: 'SR', isActive: true },
  { id: 'loc-004', name: 'Counter', code: 'CT', isActive: true },
];

const warrantyOptions: WarrantyOption[] = [
  { id: 'war-001', name: 'No Warranty', months: 0 },
  { id: 'war-002', name: '6 Months', months: 6 },
  { id: 'war-003', name: '1 Year', months: 12 },
  { id: 'war-004', name: '2 Years', months: 24 },
  { id: 'war-005', name: '3 Years', months: 36 },
  { id: 'war-006', name: 'Lifetime', months: 999 },
];

const initialOrigins: OriginMaster[] = [
  { id: 'origin-001', name: 'India', isActive: true },
  { id: 'origin-002', name: 'Italy', isActive: true },
  { id: 'origin-003', name: 'China', isActive: true },
  { id: 'origin-004', name: 'Japan', isActive: true },
  { id: 'origin-005', name: 'USA', isActive: true },
  { id: 'origin-006', name: 'Germany', isActive: true },
  { id: 'origin-007', name: 'France', isActive: true },
  { id: 'origin-008', name: 'Taiwan', isActive: true },
];

const initialLensIndices: LensIndexMaster[] = [
  { id: 'idx-001', value: '1.50', multiplier: 1.0, isActive: true },
  { id: 'idx-002', value: '1.56', multiplier: 1.2, isActive: true },
  { id: 'idx-003', value: '1.60', multiplier: 1.5, isActive: true },
  { id: 'idx-004', value: '1.67', multiplier: 1.8, isActive: true },
  { id: 'idx-005', value: '1.74', multiplier: 2.2, isActive: true },
];

const initialCoatings: LensCoatingMaster[] = [
  { id: 'coat-001', name: 'Anti-Reflective', price: 500, isActive: true },
  { id: 'coat-002', name: 'Blue Light Filter', price: 800, isActive: true },
  { id: 'coat-003', name: 'Photochromic', price: 2000, isActive: true },
  { id: 'coat-004', name: 'Scratch Resistant', price: 300, isActive: true },
  { id: 'coat-005', name: 'UV Protection', price: 400, isActive: true },
  { id: 'coat-006', name: 'Hydrophobic', price: 600, isActive: true },
];

const integrationOptions: IntegrationOption[] = [
  { id: 'int-001', name: 'Shopify', icon: 'shopify', enabled: true, description: 'Sync to your Shopify store' },
  { id: 'int-002', name: 'Tally', icon: 'tally', enabled: true, description: 'Export to Tally accounting' },
  { id: 'int-003', name: 'Amazon', icon: 'amazon', enabled: false, description: 'List on Amazon marketplace' },
  { id: 'int-004', name: 'Flipkart', icon: 'flipkart', enabled: false, description: 'List on Flipkart marketplace' },
  { id: 'int-005', name: 'WooCommerce', icon: 'woocommerce', enabled: false, description: 'Sync to WooCommerce store' },
];

// ============================================================================
// Context Type Definition
// ============================================================================

interface ProductMasterDataContextType {
  // Master Data
  categories: CategoryMaster[];
  brands: BrandMaster[];
  frameTypes: FrameTypeMaster[];
  shapes: ShapeMaster[];
  materials: MaterialMaster[];
  colors: ColorMaster[];
  genders: GenderOption[];
  locations: LocationMaster[];
  warranties: WarrantyOption[];
  origins: OriginMaster[];
  lensIndices: LensIndexMaster[];
  coatings: LensCoatingMaster[];
  integrations: IntegrationOption[];

  // Getters
  getCategoryById: (id: string) => CategoryMaster | undefined;
  getBrandById: (id: string) => BrandMaster | undefined;
  getBrandsForCategory: (categoryId: string) => BrandMaster[];
  getSubBrandsForBrand: (brandId: string) => string[];

  // Validation
  validateCategory: (name: string) => boolean;
  validateBrand: (name: string, categoryId: string) => boolean;
  validateSubBrand: (name: string, brandId: string) => boolean;
  validateColor: (name: string) => boolean;
  validateMaterial: (name: string) => boolean;
  validateFrameType: (name: string) => boolean;
  validateShape: (name: string) => boolean;

  // CRUD for Superadmin (add/update/delete)
  addCategory: (category: Omit<CategoryMaster, 'id'>) => CategoryMaster;
  updateCategory: (id: string, updates: Partial<CategoryMaster>) => void;
  addBrand: (brand: Omit<BrandMaster, 'id'>) => BrandMaster;
  updateBrand: (id: string, updates: Partial<BrandMaster>) => void;
  addSubBrandToBrand: (brandId: string, subBrand: string) => void;
  addColor: (color: Omit<ColorMaster, 'id'>) => ColorMaster;
  addFrameType: (frameType: Omit<FrameTypeMaster, 'id'>) => FrameTypeMaster;
  addShape: (shape: Omit<ShapeMaster, 'id'>) => ShapeMaster;
  addMaterial: (material: Omit<MaterialMaster, 'id'>) => MaterialMaster;

  // SKU Generation
  generateSKU: (categoryCode: string, brandCode: string) => string;
}

// ============================================================================
// Context Creation
// ============================================================================

const ProductMasterDataContext = createContext<ProductMasterDataContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export function ProductMasterDataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryMaster[]>(initialCategories);
  const [brands, setBrands] = useState<BrandMaster[]>(initialBrands);
  const [frameTypes, setFrameTypes] = useState<FrameTypeMaster[]>(initialFrameTypes);
  const [shapes, setShapes] = useState<ShapeMaster[]>(initialShapes);
  const [materials, setMaterials] = useState<MaterialMaster[]>(initialMaterials);
  const [colors, setColors] = useState<ColorMaster[]>(initialColors);
  const [locations, setLocations] = useState<LocationMaster[]>(initialLocations);
  const [origins, setOrigins] = useState<OriginMaster[]>(initialOrigins);
  const [lensIndices] = useState<LensIndexMaster[]>(initialLensIndices);
  const [coatings] = useState<LensCoatingMaster[]>(initialCoatings);
  const [integrations] = useState<IntegrationOption[]>(integrationOptions);

  // SKU counter
  const [skuCounter, setSkuCounter] = useState(1000);

  // ============================================================================
  // Getters
  // ============================================================================

  const getCategoryById = useCallback((id: string) => {
    return categories.find(c => c.id === id);
  }, [categories]);

  const getBrandById = useCallback((id: string) => {
    return brands.find(b => b.id === id);
  }, [brands]);

  const getBrandsForCategory = useCallback((categoryId: string) => {
    return brands.filter(b => b.categoryIds.includes(categoryId) && b.isActive);
  }, [brands]);

  const getSubBrandsForBrand = useCallback((brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    return brand?.subBrands || [];
  }, [brands]);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateCategory = useCallback((name: string) => {
    return categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.isActive);
  }, [categories]);

  const validateBrand = useCallback((name: string, categoryId: string) => {
    return brands.some(b =>
      b.name.toLowerCase() === name.toLowerCase() &&
      b.categoryIds.includes(categoryId) &&
      b.isActive
    );
  }, [brands]);

  const validateSubBrand = useCallback((name: string, brandId: string) => {
    const brand = brands.find(b => b.id === brandId);
    if (!brand) return false;
    return brand.subBrands.some(sb => sb.toLowerCase() === name.toLowerCase());
  }, [brands]);

  const validateColor = useCallback((name: string) => {
    return colors.some(c => c.name.toLowerCase() === name.toLowerCase() && c.isActive);
  }, [colors]);

  const validateMaterial = useCallback((name: string) => {
    return materials.some(m => m.name.toLowerCase() === name.toLowerCase() && m.isActive);
  }, [materials]);

  const validateFrameType = useCallback((name: string) => {
    return frameTypes.some(ft => ft.name.toLowerCase() === name.toLowerCase() && ft.isActive);
  }, [frameTypes]);

  const validateShape = useCallback((name: string) => {
    return shapes.some(s => s.name.toLowerCase() === name.toLowerCase() && s.isActive);
  }, [shapes]);

  // ============================================================================
  // CRUD Operations (Superadmin only)
  // ============================================================================

  const addCategory = useCallback((category: Omit<CategoryMaster, 'id'>): CategoryMaster => {
    const newCategory: CategoryMaster = { ...category, id: `cat-${Date.now()}` };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  const updateCategory = useCallback((id: string, updates: Partial<CategoryMaster>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  }, []);

  const addBrand = useCallback((brand: Omit<BrandMaster, 'id'>): BrandMaster => {
    const newBrand: BrandMaster = { ...brand, id: `brand-${Date.now()}` };
    setBrands(prev => [...prev, newBrand]);
    return newBrand;
  }, []);

  const updateBrand = useCallback((id: string, updates: Partial<BrandMaster>) => {
    setBrands(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const addSubBrandToBrand = useCallback((brandId: string, subBrand: string) => {
    setBrands(prev => prev.map(b => {
      if (b.id !== brandId) return b;
      if (b.subBrands.includes(subBrand)) return b;
      return { ...b, subBrands: [...b.subBrands, subBrand] };
    }));
  }, []);

  const addColor = useCallback((color: Omit<ColorMaster, 'id'>): ColorMaster => {
    const newColor: ColorMaster = { ...color, id: `color-${Date.now()}` };
    setColors(prev => [...prev, newColor]);
    return newColor;
  }, []);

  const addFrameType = useCallback((frameType: Omit<FrameTypeMaster, 'id'>): FrameTypeMaster => {
    const newFrameType: FrameTypeMaster = { ...frameType, id: `ft-${Date.now()}` };
    setFrameTypes(prev => [...prev, newFrameType]);
    return newFrameType;
  }, []);

  const addShape = useCallback((shape: Omit<ShapeMaster, 'id'>): ShapeMaster => {
    const newShape: ShapeMaster = { ...shape, id: `shape-${Date.now()}` };
    setShapes(prev => [...prev, newShape]);
    return newShape;
  }, []);

  const addMaterial = useCallback((material: Omit<MaterialMaster, 'id'>): MaterialMaster => {
    const newMaterial: MaterialMaster = { ...material, id: `mat-${Date.now()}` };
    setMaterials(prev => [...prev, newMaterial]);
    return newMaterial;
  }, []);

  // ============================================================================
  // SKU Generation
  // ============================================================================

  const generateSKU = useCallback((categoryCode: string, brandCode: string): string => {
    const prefix = categoryCode.substring(0, 2).toUpperCase();
    const brandPrefix = brandCode.substring(0, 3).toUpperCase();
    const num = skuCounter;
    setSkuCounter(c => c + 1);
    return `${prefix}-${brandPrefix}-${num}`;
  }, [skuCounter]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: ProductMasterDataContextType = {
    categories,
    brands,
    frameTypes,
    shapes,
    materials,
    colors,
    genders: genderOptions,
    locations,
    warranties: warrantyOptions,
    origins,
    lensIndices,
    coatings,
    integrations,
    getCategoryById,
    getBrandById,
    getBrandsForCategory,
    getSubBrandsForBrand,
    validateCategory,
    validateBrand,
    validateSubBrand,
    validateColor,
    validateMaterial,
    validateFrameType,
    validateShape,
    addCategory,
    updateCategory,
    addBrand,
    updateBrand,
    addSubBrandToBrand,
    addColor,
    addFrameType,
    addShape,
    addMaterial,
    generateSKU,
  };

  return (
    <ProductMasterDataContext.Provider value={value}>
      {children}
    </ProductMasterDataContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useProductMasterData() {
  const context = useContext(ProductMasterDataContext);
  if (context === undefined) {
    throw new Error('useProductMasterData must be used within a ProductMasterDataProvider');
  }
  return context;
}

export default ProductMasterDataContext;
