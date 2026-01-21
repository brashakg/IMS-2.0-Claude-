// ============================================================================
// IMS 2.0 - Prescription Validation Utilities
// ============================================================================
// Client-side prescription validation matching backend rules from SYSTEM_INTENT.md

import type { Prescription, EyePower } from '../types';

// ============================================================================
// Constants from SYSTEM_INTENT.md
// ============================================================================

export const PRESCRIPTION_RULES = {
  // Axis MUST be whole number 1-180
  AXIS: {
    MIN: 1,
    MAX: 180,
    REQUIRED_FOR_CYLINDER: true, // Axis required only if CYL is not zero
  },
  // SPH (Sphere) range: -20.00 to +20.00 (0.25 steps)
  SPH: {
    MIN: -20.0,
    MAX: 20.0,
    STEP: 0.25,
  },
  // CYL (Cylinder) range: -6.00 to +6.00 (0.25 steps)
  CYL: {
    MIN: -6.0,
    MAX: 6.0,
    STEP: 0.25,
  },
  // ADD (Addition) range: +0.75 to +3.50 (0.25 steps)
  ADD: {
    MIN: 0.75,
    MAX: 3.5,
    STEP: 0.25,
  },
  // PD (Pupillary Distance) typical range
  PD: {
    MIN: 40,
    MAX: 80,
  },
};

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// ============================================================================
// Individual Field Validators
// ============================================================================

/**
 * Validate Axis value
 * CRITICAL: Axis MUST be whole number 1-180 (from SYSTEM_INTENT.md)
 */
export function validateAxis(
  axis: number | null,
  cylinder: number | null
): FieldValidationResult {
  // Axis is required only if cylinder is present and not zero
  if (cylinder === null || cylinder === 0) {
    // If no cylinder, axis should be null or 0
    if (axis !== null && axis !== 0) {
      return {
        isValid: false,
        error: 'Axis can only be specified when Cylinder (CYL) is present',
      };
    }
    return { isValid: true };
  }

  // Cylinder is present, axis is required
  if (axis === null || axis === 0) {
    return {
      isValid: false,
      error: 'Axis is required when Cylinder (CYL) is specified',
    };
  }

  // Check if axis is a whole number
  if (!Number.isInteger(axis)) {
    return {
      isValid: false,
      error: 'Axis must be a whole number (no decimals)',
    };
  }

  // Check range: 1-180
  if (axis < PRESCRIPTION_RULES.AXIS.MIN || axis > PRESCRIPTION_RULES.AXIS.MAX) {
    return {
      isValid: false,
      error: `Axis must be between ${PRESCRIPTION_RULES.AXIS.MIN} and ${PRESCRIPTION_RULES.AXIS.MAX}`,
    };
  }

  return { isValid: true };
}

/**
 * Validate Sphere (SPH) value
 * Range: -20.00 to +20.00 in 0.25 steps
 */
export function validateSphere(sph: number): FieldValidationResult {
  // Check range
  if (sph < PRESCRIPTION_RULES.SPH.MIN || sph > PRESCRIPTION_RULES.SPH.MAX) {
    return {
      isValid: false,
      error: `Sphere must be between ${PRESCRIPTION_RULES.SPH.MIN} and +${PRESCRIPTION_RULES.SPH.MAX}`,
    };
  }

  // Check step size (must be in 0.25 increments)
  const remainder = Math.abs((sph * 100) % 25);
  if (remainder !== 0) {
    return {
      isValid: false,
      error: 'Sphere must be in 0.25 increments (e.g., -2.25, -2.50, -2.75)',
    };
  }

  return { isValid: true };
}

/**
 * Validate Cylinder (CYL) value
 * Range: -6.00 to +6.00 in 0.25 steps
 */
