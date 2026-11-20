"use client";

import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { ForecastScenario } from "@/engine";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  payload: {
    monthLabel: string;
    isForecast: boolean;
    revenue: number;
    cost: number;
    grossProfit: number;
    marginPercentage: number;
    upperBound?: number;
    lowerBound?: number;
  };
}

function ForecastTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-forest-surface border border-forest-border p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
      <div className="flex items-center justify-between border-b border-forest-border pb-1 mb-1">
        <span className="font-bold text-white">{data.monthLabel}</span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            data.isForecast
              ? "bg-amber-950/80 text-amber-300 border border-amber-700/60"
              : "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
          }`}
        >
          {data.isForecast ? "Projected" : "Historical"}
        </span>
      </div>

      <div className="space-y-1 text-neutral-300">
        <div className="flex justify-between">
          <span className="text-neutral-400">Revenue:</span>
          <span className="font-semibold text-white">{formatINR(data.revenue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Ingredient Cost:</span>
          <span className="font-semibold text-red-300">{formatINR(data.cost)}</span>
        </div>
        <div className="flex justify-between border-t border-forest-border/40 pt-1">
          <span className="text-neutral-400">Gross Contribution:</span>
          <span className="font-bold text-emerald-400">{formatINR(data.grossProfit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Margin:</span>
          <span className="font-bold text-white">{data.marginPercentage.toFixed(1)}%</span>
        </div>
        {data.isForecast && data.lowerBound !== undefined && data.upperBound !== undefined && (
          <div className="border-t border-forest-border/40 pt-1 text-[10px] text-neutral-400">
            <span>80% CI: </span>
            <span className="text-neutral-300 font-mono">
              {formatINR(data.lowerBound)} – {formatINR(data.upperBound)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProfitForecastSection() {
  const hookState = useAppStore();
  const store = typeof window === "undefined" ? useAppStore.getState() : hookState;
  const {
    forecastHorizon,
    setForecastHorizon,
    forecastScenario,
    setForecastScenario,
    getProfitForecast,
  } = store;

  const forecast = getProfitForecast();

  if (!forecast) {
    return (
      <div className="forest-card rounded-2xl p-8 border border-forest-border text-center text-neutral-400">
        <p>Awaiting monthly performance records to compute linear trend forecast...</p>
      </div>
    );
  }

  const activeScenarioResult = forecast.scenarios[forecastScenario];

  // Combine historical and active scenario points for time-series visualization
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const historicalChartPoints = forecast.historicalPoints.map((pt, idx) => ({
    date: pt.date,
    monthLabel: MONTH_NAMES[idx] ? `${MONTH_NAMES[idx]} 2025` : pt.date,
    isForecast: false,
    revenue: pt.revenue,
    cost: pt.ingredientCost,
    grossProfit: pt.grossProfit,
    marginPercentage: pt.grossMarginPercentage,
    upperBound: pt.revenue,
    lowerBound: pt.revenue,
  }));

  const forecastChartPoints = activeScenarioResult.forecastPoints.map((pt) => ({
    date: pt.date,
    monthLabel: pt.monthLabel,
    isForecast: true,
    revenue: pt.projectedRevenue,
    cost: pt.projectedIngredientCost,
    grossProfit: pt.projectedGrossProfit,
    marginPercentage: pt.projectedGrossMarginPercentage,
    upperBound: pt.confidenceInterval.revenueUpper,
    lowerBound: pt.confidenceInterval.revenueLower,
  }));

  const chartData = [...historicalChartPoints, ...forecastChartPoints];

  return (
    <section aria-label="Deterministic Profit Forecast" className="space-y-6">
      {/* Header and Controls */}
      <div className="forest-card rounded-2xl p-5 border border-forest-border space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">📈</span>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Deterministic Profit Forecast (OLS Linear Trend)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Ordinary Least Squares (OLS) econometric regression with 80% prediction confidence intervals over 12-month historical runway
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Horizon Selector */}
            <div className="flex items-center bg-forest-elevated rounded-lg p-1 border border-forest-border text-xs">
              <button
                onClick={() => setForecastHorizon(3)}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  forecastHorizon === 3
                    ? "bg-emerald-500 text-neutral-950 font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                3-Month Horizon
              </button>
              <button
                onClick={() => setForecastHorizon(6)}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  forecastHorizon === 6
                    ? "bg-emerald-500 text-neutral-950 font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                6-Month Horizon
              </button>
            </div>

            {/* Scenario Buttons */}
            <div className="flex items-center bg-forest-elevated rounded-lg p-1 border border-forest-border text-xs">
              {(["baseline", "conservative", "optimistic"] as ForecastScenario[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setForecastScenario(s)}
                  className={`px-3 py-1.5 rounded capitalize font-medium transition-colors ${
                    forecastScenario === s
                      ? s === "conservative"
                        ? "bg-amber-500 text-neutral-950 font-bold"
                        : s === "optimistic"
                        ? "bg-blue-500 text-neutral-950 font-bold"
                        : "bg-emerald-500 text-neutral-950 font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scenario Description Banner */}
        <div className="p-3 rounded-xl bg-forest-elevated/70 border border-forest-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                forecastScenario === "conservative"
                  ? "bg-amber-400"
                  : forecastScenario === "optimistic"
                  ? "bg-blue-400"
                  : "bg-emerald-400"
              }`}
            />
            <span className="font-semibold text-white">Active Scenario:</span>
            <span className="text-neutral-300">{activeScenarioResult.description}</span>
          </div>
          <span className="text-[11px] font-mono text-neutral-400">
            Proven Method: Pure TypeScript OLS Regression
          </span>
        </div>
      </div>

      {/* Aggregate KPI Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Projected Total Revenue</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {formatINR(activeScenarioResult.totalProjectedRevenue)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Across {forecastHorizon} upcoming operational months
          </p>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Projected Food Cost (COGS)</p>
          <p className="text-xl sm:text-2xl font-bold text-red-300 mt-1">
            {formatINR(activeScenarioResult.totalProjectedCost)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            {forecastScenario === "conservative" ? "+25% inflation surge modeled" : "Baseline ingredient trajectory"}
          </p>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Projected Gross Contribution</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">
            {formatINR(activeScenarioResult.totalProjectedGrossProfit)}
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Revenue minus direct food costs
          </p>
        </div>

        <div className="forest-card rounded-2xl p-4 border border-forest-border">
          <p className="text-xs text-neutral-400 font-medium">Average Projected Margin</p>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1">
            {activeScenarioResult.averageProjectedMarginPercentage.toFixed(1)}%
          </p>
          <p className="text-[11px] text-neutral-400 mt-1">
            Baseline historical average was 56.4%
          </p>
        </div>
      </div>

      {/* Main Time-Series Forecast Chart */}
      <div className="forest-card rounded-2xl p-5 border border-forest-border space-y-3">
        <div className="flex items-center justify-between border-b border-forest-border/60 pb-3">
          <h3 className="text-sm font-bold tracking-tight text-white uppercase">
            Runway Timeline: 12-Month Actuals + {forecastHorizon}-Month Extrapolation
          </h3>
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1.5 text-neutral-400">
              <span className="w-3 h-0.5 bg-emerald-400"></span>
              <span>Historical Actual</span>
            </span>
            <span className="flex items-center space-x-1.5 text-amber-300">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-400"></span>
              <span>Projected Forecast</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F4D36" opacity={0.4} />
              <XAxis dataKey="monthLabel" stroke="#6ee7b7" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis
                stroke="#6ee7b7"
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ForecastTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }} />

              {/* Confidence Band for projected region */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stroke="transparent"
                fill="#10b981"
                fillOpacity={0.08}
                name="80% Prediction Interval"
              />

              <Line
                type="monotone"
                dataKey="revenue"
                name="Gross Revenue (INR)"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981" }}
              />

              <Line
                type="monotone"
                dataKey="cost"
                name="Ingredient Cost (INR)"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ r: 3, fill: "#f87171" }}
              />

              <Line
                type="monotone"
                dataKey="grossProfit"
                name="Gross Contribution (INR)"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ r: 3, fill: "#fbbf24" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projection Table */}
      <div className="forest-card rounded-2xl p-5 border border-forest-border space-y-3">
        <h3 className="text-sm font-bold tracking-tight text-white uppercase">
          Detailed Monthly Projection Schedule
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-forest-border text-neutral-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Month</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Revenue</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right">Contribution</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-3 text-right">80% Confidence Interval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-border/40 font-mono">
              {activeScenarioResult.forecastPoints.map((pt) => (
                <tr key={pt.date} className="hover:bg-forest-elevated/40 transition-colors">
                  <td className="py-2.5 px-3 text-neutral-300">{pt.date}</td>
                  <td className="py-2.5 px-3 text-white font-sans font-semibold">{pt.monthLabel}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 font-sans">
                      Projected
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                    {formatINR(pt.projectedRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-300 font-semibold">
                    {formatINR(pt.projectedIngredientCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">
                    {formatINR(pt.projectedGrossProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-neutral-200">
                    {pt.projectedGrossMarginPercentage.toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-neutral-400 text-[11px]">
                    {formatINR(pt.confidenceInterval.revenueLower)} – {formatINR(pt.confidenceInterval.revenueUpper)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assumptions & Limitations Callout */}
      <div className="p-4 rounded-xl bg-forest-elevated/60 border border-forest-border text-xs space-y-2 text-neutral-400">
        <div className="flex items-center space-x-2 text-amber-400 font-semibold">
          <span>⚠️</span>
          <span>Forecast Assumptions & Econometric Invariants</span>
        </div>
        <p>
          - <strong>Linear OLS Regression</strong>: Forecast values represent statistical trend extrapolation based on 12 consecutive months of historical actuals.
        </p>
        <p>
          - <strong>No Fabricated Conversions</strong>: Forecast assumes persistent baseline operating capacity without artificial seasonality or marketing conversions.
        </p>
        <p>
          - <strong>Limitations</strong>: Linear extrapolation does not account for sudden macroeconomic disruptions, supplier contract breaks, or radical menu redesigns.
        </p>
      </div>
    </section>
  );
}
