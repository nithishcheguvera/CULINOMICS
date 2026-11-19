import { z } from "zod";
import { RecipeItem, MenuItem, IngredientPriceRecord } from "@/schemas";
import { normalizeUnit } from "./units";

export const ExtractedIngredientItemSchema = z.object({
  ingredientName: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.number().positive().nullable(),
  unit: z.string().min(1, "Unit cannot be empty"),
  notes: z.string().nullable().optional(),
  isUncertain: z.boolean().default(false),
});

export const ExtractedRecipeSchema = z.object({
  dishName: z.string().min(1, "Dish name cannot be empty"),
  category: z.enum(["Main", "Appetizer", "Pasta", "Dessert"]).default("Main"),
  estimatedBasePrice: z.number().positive().nullable().optional(),
  notes: z.string().nullable().optional(),
  ingredients: z.array(ExtractedIngredientItemSchema).min(1, "Recipe must have at least one ingredient"),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  unclearFields: z.array(z.string()).default([]),
});

export type ExtractedRecipe = z.infer<typeof ExtractedRecipeSchema>;

export const ExtractedInvoiceItemSchema = z.object({
  ingredientName: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.number().positive().nullable(),
  unit: z.string().min(1, "Unit cannot be empty"),
  unitPrice: z.number().positive().nullable(),
  lineTotal: z.number().positive().nullable().optional(),
  isUncertain: z.boolean().default(false),
});

export const ExtractedInvoiceSchema = z.object({
  supplierName: z.string().nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invoice date must be YYYY-MM-DD").nullable().optional(),
  currency: z.literal("INR").default("INR"),
  items: z.array(ExtractedInvoiceItemSchema).min(1, "Invoice must contain at least one line item"),
  totalAmount: z.number().positive().nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  unclearFields: z.array(z.string()).default([]),
});

export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;

/**
 * Converts an extracted recipe into validated domain records: a MenuItem and RecipeItem[]
 */
export function convertExtractedRecipeToDomain(
  extracted: ExtractedRecipe,
  options?: { dishId?: string; basePrice?: number }
): { menu: MenuItem; recipes: RecipeItem[] } {
  const dishId =
    options?.dishId ||
    extracted.dishName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const basePrice = options?.basePrice ?? extracted.estimatedBasePrice ?? 500;

  const menu: MenuItem = {
    id: dishId,
    name: extracted.dishName,
    category: extracted.category,
    basePrice,
    currency: "INR",
    description: extracted.notes || `Recipe extracted via Gemini for ${extracted.dishName}`,
  };

  const recipes: RecipeItem[] = extracted.ingredients.map((ing) => {
    const ingredientId = ing.ingredientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const unit = normalizeUnit(ing.unit);

    return {
      dishId,
      dishName: extracted.dishName,
      ingredientId,
      ingredientName: ing.ingredientName,
      quantity: ing.quantity ?? 0.1,
      unit,
    };
  });

  return { menu, recipes };
}

/**
 * Converts extracted invoice items into validated IngredientPriceRecord[]
 */
export function convertExtractedInvoiceToDomain(
  extracted: ExtractedInvoice,
  options?: { date?: string }
): IngredientPriceRecord[] {
  const invoiceDate = options?.date || extracted.invoiceDate || new Date().toISOString().split("T")[0];

  return extracted.items.map((item) => {
    const ingredientId = item.ingredientName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const unit = normalizeUnit(item.unit);
    const price = item.unitPrice ?? (item.lineTotal && item.quantity ? item.lineTotal / item.quantity : 100);

    return {
      date: invoiceDate,
      ingredientId,
      ingredientName: item.ingredientName,
      price,
      unit,
      currency: "INR",
    };
  });
}
