/**
 * API Validation Agent - Main Entry Point
 *
 * Two implementations available:
 * 1. Sequential (default) - Original implementation with Claude Agent SDK
 * 2. LangGraph - New StateGraph-based implementation with proper flow control
 *
 * The LangGraph version adds:
 * - Verification caching (skip already-verified endpoints)
 * - Agreement check with codebase exploration
 * - Automatic workflow creation
 * - Failure analysis and categorization
 */

import type {
  ValidationState,
  ValidationConfig,
  Endpoint,
  Workflow,
  ProgressCallback,
  ValidationResult,
} from './state.js';
import { createInitialState } from './state.js';
import { tokenPrepNode } from './nodes/token-prep.js';

// =============================================================================
// LangGraph Implementation (New)
// =============================================================================

export {
  runValidationGraph,
  runBatchValidation,
  createValidationGraph,
} from './graph/index.js';

export type {
  RunValidationGraphOptions,
  BatchValidationOptions,
  BatchValidationResult,
} from './graph/index.js';

// =============================================================================
// Verification Module
// =============================================================================

export {
  loadVerification,
  saveVerification,
  markVerified,
  markFailed,
  shouldSkipAgreementCheck,
  loadVerificationIndex,
} from './verification/index.js';

export type {
  VerificationEntry,
  VerificationIndex,
  VerificationStatus,
  FailureReason,
  AgreementFinding,
  AgreementFix,
} from './verification/types.js';

// =============================================================================
// Workflow Repository Integration
// =============================================================================

/**
 * Load workflow from repository (if exists)
 */
async function loadWorkflow(endpointKey: string): Promise<Workflow> {
  try {
    // @ts-ignore - JS module without types
    const workflowRepo = await import('../workflows/repository.js');
    const workflow = workflowRepo.default?.get?.(endpointKey) || workflowRepo.get?.(endpointKey);

    if (workflow) {
      const w = workflow as Record<string, unknown>;
      return {
        exists: true,
        status: w.status as 'success' | 'skip' | undefined,
        skipReason: w.skipReason as string | undefined,
        summary: w.summary as string | undefined,
        prerequisites: (w.prerequisites as Workflow['prerequisites']) || [],
        uidResolution: w.uidResolution as Workflow['uidResolution'],
        sections: w.sections as Record<string, string> | undefined,
        testRequest: w.testRequest as Workflow['testRequest'],
      };
    }

    return { exists: false };
  } catch (error) {
    console.log(`  [Workflow] Error loading workflow: ${error}`);
    return { exists: false };
  }
}

// =============================================================================
// Main Entry Point
// =============================================================================

export interface RunValidationAgentOptions {
  skipAgreementCheck?: boolean;
  maxRetries?: number;
  model?: string;
  useLangGraph?: boolean;
  forceRevalidation?: boolean;
  useClaudeCodeCLI?: boolean;
  forceAgreementCheck?: boolean;
}

/**
 * Run the validation agent for a single endpoint
 *
 * @param endpoint - The endpoint to validate
 * @param config - Validation configuration
 * @param allEndpoints - All available endpoints (for UID resolution)
 * @param onProgress - Progress callback for UI updates
 * @param options - Additional options
 * @returns ValidationResult
 */
