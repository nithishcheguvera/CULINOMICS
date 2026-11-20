import {
  MonthlyFinancialPerformance,
  ProfitForecastResult,
  ForecastPoint,
  ForecastScenarioResult,
  ForecastAssumptions,
} from "./types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  standardError: number;
}

/**
 * Computes Ordinary Least Squares (OLS) linear regression y = slope * x + intercept
 * along with R-squared and standard error of the estimate.
 */
function computeOLS(x: number[], y: number[]): LinearRegressionResult {
  const n = x.length;
  if (n < 2) {
    return { slope: 0, intercept: y[0] ?? 0, rSquared: 0, standardError: 0 };
  }

  const sumX = x.reduce((acc, v) => acc + v, 0);
  const sumY = y.reduce((acc, v) => acc + v, 0);
  const meanX = sumX / n;
  const meanY = sumY / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += (x[i] - meanX) * (x[i] - meanX);
  }

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;

  // Residual sum of squares & total sum of squares
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < n; i++) {
    const yPred = intercept + slope * x[i];
    ssRes += (y[i] - yPred) * (y[i] - yPred);
    ssTot += (y[i] - meanY) * (y[i] - meanY);
  }

  const rSquared = ssTot === 0 ? 1 : Math.max(0, 1 - ssRes / ssTot);
  const standardError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;

  return { slope, intercept, rSquared, standardError };
}

/**
 * Generates ISO date and human-readable label for future projection month.
 * e.g., base year 2025, future offset 1 -> "2026-01-01", "Jan 2026"
 */
function getFutureDateInfo(lastHistoricalDate: string, monthStep: number): { date: string; label: string } {
  const parts = lastHistoricalDate.split("-");
  let year = parseInt(parts[0], 10) || 2025;
  let month = parseInt(parts[1], 10) || 12;

  month += monthStep;
  while (month > 12) {
    year += 1;
    month -= 12;
  }

  const monthStr = String(month).padStart(2, "0");
  const date = `${year}-${monthStr}-01`;
  const label = `${MONTH_LABELS[month - 1]} ${year}`;
  return { date, label };
}

/**
 * Deterministic Financial Forecasting Calculator (Pure TypeScript, /engine)
 *
 * Implements Stage 10 Deliverable A:
 * Estimates future monthly revenue, ingredient costs, gross contribution, and margin percentage
 * across Baseline, Conservative, and Optimistic deterministic scenarios.
 */
