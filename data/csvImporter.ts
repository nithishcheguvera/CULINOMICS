import Papa from "papaparse";
import { z } from "zod";
import {
  SaleRecord,
  SaleRecordSchema,
  RecipeItem,
  RecipeItemSchema,
  IngredientPriceRecord,
  IngredientPriceRecordSchema,
  MenuItem,
  MenuItemSchema,
} from "@/schemas";
import { StoryDataset } from "./csvParser";

export type ImportCategory = "sales" | "recipes" | "ingredient_prices" | "menu";

export interface RowValidationError {
  rowNumber: number; // 1-based index (header is row 1)
  field: string;
  value: unknown;
  message: string;
}

export interface CsvValidationResult<T> {
  category: ImportCategory;
  fileName: string;
  totalRows: number;
  validRows: T[];
  invalidRowCount: number;
  errors: RowValidationError[];
  isValid: boolean;
  duplicateCount: number;
}

/**
 * Parses and validates CSV rows row-by-row using Zod schemas.
 * Collects detailed error locations rather than aborting on the first failure.
 */
export function validateCsvContent<T>(
  csvText: string,
  category: ImportCategory,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<T, z.ZodTypeDef, any>,
  fileName = "uploaded.csv",
  uniqueKeyFn?: (item: T) => string
): CsvValidationResult<T> {
  const parsed = Papa.parse<Record<string, unknown>>(csvText.trim(), {
    header: true,
    skipEmptyLines: "greedy",
    dynamicTyping: true,
  });

  const validRows: T[] = [];
  const errors: RowValidationError[] = [];
  const seenKeys = new Set<string>();
  let duplicateCount = 0;

  if (parsed.errors && parsed.errors.length > 0) {
    parsed.errors.forEach((pe) => {
      errors.push({
        rowNumber: (pe.row ?? 0) + 2,
        field: "CSV Format",
        value: pe.code,
        message: pe.message,
      });
    });
  }

  parsed.data.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header line

    const result = schema.safeParse(rawRow);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path.join(".") || "row";
        const val = rawRow[issue.path[0] as string];
        errors.push({
          rowNumber,
          field: fieldName,
          value: val,
          message: issue.message,
        });
      });
    } else {
      const item = result.data;
      if (uniqueKeyFn) {
        const key = uniqueKeyFn(item);
        if (seenKeys.has(key)) {
          duplicateCount++;
          errors.push({
            rowNumber,
            field: "Duplicate Record",
            value: key,
            message: `Duplicate entry detected for unique key: '${key}'`,
          });
          return;
        }
        seenKeys.add(key);
      }
      validRows.push(item);
    }
  });

  return {
    category,
    fileName,
    totalRows: parsed.data.length,
    validRows,
    invalidRowCount: parsed.data.length - validRows.length,
    errors,
    isValid: errors.length === 0 && validRows.length > 0,
    duplicateCount,
  };
}

/**
 * Validates Sales CSV content
 */
export function validateSalesCsv(csvText: string, fileName?: string): CsvValidationResult<SaleRecord> {
  return validateCsvContent<SaleRecord>(
    csvText,
    "sales",
    SaleRecordSchema,
    fileName,
    (item) => `${item.date}_${item.dishId}`
  );
}

/**
 * Validates Recipe CSV content
 */
export function validateRecipesCsv(csvText: string, fileName?: string): CsvValidationResult<RecipeItem> {
  return validateCsvContent<RecipeItem>(
    csvText,
    "recipes",
    RecipeItemSchema,
    fileName,
    (item) => `${item.dishId}_${item.ingredientId}`
  );
}

/**
 * Validates Ingredient Price CSV content
 */
export function validateIngredientPricesCsv(
  csvText: string,
  fileName?: string
): CsvValidationResult<IngredientPriceRecord> {
  return validateCsvContent<IngredientPriceRecord>(
    csvText,
    "ingredient_prices",
    IngredientPriceRecordSchema,
    fileName,
    (item) => `${item.date}_${item.ingredientId}`
  );
}

/**
 * Validates Menu CSV content
 */
export function validateMenuCsv(csvText: string, fileName?: string): CsvValidationResult<MenuItem> {
  return validateCsvContent<MenuItem>(
    csvText,
    "menu",
    MenuItemSchema,
    fileName,
    (item) => item.id
  );
}

/**
 * Merges validated custom rows into a base dataset.
 * Guarantees that the resulting candidate dataset is complete and structurally sound.
 */
export function mergeCustomDataset(
  baseDataset: StoryDataset,
  updates: {
    sales?: SaleRecord[];
    recipes?: RecipeItem[];
    ingredientPrices?: IngredientPriceRecord[];
    menu?: MenuItem[];
  }
): StoryDataset {
  const mergedMenu = updates.menu && updates.menu.length > 0 ? updates.menu : [...baseDataset.menu];
  const mergedRecipes = updates.recipes && updates.recipes.length > 0 ? updates.recipes : [...baseDataset.recipes];
  const mergedPrices =
    updates.ingredientPrices && updates.ingredientPrices.length > 0
      ? updates.ingredientPrices
      : [...baseDataset.ingredientPrices];
  const mergedSales = updates.sales && updates.sales.length > 0 ? updates.sales : [...baseDataset.sales];

  // Consistency checks: Every dish in sales and recipes must exist in menu
  const menuIds = new Set(mergedMenu.map((m) => m.id));
  const missingInMenu = new Set<string>();

  mergedSales.forEach((s) => {
    if (!menuIds.has(s.dishId)) missingInMenu.add(s.dishId);
  });
  mergedRecipes.forEach((r) => {
    if (!menuIds.has(r.dishId)) missingInMenu.add(r.dishId);
  });

  if (missingInMenu.size > 0) {
    throw new Error(
      `Dataset consistency error: Dishes present in sales/recipes not found in menu: ${Array.from(missingInMenu).join(", ")}`
    );
  }

  // Check that every recipe ingredient has at least one price record
  const priceIngredientIds = new Set(mergedPrices.map((p) => p.ingredientId));
  const missingPrices = new Set<string>();
  mergedRecipes.forEach((r) => {
    if (!priceIngredientIds.has(r.ingredientId)) {
      missingPrices.add(r.ingredientId);
    }
  });

  if (missingPrices.size > 0) {
    throw new Error(
      `Dataset consistency error: Recipe ingredients missing price history: ${Array.from(missingPrices).join(", ")}`
    );
  }

  return {
    menu: mergedMenu,
    recipes: mergedRecipes,
    ingredientPrices: mergedPrices,
    sales: mergedSales,
  };
}

