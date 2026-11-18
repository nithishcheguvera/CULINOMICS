import { RecipeItem, IngredientPriceRecord, convertUnit, Unit } from "@/schemas";

export interface RecipeCostOptions {
  densityMap?: Record<string, number>; // ingredientId -> density in g/ml
  itemsPerPortionMap?: Record<string, number>; // ingredientId -> items per portion
}

/**
 * Calculates the exact cost of an individual ingredient line within a recipe on a specific date.
 * Unrounded IEEE-754 precision in INR.
 */
export function calculateIngredientCostComponent(
  recipeItem: RecipeItem,
  priceRecord: IngredientPriceRecord,
  options?: RecipeCostOptions
): number {
  const density = options?.densityMap?.[recipeItem.ingredientId];
  const itemsPerPortion = options?.itemsPerPortionMap?.[recipeItem.ingredientId];

  // Convert recipe quantity from recipe unit to pricing unit
  const convertedQuantity = convertUnit(recipeItem.quantity, recipeItem.unit, priceRecord.unit, {
    densityGramsPerMl: density,
    itemsPerPortion,
  });

  return convertedQuantity * priceRecord.price;
}

/**
 * Calculates the total food cost for a dish's recipe on a given date.
 * Derived deterministically from recipe quantities and historical ingredient prices.
 */
export function calculateRecipeCostForDate(
  dishId: string,
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  date: string,
  options?: RecipeCostOptions
): number {
  const dishRecipe = recipes.filter((r) => r.dishId === dishId);
  if (dishRecipe.length === 0) {
    throw new Error(`No recipe found for dish ID: '${dishId}'`);
  }

  let totalCost = 0;

  for (const item of dishRecipe) {
    const priceRecord = ingredientPrices.find(
      (p) => p.ingredientId === item.ingredientId && p.date === date
    );

    if (!priceRecord) {
      throw new Error(
        `Missing price record for ingredient '${item.ingredientId}' (${item.ingredientName}) on date '${date}'`
      );
    }

    totalCost += calculateIngredientCostComponent(item, priceRecord, options);
  }

  return totalCost;
}

/**
 * Precomputes or memoizes costs for all dishes across all dates present in the datasets.
 * Returns a map of Map<date, Map<dishId, cost>> for high-performance batch analytics.
 */
export function buildDishCostIndex(
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  options?: RecipeCostOptions
): Map<string, Map<string, number>> {
  const costIndex = new Map<string, Map<string, number>>();
  const dates = Array.from(new Set(ingredientPrices.map((p) => p.date)));
  const dishIds = Array.from(new Set(recipes.map((r) => r.dishId)));

  for (const date of dates) {
    const dishCostMap = new Map<string, number>();
    for (const dishId of dishIds) {
      const cost = calculateRecipeCostForDate(dishId, recipes, ingredientPrices, date, options);
      dishCostMap.set(dishId, cost);
    }
    costIndex.set(date, dishCostMap);
  }

  return costIndex;
}
