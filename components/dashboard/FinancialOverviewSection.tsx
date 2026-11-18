"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAppStore, formatINR } from "@/store/useAppStore";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface RechartsTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: RechartsTooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-lg shadow-lg text-xs space-y-1">
      <p className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">{label} 2025</p>
      {payload.map((item, index) => {
        const isPercent = item.name.includes("%") || item.name.includes("Margin");
        const formattedValue = isPercent
          ? `${Number(item.value).toFixed(2)}%`
          : formatINR(Number(item.value));
        return (
          <div key={index} className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5 text-neutral-600 dark:text-neutral-400">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              <span>{item.name}:</span>
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formattedValue}</span>
          </div>
        );
      })}
    </div>
  );
}

export function FinancialOverviewSection() {
  const { monthlyPerformance } = useAppStore();

  if (!monthlyPerformance || monthlyPerformance.length === 0) return null;

  const chartData = monthlyPerformance.map((m, idx) => ({
    month: MONTH_NAMES[idx] || m.date,
    date: m.date,
    revenue: m.revenue,
    ingredientCost: m.ingredientCost,
    grossContribution: m.grossProfit,
    marginPercentage: Number(m.grossMarginPercentage.toFixed(2)),
  }));

  return (
    <section aria-label="Monthly Financial Performance Overview" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Monthly Financial Trends & Margin Erosion
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            12-month chronological performance tracking stable monthly revenue (₹10.38L) against rising ingredient costs
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-600 dark:text-neutral-300">
            Jan Margin: <strong className="text-emerald-600 dark:text-emerald-400">{monthlyPerformance[0].grossMarginPercentage.toFixed(1)}%</strong>
          </span>
          <span className="text-neutral-400">→</span>
          <span className="px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800 font-medium text-neutral-600 dark:text-neutral-300">
            Dec Margin: <strong className="text-amber-600 dark:text-amber-400">{monthlyPerformance[11].grossMarginPercentage.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* 12-Month Dual Axis Composed Chart */}
      <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
          Revenue, Ingredient Cost & Gross Margin Trajectory (2025)
        </h3>
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`}
                domain={[0, 1200000]}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(val) => `${val}%`}
                domain={[40, 80]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "12px" }} />
              <Bar yAxisId="left" dataKey="revenue" name="Total Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar yAxisId="left" dataKey="ingredientCost" name="Ingredient Cost" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar yAxisId="left" dataKey="grossContribution" name="Gross Contribution" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="marginPercentage"
                name="Contribution Margin %"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: "#ef4444" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            Monthly Performance Ledger (Deterministic Engine Data)
          </h3>
          <span className="text-xs text-neutral-500">12 Monthly Snapshots</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-xs sm:text-sm">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-left font-medium">
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">Ingredient Cost</th>
                <th className="py-2.5 px-3 text-right">Gross Contribution</th>
                <th className="py-2.5 px-3 text-right">Contribution Margin %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
              {monthlyPerformance.map((row, idx) => {
                const margin = row.grossMarginPercentage;
                const isEroded = margin < 60;
                return (
                  <tr key={row.date} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-neutral-900 dark:text-neutral-100">
                      {MONTH_NAMES[idx]} 2025
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatINR(row.revenue)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-700 dark:text-amber-400">
                      {formatINR(row.ingredientCost)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-blue-700 dark:text-blue-400 font-semibold">
                      {formatINR(row.grossProfit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">
                      <span className={margin >= 65 ? "text-emerald-600" : margin >= 60 ? "text-amber-600" : "text-rose-600"}>
                        {margin.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${
                          isEroded
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}
                      >
                        {isEroded ? "High Inflation" : "Healthy"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-neutral-300 dark:border-neutral-700 font-bold bg-neutral-50 dark:bg-neutral-800/70 text-neutral-900 dark:text-neutral-100">
                <td className="py-3 px-3">Annual Total</td>
                <td className="py-3 px-3 text-right font-mono">
                  {formatINR(monthlyPerformance.reduce((s, r) => s + r.revenue, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400">
                  {formatINR(monthlyPerformance.reduce((s, r) => s + r.ingredientCost, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono text-blue-600 dark:text-blue-400">
                  {formatINR(monthlyPerformance.reduce((s, r) => s + r.grossProfit, 0))}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  {(
                    ((monthlyPerformance.reduce((s, r) => s + r.grossProfit, 0)) /
                      (monthlyPerformance.reduce((s, r) => s + r.revenue, 0))) *
                    100
                  ).toFixed(2)}%
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-xs font-semibold">
                    Reconciled
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
