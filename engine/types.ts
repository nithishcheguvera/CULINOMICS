/**
 * Deterministic Financial Engine - Chart-Ready Output Types
 * All monetary amounts are unrounded IEEE-754 numbers in Indian Rupees (INR, ₹).
 */

export interface MonthlyFinancialPerformance {
  date: string; // YYYY-MM-DD
  revenue: number;
  ingredientCost: number;
  grossProfit: number;
  grossMarginPercentage: number;
}

export interface AnnualKpiMetrics {
  annualRevenue: number;
  annualIngredientCost: number;
  annualGrossContribution: number;
  overallMarginPercentage: number;
  totalSalesVolume: number;
}

export interface DishProfitability {
  dishId: string;
  dishName: string;
  totalVolume: number;
  totalRevenue: number;
  totalIngredientCost: number;
  totalContribution: number;
  unitSellingPrice: number;
  unitIngredientCost: number;
  contributionPerServing: number;
  contributionMarginPercentage: number;
  rankByContribution: number;
  rankByMarginPercentage: number;
}

export interface MonthlyPricePoint {
  date: string;
  price: number;
  indexedPrice: number; // Normalized price growth: (price / startPrice) * 100
}

export interface IngredientInflation {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  startPrice: number;
  endPrice: number;
  absoluteChange: number;
  percentageChange: number;
  isMajorDriver: boolean;
  monthlyPrices: MonthlyPricePoint[];
}

export interface RecipeReplayPoint {
  date: string;
  dishId: string;
  dishName: string;
  sellingPrice: number;
  recipeCost: number;
  contributionPerServing: number;
  marginPercentage: number;
}

export interface DishRecipeReplay {
  dishId: string;
  dishName: string;
  points: RecipeReplayPoint[];
}

export interface MonthlySalesVolumePoint {
  date: string;
  totalVolume: number;
  volumeByDish: Record<string, number>;
}

export interface DishPopularityMetric {
  dishId: string;
  dishName: string;
  totalVolume: number;
  monthlyAverageVolume: number;
  volumeSharePercentage: number;
}

export interface SalesAnalysis {
  monthlyVolumes: MonthlySalesVolumePoint[];
  dishPopularity: DishPopularityMetric[];
  totalVolumeAllTime: number;
}

export type MenuEngineeringCategory = "STAR" | "PLOWHORSE" | "PUZZLE" | "DOG";

export interface MenuEngineeringDish {
  dishId: string;
  dishName: string;
  averageMonthlyVolume: number;
  averageContributionMargin: number;
  totalContribution: number;
  isHighPopularity: boolean;
  isHighProfitability: boolean;
  category: MenuEngineeringCategory;
}

export interface MenuEngineeringResult {
  popularityThreshold: number;
  profitabilityThreshold: number;
  weightedProfitabilityThreshold: number;
  dishes: MenuEngineeringDish[];
  categoryCounts: {
    stars: number;
    plowhorses: number;
    puzzles: number;
    dogs: number;
  };
}

export interface IngredientCostContribution {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  quantity: number;
  startIngredientPrice: number;
  endIngredientPrice: number;
  startCostComponent: number;
  endCostComponent: number;
  costComponentIncreaseAbsolute: number;
  costComponentIncreasePercentage: number;
  shareOfDishCostIncreasePercentage: number;
}

export interface InflationImpactDish {
  dishId: string;
  dishName: string;
  startPeriod: string;
  endPeriod: string;
  startCost: number;
  endCost: number;
  costIncreaseAbsolute: number;
  costIncreasePercentage: number;
  startMargin: number;
  endMargin: number;
  marginErosionAbsolute: number;
  marginErosionPercentage: number;
  isInflationHurt: boolean;
  ingredientDrivers: IngredientCostContribution[];
}

export interface DishIngredientBreakdownItem {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  recipeUnit: string;
  pricingUnit: string;
  normalizedQuantityInPricingUnit: number;
  unitPrice: number;
  ingredientCost: number; // Exact unrounded cost contribution in INR
  costSharePercentage: number; // (ingredientCost / totalRecipeCost) * 100
}

export interface DishIngredientBreakdown {
  dishId: string;
  dishName: string;
  date: string;
  totalRecipeCost: number; // Reconciled against calculateRecipeCostForDate
  ingredients: DishIngredientBreakdownItem[]; // Sorted descending by ingredientCost
}

