import { describe, it, expect } from "vitest";
import {
  IsoDateSchema,
  convertUnit,
  MenuItemSchema,
  RecipeItemSchema,
  IngredientPriceRecordSchema,
  SaleRecordSchema,
} from "@/schemas";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";

describe("Strict Calendar Date Validation", () => {
  it("accepts valid calendar dates and leap years", () => {
    expect(IsoDateSchema.safeParse("2025-01-01").success).toBe(true);
    expect(IsoDateSchema.safeParse("2025-12-31").success).toBe(true);
    expect(IsoDateSchema.safeParse("2024-02-29").success).toBe(true); // 2024 is leap year
  });

  it("rejects non-leap year February 29th", () => {
    const result = IsoDateSchema.safeParse("2025-02-29");
    expect(result.success).toBe(false);
  });

  it("rejects impossible days for 30-day and 31-day months", () => {
    expect(IsoDateSchema.safeParse("2025-02-30").success).toBe(false);
    expect(IsoDateSchema.safeParse("2025-04-31").success).toBe(false); // April has 30 days
    expect(IsoDateSchema.safeParse("2025-06-31").success).toBe(false); // June has 30 days
    expect(IsoDateSchema.safeParse("2025-09-31").success).toBe(false); // Sept has 30 days
    expect(IsoDateSchema.safeParse("2025-11-31").success).toBe(false); // Nov has 30 days
  });

  it("rejects invalid month numbers and malformed date strings", () => {
    expect(IsoDateSchema.safeParse("2025-00-15").success).toBe(false);
    expect(IsoDateSchema.safeParse("2025-13-01").success).toBe(false);
    expect(IsoDateSchema.safeParse("2025/01/01").success).toBe(false);
    expect(IsoDateSchema.safeParse("01-01-2025").success).toBe(false);
    expect(IsoDateSchema.safeParse("not-a-date").success).toBe(false);
  });
});

describe("Complete Unit Conversion System", () => {
  it("converts correctly within the mass dimension", () => {
    expect(convertUnit(500, "g", "kg")).toBe(0.5);
    expect(convertUnit(1, "kg", "g")).toBe(1000);
    expect(convertUnit(16, "oz", "lb")).toBeCloseTo(1, 4);
    expect(convertUnit(1, "lb", "g")).toBeCloseTo(453.59237, 4);
  });

  it("converts correctly within the volume dimension", () => {
    expect(convertUnit(1000, "ml", "l")).toBe(1);
    expect(convertUnit(2.5, "l", "ml")).toBe(2500);
    expect(convertUnit(1, "fl_oz", "ml")).toBeCloseTo(29.5735, 3);
  });

  it("converts correctly between mass and volume when explicit density is provided", () => {
    // Olive oil: 1000ml with density 0.92 g/ml = 920g
    const grams = convertUnit(1000, "ml", "g", { densityGramsPerMl: 0.92 });
    expect(grams).toBeCloseTo(920, 2);

    // Olive oil: 920g to ml
    const ml = convertUnit(920, "g", "ml", { densityGramsPerMl: 0.92 });
    expect(ml).toBeCloseTo(1000, 2);
  });

  it("converts discrete count units when explicit ratio is provided", () => {
    // 2 portions with 4 items per portion = 8 items
    expect(convertUnit(2, "portion", "item", { itemsPerPortion: 4 })).toBe(8);
    // 12 items with 4 items per portion = 3 portions
    expect(convertUnit(12, "item", "portion", { itemsPerPortion: 4 })).toBe(3);
  });

  it("rejects NaN, Infinity and negative quantities", () => {
    expect(() => convertUnit(NaN, "g", "kg")).toThrow("Quantity to convert must be a finite number");
    expect(() => convertUnit(Infinity, "g", "kg")).toThrow("Quantity to convert must be a finite number");
    expect(() => convertUnit(-10, "g", "kg")).toThrow("Quantity to convert cannot be negative");
  });

  it("rejects cross-dimension conversion when density is missing, zero, or negative", () => {
    expect(() => convertUnit(100, "g", "ml")).toThrow("Density must be a positive finite number");
    expect(() => convertUnit(100, "g", "ml", { densityGramsPerMl: 0 })).toThrow("Density must be a positive finite number");
    expect(() => convertUnit(100, "g", "ml", { densityGramsPerMl: -0.92 })).toThrow("Density must be a positive finite number");
  });

  it("rejects count conversions when itemsPerPortion is missing, zero, or negative", () => {
    expect(() => convertUnit(2, "portion", "item")).toThrow("Items per portion must be a positive finite number");
    expect(() => convertUnit(2, "portion", "item", { itemsPerPortion: 0 })).toThrow("Items per portion must be a positive finite number");
    expect(() => convertUnit(2, "portion", "item", { itemsPerPortion: -2 })).toThrow("Items per portion must be a positive finite number");
  });

  it("rejects incompatible cross-dimension conversions (count to mass/volume)", () => {
    expect(() => convertUnit(5, "item", "kg")).toThrow("Incompatible unit dimensions");
    expect(() => convertUnit(2, "portion", "l")).toThrow("Incompatible unit dimensions");
  });
});

