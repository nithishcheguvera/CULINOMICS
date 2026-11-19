import { describe, it, expect } from "vitest";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import {
  calculateRecipeCostForDate,
  calculateMonthlyPerformance,
  calculateDishProfitability,
  calculateIngredientInflation,
  calculateRecipeReplay,
  calculateSalesAnalysis,
  calculateMenuEngineering,
  calculateInflationImpact,
  calculateProfitSummary,
} from "@/engine";

const dataset = loadStoryDatasetFromDisk();

describe("Financial Engine - Recipe Cost Calculations", () => {
  it("reproduces expected January and December target costs for all 3 inflation-affected dishes", () => {
    // 1. Truffle Butter Tenderloin
    const tenderloinJan = calculateRecipeCostForDate(
      "truffle-tenderloin",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-01-01"
    );
    const tenderloinDec = calculateRecipeCostForDate(
      "truffle-tenderloin",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-12-01"
    );
    expect(tenderloinJan).toBeCloseTo(335.12, 1);
    expect(tenderloinDec).toBeCloseTo(601.14, 1);

    // 2. Tiger Prawn Saffron Risotto
    const risottoJan = calculateRecipeCostForDate(
      "prawn-risotto",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-01-01"
    );
    const risottoDec = calculateRecipeCostForDate(
      "prawn-risotto",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-12-01"
    );
    expect(risottoJan).toBeCloseTo(295.09, 1);
    expect(risottoDec).toBeCloseTo(506.11, 1);

    // 3. Classic Artisanal Tiramisu
    const tiramisuJan = calculateRecipeCostForDate(
      "classic-tiramisu",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-01-01"
    );
    const tiramisuDec = calculateRecipeCostForDate(
      "classic-tiramisu",
      dataset.recipes,
      dataset.ingredientPrices,
      "2025-12-01"
    );
    expect(tiramisuJan).toBeCloseTo(150.60, 1);
    expect(tiramisuDec).toBeCloseTo(275.00, 1);
  });

  it("throws clear errors when dish recipe or ingredient price is missing", () => {
    expect(() =>
      calculateRecipeCostForDate(
        "non-existent-dish",
        dataset.recipes,
        dataset.ingredientPrices,
        "2025-01-01"
      )
    ).toThrow("No recipe found for dish ID: 'non-existent-dish'");

    expect(() =>
      calculateRecipeCostForDate(
        "margherita-pizza",
        dataset.recipes,
        dataset.ingredientPrices,
        "1999-01-01" // Invalid date not in dataset
      )
    ).toThrow("Missing price record for ingredient");
  });
});

