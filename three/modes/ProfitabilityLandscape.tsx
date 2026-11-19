"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory, MenuEngineeringDish } from "@/engine";
import { DataBillboard } from "../components/DataBillboard";

const CATEGORY_COLORS: Record<MenuEngineeringCategory, string> = {
  STAR: "#f59e0b",      // Amber
  PLOWHORSE: "#3b82f6", // Blue
  PUZZLE: "#a855f7",    // Purple
  DOG: "#f43f5e",       // Rose
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
    if (isSelected && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.75;
    }
  });

  return (
    <group position={[position[0], 0, position[2]]}>
      {/* 3D Column Mesh */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        position={[0, height / 2, 0]}
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
        <cylinderGeometry args={[0.38, 0.45, height, 24]} />
        <meshStandardMaterial
          color={isSelected ? baseColor : "#2a2a2a"}
          roughness={0.25}
          metalness={0.2}
          emissive={baseColor}
          emissiveIntensity={isSelected ? 0.45 : 0.08}
        />
      </mesh>

      {/* Selected Indicator Halo */}
      {isSelected && (
        <>
          <mesh position={[0, height + 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.58, 32]} />
            <meshBasicMaterial color={baseColor} side={THREE.DoubleSide} />
          </mesh>
          <DataBillboard
            position={[0, height + 0.75, 0]}
            title={dish.dishName}
            subtitle={`Vol: ${dish.averageMonthlyVolume} • Contrib: ${formatINR(dish.averageContributionMargin)}`}
            badge={dish.category}
            color="#ffffff"
          />
        </>
      )}

      {/* Ground Footprint Ring */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 24]} />
        <meshBasicMaterial color={baseColor} opacity={isSelected ? 0.9 : 0.3} transparent />
      </mesh>
    </group>
  );
}

export function ProfitabilityLandscape() {
  const { menuEngineering, selectedDishId, setSelectedDishId } = useAppStore();

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
    ...dishes.map((d) => d.averageMonthlyVolume * d.averageContributionMargin),
    1
  );

  return (
    <group>
      {/* Quadrant Benchmark Lines on Floor */}
      {/* Popularity Line (Z-Axis across floor at X = 0) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.04, 14]} />
        <meshBasicMaterial color="#737373" />
      </mesh>

      {/* Profitability Line (X-Axis across floor at Z = 0) */}
      <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[0.04, 14]} />
        <meshBasicMaterial color="#737373" />
      </mesh>

      {/* Quadrant Floor Labels */}
      <DataBillboard position={[4.2, 0.05, 4.2]} title="⭐ STARS" subtitle="High Vol • High Profit" color="#f59e0b" scale={0.8} />
      <DataBillboard position={[4.2, 0.05, -4.2]} title="🐎 PLOWHORSES" subtitle="High Vol • Low Profit" color="#3b82f6" scale={0.8} />
      <DataBillboard position={[-4.2, 0.05, 4.2]} title="🧩 PUZZLES" subtitle="Low Vol • High Profit" color="#a855f7" scale={0.8} />
      <DataBillboard position={[-4.2, 0.05, -4.2]} title="🐕 DOGS" subtitle="Low Vol • Low Profit" color="#f43f5e" scale={0.8} />

      {/* Dish Data Columns */}
      {dishes.map((dish) => {
        // Compute normalized coordinates relative to benchmarks:
        // Range: -4.8 to +4.8
        const xOffset = ((dish.averageMonthlyVolume - popularityThreshold) / maxVolDiff) * 4.2;
        const zOffset = ((dish.averageContributionMargin - profitabilityThreshold) / maxProfDiff) * 4.2;

        // Height proportional to total monthly gross cash generation (Volume * Margin)
        const totalCash = dish.averageMonthlyVolume * dish.averageContributionMargin;
        const normalizedHeight = Math.max(0.6, (totalCash / maxContribution) * 3.2);

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
    </group>
  );
}
