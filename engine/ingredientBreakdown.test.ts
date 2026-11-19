import { describe, it, expect } from "vitest";
import { RecipeItem, IngredientPriceRecord } from "@/schemas";
import { calculateDishIngredientBreakdown } from "./ingredientBreakdown";
import { calculateRecipeCostForDate } from "./recipeCost";

describe("calculateDishIngredientBreakdown", () => {
  const mockRecipes: RecipeItem[] = [
    {
      dishId: "truffle-tenderloin",
      dishName: "Truffle Butter Tenderloin Steak",
      ingredientId: "beef-tenderloin",
      ingredientName: "Grass-Fed Beef Tenderloin",
      quantity: 200,
      unit: "g",
    },
    {
      dishId: "truffle-tenderloin",
      dishName: "Truffle Butter Tenderloin Steak",
      ingredientId: "black-truffle",
      ingredientName: "Black Truffle Butter",
      quantity: 15,
      unit: "g",
    },
    {
      dishId: "truffle-tenderloin",
      dishName: "Truffle Butter Tenderloin Steak",
      ingredientId: "cream",
      ingredientName: "Heavy Cream",
      quantity: 50,
      unit: "ml",
    },
  ];

  const mockPrices: IngredientPriceRecord[] = [
    // January 2025
    { date: "2025-01-01", ingredientId: "beef-tenderloin", ingredientName: "Grass-Fed Beef Tenderloin", price: 1400, unit: "kg", currency: "INR" },
    { date: "2025-01-01", ingredientId: "black-truffle", ingredientName: "Black Truffle Butter", price: 6000, unit: "kg", currency: "INR" },
    { date: "2025-01-01", ingredientId: "cream", ingredientName: "Heavy Cream", price: 300, unit: "l", currency: "INR" },

    // December 2025 (Inflation surge)
    { date: "2025-12-01", ingredientId: "beef-tenderloin", ingredientName: "Grass-Fed Beef Tenderloin", price: 2100, unit: "kg", currency: "INR" },
    { date: "2025-12-01", ingredientId: "black-truffle", ingredientName: "Black Truffle Butter", price: 13000, unit: "kg", currency: "INR" },
    { date: "2025-12-01", ingredientId: "cream", ingredientName: "Heavy Cream", price: 420, unit: "l", currency: "INR" },
  ];

  it("calculates exact ingredient breakdown and reconciles against calculateRecipeCostForDate", () => {
    const breakdown = calculateDishIngredientBreakdown(
      "truffle-tenderloin",
      mockRecipes,
      mockPrices,
      "2025-01-01"
    );

    const authoritativeCost = calculateRecipeCostForDate(
      "truffle-tenderloin",
      mockRecipes,
      mockPrices,
      "2025-01-01"
    );

    expect(breakdown.dishId).toBe("truffle-tenderloin");
    expect(breakdown.dishName).toBe("Truffle Butter Tenderloin Steak");
    expect(breakdown.date).toBe("2025-01-01");
    expect(breakdown.totalRecipeCost).toBe(authoritativeCost);

    // Sum of ingredients must equal totalRecipeCost exactly
    const sumIngredientCosts = breakdown.ingredients.reduce((s, i) => s + i.ingredientCost, 0);
    expect(sumIngredientCosts).toBeCloseTo(authoritativeCost, 8);

    // Check individual calculations in Jan:
    // Beef: 200g / 1000 = 0.2 kg * 1400 = 280 INR
    // Truffle: 15g / 1000 = 0.015 kg * 6000 = 90 INR
    // Cream: 50ml / 1000 = 0.05 l * 300 = 15 INR
    // Total = 280 + 90 + 15 = 385 INR
    expect(breakdown.totalRecipeCost).toBe(385);

    const beef = breakdown.ingredients.find((i) => i.ingredientId === "beef-tenderloin")!;
    expect(beef.normalizedQuantityInPricingUnit).toBe(0.2);
    expect(beef.unitPrice).toBe(1400);
    expect(beef.ingredientCost).toBe(280);
    expect(beef.costSharePercentage).toBeCloseTo((280 / 385) * 100, 4);

    const truffle = breakdown.ingredients.find((i) => i.ingredientId === "black-truffle")!;
    expect(truffle.normalizedQuantityInPricingUnit).toBe(0.015);
    expect(truffle.unitPrice).toBe(6000);
    expect(truffle.ingredientCost).toBe(90);
    expect(truffle.costSharePercentage).toBeCloseTo((90 / 385) * 100, 4);

    const cream = breakdown.ingredients.find((i) => i.ingredientId === "cream")!;
    expect(cream.normalizedQuantityInPricingUnit).toBe(0.05);
    expect(cream.unitPrice).toBe(300);
    expect(cream.ingredientCost).toBe(15);
    expect(cream.costSharePercentage).toBeCloseTo((15 / 385) * 100, 4);

    // Sum of cost share percentages must equal 100%
    const totalShare = breakdown.ingredients.reduce((s, i) => s + i.costSharePercentage, 0);
    expect(totalShare).toBeCloseTo(100, 6);
  });

  it("sorts ingredients descending by ingredient cost (highest cost driver first)", () => {
    const breakdown = calculateDishIngredientBreakdown(
      "truffle-tenderloin",
      mockRecipes,
      mockPrices,
      "2025-01-01"
    );

    expect(breakdown.ingredients[0].ingredientId).toBe("beef-tenderloin"); // 280 INR
    expect(breakdown.ingredients[1].ingredientId).toBe("black-truffle");   // 90 INR
    expect(breakdown.ingredients[2].ingredientId).toBe("cream");           // 15 INR
  });

  it("computes accurate cost surge and share shifts across different historical dates", () => {
    const decBreakdown = calculateDishIngredientBreakdown(
      "truffle-tenderloin",
      mockRecipes,
      mockPrices,
      "2025-12-01"
    );

    // Dec:
    // Beef: 0.2 * 2100 = 420 INR
    // Truffle: 0.015 * 13000 = 195 INR
    // Cream: 0.05 * 420 = 21 INR
    // Total = 420 + 195 + 21 = 636 INR
    expect(decBreakdown.totalRecipeCost).toBe(636);

    const truffleDec = decBreakdown.ingredients.find((i) => i.ingredientId === "black-truffle")!;
    expect(truffleDec.ingredientCost).toBe(195);
    // Truffle went from 90 INR (23.38%) in Jan to 195 INR (30.66%) in Dec
    expect(truffleDec.costSharePercentage).toBeCloseTo((195 / 636) * 100, 4);
  });

  it("throws error when invalid dish ID or date is provided", () => {
    expect(() =>
      calculateDishIngredientBreakdown("non-existent-dish", mockRecipes, mockPrices, "2025-01-01")
    ).toThrow("No recipe found for dish ID: 'non-existent-dish'");

    expect(() =>
      calculateDishIngredientBreakdown("", mockRecipes, mockPrices, "2025-01-01")
    ).toThrow("Invalid dish ID provided");

    expect(() =>
      calculateDishIngredientBreakdown("truffle-tenderloin", mockRecipes, mockPrices, "")
    ).toThrow("Invalid date provided");
  });

  it("throws error when price record is missing for an ingredient on the specified date", () => {
    const incompletePrices = mockPrices.filter(
      (p) => !(p.ingredientId === "black-truffle" && p.date === "2025-01-01")
    );

    expect(() =>
      calculateDishIngredientBreakdown("truffle-tenderloin", mockRecipes, incompletePrices, "2025-01-01")
    ).toThrow("Missing price record for ingredient 'black-truffle'");
  });
});
