import { z } from "zod";

/**
 * Currency metadata schema and formatting helper for Indian Rupees (INR, ₹).
 */
export const CurrencyCodeSchema = z.literal("INR");
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}
