// ============================================================================
// IMS 2.0 - Delivery Challan Component
// ============================================================================
// Printable delivery challan for stock transfers and job deliveries

import { useRef } from 'react';
import { Printer, X, Truck } from 'lucide-react';

// Challan Types
interface ChallanItem {
  slNo: number;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  remarks?: string;
}

interface ChallanData {
  // Challan Details
  challanNo: string;
  challanDate: string;
  challanType: 'STOCK_TRANSFER' | 'JOB_WORK' | 'SAMPLE' | 'CUSTOMER_DELIVERY';

  // From
  from: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
    phone: string;
  };

  // To
  to: {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin?: string;
    phone: string;
    contactPerson?: string;
  };

  // Items
  items: ChallanItem[];

  // Transport
  transportMode: string;
  vehicleNo?: string;
  driverName?: string;
  driverPhone?: string;
  ewayBillNo?: string;

  // Additional
  reason: string;
  notes?: string;
  expectedReturn?: string; // For job work
}

interface DeliveryChallanProps {
  data: ChallanData;
  onClose: () => void;
}

export function DeliveryChallan({ data, onClose }: DeliveryChallanProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const challanTypeLabels = {
    STOCK_TRANSFER: 'Stock Transfer',
    JOB_WORK: 'Job Work',
    SAMPLE: 'Sample/Exhibition',
    CUSTOMER_DELIVERY: 'Customer Delivery',
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Delivery Challan - ${data.challanNo}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .challan { max-width: 210mm; margin: 0 auto; padding: 10mm; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 15px; }
            .company-name { font-size: 18px; font-weight: bold; }
            .challan-title { font-size: 14px; font-weight: bold; margin-top: 5px; background: #f0f0f0; padding: 5px; }
            .challan-type { display: inline-block; padding: 3px 10px; background: #000; color: #fff; font-size: 11px; margin-top: 5px; }
            .details-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; }
            .details-box { border: 1px solid #ddd; padding: 10px; }
            .details-box h4 { font-size: 11px; font-weight: bold; margin-bottom: 8px; background: #f5f5f5; padding: 3px; margin: -10px -10px 8px -10px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #000; padding: 8px; }
            th { background: #f0f0f0; font-weight: bold; text-align: center; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .footer { margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
            .signature-box { text-align: center; }
            .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }
            .transport-info { background: #f9f9f9; padding: 10px; border: 1px solid #ddd; margin-bottom: 15px; }
            .note { font-size: 10px; color: #666; margin-top: 15px; padding-top: 10px; border-top: 1px dashed #ccc; }
            @media print {
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
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-bv-red-600" />
            <h2 className="text-lg font-semibold">Delivery Challan</h2>
          </div>
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

        {/* Challan Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div ref={printRef} className="challan bg-white">
            {/* Header */}
            <div className="header text-center border-b-2 border-black pb-3 mb-4">
              <div className="company-name text-xl font-bold">{data.from.name}</div>
              <div className="text-sm text-gray-600">
                {data.from.address}, {data.from.city}, {data.from.state} - {data.from.pincode}
              </div>
              <div className="text-sm">
                Phone: {data.from.phone} | GSTIN: {data.from.gstin}
              </div>
              <div className="challan-title text-base font-bold mt-3 bg-gray-100 py-2">
                DELIVERY CHALLAN
              </div>
              <div className="inline-block mt-2 px-3 py-1 bg-black text-white text-xs uppercase">
                {challanTypeLabels[data.challanType]}
              </div>
            </div>

            {/* Details Grid */}
            <div className="details-grid grid grid-cols-3 gap-4 mb-4">
              {/* Challan Details */}
              <div className="details-box border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm -mx-3 -mt-3 px-3 pt-2">
                  Challan Details
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Challan No:</span> <span className="font-medium">{data.challanNo}</span></p>
                  <p><span className="text-gray-600">Date:</span> <span className="font-medium">{data.challanDate}</span></p>
                  <p><span className="text-gray-600">Reason:</span> <span className="font-medium">{data.reason}</span></p>
                  {data.expectedReturn && (
                    <p><span className="text-gray-600">Expected Return:</span> <span className="font-medium">{data.expectedReturn}</span></p>
                  )}
                </div>
              </div>

              {/* From */}
              <div className="details-box border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm -mx-3 -mt-3 px-3 pt-2">
                  Consignor (From)
                </h4>
                <div className="text-sm">
                  <p className="font-medium">{data.from.name}</p>
                  <p className="text-gray-600">{data.from.address}</p>
                  <p className="text-gray-600">{data.from.city}, {data.from.state}</p>
                  <p className="text-gray-600">{data.from.pincode}</p>
                  <p className="font-medium mt-1">GSTIN: {data.from.gstin}</p>
                </div>
              </div>

              {/* To */}
              <div className="details-box border rounded p-3">
                <h4 className="font-semibold bg-gray-100 p-1 mb-2 text-sm -mx-3 -mt-3 px-3 pt-2">
                  Consignee (To)
                </h4>
                <div className="text-sm">
                  <p className="font-medium">{data.to.name}</p>
                  {data.to.contactPerson && (
                    <p className="text-gray-600">Attn: {data.to.contactPerson}</p>
                  )}
                  <p className="text-gray-600">{data.to.address}</p>
                  <p className="text-gray-600">{data.to.city}, {data.to.state}</p>
                  <p className="text-gray-600">{data.to.pincode}</p>
                  <p className="text-gray-600">Phone: {data.to.phone}</p>
                  {data.to.gstin && <p className="font-medium mt-1">GSTIN: {data.to.gstin}</p>}
                </div>
              </div>
            </div>

            {/* Transport Info */}
            <div className="transport-info bg-gray-50 p-3 border rounded mb-4">
              <h4 className="font-semibold text-sm mb-2">Transport Details</h4>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Mode:</span>
                  <span className="ml-1 font-medium">{data.transportMode}</span>
                </div>
                {data.vehicleNo && (
                  <div>
                    <span className="text-gray-600">Vehicle No:</span>
                    <span className="ml-1 font-medium">{data.vehicleNo}</span>
                  </div>
                )}
                {data.driverName && (
                  <div>
                    <span className="text-gray-600">Driver:</span>
                    <span className="ml-1 font-medium">{data.driverName}</span>
                  </div>
                )}
                {data.ewayBillNo && (
                  <div>
                    <span className="text-gray-600">E-Way Bill:</span>
                    <span className="ml-1 font-medium">{data.ewayBillNo}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse text-sm mb-4">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 w-12">Sl.</th>
                  <th className="border p-2 text-left">Description of Goods</th>
                  <th className="border p-2 w-24">HSN Code</th>
                  <th className="border p-2 w-20">Qty</th>
                  <th className="border p-2 w-16">Unit</th>
                  <th className="border p-2">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.slNo}>
                    <td className="border p-2 text-center">{item.slNo}</td>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2 text-center">{item.hsnCode}</td>
                    <td className="border p-2 text-center">{item.quantity}</td>
                    <td className="border p-2 text-center">{item.unit}</td>
                    <td className="border p-2 text-sm text-gray-600">{item.remarks || '-'}</td>
                  </tr>
                ))}
                {/* Empty rows for handwritten additions */}
                {[...Array(Math.max(0, 5 - data.items.length))].map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td className="border p-2 text-center">&nbsp;</td>
                    <td className="border p-2">&nbsp;</td>
                    <td className="border p-2">&nbsp;</td>
                    <td className="border p-2">&nbsp;</td>
                    <td className="border p-2">&nbsp;</td>
                    <td className="border p-2">&nbsp;</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="border p-2 text-center" colSpan={3}>Total Quantity</td>
                  <td className="border p-2 text-center">{data.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="border p-2 text-center">-</td>
                  <td className="border p-2">-</td>
                </tr>
              </tfoot>
            </table>

            {/* Notes */}
            {data.notes && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-4">
                <p className="text-sm"><span className="font-medium">Note:</span> {data.notes}</p>
              </div>
            )}

            {/* Footer with Signatures */}
            <div className="footer grid grid-cols-3 gap-8 mt-8">
              <div className="signature-box text-center">
                <p className="text-sm text-gray-600">Dispatched By</p>
                <div className="h-16"></div>
                <div className="border-t pt-2 text-sm">Name & Signature</div>
              </div>
              <div className="signature-box text-center">
                <p className="text-sm text-gray-600">Carrier/Driver</p>
                <div className="h-16"></div>
                <div className="border-t pt-2 text-sm">Name & Signature</div>
              </div>
              <div className="signature-box text-center">
                <p className="text-sm text-gray-600">Received By</p>
                <div className="h-16"></div>
                <div className="border-t pt-2 text-sm">Name, Signature & Date</div>
              </div>
            </div>

            {/* Note */}
            <div className="note text-xs text-gray-500 mt-6 pt-4 border-t border-dashed text-center">
              This challan is issued for movement of goods only and does not transfer ownership.
              Original goods or equivalent must be returned within the specified period for Job Work challans.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo Component
export function DeliveryChallanDemo() {
  const sampleData: ChallanData = {
    challanNo: 'DC-2026-00456',
    challanDate: '21-Jan-2026',
    challanType: 'STOCK_TRANSFER',
    from: {
      name: 'Brahma Vision - Mumbai Central',
      address: '123, Commercial Complex, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AABCU9603R1ZM',
      phone: '+91 22 1234 5678',
    },
    to: {
      name: 'Brahma Vision - Andheri',
      address: '456, Mall Road, Andheri West',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      gstin: '27AABCU9603R1ZM',
      phone: '+91 22 9876 5432',
      contactPerson: 'Vikram Singh',
    },
    items: [
      { slNo: 1, description: 'Ray-Ban Aviator RB3025 Gold', hsnCode: '9004', quantity: 5, unit: 'Pcs', remarks: 'Handle with care' },
      { slNo: 2, description: 'Oakley Holbrook Black', hsnCode: '9004', quantity: 3, unit: 'Pcs' },
      { slNo: 3, description: 'Titan Eyeplus Rectangle Frame', hsnCode: '9003', quantity: 10, unit: 'Pcs' },
    ],
    transportMode: 'Road',
    vehicleNo: 'MH-01-AB-1234',
    driverName: 'Ramesh Kumar',
    driverPhone: '+91 98765 11111',
    reason: 'Inter-store stock transfer as per request #TR-789',
    notes: 'Please verify quantity and condition before accepting.',
  };

  return <DeliveryChallan data={sampleData} onClose={() => {}} />;
}

export default DeliveryChallan;
