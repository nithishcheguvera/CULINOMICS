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
    <div className="relative w-full h-[540px] rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 shadow-md flex flex-col">
      {/* 3D Canvas Viewport */}
      <div className="flex-1 w-full h-full">
        <Canvas
          shadows
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
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between pointer-events-none">
        {selectedDish ? (
          <div className="bg-neutral-900/90 backdrop-blur border border-neutral-700/80 px-3.5 py-2.5 rounded-lg shadow-lg pointer-events-auto flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-white tracking-wide">
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
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Vol: <strong>{selectedDish.averageMonthlyVolume}</strong>/mo • Contrib: <strong>₹{selectedDish.averageContributionMargin.toFixed(2)}</strong>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <select
                id="three-dish-select"
                aria-label="Select dish in 3D Explorer"
                value={selectedDishId}
                onChange={(e) => setSelectedDishId(e.target.value)}
                className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 focus:outline-none cursor-pointer"
              >
                {menuEngineering?.dishes.map((d) => (
                  <option key={d.dishId} value={d.dishId}>
                    {d.dishName}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setActiveTab("replay")}
                className="text-xs font-medium px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors whitespace-nowrap"
              >
                Inspect in Replay →
              </button>
              <button
                onClick={() => setActiveTab("simulator")}
                className="text-xs font-medium px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors whitespace-nowrap"
              >
                Simulate 🔬
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-neutral-900/80 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-md text-xs text-neutral-400">
            Click any pedestal in 3D to select a dish
          </div>
        )}

        {/* Engine Link Indicator */}
        <div className="hidden sm:flex items-center space-x-2 bg-neutral-900/90 backdrop-blur border border-neutral-800 px-3 py-1.5 rounded-md text-[11px] font-mono text-neutral-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Stage 8 3D Engine Link</span>
        </div>
      </div>

      {/* Bottom HUD Overlay: Controls Guide */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-neutral-400 bg-neutral-900/80 backdrop-blur border border-neutral-800/80 px-3 py-1.5 rounded-md pointer-events-none">
        <div className="flex items-center space-x-4">
          <span><strong>Left-Click + Drag:</strong> Orbit</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline"><strong>Right-Click + Drag:</strong> Pan</span>
          <span>•</span>
          <span><strong>Scroll:</strong> Zoom</span>
          <span>•</span>
          <span><strong>Click Object:</strong> Select Dish</span>
        </div>
        <span className="hidden md:inline font-mono text-[10px] text-neutral-500">
          WebGL 2.0 • Drei OrbitControls
        </span>
      </div>
    </div>
  );
}
