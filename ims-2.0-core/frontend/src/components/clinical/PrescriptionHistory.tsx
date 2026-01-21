// ============================================================================
// IMS 2.0 - Prescription History Component
// ============================================================================
// Shows previous prescriptions for a customer with ability to compare and copy

import { useState } from 'react';
import {
  History,
  Eye,
  Calendar,
  User,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import clsx from 'clsx';

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

interface PrescriptionRecord {
  id: string;
  testDate: string;
  expiryDate: string;
  optometristName: string;
  source: 'TESTED_AT_STORE' | 'FROM_DOCTOR';
  doctorName?: string;
  rightEye: EyeData;
  leftEye: EyeData;
  lensRecommendation: string;
  coatingRecommendation: string;
  validityMonths: number;
  remarks: string;
  isExpired: boolean;
}

interface PrescriptionHistoryProps {
  customerId: string;
  customerName: string;
  prescriptions: PrescriptionRecord[];
  onCopyPrescription: (prescription: PrescriptionRecord) => void;
  onClose: () => void;
}

function formatPower(value: string | null | undefined): string {
  if (!value) return '-';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2);
}

function PrescriptionCard({
  prescription,
  isExpanded,
  onToggle,
  onCopy,
}: {
  prescription: PrescriptionRecord;
  isExpanded: boolean;
  onToggle: () => void;
  onCopy: () => void;
}) {
  const testDate = new Date(prescription.testDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const expiryDate = new Date(prescription.expiryDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={clsx(
        'border rounded-lg overflow-hidden transition-colors',
        prescription.isExpired ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-white'
      )}
    >
      {/* Header */}
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center',
            prescription.isExpired ? 'bg-gray-100' : 'bg-green-100'
          )}>
            <Eye className={clsx(
              'w-5 h-5',
              prescription.isExpired ? 'text-gray-500' : 'text-green-600'
            )} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{testDate}</span>
              {prescription.isExpired ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Expired
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Valid until {expiryDate}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {prescription.source === 'TESTED_AT_STORE'
                ? `By ${prescription.optometristName}`
                : `From Dr. ${prescription.doctorName}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-2 text-bv-red-600 hover:bg-bv-red-50 rounded-lg transition-colors"
            title="Copy to new prescription"
          >
            <Copy className="w-4 h-4" />
          </button>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  R
                </div>
                <span className="text-sm font-medium text-gray-700">Right Eye (OD)</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">SPH/CYL×AXIS</span>
                  <span className="font-mono">
                    {formatPower(prescription.rightEye.sphere)} / {formatPower(prescription.rightEye.cylinder)} × {prescription.rightEye.axis || '-'}
                  </span>
                </div>
                {prescription.rightEye.add && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ADD</span>
                    <span className="font-mono">{formatPower(prescription.rightEye.add)}</span>
                  </div>
                )}
                {prescription.rightEye.prism && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PRISM</span>
                    <span className="font-mono">{prescription.rightEye.prism} {prescription.rightEye.base}</span>
                  </div>
                )}
                {prescription.rightEye.acuity && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">VA</span>
                    <span className="font-mono">{prescription.rightEye.acuity}</span>
                  </div>
                )}
                {prescription.rightEye.pd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PD</span>
                    <span className="font-mono">{prescription.rightEye.pd} mm</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  L
                </div>
                <span className="text-sm font-medium text-gray-700">Left Eye (OS)</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">SPH/CYL×AXIS</span>
                  <span className="font-mono">
                    {formatPower(prescription.leftEye.sphere)} / {formatPower(prescription.leftEye.cylinder)} × {prescription.leftEye.axis || '-'}
                  </span>
                </div>
                {prescription.leftEye.add && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">ADD</span>
                    <span className="font-mono">{formatPower(prescription.leftEye.add)}</span>
                  </div>
                )}
                {prescription.leftEye.prism && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PRISM</span>
                    <span className="font-mono">{prescription.leftEye.prism} {prescription.leftEye.base}</span>
                  </div>
                )}
                {prescription.leftEye.acuity && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">VA</span>
                    <span className="font-mono">{prescription.leftEye.acuity}</span>
                  </div>
                )}
                {prescription.leftEye.pd && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">PD</span>
                    <span className="font-mono">{prescription.leftEye.pd} mm</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {prescription.lensRecommendation && (
              <div>
                <span className="text-gray-500">Lens: </span>
                <span className="font-medium">{prescription.lensRecommendation}</span>
              </div>
            )}
            {prescription.coatingRecommendation && (
              <div>
                <span className="text-gray-500">Coating: </span>
                <span className="font-medium">{prescription.coatingRecommendation}</span>
              </div>
            )}
          </div>

          {/* Remarks */}
          {prescription.remarks && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <span className="text-gray-500">Notes: </span>
              <span className="text-gray-700">{prescription.remarks}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PrescriptionHistory({
  customerId,
  customerName,
  prescriptions,
  onCopyPrescription,
  onClose,
}: PrescriptionHistoryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    prescriptions.length > 0 ? prescriptions[0].id : null
  );

  const validCount = prescriptions.filter(p => !p.isExpired).length;
  const expiredCount = prescriptions.filter(p => p.isExpired).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <History className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Prescription History</h2>
                <p className="text-sm text-gray-500">{customerName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Summary */}
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              {prescriptions.length} prescription(s)
            </span>
            {validCount > 0 && (
              <span className="text-green-600">{validCount} valid</span>
            )}
            {expiredCount > 0 && (
              <span className="text-red-600">{expiredCount} expired</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No previous prescriptions found</p>
            </div>
          ) : (
            prescriptions.map(prescription => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                isExpanded={expandedId === prescription.id}
                onToggle={() => setExpandedId(
                  expandedId === prescription.id ? null : prescription.id
                )}
                onCopy={() => onCopyPrescription(prescription)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button onClick={onClose} className="btn-outline w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionHistory;
