// ============================================================================
// IMS 2.0 - Barcode Print Component
// ============================================================================
// Generate and print barcode labels for products

import { useState, useRef } from 'react';
import {
  Barcode,
  Printer,
  Plus,
  Minus,
  Search,
  X,
  Download,
  Settings,
} from 'lucide-react';
import clsx from 'clsx';

// Types
interface ProductForBarcode {
  productId: string;
  productName: string;
  sku: string;
  brand: string;
  mrp: number;
  offerPrice: number;
  barcode: string;
}

interface LabelConfig {
  width: number; // mm
  height: number; // mm
  showPrice: boolean;
  showBrand: boolean;
  showSku: boolean;
  labelsPerRow: number;
}

interface BarcodePrintProps {
  products: ProductForBarcode[];
  onClose: () => void;
}

// Default label configurations
const LABEL_PRESETS = [
  { name: 'Small (30x15mm)', config: { width: 30, height: 15, showPrice: true, showBrand: false, showSku: true, labelsPerRow: 3 } },
  { name: 'Medium (50x25mm)', config: { width: 50, height: 25, showPrice: true, showBrand: true, showSku: true, labelsPerRow: 2 } },
  { name: 'Large (70x35mm)', config: { width: 70, height: 35, showPrice: true, showBrand: true, showSku: true, labelsPerRow: 1 } },
];

