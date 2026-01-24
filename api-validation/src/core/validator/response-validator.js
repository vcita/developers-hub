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
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND', // Resource/entity not found (404 with valid API response)
  VALIDATION_ERROR: 'VALIDATION_ERROR', // API returned validation error (may use wrong status code like 404)
  CONFLICT: 'CONFLICT', // 409 Conflict - operation cannot be performed due to current state
  TIMEOUT: 'TIMEOUT',
  REF_RESOLUTION_FAILED: 'REF_RESOLUTION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DOC_ISSUE: 'DOC_ISSUE',
  PARAM_NAME_MISMATCH: 'PARAM_NAME_MISMATCH',
  EXPECTED_ERROR: 'EXPECTED_ERROR', // API returned documented error response
  BAD_GATEWAY_FALLBACK: 'BAD_GATEWAY_FALLBACK' // Primary URL returned 502, succeeded on fallback URL
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
    `Endpoint not found (404). The API path may be incorrect in the documentation.`,
  
  [FAILURE_REASONS.RESOURCE_NOT_FOUND]: (resourceInfo) => 
    `Resource not found (404). The requested ${resourceInfo || 'entity'} does not exist. This is a valid API response.`,
  
  [FAILURE_REASONS.VALIDATION_ERROR]: (message, field) => 
    `Validation error: ${message || 'Invalid request data'}${field ? ` (field: ${field})` : ''}. The request body or parameters may not match the expected format.`,
  
  [FAILURE_REASONS.CONFLICT]: (message) => 
    `Conflict (409). ${message || 'The operation cannot be performed due to the current state of the resource.'}`,
  
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
    `Documentation uses {${original}} but API expects {${correct}}. Update the OpenAPI spec.`,
  
  [FAILURE_REASONS.EXPECTED_ERROR]: (status) =>
    `API returned ${status} error response. This is expected behavior per documentation.`,
  
  [FAILURE_REASONS.BAD_GATEWAY_FALLBACK]: (primaryUrl, fallbackUrl, primaryStatus) =>
    `Primary URL (${primaryUrl}) returned bad gateway error (status ${primaryStatus || 502}). Request succeeded using fallback URL (${fallbackUrl}).`
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
  
  // Check for undocumented fields (additional properties)
  const undocumentedFields = findUndocumentedFields(response, processedSchema);
  
  if (valid) {
    // Even if valid, report undocumented fields as warnings
    if (undocumentedFields.length > 0) {
      return { 
        valid: true, 
        errors: [],
        warnings: undocumentedFields.map(field => ({
          reason: 'UNDOCUMENTED_FIELD',
          path: field.path,
          message: `Field "${field.field}" is not documented in schema`,
          friendlyMessage: `API returned undocumented field "${field.field}" at ${field.path || 'root'}. Consider adding it to the documentation.`
        }))
      };
    }
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
  
  return { valid: false, errors, warnings: undocumentedFields.map(field => ({
    reason: 'UNDOCUMENTED_FIELD',
    path: field.path,
    message: `Field "${field.field}" is not documented in schema`,
    friendlyMessage: `API returned undocumented field "${field.field}" at ${field.path || 'root'}. Consider adding it to the documentation.`
  })) };
}

/**
 * Find fields in response that are not documented in schema
 * @param {*} data - Response data
 * @param {Object} schema - JSON Schema
 * @param {string} path - Current path
 * @param {number} depth - Current recursion depth (to prevent infinite loops)
 * @returns {Array} Array of undocumented field info
 */
function findUndocumentedFields(data, schema, path = '', depth = 0) {
  const undocumented = [];
  
  // Prevent infinite recursion and skip deep nesting
  if (depth > 5 || !data || typeof data !== 'object' || !schema) {
    return undocumented;
  }
  
  // Skip if schema has unresolved $ref (can't validate)
  if (schema.$ref) {
    return undocumented;
  }
  
  // Handle arrays - only check first item to avoid noise
  if (Array.isArray(data)) {
    const itemSchema = schema.items;
    if (itemSchema && data.length > 0) {
      undocumented.push(...findUndocumentedFields(data[0], itemSchema, `${path}[0]`, depth + 1));
    }
    return undocumented;
  }
  
  // Collect all documented properties from schema (handle complex compositions)
  const schemaProperties = collectSchemaProperties(schema);
  
  // If schema allows additional properties or we couldn't determine properties, skip
  if (schema.additionalProperties === true || Object.keys(schemaProperties).length === 0) {
    return undocumented;
  }
  
  // Check each field in the response
  for (const key of Object.keys(data)) {
    const fieldPath = path ? `${path}.${key}` : key;
    
    // Skip common response envelope fields that may not be in entity schemas
    if (['success', 'status', 'message', 'meta', 'pagination'].includes(key) && !path) {
      continue;
    }
    
    if (!schemaProperties[key]) {
      // Field is not documented
      undocumented.push({ field: key, path: fieldPath });
    } else if (schemaProperties[key] && data[key] && typeof data[key] === 'object') {
      // Recursively check nested objects
      undocumented.push(...findUndocumentedFields(data[key], schemaProperties[key], fieldPath, depth + 1));
    }
  }
  
  return undocumented;
}

