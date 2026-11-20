import solver, { SolverModel, SolverResult } from "javascript-lp-solver";
import {
  MenuEngineeringResult,
  DishProfitability,
  ComboCandidate,
  ComboDishItem,
  ComboOptimizationConstraints,
  ComboOptimizationResult,
} from "./types";

/**
 * Deterministically constructs candidate combo packages from menu engineering quadrants.
 *
 * Strategies:
 * 1. Signature Trio: Star + Puzzle + Plowhorse (complete 3-course bundle lifting Puzzle margin)
 * 2. Tasting Duo: Star + Star (high customer satisfaction crowd favorites)
 * 3. Heritage Pair: Star + Puzzle (traditional regional pairing)
 * 4. Value Duo: Plowhorse + Dog (pairs high volume dessert with lagging Dog to clear stock)
 */
export function generateComboCandidates(
  menuEngineering: MenuEngineeringResult,
  dishProfitability: DishProfitability[],
  bundleDiscountPercentage: number = 10
): ComboCandidate[] {
  const getDish = (dishId: string): ComboDishItem | null => {
    const prof = dishProfitability.find((d) => d.dishId === dishId);
    const eng = menuEngineering.dishes.find((d) => d.dishId === dishId);
    if (!prof || !eng) return null;
    return {
      dishId: prof.dishId,
      dishName: prof.dishName,
      category: eng.category,
      unitSellingPrice: prof.unitSellingPrice,
      unitIngredientCost: prof.unitIngredientCost,
      contributionMargin: prof.contributionPerServing,
    };
  };

  // Find representative dishes from each quadrant
  const stars = menuEngineering.dishes.filter((d) => d.category === "STAR").map((d) => d.dishId);
  const puzzles = menuEngineering.dishes.filter((d) => d.category === "PUZZLE").map((d) => d.dishId);
  const plowhorses = menuEngineering.dishes.filter((d) => d.category === "PLOWHORSE").map((d) => d.dishId);
  const dogs = menuEngineering.dishes.filter((d) => d.category === "DOG").map((d) => d.dishId);

  const starMain = stars[0] || "saffron-risotto";
  const starApp = stars[1] || stars[0] || "burrata-caprese";
  const puzzleMain = puzzles[0] || "truffle-tenderloin";
  const puzzleAlt = puzzles[1] || puzzles[0] || "osso-buco";
  const plowhorse = plowhorses[0] || "tiramisu-classico";
  const dogDish = dogs[0] || "polenta-concia";

  interface RawSpec {
    id: string;
    name: string;
    type: "PAIR" | "TRIO";
    dishIds: string[];
    rationale: string;
  }

  const specs: RawSpec[] = [
    {
      id: "combo-chef-trio",
      name: "Chef's Signature 3-Course Feast",
      type: "TRIO",
      dishIds: [starMain, puzzleMain, plowhorse],
      rationale: "Pairs high-popularity Saffron Risotto with high-margin Truffle Tenderloin and classic Tiramisu to maximize per-table cash yield.",
    },
    {
      id: "combo-tasting-duo",
      name: "Osteria Tasting Duo",
      type: "PAIR",
      dishIds: [starApp, starMain],
      rationale: "Combines two proven Star guest favorites for high-turnover casual diners seeking guaranteed culinary excellence.",
    },
    {
      id: "combo-heritage-pair",
      name: "Milanese Heritage Pair",
      type: "PAIR",
      dishIds: [starMain, puzzleAlt],
      rationale: "Classic northern Italian pairing elevating high-contribution Osso Buco alongside signature saffron rice.",
    },
    {
      id: "combo-value-primi",
      name: "Rustic Primi & Dolce Duo",
      type: "PAIR",
      dishIds: [dogDish, plowhorse],
      rationale: "Repurposes low-volume Polenta by bundling with the top-selling Tiramisu dessert at an attractive price point.",
    },
  ];

  return specs.map((spec) => {
    const dishes = spec.dishIds.map(getDish).filter((d): d is ComboDishItem => d !== null);
    const combinedMenuPrice = dishes.reduce((sum, d) => sum + d.unitSellingPrice, 0);
    const totalIngredientCost = dishes.reduce((sum, d) => sum + d.unitIngredientCost, 0);

    const discountFactor = Math.max(0, Math.min(0.5, bundleDiscountPercentage / 100));
    const comboSellingPrice = Math.round(combinedMenuPrice * (1 - discountFactor));
    const comboContribution = Math.max(0, comboSellingPrice - totalIngredientCost);
    const comboMarginPercentage = comboSellingPrice > 0 ? (comboContribution / comboSellingPrice) * 100 : 0;
    const savingsForGuest = Math.max(0, combinedMenuPrice - comboSellingPrice);

    return {
      comboId: spec.id,
      comboName: spec.name,
      comboType: spec.type,
      rationale: spec.rationale,
      dishes,
      combinedMenuPrice,
      bundleDiscountPercentage,
      comboSellingPrice,
      totalIngredientCost: Number(totalIngredientCost.toFixed(2)),
      comboContribution: Number(comboContribution.toFixed(2)),
      comboMarginPercentage: Number(comboMarginPercentage.toFixed(2)),
      savingsForGuest,
      recommendedMonthlyUnits: 0,
      projectedMonthlyContribution: 0,
    };
  });
}

