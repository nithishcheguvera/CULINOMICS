import { describe, it, expect } from "vitest";
import {
  simulateDishScenario,
  createInitialScenarioForDish,
  validateSimulationScenario,
  DishSimulationScenario,
} from "./simulator";
import { DishProfitability, MenuEngineeringResult } from "./types";

describe("Stage 7: Menu Surgery Simulator Engine", () => {
  // Mock verified baseline dish profitability (derived from canonical engine)
  const mockDishProfitability: DishProfitability[] = [
    {
      dishId: "truffle-tenderloin",
      dishName: "Truffle Butter Tenderloin Steak",
      totalVolume: 2640,
      totalRevenue: 2587200,
      totalIngredientCost: 1113264,
      totalContribution: 1473936,
      unitSellingPrice: 980,
      unitIngredientCost: 421.6909090909091,
      contributionPerServing: 558.3090909090909,
      contributionMarginPercentage: 56.97031539888682,
      rankByContribution: 1,
      rankByMarginPercentage: 2,
    },
    {
      dishId: "plowhorse-pasta",
      dishName: "House Bolognese Pasta",
      totalVolume: 3600,
      totalRevenue: 1800000,
      totalIngredientCost: 1260000,
      totalContribution: 540000,
      unitSellingPrice: 500,
      unitIngredientCost: 350,
      contributionPerServing: 150,
      contributionMarginPercentage: 30,
      rankByContribution: 2,
      rankByMarginPercentage: 4,
    },
  ];

  const mockMenuEngineering: MenuEngineeringResult = {
    popularityThreshold: 250, // Average monthly volume across dishes
    profitabilityThreshold: 300, // Average contribution margin per serving across dishes
    weightedProfitabilityThreshold: 320,
    dishes: [
      {
        dishId: "truffle-tenderloin",
        dishName: "Truffle Butter Tenderloin Steak",
        averageMonthlyVolume: 220, // Low volume (< 250) -> Puzzle
        averageContributionMargin: 558.3090909090909, // High margin (>= 300)
        isHighPopularity: false,
        isHighProfitability: true,
        category: "PUZZLE",
      },
      {
        dishId: "plowhorse-pasta",
        dishName: "House Bolognese Pasta",
        averageMonthlyVolume: 300, // High volume (>= 250) -> Plowhorse
        averageContributionMargin: 150, // Low margin (< 300)
        isHighPopularity: true,
        isHighProfitability: false,
        category: "PLOWHORSE",
      },
    ],
    categoryCounts: { stars: 0, plowhorses: 1, puzzles: 1, dogs: 0 },
  };

  describe("Validation & Initial Scenario Creation", () => {
    it("creates initial scenario accurately from ground truth baseline", () => {
      const scenario = createInitialScenarioForDish(
        "truffle-tenderloin",
        mockDishProfitability,
        mockMenuEngineering,
        12
      );

      expect(scenario.dishId).toBe("truffle-tenderloin");
      expect(scenario.targetSellingPrice).toBe(980);
      expect(scenario.targetIngredientCost).toBeCloseTo(421.69, 2);
      expect(scenario.targetMonthlyVolume).toBe(220);
    });

    it("validates scenario parameters strictly, catching negatives and non-integers", () => {
      const validScenario: DishSimulationScenario = {
        dishId: "truffle-tenderloin",
        targetSellingPrice: 1000,
        targetIngredientCost: 400,
        targetMonthlyVolume: 250,
      };
      expect(validateSimulationScenario(validScenario).isValid).toBe(true);

      const invalidNegativePrice: DishSimulationScenario = {
        ...validScenario,
        targetSellingPrice: -50,
      };
      expect(validateSimulationScenario(invalidNegativePrice).isValid).toBe(false);
      expect(validateSimulationScenario(invalidNegativePrice).errors[0]).toContain("Selling price cannot be negative");

      const invalidFractionalVolume: DishSimulationScenario = {
        ...validScenario,
        targetMonthlyVolume: 220.5,
      };
      expect(validateSimulationScenario(invalidFractionalVolume).isValid).toBe(false);
      expect(validateSimulationScenario(invalidFractionalVolume).errors[0]).toContain("Monthly volume must be an integer");
    });
  });

  describe("Single Parameter Adjustments", () => {
    it("simulates a selling price increase correctly", () => {
      const scenario: DishSimulationScenario = {
        dishId: "truffle-tenderloin",
        targetSellingPrice: 1100, // +120 INR increase
        targetIngredientCost: 421.6909090909091,
        targetMonthlyVolume: 220,
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      // Unit economics
      expect(result.simulated.sellingPrice).toBe(1100);
      expect(result.delta.sellingPrice).toBe(120);
      expect(result.simulated.contributionPerServing).toBeCloseTo(678.31, 2);
      expect(result.delta.contributionPerServing).toBe(120);
      expect(result.simulated.contributionMarginPercentage).toBeCloseTo(61.66, 2);

      // Monthly economics (220 units)
      expect(result.simulated.monthlyRevenue).toBe(242000);
      expect(result.delta.monthlyRevenue).toBe(26400); // 220 * 120
      expect(result.delta.monthlyContribution).toBe(26400);

      // Restaurant impact
      expect(result.restaurantImpact.deltaMonthlyRevenue).toBe(26400);
      expect(result.restaurantImpact.deltaMonthlyContribution).toBe(26400);
    });

    it("simulates an ingredient cost reduction (portion control) correctly", () => {
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 500,
        targetIngredientCost: 300, // Reduced from 350 to 300 (-50 INR)
        targetMonthlyVolume: 300,
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.simulated.unitIngredientCost).toBe(300);
      expect(result.delta.unitIngredientCost).toBe(-50);
      expect(result.simulated.contributionPerServing).toBe(200); // 500 - 300
      expect(result.delta.contributionPerServing).toBe(50);
      expect(result.delta.monthlyIngredientCost).toBe(-15000); // 300 * (-50)
      expect(result.delta.monthlyContribution).toBe(15000); // Monthly savings add directly to profit
    });

    it("simulates monthly volume scaling linearly while unit margins remain unchanged", () => {
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 500,
        targetIngredientCost: 350,
        targetMonthlyVolume: 400, // Increased from 300 to 400 (+100 units)
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.simulated.contributionPerServing).toBe(150); // Unchanged unit contribution
      expect(result.delta.contributionPerServing).toBe(0);
      expect(result.simulated.monthlyVolume).toBe(400);
      expect(result.delta.monthlyVolume).toBe(100);
      expect(result.simulated.monthlyRevenue).toBe(200000); // 400 * 500
      expect(result.delta.monthlyRevenue).toBe(50000);
      expect(result.simulated.monthlyContribution).toBe(60000); // 400 * 150
      expect(result.delta.monthlyContribution).toBe(15000); // 100 * 150
    });
  });

  describe("Combined Scenario & Menu Matrix Transitions", () => {
    it("promotes a Plowhorse to a Star when price/cost surgery crosses profitability threshold", () => {
      // Baseline: plowhorse-pasta has volume 300 (>= 250 threshold) and margin 150 (< 300 threshold) -> PLOWHORSE
      // Scenario: Increase selling price to 650, reducing cost to 320 -> contribution = 330 (>= 300 threshold!)
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 650,
        targetIngredientCost: 320,
        targetMonthlyVolume: 280, // Volume remains >= 250 threshold
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.matrixProjection.baselineCategory).toBe("PLOWHORSE");
      expect(result.matrixProjection.projectedCategory).toBe("STAR");
      expect(result.matrixProjection.isPromoted).toBe(true);
      expect(result.matrixProjection.isDemoted).toBe(false);
      expect(result.matrixProjection.isHighPopularity).toBe(true);
      expect(result.matrixProjection.isHighProfitability).toBe(true);
    });

    it("demotes a Puzzle to a Dog when volume and margin are both reduced", () => {
      // Baseline: truffle-tenderloin is a PUZZLE (vol 220 < 250, margin 558.3 >= 300)
      // Scenario: Selling price dropped to 500, cost 350 -> contribution 150 (< 300 threshold)
      const scenario: DishSimulationScenario = {
        dishId: "truffle-tenderloin",
        targetSellingPrice: 500,
        targetIngredientCost: 350,
        targetMonthlyVolume: 150, // Remains < 250 threshold
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.matrixProjection.baselineCategory).toBe("PUZZLE");
      expect(result.matrixProjection.projectedCategory).toBe("DOG");
      expect(result.matrixProjection.isDemoted).toBe(true);
      expect(result.matrixProjection.isPromoted).toBe(false);
    });
  });

  describe("Boundary Values & Division-by-Zero Guards (Refinement 2)", () => {
    it("handles zero selling price gracefully: contribution is negative unit cost, margin % is null", () => {
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 0, // Complimentary dish
        targetIngredientCost: 350,
        targetMonthlyVolume: 100,
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.simulated.sellingPrice).toBe(0);
      expect(result.simulated.contributionPerServing).toBe(-350);
      expect(result.simulated.contributionMarginPercentage).toBeNull(); // N/A, not NaN or Infinity!
      expect(result.delta.contributionMarginPercentage).toBeNull();
      expect(result.simulated.monthlyRevenue).toBe(0);
      expect(result.simulated.monthlyContribution).toBe(-35000);
    });

    it("handles zero monthly volume without division errors", () => {
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 500,
        targetIngredientCost: 350,
        targetMonthlyVolume: 0,
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.simulated.monthlyVolume).toBe(0);
      expect(result.simulated.monthlyRevenue).toBe(0);
      expect(result.simulated.monthlyIngredientCost).toBe(0);
      expect(result.simulated.monthlyContribution).toBe(0);
      expect(result.delta.monthlyVolume).toBe(-300);
      expect(result.delta.percentageChanges.monthlyVolume).toBe(-100);
    });

    it("handles unsustainable pricing (price < cost) yielding negative contribution safely", () => {
      const scenario: DishSimulationScenario = {
        dishId: "plowhorse-pasta",
        targetSellingPrice: 300,
        targetIngredientCost: 350,
        targetMonthlyVolume: 200,
      };

      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      expect(result.simulated.contributionPerServing).toBe(-50);
      expect(result.simulated.contributionMarginPercentage).toBeCloseTo(-16.67, 2);
      expect(result.simulated.monthlyContribution).toBe(-10000);
    });
  });

  describe("Dataset Immutability & Reconciled Deltas (Refinement 1 & 4)", () => {
    it("guarantees baseline ground-truth objects are never mutated by simulation", () => {
      const originalPrice = mockDishProfitability[0].unitSellingPrice;
      const originalCost = mockDishProfitability[0].unitIngredientCost;
      const originalTotalVol = mockDishProfitability[0].totalVolume;

      const scenario: DishSimulationScenario = {
        dishId: "truffle-tenderloin",
        targetSellingPrice: 1500,
        targetIngredientCost: 300,
        targetMonthlyVolume: 500,
      };

      // Run multiple simulations
      for (let i = 0; i < 20; i++) {
        simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);
      }

      // Assert zero mutation on input objects
      expect(mockDishProfitability[0].unitSellingPrice).toBe(originalPrice);
      expect(mockDishProfitability[0].unitIngredientCost).toBe(originalCost);
      expect(mockDishProfitability[0].totalVolume).toBe(originalTotalVol);
    });

    it("reconciles baseline monthly figures directly from verified engine outputs", () => {
      const scenario = createInitialScenarioForDish(
        "truffle-tenderloin",
        mockDishProfitability,
        mockMenuEngineering,
        12
      );
      const result = simulateDishScenario(mockDishProfitability, mockMenuEngineering, scenario, 12);

      // When scenario matches baseline initial parameters:
      expect(result.delta.sellingPrice).toBe(0);
      expect(result.delta.unitIngredientCost).toBe(0);
      expect(result.delta.contributionPerServing).toBe(0);
      expect(result.delta.monthlyRevenue).toBeCloseTo(0, 5);
      expect(result.delta.monthlyContribution).toBeCloseTo(0, 5);
      expect(result.delta.monthlyIngredientCost).toBeCloseTo(0, 5);
    });
  });
});
