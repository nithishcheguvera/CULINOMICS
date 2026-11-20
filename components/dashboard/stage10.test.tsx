import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { ProfitForecastSection } from "./ProfitForecastSection";
import { ComboOptimizerSection } from "./ComboOptimizerSection";
import { ReportExportSection } from "./ReportExportSection";

describe("Stage 10 UI: Profit Forecast, Combo Optimizer & Report Export", () => {
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
      forecastHorizon: 3,
      forecastScenario: "baseline",
      comboDiscountPercentage: 10,
      comboCapacity: 1500,
    });
  });

  describe("Deliverable A: ProfitForecastSection", () => {
    it("renders heading, OLS econometric explanation, horizon controls, and projection cards", () => {
      const html = renderToString(<ProfitForecastSection />);

      expect(html).toContain("Deterministic Profit Forecast (OLS Linear Trend)");
      expect(html).toContain("Ordinary Least Squares (OLS) econometric regression");
      expect(html).toContain("3-Month Horizon");
      expect(html).toContain("6-Month Horizon");
      expect(html).toContain("Active Scenario:");
      expect(html).toContain("Projected Total Revenue");
      expect(html).toContain("Projected Food Cost (COGS)");
      expect(html).toContain("Projected Gross Contribution");
      expect(html).toContain("Average Projected Margin");
      expect(html).toContain("Detailed Monthly Projection Schedule");
      expect(html).toContain("Forecast Assumptions &amp; Econometric Invariants");
    });

    it("switches horizon to 6 months and renders expanded projection schedule", () => {
      useAppStore.setState({ forecastHorizon: 6 });
      const html = renderToString(<ProfitForecastSection />);

      expect(html).toContain("upcoming operational months");
      expect(html).toContain("Jun 2026");
    });

    it("switches to conservative scenario and displays inflation surge assumption", () => {
      useAppStore.setState({ forecastScenario: "conservative" });
      const html = renderToString(<ProfitForecastSection />);

      expect(html).toContain("+25% inflation surge modeled");
    });
  });

  describe("Deliverable B: ComboOptimizerSection", () => {
    it("renders LP solver objective value, capacity utilization, disclaimer, and candidate cards", () => {
      const html = renderToString(<ComboOptimizerSection />);

      expect(html).toContain("Menu Combo Optimizer &amp; LP Mix Planner");
      expect(html).toContain("Deterministic Linear Programming mix solver");
      expect(html).toContain("Mathematical Feasibility Disclaimer:");
      expect(html).toContain("javascript-lp-solver");
      expect(html).toContain("Optimal Monthly Contribution");
      expect(html).toContain("Capacity Utilization");
      expect(html).toContain("Average Combo Gross Margin");
      expect(html).toContain("Optimal • Feasible");

      // Verify combo candidate cards
      expect(html).toContain("Osteria Tasting Duo");
      expect(html).toContain("Milanese Heritage Pair");
      expect(html).toContain("Recommended Monthly Production:");
      expect(html).toContain("Monthly Gross Impact:");
    });

    it("updates solver parameters when capacity or discount changes", () => {
      useAppStore.getState().setComboDiscountPercentage(15);
      useAppStore.getState().setComboCapacity(2000);
      const html = renderToString(<ComboOptimizerSection />);

      expect(html).toContain("2,000");
      expect(html).toContain("15");
    });
  });

  describe("Deliverable C: ReportExportSection", () => {
    it("renders document header, export toolbar buttons, scorecard, and runway table", () => {
      const html = renderToString(<ReportExportSection />);

      expect(html).toContain("Executive Profit Intelligence Report &amp; Export");
      expect(html).toContain("Financial Runway CSV");
      expect(html).toContain("Menu Matrix CSV");
      expect(html).toContain("Forecast &amp; Combos CSV");
      expect(html).toContain("Print / Save PDF Report");

      // Document contents
      expect(html).toContain("Osteria Bella");
      expect(html).toContain("Executive Profit Intelligence &amp; Menu Engineering Report");
      expect(html).toContain("1. Annual Financial Performance Summary");
      expect(html).toContain("2. Major Ingredient Inflation Surges");
      expect(html).toContain("3. Menu Engineering Quadrants &amp; Benchmarks");
      expect(html).toContain("4. 12-Month Chronological Performance Breakdown");
      expect(html).toContain("5. Strategic Projections &amp; Recommended Bundles");
    });
  });
});
