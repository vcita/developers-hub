/**
 * API Client
 * HTTP client for making API calls with token injection
 */

const axios = require('axios');
const { selectToken } = require('../parser/token-parser');
const { extractPathParams, isStaticParam, hasParamSource, getParamSource, deriveListEndpoint, generateResourceKey, resolveParamByContext } = require('./param-resolver');
const { generateQueryParams: aiGenerateQueryParams, generateRequestBody: aiGenerateRequestBody } = require('./ai-param-generator');

/**
 * Create an axios instance configured for API validation
 * @param {Object} config - Configuration object
 * @returns {Object} Axios instance with additional config
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
  
  // Attach config for fallback URL access
  instance._config = {
    baseUrl: config.baseUrl,
    fallbackUrl: config.fallbackUrl || null
  };
  
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
  // Pass path for path-based token preference (e.g., /client/* endpoints prefer client token)
  // Pass configParams for client token validation (expiry, business_uid match)
  const { tokenType, token, isFallback, originalRequired, shouldSkip, skipReason, needsClientToken } = selectToken(
    endpoint.tokenInfo.tokens, 
    config.tokens, 
    { useFallback: true, path: endpoint.path, configParams: config.params }
  );
  
  // Skip if endpoint requires privileged tokens we don't have
  if (shouldSkip) {
    return {
      skip: true,
      skipReason: skipReason || `Requires ${tokenType} token (not configured)`,
      config: null,
      tokenType,
      hasToken: false
    };
  }
  
  // Build path with substituted parameters
  let path = endpoint.path;
  
  // 1. Substitute static params from config.params (business_id, staff_id, etc.)
  const staticParams = config.params || {};
  for (const [param, value] of Object.entries(staticParams)) {
    if (value && value !== `your-${param.replace(/_/g, '-')}-here`) {
      path = path.replace(`{${param}}`, value);
    }
  }
  
  // 2. Substitute UID from context (from testContext.getUid for detail endpoints)
  if (context.uid) {
    // Get the trailing param name from the path (e.g., {uid}, {id}, {client_package_id})
    const derived = deriveListEndpoint(endpoint.path);
    if (derived) {
      // Substitute the actual param name (could be uid, id, client_package_id, etc.)
      path = path.replace(`{${derived.paramName}}`, context.uid);
    }
    // Also try common patterns as fallback
    path = path.replace('{uid}', context.uid);
    path = path.replace('{id}', context.uid);
  }
  
  // 3. Substitute dynamic params from context.params (resolved params)
  if (context.params) {
    for (const [key, value] of Object.entries(context.params)) {
      path = path.replace(`{${key}}`, value);
    }
    
    // 3b. Context-aware substitution for generic params like {uid} or {id}
    // If path still has {uid} or {id}, try to resolve using context
    const remainingParams = extractPathParams(path);
    for (const param of remainingParams) {
      if (param === 'uid' || param === 'id') {
        const contextParam = resolveParamByContext(param, endpoint.path);
        if (contextParam !== param && context.params[contextParam]) {
          path = path.replace(`{${param}}`, context.params[contextParam]);
          console.log(`[API Client] Context substitution: {${param}} -> ${contextParam} = ${context.params[contextParam]}`);
        }
      }
    }
  }
  
  // 5. Check for unresolved parameters
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
  // Admin tokens use "Admin" prefix, all others use "Bearer"
  if (token) {
    const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';
    requestConfig.headers['Authorization'] = `${authPrefix} ${token}`;
  }
  
  // Add X-On-Behalf-Of header if endpoint requires it
  // This is used for Directory tokens acting on behalf of a business
  // See: https://developers.intandem.tech/docs/directory-owners-partners
  if (endpoint.requiresOnBehalfOf && staticParams.business_uid) {
    requestConfig.headers['X-On-Behalf-Of'] = staticParams.business_uid;
    console.log(`  [API Client] Adding X-On-Behalf-Of header (required by endpoint): ${staticParams.business_uid}`);
  }

  // Build query parameters from endpoint definition
  const queryParams = {};
  
  // Add query parameters defined in the swagger spec (stored as endpoint.parameters.query)
  const endpointQueryParams = endpoint.parameters?.query;
  const dynamicParams = context.params || {}; // Resolved params from pre-flight (e.g., ai_chat_uid)
  
  console.log(`  [QueryParams] Endpoint has ${endpointQueryParams?.length || 0} query params defined`);
  
  if (endpointQueryParams && Array.isArray(endpointQueryParams)) {
    console.log(`  [QueryParams] Static params available: ${JSON.stringify(staticParams)}`);
    console.log(`  [QueryParams] Dynamic params available: ${JSON.stringify(dynamicParams)}`);
    
    for (const param of endpointQueryParams) {
      console.log(`  [QueryParams] Processing param: ${param.name} (required: ${param.required})`);
      
      // Priority order: dynamic params > static params > default > example > infer
      if (dynamicParams[param.name]) {
        // Use dynamically resolved param (from pre-flight)
        queryParams[param.name] = dynamicParams[param.name];
        console.log(`  [QueryParams] → Added from dynamic params: ${param.name}=${dynamicParams[param.name]}`);
      } else if (staticParams[param.name]) {
        // Use configured value (e.g., business_id from tokens.json)
        queryParams[param.name] = staticParams[param.name];
        console.log(`  [QueryParams] → Added from static params: ${param.name}=${staticParams[param.name]}`);
      } else if (param.schema?.default !== undefined) {
        queryParams[param.name] = param.schema.default;
        console.log(`  [QueryParams] → Added from schema default: ${param.name}=${param.schema.default}`);
      } else if (param.example !== undefined) {
        queryParams[param.name] = param.example;
        console.log(`  [QueryParams] → Added from example: ${param.name}=${param.example}`);
      } else if (param.required) {
        // Required param without value - try to infer or check for uid variants
        const altKey = param.name.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        
        if (dynamicParams[altKey]) {
          queryParams[param.name] = dynamicParams[altKey];
          console.log(`  [QueryParams] → Added from dynamic params (alt key): ${param.name}=${dynamicParams[altKey]}`);
        } else if (param.name === 'page') {
          queryParams[param.name] = 1;
        } else if (param.name === 'per_page') {
          queryParams[param.name] = 10;
        } else if (param.schema?.enum?.length > 0) {
          queryParams[param.name] = param.schema.enum[0];
          console.log(`  [QueryParams] → Added from enum: ${param.name}=${param.schema.enum[0]}`);
        } else {
          // Generate value based on schema type/format
          const generatedValue = generateQueryParamValue(param);
          if (generatedValue !== null) {
            queryParams[param.name] = generatedValue;
            console.log(`  [QueryParams] → Generated from schema: ${param.name}=${generatedValue}`);
          } else {
            console.warn(`  [QueryParams] → MISSING required param: ${param.name}`);
          }
        }
      } else {
        // Optional param - still generate if it has a meaningful schema type
        // (helps ensure API returns complete responses for validation)
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
    // Merge all resolved parameters for body generation
    const allResolvedParams = { ...staticParams, ...(context.params || {}) };
    
    // Generate body with all documented fields (not just required)
    let body = context.requestBody || generateMinimalPayload(endpoint, allResolvedParams);
    
    // Substitute resolved parameters in request body (handles any remaining placeholders)
    body = substituteBodyParams(body, staticParams, context.params || {});
    
    requestConfig.data = body;
  }
  
  return {
    skip: false,
    config: requestConfig,
    tokenType,
    hasToken: !!token,
    isFallbackToken: isFallback,
    originalRequired, // Track what token was originally required (if fallback used)
    needsClientToken // Signal that a client token should be acquired
  };
}

/**
 * Build request config with AI-powered parameter generation
 * @param {Object} endpoint - Endpoint object
 * @param {Object} config - App configuration
 * @param {Object} context - Test context with UIDs and params
 * @returns {Promise<Object>} Axios request config or skip info
 */
