"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useAppStore } from "@/store/useAppStore";
import { MenuEngineeringCategory } from "@/engine";

interface DishPedestalProps {
  dishId: string;
  dishName: string;
  category: MenuEngineeringCategory;
  position: [number, number, number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function DishPedestal({ dishId, category, position, isSelected, onSelect }: DishPedestalProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Category palette (neutral tone with subtle accent)
  const categoryColors: Record<MenuEngineeringCategory, string> = {
    STAR: "#f59e0b",      // Amber
    PLOWHORSE: "#3b82f6", // Blue
    PUZZLE: "#a855f7",    // Purple
    DOG: "#f43f5e",       // Rose
  };

  const baseColor = categoryColors[category] || "#9ca3af";

  useFrame((_, delta) => {
    if (isSelected && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Base Pedestal */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect(dishId);
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "auto";
        }}
        position={[0, isSelected ? 0.4 : 0.25, 0]}
      >
        <cylinderGeometry args={[0.4, 0.45, isSelected ? 0.8 : 0.5, 32]} />
        <meshStandardMaterial
          color={isSelected ? baseColor : "#262626"}
          roughness={0.3}
          metalness={0.2}
          emissive={isSelected ? baseColor : "#000000"}
          emissiveIntensity={isSelected ? 0.35 : 0}
        />
      </mesh>

      {/* Floating Accent Ring when Selected */}
      {isSelected && (
        <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.48, 0.54, 32]} />
          <meshBasicMaterial color={baseColor} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Ground Projection Shadow Base */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[0.5, 32]} />
        <meshBasicMaterial color="#171717" opacity={0.6} transparent />
      </mesh>
    </group>
  );
}

export function SceneContent() {
  const { menuEngineering, selectedDishId, setSelectedDishId } = useAppStore();
  const dishes = menuEngineering?.dishes ?? [];

  // Arrange the dishes in a clean, equidistant circular pedestal layout
  const radius = 3.2;

  return (
    <>
      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={16}
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={0.2}
      />

      {/* Lighting Rig */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[6, 9, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={25}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <directionalLight position={[-6, 4, -5]} intensity={0.3} color="#93c5fd" />

      {/* Neutral Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#141414" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Precision Grid Reference Surface */}
      <gridHelper args={[16, 16, "#525252", "#262626"]} position={[0, 0.002, 0]} />

      {/* Central Reference Marker */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 32]} />
        <meshStandardMaterial color="#1f1f1f" roughness={0.5} />
      </mesh>

      {/* Dish Pedestals reading from Store */}
      {dishes.map((dish, idx) => {
        const angle = (idx / dishes.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const isSelected = dish.dishId === selectedDishId;

        return (
          <DishPedestal
            key={dish.dishId}
            dishId={dish.dishId}
            dishName={dish.dishName}
            category={dish.category}
            position={[x, 0, z]}
            isSelected={isSelected}
            onSelect={setSelectedDishId}
          />
        );
      })}
    </>
  );
}
