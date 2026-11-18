import { z } from "zod";
import { CurrencyCodeSchema } from "./currency";

export const MenuCategorySchema = z.enum(["Appetizer", "Main", "Pasta", "Dessert", "Beverage"]);
export type MenuCategory = z.infer<typeof MenuCategorySchema>;

export const MenuItemSchema = z.object({
  id: z.string().min(1, "Dish ID cannot be empty"),
  name: z.string().min(1, "Dish name cannot be empty"),
  category: MenuCategorySchema,
  basePrice: z.number().positive("Base price must be positive in INR"),
  currency: CurrencyCodeSchema.default("INR"),
  description: z.string().optional(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;
