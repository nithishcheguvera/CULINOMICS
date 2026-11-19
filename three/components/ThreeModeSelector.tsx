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
    description: "Kasavana & Smith quadrants scatter: Popularity vs Contribution vs Cash",
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
    label: "Cost Anatomy Tower",
    icon: "🥩",
    description: "Deconstructed ingredient cost shares & plate anatomy for selected dish",
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
    <div className="flex flex-col gap-2">
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
                  ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                  : "bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 border-neutral-700/80 hover:text-white"
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
        <div className="flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg bg-neutral-900/90 border border-neutral-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Timeline:
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
                      ? "bg-white text-neutral-900 font-bold"
                      : "bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700"
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
