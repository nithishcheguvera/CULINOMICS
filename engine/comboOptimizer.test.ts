import { describe, it, expect, beforeEach } from "vitest";
import { generateComboCandidates, solveComboOptimization } from "./comboOptimizer";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { MenuEngineeringResult, DishProfitability } from "./types";

describe("Stage 10: Deterministic Combo Optimizer & javascript-lp-solver Integration", () => {
  let menuEngineering: MenuEngineeringResult;
  let dishProfitability: DishProfitability[];

  beforeEach(() => {
    const dataset = loadStoryDatasetFromDisk();
    const analytics = computeAnalyticsForDataset(dataset);
    menuEngineering = analytics.menuEngineering!;
    dishProfitability = analytics.dishProfitability;
  });

  it("generates 4 strategic combo candidates with verified dish linkages and bundle discounts", () => {
    const candidates = generateComboCandidates(menuEngineering, dishProfitability, 10);

    expect(candidates.length).toBe(4);

    // Trio check
    const trio = candidates.find((c) => c.comboType === "TRIO")!;
    expect(trio).toBeDefined();
    expect(trio.dishes.length).toBe(3);
    expect(trio.bundleDiscountPercentage).toBe(10);

    // Mathematical verification of prices and discounts
    candidates.forEach((combo) => {
      const sumPrices = combo.dishes.reduce((acc, d) => acc + d.unitSellingPrice, 0);
      expect(combo.combinedMenuPrice).toBe(sumPrices);

      const expectedDiscountPrice = Math.round(sumPrices * 0.9);
      expect(combo.comboSellingPrice).toBe(expectedDiscountPrice);

      const sumCosts = combo.dishes.reduce((acc, d) => acc + d.unitIngredientCost, 0);
      expect(combo.totalIngredientCost).toBeCloseTo(sumCosts, 2);

      expect(combo.comboContribution).toBeCloseTo(combo.comboSellingPrice - combo.totalIngredientCost, 2);
      expect(combo.savingsForGuest).toBe(combo.combinedMenuPrice - combo.comboSellingPrice);
    });
  });

  it("solves optimal product mix subject to total kitchen plate capacity using javascript-lp-solver", () => {
    const candidates = generateComboCandidates(menuEngineering, dishProfitability, 10);
    const capacity = 1500; // 1,500 plates per month

    const result = solveComboOptimization(
      candidates,
      {
        monthlyPlateCapacity: capacity,
        bundleDiscountPercentage: 10,
        optimizationGoal: "MAXIMIZE_CONTRIBUTION",
        minUnitsPerOfferedCombo: 10,
      },
      dishProfitability
    );

    expect(result.isFeasible).toBe(true);
    expect(result.objectiveValue).toBeGreaterThan(0);
    expect(result.totalComboPlatesSold).toBeLessThanOrEqual(capacity);
    expect(result.averageComboMarginPercentage).toBeGreaterThan(0);

    // Each combo has recommended monthly units >= 10
    result.combos.forEach((c) => {
      expect(c.recommendedMonthlyUnits).toBeGreaterThanOrEqual(10);
      expect(c.projectedMonthlyContribution).toBe(
        Number((c.recommendedMonthlyUnits * c.comboContribution).toFixed(2))
      );
    });

    // Sum of projected contributions equals objective value
    const sumContrib = result.combos.reduce((acc, c) => acc + c.projectedMonthlyContribution, 0);
    expect(result.objectiveValue).toBe(Math.round(sumContrib));
  });

  it("handles edge cases: empty candidate array returns safe infeasible result without crashing", () => {
    const result = solveComboOptimization(
      [],
      {
        monthlyPlateCapacity: 1000,
        bundleDiscountPercentage: 10,
        optimizationGoal: "MAXIMIZE_CONTRIBUTION",
      },
      dishProfitability
    );

    expect(result.isFeasible).toBe(false);
    expect(result.objectiveValue).toBe(0);
    expect(result.combos.length).toBe(0);
  });
});
