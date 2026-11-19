import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as extractRouteHandler } from "@/app/api/extract/route";
import {
  validateSalesCsv,
  validateRecipesCsv,
  validateIngredientPricesCsv,
  validateMenuCsv,
  mergeCustomDataset,
} from "./csvImporter";
import {
  ExtractedRecipeSchema,
  ExtractedInvoiceSchema,
  convertExtractedRecipeToDomain,
  convertExtractedInvoiceToDomain,
} from "@/schemas/extraction";
import { StoryDataset } from "./csvParser";

describe("Stage 6: CSV Importer & Validator", () => {
  describe("Sales CSV Validation", () => {
    it("validates well-formed sales CSV records successfully", () => {
      const csv = `date,dishId,dishName,quantity,sellingPrice,currency
2025-01-01,truffle-tenderloin,Truffle Tenderloin,220,1200,INR
2025-01-01,prawn-risotto,Prawn Risotto,180,850,INR`;

      const result = validateSalesCsv(csv, "sales_test.csv");
      expect(result.isValid).toBe(true);
      expect(result.totalRows).toBe(2);
      expect(result.validRows.length).toBe(2);
      expect(result.invalidRowCount).toBe(0);
      expect(result.errors.length).toBe(0);
      expect(result.validRows[0].dishId).toBe("truffle-tenderloin");
      expect(result.validRows[0].sellingPrice).toBe(1200);
    });

    it("catches invalid numbers, negative quantities, and bad dates", () => {
      const csv = `date,dishId,dishName,quantity,sellingPrice,currency
2025/01/01,truffle-tenderloin,Truffle Tenderloin,-10,1200,INR
2025-02-01,prawn-risotto,Prawn Risotto,50,-500,INR`;

      const result = validateSalesCsv(csv, "bad_sales.csv");
      expect(result.isValid).toBe(false);
      expect(result.validRows.length).toBe(0);
      expect(result.invalidRowCount).toBe(2);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);

      // Verify row numbers and fields
      const errorFields = result.errors.map((e) => e.field);
      expect(errorFields).toContain("quantity");
      expect(errorFields).toContain("sellingPrice");
    });

    it("detects and flags duplicate records on unique composite keys", () => {
      const csv = `date,dishId,dishName,quantity,sellingPrice,currency
2025-01-01,truffle-tenderloin,Truffle Tenderloin,200,1200,INR
2025-01-01,truffle-tenderloin,Truffle Tenderloin,250,1200,INR`;

      const result = validateSalesCsv(csv, "dup_sales.csv");
      expect(result.isValid).toBe(false);
      expect(result.totalRows).toBe(2);
      expect(result.validRows.length).toBe(1);
      expect(result.duplicateCount).toBe(1);
      expect(result.errors.some((e) => e.field === "Duplicate Record")).toBe(true);
    });
  });

  describe("Recipe CSV Validation", () => {
    it("validates valid recipe records with standard units", () => {
      const csv = `dishId,dishName,ingredientId,ingredientName,quantity,unit
truffle-tenderloin,Truffle Tenderloin,beef-tenderloin,Beef Tenderloin,0.25,kg
truffle-tenderloin,Truffle Tenderloin,black-truffle,Black Truffle,0.02,kg`;

      const result = validateRecipesCsv(csv, "recipes_test.csv");
      expect(result.isValid).toBe(true);
      expect(result.validRows.length).toBe(2);
      expect(result.validRows[0].unit).toBe("kg");
    });

    it("rejects recipe rows with missing ingredient name or non-positive quantity", () => {
      const csv = `dishId,dishName,ingredientId,ingredientName,quantity,unit
truffle-tenderloin,Truffle Tenderloin,beef-tenderloin,,0.25,kg
truffle-tenderloin,Truffle Tenderloin,black-truffle,Black Truffle,0,kg`;

      const result = validateRecipesCsv(csv, "bad_recipes.csv");
      expect(result.isValid).toBe(false);
      expect(result.invalidRowCount).toBe(2);
      expect(result.errors.some((e) => e.field.includes("ingredientName"))).toBe(true);
      expect(result.errors.some((e) => e.field.includes("quantity"))).toBe(true);
    });
  });

  describe("Ingredient Prices CSV Validation", () => {
    it("validates price records and rejects foreign currencies", () => {
      const csv = `date,ingredientId,ingredientName,price,unit,currency
2025-01-01,beef-tenderloin,Beef Tenderloin,1200,kg,INR
2025-01-01,butter,Butter,450,kg,USD`;

      const result = validateIngredientPricesCsv(csv, "prices.csv");
      expect(result.isValid).toBe(false);
      expect(result.validRows.length).toBe(1);
      expect(result.errors.some((e) => e.field === "currency")).toBe(true);
    });
  });

  describe("Menu Catalog CSV Validation", () => {
    it("validates menu records and verifies categories", () => {
      const csv = `id,name,category,basePrice,currency,description
truffle-tenderloin,Truffle Tenderloin,Main,1200,INR,Prime tenderloin with black truffle
wild-mushroom-tart,Wild Mushroom Tart,InvalidCategory,450,INR,Rustic tart`;

      const result = validateMenuCsv(csv, "menu.csv");
      expect(result.isValid).toBe(false);
      expect(result.validRows.length).toBe(1);
      expect(result.errors.some((e) => e.field === "category")).toBe(true);
    });
  });

  describe("Dataset Merging & Consistency Engine Checks", () => {
    const baseMockDataset: StoryDataset = {
      menu: [
        { id: "dish-a", name: "Dish A", category: "Main", basePrice: 500, currency: "INR", description: "Desc" },
        { id: "dish-b", name: "Dish B", category: "Dessert", basePrice: 300, currency: "INR", description: "Desc" },
      ],
      recipes: [
        { dishId: "dish-a", dishName: "Dish A", ingredientId: "ing-1", ingredientName: "Ing 1", quantity: 0.5, unit: "kg" },
        { dishId: "dish-b", dishName: "Dish B", ingredientId: "ing-2", ingredientName: "Ing 2", quantity: 0.2, unit: "kg" },
      ],
      ingredientPrices: [
        { date: "2025-01-01", ingredientId: "ing-1", ingredientName: "Ing 1", price: 100, unit: "kg", currency: "INR" },
        { date: "2025-01-01", ingredientId: "ing-2", ingredientName: "Ing 2", price: 50, unit: "kg", currency: "INR" },
      ],
      sales: [
        { date: "2025-01-01", dishId: "dish-a", dishName: "Dish A", quantity: 100, sellingPrice: 500, currency: "INR" },
        { date: "2025-01-01", dishId: "dish-b", dishName: "Dish B", quantity: 50, sellingPrice: 300, currency: "INR" },
      ],
    };

    it("merges valid new sales smoothly", () => {
      const newSales = [
        { date: "2025-02-01", dishId: "dish-a", dishName: "Dish A", quantity: 120, sellingPrice: 500, currency: "INR" as const },
      ];
      const merged = mergeCustomDataset(baseMockDataset, { sales: newSales });
      expect(merged.sales.length).toBe(1);
      expect(merged.sales[0].date).toBe("2025-02-01");
      expect(merged.menu.length).toBe(2);
    });

    it("throws a descriptive consistency error when sales contain unregistered dishId", () => {
      const invalidSales = [
        { date: "2025-02-01", dishId: "unregistered-dish", dishName: "Alien Dish", quantity: 50, sellingPrice: 500, currency: "INR" as const },
      ];
      expect(() => {
        mergeCustomDataset(baseMockDataset, { sales: invalidSales });
      }).toThrowError(/Dishes present in sales\/recipes not found in menu: unregistered-dish/);
    });

    it("throws a descriptive consistency error when recipe ingredients lack price history", () => {
      const invalidRecipes = [
        { dishId: "dish-a", dishName: "Dish A", ingredientId: "unpriced-spice", ingredientName: "Unpriced Spice", quantity: 0.05, unit: "kg" as const },
      ];
      expect(() => {
        mergeCustomDataset(baseMockDataset, { recipes: invalidRecipes });
      }).toThrowError(/Recipe ingredients missing price history: unpriced-spice/);
    });
  });
});

