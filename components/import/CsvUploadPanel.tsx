"use client";

import React, { useState, useRef } from "react";
import {
  ImportCategory,
  CsvValidationResult,
  validateSalesCsv,
  validateRecipesCsv,
  validateIngredientPricesCsv,
  validateMenuCsv,
} from "@/data/csvImporter";

interface CsvUploadPanelProps {
  onValidated: (result: CsvValidationResult<unknown>) => void;
}

export function CsvUploadPanel({ onValidated }: CsvUploadPanelProps) {
  const [category, setCategory] = useState<ImportCategory>("sales");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryLabels: Record<ImportCategory, { name: string; desc: string; sampleCols: string }> = {
    sales: {
      name: "Sales Records",
      desc: "Historical dish sales quantities and realizing selling prices per date",
      sampleCols: "date, dishId, dishName, quantity, sellingPrice, currency",
    },
    recipes: {
      name: "Recipe Data",
      desc: "Dish ingredient requirements, quantities, and standard measurement units",
      sampleCols: "dishId, dishName, ingredientId, ingredientName, quantity, unit",
    },
    ingredient_prices: {
      name: "Ingredient Price History",
      desc: "Supplier market price history per unit for individual ingredients",
      sampleCols: "date, ingredientId, ingredientName, price, unit, currency",
    },
    menu: {
      name: "Menu Catalog",
      desc: "Restaurant menu items, categories, base selling prices and descriptions",
      sampleCols: "id, name, category, basePrice, currency, description",
    },
  };

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      let result: CsvValidationResult<unknown>;
      switch (category) {
        case "sales":
          result = validateSalesCsv(text, file.name);
          break;
        case "recipes":
          result = validateRecipesCsv(text, file.name);
          break;
        case "ingredient_prices":
          result = validateIngredientPricesCsv(text, file.name);
          break;
        case "menu":
          result = validateMenuCsv(text, file.name);
          break;
      }
      onValidated(result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Category Selection Tabs */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-2">
          Select Data Category to Import
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(categoryLabels) as ImportCategory[]).map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setFileName(null);
                }}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                    : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:border-neutral-400"
                }`}
              >
                <div className="font-semibold text-xs sm:text-sm">{categoryLabels[cat].name}</div>
                <div className="text-[11px] opacity-75 mt-0.5 truncate">{cat}.csv</div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
          Expected CSV Columns: <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[11px] font-mono">{categoryLabels[category].sampleCols}</code>
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
            : "border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 bg-white dark:bg-neutral-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3 text-2xl">
          📂
        </div>
        <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {fileName ? (
            <span className="text-emerald-600 dark:text-emerald-400">File Selected: {fileName}</span>
          ) : (
            <span>Click to browse or drag & drop CSV file here</span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Supports valid UTF-8 CSV formatted files with standard headers. Zod schema validation will run automatically.
        </p>
      </div>
    </div>
  );
}
