/**
 * Response Validator
 * Validates API responses against documented schemas using AJV
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Failure reason codes
const FAILURE_REASONS = {
  SCHEMA_MISMATCH: 'SCHEMA_MISMATCH',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  TYPE_MISMATCH: 'TYPE_MISMATCH',
  UNEXPECTED_STATUS_CODE: 'UNEXPECTED_STATUS_CODE',
  AUTH_FAILED: 'AUTH_FAILED',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  REF_RESOLUTION_FAILED: 'REF_RESOLUTION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DOC_ISSUE: 'DOC_ISSUE',
  PARAM_NAME_MISMATCH: 'PARAM_NAME_MISMATCH'
};

// Friendly message templates
const FRIENDLY_MESSAGES = {
  [FAILURE_REASONS.SCHEMA_MISMATCH]: (details) => 
    `Response shape doesn't match documentation. ${details || ''}`,
  
  [FAILURE_REASONS.MISSING_REQUIRED_FIELD]: (field) => 
    `Response is missing required field '${field}'. The API returned successfully but the field wasn't present.`,
  
  [FAILURE_REASONS.TYPE_MISMATCH]: (field, expected, actual) => 
    `Field '${field}' has type '${actual}' but documentation says '${expected}'.`,
  
  [FAILURE_REASONS.UNEXPECTED_STATUS_CODE]: (expected, actual, hint) => 
    `Expected status ${expected} but got ${actual}. ${hint || ''}`,
  
  [FAILURE_REASONS.AUTH_FAILED]: (tokenType) => 
    `Authentication failed with ${tokenType} token. Verify the token is valid and has access to this endpoint.`,
  
  [FAILURE_REASONS.ENDPOINT_NOT_FOUND]: () => 
    `Endpoint returned 404. Either the path is wrong in documentation or the resource doesn't exist.`,
  
  [FAILURE_REASONS.TIMEOUT]: (timeout) => 
    `Request timed out after ${timeout}ms. The endpoint may be slow or unavailable.`,
  
  [FAILURE_REASONS.REF_RESOLUTION_FAILED]: (ref) => 
    `Could not resolve schema reference '${ref}'. The external entity URL may be incorrect.`,
  
  [FAILURE_REASONS.RATE_LIMITED]: () =>
    `Request was rate limited (429). Consider reducing request rate.`,
  
  [FAILURE_REASONS.SERVER_ERROR]: (status) =>
    `Server returned error ${status}. This may be a temporary issue or indicate a problem with the API.`,
  
  [FAILURE_REASONS.NETWORK_ERROR]: (message) =>
    `Network error: ${message}. Check connectivity and base URL configuration.`,
  
  [FAILURE_REASONS.DOC_ISSUE]: () =>
    `Documentation issue detected. The API call succeeded after correcting the request, but the documentation needs updating.`,
  
  [FAILURE_REASONS.PARAM_NAME_MISMATCH]: (original, correct) =>
    `Documentation uses {${original}} but API expects {${correct}}. Update the OpenAPI spec.`
};

/**
 * Create AJV validator instance
 * @returns {Ajv} Configured AJV instance
 */
function createValidator() {
  const ajv = new Ajv({
    allErrors: true,
    verbose: true,
    strict: false,
    validateFormats: false,
    allowUnionTypes: true // Allow multiple types including null
  });
  
  // Add format validators
  addFormats(ajv);
  
  return ajv;
}

/**
 * Convert OpenAPI schema to be more lenient with null values
 * - Explicit nullable: true fields allow null
 * - Optional fields (not in required) also allow null implicitly
 * @param {Object} schema - OpenAPI schema
 * @param {string[]} requiredFields - Array of required field names (from parent)
 * @param {string} fieldName - Current field name (to check if required)
 * @returns {Object} JSON Schema compatible schema
 */
function convertNullableSchema(schema, requiredFields = [], fieldName = null) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  
  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(item => convertNullableSchema(item, requiredFields));
  }
  
  // Clone the schema
  const converted = { ...schema };
  
  // Determine if this field should allow null:
  // 1. Explicit nullable: true
  // 2. Field is optional (not in parent's required array)
  const isExplicitlyNullable = converted.nullable === true;
  const isOptional = fieldName && !requiredFields.includes(fieldName);
  const shouldAllowNull = isExplicitlyNullable || isOptional;
  
  // Add null to type if needed
  if (shouldAllowNull && converted.type) {
    if (Array.isArray(converted.type)) {
      if (!converted.type.includes('null')) {
        converted.type = [...converted.type, 'null'];
      }
    } else {
      converted.type = [converted.type, 'null'];
    }
  }
  
  // Get required fields for children
  const childRequired = converted.required || [];
  
  // Recursively process nested schemas
  if (converted.properties) {
    converted.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      // Pass the required array and field name to children
      converted.properties[key] = convertNullableSchema(value, childRequired, key);
    }
  }
  
  if (converted.items) {
    // Array items don't have a field name context
    converted.items = convertNullableSchema(schema.items, []);
  }
  
  if (converted.allOf) {
    converted.allOf = schema.allOf.map(s => convertNullableSchema(s, requiredFields));
  }
  
  if (converted.anyOf) {
    converted.anyOf = schema.anyOf.map(s => convertNullableSchema(s, requiredFields));
  }
  
  if (converted.oneOf) {
    converted.oneOf = schema.oneOf.map(s => convertNullableSchema(s, requiredFields));
  }
  
  if (converted.additionalProperties && typeof converted.additionalProperties === 'object') {
    converted.additionalProperties = convertNullableSchema(schema.additionalProperties, []);
  }
  
  return converted;
}