async function buildRequestConfigAsync(endpoint, config, context = {}) {
  // Select appropriate token
  // Pass configParams for client token validation (expiry, business_uid match)
  const { tokenType, token, isFallback, originalRequired, shouldSkip, skipReason, needsClientToken } = selectToken(
    endpoint.tokenInfo.tokens, 
    config.tokens, 
    { useFallback: true, path: endpoint.path, configParams: config.params }
  );
  
  // Skip if endpoint requires privileged tokens we don't have
  if (shouldSkip) {
    return {
      skip: true,
      skipReason: skipReason || `Requires ${tokenType} token (not configured)`,
      config: null,
      tokenType,
      hasToken: false
    };
  }
  
  // Build path with substituted parameters
  let path = endpoint.path;
  const staticParams = config.params || {};
  
  // Substitute static params
  for (const [param, value] of Object.entries(staticParams)) {
    if (value && value !== `your-${param.replace(/_/g, '-')}-here`) {
      path = path.replace(`{${param}}`, value);
    }
  }
  
  // Substitute UID from context
  if (context.uid) {
    const derived = deriveListEndpoint(endpoint.path);
    if (derived) {
      path = path.replace(`{${derived.paramName}}`, context.uid);
    }
    path = path.replace('{uid}', context.uid);
    path = path.replace('{id}', context.uid);
  }
  
  // Substitute dynamic params
  if (context.params) {
    for (const [key, value] of Object.entries(context.params)) {
      path = path.replace(`{${key}}`, value);
    }
    
    // Context-aware substitution for generic params like {uid} or {id}
    const remainingParams = extractPathParams(path);
    for (const param of remainingParams) {
      if (param === 'uid' || param === 'id') {
        const contextParam = resolveParamByContext(param, endpoint.path);
        if (contextParam !== param && context.params[contextParam]) {
          path = path.replace(`{${param}}`, context.params[contextParam]);
          console.log(`[API Client Async] Context substitution: {${param}} -> ${contextParam} = ${context.params[contextParam]}`);
        }
      }
    }
  }
  
  // Check for unresolved parameters
  const unresolvedParams = extractPathParams(path);
  if (unresolvedParams.length > 0) {
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
  
  // Admin tokens use "Admin" prefix, all others use "Bearer"
  if (token) {
    const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';
    requestConfig.headers['Authorization'] = `${authPrefix} ${token}`;
  }
  
  // Add X-On-Behalf-Of header if endpoint requires it
  // This is used for Directory tokens acting on behalf of a business
  // See: https://developers.intandem.tech/docs/directory-owners-partners
  if (endpoint.requiresOnBehalfOf && staticParams.business_uid) {
    requestConfig.headers['X-On-Behalf-Of'] = staticParams.business_uid;
    console.log(`  [API Client Async] Adding X-On-Behalf-Of header (required by endpoint): ${staticParams.business_uid}`);
  }
  
  // AI config
  const aiConfig = {
    enabled: config.ai?.enabled || false,
    apiKey: config.ai?.anthropicApiKey
  };
  
  const dynamicParams = context.params || {};
  
  // Generate query parameters (with AI if enabled)
  const hasQueryParams = endpoint.parameters?.query?.some(p => p.required);
  if (hasQueryParams || endpoint.parameters?.query?.length > 0) {
    console.log(`  [AI Param Gen] Generating query params for ${endpoint.method} ${endpoint.path}...`);
    const queryParams = await aiGenerateQueryParams(endpoint, staticParams, dynamicParams, aiConfig);
    
    // Add default pagination for list endpoints
    if (endpoint.method === 'GET' && !endpoint.hasUidParam) {
      if (!queryParams.page) queryParams.page = 1;
      if (!queryParams.per_page) queryParams.per_page = 25;
    }
    
    if (Object.keys(queryParams).length > 0) {
      requestConfig.params = queryParams;
    }
  }
  
  // Generate request body (with AI if enabled)
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    console.log(`  [AI Param Gen] Generating request body for ${endpoint.method} ${endpoint.path}...`);
    let body = context.requestBody;
    
    if (!body) {
      body = await aiGenerateRequestBody(endpoint, staticParams, dynamicParams, aiConfig);
    }
    
    // Substitute any remaining placeholders
    body = substituteBodyParams(body, staticParams, dynamicParams);
    requestConfig.data = body;
  }
  
  return {
    skip: false,
    config: requestConfig,
    tokenType,
    hasToken: !!token,
    isFallbackToken: isFallback,
    originalRequired,
    needsClientToken
  };
}