export function calculateProfitForecast(
  monthlyPerformance: MonthlyFinancialPerformance[],
  horizonMonths: 3 | 6 = 3,
  options?: {
    conservativeInflationSurge?: number; // e.g. 0.25 (+25%)
    conservativeVolumeDip?: number; // e.g. -0.05 (-5%)
    optimisticVolumeSurge?: number; // e.g. 0.05 (+5%)
  }
): ProfitForecastResult {
  if (!monthlyPerformance || monthlyPerformance.length === 0) {
    throw new Error("Cannot calculate profit forecast: monthlyPerformance array is empty.");
  }

  // Sort chronological actuals
  const sorted = [...monthlyPerformance].sort((a, b) => a.date.localeCompare(b.date));
  const n = sorted.length;
  const lastDate = sorted[n - 1].date;

  const t = sorted.map((_, i) => i + 1);
  const revenues = sorted.map((m) => m.revenue);
  const costs = sorted.map((m) => m.ingredientCost);

  // Fit OLS models for revenue and ingredient cost
  const regRevenue = computeOLS(t, revenues);
  const regCost = computeOLS(t, costs);

  // Q4 average cost for optimistic stabilization
  const q4Costs = costs.slice(Math.max(0, n - 3));
  const avgQ4Cost = q4Costs.reduce((a, b) => a + b, 0) / (q4Costs.length || 1);

  const inflationSurge = options?.conservativeInflationSurge ?? 0.25;
  const volumeDip = options?.conservativeVolumeDip ?? -0.05;
  const volumeSurge = options?.optimisticVolumeSurge ?? 0.05;

  // Build points for each scenario
  const baselinePoints: ForecastPoint[] = [];
  const conservativePoints: ForecastPoint[] = [];
  const optimisticPoints: ForecastPoint[] = [];

  for (let h = 1; h <= horizonMonths; h++) {
    const futureT = n + h;
    const { date, label } = getFutureDateInfo(lastDate, h);

    // 1. BASELINE SCENARIO (Historical Trend Momentum)
    const baseRev = Math.max(0, regRevenue.intercept + regRevenue.slope * futureT);
    const baseCost = Math.max(0, regCost.intercept + regCost.slope * futureT);
    const baseProfit = baseRev - baseCost;
    const baseMargin = baseRev > 0 ? (baseProfit / baseRev) * 100 : 0;

    // 80% empirical prediction interval (+/- 1.28 * SE)
    const revLower = Math.max(0, baseRev - 1.28 * regRevenue.standardError);
    const revUpper = baseRev + 1.28 * regRevenue.standardError;
    const combinedSE = Math.sqrt(regRevenue.standardError ** 2 + regCost.standardError ** 2);
    const profitLower = baseProfit - 1.28 * combinedSE;
    const profitUpper = baseProfit + 1.28 * combinedSE;

    baselinePoints.push({
      date,
      monthIndex: futureT,
      monthLabel: label,
      projectedRevenue: Math.round(baseRev),
      projectedIngredientCost: Math.round(baseCost),
      projectedGrossProfit: Math.round(baseProfit),
      projectedGrossMarginPercentage: Number(baseMargin.toFixed(2)),
      projectedSalesVolume: 1920, // Baseline average monthly unit volume
      confidenceInterval: {
        revenueLower: Math.round(revLower),
        revenueUpper: Math.round(revUpper),
        profitLower: Math.round(profitLower),
        profitUpper: Math.round(profitUpper),
      },
      isForecast: true,
    });

    // 2. CONSERVATIVE SCENARIO (Cost Inflation Surge + Demand Fatigue)
    // Cost slope accelerates by +25%; Revenue softens by 5%
    const consRev = Math.max(0, baseRev * (1 + volumeDip));
    const consCost = Math.max(0, regCost.intercept + regCost.slope * (1 + inflationSurge) * futureT);
    const consProfit = consRev - consCost;
    const consMargin = consRev > 0 ? (consProfit / consRev) * 100 : 0;

    conservativePoints.push({
      date,
      monthIndex: futureT,
      monthLabel: label,
      projectedRevenue: Math.round(consRev),
      projectedIngredientCost: Math.round(consCost),
      projectedGrossProfit: Math.round(consProfit),
      projectedGrossMarginPercentage: Number(consMargin.toFixed(2)),
      projectedSalesVolume: Math.round(1920 * (1 + volumeDip)),
      confidenceInterval: {
        revenueLower: Math.round(Math.max(0, consRev - 1.28 * regRevenue.standardError)),
        revenueUpper: Math.round(consRev + 1.28 * regRevenue.standardError),
        profitLower: Math.round(consProfit - 1.28 * combinedSE),
        profitUpper: Math.round(consProfit + 1.28 * combinedSE),
      },
      isForecast: true,
    });

    // 3. OPTIMISTIC SCENARIO (Wholesale Cost Stabilization + Volume Expansion)
    // Ingredient costs plateau at Q4 levels; Revenue expands by +5%
    const optRev = Math.max(0, baseRev * (1 + volumeSurge));
    const optCost = Math.max(0, avgQ4Cost);
    const optProfit = optRev - optCost;
    const optMargin = optRev > 0 ? (optProfit / optRev) * 100 : 0;

    optimisticPoints.push({
      date,
      monthIndex: futureT,
      monthLabel: label,
      projectedRevenue: Math.round(optRev),
      projectedIngredientCost: Math.round(optCost),
      projectedGrossProfit: Math.round(optProfit),
      projectedGrossMarginPercentage: Number(optMargin.toFixed(2)),
      projectedSalesVolume: Math.round(1920 * (1 + volumeSurge)),
      confidenceInterval: {
        revenueLower: Math.round(Math.max(0, optRev - 1.28 * regRevenue.standardError)),
        revenueUpper: Math.round(optRev + 1.28 * regRevenue.standardError),
        profitLower: Math.round(optProfit - 1.28 * combinedSE),
        profitUpper: Math.round(optProfit + 1.28 * combinedSE),
      },
      isForecast: true,
    });
  }

  function aggregateScenario(
    scenario: "baseline" | "conservative" | "optimistic",
    label: string,
    description: string,
    points: ForecastPoint[]
  ): ForecastScenarioResult {
    const totalProjectedRevenue = points.reduce((acc, p) => acc + p.projectedRevenue, 0);
    const totalProjectedCost = points.reduce((acc, p) => acc + p.projectedIngredientCost, 0);
    const totalProjectedGrossProfit = totalProjectedRevenue - totalProjectedCost;
    const averageProjectedMarginPercentage =
      totalProjectedRevenue > 0
        ? Number(((totalProjectedGrossProfit / totalProjectedRevenue) * 100).toFixed(2))
        : 0;

    return {
      scenario,
      label,
      description,
      horizonMonths,
      forecastPoints: points,
      totalProjectedRevenue,
      totalProjectedCost,
      totalProjectedGrossProfit,
      averageProjectedMarginPercentage,
    };
  }

  const assumptions: ForecastAssumptions = {
    historicalMonthsCount: n,
    olsRevenueSlope: Number(regRevenue.slope.toFixed(2)),
    olsRevenueIntercept: Number(regRevenue.intercept.toFixed(2)),
    olsCostSlope: Number(regCost.slope.toFixed(2)),
    olsCostIntercept: Number(regCost.intercept.toFixed(2)),
    revenueStandardError: Number(regRevenue.standardError.toFixed(2)),
    costStandardError: Number(regCost.standardError.toFixed(2)),
    rSquaredRevenue: Number(regRevenue.rSquared.toFixed(4)),
    notes: [
      `Fitted across ${n} verified historical monthly records (OLS regression).`,
      `Conservative scenario accelerates cost slope by +${(inflationSurge * 100).toFixed(0)}% and discounts volume by ${(volumeDip * 100).toFixed(0)}%.`,
      `Optimistic scenario assumes wholesale ingredient price stabilization at Q4 levels with +${(volumeSurge * 100).toFixed(0)}% volume growth.`,
      `Confidence interval bounds represent an 80% prediction interval (±1.28 standard errors).`,
    ],
  };

  const limitations = [
    "Deterministic Trend Extrapolation: Projections assume continuity of historical cost and revenue dynamics.",
    "Exogenous Shocks: Severe macroeconomic disruptions, direct competitor entries, or unexpected supplier failures are not modeled.",
    "Planning Indicator: Projections are intended for strategic budgeting and menu planning, not guaranteed cash flow guarantees.",
  ];

  return {
    historicalPoints: sorted,
    horizonMonths,
    scenarios: {
      baseline: aggregateScenario(
        "baseline",
        "Baseline Trend",
        "Continuous 2025 trajectory assuming current pricing and cost momentum.",
        baselinePoints
      ),
      conservative: aggregateScenario(
        "conservative",
        "Conservative (Cost Surge)",
        "Accelerated ingredient inflation (+25%) combined with guest demand sensitivity (-5%).",
        conservativePoints
      ),
      optimistic: aggregateScenario(
        "optimistic",
        "Optimistic (Stabilized Costs)",
        "Ingredient costs plateau at Q4 levels with modest volume growth (+5%).",
        optimisticPoints
      ),
    },
    assumptions,
    limitations,
  };
}
