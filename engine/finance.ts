import { MonthlyFinancialPerformance, SalesAnalysis, AnnualKpiMetrics } from "./types";

/**
 * Core Financial Math Primitive (Pure TypeScript)
 * Architecture rule: NO UI imports in /engine.
 */

export interface ProfitSummary {
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercentage: number;
}

export function calculateProfitSummary(revenue: number, cost: number): ProfitSummary {
  if (revenue < 0 || cost < 0) {
    throw new Error("Financial values cannot be negative");
  }
  const grossProfit = revenue - cost;
  const marginPercentage = revenue === 0 ? 0 : Number(((grossProfit / revenue) * 100).toFixed(2));
  return {
    revenue,
    cost,
    grossProfit,
    marginPercentage,
  };
}

/**
 * Computes restaurant-level annual financial KPI summary metrics.
 * Deterministic IEEE-754 precision math.
 */
export function calculateAnnualKpis(
  monthlyPerformance: MonthlyFinancialPerformance[],
  salesAnalysis: SalesAnalysis
): AnnualKpiMetrics {
  const annualRevenue = monthlyPerformance.reduce((sum, m) => sum + m.revenue, 0);
  const annualIngredientCost = monthlyPerformance.reduce((sum, m) => sum + m.ingredientCost, 0);
  const annualGrossContribution = annualRevenue - annualIngredientCost;
  const overallMarginPercentage = annualRevenue > 0 ? (annualGrossContribution / annualRevenue) * 100 : 0;
  const totalSalesVolume = salesAnalysis.totalVolumeAllTime;

  return {
    annualRevenue,
    annualIngredientCost,
    annualGrossContribution,
    overallMarginPercentage,
    totalSalesVolume,
  };
}
