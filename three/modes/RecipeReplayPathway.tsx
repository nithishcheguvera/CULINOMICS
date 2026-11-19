"use client";

import React from "react";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { DataBillboard } from "../components/DataBillboard";

export function RecipeReplayPathway() {
  const { recipeReplay, selectedDishId, selectedTimelineDate, setSelectedTimelineDate } = useAppStore();

  const dishReplay = recipeReplay.find((r) => r.dishId === selectedDishId) || recipeReplay[0];

  if (!dishReplay || dishReplay.points.length === 0) {
    return null;
  }

  const { points } = dishReplay;
  const count = points.length;

  // Max selling price across all points to normalize height to ~3.5 units
  const maxPrice = Math.max(...points.map((p) => p.sellingPrice), 1);
  const heightScale = 3.2 / maxPrice;

  const xSpacing = 1.35;
  const startX = -((count - 1) * xSpacing) / 2;

  return (
    <group position={[0, 0, 0]}>
      {/* Title Header */}
      <DataBillboard
        position={[0, 4.4, -1.8]}
        title={`${dishReplay.dishName} — Recipe Replay Runway`}
        subtitle="Stacked Cost (COGS) vs Gross Contribution over Available Historical Timeline"
        badge="TIMELINE EXPLORER"
        color="#38bdf8"
        scale={0.9}
      />

      {/* Pathway Runway Surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[count * xSpacing + 1.2, 3.2]} />
        <meshBasicMaterial color="#1e293b" opacity={0.25} transparent />
      </mesh>

      {/* Monthly Stacked Volumetric Columns */}
      {points.map((pt, idx) => {
        const xPos = startX + idx * xSpacing;
        const isSelected = selectedTimelineDate === pt.date;

        // Deterministic heights from engine outputs
        const costHeight = Math.max(0.1, pt.recipeCost * heightScale);
        const contribHeight = Math.max(0.05, Math.max(0, pt.contributionPerServing) * heightScale);
        const totalHeight = costHeight + contribHeight;

        // Month short label
        const monthLabel = pt.date.substring(5, 7);

        return (
          <group key={pt.date} position={[xPos, 0, 0]}>
            {/* 1. Base Layer: Recipe Cost (Amber / Rose) */}
            <mesh
              position={[0, costHeight / 2, 0]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTimelineDate(pt.date);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <cylinderGeometry args={[0.36, 0.4, costHeight, 24]} />
              <meshStandardMaterial
                color={isSelected ? "#fb7185" : "#f43f5e"}
                roughness={0.3}
                metalness={0.15}
                emissive="#f43f5e"
                emissiveIntensity={isSelected ? 0.35 : 0.05}
              />
            </mesh>

            {/* 2. Top Layer: Gross Contribution (Emerald) stacked on top of cost */}
            <mesh
              position={[0, costHeight + contribHeight / 2, 0]}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTimelineDate(pt.date);
              }}
              onPointerOver={() => {
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                document.body.style.cursor = "auto";
              }}
            >
              <cylinderGeometry args={[0.32, 0.36, contribHeight, 24]} />
              <meshStandardMaterial
                color={isSelected ? "#34d399" : "#10b981"}
                roughness={0.25}
                metalness={0.2}
                emissive="#10b981"
                emissiveIntensity={isSelected ? 0.45 : 0.08}
              />
            </mesh>

            {/* Month Floor Plate */}
            <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.38, 0.45, 24]} />
              <meshBasicMaterial
                color={isSelected ? "#ffffff" : "#64748b"}
                opacity={isSelected ? 0.9 : 0.4}
                transparent
              />
            </mesh>

            {/* Selected Indicator Halo & Floating Metrics Billboard */}
            {isSelected && (
              <>
                <mesh position={[0, totalHeight + 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <ringGeometry args={[0.42, 0.5, 32]} />
                  <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                </mesh>
                <DataBillboard
                  position={[0, totalHeight + 0.7, 0]}
                  title={pt.date}
                  subtitle={`Cost: ${formatINR(pt.recipeCost)} • Contrib: ${formatINR(pt.contributionPerServing)}`}
                  badge={`Margin: ${pt.marginPercentage.toFixed(1)}%`}
                  color="#ffffff"
                  scale={0.7}
                />
              </>
            )}

            {/* Minimal Month Indicator Label below */}
            <DataBillboard
              position={[0, 0.05, 1.2]}
              title={`M${monthLabel}`}
              color={isSelected ? "#38bdf8" : "#94a3b8"}
              scale={0.5}
            />
          </group>
        );
      })}
    </group>
  );
}
