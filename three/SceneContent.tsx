"use client";

import React from "react";
import { useAppStore } from "@/store/useAppStore";
import { SharedEnvironment } from "./components/SharedEnvironment";
import { ProfitabilityLandscape } from "./modes/ProfitabilityLandscape";
import { IngredientInflationExplorer } from "./modes/IngredientInflationExplorer";
import { RecipeReplayPathway } from "./modes/RecipeReplayPathway";
import { SalesVolumeMatrix } from "./modes/SalesVolumeMatrix";
import { MarginBreakdownTower } from "./modes/MarginBreakdownTower";
import { InflationImpactArena } from "./modes/InflationImpactArena";

export function SceneContent() {
  const { threeMode } = useAppStore();

  return (
    <>
      {/* Shared Lighting, Orbit Controls & Grid Floor */}
      <SharedEnvironment gridSize={22} />

      {/* Dynamic Mode Content Rendering */}
      {threeMode === "profitability-landscape" && <ProfitabilityLandscape />}
      {threeMode === "ingredient-inflation" && <IngredientInflationExplorer />}
      {threeMode === "recipe-replay" && <RecipeReplayPathway />}
      {threeMode === "sales-volume" && <SalesVolumeMatrix />}
      {threeMode === "margin-breakdown" && <MarginBreakdownTower />}
      {threeMode === "inflation-impact" && <InflationImpactArena />}
    </>
  );
}
