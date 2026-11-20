import { describe, it, expect } from "vitest";
import { calculateProfitForecast } from "./forecast";
import { MonthlyFinancialPerformance } from "./types";

const mockHistorical: MonthlyFinancialPerformance[] = [
  { date: "2025-01-01", revenue: 980000, ingredientCost: 380000, grossProfit: 600000, grossMarginPercentage: 61.22 },
  { date: "2025-02-01", revenue: 985000, ingredientCost: 388000, grossProfit: 597000, grossMarginPercentage: 60.61 },
  { date: "2025-03-01", revenue: 990000, ingredientCost: 395000, grossProfit: 595000, grossMarginPercentage: 60.10 },
  { date: "2025-04-01", revenue: 995000, ingredientCost: 405000, grossProfit: 590000, grossMarginPercentage: 59.30 },
  { date: "2025-05-01", revenue: 1000000, ingredientCost: 412000, grossProfit: 588000, grossMarginPercentage: 58.80 },
  { date: "2025-06-01", revenue: 1005000, ingredientCost: 420000, grossProfit: 585000, grossMarginPercentage: 58.21 },
  { date: "2025-07-01", revenue: 1010000, ingredientCost: 430000, grossProfit: 580000, grossMarginPercentage: 57.43 },
  { date: "2025-08-01", revenue: 1015000, ingredientCost: 442000, grossProfit: 573000, grossMarginPercentage: 56.45 },
  { date: "2025-09-01", revenue: 1020000, ingredientCost: 455000, grossProfit: 565000, grossMarginPercentage: 55.39 },
  { date: "2025-10-01", revenue: 1025000, ingredientCost: 468000, grossProfit: 557000, grossMarginPercentage: 54.34 },
  { date: "2025-11-01", revenue: 1030000, ingredientCost: 480000, grossProfit: 550000, grossMarginPercentage: 53.40 },
  { date: "2025-12-01", revenue: 1035000, ingredientCost: 495000, grossProfit: 540000, grossMarginPercentage: 52.17 },
];

describe("Stage 10: Deterministic Profit Forecast Engine", () => {
  it("calculates a 3-month forecast with all 3 scenarios and assumption parameters", () => {
    const result = calculateProfitForecast(mockHistorical, 3);

    expect(result.horizonMonths).toBe(3);
    expect(result.historicalPoints.length).toBe(12);

    // Scenarios exist
    expect(result.scenarios.baseline).toBeDefined();
    expect(result.scenarios.conservative).toBeDefined();
    expect(result.scenarios.optimistic).toBeDefined();

    // 3 points in each scenario
    expect(result.scenarios.baseline.forecastPoints.length).toBe(3);
    expect(result.scenarios.conservative.forecastPoints.length).toBe(3);
    expect(result.scenarios.optimistic.forecastPoints.length).toBe(3);

    // Date sequencing check
    expect(result.scenarios.baseline.forecastPoints[0].date).toBe("2026-01-01");
    expect(result.scenarios.baseline.forecastPoints[1].date).toBe("2026-02-01");
    expect(result.scenarios.baseline.forecastPoints[2].date).toBe("2026-03-01");

    // All points flagged as isForecast: true
    result.scenarios.baseline.forecastPoints.forEach((pt) => {
      expect(pt.isForecast).toBe(true);
      expect(pt.confidenceInterval).toBeDefined();
      expect(pt.confidenceInterval.revenueLower).toBeLessThanOrEqual(pt.projectedRevenue);
      expect(pt.confidenceInterval.revenueUpper).toBeGreaterThanOrEqual(pt.projectedRevenue);
    });
  });

  it("calculates a 6-month forecast horizon correctly", () => {
    const result = calculateProfitForecast(mockHistorical, 6);

    expect(result.horizonMonths).toBe(6);
    expect(result.scenarios.baseline.forecastPoints.length).toBe(6);
    expect(result.scenarios.baseline.forecastPoints[5].date).toBe("2026-06-01");
    expect(result.scenarios.baseline.forecastPoints[5].monthLabel).toBe("Jun 2026");
  });

  it("satisfies mathematical reconciliation: Revenue - Cost = Gross Profit for every point", () => {
    const result = calculateProfitForecast(mockHistorical, 3);

    const checkPoints = (pts: typeof result.scenarios.baseline.forecastPoints) => {
      pts.forEach((pt) => {
        expect(pt.projectedGrossProfit).toBe(pt.projectedRevenue - pt.projectedIngredientCost);
        const expectedMargin = Number(((pt.projectedGrossProfit / pt.projectedRevenue) * 100).toFixed(2));
        expect(pt.projectedGrossMarginPercentage).toBeCloseTo(expectedMargin, 1);
      });
    };

    checkPoints(result.scenarios.baseline.forecastPoints);
    checkPoints(result.scenarios.conservative.forecastPoints);
    checkPoints(result.scenarios.optimistic.forecastPoints);

    // Aggregate totals reconciliation
    const b = result.scenarios.baseline;
    expect(b.totalProjectedGrossProfit).toBe(b.totalProjectedRevenue - b.totalProjectedCost);
  });

  it("verifies scenario hierarchies: Optimistic Profit > Baseline Profit > Conservative Profit", () => {
    const result = calculateProfitForecast(mockHistorical, 3);

    const b = result.scenarios.baseline;
    const c = result.scenarios.conservative;
    const o = result.scenarios.optimistic;

    // Conservative revenue is lower due to -5% demand dip
    expect(c.totalProjectedRevenue).toBeLessThan(b.totalProjectedRevenue);
    // Optimistic revenue is higher due to +5% volume surge
    expect(o.totalProjectedRevenue).toBeGreaterThan(b.totalProjectedRevenue);

    // Conservative costs are higher due to +25% inflation surge
    expect(c.totalProjectedCost).toBeGreaterThan(b.totalProjectedCost);

    // Profit hierarchy
    expect(o.totalProjectedGrossProfit).toBeGreaterThan(b.totalProjectedGrossProfit);
    expect(b.totalProjectedGrossProfit).toBeGreaterThan(c.totalProjectedGrossProfit);

    // Margin hierarchy
    expect(o.averageProjectedMarginPercentage).toBeGreaterThan(b.averageProjectedMarginPercentage);
    expect(b.averageProjectedMarginPercentage).toBeGreaterThan(c.averageProjectedMarginPercentage);
  });

  it("throws a descriptive error when monthlyPerformance array is empty", () => {
    expect(() => calculateProfitForecast([])).toThrowError("Cannot calculate profit forecast");
  });
});
