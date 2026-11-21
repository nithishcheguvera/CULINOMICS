"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { GoldCoinMark } from "@/components/brand";

export const ONBOARDING_STORAGE_KEY = "culinomics_onboarding_seen";

export function FirstTimeOnboardingModal() {
  const hookState = useAppStore();
  const store = typeof window === "undefined" || process.env.NODE_ENV === "test" ? useAppStore.getState() : hookState;
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    startTour,
    enterDemoMode,
    isVideoIntroOpen,
  } = store;

  useEffect(() => {
    try {
      const hasSeen = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!hasSeen && !isVideoIntroOpen) {
        setIsOnboardingModalOpen(true);
      }
    } catch {
      // LocalStorage access restricted in private browsing mode, safe fallback
    }
  }, [setIsOnboardingModalOpen, isVideoIntroOpen]);

  const markSeenAndClose = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setIsOnboardingModalOpen(false);
  };

  const handleStartTour = () => {
    markSeenAndClose();
    startTour();
  };

  const handleExploreDemo = () => {
    markSeenAndClose();
    enterDemoMode();
  };

  const handleEnterDirectly = () => {
    markSeenAndClose();
  };

  if (!isOnboardingModalOpen) return null;

  return (
    <div
      data-testid="first-time-onboarding-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
    >
      <div className="forest-card rounded-2xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl bg-forest-elevated/95 text-neutral-100 max-w-xl w-full space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <GoldCoinMark size={44} />
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
                Platform Onboarding
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Welcome to CULINOMICS
              </h2>
            </div>
          </div>
          <button
            onClick={handleEnterDirectly}
            className="text-neutral-400 hover:text-white text-sm font-semibold p-1 rounded hover:bg-forest-border/40 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Core Value Proposition */}
        <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
          CULINOMICS is an executive 3D profit cockpit designed to show restaurant owners, executive chefs, and evaluators which dishes make or lose money, how supplier inflation silently erodes unit margins, and what changes to make.
        </p>

        {/* Three Core Data Paradigms */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-forest-surface border border-forest-border/60 space-y-1">
            <div className="text-base">📊</div>
            <h4 className="text-xs font-bold text-white">Historical Actuals</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">
              100% verified POS sales and supplier purchase invoice receipts.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-forest-surface border border-forest-border/60 space-y-1">
            <div className="text-base">📈</div>
            <h4 className="text-xs font-bold text-white">Deterministic Forecast</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">
              OLS linear trends with 80% prediction intervals across 3 scenarios.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-forest-surface border border-forest-border/60 space-y-1">
            <div className="text-base">🔬</div>
            <h4 className="text-xs font-bold text-white">Menu Surgery</h4>
            <p className="text-[11px] text-neutral-400 leading-tight">
              What-if simulations for price, cost, and volume elasticity.
            </p>
          </div>
        </div>

        {/* Action Pathways */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={handleStartTour}
            data-testid="onboarding-start-tour-button"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-950 flex items-center justify-center space-x-2"
          >
            <span>🧭 Start Interactive Tour (12 Steps)</span>
            <span>→</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleExploreDemo}
              data-testid="onboarding-explore-demo-button"
              className="w-full py-2 px-3 rounded-xl bg-forest-surface hover:bg-forest-border text-emerald-300 border border-emerald-600/40 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>🍝 Explore Demo Mode</span>
            </button>

            <button
              onClick={handleEnterDirectly}
              data-testid="onboarding-enter-cockpit-button"
              className="w-full py-2 px-3 rounded-xl border border-forest-border hover:bg-forest-border/40 text-neutral-300 font-semibold text-xs transition-colors flex items-center justify-center"
            >
              <span>Direct to Cockpit</span>
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-1 border-t border-forest-border/40 text-[11px] text-neutral-500 font-mono">
          You can relaunch the Guided Tour or Demo Sandbox at any time from the top bar.
        </div>
      </div>
    </div>
  );
}
