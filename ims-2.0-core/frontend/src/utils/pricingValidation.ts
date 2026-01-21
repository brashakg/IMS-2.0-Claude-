// ============================================================================
// IMS 2.0 - Pricing Validation Utilities
// ============================================================================
// Client-side validation mirroring backend PricingEngine business rules

import type { UserRole, ProductCategory } from '../types';

// ============================================================================
// Constants - Matching SYSTEM_INTENT.md
// ============================================================================

/**
 * Role-based discount caps (%)
 * These are BASE caps - actual discount allowed may be lower based on category/brand
 */
export const ROLE_DISCOUNT_CAPS: Record<UserRole, number> = {
  SUPERADMIN: 100,
  ADMIN: 100,
  AREA_MANAGER: 25,
  STORE_MANAGER: 20,
  ACCOUNTANT: 0,
  CATALOG_MANAGER: 0,
  OPTOMETRIST: 10,
  SALES_CASHIER: 10,
  SALES_STAFF: 10,
  WORKSHOP_STAFF: 0,
};

/**
 * Discount categories and their max discount limits
 */
export type DiscountCategory = 'MASS' | 'PREMIUM' | 'LUXURY' | 'SERVICE' | 'NON_DISCOUNTABLE';

export const CATEGORY_DISCOUNT_CAPS: Record<DiscountCategory, number> = {
  MASS: 15,      // Contact lens, Accessories
  PREMIUM: 20,   // Frames, Optical lens
  LUXURY: 5,     // Watches, Smart glasses
  SERVICE: 10,   // Service items
  NON_DISCOUNTABLE: 0,
};

/**
 * Luxury brands with special restrictions (override category)
 * These brands have stricter discount limits regardless of product category
 */
export const LUXURY_BRAND_CAPS: Record<string, number> = {
  Cartier: 2,
  Chopard: 2,
  Bvlgari: 2,
  Gucci: 5,
  Prada: 5,
  Versace: 5,
  Burberry: 5,
  'Louis Vuitton': 2,
  Hermès: 2,
  Dior: 5,
};

// ============================================================================
// Types
// ============================================================================

export interface PricingValidationResult {
  isValid: boolean;
  decision: 'APPROVED' | 'BLOCKED' | 'REQUIRES_APPROVAL';
  reason?: string;
  maxAllowedDiscount: number;
  requiresApprovalFrom?: UserRole[];
}

export interface DiscountValidationParams {
  mrp: number;
  offerPrice: number;
  requestedDiscountPercent: number;
  userRole: UserRole;
  userDiscountCap?: number;
  productCategory: DiscountCategory;
  brandName?: string;
}

// ============================================================================
// Core Validation Functions
// ============================================================================

/**
 * CRITICAL: MRP vs Offer Price validation
 * Rule from SYSTEM_INTENT.md:
 * - IF offer_price > mrp → BLOCK (Never allow)
 * - IF offer_price < mrp → Product already discounted, NO further discount
 * - IF offer_price == mrp → Role-based discounts applicable
 */
export function validateMRPOfferPrice(
  mrp: number,
  offerPrice: number
): { isValid: boolean; reason?: string } {
  if (offerPrice > mrp) {
    return {
      isValid: false,
      reason: 'Offer price cannot be greater than MRP. This violates pricing rules.',
    };
  }

  if (offerPrice < mrp) {
    return {
      isValid: false,
      reason: 'Product is already discounted by HQ. No further discount allowed at store level.',
    };
  }

  // offerPrice === mrp → OK for role-based discounts
  return { isValid: true };
}

/**
 * Get the maximum allowed discount percentage for a user
 * Considers: Role cap, User-specific cap, Category cap, Brand cap
 * Returns the LOWEST of all applicable caps
 */
export function getMaxAllowedDiscount(params: {
  userRole: UserRole;
  userDiscountCap?: number;
  productCategory: DiscountCategory;
  brandName?: string;
}): number {
  const { userRole, userDiscountCap, productCategory, brandName } = params;

  // Start with role-based cap
  let maxDiscount = ROLE_DISCOUNT_CAPS[userRole];

  // Apply user-specific cap if provided (overrides role if lower)
  if (userDiscountCap !== undefined && userDiscountCap < maxDiscount) {
    maxDiscount = userDiscountCap;
  }

  // Apply category cap (if lower than current max)
  const categoryCap = CATEGORY_DISCOUNT_CAPS[productCategory] || 0;
  if (categoryCap < maxDiscount) {
    maxDiscount = categoryCap;
  }

  // Apply luxury brand cap (overrides category if lower)
  if (brandName) {
    const normalizedBrand = brandName.trim();
    const brandCap = LUXURY_BRAND_CAPS[normalizedBrand];
    if (brandCap !== undefined && brandCap < maxDiscount) {
      maxDiscount = brandCap;
    }
  }

  return maxDiscount;
}

/**
 * Determine who can approve a discount request
 * Returns list of roles that have authority to approve
 */
export function getApprovalAuthority(
  requestedDiscount: number
): UserRole[] {
  const approvers: UserRole[] = [];

  // SUPERADMIN and ADMIN can approve anything
  approvers.push('SUPERADMIN', 'ADMIN');

  // AREA_MANAGER can approve up to 25%
  if (requestedDiscount <= 25) {
    approvers.push('AREA_MANAGER');
  }

  // STORE_MANAGER can approve up to 20%
  if (requestedDiscount <= 20) {
    approvers.push('STORE_MANAGER');
  }

  return approvers;
}

