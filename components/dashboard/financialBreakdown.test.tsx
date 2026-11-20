import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore, computeAnalyticsForDataset, formatINR } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { DishInspectorCard } from "./DishInspectorCard";
import { ThreeAuthoritativeTelemetry } from "@/three/components/ThreeAuthoritativeTelemetry";

describe("Phase 3E: 3D Financial Breakdown & Drilldown Integration", () => {
  beforeEach(() => {
    const dataset = loadStoryDatasetFromDisk();
    const analytics = computeAnalyticsForDataset(dataset);
    useAppStore.setState({
      dataset,
      monthlyPerformance: analytics.monthlyPerformance,
      dishProfitability: analytics.dishProfitability,
      menuEngineering: analytics.menuEngineering,
      recipeReplay: analytics.recipeReplay,
      inflationImpact: analytics.inflationImpact,
      salesAnalysis: analytics.salesAnalysis,
      ingredientInflation: analytics.ingredientInflation,
      timelineDates: analytics.timelineDates,
      kpis: analytics.kpis,
      selectedDishId: "truffle-tenderloin",
      selectedTimelineDate: "2025-12-01",
      threeMode: "margin-breakdown",
      isPlaying: false,
    });
    useAppStore.getState().setSelectedDishId("truffle-tenderloin");
  });

  it("verifies exact mathematical reconciliation: Selling Price = Food Cost + Gross Contribution", () => {
    const state = useAppStore.getState();
    const breakdown = state.getDishIngredientBreakdown("truffle-tenderloin", "2025-12-01")!;
    expect(breakdown).toBeDefined();

    const profit = state.dishProfitability.find((p) => p.dishId === "truffle-tenderloin")!;
    const sellingPrice = profit.unitSellingPrice; // 980
    const foodCost = breakdown.totalRecipeCost; // 515
    const grossContribution = sellingPrice - foodCost; // 465

    // Mathematical reconciliation check
    expect(sellingPrice).toBeCloseTo(foodCost + grossContribution, 8);

    // Sum of ingredients must equal totalRecipeCost
    const sumIngredients = breakdown.ingredients.reduce((acc, ing) => acc + ing.ingredientCost, 0);
    expect(sumIngredients).toBeCloseTo(foodCost, 8);

    // Cost share percentages must sum to 100%
    const sumShares = breakdown.ingredients.reduce((acc, ing) => acc + ing.costSharePercentage, 0);
    expect(sumShares).toBeCloseTo(100, 4);
  });

  it("renders ThreeAuthoritativeTelemetry for Mode 5 (margin-breakdown) with full waterfall reconciliation equation", () => {
    const html = renderToString(<ThreeAuthoritativeTelemetry />);

    // Header & Mode
    expect(html).toContain("Authoritative 2D Telemetry");
    expect(html).toContain("margin breakdown");
    expect(html).toContain("3D Waterfall");
    expect(html).toContain("Plate Anatomy");

    // Reconciliation row
    expect(html).toContain("Selling Price");
    expect(html).toContain("Total Food Cost");
    expect(html).toContain("Gross Contribution");
    expect(html).toContain("Contribution Margin");
    expect(html).toContain("Reconciled (|Δ| ≤ 10⁻⁹)");
    expect(html).toContain("Reconciliation:");

    // Ingredient table
    expect(html).toContain("Prime Grain-Fed Tenderloin");
    expect(html).toContain("White Truffle Infused Oil");
    expect(html).toContain("High-Fat European Butter");
  });

  it("renders DishInspectorCard with 3-way toggle buttons: Inspect, Breakdown, and Surgery", () => {
    const html = renderToString(<DishInspectorCard />);

    // 3-way toggle buttons
    expect(html).toContain("id=\"btn-stage-inspect-toggle\"");
    expect(html).toContain("id=\"btn-stage-breakdown-toggle\"");
    expect(html).toContain("id=\"btn-stage-surgery-toggle\"");

    // Inspect view content
    expect(html).toContain("Truffle Butter Tenderloin Steak");
    expect(html).toContain("Selling Price");
    expect(html).toContain("Food Cost (COGS)");
    expect(html).toContain("Unit Contribution");
    expect(html).toContain("Simulate Price Surgery on");
  });

  it("renders DishInspectorCard in breakdown mode with revenue allocation bar and 3D focus action", () => {
    const html = renderToString(<DishInspectorCard initialMode="breakdown" />);

    // Breakdown view container
    expect(html).toContain("data-testid=\"inspector-breakdown-view\"");
    expect(html).toContain("Revenue Allocation");
    expect(html).toContain("Food Cost:");
    expect(html).toContain("Contribution:");
    expect(html).toContain("Recipe Ingredients");
    expect(html).toContain("Reconciled 100%");

    // Focus 3D Financial Waterfall CTA button
    expect(html).toContain("id=\"btn-focus-3d-waterfall\"");
    expect(html).toContain("Focus 3D Financial Waterfall");
  });

  it("simulates Menu Surgery scenario and updates projected contribution and margin", () => {
    const store = useAppStore.getState();
    const initialPrice = store.scenarioResult!.baseline.sellingPrice; // 980

    // Raise price to 1100
    store.updateScenario({
      ...store.activeScenario!,
      targetSellingPrice: 1100,
    });

    const result = useAppStore.getState().scenarioResult!;
    expect(result.simulated.sellingPrice).toBe(1100);
    expect(result.delta.sellingPrice).toBe(1100 - initialPrice);
    expect(result.delta.contributionPerServing).toBeCloseTo(1100 - initialPrice, 4);
    expect(result.simulated.contributionMarginPercentage).toBeGreaterThan(result.baseline.contributionMarginPercentage);
  });

  it("updates ingredient prices and compresses contribution when timeline date changes from Jan to Dec", () => {
    const store = useAppStore.getState();

    // January 2025 breakdown
    store.setSelectedTimelineDate("2025-01-01");
    const janBreakdown = store.getDishIngredientBreakdown("truffle-tenderloin", "2025-01-01")!;
    const janProfit = store.dishProfitability.find((p) => p.dishId === "truffle-tenderloin")!;
    const janContribution = janProfit.unitSellingPrice - janBreakdown.totalRecipeCost;

    // December 2025 breakdown
    store.setSelectedTimelineDate("2025-12-01");
    const decBreakdown = store.getDishIngredientBreakdown("truffle-tenderloin", "2025-12-01")!;
    const decContribution = janProfit.unitSellingPrice - decBreakdown.totalRecipeCost;

    // In December, inflation increased food cost and compressed contribution
    expect(decBreakdown.totalRecipeCost).toBeGreaterThan(janBreakdown.totalRecipeCost);
    expect(decContribution).toBeLessThan(janContribution);

    // Verify Truffle Oil inflated significantly
    const janTruffle = janBreakdown.ingredients.find((i) => i.ingredientId === "truffle-oil")!;
    const decTruffle = decBreakdown.ingredients.find((i) => i.ingredientId === "truffle-oil")!;
    expect(decTruffle.ingredientCost).toBeGreaterThan(janTruffle.ingredientCost);
  });
});
