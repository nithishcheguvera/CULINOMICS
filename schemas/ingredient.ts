import { z } from "zod";
import { IsoDateSchema } from "./date";
import { CurrencyCodeSchema } from "./currency";
import { UnitSchema } from "./units";

export const IngredientPriceRecordSchema = z.object({
  date: IsoDateSchema,
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  ingredientName: z.string().min(1, "Ingredient name is required"),
  price: z.number().positive("Price must be positive in INR"),
  currency: CurrencyCodeSchema.default("INR"),
  unit: UnitSchema,
});

export type IngredientPriceRecord = z.infer<typeof IngredientPriceRecordSchema>;
export const IngredientPriceHistorySchema = z.array(IngredientPriceRecordSchema);
