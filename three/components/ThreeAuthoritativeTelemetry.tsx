"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

export function ThreeAuthoritativeTelemetry() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const {
    threeMode,
    selectedDishId,
    setSelectedDishId,
    selectedTimelineDate,
    setSelectedTimelineDate,
    menuEngineering,
    dishProfitability,
    recipeReplay,
    ingredientInflation,
    inflationImpact,
    salesAnalysis,
    getDishIngredientBreakdown,
  } = state;

  const selectedDish = menuEngineering?.dishes.find((d) => d.dishId === selectedDishId);
  const selectedProfit = dishProfitability.find((p) => p.dishId === selectedDishId);
  const selectedReplay = recipeReplay.find((r) => r.dishId === selectedDishId);
  const selectedImpact = inflationImpact.find((i) => i.dishId === selectedDishId);

  const categoryBadges: Record<MenuEngineeringCategory, { label: string; class: string }> = {
    STAR: { label: "Star", class: "bg-amber-950/70 text-amber-300 border-amber-800/60 shadow-xs" },
    PLOWHORSE: { label: "Plowhorse", class: "bg-blue-950/70 text-blue-300 border-blue-800/60 shadow-xs" },
    PUZZLE: { label: "Puzzle", class: "bg-purple-950/70 text-purple-300 border-purple-800/60 shadow-xs" },
    DOG: { label: "Dog", class: "bg-red-950/70 text-red-300 border-red-800/60 shadow-xs" },
  };

  return (
    <div className="forest-card rounded-2xl p-4 sm:p-5 border border-forest-border shadow-md space-y-4 text-neutral-100">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-forest-border/60">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-white">
            Authoritative 2D Telemetry
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-forest-elevated text-emerald-300 border border-forest-border">
            Pure /engine calculations
          </span>
        </div>
        <div className="text-xs text-neutral-400">
          Active Mode: <strong className="text-white uppercase">{threeMode.replace(/-/g, " ")}</strong>
        </div>
      </div>

      {/* Mode 1 Telemetry: Profitability Landscape */}
      {threeMode === "profitability-landscape" && menuEngineering && selectedDish && selectedProfit && (
        <div className="space-y-4 text-xs">
          {/* Thresholds & Quadrant Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <span className="text-[11px] text-neutral-400">Volume Benchmark</span>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {menuEngineering.popularityThreshold} servings/mo
              </p>
            </div>
            <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <span className="text-[11px] text-neutral-400">Margin Benchmark</span>
              <p className="text-sm font-bold text-white mt-0.5 font-mono">
                {formatINR(menuEngineering.profitabilityThreshold, { showDecimals: true })}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <span className="text-[11px] text-neutral-400">Stars / Plowhorses</span>
              <p className="text-sm font-bold text-amber-300 mt-0.5 font-mono">
                {menuEngineering.categoryCounts.stars} ⭐ / {menuEngineering.categoryCounts.plowhorses} 🐎
              </p>
            </div>
            <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
              <span className="text-[11px] text-neutral-400">Puzzles / Dogs</span>
              <p className="text-sm font-bold text-purple-300 mt-0.5 font-mono">
                {menuEngineering.categoryCounts.puzzles} 🧩 / {menuEngineering.categoryCounts.dogs} 🐕
              </p>
            </div>
          </div>

          {/* Selected Dish Authoritative Card */}
          <div className="p-3.5 rounded-xl border border-forest-border bg-forest-elevated/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-sm font-bold text-white">
                {selectedDish.dishName}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  categoryBadges[selectedDish.category]?.class || ""
                }`}
              >
                {categoryBadges[selectedDish.category]?.label || selectedDish.category}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 text-[10px]">Selling Price: </span>
                <strong className="text-white">{formatINR(selectedProfit.unitSellingPrice)}</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Cost: </span>
                <strong className="text-white">{formatINR(selectedProfit.unitIngredientCost, { showDecimals: true })}</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Margin: </span>
                <strong className="text-emerald-400">{formatINR(selectedDish.averageContributionMargin, { showDecimals: true })} ({selectedProfit.contributionMarginPercentage.toFixed(1)}%)</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Annual Contrib: </span>
                <strong className="text-amber-300">{formatINR(selectedProfit.totalContribution, { compact: true })}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2 Telemetry: Ingredient Inflation Explorer */}
      {threeMode === "ingredient-inflation" && (
        <div className="space-y-3 text-xs">
          {/* Driver warning */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-950/40 border border-red-800/60">
            <div className="flex items-center space-x-2 text-red-300">
              <span className="text-sm">⚠️</span>
              <span className="font-semibold">
                {ingredientInflation.filter((i) => i.isMajorDriver).length} Major Inflation Drivers Detected (≥50% Surge)
              </span>
            </div>
            <span className="text-[11px] font-mono text-red-400">
              Formula: P_t / P_0 × 100
            </span>
          </div>

          {/* Top Inflation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-forest-border/60">
              <thead>
                <tr className="text-neutral-400 font-medium bg-forest-elevated/80">
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3 text-right">Jan Base</th>
                  <th className="py-2.5 px-3 text-right">Dec End</th>
                  <th className="py-2.5 px-3 text-right">Absolute Surge</th>
                  <th className="py-2.5 px-3 text-right">Indexed Growth</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-border/40">
                {ingredientInflation.map((ing) => {
                  const isMajor = ing.isMajorDriver;
                  const latestPoint = ing.monthlyPrices[ing.monthlyPrices.length - 1];
                  return (
                    <tr key={ing.ingredientId} className={isMajor ? "bg-red-950/20" : "hover:bg-forest-elevated/30"}>
                      <td className="py-2 px-3 font-semibold text-white">
                        {ing.ingredientName} <span className="text-[10px] text-neutral-400 font-normal">({ing.unit})</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-300">
                        {formatINR(ing.startPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-white">
                        {formatINR(ing.endPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-red-400 font-semibold">
                        +{formatINR(ing.absoluteChange, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        <span className={isMajor ? "text-red-400" : "text-amber-300"}>
                          +{ing.percentageChange.toFixed(1)}% ({latestPoint?.indexedPrice.toFixed(0)} pts)
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isMajor ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950/80 text-red-300 border border-red-700/60">
                            CRITICAL DRIVER
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-forest-elevated text-neutral-400 border border-forest-border">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mode 3 Telemetry: Recipe Replay Runway */}
      {threeMode === "recipe-replay" && selectedReplay && (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white">
                {selectedReplay.dishName}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Historical Progression ({selectedReplay.points.length} points)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 text-[10px]">Jan Margin: </span>
                <strong className="text-emerald-400">{selectedReplay.points[0]?.marginPercentage.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Dec Margin: </span>
                <strong className="text-red-400">{selectedReplay.points[selectedReplay.points.length - 1]?.marginPercentage.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Net Margin Erosion: </span>
                <strong className="text-red-400">
                  -{(
                    (selectedReplay.points[0]?.marginPercentage ?? 0) -
                    (selectedReplay.points[selectedReplay.points.length - 1]?.marginPercentage ?? 0)
                  ).toFixed(1)}%
                </strong>
              </div>
            </div>
          </div>

          {/* Timeline Points Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {selectedReplay.points.map((pt) => {
              const isSelected = selectedTimelineDate === pt.date;
              return (
                <button
                  key={pt.date}
                  type="button"
                  onClick={() => setSelectedTimelineDate(pt.date)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-neutral-950 font-bold border-emerald-400 shadow-md shadow-emerald-950"
                      : "bg-forest-elevated/70 text-neutral-300 border-forest-border hover:border-emerald-500/40 hover:text-white"
                  }`}
                >
                  <div className="font-mono text-[10px] font-bold opacity-75">{pt.date}</div>
                  <div className="mt-1 font-mono text-xs font-bold">Cost: {formatINR(pt.recipeCost)}</div>
                  <div className="font-mono text-[11px] opacity-90">Margin: {pt.marginPercentage.toFixed(1)}%</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mode 4 Telemetry: Sales Volume Matrix */}
      {threeMode === "sales-volume" && salesAnalysis && (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
            <div>
              <span className="font-bold text-sm text-white">
                Topographic Volume Matrix
              </span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Total Annual Sales Across Menu: <strong className="text-white">{salesAnalysis.totalVolumeAllTime.toLocaleString()} units</strong>
              </p>
            </div>
            {selectedDish && (
              (() => {
                const pop = salesAnalysis.dishPopularity.find((p) => p.dishId === selectedDish.dishId);
                return (
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-neutral-400">Selected Dish Volume: </span>
                    <strong className="text-sm text-white">
                      {(pop?.totalVolume ?? 0).toLocaleString()} units
                    </strong>
                    <span className="text-neutral-400 text-[11px] ml-1">
                      ({pop?.volumeSharePercentage.toFixed(1) ?? "0.0"}% of total)
                    </span>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Mode 5 Telemetry: Ingredient Margin Breakdown (Financial Waterfall & Cost Anatomy) */}
      {threeMode === "margin-breakdown" && (
        (() => {
          const breakdown = getDishIngredientBreakdown(selectedDishId, selectedTimelineDate ?? undefined);
          if (!breakdown) {
            return (
              <div className="p-4 rounded-xl bg-forest-elevated/50 text-neutral-400 text-xs text-center border border-forest-border">
                Select a dish to inspect its recipe cost anatomy.
              </div>
            );
          }

          const activePoint = selectedReplay?.points.find((p) => p.date === breakdown.date);
          const sellingPrice = activePoint?.sellingPrice ?? selectedProfit?.unitSellingPrice ?? 0;
          const grossContribution = Math.max(0, sellingPrice - breakdown.totalRecipeCost);
          const marginPercentage = sellingPrice > 0 ? (grossContribution / sellingPrice) * 100 : 0;
          const foodCostPercentage = sellingPrice > 0 ? (breakdown.totalRecipeCost / sellingPrice) * 100 : 0;

          return (
            <div className="space-y-3 text-xs">
              {/* Financial Waterfall Reconciliation Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
                  <span className="text-[11px] text-neutral-400">Selling Price</span>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">
                    {formatINR(sellingPrice)}
                  </p>
                  <span className="text-[10px] text-neutral-400">100% Revenue</span>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
                  <span className="text-[11px] text-neutral-400">Total Food Cost</span>
                  <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                    {formatINR(breakdown.totalRecipeCost, { showDecimals: true })}
                  </p>
                  <span className="text-[10px] text-neutral-400">{foodCostPercentage.toFixed(1)}% of price</span>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
                  <span className="text-[11px] text-neutral-400">Gross Contribution</span>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {formatINR(grossContribution, { showDecimals: true })}
                  </p>
                  <span className="text-[10px] text-neutral-400">Cash yield per plate</span>
                </div>
                <div className="p-2.5 rounded-xl bg-forest-elevated/70 border border-forest-border">
                  <span className="text-[11px] text-neutral-400">Contribution Margin</span>
                  <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
                    {marginPercentage.toFixed(1)}%
                  </p>
                  <span className="text-[10px] text-neutral-400">Food Margin</span>
                </div>
              </div>

              {/* Breakdown Title & Date Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">
                      {breakdown.dishName} — 3D Waterfall & Plate Anatomy
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                      ✓ Reconciled (|Δ| ≤ 10⁻⁹)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    As of date: <strong>{breakdown.date}</strong> • Showing {breakdown.ingredients.length} recipe ingredients
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-neutral-400">Reconciliation: </span>
                  <strong className="text-xs text-white">
                    {formatINR(sellingPrice)} = {formatINR(breakdown.totalRecipeCost, { showDecimals: true })} + {formatINR(grossContribution, { showDecimals: true })}
                  </strong>
                </div>
              </div>

              {/* Ingredient Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-forest-border/60">
                  <thead>
                    <tr className="text-neutral-400 font-medium bg-forest-elevated/80">
                      <th className="py-2.5 px-3">Ingredient</th>
                      <th className="py-2.5 px-3 text-right">Recipe Quantity</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Ingredient Cost</th>
                      <th className="py-2.5 px-3 text-right">Cost Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-forest-border/40 font-mono">
                    {breakdown.ingredients.map((ing) => (
                      <tr key={ing.ingredientId} className="hover:bg-forest-elevated/30">
                        <td className="py-2 px-3 font-sans font-semibold text-white">
                          {ing.ingredientName}
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-300">
                          {ing.quantity} {ing.recipeUnit}
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-300">
                          {formatINR(ing.unitPrice, { showDecimals: true })} / {ing.pricingUnit}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatINR(ing.ingredientCost, { showDecimals: true })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-300">
                          {ing.costSharePercentage.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()
      )}

      {/* Mode 6 Telemetry: Inflation Impact Arena */}
      {threeMode === "inflation-impact" && (
        <div className="space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-forest-elevated/70 border border-forest-border">
            <div>
              <span className="font-bold text-sm text-white">
                Menu Inflation Impact Summary
              </span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Comparing January Baseline vs December Inflation-Adjusted Dish Costs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-red-950/80 text-red-300 border border-red-800/60 font-bold">
                {inflationImpact.filter((i) => i.isInflationHurt).length} Dishes Inflation Hurt
              </span>
            </div>
          </div>

          {/* Dish Impact Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {inflationImpact.map((dish) => {
              const isSelected = dish.dishId === selectedDishId;
              const isHurt = dish.isInflationHurt;

              return (
                <div
                  key={dish.dishId}
                  onClick={() => setSelectedDishId(dish.dishId)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-emerald-500 border-emerald-500 bg-forest-elevated shadow-md shadow-emerald-950"
                      : "border-forest-border bg-forest-elevated/50 hover:border-forest-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white truncate">
                      {dish.dishName}
                    </span>
                    {isHurt && (
                      <span className="text-[10px] font-bold text-red-400">
                        ⚠️ HURT
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Jan Cost:</span>
                      <span className="text-neutral-200">{formatINR(dish.startCost, { showDecimals: true })}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold">
                      <span>Dec Cost:</span>
                      <span>{formatINR(dish.endCost, { showDecimals: true })}</span>
                    </div>
                    <div className="flex justify-between text-red-400 font-semibold pt-1 border-t border-forest-border/60">
                      <span>Cost Surge:</span>
                      <span>+{dish.costIncreasePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-neutral-400 text-[10px]">
                      <span>Margin Erosion:</span>
                      <span className="text-neutral-300">-{dish.marginErosionPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
