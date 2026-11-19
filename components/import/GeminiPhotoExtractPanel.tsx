"use client";

import React, { useState, useRef } from "react";
import {
  ExtractedRecipe,
  ExtractedRecipeSchema,
  ExtractedInvoice,
  ExtractedInvoiceSchema,
  convertExtractedRecipeToDomain,
  convertExtractedInvoiceToDomain,
} from "@/schemas/extraction";
import { useAppStore } from "@/store/useAppStore";
import { mergeCustomDataset } from "@/data/csvImporter";
import { IngredientPriceRecord } from "@/schemas";

type ExtractionMode = "recipe" | "invoice";

export function GeminiPhotoExtractPanel() {
  const { dataset, applyCustomDataset } = useAppStore();
  const [mode, setMode] = useState<ExtractionMode>("recipe");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [allowMock, setAllowMock] = useState(true);
  const [isExtracting, setIsExtracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted and editable state
  const [extractedRecipe, setExtractedRecipe] = useState<ExtractedRecipe | null>(null);
  const [extractedInvoice, setExtractedInvoice] = useState<ExtractedInvoice | null>(null);
  const [isMockedResult, setIsMockedResult] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setStatusMessage(null);
    setExtractedRecipe(null);
    setExtractedInvoice(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleExtract = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select or drop an image first.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);
    setStatusMessage("Extracting structured culinary data with Gemini multimodal vision...");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("extractionType", mode);
      formData.append("allowMock", allowMock ? "true" : "false");

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        if (json.isApiKeyMissing) {
          throw new Error(
            "GEMINI_API_KEY is not set on the server. Check 'Use simulated photo extraction' to test the full pipeline offline."
          );
        }
        throw new Error(json.error || "Failed to extract data from image.");
      }

      setIsMockedResult(Boolean(json.isMocked));

      // ZOD VALIDATION GATE: Never trust raw API JSON directly into application state
      if (mode === "recipe") {
        const parseResult = ExtractedRecipeSchema.safeParse(json.data);
        if (!parseResult.success) {
          const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
          throw new Error(`Zod Schema Validation Failed on Gemini output: ${issues}`);
        }
        setExtractedRecipe(parseResult.data);
        setStatusMessage(
          `Extracted recipe '${parseResult.data.dishName}' with ${parseResult.data.ingredients.length} ingredients. Review below.`
        );
      } else {
        const parseResult = ExtractedInvoiceSchema.safeParse(json.data);
        if (!parseResult.success) {
          const issues = parseResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
          throw new Error(`Zod Schema Validation Failed on Gemini output: ${issues}`);
        }
        setExtractedInvoice(parseResult.data);
        setStatusMessage(
          `Extracted invoice with ${parseResult.data.items.length} line items. Review and confirm below.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error during photo extraction";
      setErrorMessage(msg);
      setStatusMessage(null);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyRecipe = () => {
    if (!dataset || !extractedRecipe) return;

    try {
      const domain = convertExtractedRecipeToDomain(extractedRecipe);

      // Ensure every ingredient in the new recipe has a baseline price record in the dataset
      const existingPrices = [...dataset.ingredientPrices];
      const existingPriceIds = new Set(existingPrices.map((p) => p.ingredientId));
      const newPrices: IngredientPriceRecord[] = [];

      domain.recipes.forEach((r) => {
        if (!existingPriceIds.has(r.ingredientId)) {
          // Synthesize standard baseline price for newly imported ingredient
          const fallbackPrice: IngredientPriceRecord = {
            date: "2025-01-01",
            ingredientId: r.ingredientId,
            ingredientName: r.ingredientName,
            price: 150,
            unit: r.unit,
            currency: "INR",
          };
          newPrices.push(fallbackPrice);
          existingPriceIds.add(r.ingredientId);
        }
      });

      // Merge into custom dataset
      const updatedMenu = [...dataset.menu.filter((m) => m.id !== domain.menu.id), domain.menu];
      const updatedRecipes = [
        ...dataset.recipes.filter((r) => r.dishId !== domain.menu.id),
        ...domain.recipes,
      ];
      const updatedPrices = [...existingPrices, ...newPrices];

      const merged = mergeCustomDataset(dataset, {
        menu: updatedMenu,
        recipes: updatedRecipes,
        ingredientPrices: updatedPrices,
      });

      applyCustomDataset(merged);
      setStatusMessage(`Successfully integrated recipe '${domain.menu.name}' into active dataset!`);
      setExtractedRecipe(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply extracted recipe";
      setErrorMessage(msg);
    }
  };

  const handleApplyInvoice = () => {
    if (!dataset || !extractedInvoice) return;

    try {
      const newPriceRecords = convertExtractedInvoiceToDomain(extractedInvoice);
      // Append or replace price records for matching date & ingredientId
      const priceMap = new Map<string, IngredientPriceRecord>();
      dataset.ingredientPrices.forEach((p) => priceMap.set(`${p.date}_${p.ingredientId}`, p));
      newPriceRecords.forEach((p) => priceMap.set(`${p.date}_${p.ingredientId}`, p));

      const merged = mergeCustomDataset(dataset, {
        ingredientPrices: Array.from(priceMap.values()),
      });

      applyCustomDataset(merged);
      setStatusMessage(`Successfully imported ${newPriceRecords.length} supplier price records into active dataset!`);
      setExtractedInvoice(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to apply invoice price records";
      setErrorMessage(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Extraction Mode Selector */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Gemini Vision Multimodal Extraction
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Extract structured recipes or ingredient invoices directly from camera photos or scanned documents.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode("recipe");
                setExtractedRecipe(null);
                setExtractedInvoice(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "recipe"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              📝 Handwritten Recipe
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("invoice");
                setExtractedRecipe(null);
                setExtractedInvoice(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                mode === "invoice"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
            >
              🧾 Supplier Invoice / Bill
            </button>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="md:col-span-2 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-500 rounded-xl p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[160px] bg-neutral-50/50 dark:bg-neutral-800/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="text-3xl mb-2">📸</div>
            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {selectedFile ? selectedFile.name : "Click to select or drop document photo"}
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              Supports JPEG, PNG, WEBP up to 5MB. Clear, well-lit photos improve OCR precision.
            </p>
          </div>

          {/* Image Thumbnail Preview & Actions */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 flex flex-col justify-between bg-white dark:bg-neutral-900">
            {previewUrl ? (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Photo Preview
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="w-full h-24 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-24 text-neutral-400 text-xs italic">
                No photo selected
              </div>
            )}

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <label className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMock}
                  onChange={(e) => setAllowMock(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <span>Allow simulated fallback if offline</span>
              </label>

              <button
                type="button"
                disabled={!selectedFile || isExtracting}
                onClick={handleExtract}
                className="w-full py-2 px-3 text-xs font-bold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
              >
                {isExtracting ? "Extracting with Gemini..." : "Extract Data with Gemini"}
              </button>
            </div>
          </div>
        </div>

        {/* Status / Error Alerts */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>✓</span>
              <span>{statusMessage}</span>
            </span>
            {isMockedResult && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                Simulated Output
              </span>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Extracted Recipe Review & Human-in-the-Loop Editing Gate */}
      {extractedRecipe && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 uppercase">
                  Recipe Extraction Gate
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Confidence: {extractedRecipe.confidence.toUpperCase()}
                </span>
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Review & Edit Extracted Dish Before Integrating
              </h4>
            </div>

            <button
              type="button"
              onClick={handleApplyRecipe}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Confirm & Save to Active Menu
            </button>
          </div>

          {/* Dish Top-Level Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Dish Name</label>
              <input
                type="text"
                value={extractedRecipe.dishName}
                onChange={(e) => setExtractedRecipe({ ...extractedRecipe, dishName: e.target.value })}
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Category</label>
              <select
                value={extractedRecipe.category}
                onChange={(e) =>
                  setExtractedRecipe({
                    ...extractedRecipe,
                    category: e.target.value as "Main" | "Appetizer" | "Pasta" | "Dessert",
                  })
                }
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              >
                <option value="Main">Main</option>
                <option value="Appetizer">Appetizer</option>
                <option value="Pasta">Pasta</option>
                <option value="Dessert">Dessert</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Target Base Price (₹)</label>
              <input
                type="number"
                value={extractedRecipe.estimatedBasePrice ?? 500}
                onChange={(e) =>
                  setExtractedRecipe({
                    ...extractedRecipe,
                    estimatedBasePrice: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* Ingredients Table */}
          <div>
            <label className="text-xs text-neutral-500 font-medium block mb-2">
              Recipe Ingredients ({extractedRecipe.ingredients.length})
            </label>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Ingredient Name</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Unit</th>
                    <th className="py-2 px-3">Flags / Confidence</th>
                    <th className="py-2 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {extractedRecipe.ingredients.map((ing, idx) => (
                    <tr key={idx} className={ing.isUncertain ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                      <td className="py-2 px-3 text-neutral-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={ing.ingredientName}
                          onChange={(e) => {
                            const newIngs = [...extractedRecipe.ingredients];
                            newIngs[idx].ingredientName = e.target.value;
                            setExtractedRecipe({ ...extractedRecipe, ingredients: newIngs });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
                        />
                      </td>
                      <td className="py-2 px-3 w-28">
                        <input
                          type="number"
                          step="0.01"
                          value={ing.quantity ?? ""}
                          onChange={(e) => {
                            const newIngs = [...extractedRecipe.ingredients];
                            newIngs[idx].quantity = e.target.value ? parseFloat(e.target.value) : null;
                            newIngs[idx].isUncertain = false;
                            setExtractedRecipe({ ...extractedRecipe, ingredients: newIngs });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3 w-24">
                        <input
                          type="text"
                          value={ing.unit}
                          onChange={(e) => {
                            const newIngs = [...extractedRecipe.ingredients];
                            newIngs[idx].unit = e.target.value;
                            setExtractedRecipe({ ...extractedRecipe, ingredients: newIngs });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        {ing.isUncertain ? (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-semibold">
                            ⚠️ Verify Quantity
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400">✓ Validated</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            const newIngs = extractedRecipe.ingredients.filter((_, i) => i !== idx);
                            setExtractedRecipe({ ...extractedRecipe, ingredients: newIngs });
                          }}
                          className="text-neutral-400 hover:text-rose-500 text-xs"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Invoice Review & Human-in-the-Loop Editing Gate */}
      {extractedInvoice && (
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 uppercase">
                  Invoice Extraction Gate
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  Confidence: {extractedInvoice.confidence.toUpperCase()}
                </span>
              </div>
              <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-1">
                Review & Confirm Supplier Invoices
              </h4>
            </div>

            <button
              type="button"
              onClick={handleApplyInvoice}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
            >
              Confirm & Save {extractedInvoice.items.length} Price Records
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Supplier Name</label>
              <input
                type="text"
                value={extractedInvoice.supplierName ?? ""}
                onChange={(e) => setExtractedInvoice({ ...extractedInvoice, supplierName: e.target.value })}
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Invoice Date (YYYY-MM-DD)</label>
              <input
                type="date"
                value={extractedInvoice.invoiceDate ?? "2025-10-15"}
                onChange={(e) => setExtractedInvoice({ ...extractedInvoice, invoiceDate: e.target.value })}
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 font-medium block mb-1">Currency</label>
              <input
                type="text"
                disabled
                value="INR (₹)"
                className="w-full text-xs font-semibold p-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
              />
            </div>
          </div>

          {/* Invoice Items Table */}
          <div>
            <label className="text-xs text-neutral-500 font-medium block mb-2">
              Invoice Line Items ({extractedInvoice.items.length})
            </label>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Item / Ingredient</th>
                    <th className="py-2 px-3">Quantity</th>
                    <th className="py-2 px-3">Unit</th>
                    <th className="py-2 px-3">Unit Price (₹)</th>
                    <th className="py-2 px-3">Line Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 font-mono">
                  {extractedInvoice.items.map((item, idx) => (
                    <tr key={idx} className={item.isUncertain ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                      <td className="py-2 px-3 text-neutral-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.ingredientName}
                          onChange={(e) => {
                            const newItems = [...extractedInvoice.items];
                            newItems[idx].ingredientName = e.target.value;
                            setExtractedInvoice({ ...extractedInvoice, items: newItems });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900 font-sans"
                        />
                      </td>
                      <td className="py-2 px-3 w-24">
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity ?? ""}
                          onChange={(e) => {
                            const newItems = [...extractedInvoice.items];
                            newItems[idx].quantity = e.target.value ? parseFloat(e.target.value) : null;
                            setExtractedInvoice({ ...extractedInvoice, items: newItems });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
                        />
                      </td>
                      <td className="py-2 px-3 w-20">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => {
                            const newItems = [...extractedInvoice.items];
                            newItems[idx].unit = e.target.value;
                            setExtractedInvoice({ ...extractedInvoice, items: newItems });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
                        />
                      </td>
                      <td className="py-2 px-3 w-28">
                        <input
                          type="number"
                          step="0.5"
                          value={item.unitPrice ?? ""}
                          onChange={(e) => {
                            const newItems = [...extractedInvoice.items];
                            newItems[idx].unitPrice = e.target.value ? parseFloat(e.target.value) : null;
                            newItems[idx].isUncertain = false;
                            setExtractedInvoice({ ...extractedInvoice, items: newItems });
                          }}
                          className="w-full text-xs p-1 border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-900"
                        />
                      </td>
                      <td className="py-2 px-3 text-neutral-700 dark:text-neutral-300">
                        {item.quantity && item.unitPrice
                          ? `₹${(item.quantity * item.unitPrice).toLocaleString()}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
