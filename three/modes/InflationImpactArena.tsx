"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useAppStore, formatINR } from "@/store/useAppStore";
import { InflationImpactDish } from "@/engine";
import { DataBillboard } from "../components/DataBillboard";

interface DishPairProps {
  dish: InflationImpactDish;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string) => void;
  heightScale: number;
}

function DishPair({ dish, position, isSelected, onSelect, heightScale }: DishPairProps) {
  const beaconRef = useRef<THREE.Mesh>(null);

  const startHeight = Math.max(0.2, dish.startCost * heightScale);
  const endHeight = Math.max(0.2, dish.endCost * heightScale);

  const isHurt = dish.isInflationHurt;

  useFrame(({ clock }) => {
    if (isHurt && beaconRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
      beaconRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group
      position={position}
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
      {/* 1. Left Cylinder: January Start Cost */}
      <group position={[-0.45, 0, 0]}>
        <mesh position={[0, startHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.36, startHeight, 24]} />
          <meshStandardMaterial
            color={isSelected ? "#38bdf8" : "#0284c7"}
            roughness={0.3}
            metalness={0.2}
            emissive="#0284c7"
            emissiveIntensity={isSelected ? 0.35 : 0.08}
          />
        </mesh>
        <DataBillboard
          position={[0, 0.04, 0.65]}
          title="Jan"
          subtitle={formatINR(dish.startCost)}
          color="#38bdf8"
          scale={0.45}
        />
      </group>

      {/* 2. Right Cylinder: December Inflated End Cost */}
      <group position={[0.45, 0, 0]}>
        <mesh position={[0, endHeight / 2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.36, endHeight, 24]} />
          <meshStandardMaterial
            color={isHurt ? "#f43f5e" : "#f59e0b"}
            roughness={0.3}
            metalness={0.2}
            emissive={isHurt ? "#f43f5e" : "#f59e0b"}
            emissiveIntensity={isHurt ? 0.5 : 0.15}
          />
        </mesh>
        <DataBillboard
          position={[0, 0.04, 0.65]}
          title="Dec"
          subtitle={formatINR(dish.endCost)}
          color={isHurt ? "#f43f5e" : "#f59e0b"}
          scale={0.45}
        />
      </group>

      {/* 3. Red Cost Surge Bridge */}
      <mesh position={[0, (startHeight + endHeight) / 4, 0]} rotation={[0, 0, 0.15]}>
        <boxGeometry args={[0.8, 0.08, 0.15]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
      </mesh>

      {/* 4. Warning Beacon if Inflation Hurt */}
      {isHurt && (
        <mesh
          ref={beaconRef}
          position={[0.45, endHeight + 0.3, 0]}
        >
          <sphereGeometry args={[0.14, 16, 16]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={0.8} />
        </mesh>
      )}

      {/* 5. Dish Header & Metrics Billboard */}
      <DataBillboard
        position={[0, Math.max(startHeight, endHeight) + 0.85, 0]}
        title={dish.dishName}
        subtitle={`Cost: +${dish.costIncreasePercentage.toFixed(1)}% • Margin lost: -${dish.marginErosionPercentage.toFixed(1)}%`}
        badge={isHurt ? "⚠️ INFLATION HURT" : undefined}
        color={isSelected ? "#ffffff" : "#e2e8f0"}
        scale={0.7}
      />
    </group>
  );
}

export function InflationImpactArena() {
  const { inflationImpact, selectedDishId, setSelectedDishId } = useAppStore();

  if (inflationImpact.length === 0) {
    return null;
  }

  const count = inflationImpact.length;
  const xSpacing = 2.4;
  const startX = -((count - 1) * xSpacing) / 2;

  // Max cost across start and end costs to scale height cleanly to ~3 units
  const maxCost = Math.max(
    ...inflationImpact.map((d) => Math.max(d.startCost, d.endCost)),
    1
  );
  const heightScale = 2.8 / maxCost;

  return (
    <group position={[0, 0, 0]}>
      {/* Title Header */}
      <DataBillboard
        position={[0, 4.6, -1.8]}
        title="Inflation Impact Arena"
        subtitle="January Baseline vs December Inflation-Adjusted Dish Costs"
        badge="MARGIN EROSION"
        color="#f43f5e"
        scale={0.9}
      />

      {/* Ground Arena Surface */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[count * xSpacing + 1.6, 4.2]} />
        <meshBasicMaterial color="#1c1917" opacity={0.35} transparent />
      </mesh>

      {/* Render Dual-Column Dish Pairs */}
      {inflationImpact.map((dish, idx) => {
        const xPos = startX + idx * xSpacing;
        const isSelected = dish.dishId === selectedDishId;

        return (
          <DishPair
            key={dish.dishId}
            dish={dish}
            position={[xPos, 0, 0]}
            isSelected={isSelected}
            onSelect={setSelectedDishId}
            heightScale={heightScale}
          />
        );
      })}
    </group>
  );
}
