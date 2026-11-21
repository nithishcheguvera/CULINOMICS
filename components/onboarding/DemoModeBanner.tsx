"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";

export function DemoModeBanner() {
  const hookState = useAppStore();
  const store = typeof window === "undefined" || process.env.NODE_ENV === "test" ? useAppStore.getState() : hookState;
  const { isDemoMode, exitDemoMode, resetDemoScenario } = store;

  if (!isDemoMode) return null;

  return (
    <div
      data-testid="demo-mode-banner"
      className="bg-emerald-950/90 border-b border-emerald-500/50 text-emerald-100 px-4 py-2 text-xs select-none backdrop-blur-md sticky top-16 z-20 shadow-md shadow-emerald-950/50 animate-in slide-in-from-top-2 duration-200"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500 text-neutral-950 uppercase tracking-wider shadow-sm">
            Demo Sandbox Active
          </span>
          <p className="text-neutral-200 text-xs">
            Exploring <strong>CULINOMICS</strong> illustrative demo data. All edits, Menu Surgery tweaks, and forecasts run in memory and do not alter real records.
          </p>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={resetDemoScenario}
            className="px-2.5 py-1 rounded bg-forest-elevated hover:bg-forest-border text-emerald-300 border border-emerald-700/60 font-medium transition-colors cursor-pointer text-[11px]"
          >
            Reset Scenario
          </button>
          <button
            onClick={exitDemoMode}
            className="px-3 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-700 font-semibold transition-colors cursor-pointer text-[11px] flex items-center gap-1"
          >
            <span>Exit Demo</span>
            <span>✕</span>
          </button>
        </div>
      </div>
    </div>
  );
}
