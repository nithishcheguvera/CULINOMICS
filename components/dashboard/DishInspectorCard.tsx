"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

const BADGE_STYLES: Record<MenuEngineeringCategory, { label: string; icon: string; style: string }> = {
  STAR: {
    label: "Star",
    icon: "⭐",
    style: "bg-amber-950/70 text-amber-300 border-amber-800/60 shadow-sm shadow-amber-950",
  },
  PLOWHORSE: {
    label: "Plowhorse",
    icon: "🐎",
    style: "bg-blue-950/70 text-blue-300 border-blue-800/60 shadow-sm shadow-blue-950",
  },
  PUZZLE: {
    label: "Puzzle",
    icon: "🧩",
    style: "bg-purple-950/70 text-purple-300 border-purple-800/60 shadow-sm shadow-purple-950",
  },
  DOG: {
    label: "Dog",
    icon: "🐕",
    style: "bg-red-950/70 text-red-300 border-red-800/60 shadow-sm shadow-red-950",
  },
};

export function DishInspectorCard() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const dishProfitability = state.dishProfitability;
  const menuEngineering = state.menuEngineering;
  const inflationImpact = state.inflationImpact;
  const recipeReplay = state.recipeReplay;
  const selectedDishId = state.selectedDishId;
  const selectedTimelineDate = state.selectedTimelineDate;
  const timelineDates = state.timelineDates;
  const setSelectedDishId = state.setSelectedDishId;
  const setActiveTab = state.setActiveTab;

  if (!dishProfitability || dishProfitability.length === 0) {
    return null;
  }

  // Active dish record
  const currentDish =
    dishProfitability.find((d) => d.dishId === selectedDishId) || dishProfitability[0];

  // Engineering classification
  const matrixDish = menuEngineering?.dishes.find((m) => m.dishId === currentDish.dishId);
  const category = matrixDish?.category || "PUZZLE";
  const badge = BADGE_STYLES[category];

  // Inflation impact details & primary driver
  const impact = inflationImpact?.find((i) => i.dishId === currentDish.dishId);
  const topDriver = impact?.ingredientDrivers?.[0];

  // Month-specific recipe cost
  const replayDish = recipeReplay?.find((r) => r.dishId === currentDish.dishId);
  const activeDate = selectedTimelineDate || timelineDates[timelineDates.length - 1];
  const activePoint =
    replayDish?.points.find((p) => p.date === activeDate) ||
    replayDish?.points[replayDish.points.length - 1];

  const currentCost = activePoint?.recipeCost ?? currentDish.unitIngredientCost;
  const currentContribution = activePoint?.contributionPerServing ?? currentDish.unitSellingPrice - currentCost;
  const currentMargin = activePoint?.marginPercentage ?? ((currentDish.unitSellingPrice - currentCost) / currentDish.unitSellingPrice) * 100;

  return (
    <div className="forest-card rounded-2xl p-4 sm:p-5 border border-forest-border flex flex-col justify-between h-full space-y-4">
      {/* Header & Dish Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-neutral-400 select-none">
              Dish Inspector
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.style}`}>
              <span>{badge.icon}</span>
              <span>{badge.label}</span>
            </span>
          </div>

          {/* Quick Dish Dropdown for 2D Fallback */}
          <select
            value={currentDish.dishId}
            onChange={(e) => setSelectedDishId(e.target.value)}
            className="bg-forest-elevated text-xs font-medium text-neutral-200 border border-forest-border rounded-lg px-2 py-1 outline-none focus:border-emerald-500 cursor-pointer"
            aria-label="Select dish to inspect"
          >
            {dishProfitability.map((d) => (
              <option key={d.dishId} value={d.dishId} className="bg-neutral-900 text-white">
                {d.dishName}
              </option>
            ))}
          </select>
        </div>

        {/* Dish Title */}
        <div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {currentDish.dishName}
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Rank #{currentDish.rankByContribution} Contribution • Rank #{currentDish.rankByMarginPercentage} Margin %
          </p>
        </div>
      </div>

      {/* Primary Financial Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Selling Price */}
        <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
          <div className="text-[11px] font-medium text-neutral-400 select-none">Selling Price</div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums mt-0.5">
            {formatINR(currentDish.unitSellingPrice)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Per Serving</div>
        </div>

        {/* Recipe Food Cost */}
        <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
          <div className="text-[11px] font-medium text-neutral-400 select-none">Food Cost (COGS)</div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tabular-nums mt-0.5">
            {formatINR(currentCost)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">
            {activeDate ? `Active (${activeDate.slice(0, 7)})` : "Annual Avg"}
          </div>
        </div>

        {/* Unit Contribution */}
        <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
          <div className="text-[11px] font-medium text-neutral-400 select-none">Unit Contribution</div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            {formatINR(currentContribution)}
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Gross Cash Yield</div>
        </div>

        {/* Contribution Margin */}
        <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
          <div className="text-[11px] font-medium text-neutral-400 select-none">Margin %</div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tabular-nums mt-0.5">
            {currentMargin.toFixed(1)}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-0.5">Food Margin</div>
        </div>
      </div>

      {/* Sales Volume & Top Inflation Cost Driver */}
      <div className="space-y-2 p-3 rounded-xl bg-forest-elevated/50 border border-forest-border text-xs">
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 select-none">Monthly Demand:</span>
          <span className="font-mono font-semibold text-white">
            {Math.round(currentDish.totalVolume / 12)} units / mo
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-neutral-400 select-none">Annual Sales Volume:</span>
          <span className="font-mono font-semibold text-white">
            {currentDish.totalVolume.toLocaleString("en-IN")} units
          </span>
        </div>
        {topDriver && (
          <div className="pt-2 border-t border-forest-border/60 flex items-start justify-between gap-2">
            <span className="text-neutral-400 select-none">Primary Cost Driver:</span>
            <div className="text-right">
              <span className="font-medium text-white block">
                {topDriver.ingredientName}
              </span>
              <span className="text-[11px] font-mono text-red-400">
                +{topDriver.costComponentIncreasePercentage.toFixed(1)}% surge ({topDriver.shareOfDishCostIncreasePercentage.toFixed(0)}% of increase)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action CTA: Simulate Price Surgery */}
      <button
        type="button"
        onClick={() => setActiveTab("simulator")}
        className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer select-none"
      >
        <span>🔬</span>
        <span>Simulate Price Surgery on {currentDish.dishName}</span>
      </button>
    </div>
  );
}
