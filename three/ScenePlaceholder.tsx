"use client";

import React from "react";

export function ScenePlaceholder() {
  return (
    <div className="w-full h-[520px] rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center p-6 text-center text-white">
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xl shadow-inner animate-pulse">
          🧊
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
      </div>
      <h3 className="text-base font-semibold text-neutral-100">
        Initializing 3D Visualization Foundation
      </h3>
      <p className="text-xs text-neutral-400 max-w-sm mt-1.5 leading-relaxed">
        Configuring WebGL viewport, camera frustum, Drei OrbitControls, and connecting to the shared Zustand store...
      </p>
      <div className="mt-4 flex items-center space-x-2 text-[11px] font-mono text-neutral-500">
        <span>React Three Fiber</span>
        <span>•</span>
        <span>Three.js r170</span>
        <span>•</span>
        <span>Drei v10</span>
      </div>
    </div>
  );
}