/**
 * Main discount validation function
 * Returns comprehensive validation result with decision
 */
export function validateDiscount(
  params: DiscountValidationParams
): PricingValidationResult {
  const {
    mrp,
    offerPrice,
    requestedDiscountPercent,
    userRole,
    userDiscountCap,
    productCategory,
    brandName,
  } = params;

  // Step 1: Validate MRP vs Offer Price
  const mrpValidation = validateMRPOfferPrice(mrp, offerPrice);
  if (!mrpValidation.isValid) {
    return {
      isValid: false,
      decision: 'BLOCKED',
      reason: mrpValidation.reason,
      maxAllowedDiscount: 0,
    };
  }

  // Step 2: Get max allowed discount
  const maxAllowedDiscount = getMaxAllowedDiscount({
    userRole,
    userDiscountCap,
    productCategory,
    brandName,
  });

  // Step 3: Check if requested discount is within limits
  if (requestedDiscountPercent <= maxAllowedDiscount) {
    return {
      isValid: true,
      decision: 'APPROVED',
      maxAllowedDiscount,
    };
  }

  // Step 4: Exceeds limit - requires approval
  const approvers = getApprovalAuthority(requestedDiscountPercent);

  // Check if ANYONE can approve this
  if (requestedDiscountPercent > 100) {
    return {
      isValid: false,
      decision: 'BLOCKED',
      reason: 'Discount cannot exceed 100%',
      maxAllowedDiscount,
    };
  }

  // Check category constraints
  if (productCategory === 'NON_DISCOUNTABLE') {
    return {
      isValid: false,
      decision: 'BLOCKED',
      reason: 'This product category is non-discountable',
      maxAllowedDiscount: 0,
    };
  }

  return {
    isValid: false,
    decision: 'REQUIRES_APPROVAL',
    reason: `Discount of ${requestedDiscountPercent}% exceeds your limit of ${maxAllowedDiscount}%. Requires approval from: ${approvers.join(', ')}`,
    maxAllowedDiscount,
    requiresApprovalFrom: approvers,
  };
}

/**
 * Calculate final price after discount
 */
export function calculateFinalPrice(
  basePrice: number,
  discountPercent: number,
  quantity: number = 1
): { finalPrice: number; discountAmount: number } {
  const totalBasePrice = basePrice * quantity;
  const discountAmount = Math.round((totalBasePrice * discountPercent) / 100);
  const finalPrice = totalBasePrice - discountAmount;

  return { finalPrice, discountAmount };
}

/**
 * Validate and calculate pricing for cart item
 */
export function validateCartItemPricing(params: {
  mrp: number;
  offerPrice: number;
  quantity: number;
  requestedDiscountPercent: number;
  userRole: UserRole;
  userDiscountCap?: number;
  productCategory: DiscountCategory;
  brandName?: string;
}): PricingValidationResult & {
  finalPrice?: number;
  discountAmount?: number;
  effectivePrice?: number;
} {
  const validation = validateDiscount({
    mrp: params.mrp,
    offerPrice: params.offerPrice,
    requestedDiscountPercent: params.requestedDiscountPercent,
    userRole: params.userRole,
    userDiscountCap: params.userDiscountCap,
    productCategory: params.productCategory,
    brandName: params.brandName,
  });

  if (validation.decision === 'APPROVED') {
    const { finalPrice, discountAmount } = calculateFinalPrice(
      params.offerPrice,
      params.requestedDiscountPercent,
      params.quantity
    );

    return {
      ...validation,
      finalPrice,
      discountAmount,
      effectivePrice: finalPrice / params.quantity,
    };
  }

  return validation;
}

/**
 * Format pricing error message for user display
 */
export function formatPricingError(result: PricingValidationResult): string {
  if (result.isValid) return '';

  if (result.decision === 'BLOCKED') {
    return `❌ ${result.reason}`;
  }

  if (result.decision === 'REQUIRES_APPROVAL') {
    return `⚠️ ${result.reason}`;
  }

  return 'Invalid pricing';
}

/**
 * Check if user role can apply any discount
 */
export function canApplyDiscount(role: UserRole): boolean {
  return ROLE_DISCOUNT_CAPS[role] > 0;
}

/**
 * Get user-friendly discount cap message
 */
export function getDiscountCapMessage(params: {
  userRole: UserRole;
  productCategory: DiscountCategory;
  brandName?: string;
}): string {
  const maxDiscount = getMaxAllowedDiscount({
    userRole: params.userRole,
    productCategory: params.productCategory,
    brandName: params.brandName,
  });

  if (maxDiscount === 0) {
    return 'No discount allowed for this item';
  }

  const reasons: string[] = [];

  // Check what's limiting the discount
  const roleCap = ROLE_DISCOUNT_CAPS[params.userRole];
  const categoryCap = CATEGORY_DISCOUNT_CAPS[params.productCategory];

  if (maxDiscount === roleCap) {
    reasons.push(`your role limit: ${roleCap}%`);
  }

  if (maxDiscount === categoryCap && categoryCap < roleCap) {
    reasons.push(`category limit: ${categoryCap}%`);
  }

  if (params.brandName) {
    const brandCap = LUXURY_BRAND_CAPS[params.brandName.trim()];
    if (brandCap !== undefined && brandCap === maxDiscount) {
      reasons.push(`luxury brand limit: ${brandCap}%`);
    }
  }

  return `Maximum discount: ${maxDiscount}% (${reasons.join(', ')})`;
}
