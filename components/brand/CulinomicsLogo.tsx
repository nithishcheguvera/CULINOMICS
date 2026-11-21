"use client";

import React from "react";

export interface CulinomicsLogoProps {
  /**
   * Visual variant:
   * - "mark": Gold coin CL monogram only
   * - "horizontal": Monogram on left, "CULINOMICS" brand text on right
   * - "vertical": Monogram stacked above "CULINOMICS" brand text
   */
  variant?: "mark" | "horizontal" | "vertical";
  /**
   * Predefined size presets for the gold coin mark:
   * - "xs": 24px
   * - "sm": 32px
   * - "md": 40px
   * - "lg": 48px
   * - "xl": 64px
   * - "2xl": 80px
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /**
   * Display subtitle alongside brand title (e.g. "3D Profit Intelligence")
   */
  showSubtitle?: boolean;
  /**
   * Custom subtitle override
   */
  subtitle?: string;
  /**
   * Additional wrapper className
   */
  className?: string;
}

const SIZE_MAP: Record<NonNullable<CulinomicsLogoProps["size"]>, { dim: number; textClass: string; subClass: string }> = {
  xs: { dim: 24, textClass: "text-sm tracking-wider", subClass: "text-[9px]" },
  sm: { dim: 32, textClass: "text-base tracking-wider", subClass: "text-[10px]" },
  md: { dim: 40, textClass: "text-lg tracking-wider", subClass: "text-[11px]" },
  lg: { dim: 48, textClass: "text-xl tracking-widest", subClass: "text-xs" },
  xl: { dim: 64, textClass: "text-2xl tracking-widest", subClass: "text-sm" },
  "2xl": { dim: 80, textClass: "text-3xl tracking-widest", subClass: "text-base" },
};

/**
 * Pure SVG Gold Coin Monogram with metallic gradients and embossed "CL" glyph.
 * Zero external image dependencies, high DPI vector fidelity.
 */
export function GoldCoinMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  // Unique gradient IDs based on React useId would be ideal, or deterministic prefix
  const idPrefix = "culinomics-gold-coin";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_2px_8px_rgba(212,175,55,0.25)] ${className}`}
      aria-label="CULINOMICS Gold Coin CL Monogram"
      role="img"
    >
      <defs>
        {/* Outer Coin Rim Metallic Gradient */}
        <linearGradient id={`${idPrefix}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D2" />
          <stop offset="20%" stopColor="#F5D061" />
          <stop offset="45%" stopColor="#D4AF37" />
          <stop offset="70%" stopColor="#A67C1E" />
          <stop offset="90%" stopColor="#785208" />
          <stop offset="100%" stopColor="#F5D061" />
        </linearGradient>

        {/* Inner Coin Face Radial Gradient */}
        <radialGradient id={`${idPrefix}-face`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFEAA7" />
          <stop offset="25%" stopColor="#DFB743" />
          <stop offset="65%" stopColor="#A87A18" />
          <stop offset="90%" stopColor="#6C4A0A" />
          <stop offset="100%" stopColor="#452C04" />
        </radialGradient>

        {/* Monogram Surface Gradient */}
        <linearGradient id={`${idPrefix}-monogram`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#FFF2B8" />
          <stop offset="55%" stopColor="#ECC248" />
          <stop offset="85%" stopColor="#BD8B1B" />
          <stop offset="100%" stopColor="#875E0A" />
        </linearGradient>

        {/* Emboss / Chiseled Shadow */}
        <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.7" dy="1.4" stdDeviation="0.8" floodColor="#1F1202" floodOpacity="0.85" />
          <feDropShadow dx="-0.4" dy="-0.4" stdDeviation="0.4" floodColor="#FFF9D2" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Outer Coin Border & Rim */}
      <circle cx="50" cy="50" r="48" fill={`url(#${idPrefix}-rim)`} />
      <circle cx="50" cy="50" r="44" stroke="#785208" strokeWidth="0.8" fill="none" opacity="0.7" />

      {/* Decorative Beaded Coin Rim (Milled Edge Ring) */}
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="#FFF9D2"
        strokeWidth="0.7"
        strokeDasharray="1.2 1.8"
        fill="none"
        opacity="0.65"
      />

      {/* Inner Recessed Coin Field */}
      <circle cx="50" cy="50" r="39" fill={`url(#${idPrefix}-face)`} />
      <circle cx="50" cy="50" r="39" stroke="#3D2502" strokeWidth="1" fill="none" opacity="0.6" />

      {/* Concentric Decorative Filigree Ring */}
      <circle cx="50" cy="50" r="34" stroke="#DFB743" strokeWidth="0.5" strokeDasharray="3 2" fill="none" opacity="0.4" />

      {/* Central "CL" Monogram */}
      <g filter={`url(#${idPrefix}-shadow)`} fill={`url(#${idPrefix}-monogram)`}>
        {/* Letter C (Stylized Architectural Arch) */}
        <path
          d="M 43 31.5 C 31 31.5 22.5 39.5 22.5 50 C 22.5 60.5 31 68.5 43 68.5 C 44.5 68.5 45.8 68.2 46.5 67.8 L 45.2 60.8 C 44.5 61.2 43.6 61.5 42.5 61.5 C 35.5 61.5 30.5 56.5 30.5 50 C 30.5 43.5 35.5 38.5 42.5 38.5 C 43.6 38.5 44.5 38.8 45.2 39.2 L 46.5 32.2 C 45.8 31.8 44.5 31.5 43 31.5 Z"
        />
        {/* Letter L (Balanced Geometric Foot) */}
        <path
          d="M 48 31.5 L 56 31.5 L 56 61.5 L 75.5 61.5 L 75.5 68.5 L 48 68.5 Z"
        />
      </g>

      {/* Subtle Micro Star Accents for Premium Mint Quality */}
      <circle cx="50" cy="23" r="1" fill="#FFF9D2" opacity="0.75" />
      <circle cx="50" cy="77" r="1" fill="#FFF9D2" opacity="0.75" />
    </svg>
  );
}

/**
 * CULINOMICS Brand Logo Component
 * Combines the Gold Coin CL Monogram with the authoritative CULINOMICS logotype.
 */
export function CulinomicsLogo({
  variant = "horizontal",
  size = "md",
  showSubtitle = true,
  subtitle = "3D Profit Intelligence Cockpit",
  className = "",
}: CulinomicsLogoProps) {
  const { dim, textClass, subClass } = SIZE_MAP[size];

  if (variant === "mark") {
    return <GoldCoinMark size={dim} className={className} />;
  }

  if (variant === "vertical") {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <GoldCoinMark size={dim} className="mb-2" />
        <span className={`font-black tracking-widest text-white uppercase ${textClass}`}>
          CULINOMICS
        </span>
        {showSubtitle && (
          <span className={`font-mono text-emerald-400 font-semibold tracking-wider mt-0.5 ${subClass}`}>
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Default: "horizontal"
  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      <GoldCoinMark size={dim} />
      <div className="flex flex-col">
        <span className={`font-extrabold tracking-widest text-white uppercase leading-tight ${textClass}`}>
          CULINOMICS
        </span>
        {showSubtitle && (
          <span className={`font-medium text-neutral-400 tracking-normal leading-tight hidden sm:block ${subClass}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default CulinomicsLogo;