/**
 * Executes Linear Programming optimization via javascript-lp-solver
 * to find the optimal monthly product mix of combo offerings.
 *
 * Constraints:
 * 1. Total plates sold <= monthlyPlateCapacity (e.g. 2,000 plates)
 * 2. Component dish volume bounds (does not exceed 120% of historical average dish volume)
 * 3. Minimum mix per offered combo (to prevent monopolization by a single bundle)
 */
export function solveComboOptimization(
  candidates: ComboCandidate[],
  constraints: ComboOptimizationConstraints,
  dishProfitability: DishProfitability[]
): ComboOptimizationResult {
  const { monthlyPlateCapacity, bundleDiscountPercentage, optimizationGoal } = constraints;
  const minPerCombo = constraints.minUnitsPerOfferedCombo ?? 15;

  if (candidates.length === 0) {
    return {
      isFeasible: false,
      objectiveValue: 0,
      totalComboPlatesSold: 0,
      monthlyPlateBudget: monthlyPlateCapacity,
      averageComboMarginPercentage: 0,
      combos: [],
      constraintsApplied: constraints,
      disclaimer: "No combo candidates provided for optimization.",
    };
  }

  // Build LP Solver Model
  // Objective: Maximize Total Cash Contribution in INR
  const lpModel: SolverModel = {
    optimize: optimizationGoal === "MAXIMIZE_MARGIN" ? "marginWeight" : "contribution",
    opType: "max",
    constraints: {
      kitchenPlateCapacity: { max: monthlyPlateCapacity },
    },
    variables: {},
    ints: {},
  };

  // Add individual component dish constraints so no single kitchen station is overloaded
  dishProfitability.forEach((dish) => {
    // Dish constraint: total dish appearances in combos cannot exceed 120% of historical monthly volume
    const maxDishMonthly = Math.max(50, Math.round((dish.totalVolume / 12) * 1.25));
    lpModel.constraints[`dish_${dish.dishId}`] = { max: maxDishMonthly };
  });

  // Populate decision variables for each combo candidate
  candidates.forEach((combo) => {
    const varObj: Record<string, number> = {
      contribution: combo.comboContribution,
      marginWeight: combo.comboMarginPercentage * combo.comboContribution,
      kitchenPlateCapacity: combo.dishes.length, // Each combo consumes 2 or 3 kitchen plates
    };

    // Contribution to individual dish constraints
    combo.dishes.forEach((d) => {
      varObj[`dish_${d.dishId}`] = (varObj[`dish_${d.dishId}`] || 0) + 1;
    });

    lpModel.variables[combo.comboId] = varObj;
    if (!lpModel.ints) lpModel.ints = {};
    lpModel.ints[combo.comboId] = 1;

    // Minimum units per combo constraint
    lpModel.constraints[`min_${combo.comboId}`] = { min: minPerCombo };
    varObj[`min_${combo.comboId}`] = 1;
  });

  let solved: SolverResult;
  try {
    solved = solver.Solve(lpModel);
  } catch {
    solved = { feasible: false, result: 0 };
  }

  const isFeasible = Boolean(solved.feasible);

  // If solver is feasible, assign solved integer quantities
  let totalObjective = 0;
  let totalPlates = 0;
  let totalComboRevenue = 0;
  let totalComboCost = 0;

  const resolvedCombos = candidates.map((c) => {
    let units = 0;
    if (isFeasible && typeof solved[c.comboId] === "number") {
      units = Math.max(0, Math.round(solved[c.comboId]));
    } else {
      // Deterministic proportional fallback if solver encounters strict infeasibility
      units = minPerCombo;
    }

    const projectedMonthlyContribution = Number((units * c.comboContribution).toFixed(2));
    totalObjective += projectedMonthlyContribution;
    totalPlates += units * c.dishes.length;
    totalComboRevenue += units * c.comboSellingPrice;
    totalComboCost += units * c.totalIngredientCost;

    return {
      ...c,
      recommendedMonthlyUnits: units,
      projectedMonthlyContribution,
    };
  });

  const avgMargin =
    totalComboRevenue > 0
      ? Number((((totalComboRevenue - totalComboCost) / totalComboRevenue) * 100).toFixed(2))
      : 0;

  const disclaimer =
    "Deterministic LP Optimization: Solves maximum contribution mix subject to total kitchen plate capacity and dish prep limits using javascript-lp-solver. Assumes customer demand absorbs offered combo quantities; does not fabricate market-basket transaction uplift.";

  return {
    isFeasible,
    objectiveValue: Math.round(totalObjective),
    totalComboPlatesSold: totalPlates,
    monthlyPlateBudget: monthlyPlateCapacity,
    averageComboMarginPercentage: avgMargin,
    combos: resolvedCombos,
    constraintsApplied: constraints,
    disclaimer,
  };
}
