/**
 * Pre-Flight Hook
 *
 * Runs BEFORE the agent calls execute_api to validate:
 * 1. All required params are available in state
 * 2. The requested token type is available and valid
 *
 * If validation fails, returns a deny decision with a helpful message
 * telling the agent what's missing and how to resolve it.
 */

import type {
  ValidationState,
  Endpoint,
  EndpointParameter,
  TokenConfig,
} from '../state.js';

// =============================================================================
// Hook Types
// =============================================================================

export interface ExecuteApiInput {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  token_type?: string;
  purpose?: string;
  use_fallback?: boolean;
  on_behalf_of?: string;
}

export interface PreflightResult {
  allowed: boolean;
  reason?: string;
}

// =============================================================================
// Parameter Extraction
// =============================================================================

/**
 * Extract required parameters from endpoint swagger schema
 */
export function extractRequiredParams(endpoint: Endpoint): string[] {
  const required: string[] = [];

  // 1. Path parameters (always required)
  const pathMatches = endpoint.path.match(/\{([^}]+)\}/g) || [];
  for (const match of pathMatches) {
    const paramName = match.replace(/[{}]/g, '');
    required.push(paramName);
  }

  // 2. Required query parameters
  if (endpoint.parameters?.query) {
    for (const param of endpoint.parameters.query) {
      if (param.required) {
        required.push(param.name);
      }
    }
  }

  // 3. Required body fields (from schema)
  if (endpoint.requestSchema?.required) {
    for (const field of endpoint.requestSchema.required) {
      required.push(field);
    }
  }

  return [...new Set(required)]; // Deduplicate
}

/**
 * Extract path parameters that need to be filled
 */
export function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g) || [];
  return matches.map((m) => m.replace(/[{}]/g, ''));
}

// =============================================================================
// Token Validation
// =============================================================================

/**
 * Check if a token exists and looks valid (has content)
 */
function isTokenAvailable(tokens: TokenConfig, tokenType: string): boolean {
  const token = tokens[tokenType as keyof TokenConfig];
  return typeof token === 'string' && token.length > 10;
}

/**
 * Get list of available token types
 */
function getAvailableTokenTypes(tokens: TokenConfig): string[] {
  const available: string[] = [];
  const types = ['staff', 'client', 'app', 'admin', 'directory', 'internal'] as const;

  for (const type of types) {
    if (isTokenAvailable(tokens, type)) {
      available.push(type);
    }
  }

  return available;
}

// =============================================================================
// Main Hook Function
// =============================================================================

/**
 * Pre-flight validation hook
 *
 * Called before execute_api to catch missing params/tokens early.
 * Returns { allowed: true } if request can proceed,
 * or { allowed: false, reason: "..." } if something is missing.
 */