describe("Financial Engine - Monthly Performance", () => {
  const performance = calculateMonthlyPerformance(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  it("produces 12 chronological monthly performance records", () => {
    expect(performance.length).toBe(12);
    expect(performance[0].date).toBe("2025-01-01");
    expect(performance[11].date).toBe("2025-12-01");
  });

  it("ensures gross profit equals revenue minus total ingredient cost for all months", () => {
    performance.forEach((month) => {
      expect(month.revenue).toBeGreaterThan(0);
      expect(month.ingredientCost).toBeGreaterThan(0);
      expect(month.grossProfit).toBeCloseTo(month.revenue - month.ingredientCost, 6);
      expect(month.grossMarginPercentage).toBeCloseTo(
        (month.grossProfit / month.revenue) * 100,
        6
      );
    });
  });

  it("accurately tracks menu margin contraction from January to December", () => {
    const janMargin = performance[0].grossMarginPercentage;
    const decMargin = performance[11].grossMarginPercentage;
    // Across the entire restaurant, inflation causes total gross margin % to decline
    expect(janMargin).toBeGreaterThan(decMargin);
  });

  it("safely handles empty sales records without throwing", () => {
    const empty = calculateMonthlyPerformance([], dataset.recipes, dataset.ingredientPrices);
    expect(empty).toEqual([]);
  });
});

describe("Financial Engine - Dish Profitability", () => {
  const profitability = calculateDishProfitability(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  it("calculates profitability for all 8 dishes", () => {
    expect(profitability.length).toBe(8);
  });

  it("maintains strict mathematical consistency with aggregate monthly totals", () => {
    const monthlyPerformance = calculateMonthlyPerformance(
      dataset.sales,
      dataset.recipes,
      dataset.ingredientPrices
    );

    const totalAnnualRevenueMonthly = monthlyPerformance.reduce((sum, m) => sum + m.revenue, 0);
    const totalAnnualCostMonthly = monthlyPerformance.reduce((sum, m) => sum + m.ingredientCost, 0);
    const totalAnnualProfitMonthly = monthlyPerformance.reduce((sum, m) => sum + m.grossProfit, 0);

    const totalDishRevenue = profitability.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalDishCost = profitability.reduce((sum, d) => sum + d.totalIngredientCost, 0);
    const totalDishContribution = profitability.reduce((sum, d) => sum + d.totalContribution, 0);

    expect(totalDishRevenue).toBeCloseTo(totalAnnualRevenueMonthly, 4);
    expect(totalDishCost).toBeCloseTo(totalAnnualCostMonthly, 4);
    expect(totalDishContribution).toBeCloseTo(totalAnnualProfitMonthly, 4);
  });

  it("assigns unique valid ranks for contribution and margin percentage (1 to 8)", () => {
    const contribRanks = profitability.map((d) => d.rankByContribution).sort((a, b) => a - b);
    const marginRanks = profitability.map((d) => d.rankByMarginPercentage).sort((a, b) => a - b);
    expect(contribRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(marginRanks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});

describe("Financial Engine - Ingredient Inflation", () => {
  const inflation = calculateIngredientInflation(dataset.ingredientPrices);

  it("analyzes price changes for all 37 unique ingredients", () => {
    expect(inflation.length).toBe(37);
  });

  it("correctly identifies the major inflation drivers (>= 50% price surge)", () => {
    const majorDrivers = inflation.filter((i) => i.isMajorDriver);
    const majorDriverIds = majorDrivers.map((i) => i.ingredientId);

    // Major ingredients identified in specification
    expect(majorDriverIds).toContain("imported-mascarpone"); // +93.3%
    expect(majorDriverIds).toContain("extra-virgin-olive-oil"); // +90.0%
    expect(majorDriverIds).toContain("farm-eggs"); // +86.7%
    expect(majorDriverIds).toContain("prime-tenderloin"); // +86.7%
    expect(majorDriverIds).toContain("tiger-prawns"); // +83.3%
    expect(majorDriverIds).toContain("european-butter"); // +83.3%
    expect(majorDriverIds).toContain("heavy-cream"); // +81.8%
    expect(majorDriverIds).toContain("truffle-oil"); // +73.3%
  });

  it("returns ingredients ordered by highest percentage inflation first", () => {
    for (let i = 0; i < inflation.length - 1; i++) {
      expect(inflation[i].percentageChange).toBeGreaterThanOrEqual(inflation[i + 1].percentageChange);
    }
  });
});

describe("Financial Engine - Recipe Replay", () => {
  const replay = calculateRecipeReplay(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices,
    dataset.sales
  );

  it("generates 8 dish replay time-series with 12 points each", () => {
    expect(replay.length).toBe(8);
    replay.forEach((dish) => {
      expect(dish.points.length).toBe(12);
    });
  });

  it("verifies contribution per serving is exactly sellingPrice minus recipeCost for all points", () => {
    replay.forEach((dish) => {
      dish.points.forEach((point) => {
        expect(point.contributionPerServing).toBeCloseTo(
          point.sellingPrice - point.recipeCost,
          6
        );
        expect(point.marginPercentage).toBeCloseTo(
          (point.contributionPerServing / point.sellingPrice) * 100,
          6
        );
      });
    });
  });
});

describe("Financial Engine - Sales Analysis", () => {
  const salesAnalysis = calculateSalesAnalysis(dataset.sales);

  it("summarizes 12 monthly volume points and 8 dish popularity entries", () => {
    expect(salesAnalysis.monthlyVolumes.length).toBe(12);
    expect(salesAnalysis.dishPopularity.length).toBe(8);
    expect(salesAnalysis.totalVolumeAllTime).toBe(1920 * 12); // 23,040 units
  });

  it("verifies total market volume share sums to 100%", () => {
    const totalShare = salesAnalysis.dishPopularity.reduce(
      (sum, d) => sum + d.volumeSharePercentage,
      0
    );
    expect(totalShare).toBeCloseTo(100.0, 4);
  });

  it("ranks top volume dish as Margherita Pizza and lowest as Pan-Seared Duck", () => {
    expect(salesAnalysis.dishPopularity[0].dishId).toBe("margherita-pizza");
    expect(salesAnalysis.dishPopularity[7].dishId).toBe("pan-seared-duck");
  });
});

describe("Financial Engine - Menu Engineering Matrix", () => {
  const menuMatrix = calculateMenuEngineering(
    dataset.sales,
    dataset.recipes,
    dataset.ingredientPrices
  );

  it("programmatically calculates volume and contribution thresholds", () => {
    expect(menuMatrix.popularityThreshold).toBeCloseTo(240.0, 1);
    expect(menuMatrix.profitabilityThreshold).toBeCloseTo(345.74, 1);
  });

  it("classifies dishes into the expected 4 quadrants", () => {
    expect(menuMatrix.categoryCounts.stars).toBeGreaterThanOrEqual(2);
    expect(menuMatrix.categoryCounts.plowhorses).toBeGreaterThanOrEqual(1);
    expect(menuMatrix.categoryCounts.puzzles).toBeGreaterThanOrEqual(1);
    expect(menuMatrix.categoryCounts.dogs).toBeGreaterThanOrEqual(1);

    const getCat = (dishId: string) =>
      menuMatrix.dishes.find((d) => d.dishId === dishId)?.category;

    expect(getCat("margherita-pizza")).toBe("STAR");
    expect(getCat("lasagna-bolognese")).toBe("STAR");
    expect(getCat("rosemary-focaccia")).toBe("PLOWHORSE");
    expect(getCat("burrata-salad")).toBe("PUZZLE");
    expect(getCat("pan-seared-duck")).toBe("DOG");
    expect(getCat("truffle-tenderloin")).toBe("PUZZLE");
    expect(getCat("prawn-risotto")).toBe("PUZZLE");
    expect(getCat("classic-tiramisu")).toBe("DOG");
  });

  it("exposes precomputed totalContribution on each menu engineering dish", () => {
    for (const dish of menuMatrix.dishes) {
      expect(typeof dish.totalContribution).toBe("number");
      expect(dish.totalContribution).toBeGreaterThan(0);
    }
    const pizza = menuMatrix.dishes.find((d) => d.dishId === "margherita-pizza");
    expect(pizza?.totalContribution).toBeGreaterThan(100000);
  });
});

describe("Financial Engine - Inflation Impact Comparison", () => {
  const impact = calculateInflationImpact(
    dataset.menu,
    dataset.recipes,
    dataset.ingredientPrices
  );

  it("evaluates inflation impact between January and December 2025 for all 8 dishes", () => {
    expect(impact.length).toBe(8);
  });

  it("flags all 3 designated inflation-affected dishes", () => {
    const hurtDishes = impact.filter((d) => d.isInflationHurt);
    const hurtDishIds = hurtDishes.map((d) => d.dishId);

    expect(hurtDishIds).toContain("truffle-tenderloin");
    expect(hurtDishIds).toContain("prawn-risotto");
    expect(hurtDishIds).toContain("classic-tiramisu");
  });

  it("identifies the primary ingredient cost driver for each inflation-hurt dish", () => {
    // 1. Tenderloin: prime beef is the top cost driver
    const tenderloin = impact.find((d) => d.dishId === "truffle-tenderloin")!;
    expect(tenderloin.ingredientDrivers[0].ingredientId).toBe("prime-tenderloin");
    expect(tenderloin.ingredientDrivers[0].shareOfDishCostIncreasePercentage).toBeGreaterThan(70);

    // 2. Risotto: tiger prawns is the top cost driver
    const risotto = impact.find((d) => d.dishId === "prawn-risotto")!;
    expect(risotto.ingredientDrivers[0].ingredientId).toBe("tiger-prawns");
    expect(risotto.ingredientDrivers[0].shareOfDishCostIncreasePercentage).toBeGreaterThan(60);

    // 3. Tiramisu: mascarpone is the top cost driver
    const tiramisu = impact.find((d) => d.dishId === "classic-tiramisu")!;
    expect(tiramisu.ingredientDrivers[0].ingredientId).toBe("imported-mascarpone");
    expect(tiramisu.ingredientDrivers[0].shareOfDishCostIncreasePercentage).toBeGreaterThan(65);
  });
});

describe("Financial Engine - Smoke Helper", () => {
  it("calculates basic profit summary without division by zero", () => {
    const summary = calculateProfitSummary(500, 200);
    expect(summary.grossProfit).toBe(300);
    expect(summary.marginPercentage).toBe(60);

    const zeroSummary = calculateProfitSummary(0, 0);
    expect(zeroSummary.grossProfit).toBe(0);
    expect(zeroSummary.marginPercentage).toBe(0);
  });
});
