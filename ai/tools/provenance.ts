/**
 * Immutable Canonical Provenance Metadata for CULINOMICS Deterministic AI Tools.
 *
 * Enforces that fact provenance is strictly controlled internally by trusted server-side handlers
 * and can NEVER be supplied, overridden, or altered by model-generated content.
 */

export const CANONICAL_TOOL_PROVENANCE = {
  getRestaurantFinancialSummary: {
    sourceTool: "getRestaurantFinancialSummary",
    sourceFunction: "calculateAnnualKpis",
  },
  getDishProfitability: {
    sourceTool: "getDishProfitability",
    sourceFunction: "calculateDishProfitability",
  },
  getMenuEngineeringMatrix: {
    sourceTool: "getMenuEngineeringMatrix",
    sourceFunction: "calculateMenuEngineering",
  },
  getIngredientInflationReport: {
    sourceTool: "getIngredientInflationReport",
    sourceFunction: "calculateIngredientInflation",
  },
  getRecipeCostBreakdown: {
    sourceTool: "getRecipeCostBreakdown",
    sourceFunction: "calculateDishIngredientBreakdown",
  },
  getRecipeReplayHistory: {
    sourceTool: "getRecipeReplayHistory",
    sourceFunction: "calculateRecipeReplay",
  },
  simulateMenuSurgeryScenario: {
    sourceTool: "simulateMenuSurgeryScenario",
    sourceFunction: "simulateDishScenario",
  },
} as const;

export type CanonicalToolName = keyof typeof CANONICAL_TOOL_PROVENANCE;

export type CanonicalSourceFunction =
  (typeof CANONICAL_TOOL_PROVENANCE)[CanonicalToolName]["sourceFunction"];
