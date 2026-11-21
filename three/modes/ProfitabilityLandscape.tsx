"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory, MenuEngineeringDish } from "@/engine";
import { DataBillboard } from "../components/DataBillboard";

const CATEGORY_COLORS: Record<MenuEngineeringCategory, string> = {
  STAR: "#f59e0b",      // Amber / Gold
  PLOWHORSE: "#84cc16", // Vibrant Lime Green (Screen Record 2)
  PUZZLE: "#38bdf8",    // Sky Cyan / Blue (Screen Record 2)
  DOG: "#ef4444",       // Ruby Red
};

interface DishColumnProps {
  dish: MenuEngineeringDish;
  position: [number, number, number];
  height: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function DishColumn({ dish, position, height, isSelected, onSelect }: DishColumnProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const baseColor = CATEGORY_COLORS[dish.category] || "#9ca3af";

  useFrame((_, delta) => {
    const prefersReducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isSelected && meshRef.current && !prefersReducedMotion) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 3D Rectangular Column Mesh (Profit Pedestal) */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, height / 2, 0]}
        scale={[0.72, height, 0.72]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(dish.dishId);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={isSelected ? baseColor : "#12241C"}
          roughness={0.2}
          metalness={0.25}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.6 : 0.1}
        />
      </mesh>

      {/* Selected Indicator Top Halo & Data Billboard */}
      {isSelected && (
        <>
          <mesh position={[0, height + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.82, 0.82]} />
            <meshBasicMaterial color={baseColor} opacity={0.9} transparent />
          </mesh>
          <DataBillboard
            position={[0, height + 0.85, 0]}
            title={dish.dishName}
            subtitle={`Vol: ${dish.averageMonthlyVolume} • Contrib: ${formatINR(dish.averageContributionMargin)}`}
            badge={dish.category}
            color="#ffffff"
          />
        </>
      )}

      {/* Sparkle star for Star dishes */}
      {dish.category === "STAR" && !isSelected && (
        <DataBillboard
          position={[0, height + 0.35, 0]}
          title="✨"
          color="#fbbf24"
          scale={0.9}
        />
      )}

      {/* Ground Footprint Rectangular Plate */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial color={baseColor} opacity={isSelected ? 0.85 : 0.25} transparent />
      </mesh>

      {/* Glowing Gold Selected Box Boundary on Floor */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.58, 0.68, 4]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      )}
    </group>
  );
}

