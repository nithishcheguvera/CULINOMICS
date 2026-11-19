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