/**
 * Check if a value is a placeholder that should be substituted
 * @param {*} value - Value to check
 * @returns {boolean}
 */
function isPlaceholderValue(value) {
  if (value === null || value === undefined || value === '') return true;
  if (typeof value !== 'string') return false;
  
  // Common placeholder patterns
  const placeholders = [
    'test_string',
    'string',
    'example',
    'your-',
    'placeholder',
    '00000000-0000-0000-0000-000000000000' // UUID placeholder
  ];
  
  const lowerValue = value.toLowerCase();
  return placeholders.some(p => lowerValue.includes(p));
}

/**
 * Substitute resolved parameters in request body
 * Replaces placeholder values like "test_string" with actual resolved values
 * @param {Object} body - Request body object
 * @param {Object} staticParams - Static params from config (business_id, etc.)
 * @param {Object} dynamicParams - Dynamically resolved params (client_uid, etc.)
 * @returns {Object} Body with substituted values
 */
function substituteBodyParams(body, staticParams = {}, dynamicParams = {}) {
  if (!body || typeof body !== 'object') return body;
  
  // Combine all available params
  const allParams = { ...staticParams, ...dynamicParams };
  
  // Deep clone and substitute
  const substitute = (obj) => {
    if (Array.isArray(obj)) {
      return obj.map(item => substitute(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        // Check if this key matches a known param and value is a placeholder
        if (allParams[key] && isPlaceholderValue(value)) {
          result[key] = allParams[key];
        } else if (typeof value === 'object') {
          result[key] = substitute(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    
    return obj;
  };
  
  return substitute(body);
}

/**
 * Check if a property name represents a uid/id field (standard pattern)
 * @param {string} propName - Property name
 * @returns {boolean}
 */
function isStandardUidField(propName) {
  const lower = propName.toLowerCase();
  return lower.endsWith('_uid') || 
         lower.endsWith('_id') || 
         lower === 'uid' || 
         lower === 'id';
}

/**
 * Check if a property name represents a reference field (broader pattern)
 * Includes standard uid/id fields plus common reference field names
 * @param {string} propName - Property name
 * @returns {boolean}
 */
function isReferenceField(propName) {
  if (isStandardUidField(propName)) return true;
  
  const lower = propName.toLowerCase();
  
  // Common reference field names that typically reference other entities
  const referenceFieldPatterns = [
    'key',           // permission key, config key, etc.
    'code',          // role code, status code, etc.
    'type',          // entity type references
    'role',          // role references
    'permission',    // permission references
    'category',      // category references
    'tag',           // tag references
  ];
  
  // Check if field name matches or ends with these patterns
  for (const pattern of referenceFieldPatterns) {
    if (lower === pattern || lower.endsWith(`_${pattern}`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a field description indicates it's a reference to another entity
 * @param {string} description - Field description
 * @returns {boolean}
 */
function isReferenceByDescription(description) {
  if (!description) return false;
  
  const lower = description.toLowerCase();
  
  // Patterns that indicate a reference field
  const referenceIndicators = [
    'reference to',
    'identifier of',
    'must be a valid',
    'must be valid',
    'one of the available',
    'existing',
    'from the',
    'belongs to',
    'foreign key',
    'must exist',
    'valid identifier',
    'references',
    'refers to',
    'linked to',
    'associated with',
  ];
  
  return referenceIndicators.some(indicator => lower.includes(indicator));
}

// Alias for backward compatibility
const isUidField = isStandardUidField;

/**
 * Generate a value for a required query parameter based on its schema
 * @param {Object} param - Parameter definition from swagger
 * @returns {*} Generated value or null
 */
function generateQueryParamValue(param) {
  const schema = param.schema;
  if (!schema) return null;
  
  // Use example if available on the param itself
  if (param.example !== undefined) {
    return param.example;
  }
  
  // Use schema example
  if (schema.example !== undefined) {
    return schema.example;
  }
  
  // Generate based on type and format
  const type = schema.type;
  const format = schema.format;
  
  if (type === 'string') {
    // Handle date/time formats
    if (format === 'date-time') {
      // Generate start_time as now, end_time as 7 days from now
      const now = new Date();
      if (param.name.includes('start') || param.name.includes('from')) {
        return now.toISOString();
      } else if (param.name.includes('end') || param.name.includes('to') || param.name.includes('until')) {
        const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        return future.toISOString();
      }
      return now.toISOString();
    }
    if (format === 'date') {
      const now = new Date();
      if (param.name.includes('start') || param.name.includes('from')) {
        return now.toISOString().split('T')[0];
      } else if (param.name.includes('end') || param.name.includes('to') || param.name.includes('until')) {
        const future = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        return future.toISOString().split('T')[0];
      }
      return now.toISOString().split('T')[0];
    }
    if (format === 'email') {
      return 'test@example.com';
    }
    if (format === 'uuid') {
      return '00000000-0000-0000-0000-000000000000';
    }
    if (format === 'uri') {
      return 'https://example.com';
    }
    // Default string
    return 'test_string';
  }
  
  if (type === 'integer' || type === 'number') {
    if (schema.minimum !== undefined) {
      return schema.minimum;
    }
    return 1;
  }
  
  if (type === 'boolean') {
    return true;
  }
  
  if (type === 'array') {
    return [];
  }
  
  return null;
}

/**
 * Generate complete valid payload for POST/PUT requests
 * Includes all documented properties with special uid/id handling
 * @param {Object} endpoint - Endpoint object
 * @param {Object} resolvedParams - Resolved uid/id parameters from context
 * @returns {Object} Request payload
 */
function generateMinimalPayload(endpoint, resolvedParams = {}) {
  const schema = endpoint.requestSchema;
  
  if (!schema) {
    return {};
  }
  
  // Generate complete object from schema
  return generateFromSchema(schema, schema.required || [], resolvedParams);
}

/**
 * Generate complete object from JSON schema
 * Includes all properties, handling uid/id and reference fields specially
 * @param {Object} schema - JSON schema
 * @param {string[]} requiredFields - Required field names
 * @param {Object} resolvedParams - Resolved uid/id parameters
 * @param {string} parentPath - Parent path for nested fields (e.g., "permissions[]")
 * @returns {Object} Generated object
 */
function generateFromSchema(schema, requiredFields = [], resolvedParams = {}, parentPath = '') {
  if (!schema) return {};
  
  // Handle allOf - merge all schemas
  if (schema.allOf) {
    const merged = {};
    let mergedRequired = [...requiredFields];
    for (const subSchema of schema.allOf) {
      if (subSchema.required) {
        mergedRequired = [...mergedRequired, ...subSchema.required];
      }
      Object.assign(merged, generateFromSchema(subSchema, mergedRequired, resolvedParams, parentPath));
    }
    return merged;
  }
  
  // Handle $ref - skip external refs (can't resolve at runtime)
  if (schema.$ref) {
    return {};
  }
  
  if (schema.type === 'object') {
    const obj = {};
    const required = schema.required || requiredFields;
    const properties = schema.properties || {};
    
    // Process ALL properties (not just required)
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const fullPath = parentPath ? `${parentPath}.${propName}` : propName;
      
      // Check if this is a reference field by various methods
      const isStdUid = isStandardUidField(propName);
      const isRefByName = isReferenceField(propName);
      const isRefByDesc = isReferenceByDescription(propSchema.description);
      const hasExplicitRef = propSchema['x-reference-to'];
      
      // Determine if this field needs a resolved value (not a generated placeholder)
      // For nested array items (e.g., permissions[].key), use broader detection
      const isNestedInArray = parentPath.includes('[]');
      const needsResolvedValue = isStdUid || hasExplicitRef || 
        (isNestedInArray && (isRefByName || isRefByDesc));
      
      if (needsResolvedValue) {
        // Try to find a matching resolved param
        const paramKey = propName;
        const fullPathKey = fullPath.replace(/\[\]\./g, '_');
        const altKey = propName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        
        if (resolvedParams[paramKey]) {
          obj[propName] = resolvedParams[paramKey];
        } else if (resolvedParams[fullPathKey]) {
          obj[propName] = resolvedParams[fullPathKey];
        } else if (resolvedParams[altKey]) {
          obj[propName] = resolvedParams[altKey];
        } else if (isRequired) {
          // Required reference field with no resolved value - use placeholder
          // Mark it clearly as needing resolution
          obj[propName] = generateValue(propSchema, propName, resolvedParams);
        }
        // Skip non-required reference fields with no resolved value
        continue;
      }
      
      // For non-reference fields, include all of them with generated values
      obj[propName] = generateValue(propSchema, propName, resolvedParams, parentPath);
    }
    
    return obj;
  }
  
  return generateValue(schema, '', resolvedParams, parentPath);
}

/**
 * Generate a value based on schema type
 * @param {Object} schema - Property schema
 * @param {string} propName - Property name (for uid/id handling)
 * @param {Object} resolvedParams - Resolved parameters
 * @param {string} parentPath - Parent path for nested fields
 * @returns {*} Generated value
 */
function generateValue(schema, propName = '', resolvedParams = {}, parentPath = '') {
  if (!schema) return null;
  
  // For uid/id fields, try to find a matching resolved param
  if (propName && isStandardUidField(propName)) {
    const altKey = propName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
    if (resolvedParams[propName]) return resolvedParams[propName];
    if (resolvedParams[altKey]) return resolvedParams[altKey];
  }
  
  // Handle allOf - merge all schemas (e.g., config field with allOf)
  if (schema.allOf) {
    const merged = {};
    for (const subSchema of schema.allOf) {
      Object.assign(merged, generateValue(subSchema, propName, resolvedParams, parentPath));
    }
    return merged;
  }
  
  // Handle oneOf - use first option
  if (schema.oneOf && schema.oneOf.length > 0) {
    return generateValue(schema.oneOf[0], propName, resolvedParams, parentPath);
  }
  
  // Handle anyOf - use first option
  if (schema.anyOf && schema.anyOf.length > 0) {
    return generateValue(schema.anyOf[0], propName, resolvedParams, parentPath);
  }
  
  // Handle $ref that wasn't dereferenced (external refs)
  if (schema.$ref) {
    return {};
  }
  
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
      // Generate one item if items schema is provided
      if (schema.items) {
        // For arrays of objects, pass the array path (e.g., "permissions[]")
        const arrayPath = parentPath ? `${parentPath}.${propName}[]` : `${propName}[]`;
        if (schema.items.type === 'object' && schema.items.properties) {
          // Use generateFromSchema for object items to get proper reference handling
          const item = generateFromSchema(schema.items, schema.items.required || [], resolvedParams, arrayPath);
          return Object.keys(item).length > 0 ? [item] : [];
        }
        const item = generateValue(schema.items, '', resolvedParams, arrayPath);
        return item !== null ? [item] : [];
      }
      return [];
    
    case 'object':
      return generateFromSchema(schema, schema.required || [], resolvedParams, parentPath);
    
    default:
      // No type specified but has properties - treat as object
      if (schema.properties) {
        return generateFromSchema(schema, schema.required || [], resolvedParams, parentPath);
      }
      return null;
  }
}

/**
 * Check if a response indicates a Bad Gateway error
 * This can be either a 502 status code OR a 404 with "bad gateway" in the message
 * @param {Object} response - Axios response object
 * @returns {boolean} True if this is a bad gateway error
 */
function isBadGatewayError(response) {
  if (!response) return false;
  
  // Direct 502 Bad Gateway
  if (response.status === 502) {
    return true;
  }
  
  // 404 with "bad gateway" in the response body
  if (response.status === 404) {
    const data = response.data;
    if (data) {
      // Check various response formats for "bad gateway" message
      const messageText = typeof data === 'string' 
        ? data 
        : (data.message || data.error || data.errors?.[0]?.message || JSON.stringify(data));
      
      if (messageText && messageText.toLowerCase().includes('bad gateway')) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Execute an API request with optional fallback on Bad Gateway
 * @param {Object} client - Axios instance
 * @param {Object} requestConfig - Request configuration
 * @returns {Promise<Object>} Response with timing and fallback info
 */
async function executeRequest(client, requestConfig) {
  const startTime = Date.now();
  const primaryUrl = client._config?.baseUrl;
  const fallbackUrl = client._config?.fallbackUrl;
  
  try {
    const response = await client.request(requestConfig);
    const duration = Date.now() - startTime;
    
    // Check for Bad Gateway (502 or 404 with "bad gateway" message) and attempt fallback if configured
    if (isBadGatewayError(response) && fallbackUrl) {
      const errorType = response.status === 502 ? '502 Bad Gateway' : `404 with "bad gateway" message`;
      console.log(`  [Fallback] Primary URL returned ${errorType}, trying fallback URL: ${fallbackUrl}`);
      
      const fallbackStartTime = Date.now();
      
      try {
        // Create a new request config with fallback URL
        const fallbackRequestConfig = {
          ...requestConfig,
          baseURL: fallbackUrl
        };
        
        const fallbackResponse = await axios.request({
          ...fallbackRequestConfig,
          url: fallbackUrl + requestConfig.url, // Full URL since we're not using an instance
          timeout: client.defaults.timeout,
          validateStatus: () => true,
          headers: {
            ...client.defaults.headers.common,
            ...requestConfig.headers
          }
        });
        
        const totalDuration = Date.now() - startTime;
        const fallbackDuration = Date.now() - fallbackStartTime;
        
        // Fallback succeeded - check if it returned a valid response (not another bad gateway)
        if (!isBadGatewayError(fallbackResponse)) {
          console.log(`  [Fallback] Fallback succeeded with status ${fallbackResponse.status} (${fallbackDuration}ms)`);
          
          return {
            success: true,
            response: fallbackResponse,
            duration: totalDuration,
            error: null,
            usedFallback: true,
            fallbackInfo: {
              primaryUrl,
              fallbackUrl,
              primaryStatus: response.status,
              fallbackStatus: fallbackResponse.status,
              fallbackDuration
            }
          };
        }
        
        // Fallback also returned bad gateway error, return original error
        console.log(`  [Fallback] Fallback also returned bad gateway error (status ${fallbackResponse.status})`);
      } catch (fallbackError) {
        console.log(`  [Fallback] Fallback request failed: ${fallbackError.message}`);
      }
    }
    
    return {
      success: true,
      response,
      duration,
      error: null,
      usedFallback: false
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
      },
      usedFallback: false
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
  buildRequestConfigAsync,
  executeRequest,
  extractUidFromResponse,
  generateMinimalPayload,
  generateFromSchema,
  generateCurlCommand
};