export function validateCylinder(cyl: number | null): FieldValidationResult {
  // Cylinder is optional
  if (cyl === null || cyl === 0) {
    return { isValid: true };
  }

  // Check range
  if (cyl < PRESCRIPTION_RULES.CYL.MIN || cyl > PRESCRIPTION_RULES.CYL.MAX) {
    return {
      isValid: false,
      error: `Cylinder must be between ${PRESCRIPTION_RULES.CYL.MIN} and +${PRESCRIPTION_RULES.CYL.MAX}`,
    };
  }

  // Check step size (must be in 0.25 increments)
  const remainder = Math.abs((cyl * 100) % 25);
  if (remainder !== 0) {
    return {
      isValid: false,
      error: 'Cylinder must be in 0.25 increments (e.g., -1.25, -1.50, -1.75)',
    };
  }

  return { isValid: true };
}

/**
 * Validate Addition (ADD) value
 * Range: +0.75 to +3.50 in 0.25 steps
 */
export function validateAddition(add: number | null): FieldValidationResult {
  // Addition is optional
  if (add === null || add === 0) {
    return { isValid: true };
  }

  // ADD must be positive
  if (add < 0) {
    return {
      isValid: false,
      error: 'Addition (ADD) must be positive',
    };
  }

  // Check range
  if (add < PRESCRIPTION_RULES.ADD.MIN || add > PRESCRIPTION_RULES.ADD.MAX) {
    return {
      isValid: false,
      error: `Addition must be between +${PRESCRIPTION_RULES.ADD.MIN} and +${PRESCRIPTION_RULES.ADD.MAX}`,
    };
  }

  // Check step size (must be in 0.25 increments)
  const remainder = Math.abs((add * 100) % 25);
  if (remainder !== 0) {
    return {
      isValid: false,
      error: 'Addition must be in 0.25 increments (e.g., +1.00, +1.25, +1.50)',
    };
  }

  return { isValid: true };
}

/**
 * Validate Pupillary Distance (PD)
 */
export function validatePD(pd: number): FieldValidationResult {
  if (pd < PRESCRIPTION_RULES.PD.MIN || pd > PRESCRIPTION_RULES.PD.MAX) {
    return {
      isValid: false,
      error: `PD must be between ${PRESCRIPTION_RULES.PD.MIN} and ${PRESCRIPTION_RULES.PD.MAX}mm`,
    };
  }

  return { isValid: true };
}

// ============================================================================
// Eye Power Validation
// ============================================================================

/**
 * Validate complete eye power (OD or OS)
 */
