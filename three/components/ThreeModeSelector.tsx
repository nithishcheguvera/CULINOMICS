"use client";

import React from "react";
import { useAppStore, ThreeVisualizationMode } from "@/store/useAppStore";

interface ModeItem {
  id: ThreeVisualizationMode;
  label: string;
  icon: string;
  description: string;
  hasTimeline: boolean;
}

const MODES: ModeItem[] = [
  {
    id: "profitability-landscape",
    label: "Profitability Landscape",
    icon: "📊",
    description: "Kasavana & Smith quadrants: Popularity vs Contribution vs Cash",
    hasTimeline: false,
  },
  {
    id: "ingredient-inflation",
    label: "Ingredient Inflation",
    icon: "📈",
    description: "Multi-series ingredient price surges across monthly timeline",
    hasTimeline: true,
  },
  {
    id: "recipe-replay",
    label: "Recipe Replay Runway",
    icon: "🔄",
    description: "Chronological stacked cost vs contribution evolution for selected dish",
    hasTimeline: true,
  },
  {
    id: "sales-volume",
    label: "Sales Volume Matrix",
    icon: "📦",
    description: "Topographic sales volume grid comparing all dishes across months",
    hasTimeline: true,
  },
  {
    id: "margin-breakdown",
    label: "Financial Breakdown Waterfall",
    icon: "🥩",
    description: "3D waterfall: Selling price, deconstructed ingredients & gross contribution",
    hasTimeline: true,
  },
  {
    id: "inflation-impact",
    label: "Inflation Impact Arena",
    icon: "💥",
    description: "January baseline vs December inflation-adjusted cost surge arena",
    hasTimeline: false,
  },
];

export function ThreeModeSelector() {
  const {
    threeMode,
    setThreeMode,
    timelineDates,
    selectedTimelineDate,
    setSelectedTimelineDate,
  } = useAppStore();

  const currentMode = MODES.find((m) => m.id === threeMode) || MODES[0];

  return (
    <div className="flex flex-col gap-2 select-none">
      {/* 1. Mode Switcher Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {MODES.map((m) => {
          const isActive = threeMode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setThreeMode(m.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isActive
                  ? "bg-emerald-500 text-neutral-950 border-emerald-400 font-bold shadow-sm"
                  : "bg-forest-elevated hover:bg-forest-border text-neutral-300 border-forest-border hover:text-white"
              }`}
              title={m.description}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Optional Timeline Date Scrubber (Only for time-based modes) */}
      {currentMode.hasTimeline && timelineDates.length > 0 && (
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-forest-elevated/80 border border-forest-border text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Mode Runway Date:
            </span>
            <span className="font-mono font-bold text-white">
              {selectedTimelineDate || timelineDates[timelineDates.length - 1]}
            </span>
          </div>

          {/* Quick Month Navigation Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {timelineDates.map((date, idx) => {
              const isSelected = (selectedTimelineDate || timelineDates[timelineDates.length - 1]) === date;
              const shortMonth = `M${String(idx + 1).padStart(2, "0")}`;
              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => setSelectedTimelineDate(date)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-emerald-500 text-neutral-950 font-bold"
                      : "bg-forest-surface text-neutral-400 hover:text-white hover:bg-forest-border"
                  }`}
                  title={date}
                >
                  {shortMonth}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
