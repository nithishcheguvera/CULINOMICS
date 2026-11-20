"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "@/store/useAppStore";
import { TOUR_STEPS, TourStep } from "./tourSteps";

export interface GuidedTourProps {
  forceMount?: boolean;
}

export function GuidedTour({ forceMount = false }: GuidedTourProps = {}) {
  const hookState = useAppStore();
  const store = typeof window === "undefined" || process.env.NODE_ENV === "test" ? useAppStore.getState() : hookState;
  const {
    isTourOpen,
    currentTourStep,
    nextTourStep,
    prevTourStep,
    skipTour,
    setActiveTab,
    setSelectedDishId,
    setThreeMode,
    activeTab,
  } = store;

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const step: TourStep | undefined = TOUR_STEPS[currentTourStep];

  // Synchronize state requirements for active step
  useEffect(() => {
    if (!isTourOpen || !step) return;

    if (step.requiredTab && activeTab !== step.requiredTab) {
      setActiveTab(step.requiredTab);
    }
    if (step.requiredDishId) {
      setSelectedDishId(step.requiredDishId);
    }
    if (step.requiredThreeMode) {
      setThreeMode(step.requiredThreeMode);
    }
  }, [isTourOpen, step, activeTab, setActiveTab, setSelectedDishId, setThreeMode]);

  // Locate target and compute bounding box with smooth retry
  const updateTargetRect = useCallback(() => {
    if (!step) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isTourOpen) return;

    // Small delay to allow any tab switch to mount DOM element
    const timer = setTimeout(() => {
      updateTargetRect();
    }, 150);

    const handleResizeOrScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateTargetRect);
    };

    window.addEventListener("resize", handleResizeOrScroll);
    window.addEventListener("scroll", handleResizeOrScroll, true);

    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, true);
    };
  }, [isTourOpen, currentTourStep, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isTourOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        skipTour();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        nextTourStep();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevTourStep();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTourOpen, nextTourStep, prevTourStep, skipTour]);

  const isMounted = forceMount || mounted;
  if (!isMounted || !isTourOpen || !step) return null;

  const isLastStep = currentTourStep >= TOUR_STEPS.length - 1;
  const isFirstStep = currentTourStep === 0;

  // Responsive Tooltip Placement calculation
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  let tooltipStyle: React.CSSProperties = {};
  if (!isMobile && targetRect) {
    const pad = 12;
    const cardWidth = 380;
    const cardHeight = 220;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    let top = targetRect.bottom + pad;
    let left = targetRect.left;

    if (step.preferredPlacement === "top" && targetRect.top > cardHeight + pad) {
      top = targetRect.top - cardHeight - pad;
    } else if (step.preferredPlacement === "bottom" && targetRect.bottom + cardHeight + pad < viewHeight) {
      top = targetRect.bottom + pad;
    } else if (step.preferredPlacement === "right" && targetRect.right + cardWidth + pad < viewWidth) {
      top = Math.max(pad, targetRect.top);
      left = targetRect.right + pad;
    } else if (step.preferredPlacement === "left" && targetRect.left > cardWidth + pad) {
      top = Math.max(pad, targetRect.top);
      left = targetRect.left - cardWidth - pad;
    }

    // Viewport edge collision clamp
    left = Math.max(pad, Math.min(left, viewWidth - cardWidth - pad));
    top = Math.max(pad, Math.min(top, viewHeight - cardHeight - pad));

    tooltipStyle = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${cardWidth}px`,
      zIndex: 9999,
    };
  } else if (isMobile) {
    tooltipStyle = {
      position: "fixed",
      bottom: "16px",
      left: "16px",
      right: "16px",
      zIndex: 9999,
    };
  } else {
    // Target element missing fallback: center modal
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "90%",
      maxWidth: "420px",
      zIndex: 9999,
    };
  }

  const tourMarkup = (
    <div className="fixed inset-0 z-[9990] overflow-hidden select-none" data-testid="guided-tour-overlay">
      {/* SVG Backdrop Cutout Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" aria-hidden="true">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White reveals full dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out spotlight for target element */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="12"
                ry="12"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 10, 7, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Target Element Spotlight Halo Border */}
      {targetRect && (
        <div
          className="fixed pointer-events-none rounded-xl border-2 border-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.45)] transition-all duration-300 ease-out z-[9995]"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Floating Tour Guide Card */}
      <div
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
        className="forest-card rounded-2xl p-5 border border-emerald-500/50 shadow-2xl bg-forest-elevated/95 backdrop-blur-xl text-neutral-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200"
      >
        <div>
          {/* Header Bar: Step Pips & Skip Button */}
          <div className="flex items-center justify-between pb-3 border-b border-forest-border/60 mb-3">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-emerald-400 font-mono tracking-wider uppercase">
                {`Step ${step.stepNumber} of ${step.totalSteps}`}
              </span>
              <div className="flex items-center space-x-1 ml-2">
                {TOUR_STEPS.map((s, idx) => (
                  <span
                    key={s.id}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === currentTourStep
                        ? "w-4 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        : idx < currentTourStep
                        ? "w-1.5 bg-emerald-700"
                        : "w-1.5 bg-neutral-700"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={skipTour}
              aria-label="Skip tour"
              className="text-neutral-400 hover:text-white text-xs font-semibold px-2 py-0.5 rounded hover:bg-forest-border/40 transition-colors"
            >
              Skip ✕
            </button>
          </div>

          {/* Title & Explanation */}
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mb-2 flex items-center gap-2">
            <span>🧭</span>
            <span>{step.title}</span>
          </h3>
          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
            {step.explanation}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-forest-border/50 text-xs">
          <div className="text-[11px] text-neutral-400 font-mono hidden sm:block">
            Use <kbd className="px-1.5 py-0.5 rounded bg-forest-black border border-neutral-700 text-neutral-300">←</kbd> <kbd className="px-1.5 py-0.5 rounded bg-forest-black border border-neutral-700 text-neutral-300">→</kbd> keys
          </div>

          <div className="flex items-center space-x-2 ml-auto">
            {!isFirstStep && (
              <button
                onClick={prevTourStep}
                className="px-3 py-1.5 rounded-lg border border-forest-border hover:bg-forest-border/40 text-neutral-300 font-medium transition-colors"
              >
                Back
              </button>
            )}

            <button
              onClick={nextTourStep}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold transition-all shadow-md shadow-emerald-950 flex items-center space-x-1"
            >
              <span>{isLastStep ? step.actionLabel || "Finish" : "Next"}</span>
              {!isLastStep && <span>→</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (forceMount || typeof window === "undefined") {
    return tourMarkup;
  }

  return createPortal(tourMarkup, document.body);
}
