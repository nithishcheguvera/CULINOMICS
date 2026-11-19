"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { ScenarioControls } from "./ScenarioControls";
import { MatrixImpactBadge } from "./MatrixImpactBadge";
import { ScenarioComparisonCard } from "./ScenarioComparisonCard";

export function MenuSurgerySection() {
  const {
    dishProfitability,
    menuEngineering,
    selectedDishId,
    setScenarioDish,
    activeScenario,
    resetScenario,
  } = useAppStore();

  if (dishProfitability.length === 0) {
    return (
      <div className="p-8 text-center bg-card border rounded-xl">
        <p className="text-muted-foreground">Loading restaurant dataset for simulation...</p>
      </div>
    );
  }

  // Get quadrant metadata for dish dropdown
  const getDishCategory = (id: string) => {
    const dish = menuEngineering?.dishes.find((d) => d.dishId === id);
    return dish?.category || "STAR";
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "STAR":
        return "⭐";
      case "PLOWHORSE":
        return "🐎";
      case "PUZZLE":
        return "🧩";
      case "DOG":
        return "🐕";
      default:
        return "🍽️";
    }
  };

  const currentDish = dishProfitability.find((d) => d.dishId === (activeScenario?.dishId || selectedDishId));

  return (
    <div className="space-y-6">
      {/* 1. Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary text-xl">🔬</span>
            Menu Surgery Simulator
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate price adjustments, ingredient cost inflation/reduction, and volume shifts with real-time Kasavana & Smith matrix reclassification.
          </p>
        </div>

        {/* Global Reset and Active Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetScenario}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>↺</span> Reset Active Scenario
          </button>
        </div>
      </div>

      {/* 2. Safety & Immutability Disclaimer */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
        <span className="text-base shrink-0">🛡️</span>
        <div className="space-y-0.5">
          <p className="font-semibold uppercase tracking-wider text-[11px]">
            In-Memory Scenario Simulation Mode — Baseline Immutable
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            All adjustments made in this simulator are evaluated dynamically in-memory and <strong>DO NOT</strong> modify your verified sales records, recipe files, or historical baseline financial reports.
          </p>
        </div>
      </div>

      {/* 3. Dish Selection Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label htmlFor="dish-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            Target Dish:
          </label>
          <div className="relative flex-1 max-w-md">
            <select
              id="dish-select"
              value={activeScenario?.dishId || selectedDishId}
              onChange={(e) => setScenarioDish(e.target.value)}
              className="w-full px-3 py-2 pr-8 text-sm font-medium rounded-lg border border-input bg-background text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {dishProfitability.map((dish) => {
                const cat = getDishCategory(dish.dishId);
                const icon = getCategoryIcon(cat);
                return (
                  <option key={dish.dishId} value={dish.dishId}>
                    {icon} {dish.dishName} — {cat} ({formatINR(dish.unitSellingPrice)})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {currentDish && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">Category: <strong className="text-foreground">{getDishCategory(currentDish.dishId)}</strong></span>
            <span>•</span>
            <span className="font-mono">Baseline Margin: <strong className="text-foreground">{currentDish.contributionMarginPercentage.toFixed(1)}%</strong></span>
          </div>
        )}
      </div>

      {/* 4. Interactive Simulation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Levers & Matrix Classification */}
        <div className="lg:col-span-5 space-y-6">
          <ScenarioControls />
          <MatrixImpactBadge />
        </div>

        {/* Right Column: Comparative Economics & Portfolio Impact */}
        <div className="lg:col-span-7 space-y-6">
          <ScenarioComparisonCard />
        </div>
      </div>
    </div>
  );
}
