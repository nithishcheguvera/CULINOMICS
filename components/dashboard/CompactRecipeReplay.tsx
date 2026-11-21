"use client";

import React, { useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { useAppStore, formatINR } from "@/store/useAppStore";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface CompactTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload?: {
      month: string;
      date: string;
      sellingPrice: number;
      recipeCost: number;
      contributionMargin: number;
      marginPercentage: number;
    };
  }>;
  label?: string;
}

function CompactTooltip({ active, payload, label }: CompactTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;

  return (
    <div className="bg-forest-surface/95 border border-forest-border p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 min-w-[210px] select-none">
      <div className="flex items-center justify-between border-b border-forest-border/60 pb-1.5 mb-1.5">
        <span className="font-bold text-white text-xs">{label} 2025</span>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
          Margin {p.marginPercentage}%
        </span>
      </div>
      <div className="flex justify-between items-center text-neutral-300">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Selling Price:</span>
        </span>
        <span className="font-mono font-semibold text-white">
          {formatINR(p.sellingPrice)}
        </span>
      </div>
      <div className="flex justify-between items-center text-neutral-300">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Recipe Cost:</span>
        </span>
        <span className="font-mono font-semibold text-amber-300">
          {formatINR(p.recipeCost, { showDecimals: true })}
        </span>
      </div>
      <div className="flex justify-between items-center text-neutral-300">
        <span className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>Gross Margin:</span>
        </span>
        <span className="font-mono font-semibold text-blue-300">
          {formatINR(p.contributionMargin, { showDecimals: true })}
        </span>
      </div>
    </div>
  );
}

