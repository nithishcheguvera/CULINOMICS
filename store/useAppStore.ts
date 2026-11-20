import { create } from "zustand";
import { StoryDataset, loadStoryDatasetFromBrowser } from "@/data/storyDataset";
import { AuthoritativeFact } from "@/ai/tools/factFactory";
import { VisualizationAction } from "@/ai/tools/actionSchema";
import {
  calculateMonthlyPerformance,
  MonthlyFinancialPerformance,
  calculateDishProfitability,
  DishProfitability,
  calculateMenuEngineering,
  MenuEngineeringResult,
  calculateRecipeReplay,
  DishRecipeReplay,
  calculateInflationImpact,
  InflationImpactDish,
  calculateSalesAnalysis,
  SalesAnalysis,
  calculateAnnualKpis,
  AnnualKpiMetrics,
  DishSimulationScenario,
  DishSimulationResult,
  createInitialScenarioForDish,
  simulateDishScenario,
  calculateIngredientInflation,
  IngredientInflation,
  calculateDishIngredientBreakdown,
  DishIngredientBreakdown,
  calculateProfitForecast,
  ProfitForecastResult,
  ForecastScenario,
  generateComboCandidates,
  solveComboOptimization,
  ComboOptimizationResult,
  compileExecutiveReportData,
  ExecutiveReportData,
  generateFinancialSummaryCSV,
  generateDishMatrixCSV,
  generateForecastAndCombosCSV,
} from "@/engine";

export type DashboardTab =
  | "all"
  | "overview"
  | "matrix"
  | "profitability"
  | "replay"
  | "explorer3d"
  | "import"
  | "simulator"
  | "forecast"
  | "optimizer"
  | "report";

export type ThreeVisualizationMode =
  | "profitability-landscape"
  | "ingredient-inflation"
  | "recipe-replay"
  | "sales-volume"
  | "margin-breakdown"
  | "inflation-impact";

export type DatasetMode = "demo" | "custom";

export interface AnnualKpiSummary {
  annualRevenue: number;
  annualIngredientCost: number;
  annualGrossContribution: number;
  overallMarginPercentage: number;
  totalSalesVolume: number;
}

export interface ComputedAnalytics {
  monthlyPerformance: MonthlyFinancialPerformance[];
  dishProfitability: DishProfitability[];
  menuEngineering: MenuEngineeringResult | null;
  recipeReplay: DishRecipeReplay[];
  inflationImpact: InflationImpactDish[];
  salesAnalysis: SalesAnalysis | null;
  ingredientInflation: IngredientInflation[];
  timelineDates: string[];
  kpis: AnnualKpiSummary | null;
}

/**
 * Executes deterministic Stage 2 engine calculators on any validated StoryDataset.
 */
