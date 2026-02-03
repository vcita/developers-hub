/**
 * Node 1: Token Prep
 *
 * Deterministic TypeScript node that prepares all tokens before agent execution.
 * REUSES existing functions from token-validator.js
 *
 * Output:
 *   - tokens: { staff, client, app, admin, directory }
 *   - params: { business_uid, business_id, staff_id, client_id, ... }
 */

import type {
  ValidationState,
  ValidationConfig,
  TokenConfig,
  ProgressCallback,
} from '../state.js';

// Import existing JS functions - these are well-tested and battle-hardened
// @ts-ignore - JS module without types
import {
  validateAndRefreshTokens,
  generateStaffJwt,
  generateClientToken,
  validateJwtToken,
  decodeJwt,
  isJwtToken,
} from '../../config/token-validator.js';

// =============================================================================
// Token Validation Helpers
// =============================================================================

/**
 * Check if a JWT token is valid (not expired, buffer of 60 seconds)
 */
function isJwtValid(token: string | undefined): boolean {
  if (!token) return false;
  if (!isJwtToken(token)) return false;

  try {
    const result = validateJwtToken(token, 60) as { valid: boolean };
    return result.valid;
  } catch {
    return false;
  }
}

/**
 * Get token expiry info for logging
 */
function getTokenExpiryInfo(token: string | undefined): string {
  if (!token) return 'missing';
  if (!isJwtToken(token)) return 'non-JWT (API key)';

  try {
    const payload = decodeJwt(token) as { exp?: number } | null;
    if (payload?.exp) {
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 0) {
        return `expired ${-diffMins}m ago`;
      } else if (diffMins < 5) {
        return `expires in ${diffMins}m (will refresh)`;
      } else {
        return `valid for ${diffMins}m`;
      }
    }
    return 'no exp claim';
  } catch {
    return 'decode error';
  }
}

// =============================================================================
// Main Node Function
// =============================================================================

export interface TokenPrepResult {
  tokens: TokenConfig;
  params: Record<string, string>;
}

/**
 * Token Prep Node
 *
 * 1. Validates existing tokens (checks expiry)
 * 2. Refreshes expired JWT tokens (staff, client)
 * 3. Returns ready-to-use tokens and params
 */
export async function tokenPrepNode(
  config: ValidationConfig,
  onProgress?: ProgressCallback
): Promise<TokenPrepResult> {
  console.log('\n===== NODE 1: TOKEN PREP =====');

  onProgress?.({
    type: 'agent_action',
    action: 'token_prep_start',
    details: 'Validating and refreshing tokens',
  });

  // Log current token status
  console.log('Current token status:');
  const tokenTypes = ['staff', 'client', 'app', 'admin', 'directory'] as const;
  for (const type of tokenTypes) {
    const token = config.tokens[type];
    const status = getTokenExpiryInfo(token);
    console.log(`  ${type}: ${status}`);
  }

  // Use existing validateAndRefreshTokens which handles:
  // - Checking JWT expiry
  // - Calling generateStaffJwt if staff token expired
  // - Calling generateClientToken if client token expired
  // - Updating tokens.json file
  let updatedConfig: ValidationConfig;

  try {
    const result = await validateAndRefreshTokens(config) as { config: ValidationConfig };
    updatedConfig = result.config;
    console.log('\nToken validation complete.');
  } catch (error) {
    console.log(`\nToken validation error: ${error}`);
    // Continue with original config if refresh fails
    updatedConfig = config;
  }

  // Double-check staff token - generate if still invalid
  if (!isJwtValid(updatedConfig.tokens.staff) && config.staffAuth?.autoRefresh) {
    console.log('\nStaff token still invalid, attempting generation...');
    try {
      const newStaffToken = await generateStaffJwt(updatedConfig);
      if (newStaffToken) {
        updatedConfig.tokens.staff = newStaffToken;
        console.log('  Staff token generated successfully');
      }
    } catch (error) {
      console.log(`  Staff token generation failed: ${error}`);
    }
  }

  // Double-check client token - generate if still invalid
  if (!isJwtValid(updatedConfig.tokens.client) && config.clientAuth?.autoRefresh) {
    console.log('\nClient token still invalid, attempting generation...');
    try {
      const newClientToken = await generateClientToken(updatedConfig);
      if (newClientToken) {
        updatedConfig.tokens.client = newClientToken;
        console.log('  Client token generated successfully');
      }
    } catch (error) {
      console.log(`  Client token generation failed: ${error}`);
    }
  }

  // Log final token status
  console.log('\nFinal token status:');
  const readyTokens: string[] = [];
  const missingTokens: string[] = [];

  for (const type of tokenTypes) {
    const token = updatedConfig.tokens[type];
    if (token && token.length > 10) {
      readyTokens.push(type);
      console.log(`  ${type}: ready`);
    } else {
      missingTokens.push(type);
      console.log(`  ${type}: not available`);
    }
  }

  onProgress?.({
    type: 'agent_action',
    action: 'token_prep_complete',
    details: `Ready: ${readyTokens.join(', ')}${missingTokens.length ? ` | Missing: ${missingTokens.join(', ')}` : ''}`,
  });

  console.log('===== TOKEN PREP COMPLETE =====\n');

  return {
    tokens: updatedConfig.tokens,
    params: { ...updatedConfig.params },
  };
}

// =============================================================================
// Exports for Testing
// =============================================================================

export { isJwtValid, getTokenExpiryInfo };
