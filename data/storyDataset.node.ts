import fs from "fs";
import path from "path";
import { StoryDataset, parseFullStoryDataset } from "./csvParser";

/**
 * Loads the canonical story dataset from the physical CSV files on disk.
 * Strictly used in Node.js, Vitest test suites, and Next.js Server Components / API routes.
 */
export function loadStoryDatasetFromDisk(dataDir?: string): StoryDataset {
  const dir = dataDir || path.resolve(process.cwd(), "public/data");

  const menuCsv = fs.readFileSync(path.join(dir, "menu.csv"), "utf-8");
  const recipesCsv = fs.readFileSync(path.join(dir, "recipes.csv"), "utf-8");
  const ingredientPricesCsv = fs.readFileSync(path.join(dir, "ingredient_prices.csv"), "utf-8");
  const salesCsv = fs.readFileSync(path.join(dir, "sales.csv"), "utf-8");

  return parseFullStoryDataset({
    menuCsv,
    recipesCsv,
    ingredientPricesCsv,
    salesCsv,
  });
}
