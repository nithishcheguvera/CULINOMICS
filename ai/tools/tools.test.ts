import { describe, it, expect } from "vitest";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import {
  ValidatedStoryDatasetSchema,
  executeToolByName,
  createAuthoritativeFact,
  CANONICAL_TOOL_PROVENANCE,
  VisualizationActionSchema,
  ToolExecutionContext,
} from "./index";

const canonicalDataset = loadStoryDatasetFromDisk();

const validContext: ToolExecutionContext = {
  dataset: canonicalDataset,
  datasetMode: "demo",
  selectedDishId: "truffle-tenderloin",
  selectedTimelineDate: "2025-12-01",
};

describe("AI Tools - Custom Dataset Validation Contract", () => {
  it("successfully validates the canonical story dataset", () => {
    const result = ValidatedStoryDatasetSchema.safeParse(canonicalDataset);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate dish IDs in menu", () => {
    const malformed = {
      ...canonicalDataset,
      menu: [
        ...canonicalDataset.menu,
        {
          id: "margherita-pizza", // duplicate
          name: "Duplicate Pizza",
          category: "Main" as const,
          basePrice: 500,
          currency: "INR" as const,
        },
      ],
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Duplicate dish ID 'margherita-pizza'");
    }
  });

  it("rejects invalid, negative, or non-finite ingredient prices", () => {
    const malformed = {
      ...canonicalDataset,
      ingredientPrices: [
        ...canonicalDataset.ingredientPrices.slice(1),
        {
          date: "2025-01-01",
          ingredientId: "flour",
          ingredientName: "Flour",
          price: -50.0, // negative price
          currency: "INR" as const,
          unit: "kg" as const,
        },
      ],
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });

  it("rejects inconsistent pricing units for the same ingredient across dates", () => {
    const malformed = {
      ...canonicalDataset,
      ingredientPrices: [
        ...canonicalDataset.ingredientPrices,
        {
          date: "2025-06-01",
          ingredientId: "truffle-oil",
          ingredientName: "White Truffle Infused Oil",
          price: 5000,
          currency: "INR" as const,
          unit: "kg" as const, // was 'l' in canonical dataset
        },
      ],
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes("Inconsistent pricing unit"));
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("truffle-oil");
    }
  });

  it("rejects duplicate recipe components for the same dish and ingredient", () => {
    const malformed = {
      ...canonicalDataset,
      recipes: [
        ...canonicalDataset.recipes,
        {
          dishId: "margherita-pizza",
          dishName: "Handcrafted Margherita Pizza",
          ingredientId: "pizza-flour", // duplicate pizza-flour component
          ingredientName: "Pizza Flour (Tipo 00)",
          quantity: 0.1,
          unit: "kg" as const,
        },
      ],
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes("Duplicate ingredient component"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects duplicate sales transactions for the same dish and date", () => {
    const malformed = {
      ...canonicalDataset,
      sales: [
        ...canonicalDataset.sales,
        {
          date: "2025-01-01",
          dishId: "margherita-pizza",
          dishName: "Handcrafted Margherita Pizza",
          quantity: 50,
          sellingPrice: 540,
          currency: "INR" as const,
        },
      ],
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes("Duplicate sales record"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects recipe components with incompatible measurement units", () => {
    const malformed = {
      ...canonicalDataset,
      recipes: canonicalDataset.recipes.map((r) =>
        r.dishId === "margherita-pizza" && r.ingredientId === "pizza-flour"
          ? { ...r, unit: "l" as const } // pizza-flour is priced in kg, cannot convert l without density
          : r
      ),
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.message.includes("Incompatible units"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects missing historical price coverage when a dish is sold on an unpriced date", () => {
    // Filter out prices for truffle-oil on 2025-05-01
    const malformed = {
      ...canonicalDataset,
      ingredientPrices: canonicalDataset.ingredientPrices.filter(
        (p) => !(p.ingredientId === "truffle-oil" && p.date === "2025-05-01")
      ),
    };
    const result = ValidatedStoryDatasetSchema.safeParse(malformed);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) =>
        i.message.includes("Missing historical price coverage")
      );
      expect(issue).toBeDefined();
      expect(issue?.message).toContain("truffle-oil");
      expect(issue?.message).toContain("2025-05-01");
    }
  });
});

describe("AI Tools - Authoritative Fact Factory & Internal Provenance", () => {
  it("creates authoritative facts with internally enforced sourceFunction and sourceTool", () => {
    const fact = createAuthoritativeFact({
      id: "test-dish-profitability",
      entityType: "dish",
      entityId: "truffle-tenderloin",
      entityName: "Truffle Butter Tenderloin Steak",
      metric: "contributionMarginPercentage",
      label: "Contribution Margin",
      rawValue: 38.6588,
      unit: "%",
      sourceTool: "getDishProfitability",
      datasetMode: "demo",
    });

    expect(fact.rawNumericValue).toBe(38.6588); // exact unrounded value preserved
    expect(fact.formattedValue).toBe("38.7%");
    expect(fact.sourceTool).toBe("getDishProfitability");
    expect(fact.sourceFunction).toBe(CANONICAL_TOOL_PROVENANCE.getDishProfitability.sourceFunction);
    expect(fact.verificationStatus).toBe("VERIFIED_ENGINE_CALCULATION");
  });

  it("strictly rejects non-finite numeric values (NaN, Infinity)", () => {
    expect(() =>
      createAuthoritativeFact({
        id: "invalid-fact-nan",
        entityType: "dish",
        entityId: "test-dish",
        entityName: "Test Dish",
        metric: "margin",
        label: "Margin",
        rawValue: NaN,
        unit: "%",
        sourceTool: "getDishProfitability",
        datasetMode: "demo",
      })
    ).toThrowError(/Non-finite metric/);

    expect(() =>
      createAuthoritativeFact({
        id: "invalid-fact-infinity",
        entityType: "dish",
        entityId: "test-dish",
        entityName: "Test Dish",
        metric: "margin",
        label: "Margin",
        rawValue: Infinity,
        unit: "%",
        sourceTool: "getDishProfitability",
        datasetMode: "demo",
      })
    ).toThrowError(/Non-finite metric/);
  });
});

describe("AI Tools - Typed Dispatcher & Engine Execution", () => {
  it("executes getRestaurantFinancialSummary and returns verified annual KPIs", () => {
    const result = executeToolByName("getRestaurantFinancialSummary", {}, validContext);

    expect(result.authoritativeFacts.length).toBeGreaterThanOrEqual(4);
    const revenueFact = result.authoritativeFacts.find((f) => f.metric === "annualRevenue");
    expect(revenueFact).toBeDefined();
    expect(revenueFact?.rawNumericValue).toBeGreaterThan(1000000);
    expect(revenueFact?.sourceTool).toBe("getRestaurantFinancialSummary");
    expect(revenueFact?.sourceFunction).toBe("calculateAnnualKpis");
  });

  it("executes getDishProfitability for a specific dish and validates unrounded metrics", () => {
    const result = executeToolByName(
      "getDishProfitability",
      { dishId: "truffle-tenderloin" },
      validContext
    );

    const marginFact = result.authoritativeFacts.find(
      (f) => f.metric === "contributionMarginPercentage"
    );
    expect(marginFact).toBeDefined();
    expect(marginFact?.rawNumericValue).toBeGreaterThan(0);
    expect(result.summaryForGemini.dishId).toBe("truffle-tenderloin");
    expect(result.completeness.isComplete).toBe(true);
  });

  it("throws a descriptive error when getDishProfitability is given an unknown dishId", () => {
    expect(() =>
      executeToolByName(
        "getDishProfitability",
        { dishId: "non-existent-caviar" },
        validContext
      )
    ).toThrowError(/not found in dataset/);
  });

  it("executes getMenuEngineeringMatrix and returns four quadrant classifications", () => {
    const result = executeToolByName("getMenuEngineeringMatrix", {}, validContext);

    expect(result.authoritativeFacts.length).toBeGreaterThanOrEqual(2);
    expect(result.summaryForGemini.categoryCounts).toBeDefined();
    const dishes = result.summaryForGemini.dishes as Array<{ dishId: string; category: string }>;
    const pizza = dishes.find((d) => d.dishId === "margherita-pizza");
    expect(pizza?.category).toBe("STAR");
  });

  it("executes getIngredientInflationReport and correctly identifies major drivers (>= 50%)", () => {
    const result = executeToolByName(
      "getIngredientInflationReport",
      { onlyMajorDrivers: true },
      validContext
    );

    expect(result.authoritativeFacts.length).toBeGreaterThan(0);
    const topIngredients = result.summaryForGemini.topInflationIngredients as Array<{
      ingredientId: string;
      percentageSurge: number;
    }>;
    expect(topIngredients.some((i) => i.ingredientId === "truffle-oil")).toBe(true);
  });

  it("executes getRecipeCostBreakdown and confirms reconciliation with recipe replay", () => {
    const result = executeToolByName(
      "getRecipeCostBreakdown",
      { dishId: "truffle-tenderloin", date: "2025-01-01" },
      validContext
    );

    const totalCostFact = result.authoritativeFacts.find((f) => f.metric === "totalRecipeCost");
    expect(totalCostFact).toBeDefined();
    expect(totalCostFact?.rawNumericValue).toBeCloseTo(335.12, 1);
    expect(totalCostFact?.reconciliationCheck).toContain("Reconciled with Recipe Replay");
  });

  it("executes getRecipeReplayHistory and computes 12-month margin erosion", () => {
    const result = executeToolByName(
      "getRecipeReplayHistory",
      { dishId: "truffle-tenderloin" },
      validContext
    );

    const erosionFact = result.authoritativeFacts.find((f) => f.metric === "netMarginErosion");
    expect(erosionFact).toBeDefined();
    expect(erosionFact?.rawNumericValue).toBeGreaterThan(20); // > 20% margin erosion
  });

  it("executes simulateMenuSurgeryScenario and computes projected metrics", () => {
    const result = executeToolByName(
      "simulateMenuSurgeryScenario",
      { dishId: "truffle-tenderloin", targetSellingPrice: 1100 },
      validContext
    );

    const simContribFact = result.authoritativeFacts.find(
      (f) => f.metric === "monthlyContribution"
    );
    expect(simContribFact).toBeDefined();
    expect(simContribFact?.rawNumericValue).toBeGreaterThan(0);
  });

  it("executes getProfitForecast and returns verified deterministic projection facts", () => {
    const result = executeToolByName(
      "getProfitForecast",
      { horizonMonths: 3 },
      validContext
    );

    expect(result.completeness.isComplete).toBe(true);
    const revFact = result.authoritativeFacts.find((f) => f.metric === "projectedRevenue");
    const profitFact = result.authoritativeFacts.find((f) => f.metric === "projectedGrossProfit");
    const marginFact = result.authoritativeFacts.find((f) => f.metric === "overallMarginPercentage");

    expect(revFact).toBeDefined();
    expect(revFact?.rawNumericValue).toBeGreaterThan(0);
    expect(profitFact).toBeDefined();
    expect(profitFact?.rawNumericValue).toBeGreaterThan(0);
    expect(marginFact).toBeDefined();
    expect(marginFact?.rawNumericValue).toBeGreaterThan(0);
  });

  it("executes getRecommendedCombos and returns solved LP mix facts", () => {
    const result = executeToolByName(
      "getRecommendedCombos",
      { bundleDiscountPercentage: 10, monthlyPlateCapacity: 1500 },
      validContext
    );

    expect(result.completeness.isComplete).toBe(true);
    const objFact = result.authoritativeFacts.find((f) => f.metric === "monthlyContribution");
    const platesFact = result.authoritativeFacts.find((f) => f.metric === "totalSalesVolume");

    expect(objFact).toBeDefined();
    expect(objFact?.rawNumericValue).toBeGreaterThan(0);
    expect(platesFact).toBeDefined();
    expect(platesFact?.rawNumericValue).toBeLessThanOrEqual(1500);
  });

  it("strictly rejects unapproved tool names to prevent arbitrary function execution", () => {
    expect(() =>
      executeToolByName("execArbitraryShellCode", {}, validContext)
    ).toThrowError(/Security Violation: Tool 'execArbitraryShellCode' is not in the approved allowlist/);

    expect(() =>
      executeToolByName("dropDatabase", {}, validContext)
    ).toThrowError(/Security Violation: Tool 'dropDatabase' is not in the approved allowlist/);
  });
});

describe("AI Tools - Visualization Action Schema", () => {
  it("validates approved SET_ACTIVE_TAB action", () => {
    const valid = {
      actionType: "SET_ACTIVE_TAB",
      tab: "explorer3d",
      dishId: "truffle-tenderloin",
      label: "Inspect in 3D Explorer",
    };
    expect(VisualizationActionSchema.safeParse(valid).success).toBe(true);
  });

  it("validates approved SET_THREE_MODE action", () => {
    const valid = {
      actionType: "SET_THREE_MODE",
      threeMode: "ingredient-inflation",
      dishId: "truffle-tenderloin",
      timelineDate: "2025-12-01",
      label: "View in 3D Inflation Explorer",
    };
    expect(VisualizationActionSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unauthorized tab names or 3D modes", () => {
    const invalidTab = {
      actionType: "SET_ACTIVE_TAB",
      tab: "unauthorizedAdminTab",
      label: "Go to Admin",
    };
    expect(VisualizationActionSchema.safeParse(invalidTab).success).toBe(false);

    const invalid3DMode = {
      actionType: "SET_THREE_MODE",
      threeMode: "unsupportedVirtualRealityMode",
      label: "Go to VR",
    };
    expect(VisualizationActionSchema.safeParse(invalid3DMode).success).toBe(false);
  });
});
