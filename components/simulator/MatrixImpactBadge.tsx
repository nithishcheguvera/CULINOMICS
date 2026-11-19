"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

const CATEGORY_META: Record<
  MenuEngineeringCategory,
  { label: string; icon: string; bg: string; text: string; border: string }
> = {
  STAR: {
    label: "Star",
    icon: "⭐",
    bg: "bg-amber-500/10",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-500/30",
  },
  PLOWHORSE: {
    label: "Plowhorse",
    icon: "🐎",
    bg: "bg-blue-500/10",
    text: "text-blue-800 dark:text-blue-300",
    border: "border-blue-500/30",
  },
  PUZZLE: {
    label: "Puzzle",
    icon: "🧩",
    bg: "bg-purple-500/10",
    text: "text-purple-800 dark:text-purple-300",
    border: "border-purple-500/30",
  },
  DOG: {
    label: "Dog",
    icon: "🐕",
    bg: "bg-rose-500/10",
    text: "text-rose-800 dark:text-rose-300",
    border: "border-rose-500/30",
  },
};

export function MatrixImpactBadge() {
  const { scenarioResult } = useAppStore();

  if (!scenarioResult) return null;

  const { matrixProjection, simulated } = scenarioResult;
  const { baselineCategory, projectedCategory, popularityThreshold, profitabilityThreshold } =
    matrixProjection;
  const shifted = baselineCategory !== projectedCategory;

  const baseMeta = CATEGORY_META[baselineCategory];
  const projMeta = CATEGORY_META[projectedCategory];

  const isProfitable = simulated.contributionPerServing > 0;
  const isAbovePop = simulated.monthlyVolume >= popularityThreshold;
  const isAboveProf = simulated.contributionPerServing >= profitabilityThreshold;

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <span>📊</span> Kasavana & Smith Matrix Projection
        </h4>
        {shifted ? (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-pulse">
            Trajectory Shifted
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
            Quadrant Maintained
          </span>
        )}
      </div>

      {/* Visual quadrant shift flow */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-lg bg-muted/40 border border-border">
        {/* Baseline Quadrant */}
        <div className="flex items-center gap-2.5">
          <div className="text-xs text-muted-foreground flex flex-col">
            <span className="text-[10px] uppercase font-mono tracking-wider">Baseline</span>
            <div className={`mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium text-xs ${baseMeta.bg} ${baseMeta.text} ${baseMeta.border}`}>
              <span>{baseMeta.icon}</span>
              <span>{baseMeta.label}</span>
            </div>
          </div>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center justify-center">
          <span className={`text-lg font-bold ${shifted ? "text-primary" : "text-muted-foreground"}`}>
            ➔
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {shifted ? "PROJECTED" : "UNCHANGED"}
          </span>
        </div>

        {/* Projected Quadrant */}
        <div className="flex items-center gap-2.5">
          <div className="text-xs text-muted-foreground flex flex-col items-end">
            <span className="text-[10px] uppercase font-mono tracking-wider">Projected</span>
            <div className={`mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-bold text-xs ${projMeta.bg} ${projMeta.text} ${projMeta.border}`}>
              <span>{projMeta.icon}</span>
              <span>{projMeta.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold comparison breakdown */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className={`p-2.5 rounded-lg border ${isAbovePop ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-500/5 border-zinc-500/20"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-foreground">Popularity</span>
            <span className={`font-mono text-[11px] font-semibold ${isAbovePop ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {isAbovePop ? "High (≥ Avg)" : "Low (< Avg)"}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {simulated.monthlyVolume} / mo vs {popularityThreshold.toFixed(1)} threshold
          </div>
        </div>

        <div className={`p-2.5 rounded-lg border ${isAboveProf ? "bg-emerald-500/5 border-emerald-500/20" : "bg-zinc-500/5 border-zinc-500/20"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-foreground">Profitability</span>
            <span className={`font-mono text-[11px] font-semibold ${isAboveProf ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
              {isAboveProf ? "High (≥ Avg)" : "Low (< Avg)"}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono">
            {formatINR(simulated.contributionPerServing, { showDecimals: true })} vs {formatINR(profitabilityThreshold, { showDecimals: true })} threshold
          </div>
        </div>
      </div>

      {/* Contextual Guidance */}
      {!isProfitable && (
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Negative Margin Alert:</strong> Cost exceeds selling price. Dish is running at a net loss of {formatINR(Math.abs(simulated.contributionPerServing), { showDecimals: true })} per serving.</span>
        </div>
      )}
      {simulated.sellingPrice === 0 && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
          <span>ℹ️</span>
          <span><strong>Complimentary Serving:</strong> Selling price set to ₹0. Contribution margin percentage is N/A.</span>
        </div>
      )}
    </div>
  );
}
