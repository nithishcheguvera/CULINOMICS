"use client";

import React, { useState } from "react";
import { CsvValidationResult, RowValidationError, mergeCustomDataset } from "@/data/csvImporter";
import { useAppStore } from "@/store/useAppStore";
import { SaleRecord, RecipeItem, IngredientPriceRecord, MenuItem } from "@/schemas";

interface ImportValidationPreviewProps {
  result: CsvValidationResult<unknown>;
  onDiscard: () => void;
  onSuccess?: () => void;
}

export function ImportValidationPreview({ result, onDiscard, onSuccess }: ImportValidationPreviewProps) {
  const { dataset, applyCustomDataset } = useAppStore();
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    category,
    fileName,
    totalRows,
    validRows,
    invalidRowCount,
    errors,
    isValid,
    duplicateCount,
  } = result;

  const handleApply = () => {
    if (!dataset) {
      setApplyError("Cannot apply imported data: Baseline dataset is not loaded.");
      return;
    }
    if (validRows.length === 0) {
      setApplyError("Cannot apply: No valid records to import.");
      return;
    }

    setIsApplying(true);
    setApplyError(null);

    try {
      let merged;
      switch (category) {
        case "sales":
          merged = mergeCustomDataset(dataset, { sales: validRows as SaleRecord[] });
          break;
        case "recipes":
          merged = mergeCustomDataset(dataset, { recipes: validRows as RecipeItem[] });
          break;
        case "ingredient_prices":
          merged = mergeCustomDataset(dataset, { ingredientPrices: validRows as IngredientPriceRecord[] });
          break;
        case "menu":
          merged = mergeCustomDataset(dataset, { menu: validRows as MenuItem[] });
          break;
      }

      applyCustomDataset(merged);
      setSuccessMessage(`Successfully applied ${validRows.length} ${category} records to the active dashboard.`);
      if (onSuccess) {
        setTimeout(onSuccess, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to merge dataset";
      setApplyError(msg);
    } finally {
      setIsApplying(false);
    }
  };

  const categoryName = {
    sales: "Sales Records",
    recipes: "Recipe Items",
    ingredient_prices: "Ingredient Prices",
    menu: "Menu Catalog",
  }[category];

  return (
    <div className="space-y-6">
      {/* Summary Status Header */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                {categoryName}
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                {fileName}
              </span>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              CSV Validation & Staging Report
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDiscard}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-700 dark:text-neutral-300"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={validRows.length === 0 || isApplying}
              onClick={handleApply}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isApplying ? "Calculating Engine..." : `Apply ${validRows.length} Records to Dashboard`}
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
            <div className="text-xs text-neutral-500">Total Scanned Rows</div>
            <div className="text-xl font-bold font-mono text-neutral-900 dark:text-neutral-100">
              {totalRows}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Valid Records</div>
            <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
              {validRows.length}
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${
            invalidRowCount > 0
              ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400"
              : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 text-neutral-500"
          }`}>
            <div className="text-xs font-medium">Validation Issues</div>
            <div className="text-xl font-bold font-mono">
              {invalidRowCount}
            </div>
          </div>
          <div className={`p-3 rounded-lg border ${
            duplicateCount > 0
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400"
              : "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 text-neutral-500"
          }`}>
            <div className="text-xs font-medium">Duplicates Filtered</div>
            <div className="text-xl font-bold font-mono">
              {duplicateCount}
            </div>
          </div>
        </div>

        {/* Success Notice */}
        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Notice */}
        {applyError && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{applyError}</span>
          </div>
        )}
      </div>

      {/* Row-Level Errors Ledger */}
      {errors.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-rose-200 dark:border-rose-900/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <span>⚠️</span>
              Row-Level Validation Error Ledger ({errors.length} {errors.length === 1 ? "issue" : "issues"})
            </h4>
            <span className="text-[11px] text-neutral-500">
              Only clean, validated rows will be merged into the active dataset
            </span>
          </div>

          <div className="overflow-x-auto max-h-60 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2 px-3">Row #</th>
                  <th className="py-2 px-3">Target Field</th>
                  <th className="py-2 px-3">Parsed Value</th>
                  <th className="py-2 px-3">Issue Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                {errors.slice(0, 100).map((err, idx) => (
                  <tr key={idx} className="hover:bg-rose-50/30 dark:hover:bg-rose-950/10">
                    <td className="py-2 px-3 font-semibold text-neutral-700 dark:text-neutral-300">
                      Line {err.rowNumber}
                    </td>
                    <td className="py-2 px-3 text-neutral-800 dark:text-neutral-200">
                      {err.field}
                    </td>
                    <td className="py-2 px-3 text-neutral-500 truncate max-w-[150px]">
                      {err.value !== undefined ? String(err.value) : "<empty>"}
                    </td>
                    <td className="py-2 px-3 text-rose-600 dark:text-rose-400 font-sans">
                      {err.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {errors.length > 100 && (
            <div className="text-[11px] text-neutral-500 text-center mt-2">
              Showing first 100 of {errors.length} issues.
            </div>
          )}
        </div>
      )}

      {/* Valid Rows Preview Table */}
      {validRows.length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <span>📋</span>
              Valid Records Staging Preview ({validRows.length} ready)
            </h4>
            <span className="text-[11px] text-neutral-500">
              Previewing up to 25 verified records
            </span>
          </div>

          <div className="overflow-x-auto max-h-72 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                <tr>
                  <th className="py-2 px-3">#</th>
                  {Object.keys(validRows[0] as Record<string, unknown>).map((key) => (
                    <th key={key} className="py-2 px-3">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono text-[11px]">
                {validRows.slice(0, 25).map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="py-1.5 px-3 text-neutral-400">{idx + 1}</td>
                    {Object.values(row as Record<string, unknown>).map((val, cIdx) => (
                      <td key={cIdx} className="py-1.5 px-3 text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                        {typeof val === "number" ? val.toLocaleString() : String(val ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {validRows.length > 25 && (
            <div className="text-[11px] text-neutral-500 text-center mt-2">
              Showing first 25 of {validRows.length} valid records.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
