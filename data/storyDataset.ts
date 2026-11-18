import { StoryDataset, parseFullStoryDataset } from "./csvParser";

export * from "./csvParser";

/**
 * Loads the canonical story dataset in browser environments (Next.js client-side Demo mode).
 * Uses local same-origin HTTP requests to fetch /data/*.csv from public/data/.
 * Requires zero external network calls, zero API keys, and survives offline execution.
 */
export async function loadStoryDatasetFromBrowser(baseOrigin = ""): Promise<StoryDataset> {
  const [menuRes, recipesRes, pricesRes, salesRes] = await Promise.all([
    fetch(`${baseOrigin}/data/menu.csv`),
    fetch(`${baseOrigin}/data/recipes.csv`),
    fetch(`${baseOrigin}/data/ingredient_prices.csv`),
    fetch(`${baseOrigin}/data/sales.csv`),
  ]);

  if (!menuRes.ok || !recipesRes.ok || !pricesRes.ok || !salesRes.ok) {
    throw new Error("Failed to load canonical CSV datasets via same-origin fetch");
  }

  const [menuCsv, recipesCsv, ingredientPricesCsv, salesCsv] = await Promise.all([
    menuRes.text(),
    recipesRes.text(),
    pricesRes.text(),
    salesRes.text(),
  ]);

  return parseFullStoryDataset({
    menuCsv,
    recipesCsv,
    ingredientPricesCsv,
    salesCsv,
  });
}