// Single Barcode Label Component
function BarcodeLabel({
  product,
  config,
}: {
  product: ProductForBarcode;
  config: LabelConfig;
}) {
  // Generate a simple barcode visualization (in production, use a library like jsbarcode)
  const generateBarcodeLines = (code: string) => {
    // Simple visual representation - in production use proper barcode generation
    const lines = [];
    for (let i = 0; i < 30; i++) {
      const isThick = Math.random() > 0.5;
      lines.push(
        <div
          key={i}
          className={clsx(
            'h-full bg-black',
            isThick ? 'w-1' : 'w-0.5'
          )}
        />
      );
      if (Math.random() > 0.7) {
        lines.push(<div key={`gap-${i}`} className="w-0.5" />);
      }
    }
    return lines;
  };

  return (
    <div
      className="border border-gray-300 rounded p-2 bg-white flex flex-col items-center"
      style={{
        width: `${config.width}mm`,
        height: `${config.height}mm`,
        minWidth: `${config.width}mm`,
      }}
    >
      {/* Brand */}
      {config.showBrand && (
        <p className="text-[8px] font-medium text-gray-600 truncate w-full text-center">
          {product.brand}
        </p>
      )}

      {/* Barcode */}
      <div className="flex-1 flex items-center justify-center gap-px my-1">
        {generateBarcodeLines(product.barcode)}
      </div>

      {/* Barcode Number */}
      <p className="text-[7px] font-mono text-gray-700">{product.barcode}</p>

      {/* SKU */}
      {config.showSku && (
        <p className="text-[8px] font-medium text-gray-900 truncate w-full text-center">
          {product.sku}
        </p>
      )}

      {/* Price */}
      {config.showPrice && (
        <p className="text-[10px] font-bold text-gray-900">
          ₹{product.offerPrice.toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}

// Product Selector Component
function ProductSelector({
  products,
  selectedProducts,
  onToggle,
  onUpdateQty,
}: {
  products: ProductForBarcode[];
  selectedProducts: Map<string, number>;
  onToggle: (productId: string) => void;
  onUpdateQty: (productId: string, qty: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = products.filter(p =>
    p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products..."
          className="input-field pl-9"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {filteredProducts.map(product => {
          const isSelected = selectedProducts.has(product.productId);
          const qty = selectedProducts.get(product.productId) ?? 1;

          return (
            <div
              key={product.productId}
              className={clsx(
                'p-3 rounded-lg border transition-colors',
                isSelected ? 'border-bv-red-500 bg-bv-red-50' : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => onToggle(product.productId)}
                >
                  <p className="font-medium text-gray-900">{product.productName}</p>
                  <p className="text-xs text-gray-500">
                    {product.sku} • {product.brand} • ₹{product.offerPrice}
                  </p>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2 ml-3">
                    <button
                      onClick={() => onUpdateQty(product.productId, Math.max(1, qty - 1))}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{qty}</span>
                    <button
                      onClick={() => onUpdateQty(product.productId, qty + 1)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BarcodePrint({ products, onClose }: BarcodePrintProps) {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [labelConfig, setLabelConfig] = useState<LabelConfig>(LABEL_PRESETS[1].config);
  const [activePreset, setActivePreset] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  const toggleProduct = (productId: string) => {
    const newSelected = new Map(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.set(productId, 1);
    }
    setSelectedProducts(newSelected);
  };

  const updateQty = (productId: string, qty: number) => {
    const newSelected = new Map(selectedProducts);
    newSelected.set(productId, qty);
    setSelectedProducts(newSelected);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Barcode Labels</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 10mm;
                }
                .labels-grid {
                  display: flex;
                  flex-wrap: wrap;
                  gap: 3mm;
                }
                .label {
                  border: 1px solid #ccc;
                  border-radius: 2px;
                  padding: 2mm;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  page-break-inside: avoid;
                }
                .barcode {
                  display: flex;
                  align-items: center;
                  gap: 0.5px;
                  height: 8mm;
                  margin: 1mm 0;
                }
                .bar { background: black; height: 100%; }
                .bar-thick { width: 1px; }
                .bar-thin { width: 0.5px; }
                @media print {
                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // Generate labels for selected products
  const labelsToGenerate: { product: ProductForBarcode; index: number }[] = [];
  selectedProducts.forEach((qty, productId) => {
    const product = products.find(p => p.productId === productId);
    if (product) {
      for (let i = 0; i < qty; i++) {
        labelsToGenerate.push({ product, index: labelsToGenerate.length });
      }
    }
  });

  const totalLabels = labelsToGenerate.length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Barcode className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Print Barcode Labels</h2>
              <p className="text-sm text-gray-500">{totalLabels} label(s) selected</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Product Selection */}
          <div className="w-1/2 p-4 border-r border-gray-200 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3">Select Products</h3>
            <ProductSelector
              products={products}
              selectedProducts={selectedProducts}
              onToggle={toggleProduct}
              onUpdateQty={updateQty}
            />

            {/* Label Configuration */}
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Label Settings
              </h3>

              {/* Presets */}
              <div className="flex gap-2 mb-3">
                {LABEL_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLabelConfig(preset.config);
                      setActivePreset(idx);
                    }}
                    className={clsx(
                      'px-3 py-1.5 text-sm rounded-lg border transition-colors',
                      activePreset === idx
                        ? 'border-bv-red-500 bg-bv-red-50 text-bv-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Options */}
              <div className="space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelConfig.showPrice}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showPrice: e.target.checked })}
                    className="rounded text-bv-red-600"
                  />
                  <span>Show Price</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelConfig.showBrand}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showBrand: e.target.checked })}
                    className="rounded text-bv-red-600"
                  />
                  <span>Show Brand</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={labelConfig.showSku}
                    onChange={(e) => setLabelConfig({ ...labelConfig, showSku: e.target.checked })}
                    className="rounded text-bv-red-600"
                  />
                  <span>Show SKU</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="w-1/2 p-4 bg-gray-50 overflow-y-auto">
            <h3 className="font-medium text-gray-900 mb-3">Preview</h3>

            {totalLabels === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Barcode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Select products to preview labels</p>
              </div>
            ) : (
              <div
                ref={printRef}
                className="flex flex-wrap gap-2"
                style={{ maxWidth: '100%' }}
              >
                {labelsToGenerate.map(({ product, index }) => (
                  <BarcodeLabel
                    key={`${product.productId}-${index}`}
                    product={product}
                    config={labelConfig}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {totalLabels} label(s) • {labelConfig.width}×{labelConfig.height}mm
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline">Cancel</button>
            <button
              onClick={handlePrint}
              disabled={totalLabels === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BarcodePrint;
