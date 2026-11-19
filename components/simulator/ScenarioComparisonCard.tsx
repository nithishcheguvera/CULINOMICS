"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";

export function ScenarioComparisonCard() {
  const { scenarioResult } = useAppStore();

  if (!scenarioResult) return null;

  const { dishName, baseline, simulated, delta, restaurantImpact } = scenarioResult;

  const formatDeltaCurrency = (val: number, showDecimals = false) => {
    const sign = val > 0 ? "+" : val < 0 ? "-" : "";
    return `${sign}${formatINR(Math.abs(val), { showDecimals })}`;
  };

  const formatDeltaPercent = (val: number | null) => {
    if (val === null) return "N/A";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(2)}%`;
  };

  const getDeltaColor = (val: number, invert = false) => {
    if (Math.abs(val) < 0.001) return "text-muted-foreground bg-muted/40";
    const isGood = invert ? val < 0 : val > 0;
    return isGood
      ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20"
      : "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/20";
  };

  const restaurantContributionDeltaPct =
    restaurantImpact.baselineMonthlyContribution !== 0
      ? (restaurantImpact.deltaMonthlyContribution / Math.abs(restaurantImpact.baselineMonthlyContribution)) * 100
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Unit Economics Comparison */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span>🍽️</span> Per-Serving Unit Economics
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {dishName}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Selling Price */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Selling Price</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {formatINR(simulated.sellingPrice)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.sellingPrice)}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.sellingPrice)}`}>
                {formatDeltaCurrency(delta.sellingPrice)} ({formatDeltaPercent(delta.percentageChanges.sellingPrice)})
              </span>
            </div>
          </div>

          {/* Ingredient Cost */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Ingredient Cost</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {formatINR(simulated.unitIngredientCost, { showDecimals: true })}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.unitIngredientCost, { showDecimals: true })}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.unitIngredientCost, true)}`}>
                {formatDeltaCurrency(delta.unitIngredientCost, true)} ({formatDeltaPercent(delta.percentageChanges.unitIngredientCost)})
              </span>
            </div>
          </div>

          {/* Contribution Per Serving */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Contribution / Serving</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-base font-bold font-mono ${simulated.contributionPerServing >= 0 ? "text-foreground" : "text-rose-600 dark:text-rose-400"}`}>
                {formatINR(simulated.contributionPerServing, { showDecimals: true })}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.contributionPerServing, { showDecimals: true })}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.contributionPerServing)}`}>
                {formatDeltaCurrency(delta.contributionPerServing, true)} ({formatDeltaPercent(delta.percentageChanges.contributionPerServing)})
              </span>
            </div>
          </div>

          {/* Contribution Margin % */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Margin Percentage</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {simulated.contributionMarginPercentage !== null ? `${simulated.contributionMarginPercentage.toFixed(2)}%` : "N/A"}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {baseline.contributionMarginPercentage !== null ? `${baseline.contributionMarginPercentage.toFixed(2)}%` : "N/A"}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${delta.contributionMarginPercentage !== null ? getDeltaColor(delta.contributionMarginPercentage) : "text-muted-foreground bg-muted/40"}`}>
                {delta.contributionMarginPercentage !== null ? `${delta.contributionMarginPercentage > 0 ? "+" : ""}${delta.contributionMarginPercentage.toFixed(2)} pp` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Dish Performance */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span>📅</span> Dish Monthly Economics (Reconciled Baseline)
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            Annualized 12-Month Avg
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Monthly Volume */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Monthly Volume</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {simulated.monthlyVolume} <span className="text-xs font-normal">servings</span>
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {baseline.monthlyVolume.toFixed(1)}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.monthlyVolume)}`}>
                {delta.monthlyVolume > 0 ? "+" : ""}{delta.monthlyVolume.toFixed(1)} ({formatDeltaPercent(delta.percentageChanges.monthlyVolume)})
              </span>
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Monthly Revenue</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {formatINR(simulated.monthlyRevenue)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.monthlyRevenue)}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.monthlyRevenue)}`}>
                {formatDeltaCurrency(delta.monthlyRevenue)} ({formatDeltaPercent(delta.percentageChanges.monthlyRevenue)})
              </span>
            </div>
          </div>

          {/* Monthly Ingredient Cost */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Monthly Cost (COGS)</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {formatINR(simulated.monthlyIngredientCost)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.monthlyIngredientCost)}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.monthlyIngredientCost, true)}`}>
                {formatDeltaCurrency(delta.monthlyIngredientCost)} ({formatDeltaPercent(delta.percentageChanges.monthlyIngredientCost)})
              </span>
            </div>
          </div>

          {/* Monthly Gross Contribution */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/80 space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground block">Monthly Contribution</span>
            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold font-mono text-foreground">
                {formatINR(simulated.monthlyContribution)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                was {formatINR(baseline.monthlyContribution)}
              </span>
            </div>
            <div className="pt-1 flex items-center gap-1.5">
              <span className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border ${getDeltaColor(delta.monthlyContribution)}`}>
                {formatDeltaCurrency(delta.monthlyContribution)} ({formatDeltaPercent(delta.percentageChanges.monthlyContribution)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Restaurant-Wide Portfolio Impact */}
      <div className="bg-gradient-to-r from-card via-card to-muted/30 border border-border rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <span>🌐</span> Total Restaurant Portfolio Impact (All Menu Dishes)
          </h4>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
            Portfolio Aggregate
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Restaurant Monthly Revenue */}
          <div className="p-3.5 rounded-lg bg-card border border-border space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Projected Restaurant Revenue</span>
            <div className="text-lg font-bold font-mono text-foreground">
              {formatINR(restaurantImpact.simulatedMonthlyRevenue)}
              <span className="text-xs font-normal text-muted-foreground ml-2">/ month</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Baseline: {formatINR(restaurantImpact.baselineMonthlyRevenue)}</span>
              <span className={`font-mono font-semibold ${restaurantImpact.deltaMonthlyRevenue >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatDeltaCurrency(restaurantImpact.deltaMonthlyRevenue)}
              </span>
            </div>
          </div>

          {/* Total Restaurant Monthly Cost */}
          <div className="p-3.5 rounded-lg bg-card border border-border space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Projected Food Cost (COGS)</span>
            <div className="text-lg font-bold font-mono text-foreground">
              {formatINR(restaurantImpact.simulatedMonthlyCost)}
              <span className="text-xs font-normal text-muted-foreground ml-2">/ month</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground">Baseline: {formatINR(restaurantImpact.baselineMonthlyCost)}</span>
              <span className={`font-mono font-semibold ${restaurantImpact.deltaMonthlyCost <= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                {formatDeltaCurrency(restaurantImpact.deltaMonthlyCost, true)}
              </span>
            </div>
          </div>

          {/* Total Restaurant Monthly Gross Contribution */}
          <div className="p-3.5 rounded-lg bg-card border border-border space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Projected Gross Contribution</span>
            <div className="text-lg font-bold font-mono text-foreground">
              {formatINR(restaurantImpact.simulatedMonthlyContribution)}
              <span className="text-xs font-normal text-muted-foreground ml-2">/ month</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
              <span className="text-muted-foreground">
                Margin: {restaurantImpact.simulatedOverallMarginPercentage !== null ? `${restaurantImpact.simulatedOverallMarginPercentage.toFixed(2)}%` : "N/A"}{" "}
                (was {restaurantImpact.baselineOverallMarginPercentage !== null ? `${restaurantImpact.baselineOverallMarginPercentage.toFixed(2)}%` : "N/A"})
              </span>
              <span className={`font-mono font-semibold ${restaurantImpact.deltaMonthlyContribution >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {formatDeltaCurrency(restaurantImpact.deltaMonthlyContribution)} ({formatDeltaPercent(restaurantContributionDeltaPct)})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
