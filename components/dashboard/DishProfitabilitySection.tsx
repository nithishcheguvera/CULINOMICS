"use client";

import React from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

export function DishProfitabilitySection() {
  const { dishProfitability, menuEngineering, setSelectedDishId, setActiveTab } = useAppStore();

  if (!dishProfitability || dishProfitability.length === 0) return null;

  const handleSelectDish = (dishId: string) => {
    setSelectedDishId(dishId);
    setActiveTab("replay");
  };

  const getCategoryBadge = (dishId: string) => {
    const dish = menuEngineering?.dishes.find((d) => d.dishId === dishId);
    if (!dish) return null;

    const badgeStyles: Record<MenuEngineeringCategory, { label: string; class: string }> = {
      STAR: { label: "Star", class: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
      PLOWHORSE: { label: "Plowhorse", class: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" },
      PUZZLE: { label: "Puzzle", class: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300" },
      DOG: { label: "Dog", class: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
    };

    const style = badgeStyles[dish.category];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${style.class}`}>
        {style.label}
      </span>
    );
  };

  return (
    <section aria-label="Comparative Dish Profitability Analysis" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Dish Profitability & Unit Economics Comparison
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            Comprehensive financial breakdown of all 8 menu items, ranked by total annual contribution generated
          </p>
        </div>
        <span className="text-xs text-neutral-500 self-start sm:self-auto bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded">
          8 of 8 Dishes Ranked
        </span>
      </div>

      <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-xs sm:text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-left font-medium">
                <th className="py-3 px-3 text-center">Rank</th>
                <th className="py-3 px-3">Dish Details</th>
                <th className="py-3 px-3 text-center">Quadrant</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Avg Unit Cost</th>
                <th className="py-3 px-3 text-right">Contrib / Serving</th>
                <th className="py-3 px-3 text-right">Margin %</th>
                <th className="py-3 px-3 text-right">Annual Vol</th>
                <th className="py-3 px-3 text-right">Annual Contribution</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {dishProfitability.map((dish) => {
                const margin = dish.contributionMarginPercentage;
                return (
                  <tr
                    key={dish.dishId}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors group"
                  >
                    <td className="py-3 px-3 text-center font-bold text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                      #{dish.rankByContribution}
                    </td>
                    <td className="py-3 px-3 font-semibold text-neutral-900 dark:text-neutral-100">
                      <div>{dish.dishName}</div>
                      <span className="text-[11px] font-mono font-normal text-neutral-400">{dish.dishId}</span>
                    </td>
                    <td className="py-3 px-3 text-center">{getCategoryBadge(dish.dishId)}</td>
                    <td className="py-3 px-3 text-right font-mono">{formatINR(dish.unitSellingPrice)}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      {formatINR(dish.unitIngredientCost, { showDecimals: true })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatINR(dish.contributionPerServing, { showDecimals: true })}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="flex items-center justify-end space-x-1.5">
                        <div className="w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${margin >= 65 ? "bg-emerald-500" : margin >= 50 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(margin, 100)}%` }}
                          />
                        </div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-neutral-600 dark:text-neutral-300">
                      {dish.totalVolume.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 dark:text-blue-400">
                      {formatINR(dish.totalContribution)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleSelectDish(dish.dishId)}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-colors"
                      >
                        Replay
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 font-bold bg-neutral-50 dark:bg-neutral-800/70 text-neutral-900 dark:text-neutral-100">
                <td className="py-3 px-3 text-center" colSpan={3}>
                  Total / Portfolio Aggregate
                </td>
                <td className="py-3 px-3 text-right font-mono" colSpan={4}>
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {dishProfitability.reduce((s, d) => s + d.totalVolume, 0).toLocaleString("en-IN")}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                  {formatINR(dishProfitability.reduce((s, d) => s + d.totalContribution, 0))}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-semibold">
                    100% Sourced
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
