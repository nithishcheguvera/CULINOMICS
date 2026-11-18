"use client";

import React, { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  DashboardShell,
  KpiCards,
  FinancialOverviewSection,
  MenuMatrixSection,
  DishProfitabilitySection,
  RecipeReplaySection,
} from "@/components/dashboard";

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
          <KpiCards />

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
        </div>
      )}
    </DashboardShell>
  );
}
