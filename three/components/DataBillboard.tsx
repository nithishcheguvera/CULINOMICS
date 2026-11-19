"use client";

import React from "react";
import { Billboard, Text } from "@react-three/drei";

interface DataBillboardProps {
  position: [number, number, number];
  title: string;
  subtitle?: string;
  badge?: string;
  color?: string;
  scale?: number;
}

export function DataBillboard({
  position,
  title,
  subtitle,
  badge,
  color = "#ffffff",
  scale = 1,
}: DataBillboardProps) {
  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      <group scale={[scale, scale, scale]}>
        {/* Main Title Label */}
        <Text
          fontSize={0.22}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {title}
        </Text>

        {/* Optional Subtitle / Metrics */}
        {subtitle && (
          <Text
            position={[0, -0.22, 0]}
            fontSize={0.16}
            color="#d4d4d8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {subtitle}
          </Text>
        )}

        {/* Optional Category / Badge */}
        {badge && (
          <Text
            position={[0, 0.22, 0]}
            fontSize={0.14}
            color="#fbbf24"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {badge}
          </Text>
        )}
      </group>
    </Billboard>
  );
}
