import { describe, it, expect } from "vitest";
import {
  compileExecutiveReportData,
  generateFinancialSummaryCSV,
  generateDishMatrixCSV,
  generateForecastAndCombosCSV,
} from "./reportData";
import {
  MonthlyFinancialPerformance,
  DishProfitability,
  MenuEngineeringResult,
  InflationImpactDish,
  IngredientInflation,
  ProfitForecastResult,
  ComboOptimizationResult,
} from "./types";

const mockMonthly: MonthlyFinancialPerformance[] = [
  { date: "2025-01-01", revenue: 980000, ingredientCost: 380000, grossProfit: 600000, grossMarginPercentage: 61.22 },
  { date: "2025-02-01", revenue: 985000, ingredientCost: 388000, grossProfit: 597000, grossMarginPercentage: 60.61 },
];

const mockDishProfitability: DishProfitability[] = [
  {
    dishId: "dish-1",
    dishName: "Truffle Tagliolini",
    unitSellingPrice: 850,
    unitIngredientCost: 290,
    contributionPerServing: 560,
    contributionMarginPercentage: 65.88,
    totalVolume: 1200,
    totalContribution: 672000,
    rankByContribution: 1,
    rankByVolume: 2,
    rankByMargin: 1,
  },
];

const mockMenuEngineering: MenuEngineeringResult = {
  averagePopularityBenchmark: 1000,
  averageContributionBenchmark: 500,
  dishes: [
    {
      dishId: "dish-1",
      dishName: "Truffle Tagliolini",
      category: "STAR",
      volume: 1200,
      contribution: 560,
      sellingPrice: 850,
      cost: 290,
      marginPercentage: 65.88,
      action: "Maintain Quality",
    },
  ],
  categoryCounts: { stars: 1, plowhorses: 0, puzzles: 0, dogs: 0 },
};

const mockInflationImpact: InflationImpactDish[] = [
  {
    dishId: "dish-1",
    dishName: "Truffle Tagliolini",
    janCost: 250,
    decCost: 290,
    costIncrease: 40,
    percentageCostIncrease: 16.0,
    janMargin: 70.59,
    decMargin: 65.88,
    marginErosion: 4.71,
    isInflationHurt: true,
  },
];

const mockIngredientInflation: IngredientInflation[] = [
  {
    ingredientId: "ing-1",
    ingredientName: "Black Truffle Butter",
    unit: "kg",
    startPrice: 2000,
    endPrice: 2800,
    absoluteChange: 800,
    percentageChange: 40.0,
  },
];

const mockForecast: ProfitForecastResult = {
  horizonMonths: 3,
  historicalPoints: [],
  scenarios: {
    baseline: {
      name: "Baseline OLS Trend",
      scenario: "baseline",
      description: "Baseline",
      totalProjectedRevenue: 3000000,
      totalProjectedCost: 1200000,
      totalProjectedGrossProfit: 1800000,
      averageProjectedMarginPercentage: 60.0,
      forecastPoints: [],
    },
    conservative: {
      name: "Conservative",
      scenario: "conservative",
      description: "Conservative",
      totalProjectedRevenue: 2850000,
      totalProjectedCost: 1300000,
      totalProjectedGrossProfit: 1550000,
      averageProjectedMarginPercentage: 54.39,
      forecastPoints: [],
    },
    optimistic: {
      name: "Optimistic",
      scenario: "optimistic",
      description: "Optimistic",
      totalProjectedRevenue: 3150000,
      totalProjectedCost: 1150000,
      totalProjectedGrossProfit: 2000000,
      averageProjectedMarginPercentage: 63.49,
      forecastPoints: [],
    },
  },
  assumptions: {
    regressionMethod: "Ordinary Least Squares (OLS) Linear Trend",
    historicalRunwayMonths: 12,
    conservativeCostSurgePercent: 25,
    conservativeVolumeDipPercent: 5,
    optimisticVolumeGrowthPercent: 5,
    confidenceLevelPercent: 80,
    limitations: "Linear extrapolation",
  },
};

const mockCombos: ComboOptimizationResult = {
  combos: [
    {
      comboId: "combo-1",
      comboName: "Gourmet Truffle Pairing",
      comboType: "PAIR",
      rationale: "Pair star and dog",
      dishes: [],
      combinedMenuPrice: 1200,
      bundleDiscountPercentage: 10,
      comboSellingPrice: 1080,
      totalIngredientCost: 400,
      comboContribution: 680,
      comboMarginPercentage: 62.96,
      savingsForGuest: 120,
      recommendedMonthlyUnits: 150,
      projectedMonthlyContribution: 102000,
    },
  ],
  totalComboPlatesSold: 300,
  monthlyPlateBudget: 1500,
  objectiveValue: 102000,
  averageComboMarginPercentage: 62.96,
  isFeasible: true,
  disclaimer: "Linear programming optimization",
};

describe("Stage 10: Executive Report Data Compilation & CSV Serialization", () => {
  it("compiles structured executive report data model accurately", () => {
    const report = compileExecutiveReportData({
      restaurantName: "Osteria Bella",
      kpis: null,
      monthlyPerformance: mockMonthly,
      dishProfitability: mockDishProfitability,
      menuEngineering: mockMenuEngineering,
      inflationImpact: mockInflationImpact,
      ingredientInflation: mockIngredientInflation,
      forecastResult: mockForecast,
      comboResult: mockCombos,
    });

    expect(report.metadata.restaurantName).toBe("Osteria Bella");
    expect(report.metadata.provenance).toContain("Engine Verified");
    expect(report.kpis.annualRevenue).toBe(980000 + 985000);
    expect(report.topSurgingIngredients.length).toBe(1);
    expect(report.topSurgingIngredients[0].ingredientName).toBe("Black Truffle Butter");
    expect(report.forecastSummary?.baselineRevenue).toBe(3000000);
    expect(report.topCombos?.length).toBe(1);
  });

  it("generates valid RFC 4180 CSV strings for financial summary, dish matrix, and forecast/combos", () => {
    const report = compileExecutiveReportData({
      restaurantName: "Osteria Bella",
      kpis: null,
      monthlyPerformance: mockMonthly,
      dishProfitability: mockDishProfitability,
      menuEngineering: mockMenuEngineering,
      inflationImpact: mockInflationImpact,
      ingredientInflation: mockIngredientInflation,
      forecastResult: mockForecast,
      comboResult: mockCombos,
    });

    const finCsv = generateFinancialSummaryCSV(report);
    expect(finCsv).toContain("Revenue (INR),Ingredient Cost (INR)");
    expect(finCsv).toContain("2025-01-01,Jan,980000.00,380000.00,600000.00,61.22");

    const dishCsv = generateDishMatrixCSV(report);
    expect(dishCsv).toContain('"Truffle Tagliolini",STAR,850.00,290.00,560.00,65.88,1200,672000.00,1');

    const fcCsv = generateForecastAndCombosCSV(report);
    expect(fcCsv).toContain("# SECTION 1: PROFIT FORECAST SUMMARY");
    expect(fcCsv).toContain("3,3000000,1800000,60");
    expect(fcCsv).toContain("# SECTION 2: COMBO OPTIMIZER RECOMMENDATIONS");
    expect(fcCsv).toContain('"Gourmet Truffle Pairing",PAIR,1080,400,680,62.96,150,102000');
  });
});
