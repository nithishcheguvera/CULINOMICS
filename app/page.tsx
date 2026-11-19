"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useAppStore } from "@/store/useAppStore";
import {
  DashboardShell,
  KpiCards,
  FinancialOverviewSection,
  MenuMatrixSection,
  DishProfitabilitySection,
  RecipeReplaySection,
} from "@/components/dashboard";
import { SmartImportSection } from "@/components/import";
import { MenuSurgerySection } from "@/components/simulator";
import { ScenePlaceholder } from "@/three/ScenePlaceholder";

// Client-side only dynamic import with SSR disabled per architectural invariants
const SceneExplorer = dynamic(
  () => import("@/three/SceneExplorer").then((mod) => mod.SceneExplorer),
  {
    ssr: false,
    loading: () => <ScenePlaceholder />,
  }
);

export default function HomePage() {
  const { loadDataset, activeTab, dataset } = useAppStore();

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return (
    <DashboardShell>
      {dataset && (
        <div className="space-y-10">
          {/* Executive KPI Summary Cards */}
          {activeTab !== "explorer3d" && activeTab !== "import" && <KpiCards />}

          {/* Smart Import & Multimodal Extraction */}
          {activeTab === "import" && (
            <div id="smart-import" className="scroll-mt-24">
              <SmartImportSection />
            </div>
          )}

          {/* Sectional Views based on Active Tab */}
          {(activeTab === "all" || activeTab === "overview") && (
            <div id="financial-overview" className="scroll-mt-24">
              <FinancialOverviewSection />
            </div>
          )}

          {(activeTab === "all" || activeTab === "matrix") && (
            <div id="menu-matrix" className="scroll-mt-24">
              <MenuMatrixSection />
            </div>
          )}

          {(activeTab === "all" || activeTab === "profitability") && (
            <div id="dish-profitability" className="scroll-mt-24">
              <DishProfitabilitySection />
            </div>
          )}

          {(activeTab === "all" || activeTab === "replay") && (
            <div id="recipe-replay" className="scroll-mt-24">
              <RecipeReplaySection />
            </div>
          )}

          {/* Menu Surgery Simulator */}
          {(activeTab === "all" || activeTab === "simulator") && (
            <div id="menu-surgery" className="scroll-mt-24">
              <MenuSurgerySection />
            </div>
          )}

          {/* 3D Explorer - Mounted conditionally only when the user selects the 3D tab */}
          {activeTab === "explorer3d" && (
            <div id="3d-explorer" className="scroll-mt-24">
              <SceneExplorer />
            </div>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
