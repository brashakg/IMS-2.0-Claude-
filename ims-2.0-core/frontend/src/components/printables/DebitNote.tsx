// ============================================================================
// IMS 2.0 - Debit Note Printable Component
// GST-compliant debit note for price adjustments, additional charges
// ============================================================================

import React, { useRef } from 'react';

interface DebitNoteItem {
  sno: number;
  description: string;
  hsn_code: string;
  quantity: number;
  rate: number;
  taxable_value: number;
  cgst_rate: number;
  cgst_amount: number;
  sgst_rate: number;
  sgst_amount: number;
  igst_rate: number;
  igst_amount: number;
  total: number;
}

interface DebitNoteData {
  // Header
  debit_note_number: string;
  debit_note_date: string;
  original_invoice_number: string;
  original_invoice_date: string;

  // Seller (Our Company)
  seller: {
    name: string;
    address: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    gstin: string;
    pan: string;
    phone: string;
    email: string;
  };

  // Buyer
  buyer: {
    name: string;
    address: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
    gstin?: string;
    phone: string;
    email?: string;
  };

  // Items
  items: DebitNoteItem[];

  // Reason
  reason: string;

  // Totals
  subtotal: number;
  cgst_total: number;
  sgst_total: number;
  igst_total: number;
  round_off: number;
  grand_total: number;
  amount_in_words: string;

  // Is inter-state
  is_inter_state: boolean;

  // Terms
  terms?: string[];

  // Signatures
  prepared_by?: string;
  approved_by?: string;
}

interface Props {
  data: DebitNoteData;
}

