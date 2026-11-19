import { formatINR } from "@/utils/formatCurrency";
import { CANONICAL_TOOL_PROVENANCE, CanonicalToolName } from "./provenance";

export type FinancialUnit = "INR" | "%" | "servings" | "servings/mo" | "pts" | "rank";

export type FactEntityType = "dish" | "ingredient" | "menu" | "restaurant";

export interface CreateFactParams {
  readonly id: string;
  readonly entityType: FactEntityType;
  readonly entityId: string;
  readonly entityName: string;
  readonly metric: string;
  readonly label: string;
  readonly rawValue: number; // Raw, unrounded IEEE-754 number directly from deterministic engine
  readonly unit: FinancialUnit;
  readonly sourceTool: CanonicalToolName;
  readonly timeframe?: string;
  readonly datasetMode: "demo" | "custom";
  readonly reconciliationCheck?: string;
}

export interface AuthoritativeFact {
  readonly id: string;
  readonly entityType: FactEntityType;
  readonly entityId: string;
  readonly entityName: string;
  readonly metric: string;
  readonly label: string;
  readonly rawNumericValue: number; // Preserved unaltered IEEE-754 value
  readonly formattedValue: string; // Preformatted human-readable display string
  readonly unit: FinancialUnit;
  readonly sourceTool: CanonicalToolName;
  readonly sourceFunction: string;
  readonly timeframe: string;
  readonly datasetMode: "demo" | "custom";
  readonly verificationStatus: "VERIFIED_ENGINE_CALCULATION";
  readonly reconciliationCheck?: string;
}

/**
 * Central server-side factory for creating verified AuthoritativeFact structures.
 *
 * Invariants:
 * 1. Strictly rejects non-finite values (NaN, Infinity, -Infinity).
 * 2. Source provenance is internally enforced using CANONICAL_TOOL_PROVENANCE.
 * 3. Preserves exact unrounded IEEE-754 raw values alongside preformatted presentation strings.
 * 4. Completely decoupled from React, Zustand, and browser DOM state.
 */
export function createAuthoritativeFact(params: CreateFactParams): AuthoritativeFact {
  // Reject non-finite numbers before fact creation
  if (!Number.isFinite(params.rawValue)) {
    throw new Error(
      `Financial Integrity Error: Non-finite metric '${params.metric}' for entity '${params.entityId}' (${params.rawValue})`
    );
  }

  const provenance = CANONICAL_TOOL_PROVENANCE[params.sourceTool];
  if (!provenance) {
    throw new Error(`Security Violation: Unrecognized tool provenance '${params.sourceTool}'`);
  }

  // Preformat presentation string without mutating the raw value
  let formattedValue: string;
  switch (params.unit) {
    case "INR":
      formattedValue = formatINR(params.rawValue, { showDecimals: true });
      break;
    case "%":
      formattedValue = `${params.rawValue.toFixed(1)}%`;
      break;
    case "pts":
      formattedValue = `${params.rawValue.toFixed(1)} pts`;
      break;
    case "servings":
    case "servings/mo":
      formattedValue = `${Math.round(params.rawValue).toLocaleString()} ${params.unit}`;
      break;
    case "rank":
      formattedValue = `#${Math.round(params.rawValue)}`;
      break;
    default:
      formattedValue = String(params.rawValue);
  }

  return {
    id: params.id,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    metric: params.metric,
    label: params.label,
    rawNumericValue: params.rawValue,
    formattedValue,
    unit: params.unit,
    sourceTool: params.sourceTool,
    sourceFunction: provenance.sourceFunction,
    timeframe: params.timeframe || "Full Timeline",
    datasetMode: params.datasetMode,
    verificationStatus: "VERIFIED_ENGINE_CALCULATION",
    reconciliationCheck: params.reconciliationCheck,
  };
}
