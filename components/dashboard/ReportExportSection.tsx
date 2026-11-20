"use client";

import React, { useState } from "react";
import {
  useAppStore,
  formatINR,
} from "@/store/useAppStore";
import {
  generateFinancialSummaryCSV,
  generateDishMatrixCSV,
  generateForecastAndCombosCSV,
} from "@/engine";

export function ReportExportSection() {
  const hookState = useAppStore();
  const store = typeof window === "undefined" ? useAppStore.getState() : hookState;
  const { getExecutiveReport } = store;
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const report = getExecutiveReport();

  if (!report) {
    return (
      <div className="forest-card rounded-2xl p-8 border border-forest-border text-center text-neutral-400">
        <p>Awaiting financial data compilation to generate executive report...</p>
      </div>
    );
  }

  // Helper to trigger browser download of CSV string
  const triggerDownload = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(`Successfully exported ${filename}`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadFinancialSummaryCSV = () => {
    const csv = generateFinancialSummaryCSV(report);
    triggerDownload(`culinomics-financial-runway-${report.metadata.generatedDate}.csv`, csv);
  };

  const handleDownloadDishMatrixCSV = () => {
    const csv = generateDishMatrixCSV(report);
    triggerDownload(`culinomics-dish-matrix-${report.metadata.generatedDate}.csv`, csv);
  };

  const handleDownloadForecastAndCombosCSV = () => {
    const csv = generateForecastAndCombosCSV(report);
    triggerDownload(`culinomics-forecast-combos-${report.metadata.generatedDate}.csv`, csv);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section aria-label="Executive Profit Intelligence Report & Data Export" className="space-y-6">
      {/* Action Toolbar (Hidden when printing) */}
      <div className="forest-card rounded-2xl p-5 border border-forest-border flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl">📄</span>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Executive Profit Intelligence Report & Export
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Authoritative, print-ready document and RFC 4180 CSV spreadsheets for restaurant ownership, investors, and lenders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Exports */}
          <div className="flex items-center bg-forest-elevated rounded-lg p-1 border border-forest-border text-xs">
            <button
              onClick={handleDownloadFinancialSummaryCSV}
              className="px-2.5 py-1.5 rounded hover:bg-forest-border text-neutral-300 hover:text-white transition-colors"
              title="Download 12-Month Financial Performance CSV"
            >
              📥 Financial Runway CSV
            </button>
            <button
              onClick={handleDownloadDishMatrixCSV}
              className="px-2.5 py-1.5 rounded hover:bg-forest-border text-neutral-300 hover:text-white transition-colors"
              title="Download Menu Matrix CSV"
            >
              📥 Menu Matrix CSV
            </button>
            <button
              onClick={handleDownloadForecastAndCombosCSV}
              className="px-2.5 py-1.5 rounded hover:bg-forest-border text-neutral-300 hover:text-white transition-colors"
              title="Download Forecast & Combos CSV"
            >
              📥 Forecast & Combos CSV
            </button>
          </div>

          {/* Native Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
          >
            <span>🖨️</span>
            <span>Print / Save PDF Report</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-medium flex items-center space-x-2 print:hidden animate-fade-in">
          <span>✅</span>
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Printable Report Document Card */}
      <div className="forest-card rounded-2xl p-6 sm:p-8 border border-forest-border space-y-6 print:border-none print:shadow-none print:bg-white print:text-neutral-900 print:p-0">
        {/* Document Header */}
        <div className="border-b border-forest-border/80 pb-5 print:border-neutral-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-forest-elevated border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg print:border-neutral-400 print:text-neutral-900">
                  OB
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white print:text-neutral-950">
                    {report.metadata.restaurantName}
                  </h1>
                  <p className="text-xs text-neutral-400 print:text-neutral-600">
                    {report.metadata.reportTitle}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right text-xs text-neutral-400 print:text-neutral-600 font-mono space-y-1">
              <div>Date: <strong className="text-white print:text-neutral-900">{report.metadata.generatedDate}</strong></div>
              <div>Dataset: <span className="text-emerald-400 print:text-neutral-800">{report.metadata.datasetMode}</span></div>
              <div className="text-[10px] text-neutral-500 print:text-neutral-500">{report.metadata.provenance}</div>
            </div>
          </div>
        </div>

        {/* Section 1: Executive KPI Scorecard */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-neutral-800">
            1. Annual Financial Performance Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-forest-elevated/60 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300">
              <p className="text-[11px] text-neutral-400 print:text-neutral-600 font-medium">Annual Revenue</p>
              <p className="text-lg sm:text-xl font-bold text-white print:text-neutral-950 mt-1">
                {formatINR(report.kpis.annualRevenue)}
              </p>
              <p className="text-[10px] text-neutral-400 print:text-neutral-600 mt-0.5">
                {report.kpis.totalSalesVolume.toLocaleString()} servings sold
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-forest-elevated/60 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300">
              <p className="text-[11px] text-neutral-400 print:text-neutral-600 font-medium">Food Cost (COGS)</p>
              <p className="text-lg sm:text-xl font-bold text-red-300 print:text-red-700 mt-1">
                {formatINR(report.kpis.annualIngredientCost)}
              </p>
              <p className="text-[10px] text-neutral-400 print:text-neutral-600 mt-0.5">
                Direct ingredient expenditure
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-forest-elevated/60 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300">
              <p className="text-[11px] text-neutral-400 print:text-neutral-600 font-medium">Gross Contribution</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-400 print:text-emerald-700 mt-1">
                {formatINR(report.kpis.annualGrossContribution)}
              </p>
              <p className="text-[10px] text-neutral-400 print:text-neutral-600 mt-0.5">
                Total post-ingredient contribution
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-forest-elevated/60 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300">
              <p className="text-[11px] text-neutral-400 print:text-neutral-600 font-medium">Overall Gross Margin</p>
              <p className="text-lg sm:text-xl font-bold text-white print:text-neutral-950 mt-1">
                {report.kpis.overallMarginPercentage.toFixed(1)}%
              </p>
              <p className="text-[10px] text-neutral-400 print:text-neutral-600 mt-0.5">
                Target healthy benchmark: &gt; 55%
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Critical Inflation Risk Alerts */}
        {report.topSurgingIngredients.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 print:text-amber-800">
              2. Major Ingredient Inflation Surges (&ge; 20% Annual Growth)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-forest-border print:border-neutral-300 text-neutral-400 print:text-neutral-600 font-medium">
                    <th className="py-2 px-3">Ingredient</th>
                    <th className="py-2 px-3">Unit</th>
                    <th className="py-2 px-3 text-right">Start Price</th>
                    <th className="py-2 px-3 text-right">Ending Price</th>
                    <th className="py-2 px-3 text-right">Inflation Surge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-forest-border/40 print:divide-neutral-200 font-mono">
                  {report.topSurgingIngredients.map((ing) => (
                    <tr key={ing.ingredientName}>
                      <td className="py-2 px-3 font-sans font-semibold text-white print:text-neutral-900">
                        {ing.ingredientName}
                      </td>
                      <td className="py-2 px-3 text-neutral-300 print:text-neutral-700">{ing.unit}</td>
                      <td className="py-2 px-3 text-right text-neutral-300 print:text-neutral-700">
                        {formatINR(ing.startPrice)}
                      </td>
                      <td className="py-2 px-3 text-right text-red-300 print:text-red-700 font-semibold">
                        {formatINR(ing.endPrice)}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-400 print:text-amber-800 font-bold">
                        +{ing.percentageChange.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Kasavana & Smith Menu Engineering Quadrants */}
        {report.menuEngineering && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 print:text-blue-800">
              3. Menu Engineering Quadrants & Benchmarks
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 print:bg-neutral-50 print:border-neutral-300">
                <span className="font-bold text-emerald-300 print:text-emerald-800 block">⭐ Stars ({report.menuEngineering.categoryCounts.stars})</span>
                <span className="text-[11px] text-neutral-400 print:text-neutral-600">High volume, high contribution. Maintain portioning.</span>
              </div>
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/50 print:bg-neutral-50 print:border-neutral-300">
                <span className="font-bold text-amber-300 print:text-amber-800 block">🐴 Plowhorses ({report.menuEngineering.categoryCounts.plowhorses})</span>
                <span className="text-[11px] text-neutral-400 print:text-neutral-600">High volume, low contribution. Increase price or reduce cost.</span>
              </div>
              <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-800/50 print:bg-neutral-50 print:border-neutral-300">
                <span className="font-bold text-blue-300 print:text-blue-800 block">🧩 Puzzles ({report.menuEngineering.categoryCounts.puzzles})</span>
                <span className="text-[11px] text-neutral-400 print:text-neutral-600">Low volume, high contribution. Reposition or bundle in combos.</span>
              </div>
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-800/50 print:bg-neutral-50 print:border-neutral-300">
                <span className="font-bold text-red-300 print:text-red-800 block">🐕 Dogs ({report.menuEngineering.categoryCounts.dogs})</span>
                <span className="text-[11px] text-neutral-400 print:text-neutral-600">Low volume, low contribution. Consider removing from menu.</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: 12-Month Historical Runway Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white print:text-neutral-900">
            4. 12-Month Chronological Performance Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-forest-border print:border-neutral-300 text-neutral-400 print:text-neutral-600 font-medium">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Revenue</th>
                  <th className="py-2 px-3 text-right">Food Cost</th>
                  <th className="py-2 px-3 text-right">Gross Profit</th>
                  <th className="py-2 px-3 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-border/40 print:divide-neutral-200 font-mono">
                {report.monthlyRunway.map((m) => (
                  <tr key={m.date}>
                    <td className="py-2 px-3 text-neutral-300 print:text-neutral-800">{m.date}</td>
                    <td className="py-2 px-3 text-right text-emerald-400 print:text-emerald-700 font-semibold">
                      {formatINR(m.revenue)}
                    </td>
                    <td className="py-2 px-3 text-right text-red-300 print:text-red-700">
                      {formatINR(m.ingredientCost)}
                    </td>
                    <td className="py-2 px-3 text-right text-white print:text-neutral-900 font-semibold">
                      {formatINR(m.grossProfit)}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-300 print:text-neutral-700">
                      {m.grossMarginPercentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5: Forecast & Combo Summary */}
        {(report.forecastSummary || (report.topCombos && report.topCombos.length > 0)) && (
          <div className="space-y-3 border-t border-forest-border/60 print:border-neutral-300 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 print:text-purple-800">
              5. Strategic Projections & Recommended Bundles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {report.forecastSummary && (
                <div className="p-3.5 rounded-xl bg-forest-elevated/40 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300 space-y-1">
                  <span className="font-bold text-white print:text-neutral-900 block">
                    {report.forecastSummary.horizonMonths}-Month Baseline Profit Forecast
                  </span>
                  <div className="text-neutral-300 print:text-neutral-700 space-y-0.5">
                    <div>Projected Revenue: <strong>{formatINR(report.forecastSummary.baselineRevenue)}</strong></div>
                    <div>Projected Contribution: <strong>{formatINR(report.forecastSummary.baselineContribution)}</strong></div>
                    <div>Projected Margin: <strong>{report.forecastSummary.baselineMarginPercentage.toFixed(1)}%</strong></div>
                  </div>
                </div>
              )}

              {report.topCombos && report.topCombos.length > 0 && (
                <div className="p-3.5 rounded-xl bg-forest-elevated/40 border border-forest-border/60 print:bg-neutral-50 print:border-neutral-300 space-y-1">
                  <span className="font-bold text-white print:text-neutral-900 block">
                    Optimized Menu Bundles ({report.topCombos.length} Candidates)
                  </span>
                  <div className="text-neutral-300 print:text-neutral-700 space-y-0.5">
                    {report.topCombos.slice(0, 2).map((c) => (
                      <div key={c.comboId}>
                        • {c.comboName} ({c.comboType}): {formatINR(c.comboSellingPrice)} (Margin: {c.comboMarginPercentage.toFixed(1)}%)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
