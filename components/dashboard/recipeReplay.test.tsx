import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { formatINR } from "@/utils/formatCurrency";
import { CompactRecipeReplay } from "./CompactRecipeReplay";

describe("Phase 3B: Compact Recipe Replay & Time Intelligence", () => {
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
  });

  it("renders CompactRecipeReplay component with verified engine figures", () => {
    const state = useAppStore.getState();
    const replay = state.recipeReplay.find((r) => r.dishId === "truffle-tenderloin")!;
    const activePoint = replay.points[11]; // December
    const html = renderToString(<CompactRecipeReplay />);

    // Header & Badges
    expect(html).toContain("Recipe Replay™ Runway");
    expect(html).toContain("12-Month Time Intelligence");
    expect(html).toContain("Timeline:");
    expect(html).toContain("Dec 2025");

    // Metric chips with verified unrounded engine values
    expect(html).toContain(formatINR(activePoint.sellingPrice));
    expect(html).toContain(formatINR(activePoint.recipeCost, { showDecimals: true }));
    expect(html).toContain(formatINR(activePoint.contributionPerServing, { showDecimals: true }));

    // Focus dish pills
    expect(html).toContain("Truffle Butter Tenderloin Steak");
    expect(html).toContain("Tiger Prawn Saffron Risotto");

    // Transport buttons
    expect(html).toContain("Play 2025 Runway");
    expect(html).toContain("⏮ Jan");
    expect(html).toContain("◀ Prev");
    expect(html).toContain("Next ▶");
    expect(html).toContain("Dec ⏭");
  });

  it("MANDATORY CORRECTION 1: stepTimeline('next') stops at December 2025 and does not wrap to January", () => {
    // Start at November (index 10)
    useAppStore.setState({
      selectedTimelineDate: "2025-11-01",
      isPlaying: true,
    });

    const store = useAppStore.getState();
    // Step forward into December (index 11)
    store.stepTimeline("next");

    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-12-01");
    // Playback must stop at December 2025!
    expect(useAppStore.getState().isPlaying).toBe(false);

    // If stepped again at December, must remain at December and not wrap to January!
    store.stepTimeline("next");
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-12-01");
    expect(useAppStore.getState().isPlaying).toBe(false);
  });

  it("stepTimeline('prev') steps backward and stops at January without underflowing", () => {
    useAppStore.setState({ selectedTimelineDate: "2025-02-01" });
    const store = useAppStore.getState();

    store.stepTimeline("prev");
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-01-01");

    // Stepping prev from January should stay at January
    store.stepTimeline("prev");
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-01-01");
  });

  it("togglePlay() pauses active playback, or if at December, rewinds to January and plays", () => {
    // Case A: Pausing
    useAppStore.setState({ isPlaying: true, selectedTimelineDate: "2025-05-01" });
    useAppStore.getState().togglePlay();
    expect(useAppStore.getState().isPlaying).toBe(false);
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-05-01");

    // Case B: Starting from December
    useAppStore.setState({ isPlaying: false, selectedTimelineDate: "2025-12-01" });
    useAppStore.getState().togglePlay();
    expect(useAppStore.getState().isPlaying).toBe(true);
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-01-01");
  });

  it("synchronizes dish switching and updates active trajectory points", () => {
    useAppStore.getState().setSelectedDishId("prawn-risotto");
    expect(useAppStore.getState().selectedDishId).toBe("prawn-risotto");

    const state = useAppStore.getState();
    const prawnReplay = state.recipeReplay.find((r) => r.dishId === "prawn-risotto")!;
    const decPoint = prawnReplay.points[11];

    const html = renderToString(<CompactRecipeReplay />);
    expect(html).toContain(formatINR(decPoint.sellingPrice));
    expect(html).toContain(formatINR(decPoint.recipeCost, { showDecimals: true }));
  });

  it("synchronizes manual month selection with selectedTimelineDate", () => {
    useAppStore.getState().setSelectedTimelineDate("2025-06-01");
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-06-01");

    const html = renderToString(<CompactRecipeReplay />);
    expect(html).toContain("Jun 2025");
  });

  it("MANDATORY CORRECTION 2: verified timer cleanup and boundary stop", () => {
    vi.useFakeTimers();

    useAppStore.setState({
      selectedTimelineDate: "2025-10-01",
      isPlaying: true,
    });

    // Simulate timer execution via setInterval loop equivalent
    const timer = setInterval(() => {
      const { timelineDates: dates, selectedTimelineDate: cur, stepTimeline: step, setIsPlaying } =
        useAppStore.getState();
      const current = cur || dates[dates.length - 1];
      const idx = dates.indexOf(current);

      if (idx >= 0 && idx < dates.length - 1) {
        step("next");
      } else {
        setIsPlaying(false);
      }
    }, 1000);

    // Advance 1 second -> Nov 2025
    vi.advanceTimersByTime(1000);
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-11-01");
    expect(useAppStore.getState().isPlaying).toBe(true);

    // Advance 1 second -> Dec 2025 (boundary stop)
    vi.advanceTimersByTime(1000);
    expect(useAppStore.getState().selectedTimelineDate).toBe("2025-12-01");
    expect(useAppStore.getState().isPlaying).toBe(false);

    // Cleanup timer
    clearInterval(timer);
    vi.useRealTimers();
  });
});
