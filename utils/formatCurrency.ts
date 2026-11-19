/**
 * Pure currency formatting utility for Indian Rupees (INR, ₹).
 * Independent of React, Zustand, and browser DOM state.
 */
export function formatINR(
  value: number,
  options?: { showDecimals?: boolean; compact?: boolean }
): string {
  const showDecimals = options?.showDecimals ?? false;

  if (options?.compact) {
    if (Math.abs(value) >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
}