export const DebitNote: React.FC<Props> = ({ data }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Debit Note - ${data.debit_note_number}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; }
                .container { max-width: 800px; margin: 0 auto; padding: 15px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; }
                .header h1 { font-size: 18px; font-weight: bold; color: #dc2626; }
                .header h2 { font-size: 14px; margin-top: 5px; }
                .company-info { margin-bottom: 15px; }
                .company-name { font-size: 16px; font-weight: bold; }
                .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
                .info-box { border: 1px solid #ccc; padding: 10px; }
                .info-box h4 { font-size: 11px; font-weight: bold; margin-bottom: 5px; background: #f0f0f0; padding: 3px 5px; }
                .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
                .info-label { color: #666; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .items-table th, .items-table td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
                .items-table th { background: #f0f0f0; font-weight: bold; font-size: 10px; }
                .items-table td { font-size: 10px; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .totals { margin-left: auto; width: 300px; }
                .totals-row { display: flex; justify-content: space-between; padding: 4px 8px; border: 1px solid #ccc; border-top: none; }
                .totals-row:first-child { border-top: 1px solid #ccc; }
                .totals-row.total { font-weight: bold; background: #f0f0f0; }
                .amount-words { background: #f9f9f9; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; }
                .reason-box { background: #fff8f8; padding: 10px; margin-bottom: 15px; border: 1px solid #dc2626; }
                .reason-box h4 { color: #dc2626; }
                .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; }
                .signature-box { text-align: center; padding-top: 40px; border-top: 1px solid #333; }
                .footer { margin-top: 20px; font-size: 9px; color: #666; text-align: center; }
                @media print {
                  .no-print { display: none; }
                  body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
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
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <>
      <div className="mb-4 flex justify-end no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
        >
          <span>🖨️</span> Print Debit Note
        </button>
      </div>

      <div ref={printRef} className="bg-white p-6 max-w-4xl mx-auto shadow-lg">
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-3 mb-4">
          <h1 className="text-2xl font-bold text-red-600">DEBIT NOTE</h1>
          <p className="text-sm text-gray-600">(Under Section 34 of CGST/SGST Act)</p>
        </div>

        {/* Company Info */}
        <div className="mb-4">
          <h2 className="text-lg font-bold">{data.seller.name}</h2>
          <p className="text-sm text-gray-600">
            {data.seller.address}, {data.seller.city}, {data.seller.state} - {data.seller.pincode}
          </p>
          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
            <p><span className="text-gray-500">GSTIN:</span> <strong>{data.seller.gstin}</strong></p>
            <p><span className="text-gray-500">Phone:</span> {data.seller.phone}</p>
            <p><span className="text-gray-500">Email:</span> {data.seller.email}</p>
          </div>
        </div>

        {/* Document & Party Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Debit Note Details */}
          <div className="border border-gray-300 p-3">
            <h4 className="text-xs font-bold bg-gray-100 -mx-3 -mt-3 px-3 py-2 mb-2">DEBIT NOTE DETAILS</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Debit Note No:</span>
                <strong>{data.debit_note_number}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Debit Note Date:</span>
                <span>{data.debit_note_date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Original Invoice No:</span>
                <span>{data.original_invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Original Invoice Date:</span>
                <span>{data.original_invoice_date}</span>
              </div>
            </div>
          </div>

          {/* Buyer Details */}
          <div className="border border-gray-300 p-3">
            <h4 className="text-xs font-bold bg-gray-100 -mx-3 -mt-3 px-3 py-2 mb-2">BUYER DETAILS</h4>
            <div className="text-sm">
              <p className="font-bold">{data.buyer.name}</p>
              <p className="text-gray-600">
                {data.buyer.address}, {data.buyer.city}, {data.buyer.state} - {data.buyer.pincode}
              </p>
              {data.buyer.gstin && (
                <p><span className="text-gray-500">GSTIN:</span> <strong>{data.buyer.gstin}</strong></p>
              )}
              <p><span className="text-gray-500">State Code:</span> {data.buyer.state_code}</p>
              <p><span className="text-gray-500">Phone:</span> {data.buyer.phone}</p>
            </div>
          </div>
        </div>

        {/* Reason for Debit Note */}
        <div className="border border-red-300 bg-red-50 p-3 mb-4">
          <h4 className="text-xs font-bold text-red-700 mb-1">REASON FOR DEBIT NOTE</h4>
          <p className="text-sm">{data.reason}</p>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-4 text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">S.No</th>
              <th className="border border-gray-300 p-2 text-left">Description</th>
              <th className="border border-gray-300 p-2 text-center">HSN</th>
              <th className="border border-gray-300 p-2 text-center">Qty</th>
              <th className="border border-gray-300 p-2 text-right">Rate</th>
              <th className="border border-gray-300 p-2 text-right">Taxable</th>
              {data.is_inter_state ? (
                <>
                  <th className="border border-gray-300 p-2 text-center">IGST %</th>
                  <th className="border border-gray-300 p-2 text-right">IGST</th>
                </>
              ) : (
                <>
                  <th className="border border-gray-300 p-2 text-center">CGST %</th>
                  <th className="border border-gray-300 p-2 text-right">CGST</th>
                  <th className="border border-gray-300 p-2 text-center">SGST %</th>
                  <th className="border border-gray-300 p-2 text-right">SGST</th>
                </>
              )}
              <th className="border border-gray-300 p-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index}>
                <td className="border border-gray-300 p-2 text-center">{item.sno}</td>
                <td className="border border-gray-300 p-2">{item.description}</td>
                <td className="border border-gray-300 p-2 text-center">{item.hsn_code}</td>
                <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.rate)}</td>
                <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.taxable_value)}</td>
                {data.is_inter_state ? (
                  <>
                    <td className="border border-gray-300 p-2 text-center">{item.igst_rate}%</td>
                    <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.igst_amount)}</td>
                  </>
                ) : (
                  <>
                    <td className="border border-gray-300 p-2 text-center">{item.cgst_rate}%</td>
                    <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.cgst_amount)}</td>
                    <td className="border border-gray-300 p-2 text-center">{item.sgst_rate}%</td>
                    <td className="border border-gray-300 p-2 text-right">{formatCurrency(item.sgst_amount)}</td>
                  </>
                )}
                <td className="border border-gray-300 p-2 text-right font-medium">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-4">
          <div className="w-72">
            <div className="flex justify-between border border-gray-300 p-2 text-sm">
              <span>Sub Total</span>
              <span>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.is_inter_state ? (
              <div className="flex justify-between border border-gray-300 border-t-0 p-2 text-sm">
                <span>IGST</span>
                <span>{formatCurrency(data.igst_total)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between border border-gray-300 border-t-0 p-2 text-sm">
                  <span>CGST</span>
                  <span>{formatCurrency(data.cgst_total)}</span>
                </div>
                <div className="flex justify-between border border-gray-300 border-t-0 p-2 text-sm">
                  <span>SGST</span>
                  <span>{formatCurrency(data.sgst_total)}</span>
                </div>
              </>
            )}
            {data.round_off !== 0 && (
              <div className="flex justify-between border border-gray-300 border-t-0 p-2 text-sm">
                <span>Round Off</span>
                <span>{data.round_off > 0 ? '+' : ''}{formatCurrency(data.round_off)}</span>
              </div>
            )}
            <div className="flex justify-between border border-gray-300 border-t-0 p-2 bg-red-100 font-bold">
              <span>Total Amount</span>
              <span>₹ {formatCurrency(data.grand_total)}</span>
            </div>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="bg-gray-50 border border-gray-300 p-3 mb-4">
          <p className="text-sm">
            <span className="text-gray-500">Amount in Words:</span>{' '}
            <strong>{data.amount_in_words}</strong>
          </p>
        </div>

        {/* Terms */}
        {data.terms && data.terms.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold mb-2">Terms & Conditions:</h4>
            <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1">
              {data.terms.map((term, index) => (
                <li key={index}>{term}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 mt-12">
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-xs text-gray-500">Prepared By</p>
              <p className="text-sm font-medium">{data.prepared_by || '_____________'}</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 pt-2">
              <p className="text-xs text-gray-500">For {data.seller.name}</p>
              <p className="text-sm font-medium">Authorised Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-3 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            This is a computer generated document. Subject to realization of payment.
          </p>
        </div>
      </div>
    </>
  );
};

// Demo component with sample data
export const DebitNoteDemo: React.FC = () => {
  const sampleData: DebitNoteData = {
    debit_note_number: 'DN/2024/0025',
    debit_note_date: '21 Feb 2024',
    original_invoice_number: 'INV/2024/1523',
    original_invoice_date: '15 Feb 2024',
    seller: {
      name: 'VisionCare Opticals Pvt. Ltd.',
      address: '123, MG Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      state_code: '27',
      pincode: '400053',
      gstin: '27AABCV1234A1Z5',
      pan: 'AABCV1234A',
      phone: '022-26789012',
      email: 'accounts@visioncare.com'
    },
    buyer: {
      name: 'Ramesh Optical House',
      address: '456, Station Road',
      city: 'Pune',
      state: 'Maharashtra',
      state_code: '27',
      pincode: '411001',
      gstin: '27AAGCR5678B1Z2',
      phone: '020-24561234'
    },
    items: [
      {
        sno: 1,
        description: 'Price Difference - Ray-Ban Wayfarer (RB2140)',
        hsn_code: '9004',
        quantity: 5,
        rate: 500,
        taxable_value: 2500,
        cgst_rate: 9,
        cgst_amount: 225,
        sgst_rate: 9,
        sgst_amount: 225,
        igst_rate: 0,
        igst_amount: 0,
        total: 2950
      },
      {
        sno: 2,
        description: 'Freight Charges - Additional Shipment',
        hsn_code: '996511',
        quantity: 1,
        rate: 800,
        taxable_value: 800,
        cgst_rate: 9,
        cgst_amount: 72,
        sgst_rate: 9,
        sgst_amount: 72,
        igst_rate: 0,
        igst_amount: 0,
        total: 944
      }
    ],
    reason: 'Price revision as per revised rate contract dated 20-Feb-2024 and additional freight charges for expedited delivery.',
    subtotal: 3300,
    cgst_total: 297,
    sgst_total: 297,
    igst_total: 0,
    round_off: 0.06,
    grand_total: 3894,
    amount_in_words: 'Rupees Three Thousand Eight Hundred Ninety Four Only',
    is_inter_state: false,
    terms: [
      'This debit note is issued as per GST regulations',
      'Please adjust this amount in your books accordingly',
      'Payment to be adjusted against next invoice'
    ],
    prepared_by: 'Accounts Team'
  };

  return <DebitNote data={sampleData} />;
};
