/**
 * API Validation Graph
 *
 * LangGraph StateGraph that orchestrates the validation flow:
 *
 * START → tokenPrep → checkSkip ─┬→ END (if verified)
 *                                └→ agreementCheck ─┬→ updateVerification → END (if doc mismatch)
 *                                                   └→ executeLoop ─┬→ updateVerification → END (if pass)
 *                                                                   ├→ executeLoop (if retry)
 *                                                                   └→ analyzeFailure → updateVerification → END
 */

import { StateGraph, START, END } from '@langchain/langgraph';
import { ValidationGraphState, type GraphValidationState } from './state.js';
import { tokenPrepNode } from '../nodes/token-prep.js';
import { checkSkipNode } from './nodes/check-skip.js';
import { agreementCheckNode as agreementCheckSDK } from './nodes/agreement-check.js';
import { agreementCheckCLINode as agreementCheckCLI } from './nodes/agreement-check-cli.js';
import { executeLoopNode } from './nodes/execute-loop.js';
import { executeAgentCLINode } from './nodes/execute-agent-cli.js';
import { analyzeFailureNode } from './nodes/analyze-failure.js';
import { updateVerificationNode } from './nodes/update-verification.js';
import type {
  Endpoint,
  ValidationConfig,
  ProgressCallback,
  ValidationResult,
} from '../state.js';

// Flag to choose which agreement check to use
let useClaudeCodeCLI = false;

// Flag to choose which execute node to use
let useExecuteAgentCLI = false;

export function setUseClaudeCodeCLI(value: boolean): void {
  useClaudeCodeCLI = value;
  console.log(`[Graph] Agreement check mode: ${value ? 'Claude Code CLI' : 'Claude Agent SDK'}`);
}

export function setUseExecuteAgentCLI(value: boolean): void {
  useExecuteAgentCLI = value;
  console.log(`[Graph] Execute mode: ${value ? 'Claude Code CLI' : 'Claude Agent SDK'}`);
}

// Dynamic agreement check node
async function agreementCheckNode(state: GraphValidationState) {
  if (useClaudeCodeCLI) {
    return agreementCheckCLI(state);
  }
  return agreementCheckSDK(state);
}

// Dynamic execute node
async function executeNode(state: GraphValidationState) {
  if (useExecuteAgentCLI) {
    return executeAgentCLINode(state);
  }
  return executeLoopNode(state);
}

// =============================================================================
// Graph Creation
// =============================================================================

export function createValidationGraph() {
  const graph = new StateGraph(ValidationGraphState)
    // Add nodes
    .addNode('tokenPrep', async (state: GraphValidationState) => {
      // Wrap existing token prep node
      const result = await tokenPrepNode(state.config);
      return {
        tokens: result.tokens,
        params: { ...state.params, ...result.params },
      };
    })
    .addNode('checkSkip', checkSkipNode, {
      ends: ['agreementCheck', 'executeLoop', END],
    })
    .addNode('agreementCheck', agreementCheckNode, {
      ends: ['executeLoop', 'updateVerification'],
    })
    .addNode('executeLoop', executeNode, {
      ends: ['executeLoop', 'analyzeFailure', 'updateVerification'],
    })
    .addNode('analyzeFailure', analyzeFailureNode, {
      ends: ['updateVerification'],
    })
    .addNode('updateVerification', updateVerificationNode)

    // Add edges
    .addEdge(START, 'tokenPrep')
    .addEdge('tokenPrep', 'checkSkip')
    // checkSkip, agreementCheck, executeLoop, executeAgent use Command for routing
    .addEdge('updateVerification', END);

  return graph.compile();
}

// =============================================================================
// Main Entry Point
// =============================================================================

export interface RunValidationGraphOptions {
  skipAgreementCheck?: boolean;
  maxRetries?: number;
  model?: string;
  forceRevalidation?: boolean;
  useClaudeCodeCLI?: boolean;  // Use Claude Code CLI for agreement check instead of SDK
  useExecuteAgentCLI?: boolean;  // Use Claude Code CLI for execute instead of SDK
  forceAgreementCheck?: boolean;  // Force re-running agreement check even if verified
}

