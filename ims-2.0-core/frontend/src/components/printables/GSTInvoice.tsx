// ============================================================================
// IMS 2.0 - GST Invoice Component
// ============================================================================
// Printable GST-compliant invoice with all required fields

import { useRef } from 'react';
import { Printer, Download, X } from 'lucide-react';

// Invoice Types
interface InvoiceItem {
  slNo: number;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number;
}

interface InvoiceData {
  // Invoice Details
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply: string;

  // Seller Details
  seller: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    phone: string;
    email: string;
    stateCode: string;
  };

  // Buyer Details
  buyer: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    phone: string;
    email?: string;
    stateCode?: string;
  };

  // Items
  items: InvoiceItem[];

  // Totals
  subTotal: number;
  totalDiscount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  grandTotal: number;

  // Payment
  paymentMode: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  amountPaid: number;
  balanceDue: number;

  // Additional
  notes?: string;
  terms?: string;
}

interface GSTInvoiceProps {
  data: InvoiceData;
  onClose: () => void;
}

// Number to Words (Indian Format)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = 'Rupees ' + convert(rupees);
  if (paise > 0) {
    result += ' and ' + convert(paise) + ' Paise';
  }
  result += ' Only';

  return result;
}

export function GSTInvoice({ data, onClose }: GSTInvoiceProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const isIntraState = data.seller.stateCode === data.buyer.stateCode;

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Tax Invoice - ${data.invoiceNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; }
            .invoice { max-width: 210mm; margin: 0 auto; padding: 10mm; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
            .company-name { font-size: 18px; font-weight: bold; }
            .invoice-title { font-size: 14px; font-weight: bold; margin-top: 5px; background: #f0f0f0; padding: 5px; }
            .details-row { display: flex; margin-bottom: 10px; }
            .details-col { flex: 1; padding: 5px; border: 1px solid #ddd; }
            .details-col h4 { font-size: 11px; font-weight: bold; margin-bottom: 5px; background: #f5f5f5; padding: 3px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #000; padding: 5px; text-align: center; font-size: 10px; }
            th { background: #f0f0f0; font-weight: bold; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .totals-section { margin-top: 10px; }
            .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
            .grand-total { font-size: 14px; font-weight: bold; border-top: 2px solid #000; padding-top: 5px; }
            .amount-words { padding: 10px; background: #f9f9f9; border: 1px solid #ddd; margin: 10px 0; }
            .footer { margin-top: 20px; display: flex; justify-content: space-between; }
            .signature-box { width: 200px; text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }
            .terms { margin-top: 15px; font-size: 9px; color: #666; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .invoice { padding: 5mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Tax Invoice</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div ref={printRef} className="invoice bg-white">
            {/* Header */}
            <div className="header text-center border-b-2 border-black pb-3 mb-4">
              <div className="company-name text-xl font-bold">{data.seller.name}</div>
              <div className="text-sm text-gray-600">
                {data.seller.address}, {data.seller.city}, {data.seller.state} - {data.seller.pincode}
              </div>
              <div className="text-sm">
                Phone: {data.seller.phone} | Email: {data.seller.email}
              </div>
              <div className="text-sm font-medium">GSTIN: {data.seller.gstin}</div>
              <div className="invoice-title text-base font-bold mt-3 bg-gray-100 py-2">TAX INVOICE</div>
            </div>

            {/* Invoice & Buyer Details */}
            <div className="details-row grid grid-cols-2 gap-4 mb-4">
              {/* Invoice Details */}
              <div className="details-col border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm">Invoice Details</h4>
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-2 text-gray-600">Invoice No:</td>
                      <td className="font-medium">{data.invoiceNo}</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-600">Date:</td>
                      <td className="font-medium">{data.invoiceDate}</td>
                    </tr>
                    <tr>
                      <td className="pr-2 text-gray-600">Place of Supply:</td>
                      <td className="font-medium">{data.placeOfSupply}</td>
                    </tr>
                    {data.dueDate && (
                      <tr>
                        <td className="pr-2 text-gray-600">Due Date:</td>
                        <td className="font-medium">{data.dueDate}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Buyer Details */}
              <div className="details-col border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm">Bill To</h4>
                <div className="text-sm">
                  <p className="font-medium">{data.buyer.name}</p>
                  <p className="text-gray-600">{data.buyer.address}</p>
                  <p className="text-gray-600">{data.buyer.city}, {data.buyer.state} - {data.buyer.pincode}</p>
                  <p className="text-gray-600">Phone: {data.buyer.phone}</p>
                  {data.buyer.gstin && <p className="font-medium">GSTIN: {data.buyer.gstin}</p>}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse text-xs mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Sl.</th>
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2">HSN</th>
                  <th className="border p-2">Qty</th>
                  <th className="border p-2">Rate</th>
                  <th className="border p-2">Disc.</th>
                  <th className="border p-2">Taxable</th>
                  {isIntraState ? (
                    <>
                      <th className="border p-2">CGST</th>
                      <th className="border p-2">SGST</th>
                    </>
                  ) : (
                    <th className="border p-2">IGST</th>
                  )}
                  <th className="border p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.slNo}>
                    <td className="border p-2 text-center">{item.slNo}</td>
                    <td className="border p-2 text-left">{item.description}</td>
                    <td className="border p-2 text-center">{item.hsnCode}</td>
                    <td className="border p-2 text-center">{item.quantity} {item.unit}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.rate)}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.discount)}</td>
                    <td className="border p-2 text-right">{formatCurrency(item.taxableValue)}</td>
                    {isIntraState ? (
                      <>
                        <td className="border p-2 text-right">
                          <div>{item.cgstRate}%</div>
                          <div className="text-gray-500">{formatCurrency(item.cgstAmount)}</div>
                        </td>
                        <td className="border p-2 text-right">
                          <div>{item.sgstRate}%</div>
                          <div className="text-gray-500">{formatCurrency(item.sgstAmount)}</div>
                        </td>
                      </>
                    ) : (
                      <td className="border p-2 text-right">
                        <div>{item.igstRate}%</div>
                        <div className="text-gray-500">{formatCurrency(item.igstAmount)}</div>
                      </td>
                    )}
                    <td className="border p-2 text-right font-medium">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tax Summary */}
              <div className="border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm">Tax Summary</h4>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-1">Tax Type</th>
                      <th className="text-right py-1">Taxable</th>
                      <th className="text-right py-1">Rate</th>
                      <th className="text-right py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isIntraState ? (
                      <>
                        <tr>
                          <td className="py-1">CGST</td>
                          <td className="text-right">{formatCurrency(data.subTotal - data.totalDiscount)}</td>
                          <td className="text-right">9%</td>
                          <td className="text-right">{formatCurrency(data.totalCGST)}</td>
                        </tr>
                        <tr>
                          <td className="py-1">SGST</td>
                          <td className="text-right">{formatCurrency(data.subTotal - data.totalDiscount)}</td>
                          <td className="text-right">9%</td>
                          <td className="text-right">{formatCurrency(data.totalSGST)}</td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td className="py-1">IGST</td>
                        <td className="text-right">{formatCurrency(data.subTotal - data.totalDiscount)}</td>
                        <td className="text-right">18%</td>
                        <td className="text-right">{formatCurrency(data.totalIGST)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Invoice Total */}
              <div className="border rounded p-3">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sub Total:</span>
                    <span>{formatCurrency(data.subTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-red-600">-{formatCurrency(data.totalDiscount)}</span>
                  </div>
                  {isIntraState ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CGST (9%):</span>
                        <span>{formatCurrency(data.totalCGST)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SGST (9%):</span>
                        <span>{formatCurrency(data.totalSGST)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IGST (18%):</span>
                      <span>{formatCurrency(data.totalIGST)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Round Off:</span>
                    <span>{data.roundOff >= 0 ? '+' : ''}{formatCurrency(data.roundOff)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                    <span>Grand Total:</span>
                    <span>{formatCurrency(data.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="amount-words p-3 bg-gray-50 border rounded my-4">
              <span className="font-medium">Amount in Words: </span>
              <span className="italic">{numberToWords(data.grandTotal)}</span>
            </div>

            {/* Payment Status */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-sm">
                <p><span className="text-gray-600">Payment Mode:</span> <span className="font-medium">{data.paymentMode}</span></p>
                <p><span className="text-gray-600">Payment Status:</span>
                  <span className={`ml-1 px-2 py-0.5 rounded text-xs font-medium ${
                    data.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                    data.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {data.paymentStatus}
                  </span>
                </p>
              </div>
              {data.balanceDue > 0 && (
                <div className="text-right text-sm">
                  <p><span className="text-gray-600">Amount Paid:</span> <span className="font-medium">{formatCurrency(data.amountPaid)}</span></p>
                  <p><span className="text-gray-600">Balance Due:</span> <span className="font-bold text-red-600">{formatCurrency(data.balanceDue)}</span></p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="footer flex justify-between mt-8">
              <div className="text-sm">
                {data.terms && (
                  <div className="terms">
                    <p className="font-medium">Terms & Conditions:</p>
                    <p className="text-gray-600">{data.terms}</p>
                  </div>
                )}
              </div>
              <div className="signature-box text-center">
                <p className="text-sm font-medium">For {data.seller.name}</p>
                <div className="h-16"></div>
                <div className="signature-line border-t pt-2 text-sm">Authorized Signatory</div>
              </div>
            </div>

            {/* Computer Generated Note */}
            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t">
              This is a computer generated invoice and does not require a physical signature.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Component
export function GSTInvoiceDemo() {
  const sampleData: InvoiceData = {
    invoiceNo: 'INV-2026-00123',
    invoiceDate: '21-Jan-2026',
    placeOfSupply: 'Maharashtra (27)',
    seller: {
      name: 'Brahma Vision Pvt. Ltd.',
      address: '123, Commercial Complex, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AABCU9603R1ZM',
      phone: '+91 22 1234 5678',
      email: 'sales@brahmaoptics.com',
      stateCode: '27',
    },
    buyer: {
      name: 'Rajesh Kumar',
      address: '456, Residential Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400050',
      phone: '+91 98765 43210',
      stateCode: '27',
    },
    items: [
      {
        slNo: 1,
        description: 'Ray-Ban Aviator RB3025 Gold',
        hsnCode: '9004',
        quantity: 1,
        unit: 'Pc',
        rate: 12990,
        discount: 1299,
        taxableValue: 11691,
        cgstRate: 9,
        cgstAmount: 1052.19,
        sgstRate: 9,
        sgstAmount: 1052.19,
        igstRate: 0,
        igstAmount: 0,
        total: 13795.38,
      },
      {
        slNo: 2,
        description: 'Essilor Crizal Sapphire HR Lenses (Pair)',
        hsnCode: '9001',
        quantity: 1,
        unit: 'Pair',
        rate: 8500,
        discount: 0,
        taxableValue: 8500,
        cgstRate: 9,
        cgstAmount: 765,
        sgstRate: 9,
        sgstAmount: 765,
        igstRate: 0,
        igstAmount: 0,
        total: 10030,
      },
    ],
    subTotal: 21490,
    totalDiscount: 1299,
    totalCGST: 1817.19,
    totalSGST: 1817.19,
    totalIGST: 0,
    roundOff: 0.62,
    grandTotal: 23825,
    paymentMode: 'Card',
    paymentStatus: 'PAID',
    amountPaid: 23825,
    balanceDue: 0,
    terms: 'Goods once sold cannot be returned. Warranty as per manufacturer.',
  };

  return <GSTInvoice data={sampleData} onClose={() => {}} />;
}

export default GSTInvoice;