describe("Stage 6: Gemini Multimodal Schemas & Domain Converters", () => {
  describe("Recipe Extraction Zod Gate", () => {
    it("validates a well-formed extracted recipe structure", () => {
      const rawAiJson = {
        dishName: "Osso Buco alla Milanese",
        category: "Main",
        estimatedBasePrice: 1100,
        notes: "Handwritten chef special with gremolata",
        ingredients: [
          { ingredientName: "Veal Shank", quantity: 0.35, unit: "kg", isUncertain: false },
          { ingredientName: "White Wine", quantity: 0.1, unit: "l", isUncertain: false },
          { ingredientName: "Saffron", quantity: null, unit: "g", isUncertain: true },
        ],
        confidence: "high",
        unclearFields: ["saffron quantity"],
      };

      const parsed = ExtractedRecipeSchema.safeParse(rawAiJson);
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      expect(parsed.data.dishName).toBe("Osso Buco alla Milanese");
      expect(parsed.data.ingredients.length).toBe(3);
      expect(parsed.data.ingredients[2].isUncertain).toBe(true);
    });

    it("converts extracted recipe into domain MenuItem and RecipeItem[]", () => {
      const extracted = {
        dishName: "Handmade Tagliolini",
        category: "Pasta" as const,
        estimatedBasePrice: 650,
        notes: "Fresh egg pasta",
        ingredients: [
          { ingredientName: "Semolina Flour", quantity: 0.15, unit: "kg", isUncertain: false },
          { ingredientName: "Egg Yolks", quantity: 3, unit: "item", isUncertain: false },
        ],
        confidence: "high" as const,
        unclearFields: [],
      };

      const { menu, recipes } = convertExtractedRecipeToDomain(extracted);
      expect(menu.id).toBe("handmade-tagliolini");
      expect(menu.category).toBe("Pasta");
      expect(menu.basePrice).toBe(650);
      expect(recipes.length).toBe(2);
      expect(recipes[0].dishId).toBe("handmade-tagliolini");
      expect(recipes[0].ingredientId).toBe("semolina-flour");
      expect(recipes[1].unit).toBe("item");
    });
  });

  describe("Invoice Extraction Zod Gate", () => {
    it("validates structured supplier invoice records and converts to price records", () => {
      const invoiceJson = {
        supplierName: "Milanese Imports Ltd",
        invoiceNumber: "INV-9901",
        invoiceDate: "2025-11-05",
        currency: "INR",
        items: [
          {
            ingredientName: "Black Truffle",
            quantity: 0.5,
            unit: "kg",
            unitPrice: 15000,
            lineTotal: 7500,
            isUncertain: false,
          },
          {
            ingredientName: "Parmigiano Reggiano",
            quantity: 5,
            unit: "kg",
            unitPrice: 1800,
            lineTotal: 9000,
            isUncertain: false,
          },
        ],
        totalAmount: 16500,
        confidence: "high",
        unclearFields: [],
      };

      const parsed = ExtractedInvoiceSchema.safeParse(invoiceJson);
      expect(parsed.success).toBe(true);
      if (!parsed.success) return;

      const priceRecords = convertExtractedInvoiceToDomain(parsed.data);
      expect(priceRecords.length).toBe(2);
      expect(priceRecords[0].date).toBe("2025-11-05");
      expect(priceRecords[0].ingredientId).toBe("black-truffle");
      expect(priceRecords[0].price).toBe(15000);
      expect(priceRecords[0].currency).toBe("INR");
    });
  });

  describe("Gemini Production Security & Missing Key Handling", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalApiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
      delete process.env.GEMINI_API_KEY;
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
      if (originalApiKey !== undefined) {
        process.env.GEMINI_API_KEY = originalApiKey;
      } else {
        delete process.env.GEMINI_API_KEY;
      }
    });

    it("returns HTTP 503 Service Unavailable when GEMINI_API_KEY is missing and allowMock is false", async () => {
      process.env.NODE_ENV = "development";
      const formData = new FormData();
      const dummyFile = new File([new Uint8Array([1, 2, 3])], "sample.png", { type: "image/png" });
      formData.append("file", dummyFile);
      formData.append("extractionType", "recipe");
      formData.append("allowMock", "false");

      const req = new NextRequest("http://localhost:3000/api/extract", {
        method: "POST",
        body: formData,
      });

      const res = await extractRouteHandler(req);
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isApiKeyMissing).toBe(true);
      expect(json.error).toContain("GEMINI_API_KEY is not configured on the server");
    });

    it("strictly blocks simulated extraction in production even when client requests allowMock=true", async () => {
      process.env.NODE_ENV = "production";
      const formData = new FormData();
      const dummyFile = new File([new Uint8Array([1, 2, 3])], "sample.png", { type: "image/png" });
      formData.append("file", dummyFile);
      formData.append("extractionType", "recipe");
      formData.append("allowMock", "true");

      const req = new NextRequest("http://localhost:3000/api/extract?mock=true", {
        method: "POST",
        body: formData,
      });

      const res = await extractRouteHandler(req);
      // In production with missing key, must return HTTP 503 and NEVER run mock
      expect(res.status).toBe(503);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.isApiKeyMissing).toBe(true);
      expect(json.data).toBeUndefined();
    });

    it("permits simulated extraction strictly in non-production when explicitly requested and flags isMocked: true", async () => {
      process.env.NODE_ENV = "development";
      const formData = new FormData();
      const dummyFile = new File([new Uint8Array([1, 2, 3])], "sample.png", { type: "image/png" });
      formData.append("file", dummyFile);
      formData.append("extractionType", "recipe");
      formData.append("allowMock", "true");

      const req = new NextRequest("http://localhost:3000/api/extract", {
        method: "POST",
        body: formData,
      });

      const res = await extractRouteHandler(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.isMocked).toBe(true);
      expect(json.data).toBeDefined();
      expect(json.data.dishName).toBeDefined();
    });

    it("rejects unsupported MIME types with HTTP 400", async () => {
      const formData = new FormData();
      const textFile = new File(["not an image"], "document.txt", { type: "text/plain" });
      formData.append("file", textFile);

      const req = new NextRequest("http://localhost:3000/api/extract", {
        method: "POST",
        body: formData,
      });

      const res = await extractRouteHandler(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Unsupported file type");
    });
  });
});
