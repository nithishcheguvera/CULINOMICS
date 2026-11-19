"use client";

import React from "react";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";
import { DataBillboard } from "../components/DataBillboard";

const CATEGORY_COLORS: Record<MenuEngineeringCategory, string> = {
  STAR: "#f59e0b",
  PLOWHORSE: "#3b82f6",
  PUZZLE: "#a855f7",
  DOG: "#f43f5e",
};

export function SalesVolumeMatrix() {
  const {
    salesAnalysis,
    menuEngineering,
    selectedDishId,
    setSelectedDishId,
    selectedTimelineDate,
    setSelectedTimelineDate,
  } = useAppStore();

  if (!salesAnalysis || !menuEngineering || salesAnalysis.monthlyVolumes.length === 0) {
    return null;
  }

  const { monthlyVolumes } = salesAnalysis;
  const { dishes } = menuEngineering;

  const monthCount = monthlyVolumes.length;
  const dishCount = dishes.length;

  const xSpacing = 1.1;
  const zSpacing = 1.3;
  const startX = -((monthCount - 1) * xSpacing) / 2;
  const startZ = -((dishCount - 1) * zSpacing) / 2;

  // Find max volume to normalize column heights to ~3 units
  let maxVolume = 1;
  for (const mv of monthlyVolumes) {
    for (const d of dishes) {
      const vol = mv.volumeByDish[d.dishId] || 0;
      if (vol > maxVolume) maxVolume = vol;
    }
  }

  return (
    <group position={[0, 0, 0]}>
      {/* Title Header */}
      <DataBillboard
        position={[0, 4.4, startZ - 1.2]}
        title="3D Sales Volume Matrix"
        subtitle="Monthly Volume Comparison Across All Menu Dishes"
        badge="VOLUME TOPOGRAPHY"
        color="#60a5fa"
        scale={0.85}
      />

      {/* Grid Floor Plate */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[monthCount * xSpacing + 1.2, dishCount * zSpacing + 1.2]} />
        <meshBasicMaterial color="#1e1e1e" opacity={0.4} transparent />
      </mesh>

      {/* Render 3D Topographic Volume Columns */}
      {dishes.map((dish, dishIdx) => {
        const zPos = startZ + dishIdx * zSpacing;
        const baseColor = CATEGORY_COLORS[dish.category] || "#94a3b8";

        return (
          <group key={dish.dishId} position={[0, 0, zPos]}>
            {/* Dish Row Title */}
            <DataBillboard
              position={[startX - 1.2, 0.2, 0]}
              title={dish.dishName}
              badge={dish.category}
              color={dish.dishId === selectedDishId ? "#ffffff" : baseColor}
              scale={0.5}
            />

            {/* Monthly Volume Bars */}
            {monthlyVolumes.map((mv, mIdx) => {
              const xPos = startX + mIdx * xSpacing;
              const volume = mv.volumeByDish[dish.dishId] || 0;
              const barHeight = Math.max(0.12, (volume / maxVolume) * 2.8);

              const isDishActive = dish.dishId === selectedDishId;
              const isDateActive = mv.date === selectedTimelineDate;
              const isCellActive = isDishActive && isDateActive;

              return (
                <group key={mv.date} position={[xPos, 0, 0]}>
                  <mesh
                    position={[0, barHeight / 2, 0]}
                    castShadow
                    receiveShadow
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDishId(dish.dishId);
                      setSelectedTimelineDate(mv.date);
                    }}
                    onPointerOver={() => {
                      document.body.style.cursor = "pointer";
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = "auto";
                    }}
                  >
                    <boxGeometry args={[0.75, barHeight, 0.85]} />
                    <meshStandardMaterial
                      color={isCellActive ? "#ffffff" : isDishActive ? baseColor : "#334155"}
                      roughness={0.25}
                      metalness={0.2}
                      emissive={isCellActive ? "#ffffff" : baseColor}
                      emissiveIntensity={isCellActive ? 0.5 : isDishActive ? 0.25 : 0.04}
                    />
                  </mesh>

                  {/* Active Cell Halo */}
                  {isCellActive && (
                    <>
                      <mesh position={[0, barHeight + 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <ringGeometry args={[0.42, 0.52, 24]} />
                        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                      </mesh>
                      <DataBillboard
                        position={[0, barHeight + 0.65, 0]}
                        title={`${volume} servings`}
                        subtitle={mv.date}
                        color="#ffffff"
                        scale={0.65}
                      />
                    </>
                  )}
                </group>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}
