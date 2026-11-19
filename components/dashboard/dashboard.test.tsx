import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { formatINR } from "@/utils/formatCurrency";
import { MonthlyKpiCards } from "./MonthlyKpiCards";
import { DishInspectorCard } from "./DishInspectorCard";

describe("Phase 3A: Monthly KPI Cards & Dish Inspector Components", () => {
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
    });
  });

  it("checks store state initialization", () => {
    const state = useAppStore.getState();
    expect(state.monthlyPerformance.length).toBe(12);
    expect(state.dishProfitability.length).toBe(8);
  });

  it("renders 4 monthly KPI cards for December with verified engine values and deltas", () => {
    const state = useAppStore.getState();
    const dec = state.monthlyPerformance[11];
    const html = renderToString(<MonthlyKpiCards />);

    // Card titles
    expect(html).toContain("Monthly Revenue");
    expect(html).toContain("Ingredient Cost (COGS)");
    expect(html).toContain("Gross Contribution");
    expect(html).toContain("Gross Margin %");

    // Dynamic verified engine values
    expect(html).toContain(formatINR(dec.revenue));
    expect(html).toContain(formatINR(dec.ingredientCost));
    expect(html).toContain(formatINR(dec.grossProfit));
    expect(html).toContain(dec.grossMarginPercentage.toFixed(1));

    // Semantic indicators: cost surge & profit erosion
    expect(html).toContain("(Surge)");
    expect(html).toContain("(Erosion)");
    expect(html).toContain("pts vs Jan");
  });

  it("renders baseline labels when January is selected", () => {
    useAppStore.setState({ selectedTimelineDate: "2025-01-01" });
    const state = useAppStore.getState();
    const jan = state.monthlyPerformance[0];
    const html = renderToString(<MonthlyKpiCards />);

    expect(html).toContain("January Baseline");
    expect(html).toContain(formatINR(jan.ingredientCost));
    expect(html).toContain(formatINR(jan.grossProfit));
    expect(html).toContain(jan.grossMarginPercentage.toFixed(1));
    expect(html).toContain("Baseline");
  });

  it("synchronizes setSelectedMonthIndex with selectedTimelineDate in the store", () => {
    const store = useAppStore.getState();
    store.setSelectedMonthIndex(5); // June 2025
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-06-01");

    store.setSelectedMonthIndex(0); // January 2025
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-01-01");

    store.setSelectedMonthIndex(11); // December 2025
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-12-01");
  });

  it("renders dynamic DishInspectorCard with actual canonical engine data for Truffle Tenderloin", () => {
    useAppStore.setState({ selectedDishId: "truffle-tenderloin", selectedTimelineDate: "2025-12-01" });
    const state = useAppStore.getState();
    const dish = state.dishProfitability.find((d) => d.dishId === "truffle-tenderloin")!;
    const html = renderToString(<DishInspectorCard />);

    // Dish identity & quadrant classification
    expect(html).toContain(dish.dishName);
    expect(html).toContain("Puzzle");

    // Selling price
    expect(html).toContain(formatINR(dish.unitSellingPrice));

    // Primary cost driver is Prime Grain-Fed Tenderloin
    expect(html).toContain("Prime Grain-Fed Tenderloin");
    expect(html).toContain("surge");

    // Action CTA
    expect(html).toContain("Simulate Price Surgery");
    expect(html).toContain(dish.dishName);
  });

  it("switches DishInspectorCard seamlessly to Margherita Pizza", () => {
    useAppStore.setState({ selectedDishId: "margherita-pizza", selectedTimelineDate: "2025-01-01" });
    const state = useAppStore.getState();
    const pizza = state.dishProfitability.find((d) => d.dishId === "margherita-pizza")!;
    const html = renderToString(<DishInspectorCard />);

    expect(html).toContain(pizza.dishName);
    expect(html).toContain("Star");
    expect(html).toContain(formatINR(pizza.unitSellingPrice));
  });
});
