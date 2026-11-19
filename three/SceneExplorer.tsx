"use client";

import React from "react";
import { SceneErrorBoundary } from "./SceneErrorBoundary";
import { SceneCanvas } from "./SceneCanvas";
import { ThreeModeSelector } from "./components/ThreeModeSelector";
import { ThreeAuthoritativeTelemetry } from "./components/ThreeAuthoritativeTelemetry";

export function SceneExplorer() {
  return (
    <section aria-label="3D Financial Intelligence Explorer" className="space-y-3">
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
