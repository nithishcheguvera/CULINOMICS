"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function GuideMenuPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hookState = useAppStore();
  const store = typeof window === "undefined" || process.env.NODE_ENV === "test" ? useAppStore.getState() : hookState;
  const {
    startTour,
    setIsOnboardingModalOpen,
    isDemoMode,
    enterDemoMode,
    exitDemoMode,
    replayVideoIntro,
  } = store;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleStartTour = () => {
    setIsOpen(false);
    startTour();
  };

  const handleOpenOnboarding = () => {
    setIsOpen(false);
    setIsOnboardingModalOpen(true);
  };

  const handleToggleDemo = () => {
    setIsOpen(false);
    if (isDemoMode) {
      exitDemoMode();
    } else {
      enterDemoMode();
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="guide-menu-button"
        aria-label="Open Guide & Tour menu"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-forest-elevated hover:bg-forest-border border border-forest-border text-neutral-200 transition-colors shadow-sm select-none cursor-pointer"
      >
        <span>🎓</span>
        <span className="hidden sm:inline">Guide & Tour</span>
        <span className="text-[10px] text-neutral-400">▼</span>
      </button>

      {isOpen && (
        <div
          data-testid="guide-menu-dropdown"
          className="absolute right-0 mt-2 w-56 rounded-xl forest-card border border-forest-border shadow-2xl bg-forest-elevated/95 backdrop-blur-md p-2 z-50 text-xs text-neutral-200 space-y-1 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-forest-border/60">
            Interactive Help & Tour
          </div>

          <button
            onClick={handleStartTour}
            data-testid="menu-start-tour"
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-forest-border/50 transition-colors flex items-center space-x-2 text-white font-medium cursor-pointer"
          >
            <span>🧭</span>
            <span>Start Guided Tour (12 Steps)</span>
          </button>

          <button
            onClick={() => {
              setIsOpen(false);
              replayVideoIntro();
            }}
            data-testid="menu-replay-intro"
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-forest-border/50 transition-colors flex items-center space-x-2 text-amber-300 font-medium cursor-pointer"
          >
            <span>🎬</span>
            <span>Watch Opening Video Intro</span>
          </button>

          <button
            onClick={handleOpenOnboarding}
            data-testid="menu-open-welcome"
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-forest-border/50 transition-colors flex items-center space-x-2 text-neutral-300 font-medium cursor-pointer"
          >
            <span>📖</span>
            <span>Platform Overview Modal</span>
          </button>

          <button
            onClick={handleToggleDemo}
            data-testid="menu-toggle-demo"
            className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-forest-border/50 transition-colors flex items-center space-x-2 text-emerald-300 font-medium cursor-pointer"
          >
            <span>🍝</span>
            <span>{isDemoMode ? "Exit Demo Sandbox" : "Enter Demo Mode"}</span>
          </button>

          <div className="pt-1.5 border-t border-forest-border/50 px-2.5 pb-1 text-[10px] text-neutral-400 font-mono">
            Navigation: <kbd className="text-neutral-300 font-bold">←</kbd> <kbd className="text-neutral-300 font-bold">→</kbd> <kbd className="text-neutral-300 font-bold">Esc</kbd>
          </div>
        </div>
      )}
    </div>
  );
}