/**
 * Recursively collect all properties from a schema, handling allOf, oneOf, anyOf
 * @param {Object} schema - JSON Schema
 * @returns {Object} Merged properties object
 */
function collectSchemaProperties(schema) {
  let properties = {};
  
  if (!schema) return properties;
  
  // Direct properties
  if (schema.properties) {
    properties = { ...properties, ...schema.properties };
  }
  
  // Handle allOf - merge all properties
  if (schema.allOf && Array.isArray(schema.allOf)) {
    for (const subSchema of schema.allOf) {
      properties = { ...properties, ...collectSchemaProperties(subSchema) };
    }
  }
  
  // Handle oneOf - use first as reference
  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf[0]) {
    properties = { ...properties, ...collectSchemaProperties(schema.oneOf[0]) };
  }
  
  // Handle anyOf - use first as reference
  if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf[0]) {
    properties = { ...properties, ...collectSchemaProperties(schema.anyOf[0]) };
  }
  
  return properties;
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
  // PASS, WARN, and ERROR are "successful" statuses (include request/response without error details)
  const isSuccessful = status === 'PASS' || status === 'WARN' || status === 'ERROR';
  
  const result = {
    endpoint: `${endpoint.method} ${endpoint.path}`,
    domain: endpoint.domain,
    method: endpoint.method,
    path: endpoint.path,
    summary: endpoint.summary || null,
    description: endpoint.description || null,
    status,
    httpStatus,
    duration: `${duration}ms`,
    durationMs: duration,
    tokenUsed,
    details: null
  };
  
  // Build friendlyMessage for all statuses that have a reason
  const friendlyMessage = errors.length > 0 
    ? errors[0].friendlyMessage 
    : (reason ? (FRIENDLY_MESSAGES[reason]?.(httpStatus) || reason) : null);
  
  if (!isSuccessful) {
    // FAIL or SKIP - include full error details
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
    // PASS, WARN, ERROR - include request/response and any issues for debugging
    result.details = {
      reason,
      friendlyMessage, // Include for WARN/ERROR to show what the issue is
      errors, // Include for WARN to show schema/doc issues
      suggestion, // Include for WARN/ERROR
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
 * Detect if a response contains validation errors (API may use wrong status code)
 * Some APIs return 404 for validation errors which should be recoverable
 * @param {Object} responseData - Response body
 * @returns {Object|null} - { isValidationError: boolean, message: string, field: string }
 */
function detectValidationError(responseData) {
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }
  
  // Check for common validation error patterns
  const errors = responseData.errors || [];
  if (!Array.isArray(errors) || errors.length === 0) {
    return null;
  }
  
  // Look for validation-related error codes or messages
  const validationPatterns = [
    /not valid/i,
    /invalid/i,
    /required/i,
    /missing/i,
    /must be/i,
    /should be/i,
    /cannot be/i,
    /expected/i,
    /format/i,
    /type/i,
    /validation/i,
    /bad.?request/i
  ];
  
  const validationCodes = ['missing', 'invalid', 'required', 'bad_request', 'validation', 'type_error'];
  
  for (const error of errors) {
    const code = (error.code || '').toLowerCase();
    const message = error.message || '';
    
    // Check if error code indicates validation
    if (validationCodes.some(c => code.includes(c))) {
      return {
        isValidationError: true,
        message: message,
        field: error.field || null
      };
    }
    
    // Check if error message indicates validation
    if (validationPatterns.some(pattern => pattern.test(message))) {
      return {
        isValidationError: true,
        message: message,
        field: error.field || null
      };
    }
  }
  
  return null;
}

/**
 * Check if response data indicates a "resource not found" (vs endpoint not found)
 * @param {Object} responseData - Response body
 * @returns {Object|null} - { isResourceNotFound: boolean, resourceInfo: string }
 */
function detectResourceNotFound(responseData) {
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }
  
  // Check for common API error response patterns
  const hasApiStructure = responseData.success === false || 
                          responseData.errors || 
                          responseData.error ||
                          responseData.message ||
                          responseData.code;
  
  if (!hasApiStructure) {
    return null;
  }
  
  // Extract error message to get resource info
  let errorMessage = '';
  if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
    errorMessage = responseData.errors[0].message || responseData.errors[0].code || '';
  } else if (responseData.error) {
    errorMessage = typeof responseData.error === 'string' ? responseData.error : responseData.error.message || '';
  } else if (responseData.message) {
    errorMessage = responseData.message;
  }
  
  // Check if the error indicates a resource not found (not endpoint)
  const notFoundPatterns = [
    /not found/i,
    /does not exist/i,
    /doesn't exist/i,
    /no .* found/i,
    /could not find/i,
    /unable to find/i,
    /invalid .* id/i,
    /unknown .*/i
  ];
  
  const isResourceNotFound = notFoundPatterns.some(pattern => pattern.test(errorMessage)) ||
                             responseData.code === 'not_found' ||
                             (responseData.errors?.[0]?.code === 'not_found');
  
  if (isResourceNotFound) {
    // Try to extract resource name from message (e.g., "Chat not found" -> "Chat")
    const resourceMatch = errorMessage.match(/^(\w+)\s+not found/i) ||
                          errorMessage.match(/^(\w+)\s+does not exist/i);
    const resourceInfo = resourceMatch ? resourceMatch[1] : 'resource';
    
    return { isResourceNotFound: true, resourceInfo };
  }
  
  return null;
}