export function computeAnalyticsForDataset(dataset: StoryDataset): ComputedAnalytics {
  const monthlyPerformance = calculateMonthlyPerformance(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const dishProfitability = calculateDishProfitability(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const menuEngineering = calculateMenuEngineering(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const recipeReplay = calculateRecipeReplay(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices,
    dataset.sales
  );

  const inflationImpact = calculateInflationImpact(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices
  );

  const salesAnalysis = calculateSalesAnalysis(dataset.sales);

  const ingredientInflation = calculateIngredientInflation(dataset.ingredientPrices);

  const timelineDates = Array.from(new Set(dataset.ingredientPrices.map((p) => p.date))).sort();

  const kpis = calculateAnnualKpis(monthlyPerformance, salesAnalysis);

  return {
    monthlyPerformance,
    dishProfitability,
    menuEngineering,
    recipeReplay,
    inflationImpact,
    salesAnalysis,
    ingredientInflation,
    timelineDates,
    kpis,
  };
}

export interface AppState {
  // Dataset loading state
  dataset: StoryDataset | null;
  demoDatasetBackup: StoryDataset | null;
  customDataset: StoryDataset | null;
  datasetMode: DatasetMode;
  isLoading: boolean;
  error: string | null;

  // Active UI filters & navigation
  activeTab: DashboardTab;
  selectedDishId: string;

  // Precomputed deterministic engine analytics
  monthlyPerformance: MonthlyFinancialPerformance[];
  dishProfitability: DishProfitability[];
  menuEngineering: MenuEngineeringResult | null;
  recipeReplay: DishRecipeReplay[];
  inflationImpact: InflationImpactDish[];
  salesAnalysis: SalesAnalysis | null;
  ingredientInflation: IngredientInflation[];
  timelineDates: string[];
  kpis: AnnualKpiSummary | null;

  // 3D Financial Visualization state (Stage 8)
  threeMode: ThreeVisualizationMode;
  selectedTimelineDate: string | null;

  // Time Intelligence & Playback (Phase 3B)
  isPlaying: boolean;

  // Menu Surgery Simulator state (Stage 7)
  activeScenario: DishSimulationScenario | null;
  scenarioResult: DishSimulationResult | null;

  // AI Decision Assistant state (Stage 9)
  isAssistantOpen: boolean;
  isAssistantLoading: boolean;
  assistantError: string | null;
  assistantMessages: AssistantChatMessage[];

  // Actions
  loadDataset: () => Promise<void>;
  applyCustomDataset: (candidateDataset: StoryDataset) => void;
  restoreDemoDataset: () => Promise<void>;
  setActiveTab: (tab: DashboardTab) => void;
  setSelectedDishId: (dishId: string) => void;
  setScenarioDish: (dishId: string) => void;
  updateScenario: (scenario: DishSimulationScenario) => void;
  resetScenario: () => void;
  setThreeMode: (mode: ThreeVisualizationMode) => void;
  setSelectedTimelineDate: (date: string) => void;
  setSelectedMonthIndex: (index: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  togglePlay: () => void;
  stepTimeline: (direction: "prev" | "next") => void;
  getDishIngredientBreakdown: (dishId?: string, date?: string) => DishIngredientBreakdown | null;

  // Stage 10: Forecast, Combo Optimizer & Report Export
  forecastHorizon: 3 | 6;
  forecastScenario: ForecastScenario;
  comboDiscountPercentage: number;
  comboCapacity: number;

  setForecastHorizon: (horizon: 3 | 6) => void;
  setForecastScenario: (scenario: ForecastScenario) => void;
  setComboDiscountPercentage: (discount: number) => void;
  setComboCapacity: (capacity: number) => void;
  getProfitForecast: () => ProfitForecastResult | null;
  getComboOptimization: () => ComboOptimizationResult | null;
  getExecutiveReport: () => ExecutiveReportData | null;

  // AI Assistant actions
  setIsAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  sendAssistantMessage: (message: string) => Promise<void>;
  clearAssistantHistory: () => void;

  // Stage 11: Demo Mode & Interactive Guided Tour
  isDemoMode: boolean;
  liveStateSnapshot: LiveStateSnapshot | null;
  isTourOpen: boolean;
  currentTourStep: number;
  isOnboardingModalOpen: boolean;

  enterDemoMode: () => Promise<void>;
  exitDemoMode: () => Promise<void>;
  resetDemoScenario: () => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  skipTour: () => void;
  setTourStep: (step: number) => void;
  setIsOnboardingModalOpen: (open: boolean) => void;
}

export interface LiveStateSnapshot {
  dataset: StoryDataset | null;
  datasetMode: DatasetMode;
  selectedDishId: string;
  selectedTimelineDate: string | null;
  activeTab: DashboardTab;
  activeScenario: DishSimulationScenario | null;
}

export interface AssistantChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  authoritativeFacts?: AuthoritativeFact[];
  visualizationAction?: VisualizationAction | null;
  warnings?: string[];
  mode?: "gemini" | "deterministic-fallback";
  timestamp: number;
}

/**
 * Standard utility to format numbers as Indian Rupees (INR, ₹).
 * Re-exported from pure shared utility to support server/fact-factory execution.
 */
export { formatINR } from "@/utils/formatCurrency";

/**
 * Pure helper to compute initial or updated simulation state for a dish.
 */
function computeScenarioState(
  dishId: string,
  dishProfitability: DishProfitability[],
  menuEngineering: MenuEngineeringResult | null,
  monthCount: number,
  existingScenario?: DishSimulationScenario | null
): { activeScenario: DishSimulationScenario | null; scenarioResult: DishSimulationResult | null } {
  if (!menuEngineering || dishProfitability.length === 0) {
    return { activeScenario: null, scenarioResult: null };
  }

  const targetDish = dishProfitability.find((d) => d.dishId === dishId) || dishProfitability[0];
  if (!targetDish) {
    return { activeScenario: null, scenarioResult: null };
  }

  const scenario =
    existingScenario && existingScenario.dishId === targetDish.dishId
      ? existingScenario
      : createInitialScenarioForDish(targetDish.dishId, dishProfitability, menuEngineering, monthCount);

  const scenarioResult = simulateDishScenario(
    dishProfitability,
    menuEngineering,
    scenario,
    monthCount
  );

  return { activeScenario: scenario, scenarioResult };
}

export const useAppStore = create<AppState>((set, get) => ({
  dataset: null,
  demoDatasetBackup: null,
  customDataset: null,
  datasetMode: "demo",
  isLoading: false,
  error: null,

  activeTab: "all",
  selectedDishId: "truffle-tenderloin",

  monthlyPerformance: [],
  dishProfitability: [],
  menuEngineering: null,
  recipeReplay: [],
  inflationImpact: [],
  salesAnalysis: null,
  ingredientInflation: [],
  timelineDates: [],
  kpis: null,

  threeMode: "profitability-landscape",
  selectedTimelineDate: null,
  isPlaying: false,

  activeScenario: null,
  scenarioResult: null,

  forecastHorizon: 3,
  forecastScenario: "baseline",
  comboDiscountPercentage: 10,
  comboCapacity: 1500,

  setForecastHorizon: (forecastHorizon) => set({ forecastHorizon }),
  setForecastScenario: (forecastScenario) => set({ forecastScenario }),
  setComboDiscountPercentage: (comboDiscountPercentage) => set({ comboDiscountPercentage }),
  setComboCapacity: (comboCapacity) => set({ comboCapacity }),

  getProfitForecast: () => {
    const { monthlyPerformance, forecastHorizon } = get();
    if (!monthlyPerformance || monthlyPerformance.length === 0) return null;
    try {
      return calculateProfitForecast(monthlyPerformance, forecastHorizon);
    } catch {
      return null;
    }
  },

  getComboOptimization: () => {
    const { menuEngineering, dishProfitability, comboDiscountPercentage, comboCapacity } = get();
    if (!menuEngineering || dishProfitability.length === 0) return null;
    try {
      const candidates = generateComboCandidates(menuEngineering, dishProfitability, comboDiscountPercentage);
      return solveComboOptimization(
        candidates,
        {
          monthlyPlateCapacity: comboCapacity,
          bundleDiscountPercentage: comboDiscountPercentage,
          optimizationGoal: "MAXIMIZE_CONTRIBUTION",
        },
        dishProfitability
      );
    } catch {
      return null;
    }
  },

  getExecutiveReport: () => {
    const {
      datasetMode,
      kpis,
      monthlyPerformance,
      dishProfitability,
      menuEngineering,
      inflationImpact,
      ingredientInflation,
    } = get();

    if (!monthlyPerformance || monthlyPerformance.length === 0) return null;

    try {
      const forecastResult = get().getProfitForecast();
      const comboResult = get().getComboOptimization();
      return compileExecutiveReportData({
        restaurantName: "Osteria Bella",
        datasetMode: datasetMode === "demo" ? "Canonical 2025" : "Custom User Dataset",
        kpis,
        monthlyPerformance,
        dishProfitability,
        menuEngineering,
        inflationImpact,
        ingredientInflation,
        forecastResult,
        comboResult,
      });
    } catch {
      return null;
    }
  },

  isAssistantOpen: false,
  isAssistantLoading: false,
  assistantError: null,
  assistantMessages: [],

  setIsAssistantOpen: (isAssistantOpen) => set({ isAssistantOpen }),
  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),
  clearAssistantHistory: () => set({ assistantMessages: [], assistantError: null }),

  sendAssistantMessage: async (userQuery: string) => {
    const trimmed = userQuery.trim();
    if (!trimmed) return;

    const userMessage: AssistantChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    set((state) => ({
      assistantMessages: [...state.assistantMessages, userMessage],
      isAssistantLoading: true,
      assistantError: null,
    }));

    try {
      const {
        dataset,
        datasetMode,
        selectedDishId,
        selectedTimelineDate,
        activeScenario,
        timelineDates,
        assistantMessages,
      } = get();

      // Recent history (up to 6 turns)
      const recentHistory = assistantMessages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const payload: Record<string, unknown> = {
        message: trimmed,
        datasetMode,
        history: recentHistory,
        selectedDishId,
        selectedTimelineDate: selectedTimelineDate || timelineDates[timelineDates.length - 1],
      };

      if (activeScenario) {
        payload.activeScenario = {
          dishId: activeScenario.dishId,
          targetSellingPrice: activeScenario.targetSellingPrice,
          targetIngredientCost: activeScenario.targetIngredientCost,
          targetMonthlyVolume: activeScenario.targetMonthlyVolume,
        };
      }

      if (datasetMode === "custom" && dataset) {
        payload.customDataset = dataset;
      }

      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.error || `Assistant request failed with status ${res.status}`);
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || "Assistant execution failed");
      }

      const assistantMessage: AssistantChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: json.assistantMessage,
        authoritativeFacts: json.authoritativeFacts,
        visualizationAction: json.visualizationAction,
        warnings: json.warnings,
        mode: json.mode,
        timestamp: Date.now(),
      };

      set((state) => ({
        assistantMessages: [...state.assistantMessages, assistantMessage],
        isAssistantLoading: false,
      }));
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to communicate with AI Assistant";
      set({
        isAssistantLoading: false,
        assistantError: errorMsg,
      });
    }
  },

  setActiveTab: (activeTab) => set({ activeTab }),

  setThreeMode: (threeMode) => set({ threeMode }),

  setSelectedTimelineDate: (selectedTimelineDate) => set({ selectedTimelineDate }),

  setSelectedMonthIndex: (index: number) => {
    const dates = get().timelineDates;
    if (dates && dates[index]) {
      set({ selectedTimelineDate: dates[index] });
    }
  },

  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),

  togglePlay: () => {
    const { isPlaying, timelineDates, selectedTimelineDate } = get();
    if (isPlaying) {
      set({ isPlaying: false });
    } else {
      const dates = timelineDates;
      if (!dates || dates.length === 0) return;
      const currentDate = selectedTimelineDate || dates[dates.length - 1];
      const currentIndex = dates.indexOf(currentDate);
      // If paused at or beyond the last month (December), rewind to January before playing
      if (currentIndex >= dates.length - 1) {
        set({ isPlaying: true, selectedTimelineDate: dates[0] });
      } else {
        set({ isPlaying: true });
      }
    }
  },

  stepTimeline: (direction: "prev" | "next") => {
    const dates = get().timelineDates;
    if (!dates || dates.length === 0) return;
    const currentDate = get().selectedTimelineDate || dates[dates.length - 1];
    const currentIndex = dates.indexOf(currentDate);

    if (direction === "next") {
      if (currentIndex < dates.length - 1) {
        const nextIndex = currentIndex + 1;
        set({ selectedTimelineDate: dates[nextIndex] });
        // MANDATORY INVARIANT 1: Stop at December 2025. Never wrap to January.
        if (nextIndex >= dates.length - 1) {
          set({ isPlaying: false });
        }
      } else {
        // Already at December
        set({ isPlaying: false });
      }
    } else {
      // "prev"
      if (currentIndex > 0) {
        set({ selectedTimelineDate: dates[currentIndex - 1] });
      }
    }
  },

  getDishIngredientBreakdown: (dishId, date) => {
    const dataset = get().dataset;
    if (!dataset) return null;
    const targetDishId = dishId || get().selectedDishId;
    const defaultDate = get().selectedTimelineDate || get().timelineDates[get().timelineDates.length - 1];
    const targetDate = date || defaultDate;
    if (!targetDishId || !targetDate) return null;

    try {
      return calculateDishIngredientBreakdown(
        targetDishId,
        dataset.recipes,
        dataset.ingredientPrices,
        targetDate
      );
    } catch {
      return null;
    }
  },

  setSelectedDishId: (selectedDishId) => {
    const { dishProfitability, menuEngineering, monthlyPerformance } = get();
    const monthCount = monthlyPerformance.length || 12;
    const simState = computeScenarioState(
      selectedDishId,
      dishProfitability,
      menuEngineering,
      monthCount
    );
    set({ selectedDishId, ...simState });
  },

  setScenarioDish: (dishId) => {
    get().setSelectedDishId(dishId);
  },

  updateScenario: (scenario) => {
    const { dishProfitability, menuEngineering, monthlyPerformance } = get();
    if (!menuEngineering) return;
    const monthCount = monthlyPerformance.length || 12;
    const scenarioResult = simulateDishScenario(
      dishProfitability,
      menuEngineering,
      scenario,
      monthCount
    );
    set({ activeScenario: scenario, scenarioResult });
  },

  resetScenario: () => {
    const { selectedDishId, activeScenario, dishProfitability, menuEngineering, monthlyPerformance } = get();
    const dishId = activeScenario?.dishId || selectedDishId;
    const monthCount = monthlyPerformance.length || 12;
    const simState = computeScenarioState(
      dishId,
      dishProfitability,
      menuEngineering,
      monthCount
    );
    set(simState);
  },

  loadDataset: async () => {
    // Avoid redundant fetches if demo dataset is already loaded in demo mode
    if (get().dataset && get().datasetMode === "demo") return;

    // If we already cached the demo dataset, restore immediately without network fetch
    const cached = get().demoDatasetBackup;
    if (cached) {
      const analytics = computeAnalyticsForDataset(cached);
      const defaultDish = cached.menu[0]?.id || "truffle-tenderloin";
      const monthCount = analytics.monthlyPerformance.length || 12;
      const simState = computeScenarioState(
        defaultDish,
        analytics.dishProfitability,
        analytics.menuEngineering,
        monthCount
      );
      const defaultDate = get().selectedTimelineDate && analytics.timelineDates.includes(get().selectedTimelineDate!)
        ? get().selectedTimelineDate
        : analytics.timelineDates[analytics.timelineDates.length - 1] || null;
      set({
        dataset: cached,
        datasetMode: "demo",
        selectedDishId: defaultDish,
        selectedTimelineDate: defaultDate,
        isPlaying: false,
        ...simState,
        ...analytics,
        isLoading: false,
        error: null,
      });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const dataset = await loadStoryDatasetFromBrowser();
      const analytics = computeAnalyticsForDataset(dataset);
      const defaultDish = dataset.menu[0]?.id || "truffle-tenderloin";
      const monthCount = analytics.monthlyPerformance.length || 12;
      const simState = computeScenarioState(
        defaultDish,
        analytics.dishProfitability,
        analytics.menuEngineering,
        monthCount
      );

      const defaultDate = get().selectedTimelineDate && analytics.timelineDates.includes(get().selectedTimelineDate!)
        ? get().selectedTimelineDate
        : analytics.timelineDates[analytics.timelineDates.length - 1] || null;

      set({
        dataset,
        demoDatasetBackup: dataset,
        datasetMode: "demo",
        selectedDishId: defaultDish,
        selectedTimelineDate: defaultDate,
        isPlaying: false,
        ...simState,
        isLoading: false,
        error: null,
        ...analytics,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load restaurant dataset";
      set({ isLoading: false, error: message });
    }
  },

  /**
   * Atomically validates, computes, and switches active state to a custom imported dataset.
   * If any engine calculation fails, preserves the previous dataset intact.
   */
  applyCustomDataset: (candidateDataset: StoryDataset) => {
    try {
      const analytics = computeAnalyticsForDataset(candidateDataset);
      const firstDish = candidateDataset.menu[0]?.id || "truffle-tenderloin";
      const monthCount = analytics.monthlyPerformance.length || 12;
      const simState = computeScenarioState(
        firstDish,
        analytics.dishProfitability,
        analytics.menuEngineering,
        monthCount
      );

      const defaultDate = get().selectedTimelineDate && analytics.timelineDates.includes(get().selectedTimelineDate!)
        ? get().selectedTimelineDate
        : analytics.timelineDates[analytics.timelineDates.length - 1] || null;

      set({
        dataset: candidateDataset,
        customDataset: candidateDataset,
        datasetMode: "custom",
        selectedDishId: firstDish,
        selectedTimelineDate: defaultDate,
        isPlaying: false,
        ...simState,
        error: null,
        ...analytics,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to compute financial engine metrics for imported dataset";
      throw new Error(`Atomic Import Failed: ${message}`);
    }
  },

  /**
   * Restores the canonical demo dataset and recomputes all baseline figures.
   */
  restoreDemoDataset: async () => {
    set({ isLoading: true, error: null });
    try {
      let demoData = get().demoDatasetBackup;
      if (!demoData) {
        demoData = await loadStoryDatasetFromBrowser();
      }
      const analytics = computeAnalyticsForDataset(demoData);
      const defaultDish = "truffle-tenderloin";
      const monthCount = analytics.monthlyPerformance.length || 12;
      const simState = computeScenarioState(
        defaultDish,
        analytics.dishProfitability,
        analytics.menuEngineering,
        monthCount
      );

      const defaultDate = get().selectedTimelineDate && analytics.timelineDates.includes(get().selectedTimelineDate!)
        ? get().selectedTimelineDate
        : analytics.timelineDates[analytics.timelineDates.length - 1] || null;

      set({
        dataset: demoData,
        demoDatasetBackup: demoData,
        datasetMode: "demo",
        selectedDishId: defaultDish,
        selectedTimelineDate: defaultDate,
        isPlaying: false,
        ...simState,
        isLoading: false,
        error: null,
        ...analytics,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to restore demo dataset";
      set({ isLoading: false, error: message });
    }
  },

  // Stage 11: Demo Mode & Interactive Guided Tour
  isDemoMode: false,
  liveStateSnapshot: null,
  isTourOpen: false,
  currentTourStep: 0,
  isOnboardingModalOpen: false,

  enterDemoMode: async () => {
    const { dataset, datasetMode, selectedDishId, selectedTimelineDate, activeTab, activeScenario, demoDatasetBackup } = get();

    // 1. Capture snapshot of active live state if not already in demo mode
    const snapshot: LiveStateSnapshot = {
      dataset,
      datasetMode,
      selectedDishId,
      selectedTimelineDate,
      activeTab,
      activeScenario,
    };

    // 2. Ensure canonical demo dataset is loaded
    let demoData = demoDatasetBackup;
    if (!demoData) {
      demoData = await loadStoryDatasetFromBrowser();
    }
    const analytics = computeAnalyticsForDataset(demoData);
    const demoDish = "truffle-tenderloin";
    const monthCount = analytics.monthlyPerformance.length || 12;

    // 3. Illustrative simulated scenario for demo (+15% price, +5% volume)
    const simBase = computeScenarioState(demoDish, analytics.dishProfitability, analytics.menuEngineering, monthCount);
    let demoScenario = simBase.activeScenario;
    let demoScenarioResult = simBase.scenarioResult;

    if (demoScenario && analytics.menuEngineering) {
      const targetPrice = Math.round(demoScenario.targetSellingPrice * 1.15);
      const targetCost = demoScenario.targetIngredientCost;
      const targetVolume = Math.max(1, Math.round(demoScenario.targetMonthlyVolume * 1.05));
      const illustrativeScenario: DishSimulationScenario = {
        ...demoScenario,
        targetSellingPrice: targetPrice,
        targetIngredientCost: targetCost,
        targetMonthlyVolume: targetVolume,
      };
      demoScenarioResult = simulateDishScenario(
        analytics.dishProfitability,
        analytics.menuEngineering,
        illustrativeScenario,
        monthCount
      );
      demoScenario = illustrativeScenario;
    }

    const defaultDate = analytics.timelineDates[analytics.timelineDates.length - 1] || "2025-12-01";

    set({
      isDemoMode: true,
      liveStateSnapshot: snapshot,
      dataset: demoData,
      demoDatasetBackup: demoData,
      datasetMode: "demo",
      selectedDishId: demoDish,
      selectedTimelineDate: defaultDate,
      isPlaying: false,
      activeScenario: demoScenario,
      scenarioResult: demoScenarioResult,
      ...analytics,
      error: null,
    });
  },

  exitDemoMode: async () => {
    const { liveStateSnapshot } = get();
    if (!liveStateSnapshot) {
      set({ isDemoMode: false });
      return;
    }

    const { dataset, datasetMode, selectedDishId, selectedTimelineDate, activeTab, activeScenario } = liveStateSnapshot;

    if (dataset) {
      const analytics = computeAnalyticsForDataset(dataset);
      const monthCount = analytics.monthlyPerformance.length || 12;
      const simState = (activeScenario && analytics.menuEngineering)
        ? {
            activeScenario,
            scenarioResult: simulateDishScenario(
              analytics.dishProfitability,
              analytics.menuEngineering,
              activeScenario,
              monthCount
            ),
          }
        : computeScenarioState(selectedDishId, analytics.dishProfitability, analytics.menuEngineering, monthCount);

      set({
        isDemoMode: false,
        liveStateSnapshot: null,
        dataset,
        datasetMode,
        selectedDishId,
        selectedTimelineDate,
        activeTab,
        isPlaying: false,
        ...simState,
        ...analytics,
        error: null,
      });
    } else {
      set({
        isDemoMode: false,
        liveStateSnapshot: null,
      });
    }
  },

  resetDemoScenario: () => {
    const { dishProfitability, menuEngineering, monthlyPerformance } = get();
    const demoDish = "truffle-tenderloin";
    const monthCount = monthlyPerformance.length || 12;
    const simState = computeScenarioState(
      demoDish,
      dishProfitability,
      menuEngineering,
      monthCount
    );
    set({
      selectedDishId: demoDish,
      ...simState,
    });
  },

  startTour: () => {
    set({ isTourOpen: true, currentTourStep: 0 });
  },

  nextTourStep: () => {
    const current = get().currentTourStep;
    if (current < 11) {
      set({ currentTourStep: current + 1 });
    } else {
      set({ isTourOpen: false });
    }
  },

  prevTourStep: () => {
    const current = get().currentTourStep;
    if (current > 0) {
      set({ currentTourStep: current - 1 });
    }
  },

  skipTour: () => {
    set({ isTourOpen: false });
  },

  setTourStep: (currentTourStep: number) => {
    set({ currentTourStep, isTourOpen: true });
  },

  setIsOnboardingModalOpen: (isOnboardingModalOpen: boolean) => {
    set({ isOnboardingModalOpen });
  },
}));