/**
 * Validate response against schema
 * @param {Object} response - API response data
 * @param {Object} schema - JSON Schema to validate against
 * @param {Ajv} ajv - AJV validator instance
 * @returns {Object} { valid: boolean, errors: Object[] }
 */
function validateAgainstSchema(response, schema, ajv = createValidator()) {
  if (!schema) {
    return { valid: true, errors: [] };
  }
  
  // Handle unresolved $ref
  if (schema._resolveError) {
    return {
      valid: false,
      errors: [{
        reason: FAILURE_REASONS.REF_RESOLUTION_FAILED,
        message: schema._resolveError,
        friendlyMessage: FRIENDLY_MESSAGES[FAILURE_REASONS.REF_RESOLUTION_FAILED](schema.$ref)
      }]
    };
  }
  
  // Check if schema still has unresolved $ref
  if (schema.$ref) {
    return {
      valid: false,
      errors: [{
        reason: FAILURE_REASONS.REF_RESOLUTION_FAILED,
        message: `Unresolved reference: ${schema.$ref}`,
        friendlyMessage: FRIENDLY_MESSAGES[FAILURE_REASONS.REF_RESOLUTION_FAILED](schema.$ref)
      }]
    };
  }
  
  // Convert OpenAPI nullable to JSON Schema compatible format
  const processedSchema = convertNullableSchema(schema);
  
  let validate;
  try {
    validate = ajv.compile(processedSchema);
  } catch (compileError) {
    // Handle MissingRefError or other compilation errors
    const refMatch = compileError.message?.match(/can't resolve reference ([^\s]+)/);
    if (refMatch) {
      return {
        valid: false,
        errors: [{
          reason: FAILURE_REASONS.REF_RESOLUTION_FAILED,
          message: compileError.message,
          friendlyMessage: FRIENDLY_MESSAGES[FAILURE_REASONS.REF_RESOLUTION_FAILED](refMatch[1])
        }]
      };
    }
    // Skip validation for schemas that can't be compiled
    console.warn('Schema compilation error:', compileError.message);
    return { valid: true, errors: [], skippedValidation: true };
  }
  
  const valid = validate(response);
  
  if (valid) {
    return { valid: true, errors: [] };
  }
  
  // Convert AJV errors to our format
  const errors = (validate.errors || []).map(error => {
    const path = error.instancePath || '';
    const property = error.params?.missingProperty || error.params?.additionalProperty || '';
    
    let reason = FAILURE_REASONS.SCHEMA_MISMATCH;
    let friendlyMessage = '';
    
    if (error.keyword === 'required') {
      reason = FAILURE_REASONS.MISSING_REQUIRED_FIELD;
      friendlyMessage = FRIENDLY_MESSAGES[reason](property);
    } else if (error.keyword === 'type') {
      reason = FAILURE_REASONS.TYPE_MISMATCH;
      const field = path || 'root';
      friendlyMessage = FRIENDLY_MESSAGES[reason](
        field,
        error.params.type,
        typeof error.data
      );
    } else {
      friendlyMessage = FRIENDLY_MESSAGES[reason](error.message);
    }
    
    return {
      reason,
      keyword: error.keyword,
      path,
      message: error.message,
      friendlyMessage,
      params: error.params,
      data: error.data
    };
  });
  
  return { valid: false, errors };
}

/**
 * Build a validation result object
 * @param {Object} params - Result parameters
 * @returns {Object} Validation result
 */
function buildValidationResult({
  endpoint,
  status,
  httpStatus,
  duration,
  tokenUsed,
  reason = null,
  errors = [],
  response = null,
  request = null,
  suggestion = null
}) {
  const isPassing = status === 'PASS';
  
  const result = {
    endpoint: `${endpoint.method} ${endpoint.path}`,
    domain: endpoint.domain,
    method: endpoint.method,
    path: endpoint.path,
    status,
    httpStatus,
    duration: `${duration}ms`,
    durationMs: duration,
    tokenUsed,
    details: null
  };
  
  if (!isPassing) {
    const friendlyMessage = errors.length > 0 
      ? errors[0].friendlyMessage 
      : FRIENDLY_MESSAGES[reason]?.() || reason;
    
    result.details = {
      reason,
      friendlyMessage,
      errors,
      suggestion,
      request: request ? {
        url: request.url,
        method: request.method,
        headers: request.headers, // Keep full headers for cURL generation
        headersDisplay: maskSensitiveHeaders(request.headers), // Masked for display
        params: request.params,
        data: request.data
      } : null,
      response: response ? {
        status: response.status,
        headers: response.headers,
        data: truncateData(response.data)
      } : null
    };
  } else {
    // Include request/response in passing results for debugging
    result.details = {
      request: request ? {
        url: request.url,
        method: request.method,
        headers: request.headers,
        headersDisplay: maskSensitiveHeaders(request.headers),
        params: request.params,
        data: request.data
      } : null,
      response: response ? {
        status: response.status,
        headers: response.headers,
        data: truncateData(response.data)
      } : null
    };
  }
  
  return result;
}

/**
 * Validate HTTP status code
 * @param {number} actualStatus - Actual HTTP status
 * @param {Object} expectedResponses - Expected responses from spec
 * @returns {Object} { valid: boolean, error: Object|null }
 */
function validateStatusCode(actualStatus, expectedResponses) {
  const expectedCodes = Object.keys(expectedResponses || {}).map(Number);
  
  // Always accept documented status codes
  if (expectedCodes.includes(actualStatus)) {
    return { valid: true, error: null };
  }
  
  // Common error cases
  if (actualStatus === 401 || actualStatus === 403) {
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.AUTH_FAILED,
        expected: expectedCodes,
        actual: actualStatus
      }
    };
  }
  
  if (actualStatus === 404) {
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.ENDPOINT_NOT_FOUND,
        expected: expectedCodes,
        actual: actualStatus
      }
    };
  }
  
  if (actualStatus === 429) {
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.RATE_LIMITED,
        expected: expectedCodes,
        actual: actualStatus
      }
    };
  }
  
  if (actualStatus >= 500) {
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.SERVER_ERROR,
        expected: expectedCodes,
        actual: actualStatus
      }
    };
  }
  
  return {
    valid: false,
    error: {
      reason: FAILURE_REASONS.UNEXPECTED_STATUS_CODE,
      expected: expectedCodes,
      actual: actualStatus
    }
  };
}

