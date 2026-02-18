import type { SupportedCurrency } from "@/lib/types"

/**
 * Currency symbols for supported currencies
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AED: "د.إ",
  MYR: "RM",
}

/**
 * Get the symbol for a given currency code.
 * Falls back to the code itself if not found.
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency as SupportedCurrency] || currency
}

/**
 * Format a price for display.
 * 
 * @param amount - Price in whole currency units (e.g., 2999 = ₹2,999 or $2,999)
 * @param currency - Currency code (e.g., "INR", "USD")
 * @returns Formatted price string like "₹2,999" or "$29.99"
 */
export function formatPrice(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)

  // Format with proper locale-based number formatting
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)

  return `${symbol}${formatted}`
}

/**
 * Convert whole currency units to Stripe's smallest unit (cents/paise).
 * Stripe expects amounts in the smallest currency unit.
 * e.g., $10.00 → 1000 cents, ₹999 → 99900 paise
 */
export function toStripeAmount(amount: number): number {
  return Math.round(amount * 100)
}
