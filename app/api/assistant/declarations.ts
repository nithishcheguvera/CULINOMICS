import { FunctionDeclaration, Type } from "@google/genai";

/**
 * Gemini Function Declarations for the 7 approved deterministic financial engine tools.
 * Exposes exact parameters, descriptions, and required fields.
 */
export const GEMINI_FUNCTION_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: "getRestaurantFinancialSummary",
    description:
      "Retrieves aggregate annual revenue, ingredient cost, gross contribution, and margin % for the restaurant.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "getDishProfitability",
    description:
      "Retrieves profit, revenue, cost, margin %, and rankings for all dishes or a specific dish.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dishId: {
          type: Type.STRING,
          description: "Optional dish ID to filter for a single dish (e.g. 'truffle-tenderloin')",
        },
        sortBy: {
          type: Type.STRING,
          description:
            "Optional sorting field: 'rankByContribution', 'rankByMarginPercentage', 'totalRevenue', or 'totalVolume'",
        },
      },
    },
  },
  {
    name: "getMenuEngineeringMatrix",
    description:
      "Retrieves BCG / Kasavana-Smith Menu Engineering matrix classifications (Stars, Plowhorses, Puzzles, Dogs) and thresholds.",
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: "getIngredientInflationReport",
    description:
      "Retrieves ingredient price inflation over time, identifying major cost drivers with >= 50% price increase.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        majorDriversOnly: {
          type: Type.BOOLEAN,
          description: "If true, returns only ingredients with >= 50% price inflation",
        },
      },
    },
  },
  {
    name: "getRecipeCostBreakdown",
    description:
      "Retrieves the itemized ingredient cost breakdown for a specific dish, comparing start of year vs end of year cost components.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dishId: {
          type: Type.STRING,
          description: "The unique dish ID (e.g. 'truffle-tenderloin')",
        },
      },
      required: ["dishId"],
    },
  },
  {
    name: "getRecipeReplayHistory",
    description:
      "Retrieves month-by-month recipe cost replay and margin erosion over the 12-month timeline.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dishId: {
          type: Type.STRING,
          description: "Optional dish ID to retrieve history for a specific dish",
        },
      },
    },
  },
  {
    name: "simulateMenuSurgeryScenario",
    description:
      "Simulates the financial impact of adjusting a dish's selling price, ingredient cost, or monthly volume.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        dishId: {
          type: Type.STRING,
          description: "The unique dish ID to simulate",
        },
        targetSellingPrice: {
          type: Type.NUMBER,
          description: "Target selling price in INR",
        },
        targetIngredientCost: {
          type: Type.NUMBER,
          description: "Target ingredient cost per serving in INR",
        },
        targetMonthlyVolume: {
          type: Type.INTEGER,
          description: "Target monthly volume (non-negative integer)",
        },
      },
      required: ["dishId", "targetSellingPrice", "targetIngredientCost", "targetMonthlyVolume"],
    },
  },
  {
    name: "getProfitForecast",
    description:
      "Calculates deterministic OLS profit forecast over 3 or 6 month horizon with baseline, conservative, and optimistic scenarios.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        horizonMonths: {
          type: Type.INTEGER,
          description: "Forecast horizon: 3 or 6 months (defaults to 3)",
        },
      },
    },
  },
  {
    name: "getRecommendedCombos",
    description:
      "Generates strategic menu combos and solves linear programming product mix optimization subject to kitchen plate capacity.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        bundleDiscountPercentage: {
          type: Type.NUMBER,
          description: "Bundle discount percentage between 0 and 50 (defaults to 10)",
        },
        monthlyPlateCapacity: {
          type: Type.NUMBER,
          description: "Maximum kitchen combo plates per month (defaults to 1500)",
        },
      },
    },
  },
];