/**
 * Mask sensitive headers
 * @param {Object} headers - Request/response headers
 * @returns {Object} Headers with sensitive values masked
 */
function maskSensitiveHeaders(headers) {
  if (!headers) return headers;
  
  const sensitive = ['authorization', 'x-api-key', 'cookie'];
  const masked = { ...headers };
  
  for (const key of Object.keys(masked)) {
    if (sensitive.includes(key.toLowerCase())) {
      masked[key] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * Truncate large response data
 * @param {*} data - Response data
 * @param {number} maxLength - Max string length
 * @returns {*} Truncated data
 */
function truncateData(data, maxLength = 1000) {
  if (!data) return data;
  
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  
  if (str.length <= maxLength) {
    return data;
  }
  
  return str.substring(0, maxLength) + '... [truncated]';
}

/**
 * Get suggestion for fixing a validation failure
 * @param {string} reason - Failure reason code
 * @param {Object} context - Additional context
 * @returns {string} Suggestion text
 */
function getSuggestion(reason, context = {}) {
  switch (reason) {
    case FAILURE_REASONS.MISSING_REQUIRED_FIELD:
      return `Either add '${context.field}' to the API response, or mark it as optional in the OpenAPI spec`;
    
    case FAILURE_REASONS.TYPE_MISMATCH:
      return `Update the schema to reflect the actual type, or fix the API to return the documented type`;
    
    case FAILURE_REASONS.AUTH_FAILED:
      return `Check token validity and permissions. Ensure the token has access to this endpoint.`;
    
    case FAILURE_REASONS.ENDPOINT_NOT_FOUND:
      return `Verify the endpoint path is correct in the documentation. Check if the resource exists.`;
    
    case FAILURE_REASONS.RATE_LIMITED:
      return `Reduce request rate or wait before retrying. Consider using the conservative rate limit preset.`;
    
    case FAILURE_REASONS.SCHEMA_MISMATCH:
      return `Compare actual response with documented schema. Update either the API or documentation.`;
    
    default:
      return null;
  }
}

module.exports = {
  createValidator,
  validateAgainstSchema,
  validateStatusCode,
  buildValidationResult,
  getSuggestion,
  maskSensitiveHeaders,
  truncateData,
  FAILURE_REASONS,
  FRIENDLY_MESSAGES
};