describe("Canonical Story Dataset Verification", () => {
  const dataset = loadStoryDatasetFromDisk();

  it("loads the exact expected counts for all entities", () => {
    expect(dataset.menu.length).toBe(8);
    expect(dataset.recipes.length).toBe(57);
    expect(dataset.ingredientPrices.length).toBe(444); // 37 ingredients * 12 months
    expect(dataset.sales.length).toBe(96); // 8 dishes * 12 months
  });

  it("guarantees 100% of rows parse through Zod schemas with valid INR currency", () => {
    dataset.menu.forEach((item) => {
      expect(MenuItemSchema.parse(item)).toBeDefined();
      expect(item.currency).toBe("INR");
      expect(item.basePrice).toBeGreaterThan(0);
    });

    dataset.recipes.forEach((item) => {
      expect(RecipeItemSchema.parse(item)).toBeDefined();
      expect(item.quantity).toBeGreaterThan(0);
    });

    dataset.ingredientPrices.forEach((record) => {
      expect(IngredientPriceRecordSchema.parse(record)).toBeDefined();
      expect(record.currency).toBe("INR");
      expect(record.price).toBeGreaterThan(0);
    });

    dataset.sales.forEach((record) => {
      expect(SaleRecordSchema.parse(record)).toBeDefined();
      expect(record.currency).toBe("INR");
      expect(record.sellingPrice).toBeGreaterThan(0);
      expect(record.quantity).toBeGreaterThan(0);
    });
  });

  it("enforces strict referential integrity across all records", () => {
    const dishIds = new Set(dataset.menu.map((m) => m.id));
    const ingredientIds = new Set(dataset.ingredientPrices.map((i) => i.ingredientId));

    // Every recipe references a valid dish and valid ingredient
    dataset.recipes.forEach((r) => {
      expect(dishIds.has(r.dishId)).toBe(true);
      expect(ingredientIds.has(r.ingredientId)).toBe(true);
    });

    // Every sales record references a valid dish
    dataset.sales.forEach((s) => {
      expect(dishIds.has(s.dishId)).toBe(true);
    });
  });

  it("ensures each active ingredient has exactly 12 monthly price records", () => {
    const ingredientRecordsCount: Record<string, number> = {};
    dataset.ingredientPrices.forEach((rec) => {
      ingredientRecordsCount[rec.ingredientId] = (ingredientRecordsCount[rec.ingredientId] || 0) + 1;
    });

    expect(Object.keys(ingredientRecordsCount).length).toBe(37);
    Object.values(ingredientRecordsCount).forEach((count) => {
      expect(count).toBe(12);
    });
  });
});