export function ProfitabilityLandscape() {
  const {
    menuEngineering,
    selectedDishId,
    setSelectedDishId,
    activeScenario,
    scenarioResult,
  } = useAppStore();

  if (!menuEngineering || menuEngineering.dishes.length === 0) {
    return null;
  }

  const { dishes, popularityThreshold, profitabilityThreshold } = menuEngineering;

  // Normalization scale factors so coordinates spread cleanly on the grid
  const maxVolDiff = Math.max(
    ...dishes.map((d) => Math.abs(d.averageMonthlyVolume - popularityThreshold)),
    1
  );
  const maxProfDiff = Math.max(
    ...dishes.map((d) => Math.abs(d.averageContributionMargin - profitabilityThreshold)),
    1
  );

  const maxContribution = Math.max(
    ...dishes.map((d) => d.totalContribution),
    1
  );

  const hasActiveSim =
    scenarioResult &&
    activeScenario &&
    activeScenario.dishId === selectedDishId &&
    (activeScenario.targetSellingPrice !== scenarioResult.baseline.sellingPrice ||
      Math.abs(activeScenario.targetIngredientCost - scenarioResult.baseline.unitIngredientCost) > 0.01 ||
      activeScenario.targetMonthlyVolume !== Math.round(scenarioResult.baseline.monthlyVolume));

  const simXOffset = hasActiveSim
    ? ((scenarioResult.simulated.monthlyVolume - popularityThreshold) / maxVolDiff) * 4.2
    : 0;
  const simZOffset = hasActiveSim
    ? ((scenarioResult.simulated.contributionPerServing - profitabilityThreshold) / maxProfDiff) * 4.2
    : 0;
  const simAnnualContrib = hasActiveSim
    ? scenarioResult.simulated.monthlyContribution * 12
    : 0;
  const simNormalizedHeight = hasActiveSim
    ? Math.max(0.6, (simAnnualContrib / maxContribution) * 3.2)
    : 0.6;
  const projCat = hasActiveSim ? scenarioResult.matrixProjection.projectedCategory : "STAR";
  const projColor = CATEGORY_COLORS[projCat] || "#10b981";
  const deltaContrib = hasActiveSim ? scenarioResult.delta.contributionPerServing : 0;

  return (
    <group>
      {/* Quadrant Benchmark Lines on Floor */}
      {/* Popularity Line (Z-Axis across floor at X = 0) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 14]} />
        <meshBasicMaterial color="#1C362A" />
      </mesh>

      {/* Profitability Line (X-Axis across floor at Z = 0) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.04, 14]} />
        <meshBasicMaterial color="#1C362A" />
      </mesh>

      {/* Quadrant Floor Labels */}
      <DataBillboard position={[4.2, 0.05, 4.2]} title="⭐ STARS" subtitle="High Vol • High Profit" color="#f59e0b" scale={0.8} />
      <DataBillboard position={[4.2, 0.05, -4.2]} title="🐎 PLOWHORSES" subtitle="High Vol • Low Profit" color="#3b82f6" scale={0.8} />
      <DataBillboard position={[-4.2, 0.05, 4.2]} title="🧩 PUZZLES" subtitle="Low Vol • High Profit" color="#a855f7" scale={0.8} />
      <DataBillboard position={[-4.2, 0.05, -4.2]} title="🐕 DOGS" subtitle="Low Vol • Low Profit" color="#ef4444" scale={0.8} />

      {/* Dish Data Columns */}
      {dishes.map((dish) => {
        // Range: -4.2 to +4.2
        const xOffset = ((dish.averageMonthlyVolume - popularityThreshold) / maxVolDiff) * 4.2;
        const zOffset = ((dish.averageContributionMargin - profitabilityThreshold) / maxProfDiff) * 4.2;

        // Height presentation transformation from precomputed engine totalContribution
        const normalizedHeight = Math.max(0.6, (dish.totalContribution / maxContribution) * 3.2);

        const isSelected = dish.dishId === selectedDishId;

        return (
          <DishColumn
            key={dish.dishId}
            dish={dish}
            position={[xOffset, 0, zOffset]}
            height={normalizedHeight}
            isSelected={isSelected}
            onSelect={setSelectedDishId}
          />
        );
      })}

      {/* 3D Holographic Simulated Ghost Column for Active Scenario */}
      {hasActiveSim && (
        <group position={[simXOffset, 0, simZOffset]}>
          {/* Holographic Glowing Ghost Column Mesh */}
          <mesh position={[0, simNormalizedHeight / 2, 0]} scale={[0.76, simNormalizedHeight, 0.76]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial
              color={projColor}
              transparent
              opacity={0.65}
              roughness={0.1}
              metalness={0.4}
              emissive={projColor}
              emissiveIntensity={0.8}
            />
          </mesh>

          {/* Wireframe Outline */}
          <mesh position={[0, simNormalizedHeight / 2, 0]} scale={[0.78, simNormalizedHeight + 0.02, 0.78]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.4} />
          </mesh>

          {/* Top Holographic Halo */}
          <mesh position={[0, simNormalizedHeight + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.88, 0.88]} />
            <meshBasicMaterial color={projColor} opacity={0.9} transparent />
          </mesh>

          {/* Ground Footprint Ring */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.9, 0.9]} />
            <meshBasicMaterial color="#10b981" opacity={0.6} transparent />
          </mesh>

          {/* Simulated Projection Billboard */}
          <DataBillboard
            position={[0, simNormalizedHeight + 0.85, 0]}
            title={`${scenarioResult.dishName} (Simulated)`}
            subtitle={`Vol: ${scenarioResult.simulated.monthlyVolume} • Contrib: ${formatINR(scenarioResult.simulated.contributionPerServing, { showDecimals: true })} (${deltaContrib >= 0 ? "+" : ""}${formatINR(deltaContrib, { showDecimals: true })})`}
            badge={`Projected: ${projCat}`}
            color="#10b981"
          />
        </group>
      )}
    </group>
  );
}
