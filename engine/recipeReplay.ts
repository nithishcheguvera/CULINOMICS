import { MenuItem, RecipeItem, IngredientPriceRecord, SaleRecord } from "@/schemas";
import { DishRecipeReplay, RecipeReplayPoint } from "./types";
import { calculateRecipeCostForDate, RecipeCostOptions } from "./recipeCost";

/**
 * Computes Recipe Replay historical trajectories for each dish across all chronological dates:
 * - Recipe ingredient cost on each month
 * - Realized/Catalog selling price
 * - Contribution per serving
 * - Gross margin percentage
 */
export function calculateRecipeReplay(
  menu: MenuItem[],
  recipes: RecipeItem[],
  ingredientPrices: IngredientPriceRecord[],
  sales?: SaleRecord[],
  options?: RecipeCostOptions
): DishRecipeReplay[] {
  if (menu.length === 0 || recipes.length === 0 || ingredientPrices.length === 0) {
    return [];
  }

  const allDates = Array.from(new Set(ingredientPrices.map((p) => p.date))).sort();

  // Index sales by `${date}_${dishId}` for O(1) realized price lookup
  const salesPriceMap = new Map<string, number>();
  if (sales) {
    for (const sale of sales) {
      salesPriceMap.set(`${sale.date}_${sale.dishId}`, sale.sellingPrice);
    }
  }

  return menu.map((dish) => {
    const points: RecipeReplayPoint[] = allDates.map((date) => {
      const sellingPrice =
        salesPriceMap.get(`${date}_${dish.id}`) ?? dish.basePrice;
      const recipeCost = calculateRecipeCostForDate(
        dish.id,
        recipes,
        ingredientPrices,
        date,
        options
      );
      const contributionPerServing = sellingPrice - recipeCost;
      const marginPercentage =
        sellingPrice > 0 ? (contributionPerServing / sellingPrice) * 100 : 0;

      return {
        date,
        dishId: dish.id,
        dishName: dish.name,
        sellingPrice,
        recipeCost,
        contributionPerServing,
        marginPercentage,
      };
    });

    return {
      dishId: dish.id,
      dishName: dish.name,
      points,
    };
  });
}