export function validateEyePower(
  power: EyePower,
  eyeLabel: 'Right Eye (OD)' | 'Left Eye (OS)'
): ValidationResult {
  const errors: string[] = [];

  // Validate Sphere (required)
  const sphResult = validateSphere(power.sphere);
  if (!sphResult.isValid) {
    errors.push(`${eyeLabel} - ${sphResult.error}`);
  }

  // Validate Cylinder (optional)
  const cylResult = validateCylinder(power.cylinder);
  if (!cylResult.isValid) {
    errors.push(`${eyeLabel} - ${cylResult.error}`);
  }

  // Validate Axis (required if cylinder present)
  const axisResult = validateAxis(power.axis, power.cylinder);
  if (!axisResult.isValid) {
    errors.push(`${eyeLabel} - ${axisResult.error}`);
  }

  // Validate Addition (optional)
  const addResult = validateAddition(power.add);
  if (!addResult.isValid) {
    errors.push(`${eyeLabel} - ${addResult.error}`);
  }

  // Validate PD (required)
  const pdResult = validatePD(power.pd);
  if (!pdResult.isValid) {
    errors.push(`${eyeLabel} - ${pdResult.error}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Full Prescription Validation
// ============================================================================

/**
 * Validate complete prescription
 * Returns comprehensive validation result with all errors
 */
export function validatePrescription(
  prescription: Partial<Prescription>
): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!prescription.patientId) {
    errors.push('Patient is required');
  }

  if (!prescription.prescriptionType) {
    errors.push('Prescription type is required');
  }

  // Validate Right Eye (OD)
  if (!prescription.rightEye) {
    errors.push('Right Eye (OD) prescription is required');
  } else {
    const odValidation = validateEyePower(prescription.rightEye, 'Right Eye (OD)');
    errors.push(...odValidation.errors);
  }

  // Validate Left Eye (OS)
  if (!prescription.leftEye) {
    errors.push('Left Eye (OS) prescription is required');
  } else {
    const osValidation = validateEyePower(prescription.leftEye, 'Left Eye (OS)');
    errors.push(...osValidation.errors);
  }

  // Validate prescription source
  if (!prescription.prescribedBy) {
    errors.push('Prescription source (optometrist or doctor) is required');
  }

  // Validate date
  if (!prescription.prescriptionDate) {
    errors.push('Prescription date is required');
  }

  // Check expiry (if provided)
  if (prescription.expiryDate) {
    const expiryDate = new Date(prescription.expiryDate);
    const now = new Date();

    if (expiryDate < now) {
      errors.push(
        'Prescription has expired. Store Manager or higher can override if needed.'
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if prescription requires items (optical/contact lenses)
 * From SYSTEM_INTENT.md:
 * - Optical lenses REQUIRE prescription
 * - Contact lenses REQUIRE prescription
 * - Frame-only sales do NOT require prescription
 */
export function requiresPrescription(
  itemType: string
): boolean {
  const PRESCRIPTION_REQUIRED_TYPES = [
    'OPTICAL_LENS',
    'CONTACT_LENS',
    'COLORED_CONTACT_LENS',
  ];

  return PRESCRIPTION_REQUIRED_TYPES.includes(itemType);
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';

  if (errors.length === 1) {
    return `❌ ${errors[0]}`;
  }

  return `❌ Validation errors:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`;
}

/**
 * Get user-friendly axis input hint
 */
export function getAxisInputHint(): string {
  return `Whole number between ${PRESCRIPTION_RULES.AXIS.MIN}-${PRESCRIPTION_RULES.AXIS.MAX} (required if CYL is present)`;
}

/**
 * Sanitize axis input - ensure whole number
 */
export function sanitizeAxisInput(value: string | number): number | null {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(num)) {
    return null;
  }

  // Round to nearest whole number
  const rounded = Math.round(num);

  // Clamp to valid range
  if (rounded < PRESCRIPTION_RULES.AXIS.MIN) {
    return PRESCRIPTION_RULES.AXIS.MIN;
  }

  if (rounded > PRESCRIPTION_RULES.AXIS.MAX) {
    return PRESCRIPTION_RULES.AXIS.MAX;
  }

  return rounded;
}

/**
 * Format axis value for display
 */
export function formatAxis(axis: number | null): string {
  if (axis === null || axis === 0) {
    return '—';
  }

  return `${axis}°`;
}

/**
 * Format sphere/cylinder value for display
 */
export function formatPower(value: number | null): string {
  if (value === null || value === 0) {
    return 'Plano';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}`;
}

/**
 * Validate axis in real-time (for input fields)
 */
export function validateAxisRealtime(
  value: string,
  cylinder: number | null
): { isValid: boolean; error?: string; sanitized?: number | null } {
  // Empty is OK if no cylinder
  if (value === '') {
    if (cylinder !== null && cylinder !== 0) {
      return {
        isValid: false,
        error: 'Required when CYL is present',
        sanitized: null,
      };
    }
    return { isValid: true, sanitized: null };
  }

  // Try to parse
  const num = parseFloat(value);

  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'Must be a number',
      sanitized: null,
    };
  }

  // Check if whole number
  if (!Number.isInteger(num)) {
    return {
      isValid: false,
      error: 'Must be whole number',
      sanitized: Math.round(num),
    };
  }

  // Check range
  if (num < PRESCRIPTION_RULES.AXIS.MIN || num > PRESCRIPTION_RULES.AXIS.MAX) {
    return {
      isValid: false,
      error: `Must be 1-180`,
      sanitized: Math.max(
        PRESCRIPTION_RULES.AXIS.MIN,
        Math.min(PRESCRIPTION_RULES.AXIS.MAX, Math.round(num))
      ),
    };
  }

  return { isValid: true, sanitized: num };
}
