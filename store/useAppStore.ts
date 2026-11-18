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

export type DashboardTab = "all" | "overview" | "matrix" | "profitability" | "replay";

export interface AnnualKpiSummary {
  annualRevenue: number;
  annualIngredientCost: number;
  annualGrossContribution: number;
  overallMarginPercentage: number;
  totalSalesVolume: number;
}

export interface AppState {
  // Dataset loading state
  dataset: StoryDataset | null;
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
    // Avoid redundant fetches if dataset already loaded
    if (get().dataset) return;

    set({ isLoading: true, error: null });
    try {
      const dataset = await loadStoryDatasetFromBrowser();

      // Execute deterministic Stage 2 engine calculations
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

      // Reconcile annual KPIs from monthly aggregates
      const annualRevenue = monthlyPerformance.reduce((sum, m) => sum + m.revenue, 0);
      const annualIngredientCost = monthlyPerformance.reduce((sum, m) => sum + m.ingredientCost, 0);
      const annualGrossContribution = annualRevenue - annualIngredientCost;
      const overallMarginPercentage = annualRevenue > 0 ? (annualGrossContribution / annualRevenue) * 100 : 0;
      const totalSalesVolume = salesAnalysis.totalVolumeAllTime;

      set({
        dataset,
        isLoading: false,
        error: null,
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
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load restaurant dataset";
      set({ isLoading: false, error: message });
    }
  },
}));
