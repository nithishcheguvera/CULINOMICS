"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  CockpitShell,
  FinancialOverviewSection,
  MenuMatrixSection,
  DishProfitabilitySection,
  RecipeReplaySection,
} from "@/components/dashboard";
import { SmartImportSection } from "@/components/import";
import { MenuSurgerySection } from "@/components/simulator";

export default function HomePage() {
  const { loadDataset, activeTab, dataset } = useAppStore();

  useEffect(() => {
    loadDataset();
  }, [loadDataset]);

  return (
    <CockpitShell>
      {dataset && (
        <div className="space-y-8">
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
        </div>
      )}
    </CockpitShell>
  );
}