// ============================================================================
// STAGE 10: PROFIT FORECAST, COMBO OPTIMIZER & EXECUTIVE REPORT TYPES
// ============================================================================

export type ForecastScenario = "baseline" | "conservative" | "optimistic";

export interface ForecastPoint {
  date: string; // YYYY-MM-DD
  monthIndex: number; // 13, 14, ...
  monthLabel: string; // "Jan 2026", "Feb 2026", etc.
  projectedRevenue: number;
  projectedIngredientCost: number;
  projectedGrossProfit: number;
  projectedGrossMarginPercentage: number;
  projectedSalesVolume: number;
  confidenceInterval: {
    revenueLower: number;
    revenueUpper: number;
    profitLower: number;
    profitUpper: number;
  };
  isForecast: true;
}

export interface ForecastScenarioResult {
  scenario: ForecastScenario;
  label: string;
  description: string;
  horizonMonths: number;
  forecastPoints: ForecastPoint[];
  totalProjectedRevenue: number;
  totalProjectedCost: number;
  totalProjectedGrossProfit: number;
  averageProjectedMarginPercentage: number;
}

export interface ForecastAssumptions {
  historicalMonthsCount: number;
  olsRevenueSlope: number;
  olsRevenueIntercept: number;
  olsCostSlope: number;
  olsCostIntercept: number;
  revenueStandardError: number;
  costStandardError: number;
  rSquaredRevenue: number;
  notes: string[];
}

export interface ProfitForecastResult {
  historicalPoints: MonthlyFinancialPerformance[];
  horizonMonths: number;
  scenarios: {
    baseline: ForecastScenarioResult;
    conservative: ForecastScenarioResult;
    optimistic: ForecastScenarioResult;
  };
  assumptions: ForecastAssumptions;
  limitations: string[];
}

export interface ComboDishItem {
  dishId: string;
  dishName: string;
  category: MenuEngineeringCategory;
  unitSellingPrice: number;
  unitIngredientCost: number;
  contributionMargin: number;
}

export interface ComboCandidate {
  comboId: string;
  comboName: string;
  comboType: "PAIR" | "TRIO";
  rationale: string;
  dishes: ComboDishItem[];
  combinedMenuPrice: number; // Sum of individual selling prices
  bundleDiscountPercentage: number; // e.g. 10
  comboSellingPrice: number; // Discounted combo price in INR
  totalIngredientCost: number; // Sum of ingredient costs
  comboContribution: number; // comboSellingPrice - totalIngredientCost
  comboMarginPercentage: number; // (comboContribution / comboSellingPrice) * 100
  savingsForGuest: number; // combinedMenuPrice - comboSellingPrice
  recommendedMonthlyUnits: number; // Solved by javascript-lp-solver
  projectedMonthlyContribution: number; // recommendedMonthlyUnits * comboContribution
}

export interface ComboOptimizationConstraints {
  monthlyPlateCapacity: number; // e.g. 2000 plates
  bundleDiscountPercentage: number; // e.g. 10
  optimizationGoal: "MAXIMIZE_CONTRIBUTION" | "MAXIMIZE_MARGIN";
  minUnitsPerOfferedCombo?: number;
}

export interface ComboOptimizationResult {
  isFeasible: boolean;
  objectiveValue: number; // Total solved monthly contribution in INR
  totalComboPlatesSold: number;
  monthlyPlateBudget: number;
  averageComboMarginPercentage: number;
  combos: ComboCandidate[];
  constraintsApplied: ComboOptimizationConstraints;
  disclaimer: string;
}

export interface ExecutiveReportData {
  metadata: {
    restaurantName: string;
    reportTitle: string;
    generatedDate: string;
    datasetMode: string;
    provenance: string;
  };
  kpis: {
    annualRevenue: number;
    annualIngredientCost: number;
    annualGrossContribution: number;
    overallMarginPercentage: number;
    totalSalesVolume: number;
  };
  monthlyRunway: MonthlyFinancialPerformance[];
  menuDishes: DishProfitability[];
  menuEngineering: MenuEngineeringResult | null;
  inflationHurtDishes: InflationImpactDish[];
  topSurgingIngredients: {
    ingredientName: string;
    unit: string;
    startPrice: number;
    endPrice: number;
    percentageChange: number;
  }[];
  forecastSummary?: {
    horizonMonths: number;
    baselineRevenue: number;
    baselineContribution: number;
    baselineMarginPercentage: number;
  };
  topCombos?: ComboCandidate[];
}
