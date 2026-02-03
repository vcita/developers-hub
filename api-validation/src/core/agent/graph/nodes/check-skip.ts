/**
 * Check Skip Node
 *
 * Checks if an endpoint should be skipped based on verification status.
 * Routes to END if verified and valid, otherwise to agreementCheck.
 */

import { Command, END } from '@langchain/langgraph';
import type { GraphValidationState } from '../state.js';
import {
  loadVerification,
  shouldSkipAgreementCheck,
} from '../../verification/index.js';

export async function checkSkipNode(
  state: GraphValidationState
): Promise<Command> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;

  console.log(`\n===== CHECK SKIP NODE =====`);
  console.log(`Endpoint: ${endpointKey}`);
  console.log(`forceRevalidation: ${state.forceRevalidation}`);
  console.log(`forceAgreementCheck: ${state.forceAgreementCheck}`);

  // If force agreement check, skip all caching and go straight to agreement check
  if (state.forceAgreementCheck) {
    console.log(`Force agreement check enabled - skipping cache`);
    state.onProgress?.({
      type: 'agent_action',
      action: 'force_agreement_check',
      details: `Forcing agreement check for ${endpointKey}`,
    });
    return new Command({
      goto: 'agreementCheck',
    });
  }

  state.onProgress?.({
    type: 'agent_action',
    action: 'check_verification',
    details: `Checking verification status for ${endpointKey}`,
  });

  // Load existing verification
  const verification = await loadVerification(endpointKey);
  console.log(`Has verification: ${!!verification}`);

  // Check if agreement (swagger vs code) was already verified
  const skipCheck = await shouldSkipAgreementCheck(
    endpointKey,
    state.endpoint.swaggerFile,
    verification?.codeAgreement?.controllerFile
  );
  console.log(`skipCheck.skip: ${skipCheck.skip}, reason: ${skipCheck.reason}`);

  // If verified (swagger matches code):
  // Skip agreement check but still run execute to test the API
  if (skipCheck.skip) {
    state.onProgress?.({
      type: 'agent_action',
      action: 'skip_agreement',
      details: `Swagger verified, skipping to execute for ${endpointKey}`,
    });

    return new Command({
      update: { verification },
      goto: 'executeLoop',  // Skip agreement, go to execute
    });
  }

  // Not skipping - continue to agreement check
  state.onProgress?.({
    type: 'agent_action',
    action: 'needs_verification',
    details: verification?.documentation.status || 'unverified',
  });

  return new Command({
    update: { verification },
    goto: 'agreementCheck',
  });
}
