// ============================================================================
// IMS 2.0 - Pricing Engine Utility
// ============================================================================
// Implements NON-NEGOTIABLE pricing rules from SYSTEM_INTENT.md
// Control > Convenience - All rules enforced strictly

import type {
  UserRole,
  ProductCategory,
  DiscountCategory,
} from '../types';
import {
  CATEGORY_DISCOUNT_CAPS,
  LUXURY_BRAND_CAPS,
} from '../types';

// Re-export for components that import from this module
export { CATEGORY_DISCOUNT_CAPS, LUXURY_BRAND_CAPS };

// Role-based discount caps (from SYSTEM_INTENT.md)
export const ROLE_DISCOUNT_CAPS: Record<UserRole, number> = {
  SALES_STAFF: 10,
  SALES_CASHIER: 10,
  WORKSHOP_STAFF: 0,
  OPTOMETRIST: 5,
  STORE_MANAGER: 20,
  AREA_MANAGER: 25,
  CATALOG_MANAGER: 0,
  ACCOUNTANT: 0,
  ADMIN: 100,
  SUPERADMIN: 100,
};

// Category to Discount Category mapping
export const CATEGORY_TO_DISCOUNT_CATEGORY: Record<ProductCategory, DiscountCategory> = {
  FRAME: 'PREMIUM',
  SUNGLASS: 'PREMIUM',
  READING_GLASSES: 'MASS',
  OPTICAL_LENS: 'PREMIUM',
  CONTACT_LENS: 'MASS',
  COLORED_CONTACT_LENS: 'MASS',
  WATCH: 'LUXURY',
  SMARTWATCH: 'LUXURY',
  SMARTGLASSES: 'LUXURY',
  WALL_CLOCK: 'MASS',
  ACCESSORIES: 'MASS',
  SERVICES: 'SERVICE',
};

export interface PriceValidationResult {
  isValid: boolean;
  canSell: boolean;
  canDiscount: boolean;
  effectiveDiscountCap: number;
  roleCap: number;
  categoryCap: number;
  brandCap?: number;
  requiresApproval: boolean;
  approvalReason?: string;
  error?: string;
}

export interface DiscountCalculation {
  requestedPercent: number;
  allowedPercent: number;
  discountAmount: number;
  finalPrice: number;
  requiresApproval: boolean;
  approvalReason?: string;
  isOverCap: boolean;
}

/**
 * Validates MRP vs Offer Price relationship
 * CRITICAL: This is non-negotiable business logic
 *
 * Rules from SYSTEM_INTENT.md:
 * - offer_price > mrp → BLOCK (Never allow)
 * - offer_price < mrp → Product already discounted, NO further store discounts
 * - offer_price == mrp → Role-based discounts applicable
 */
export function validatePricing(
  mrp: number,
  offerPrice: number,
  userRole: UserRole,
  productCategory: ProductCategory,
  brandName?: string
): PriceValidationResult {
  // Rule 1: offer_price > mrp → BLOCK completely
  if (offerPrice > mrp) {
    return {
      isValid: false,
      canSell: false,
      canDiscount: false,
      effectiveDiscountCap: 0,
      roleCap: 0,
      categoryCap: 0,
      requiresApproval: false,
      error: 'BLOCKED: Offer price cannot exceed MRP. This product cannot be sold.',
    };
  }

  // Rule 2: offer_price < mrp → Already discounted by HQ, no further discounts
  if (offerPrice < mrp) {
    return {
      isValid: true,
      canSell: true,
      canDiscount: false, // NO further discounts allowed
      effectiveDiscountCap: 0,
      roleCap: 0,
      categoryCap: 0,
      requiresApproval: false,
      error: 'Product already discounted by HQ. No further store-level discounts allowed.',
    };
  }

  // Rule 3: offer_price == mrp → Calculate discount caps
  const roleCap = ROLE_DISCOUNT_CAPS[userRole] || 0;
  const discountCategory = CATEGORY_TO_DISCOUNT_CATEGORY[productCategory];
  const categoryCap = CATEGORY_DISCOUNT_CAPS[discountCategory];

  // Check for luxury brand override
  let brandCap: number | undefined;
  if (brandName && LUXURY_BRAND_CAPS[brandName]) {
    brandCap = LUXURY_BRAND_CAPS[brandName];
  }

  // Effective cap is the MINIMUM of all applicable caps
  let effectiveDiscountCap = Math.min(roleCap, categoryCap);
  if (brandCap !== undefined) {
    effectiveDiscountCap = Math.min(effectiveDiscountCap, brandCap);
  }

  return {
    isValid: true,
    canSell: true,
    canDiscount: effectiveDiscountCap > 0,
    effectiveDiscountCap,
    roleCap,
    categoryCap,
    brandCap,
    requiresApproval: false,
  };
}

/**
 * Calculates discount and checks if approval is required
 */
