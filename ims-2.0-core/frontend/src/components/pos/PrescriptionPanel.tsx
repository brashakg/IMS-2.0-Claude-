// ============================================================================
// IMS 2.0 - Inline Prescription Panel for POS
// ============================================================================
// Displays prescription details directly on POS with Copy R→L functionality
// Includes prescription axis validation (1-180, whole numbers only)

import { useState, useCallback } from 'react';
import { Copy, Eye, Plus, FileText, ArrowRight, AlertCircle } from 'lucide-react';
import type { Prescription, EyePower } from '../../types';
import clsx from 'clsx';
import {
  validateAxisRealtime,
  sanitizeAxisInput,
  getAxisInputHint,
} from '../../utils/prescriptionValidation';

interface PrescriptionPanelProps {
  prescription: Prescription | null;
  onPrescriptionChange: (prescription: Prescription) => void;
  onOpenModal: () => void;
  patientName?: string;
  compact?: boolean;
}

interface EyeFieldValue {
  sphere: string;
  cylinder: string;
  axis: string;
  add: string;
  pd: string;
}

const defaultEye: EyeFieldValue = {
  sphere: '',
  cylinder: '',
  axis: '',
  add: '',
  pd: '',
};

export function PrescriptionPanel({
  prescription,
  onPrescriptionChange,
  onOpenModal,
  patientName,
  compact = false,
}: PrescriptionPanelProps) {
  // Local state for inline editing
  const [isEditing, setIsEditing] = useState(!prescription);
  const [rightEye, setRightEye] = useState<EyeFieldValue>(
    prescription
      ? {
          sphere: prescription.rightEye.sphere?.toString() || '',
          cylinder: prescription.rightEye.cylinder?.toString() || '',
          axis: prescription.rightEye.axis?.toString() || '',
          add: prescription.rightEye.add?.toString() || '',
          pd: prescription.rightEye.pd?.toString() || '',
        }
      : defaultEye
  );
  const [leftEye, setLeftEye] = useState<EyeFieldValue>(
    prescription
      ? {
          sphere: prescription.leftEye.sphere?.toString() || '',
          cylinder: prescription.leftEye.cylinder?.toString() || '',
          axis: prescription.leftEye.axis?.toString() || '',
          add: prescription.leftEye.add?.toString() || '',
          pd: prescription.leftEye.pd?.toString() || '',
        }
      : defaultEye
  );

  // Axis validation state
  const [rightAxisError, setRightAxisError] = useState<string | undefined>();
  const [leftAxisError, setLeftAxisError] = useState<string | undefined>();

  // Copy Right eye values to Left eye
  const handleCopyRightToLeft = useCallback(() => {
    setLeftEye({ ...rightEye });
  }, [rightEye]);

  // Update right eye field with axis validation
  const updateRightEye = (field: keyof EyeFieldValue, value: string) => {
    setRightEye(prev => ({ ...prev, [field]: value }));

    // Validate axis in real-time
    if (field === 'axis') {
      const cylinderValue = rightEye.cylinder ? parseFloat(rightEye.cylinder) : null;
      const validation = validateAxisRealtime(value, cylinderValue);

      if (!validation.isValid && value !== '') {
        setRightAxisError(validation.error);
      } else {
        setRightAxisError(undefined);
      }
    }

    // Clear axis error if cylinder is changed/cleared
    if (field === 'cylinder') {
      setRightAxisError(undefined);
    }
  };

  // Update left eye field with axis validation
  const updateLeftEye = (field: keyof EyeFieldValue, value: string) => {
    setLeftEye(prev => ({ ...prev, [field]: value }));

    // Validate axis in real-time
    if (field === 'axis') {
      const cylinderValue = leftEye.cylinder ? parseFloat(leftEye.cylinder) : null;
      const validation = validateAxisRealtime(value, cylinderValue);

      if (!validation.isValid && value !== '') {
        setLeftAxisError(validation.error);
      } else {
        setLeftAxisError(undefined);
      }
    }

    // Clear axis error if cylinder is changed/cleared
    if (field === 'cylinder') {
      setLeftAxisError(undefined);
    }
  };

  // Save prescription changes
  const handleSave = useCallback(() => {
    const newPrescription: Prescription = {
      id: prescription?.id || `rx-${Date.now()}`,
      patientId: prescription?.patientId || '',
      customerId: prescription?.customerId || '',
      storeId: prescription?.storeId || '',
      testDate: prescription?.testDate || new Date().toISOString().split('T')[0],
      rightEye: {
        sphere: parseFloat(rightEye.sphere) || 0,
        cylinder: rightEye.cylinder ? parseFloat(rightEye.cylinder) : null,
        axis: rightEye.axis ? parseInt(rightEye.axis) : null,
        add: rightEye.add ? parseFloat(rightEye.add) : null,
        pd: parseFloat(rightEye.pd) || 32,
      },
      leftEye: {
        sphere: parseFloat(leftEye.sphere) || 0,
        cylinder: leftEye.cylinder ? parseFloat(leftEye.cylinder) : null,
        axis: leftEye.axis ? parseInt(leftEye.axis) : null,
        add: leftEye.add ? parseFloat(leftEye.add) : null,
        pd: parseFloat(leftEye.pd) || 31,
      },
      status: 'COMPLETED',
      createdAt: prescription?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onPrescriptionChange(newPrescription);
    setIsEditing(false);
  }, [rightEye, leftEye, prescription, onPrescriptionChange]);

  const formatPower = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
  };

  return (
    <div className={clsx('border border-gray-200 rounded-lg', compact ? 'p-3' : 'p-4')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-bv-red-600" />
          <h3 className={clsx('font-medium text-gray-900', compact && 'text-sm')}>
            Prescription Details
          </h3>
          {patientName && (
            <span className="text-xs text-gray-500">({patientName})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Copy R → L Button */}
          <button
            onClick={handleCopyRightToLeft}
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-1"
            title="Copy Right eye values to Left eye"
          >
            Copy R <ArrowRight className="w-3 h-3" /> L
          </button>
          {/* Link existing prescription */}
          <button
            onClick={onOpenModal}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3" />
            {prescription ? 'Change' : 'Link Existing'}
          </button>
        </div>
      </div>

      {/* Prescription Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-100">
              <th className="text-left pb-2 pr-2 w-16">Eye</th>
              <th className="text-center pb-2 px-1">SPH</th>
              <th className="text-center pb-2 px-1">CYL</th>
              <th className="text-center pb-2 px-1">AXIS</th>
              <th className="text-center pb-2 px-1">ADD</th>
              <th className="text-center pb-2 px-1">PD</th>
            </tr>
          </thead>
          <tbody>
            {/* Right Eye */}
            <tr>
              <td className="py-2 pr-2">
                <span className="font-medium text-gray-900">Right (OD)</span>
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={rightEye.sphere}
                  onChange={e => updateRightEye('sphere', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="-2.00"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={rightEye.cylinder}
                  onChange={e => updateRightEye('cylinder', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="-0.50"
                />
              </td>
              <td className="py-2 px-1">
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    step="1"
                    value={rightEye.axis}
                    onChange={e => updateRightEye('axis', e.target.value)}
                    onBlur={e => {
                      // Sanitize axis on blur (round to whole number, clamp to 1-180)
                      const sanitized = sanitizeAxisInput(e.target.value);
                      if (sanitized !== null && sanitized.toString() !== e.target.value) {
                        updateRightEye('axis', sanitized.toString());
                      }
                    }}
                    className={clsx(
                      'w-14 px-2 py-1 text-center text-sm border rounded focus:outline-none',
                      rightAxisError
                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                        : 'border-gray-200 focus:border-bv-red-500'
                    )}
                    placeholder="180"
                    title={getAxisInputHint()}
                  />
                  {rightAxisError && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{rightAxisError}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={rightEye.add}
                  onChange={e => updateRightEye('add', e.target.value)}
                  className="w-14 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="+1.00"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.5"
                  value={rightEye.pd}
                  onChange={e => updateRightEye('pd', e.target.value)}
                  className="w-12 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="32"
                />
              </td>
            </tr>
            {/* Left Eye */}
            <tr>
              <td className="py-2 pr-2">
                <span className="font-medium text-gray-900">Left (OS)</span>
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={leftEye.sphere}
                  onChange={e => updateLeftEye('sphere', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="-2.00"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={leftEye.cylinder}
                  onChange={e => updateLeftEye('cylinder', e.target.value)}
                  className="w-16 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="-0.50"
                />
              </td>
              <td className="py-2 px-1">
                <div className="flex flex-col gap-1">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    step="1"
                    value={leftEye.axis}
                    onChange={e => updateLeftEye('axis', e.target.value)}
                    onBlur={e => {
                      // Sanitize axis on blur (round to whole number, clamp to 1-180)
                      const sanitized = sanitizeAxisInput(e.target.value);
                      if (sanitized !== null && sanitized.toString() !== e.target.value) {
                        updateLeftEye('axis', sanitized.toString());
                      }
                    }}
                    className={clsx(
                      'w-14 px-2 py-1 text-center text-sm border rounded focus:outline-none',
                      leftAxisError
                        ? 'border-red-500 bg-red-50 focus:border-red-600'
                        : 'border-gray-200 focus:border-bv-red-500'
                    )}
                    placeholder="180"
                    title={getAxisInputHint()}
                  />
                  {leftAxisError && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      <span>{leftAxisError}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.25"
                  value={leftEye.add}
                  onChange={e => updateLeftEye('add', e.target.value)}
                  className="w-14 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="+1.00"
                />
              </td>
              <td className="py-2 px-1">
                <input
                  type="number"
                  step="0.5"
                  value={leftEye.pd}
                  onChange={e => updateLeftEye('pd', e.target.value)}
                  className="w-12 px-2 py-1 text-center text-sm border border-gray-200 rounded focus:border-bv-red-500 focus:outline-none"
                  placeholder="31"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Combined PD */}
      <div className="mt-2 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">P.D. (mm)</span>
          <input
            type="text"
            value={rightEye.pd && leftEye.pd ? `${rightEye.pd}/${leftEye.pd}` : ''}
            className="w-20 px-2 py-1 text-center text-sm bg-gray-50 border border-gray-200 rounded"
            placeholder="e.g., 63"
            readOnly
          />
        </div>
        {prescription?.optometristName && (
          <span className="text-xs text-gray-400">
            by {prescription.optometristName} on {prescription.testDate}
          </span>
        )}
      </div>
    </div>
  );
}

export default PrescriptionPanel;