/**
 * Validate HTTP status code
 * @param {number} actualStatus - Actual HTTP status
 * @param {Object} expectedResponses - Expected responses from spec
 * @param {Object} responseData - Response body (for distinguishing 404 types)
 * @returns {Object} { valid: boolean, error: Object|null }
 */
function validateStatusCode(actualStatus, expectedResponses, responseData = null) {
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
    // First check if this is actually a validation error (API returns 404 for invalid data)
    const validationCheck = detectValidationError(responseData);
    if (validationCheck?.isValidationError) {
      return {
        valid: false,
        error: {
          reason: FAILURE_REASONS.VALIDATION_ERROR,
          expected: expectedCodes,
          actual: actualStatus,
          message: validationCheck.message,
          field: validationCheck.field
        }
      };
    }
    
    // Distinguish between endpoint not found vs resource not found
    const resourceCheck = detectResourceNotFound(responseData);
    
    if (resourceCheck?.isResourceNotFound) {
      return {
        valid: false,
        error: {
          reason: FAILURE_REASONS.RESOURCE_NOT_FOUND,
          expected: expectedCodes,
          actual: actualStatus,
          resourceInfo: resourceCheck.resourceInfo
        }
      };
    }
    
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.ENDPOINT_NOT_FOUND,
        expected: expectedCodes,
        actual: actualStatus
      }
    };
  }
  
  if (actualStatus === 409) {
    // 409 Conflict - expected business error (e.g., duplicate resource, invalid state)
    // Extract error message from response if available
    const errorMessage = responseData?.errors?.[0]?.message || 
                         responseData?.error?.message || 
                         responseData?.message;
    return {
      valid: false,
      error: {
        reason: FAILURE_REASONS.CONFLICT,
        expected: expectedCodes,
        actual: actualStatus,
        message: errorMessage,
        isExpectedError: true // Flag to indicate this should be ERROR not FAIL
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
      return `Verify the endpoint path is correct in the documentation.`;
    
    case FAILURE_REASONS.VALIDATION_ERROR:
      return `Check the request body format and required fields. The API may expect different field names or structure than documented.`;
    
    case FAILURE_REASONS.RESOURCE_NOT_FOUND:
      return `The endpoint works correctly but returned 404 because the test resource doesn't exist. This is expected behavior - consider adding test data or documenting 404 responses.`;
    
    case FAILURE_REASONS.CONFLICT:
      return `The endpoint returned 409 Conflict, indicating the operation cannot be performed due to the current state (e.g., duplicate resource, invalid state). This is a valid API error response.`;
    
    case FAILURE_REASONS.RATE_LIMITED:
      return `Reduce request rate or wait before retrying. Consider using the conservative rate limit preset.`;
    
    case FAILURE_REASONS.SCHEMA_MISMATCH:
      return `Compare actual response with documented schema. Update either the API or documentation.`;
    
    case FAILURE_REASONS.BAD_GATEWAY_FALLBACK:
      return `The primary API gateway returned 502 Bad Gateway but the fallback URL succeeded. Investigate gateway/load balancer issues on the primary URL.`;
    
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
