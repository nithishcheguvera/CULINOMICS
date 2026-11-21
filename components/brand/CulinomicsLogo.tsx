"use client";

import React from "react";

export interface CulinomicsLogoProps {
  /**
   * Visual variant:
   * - "mark": Emblem only (Chef hat + Banknotes + Gold Coin)
   * - "horizontal": Emblem on left, "CULINOMICS" brand text on right
   * - "vertical": Emblem stacked above "CULINOMICS" brand text
   */
  variant?: "mark" | "horizontal" | "vertical";
  /**
   * Predefined size presets for the mark:
   * - "xs": 24px
   * - "sm": 32px
   * - "md": 40px
   * - "lg": 48px
   * - "xl": 64px
   * - "2xl": 80px
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  /**
   * Display subtitle alongside brand title (e.g. "SMART PROFIT INTELLIGENCE")
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
  xs: { dim: 26, textClass: "text-sm tracking-wider font-extrabold", subClass: "text-[8px] tracking-[0.2em]" },
  sm: { dim: 34, textClass: "text-base tracking-wider font-extrabold", subClass: "text-[9px] tracking-[0.22em]" },
  md: { dim: 42, textClass: "text-lg tracking-wider font-black", subClass: "text-[10px] tracking-[0.22em]" },
  lg: { dim: 52, textClass: "text-xl tracking-widest font-black", subClass: "text-xs tracking-[0.25em]" },
  xl: { dim: 68, textClass: "text-2xl tracking-widest font-black", subClass: "text-sm tracking-[0.25em]" },
  "2xl": { dim: 88, textClass: "text-3xl tracking-widest font-black", subClass: "text-base tracking-[0.25em]" },
};

/**
 * Pure SVG CULINOMICS Brand Mark (Chef Hat, Banknotes, Gold Coin Stack)
 * Matches the exact emblem in Screen Recordings 1 & 2.
 */
export function GoldCoinMark({ size = 42, className = "" }: { size?: number; className?: string }) {
  const idPrefix = "culinomics-gold-coin";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_2px_10px_rgba(34,197,94,0.2)] ${className}`}
      aria-label="CULINOMICS Gold Coin CL Monogram"
      role="img"
    >
      <defs>
        {/* Banknote Green Gradient */}
        <linearGradient id={`${idPrefix}-bill`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="50%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>

        {/* Outer Coin Rim Metallic Gradient */}
        <linearGradient id={`${idPrefix}-rim`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF9D2" />
          <stop offset="25%" stopColor="#F5D061" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="75%" stopColor="#A67C1E" />
          <stop offset="100%" stopColor="#785208" />
        </linearGradient>

        {/* Inner Coin Face Radial Gradient */}
        <radialGradient id={`${idPrefix}-face`} cx="42%" cy="38%" r="62%">
          <stop offset="0%" stopColor="#FFEAA7" />
          <stop offset="30%" stopColor="#DFB743" />
          <stop offset="70%" stopColor="#A87A18" />
          <stop offset="100%" stopColor="#5A3A05" />
        </radialGradient>

        {/* Monogram Surface Gradient */}
        <linearGradient id={`${idPrefix}-monogram`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="35%" stopColor="#FFF4B8" />
          <stop offset="75%" stopColor="#ECC248" />
          <stop offset="100%" stopColor="#A67814" />
        </linearGradient>

        {/* Drop Shadow & Depth */}
        <filter id={`${idPrefix}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0.6" dy="1.4" stdDeviation="0.8" floodColor="#0F1F14" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Background Banknotes (Green Currency) */}
      <g filter={`url(#${idPrefix}-shadow)`}>
        <rect
          x="14"
          y="28"
          width="40"
          height="24"
          rx="4"
          transform="rotate(-20 34 40)"
          fill={`url(#${idPrefix}-bill)`}
          stroke="#166534"
          strokeWidth="1.2"
        />
        <circle cx="28" cy="36" r="4.5" fill="#DCFCE7" opacity="0.6" />
        <rect
          x="32"
          y="18"
          width="42"
          height="24"
          rx="4"
          transform="rotate(12 53 30)"
          fill={`url(#${idPrefix}-bill)`}
          stroke="#166534"
          strokeWidth="1.2"
        />
        <circle cx="58" cy="28" r="4.5" fill="#DCFCE7" opacity="0.6" />
      </g>

