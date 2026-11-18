import Papa from "papaparse";
import { z } from "zod";
import {
  MenuItemSchema,
  MenuItem,
  RecipeItemSchema,
  RecipeItem,
  IngredientPriceRecordSchema,
  IngredientPriceRecord,
  SaleRecordSchema,
  SaleRecord,
} from "@/schemas";

/**
 * Pure, environment-agnostic CSV parser and validator.
 * Accepts raw CSV text and parses rows strictly against Zod schemas.
 */
export function parseCsvRows<Output, Def extends z.ZodTypeDef = z.ZodTypeDef, Input = unknown>(
  csvText: string,
  schema: z.ZodType<Output, Def, Input>
): Output[] {
  const result = Papa.parse(csvText.trim(), {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (result.errors && result.errors.length > 0) {
    throw new Error(`CSV Parsing Error: ${result.errors[0].message} (row: ${result.errors[0].row})`);
  }

  return (result.data as Record<string, unknown>[]).map((row, index) => {
    try {
      return schema.parse(row);
    } catch (err) {
      if (err instanceof z.ZodError) {
        throw new Error(
          `Validation failed for row ${index + 1}: ${err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`
        );
      }
      throw err;
    }
  });
}

export function parseMenuCsv(csvText: string): MenuItem[] {
  return parseCsvRows(csvText, MenuItemSchema);
}

export function parseRecipesCsv(csvText: string): RecipeItem[] {
  return parseCsvRows(csvText, RecipeItemSchema);
}

export function parseIngredientPricesCsv(csvText: string): IngredientPriceRecord[] {
  return parseCsvRows(csvText, IngredientPriceRecordSchema);
}

export function parseSalesCsv(csvText: string): SaleRecord[] {
  return parseCsvRows(csvText, SaleRecordSchema);
}

export interface StoryDataset {
  menu: MenuItem[];
  recipes: RecipeItem[];
  ingredientPrices: IngredientPriceRecord[];
  sales: SaleRecord[];
}

export function parseFullStoryDataset(raw: {
  menuCsv: string;
  recipesCsv: string;
  ingredientPricesCsv: string;
  salesCsv: string;
}): StoryDataset {
  return {
    menu: parseMenuCsv(raw.menuCsv),
    recipes: parseRecipesCsv(raw.recipesCsv),
    ingredientPrices: parseIngredientPricesCsv(raw.ingredientPricesCsv),
    sales: parseSalesCsv(raw.salesCsv),
  };
}
