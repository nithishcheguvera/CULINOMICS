"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { IngredientCostContribution } from "@/engine";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ReplayTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface ReplayTooltipProps {
  active?: boolean;
  payload?: ReplayTooltipPayloadItem[];
  label?: string;
}

function ReplayTooltip({ active, payload, label }: ReplayTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-lg text-xs space-y-1">
      <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{label} 2025</p>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center justify-between space-x-4">
          <span className="flex items-center space-x-1.5 text-neutral-600 dark:text-neutral-400">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name}:</span>
          </span>
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            {formatINR(Number(item.value), { showDecimals: true })}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RecipeReplaySection() {
  const { recipeReplay, inflationImpact, selectedDishId, setSelectedDishId } = useAppStore();

  if (!recipeReplay || recipeReplay.length === 0) return null;

  const currentReplay = recipeReplay.find((r) => r.dishId === selectedDishId) || recipeReplay[0];
  const currentImpact = inflationImpact.find((i) => i.dishId === currentReplay.dishId);

  const chartData = currentReplay.points.map((pt, idx) => ({
    month: MONTH_NAMES[idx] || pt.date,
    date: pt.date,
    sellingPrice: pt.sellingPrice,
    recipeCost: Number(pt.recipeCost.toFixed(2)),
    contributionMargin: Number(pt.contributionPerServing.toFixed(2)),
  }));

  return (
    <section aria-label="Recipe Replay Inflation Timeline" className="space-y-6">
      {/* Header and Dish Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🔄</span>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Recipe Replay™ — Historical Inflation Time Series
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Simulate 12-month dish profitability erosion under historical ingredient price inflation
          </p>
        </div>

        {/* Dish Selector Dropdown */}
        <div className="flex items-center space-x-2">
          <label htmlFor="dish-select" className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
            Selected Dish:
          </label>
          <select
            id="dish-select"
            value={currentReplay.dishId}
            onChange={(e) => setSelectedDishId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm font-medium focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white outline-none cursor-pointer"
          >
            {recipeReplay.map((dish) => (
              <option key={dish.dishId} value={dish.dishId}>
                {dish.dishName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dish Selector Pills for 1-Click Fast Switching */}
      <div className="flex flex-wrap gap-2">
        {recipeReplay.map((dish) => {
          const isSelected = dish.dishId === currentReplay.dishId;
          const impact = inflationImpact.find((i) => i.dishId === dish.dishId);
          const isHurt = impact?.isInflationHurt;

          return (
            <button
              key={dish.dishId}
              onClick={() => setSelectedDishId(dish.dishId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-sm"
                  : "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-400"
              }`}
            >
              <span>{dish.dishName}</span>
              {isHurt && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                    isSelected ? "bg-rose-500 text-white" : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                  }`}
                >
                  +{impact.costIncreasePercentage.toFixed(0)}% Cost
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected Dish KPI Callouts */}
      {currentImpact && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Selling Price (Fixed)</span>
            <div className="text-xl font-bold mt-1 text-neutral-900 dark:text-neutral-100">
              {formatINR(currentReplay.points[0].sellingPrice)}
            </div>
            <span className="text-[11px] text-neutral-400">Stable throughout 2025</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Recipe Cost Surge</span>
            <div className="text-xl font-bold mt-1 text-amber-600 dark:text-amber-400 flex items-baseline space-x-1">
              <span>{formatINR(currentImpact.startCost, { showDecimals: true })}</span>
              <span className="text-xs text-neutral-400 font-normal">→</span>
              <span>{formatINR(currentImpact.endCost, { showDecimals: true })}</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              +{currentImpact.costIncreasePercentage.toFixed(1)}% (+{formatINR(currentImpact.costIncreaseAbsolute, { showDecimals: true })})
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Margin Erosion</span>
            <div className="text-xl font-bold mt-1 text-rose-600 dark:text-rose-400 flex items-baseline space-x-1">
              <span>{formatINR(currentImpact.startMargin, { showDecimals: true })}</span>
              <span className="text-xs text-neutral-400 font-normal">→</span>
              <span>{formatINR(currentImpact.endMargin, { showDecimals: true })}</span>
            </div>
            <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              -{formatINR(currentImpact.marginErosionAbsolute, { showDecimals: true })} / serving
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Inflation Severity</span>
            <div className="mt-1">
              {currentImpact.isInflationHurt ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  ⚠️ Severe Margin Erosion
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  ✓ Resilient Margin
                </span>
              )}
            </div>
            <span className="text-[11px] text-neutral-400 block mt-1">
              {currentImpact.isInflationHurt ? "Cost surged >50%" : "Stable ingredient basket"}
            </span>
          </div>
        </div>
      )}

      {/* 12-Month Recipe Cost vs Selling Price vs Contribution Margin Line Chart */}
      <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-4">
          12-Month Chronological Trajectory: {currentReplay.dishName}
        </h3>
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(val) => `₹${val}`}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<ReplayTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
              <ReferenceLine
                y={chartData[0].sellingPrice}
                stroke="#10b981"
                strokeDasharray="4 4"
                label={{ value: "Selling Price", position: "top", fill: "#10b981", fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="sellingPrice"
                name="Selling Price (₹)"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="recipeCost"
                name="Recipe Cost (₹)"
                stroke="#f59e0b"
                strokeWidth={3}
                dot={{ r: 4, fill: "#f59e0b" }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="contributionMargin"
                name="Contribution Margin (₹)"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#3b82f6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ingredient-Level Cost Drivers Breakdown Table */}
      {currentImpact && (
        <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                Ingredient Cost Drivers Breakdown (Jan → Dec 2025)
              </h3>
              <p className="text-xs text-neutral-500">
                Exact ingredient-by-ingredient contribution to the ₹{currentImpact.costIncreaseAbsolute.toFixed(2)} total recipe cost surge
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              {currentImpact.ingredientDrivers.length} Recipe Ingredients
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-xs sm:text-sm">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-left font-medium">
                  <th className="py-2.5 px-3">Ingredient</th>
                  <th className="py-2.5 px-3 text-right">Recipe Qty</th>
                  <th className="py-2.5 px-3 text-right">Jan Price</th>
                  <th className="py-2.5 px-3 text-right">Dec Price</th>
                  <th className="py-2.5 px-3 text-right">Price Surge</th>
                  <th className="py-2.5 px-3 text-right">Cost Impact / Serving</th>
                  <th className="py-2.5 px-3 text-right">% Share of Surge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                {currentImpact.ingredientDrivers.map((driver: IngredientCostContribution, index: number) => {
                  const isTopDriver = index === 0 && driver.shareOfDishCostIncreasePercentage > 40;
                  return (
                    <tr
                      key={driver.ingredientId}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors ${
                        isTopDriver ? "bg-amber-50/50 dark:bg-amber-950/20 font-semibold" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
                        {isTopDriver && <span className="text-amber-500">★</span>}
                        <span>{driver.ingredientName}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-500">
                        {driver.quantity} {driver.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {formatINR(driver.startIngredientPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                        {formatINR(driver.endIngredientPrice, { showDecimals: true })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium">
                        <span className={driver.costComponentIncreasePercentage > 50 ? "text-rose-600 font-bold" : "text-neutral-600 dark:text-neutral-400"}>
                          +{driver.costComponentIncreasePercentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                        +{formatINR(driver.costComponentIncreaseAbsolute, { showDecimals: true })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        <div className="flex items-center justify-end space-x-1.5">
                          <div className="w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-rose-500"
                              style={{ width: `${Math.min(driver.shareOfDishCostIncreasePercentage, 100)}%` }}
                            />
                          </div>
                          <span className="font-semibold">{driver.shareOfDishCostIncreasePercentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
