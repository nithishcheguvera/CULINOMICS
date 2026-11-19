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

export function MarginBreakdownTower() {
  const { selectedDishId, selectedTimelineDate, getDishIngredientBreakdown } = useAppStore();
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
  const totalHeight = 3.6;

  // Compute accumulated base Y coordinates for stacked cylinders
  let accumulatedY = 0;

  return (
    <group position={[0, 0, 0]}>
      {/* Header Billboard */}
      <DataBillboard
        position={[0, 4.8, -1.5]}
        title={`${dishName} — Ingredient Cost Breakdown`}
        subtitle={`Total Food Cost: ${formatINR(totalRecipeCost, { showDecimals: true })} • Date: ${date}`}
        badge="RECIPE ANATOMY"
        color="#fbbf24"
        scale={0.9}
      />

      {/* Ground Base Pedestal */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[1.3, 1.4, 0.1, 32]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.2} />
      </mesh>

      {/* Stacked Deconstructed Ingredient Slices */}
      {ingredients.map((ing, idx) => {
        // Height proportional to cost share percentage
        const sliceHeight = Math.max(0.18, (ing.costSharePercentage / 100) * totalHeight);
        const currentCenterY = 0.1 + accumulatedY + sliceHeight / 2;
        accumulatedY += sliceHeight + 0.04; // 0.04 gap for deconstructed architectural aesthetic

        const isHovered = activeIngredientId === ing.ingredientId;
        const color = SLICE_COLORS[idx % SLICE_COLORS.length];

        // Lateral offset when exploded/hovered
        const xOffset = isHovered ? 0.3 : 0;

        return (
          <group key={ing.ingredientId} position={[xOffset, 0, 0]}>
            <mesh
              position={[0, currentCenterY, 0]}
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
              <cylinderGeometry args={[0.9, 0.95, sliceHeight, 32]} />
              <meshStandardMaterial
                color={color}
                roughness={0.25}
                metalness={0.2}
                emissive={color}
                emissiveIntensity={isHovered ? 0.45 : 0.08}
              />
            </mesh>

            {/* Floating Ring on Active Slice */}
            {isHovered && (
              <mesh position={[0, currentCenterY, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.05, 1.15, 32]} />
                <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
              </mesh>
            )}

            {/* Ingredient Data Billboard to the right */}
            <DataBillboard
              position={[1.8, currentCenterY, 0]}
              title={`${ing.ingredientName}: ${formatINR(ing.ingredientCost, { showDecimals: true })}`}
              subtitle={`${ing.quantity} ${ing.recipeUnit} • ${ing.costSharePercentage.toFixed(1)}% of plate`}
              color={color}
              scale={0.65}
            />
          </group>
        );
      })}
    </group>
  );
}
