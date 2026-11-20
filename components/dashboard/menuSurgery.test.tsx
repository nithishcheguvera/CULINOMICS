import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { formatINR } from "@/utils/formatCurrency";
import { CompactMenuSurgery } from "./CompactMenuSurgery";
import { DishInspectorCard } from "./DishInspectorCard";

describe("Phase 3C: Menu Surgery Cockpit Integration", () => {
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
      isPlaying: false,
    });
    // Initialize scenario for truffle-tenderloin
    useAppStore.getState().setSelectedDishId("truffle-tenderloin");
  });

  it("renders CompactMenuSurgery with ground-truth baseline economics for Truffle Butter Tenderloin Steak", () => {
    const state = useAppStore.getState();
    const result = state.scenarioResult!;
    expect(result).toBeDefined();
    expect(result.dishId).toBe("truffle-tenderloin");

    const html = renderToString(<CompactMenuSurgery />);

    // Header & Badges
    expect(html).toContain("Menu Surgery™ Cockpit Lab");
    expect(html).toContain("Deterministic In-Memory Simulation");
    expect(html).toContain("Truffle Butter Tenderloin Steak");
    expect(html).toContain("PUZZLE");

    // Baseline Economics
    expect(html).toContain(formatINR(result.baseline.sellingPrice));
    expect(html).toContain(formatINR(result.baseline.unitIngredientCost, { showDecimals: true }));
    expect(html).toContain(formatINR(result.baseline.contributionPerServing, { showDecimals: true }));
  });

  it("simulates price increase and updates contribution per serving deterministically", () => {
    const store = useAppStore.getState();
    const initialBaseline = store.scenarioResult!.baseline.sellingPrice; // 980

    // Raise price by 120 -> 1100
    store.updateScenario({
      ...store.activeScenario!,
      targetSellingPrice: 1100,
    });

    const updatedResult = useAppStore.getState().scenarioResult!;
    expect(updatedResult.simulated.sellingPrice).toBe(1100);
    expect(updatedResult.delta.sellingPrice).toBe(1100 - initialBaseline);
    expect(updatedResult.delta.contributionPerServing).toBeCloseTo(1100 - initialBaseline, 4);

    const html = renderToString(<CompactMenuSurgery />);
    expect(html).toContain(formatINR(1100));
    expect(html).toContain("+₹120.00");
  });

  it("simulates ingredient cost reduction and verifies margin expansion", () => {
    const store = useAppStore.getState();
    const baseCost = store.scenarioResult!.baseline.unitIngredientCost;

    // Reduce cost by 76.24 -> 350
    store.updateScenario({
      ...store.activeScenario!,
      targetIngredientCost: 350,
    });

    const updated = useAppStore.getState().scenarioResult!;
    expect(updated.simulated.unitIngredientCost).toBe(350);
    expect(updated.simulated.contributionPerServing).toBeGreaterThan(updated.baseline.contributionPerServing);
    expect(updated.simulated.contributionMarginPercentage).toBeGreaterThan(updated.baseline.contributionMarginPercentage!);
  });

  it("simulates volume expansion and computes restaurant-wide net contribution impact", () => {
    const store = useAppStore.getState();
    const baseVolume = store.scenarioResult!.baseline.monthlyVolume;

    store.updateScenario({
      ...store.activeScenario!,
      targetMonthlyVolume: Math.round(baseVolume) + 50,
    });

    const updated = useAppStore.getState().scenarioResult!;
    expect(updated.restaurantImpact.deltaMonthlyRevenue).toBeGreaterThan(0);
    expect(updated.restaurantImpact.deltaMonthlyContribution).toBeGreaterThan(0);
  });

  it("promotes a Puzzle dish to Star when high volume and profitability thresholds are met", () => {
    const store = useAppStore.getState();

    // High volume and price
    store.updateScenario({
      ...store.activeScenario!,
      targetSellingPrice: 1200,
      targetMonthlyVolume: 600,
    });

    const updated = useAppStore.getState().scenarioResult!;
    expect(updated.matrixProjection.isPromoted).toBe(true);
    expect(updated.matrixProjection.projectedCategory).toBe("STAR");

    const html = renderToString(<CompactMenuSurgery />);
    expect(html).toContain("PROMOTED");
    expect(html).toContain("STAR");
  });

  it("resets scenario to baseline values when resetScenario is triggered", () => {
    const store = useAppStore.getState();

    // Modify scenario
    store.updateScenario({
      ...store.activeScenario!,
      targetSellingPrice: 1400,
      targetMonthlyVolume: 500,
    });
    expect(useAppStore.getState().scenarioResult!.delta.sellingPrice).not.toBe(0);

    // Reset
    store.resetScenario();
    const resetResult = useAppStore.getState().scenarioResult!;
    expect(resetResult.delta.sellingPrice).toBe(0);
    expect(resetResult.delta.monthlyVolume).toBe(0);
    expect(resetResult.delta.contributionPerServing).toBe(0);
  });

  it("synchronizes surgery scenario when selectedDishId changes", () => {
    const store = useAppStore.getState();
    store.setSelectedDishId("prawn-risotto");

    const updatedState = useAppStore.getState();
    expect(updatedState.selectedDishId).toBe("prawn-risotto");
    expect(updatedState.activeScenario!.dishId).toBe("prawn-risotto");
    expect(updatedState.scenarioResult!.dishName).toContain("Tiger Prawn");
  });

  it("strictly preserves historical baseline datasets intact during active simulation", () => {
    const beforeMonthlyRev = useAppStore.getState().monthlyPerformance[11].revenue;
    const beforeDishPrice = useAppStore.getState().dishProfitability.find(d => d.dishId === "truffle-tenderloin")!.unitSellingPrice;

    // Apply aggressive simulation
    useAppStore.getState().updateScenario({
      ...useAppStore.getState().activeScenario!,
      targetSellingPrice: 2000,
      targetIngredientCost: 100,
      targetMonthlyVolume: 1000,
    });

    // Verify historical baseline datasets were NEVER mutated
    expect(useAppStore.getState().monthlyPerformance[11].revenue).toBe(beforeMonthlyRev);
    expect(useAppStore.getState().dishProfitability.find(d => d.dishId === "truffle-tenderloin")!.unitSellingPrice).toBe(beforeDishPrice);
  });

  it("renders DishInspectorCard with toggle support between Inspector and Surgery modes", () => {
    const html = renderToString(<DishInspectorCard />);
    expect(html).toContain("Inspector");
    expect(html).toContain("Surgery");
    expect(html).toContain("Truffle Butter Tenderloin Steak");
  });
});
