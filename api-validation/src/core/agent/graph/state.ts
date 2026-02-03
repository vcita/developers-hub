/**
 * LangGraph State Annotation
 *
 * Defines the state that flows through all nodes in the validation graph.
 */

import { Annotation } from '@langchain/langgraph';
import type {
  ValidationState as BaseValidationState,
  ValidationConfig,
  ValidationResult,
  Endpoint,
  Workflow,
  ProgressCallback,
  TokenConfig,
  AgreementResult,
} from '../state.js';
import type {
  VerificationEntry,
  AgreementFinding,
  AgreementFix,
  CodeAgreement,
  FailureReason,
} from '../verification/types.js';

// =============================================================================
// Extended Types
// =============================================================================

export interface ExecutionResult {
  success: boolean;
  status?: number;
  httpStatus?: number;
  data?: unknown;
  error?: string;
  summary?: string;
  requestConfig?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: Record<string, unknown>;
  };
}

export interface FailureAnalysis {
  reason: FailureReason;
  summary: string;
  details?: string;
  suggestedAction?: string;
}

export interface GraphAgreementResult {
  validated: boolean;
  findings: AgreementFinding[];
  fixes: AgreementFix[];
  mismatches: AgreementFinding[];
  controllerFile?: string;
  codeAgreement?: CodeAgreement;
}

export interface WorkflowSuggestion {
  tokenType: string;
  requiredParams: string[];
  prerequisites: Array<{
    name: string;
    method: string;
    path: string;
    extract?: Record<string, string>;
  }>;
  testRequest?: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
}

// =============================================================================
// LangGraph State Annotation
// =============================================================================

export const ValidationGraphState = Annotation.Root({
  // =========================================================================
  // Input (set at start)
  // =========================================================================
  endpoint: Annotation<Endpoint>({
    reducer: (_, update) => update,
  }),
  allEndpoints: Annotation<Endpoint[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  config: Annotation<ValidationConfig>({
    reducer: (_, update) => update,
  }),
  onProgress: Annotation<ProgressCallback | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),

  // =========================================================================
  // Node 1 output: tokens and params
  // =========================================================================
  tokens: Annotation<TokenConfig>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({}),
  }),
  params: Annotation<Record<string, string>>({
    reducer: (existing, update) => ({ ...existing, ...update }),
    default: () => ({}),
  }),

  // =========================================================================
  // Verification status (from index)
  // =========================================================================
  verification: Annotation<VerificationEntry | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // =========================================================================
  // Node 2 output: agreement check result
  // =========================================================================
  agreement: Annotation<GraphAgreementResult | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  workflowSuggestion: Annotation<WorkflowSuggestion | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),

  // =========================================================================
  // Node 3 output: workflow info
  // =========================================================================
  workflow: Annotation<Workflow>({
    reducer: (_, update) => update,
    default: () => ({ exists: false }),
  }),

  // =========================================================================
  // Node 4/5 output: execution result
  // =========================================================================
  executionResult: Annotation<ExecutionResult | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
  retryCount: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  maxRetries: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 5,
  }),
  forceRevalidation: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  forceAgreementCheck: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),

  // =========================================================================
  // Failure analysis output
  // =========================================================================
  failureAnalysis: Annotation<FailureAnalysis | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),

  // =========================================================================
  // Final result
  // =========================================================================
  result: Annotation<ValidationResult | null>({
    reducer: (_, update) => update,
    default: () => null,
  }),
});

export type GraphValidationState = typeof ValidationGraphState.State;

// Re-export base types
export type {
  ValidationConfig,
  ValidationResult,
  Endpoint,
  Workflow,
  ProgressCallback,
  TokenConfig,
} from '../state.js';
