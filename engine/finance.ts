/**
 * Core Financial Math Primitive (Pure TypeScript)
 * Architecture rule: NO UI imports in /engine.
 */

export interface ProfitSummary {
  revenue: number;
  cost: number;
  grossProfit: number;
  marginPercentage: number;
}

export function calculateProfitSummary(revenue: number, cost: number): ProfitSummary {
  if (revenue < 0 || cost < 0) {
    throw new Error("Financial values cannot be negative");
  }
  const grossProfit = revenue - cost;
  const marginPercentage = revenue === 0 ? 0 : Number(((grossProfit / revenue) * 100).toFixed(2));
  return {
    revenue,
    cost,
    grossProfit,
    marginPercentage,
  };
}
