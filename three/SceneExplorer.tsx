"use client";

import React from "react";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { SceneCanvas } from "./SceneCanvas";
import { ThreeModeSelector } from "./components/ThreeModeSelector";
import { ThreeAuthoritativeTelemetry } from "./components/ThreeAuthoritativeTelemetry";

export function SceneExplorer() {
  return (
    <section aria-label="3D Financial Intelligence Explorer" className="space-y-4">
      {/* Title & Cockpit Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">🧊</span>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              3D Financial Intelligence Explorer
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              Multi-Mode Cockpit
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            Interactive client-side React Three Fiber cockpit with 6 financial exploration modes synchronized with 2D analytics
          </p>
        </div>
      </div>

      {/* Mode Selector & Timeline Scrubber */}
      <ThreeModeSelector />

      {/* 3D Scene Canvas Viewport */}
      <SceneErrorBoundary>
        <SceneCanvas />
      </SceneErrorBoundary>

      {/* Authoritative 2D Telemetry Panel */}
      <ThreeAuthoritativeTelemetry />
    </section>
  );
}
