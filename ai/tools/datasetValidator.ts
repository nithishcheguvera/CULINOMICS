import { z } from "zod";
import { MenuItemSchema, RecipeItemSchema, IngredientPriceRecordSchema, SaleRecordSchema, Unit } from "@/schemas";
import { validateUnitCompatibility } from "@/schemas/units";

/**
 * Validated Story Dataset Schema for CULINOMICS AI Decision Assistant.
 *
 * Implements strict relational integrity, date continuity, unit compatibility,
 * and duplicate prevention before any custom dataset reaches the deterministic financial engine.
 */
export const ValidatedStoryDatasetSchema = z
  .object({
    menu: z
      .array(MenuItemSchema)
      .min(1, "Menu must contain at least 1 dish item")
      .max(50, "Menu cannot exceed 50 dish items for AI assistant processing"),
    recipes: z
      .array(RecipeItemSchema)
      .min(1, "Recipes must contain at least 1 ingredient component")
      .max(1000, "Recipes cannot exceed 1,000 component records"),
    ingredientPrices: z
      .array(IngredientPriceRecordSchema)
      .min(1, "Ingredient prices must contain at least 1 record")
      .max(3000, "Ingredient price history cannot exceed 3,000 records"),
    sales: z
      .array(SaleRecordSchema)
      .min(1, "Sales history must contain at least 1 transaction record")
      .max(3000, "Sales history cannot exceed 3,000 records"),
  })
  .superRefine((data, ctx) => {
    // 1. Unique Menu Dish IDs
    const seenMenuIds = new Set<string>();
    for (let i = 0; i < data.menu.length; i++) {
      const dish = data.menu[i];
      if (seenMenuIds.has(dish.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["menu", i, "id"],
          message: `Duplicate dish ID '${dish.id}' detected in menu. Each menu item must have a unique ID.`,
        });
      }
      seenMenuIds.add(dish.id);
    }

    // 2. Positive & Finite Ingredient Prices
    for (let i = 0; i < data.ingredientPrices.length; i++) {
      const priceRecord = data.ingredientPrices[i];
      if (!Number.isFinite(priceRecord.price) || priceRecord.price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ingredientPrices", i, "price"],
          message: `Invalid price for ingredient '${priceRecord.ingredientId}' on date '${priceRecord.date}'. Prices must be positive finite numbers.`,
        });
      }
    }

    // 3. Consistent Pricing Units for the same Ingredient across all Dates
    const pricingUnitMap = new Map<string, { unit: Unit; firstDate: string }>();
    for (let i = 0; i < data.ingredientPrices.length; i++) {
      const priceRecord = data.ingredientPrices[i];
      const existing = pricingUnitMap.get(priceRecord.ingredientId);
      if (existing) {
        if (existing.unit !== priceRecord.unit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["ingredientPrices", i, "unit"],
            message: `Inconsistent pricing unit for ingredient '${priceRecord.ingredientId}'. Recorded as '${priceRecord.unit}' on '${priceRecord.date}', but was '${existing.unit}' on '${existing.firstDate}'.`,
          });
        }
      } else {
        pricingUnitMap.set(priceRecord.ingredientId, {
          unit: priceRecord.unit,
          firstDate: priceRecord.date,
        });
      }
    }

    // 4. Duplicate Check: Unique (dishId, ingredientId) in Recipes
    const seenRecipeKeys = new Set<string>();
    for (let i = 0; i < data.recipes.length; i++) {
      const recipe = data.recipes[i];
      const key = `${recipe.dishId}::${recipe.ingredientId}`;
      if (seenRecipeKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipes", i, "ingredientId"],
          message: `Duplicate ingredient component '${recipe.ingredientId}' in dish '${recipe.dishId}'. Quantities must be aggregated into a single recipe line.`,
        });
      }
      seenRecipeKeys.add(key);
    }

    // 5. Duplicate Check: Unique (date, ingredientId) in Ingredient Prices
    const seenPriceKeys = new Set<string>();
    for (let i = 0; i < data.ingredientPrices.length; i++) {
      const p = data.ingredientPrices[i];
      const key = `${p.date}::${p.ingredientId}`;
      if (seenPriceKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ingredientPrices", i, "date"],
          message: `Conflicting duplicate price record for ingredient '${p.ingredientId}' on date '${p.date}'. Each ingredient must have at most one price per date.`,
        });
      }
      seenPriceKeys.add(key);
    }

    // 6. Duplicate Check: Unique (date, dishId) in Sales Records
    const seenSalesKeys = new Set<string>();
    for (let i = 0; i < data.sales.length; i++) {
      const s = data.sales[i];
      const key = `${s.date}::${s.dishId}`;
      if (seenSalesKeys.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sales", i, "date"],
          message: `Duplicate sales record for dish '${s.dishId}' on date '${s.date}'. Periodic sales volumes must be aggregated into a single record.`,
        });
      }
      seenSalesKeys.add(key);
    }

    // 7. Relational Integrity: Recipe dishId exists in Menu
    for (let i = 0; i < data.recipes.length; i++) {
      const r = data.recipes[i];
      if (!seenMenuIds.has(r.dishId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipes", i, "dishId"],
          message: `Recipe references dishId '${r.dishId}' which does not exist in the menu.`,
        });
      }
    }

    // 8. Relational Integrity: Sales dishId exists in Menu
    for (let i = 0; i < data.sales.length; i++) {
      const s = data.sales[i];
      if (!seenMenuIds.has(s.dishId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sales", i, "dishId"],
          message: `Sales record references dishId '${s.dishId}' which does not exist in the menu.`,
        });
      }
    }

    // 9. Relational Integrity & Unit Compatibility: Recipe ingredientId in Price Records
    for (let i = 0; i < data.recipes.length; i++) {
      const r = data.recipes[i];
      const priceUnitInfo = pricingUnitMap.get(r.ingredientId);
      if (!priceUnitInfo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recipes", i, "ingredientId"],
          message: `Recipe component '${r.ingredientId}' (${r.ingredientName}) in dish '${r.dishId}' has no historical price records.`,
        });
      } else {
        const isCompatible = validateUnitCompatibility(r.unit, priceUnitInfo.unit);
        if (!isCompatible) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["recipes", i, "unit"],
            message: `Incompatible units for ingredient '${r.ingredientId}' in dish '${r.dishId}': recipe unit '${r.unit}' cannot be converted to pricing unit '${priceUnitInfo.unit}'.`,
          });
        }
      }
    }

    // 10. Date Granularity & Historical Price Coverage Policy:
    // Every dish sold on date D must have price records for all its recipe ingredients on date D.
    const dishIngredientsMap = new Map<string, string[]>();
    for (const r of data.recipes) {
      const list = dishIngredientsMap.get(r.dishId) || [];
      list.push(r.ingredientId);
      dishIngredientsMap.set(r.dishId, list);
    }

    for (let i = 0; i < data.sales.length; i++) {
      const s = data.sales[i];
      const requiredIngredients = dishIngredientsMap.get(s.dishId) || [];
      for (const ingId of requiredIngredients) {
        const key = `${s.date}::${ingId}`;
        if (!seenPriceKeys.has(key)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["sales", i, "date"],
            message: `Missing historical price coverage: Dish '${s.dishId}' was sold on '${s.date}', but ingredient '${ingId}' has no price record for date '${s.date}'. All active sales periods require complete ingredient price coverage.`,
          });
        }
      }
    }
  });

export type ValidatedStoryDataset = z.infer<typeof ValidatedStoryDatasetSchema>;
