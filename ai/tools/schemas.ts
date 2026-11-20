import { z } from "zod";

/**
 * Tool 1: getRestaurantFinancialSummary
 * Retrieves high-level annual KPI summary and monthly performance trajectory.
 */
export const GetRestaurantFinancialSummarySchema = z.object({});
export type GetRestaurantFinancialSummaryArgs = z.infer<typeof GetRestaurantFinancialSummarySchema>;

/**
 * Tool 2: getDishProfitability
 * Retrieves unit selling price, ingredient cost, margin %, annual contribution, and ranks.
 */
export const GetDishProfitabilitySchema = z.object({
  dishId: z
    .string()
    .trim()
    .min(1, "dishId cannot be empty string")
    .max(64, "dishId cannot exceed 64 characters")
    .optional(),
});
export type GetDishProfitabilityArgs = z.infer<typeof GetDishProfitabilitySchema>;

/**
 * Tool 3: getMenuEngineeringMatrix
 * Retrieves Kasavana & Smith 4-quadrant classification (Stars, Plowhorses, Puzzles, Dogs) and thresholds.
 */
export const GetMenuEngineeringMatrixSchema = z.object({});
export type GetMenuEngineeringMatrixArgs = z.infer<typeof GetMenuEngineeringMatrixSchema>;

/**
 * Tool 4: getIngredientInflationReport
 * Analyzes ingredient price trajectories, percentage surges, and identifies major drivers (>= 50%).
 */
export const GetIngredientInflationSchema = z.object({
  ingredientId: z
    .string()
    .trim()
    .min(1, "ingredientId cannot be empty string")
    .max(64, "ingredientId cannot exceed 64 characters")
    .optional(),
  onlyMajorDrivers: z.boolean().optional(),
});
export type GetIngredientInflationArgs = z.infer<typeof GetIngredientInflationSchema>;

/**
 * Tool 5: getRecipeCostBreakdown
 * Deconstructs a dish's plate cost into individual ingredients, normalized quantities, unit prices, and cost shares.
 */
export const GetRecipeCostBreakdownSchema = z.object({
  dishId: z.string().trim().min(1, "dishId is required").max(64),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must follow ISO format YYYY-MM-DD")
    .optional(),
});
export type GetRecipeCostBreakdownArgs = z.infer<typeof GetRecipeCostBreakdownSchema>;

/**
 * Tool 6: getRecipeReplayHistory
 * Retrieves chronological 12-month recipe cost evolution, margin percentage, and margin erosion for a dish.
 */
export const GetRecipeReplayHistorySchema = z.object({
  dishId: z.string().trim().min(1, "dishId is required").max(64),
});
export type GetRecipeReplayHistoryArgs = z.infer<typeof GetRecipeReplayHistorySchema>;

/**
 * Tool 7: simulateMenuSurgeryScenario
 * Runs Menu Surgery simulation for a dish adjusting selling price, ingredient cost, and/or volume.
 */
export const SimulateMenuSurgerySchema = z.object({
  dishId: z.string().trim().min(1, "dishId is required").max(64),
  targetSellingPrice: z
    .number()
    .nonnegative("Target selling price must be non-negative in INR")
    .max(100000, "Target selling price exceeds permitted bound")
    .optional(),
  targetIngredientCost: z
    .number()
    .nonnegative("Target ingredient cost must be non-negative in INR")
    .max(100000, "Target ingredient cost exceeds permitted bound")
    .optional(),
  targetMonthlyVolume: z
    .number()
    .int("Target monthly volume must be an integer")
    .nonnegative("Target monthly volume must be non-negative")
    .max(100000, "Target monthly volume exceeds permitted bound")
    .optional(),
});
export type SimulateMenuSurgeryArgs = z.infer<typeof SimulateMenuSurgerySchema>;

/**
 * Tool 8: getProfitForecast
 * Calculates deterministic OLS profit forecast over 3 or 6 month horizon with 3 scenarios.
 */
export const GetProfitForecastSchema = z.object({
  horizonMonths: z.union([z.literal(3), z.literal(6)]).optional(),
});
export type GetProfitForecastArgs = z.infer<typeof GetProfitForecastSchema>;

/**
 * Tool 9: getRecommendedCombos
 * Generates strategic combos and solves linear programming mix optimization.
 */
export const GetRecommendedCombosSchema = z.object({
  bundleDiscountPercentage: z.number().min(0).max(50).optional(),
  monthlyPlateCapacity: z.number().positive().max(100000).optional(),
});
export type GetRecommendedCombosArgs = z.infer<typeof GetRecommendedCombosSchema>;

