"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AssistantMessageItem } from "./AssistantMessageItem";
import { SuggestedQuestions } from "./SuggestedQuestions";

export function AssistantDrawer() {
  const {
    isAssistantOpen,
    setIsAssistantOpen,
    assistantMessages,
    isAssistantLoading,
    assistantError,
    sendAssistantMessage,
    clearAssistantHistory,
  } = useAppStore();

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [assistantMessages, isAssistantOpen, isAssistantLoading]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAssistantOpen) {
        setIsAssistantOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAssistantOpen, setIsAssistantOpen]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isAssistantLoading) return;
    setInput("");
    sendAssistantMessage(trimmed);
  };

  const handleSelectQuestion = (q: string) => {
    sendAssistantMessage(q);
  };

  if (!isAssistantOpen) return null;

  return (
    <div
      data-testid="assistant-drawer-container"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        data-testid="assistant-backdrop"
        onClick={() => setIsAssistantOpen(false)}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <aside
        data-testid="assistant-drawer"
        className="fixed inset-y-0 right-0 max-w-full flex pl-10"
      >
        <div className="w-screen max-w-lg bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold text-sm shadow-sm">
                AI
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Decision Assistant
                </h2>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Verified Engine Analytics & Strategic Guidance
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {assistantMessages.length > 0 && (
                <button
                  data-testid="clear-chat-button"
                  onClick={clearAssistantHistory}
                  title="Clear conversation"
                  className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs"
                >
                  Clear
                </button>
              )}
              <button
                data-testid="close-drawer-button"
                onClick={() => setIsAssistantOpen(false)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {assistantMessages.length === 0 ? (
              <div className="py-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-2xl flex items-center justify-center mx-auto shadow-inner">
                  💬
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Ask About Restaurant Financials
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto mt-1">
                    Query overall profitability, trace margin erosion on specific dishes, or audit ingredient inflation spikes.
                  </p>
                </div>
                <div className="pt-2">
                  <SuggestedQuestions onSelectQuestion={handleSelectQuestion} />
                </div>
              </div>
            ) : (
              <>
                {assistantMessages.map((msg) => (
                  <AssistantMessageItem key={msg.id} message={msg} />
                ))}
              </>
            )}

            {/* Loading Indicator */}
            {isAssistantLoading && (
              <div data-testid="assistant-loading-indicator" className="flex items-center gap-2 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/60 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-700 dark:border-t-white rounded-full animate-spin"></div>
                <span>Executing deterministic engine tools & synthesizing advice...</span>
              </div>
            )}

            {/* Error Message */}
            {assistantError && (
              <div data-testid="assistant-error-alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
                <strong>Error:</strong> {assistantError}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Footer (when history is active) */}
          {assistantMessages.length > 0 && !isAssistantLoading && (
            <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
              <SuggestedQuestions onSelectQuestion={handleSelectQuestion} />
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center gap-2"
          >
            <input
              data-testid="assistant-input-field"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about profitability, inflation, or recipes..."
              disabled={isAssistantLoading}
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-neutral-100 dark:bg-neutral-800 border-none focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white text-neutral-900 dark:text-white placeholder-neutral-400"
            />
            <button
              data-testid="assistant-send-button"
              type="submit"
              disabled={!input.trim() || isAssistantLoading}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-sm"
            >
              Send
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
