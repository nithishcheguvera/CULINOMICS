"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { AuthoritativeFactCard } from "@/components/assistant/AuthoritativeFactCard";
import { VisualizationActionPill } from "@/components/assistant/VisualizationActionPill";

export function CockpitAiCopilot() {
  const store = useAppStore();
  const state = typeof window === "undefined" ? useAppStore.getState() : store;

  const {
    dataset,
    dishProfitability,
    selectedDishId,
    selectedTimelineDate,
    activeScenario,
    scenarioResult,
    assistantMessages,
    isAssistantLoading,
    assistantError,
    sendAssistantMessage,
    clearAssistantHistory,
  } = state;

  const [inputQuery, setInputQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [assistantMessages, isAssistantLoading]);

  // Resolve active dish display name from dishProfitability or dataset menu
  const activeDishProf = dishProfitability?.find((d) => d.dishId === selectedDishId);
  const activeMenuDish = dataset?.menu?.find((m) => m.id === selectedDishId);
  const dishName = activeDishProf?.dishName || activeMenuDish?.name || "Selected Dish";
  const dishBasePrice = activeDishProf?.unitSellingPrice || activeMenuDish?.basePrice || 0;

  // Resolve timeline date display
  const monthLabel = selectedTimelineDate
    ? new Date(selectedTimelineDate).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })
    : "Dec 2025";

  // Check if active scenario is modified from baseline
  const isScenarioModified =
    activeScenario &&
    (activeScenario.targetSellingPrice !== dishBasePrice ||
      (scenarioResult && scenarioResult.simulated.monthlyVolume !== scenarioResult.baseline.monthlyVolume));

  // Dynamic suggested prompts grounded in active context
  const suggestionPrompts = [
    {
      icon: "💡",
      label: `Why did ${dishName} margin erode in ${monthLabel}?`,
      prompt: `Explain why ${dishName} contribution margin eroded in ${monthLabel} and identify the key ingredient inflation drivers.`,
    },
    {
      icon: "🔬",
      label: `What if I increase ${dishName} price by 10%?`,
      prompt: `What if I increase the selling price of ${dishName} by 10%? Simulate the impact on contribution and margin.`,
    },
    {
      icon: "🥩",
      label: `Top ingredient cost drivers for ${dishName}`,
      prompt: `Deconstruct the recipe cost breakdown for ${dishName} on ${selectedTimelineDate || "2025-12-01"} and show the largest ingredient cost drivers.`,
    },
    {
      icon: "⭐",
      label: `How can I promote ${dishName} to a Star?`,
      prompt: `According to the Menu Engineering Matrix, what specific pricing or cost surgery is required to move ${dishName} into the Star quadrant?`,
    },
    {
      icon: "📊",
      label: `Executive restaurant financial summary`,
      prompt: `Provide an executive summary of total restaurant revenue, direct food costs, gross contribution, and overall margin.`,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isAssistantLoading) return;
    setInputQuery("");
    await sendAssistantMessage(query);
  };

  const handlePromptClick = async (prompt: string) => {
    if (isAssistantLoading) return;
    await sendAssistantMessage(prompt);
  };

  return (
    <div
      id="cockpit-ai-copilot"
      data-testid="cockpit-ai-copilot"
      className="forest-card rounded-2xl border border-forest-border p-4 sm:p-5 flex flex-col space-y-4 shadow-xl"
    >
      {/* Copilot Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-forest-border/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 text-base shadow-sm">
            🤖
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase">
                AI Profit Copilot
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-800/70">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Engine Verified
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Context-Aware Decision Intelligence • Zero Fabricated Numbers
            </p>
          </div>
        </div>

        {/* Live Context Indicators & Reset Button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Active Dish Context Pill */}
          <div
            data-testid="copilot-context-dish"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-[11px] font-mono text-neutral-300"
            title={`Active Dish: ${dishName}`}
          >
            <span>🍽️</span>
            <span className="text-neutral-400">Dish:</span>
            <strong className="text-white truncate max-w-[120px]">{dishName}</strong>
          </div>

          {/* Active Month Context Pill */}
          <div
            data-testid="copilot-context-timeline"
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-[11px] font-mono text-neutral-300"
            title={`Active Timeline Month: ${selectedTimelineDate || "2025-12-01"}`}
          >
            <span>📅</span>
            <span className="text-neutral-400">Timeline:</span>
            <strong className="text-white">{monthLabel}</strong>
          </div>

          {/* Active Scenario Context Pill */}
          <div
            data-testid="copilot-context-scenario"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
              isScenarioModified
                ? "bg-amber-950/40 border-amber-600/50 text-amber-200"
                : "bg-forest-elevated border-forest-border text-neutral-400"
            }`}
            title="Menu Surgery Simulation Context"
          >
            <span>🔬</span>
            <span>Scenario:</span>
            <strong className={isScenarioModified ? "text-amber-300" : "text-neutral-300"}>
              {isScenarioModified ? `₹${activeScenario?.targetSellingPrice}` : "Baseline"}
            </strong>
          </div>

          {/* Clear Chat History */}
          {assistantMessages.length > 0 && (
            <button
              onClick={clearAssistantHistory}
              title="Clear Copilot history"
              className="p-1.5 rounded-lg bg-forest-elevated border border-forest-border text-neutral-400 hover:text-white hover:border-red-700/60 transition-colors text-xs"
            >
              🧹 Clear
            </button>
          )}
        </div>
      </div>

      {/* Suggested Prompt Chips (Quick Actions) */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Suggested Decision Inquiries:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {suggestionPrompts.map((item, idx) => (
            <button
              key={idx}
              data-testid={`copilot-suggestion-${idx}`}
              onClick={() => handlePromptClick(item.prompt)}
              disabled={isAssistantLoading}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-forest-elevated/80 border border-forest-border hover:border-emerald-500/50 text-neutral-300 hover:text-white text-xs transition-all hover:bg-forest-elevated disabled:opacity-50 text-left"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div
        data-testid="copilot-messages-container"
        className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-forest-border rounded-xl bg-forest-black/50 p-3 border border-forest-border/40"
      >
        {assistantMessages.length === 0 ? (
          <div className="h-full py-8 text-center space-y-2 text-neutral-400">
            <div className="w-10 h-10 mx-auto rounded-full bg-forest-elevated border border-emerald-500/30 flex items-center justify-center text-lg text-emerald-400">
              💡
            </div>
            <p className="text-xs sm:text-sm font-medium text-neutral-200">
              Ask anything about restaurant margins, recipe inflation, or Menu Surgery scenarios.
            </p>
            <p className="text-[11px] text-neutral-500 max-w-md mx-auto">
              Every numeric answer is computed by the deterministic TypeScript engine and backed by verified facts.
            </p>
          </div>
        ) : (
          assistantMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                data-testid={`copilot-message-${msg.id}`}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm space-y-2 shadow-sm ${
                    isUser
                      ? "bg-emerald-950/70 border border-emerald-700/60 text-emerald-100 rounded-tr-sm"
                      : "bg-forest-elevated border border-forest-border text-neutral-100 rounded-tl-sm"
                  }`}
                >
                  {/* Message Meta Badge */}
                  <div className="flex items-center justify-between text-[10px] text-neutral-400 border-b border-forest-border/40 pb-1 mb-1">
                    <span className="font-semibold uppercase tracking-wider">
                      {isUser ? "You" : "AI Copilot"}
                    </span>
                    {!isUser && msg.mode && (
                      <span className="font-mono text-emerald-400 text-[9px] bg-emerald-950/60 px-1 py-0.2 rounded border border-emerald-800/40">
                        {msg.mode === "gemini" ? "Gemini 2.5 + Tools" : "Deterministic Fallback"}
                      </span>
                    )}
                  </div>

                  {/* Message Body Text */}
                  <div className="whitespace-pre-wrap leading-relaxed text-neutral-200">
                    {msg.content}
                  </div>

                  {/* Authoritative Verified Facts Grid */}
                  {msg.authoritativeFacts && msg.authoritativeFacts.length > 0 && (
                    <div className="pt-2 border-t border-forest-border/50 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold">
                        <span>Engine Authoritative Facts ({msg.authoritativeFacts.length}):</span>
                        <span className="text-[10px] text-emerald-400 font-mono">100% Deterministic</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {msg.authoritativeFacts.map((fact) => (
                          <AuthoritativeFactCard key={fact.id} fact={fact} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Visualization Action Pill */}
                  {msg.visualizationAction && (
                    <div className="pt-2 border-t border-forest-border/50">
                      <VisualizationActionPill action={msg.visualizationAction} />
                    </div>
                  )}

                  {/* Warnings if any */}
                  {msg.warnings && msg.warnings.length > 0 && (
                    <div className="pt-1 text-[10px] text-amber-300 font-mono">
                      {msg.warnings.map((w, i) => (
                        <p key={i}>⚠️ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Spinner Indicator */}
        {isAssistantLoading && (
          <div
            data-testid="copilot-loading"
            className="flex items-center space-x-2 p-3 rounded-2xl bg-forest-elevated/70 border border-forest-border text-neutral-300 text-xs w-fit"
          >
            <div className="w-3.5 h-3.5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin"></div>
            <span>Evaluating engine metrics & verifying facts...</span>
          </div>
        )}

        {/* Assistant Error Alert */}
        {assistantError && (
          <div
            data-testid="copilot-error"
            className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs space-y-1"
          >
            <div className="flex items-center space-x-1.5 font-bold">
              <span>⚠️</span>
              <span>Copilot Engine Error</span>
            </div>
            <p className="font-mono text-[11px] text-red-300">{assistantError}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form & Action Bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          data-testid="copilot-input"
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask about ${dishName} margins, inflation, or 'what-if' scenarios...`}
          disabled={isAssistantLoading}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-forest-elevated border border-forest-border focus:border-emerald-500 focus:outline-none text-xs sm:text-sm text-white placeholder-neutral-500 transition-colors"
        />
        <button
          data-testid="copilot-send-btn"
          type="submit"
          disabled={isAssistantLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-neutral-950 font-bold text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md cursor-pointer select-none active:scale-95"
        >
          <span>Send</span>
          <span>↵</span>
        </button>
      </form>
    </div>
  );
}
