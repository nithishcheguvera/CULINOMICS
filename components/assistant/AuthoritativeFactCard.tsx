"use client";

import React from "react";
import { AuthoritativeFact } from "@/ai/tools/factFactory";

interface AuthoritativeFactCardProps {
  fact: AuthoritativeFact;
}

export function AuthoritativeFactCard({ fact }: AuthoritativeFactCardProps) {
  const isSimulated = fact.sourceTool === "simulateMenuSurgeryScenario";

  return (
    <div
      data-testid={`fact-card-${fact.id}`}
      className={`p-3 rounded-lg border shadow-sm transition-all text-xs space-y-1.5 ${
        isSimulated
          ? "bg-amber-950/20 dark:bg-amber-950/30 border-amber-500/40"
          : "bg-neutral-50 dark:bg-neutral-800/80 border-emerald-500/30 dark:border-emerald-500/20"
      }`}
    >
      {/* Header with Entity & Verification Badge */}
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
          {fact.entityName}
        </span>
        {isSimulated ? (
          <span
            data-testid="verification-badge"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60 flex-shrink-0"
          >
            <span>🔬</span>
            SIMULATED
          </span>
        ) : (
          <span
            data-testid="verification-badge"
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 flex-shrink-0"
          >
            <svg className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            VERIFIED ACTUAL
          </span>
        )}
      </div>

      {/* Metric Label & Prominent Value */}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-neutral-500 dark:text-neutral-400 font-medium">{fact.label}</span>
        <span className={`font-bold text-sm ${isSimulated ? "text-amber-400" : "text-neutral-900 dark:text-white"}`}>
          {fact.formattedValue}
        </span>
      </div>

      {/* Provenance Metadata Footer */}
      <div className="pt-1.5 border-t border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500">
        <span title={`Engine Function: ${fact.sourceFunction}`}>
          Engine: <strong className="font-mono text-neutral-600 dark:text-neutral-300">{fact.sourceFunction}</strong>
        </span>
        <span className="capitalize">{isSimulated ? "Scenario" : fact.timeframe}</span>
      </div>
    </div>
  );
}
