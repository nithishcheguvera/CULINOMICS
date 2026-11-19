"use client";

import React, { useState } from "react";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { DataBillboard } from "../components/DataBillboard";

export function IngredientInflationExplorer() {
  const { ingredientInflation, selectedTimelineDate, setSelectedTimelineDate } = useAppStore();
  const [hoveredIngredientId, setHoveredIngredientId] = useState<string | null>(null);

  if (ingredientInflation.length === 0) {
    return null;
  }

  // Top ingredients sorted descending by inflation percentage
  const ingredients = ingredientInflation;
  const count = ingredients.length;

  const xSpacing = 1.6;
  const zSpacing = 0.7;
  const startX = -((count - 1) * xSpacing) / 2;

  return (
    <group position={[0, 0, 0]}>
      {ingredients.map((ing, ingIdx) => {
        const xPos = startX + ingIdx * xSpacing;
        const isHovered = hoveredIngredientId === ing.ingredientId;
        const isMajor = ing.isMajorDriver;

        // Base accent color
        const ingColor = isMajor ? "#f43f5e" : ing.percentageChange > 20 ? "#f59e0b" : "#3b82f6";

        return (
          <group key={ing.ingredientId} position={[xPos, 0, 0]}>
            {/* Ingredient Track Base Plate */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[1.3, ing.monthlyPrices.length * zSpacing + 0.4]} />
              <meshBasicMaterial
                color={ingColor}
                opacity={isHovered ? 0.35 : 0.08}
                transparent
              />
            </mesh>

            {/* Monthly Stepped Bars along Z-axis */}
            {ing.monthlyPrices.map((pt, ptIdx) => {
              const zPos = -((ing.monthlyPrices.length - 1) * zSpacing) / 2 + ptIdx * zSpacing;
              const isDateSelected = selectedTimelineDate === pt.date;

              // Height derived deterministically from engine precomputed indexedPrice (100 = 1.0 unit)
              const barHeight = Math.max(0.2, (pt.indexedPrice / 100) * 1.2);

              return (
                <group key={pt.date} position={[0, 0, zPos]}>
                  <mesh
                    position={[0, barHeight / 2, 0]}
                    castShadow
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTimelineDate(pt.date);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = "pointer";
                      setHoveredIngredientId(ing.ingredientId);
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = "auto";
                      setHoveredIngredientId(null);
                    }}
                  >
                    <boxGeometry args={[0.9, barHeight, 0.5]} />
                    <meshStandardMaterial
                      color={isDateSelected ? "#ffffff" : ingColor}
                      roughness={0.3}
                      metalness={0.2}
                      emissive={isDateSelected ? "#ffffff" : ingColor}
                      emissiveIntensity={isDateSelected ? 0.5 : isHovered ? 0.25 : 0.05}
                    />
                  </mesh>

                  {/* Selected Date Indicator Ring */}
                  {isDateSelected && (
                    <mesh position={[0, barHeight + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
                      <ringGeometry args={[0.35, 0.45, 16]} />
                      <meshBasicMaterial color="#ffffff" />
                    </mesh>
                  )}
                </group>
              );
            })}

            {/* Ingredient Header Billboard */}
            <DataBillboard
              position={[0, 3.8, -((ing.monthlyPrices.length - 1) * zSpacing) / 2 - 0.8]}
              title={ing.ingredientName}
              subtitle={`${formatINR(ing.startPrice)} ➔ ${formatINR(ing.endPrice)} / ${ing.unit}`}
              badge={`${ing.percentageChange > 0 ? "+" : ""}${ing.percentageChange.toFixed(1)}%`}
              color={isMajor ? "#f43f5e" : "#ffffff"}
              scale={0.75}
            />
          </group>
        );
      })}
    </group>
  );
}
