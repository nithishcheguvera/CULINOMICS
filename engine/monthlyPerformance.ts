import { SaleRecord, RecipeItem, IngredientPriceRecord } from "@/schemas";
import { MonthlyFinancialPerformance } from "./types";
import { buildDishCostIndex, RecipeCostOptions } from "./recipeCost";

/**
 * Computes monthly financial performance:
 * - Monthly revenue
 * - Monthly total ingredient cost
 * - Monthly gross profit (contribution)
 * - Monthly gross margin percentage
 *
 * All figures are unrounded IEEE-754 numbers in INR. Safe against zero revenue.
 */
export function calculateMonthlyPerformance(
  sales: SaleRecord[],
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  options?: RecipeCostOptions
): MonthlyFinancialPerformance[] {
  if (sales.length === 0) return [];

  const costIndex = buildDishCostIndex(recipes, ingredientPrices, options);
  const monthlyBuckets = new Map<
    string,
    { revenue: number; ingredientCost: number }
  >();

  // Aggregate sales by month date
  for (const sale of sales) {
    const bucket = monthlyBuckets.get(sale.date) || { revenue: 0, ingredientCost: 0 };
    const dishCostsOnDate = costIndex.get(sale.date);

    if (!dishCostsOnDate || !dishCostsOnDate.has(sale.dishId)) {
      throw new Error(`Missing precomputed recipe cost for dish '${sale.dishId}' on date '${sale.date}'`);
    }

    const unitCost = dishCostsOnDate.get(sale.dishId)!;
    bucket.revenue += sale.quantity * sale.sellingPrice;
    bucket.ingredientCost += sale.quantity * unitCost;
    monthlyBuckets.set(sale.date, bucket);
  }

  // Sort dates chronologically
  const sortedDates = Array.from(monthlyBuckets.keys()).sort();

  return sortedDates.map((date) => {
    const { revenue, ingredientCost } = monthlyBuckets.get(date)!;
    const grossProfit = revenue - ingredientCost;
    const grossMarginPercentage = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      date,
      revenue,
      ingredientCost,
      grossProfit,
      grossMarginPercentage,
    };
  });
}
