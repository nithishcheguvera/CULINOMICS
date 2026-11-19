import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import { AuthoritativeFactCard } from "./AuthoritativeFactCard";
import { VisualizationActionPill } from "./VisualizationActionPill";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { AssistantMessageItem } from "./AssistantMessageItem";
import { dispatchVisualizationAction } from "./actionDispatcher";
import { useAppStore, AssistantChatMessage } from "@/store/useAppStore";
import { createAuthoritativeFact } from "@/ai/tools/factFactory";
import { VisualizationAction } from "@/ai/tools/actionSchema";

describe("Stage 9 Phase 3: Assistant UI & Client State Integration", () => {
  beforeEach(() => {
    useAppStore.setState({
      isAssistantOpen: false,
      isAssistantLoading: false,
      assistantError: null,
      assistantMessages: [],
      activeTab: "overview",
      selectedDishId: "truffle-tenderloin",
      threeMode: "profitability-landscape",
      selectedTimelineDate: null,
    });
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. AuthoritativeFactCard Tests
  // --------------------------------------------------------------------------
  describe("AuthoritativeFactCard", () => {
    it("renders verified engine fact with label, formatted value, entity name, and provenance", () => {
      const fact = createAuthoritativeFact({
        id: "test-rev-fact",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Osteria Bella",
        metric: "annualRevenue",
        label: "Annual Gross Revenue",
        rawValue: 12484800,
        unit: "INR",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: "demo",
      });

      const html = renderToString(<AuthoritativeFactCard fact={fact} />);

      expect(html).toContain("Osteria Bella");
      expect(html).toContain("Annual Gross Revenue");
      expect(html).toContain("₹1,24,84,800.00");
      expect(html).toContain("VERIFIED");
      expect(html).toContain("calculateAnnualKpis");
      expect(html).toContain("Full Timeline");
    });
  });

  // --------------------------------------------------------------------------
  // 2. actionDispatcher Tests
  // --------------------------------------------------------------------------
  describe("actionDispatcher", () => {
    it("dispatches SET_ACTIVE_TAB action to store with optional dishId", () => {
      const mockStore = {
        setActiveTab: vi.fn(),
        setSelectedDishId: vi.fn(),
        setThreeMode: vi.fn(),
        setSelectedTimelineDate: vi.fn(),
      };

      const action: VisualizationAction = {
        actionType: "SET_ACTIVE_TAB",
        tab: "replay",
        dishId: "margherita-pizza",
        label: "View Recipe Replay",
      };

      dispatchVisualizationAction(action, mockStore);
      expect(mockStore.setActiveTab).toHaveBeenCalledWith("replay");
      expect(mockStore.setSelectedDishId).toHaveBeenCalledWith("margherita-pizza");
    });

    it("dispatches SET_SELECTED_DISH action to store", () => {
      const mockStore = {
        setActiveTab: vi.fn(),
        setSelectedDishId: vi.fn(),
        setThreeMode: vi.fn(),
        setSelectedTimelineDate: vi.fn(),
      };

      const action: VisualizationAction = {
        actionType: "SET_SELECTED_DISH",
        dishId: "truffle-tenderloin",
        label: "Select Tenderloin",
      };

      dispatchVisualizationAction(action, mockStore);
      expect(mockStore.setSelectedDishId).toHaveBeenCalledWith("truffle-tenderloin");
    });

    it("dispatches SET_THREE_MODE action, activating 3D explorer and configuring scene", () => {
      const mockStore = {
        setActiveTab: vi.fn(),
        setSelectedDishId: vi.fn(),
        setThreeMode: vi.fn(),
        setSelectedTimelineDate: vi.fn(),
      };

      const action: VisualizationAction = {
        actionType: "SET_THREE_MODE",
        threeMode: "ingredient-inflation",
        timelineDate: "2025-06-01",
        label: "View Inflation in 3D",
      };

      dispatchVisualizationAction(action, mockStore);
      expect(mockStore.setActiveTab).toHaveBeenCalledWith("explorer3d");
      expect(mockStore.setThreeMode).toHaveBeenCalledWith("ingredient-inflation");
      expect(mockStore.setSelectedTimelineDate).toHaveBeenCalledWith("2025-06-01");
    });

    it("dispatches SET_TIMELINE_DATE action to store", () => {
      const mockStore = {
        setActiveTab: vi.fn(),
        setSelectedDishId: vi.fn(),
        setThreeMode: vi.fn(),
        setSelectedTimelineDate: vi.fn(),
      };

      const action: VisualizationAction = {
        actionType: "SET_TIMELINE_DATE",
        timelineDate: "2025-12-01",
        label: "Jump to December 2025",
      };

      dispatchVisualizationAction(action, mockStore);
      expect(mockStore.setSelectedTimelineDate).toHaveBeenCalledWith("2025-12-01");
    });
  });

  // --------------------------------------------------------------------------
  // 3. VisualizationActionPill Tests
  // --------------------------------------------------------------------------
  describe("VisualizationActionPill", () => {
    it("renders action label and icon", () => {
      const action: VisualizationAction = {
        actionType: "SET_ACTIVE_TAB",
        tab: "matrix",
        label: "Inspect Matrix in 2D",
      };

      const html = renderToString(<VisualizationActionPill action={action} />);
      expect(html).toContain("Inspect Matrix in 2D");
      expect(html).toContain("📊");
    });
  });

  // --------------------------------------------------------------------------
  // 4. SuggestedQuestions Tests
  // --------------------------------------------------------------------------
  describe("SuggestedQuestions", () => {
    it("renders exploratory question chips", () => {
      const onSelect = vi.fn();
      const html = renderToString(<SuggestedQuestions onSelectQuestion={onSelect} />);

      expect(html).toContain("Suggested Explorations");
      expect(html).toContain("How is the restaurant performing overall?");
      expect(html).toContain("Which ingredients have the highest inflation rate?");
    });
  });

  // --------------------------------------------------------------------------
  // 5. AssistantMessageItem Tests
  // --------------------------------------------------------------------------
  describe("AssistantMessageItem", () => {
    it("renders user chat message bubble", () => {
      const msg: AssistantChatMessage = {
        id: "msg-1",
        role: "user",
        content: "What is our best-selling dish?",
        timestamp: Date.now(),
      };

      const html = renderToString(<AssistantMessageItem message={msg} />);
      expect(html).toContain("What is our best-selling dish?");
    });

    it("renders assistant message with Gemini mode badge, fact cards, and warnings", () => {
      const fact = createAuthoritativeFact({
        id: "f1",
        entityType: "dish",
        entityId: "truffle-tenderloin",
        entityName: "Truffle Butter Tenderloin Steak",
        metric: "unitSellingPrice",
        label: "Selling Price",
        rawValue: 980,
        unit: "INR",
        sourceTool: "getDishProfitability",
        datasetMode: "demo",
      });

      const action: VisualizationAction = {
        actionType: "SET_ACTIVE_TAB",
        tab: "replay",
        dishId: "truffle-tenderloin",
        label: "Inspect Recipe Replay",
      };

      const msg: AssistantChatMessage = {
        id: "msg-2",
        role: "assistant",
        content: "Truffle Butter Tenderloin Steak currently sells for ₹980.00.",
        authoritativeFacts: [fact],
        visualizationAction: action,
        warnings: ["Numerical claim audit notice"],
        mode: "gemini",
        timestamp: Date.now(),
      };

      const html = renderToString(<AssistantMessageItem message={msg} />);

      expect(html).toContain("Gemini 2.5");
      expect(html).toContain("Truffle Butter Tenderloin Steak currently sells for ₹980.00.");
      expect(html).toContain("Verified Engine Facts");
      expect(html).toContain("Inspect Recipe Replay");
      expect(html).toContain("Numerical claim audit notice");
    });

    it("renders assistant message with Deterministic Engine Fallback badge", () => {
      const msg: AssistantChatMessage = {
        id: "msg-3",
        role: "assistant",
        content: "Deterministic fallback explanation",
        mode: "deterministic-fallback",
        timestamp: Date.now(),
      };

      const html = renderToString(<AssistantMessageItem message={msg} />);
      expect(html).toContain("Deterministic Engine Fallback");
      expect(html).toContain("Deterministic fallback explanation");
    });
  });

  // --------------------------------------------------------------------------
  // 6. Zustand Store Assistant Slice Integration Tests
  // --------------------------------------------------------------------------
  describe("Zustand Store Assistant Slice", () => {
    it("toggles and sets assistant drawer open state", () => {
      expect(useAppStore.getState().isAssistantOpen).toBe(false);

      useAppStore.getState().toggleAssistant();
      expect(useAppStore.getState().isAssistantOpen).toBe(true);

      useAppStore.getState().setIsAssistantOpen(false);
      expect(useAppStore.getState().isAssistantOpen).toBe(false);
    });

    it("clears assistant message history and error state", () => {
      useAppStore.setState({
        assistantMessages: [
          { id: "1", role: "user", content: "Hi", timestamp: Date.now() },
        ],
        assistantError: "Some error",
      });

      useAppStore.getState().clearAssistantHistory();
      expect(useAppStore.getState().assistantMessages).toHaveLength(0);
      expect(useAppStore.getState().assistantError).toBeNull();
    });

    it("sends assistant message, calls POST /api/assistant, and appends response", async () => {
      const mockFact = createAuthoritativeFact({
        id: "f-summary",
        entityType: "restaurant",
        entityId: "osteria-bella",
        entityName: "Osteria Bella",
        metric: "annualRevenue",
        label: "Annual Revenue",
        rawValue: 12484800,
        unit: "INR",
        sourceTool: "getRestaurantFinancialSummary",
        datasetMode: "demo",
      });

      // Mock global fetch
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          assistantMessage: "Osteria Bella generated ₹1,24,84,800.00.",
          authoritativeFacts: [mockFact],
          visualizationAction: {
            actionType: "SET_ACTIVE_TAB",
            tab: "overview",
            label: "Open Overview",
          },
          warnings: [],
          mode: "gemini",
        }),
      });
      global.fetch = mockFetch;

      await useAppStore.getState().sendAssistantMessage("How is Osteria Bella performing?");

      const state = useAppStore.getState();
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(state.isAssistantLoading).toBe(false);
      expect(state.assistantError).toBeNull();
      expect(state.assistantMessages).toHaveLength(2); // 1 user + 1 assistant

      const userMsg = state.assistantMessages[0];
      expect(userMsg.role).toBe("user");
      expect(userMsg.content).toBe("How is Osteria Bella performing?");

      const assistantMsg = state.assistantMessages[1];
      expect(assistantMsg.role).toBe("assistant");
      expect(assistantMsg.content).toBe("Osteria Bella generated ₹1,24,84,800.00.");
      expect(assistantMsg.authoritativeFacts).toHaveLength(1);
      expect(assistantMsg.visualizationAction?.actionType).toBe("SET_ACTIVE_TAB");
    });

    it("handles assistant network error gracefully without crashing", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: "Internal Server Error" }),
      });
      global.fetch = mockFetch;

      await useAppStore.getState().sendAssistantMessage("Fail please");

      const state = useAppStore.getState();
      expect(state.isAssistantLoading).toBe(false);
      expect(state.assistantError).toContain("Internal Server Error");
      expect(state.assistantMessages).toHaveLength(1); // User message kept
    });
  });
});
