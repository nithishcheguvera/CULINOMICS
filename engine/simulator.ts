import {
  DishProfitability,
  MenuEngineeringResult,
  MenuEngineeringCategory,
} from "./types";

export interface DishSimulationScenario {
  dishId: string;
  targetSellingPrice: number;
  targetIngredientCost: number;
  targetMonthlyVolume: number; // strictly non-negative integer
}

export interface ScenarioEconomics {
  sellingPrice: number;
  unitIngredientCost: number;
  contributionPerServing: number;
  contributionMarginPercentage: number | null; // null when sellingPrice <= 0
  monthlyVolume: number;
  monthlyRevenue: number;
  monthlyIngredientCost: number;
  monthlyContribution: number;
}

export interface SimulationDelta {
  sellingPrice: number;
  unitIngredientCost: number;
  contributionPerServing: number;
  contributionMarginPercentage: number | null;
  monthlyVolume: number;
  monthlyRevenue: number;
  monthlyIngredientCost: number;
  monthlyContribution: number;
  percentageChanges: {
    sellingPrice: number | null;
    unitIngredientCost: number | null;
    contributionPerServing: number | null;
    monthlyVolume: number | null;
    monthlyRevenue: number | null;
    monthlyIngredientCost: number | null;
    monthlyContribution: number | null;
  };
}

export interface RestaurantSimulationImpact {
  baselineMonthlyRevenue: number;
  simulatedMonthlyRevenue: number;
  deltaMonthlyRevenue: number;
  baselineMonthlyCost: number;
  simulatedMonthlyCost: number;
  deltaMonthlyCost: number;
  baselineMonthlyContribution: number;
  simulatedMonthlyContribution: number;
  deltaMonthlyContribution: number;
  baselineOverallMarginPercentage: number | null;
  simulatedOverallMarginPercentage: number | null;
  deltaOverallMarginPercentage: number | null;
}

export interface MatrixProjection {
  baselineCategory: MenuEngineeringCategory;
  projectedCategory: MenuEngineeringCategory;
  popularityThreshold: number;
  profitabilityThreshold: number;
  isHighPopularity: boolean;
  isHighProfitability: boolean;
  isPromoted: boolean;
  isDemoted: boolean;
}

export interface DishSimulationResult {
  dishId: string;
  dishName: string;
  baseline: ScenarioEconomics;
  simulated: ScenarioEconomics;
  delta: SimulationDelta;
  restaurantImpact: RestaurantSimulationImpact;
  matrixProjection: MatrixProjection;
}

/**
 * Validates a scenario input strictly, preventing negative numbers or non-integer volume.
 */