export async function runValidationAgent(
  endpoint: Endpoint,
  config: ValidationConfig,
  allEndpoints: Endpoint[],
  onProgress?: ProgressCallback,
  options: RunValidationAgentOptions = {}
): Promise<ValidationResult> {
  // Clear the agent operation log at start
  try {
    const { clearAgentLog } = await import('./graph/tracing.js');
    clearAgentLog();
    console.log(`[Agent] Log cleared - see /tmp/claude-agent-operations.log for full trace`);
  } catch (e) {
    // Ignore if tracing not available
  }

  // Use LangGraph implementation if requested
  if (options.useLangGraph) {
    const { runValidationGraph } = await import('./graph/index.js');
    return runValidationGraph(endpoint, config, allEndpoints, onProgress, {
      skipAgreementCheck: options.skipAgreementCheck,
      maxRetries: options.maxRetries,
      model: options.model,
      forceRevalidation: options.forceRevalidation,
      useClaudeCodeCLI: options.useClaudeCodeCLI,
      forceAgreementCheck: options.forceAgreementCheck,
    });
  }

  // Original sequential implementation
  console.log(`\n===== CLAUDE AGENT SDK VALIDATION START =====`);
  console.log(`Endpoint: ${endpoint.method} ${endpoint.path}`);

  const endpointKey = `${endpoint.method} ${endpoint.path}`;

  // Create initial state
  const state = createInitialState(endpoint, allEndpoints, config, onProgress);

  try {
    // =========================================================================
    // Node 1: Token Prep
    // =========================================================================
    console.log('\n--- Node 1: Token Prep ---');
    onProgress?.({
      type: 'agent_action',
      action: 'token_prep_start',
      details: 'Preparing tokens and parameters',
    });

    try {
      const tokenResult = await tokenPrepNode(config);
      state.tokens = tokenResult.tokens;
      state.params = { ...state.params, ...tokenResult.params };

      onProgress?.({
        type: 'agent_action',
        action: 'token_prep_complete',
        details: `Tokens ready: ${Object.keys(tokenResult.tokens).filter(k => tokenResult.tokens[k as keyof typeof tokenResult.tokens]).join(', ')}`,
      });
    } catch (error) {
      console.log(`Token prep error: ${error}`);
      // Continue with existing tokens
    }

    // =========================================================================
    // Node 2: Agreement Check (optional)
    // =========================================================================
    if (!options.skipAgreementCheck) {
      console.log('\n--- Node 2: Agreement Check ---');
      onProgress?.({
        type: 'agent_action',
        action: 'agreement_check_start',
        details: `Checking ${endpointKey}`,
      });

      try {
        const { agreementCheckNode } = await import('./nodes/agreement-check.js');
        const agreementResult = await agreementCheckNode(state, onProgress);
        state.agreement = agreementResult.agreement || null;

        onProgress?.({
          type: 'agent_action',
          action: 'agreement_check_complete',
          details: `Validated: ${state.agreement?.validated}, Mismatches: ${state.agreement?.mismatches?.length || 0}`,
        });
      } catch (error) {
        console.log(`Agreement check error (continuing): ${error}`);
        state.agreement = { validated: false, fixes: [] };
      }
    }

    // =========================================================================
    // Node 3: Load Workflow (for prerequisites)
    // =========================================================================
    console.log('\n--- Node 3: Workflow Load ---');
    state.workflow = await loadWorkflow(endpointKey);
    console.log(`Workflow: ${state.workflow.exists ? 'found' : 'not found'}`);

    // TODO: Execute prerequisites if workflow has them
    if (state.workflow.exists && state.workflow.prerequisites?.length) {
      console.log(`Prerequisites: ${state.workflow.prerequisites.length} step(s) - skipping for now`);
    }

    // =========================================================================
    // Node 5: Execute Loop (Claude Agent SDK)
    // =========================================================================
    console.log('\n--- Node 5: Execute Loop (Claude Agent SDK) ---');
    onProgress?.({
      type: 'agent_action',
      action: 'execute_loop_start',
      details: `Starting validation for ${endpointKey}`,
    });

    const { executeLoopNode } = await import('./nodes/execute-loop.js');
    const executeResult = await executeLoopNode(state, onProgress, {
      maxRetries: options.maxRetries ?? 5,
      model: options.model,
    });

    state.result = executeResult.result;
    state.retryCount = executeResult.retryCount;

    // =========================================================================
    // Done
    // =========================================================================
    console.log(`\nFinal Result: ${state.result.status} - ${state.result.reason}`);
    console.log(`===== CLAUDE AGENT SDK VALIDATION END =====\n`);

    return state.result;

  } catch (error) {
    console.error(`Validation agent error: ${error}`);
    return {
      status: 'ERROR',
      reason: `Agent execution failed: ${error}`,
    };
  }
}

// Re-export types
export type {
  ValidationState,
  ValidationConfig,
  Endpoint,
  Workflow,
  ProgressCallback,
  ValidationResult,
} from './state.js';
