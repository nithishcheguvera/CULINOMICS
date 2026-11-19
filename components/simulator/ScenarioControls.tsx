"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { DishSimulationScenario } from "@/engine";

export function ScenarioControls() {
  const { activeScenario, scenarioResult, updateScenario, resetScenario } = useAppStore();

  if (!activeScenario || !scenarioResult) return null;

  const { baseline } = scenarioResult;

  const handlePriceChange = (newPrice: number) => {
    const clampedPrice = Math.max(0, Math.round(newPrice));
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetSellingPrice: clampedPrice,
    };
    updateScenario(next);
  };

  const handleCostChange = (newCost: number) => {
    const clampedCost = Math.max(0, Math.round(newCost * 100) / 100);
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetIngredientCost: clampedCost,
    };
    updateScenario(next);
  };

  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.round(newVolume));
    const next: DishSimulationScenario = {
      ...activeScenario,
      targetMonthlyVolume: clampedVolume,
    };
    updateScenario(next);
  };

  // Helper nudge calculators
  const applyPricePercent = (pct: number) => {
    const calculated = Math.round(baseline.sellingPrice * (1 + pct / 100));
    handlePriceChange(calculated);
  };

  const applyCostPercent = (pct: number) => {
    const calculated = Math.round(baseline.unitIngredientCost * (1 + pct / 100) * 100) / 100;
    handleCostChange(calculated);
  };

  const applyVolumePercent = (pct: number) => {
    const calculated = Math.round(baseline.monthlyVolume * (1 + pct / 100));
    handleVolumeChange(calculated);
  };

  const priceMax = Math.max(2500, Math.ceil(baseline.sellingPrice * 2.5));
  const costMax = Math.max(1200, Math.ceil(baseline.unitIngredientCost * 2.5));
  const volumeMax = Math.max(600, Math.ceil(baseline.monthlyVolume * 3));

  const isPriceModified = activeScenario.targetSellingPrice !== baseline.sellingPrice;
  const isCostModified = Math.abs(activeScenario.targetIngredientCost - baseline.unitIngredientCost) > 0.01;
  const isVolumeModified = activeScenario.targetMonthlyVolume !== Math.round(baseline.monthlyVolume);
  const isAnyModified = isPriceModified || isCostModified || isVolumeModified;

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-lg text-foreground flex items-center gap-2">
            <span>⚙️</span> Scenario Parameters
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adjust dish levers to simulate immediate financial & quadrant impacts
          </p>
        </div>
        <button
          type="button"
          onClick={resetScenario}
          disabled={!isAnyModified}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
            isAnyModified
              ? "bg-muted hover:bg-muted/80 text-foreground border-border cursor-pointer"
              : "opacity-40 cursor-not-allowed bg-muted/30 text-muted-foreground border-transparent"
          }`}
          title="Reset to verified baseline values"
        >
          <span>↺</span> Reset to Baseline
        </button>
      </div>

      {/* 1. Target Selling Price */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>💰</span> Target Selling Price
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Baseline: {formatINR(baseline.sellingPrice)}
            </span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="10"
                value={activeScenario.targetSellingPrice}
                onChange={(e) => handlePriceChange(Number(e.target.value))}
                className="w-24 pl-6 pr-2 py-1 text-right text-sm font-mono font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={priceMax}
          step="10"
          value={activeScenario.targetSellingPrice}
          onChange={(e) => handlePriceChange(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">Quick nudges:</span>
          <div className="flex items-center gap-1.5">
            {[-15, -5, 0, 5, 10, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => (pct === 0 ? handlePriceChange(baseline.sellingPrice) : applyPricePercent(pct))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  pct === 0
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : pct > 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                }`}
              >
                {pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Target Ingredient Cost */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>🥩</span> Target Ingredient Cost (COGS)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Baseline: {formatINR(baseline.unitIngredientCost, { showDecimals: true })}
            </span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="5"
                value={activeScenario.targetIngredientCost}
                onChange={(e) => handleCostChange(Number(e.target.value))}
                className="w-24 pl-6 pr-2 py-1 text-right text-sm font-mono font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={costMax}
          step="5"
          value={activeScenario.targetIngredientCost}
          onChange={(e) => handleCostChange(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">Supplier inflation / portion savings:</span>
          <div className="flex items-center gap-1.5">
            {[-15, -5, 0, 5, 15, 30].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => (pct === 0 ? handleCostChange(baseline.unitIngredientCost) : applyCostPercent(pct))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  pct === 0
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : pct < 0
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                {pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Target Monthly Volume */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <span>📦</span> Target Monthly Volume (Servings)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Baseline Avg: {baseline.monthlyVolume.toFixed(1)} / mo
            </span>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1"
                value={activeScenario.targetMonthlyVolume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-24 px-2 py-1 text-right text-sm font-mono font-semibold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max={volumeMax}
          step="1"
          value={activeScenario.targetMonthlyVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full accent-primary cursor-pointer"
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">Demand shifts:</span>
          <div className="flex items-center gap-1.5">
            {[-30, -10, 0, 10, 25, 50].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => (pct === 0 ? handleVolumeChange(Math.round(baseline.monthlyVolume)) : applyVolumePercent(pct))}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${
                  pct === 0
                    ? "bg-muted text-muted-foreground hover:bg-muted/80"
                    : pct > 0
                    ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20"
                    : "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/20"
                }`}
              >
                {pct === 0 ? "Base" : `${pct > 0 ? "+" : ""}${pct}%`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
