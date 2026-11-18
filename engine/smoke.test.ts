import { describe, it, expect } from "vitest";
import { calculateProfitSummary } from "./finance";

describe("Financial Engine Smoke Tests", () => {
  it("calculates gross profit and margin percentage correctly", () => {
    const summary = calculateProfitSummary(100, 40);
    expect(summary.grossProfit).toBe(60);
    expect(summary.marginPercentage).toBe(60.0);
  });

  it("handles zero revenue safely without dividing by zero", () => {
    const summary = calculateProfitSummary(0, 0);
    expect(summary.grossProfit).toBe(0);
    expect(summary.marginPercentage).toBe(0);
  });

  it("throws an error when negative revenue or cost is supplied", () => {
    expect(() => calculateProfitSummary(-10, 5)).toThrow("Financial values cannot be negative");
  });
});
