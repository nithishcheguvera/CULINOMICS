import { describe, it, expect } from "vitest";
import { compareMonthlyPerformance } from "./monthlyComparison";
import { MonthlyFinancialPerformance } from "./types";

describe("Financial Engine - Monthly Performance Comparison", () => {
  const janRecord: MonthlyFinancialPerformance = {
    date: "2025-01-01",
    revenue: 1040400,
    ingredientCost: 345400,
    grossProfit: 695000,
    grossMarginPercentage: 66.8,
  };

  const decRecord: MonthlyFinancialPerformance = {
    date: "2025-12-01",
    revenue: 1040400,
    ingredientCost: 423900,
    grossProfit: 616500,
    grossMarginPercentage: 59.256055,
  };

  it("calculates zero deltas when comparing a month against itself", () => {
    const comparison = compareMonthlyPerformance(janRecord, janRecord);
    expect(comparison.revenueDeltaPercentage).toBe(0);
    expect(comparison.costDeltaPercentage).toBe(0);
    expect(comparison.contributionDeltaPercentage).toBe(0);
    expect(comparison.marginDeltaPercentagePoints).toBe(0);
    expect(comparison.isCostSurge).toBe(false);
    expect(comparison.isProfitErosion).toBe(false);
    expect(comparison.isMarginCompressed).toBe(false);
  });

  it("calculates accurate deltas between December and January baseline", () => {
    const comparison = compareMonthlyPerformance(decRecord, janRecord);
    expect(comparison.revenueDeltaPercentage).toBe(0);
    expect(comparison.costDeltaPercentage).toBeCloseTo(22.727, 2);
    expect(comparison.contributionDeltaPercentage).toBeCloseTo(-11.295, 2);
    expect(comparison.marginDeltaPercentagePoints).toBeCloseTo(-7.544, 2);
    expect(comparison.isCostSurge).toBe(true);
    expect(comparison.isProfitErosion).toBe(true);
    expect(comparison.isMarginCompressed).toBe(true);
  });

  it("safely handles null or undefined baseline", () => {
    const comparison = compareMonthlyPerformance(decRecord, null);
    expect(comparison.revenueDeltaPercentage).toBe(0);
    expect(comparison.costDeltaPercentage).toBe(0);
    expect(comparison.contributionDeltaPercentage).toBe(0);
    expect(comparison.marginDeltaPercentagePoints).toBe(0);
  });

  it("safely handles zero baseline values without NaN or Infinity", () => {
    const zeroBaseline: MonthlyFinancialPerformance = {
      date: "2025-01-01",
      revenue: 0,
      ingredientCost: 0,
      grossProfit: 0,
      grossMarginPercentage: 0,
    };
    const comparison = compareMonthlyPerformance(decRecord, zeroBaseline);
    expect(comparison.revenueDeltaPercentage).toBe(0);
    expect(comparison.costDeltaPercentage).toBe(0);
    expect(comparison.contributionDeltaPercentage).toBe(0);
    expect(comparison.marginDeltaPercentagePoints).toBeCloseTo(decRecord.grossMarginPercentage, 2);
  });
});
