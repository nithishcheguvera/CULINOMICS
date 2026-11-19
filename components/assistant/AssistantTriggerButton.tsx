"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";

export function AssistantTriggerButton() {
  const { toggleAssistant, isAssistantOpen } = useAppStore();

  return (
    <button
      data-testid="assistant-trigger-button"
      onClick={toggleAssistant}
      aria-label="Toggle AI Decision Assistant"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100 shadow-sm transition-all"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span>AI Assistant</span>
      <span className="text-[10px] px-1 rounded bg-neutral-800 dark:bg-neutral-200 text-neutral-300 dark:text-neutral-700">
        {isAssistantOpen ? "Open" : "Ask"}
      </span>
    </button>
  );
}
