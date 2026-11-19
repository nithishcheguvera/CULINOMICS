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
} from "@/engine";

export type DashboardTab = "all" | "overview" | "matrix" | "profitability" | "replay" | "explorer3d" | "import";

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

  // Actions
  loadDataset: () => Promise<void>;
  applyCustomDataset: (candidateDataset: StoryDataset) => void;
  restoreDemoDataset: () => Promise<void>;
  setActiveTab: (tab: DashboardTab) => void;
  setSelectedDishId: (dishId: string) => void;
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

  setActiveTab: (activeTab) => set({ activeTab }),

  setSelectedDishId: (selectedDishId) => set({ selectedDishId }),

  loadDataset: async () => {
    // Avoid redundant fetches if demo dataset is already loaded in demo mode
    if (get().dataset && get().datasetMode === "demo") return;

    // If we already cached the demo dataset, restore immediately without network fetch
    const cached = get().demoDatasetBackup;
    if (cached) {
      const analytics = computeAnalyticsForDataset(cached);
      const defaultDish = cached.menu[0]?.id || "truffle-tenderloin";
      set({
        dataset: cached,
        datasetMode: "demo",
        selectedDishId: defaultDish,
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

      set({
        dataset,
        demoDatasetBackup: dataset,
        datasetMode: "demo",
        selectedDishId: defaultDish,
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

      set({
        dataset: candidateDataset,
        customDataset: candidateDataset,
        datasetMode: "custom",
        selectedDishId: firstDish,
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
      set({
        dataset: demoData,
        demoDatasetBackup: demoData,
        datasetMode: "demo",
        selectedDishId: "truffle-tenderloin",
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
