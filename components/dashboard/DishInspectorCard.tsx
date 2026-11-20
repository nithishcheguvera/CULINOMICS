"use client";

import React, { useState } from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory, DishSimulationScenario } from "@/engine";

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

  const [cardMode, setCardMode] = useState<"inspect" | "surgery">("inspect");

  const {
    dishProfitability,
    menuEngineering,
    inflationImpact,
    recipeReplay,
    selectedDishId,
    selectedTimelineDate,
    timelineDates,
    setSelectedDishId,
    activeScenario,
    scenarioResult,
    updateScenario,
    resetScenario,
  } = state;

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
  const activeDate = selectedTimelineDate || (timelineDates && timelineDates[timelineDates.length - 1]);
  const activePoint =
    replayDish?.points.find((p) => p.date === activeDate) ||
    (replayDish && replayDish.points[replayDish.points.length - 1]);

  const currentCost = activePoint?.recipeCost ?? currentDish.unitIngredientCost;
  const currentContribution = activePoint?.contributionPerServing ?? currentDish.unitSellingPrice - currentCost;
  const currentMargin = activePoint?.marginPercentage ?? ((currentDish.unitSellingPrice - currentCost) / currentDish.unitSellingPrice) * 100;

  // Surgery calculation values
  const hasSurgery = activeScenario && scenarioResult && activeScenario.dishId === currentDish.dishId;
  const sim = hasSurgery ? scenarioResult.simulated : null;
  const delta = hasSurgery ? scenarioResult.delta : null;
  const base = hasSurgery ? scenarioResult.baseline : null;

  const isPriceModified = hasSurgery && activeScenario.targetSellingPrice !== base!.sellingPrice;
  const isCostModified = hasSurgery && Math.abs(activeScenario.targetIngredientCost - base!.unitIngredientCost) > 0.01;
  const isVolumeModified = hasSurgery && activeScenario.targetMonthlyVolume !== Math.round(base!.monthlyVolume);
  const isModified = isPriceModified || isCostModified || isVolumeModified;

  const handlePriceChange = (val: number) => {
    if (!activeScenario) return;
    updateScenario({ ...activeScenario, targetSellingPrice: Math.max(0, Math.round(val)) });
  };

  const handleCostChange = (val: number) => {
    if (!activeScenario) return;
    updateScenario({ ...activeScenario, targetIngredientCost: Math.max(0, Math.round(val * 100) / 100) });
  };

  const handleVolumeChange = (val: number) => {
    if (!activeScenario) return;
    updateScenario({ ...activeScenario, targetMonthlyVolume: Math.max(0, Math.round(val)) });
  };

  const priceMax = base ? Math.max(2500, Math.ceil(base.sellingPrice * 2.5)) : 2500;
  const costMax = base ? Math.max(1200, Math.ceil(base.unitIngredientCost * 2.5)) : 1200;
  const volumeMax = base ? Math.max(600, Math.ceil(base.monthlyVolume * 3)) : 600;

  return (
    <div
      aria-label="Dish Inspector Card"
      className="forest-card rounded-2xl p-4 sm:p-5 border border-forest-border flex flex-col justify-between h-full space-y-4"
    >
      {/* Header, Mode Toggle & Dish Dropdown */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          {/* Segmented Mode Selector: [Inspector] | [Menu Surgery 🔬] */}
          <div className="flex items-center bg-forest-elevated/90 border border-forest-border p-0.5 rounded-lg text-xs font-medium">
            <button
              id="btn-stage-inspect-toggle"
              type="button"
              onClick={() => setCardMode("inspect")}
              className={`px-2.5 py-1 rounded-md transition-all select-none cursor-pointer ${
                cardMode === "inspect"
                  ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              👁️ Inspector
            </button>
            <button
              id="btn-stage-surgery-toggle"
              type="button"
              onClick={() => setCardMode("surgery")}
              className={`px-2.5 py-1 rounded-md transition-all select-none cursor-pointer flex items-center space-x-1 ${
                cardMode === "surgery"
                  ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🔬</span>
              <span>Surgery</span>
              {isModified && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
            </button>
          </div>

          {/* Quick Dish Dropdown */}
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

        {/* Dish Title & Quadrant Pill */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {currentDish.dishName}
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Rank #{currentDish.rankByContribution} Contribution • Rank #{currentDish.rankByMarginPercentage} Margin %
            </p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.style} shrink-0`}>
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </span>
        </div>
      </div>

      {/* MODE A: Historical Inspector View */}
      {cardMode === "inspect" && (
        <div className="space-y-4">
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

          {/* Action CTA: Switch right card to surgery mode */}
          <button
            type="button"
            onClick={() => setCardMode("surgery")}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer select-none"
          >
            <span>🔬</span>
            <span>Simulate Price Surgery on {currentDish.dishName}</span>
          </button>
        </div>
      )}

      {/* MODE B: Live Menu Surgery Lab View */}
      {cardMode === "surgery" && hasSurgery && sim && delta && base && (
        <div className="space-y-3.5">
          {/* Sliders: Selling Price, Ingredient Cost, Volume */}
          <div className="space-y-3 p-3 rounded-xl bg-forest-elevated/50 border border-forest-border text-xs">
            {/* Price Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-300">Target Price:</span>
                <span className="font-mono font-bold text-white">
                  {formatINR(sim.sellingPrice)}
                  <span className={`ml-1 text-[10px] ${delta.sellingPrice >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({delta.sellingPrice >= 0 ? "+" : ""}{formatINR(delta.sellingPrice)})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={priceMax}
                step={10}
                value={activeScenario.targetSellingPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Cost Slider */}
            <div className="space-y-1 pt-1.5 border-t border-forest-border/40">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-300">Target Cost:</span>
                <span className="font-mono font-bold text-amber-300">
                  {formatINR(sim.unitIngredientCost, { showDecimals: true })}
                  <span className={`ml-1 text-[10px] ${delta.unitIngredientCost <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    ({delta.unitIngredientCost >= 0 ? "+" : ""}{formatINR(delta.unitIngredientCost, { showDecimals: true })})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={costMax}
                step={5}
                value={activeScenario.targetIngredientCost}
                onChange={(e) => handleCostChange(Number(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>

            {/* Volume Slider */}
            <div className="space-y-1 pt-1.5 border-t border-forest-border/40">
              <div className="flex justify-between items-center">
                <span className="font-medium text-neutral-300">Target Demand:</span>
                <span className="font-mono font-bold text-sky-300">
                  {sim.monthlyVolume} units / mo
                  <span className={`ml-1 text-[10px] ${delta.monthlyVolume >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({delta.monthlyVolume >= 0 ? "+" : ""}{delta.monthlyVolume})
                  </span>
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={volumeMax}
                step={1}
                value={activeScenario.targetMonthlyVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-full accent-sky-400 cursor-pointer h-1.5 bg-neutral-800 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* Simulated Impact Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <div className="text-[10px] text-neutral-400 select-none">Simulated Margin</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {sim.contributionMarginPercentage !== null ? `${sim.contributionMarginPercentage.toFixed(1)}%` : "N/A"}
              </div>
              <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {delta.contributionMarginPercentage !== null ? `${delta.contributionMarginPercentage > 0 ? "+" : ""}${delta.contributionMarginPercentage.toFixed(1)} pts` : "N/A"}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <div className="text-[10px] text-neutral-400 select-none">Unit Contribution</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {formatINR(sim.contributionPerServing, { showDecimals: true })}
              </div>
              <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {delta.contributionPerServing >= 0 ? "+" : ""}{formatINR(delta.contributionPerServing, { showDecimals: true })}
              </div>
            </div>
          </div>

          {/* Reset Baseline Action */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={resetScenario}
              disabled={!isModified}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-mono transition-all flex items-center justify-center space-x-1 select-none cursor-pointer ${
                isModified
                  ? "bg-forest-elevated hover:bg-forest-border text-amber-300 border-amber-600/50 shadow-sm"
                  : "opacity-40 cursor-not-allowed bg-forest-elevated/40 text-neutral-500 border-forest-border"
              }`}
            >
              <span>↺</span>
              <span>Reset Baseline</span>
            </button>
            <button
              type="button"
              onClick={() => setCardMode("inspect")}
              className="px-3 py-2 rounded-xl bg-forest-elevated hover:bg-forest-border border border-forest-border text-neutral-300 text-xs font-mono select-none cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
