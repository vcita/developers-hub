/**
 * API Client
 * HTTP client for making API calls with token injection
 */

const axios = require('axios');
const { selectToken } = require('../parser/token-parser');
const { extractPathParams, isStaticParam, hasParamSource, getParamSource } = require('./param-resolver');

/**
 * Create an axios instance configured for API validation
 * @param {Object} config - Configuration object
 * @returns {Object} Axios instance
 */
function createApiClient(config) {
  const instance = axios.create({
    baseURL: config.baseUrl,
    timeout: config.options?.timeout || 30000,
    validateStatus: () => true, // Don't throw on any status code
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  return instance;
}

/**
 * Build request config for an endpoint
 * @param {Object} endpoint - Endpoint object
 * @param {Object} config - App configuration
 * @param {Object} context - Test context with UIDs and params
 * @returns {Object} Axios request config or skip info
 */
function buildRequestConfig(endpoint, config, context = {}) {
  // Select appropriate token (with fallback for undocumented endpoints or placeholder tokens)
  const { tokenType, token, isFallback, originalRequired } = selectToken(endpoint.tokenInfo.tokens, config.tokens, { useFallback: true });
  
  // Build path with substituted parameters
  let path = endpoint.path;
  
  // 1. Substitute static params from config.params (business_id, staff_id, etc.)
  const staticParams = config.params || {};
  for (const [param, value] of Object.entries(staticParams)) {
    if (value && value !== `your-${param.replace(/_/g, '-')}-here`) {
      path = path.replace(`{${param}}`, value);
    }
  }
  
  // 2. Substitute UID parameters from context (legacy support)
  if (context.uid) {
    path = path.replace('{uid}', context.uid);
    path = path.replace('{id}', context.uid);
  }
  
  // 3. Substitute dynamic params from context.params (resolved params)
  if (context.params) {
    for (const [key, value] of Object.entries(context.params)) {
      path = path.replace(`{${key}}`, value);
    }
  }
  
  // 4. Check for unresolved parameters
  const unresolvedParams = extractPathParams(path);
  if (unresolvedParams.length > 0) {
    // Categorize unresolved params
    const missingStatic = unresolvedParams.filter(p => isStaticParam(p));
    const missingDynamic = unresolvedParams.filter(p => !isStaticParam(p) && hasParamSource(p));
    const unknown = unresolvedParams.filter(p => !isStaticParam(p) && !hasParamSource(p));
    
    let reason = `Missing path parameters: ${unresolvedParams.map(p => `{${p}}`).join(', ')}`;
    
    if (missingStatic.length > 0) {
      reason += `\n  → Configure these in tokens.json params: ${missingStatic.join(', ')}`;
    }
    if (missingDynamic.length > 0) {
      reason += `\n  → These could be fetched from API: ${missingDynamic.join(', ')}`;
    }
    if (unknown.length > 0) {
      reason += `\n  → Unknown params (no source): ${unknown.join(', ')}`;
    }
    
    return {
      skip: true,
      skipReason: reason,
      config: null,
      tokenType,
      hasToken: !!token,
      unresolvedParams
    };
  }
  
  const requestConfig = {
    method: endpoint.method.toLowerCase(),
    url: path,
    headers: {}
  };
  
  // Add authorization header
  if (token) {
    requestConfig.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Build query parameters from endpoint definition
  const queryParams = {};
  
  // Add query parameters defined in the swagger spec (stored as endpoint.parameters.query)
  const endpointQueryParams = endpoint.parameters?.query;
  console.log(`  [QueryParams] Endpoint has ${endpointQueryParams?.length || 0} query params defined`);
  
  if (endpointQueryParams && Array.isArray(endpointQueryParams)) {
    const staticParams = config.params || {};
    console.log(`  [QueryParams] Static params available: ${JSON.stringify(staticParams)}`);
    
    for (const param of endpointQueryParams) {
      console.log(`  [QueryParams] Processing param: ${param.name} (required: ${param.required})`);
      // Use configured value if available (e.g., business_id from tokens.json)
      if (staticParams[param.name]) {
        queryParams[param.name] = staticParams[param.name];
        console.log(`  [QueryParams] → Added from static params: ${param.name}=${staticParams[param.name]}`);
      } else if (param.schema?.default !== undefined) {
        queryParams[param.name] = param.schema.default;
        console.log(`  [QueryParams] → Added from schema default: ${param.name}=${param.schema.default}`);
      } else if (param.example !== undefined) {
        queryParams[param.name] = param.example;
        console.log(`  [QueryParams] → Added from example: ${param.name}=${param.example}`);
      } else if (param.required) {
        // Required param without value - try to infer
        if (param.name === 'page') {
          queryParams[param.name] = 1;
        } else if (param.name === 'per_page') {
          queryParams[param.name] = 10;
        } else if (param.schema?.enum?.length > 0) {
          queryParams[param.name] = param.schema.enum[0];
          console.log(`  [QueryParams] → Added from enum: ${param.name}=${param.schema.enum[0]}`);
        } else {
          console.log(`  [QueryParams] → MISSING required param: ${param.name}`);
        }
      }
    }
  }
  
  // Add default pagination for list endpoints if not already set
  if (endpoint.method === 'GET' && !endpoint.hasUidParam) {
    if (!queryParams.page) queryParams.page = 1;
    if (!queryParams.per_page) queryParams.per_page = 10;
  }
  
  // Only add params if we have any
  if (Object.keys(queryParams).length > 0) {
    requestConfig.params = queryParams;
  }
  
  // Add request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    requestConfig.data = context.requestBody || generateMinimalPayload(endpoint);
  }
  
  return {
    skip: false,
    config: requestConfig,
    tokenType,
    hasToken: !!token,
    isFallbackToken: isFallback,
    originalRequired // Track what token was originally required (if fallback used)
  };
}

/**
 * Generate minimal valid payload for POST/PUT requests
 * @param {Object} endpoint - Endpoint object
 * @returns {Object} Minimal request payload
 */
function generateMinimalPayload(endpoint) {
  const schema = endpoint.requestSchema;
  
  if (!schema) {
    return {};
  }
  
  // Try to generate minimal valid object from schema
  return generateFromSchema(schema);
}

/**
 * Generate minimal object from JSON schema
 * @param {Object} schema - JSON schema
 * @returns {Object} Generated object
 */
function generateFromSchema(schema) {
  if (!schema) return {};
  
  if (schema.type === 'object') {
    const obj = {};
    const required = schema.required || [];
    const properties = schema.properties || {};
    
    // Add required properties
    for (const prop of required) {
      if (properties[prop]) {
        obj[prop] = generateValue(properties[prop]);
      }
    }
    
    return obj;
  }
  
  return generateValue(schema);
}

/**
 * Generate a value based on schema type
 * @param {Object} schema - Property schema
 * @returns {*} Generated value
 */
function generateValue(schema) {
  if (!schema) return null;
  
  // Use example if available
  if (schema.example !== undefined) {
    return schema.example;
  }
  
  // Use default if available
  if (schema.default !== undefined) {
    return schema.default;
  }
  
  // Use enum value
  if (schema.enum && schema.enum.length > 0) {
    return schema.enum[0];
  }
  
  // Generate based on type
  switch (schema.type) {
    case 'string':
      if (schema.format === 'email') return 'test@example.com';
      if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (schema.format === 'date') return '2024-01-01';
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'uri') return 'https://example.com';
      return 'test_string';
    
    case 'number':
    case 'integer':
      return schema.minimum ?? 0;
    
    case 'boolean':
      return true;
    
    case 'array':
      return [];
    
    case 'object':
      return generateFromSchema(schema);
    
    default:
      return null;
  }
}

/**
 * Execute an API request
 * @param {Object} client - Axios instance
 * @param {Object} requestConfig - Request configuration
 * @returns {Promise<Object>} Response with timing
 */
async function executeRequest(client, requestConfig) {
  const startTime = Date.now();
  
  try {
    const response = await client.request(requestConfig);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      response,
      duration,
      error: null
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      response: error.response || null,
      duration,
      error: {
        message: error.message,
        code: error.code,
        isTimeout: error.code === 'ECONNABORTED',
        isNetworkError: error.code === 'ERR_NETWORK' || !error.response
      }
    };
  }
}