export function calculateDiscount(
  mrp: number,
  offerPrice: number,
  requestedDiscountPercent: number,
  userRole: UserRole,
  productCategory: ProductCategory,
  brandName?: string
): DiscountCalculation {
  const validation = validatePricing(mrp, offerPrice, userRole, productCategory, brandName);

  // If can't discount, return 0
  if (!validation.canDiscount) {
    return {
      requestedPercent: requestedDiscountPercent,
      allowedPercent: 0,
      discountAmount: 0,
      finalPrice: offerPrice,
      requiresApproval: false,
      isOverCap: requestedDiscountPercent > 0,
    };
  }

  const { effectiveDiscountCap, roleCap, categoryCap, brandCap } = validation;
  const isOverCap = requestedDiscountPercent > effectiveDiscountCap;

  // Calculate allowed discount (capped at effective cap unless approval)
  const allowedPercent = isOverCap ? effectiveDiscountCap : requestedDiscountPercent;
  const discountAmount = (offerPrice * allowedPercent) / 100;
  const finalPrice = offerPrice - discountAmount;

  // Determine approval reason
  let approvalReason: string | undefined;
  if (isOverCap) {
    if (brandCap !== undefined && requestedDiscountPercent > brandCap) {
      approvalReason = `Luxury brand (${brandName}) cap is ${brandCap}%. Requested: ${requestedDiscountPercent}%`;
    } else if (requestedDiscountPercent > categoryCap) {
      approvalReason = `Category cap is ${categoryCap}%. Requested: ${requestedDiscountPercent}%`;
    } else if (requestedDiscountPercent > roleCap) {
      approvalReason = `Role cap is ${roleCap}%. Requested: ${requestedDiscountPercent}%`;
    }
  }

  return {
    requestedPercent: requestedDiscountPercent,
    allowedPercent,
    discountAmount,
    finalPrice,
    requiresApproval: isOverCap,
    approvalReason,
    isOverCap,
  };
}

/**
 * Get the effective discount cap for a user, category, and brand
 */
export function getEffectiveDiscountCap(
  userRole: UserRole,
  productCategory: ProductCategory,
  brandName?: string
): number {
  const roleCap = ROLE_DISCOUNT_CAPS[userRole] || 0;
  const discountCategory = CATEGORY_TO_DISCOUNT_CATEGORY[productCategory];
  const categoryCap = CATEGORY_DISCOUNT_CAPS[discountCategory];

  let effectiveCap = Math.min(roleCap, categoryCap);

  if (brandName && LUXURY_BRAND_CAPS[brandName]) {
    effectiveCap = Math.min(effectiveCap, LUXURY_BRAND_CAPS[brandName]);
  }

  return effectiveCap;
}

/**
 * Check if a brand is a luxury brand with special discount caps
 */
export function isLuxuryBrand(brandName: string): boolean {
  return brandName in LUXURY_BRAND_CAPS;
}

/**
 * Get discount cap for a specific luxury brand
 */
export function getLuxuryBrandCap(brandName: string): number | null {
  return LUXURY_BRAND_CAPS[brandName] ?? null;
}

/**
 * Calculate GST amounts based on transaction type
 * @param amount - Taxable amount
 * @param gstRate - GST rate (e.g., 18)
 * @param isInterState - true for IGST, false for CGST+SGST
 */
export function calculateGST(
  amount: number,
  gstRate: number,
  isInterState: boolean
): {
  type: 'CGST_SGST' | 'IGST';
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalGST: number;
} {
  const totalGST = (amount * gstRate) / 100;

  if (isInterState) {
    return {
      type: 'IGST',
      igstRate: gstRate,
      igstAmount: totalGST,
      totalGST,
    };
  } else {
    const halfRate = gstRate / 2;
    const halfAmount = totalGST / 2;
    return {
      type: 'CGST_SGST',
      cgstRate: halfRate,
      cgstAmount: halfAmount,
      sgstRate: halfRate,
      sgstAmount: halfAmount,
      totalGST,
    };
  }
}

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert number to words (Indian format)
 */
export function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = num % 100;

  let words = '';

  if (crore > 0) {
    words += (crore < 20 ? ones[crore] : tens[Math.floor(crore / 10)] + ' ' + ones[crore % 10]) + ' Crore ';
  }
  if (lakh > 0) {
    words += (lakh < 20 ? ones[lakh] : tens[Math.floor(lakh / 10)] + ' ' + ones[lakh % 10]) + ' Lakh ';
  }
  if (thousand > 0) {
    words += (thousand < 20 ? ones[thousand] : tens[Math.floor(thousand / 10)] + ' ' + ones[thousand % 10]) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder > 0) {
    if (words) words += 'and ';
    words += remainder < 20 ? ones[remainder] : tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
  }

  return words.trim() + ' Rupees Only';
}