export function validateSimulationScenario(scenario: DishSimulationScenario): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!scenario.dishId || typeof scenario.dishId !== "string") {
    errors.push("Invalid or missing dish ID.");
  }
  if (typeof scenario.targetSellingPrice !== "number" || !Number.isFinite(scenario.targetSellingPrice)) {
    errors.push("Selling price must be a finite number.");
  } else if (scenario.targetSellingPrice < 0) {
    errors.push("Selling price cannot be negative.");
  }

  if (typeof scenario.targetIngredientCost !== "number" || !Number.isFinite(scenario.targetIngredientCost)) {
    errors.push("Ingredient cost must be a finite number.");
  } else if (scenario.targetIngredientCost < 0) {
    errors.push("Ingredient cost cannot be negative.");
  }

  if (typeof scenario.targetMonthlyVolume !== "number" || !Number.isFinite(scenario.targetMonthlyVolume)) {
    errors.push("Monthly volume must be a finite number.");
  } else if (scenario.targetMonthlyVolume < 0) {
    errors.push("Monthly volume cannot be negative.");
  } else if (!Number.isInteger(scenario.targetMonthlyVolume)) {
    errors.push("Monthly volume must be an integer.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Helper to calculate percentage change safely without NaN or Infinity.
 */
function calculateSafePercentageChange(baseline: number, simulated: number): number | null {
  if (baseline === 0) {
    if (simulated === 0) return 0;
    return null; // Undefined percentage increase from zero baseline
  }
  return ((simulated - baseline) / Math.abs(baseline)) * 100;
}

/**
 * Creates default scenario parameters seeded from actual ground-truth dish economics.
 */
export function createInitialScenarioForDish(
  dishId: string,
  dishProfitability: DishProfitability[],
  menuEngineering: MenuEngineeringResult,
  monthCountOverride?: number
): DishSimulationScenario {
  const dish = dishProfitability.find((d) => d.dishId === dishId);
  if (!dish) {
    throw new Error(`Cannot initialize simulation: Dish '${dishId}' not found in profitability records.`);
  }

  const meDish = menuEngineering.dishes.find((d) => d.dishId === dishId);
  const derivedMonthCount =
    monthCountOverride ??
    (dish.totalVolume > 0 && meDish?.averageMonthlyVolume
      ? Math.round(dish.totalVolume / meDish.averageMonthlyVolume)
      : 12);

  const monthCount = derivedMonthCount > 0 ? derivedMonthCount : 12;
  const rawMonthlyVolume = meDish ? meDish.averageMonthlyVolume : dish.totalVolume / monthCount;

  return {
    dishId,
    targetSellingPrice: dish.unitSellingPrice,
    targetIngredientCost: dish.unitIngredientCost,
    targetMonthlyVolume: Math.round(rawMonthlyVolume),
  };
}

/**
 * Deterministically simulates the financial, volume, and menu matrix impacts of a scenario.
 * Strictly preserves the underlying ground-truth dataset.
 */
export function simulateDishScenario(
  dishProfitability: DishProfitability[],
  menuEngineering: MenuEngineeringResult,
  scenario: DishSimulationScenario,
  monthCountOverride?: number
): DishSimulationResult {
  const validation = validateSimulationScenario(scenario);
  if (!validation.isValid) {
    throw new Error(`Simulation scenario validation failed: ${validation.errors.join("; ")}`);
  }

  const dish = dishProfitability.find((d) => d.dishId === scenario.dishId);
  if (!dish) {
    throw new Error(`Target dish '${scenario.dishId}' not found in profitability dataset.`);
  }

  const meDish = menuEngineering.dishes.find((d) => d.dishId === scenario.dishId);
  if (!meDish) {
    throw new Error(`Target dish '${scenario.dishId}' not found in menu engineering records.`);
  }

  // Determine actual month count from dataset
  const derivedMonthCount =
    monthCountOverride ??
    (dish.totalVolume > 0 && meDish.averageMonthlyVolume
      ? Math.round(dish.totalVolume / meDish.averageMonthlyVolume)
      : 12);
  const monthCount = derivedMonthCount > 0 ? derivedMonthCount : 12;

  // 1. Reconciled Baseline Values (directly from verified engine outputs)
  // Preserving fractional baseline monthly volume exactly
  const baselineMonthlyVolume = dish.totalVolume / monthCount;
  const baselineMonthlyRevenue = dish.totalRevenue / monthCount;
  const baselineMonthlyCost = dish.totalIngredientCost / monthCount;
  const baselineMonthlyContribution = dish.totalContribution / monthCount;

  const baselineMarginPercentage =
    dish.unitSellingPrice > 0
      ? (dish.contributionPerServing / dish.unitSellingPrice) * 100
      : null;

  const baseline: ScenarioEconomics = {
    sellingPrice: dish.unitSellingPrice,
    unitIngredientCost: dish.unitIngredientCost,
    contributionPerServing: dish.contributionPerServing,
    contributionMarginPercentage: baselineMarginPercentage,
    monthlyVolume: baselineMonthlyVolume,
    monthlyRevenue: baselineMonthlyRevenue,
    monthlyIngredientCost: baselineMonthlyCost,
    monthlyContribution: baselineMonthlyContribution,
  };

  // 2. Simulated Scenario Values
  const simPrice = scenario.targetSellingPrice;
  const simCost = scenario.targetIngredientCost;
  const simVolume = scenario.targetMonthlyVolume;

  const simUnitContribution = simPrice - simCost;
  // Refinement 2: When selling price is zero, contributionMarginPercentage must be null/N/A
  const simMarginPercentage =
    simPrice > 0 ? (simUnitContribution / simPrice) * 100 : null;

  const simMonthlyRevenue = simVolume * simPrice;
  const simMonthlyCost = simVolume * simCost;
  const simMonthlyContribution = simMonthlyRevenue - simMonthlyCost;

  const simulated: ScenarioEconomics = {
    sellingPrice: simPrice,
    unitIngredientCost: simCost,
    contributionPerServing: simUnitContribution,
    contributionMarginPercentage: simMarginPercentage,
    monthlyVolume: simVolume,
    monthlyRevenue: simMonthlyRevenue,
    monthlyIngredientCost: simMonthlyCost,
    monthlyContribution: simMonthlyContribution,
  };

  // 3. Deltas (Simulated - Reconciled Baseline)
  const deltaMonthlyRevenue = simMonthlyRevenue - baselineMonthlyRevenue;
  const deltaMonthlyCost = simMonthlyCost - baselineMonthlyCost;
  const deltaMonthlyContribution = simMonthlyContribution - baselineMonthlyContribution;

  const deltaMarginPercentage =
    simMarginPercentage !== null && baselineMarginPercentage !== null
      ? simMarginPercentage - baselineMarginPercentage
      : null;

  const delta: SimulationDelta = {
    sellingPrice: simPrice - dish.unitSellingPrice,
    unitIngredientCost: simCost - dish.unitIngredientCost,
    contributionPerServing: simUnitContribution - dish.contributionPerServing,
    contributionMarginPercentage: deltaMarginPercentage,
    monthlyVolume: simVolume - baselineMonthlyVolume,
    monthlyRevenue: deltaMonthlyRevenue,
    monthlyIngredientCost: deltaMonthlyCost,
    monthlyContribution: deltaMonthlyContribution,
    percentageChanges: {
      sellingPrice: calculateSafePercentageChange(dish.unitSellingPrice, simPrice),
      unitIngredientCost: calculateSafePercentageChange(dish.unitIngredientCost, simCost),
      contributionPerServing: calculateSafePercentageChange(
        dish.contributionPerServing,
        simUnitContribution
      ),
      monthlyVolume: calculateSafePercentageChange(baselineMonthlyVolume, simVolume),
      monthlyRevenue: calculateSafePercentageChange(baselineMonthlyRevenue, simMonthlyRevenue),
      monthlyIngredientCost: calculateSafePercentageChange(baselineMonthlyCost, simMonthlyCost),
      monthlyContribution: calculateSafePercentageChange(
        baselineMonthlyContribution,
        simMonthlyContribution
      ),
    },
  };

  // 4. Restaurant Portfolio Impact
  const totalRestaurantBaselineMonthlyRev =
    dishProfitability.reduce((sum, d) => sum + d.totalRevenue, 0) / monthCount;
  const totalRestaurantBaselineMonthlyCost =
    dishProfitability.reduce((sum, d) => sum + d.totalIngredientCost, 0) / monthCount;
  const totalRestaurantBaselineMonthlyContribution =
    totalRestaurantBaselineMonthlyRev - totalRestaurantBaselineMonthlyCost;

  const totalRestaurantSimulatedMonthlyRev =
    totalRestaurantBaselineMonthlyRev + deltaMonthlyRevenue;
  const totalRestaurantSimulatedMonthlyCost =
    totalRestaurantBaselineMonthlyCost + deltaMonthlyCost;
  const totalRestaurantSimulatedMonthlyContribution =
    totalRestaurantBaselineMonthlyContribution + deltaMonthlyContribution;

  const baselineOverallMarginPercentage =
    totalRestaurantBaselineMonthlyRev > 0
      ? (totalRestaurantBaselineMonthlyContribution / totalRestaurantBaselineMonthlyRev) * 100
      : null;

  const simulatedOverallMarginPercentage =
    totalRestaurantSimulatedMonthlyRev > 0
      ? (totalRestaurantSimulatedMonthlyContribution / totalRestaurantSimulatedMonthlyRev) * 100
      : null;

  const deltaOverallMarginPercentage =
    simulatedOverallMarginPercentage !== null && baselineOverallMarginPercentage !== null
      ? simulatedOverallMarginPercentage - baselineOverallMarginPercentage
      : null;

  const restaurantImpact: RestaurantSimulationImpact = {
    baselineMonthlyRevenue: totalRestaurantBaselineMonthlyRev,
    simulatedMonthlyRevenue: totalRestaurantSimulatedMonthlyRev,
    deltaMonthlyRevenue,
    baselineMonthlyCost: totalRestaurantBaselineMonthlyCost,
    simulatedMonthlyCost: totalRestaurantSimulatedMonthlyCost,
    deltaMonthlyCost,
    baselineMonthlyContribution: totalRestaurantBaselineMonthlyContribution,
    simulatedMonthlyContribution: totalRestaurantSimulatedMonthlyContribution,
    deltaMonthlyContribution,
    baselineOverallMarginPercentage,
    simulatedOverallMarginPercentage,
    deltaOverallMarginPercentage,
  };

  // 5. Matrix Projection (Kasavana & Smith using baseline thresholds consistently)
  const isHighPopularity = simVolume >= menuEngineering.popularityThreshold;
  const isHighProfitability = simUnitContribution >= menuEngineering.profitabilityThreshold;

  let projectedCategory: MenuEngineeringCategory;
  if (isHighPopularity && isHighProfitability) {
    projectedCategory = "STAR";
  } else if (isHighPopularity && !isHighProfitability) {
    projectedCategory = "PLOWHORSE";
  } else if (!isHighPopularity && isHighProfitability) {
    projectedCategory = "PUZZLE";
  } else {
    projectedCategory = "DOG";
  }

  const categoryRanks: Record<MenuEngineeringCategory, number> = {
    DOG: 1,
    PLOWHORSE: 2,
    PUZZLE: 3,
    STAR: 4,
  };

  const isPromoted = categoryRanks[projectedCategory] > categoryRanks[meDish.category];
  const isDemoted = categoryRanks[projectedCategory] < categoryRanks[meDish.category];

  const matrixProjection: MatrixProjection = {
    baselineCategory: meDish.category,
    projectedCategory,
    popularityThreshold: menuEngineering.popularityThreshold,
    profitabilityThreshold: menuEngineering.profitabilityThreshold,
    isHighPopularity,
    isHighProfitability,
    isPromoted,
    isDemoted,
  };

  return {
    dishId: scenario.dishId,
    dishName: dish.dishName,
    baseline,
    simulated,
    delta,
    restaurantImpact,
    matrixProjection,
  };
}
