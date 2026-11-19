import { z } from "zod";

export const WeightUnitSchema = z.enum(["g", "kg", "oz", "lb"]);
export type WeightUnit = z.infer<typeof WeightUnitSchema>;

export const VolumeUnitSchema = z.enum(["ml", "l", "fl_oz"]);
export type VolumeUnit = z.infer<typeof VolumeUnitSchema>;

export const CountUnitSchema = z.enum(["item", "portion"]);
export type CountUnit = z.infer<typeof CountUnitSchema>;

export const UnitSchema = z.union([WeightUnitSchema, VolumeUnitSchema, CountUnitSchema]);
export type Unit = z.infer<typeof UnitSchema>;

export type UnitDimension = "mass" | "volume" | "count";

export function getUnitDimension(unit: Unit): UnitDimension {
  if (["g", "kg", "oz", "lb"].includes(unit)) return "mass";
  if (["ml", "l", "fl_oz"].includes(unit)) return "volume";
  if (["item", "portion"].includes(unit)) return "count";
  throw new Error(`Unknown unit dimension for unit: ${unit}`);
}

export const MASS_FACTORS: Record<WeightUnit, number> = {
  g: 1.0,
  kg: 1000.0,
  oz: 28.349523125,
  lb: 453.59237,
};

export const VOLUME_FACTORS: Record<VolumeUnit, number> = {
  ml: 1.0,
  l: 1000.0,
  fl_oz: 29.5735295625,
};

export interface ConvertUnitOptions {
  densityGramsPerMl?: number;
  itemsPerPortion?: number;
}

/**
 * Deterministic, dimension-aware unit conversion function.
 * Internal calculations preserve full floating-point precision without premature rounding.
 */
export function convertUnit(
  quantity: number,
  fromUnit: Unit,
  toUnit: Unit,
  options?: ConvertUnitOptions
): number {
  if (typeof quantity !== "number" || !Number.isFinite(quantity)) {
    throw new Error("Quantity to convert must be a finite number");
  }
  if (quantity < 0) {
    throw new Error("Quantity to convert cannot be negative");
  }
  if (fromUnit === toUnit) {
    return quantity;
  }

  const fromDim = getUnitDimension(fromUnit);
  const toDim = getUnitDimension(toUnit);

  // 1. Compatible Mass dimension
  if (fromDim === "mass" && toDim === "mass") {
    const inGrams = quantity * MASS_FACTORS[fromUnit as WeightUnit];
    return inGrams / MASS_FACTORS[toUnit as WeightUnit];
  }

  // 2. Compatible Volume dimension
  if (fromDim === "volume" && toDim === "volume") {
    const inMl = quantity * VOLUME_FACTORS[fromUnit as VolumeUnit];
    return inMl / VOLUME_FACTORS[toUnit as VolumeUnit];
  }

  // 3. Count to Count conversions (requires explicit itemsPerPortion)
  if (fromDim === "count" && toDim === "count") {
    if (!options?.itemsPerPortion || !Number.isFinite(options.itemsPerPortion) || options.itemsPerPortion <= 0) {
      throw new Error("Items per portion must be a positive finite number");
    }
    if (fromUnit === "portion" && toUnit === "item") {
      return quantity * options.itemsPerPortion;
    }
    if (fromUnit === "item" && toUnit === "portion") {
      return quantity / options.itemsPerPortion;
    }
  }

  // 4. Cross-dimension Mass <-> Volume (strictly requires positive finite density)
  if ((fromDim === "mass" && toDim === "volume") || (fromDim === "volume" && toDim === "mass")) {
    if (!options?.densityGramsPerMl || !Number.isFinite(options.densityGramsPerMl) || options.densityGramsPerMl <= 0) {
      throw new Error("Density must be a positive finite number (g/ml)");
    }
    if (fromDim === "mass" && toDim === "volume") {
      const inGrams = quantity * MASS_FACTORS[fromUnit as WeightUnit];
      const inMl = inGrams / options.densityGramsPerMl;
      return inMl / VOLUME_FACTORS[toUnit as VolumeUnit];
    } else {
      const inMl = quantity * VOLUME_FACTORS[fromUnit as VolumeUnit];
      const inGrams = inMl * options.densityGramsPerMl;
      return inGrams / MASS_FACTORS[toUnit as WeightUnit];
    }
  }

  throw new Error(`Incompatible unit dimensions: cannot convert '${fromUnit}' (${fromDim}) to '${toUnit}' (${toDim})`);
}

/**
 * Normalizes common variations of unit strings into canonical Unit types.
 */
export function normalizeUnit(rawUnit: string): Unit {
  const clean = (rawUnit || "").toLowerCase().trim();
  if (["kg", "kilogram", "kilograms", "kgs"].includes(clean)) return "kg";
  if (["g", "gram", "grams", "gm"].includes(clean)) return "g";
  if (["oz", "ounce", "ounces"].includes(clean)) return "oz";
  if (["lb", "pound", "pounds", "lbs"].includes(clean)) return "lb";
  if (["l", "liter", "liters", "litre", "litres", "ltr"].includes(clean)) return "l";
  if (["ml", "milliliter", "milliliters", "millilitre", "millilitres"].includes(clean)) return "ml";
  if (["fl_oz", "floz", "fl oz", "fluid ounce", "fluid ounces"].includes(clean)) return "fl_oz";
  if (["item", "items", "pc", "pcs", "piece", "pieces", "unit", "units"].includes(clean)) return "item";
  if (["portion", "portions", "serving", "servings"].includes(clean)) return "portion";
  return "item";
}

