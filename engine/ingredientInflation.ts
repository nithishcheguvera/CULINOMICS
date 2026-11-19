import { IngredientPriceRecord } from "@/schemas";
import { IngredientInflation, MonthlyPricePoint } from "./types";

export interface IngredientInflationOptions {
  majorDriverThresholdPercentage?: number; // default: 50%
}

/**
 * Computes monthly price histories and inflation metrics for all ingredients:
 * - Start & end period prices
 * - Absolute and percentage price changes
 * - Flags major inflation drivers (default >= 50% price increase)
 * - Returns ingredients sorted by percentage price increase descending
 */
export function calculateIngredientInflation(
  ingredientPrices: IngredientPriceRecord[],
  options?: IngredientInflationOptions
): IngredientInflation[] {
  if (ingredientPrices.length === 0) return [];

  const threshold = options?.majorDriverThresholdPercentage ?? 50;
  const ingredientMap = new Map<
    string,
    {
      name: string;
      unit: string;
      prices: Map<string, number>;
    }
  >();

  for (const record of ingredientPrices) {
    const entry = ingredientMap.get(record.ingredientId) || {
      name: record.ingredientName,
      unit: record.unit,
      prices: new Map<string, number>(),
    };
    entry.prices.set(record.date, record.price);
    ingredientMap.set(record.ingredientId, entry);
  }

  const results: IngredientInflation[] = [];

  for (const [ingredientId, data] of ingredientMap.entries()) {
    const sortedDates = Array.from(data.prices.keys()).sort();
    if (sortedDates.length === 0) continue;

    const startPrice = data.prices.get(sortedDates[0])!;
    const endPrice = data.prices.get(sortedDates[sortedDates.length - 1])!;
    const absoluteChange = endPrice - startPrice;
    const percentageChange = startPrice > 0 ? (absoluteChange / startPrice) * 100 : 0;
    const isMajorDriver = percentageChange >= threshold;

    const monthlyPrices: MonthlyPricePoint[] = sortedDates.map((date) => {
      const price = data.prices.get(date)!;
      const indexedPrice = startPrice > 0 ? (price / startPrice) * 100 : 100;
      return {
        date,
        price,
        indexedPrice,
      };
    });

    results.push({
      ingredientId,
      ingredientName: data.name,
      unit: data.unit,
      startPrice,
      endPrice,
      absoluteChange,
      percentageChange,
      isMajorDriver,
      monthlyPrices,
    });
  }

  // Sort by highest percentage inflation first
  return results.sort((a, b) => b.percentageChange - a.percentageChange);
}
