/**
 * Update Verification Node
 *
 * Updates the verification index based on test results.
 * This is the final node before END.
 */

import type { GraphValidationState } from '../state.js';
import {
  markVerified,
  markFailed,
  saveVerification,
} from '../../verification/index.js';
import { createWorkflowFile } from './agreement-check.js';

export async function updateVerificationNode(
  state: GraphValidationState
): Promise<{ result: GraphValidationState['result'] }> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;
  const { result, failureAnalysis, agreement, workflowSuggestion } = state;

  state.onProgress?.({
    type: 'agent_action',
    action: 'update_verification',
    details: `Recording result for ${endpointKey}`,
  });

  try {
    // Handle based on result status
    if (result?.status === 'PASS') {
      // Test passed - mark as verified
      await markVerified(endpointKey, {
        swaggerFile: state.endpoint.swaggerFile,
        controllerFile: agreement?.controllerFile,
        codeAgreement: agreement?.codeAgreement,
        validDays: 7,
      });

      state.onProgress?.({
        type: 'agent_complete',
        status: 'pass',
        success: true,
        summary: result.reason,
      });
    } else if (failureAnalysis?.reason === 'doc_mismatch') {
      // Documentation mismatch - needs fix
      await markFailed(
        endpointKey,
        'doc_mismatch',
        failureAnalysis.summary,
        agreement?.mismatches || []
      );

      state.onProgress?.({
        type: 'agent_complete',
        status: 'fail',
        success: false,
        summary: `Documentation needs update: ${failureAnalysis.summary}`,
      });
    } else if (failureAnalysis) {
      // Other failure - don't invalidate documentation
      await saveVerification(endpointKey, {
        lastTest: {
          result: 'fail',
          failureReason: failureAnalysis.reason,
          testedAt: new Date().toISOString(),
          details: failureAnalysis.summary,
          httpStatus: state.executionResult?.httpStatus || state.executionResult?.status,
        },
      });

      state.onProgress?.({
        type: 'agent_complete',
        status: 'blocked',
        success: false,
        summary: failureAnalysis.summary,
      });
    } else if (result?.status === 'SKIP') {
      // Skipped - already verified
      state.onProgress?.({
        type: 'agent_complete',
        status: 'skip',
        success: true,
        summary: result.reason,
      });
    } else if (result?.status === 'BLOCKED') {
      // Blocked by agreement check (doc mismatch found before execution)
      await markFailed(
        endpointKey,
        'doc_mismatch',
        result.reason,
        agreement?.mismatches || []
      );

      state.onProgress?.({
        type: 'agent_complete',
        status: 'blocked',
        success: false,
        summary: result.reason,
      });
    } else {
      // Unknown state
      await saveVerification(endpointKey, {
        lastTest: {
          result: result?.status?.toLowerCase() || 'unknown',
          failureReason: 'unknown',
          testedAt: new Date().toISOString(),
          details: result?.reason || 'Unknown result',
        },
      });
    }

    // Create workflow if suggested and doesn't exist
    if (workflowSuggestion && !state.workflow.exists) {
      try {
        const workflowFile = await createWorkflowFile(
          endpointKey,
          workflowSuggestion,
          state.endpoint.domain || 'other'
        );

        state.onProgress?.({
          type: 'agent_action',
          action: 'workflow_created',
          details: workflowFile,
        });

        // Update verification with workflow file
        await saveVerification(endpointKey, {
          workflowFile,
        });
      } catch (error) {
        console.log(`Failed to create workflow: ${error}`);
      }
    }
  } catch (error) {
    console.error(`Failed to update verification: ${error}`);
  }

  return { result: result || { status: 'ERROR', reason: 'No result' } };
}
