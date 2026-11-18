import { z } from "zod";

/**
 * Strict Gregorian Calendar Date Schema (YYYY-MM-DD)
 * Validates format, real-world month boundaries, and leap-year rules.
 */
export const IsoDateSchema = z.string().superRefine((val, ctx) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
  if (!match) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid date format. Expected strict YYYY-MM-DD",
    });
    return;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid calendar month: ${month}. Must be 01-12`,
    });
    return;
  }

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (day < 1 || day > daysInMonth[month - 1]) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Invalid calendar day ${day} for month ${month} in year ${year}`,
    });
  }
});
