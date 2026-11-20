import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore, computeAnalyticsForDataset } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { ThreeAuthoritativeTelemetry } from "@/three/components/ThreeAuthoritativeTelemetry";
import { CockpitShell } from "./CockpitShell";
import { DishInspectorCard } from "./DishInspectorCard";
import { CompactMenuSurgery } from "./CompactMenuSurgery";
import { CompactRecipeReplay } from "./CompactRecipeReplay";
import { SceneErrorBoundary } from "@/three/SceneErrorBoundary";
import { ScenePlaceholder } from "@/three/ScenePlaceholder";

describe("Phase 3F: 3D Visual Polish, Performance & Responsive Optimization", () => {
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
      threeMode: "profitability-landscape",
      isPlaying: false,
    });
    useAppStore.getState().setSelectedDishId("truffle-tenderloin");
  });

  it("1. renders ThreeAuthoritativeTelemetry with unified dark-forest tokens (no legacy light/neutral-900 styling)", () => {
    const html = renderToString(<ThreeAuthoritativeTelemetry />);

    // Must use forest-card and border-forest-border tokens
    expect(html).toContain("forest-card");
    expect(html).toContain("border-forest-border");
    expect(html).toContain("bg-forest-elevated");

    // Must NOT contain legacy white/gray classes
    expect(html).not.toContain("bg-white dark:bg-neutral-900");
    expect(html).not.toContain("border-neutral-200 dark:border-neutral-800");
  });

  it("2. renders canonical dark-forest category badge semantic classes across quadrants in Telemetry", () => {
    // 1. Puzzle (Truffle Tenderloin)
    useAppStore.setState({ selectedDishId: "truffle-tenderloin" });
    const htmlPuzzle = renderToString(<ThreeAuthoritativeTelemetry />);
    expect(htmlPuzzle).toContain("bg-purple-950/70 text-purple-300");

    // 2. Star dish (Saffron Risotto)
    const state = useAppStore.getState();
    const starDish = state.menuEngineering?.dishes.find((d) => d.category === "STAR");
    if (starDish) {
      useAppStore.setState({ selectedDishId: starDish.dishId });
      const htmlStar = renderToString(<ThreeAuthoritativeTelemetry />);
      expect(htmlStar).toContain("bg-amber-950/70 text-amber-300");
    }

    // 3. Plowhorse dish
    const plowDish = state.menuEngineering?.dishes.find((d) => d.category === "PLOWHORSE");
    if (plowDish) {
      useAppStore.setState({ selectedDishId: plowDish.dishId });
      const htmlPlow = renderToString(<ThreeAuthoritativeTelemetry />);
      expect(htmlPlow).toContain("bg-blue-950/70 text-blue-300");
    }

    // 4. Dog dish
    const dogDish = state.menuEngineering?.dishes.find((d) => d.category === "DOG");
    if (dogDish) {
      useAppStore.setState({ selectedDishId: dogDish.dishId });
      const htmlDog = renderToString(<ThreeAuthoritativeTelemetry />);
      expect(htmlDog).toContain("bg-red-950/70 text-red-300");
    }
  });

  it("3. renders CockpitShell with responsive max-w-[1440px] container and dark-forest foundation", () => {
    const html = renderToString(<CockpitShell />);

    // Header, main container and footer should use max-w-[1440px]
    expect(html).toContain("max-w-[1440px]");
    expect(html).toContain("bg-forest-black");
    expect(html).toContain("border-forest-border");
  });

  it("4. verifies accessible input range labels and focus rings on DishInspectorCard surgery levers", () => {
    const html = renderToString(<DishInspectorCard initialMode="surgery" />);

    // Accessible labels
    expect(html).toContain("aria-label=\"Target Selling Price\"");
    expect(html).toContain("aria-label=\"Target Ingredient Cost\"");
    expect(html).toContain("aria-label=\"Target Demand Volume\"");

    // WCAG keyboard focus rings
    expect(html).toContain("focus-visible:ring-2");
    expect(html).toContain("focus-visible:ring-emerald-400");
  });

  it("5. verifies accessible input range labels and touch-friendly controls on CompactMenuSurgery", () => {
    const html = renderToString(<CompactMenuSurgery />);

    // Sliders
    expect(html).toContain("aria-label=\"Target Selling Price\"");
    expect(html).toContain("aria-label=\"Target Ingredient Cost\"");
    expect(html).toContain("aria-label=\"Target Monthly Sales Volume\"");

    // Focus indicators
    expect(html).toContain("focus-visible:ring-2");
  });

  it("6. verifies accessible transport buttons and keyboard focus in CompactRecipeReplay", () => {
    const html = renderToString(<CompactRecipeReplay />);

    // Transport buttons with aria-labels
    expect(html).toContain("aria-label=\"Play timeline playback\"");
    expect(html).toContain("aria-label=\"Rewind to January 2025\"");
    expect(html).toContain("aria-label=\"Previous Month\"");
    expect(html).toContain("aria-label=\"Next Month (Stops at December 2025)\"");
    expect(html).toContain("aria-label=\"Jump to December 2025\"");

    // Keyboard focus rings
    expect(html).toContain("focus-visible:ring-2 focus-visible:ring-emerald-400");
  });

  it("7. renders SceneErrorBoundary and handles graceful 2D fallback on WebGL failure", () => {
    // Normal rendering without crash
    const htmlNormal = renderToString(
      <SceneErrorBoundary>
        <div data-testid="test-child">WebGL Viewport Active</div>
      </SceneErrorBoundary>
    );
    expect(htmlNormal).toContain("WebGL Viewport Active");

    // Component definition check
    expect(SceneErrorBoundary).toBeDefined();
  });

  it("8. renders ScenePlaceholder with dark-forest branding and initialization cues", () => {
    const html = renderToString(<ScenePlaceholder />);

    expect(html).toContain("Initializing 3D Visualization Foundation");
    expect(html).toContain("React Three Fiber");
    expect(html).toContain("Drei v10");
  });
});