describe("Mathematical Menu Engineering & Inflation Verification", () => {
  const dataset = loadStoryDatasetFromDisk();

  // Helper to get ingredient price for a given month and ingredientId
  const getIngredientPrice = (ingredientId: string, monthDate: string): number => {
    const rec = dataset.ingredientPrices.find(
      (p) => p.ingredientId === ingredientId && p.date === monthDate
    );
    if (!rec) throw new Error(`Missing price for ${ingredientId} on ${monthDate}`);
    return rec.price;
  };

  // Helper to compute dish unit cost for a given month
  const computeDishCost = (dishId: string, monthDate: string): number => {
    const items = dataset.recipes.filter((r) => r.dishId === dishId);
    return items.reduce((sum, item) => {
      const price = getIngredientPrice(item.ingredientId, monthDate);
      return sum + item.quantity * price;
    }, 0);
  };

  it("verifies the 3 inflation-affected dishes reproduce expected cost surges and margin erosion", () => {
    // 1. Truffle Tenderloin
    const tenderloinJanCost = computeDishCost("truffle-tenderloin", "2025-01-01");
    const tenderloinDecCost = computeDishCost("truffle-tenderloin", "2025-12-01");
    expect(tenderloinJanCost).toBeCloseTo(335.12, 1);
    expect(tenderloinDecCost).toBeCloseTo(601.14, 1);
    const tenderloinCostIncreasePercent = ((tenderloinDecCost - tenderloinJanCost) / tenderloinJanCost) * 100;
    expect(tenderloinCostIncreasePercent).toBeGreaterThan(70); // +79.4%

    // 2. Tiger Prawn Risotto
    const risottoJanCost = computeDishCost("prawn-risotto", "2025-01-01");
    const risottoDecCost = computeDishCost("prawn-risotto", "2025-12-01");
    expect(risottoJanCost).toBeCloseTo(295.09, 1);
    expect(risottoDecCost).toBeCloseTo(506.11, 1);
    const risottoCostIncreasePercent = ((risottoDecCost - risottoJanCost) / risottoJanCost) * 100;
    expect(risottoCostIncreasePercent).toBeGreaterThan(65); // +71.5%

    // 3. Classic Tiramisu
    const tiramisuJanCost = computeDishCost("classic-tiramisu", "2025-01-01");
    const tiramisuDecCost = computeDishCost("classic-tiramisu", "2025-12-01");
    expect(tiramisuJanCost).toBeCloseTo(150.60, 1);
    expect(tiramisuDecCost).toBeCloseTo(275.00, 1);
    const tiramisuCostIncreasePercent = ((tiramisuDecCost - tiramisuJanCost) / tiramisuJanCost) * 100;
    expect(tiramisuCostIncreasePercent).toBeGreaterThan(80); // +82.6%
  });

  it("verifies programmatic menu engineering produces >= 2 Stars, >= 1 Plowhorse, >= 1 Puzzle, >= 1 Dog", () => {
    const dates = Array.from(new Set(dataset.sales.map((s) => s.date))).sort();
    expect(dates.length).toBe(12);

    const dishStats = dataset.menu.map((dish) => {
      const sales = dataset.sales.filter((s) => s.dishId === dish.id);
      const totalVolume = sales.reduce((sum, s) => sum + s.quantity, 0);
      const avgVolume = totalVolume / 12;

      let totalCost = 0;
      let totalRevenue = 0;
      dates.forEach((date) => {
        const sale = sales.find((s) => s.date === date)!;
        const unitCost = computeDishCost(dish.id, date);
        totalCost += unitCost * sale.quantity;
        totalRevenue += sale.sellingPrice * sale.quantity;
      });

      const avgUnitCost = totalCost / totalVolume;
      const avgRealizedPrice = totalRevenue / totalVolume;
      const avgContributionMargin = avgRealizedPrice - avgUnitCost;

      return {
        id: dish.id,
        avgVolume,
        avgContributionMargin,
      };
    });

    const vThresh = dishStats.reduce((sum, d) => sum + d.avgVolume, 0) / dishStats.length;
    const mThresh = dishStats.reduce((sum, d) => sum + d.avgContributionMargin, 0) / dishStats.length;

    expect(vThresh).toBeCloseTo(240.0, 1);
    expect(mThresh).toBeCloseTo(345.74, 1);

    const classifications = dishStats.map((d) => {
      const isHighVolume = d.avgVolume > vThresh;
      const isHighMargin = d.avgContributionMargin > mThresh;
      if (isHighVolume && isHighMargin) return "STAR";
      if (isHighVolume && !isHighMargin) return "PLOWHORSE";
      if (!isHighVolume && isHighMargin) return "PUZZLE";
      return "DOG";
    });

    const starCount = classifications.filter((c) => c === "STAR").length;
    const plowhorseCount = classifications.filter((c) => c === "PLOWHORSE").length;
    const puzzleCount = classifications.filter((c) => c === "PUZZLE").length;
    const dogCount = classifications.filter((c) => c === "DOG").length;

    expect(starCount).toBeGreaterThanOrEqual(2);
    expect(plowhorseCount).toBeGreaterThanOrEqual(1);
    expect(puzzleCount).toBeGreaterThanOrEqual(1);
    expect(dogCount).toBeGreaterThanOrEqual(1);
  });
});
