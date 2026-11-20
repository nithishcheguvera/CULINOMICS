import { z } from "zod";
import { AuthoritativeFact } from "@/ai/tools/factFactory";

export const AssistantRequestSchema = z.object({
  message: z.string().trim().min(1, "User query cannot be empty").max(2000, "User query exceeds 2,000 characters"),
  datasetMode: z.enum(["demo", "custom"]),
  customDataset: z.unknown().optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(3000),
      })
    )
    .max(10, "Conversation history cannot exceed 10 turns")
    .optional(),
  selectedDishId: z.string().trim().min(1).max(64).optional(),
  selectedTimelineDate: z.string().trim().optional(),
  activeScenario: z
    .object({
      dishId: z.string().trim().min(1).max(64),
      targetSellingPrice: z.number().nonnegative(),
      targetIngredientCost: z.number().nonnegative(),
      targetMonthlyVolume: z.number().int().nonnegative(),
    })
    .optional(),
});

export type AssistantRequestBody = z.infer<typeof AssistantRequestSchema>;

/**
 * Heuristic audit verifying numerical claims in the assistant message against authoritative facts.
 */
export function auditNumericalClaims(message: string, facts: AuthoritativeFact[]): string[] {
  const warnings: string[] = [];
  if (!message || facts.length === 0) return warnings;

  const numberRegex = /(?:₹|\$)?\b(\d+(?:,\d+)*(?:\.\d+)?)(%?)\b/g;
  const numbersInMessage: number[] = [];

  let match: RegExpExecArray | null;
  while ((match = numberRegex.exec(message)) !== null) {
    const rawDigits = match[1].replace(/,/g, "");
    const val = parseFloat(rawDigits);
    // Ignore common years or small non-percentage integers (e.g. numbered lists 1., 2.)
    if (val === 2024 || val === 2025 || val === 2026 || val === 0 || (val >= 1 && val <= 5 && !match[2])) {
      continue;
    }
    numbersInMessage.push(val);
  }

  const verifiedNumbers = new Set<number>();
  for (const fact of facts) {
    verifiedNumbers.add(Math.round(fact.rawNumericValue));
    verifiedNumbers.add(Number(fact.rawNumericValue.toFixed(1)));
    verifiedNumbers.add(Number(fact.rawNumericValue.toFixed(2)));
    verifiedNumbers.add(Math.floor(fact.rawNumericValue));
    verifiedNumbers.add(Math.ceil(fact.rawNumericValue));
  }

  const unverifiedClaims = numbersInMessage.filter((n) => {
    for (const v of verifiedNumbers) {
      if (Math.abs(n - v) < 0.1 || (v > 0 && Math.abs(n - v) / v < 0.03)) {
        return false;
      }
    }
    return true;
  });

  if (unverifiedClaims.length > 0) {
    warnings.push(
      "Heuristic Audit Notice: The response contains numerical figures that could not be matched directly against the authoritative fact cards. Please verify figures against the authoritative cards."
    );
  }

  return warnings;
}
