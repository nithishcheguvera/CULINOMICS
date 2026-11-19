/**
 * Deterministic Financial Engine - Monthly Performance Comparison
 * Compares financial performance of a target month against a baseline month.
 * Pure TypeScript. Zero UI, React, DOM, or Zustand dependencies.
 */

import { MonthlyFinancialPerformance } from "./types";

export interface MonthlyKpiComparison {
  revenueDeltaPercentage: number;
  costDeltaPercentage: number;
  contributionDeltaPercentage: number;
  marginDeltaPercentagePoints: number;
  isCostSurge: boolean;
  isProfitErosion: boolean;
  isMarginCompressed: boolean;
}

/**
 * Pure calculation comparing a target month's metrics to a baseline month (e.g. January).
 * Safeguarded against division by zero and missing baseline values.
 */
export function compareMonthlyPerformance(
  current: MonthlyFinancialPerformance,
  baseline?: MonthlyFinancialPerformance | null
): MonthlyKpiComparison {
  if (!baseline) {
    return {
      revenueDeltaPercentage: 0,
      costDeltaPercentage: 0,
      contributionDeltaPercentage: 0,
      marginDeltaPercentagePoints: 0,
      isCostSurge: false,
      isProfitErosion: false,
      isMarginCompressed: false,
    };
  }

  // 1. Revenue Delta %
  const revenueDeltaPercentage =
    baseline.revenue === 0
      ? 0
      : ((current.revenue - baseline.revenue) / baseline.revenue) * 100;

  // 2. Ingredient Cost Delta %
  const costDeltaPercentage =
    baseline.ingredientCost === 0
      ? 0
      : ((current.ingredientCost - baseline.ingredientCost) / baseline.ingredientCost) * 100;

  // 3. Gross Contribution Delta %
  const contributionDeltaPercentage =
    baseline.grossProfit === 0
      ? 0
      : ((current.grossProfit - baseline.grossProfit) / baseline.grossProfit) * 100;

  // 4. Gross Margin Delta in Percentage Points (Pts)
  const marginDeltaPercentagePoints =
    current.grossMarginPercentage - baseline.grossMarginPercentage;

  return {
    revenueDeltaPercentage: Number(revenueDeltaPercentage.toFixed(4)),
    costDeltaPercentage: Number(costDeltaPercentage.toFixed(4)),
    contributionDeltaPercentage: Number(contributionDeltaPercentage.toFixed(4)),
    marginDeltaPercentagePoints: Number(marginDeltaPercentagePoints.toFixed(4)),
    isCostSurge: costDeltaPercentage > 0,
    isProfitErosion: contributionDeltaPercentage < 0,
    isMarginCompressed: marginDeltaPercentagePoints < 0,
  };
}
