import { SaleRecord, RecipeItem, IngredientPriceRecord } from "@/schemas";
import { MenuEngineeringResult, MenuEngineeringDish, MenuEngineeringCategory } from "./types";
import { buildDishCostIndex, RecipeCostOptions } from "./recipeCost";

/**
 * Computes the 4-category Menu Engineering Matrix (Kasavana & Smith):
 *
 * Metrics:
 * - Popularity: Average monthly sales volume per dish.
 * - Profitability: Average contribution margin per serving (Realized Selling Price - Recipe Ingredient Cost).
 *
 * Thresholds:
 * - Popularity Threshold: Average monthly volume across all menu dishes.
 * - Profitability Threshold: Average contribution margin per serving across all menu dishes.
 *
 * Classifications:
 * - STAR: High Popularity + High Profitability
 * - PLOWHORSE: High Popularity + Low Profitability
 * - PUZZLE: Low Popularity + High Profitability
 * - DOG: Low Popularity + Low Profitability
 */
export function calculateMenuEngineering(
  sales: SaleRecord[],
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  options?: RecipeCostOptions
): MenuEngineeringResult {
  if (sales.length === 0 || recipes.length === 0) {
    return {
      popularityThreshold: 0,
      profitabilityThreshold: 0,
      weightedProfitabilityThreshold: 0,
      dishes: [],
      categoryCounts: { stars: 0, plowhorses: 0, puzzles: 0, dogs: 0 },
    };
  }

  const costIndex = buildDishCostIndex(recipes, ingredientPrices, options);
  const distinctDates = Array.from(new Set(sales.map((s) => s.date)));
  const monthCount = distinctDates.length || 1;

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

  // Calculate per-dish 12-month averages
  const dishMetrics = Array.from(dishMap.entries()).map(([dishId, data]) => {
    const averageMonthlyVolume = data.totalVolume / monthCount;
    const avgSellingPrice = data.totalVolume > 0 ? data.totalRevenue / data.totalVolume : 0;
    const avgIngredientCost = data.totalVolume > 0 ? data.totalCost / data.totalVolume : 0;
    const averageContributionMargin = avgSellingPrice - avgIngredientCost;

    return {
      dishId,
      dishName: data.dishName,
      averageMonthlyVolume,
      averageContributionMargin,
      totalVolume: data.totalVolume,
      totalContribution: data.totalRevenue - data.totalCost,
    };
  });

  const dishCount = dishMetrics.length;
  const totalVolumeAll = dishMetrics.reduce((sum, d) => sum + d.totalVolume, 0);
  const totalContributionAll = dishMetrics.reduce((sum, d) => sum + d.totalContribution, 0);

  // Programmatic Thresholds
  const popularityThreshold =
    dishMetrics.reduce((sum, d) => sum + d.averageMonthlyVolume, 0) / dishCount;

  const profitabilityThreshold =
    dishMetrics.reduce((sum, d) => sum + d.averageContributionMargin, 0) / dishCount;

  const weightedProfitabilityThreshold =
    totalVolumeAll > 0 ? totalContributionAll / totalVolumeAll : 0;

  let stars = 0;
  let plowhorses = 0;
  let puzzles = 0;
  let dogs = 0;

  const dishes: MenuEngineeringDish[] = dishMetrics.map((d) => {
    const isHighPopularity = d.averageMonthlyVolume > popularityThreshold;
    const isHighProfitability = d.averageContributionMargin > profitabilityThreshold;

    let category: MenuEngineeringCategory;
    if (isHighPopularity && isHighProfitability) {
      category = "STAR";
      stars++;
    } else if (isHighPopularity && !isHighProfitability) {
      category = "PLOWHORSE";
      plowhorses++;
    } else if (!isHighPopularity && isHighProfitability) {
      category = "PUZZLE";
      puzzles++;
    } else {
      category = "DOG";
      dogs++;
    }

    return {
      dishId: d.dishId,
      dishName: d.dishName,
      averageMonthlyVolume: d.averageMonthlyVolume,
      averageContributionMargin: d.averageContributionMargin,
      totalContribution: d.totalContribution,
      isHighPopularity,
      isHighProfitability,
      category,
    };
  });

  return {
    popularityThreshold,
    profitabilityThreshold,
    weightedProfitabilityThreshold,
    dishes,
    categoryCounts: {
      stars,
      plowhorses,
      puzzles,
      dogs,
    },
  };
}
