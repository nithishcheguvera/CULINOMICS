"use client";

import React from "react";
import { VisualizationAction } from "@/ai/tools/actionSchema";
import { useAppStore } from "@/store/useAppStore";
import { dispatchVisualizationAction } from "./actionDispatcher";

interface VisualizationActionPillProps {
  action: VisualizationAction;
}

export function VisualizationActionPill({ action }: VisualizationActionPillProps) {
  const store = useAppStore();

  const handleClick = () => {
    dispatchVisualizationAction(action, store);
  };

  const getActionIcon = () => {
    switch (action.actionType) {
      case "SET_ACTIVE_TAB":
        return "📊";
      case "SET_SELECTED_DISH":
        return "🍽️";
      case "SET_THREE_MODE":
        return "🧊";
      case "SET_TIMELINE_DATE":
        return "📅";
    }
  };

  return (
    <button
      data-testid="visualization-action-pill"
      onClick={handleClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
    >
      <span>{getActionIcon()}</span>
      <span>{action.label}</span>
      <svg className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
