// ============================================================================
// IMS 2.0 - GST Calculator & Tax Management
// ============================================================================
// GST calculation, HSN lookup, and tax configuration

import { useState } from 'react';
import {
  Calculator,
  Search,
  IndianRupee,
  FileText,
  Info,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

// HSN Code Database (Common for Optical Industry)
interface HSNCode {
  code: string;
  description: string;
  gstRate: number;
  category: string;
}

const hsnDatabase: HSNCode[] = [
  // Frames & Spectacles
  { code: '9003', description: 'Frames and mountings for spectacles, goggles', gstRate: 18, category: 'Frames' },
  { code: '900311', description: 'Frames of plastics', gstRate: 18, category: 'Frames' },
  { code: '900319', description: 'Frames of other materials', gstRate: 18, category: 'Frames' },

  // Lenses
  { code: '9001', description: 'Optical fibres, lenses, prisms, mirrors', gstRate: 18, category: 'Lenses' },
  { code: '900140', description: 'Spectacle lenses of glass', gstRate: 18, category: 'Lenses' },
  { code: '900150', description: 'Spectacle lenses of other materials', gstRate: 18, category: 'Lenses' },

  // Sunglasses
  { code: '9004', description: 'Spectacles, goggles and the like, corrective, protective', gstRate: 18, category: 'Sunglasses' },
  { code: '900410', description: 'Sunglasses', gstRate: 18, category: 'Sunglasses' },
  { code: '900490', description: 'Other spectacles, goggles', gstRate: 18, category: 'Sunglasses' },

  // Contact Lenses
  { code: '900130', description: 'Contact lenses', gstRate: 12, category: 'Contact Lenses' },

  // Solutions & Accessories
  { code: '3307', description: 'Pre-shave, shaving or after-shave preparations', gstRate: 18, category: 'Accessories' },
  { code: '330790', description: 'Lens cleaning solutions', gstRate: 18, category: 'Accessories' },
  { code: '4202', description: 'Cases, spectacle cases', gstRate: 18, category: 'Accessories' },
];

// GST Rate Slabs
const gstSlabs = [
  { rate: 0, label: 'Exempt', items: 'Essential items, healthcare' },
  { rate: 5, label: '5%', items: 'Basic necessities' },
  { rate: 12, label: '12%', items: 'Contact lenses, some medical' },
  { rate: 18, label: '18%', items: 'Frames, lenses, sunglasses' },
  { rate: 28, label: '28%', items: 'Luxury items' },
];

// Calculate GST
interface GSTBreakdown {
  baseAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  isInterState: boolean;
}

function calculateGST(
  amount: number,
  gstRate: number,
  isInterState: boolean,
  isInclusive: boolean = false
): GSTBreakdown {
  let taxableAmount: number;
  let totalTax: number;

  if (isInclusive) {
    // GST is included in the amount
    taxableAmount = amount / (1 + gstRate / 100);
    totalTax = amount - taxableAmount;
  } else {
    // GST is to be added
    taxableAmount = amount;
    totalTax = (amount * gstRate) / 100;
  }

  const cgst = isInterState ? 0 : totalTax / 2;
  const sgst = isInterState ? 0 : totalTax / 2;
  const igst = isInterState ? totalTax : 0;

  return {
    baseAmount: amount,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    cgst: Math.round(cgst * 100) / 100,
    sgst: Math.round(sgst * 100) / 100,
    igst: Math.round(igst * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    grandTotal: Math.round((taxableAmount + totalTax) * 100) / 100,
    isInterState,
  };
}

// HSN Search Component
function HSNSearch() {
  const [query, setQuery] = useState('');
  const [selectedHSN, setSelectedHSN] = useState<HSNCode | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredHSN = hsnDatabase.filter(hsn =>
    hsn.code.includes(query) ||
    hsn.description.toLowerCase().includes(query.toLowerCase()) ||
    hsn.category.toLowerCase().includes(query.toLowerCase())
  );

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-bv-red-600" />
        HSN Code Lookup
      </h3>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search HSN code or product..."
          className="w-full pl-9 pr-4 py-2 border rounded-lg"
        />
      </div>

      {/* Results */}
      <div className="max-h-64 overflow-y-auto border rounded-lg">
        {filteredHSN.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No matching HSN codes found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">HSN Code</th>
                <th className="text-left p-2 font-medium">Description</th>
                <th className="text-center p-2 font-medium">GST %</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {filteredHSN.map((hsn) => (
                <tr
                  key={hsn.code}
                  className={clsx(
                    'border-t hover:bg-gray-50 cursor-pointer',
                    selectedHSN?.code === hsn.code && 'bg-bv-red-50'
                  )}
                  onClick={() => setSelectedHSN(hsn)}
                >
                  <td className="p-2 font-mono font-medium">{hsn.code}</td>
                  <td className="p-2">
                    <p>{hsn.description}</p>
                    <p className="text-xs text-gray-500">{hsn.category}</p>
                  </td>
                  <td className="p-2 text-center">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {hsn.gstRate}%
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(hsn.code);
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="Copy HSN Code"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// GST Calculator Component
function GSTCalculatorWidget() {
  const [amount, setAmount] = useState<string>('10000');
  const [gstRate, setGstRate] = useState<number>(18);
  const [isInclusive, setIsInclusive] = useState(false);
  const [isInterState, setIsInterState] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const breakdown = calculateGST(numAmount, gstRate, isInterState, isInclusive);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-bv-red-600" />
        GST Calculator
      </h3>

      <div className="space-y-4">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-lg"
              placeholder="Enter amount"
            />
          </div>
        </div>

        {/* GST Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate</label>
          <div className="flex gap-2">
            {[5, 12, 18, 28].map((rate) => (
              <button
                key={rate}
                onClick={() => setGstRate(rate)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  gstRate === rate
                    ? 'bg-bv-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {rate}%
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInclusive}
              onChange={(e) => setIsInclusive(e.target.checked)}
              className="rounded text-bv-red-600"
            />
            <span className="text-sm">GST Inclusive</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isInterState}
              onChange={(e) => setIsInterState(e.target.checked)}
              className="rounded text-bv-red-600"
            />
            <span className="text-sm">Inter-State (IGST)</span>
          </label>
        </div>

        {/* Breakdown */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Taxable Amount:</span>
            <span className="font-medium">{formatCurrency(breakdown.taxableAmount)}</span>
          </div>

          {breakdown.isInterState ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IGST ({gstRate}%):</span>
              <span className="font-medium text-blue-600">{formatCurrency(breakdown.igst)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CGST ({gstRate / 2}%):</span>
                <span className="font-medium text-blue-600">{formatCurrency(breakdown.cgst)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SGST ({gstRate / 2}%):</span>
                <span className="font-medium text-blue-600">{formatCurrency(breakdown.sgst)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between text-sm border-t pt-2">
            <span className="text-gray-600">Total Tax:</span>
            <span className="font-medium">{formatCurrency(breakdown.totalTax)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold border-t pt-2">
            <span>Grand Total:</span>
            <span className="text-green-600">{formatCurrency(breakdown.grandTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// GST Slab Info
function GSTSlabInfo() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">GST Rate Slabs</h3>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-2">
          {gstSlabs.map((slab) => (
            <div key={slab.rate} className="flex items-center gap-4 p-2 bg-gray-50 rounded">
              <span className={clsx(
                'px-3 py-1 rounded text-sm font-bold',
                slab.rate === 0 && 'bg-green-100 text-green-700',
                slab.rate === 5 && 'bg-blue-100 text-blue-700',
                slab.rate === 12 && 'bg-yellow-100 text-yellow-700',
                slab.rate === 18 && 'bg-orange-100 text-orange-700',
                slab.rate === 28 && 'bg-red-100 text-red-700'
              )}>
                {slab.label}
              </span>
              <span className="text-sm text-gray-600">{slab.items}</span>
            </div>
          ))}
          <p className="text-xs text-gray-500 mt-2">
            * Optical industry products (frames, lenses, sunglasses) typically fall under 18% GST.
            Contact lenses may be 12%.
          </p>
        </div>
      )}
    </div>
  );
}

// Main GST Calculator Page
export function GSTCalculator() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GST & Tax Management</h1>
        <p className="text-gray-500 mt-1">Calculate GST, lookup HSN codes, and manage tax settings</p>
      </div>

      {/* Important Note */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">GST Implementation Notes:</p>
            <ul className="mt-1 space-y-1 list-disc list-inside">
              <li>Intra-state: Split as CGST (9%) + SGST (9%) = 18%</li>
              <li>Inter-state: IGST (18%) applies</li>
              <li>GSTIN validation: 15-digit format with state code prefix</li>
              <li>HSN codes are mandatory for B2B invoices</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid laptop:grid-cols-2 gap-6">
        <GSTCalculatorWidget />
        <HSNSearch />
      </div>

      <GSTSlabInfo />
    </div>
  );
}

export default GSTCalculator;
