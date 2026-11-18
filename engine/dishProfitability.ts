import { SaleRecord, RecipeItem, IngredientPriceRecord } from "@/schemas";
import { DishProfitability } from "./types";
import { buildDishCostIndex, RecipeCostOptions } from "./recipeCost";

/**
 * Computes dish-wise financial metrics over the entire dataset period:
 * - Selling revenue & total ingredient cost
 * - Unit selling price, unit cost & contribution per serving
 * - Total contribution & contribution margin %
 * - Ranks by total contribution and margin percentage
 */
export function calculateDishProfitability(
  sales: SaleRecord[],
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  options?: RecipeCostOptions
): DishProfitability[] {
  if (sales.length === 0) return [];

  const costIndex = buildDishCostIndex(recipes, ingredientPrices, options);
  const dishMap = new Map<
    string,
    {
      dishName: string;
      totalVolume: number;
      totalRevenue: number;
      totalCost: number;
    }
  >();

  for (const sale of sales) {
    const existing = dishMap.get(sale.dishId) || {
      dishName: sale.dishName,
      totalVolume: 0,
      totalRevenue: 0,
      totalCost: 0,
    };

    const dishCostsOnDate = costIndex.get(sale.date);
    if (!dishCostsOnDate || !dishCostsOnDate.has(sale.dishId)) {
      throw new Error(`Cost not found for dish '${sale.dishId}' on date '${sale.date}'`);
    }

    const unitCost = dishCostsOnDate.get(sale.dishId)!;
    existing.totalVolume += sale.quantity;
    existing.totalRevenue += sale.quantity * sale.sellingPrice;
    existing.totalCost += sale.quantity * unitCost;

    dishMap.set(sale.dishId, existing);
  }

  const results: Omit<DishProfitability, "rankByContribution" | "rankByMarginPercentage">[] = [];

  for (const [dishId, data] of dishMap.entries()) {
    const totalContribution = data.totalRevenue - data.totalCost;
    const unitSellingPrice = data.totalVolume > 0 ? data.totalRevenue / data.totalVolume : 0;
    const unitIngredientCost = data.totalVolume > 0 ? data.totalCost / data.totalVolume : 0;
    const contributionPerServing = unitSellingPrice - unitIngredientCost;
    const contributionMarginPercentage =
      data.totalRevenue > 0 ? (totalContribution / data.totalRevenue) * 100 : 0;

    results.push({
      dishId,
      dishName: data.dishName,
      totalVolume: data.totalVolume,
      totalRevenue: data.totalRevenue,
      totalIngredientCost: data.totalCost,
      totalContribution,
      unitSellingPrice,
      unitIngredientCost,
      contributionPerServing,
      contributionMarginPercentage,
    });
  }

  // Calculate ranks
  // 1. Sort by totalContribution descending for rankByContribution
  const byContribution = [...results].sort((a, b) => b.totalContribution - a.totalContribution);
  const rankByContribMap = new Map<string, number>();
  byContribution.forEach((item, index) => {
    rankByContribMap.set(item.dishId, index + 1);
  });

  // 2. Sort by contributionMarginPercentage descending for rankByMarginPercentage
  const byMargin = [...results].sort(
    (a, b) => b.contributionMarginPercentage - a.contributionMarginPercentage
  );
  const rankByMarginMap = new Map<string, number>();
  byMargin.forEach((item, index) => {
    rankByMarginMap.set(item.dishId, index + 1);
  });

  return results.map((item) => ({
    ...item,
    rankByContribution: rankByContribMap.get(item.dishId)!,
    rankByMarginPercentage: rankByMarginMap.get(item.dishId)!,
  }));
}
