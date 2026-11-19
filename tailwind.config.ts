import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./three/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          black: "#06100C",
          surface: "#0C1A14",
          elevated: "#12241C",
          border: "#1C362A",
          borderMuted: "#142820",
        },
        gold: {
          DEFAULT: "#F59E0B",
          glow: "#FBBF24",
          dim: "#78350F",
        },
        crimson: {
          DEFAULT: "#EF4444",
          glow: "#F87171",
          dim: "#7F1D1D",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
