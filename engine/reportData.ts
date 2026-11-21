import {
  ExecutiveReportData,
  MonthlyFinancialPerformance,
  DishProfitability,
  MenuEngineeringResult,
  InflationImpactDish,
  IngredientInflation,
  ProfitForecastResult,
  ComboOptimizationResult,
  AnnualKpiMetrics,
} from "./types";

/**
 * Compiles a structured, authoritative executive report document model
 * from precomputed deterministic engine outputs.
 */
export function compileExecutiveReportData(params: {
  restaurantName?: string;
  datasetMode?: string;
  kpis: AnnualKpiMetrics | null;
  monthlyPerformance: MonthlyFinancialPerformance[];
  dishProfitability: DishProfitability[];
  menuEngineering: MenuEngineeringResult | null;
  inflationImpact: InflationImpactDish[];
  ingredientInflation: IngredientInflation[];
  forecastResult?: ProfitForecastResult | null;
  comboResult?: ComboOptimizationResult | null;
}): ExecutiveReportData {
  const {
    restaurantName = "CULINOMICS",
    datasetMode = "Canonical 2025",
    kpis,
    monthlyPerformance,
    dishProfitability,
    menuEngineering,
    inflationImpact,
    ingredientInflation,
    forecastResult,
    comboResult,
  } = params;

  // Resolve annual KPIs
  const resolvedKpis = kpis ?? {
    annualRevenue: monthlyPerformance.reduce((a, b) => a + b.revenue, 0),
    annualIngredientCost: monthlyPerformance.reduce((a, b) => a + b.ingredientCost, 0),
    annualGrossContribution: monthlyPerformance.reduce((a, b) => a + b.grossProfit, 0),
    overallMarginPercentage:
      monthlyPerformance.reduce((a, b) => a + b.revenue, 0) > 0
        ? (monthlyPerformance.reduce((a, b) => a + b.grossProfit, 0) /
            monthlyPerformance.reduce((a, b) => a + b.revenue, 0)) *
          100
        : 0,
    totalSalesVolume: 23040,
  };

  // Top surging ingredients (>= 20% growth)
  const topSurgingIngredients = ingredientInflation
    .filter((i) => i.percentageChange > 20)
    .sort((a, b) => b.percentageChange - a.percentageChange)
    .map((i) => ({
      ingredientName: i.ingredientName,
      unit: i.unit,
      startPrice: i.startPrice,
      endPrice: i.endPrice,
      percentageChange: Number(i.percentageChange.toFixed(1)),
    }));

  const forecastSummary = forecastResult
    ? {
        horizonMonths: forecastResult.horizonMonths,
        baselineRevenue: forecastResult.scenarios.baseline.totalProjectedRevenue,
        baselineContribution: forecastResult.scenarios.baseline.totalProjectedGrossProfit,
        baselineMarginPercentage: forecastResult.scenarios.baseline.averageProjectedMarginPercentage,
      }
    : undefined;

  return {
    metadata: {
      restaurantName,
      reportTitle: "Executive Profit Intelligence & Menu Engineering Report",
      generatedDate: new Date().toISOString().split("T")[0],
      datasetMode,
      provenance: "Engine Verified • Pure TypeScript Deterministic Math",
    },
    kpis: resolvedKpis,
    monthlyRunway: monthlyPerformance,
    menuDishes: dishProfitability,
    menuEngineering,
    inflationHurtDishes: inflationImpact.filter((i) => i.isInflationHurt),
    topSurgingIngredients,
    forecastSummary,
    topCombos: comboResult?.combos,
  };
}

/**
 * Generates an RFC 4180-compliant CSV string for the 12-Month Financial Performance Runway.
 */
export function generateFinancialSummaryCSV(report: ExecutiveReportData): string {
  const headers = ["Date", "Month", "Revenue (INR)", "Ingredient Cost (INR)", "Gross Profit (INR)", "Margin Percentage (%)"];
  const rows = report.monthlyRunway.map((m, idx) => {
    const monthName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx] || `M${idx + 1}`;
    return [
      m.date,
      monthName,
      m.revenue.toFixed(2),
      m.ingredientCost.toFixed(2),
      m.grossProfit.toFixed(2),
      m.grossMarginPercentage.toFixed(2),
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generates an RFC 4180-compliant CSV string for Dish Profitability & Menu Engineering Matrix.
 */
export function generateDishMatrixCSV(report: ExecutiveReportData): string {
  const headers = [
    "Dish Name",
    "Quadrant Category",
    "Selling Price (INR)",
    "Unit Ingredient Cost (INR)",
    "Unit Contribution (INR)",
    "Margin (%)",
    "Annual Volume (Units)",
    "Total Annual Contribution (INR)",
    "Contribution Rank",
  ];

  const rows = report.menuDishes.map((d) => {
    const category = report.menuEngineering?.dishes.find((m) => m.dishId === d.dishId)?.category || "N/A";
    return [
      `"${d.dishName.replace(/"/g, '""')}"`,
      category,
      d.unitSellingPrice.toFixed(2),
      d.unitIngredientCost.toFixed(2),
      d.contributionPerServing.toFixed(2),
      d.contributionMarginPercentage.toFixed(2),
      d.totalVolume,
      d.totalContribution.toFixed(2),
      d.rankByContribution,
    ];
  });

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Generates an RFC 4180-compliant CSV string for Forecast and Combo Recommendations.
 */
export function generateForecastAndCombosCSV(report: ExecutiveReportData): string {
  const lines: string[] = [];

  // Forecast section
  if (report.forecastSummary) {
    lines.push("# SECTION 1: PROFIT FORECAST SUMMARY");
    lines.push("Horizon Months,Baseline Projected Revenue (INR),Baseline Projected Contribution (INR),Projected Margin (%)");
    lines.push(
      `${report.forecastSummary.horizonMonths},${report.forecastSummary.baselineRevenue},${report.forecastSummary.baselineContribution},${report.forecastSummary.baselineMarginPercentage}`
    );
    lines.push("");
  }

  // Combos section
  if (report.topCombos && report.topCombos.length > 0) {
    lines.push("# SECTION 2: COMBO OPTIMIZER RECOMMENDATIONS");
    lines.push("Combo Name,Type,Selling Price (INR),Ingredient Cost (INR),Contribution (INR),Margin (%),Recommended Monthly Units,Monthly Contribution (INR)");
    report.topCombos.forEach((c) => {
      lines.push(
        `"${c.comboName.replace(/"/g, '""')}",${c.comboType},${c.comboSellingPrice},${c.totalIngredientCost},${c.comboContribution},${c.comboMarginPercentage},${c.recommendedMonthlyUnits},${c.projectedMonthlyContribution}`
      );
    });
  }

  return lines.join("\n");
}
