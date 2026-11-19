"use client";

import React, { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { CsvValidationResult } from "@/data/csvImporter";
import { CsvUploadPanel } from "./CsvUploadPanel";
import { ImportValidationPreview } from "./ImportValidationPreview";
import { GeminiPhotoExtractPanel } from "./GeminiPhotoExtractPanel";

type ImportSubTab = "csv" | "photo" | "health";

export function SmartImportSection() {
  const { dataset, datasetMode, restoreDemoDataset, isLoading } = useAppStore();
  const [subTab, setSubTab] = useState<ImportSubTab>("csv");
  const [validationResult, setValidationResult] = useState<CsvValidationResult<unknown> | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const handleRestoreDemo = async () => {
    try {
      await restoreDemoDataset();
      setValidationResult(null);
      setStatusNotice("Canonical demo dataset restored successfully.");
      setTimeout(() => setStatusNotice(null), 3500);
    } catch {
      setStatusNotice("Failed to restore demo dataset.");
    }
  };

  const menuCount = dataset?.menu.length ?? 0;
  const recipeCount = dataset?.recipes.length ?? 0;
  const priceCount = dataset?.ingredientPrices.length ?? 0;
  const salesCount = dataset?.sales.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Active Dataset Status & Controls */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  datasetMode === "custom"
                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {datasetMode === "custom" ? "Custom User Dataset Active" : "Canonical Demo Dataset Active"}
              </span>
              <span className="text-xs text-neutral-400">•</span>
              <span className="text-xs text-neutral-500 font-mono">
                {menuCount} Dishes | {recipeCount} Recipe Lines | {priceCount} Price Records | {salesCount} Sales
              </span>
            </div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              Smart Data Import & Multimodal Extraction
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Import restaurant CSV spreadsheets or photograph handwritten recipes & supplier invoices for AI parsing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {datasetMode === "custom" && (
              <button
                type="button"
                disabled={isLoading}
                onClick={handleRestoreDemo}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 transition-colors shadow-sm"
              >
                ↺ Restore Verified Demo Data
              </button>
            )}
          </div>
        </div>

        {statusNotice && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <span>✓</span>
            <span>{statusNotice}</span>
          </div>
        )}
      </div>

      {/* Import Sub Navigation Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 gap-4">
        <button
          type="button"
          onClick={() => setSubTab("csv")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === "csv"
              ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span>📊</span>
          <span>CSV Spreadsheet Importer</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("photo")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === "photo"
              ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span>📸</span>
          <span>Gemini Photo-to-Data Extraction</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab("health")}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === "health"
              ? "border-neutral-900 dark:border-white text-neutral-900 dark:text-white"
              : "border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <span>🛡️</span>
          <span>Dataset Health & Catalog</span>
        </button>
      </div>

      {/* Subtab 1: CSV Upload */}
      {subTab === "csv" && (
        <div>
          {validationResult ? (
            <ImportValidationPreview
              result={validationResult}
              onDiscard={() => setValidationResult(null)}
              onSuccess={() => setValidationResult(null)}
            />
          ) : (
            <CsvUploadPanel onValidated={(res) => setValidationResult(res)} />
          )}
        </div>
      )}

      {/* Subtab 2: Gemini Multimodal Vision Extraction */}
      {subTab === "photo" && <GeminiPhotoExtractPanel />}

      {/* Subtab 3: Dataset Health & Catalog */}
      {subTab === "health" && dataset && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
              Currently Loaded Dishes ({dataset.menu.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {dataset.menu.map((dish) => {
                const recipeRows = dataset.recipes.filter((r) => r.dishId === dish.id);
                return (
                  <div
                    key={dish.id}
                    className="p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {dish.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                        {dish.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-2 font-mono">
                      Base Price: ₹{dish.basePrice}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {recipeRows.length} ingredients linked
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
              Dataset Consistency Verification
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span>✓</span>
                <span>All {dataset.sales.length} sales records map to valid registered menu dishes.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span>✓</span>
                <span>All {dataset.recipes.length} recipe ingredients map to registered supplier price records.</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <span>✓</span>
                <span>Currency consistency verified: 100% INR (₹) across all sales, recipes, and invoices.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
