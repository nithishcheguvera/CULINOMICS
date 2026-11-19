import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

// Maximum upload limit: 5MB
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

const RECIPE_PROMPT = `
You are a culinary data extraction specialist.
Analyze this photo of a handwritten recipe or kitchen prep sheet.
Extract the visible information into valid, strictly formatted JSON with the following structure:
{
  "dishName": string,
  "category": "Main" | "Appetizer" | "Pasta" | "Dessert",
  "estimatedBasePrice": number | null,
  "notes": string | null,
  "ingredients": [
    {
      "ingredientName": string,
      "quantity": number | null,
      "unit": "kg" | "g" | "l" | "ml" | "item" | "serving",
      "notes": string | null,
      "isUncertain": boolean
    }
  ],
  "confidence": "high" | "medium" | "low",
  "unclearFields": string[]
}
Rules:
1. ONLY extract information visibly written in the image.
2. DO NOT invent missing quantities or ingredients. If a quantity is unreadable or absent, set it to null and set isUncertain to true.
3. Normalize units to standard metric: kg, g, l, ml, item.
4. If a word or number is partially smudged or ambiguous, add its description to unclearFields.
`;

const INVOICE_PROMPT = `
You are a restaurant accounting data extraction specialist.
Analyze this photo of a supplier bill, receipt, or ingredient invoice.
Extract the visible information into valid, strictly formatted JSON with the following structure:
{
  "supplierName": string | null,
  "invoiceNumber": string | null,
  "invoiceDate": string | null, // YYYY-MM-DD
  "currency": "INR",
  "items": [
    {
      "ingredientName": string,
      "quantity": number | null,
      "unit": "kg" | "g" | "l" | "ml" | "item",
      "unitPrice": number | null,
      "lineTotal": number | null,
      "isUncertain": boolean
    }
  ],
  "totalAmount": number | null,
  "confidence": "high" | "medium" | "low",
  "unclearFields": string[]
}
Rules:
1. ONLY extract visible items, quantities, and prices.
2. Never invent or hallucinate pricing. If a price or quantity is missing or unreadable, set it to null and mark isUncertain as true.
3. Format dates strictly as YYYY-MM-DD. If year or date is ambiguous, set to null and add to unclearFields.
4. All currency amounts must be in Indian Rupees (INR).
`;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const extractionType = (formData.get("extractionType") as string) || "recipe";
    const allowMockFallback = formData.get("allowMock") === "true" || req.nextUrl.searchParams.get("mock") === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided in request." }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: '${file.type}'. Allowed formats are JPEG, PNG, WEBP.`,
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5MB limit. Uploaded size: ${(file.size / (1024 * 1024)).toFixed(2)}MB.`,
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Handle missing API key
    if (!apiKey) {
      if (allowMockFallback) {
        return handleMockResponse(extractionType);
      }
      return NextResponse.json(
        {
          success: false,
          error: "GEMINI_API_KEY is not configured on the server. To enable real multimodal extraction, configure GEMINI_API_KEY in your environment.",
          isApiKeyMissing: true,
        },
        { status: 503 }
      );
    }

    // Convert file to base64 for Gemini multimodal input
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const prompt = extractionType === "invoice" ? INVOICE_PROMPT : RECIPE_PROMPT;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: file.type,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text?.trim() || "";
    let extractedJson: unknown;

    try {
      extractedJson = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse structured JSON from Gemini response.",
          rawResponse: responseText,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      extractionType,
      data: extractedJson,
      isMocked: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error during Gemini extraction";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * Returns clean mock extraction data for testing and offline demo execution.
 */
function handleMockResponse(extractionType: string) {
  if (extractionType === "invoice") {
    return NextResponse.json({
      success: true,
      extractionType: "invoice",
      isMocked: true,
      data: {
        supplierName: "Apex Dairy & Artisan Provisions Ltd",
        invoiceNumber: "INV-2025-8821",
        invoiceDate: "2025-10-15",
        currency: "INR",
        items: [
          {
            ingredientName: "Italian Mascarpone Cheese",
            quantity: 10,
            unit: "kg",
            unitPrice: 1350.0,
            lineTotal: 13500.0,
            isUncertain: false,
          },
          {
            ingredientName: "High-Fat European Butter",
            quantity: 25,
            unit: "kg",
            unitPrice: 1050.0,
            lineTotal: 26250.0,
            isUncertain: false,
          },
          {
            ingredientName: "Aged Grana Padano / Parmesan",
            quantity: 12,
            unit: "kg",
            unitPrice: 2100.0,
            lineTotal: 25200.0,
            isUncertain: false,
          },
          {
            ingredientName: "White Truffle Infused Oil",
            quantity: 5,
            unit: "l",
            unitPrice: 2450.0,
            lineTotal: 12250.0,
            isUncertain: false,
          },
        ],
        totalAmount: 77200.0,
        confidence: "high",
        unclearFields: [],
      },
    });
  }

  return NextResponse.json({
    success: true,
    extractionType: "recipe",
    isMocked: true,
    data: {
      dishName: "Handmade Gorgonzola Gnocchi",
      category: "Pasta",
      estimatedBasePrice: 580.0,
      notes: "Chef's handwritten weekend special note; potato dough with creamy gorgonzola dolce sauce",
      ingredients: [
        {
          ingredientName: "Semolina Pasta Flour",
          quantity: 0.25,
          unit: "kg",
          notes: "Tipo 00 flour blend",
          isUncertain: false,
        },
        {
          ingredientName: "High-Fat European Butter",
          quantity: 0.03,
          unit: "kg",
          notes: null,
          isUncertain: false,
        },
        {
          ingredientName: "Aged Grana Padano / Parmesan",
          quantity: 0.04,
          unit: "kg",
          notes: null,
          isUncertain: false,
        },
        {
          ingredientName: "Pasteurized Whole Milk",
          quantity: 0.05,
          unit: "l",
          notes: null,
          isUncertain: false,
        },
      ],
      confidence: "high",
      unclearFields: [],
    },
  });
}