      {/* Gold Coin Stack Left Accents */}
      <ellipse cx="26" cy="68" rx="14" ry="5" fill="#8C6514" stroke="#5A3E08" strokeWidth="0.8" />
      <ellipse cx="26" cy="64" rx="14" ry="5" fill="#B8861B" stroke="#5A3E08" strokeWidth="0.8" />
      <ellipse cx="26" cy="60" rx="14" ry="5" fill="#D4AF37" stroke="#5A3E08" strokeWidth="0.8" />
      <ellipse cx="26" cy="56" rx="14" ry="5" fill="#F5D061" stroke="#5A3E08" strokeWidth="0.8" />

      {/* Main Front Gold Coin */}
      <g filter={`url(#${idPrefix}-shadow)`}>
        <circle cx="58" cy="58" r="28" fill={`url(#${idPrefix}-rim)`} stroke="#6B4705" strokeWidth="1" />
        <circle
          cx="58"
          cy="58"
          r="25"
          stroke="#FFF9D2"
          strokeWidth="0.6"
          strokeDasharray="1.2 1.8"
          fill="none"
          opacity="0.8"
        />
        <circle cx="58" cy="58" r="23" fill={`url(#${idPrefix}-face)`} stroke="#4A2E03" strokeWidth="0.8" />

        {/* Central "C" and "CL" Monogram */}
        <g fill={`url(#${idPrefix}-monogram)`}>
          <path
            d="M 66 45 C 54 45 48 51 48 58 C 48 65 54 71 66 71 C 67.5 71 68.8 70.6 69.5 70.2 L 68.2 64.2 C 67.5 64.6 66.8 64.8 65.8 64.8 C 58.8 64.8 54.8 61.2 54.8 58 C 54.8 54.8 58.8 51.2 65.8 51.2 C 66.8 51.2 67.5 51.4 68.2 51.8 L 69.5 45.8 C 68.8 45.4 67.5 45 66 45 Z"
          />
        </g>
      </g>

      {/* Chef Hat atop the Emblem */}
      <g filter={`url(#${idPrefix}-shadow)`}>
        {/* Hat Puffs */}
        <path
          d="M 44 28 C 40 22 45 16 52 20 C 56 14 65 15 67 22 C 72 20 77 26 73 31 L 43 31 C 41 29 42 28 44 28 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="0.8"
        />
        {/* Hat Brim Band */}
        <rect x="43" y="30.5" width="30" height="4.5" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.6" />
        {/* Hat Creases */}
        <path d="M 54 21 L 54 28" stroke="#E2E8F0" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
        <path d="M 63 21 L 63 28" stroke="#E2E8F0" strokeWidth="0.6" strokeLinecap="round" opacity="0.7" />
      </g>
    </svg>
  );
}

/**
 * CULINOMICS Brand Logo Component
 * Matches the exact typography and emblem from Screen Recordings 1 & 2.
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
        <GoldCoinMark size={dim} className="mb-1.5" />
        <span className={`tracking-widest text-white uppercase ${textClass}`}>
          CULINOMICS
        </span>
        {showSubtitle && (
          <span className={`font-mono text-emerald-400 font-bold uppercase mt-0.5 ${subClass}`}>
            {subtitle}
          </span>
        )}
      </div>
    );
  }

  // Default: "horizontal"
  return (
    <div className={`flex items-center space-x-2.5 sm:space-x-3 select-none ${className}`}>
      <GoldCoinMark size={dim} />
      <div className="flex flex-col">
        <span className={`tracking-wider text-white uppercase leading-none font-black ${textClass}`}>
          CULINOMICS
        </span>
        {showSubtitle && (
          <span className={`font-mono text-emerald-400 font-bold uppercase leading-none mt-1 ${subClass}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default CulinomicsLogo;