export function preflightHook(
  input: ExecuteApiInput,
  state: ValidationState
): PreflightResult {
  const issues: string[] = [];

  // 1. Validate path parameters
  const pathParams = extractPathParams(input.path);
  const missingPathParams: string[] = [];

  for (const param of pathParams) {
    // Check if param is in state.params or provided in input.params
    const hasInState = state.params[param] !== undefined;
    const hasInInput = input.params?.[param] !== undefined;

    // Also check common variations (business_id vs business_uid)
    const variations = getParamVariations(param);
    const hasVariation = variations.some(
      (v) => state.params[v] !== undefined || input.params?.[v] !== undefined
    );

    if (!hasInState && !hasInInput && !hasVariation) {
      missingPathParams.push(param);
    }
  }

  if (missingPathParams.length > 0) {
    issues.push(`Missing path parameters: ${missingPathParams.join(', ')}`);
  }

  // 2. Validate token
  const tokenType = input.token_type || 'staff';
  if (!isTokenAvailable(state.tokens, tokenType)) {
    const available = getAvailableTokenTypes(state.tokens);
    issues.push(
      `Token '${tokenType}' is not available.\n` +
        `   Available tokens: ${available.length > 0 ? available.join(', ') : 'none'}`
    );
  }

  // 3. Validate required body fields for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(input.method.toUpperCase())) {
    const requiredBodyFields = state.endpoint.requestSchema?.required || [];
    const missingBodyFields: string[] = [];

    for (const field of requiredBodyFields) {
      // Check if field is in input.body or can be derived from state.params
      const hasInBody = input.body?.[field] !== undefined;
      const hasInParams = state.params[field] !== undefined;

      if (!hasInBody && !hasInParams) {
        // Don't flag UID fields that might be resolved during execution
        if (!field.endsWith('_uid') && !field.endsWith('_id')) {
          missingBodyFields.push(field);
        }
      }
    }

    if (missingBodyFields.length > 0) {
      issues.push(
        `Missing required body fields: ${missingBodyFields.join(', ')}\n` +
          `   Check swagger schema for required fields.`
      );
    }
  }

  // Return result
  if (issues.length > 0) {
    const reason = formatPreflightError(issues, state);
    return { allowed: false, reason };
  }

  return { allowed: true };
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Get common variations of a parameter name
 */
function getParamVariations(param: string): string[] {
  const variations: string[] = [];

  // business_id <-> business_uid
  if (param === 'business_id') {
    variations.push('business_uid');
  } else if (param === 'business_uid') {
    variations.push('business_id');
  }

  // service_id <-> service_uid
  if (param === 'service_id') {
    variations.push('service_uid');
  } else if (param === 'service_uid') {
    variations.push('service_id');
  }

  // staff_id <-> staff_uid
  if (param === 'staff_id') {
    variations.push('staff_uid');
  } else if (param === 'staff_uid') {
    variations.push('staff_id');
  }

  // client_id <-> client_uid
  if (param === 'client_id') {
    variations.push('client_uid');
  } else if (param === 'client_uid') {
    variations.push('client_id');
  }

  return variations;
}

/**
 * Format a helpful error message for the agent
 */
function formatPreflightError(issues: string[], state: ValidationState): string {
  let message = '===== PRE-FLIGHT CHECK FAILED =====\n\n';

  for (const issue of issues) {
    message += `ERROR: ${issue}\n\n`;
  }

  message += '--- Current State ---\n';
  message += `Available params: ${Object.keys(state.params).join(', ') || 'none'}\n`;
  message += `Available tokens: ${getAvailableTokenTypes(state.tokens).join(', ') || 'none'}\n`;

  if (state.workflow.exists) {
    message += `\n--- Workflow Available ---\n`;
    if (state.workflow.uidResolution) {
      message += `UID Resolution defined for: ${Object.keys(state.workflow.uidResolution).join(', ')}\n`;
    }
    if (state.workflow.prerequisites && state.workflow.prerequisites.length > 0) {
      message += `Prerequisites: ${state.workflow.prerequisites.map((p) => p.name).join(' -> ')}\n`;
    }
  }

  message += '\n--- Suggestions ---\n';
  message += '1. Use extract_required_uids to see what UIDs are needed\n';
  message += '2. Use find_uid_source to find endpoints that provide missing UIDs\n';
  message += '3. Use execute_api with purpose="uid_resolution" to fetch missing values\n';

  message += '\n=====================================';

  return message;
}

// =============================================================================
// Export for SDK Integration
// =============================================================================

/**
 * Create a preflight hook function bound to a specific state
 *
 * This is used when registering the hook with the Claude Agent SDK.
 * The SDK calls this function with tool input, and we check against
 * the bound state.
 */
export function createPreflightHook(state: ValidationState) {
  return function (toolName: string, toolInput: unknown): PreflightResult {
    // Only check execute_api calls
    if (toolName !== 'execute_api') {
      return { allowed: true };
    }

    return preflightHook(toolInput as ExecuteApiInput, state);
  };
}
