"use client";

import React from "react";
import { OrbitControls } from "@react-three/drei";

interface SharedEnvironmentProps {
  gridSize?: number;
}

export function SharedEnvironment({ gridSize = 20 }: SharedEnvironmentProps) {
  return (
    <>
      {/* Precision Camera Controls */}
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        minDistance={3}
        maxDistance={25}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
      />

      {/* Lighting Rig */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      <directionalLight position={[-8, 6, -6]} intensity={0.35} color="#93c5fd" />

      {/* Ground Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[gridSize + 10, gridSize + 10]} />
        <meshStandardMaterial color="#111111" roughness={0.85} metalness={0.1} />
      </mesh>

      {/* Precision Grid Reference */}
      <gridHelper
        args={[gridSize, gridSize, "#525252", "#262626"]}
        position={[0, 0.001, 0]}
      />
    </>
  );
}
