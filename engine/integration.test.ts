import { describe, it, expect } from "vitest";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import {
  calculateMonthlyPerformance,
  calculateDishProfitability,
  calculateMenuEngineering,
  calculateRecipeReplay,
  calculateInflationImpact,
  calculateSalesAnalysis,
  buildDishCostIndex,
} from "@/engine";
import { SaleRecordSchema, MenuItemSchema } from "@/schemas";

const dataset = loadStoryDatasetFromDisk();

describe("Stage 5 System Integration & Financial Consistency", () => {
  const monthlyPerf = calculateMonthlyPerformance(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const dishProf = calculateDishProfitability(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const menuMatrix = calculateMenuEngineering(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const salesAnalysis = calculateSalesAnalysis(dataset.sales);

  const replay = calculateRecipeReplay(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices,
    dataset.sales
  );

  const inflation = calculateInflationImpact(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices
  );

  it("reconciles annual totals between monthly performance and dish profitability", () => {
    // 1. Total Revenue
    const monthlyTotalRev = monthlyPerf.reduce((s, m) => s + m.revenue, 0);
    const dishTotalRev = dishProf.reduce((s, d) => s + d.totalRevenue, 0);
    expect(monthlyTotalRev).toBe(12484800);
    expect(dishTotalRev).toBe(12484800);

    // 2. Total Ingredient Cost
    const monthlyTotalCost = monthlyPerf.reduce((s, m) => s + m.ingredientCost, 0);
    const dishTotalCost = dishProf.reduce((s, d) => s + d.totalIngredientCost, 0);
    expect(monthlyTotalCost).toBeCloseTo(4565176, 0);
    expect(dishTotalCost).toBeCloseTo(monthlyTotalCost, 2);

    // 3. Gross Contribution
    const monthlyTotalProfit = monthlyPerf.reduce((s, m) => s + m.grossProfit, 0);
    const dishTotalContrib = dishProf.reduce((s, d) => s + d.totalContribution, 0);
    expect(monthlyTotalProfit).toBeCloseTo(7919624, 0);
    expect(dishTotalContrib).toBeCloseTo(monthlyTotalProfit, 2);

    // 4. Total Volume
    const dishTotalVol = dishProf.reduce((s, d) => s + d.totalVolume, 0);
    expect(dishTotalVol).toBe(23040);
    expect(salesAnalysis.totalVolumeAllTime).toBe(23040);
  });

  it("verifies all 8 canonical dishes are present in every analytical module", () => {
    const canonicalIds = dataset.menu.map((d) => d.id).sort();
    expect(canonicalIds.length).toBe(8);

    const dishProfIds = dishProf.map((d) => d.dishId).sort();
    expect(dishProfIds).toEqual(canonicalIds);

    const matrixIds = menuMatrix.dishes.map((d) => d.dishId).sort();
    expect(matrixIds).toEqual(canonicalIds);

    const replayIds = replay.map((d) => d.dishId).sort();
    expect(replayIds).toEqual(canonicalIds);

    const inflationIds = inflation.map((d) => d.dishId).sort();
    expect(inflationIds).toEqual(canonicalIds);
  });

  it("verifies programmatic menu engineering thresholds and quadrant integrity", () => {
    expect(menuMatrix.popularityThreshold).toBeCloseTo(240.0, 1);
    expect(menuMatrix.profitabilityThreshold).toBeCloseTo(345.74, 1);

    expect(menuMatrix.categoryCounts.stars).toBe(2);
    expect(menuMatrix.categoryCounts.plowhorses).toBe(1);
    expect(menuMatrix.categoryCounts.puzzles).toBe(3);
    expect(menuMatrix.categoryCounts.dogs).toBe(2);
  });

  it("verifies Recipe Replay data point integrity", () => {
    expect(replay.length).toBe(8);
    replay.forEach((dish) => {
      expect(dish.points.length).toBe(12);
      dish.points.forEach((pt) => {
        expect(pt.sellingPrice).toBeGreaterThan(0);
        expect(pt.recipeCost).toBeGreaterThan(0);
        expect(pt.contributionPerServing).toBeCloseTo(pt.sellingPrice - pt.recipeCost, 6);
      });
    });
  });

  it("verifies inflation impact flags all 3 designated inflation-affected dishes", () => {
    const hurt = inflation.filter((d) => d.isInflationHurt);
    const hurtIds = hurt.map((d) => d.dishId);
    expect(hurt.length).toBeGreaterThanOrEqual(3);
    expect(hurtIds).toContain("classic-tiramisu");
    expect(hurtIds).toContain("prawn-risotto");
    expect(hurtIds).toContain("truffle-tenderloin");
  });

  it("verifies fast $O(1)$ dish cost index builder consistency", () => {
    const costIndex = buildDishCostIndex(dataset.recipes, dataset.ingredientPrices);
    expect(costIndex.size).toBe(12); // 12 monthly dates

    costIndex.forEach((dishCosts) => {
      expect(dishCosts.size).toBe(8); // 8 dishes per month
    });
  });
});

describe("Stage 5 Error Handling & Schema Validation Resilience", () => {
  it("rejects invalid sale record with negative quantity or non-INR currency", () => {
    expect(() =>
      SaleRecordSchema.parse({
        date: "2025-01-01",
        dishId: "margherita-pizza",
        dishName: "Handcrafted Margherita Pizza",
        quantity: -10,
        sellingPrice: 540,
        currency: "INR",
      })
    ).toThrow();

    expect(() =>
      SaleRecordSchema.parse({
        date: "2025-01-01",
        dishId: "margherita-pizza",
        dishName: "Handcrafted Margherita Pizza",
        quantity: 100,
        sellingPrice: 540,
        currency: "USD", // Invalid currency
      })
    ).toThrow();
  });

  it("rejects invalid menu item missing base price or invalid category", () => {
    expect(() =>
      MenuItemSchema.parse({
        id: "test-dish",
        name: "Test Dish",
        category: "InvalidCategory",
        basePrice: -100,
        currency: "INR",
      })
    ).toThrow();
  });
});
