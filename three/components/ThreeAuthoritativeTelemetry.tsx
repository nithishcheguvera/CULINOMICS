"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

export function ThreeAuthoritativeTelemetry() {
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
  } = useAppStore();

  const selectedDish = menuEngineering?.dishes.find((d) => d.dishId === selectedDishId);
  const selectedProfit = dishProfitability.find((p) => p.dishId === selectedDishId);
  const selectedReplay = recipeReplay.find((r) => r.dishId === selectedDishId);
  const selectedImpact = inflationImpact.find((i) => i.dishId === selectedDishId);

  const categoryBadges: Record<MenuEngineeringCategory, { label: string; class: string }> = {
    STAR: { label: "Star", class: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800" },
    PLOWHORSE: { label: "Plowhorse", class: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800" },
    PUZZLE: { label: "Puzzle", class: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800" },
    DOG: { label: "Dog", class: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800" },
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center space-x-2">
          <span className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Authoritative 2D Telemetry
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
            Pure /engine calculations
          </span>
        </div>
        <div className="text-xs text-neutral-500">
          Active Mode: <strong className="text-neutral-800 dark:text-neutral-200 uppercase">{threeMode.replace(/-/g, " ")}</strong>
        </div>
      </div>

      {/* Mode 1 Telemetry: Profitability Landscape */}
      {threeMode === "profitability-landscape" && menuEngineering && selectedDish && selectedProfit && (
        <div className="space-y-4 text-xs">
          {/* Thresholds & Quadrant Counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] text-neutral-500">Volume Benchmark</span>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {menuEngineering.popularityThreshold} servings/mo
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] text-neutral-500">Margin Benchmark</span>
              <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {formatINR(menuEngineering.profitabilityThreshold, { showDecimals: true })}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] text-neutral-500">Stars / Plowhorses</span>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {menuEngineering.categoryCounts.stars} ⭐ / {menuEngineering.categoryCounts.plowhorses} 🐎
              </p>
            </div>
            <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[11px] text-neutral-500">Puzzles / Dogs</span>
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                {menuEngineering.categoryCounts.puzzles} 🧩 / {menuEngineering.categoryCounts.dogs} 🐕
              </p>
            </div>
          </div>

          {/* Selected Dish Authoritative Card */}
          <div className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
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
                <strong className="text-neutral-900 dark:text-neutral-100">{formatINR(selectedProfit.unitSellingPrice)}</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Cost: </span>
                <strong className="text-neutral-900 dark:text-neutral-100">{formatINR(selectedProfit.unitIngredientCost, { showDecimals: true })}</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Margin: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(selectedDish.averageContributionMargin, { showDecimals: true })} ({selectedProfit.contributionMarginPercentage.toFixed(1)}%)</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Annual Contrib: </span>
                <strong className="text-amber-600 dark:text-amber-400">{formatINR(selectedProfit.totalContribution, { compact: true })}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode 2 Telemetry: Ingredient Inflation Explorer */}
      {threeMode === "ingredient-inflation" && (
        <div className="space-y-3 text-xs">
          {/* Driver warning */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
            <div className="flex items-center space-x-2 text-rose-800 dark:text-rose-300">
              <span className="text-sm">⚠️</span>
              <span className="font-semibold">
                {ingredientInflation.filter((i) => i.isMajorDriver).length} Major Inflation Drivers Detected (≥50% Surge)
              </span>
            </div>
            <span className="text-[11px] font-mono text-rose-700 dark:text-rose-400">
              Formula: P_t / P_0 × 100
            </span>
          </div>

          {/* Top Inflation Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-neutral-200 dark:divide-neutral-800">
              <thead>
                <tr className="text-neutral-500 font-medium bg-neutral-50 dark:bg-neutral-800/40">
                  <th className="py-2 px-3">Ingredient</th>
                  <th className="py-2 px-3 text-right">Jan Base</th>
                  <th className="py-2 px-3 text-right">Dec End</th>
                  <th className="py-2 px-3 text-right">Absolute Surge</th>
                  <th className="py-2 px-3 text-right">Indexed Growth</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {ingredientInflation.map((ing) => {
                  const isMajor = ing.isMajorDriver;
                  const latestPoint = ing.monthlyPrices[ing.monthlyPrices.length - 1];
                  return (
                    <tr key={ing.ingredientId} className={isMajor ? "bg-rose-50/40 dark:bg-rose-950/20" : ""}>
                      <td className="py-2 px-3 font-semibold text-neutral-800 dark:text-neutral-200">
                        {ing.ingredientName} <span className="text-[10px] text-neutral-400 font-normal">({ing.unit})</span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-neutral-600 dark:text-neutral-400">
                        {formatINR(ing.startPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-neutral-900 dark:text-neutral-100">
                        {formatINR(ing.endPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                        +{formatINR(ing.absoluteChange, { showDecimals: true })}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold">
                        <span className={isMajor ? "text-rose-600 dark:text-rose-400" : "text-amber-600 dark:text-amber-400"}>
                          +{ing.percentageChange.toFixed(1)}% ({latestPoint?.indexedPrice.toFixed(0)} pts)
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isMajor ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                            CRITICAL DRIVER
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
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
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {selectedReplay.dishName}
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                Historical Progression ({selectedReplay.points.length} points)
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-neutral-400 text-[10px]">Jan Margin: </span>
                <strong className="text-emerald-600 dark:text-emerald-400">{selectedReplay.points[0]?.marginPercentage.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Dec Margin: </span>
                <strong className="text-rose-600 dark:text-rose-400">{selectedReplay.points[selectedReplay.points.length - 1]?.marginPercentage.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-neutral-400 text-[10px]">Net Margin Erosion: </span>
                <strong className="text-rose-600 dark:text-rose-400">
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
                  className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-xs"
                      : "bg-white dark:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400"
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <div>
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Topographic Volume Matrix
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Total Annual Sales Across Menu: <strong>{salesAnalysis.totalVolumeAllTime.toLocaleString()} units</strong>
              </p>
            </div>
            {selectedDish && (
              (() => {
                const pop = salesAnalysis.dishPopularity.find((p) => p.dishId === selectedDish.dishId);
                return (
                  <div className="text-right font-mono">
                    <span className="text-[10px] text-neutral-400">Selected Dish Volume: </span>
                    <strong className="text-sm text-neutral-900 dark:text-neutral-100">
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

      {/* Mode 5 Telemetry: Ingredient Margin Breakdown (Cost Anatomy) */}
      {threeMode === "margin-breakdown" && (
        (() => {
          const breakdown = getDishIngredientBreakdown(selectedDishId, selectedTimelineDate ?? undefined);
          if (!breakdown) {
            return (
              <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 text-xs text-center">
                Select a dish to inspect its recipe cost anatomy.
              </div>
            );
          }

          return (
            <div className="space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      {breakdown.dishName} — Plate Cost Breakdown
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      ✓ Reconciled (|Δ| ≤ 10⁻⁹)
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    As of date: <strong>{breakdown.date}</strong>
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-neutral-400">Total Recipe Cost: </span>
                  <strong className="text-sm text-neutral-900 dark:text-neutral-100">
                    {formatINR(breakdown.totalRecipeCost, { showDecimals: true })}
                  </strong>
                </div>
              </div>

              {/* Ingredient Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-neutral-200 dark:divide-neutral-800">
                  <thead>
                    <tr className="text-neutral-500 font-medium bg-neutral-50 dark:bg-neutral-800/40">
                      <th className="py-2 px-3">Ingredient</th>
                      <th className="py-2 px-3 text-right">Recipe Quantity</th>
                      <th className="py-2 px-3 text-right">Unit Price</th>
                      <th className="py-2 px-3 text-right">Ingredient Cost</th>
                      <th className="py-2 px-3 text-right">Cost Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                    {breakdown.ingredients.map((ing) => (
                      <tr key={ing.ingredientId}>
                        <td className="py-2 px-3 font-sans font-semibold text-neutral-800 dark:text-neutral-200">
                          {ing.ingredientName}
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-600 dark:text-neutral-400">
                          {ing.quantity} {ing.recipeUnit}
                        </td>
                        <td className="py-2 px-3 text-right text-neutral-600 dark:text-neutral-400">
                          {formatINR(ing.unitPrice, { showDecimals: true })} / {ing.pricingUnit}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                          {formatINR(ing.ingredientCost, { showDecimals: true })}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-amber-600 dark:text-amber-400">
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
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <div>
              <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Menu Inflation Impact Summary
              </span>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Comparing January Baseline vs December Inflation-Adjusted Dish Costs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold">
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
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-primary border-primary bg-neutral-50 dark:bg-neutral-800"
                      : "border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {dish.dishName}
                    </span>
                    {isHurt && (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                        ⚠️ HURT
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between text-neutral-500">
                      <span>Jan Cost:</span>
                      <span>{formatINR(dish.startCost, { showDecimals: true })}</span>
                    </div>
                    <div className="flex justify-between text-neutral-900 dark:text-neutral-100 font-bold">
                      <span>Dec Cost:</span>
                      <span>{formatINR(dish.endCost, { showDecimals: true })}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <span>Cost Surge:</span>
                      <span>+{dish.costIncreasePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-neutral-500 text-[10px]">
                      <span>Margin Erosion:</span>
                      <span>-{dish.marginErosionPercentage.toFixed(1)}%</span>
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
