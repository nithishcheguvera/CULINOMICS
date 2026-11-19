"use client";

import React from "react";
import { AssistantChatMessage } from "@/store/useAppStore";
import { AuthoritativeFactCard } from "./AuthoritativeFactCard";
import { VisualizationActionPill } from "./VisualizationActionPill";

interface AssistantMessageItemProps {
  message: AssistantChatMessage;
}

export function AssistantMessageItem({ message }: AssistantMessageItemProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-sm font-medium shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const isGemini = message.mode === "gemini";

  return (
    <div className="flex justify-start mb-6 space-y-3 flex-col max-w-full">
      {/* Mode Badge & Assistant Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-[10px]">
          AI
        </div>
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Decision Assistant
        </span>
        <span
          data-testid="mode-badge"
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
            isGemini
              ? "bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300"
              : "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300"
          }`}
        >
          {isGemini ? "Gemini 2.5" : "Deterministic Engine Fallback"}
        </span>
      </div>

      {/* Assistant Explanation Prose */}
      <div className="rounded-2xl rounded-tl-sm p-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm shadow-sm space-y-2 whitespace-pre-line leading-relaxed">
        {message.content}
      </div>

      {/* Authoritative Fact Cards Grid */}
      {message.authoritativeFacts && message.authoritativeFacts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Verified Engine Facts ({message.authoritativeFacts.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.authoritativeFacts.map((fact) => (
              <AuthoritativeFactCard key={fact.id} fact={fact} />
            ))}
          </div>
        </div>
      )}

      {/* Action Pill */}
      {message.visualizationAction && (
        <div className="pt-1">
          <VisualizationActionPill action={message.visualizationAction} />
        </div>
      )}

      {/* Heuristic Warnings */}
      {message.warnings && message.warnings.length > 0 && (
        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
          {message.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span>⚠️</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
