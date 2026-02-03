/**
 * Analyze Failure Node
 *
 * Categorizes test failures to determine if it's a documentation issue
 * or some other problem (missing test data, auth, transient error).
 *
 * This determines whether we invalidate the verification or keep it.
 */

import { Command } from '@langchain/langgraph';
import type { GraphValidationState, ExecutionResult, FailureAnalysis } from '../state.js';
import type { FailureReason } from '../../verification/types.js';

export async function analyzeFailureNode(
  state: GraphValidationState
): Promise<Command> {
  const { executionResult, agreement } = state;
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;

  state.onProgress?.({
    type: 'agent_action',
    action: 'analyze_failure',
    details: `Analyzing failure for ${endpointKey}`,
  });

  // Categorize the failure
  const analysis = categorizeFailure(executionResult, agreement);

  state.onProgress?.({
    type: 'agent_action',
    action: 'failure_categorized',
    details: `${analysis.reason}: ${analysis.summary}`,
  });

  // Determine result status based on failure reason
  const resultStatus = analysis.reason === 'doc_mismatch' ? 'FAIL' : 'BLOCKED';

  return new Command({
    update: {
      failureAnalysis: analysis,
      result: {
        status: resultStatus,
        reason: analysis.summary,
        httpStatus: executionResult?.httpStatus || executionResult?.status,
        request: executionResult?.requestConfig,
        response: executionResult?.data ? {
          status: executionResult.status || 0,
          data: executionResult.data,
        } : undefined,
      },
    },
    goto: 'updateVerification',
  });
}

/**
 * Categorize the failure based on execution result and agreement check
 */
function categorizeFailure(
  exec: ExecutionResult | null,
  agreement: GraphValidationState['agreement']
): FailureAnalysis {
  // No execution result at all
  if (!exec) {
    return {
      reason: 'unknown',
      summary: 'No execution result available',
      suggestedAction: 'Check agent logs for errors',
    };
  }

  // Check if agreement check found doc issues
  if (agreement?.mismatches && agreement.mismatches.length > 0) {
    const issues = agreement.mismatches
      .map(m => `${m.category}: swagger says "${m.swagger}", code does "${m.code}"`)
      .join('; ');
    return {
      reason: 'doc_mismatch',
      summary: `Documentation doesn't match implementation: ${issues}`,
      details: JSON.stringify(agreement.mismatches, null, 2),
      suggestedAction: 'Update swagger documentation to match actual code behavior',
    };
  }

  const httpStatus = exec.httpStatus || exec.status;
  const errorMsg = exec.error || '';

  // Authentication failures
  if (httpStatus === 401) {
    return {
      reason: 'auth_issue',
      summary: `Authentication failed: 401 Unauthorized`,
      details: errorMsg,
      suggestedAction: 'Check token validity and type',
    };
  }

  if (httpStatus === 403) {
    return {
      reason: 'auth_issue',
      summary: `Permission denied: 403 Forbidden`,
      details: errorMsg,
      suggestedAction: 'Check user permissions for this endpoint',
    };
  }

  // Not found - could be missing test data
  if (httpStatus === 404) {
    // Check if it's a resource not found vs endpoint not found
    if (errorMsg.toLowerCase().includes('not found') ||
        errorMsg.toLowerCase().includes('record not found') ||
        errorMsg.toLowerCase().includes('could not find')) {
      return {
        reason: 'missing_test_data',
        summary: `Required entity not found: ${errorMsg}`,
        details: errorMsg,
        suggestedAction: 'Create test data or run prerequisites first',
      };
    }

    // Could be endpoint doesn't exist (doc mismatch)
    return {
      reason: 'doc_mismatch',
      summary: `Endpoint returned 404 - may not exist as documented`,
      details: errorMsg,
      suggestedAction: 'Verify endpoint path and method match documentation',
    };
  }

  // Validation errors - could be doc mismatch or missing data
  if (httpStatus === 422 || httpStatus === 400) {
    // Check for specific validation messages
    const validationErrors = parseValidationErrors(errorMsg, exec.data);

    if (validationErrors.some(e => e.includes('required') || e.includes('missing') || e.includes('blank'))) {
      // Check if swagger says it's optional but code requires it
      return {
        reason: 'doc_mismatch',
        summary: `Validation failed - required params may be undocumented: ${validationErrors.join(', ')}`,
        details: JSON.stringify(exec.data),
        suggestedAction: 'Check if swagger marks all required params as required',
      };
    }

    if (validationErrors.some(e => e.includes('invalid') || e.includes('format'))) {
      return {
        reason: 'missing_test_data',
        summary: `Validation failed - invalid test data: ${validationErrors.join(', ')}`,
        details: JSON.stringify(exec.data),
        suggestedAction: 'Use valid test data that matches expected format',
      };
    }

    return {
      reason: 'unknown',
      summary: `Validation failed: ${validationErrors.join(', ')}`,
      details: JSON.stringify(exec.data),
      suggestedAction: 'Review validation errors and adjust request',
    };
  }

  // Server errors - transient
  if (httpStatus && httpStatus >= 500) {
    return {
      reason: 'transient',
      summary: `Server error: ${httpStatus}`,
      details: errorMsg,
      suggestedAction: 'Retry later - server may be temporarily unavailable',
    };
  }

  // Schema mismatch in response
  if (errorMsg.includes('schema') ||
      errorMsg.includes('unexpected') ||
      errorMsg.includes('type mismatch')) {
    return {
      reason: 'doc_mismatch',
      summary: `Response doesn't match documented schema: ${errorMsg}`,
      details: errorMsg,
      suggestedAction: 'Update response schema in swagger',
    };
  }

  // Default to unknown
  return {
    reason: 'unknown',
    summary: exec.error || exec.summary || 'Unknown failure',
    details: JSON.stringify(exec.data),
    suggestedAction: 'Manual investigation needed',
  };
}

/**
 * Parse validation errors from various response formats
 */
function parseValidationErrors(errorMsg: string, data: unknown): string[] {
  const errors: string[] = [];

  // Add error message if present
  if (errorMsg) {
    errors.push(errorMsg);
  }

  // Parse structured error response
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;

    // Rails-style errors
    if (d.errors && Array.isArray(d.errors)) {
      errors.push(...(d.errors as string[]));
    }
    if (d.errors && typeof d.errors === 'object') {
      for (const [field, msgs] of Object.entries(d.errors as Record<string, string[]>)) {
        if (Array.isArray(msgs)) {
          errors.push(...msgs.map(m => `${field} ${m}`));
        }
      }
    }

    // Generic error field
    if (d.error && typeof d.error === 'string') {
      errors.push(d.error);
    }

    // Message field
    if (d.message && typeof d.message === 'string') {
      errors.push(d.message);
    }

    // Validation errors array
    if (d.validation_errors && Array.isArray(d.validation_errors)) {
      errors.push(...(d.validation_errors as string[]));
    }
  }

  return errors.filter(e => e && e.length > 0);
}
