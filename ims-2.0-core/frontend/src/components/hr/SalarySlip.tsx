// ============================================================================
// IMS 2.0 - Salary Slip Component
// ============================================================================
// Printable salary slip for employees with full earnings/deductions breakdown

import { useState, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  User,
  Calendar,
  IndianRupee,
  FileText,
} from 'lucide-react';
import clsx from 'clsx';

interface SalarySlipData {
  // Employee Info
  employeeId: string;
  employeeName: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  panNumber: string;
  bankAccount: string;
  bankName: string;
  uanNumber: string;

  // Pay Period
  month: string;
  year: number;
  payDate: string;
  workingDays: number;
  daysWorked: number;
  lopDays: number;

  // Earnings
  basicSalary: number;
  hra: number;
  conveyanceAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  otherAllowances: number;
  incentives: number;
  overtimePay: number;
  arrears: number;

  // Deductions
  providentFund: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  loanRecovery: number;
  otherDeductions: number;
  lopDeduction: number;

  // Company Info
  companyName: string;
  companyAddress: string;
  companyLogo?: string;
}

interface SalarySlipProps {
  data: SalarySlipData;
  onClose: () => void;
}

export function SalarySlip({ data, onClose }: SalarySlipProps) {
  const printRef = useRef<HTMLDivElement>(null);

  // Calculate totals
  const grossEarnings =
    data.basicSalary +
    data.hra +
    data.conveyanceAllowance +
    data.medicalAllowance +
    data.specialAllowance +
    data.otherAllowances +
    data.incentives +
    data.overtimePay +
    data.arrears;

  const totalDeductions =
    data.providentFund +
    data.esi +
    data.professionalTax +
    data.incomeTax +
    data.loanRecovery +
    data.otherDeductions +
    data.lopDeduction;

  const netPay = grossEarnings - totalDeductions;

  // Convert number to words
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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Salary Slip - ${data.employeeName} - ${data.month} ${data.year}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; }
            .slip-container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 15px; }
            .company-name { font-size: 20px; font-weight: bold; color: #c41e3a; }
            .company-address { font-size: 11px; color: #666; margin-top: 5px; }
            .slip-title { font-size: 16px; font-weight: bold; margin-top: 10px; background: #f5f5f5; padding: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
            .info-section { border: 1px solid #ddd; padding: 10px; }
            .info-section h3 { font-size: 12px; font-weight: bold; color: #333; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .info-label { color: #666; }
            .info-value { font-weight: 500; }
            .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin-bottom: 20px; }
            .column { border: 1px solid #ddd; }
            .column-header { background: #f5f5f5; padding: 8px; font-weight: bold; text-align: center; border-bottom: 1px solid #ddd; }
            .column-row { display: flex; justify-content: space-between; padding: 6px 10px; border-bottom: 1px solid #eee; }
            .column-row:last-child { border-bottom: none; }
            .column-total { background: #f9f9f9; font-weight: bold; }
            .net-pay { background: #c41e3a; color: white; padding: 15px; text-align: center; margin-bottom: 15px; }
            .net-pay-amount { font-size: 24px; font-weight: bold; }
            .net-pay-words { font-size: 11px; margin-top: 5px; font-style: italic; }
            .footer { border-top: 1px solid #ddd; padding-top: 15px; margin-top: 20px; }
            .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
            .signature-block { text-align: center; width: 150px; }
            .signature-line { border-top: 1px solid #333; padding-top: 5px; }
            .disclaimer { font-size: 10px; color: #666; text-align: center; margin-top: 20px; }
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-bv-red-600" />
            <h2 className="text-lg font-semibold">Salary Slip</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef} className="slip-container bg-white">
            {/* Header */}
            <div className="header text-center border-b-2 border-gray-800 pb-4 mb-4">
              <div className="company-name text-xl font-bold text-bv-red-600">
                {data.companyName}
              </div>
              <div className="company-address text-sm text-gray-500 mt-1">
                {data.companyAddress}
              </div>
              <div className="slip-title text-base font-bold mt-3 bg-gray-100 py-2">
                SALARY SLIP FOR {data.month.toUpperCase()} {data.year}
              </div>
            </div>

            {/* Employee & Pay Period Info */}
            <div className="info-grid grid grid-cols-2 gap-4 mb-6">
              {/* Employee Details */}
              <div className="info-section border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                  <User className="w-4 h-4" />
                  Employee Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Employee ID:</span>
                    <span className="font-medium">{data.employeeId}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Name:</span>
                    <span className="font-medium">{data.employeeName}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Designation:</span>
                    <span className="font-medium">{data.designation}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Department:</span>
                    <span className="font-medium">{data.department}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Date of Joining:</span>
                    <span className="font-medium">{data.dateOfJoining}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">PAN:</span>
                    <span className="font-medium">{data.panNumber}</span>
                  </div>
                </div>
              </div>

              {/* Pay Period & Bank Details */}
              <div className="info-section border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 border-b pb-2 mb-3">
                  <Calendar className="w-4 h-4" />
                  Pay Period & Bank Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Pay Date:</span>
                    <span className="font-medium">{data.payDate}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Working Days:</span>
                    <span className="font-medium">{data.workingDays}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Days Worked:</span>
                    <span className="font-medium">{data.daysWorked}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">LOP Days:</span>
                    <span className="font-medium text-red-600">{data.lopDays}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">Bank Account:</span>
                    <span className="font-medium">{data.bankAccount}</span>
                  </div>
                  <div className="info-row flex justify-between">
                    <span className="text-gray-500">UAN:</span>
                    <span className="font-medium">{data.uanNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Earnings & Deductions */}
            <div className="earnings-deductions grid grid-cols-2 gap-0 mb-6 border rounded-lg overflow-hidden">
              {/* Earnings Column */}
              <div className="column border-r">
                <div className="column-header bg-green-50 text-green-800 p-3 font-semibold text-center border-b">
                  EARNINGS
                </div>
                <div className="text-sm">
                  {data.basicSalary > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Basic Salary</span>
                      <span>{formatCurrency(data.basicSalary)}</span>
                    </div>
                  )}
                  {data.hra > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>House Rent Allowance (HRA)</span>
                      <span>{formatCurrency(data.hra)}</span>
                    </div>
                  )}
                  {data.conveyanceAllowance > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Conveyance Allowance</span>
                      <span>{formatCurrency(data.conveyanceAllowance)}</span>
                    </div>
                  )}
                  {data.medicalAllowance > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Medical Allowance</span>
                      <span>{formatCurrency(data.medicalAllowance)}</span>
                    </div>
                  )}
                  {data.specialAllowance > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Special Allowance</span>
                      <span>{formatCurrency(data.specialAllowance)}</span>
                    </div>
                  )}
                  {data.otherAllowances > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Other Allowances</span>
                      <span>{formatCurrency(data.otherAllowances)}</span>
                    </div>
                  )}
                  {data.incentives > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Incentives</span>
                      <span>{formatCurrency(data.incentives)}</span>
                    </div>
                  )}
                  {data.overtimePay > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Overtime Pay</span>
                      <span>{formatCurrency(data.overtimePay)}</span>
                    </div>
                  )}
                  {data.arrears > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Arrears</span>
                      <span>{formatCurrency(data.arrears)}</span>
                    </div>
                  )}
                  <div className="column-row column-total flex justify-between p-3 bg-green-50 font-semibold">
                    <span>Gross Earnings</span>
                    <span className="text-green-700">{formatCurrency(grossEarnings)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Column */}
              <div className="column">
                <div className="column-header bg-red-50 text-red-800 p-3 font-semibold text-center border-b">
                  DEDUCTIONS
                </div>
                <div className="text-sm">
                  {data.providentFund > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Provident Fund (PF)</span>
                      <span>{formatCurrency(data.providentFund)}</span>
                    </div>
                  )}
                  {data.esi > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>ESI</span>
                      <span>{formatCurrency(data.esi)}</span>
                    </div>
                  )}
                  {data.professionalTax > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Professional Tax</span>
                      <span>{formatCurrency(data.professionalTax)}</span>
                    </div>
                  )}
                  {data.incomeTax > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Income Tax (TDS)</span>
                      <span>{formatCurrency(data.incomeTax)}</span>
                    </div>
                  )}
                  {data.loanRecovery > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Loan Recovery</span>
                      <span>{formatCurrency(data.loanRecovery)}</span>
                    </div>
                  )}
                  {data.otherDeductions > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>Other Deductions</span>
                      <span>{formatCurrency(data.otherDeductions)}</span>
                    </div>
                  )}
                  {data.lopDeduction > 0 && (
                    <div className="column-row flex justify-between p-3 border-b">
                      <span>LOP Deduction ({data.lopDays} days)</span>
                      <span>{formatCurrency(data.lopDeduction)}</span>
                    </div>
                  )}
                  <div className="column-row column-total flex justify-between p-3 bg-red-50 font-semibold">
                    <span>Total Deductions</span>
                    <span className="text-red-700">{formatCurrency(totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay */}
            <div className="net-pay bg-bv-red-600 text-white p-4 rounded-lg text-center mb-6">
              <div className="text-sm uppercase tracking-wide mb-1">Net Pay</div>
              <div className="net-pay-amount text-3xl font-bold">
                {formatCurrency(netPay)}
              </div>
              <div className="net-pay-words text-xs mt-2 opacity-90 italic">
                {numberToWords(netPay)}
              </div>
            </div>

            {/* Footer */}
            <div className="footer border-t pt-4">
              {/* Signatures */}
              <div className="signatures flex justify-between mt-10">
                <div className="signature-block text-center w-40">
                  <div className="border-t border-gray-400 pt-2 text-sm">
                    Employee Signature
                  </div>
                </div>
                <div className="signature-block text-center w-40">
                  <div className="border-t border-gray-400 pt-2 text-sm">
                    HR Manager
                  </div>
                </div>
                <div className="signature-block text-center w-40">
                  <div className="border-t border-gray-400 pt-2 text-sm">
                    Authorized Signatory
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div className="disclaimer text-xs text-gray-500 text-center mt-6 pt-4 border-t">
                This is a computer-generated salary slip and does not require a signature.
                For any discrepancies, please contact HR within 7 days of receipt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo component for previewing
export function SalarySlipDemo() {
  const [showSlip, setShowSlip] = useState(false);

  const sampleData: SalarySlipData = {
    employeeId: 'EMP-001',
    employeeName: 'Rajesh Kumar',
    designation: 'Store Manager',
    department: 'Retail Operations',
    dateOfJoining: '15-Jan-2022',
    panNumber: 'ABCPK1234L',
    bankAccount: 'XXXX XXXX 1234',
    bankName: 'HDFC Bank',
    uanNumber: '100987654321',
    month: 'January',
    year: 2026,
    payDate: '01-Feb-2026',
    workingDays: 27,
    daysWorked: 25,
    lopDays: 2,
    basicSalary: 25000,
    hra: 10000,
    conveyanceAllowance: 2000,
    medicalAllowance: 1500,
    specialAllowance: 5000,
    otherAllowances: 1000,
    incentives: 3500,
    overtimePay: 0,
    arrears: 0,
    providentFund: 3000,
    esi: 750,
    professionalTax: 200,
    incomeTax: 2500,
    loanRecovery: 0,
    otherDeductions: 0,
    lopDeduction: 1852,
    companyName: 'Brahma Vision Pvt. Ltd.',
    companyAddress: '123, Commercial Complex, MG Road, Mumbai - 400001',
  };

  return (
    <div>
      <button
        onClick={() => setShowSlip(true)}
        className="flex items-center gap-2 px-4 py-2 bg-bv-red-600 text-white rounded-lg hover:bg-bv-red-700 transition-colors"
      >
        <FileText className="w-4 h-4" />
        View Salary Slip
      </button>

      {showSlip && (
        <SalarySlip data={sampleData} onClose={() => setShowSlip(false)} />
      )}
    </div>
  );
}

export default SalarySlip;
