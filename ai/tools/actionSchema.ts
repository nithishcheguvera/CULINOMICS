import { z } from "zod";

/**
 * Shared, strictly typed Visualization Action Schema for CULINOMICS AI Decision Assistant.
 *
 * Property names match exactly with:
 * - Gemini structured output
 * - Server-side validation
 * - Client-side Zustand actions (setActiveTab, setSelectedDishId, setThreeMode, setSelectedTimelineDate)
 */
export const VisualizationActionSchema = z.discriminatedUnion("actionType", [
  z.object({
    actionType: z.literal("SET_ACTIVE_TAB"),
    tab: z.enum([
      "all",
      "overview",
      "matrix",
      "profitability",
      "replay",
      "explorer3d",
      "import",
      "simulator",
    ]),
    dishId: z.string().trim().min(1).max(64).optional(),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    actionType: z.literal("SET_SELECTED_DISH"),
    dishId: z.string().trim().min(1).max(64),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    actionType: z.literal("SET_THREE_MODE"),
    threeMode: z.enum([
      "profitability-landscape",
      "ingredient-inflation",
      "recipe-replay",
      "sales-volume",
      "margin-breakdown",
      "inflation-impact",
    ]),
    dishId: z.string().trim().min(1).max(64).optional(),
    timelineDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD")
      .optional(),
    label: z.string().trim().min(1).max(120),
  }),
  z.object({
    actionType: z.literal("SET_TIMELINE_DATE"),
    timelineDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
    label: z.string().trim().min(1).max(120),
  }),
]);

export type VisualizationAction = z.infer<typeof VisualizationActionSchema>;
