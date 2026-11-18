import { z } from "zod";
import { IsoDateSchema } from "./date";
import { CurrencyCodeSchema } from "./currency";

export const SaleRecordSchema = z.object({
  date: IsoDateSchema,
  dishId: z.string().min(1, "Dish ID is required"),
  dishName: z.string().min(1, "Dish name is required"),
  quantity: z.number().int("Quantity must be an integer").positive("Quantity must be positive"),
  sellingPrice: z.number().positive("Realized selling price must be positive in INR"),
  currency: CurrencyCodeSchema.default("INR"),
});

export type SaleRecord = z.infer<typeof SaleRecordSchema>;
export const SalesHistorySchema = z.array(SaleRecordSchema);
