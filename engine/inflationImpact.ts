import { MenuItem, RecipeItem, IngredientPriceRecord } from "@/schemas";
import { InflationImpactDish, IngredientCostContribution } from "./types";
import {
  calculateRecipeCostForDate,
  calculateIngredientCostComponent,
  RecipeCostOptions,
} from "./recipeCost";

export interface InflationImpactOptions extends RecipeCostOptions {
  startDate?: string; // default: earliest date
  endDate?: string; // default: latest date
  inflationHurtThresholdCostIncreasePercentage?: number; // default: 50%
}

/**
 * Computes comparative inflation impact analysis between two periods (January vs December):
 * - Recipe cost surge & contribution margin erosion
 * - Granular ingredient-level cost contributions to the dish cost increase
 * - Identifies inflation-hurt dishes experiencing severe profit deterioration
 */
export function calculateInflationImpact(
  menu: MenuItem[],
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  options?: InflationImpactOptions
): InflationImpactDish[] {
  if (menu.length === 0 || recipes.length === 0 || ingredientPrices.length === 0) {
    return [];
  }

  const allDates = Array.from(new Set(ingredientPrices.map((p) => p.date))).sort();
  const startPeriod = options?.startDate ?? allDates[0];
  const endPeriod = options?.endDate ?? allDates[allDates.length - 1];
  const hurtThreshold = options?.inflationHurtThresholdCostIncreasePercentage ?? 50;

  return menu.map((dish) => {
    const startCost = calculateRecipeCostForDate(
      dish.id,
      recipes,
      ingredientPrices,
      startPeriod,
      options
    );
    const endCost = calculateRecipeCostForDate(
      dish.id,
      recipes,
      ingredientPrices,
      endPeriod,
      options
    );

    const costIncreaseAbsolute = endCost - startCost;
    const costIncreasePercentage =
      startCost > 0 ? (costIncreaseAbsolute / startCost) * 100 : 0;

    const startMargin = dish.basePrice - startCost;
    const endMargin = dish.basePrice - endCost;
    const marginErosionAbsolute = startMargin - endMargin;
    const marginErosionPercentage =
      startMargin > 0 ? (marginErosionAbsolute / startMargin) * 100 : 0;

    const isInflationHurt = costIncreasePercentage >= hurtThreshold;

    // Granular ingredient drivers
    const dishRecipe = recipes.filter((r) => r.dishId === dish.id);
    const ingredientDrivers: IngredientCostContribution[] = dishRecipe
      .map((item) => {
        const startPriceRec = ingredientPrices.find(
          (p) => p.ingredientId === item.ingredientId && p.date === startPeriod
        );
        const endPriceRec = ingredientPrices.find(
          (p) => p.ingredientId === item.ingredientId && p.date === endPeriod
        );

        if (!startPriceRec || !endPriceRec) {
          throw new Error(
            `Missing price records for ingredient '${item.ingredientId}' in period ${startPeriod} to ${endPeriod}`
          );
        }

        const startCostComponent = calculateIngredientCostComponent(
          item,
          startPriceRec,
          options
        );
        const endCostComponent = calculateIngredientCostComponent(
          item,
          endPriceRec,
          options
        );
        const costComponentIncreaseAbsolute = endCostComponent - startCostComponent;
        const costComponentIncreasePercentage =
          startCostComponent > 0
            ? (costComponentIncreaseAbsolute / startCostComponent) * 100
            : 0;

        const shareOfDishCostIncreasePercentage =
          costIncreaseAbsolute > 0
            ? (costComponentIncreaseAbsolute / costIncreaseAbsolute) * 100
            : 0;

        return {
          ingredientId: item.ingredientId,
          ingredientName: item.ingredientName,
          unit: item.unit,
          quantity: item.quantity,
          startIngredientPrice: startPriceRec.price,
          endIngredientPrice: endPriceRec.price,
          startCostComponent,
          endCostComponent,
          costComponentIncreaseAbsolute,
          costComponentIncreasePercentage,
          shareOfDishCostIncreasePercentage,
        };
      })
      .sort((a, b) => b.shareOfDishCostIncreasePercentage - a.shareOfDishCostIncreasePercentage);

    return {
      dishId: dish.id,
      dishName: dish.name,
      startPeriod,
      endPeriod,
      startCost,
      endCost,
      costIncreaseAbsolute,
      costIncreasePercentage,
      startMargin,
      endMargin,
      marginErosionAbsolute,
      marginErosionPercentage,
      isInflationHurt,
      ingredientDrivers,
    };
  });
}
