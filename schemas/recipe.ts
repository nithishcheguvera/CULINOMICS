import { z } from "zod";
import { UnitSchema } from "./units";

export const RecipeItemSchema = z.object({
  dishId: z.string().min(1, "Dish ID is required"),
  dishName: z.string().min(1, "Dish name is required"),
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  ingredientName: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Ingredient quantity must be positive"),
  unit: UnitSchema,
});

export type RecipeItem = z.infer<typeof RecipeItemSchema>;
export const RecipeSchema = z.array(RecipeItemSchema);
