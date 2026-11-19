"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { compareMonthlyPerformance } from "@/engine";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export function MonthlyKpiCards() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const monthlyPerformance = state.monthlyPerformance;
  const timelineDates = state.timelineDates;
  const selectedTimelineDate = state.selectedTimelineDate;
  const setSelectedTimelineDate = state.setSelectedTimelineDate;

  if (!monthlyPerformance || monthlyPerformance.length === 0) {
    return null;
  }

  // Derive active month index from canonical selectedTimelineDate
  const defaultDate = timelineDates[timelineDates.length - 1] || monthlyPerformance[monthlyPerformance.length - 1].date;
  const activeDate = selectedTimelineDate || defaultDate;
  const activeIndex = timelineDates.indexOf(activeDate);
  const safeIndex = activeIndex >= 0 ? activeIndex : monthlyPerformance.length - 1;

  const currentMonth = monthlyPerformance[safeIndex];
  const baselineMonth = monthlyPerformance[0]; // January 2025 baseline

  // Pure deterministic engine comparison
  const comparison = compareMonthlyPerformance(currentMonth, baselineMonth);
  const isBaseline = safeIndex === 0;

  return (
    <div className="space-y-3">
      {/* Month Selector / Scrubber Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-xl bg-forest-surface/90 border border-forest-border select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Monthly Runway Scrubber:
          </span>
          <span className="text-xs font-mono font-bold text-white bg-forest-elevated px-2 py-0.5 rounded border border-forest-border">
            {MONTH_NAMES[safeIndex]} 2025 ({currentMonth.date})
          </span>
          {isBaseline && (
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              January Baseline
            </span>
          )}
        </div>

        {/* 12 Month Quick Toggle Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {timelineDates.map((date, idx) => {
            const isSelected = date === activeDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedTimelineDate(date)}
                className={`px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? "bg-emerald-500 text-neutral-950 font-bold shadow-md shadow-emerald-900/40 scale-105"
                    : "bg-forest-elevated text-neutral-400 hover:text-white hover:bg-forest-border"
                }`}
                title={`Scrub to ${MONTH_NAMES[idx]} 2025 (${date})`}
              >
                {MONTH_NAMES[idx]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Monthly KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Monthly Revenue */}
        <div className="forest-card p-4 rounded-xl border border-forest-border transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 select-none">Monthly Revenue</span>
            <span className="text-base select-none">📊</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatINR(currentMonth.revenue)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500 select-none">Volume: 1,920 units</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                isBaseline
                  ? "bg-forest-elevated text-neutral-300"
                  : comparison.revenueDeltaPercentage >= 0
                  ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
                  : "bg-red-950/60 text-red-400 border border-red-800/40"
              }`}
            >
              {isBaseline
                ? "Baseline"
                : `${comparison.revenueDeltaPercentage >= 0 ? "+" : ""}${comparison.revenueDeltaPercentage.toFixed(1)}% vs Jan`}
            </span>
          </div>
        </div>

        {/* 2. Monthly Ingredient Cost */}
        <div className="forest-card p-4 rounded-xl border border-forest-border transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 select-none">Ingredient Cost (COGS)</span>
            <span className="text-base select-none">🥩</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatINR(currentMonth.ingredientCost)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500 select-none">Direct Food Cost</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                isBaseline
                  ? "bg-forest-elevated text-neutral-300"
                  : comparison.isCostSurge
                  ? "bg-red-950/60 text-red-400 border border-red-800/40"
                  : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
              }`}
            >
              {isBaseline
                ? "Baseline"
                : `${comparison.costDeltaPercentage >= 0 ? "+" : ""}${comparison.costDeltaPercentage.toFixed(1)}% vs Jan${
                    comparison.isCostSurge ? " (Surge)" : ""
                  }`}
            </span>
          </div>
        </div>

        {/* 3. Monthly Gross Contribution */}
        <div className="forest-card p-4 rounded-xl border border-forest-border transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 select-none">Gross Contribution</span>
            <span className="text-base select-none">💰</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
              {formatINR(currentMonth.grossProfit)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500 select-none">Gross Food Profit</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                isBaseline
                  ? "bg-forest-elevated text-neutral-300"
                  : comparison.isProfitErosion
                  ? "bg-red-950/60 text-red-400 border border-red-800/40"
                  : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
              }`}
            >
              {isBaseline
                ? "Baseline"
                : `${comparison.contributionDeltaPercentage >= 0 ? "+" : ""}${comparison.contributionDeltaPercentage.toFixed(1)}% vs Jan${
                    comparison.isProfitErosion ? " (Erosion)" : ""
                  }`}
            </span>
          </div>
        </div>

        {/* 4. Gross Margin % */}
        <div className="forest-card p-4 rounded-xl border border-forest-border transition-all hover:border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 select-none">Gross Margin %</span>
            <span className="text-base select-none">📈</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-400 tabular-nums">
              {currentMonth.grossMarginPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-500 select-none">Contribution / Rev</span>
            <span
              className={`px-1.5 py-0.5 rounded font-mono font-medium ${
                isBaseline
                  ? "bg-forest-elevated text-neutral-300"
                  : comparison.isMarginCompressed
                  ? "bg-red-950/60 text-red-400 border border-red-800/40"
                  : "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40"
              }`}
            >
              {isBaseline
                ? "Baseline"
                : `${comparison.marginDeltaPercentagePoints >= 0 ? "+" : ""}${comparison.marginDeltaPercentagePoints.toFixed(1)} pts vs Jan`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
