"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { SceneContent } from "./SceneContent";
import { useAppStore } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

export function SceneCanvas() {
  const { selectedDishId, setSelectedDishId, menuEngineering, setActiveTab } = useAppStore();

  const selectedDish = menuEngineering?.dishes.find((d) => d.dishId === selectedDishId);

  const categoryBadges: Record<MenuEngineeringCategory, { label: string; class: string }> = {
    STAR: { label: "Star", class: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
    PLOWHORSE: { label: "Plowhorse", class: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
    PUZZLE: { label: "Puzzle", class: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
    DOG: { label: "Dog", class: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  };

  return (
    <div className="relative w-full h-[clamp(340px,46vh,520px)] min-h-[340px] rounded-2xl overflow-hidden bg-[#06100C] border border-forest-border shadow-md flex flex-col">
      {/* 3D Canvas Viewport */}
      <div className="flex-1 w-full h-full">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [5, 4.5, 6.5], fov: 45 }}
          gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
          className="w-full h-full"
        >
          <Suspense fallback={null}>
            <SceneContent />
          </Suspense>
        </Canvas>
      </div>

      {/* Top HUD Overlay: Active Selection & Engine Telemetry */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none select-none z-10">
        {selectedDish ? (
          <div className="bg-forest-surface/90 backdrop-blur border border-forest-border px-3.5 py-2 rounded-xl shadow-lg pointer-events-auto flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-white tracking-wide truncate max-w-[140px] sm:max-w-none">
                  {selectedDish.dishName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    categoryBadges[selectedDish.category]?.class || ""
                  }`}
                >
                  {categoryBadges[selectedDish.category]?.label || selectedDish.category}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                Vol: <strong>{selectedDish.averageMonthlyVolume}</strong>/mo • Contrib: <strong>₹{selectedDish.averageContributionMargin.toFixed(2)}</strong>
              </p>
            </div>
            <div className="flex items-center space-x-1.5">
              <select
                id="three-dish-select"
                aria-label="Select dish in 3D Explorer"
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg bg-forest-elevated text-neutral-200 border border-forest-border focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {menuEngineering?.dishes.map((d) => (
                  <option key={d.dishId} value={d.dishId} className="bg-neutral-900 text-white">
                    {d.dishName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setActiveTab("simulator")}
                className="text-xs font-medium px-2 py-1 rounded-lg bg-forest-elevated hover:bg-forest-border text-emerald-400 border border-forest-border transition-colors whitespace-nowrap cursor-pointer"
              >
                Simulate 🔬
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-forest-surface/80 backdrop-blur border border-forest-border px-3 py-1.5 rounded-lg text-xs text-neutral-400">
            Click any column in 3D to select a dish
          </div>
        )}

        {/* Engine Link Indicator */}
        <div className="hidden sm:flex items-center space-x-2 bg-forest-surface/90 backdrop-blur border border-forest-border px-3 py-1.5 rounded-lg text-[11px] font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Engine Synced</span>
        </div>
      </div>

      {/* Bottom HUD Overlay: Controls Guide */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-neutral-400 bg-forest-surface/80 backdrop-blur border border-forest-border px-3 py-1.5 rounded-lg pointer-events-none select-none z-10">
        <div className="flex items-center space-x-2 sm:space-x-3 text-[10px] sm:text-[11px]">
          <span><strong>Left-Click:</strong> Orbit</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline"><strong>Right-Click:</strong> Pan</span>
          <span>•</span>
          <span><strong>Scroll:</strong> Zoom</span>
          <span>•</span>
          <span><strong>Click Object:</strong> Select</span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] text-neutral-500">
          R3F OrbitControls
        </span>
      </div>
    </div>
  );
}
