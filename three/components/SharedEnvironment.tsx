"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";

interface SharedEnvironmentProps {
  gridSize?: number;
}

export function SharedEnvironment({ gridSize = 22 }: SharedEnvironmentProps) {
  return (
    <>
      {/* Precision Camera Controls with Touch & Damping Optimization */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.07}
        minDistance={3}
        maxDistance={25}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
        touches={{
          ONE: 1, // ROTATE
          TWO: 2, // DOLLY_PAN
        }}
      />

      {/* Balanced Lighting Rig for Dark-Forest Palette */}
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.15}
        color="#f0fdf4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      {/* Soft Emerald Rim Light */}
      <directionalLight position={[-8, 6, -6]} intensity={0.3} color="#34d399" />

      {/* Ground Surface: Seamless Dark-Forest Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize + 10, gridSize + 10]} />
        <meshStandardMaterial color="#08140F" roughness={0.92} metalness={0.08} />
      </mesh>

      {/* Precision Grid Reference: Emerald & Forest Muted Gridlines */}
      <gridHelper
        args={[gridSize, gridSize, "#1C362A", "#0E231B"]}
        position={[0, 0.001, 0]}
      />
    </>
  );
}
