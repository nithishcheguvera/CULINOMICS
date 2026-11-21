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
import { RestaurantWorldBackground } from "./RestaurantWorldBackground";
import { ProfitTerrainCanvas } from "./ProfitTerrainCanvas";

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
    <div className="min-h-screen bg-forest-black text-neutral-100 flex flex-col font-sans selection:bg-emerald-500/30 relative">
      {/* Restaurant Profit World Floating Background Canvas from menumind */}
      <RestaurantWorldBackground />

      {/* Top Cockpit Header Bar */}
      <header className="sticky top-0 z-30 bg-forest-black/85 backdrop-blur-md border-b border-forest-border select-none">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Restaurant Brand Identity from zip file logo */}
            <div id="cockpit-header-brand" className="flex items-center space-x-3">
              <img
                src="/images/logo.png"
                alt="CULINOMICS"
                className="h-10 sm:h-12 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
              />
              <div className="hidden sm:block sr-only">
                <GoldCoinMark size={40} />
                <h1>CULINOMICS</h1>
                <p>3D Profit Intelligence Cockpit</p>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
                Live Demo
              </span>
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

              {/* Sign out action from dashboard.html */}
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    sessionStorage.removeItem("culinomics_video_intro_seen");
                    useAppStore.getState().replayVideoIntro();
                  }
                }}
                className="px-3.5 py-1 rounded-full bg-forest-elevated hover:bg-forest-border border border-neutral-700/80 text-xs font-semibold text-neutral-200 transition-all cursor-pointer shadow-sm hover:text-white"
                title="Sign out & return to intro"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? "bg-gradient-to-r from-[#ffd24a] to-[#a6d81f] text-[#1d2a08] font-bold shadow-sm"
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
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 relative z-10">
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
            {/* Top KPIs Row (from menumind / Phase 3A) */}
            <MonthlyKpiCards />

            {/* Main Stage & Side Panel Grid (matching dashboard.html) */}
            {(activeTab === "all" || activeTab === "matrix" || activeTab === "explorer3d") && (
              <div className="grid grid-cols-12 gap-4 lg:gap-5 items-stretch">
                {/* Left Stage (62%): 3D Profit Terrain Canvas from zip file */}
                <div id="scene-stage-container" className="col-span-12 lg:col-span-7 xl:col-span-8 flex flex-col">
                  <ProfitTerrainCanvas />
                  <div className="sr-only">
                    <SceneExplorer />
                  </div>
                </div>

                {/* Right Column (38%): Dish Inspector Card + Menu Surgery Simulator & AI Copilot */}
                <div className="col-span-12 lg:col-span-5 xl:col-span-4 flex flex-col space-y-4">
                  <DishInspectorCard />
                  <CockpitAiCopilot />
                </div>
              </div>
            )}

            {/* Bottom Full-Width Panel: Recipe Replay (matching dashboard.html) */}
            {(activeTab === "all" || activeTab === "replay") && (
              <div className="w-full">
                <CompactRecipeReplay />
              </div>
            )}

            {/* Tab-driven full analytical sections */}
            {children}
          </>
        )}
      </main>

      {/* Guided Tour Engine */}
      <GuidedTour />

      {/* First-Time User Onboarding Modal */}
      <FirstTimeOnboardingModal />

      {/* AI Assistant Chat Drawer */}
      <AssistantDrawer />

      {/* Cinematic Intro Animation & Sign-in Experience from zip file */}
      <VideoOpeningExperience />
    </div>
  );
}

export default CockpitShell;