/**
 * Extract UID from response data
 * @param {Object} responseData - API response data
 * @returns {string|null} Extracted UID
 */
function extractUidFromResponse(responseData) {
  if (!responseData) return null;
  
  // Common patterns for UID in response
  const data = responseData.data || responseData;
  
  if (typeof data === 'object' && data !== null) {
    // Try common UID field names
    return data.uid || data.id || data.uuid || null;
  }
  
  return null;
}

/**
 * Generate cURL command for debugging
 * @param {Object} requestConfig - Request configuration
 * @param {string} baseUrl - Base URL
 * @returns {string} cURL command
 */
function generateCurlCommand(requestConfig, baseUrl) {
  const parts = ['curl'];
  
  // Method
  parts.push(`-X ${requestConfig.method.toUpperCase()}`);
  
  // URL
  const url = `${baseUrl}${requestConfig.url}`;
  parts.push(`'${url}'`);
  
  // Headers
  for (const [key, value] of Object.entries(requestConfig.headers || {})) {
    if (key.toLowerCase() === 'authorization') {
      parts.push(`-H '${key}: Bearer ***'`);
    } else {
      parts.push(`-H '${key}: ${value}'`);
    }
  }
  
  // Data
  if (requestConfig.data) {
    const data = JSON.stringify(requestConfig.data);
    parts.push(`-d '${data}'`);
  }
  
  return parts.join(' \\\n  ');
}

module.exports = {
  createApiClient,
  buildRequestConfig,
  executeRequest,
  extractUidFromResponse,
  generateMinimalPayload,
  generateFromSchema,
  generateCurlCommand
};
