"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { DataBillboard } from "../components/DataBillboard";

const SLICE_COLORS = [
  "#f59e0b", // Amber
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#64748b", // Slate
];

/**
 * Mode 5: 3D Financial Waterfall & Cost Anatomy Explorer
 *
 * Visualizes the complete economic bridge of a dish:
 * Selling Price (Gross Revenue) = Total Food Cost (COGS) + Gross Contribution (Cash Yield)
 *
 * Features:
 * 1. Left Pillar (X = -2.5): Selling Price (100% economic envelope) in glowing emerald glass.
 * 2. Center Cascade (X = 0): Exploded ingredient cost shares descending by financial weight.
 * 3. Right Pillar (X = +2.5): Net Gross Contribution yield in golden amber with margin %.
 * 4. Holographic Ghost Column (X = +4.5): Real-time Menu Surgery simulated comparison.
 * 5. Dynamic timeline reactivity: Shows physical margin compression from inflation.
 */
export function MarginBreakdownTower() {
  const {
    selectedDishId,
    selectedTimelineDate,
    dishProfitability,
    recipeReplay,
    activeScenario,
    scenarioResult,
    getDishIngredientBreakdown,
  } = useAppStore();

  const [activeIngredientId, setActiveIngredientId] = useState<string | null>(null);

  const breakdown = getDishIngredientBreakdown(selectedDishId, selectedTimelineDate ?? undefined);

  if (!breakdown || breakdown.ingredients.length === 0) {
    return (
      <group>
        <DataBillboard
          position={[0, 2, 0]}
          title="No Recipe Breakdown Available"
          subtitle="Select another dish or date"
          color="#f43f5e"
        />
      </group>
    );
  }

  const { dishName, date, totalRecipeCost, ingredients } = breakdown;

  // Resolve dish baseline economics for the active timeline date
  const selectedProfit = dishProfitability.find((p) => p.dishId === selectedDishId);
  const replayDish = recipeReplay.find((r) => r.dishId === selectedDishId);
  const activePoint =
    replayDish?.points.find((p) => p.date === date) ||
    (replayDish && replayDish.points[replayDish.points.length - 1]);

  const sellingPrice = activePoint?.sellingPrice ?? selectedProfit?.unitSellingPrice ?? 0;
  const grossContribution = Math.max(0, sellingPrice - totalRecipeCost);
  const marginPercentage = sellingPrice > 0 ? (grossContribution / sellingPrice) * 100 : 0;
  const foodCostPercentage = sellingPrice > 0 ? (totalRecipeCost / sellingPrice) * 100 : 0;

  // Simulation scenario resolution
  const hasSurgery =
    activeScenario &&
    scenarioResult &&
    activeScenario.dishId === selectedDishId;

  const sim = hasSurgery ? scenarioResult.simulated : null;
  const delta = hasSurgery ? scenarioResult.delta : null;
  const base = hasSurgery ? scenarioResult.baseline : null;
  const isModified =
    hasSurgery &&
    (activeScenario.targetSellingPrice !== base!.sellingPrice ||
      Math.abs(activeScenario.targetIngredientCost - base!.unitIngredientCost) > 0.01 ||
      activeScenario.targetMonthlyVolume !== Math.round(base!.monthlyVolume));

  // Visual vertical scale (normalized against max price)
  const maxPrice = Math.max(sellingPrice, sim?.sellingPrice ?? 0, 100);
  const scaleY = 3.6 / maxPrice;

  const priceHeight = Math.max(0.3, sellingPrice * scaleY);
  const contribHeight = Math.max(0.2, grossContribution * scaleY);

  // Compute accumulated heights for the center ingredient cascade
  let accumulatedY = 0;

  return (
    <group position={[0, 0, 0]}>
      {/* Top Architectural Header Billboard */}
      <DataBillboard
        position={[0, 5.2, -2.0]}
        title={`${dishName} — 3D Financial Waterfall`}
        subtitle={`Selling Price ${formatINR(sellingPrice)} = Food Cost ${formatINR(totalRecipeCost, { showDecimals: true })} (${foodCostPercentage.toFixed(1)}%) + Contribution ${formatINR(grossContribution, { showDecimals: true })} (${marginPercentage.toFixed(1)}%)`}
        badge="FINANCIAL EXPLAINABILITY"
        color="#10b981"
        scale={0.95}
      />

      {/* ============================================================== */}
      {/* 1. LEFT COLUMN: TOTAL SELLING PRICE PILLAR (GROSS REVENUE)    */}
      {/* ============================================================== */}
      <group position={[-2.5, 0, 0]}>
        {/* Base Pedestal */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.1, 32]} />
          <meshStandardMaterial color="#064e3b" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Selling Price Pillar */}
        <mesh position={[0, 0.1 + priceHeight / 2, 0]} scale={[0.65, priceHeight, 0.65]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial
            color="#059669"
            roughness={0.2}
            metalness={0.35}
            emissive="#10b981"
            emissiveIntensity={0.25}
          />
        </mesh>

        {/* Pillar Header Billboard */}
        <DataBillboard
          position={[0, 0.2 + priceHeight + 0.45, 0]}
          title={`Selling Price: ${formatINR(sellingPrice)}`}
          subtitle="100% Gross Revenue Per Plate"
          badge="TOTAL REVENUE"
          color="#10b981"
          scale={0.7}
        />
      </group>

      {/* ============================================================== */}
      {/* 2. CENTER STAGE: DECONSTRUCTED INGREDIENT COST CASCADE (COGS)  */}
      {/* ============================================================== */}
      <group position={[0, 0, 0]}>
        {/* Base Pedestal */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[1.05, 1.15, 0.1, 32]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
        </mesh>

        {/* Stacked Deconstructed Ingredient Slices */}
        {ingredients.map((ing, idx) => {
          const sliceHeight = Math.max(0.12, ing.ingredientCost * scaleY);
          const currentCenterY = 0.1 + accumulatedY + sliceHeight / 2;
          accumulatedY += sliceHeight + 0.04;

          const isHovered = activeIngredientId === ing.ingredientId;
          const color = SLICE_COLORS[idx % SLICE_COLORS.length];
          const zOffset = isHovered ? 0.35 : 0;

          return (
            <group key={ing.ingredientId} position={[0, 0, zOffset]}>
              <mesh
                position={[0, currentCenterY, 0]}
                scale={[0.82, sliceHeight, 0.82]}
                castShadow
                receiveShadow
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIngredientId(ing.ingredientId);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = "pointer";
                  setActiveIngredientId(ing.ingredientId);
                }}
                onPointerOut={() => {
                  document.body.style.cursor = "auto";
                  setActiveIngredientId(null);
                }}
              >
                <cylinderGeometry args={[1, 1, 1, 32]} />
                <meshStandardMaterial
                  color={color}
                  roughness={0.22}
                  metalness={0.25}
                  emissive={color}
                  emissiveIntensity={isHovered ? 0.55 : 0.12}
                />
              </mesh>

              {/* Floating Ring on Active Hovered Slice */}
              {isHovered && (
                <mesh position={[0, currentCenterY, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.95, 1.05, 32]} />
                  <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                </mesh>
              )}

              {/* Ingredient Data Billboard to the right */}
              <DataBillboard
                position={[1.35, currentCenterY, 0]}
                title={`${ing.ingredientName}: ${formatINR(ing.ingredientCost, { showDecimals: true })}`}
                subtitle={`${ing.quantity} ${ing.recipeUnit} • ${ing.costSharePercentage.toFixed(1)}% of food cost`}
                color={color}
                scale={0.58}
              />
            </group>
          );
        })}

        {/* Center Cost Category Header */}
        <DataBillboard
          position={[0, 0.2 + accumulatedY + 0.45, 0]}
          title={`Total Food Cost: ${formatINR(totalRecipeCost, { showDecimals: true })}`}
          subtitle={`${foodCostPercentage.toFixed(1)}% of Selling Price`}
          badge="RECIPE ANATOMY"
          color="#fbbf24"
          scale={0.7}
        />
      </group>

      {/* ============================================================== */}
      {/* 3. RIGHT COLUMN: NET GROSS CONTRIBUTION PILLAR (CASH YIELD)   */}
      {/* ============================================================== */}
      <group position={[2.5, 0, 0]}>
        {/* Base Pedestal */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.1, 32]} />
          <meshStandardMaterial color="#451a03" roughness={0.3} metalness={0.2} />
        </mesh>

        {/* Contribution Pillar */}
        <mesh position={[0, 0.1 + contribHeight / 2, 0]} scale={[0.65, contribHeight, 0.65]} castShadow receiveShadow>
          <cylinderGeometry args={[1, 1, 1, 32]} />
          <meshStandardMaterial
            color="#d97706"
            roughness={0.18}
            metalness={0.35}
            emissive="#f59e0b"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Pillar Header Billboard */}
        <DataBillboard
          position={[0, 0.2 + contribHeight + 0.45, 0]}
          title={`Gross Contribution: ${formatINR(grossContribution, { showDecimals: true })}`}
          subtitle={`${marginPercentage.toFixed(1)}% Food Margin Yield`}
          badge="CASH YIELD"
          color="#f59e0b"
          scale={0.7}
        />
      </group>

      {/* ============================================================== */}
      {/* 4. FAR RIGHT: SIMULATED SCENARIO GHOST COLUMN (MENU SURGERY)   */}
      {/* ============================================================== */}
      {isModified && sim && delta && (
        <group position={[4.6, 0, 0]}>
          {(() => {
            const simContribHeight = Math.max(0.2, sim.contributionPerServing * scaleY);
            return (
              <>
                {/* Base Pedestal */}
                <mesh position={[0, 0.05, 0]} receiveShadow>
                  <cylinderGeometry args={[0.8, 0.9, 0.1, 32]} />
                  <meshStandardMaterial color="#3b0764" roughness={0.3} metalness={0.2} />
                </mesh>

                {/* Simulated Projected Pillar (Translucent Holographic Style) */}
                <mesh position={[0, 0.1 + simContribHeight / 2, 0]}>
                  <cylinderGeometry args={[0.62, 0.62, simContribHeight, 32]} />
                  <meshStandardMaterial
                    color="#a855f7"
                    transparent
                    opacity={0.65}
                    roughness={0.2}
                    metalness={0.4}
                    emissive="#c084fc"
                    emissiveIntensity={0.35}
                  />
                </mesh>

                {/* Wireframe Outline */}
                <mesh position={[0, 0.1 + simContribHeight / 2, 0]}>
                  <cylinderGeometry args={[0.63, 0.63, simContribHeight, 16]} />
                  <meshBasicMaterial color="#e9d5ff" wireframe transparent opacity={0.3} />
                </mesh>

                {/* Simulated Header Billboard */}
                <DataBillboard
                  position={[0, 0.2 + simContribHeight + 0.45, 0]}
                  title={`Simulated Yield: ${formatINR(sim.contributionPerServing, { showDecimals: true })}`}
                  subtitle={`${delta.contributionPerServing >= 0 ? "+" : ""}${formatINR(delta.contributionPerServing, { showDecimals: true })} • ${sim.contributionMarginPercentage != null ? sim.contributionMarginPercentage.toFixed(1) : "0.0"}% Margin`}
                  badge="SIMULATED SCENARIO"
                  color="#c084fc"
                  scale={0.7}
                />
              </>
            );
          })()}
        </group>
      )}
    </group>
  );
}
