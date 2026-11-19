import { create } from "zustand";
import { StoryDataset, loadStoryDatasetFromBrowser } from "@/data/storyDataset";
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
  DishSimulationScenario,
  DishSimulationResult,
  createInitialScenarioForDish,
  simulateDishScenario,
} from "@/engine";

export type DashboardTab = "all" | "overview" | "matrix" | "profitability" | "replay" | "explorer3d" | "import" | "simulator";

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

  const annualRevenue = monthlyPerformance.reduce((sum, m) => sum + m.revenue, 0);
  const annualIngredientCost = monthlyPerformance.reduce((sum, m) => sum + m.ingredientCost, 0);
  const annualGrossContribution = annualRevenue - annualIngredientCost;
  const overallMarginPercentage = annualRevenue > 0 ? (annualGrossContribution / annualRevenue) * 100 : 0;
  const totalSalesVolume = salesAnalysis.totalVolumeAllTime;

  return {
    monthlyPerformance,
    dishProfitability,
    menuEngineering,
    recipeReplay,
    inflationImpact,
    salesAnalysis,
    kpis: {
      annualRevenue,
      annualIngredientCost,
      annualGrossContribution,
      overallMarginPercentage,
      totalSalesVolume,
    },
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
  kpis: AnnualKpiSummary | null;

  // Menu Surgery Simulator state (Stage 7)
  activeScenario: DishSimulationScenario | null;
  scenarioResult: DishSimulationResult | null;

  // Actions
  loadDataset: () => Promise<void>;
  applyCustomDataset: (candidateDataset: StoryDataset) => void;
  restoreDemoDataset: () => Promise<void>;
  setActiveTab: (tab: DashboardTab) => void;
  setSelectedDishId: (dishId: string) => void;
  setScenarioDish: (dishId: string) => void;
  updateScenario: (scenario: DishSimulationScenario) => void;
  resetScenario: () => void;
}

/**
 * Standard utility to format numbers as Indian Rupees (INR, ₹).
 */
export function formatINR(value: number, options?: { showDecimals?: boolean; compact?: boolean }): string {
  const showDecimals = options?.showDecimals ?? false;

  if (options?.compact) {
    if (Math.abs(value) >= 10000000) {
      return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(value) >= 100000) {
      return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (Math.abs(value) >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
}

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
  kpis: null,

  activeScenario: null,
  scenarioResult: null,

  setActiveTab: (activeTab) => set({ activeTab }),

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
      set({
        dataset: cached,
        datasetMode: "demo",
        selectedDishId: defaultDish,
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

      set({
        dataset,
        demoDatasetBackup: dataset,
        datasetMode: "demo",
        selectedDishId: defaultDish,
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

      set({
        dataset: candidateDataset,
        customDataset: candidateDataset,
        datasetMode: "custom",
        selectedDishId: firstDish,
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

      set({
        dataset: demoData,
        demoDatasetBackup: demoData,
        datasetMode: "demo",
        selectedDishId: defaultDish,
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
}));
