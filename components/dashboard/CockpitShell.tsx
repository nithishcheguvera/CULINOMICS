"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAppStore, DashboardTab } from "@/store/useAppStore";
import { AssistantTriggerButton, AssistantDrawer } from "@/components/assistant";
import { GuidedTour } from "@/components/tour";
import { DemoModeBanner, FirstTimeOnboardingModal, GuideMenuPopover } from "@/components/onboarding";
import { GoldCoinMark } from "@/components/brand";
import { VideoOpeningExperience } from "@/components/intro";
import { MonthlyKpiCards } from "./MonthlyKpiCards";
import { DishInspectorCard } from "./DishInspectorCard";
import { CompactRecipeReplay } from "./CompactRecipeReplay";
import { CompactMenuSurgery } from "./CompactMenuSurgery";
import { CockpitAiCopilot } from "./CockpitAiCopilot";
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
    { id: "forecast", label: "Profit Forecast", icon: "📈" },
    { id: "optimizer", label: "Combo Optimizer", icon: "🍱" },
    { id: "report", label: "Executive Report", icon: "📄" },
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
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Restaurant Brand Identity */}
            <div id="cockpit-header-brand" className="flex items-center space-x-3">
              <GoldCoinMark size={40} />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg font-black tracking-widest text-white uppercase">
                    CULINOMICS
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                    Live Demo
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  3D Profit Intelligence Cockpit
                </p>
              </div>
            </div>

            {/* Currency, Dataset Badge, Guide & Assistant Trigger */}
            <div className="flex items-center space-x-2 sm:space-x-2.5">
              <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-xs font-mono text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Currency: <strong className="text-white">INR (₹)</strong></span>
              </div>
              <div className="hidden sm:flex items-center px-2.5 py-1 rounded-lg bg-forest-elevated border border-forest-border text-xs font-mono text-neutral-300">
                <span>Dataset: <strong className={datasetMode === "custom" ? "text-purple-400" : "text-emerald-400"}>{datasetMode === "custom" ? "Custom Import" : "Canonical 2025"}</strong></span>
              </div>
              <GuideMenuPopover />
              <AssistantTriggerButton />
              {/* Screen Record 2 Header Sign Out Action */}
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("culinomics_video_intro_seen");
                    useAppStore.getState().replayVideoIntro();
                  }
                }}
                className="px-3.5 py-1 rounded-full bg-forest-elevated hover:bg-forest-border border border-neutral-700/80 text-xs font-semibold text-neutral-200 transition-all cursor-pointer shadow-sm hover:text-white"
                title="Restart intro experience"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div id="cockpit-nav-tabs" className="flex space-x-1 border-t border-forest-border/60 overflow-x-auto py-1.5 scrollbar-none">
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

      {/* Demo Mode Persistent Sandbox Banner */}
      <DemoModeBanner />

      {/* Main Cockpit Body Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
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

            {/* Phase C: 62% / 38% Desktop Cockpit Grid (Screen Record 2 Layout) */}
            {(activeTab === "all" || activeTab === "matrix" || activeTab === "explorer3d") && (
              <div className="grid grid-cols-12 gap-4 lg:gap-5 items-stretch">
                {/* Left Stage (62% width on desktop): 3D Scene Explorer (Profit Terrain) */}
                <div id="scene-stage-container" className="col-span-12 lg:col-span-7 xl:col-span-8 forest-card rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-emerald-500/20 bg-gradient-to-b from-[#0c1f15] to-[#06120c] flex flex-col justify-between shadow-xl shadow-black/50">
                  {/* Top Header of Profit Terrain (Screen Record 2) */}
                  <div className="flex items-center justify-between pb-3 border-b border-forest-border/60 mb-3 select-none">
                    <div>
                      <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                        Profit Terrain
                      </h2>
                      <span className="text-[10px] text-neutral-400 font-mono hidden sm:inline">
                        3D Kasavana &amp; Smith Landscape
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center bg-black/60 p-1 rounded-full border border-neutral-700/80 text-xs">
                        <button
                          type="button"
                          onClick={() => useAppStore.getState().setThreeMode("profitability-landscape")}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            useAppStore.getState().threeMode === "profitability-landscape"
                              ? "bg-amber-400 text-neutral-950 shadow-md"
                              : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Field
                        </button>
                        <button
                          type="button"
                          onClick={() => useAppStore.getState().setThreeMode("recipe-replay")}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            useAppStore.getState().threeMode === "recipe-replay"
                              ? "bg-amber-400 text-neutral-950 font-bold shadow-md"
                              : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Time
                        </button>
                        <button
                          type="button"
                          onClick={() => useAppStore.getState().setThreeMode("margin-breakdown")}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            useAppStore.getState().threeMode === "margin-breakdown"
                              ? "bg-amber-400 text-neutral-950 font-bold shadow-md"
                              : "text-neutral-400 hover:text-white"
                          }`}
                        >
                          Breakdown
                        </button>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        Drag to orbit · click a dish
                      </span>
                    </div>
                  </div>

                  {/* 3D Scene Explorer Component */}
                  <div className="flex-1 w-full rounded-2xl relative min-h-[350px]">
                    <SceneExplorer />
                  </div>

                  {/* Stage Bottom: Quadrant Filter Badges & Timeline Slider (Screen Record 2) */}
                  <div className="mt-3 pt-3 border-t border-forest-border/60 flex flex-col gap-2.5">
                    {/* Quadrant Badges */}
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-amber-500/70 text-amber-300 bg-amber-950/40">
                        Star
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-lime-500/70 text-lime-300 bg-lime-950/40">
                        Plowhorse
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-sky-500/70 text-sky-300 bg-sky-950/40">
                        Puzzle
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-red-500/70 text-red-300 bg-red-950/40">
                        Dog
                      </span>
                    </div>

                    {/* Timeline Runway Scrubber Bar */}
                    <div className="flex items-center gap-3 bg-black/50 px-3 py-2 rounded-xl border border-forest-border/50">
                      <button
                        type="button"
                        onClick={useAppStore.getState().togglePlay}
                        className="w-8 h-8 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 font-black flex items-center justify-center text-xs shadow-md shadow-amber-950/50 cursor-pointer transition-transform active:scale-95 shrink-0"
                        aria-label="Play or pause runway"
                      >
                        {useAppStore.getState().isPlaying ? "⏸" : "▶"}
                      </button>

                      {/* 12-month progress slider track */}
                      <div className="flex-1 flex items-center justify-between text-[11px] font-mono text-neutral-400 px-1 relative">
                        <div className="absolute inset-x-0 h-1 bg-lime-950/80 rounded-full">
                          <div
                            className="h-full bg-gradient-to-r from-lime-500 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(132,204,22,0.8)]"
                            style={{
                              width: `${(Math.max(0, useAppStore.getState().timelineDates.indexOf(useAppStore.getState().selectedTimelineDate || useAppStore.getState().timelineDates[useAppStore.getState().timelineDates.length - 1])) / Math.max(1, useAppStore.getState().timelineDates.length - 1)) * 100}%`,
                            }}
                          />
                        </div>
                        {useAppStore.getState().timelineDates.map((date, idx) => {
                          const dates = useAppStore.getState().timelineDates;
                          const curDate = useAppStore.getState().selectedTimelineDate || dates[dates.length - 1];
                          const isSel = curDate === date;
                          const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx];
                          return (
                            <button
                              key={date}
                              type="button"
                              onClick={() => useAppStore.getState().setSelectedTimelineDate(date)}
                              className={`z-10 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                                isSel ? "text-lime-300 font-bold scale-110" : "hover:text-white"
                              }`}
                            >
                              <span
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                  isSel
                                    ? "bg-amber-400 shadow-[0_0_8px_#fbbf24] scale-125"
                                    : "bg-neutral-700 hover:bg-neutral-500"
                                }`}
                              />
                              <span className="text-[10px] hidden sm:inline">{monthShort}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Month Label */}
                      <span className="font-bold font-mono text-sm text-lime-400 shrink-0">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Math.max(0, useAppStore.getState().timelineDates.indexOf(useAppStore.getState().selectedTimelineDate || useAppStore.getState().timelineDates[useAppStore.getState().timelineDates.length - 1]))]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Stage (38% width on desktop): Live Dish Inspector & AI Copilot */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
                  <DishInspectorCard />
                  <CockpitAiCopilot />
                </div>
              </div>
            )}

            {/* Recipe Replay Time Intelligence Runway (Full Width) */}
            {(activeTab === "all" || activeTab === "matrix" || activeTab === "explorer3d" || activeTab === "replay") && (
              <CompactRecipeReplay />
            )}

            {/* Standalone Menu Surgery Cockpit Lab (When in simulator tab) */}
            {activeTab === "simulator" && (
              <CompactMenuSurgery />
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

      {/* Stage 11: Interactive Guided Tour & First-Time Onboarding Modal */}
      <GuidedTour />
      <FirstTimeOnboardingModal />

      {/* Video Opening Experience (Plays on initial session landing or manual replay) */}
      <VideoOpeningExperience />

      {/* Footer */}
      <footer className="border-t border-forest-border/60 py-4 mt-8 select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-2">
          <p>© 2025 CULINOMICS • 3D Profit Intelligence Cockpit</p>
          <p className="font-mono text-[11px]">Engine Verified • Pure TypeScript Math • Zero Black-Box AI</p>
        </div>
      </footer>
    </div>
  );
}
