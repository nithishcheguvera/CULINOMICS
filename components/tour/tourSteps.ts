import { DashboardTab, ThreeVisualizationMode } from "@/store/useAppStore";

export interface TourStep {
  id: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  targetSelector: string;
  explanation: string;
  requiredTab?: DashboardTab;
  requiredDishId?: string;
  requiredThreeMode?: ThreeVisualizationMode;
  preferredPlacement?: "top" | "bottom" | "left" | "right";
  actionLabel?: string;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    stepNumber: 1,
    totalSteps: 12,
    title: "Welcome to CULINOMICS",
    targetSelector: "#cockpit-header-brand",
    explanation:
      "Welcome to CULINOMICS — a 3D Profit Intelligence & Margin Engineering Cockpit. Most restaurants track top-line sales, but fail to see which dishes actually generate cash profit. CULINOMICS bridges the gap using deterministic financial math.",
    preferredPlacement: "bottom",
  },
  {
    id: "navigation",
    stepNumber: 2,
    totalSteps: 12,
    title: "Cockpit Navigation Hub",
    targetSelector: "#cockpit-nav-tabs",
    explanation:
      "The Cockpit organizes your analytics into 10 specialized modules: from high-level Overview and 3D Visualizations to Menu Surgery and Executive Reports. Use these tabs to jump between financial perspectives.",
    preferredPlacement: "bottom",
  },
  {
    id: "kpis",
    stepNumber: 3,
    totalSteps: 12,
    title: "Monthly Financial Runway KPIs",
    targetSelector: "#monthly-kpi-cards",
    explanation:
      "Track verified monthly runway: Gross Revenue, Ingredient Food Cost, Gross Contribution Margin, and Active Dishes. In December 2025, CULINOMICS achieved ₹13,44,800 revenue with a 65.6% contribution margin.",
    preferredPlacement: "bottom",
  },
  {
    id: "landscape",
    stepNumber: 4,
    totalSteps: 12,
    title: "3D Profitability Landscape",
    targetSelector: "#scene-stage-container",
    requiredTab: "all",
    explanation:
      "The 3D Stage visualizes your entire menu at once. Each pillar represents a dish: X-axis is Popularity (units sold), Z-axis is Contribution Margin (₹), and Y-axis is Total Revenue. Color coding reveals BCG classifications: Emerald for Stars, Amber for Plowhorses, Violet for Puzzles, and Crimson for Dogs.",
    preferredPlacement: "right",
  },
  {
    id: "dish-inspector",
    stepNumber: 5,
    totalSteps: 12,
    title: "Live Dish Inspector & Waterfall",
    targetSelector: "#dish-inspector-card",
    requiredTab: "all",
    requiredDishId: "truffle-tenderloin",
    explanation:
      "Selecting any dish updates the Live Dish Inspector with its exact unit economics: selling price, ingredient cost breakdown, margin percentage, and 3D financial waterfall.",
    preferredPlacement: "left",
  },
  {
    id: "recipe-replay",
    stepNumber: 6,
    totalSteps: 12,
    title: "Recipe Replay & Inflation Runway",
    targetSelector: "#compact-recipe-replay",
    requiredTab: "all",
    explanation:
      "Recipe Replay is our signature feature. It replays ingredient supplier inflation over 12 months, exposing how rising ingredient prices silently erode dish profit margins even when menu prices stay flat.",
    preferredPlacement: "top",
  },
  {
    id: "menu-surgery",
    stepNumber: 7,
    totalSteps: 12,
    title: "Menu Surgery Simulator",
    targetSelector: "#compact-menu-surgery",
    requiredTab: "all",
    explanation:
      "Menu Surgery lets you model 'what-if' interventions: adjust selling price, reformulate ingredient cost, or simulate volume elasticity. All simulations run on verified engine math with live 3D feedback.",
    preferredPlacement: "top",
  },
  {
    id: "inflation-explorer",
    stepNumber: 8,
    totalSteps: 12,
    title: "3D Ingredient Inflation Explorer",
    targetSelector: "#scene-stage-container",
    requiredTab: "all",
    requiredThreeMode: "ingredient-inflation",
    explanation:
      "Audit ingredient price volatility across all supplier purchase records. Dishes with high portions of volatile ingredients (like truffle oil or Parmigiano-Reggiano) show steep margin compression.",
    preferredPlacement: "right",
  },
  {
    id: "ai-copilot",
    stepNumber: 9,
    totalSteps: 12,
    title: "Context-Aware AI Copilot",
    targetSelector: "#cockpit-ai-copilot",
    requiredTab: "all",
    explanation:
      "Our AI Copilot explains financial decisions using engine tools. It can never invent or hallucinate numbers; every figure cited originates from verified TypeScript calculations. In offline mode, deterministic fallbacks keep it 100% operational.",
    preferredPlacement: "top",
  },
  {
    id: "forecast",
    stepNumber: 10,
    totalSteps: 12,
    title: "Deterministic Profit Forecast",
    targetSelector: "#profit-forecast",
    requiredTab: "forecast",
    explanation:
      "Forecast future monthly revenue and margin over a 3-to-6 month horizon using Ordinary Least Squares (OLS) linear trend extrapolation with 80% prediction intervals across Baseline, Optimistic, and Conservative scenarios.",
    preferredPlacement: "top",
  },
  {
    id: "optimizer",
    stepNumber: 11,
    totalSteps: 12,
    title: "Menu Combo Optimizer",
    targetSelector: "#combo-optimizer",
    requiredTab: "optimizer",
    explanation:
      "The Combo Optimizer applies Mixed-Integer Linear Programming (MIP) to identify high-margin multi-course pairings (e.g. Star + Puzzle) that maximize total contribution subject to kitchen plate capacity limits.",
    preferredPlacement: "top",
  },
  {
    id: "report",
    stepNumber: 12,
    totalSteps: 12,
    title: "Executive Reports & Exports",
    targetSelector: "#executive-report",
    requiredTab: "report",
    explanation:
      "Export boardroom-ready financial summaries via RFC 4180 compliant CSVs or print vector-perfect executive reports with a single click. You are now ready to take full command of CULINOMICS!",
    preferredPlacement: "top",
    actionLabel: "Finish Tour",
  },
];
