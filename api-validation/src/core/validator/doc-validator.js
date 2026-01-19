/**
 * Documentation Validator
 * Validates that API documentation is complete and follows standards
 */

const { extractTokenInfo } = require('../parser/token-parser');

// Issue types for documentation problems
const DOC_ISSUES = {
  MISSING_TOKEN_DOCUMENTATION: 'MISSING_TOKEN_DOCUMENTATION',
  MISSING_DESCRIPTION: 'MISSING_DESCRIPTION',
  MISSING_SUMMARY: 'MISSING_SUMMARY',
  MISSING_RESPONSE_SCHEMA: 'MISSING_RESPONSE_SCHEMA',
  INVALID_PATH_PARAMETER: 'INVALID_PATH_PARAMETER'
};

/**
 * Validate token documentation for an endpoint
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @returns {Object|null} Issue object or null if valid
 */
function validateTokenDocumentation(operation, path, method) {
  const tokenInfo = extractTokenInfo(operation);
  
  if (!tokenInfo.found) {
    return {
      endpoint: `${method.toUpperCase()} ${path}`,
      issue: DOC_ISSUES.MISSING_TOKEN_DOCUMENTATION,
      message: "No token availability found in description or x-auth-type field. Add 'Available for **{Token} Tokens**' to the description.",
      severity: 'error'
    };
  }
  
  return null;
}

/**
 * Validate that endpoint has a description
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @returns {Object|null} Issue object or null if valid
 */
function validateDescription(operation, path, method) {
  if (!operation.description || operation.description.trim().length === 0) {
    return {
      endpoint: `${method.toUpperCase()} ${path}`,
      issue: DOC_ISSUES.MISSING_DESCRIPTION,
      message: 'Endpoint is missing a description',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Validate that endpoint has a summary
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @returns {Object|null} Issue object or null if valid
 */
function validateSummary(operation, path, method) {
  if (!operation.summary || operation.summary.trim().length === 0) {
    return {
      endpoint: `${method.toUpperCase()} ${path}`,
      issue: DOC_ISSUES.MISSING_SUMMARY,
      message: 'Endpoint is missing a summary',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Validate path parameters are documented
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @returns {Object[]} Array of issue objects
 */
function validatePathParameters(operation, path, method) {
  const issues = [];
  
  // Extract path parameters from path template
  const pathParams = path.match(/\{([^}]+)\}/g) || [];
  const paramNames = pathParams.map(p => p.replace(/[{}]/g, ''));
  
  // Get documented parameters
  const documentedParams = (operation.parameters || [])
    .filter(p => p.in === 'path')
    .map(p => p.name);
  
  // Check each path parameter is documented
  for (const paramName of paramNames) {
    if (!documentedParams.includes(paramName)) {
      issues.push({
        endpoint: `${method.toUpperCase()} ${path}`,
        issue: DOC_ISSUES.INVALID_PATH_PARAMETER,
        message: `Path parameter '${paramName}' is not documented in parameters`,
        severity: 'warning'
      });
    }
  }
  
  return issues;
}

/**
 * Validate response schema exists for success response
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @returns {Object|null} Issue object or null if valid
 */
function validateResponseSchema(operation, path, method) {
  const responses = operation.responses || {};
  
  // Check for 200 or 201 response
  const successResponse = responses['200'] || responses['201'];
  
  if (!successResponse) {
    return null; // No success response defined, skip validation
  }
  
  const content = successResponse.content;
  if (!content || !content['application/json']) {
    return null; // Not a JSON response, skip
  }
  
  const schema = content['application/json'].schema;
  if (!schema) {
    return {
      endpoint: `${method.toUpperCase()} ${path}`,
      issue: DOC_ISSUES.MISSING_RESPONSE_SCHEMA,
      message: 'Success response is missing a schema definition',
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * Validate a single endpoint operation
 * @param {Object} operation - OpenAPI operation object
 * @param {string} path - Endpoint path
 * @param {string} method - HTTP method
 * @param {Object} options - Validation options
 * @returns {Object[]} Array of issue objects
 */
function validateEndpoint(operation, path, method, options = {}) {
  const issues = [];
  
  // Always validate token documentation (this is critical)
  const tokenIssue = validateTokenDocumentation(operation, path, method);
  if (tokenIssue) {
    issues.push(tokenIssue);
  }
  
  // Optional validations based on options
  if (options.validateDescription !== false) {
    const descIssue = validateDescription(operation, path, method);
    if (descIssue) {
      issues.push(descIssue);
    }
  }
  
  if (options.validateSummary) {
    const summaryIssue = validateSummary(operation, path, method);
    if (summaryIssue) {
      issues.push(summaryIssue);
    }
  }
  
  if (options.validatePathParameters !== false) {
    const paramIssues = validatePathParameters(operation, path, method);
    issues.push(...paramIssues);
  }
  
  if (options.validateResponseSchema) {
    const schemaIssue = validateResponseSchema(operation, path, method);
    if (schemaIssue) {
      issues.push(schemaIssue);
    }
  }
  
  return issues;
}

/**
 * Validate all endpoints in a swagger spec
 * @param {Object} spec - OpenAPI specification object
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, issues: Object[], errors: Object[], warnings: Object[] }
 */
function validateSpec(spec, options = {}) {
  const issues = [];
  
  const paths = spec.paths || {};
  
  for (const [path, pathItem] of Object.entries(paths)) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (operation) {
        const endpointIssues = validateEndpoint(operation, path, method, options);
        issues.push(...endpointIssues);
      }
    }
  }
  
  // Separate errors from warnings
  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings
  };
}

module.exports = {
  validateEndpoint,
  validateSpec,
  validateTokenDocumentation,
  validateDescription,
  validateSummary,
  validatePathParameters,
  validateResponseSchema,
  DOC_ISSUES
};
