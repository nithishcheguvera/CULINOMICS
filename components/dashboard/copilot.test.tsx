import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { useAppStore } from "@/store/useAppStore";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { computeAnalyticsForDataset } from "@/store/useAppStore";
import { CockpitAiCopilot } from "./CockpitAiCopilot";
import { createAuthoritativeFact } from "@/ai/tools/factFactory";
import { generateDeterministicFallbackResponse } from "@/app/api/assistant/demoFallback";

describe("Phase 3D: AI Decision Copilot Cockpit Integration", () => {
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
      assistantMessages: [],
      isAssistantLoading: false,
      assistantError: null,
    });
    useAppStore.getState().setSelectedDishId("truffle-tenderloin");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders CockpitAiCopilot with header, context pills, and suggested prompt chips", () => {
    const html = renderToString(<CockpitAiCopilot />);

    expect(html).toContain("AI Profit Copilot");
    expect(html).toContain("Engine Verified");
    expect(html).toContain("Truffle Butter Tenderloin Steak");
    expect(html).toContain("Dec 2025");
    expect(html).toContain("Baseline");
    expect(html).toContain("Suggested Decision Inquiries:");
    expect(html).toContain("Why did Truffle Butter Tenderloin Steak margin erode in Dec 2025?");
    expect(html).toContain("What if I increase Truffle Butter Tenderloin Steak price by 10%?");
    expect(html).toContain("Ask about Truffle Butter Tenderloin Steak margins, inflation, or &#x27;what-if&#x27; scenarios...");
  });

  it("renders chat messages with verified actual facts and simulated facts distinguishing badges", () => {
    const actualFact = createAuthoritativeFact({
      id: "actual-fact-1",
      entityType: "dish",
      entityId: "truffle-tenderloin",
      entityName: "Truffle Butter Tenderloin Steak",
      metric: "unitSellingPrice",
      label: "Unit Selling Price",
      rawValue: 980,
      unit: "INR",
      sourceTool: "getDishProfitability",
      datasetMode: "demo",
    });

    const simulatedFact = createAuthoritativeFact({
      id: "sim-fact-1",
      entityType: "dish",
      entityId: "truffle-tenderloin",
      entityName: "Truffle Butter Tenderloin Steak",
      metric: "monthlyContribution",
      label: "Simulated Monthly Contribution",
      rawValue: 125000,
      unit: "INR",
      sourceTool: "simulateMenuSurgeryScenario",
      datasetMode: "demo",
    });

    useAppStore.setState({
      assistantMessages: [
        {
          id: "msg-user-1",
          role: "user",
          content: "What is the baseline price and simulated impact?",
          timestamp: 1000,
        },
        {
          id: "msg-assistant-1",
          role: "assistant",
          content: "Here is the comparison between actual baseline and simulated outcome.",
          authoritativeFacts: [actualFact, simulatedFact],
          mode: "deterministic-fallback",
          timestamp: 2000,
        },
      ],
    });

    const html = renderToString(<CockpitAiCopilot />);

    expect(html).toContain("What is the baseline price and simulated impact?");
    expect(html).toContain("Here is the comparison between actual baseline and simulated outcome.");
    expect(html).toContain("Engine Authoritative Facts");
    // Actual fact badge
    expect(html).toContain("VERIFIED ACTUAL");
    // Simulated fact badge
    expect(html).toContain("SIMULATED");
  });

  it("sends assistant message with active selectedDishId, selectedTimelineDate, and activeScenario in payload", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: "Engine-verified response for Truffle Tenderloin in Dec 2025",
        authoritativeFacts: [],
        visualizationAction: null,
        warnings: [],
        mode: "deterministic-fallback",
      }),
    } as Response);

    const store = useAppStore.getState();
    await store.sendAssistantMessage("Analyze margin drop");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/assistant");

    const payload = JSON.parse(options?.body as string);
    expect(payload.message).toBe("Analyze margin drop");
    expect(payload.selectedDishId).toBe("truffle-tenderloin");
    expect(payload.selectedTimelineDate).toBe("2025-12-01");
    expect(payload.activeScenario).toBeDefined();
    expect(payload.activeScenario.dishId).toBe("truffle-tenderloin");
    expect(payload.activeScenario.targetSellingPrice).toBe(980);

    const state = useAppStore.getState();
    expect(state.assistantMessages).toHaveLength(2);
    expect(state.assistantMessages[0].role).toBe("user");
    expect(state.assistantMessages[1].role).toBe("assistant");
    expect(state.assistantMessages[1].content).toContain("Engine-verified response");
  });

  it("generates deterministic fallback response incorporating active scenario and selected date", () => {
    const dataset = loadStoryDatasetFromDisk();
    const ctx = {
      dataset,
      datasetMode: "demo" as const,
      selectedDishId: "truffle-tenderloin",
    };

    const fallback = generateDeterministicFallbackResponse(
      "Simulate what if price changes",
      ctx,
      "truffle-tenderloin",
      "2025-12-01",
      {
        dishId: "truffle-tenderloin",
        targetSellingPrice: 1100,
        targetIngredientCost: 450,
        targetMonthlyVolume: 250,
      }
    );

    expect(fallback.assistantMessage).toContain("Menu Surgery Simulation for **Truffle Butter Tenderloin Steak**");
    expect(fallback.assistantMessage).toContain("Simulated Target Selling Price: ₹1,100");
    expect(fallback.assistantMessage).toContain("Simulated Monthly Volume: 250 units");
    expect(fallback.authoritativeFacts.length).toBeGreaterThan(0);
    expect(fallback.visualizationAction).toBeDefined();
    expect(fallback.visualizationAction?.actionType).toBe("SET_ACTIVE_TAB");
    expect(fallback.visualizationAction?.tab).toBe("simulator");
  });
});
