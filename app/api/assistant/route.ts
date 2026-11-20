import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenAI, Content } from "@google/genai";
import { loadStoryDatasetFromDisk } from "@/data/storyDataset.node";
import { ValidatedStoryDatasetSchema, ValidatedStoryDataset } from "@/ai/tools/datasetValidator";
import { executeToolByName } from "@/ai/tools/executor";
import { AuthoritativeFact } from "@/ai/tools/factFactory";
import { ToolExecutionContext, TOOL_SAFETY_LIMITS } from "@/ai/tools/types";
import { VisualizationActionSchema, VisualizationAction } from "@/ai/tools/actionSchema";
import { GEMINI_FUNCTION_DECLARATIONS } from "./declarations";
import { generateDeterministicFallbackResponse } from "./demoFallback";
import { AssistantRequestSchema, auditNumericalClaims } from "./audit";

export const runtime = "nodejs";

const SYSTEM_INSTRUCTION = `
You are CULINOMICS AI Decision Assistant, an expert restaurant financial advisor and menu engineer.
You assist restaurant managers and executive chefs in analyzing financial performance, menu engineering, and ingredient inflation.

MANDATORY OPERATIONAL INVARIANTS:
1. You have access to 9 deterministic financial engine tools. You MUST invoke the appropriate tools to obtain verified financial metrics before answering any questions about revenue, costs, margins, or inflation.
2. NEVER calculate or fabricate financial metrics, percentages, or totals yourself. All numbers in your answer MUST originate directly from verified tool results.
3. Ground every statement in the authoritative facts returned by the tools.
4. Keep answers concise, executive, and actionable. Focus on strategic insights, key cost drivers, and clear operational recommendations.
5. If a specific dashboard view or dish should be inspected by the user, you may conclude your answer with an action block formatted exactly as:
\`\`\`json
{
  "action": {
    "actionType": "SET_ACTIVE_TAB" | "SET_SELECTED_DISH" | "SET_THREE_MODE" | "SET_TIMELINE_DATE",
    "tab": "overview" | "matrix" | "profitability" | "replay" | "explorer3d" | "simulator" | "forecast" | "optimizer" | "report",
    "dishId": "optional-dish-id",
    "threeMode": "profitability-landscape" | "ingredient-inflation" | "recipe-replay" | "sales-volume" | "margin-breakdown" | "inflation-impact",
    "label": "Short button label"
  }
}
\`\`\`
`;

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size limit
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > TOOL_SAFETY_LIMITS.MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Request payload exceeds the ${TOOL_SAFETY_LIMITS.MAX_REQUEST_BODY_BYTES / (1024 * 1024)}MB limit.`,
        },
        { status: 413 }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > TOOL_SAFETY_LIMITS.MAX_REQUEST_BODY_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Request payload exceeds the ${TOOL_SAFETY_LIMITS.MAX_REQUEST_BODY_BYTES / (1024 * 1024)}MB limit.`,
        },
        { status: 413 }
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    // 2. Validate request parameters
    const bodyValidation = AssistantRequestSchema.safeParse(parsedJson);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Malformed request payload.",
          validationErrors: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const body = bodyValidation.data;

    // 3. Dataset Resolution and Server-Side Validation
    let dataset: ValidatedStoryDataset;
    if (body.datasetMode === "demo") {
      dataset = loadStoryDatasetFromDisk();
    } else {
      if (!body.customDataset) {
        return NextResponse.json(
          {
            success: false,
            error: "Custom dataset mode requires a complete customDataset object in the request body.",
          },
          { status: 400 }
        );
      }

      const customValidation = ValidatedStoryDatasetSchema.safeParse(body.customDataset);
      if (!customValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: "Custom dataset failed relational or temporal integrity validation.",
            validationErrors: customValidation.error.issues,
          },
          { status: 422 }
        );
      }
      dataset = customValidation.data;
    }

    const ctx: ToolExecutionContext = {
      dataset,
      datasetMode: body.datasetMode,
      selectedDishId: body.selectedDishId,
    };

    // 4. Missing API Key -> Deterministic Fallback Mode
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallback = generateDeterministicFallbackResponse(
        body.message,
        ctx,
        body.selectedDishId,
        body.selectedTimelineDate,
        body.activeScenario
      );
      return NextResponse.json({
        success: true,
        assistantMessage: fallback.assistantMessage,
        authoritativeFacts: fallback.authoritativeFacts,
        visualizationAction: fallback.visualizationAction,
        warnings: [],
        mode: "deterministic-fallback",
        completeness: fallback.completeness,
      });
    }

    // 5. Gemini Function-Calling Execution
    try {
      const ai = new GoogleGenAI({ apiKey });

      const contents: Content[] = [];
      if (body.history && body.history.length > 0) {
        for (const h of body.history) {
          contents.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.content }],
          });
        }
      }

      const contextLines: string[] = [];
      if (body.selectedDishId) {
        contextLines.push(`Active Selected Dish: ${body.selectedDishId}`);
      }
      if (body.selectedTimelineDate) {
        contextLines.push(`Active Timeline Date: ${body.selectedTimelineDate}`);
      }
      if (body.activeScenario) {
        contextLines.push(
          `Active Menu Surgery Scenario: Dish ${body.activeScenario.dishId}, Target Price: ₹${body.activeScenario.targetSellingPrice}, Target Cost: ₹${body.activeScenario.targetIngredientCost}, Target Volume: ${body.activeScenario.targetMonthlyVolume} units/mo`
        );
      }
      const contextPrefix = contextLines.length > 0 ? `[ACTIVE COCKPIT CONTEXT]\n${contextLines.join("\n")}\n\n` : "";

      contents.push({
        role: "user",
        parts: [
          {
            text: `${contextPrefix}User Query: ${body.message}`,
          },
        ],
      });

      let rounds = 0;
      let totalToolCalls = 0;
      const accumulatedFacts: AuthoritativeFact[] = [];
      const factIdSet = new Set<string>();
      let finalAssistantMessage = "";
      let finalAction: VisualizationAction | null = null;
      const warnings: string[] = [];

      while (rounds < TOOL_SAFETY_LIMITS.MAX_FUNCTION_CALLING_ROUNDS) {
        rounds++;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: GEMINI_FUNCTION_DECLARATIONS }],
            temperature: 0.2,
          },
        });

        const functionCalls = response.functionCalls;
        if (!functionCalls || functionCalls.length === 0) {
          finalAssistantMessage = response.text || "";
          break;
        }

        if (totalToolCalls + functionCalls.length > TOOL_SAFETY_LIMITS.MAX_TOTAL_TOOL_CALLS_PER_REQUEST) {
          warnings.push("Tool execution limit reached. Model response synthesized from available facts.");
          break;
        }

        contents.push({
          role: "model",
          parts: functionCalls.map((fc) => ({ functionCall: fc })),
        });

        const toolResponses: { name: string; response: Record<string, unknown> }[] = [];
        for (const call of functionCalls) {
          totalToolCalls++;
          const toolName = call.name || "";
          try {
            const toolOutput = executeToolByName(toolName, call.args, ctx);
            for (const fact of toolOutput.authoritativeFacts) {
              if (!factIdSet.has(fact.id)) {
                factIdSet.add(fact.id);
                accumulatedFacts.push(fact);
              }
            }
            toolResponses.push({
              name: toolName,
              response: { output: toolOutput.summaryForGemini },
            });
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : "Tool execution failed";
            toolResponses.push({
              name: toolName,
              response: { error: errMsg },
            });
          }
        }

        contents.push({
          role: "user",
          parts: toolResponses.map((tr) => ({
            functionResponse: {
              name: tr.name,
              response: tr.response,
            },
          })),
        });
      }

      // Parse and extract visualization action from Gemini markdown output
      const actionMatch = /```(?:json)?\s*(\{\s*"action"[\s\S]*?\})\s*```/.exec(finalAssistantMessage);
      if (actionMatch) {
        try {
          const parsed = JSON.parse(actionMatch[1]);
          const actionValidation = VisualizationActionSchema.safeParse(parsed.action);
          if (actionValidation.success) {
            finalAction = actionValidation.data;
            finalAssistantMessage = finalAssistantMessage.replace(actionMatch[0], "").trim();
          } else {
            warnings.push("Model suggested an invalid visualization action which was discarded.");
          }
        } catch {
          warnings.push("Model suggested a malformed action block which was discarded.");
        }
      }

      // Run numerical claim heuristic audit on Gemini's final text
      const claimWarnings = auditNumericalClaims(finalAssistantMessage, accumulatedFacts);
      warnings.push(...claimWarnings);

      return NextResponse.json({
        success: true,
        assistantMessage: finalAssistantMessage,
        authoritativeFacts: accumulatedFacts,
        visualizationAction: finalAction,
        warnings,
        mode: "gemini",
        completeness: {
          isComplete: true,
          totalItemsAvailable: accumulatedFacts.length,
          itemsReturned: accumulatedFacts.length,
          note: `Completed via Gemini 2.5 with ${totalToolCalls} engine tool execution(s).`,
        },
      });
    } catch {
      // Safe fallback on Gemini API error or timeout
      const fallback = generateDeterministicFallbackResponse(
        body.message,
        ctx,
        body.selectedDishId,
        body.selectedTimelineDate,
        body.activeScenario
      );
      return NextResponse.json({
        success: true,
        assistantMessage: fallback.assistantMessage,
        authoritativeFacts: fallback.authoritativeFacts,
        visualizationAction: fallback.visualizationAction,
        warnings: [
          "Gemini API connection was unavailable or encountered an error. Served verified deterministic engine fallback.",
        ],
        mode: "deterministic-fallback",
        completeness: fallback.completeness,
      });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal assistant error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
