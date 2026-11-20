import { z } from "zod";
import { ValidatedStoryDataset } from "./datasetValidator";
import { AuthoritativeFact } from "./factFactory";
import { CanonicalToolName } from "./provenance";
import {
  GetRestaurantFinancialSummaryArgs,
  GetDishProfitabilityArgs,
  GetMenuEngineeringMatrixArgs,
  GetIngredientInflationArgs,
  GetRecipeCostBreakdownArgs,
  GetRecipeReplayHistoryArgs,
  SimulateMenuSurgeryArgs,
  GetProfitForecastArgs,
  GetRecommendedCombosArgs,
} from "./schemas";

export interface ToolExecutionContext {
  readonly dataset: ValidatedStoryDataset;
  readonly datasetMode: "demo" | "custom";
  readonly selectedDishId?: string;
  readonly selectedTimelineDate?: string | null;
}

export interface ToolExecutionCompleteness {
  readonly isComplete: boolean;
  readonly totalItemsAvailable: number;
  readonly itemsReturned: number;
  readonly note?: string;
}

export interface ToolExecutionOutput {
  readonly summaryForGemini: Record<string, unknown>;
  readonly authoritativeFacts: AuthoritativeFact[];
  readonly completeness: ToolExecutionCompleteness;
}

export interface TypedToolHandler<TArgs> {
  readonly name: CanonicalToolName;
  readonly description: string;
  readonly schema: z.ZodType<TArgs>;
  readonly execute: (args: TArgs, ctx: ToolExecutionContext) => ToolExecutionOutput;
}

export interface ToolRegistry {
  readonly getRestaurantFinancialSummary: TypedToolHandler<GetRestaurantFinancialSummaryArgs>;
  readonly getDishProfitability: TypedToolHandler<GetDishProfitabilityArgs>;
  readonly getMenuEngineeringMatrix: TypedToolHandler<GetMenuEngineeringMatrixArgs>;
  readonly getIngredientInflationReport: TypedToolHandler<GetIngredientInflationArgs>;
  readonly getRecipeCostBreakdown: TypedToolHandler<GetRecipeCostBreakdownArgs>;
  readonly getRecipeReplayHistory: TypedToolHandler<GetRecipeReplayHistoryArgs>;
  readonly simulateMenuSurgeryScenario: TypedToolHandler<SimulateMenuSurgeryArgs>;
  readonly getProfitForecast: TypedToolHandler<GetProfitForecastArgs>;
  readonly getRecommendedCombos: TypedToolHandler<GetRecommendedCombosArgs>;
}

export const TOOL_SAFETY_LIMITS = {
  MAX_FUNCTION_CALLING_ROUNDS: 3,
  MAX_TOOL_CALLS_PER_ROUND: 3,
  MAX_TOTAL_TOOL_CALLS_PER_REQUEST: 5,
  MAX_REQUEST_BODY_BYTES: 1024 * 1024, // 1 MB
} as const;