export function CompactRecipeReplay() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const {
    recipeReplay,
    inflationImpact,
    selectedDishId,
    setSelectedDishId,
    selectedTimelineDate,
    setSelectedTimelineDate,
    timelineDates,
    isPlaying,
    togglePlay,
    stepTimeline,
  } = state;

  // Reliable Playback Timer Lifecycle Management
  // Cleanup guaranteed on pause, component unmount, and relevant state changes.
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      const { timelineDates: dates, selectedTimelineDate: cur, stepTimeline: step, setIsPlaying } =
        useAppStore.getState();
      if (!dates || dates.length === 0) {
        setIsPlaying(false);
        return;
      }
      const current = cur || dates[dates.length - 1];
      const idx = dates.indexOf(current);

      if (idx >= 0 && idx < dates.length - 1) {
        step("next");
      } else {
        // MANDATORY INVARIANT 1: Playback must stop at December 2025. Do not automatically wrap.
        setIsPlaying(false);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [isPlaying]);

  if (!recipeReplay || recipeReplay.length === 0) return null;

  const currentReplay =
    recipeReplay.find((r) => r.dishId === selectedDishId) || recipeReplay[0];
  const currentImpact = inflationImpact.find(
    (i) => i.dishId === currentReplay.dishId
  );

  const activeDate =
    selectedTimelineDate ||
    (timelineDates.length > 0
      ? timelineDates[timelineDates.length - 1]
      : "2025-12-01");
  const activeMonthIndex =
    timelineDates.indexOf(activeDate) !== -1
      ? timelineDates.indexOf(activeDate)
      : currentReplay.points.length - 1;
  const activeMonthName = MONTH_NAMES[activeMonthIndex] || "Dec";

  const activePoint =
    currentReplay.points.find((p) => p.date === activeDate) ||
    currentReplay.points[activeMonthIndex] ||
    currentReplay.points[currentReplay.points.length - 1];

  const chartData = currentReplay.points.map((pt, idx) => ({
    month: MONTH_NAMES[idx] || pt.date.substring(5, 7),
    date: pt.date,
    sellingPrice: pt.sellingPrice,
    recipeCost: Number(pt.recipeCost.toFixed(2)),
    contributionMargin: Number(pt.contributionPerServing.toFixed(2)),
    marginPercentage: Number(pt.marginPercentage.toFixed(1)),
  }));

  return (
    <section
      id="compact-recipe-replay"
      aria-label="Recipe Replay Time Intelligence Runway"
      className="forest-card rounded-2xl p-4 sm:p-5 border border-forest-border space-y-4"
    >
      {/* Top Header & Active Dish / Timeline State */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-forest-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <span className="text-base">🔄</span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase">
              Recipe Replay™ Runway
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              12-Month Time Intelligence
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            margin % as ingredient prices rise • Simulate monthly dish profitability erosion across 2025
          </p>
        </div>

        {/* Status Pills: Sinking, Selected, Healthy (Screen Record 2) */}
        <div className="flex items-center flex-wrap gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-semibold border border-red-500/70 text-red-400 bg-red-950/40">
            Sinking
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold border border-amber-400 text-amber-300 bg-amber-950/40">
            Selected
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/70 text-emerald-300 bg-emerald-950/40">
            Healthy
          </span>

          {/* Active Month Beacon */}
          <div className="px-2.5 py-1 rounded-lg bg-forest-elevated border border-emerald-500/30 text-emerald-300 font-mono text-xs flex items-center space-x-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Timeline: <strong>{activeMonthName} 2025</strong>
            </span>
          </div>

          {/* Inflation Hurt Indicator */}
          {currentImpact?.isInflationHurt ? (
            <div className="px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-600/50 text-amber-300 text-xs font-mono flex items-center space-x-1.5 shadow-sm">
              <span>⚠️</span>
              <span>
                Cost Surge +{currentImpact.costIncreasePercentage.toFixed(1)}%
              </span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-600/50 text-emerald-300 text-xs font-mono flex items-center space-x-1.5 shadow-sm">
              <span>✓</span>
              <span>Margin Resilient</span>
            </div>
          )}
        </div>
      </div>

      {/* Focus Dish Fast Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-neutral-400 whitespace-nowrap">
          Focus Dish:
        </span>
        {recipeReplay.map((dish) => {
          const isSelected = dish.dishId === currentReplay.dishId;
          const impact = inflationImpact.find((i) => i.dishId === dish.dishId);
          const isHurt = impact?.isInflationHurt;

          return (
            <button
              key={dish.dishId}
              type="button"
              onClick={() => setSelectedDishId(dish.dishId)}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all select-none cursor-pointer ${isSelected
                ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                : "bg-forest-elevated/70 border border-forest-border text-neutral-400 hover:text-white hover:border-forest-border/80"
                }`}
            >
              <span>{dish.dishName}</span>
              {isHurt && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-amber-950" : "bg-amber-400"
                    }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Recharts Historical Trajectory Chart */}
      <div className="w-full h-56 sm:h-64 rounded-xl bg-forest-elevated/40 border border-forest-border/60 p-2 sm:p-3 relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 16, left: 0, bottom: 4 }}
            onClick={(e) => {
              if (e && e.activePayload && e.activePayload[0]) {
                const clickedDate = e.activePayload[0].payload.date;
                if (clickedDate) {
                  setSelectedTimelineDate(clickedDate);
                }
              }
            }}
          >
            <CartesianGrid stroke="#1C362A" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#6B7280"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickLine={{ stroke: "#374151" }}
            />
            <YAxis
              stroke="#6B7280"
              tick={{ fill: "#9CA3AF", fontSize: 11 }}
              tickLine={{ stroke: "#374151" }}
              tickFormatter={(v) => `₹${v}`}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CompactTooltip />} />
            <ReferenceLine
              x={activeMonthName}
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            {/* Selling Price - Emerald Dashed */}
            <Line
              type="monotone"
              dataKey="sellingPrice"
              name="Selling Price"
              stroke="#10B981"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
            {/* Recipe Cost - Amber Solid */}
            <Line
              type="monotone"
              dataKey="recipeCost"
              name="Recipe Cost"
              stroke="#F59E0B"
              strokeWidth={2.5}
              activeDot={{ r: 6, fill: "#F59E0B", stroke: "#FFF" }}
              dot={{ r: 3, fill: "#F59E0B" }}
            />
            {/* Contribution Margin - Cyan/Blue Solid */}
            <Line
              type="monotone"
              dataKey="contributionMargin"
              name="Gross Margin"
              stroke="#38BDF8"
              strokeWidth={2}
              activeDot={{ r: 5, fill: "#38BDF8", stroke: "#FFF" }}
              dot={{ r: 2.5, fill: "#38BDF8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Live Financial Metrics Strip for Active Month */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-forest-elevated/60 border border-forest-border flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">Selling Price</span>
          <span className="text-sm font-bold font-mono text-white mt-1">
            {formatINR(activePoint.sellingPrice)}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-forest-elevated/60 border border-forest-border flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">
            Recipe Cost ({activeMonthName})
          </span>
          <span className="text-sm font-bold font-mono text-amber-300 mt-1">
            {formatINR(activePoint.recipeCost, { showDecimals: true })}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-forest-elevated/60 border border-forest-border flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">
            Gross Margin ({activeMonthName})
          </span>
          <span className="text-sm font-bold font-mono text-emerald-300 mt-1">
            {formatINR(activePoint.contributionPerServing, { showDecimals: true })} ({activePoint.marginPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-forest-elevated/60 border border-forest-border flex flex-col justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">Annual Surge (Jan→Dec)</span>
          <span
            className={`text-sm font-bold font-mono mt-1 ${currentImpact && currentImpact.costIncreasePercentage > 0
              ? "text-amber-400"
              : "text-emerald-400"
              }`}
          >
            {currentImpact
              ? `+${formatINR(currentImpact.costIncreaseAbsolute, {
                showDecimals: true,
              })} (+${currentImpact.costIncreasePercentage.toFixed(1)}%)`
              : "—"}
          </span>
        </div>
      </div>

      {/* Playback Controls & Interactive 12-Month Runway Rail */}
      <div className="pt-2 border-t border-forest-border/60 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Playback Transport Buttons */}
          <div className="flex items-center space-x-2">
            {/* Play / Pause Toggle Button */}
            <button
              type="button"
              aria-label={isPlaying ? "Pause timeline playback" : "Play timeline playback"}
              onClick={togglePlay}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none ${isPlaying
                ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-950 border border-amber-300"
                : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 shadow-emerald-950 border border-emerald-300"
                }`}
            >
              <span>{isPlaying ? "⏸" : "▶"}</span>
              <span>{isPlaying ? "Pause" : "Play 2025 Runway"}</span>
            </button>

            {/* Rewind to Jan */}
            <button
              type="button"
              aria-label="Rewind to January 2025"
              onClick={() => {
                if (timelineDates.length > 0) {
                  setSelectedTimelineDate(timelineDates[0]);
                }
              }}
              title="Rewind to January 2025"
              className="px-2.5 py-1.5 rounded-lg bg-forest-elevated border border-forest-border text-neutral-300 hover:text-white hover:border-emerald-600/60 text-xs font-mono transition-colors select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              ⏮ Jan
            </button>

            {/* Step Prev */}
            <button
              type="button"
              aria-label="Previous Month"
              onClick={() => stepTimeline("prev")}
              disabled={activeMonthIndex === 0}
              title="Previous Month"
              className="px-2.5 py-1.5 rounded-lg bg-forest-elevated border border-forest-border text-neutral-300 hover:text-white hover:border-emerald-600/60 text-xs font-mono transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              ◀ Prev
            </button>

            {/* Step Next (stops at Dec) */}
            <button
              type="button"
              aria-label="Next Month (Stops at December 2025)"
              onClick={() => stepTimeline("next")}
              disabled={activeMonthIndex >= timelineDates.length - 1}
              title="Next Month (Stops at December 2025)"
              className="px-2.5 py-1.5 rounded-lg bg-forest-elevated border border-forest-border text-neutral-300 hover:text-white hover:border-emerald-600/60 text-xs font-mono transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              Next ▶
            </button>

            {/* Jump to Dec */}
            <button
              type="button"
              aria-label="Jump to December 2025"
              onClick={() => {
                if (timelineDates.length > 0) {
                  setSelectedTimelineDate(timelineDates[timelineDates.length - 1]);
                }
              }}
              title="Jump to December 2025"
              className="px-2.5 py-1.5 rounded-lg bg-forest-elevated border border-forest-border text-neutral-300 hover:text-white hover:border-emerald-600/60 text-xs font-mono transition-colors select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              Dec ⏭
            </button>
          </div>

          <div className="text-[11px] font-mono text-neutral-400 flex items-center space-x-1.5 self-end sm:self-center">
            <span>Cadence: 1.0s / mo</span>
            <span>•</span>
            <span className="text-emerald-400">Boundary: Dec 2025 Stop</span>
          </div>
        </div>

        {/* 12-Month Interactive Scrubbing Rail */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 sm:gap-1.5">
          {timelineDates.map((date, idx) => {
            const isSelected = date === activeDate;
            const isPastOrCurrent = idx <= activeMonthIndex;
            const monthName = MONTH_NAMES[idx] || date;

            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedTimelineDate(date)}
                title={`Set timeline to ${monthName} 2025`}
                className={`group flex flex-col items-center justify-center py-1.5 sm:py-2 px-1 rounded-lg border text-center transition-all select-none cursor-pointer ${isSelected
                  ? "bg-emerald-500 border-emerald-400 text-neutral-950 font-bold shadow-md shadow-emerald-950 scale-[1.02] z-10"
                  : isPastOrCurrent
                    ? "bg-forest-elevated/70 border-emerald-900/60 text-emerald-300/80 hover:bg-forest-elevated hover:text-white hover:border-emerald-700/80"
                    : "bg-forest-elevated/30 border-forest-border/40 text-neutral-500 hover:bg-forest-elevated/60 hover:text-neutral-300"
                  }`}
              >
                <span className="text-[10px] sm:text-xs font-semibold tracking-tight leading-tight">
                  {monthName}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 transition-all ${isSelected
                    ? "bg-neutral-950 animate-pulse"
                    : isPastOrCurrent
                      ? "bg-emerald-400/80"
                      : "bg-neutral-700"
                    }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
