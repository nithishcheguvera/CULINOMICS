import { RecipeItem, IngredientPriceRecord, convertUnit } from "@/schemas";
import { DishIngredientBreakdown, DishIngredientBreakdownItem } from "./types";
import {
  calculateIngredientCostComponent,
  calculateRecipeCostForDate,
  RecipeCostOptions,
} from "./recipeCost";

/**
 * Deterministically computes the ingredient cost anatomy and percentage cost shares
 * for a specific dish on a given historical date.
 *
 * Mandatory Refinement B:
 * - Unrounded IEEE-754 precision.
 * - Exact mathematical reconciliation against calculateRecipeCostForDate().
 * - Sorted descending by financial contribution (ingredientCost).
 */
export function calculateDishIngredientBreakdown(
  dishId: string,
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  date: string,
  options?: RecipeCostOptions
): DishIngredientBreakdown {
  if (!dishId || typeof dishId !== "string") {
    throw new Error("Invalid dish ID provided for ingredient breakdown.");
  }
  if (!date || typeof date !== "string") {
    throw new Error("Invalid date provided for ingredient breakdown.");
  }

  const dishRecipe = recipes.filter((r) => r.dishId === dishId);
  if (dishRecipe.length === 0) {
    throw new Error(`No recipe found for dish ID: '${dishId}'`);
  }

  // Canonical dish name from recipe records
  const dishName = dishRecipe[0].dishName;

  // 1. Reconcile against authoritative total recipe cost calculation
  const totalRecipeCost = calculateRecipeCostForDate(
    dishId,
    recipes,
    ingredientPrices,
    date,
    options
  );

  let unroundedSum = 0;

  // 2. Compute individual ingredient cost components
  const ingredients: DishIngredientBreakdownItem[] = dishRecipe.map((item) => {
    const priceRecord = ingredientPrices.find(
      (p) => p.ingredientId === item.ingredientId && p.date === date
    );

    if (!priceRecord) {
      throw new Error(
        `Missing price record for ingredient '${item.ingredientId}' (${item.ingredientName}) on date '${date}'`
      );
    }

    const density = options?.densityMap?.[item.ingredientId];
    const itemsPerPortion = options?.itemsPerPortionMap?.[item.ingredientId];

    const normalizedQuantityInPricingUnit = convertUnit(
      item.quantity,
      item.unit,
      priceRecord.unit,
      {
        densityGramsPerMl: density,
        itemsPerPortion,
      }
    );

    const ingredientCost = calculateIngredientCostComponent(item, priceRecord, options);
    unroundedSum += ingredientCost;

    const costSharePercentage =
      totalRecipeCost > 0 ? (ingredientCost / totalRecipeCost) * 100 : 0;

    return {
      ingredientId: item.ingredientId,
      ingredientName: item.ingredientName,
      quantity: item.quantity,
      recipeUnit: item.unit,
      pricingUnit: priceRecord.unit,
      normalizedQuantityInPricingUnit,
      unitPrice: priceRecord.price,
      ingredientCost,
      costSharePercentage,
    };
  });

  // Numerical reconciliation invariant check: sum of costs must match totalRecipeCost within epsilon
  const epsilon = 1e-9;
  if (Math.abs(unroundedSum - totalRecipeCost) > epsilon) {
    throw new Error(
      `Reconciliation Error: Sum of ingredient costs (${unroundedSum}) does not equal total recipe cost (${totalRecipeCost}) for dish '${dishId}' on date '${date}'.`
    );
  }

  // Sort descending by ingredient cost (largest cost driver first), ties by name
  ingredients.sort((a, b) => {
    if (b.ingredientCost !== a.ingredientCost) {
      return b.ingredientCost - a.ingredientCost;
    }
    return a.ingredientName.localeCompare(b.ingredientName);
  });

  return {
    dishId,
    dishName,
    date,
    totalRecipeCost,
    ingredients,
  };
}
