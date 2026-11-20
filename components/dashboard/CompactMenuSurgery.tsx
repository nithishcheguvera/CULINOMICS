"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { DishSimulationScenario, MenuEngineeringCategory } from "@/engine";

const CATEGORY_ICONS: Record<MenuEngineeringCategory, string> = {
  STAR: "⭐",
  PLOWHORSE: "🐎",
  PUZZLE: "🧩",
  DOG: "🐕",
};

const CATEGORY_COLORS: Record<MenuEngineeringCategory, { bg: string; text: string; border: string }> = {
  STAR: { bg: "bg-amber-950/80", text: "text-amber-300", border: "border-amber-700/60" },
  PLOWHORSE: { bg: "bg-blue-950/80", text: "text-blue-300", border: "border-blue-700/60" },
  PUZZLE: { bg: "bg-purple-950/80", text: "text-purple-300", border: "border-purple-700/60" },
  DOG: { bg: "bg-red-950/80", text: "text-red-300", border: "border-red-700/60" },
};

export function CompactMenuSurgery() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const {
    activeScenario,
    scenarioResult,
    updateScenario,
    resetScenario,
    dishProfitability,
    setSelectedDishId,
  } = state;

  if (!activeScenario || !scenarioResult || !dishProfitability || dishProfitability.length === 0) {
    return null;
  }

  const { dishName, baseline, simulated, delta, restaurantImpact, matrixProjection } = scenarioResult;

  const isPriceModified = activeScenario.targetSellingPrice !== baseline.sellingPrice;
  const isCostModified = Math.abs(activeScenario.targetIngredientCost - baseline.unitIngredientCost) > 0.01;
  const isVolumeModified = activeScenario.targetMonthlyVolume !== Math.round(baseline.monthlyVolume);
  const isModified = isPriceModified || isCostModified || isVolumeModified;

  // Handlers for sliders
  const handlePriceChange = (val: number) => {
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetSellingPrice: Math.max(0, Math.round(val)),
    };
    updateScenario(next);
  };

  const handleCostChange = (val: number) => {
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetIngredientCost: Math.max(0, Math.round(val * 100) / 100),
    };
    updateScenario(next);
  };

  const handleVolumeChange = (val: number) => {
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetMonthlyVolume: Math.max(0, Math.round(val)),
    };
    updateScenario(next);
  };

  // Nudge percentage helpers
  const nudgePrice = (pct: number) => {
    handlePriceChange(Math.round(baseline.sellingPrice * (1 + pct / 100)));
  };

  const nudgeCost = (pct: number) => {
    handleCostChange(Math.round(baseline.unitIngredientCost * (1 + pct / 100) * 100) / 100);
  };

  const nudgeVolume = (pct: number) => {
    handleVolumeChange(Math.round(baseline.monthlyVolume * (1 + pct / 100)));
  };

  const priceMax = Math.max(2500, Math.ceil(baseline.sellingPrice * 2.5));
  const costMax = Math.max(1200, Math.ceil(baseline.unitIngredientCost * 2.5));
  const volumeMax = Math.max(600, Math.ceil(baseline.monthlyVolume * 3));

  const formatDeltaCurrency = (val: number, showDecimals = false) => {
    const sign = val > 0 ? "+" : val < 0 ? "-" : "";
    return `${sign}${formatINR(Math.abs(val), { showDecimals })}`;
  };

  const formatDeltaPercent = (val: number | null) => {
    if (val === null) return "N/A";
    const sign = val > 0 ? "+" : "";
    return `${sign}${val.toFixed(1)}%`;
  };

  const getDeltaBadgeStyle = (val: number, invert = false) => {
    if (Math.abs(val) < 0.001) return "text-neutral-400 bg-forest-elevated/70 border-forest-border";
    const isGood = invert ? val < 0 : val > 0;
    return isGood
      ? "text-emerald-300 bg-emerald-950/70 border-emerald-800/60"
      : "text-red-300 bg-red-950/70 border-red-800/60";
  };

  const baseCatStyle = CATEGORY_COLORS[matrixProjection.baselineCategory];
  const projCatStyle = CATEGORY_COLORS[matrixProjection.projectedCategory];

  return (
    <section
      aria-label="Menu Surgery Cockpit Lab"
      className="forest-card rounded-2xl p-4 sm:p-5 border border-forest-border space-y-4"
    >
      {/* 1. Header Bar: Title, Active Dish, Matrix Reclassification & Reset */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-forest-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-base">🔬</span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase">
              Menu Surgery™ Cockpit Lab
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              Deterministic In-Memory Simulation
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            Simulate dynamic price adjustments, ingredient cost inflation, and demand elasticity with instant matrix reclassification
          </p>
        </div>

        {/* Status Indicators & Reset Button */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Matrix Shift Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-xs font-mono">
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${baseCatStyle.bg} ${baseCatStyle.text} ${baseCatStyle.border}`}>
              {CATEGORY_ICONS[matrixProjection.baselineCategory]} {matrixProjection.baselineCategory}
            </span>
            <span className="text-neutral-400">→</span>
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${projCatStyle.bg} ${projCatStyle.text} ${projCatStyle.border}`}>
              {CATEGORY_ICONS[matrixProjection.projectedCategory]} {matrixProjection.projectedCategory}
            </span>
            {matrixProjection.isPromoted && (
              <span className="text-[10px] text-emerald-400 font-bold ml-1">▲ PROMOTED</span>
            )}
            {matrixProjection.isDemoted && (
              <span className="text-[10px] text-red-400 font-bold ml-1">▼ DEMOTED</span>
            )}
          </div>

          {/* Reset to Baseline Button */}
          <button
            type="button"
            onClick={resetScenario}
            disabled={!isModified}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-all select-none cursor-pointer border ${
              isModified
                ? "bg-forest-elevated hover:bg-forest-border text-amber-300 border-amber-600/50 shadow-sm"
                : "opacity-40 cursor-not-allowed bg-forest-elevated/40 text-neutral-500 border-forest-border"
            }`}
            title="Reset active scenario to verified historical baseline"
          >
            <span>↺</span>
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 2. Fast Target Dish Switcher */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap">
          Target Dish:
        </span>
        {dishProfitability.map((dish) => {
          const isSelected = dish.dishId === activeScenario.dishId;
          return (
            <button
              key={dish.dishId}
              type="button"
              onClick={() => setSelectedDishId(dish.dishId)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none cursor-pointer ${
                isSelected
                  ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                  : "bg-forest-elevated/70 border border-forest-border text-neutral-400 hover:text-white hover:border-forest-border/80"
              }`}
            >
              <span>{dish.dishName}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Grid: Controls & Sliders (Left 60%) + Live Financial Impact (Right 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: 3 Levers (Selling Price, Ingredient Cost, Monthly Volume) */}
        <div className="lg:col-span-7 space-y-3.5 bg-forest-elevated/40 border border-forest-border/60 rounded-xl p-3.5 sm:p-4">
          {/* Lever 1: Selling Price */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="surgery-selling-price" className="font-semibold text-neutral-200 flex items-center space-x-1.5">
                <span>💰</span>
                <span>Selling Price</span>
              </label>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-neutral-400 text-[11px]">Baseline: {formatINR(baseline.sellingPrice)}</span>
                <span className="text-white font-bold text-sm bg-forest-surface px-2 py-0.5 rounded border border-forest-border">
                  {formatINR(simulated.sellingPrice)}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getDeltaBadgeStyle(delta.sellingPrice)}`}>
                  {formatDeltaCurrency(delta.sellingPrice)} ({formatDeltaPercent(delta.percentageChanges.sellingPrice)})
                </span>
              </div>
            </div>
            <input
              id="surgery-selling-price"
              aria-label="Target Selling Price"
              type="range"
              min={0}
              max={priceMax}
              step={10}
              value={activeScenario.targetSellingPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-500">₹0</span>
              <div className="flex items-center space-x-1">
                {[-10, -5, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => nudgePrice(pct)}
                    className="px-1.5 py-0.5 rounded bg-forest-surface border border-forest-border text-[10px] font-mono text-neutral-400 hover:text-white hover:border-emerald-600/60"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">{formatINR(priceMax)}</span>
            </div>
          </div>

          {/* Lever 2: Ingredient Cost */}
          <div className="space-y-1.5 pt-2 border-t border-forest-border/40">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="surgery-ingredient-cost" className="font-semibold text-neutral-200 flex items-center space-x-1.5">
                <span>🥩</span>
                <span>Ingredient Cost</span>
              </label>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-neutral-400 text-[11px]">
                  Baseline: {formatINR(baseline.unitIngredientCost, { showDecimals: true })}
                </span>
                <span className="text-amber-300 font-bold text-sm bg-forest-surface px-2 py-0.5 rounded border border-forest-border">
                  {formatINR(simulated.unitIngredientCost, { showDecimals: true })}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getDeltaBadgeStyle(delta.unitIngredientCost, true)}`}>
                  {formatDeltaCurrency(delta.unitIngredientCost, true)} ({formatDeltaPercent(delta.percentageChanges.unitIngredientCost)})
                </span>
              </div>
            </div>
            <input
              id="surgery-ingredient-cost"
              aria-label="Target Ingredient Cost"
              type="range"
              min={0}
              max={costMax}
              step={5}
              value={activeScenario.targetIngredientCost}
              onChange={(e) => handleCostChange(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-500">₹0</span>
              <div className="flex items-center space-x-1">
                {[-10, -5, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => nudgeCost(pct)}
                    className="px-1.5 py-0.5 rounded bg-forest-surface border border-forest-border text-[10px] font-mono text-neutral-400 hover:text-white hover:border-amber-600/60"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">{formatINR(costMax)}</span>
            </div>
          </div>

          {/* Lever 3: Monthly Volume */}
          <div className="space-y-1.5 pt-2 border-t border-forest-border/40">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="surgery-monthly-volume" className="font-semibold text-neutral-200 flex items-center space-x-1.5">
                <span>📦</span>
                <span>Monthly Sales Volume</span>
              </label>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-neutral-400 text-[11px]">
                  Baseline: {Math.round(baseline.monthlyVolume)} units
                </span>
                <span className="text-sky-300 font-bold text-sm bg-forest-surface px-2 py-0.5 rounded border border-forest-border">
                  {simulated.monthlyVolume} units
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getDeltaBadgeStyle(delta.monthlyVolume)}`}>
                  {delta.monthlyVolume > 0 ? `+${delta.monthlyVolume}` : delta.monthlyVolume} ({formatDeltaPercent(delta.percentageChanges.monthlyVolume)})
                </span>
              </div>
            </div>
            <input
              id="surgery-monthly-volume"
              aria-label="Target Monthly Sales Volume"
              type="range"
              min={0}
              max={volumeMax}
              step={1}
              value={activeScenario.targetMonthlyVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-2 bg-neutral-800 rounded-lg appearance-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-neutral-500">0 units</span>
              <div className="flex items-center space-x-1">
                {[-10, -5, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => nudgeVolume(pct)}
                    className="px-1.5 py-0.5 rounded bg-forest-surface border border-forest-border text-[10px] font-mono text-neutral-400 hover:text-white hover:border-sky-600/60"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-500">{volumeMax} units</span>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Projected Impact (Unit Economics & Restaurant-Wide) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3 bg-forest-elevated/40 border border-forest-border/60 rounded-xl p-3.5 sm:p-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-forest-border/40">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <span>📊</span>
                <span>Projected Economics</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">{dishName}</span>
            </div>

            {/* Per-Serving Contribution & Margin */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-forest-surface border border-forest-border">
                <span className="text-[10px] font-medium text-neutral-400 block">Unit Contribution</span>
                <span className="text-base font-bold font-mono text-white block mt-0.5">
                  {formatINR(simulated.contributionPerServing, { showDecimals: true })}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1 py-0.5 rounded border inline-block mt-1 ${getDeltaBadgeStyle(delta.contributionPerServing)}`}>
                  {formatDeltaCurrency(delta.contributionPerServing, true)}
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-forest-surface border border-forest-border">
                <span className="text-[10px] font-medium text-neutral-400 block">Food Margin %</span>
                <span className="text-base font-bold font-mono text-emerald-400 block mt-0.5">
                  {simulated.contributionMarginPercentage !== null ? `${simulated.contributionMarginPercentage.toFixed(1)}%` : "N/A"}
                </span>
                <span className={`text-[10px] font-mono font-semibold px-1 py-0.5 rounded border inline-block mt-1 ${getDeltaBadgeStyle(delta.contributionMarginPercentage ?? 0)}`}>
                  {delta.contributionMarginPercentage !== null ? `${delta.contributionMarginPercentage > 0 ? "+" : ""}${delta.contributionMarginPercentage.toFixed(1)} pts` : "N/A"}
                </span>
              </div>
            </div>

            {/* Restaurant-Wide Monthly Net Impact */}
            <div className="p-2.5 rounded-lg bg-forest-surface/80 border border-forest-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Restaurant Monthly Revenue:</span>
                <span className="font-mono text-white font-semibold">
                  {formatINR(restaurantImpact.simulatedMonthlyRevenue)}
                  <span className={`ml-1.5 text-[10px] font-semibold ${restaurantImpact.deltaMonthlyRevenue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    ({restaurantImpact.deltaMonthlyRevenue >= 0 ? "+" : ""}{formatINR(restaurantImpact.deltaMonthlyRevenue)})
                  </span>
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Restaurant Monthly COGS:</span>
                <span className="font-mono text-white font-semibold">
                  {formatINR(restaurantImpact.simulatedMonthlyCost)}
                  <span className={`ml-1.5 text-[10px] font-semibold ${restaurantImpact.deltaMonthlyCost <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                    ({restaurantImpact.deltaMonthlyCost >= 0 ? "+" : ""}{formatINR(restaurantImpact.deltaMonthlyCost)})
                  </span>
                </span>
              </div>

              <div className="pt-1.5 border-t border-forest-border/60 flex items-center justify-between text-xs">
                <span className="font-bold text-white">Net Monthly Contribution:</span>
                <span className={`font-mono font-bold text-sm ${restaurantImpact.deltaMonthlyContribution >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {formatINR(restaurantImpact.simulatedMonthlyContribution)}
                  <span className="ml-1 text-[11px]">
                    ({restaurantImpact.deltaMonthlyContribution >= 0 ? "+" : ""}{formatINR(restaurantImpact.deltaMonthlyContribution)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 3D Terrain Synchronization Beacon Banner */}
          <div className="px-3 py-1.5 rounded-lg bg-forest-surface/90 border border-emerald-500/30 flex items-center justify-between text-[11px] font-mono text-emerald-300">
            <span className="flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isModified ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"}`} />
              <span>3D Terrain: {isModified ? "Projected Ghost Column Active" : "Baseline Ground Truth"}</span>
            </span>
            <span className="text-neutral-400">R3F Sync</span>
          </div>
        </div>
      </div>
    </section>
  );
}
