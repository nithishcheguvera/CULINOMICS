"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAppStore, DashboardTab } from "@/store/useAppStore";
import { AssistantTriggerButton, AssistantDrawer } from "@/components/assistant";
import { MonthlyKpiCards } from "./MonthlyKpiCards";
import { DishInspectorCard } from "./DishInspectorCard";
import { CompactRecipeReplay } from "./CompactRecipeReplay";
import { ScenePlaceholder } from "@/three/ScenePlaceholder";

// Client-side dynamic import of 3D Scene Explorer with SSR disabled
const SceneExplorer = dynamic(
  () => import("@/three/SceneExplorer").then((mod) => mod.SceneExplorer),
  {
    ssr: false,
    loading: () => <ScenePlaceholder />,
  }
);

interface CockpitShellProps {
  children?: React.ReactNode;
}

export function CockpitShell({ children }: CockpitShellProps) {
  const { activeTab, setActiveTab, isLoading, error, datasetMode, dataset } = useAppStore();

  const navTabs: { id: DashboardTab; label: string; icon: string }[] = [
    { id: "all", label: "Cockpit Overview", icon: "🧭" },
    { id: "matrix", label: "Menu Matrix", icon: "⭐" },
    { id: "profitability", label: "Dish Profitability", icon: "💰" },
    { id: "replay", label: "Recipe Replay", icon: "🔄" },
    { id: "simulator", label: "Menu Surgery", icon: "🔬" },
    { id: "import", label: "Smart Import", icon: "📥" },
    { id: "overview", label: "Financial Tables", icon: "📊" },
  ];

  return (
    <div className="min-h-screen bg-forest-black text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Cockpit Header Bar */}
      <header className="sticky top-0 z-30 bg-forest-surface/90 backdrop-blur-md border-b border-forest-border select-none">
        <div className="max-w-[1336px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Restaurant Brand Identity */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-forest-elevated border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg shadow-sm shadow-emerald-950">
                OB
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    Osteria Bella
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Live Demo
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  Italian Trattoria • 3D Profit Intelligence Cockpit
                </p>
              </div>
            </div>

            {/* Currency, Dataset Badge, & Assistant Trigger */}
            <div className="flex items-center space-x-2.5">
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-xs font-mono text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Currency: <strong className="text-white">INR (₹)</strong></span>
              </div>
              <div className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-xs font-mono text-neutral-300">
                <span>Dataset: <strong className={datasetMode === "custom" ? "text-purple-400" : "text-emerald-400"}>{datasetMode === "custom" ? "Custom Import" : "Canonical 2025"}</strong></span>
              </div>
              <AssistantTriggerButton />
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex space-x-1 border-t border-forest-border/60 overflow-x-auto py-1.5 scrollbar-none">
            {navTabs.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? "bg-emerald-500 text-neutral-950 font-bold shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-forest-elevated"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Cockpit Body Container */}
      <main className="flex-1 max-w-[1336px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5">
        {/* Loading State */}
        {isLoading && (
          <div className="py-24 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-emerald-900 border-t-emerald-400 rounded-full mb-4"></div>
            <p className="text-sm text-neutral-400">Loading dataset & executing deterministic financial engine...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-5 rounded-2xl bg-red-950/60 border border-red-800 text-red-200 my-4 text-center space-y-2">
            <div className="text-2xl">⚠️</div>
            <h3 className="text-sm font-bold">Financial Engine or Dataset Error</h3>
            <p className="text-xs text-red-300 font-mono">{error}</p>
          </div>
        )}

        {dataset && !isLoading && (
          <>
            {/* Phase B: Monthly Runway KPI Cards */}
            <MonthlyKpiCards />

            {/* Phase C: 62% / 38% Desktop Cockpit Grid (Visible on Overview & Matrix) */}
            {(activeTab === "all" || activeTab === "matrix" || activeTab === "explorer3d") && (
              <div className="grid grid-cols-12 gap-4 lg:gap-5 items-stretch">
                {/* Left Stage (62% width on desktop): 3D Scene Explorer */}
                <div className="col-span-12 lg:col-span-7 xl:col-span-8 forest-card rounded-2xl p-4 border border-forest-border flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-forest-border/60 mb-3 select-none">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🧊</span>
                      <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white uppercase">
                        3D Profit Intelligence Stage
                      </h2>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">
                      R3F WebGL • 6 Modes
                    </span>
                  </div>

                  {/* 3D Scene Explorer Component */}
                  <div className="flex-1 w-full min-h-[380px] sm:min-h-[440px] max-h-[580px] rounded-xl overflow-hidden relative">
                    <SceneExplorer />
                  </div>
                </div>

                {/* Right Stage (38% width on desktop): Live Dish Inspector */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col">
                  <DishInspectorCard />
                </div>
              </div>
            )}

            {/* Phase 3B: Compact Recipe Replay Time Intelligence Runway */}
            {(activeTab === "all" || activeTab === "matrix" || activeTab === "explorer3d") && (
              <CompactRecipeReplay />
            )}

            {/* Sub-Views / Secondary Section Panels based on Tab Navigation */}
            {children && (
              <div className="pt-2">
                {children}
              </div>
            )}
          </>
        )}
      </main>

      {/* Global AI Assistant Drawer */}
      <AssistantDrawer />

      {/* Footer */}
      <footer className="border-t border-forest-border/60 py-4 mt-8 select-none">
        <div className="max-w-[1336px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <p>© 2025 Osteria Bella • Culinomics Profit Intelligence Cockpit</p>
          <p className="font-mono text-[11px]">Engine Verified • Pure TypeScript Math • Zero Black-Box AI</p>
        </div>
      </footer>
    </div>
  );
}
