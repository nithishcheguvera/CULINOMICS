"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";

export function ComboOptimizerSection() {
  const hookState = useAppStore();
  const store = typeof window === "undefined" ? useAppStore.getState() : hookState;
  const {
    comboDiscountPercentage,
    setComboDiscountPercentage,
    comboCapacity,
    setComboCapacity,
    getComboOptimization,
    setSelectedDishId,
  } = store;

  const optimization = getComboOptimization();

  if (!optimization) {
    return (
      <div className="forest-card rounded-2xl p-8 border border-forest-border text-center text-neutral-400">
        <p>Awaiting menu engineering classifications to generate combo bundle candidates...</p>
      </div>
    );
  }

  const { combos, objectiveValue, totalComboPlatesSold, monthlyPlateBudget, averageComboMarginPercentage, isFeasible, disclaimer } =
    optimization;

  return (
    <section aria-label="Menu Combo Optimizer & Linear Programming Production Planner" className="space-y-6">
      {/* Header & Controls Card */}
      <div className="forest-card rounded-2xl p-5 border border-forest-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">🍱</span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Menu Combo Optimizer & LP Mix Planner
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Deterministic Linear Programming mix solver (<code className="text-emerald-400">javascript-lp-solver</code>) maximizing gross contribution subject to monthly kitchen plate capacity
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 bg-forest-elevated p-3 rounded-xl border border-forest-border">
            {/* Bundle Discount Control */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Bundle Discount:</span>
                <span className="font-bold text-emerald-400">{comboDiscountPercentage}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={comboDiscountPercentage}
                onChange={(e) => setComboDiscountPercentage(Number(e.target.value))}
                className="w-32 sm:w-40 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Kitchen Plate Capacity Control */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-400">Monthly Plate Capacity:</span>
                <span className="font-bold text-white">{comboCapacity.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="5000"
                step="100"
                value={comboCapacity}
                onChange={(e) => setComboCapacity(Number(e.target.value))}
                className="w-32 sm:w-40 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Mandatory Production Capacity Disclaimer */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 flex items-start space-x-2.5">
          <span className="text-base mt-0.5">ℹ️</span>
          <div>
            <span className="font-semibold text-amber-300">Mathematical Feasibility Disclaimer: </span>
            <span>{disclaimer}</span>
          </div>
        </div>
      </div>

      {/* Aggregate Solver Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Optimal Monthly Contribution</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            {formatINR(objectiveValue)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Objective function maximum from bundle mix
          </p>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Capacity Utilization</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {totalComboPlatesSold.toLocaleString()} / {monthlyPlateBudget.toLocaleString()}
          </p>
          <div className="w-full bg-forest-elevated rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalComboPlatesSold / monthlyPlateBudget) * 100)}%` }}
            />
          </div>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Average Combo Gross Margin</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {averageComboMarginPercentage.toFixed(1)}%
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Weighted across recommended quantities
          </p>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Linear Programming Status</p>
          <p className={`text-xl sm:text-2xl font-bold mt-1 ${isFeasible ? "text-emerald-400" : "text-red-400"}`}>
            {isFeasible ? "Optimal • Feasible" : "Infeasible"}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1 font-mono">
            javascript-lp-solver Simplex
          </p>
        </div>
      </div>

      {/* Recommended Combos Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold tracking-tight text-white uppercase">
          Optimized Combo Portfolio ({combos.length} Candidate Bundles)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {combos.map((combo) => (
            <div
              key={combo.comboId}
              className="forest-card rounded-2xl p-5 border border-forest-border flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition-colors"
            >
              {/* Header */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">✨</span>
                    <h4 className="font-bold text-base text-white">{combo.comboName}</h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                      combo.comboType === "TRIO"
                        ? "bg-purple-950/80 text-purple-300 border border-purple-700/60"
                        : "bg-blue-950/80 text-blue-300 border border-blue-700/60"
                    }`}
                  >
                    {combo.comboType}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 italic">{combo.rationale}</p>
              </div>

              {/* Linked Dishes Badges */}
              <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border/60 space-y-2">
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Included Menu Dishes
                </p>
                <div className="space-y-1.5">
                  {combo.dishes.map((dish) => (
                    <button
                      key={dish.dishId}
                      onClick={() => setSelectedDishId(dish.dishId)}
                      className="w-full flex items-center justify-between text-xs p-1.5 rounded-lg bg-forest-surface hover:bg-forest-border/50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-neutral-300 group-hover:text-white font-medium">
                          {dish.dishName}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            dish.category === "STAR"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-700"
                              : dish.category === "PUZZLE"
                              ? "bg-blue-950 text-blue-300 border border-blue-700"
                              : dish.category === "PLOWHORSE"
                              ? "bg-amber-950 text-amber-300 border border-amber-700"
                              : "bg-red-950 text-red-300 border border-red-700"
                          }`}
                        >
                          {dish.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] text-neutral-400 font-mono">
                        <span>Cost: {formatINR(dish.unitIngredientCost)}</span>
                        <span>•</span>
                        <span className="text-white">Price: {formatINR(dish.unitSellingPrice)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pricing & Financial Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-forest-border/60 text-xs">
                <div className="p-2 rounded-lg bg-forest-elevated/40">
                  <p className="text-[10px] text-neutral-400">Regular Menu Price</p>
                  <p className="font-semibold text-neutral-300 line-through">
                    {formatINR(combo.combinedMenuPrice)}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-forest-elevated/40">
                  <p className="text-[10px] text-neutral-400">Bundle Price (-{combo.bundleDiscountPercentage}%)</p>
                  <p className="font-bold text-white">{formatINR(combo.comboSellingPrice)}</p>
                </div>
                <div className="p-2 rounded-lg bg-forest-elevated/40">
                  <p className="text-[10px] text-neutral-400">Unit Food Cost</p>
                  <p className="font-semibold text-red-300">{formatINR(combo.totalIngredientCost)}</p>
                </div>
                <div className="p-2 rounded-lg bg-forest-elevated/40">
                  <p className="text-[10px] text-neutral-400">Unit Contribution</p>
                  <p className="font-bold text-emerald-400">{formatINR(combo.comboContribution)}</p>
                </div>
              </div>

              {/* Recommended Production & Contribution */}
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-300">Recommended Monthly Production: </span>
                  <strong className="text-white font-mono text-sm">
                    {combo.recommendedMonthlyUnits.toLocaleString()} units
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-neutral-400 text-[11px]">Monthly Gross Impact: </span>
                  <span className="font-bold text-emerald-300 font-mono text-sm block">
                    +{formatINR(combo.projectedMonthlyContribution)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