/**
 * Run the validation graph for a single endpoint
 */
export async function runValidationGraph(
  endpoint: Endpoint,
  config: ValidationConfig,
  allEndpoints: Endpoint[],
  onProgress?: ProgressCallback,
  options: RunValidationGraphOptions = {}
): Promise<ValidationResult> {
  console.log(`\n===== VALIDATION GRAPH START =====`);
  console.log(`Endpoint: ${endpoint.method} ${endpoint.path}`);

  // Set CLI mode if requested
  if (options.useClaudeCodeCLI !== undefined) {
    setUseClaudeCodeCLI(options.useClaudeCodeCLI);
    // Default: if agreement check uses CLI, execute should too
    if (options.useExecuteAgentCLI === undefined) {
      setUseExecuteAgentCLI(options.useClaudeCodeCLI);
    }
  }
  if (options.useExecuteAgentCLI !== undefined) {
    setUseExecuteAgentCLI(options.useExecuteAgentCLI);
  }

  const graph = createValidationGraph();

  try {
    const result = await graph.invoke({
      endpoint,
      allEndpoints,
      config,
      onProgress,
      tokens: config.tokens || {},
      params: config.params || {},
      maxRetries: options.maxRetries ?? 5,
      forceRevalidation: options.forceRevalidation ?? false,
      forceAgreementCheck: options.forceAgreementCheck ?? false,
    });

    console.log(`\nFinal Result: ${result.result?.status} - ${result.result?.reason}`);
    console.log(`===== VALIDATION GRAPH END =====\n`);

    return result.result || {
      status: 'ERROR',
      reason: 'No result from graph',
    };
  } catch (error) {
    console.error('Validation graph error:', error);
    return {
      status: 'ERROR',
      reason: `Graph execution failed: ${error}`,
    };
  }
}

// =============================================================================
// Batch Validation
// =============================================================================

export interface BatchValidationOptions extends RunValidationGraphOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface BatchValidationResult {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  blocked: number;
  errors: number;
  results: Array<{
    endpoint: string;
    result: ValidationResult;
  }>;
}

/**
 * Run validation for multiple endpoints
 */
export async function runBatchValidation(
  endpoints: Endpoint[],
  config: ValidationConfig,
  allEndpoints: Endpoint[],
  onProgress?: ProgressCallback,
  options: BatchValidationOptions = {}
): Promise<BatchValidationResult> {
  const { stopOnError = false } = options;

  const batchResult: BatchValidationResult = {
    total: endpoints.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    blocked: 0,
    errors: 0,
    results: [],
  };

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    const endpointKey = `${endpoint.method} ${endpoint.path}`;

    onProgress?.({
      type: 'progress',
      endpoint: endpointKey,
      index: i + 1,
      total: endpoints.length,
    });

    try {
      const result = await runValidationGraph(
        endpoint,
        config,
        allEndpoints,
        onProgress,
        options
      );

      batchResult.results.push({ endpoint: endpointKey, result });

      switch (result.status) {
        case 'PASS':
          batchResult.passed++;
          break;
        case 'FAIL':
          batchResult.failed++;
          break;
        case 'SKIP':
          batchResult.skipped++;
          break;
        case 'BLOCKED':
          batchResult.blocked++;
          break;
        case 'ERROR':
          batchResult.errors++;
          if (stopOnError) {
            return batchResult;
          }
          break;
      }
    } catch (error) {
      batchResult.errors++;
      batchResult.results.push({
        endpoint: endpointKey,
        result: {
          status: 'ERROR',
          reason: `Unexpected error: ${error}`,
        },
      });

      if (stopOnError) {
        return batchResult;
      }
    }
  }

  return batchResult;
}

// Re-export types
export type { GraphValidationState } from './state.js';
export { ValidationGraphState } from './state.js';
