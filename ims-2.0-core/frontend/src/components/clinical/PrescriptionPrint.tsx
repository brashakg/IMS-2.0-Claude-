// ============================================================================
// IMS 2.0 - Prescription Print Component
// ============================================================================
// Printable prescription format following standard optometry conventions

import { forwardRef } from 'react';
import { Eye, Phone, MapPin, Calendar } from 'lucide-react';

interface EyeData {
  sphere: string;
  cylinder: string;
  axis: string;
  add: string;
  pd: string;
  prism: string;
  base: string;
  acuity: string;
}

interface PrescriptionPrintProps {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeGSTIN?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  prescriptionId: string;
  testDate: string;
  expiryDate: string;
  optometristName: string;
  optometristRegNo?: string;
  rightEye: EyeData;
  leftEye: EyeData;
  totalPD?: string;
  lensRecommendation?: string;
  coatingRecommendation?: string;
  remarks?: string;
}

function formatPower(value: string | null | undefined): string {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (num === 0) return 'Plano';
  return num > 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

export const PrescriptionPrint = forwardRef<HTMLDivElement, PrescriptionPrintProps>(
  function PrescriptionPrint(
    {
      storeName,
      storeAddress,
      storePhone,
      storeGSTIN,
      patientName,
      patientPhone,
      patientAge,
      prescriptionId,
      testDate,
      expiryDate,
      optometristName,
      optometristRegNo,
      rightEye,
      leftEye,
      totalPD,
      lensRecommendation,
      coatingRecommendation,
      remarks,
    },
    ref
  ) {
    const formattedTestDate = new Date(testDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const formattedExpiryDate = new Date(expiryDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="bg-white p-8 max-w-[210mm] mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
          <p className="text-sm text-gray-600 mt-1">{storeAddress}</p>
          <p className="text-sm text-gray-600">Phone: {storePhone}</p>
          {storeGSTIN && (
            <p className="text-xs text-gray-500 mt-1">GSTIN: {storeGSTIN}</p>
          )}
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Eye className="w-6 h-6" />
            SPECTACLE PRESCRIPTION
          </h2>
          <p className="text-sm text-gray-500">Rx No: {prescriptionId}</p>
        </div>

        {/* Patient Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Patient Name</p>
            <p className="font-semibold text-gray-900">{patientName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-semibold text-gray-900">{patientPhone}</p>
          </div>
          {patientAge && (
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-semibold text-gray-900">{patientAge} years</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Test Date</p>
            <p className="font-semibold text-gray-900">{formattedTestDate}</p>
          </div>
        </div>

        {/* Prescription Table */}
        <div className="mb-6">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Eye</th>
                <th className="border border-gray-300 p-2 text-center">SPH</th>
                <th className="border border-gray-300 p-2 text-center">CYL</th>
                <th className="border border-gray-300 p-2 text-center">AXIS</th>
                <th className="border border-gray-300 p-2 text-center">ADD</th>
                <th className="border border-gray-300 p-2 text-center">PRISM</th>
                <th className="border border-gray-300 p-2 text-center">BASE</th>
                <th className="border border-gray-300 p-2 text-center">VA</th>
                <th className="border border-gray-300 p-2 text-center">PD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium bg-red-50">
                  <span className="flex items-center gap-1">
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">R</span>
                    OD (Right)
                  </span>
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(rightEye.sphere)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(rightEye.cylinder)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {rightEye.axis || '-'}°
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(rightEye.add)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {rightEye.prism || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {rightEye.base || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {rightEye.acuity || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {rightEye.pd ? `${rightEye.pd}mm` : '-'}
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-medium bg-blue-50">
                  <span className="flex items-center gap-1">
                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">L</span>
                    OS (Left)
                  </span>
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(leftEye.sphere)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(leftEye.cylinder)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {leftEye.axis || '-'}°
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {formatPower(leftEye.add)}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {leftEye.prism || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {leftEye.base || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {leftEye.acuity || '-'}
                </td>
                <td className="border border-gray-300 p-2 text-center font-mono">
                  {leftEye.pd ? `${leftEye.pd}mm` : '-'}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total PD */}
          {totalPD && (
            <p className="mt-2 text-sm">
              <span className="text-gray-500">Total PD: </span>
              <span className="font-mono font-medium">{totalPD}mm</span>
            </p>
          )}
        </div>

        {/* Recommendations */}
        {(lensRecommendation || coatingRecommendation) && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Recommendations</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {lensRecommendation && (
                <div>
                  <span className="text-gray-500">Lens Type: </span>
                  <span className="font-medium">{lensRecommendation}</span>
                </div>
              )}
              {coatingRecommendation && (
                <div>
                  <span className="text-gray-500">Coating: </span>
                  <span className="font-medium">{coatingRecommendation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Remarks */}
        {remarks && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-1">Clinical Notes</h3>
            <p className="text-sm text-gray-700">{remarks}</p>
          </div>
        )}

        {/* Validity Notice */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-800">
            <Calendar className="w-4 h-4 inline mr-1" />
            This prescription is valid until <strong>{formattedExpiryDate}</strong>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300">
          <div className="flex justify-between items-end">
            <div className="text-sm text-gray-600">
              <p>Tested by:</p>
              <p className="font-semibold text-gray-900">{optometristName}</p>
              {optometristRegNo && (
                <p className="text-xs">Reg. No: {optometristRegNo}</p>
              )}
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-gray-400 mb-1"></div>
              <p className="text-xs text-gray-500">Optometrist Signature</p>
            </div>
          </div>
        </div>

        {/* Print-only Footer */}
        <div className="mt-8 text-center text-xs text-gray-400 print:block hidden">
          <p>Thank you for choosing {storeName}</p>
          <p>For queries, call: {storePhone}</p>
        </div>
      </div>
    );
  }
);

export default PrescriptionPrint;
