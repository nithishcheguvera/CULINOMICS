"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { MenuEngineeringCategory, MenuEngineeringDish } from "@/engine";
import { DataBillboard } from "../components/DataBillboard";

const CATEGORY_COLORS: Record<MenuEngineeringCategory, string> = {
  STAR: "#f59e0b",      // Amber / Gold
  PLOWHORSE: "#3b82f6", // Blue
  PUZZLE: "#a855f7",    // Purple
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
    if (isSelected && meshRef.current) {
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
        <boxGeometry args={[0.72, height, 0.72]} />
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

      {/* Ground Footprint Rectangular Plate */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial color={baseColor} opacity={isSelected ? 0.85 : 0.25} transparent />
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
    ...dishes.map((d) => d.totalContribution),
    1
  );

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
    </group>
  );
}
