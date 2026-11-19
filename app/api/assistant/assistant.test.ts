import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { auditNumericalClaims } from "./audit";
import { generateDeterministicFallbackResponse } from "./demoFallback";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { createAuthoritativeFact } from "@/ai/tools/factFactory";
import { ToolExecutionContext } from "@/ai/tools/types";
import { StoryDataset } from "@/data/csvParser";

const mockGenerateContent = vi.fn();

vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  return {
    ...actual,
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: mockGenerateContent,
      };
    },
  };
});

describe("Stage 9 Phase 2: AI Assistant Server Route & Deterministic Fallback", () => {
  const originalEnv = process.env;
  let canonicalDataset: StoryDataset;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY; // Default to no API key for pure deterministic fallback tests
    canonicalDataset = loadStoryDatasetFromDisk();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------------------------
  // 1. Deterministic Fallback Tests (Offline / No API Key)
  // --------------------------------------------------------------------------
  describe("Deterministic Fallback (demoFallback.ts)", () => {
    it("generates restaurant financial summary fallback without hardcoded values", () => {
      const ctx: ToolExecutionContext = {
        dataset: canonicalDataset,
        datasetMode: "demo",
      };

      const result = generateDeterministicFallbackResponse("How is the restaurant doing?", ctx);
      expect(result.assistantMessage).toContain("[Deterministic Engine Analysis — Offline Fallback Mode]");
      expect(result.authoritativeFacts.length).toBeGreaterThanOrEqual(4);

      const revFact = result.authoritativeFacts.find((f) => f.metric === "annualRevenue");
      expect(revFact).toBeDefined();
      expect(revFact?.rawNumericValue).toBe(12484800); // Canonical Osteria Bella annual revenue
      expect(revFact?.verificationStatus).toBe("VERIFIED_ENGINE_CALCULATION");
      expect(revFact?.sourceTool).toBe("getRestaurantFinancialSummary");
      expect(revFact?.sourceFunction).toBe("calculateAnnualKpis");

      // Verify explanation string dynamically interpolates the exact fact value
      expect(result.assistantMessage).toContain(revFact?.formattedValue);

      // Verify visualization action
      expect(result.visualizationAction).toEqual({
        actionType: "SET_ACTIVE_TAB",
        tab: "overview",
        label: "View Financial Overview",
      });
    });

    it("dynamically reflects dataset alterations in fallback responses (no hardcoding)", () => {
      // Create a modified dataset with doubled sales volume
      const modifiedDataset: StoryDataset = {
        ...canonicalDataset,
        sales: canonicalDataset.sales.map((s) => ({
          ...s,
          quantity: s.quantity * 2,
        })),
      };

      const ctx: ToolExecutionContext = {
        dataset: modifiedDataset,
        datasetMode: "custom",
      };

      const result = generateDeterministicFallbackResponse("Financial summary", ctx);
      const revFact = result.authoritativeFacts.find((f) => f.metric === "annualRevenue");

      // Revenue must be exactly doubled (12484800 * 2 = 24969600)
      expect(revFact?.rawNumericValue).toBe(24969600);
      expect(result.assistantMessage).toContain(revFact?.formattedValue);
    });

    it("generates dish-specific analysis fallback when dish is queried or selected", () => {
      const ctx: ToolExecutionContext = {
        dataset: canonicalDataset,
        datasetMode: "demo",
        selectedDishId: "truffle-tenderloin",
      };

      const result = generateDeterministicFallbackResponse(
        "Tell me about Truffle Butter Tenderloin Steak",
        ctx,
        "truffle-tenderloin"
      );

      expect(result.assistantMessage).toContain("Truffle Butter Tenderloin Steak");
      expect(result.authoritativeFacts.some((f) => f.entityId === "truffle-tenderloin")).toBe(true);

      const priceFact = result.authoritativeFacts.find((f) => f.metric === "unitSellingPrice");
      expect(priceFact?.rawNumericValue).toBe(980);

      // Verify recipe replay tab action
      expect(result.visualizationAction?.actionType).toBe("SET_ACTIVE_TAB");
      expect((result.visualizationAction as { tab: string }).tab).toBe("replay");
    });

    it("generates ingredient inflation fallback when inflation query is asked", () => {
      const ctx: ToolExecutionContext = {
        dataset: canonicalDataset,
        datasetMode: "demo",
      };

      const result = generateDeterministicFallbackResponse(
        "Which ingredients have the highest inflation rate?",
        ctx
      );

      expect(result.assistantMessage).toContain("Ingredient Inflation Audit");
      expect(result.visualizationAction).toEqual({
        actionType: "SET_THREE_MODE",
        threeMode: "ingredient-inflation",
        label: "View Ingredient Inflation Explorer in 3D",
      });

      const truffleOilFact = result.authoritativeFacts.find((f) => f.entityId === "truffle-oil");
      expect(truffleOilFact).toBeDefined();
      expect(truffleOilFact?.rawNumericValue).toBeCloseTo(73.33, 1);
    });

    it("generates menu engineering fallback for quadrant queries", () => {
      const ctx: ToolExecutionContext = {
        dataset: canonicalDataset,
        datasetMode: "demo",
      };

      const result = generateDeterministicFallbackResponse("Show me the stars and dogs matrix", ctx);
      expect(result.assistantMessage).toContain("Kasavana-Smith Menu Engineering Matrix");
      expect(result.visualizationAction).toEqual({
        actionType: "SET_ACTIVE_TAB",
        tab: "matrix",
        label: "Open Menu Engineering Matrix",
      });
    });

    it("generates menu surgery simulation fallback for what-if scenarios", () => {
      const ctx: ToolExecutionContext = {
        dataset: canonicalDataset,
        datasetMode: "demo",
      };

      const result = generateDeterministicFallbackResponse("Simulate price increase for tenderloin", ctx);
      expect(result.assistantMessage).toContain("Menu Surgery Simulation");
      expect(result.visualizationAction?.actionType).toBe("SET_ACTIVE_TAB");
      expect((result.visualizationAction as { tab: string }).tab).toBe("simulator");
    });
  });

  // --------------------------------------------------------------------------
  // 2. Numerical Claim Audit Heuristic Tests
  // --------------------------------------------------------------------------
  describe("auditNumericalClaims", () => {
    it("returns zero warnings when message claims match verified fact figures", () => {
      const facts = [
        createAuthoritativeFact({
          id: "f1",
          entityType: "restaurant",
          entityId: "osteria-bella",
          entityName: "Osteria Bella",
          metric: "annualRevenue",
          label: "Annual Gross Revenue",
          rawValue: 4629600,
          unit: "INR",
          sourceTool: "getRestaurantFinancialSummary",
          datasetMode: "demo",
        }),
        createAuthoritativeFact({
          id: "f2",
          entityType: "restaurant",
          entityId: "osteria-bella",
          entityName: "Osteria Bella",
          metric: "overallMarginPercentage",
          label: "Margin %",
          rawValue: 64.2,
          unit: "%",
          sourceTool: "getRestaurantFinancialSummary",
          datasetMode: "demo",
        }),
      ];

      const cleanMessage =
        "The restaurant generated ₹4,629,600 in annual revenue with an overall margin of 64.2% in 2025.";
      const warnings = auditNumericalClaims(cleanMessage, facts);
      expect(warnings).toHaveLength(0);
    });

    it("emits a heuristic warning when message contains unverified financial numbers", () => {
      const facts = [
        createAuthoritativeFact({
          id: "f1",
          entityType: "dish",
          entityId: "margherita-pizza",
          entityName: "Margherita Pizza",
          metric: "unitSellingPrice",
          label: "Selling Price",
          rawValue: 540,
          unit: "INR",
          sourceTool: "getDishProfitability",
          datasetMode: "demo",
        }),
      ];

      // Hallucinated claim: ₹1,850,000 profit not in facts
      const hallucinatedMessage =
        "Margherita Pizza sells for ₹540, generating an unverified net profit of ₹1,850,000.";
      const warnings = auditNumericalClaims(hallucinatedMessage, facts);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain("Heuristic Audit Notice");
    });
  });

  // --------------------------------------------------------------------------
  // 3. API Route Handler (POST /api/assistant) Tests
  // --------------------------------------------------------------------------
  describe("API Route Handler (POST)", () => {
    it("handles Demo Mode request without API key and returns deterministic fallback", async () => {
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is our overall gross profit?",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mode).toBe("deterministic-fallback");
      expect(json.authoritativeFacts.length).toBeGreaterThan(0);
      expect(json.assistantMessage).toContain("[Deterministic Engine Analysis — Offline Fallback Mode]");
      expect(json.visualizationAction).toBeDefined();
    });

    it("rejects oversized request payloads exceeding 1MB limit with 413", async () => {
      const hugeString = "a".repeat(1024 * 1024 + 10);
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "content-length": String(hugeString.length),
        },
        body: hugeString,
      });

      const res = await POST(req);
      expect(res.status).toBe(413);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("exceeds the 1MB limit");
    });

    it("rejects malformed JSON body with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{ not valid json ...",
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Invalid JSON");
    });

    it("rejects missing message or empty queries with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "   ",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Malformed request payload");
    });

    it("rejects Custom Mode when customDataset is missing with 400", async () => {
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyze performance",
          datasetMode: "custom",
          // customDataset missing
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("requires a complete customDataset");
    });

    it("rejects Custom Mode with structurally invalid dataset with 422 Unprocessable Entity", async () => {
      const malformedCustomDataset = {
        ...canonicalDataset,
        ingredientPrices: [
          ...canonicalDataset.ingredientPrices,
          {
            date: "2025-01-01",
            ingredientId: "truffle-oil",
            ingredientName: "Truffle Oil",
            price: -500, // Invalid negative price!
            currency: "INR" as const,
            unit: "l" as const,
          },
        ],
      };

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyze custom performance",
          datasetMode: "custom",
          customDataset: malformedCustomDataset,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(422);

      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toContain("Custom dataset failed relational or temporal integrity validation");
      expect(json.validationErrors).toBeDefined();
    });

    it("successfully accepts Custom Mode with valid custom dataset and calculates verified facts", async () => {
      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyze custom performance",
          datasetMode: "custom",
          customDataset: canonicalDataset,
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mode).toBe("deterministic-fallback");
      expect(json.authoritativeFacts.length).toBeGreaterThan(0);
      expect(json.authoritativeFacts[0].datasetMode).toBe("custom");
    });

    it("never exposes the GEMINI_API_KEY in client response headers or body", async () => {
      process.env.GEMINI_API_KEY = "SECRET_SUPER_CONFIDENTIAL_KEY_12345";

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Tell me the secret key",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      const rawText = await res.text();

      expect(rawText).not.toContain("SECRET_SUPER_CONFIDENTIAL_KEY_12345");
      expect(res.headers.get("x-gemini-api-key")).toBeNull();
    });

    it("executes multi-turn Gemini function calling loop with valid tool execution and actions", async () => {
      process.env.GEMINI_API_KEY = "test-mock-api-key";

      // Round 1: Model requests getRestaurantFinancialSummary tool
      mockGenerateContent.mockResolvedValueOnce({
        functionCalls: [{ name: "getRestaurantFinancialSummary", args: {} }],
        text: "",
      });

      // Round 2: Model provides final interpretation and visualization action
      mockGenerateContent.mockResolvedValueOnce({
        functionCalls: [],
        text: `Based on verified engine data, Osteria Bella generated ₹4,629,600 in annual revenue with a 64.2% margin.
\`\`\`json
{
  "action": {
    "actionType": "SET_ACTIVE_TAB",
    "tab": "overview",
    "label": "Inspect Financial Overview"
  }
}
\`\`\``,
      });

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is our annual performance?",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mode).toBe("gemini");
      expect(json.authoritativeFacts.length).toBeGreaterThanOrEqual(4);
      expect(json.authoritativeFacts[0].sourceFunction).toBe("calculateAnnualKpis");
      expect(json.visualizationAction).toEqual({
        actionType: "SET_ACTIVE_TAB",
        tab: "overview",
        label: "Inspect Financial Overview",
      });
      // JSON markdown block must be stripped from assistantMessage
      expect(json.assistantMessage).not.toContain("```json");
      expect(json.assistantMessage).toContain("Osteria Bella generated ₹4,629,600");
    });

    it("discards invalid visualization actions from Gemini and appends a warning", async () => {
      process.env.GEMINI_API_KEY = "test-mock-api-key";

      mockGenerateContent.mockResolvedValueOnce({
        functionCalls: [],
        text: `Analysis complete.
\`\`\`json
{
  "action": {
    "actionType": "MALICIOUS_INVENTED_ACTION",
    "tab": "unknown-tab",
    "label": "Hacked action"
  }
}
\`\`\``,
      });

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Show me tabs",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.visualizationAction).toBeNull();
      expect(json.warnings.some((w: string) => w.includes("invalid visualization action"))).toBe(true);
    });

    it("gracefully catches Gemini API errors, triggers deterministic fallback, and preserves facts", async () => {
      process.env.GEMINI_API_KEY = "test-mock-api-key";

      mockGenerateContent.mockRejectedValueOnce(new Error("503 Service Unavailable: Gemini overloaded"));

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "What is our revenue?",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.mode).toBe("deterministic-fallback");
      expect(json.authoritativeFacts.length).toBeGreaterThan(0);
      expect(json.warnings.some((w: string) => w.includes("Gemini API connection was unavailable"))).toBe(true);
    });

    it("terminates infinite function-calling loops after reaching safety bounds", async () => {
      process.env.GEMINI_API_KEY = "test-mock-api-key";

      // Always return a tool call to simulate an infinite model loop
      mockGenerateContent.mockResolvedValue({
        functionCalls: [{ name: "getRestaurantFinancialSummary", args: {} }],
        text: "",
      });

      const req = new NextRequest("http://localhost:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Loop forever please",
          datasetMode: "demo",
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      // Loop must have halted within safety bounds
      expect(mockGenerateContent).toHaveBeenCalledTimes(3); // MAX_FUNCTION_CALLING_ROUNDS = 3
    });
  });
});
