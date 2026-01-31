/**
 * AI Parameter Generator
 * Uses AI to intelligently fill ALL request parameters (path, query, body) based on documentation
 * 
 * NEW UNIFIED FLOW:
 * Step 1: Resolve UIDs/IDs/Reference Keys (done externally)
 * Step 2: AI fills ALL values (path, query, body)
 * Step 3: Quick type validation (string/array/object)
 */

const Anthropic = require('@anthropic-ai/sdk');

let anthropicClient = null;

/**
 * Initialize the Anthropic client
 * @param {string} apiKey - Anthropic API key
 */
function initializeClient(apiKey) {
  if (!apiKey) return;
  anthropicClient = new Anthropic({ apiKey });
}

/**
 * UNIFIED: Generate ALL parameters using AI-first approach
 * This is the main entry point for parameter generation.
 * 
 * @param {Object} endpoint - Endpoint object with path, method, parameters, requestSchema
 * @param {Object} resolvedUids - Pre-resolved UIDs/IDs/reference keys from Step 1
 * @param {Object} aiConfig - AI configuration { enabled, apiKey }
 * @returns {Promise<Object>} { pathParams, queryParams, bodyParams }
 */
async function generateAllParams(endpoint, resolvedUids = {}, aiConfig = {}) {
  console.log(`[AI Param Gen] Generating all params for ${endpoint.method} ${endpoint.path}`);
  
  // Step 2: AI fills ALL values (path, query, body)
  if (aiConfig.enabled && aiConfig.apiKey) {
    // Initialize client if needed
    if (!anthropicClient) {
      initializeClient(aiConfig.apiKey);
    }
    
    const aiResult = await generateWithAI(endpoint, resolvedUids, aiConfig);
    
    if (aiResult) {
      // Step 3: Quick type validation
      const validated = validateTypes(aiResult, endpoint);
      console.log('[AI Param Gen] AI generation successful');
      return validated;
    }
  }
  
  // Fallback to basic generation only if AI unavailable or fails
  console.log('[AI Param Gen] Falling back to basic generation');
  return generateAllParamsBasic(endpoint, resolvedUids);
}

/**
 * Generate parameters using AI
 * @param {Object} endpoint - Endpoint object
 * @param {Object} resolvedUids - Pre-resolved UIDs
 * @param {Object} aiConfig - AI configuration
 * @returns {Promise<Object|null>} Generated params or null
 */
async function generateWithAI(endpoint, resolvedUids, aiConfig) {
  if (!anthropicClient && aiConfig.apiKey) {
    initializeClient(aiConfig.apiKey);
  }
  
  if (!anthropicClient) {
    console.log('[AI Param Gen] No API key - cannot use AI generation');
    return null;
  }
  
  try {
    // Build rich context for AI
    const context = buildUnifiedContext(endpoint, resolvedUids);
    const prompt = buildUnifiedPrompt(context);
    
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    // Parse AI response
    const content = response.content[0]?.text;
    if (!content) {
      console.log('[AI Param Gen] Empty response from AI');
      return null;
    }
    
    // Extract JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1]);
      console.log('[AI Param Gen] Generated params:', JSON.stringify(parsed, null, 2));
      return parsed;
    }
    
    // Try parsing the entire response as JSON
    try {
      const parsed = JSON.parse(content);
      console.log('[AI Param Gen] Generated params:', JSON.stringify(parsed, null, 2));
      return parsed;
    } catch {
      console.log('[AI Param Gen] Could not parse AI response as JSON');
      return null;
    }
  } catch (error) {
    console.error('[AI Param Gen] Error:', error.message);
    return null;
  }
}

/**
 * Build unified context for AI - includes ALL parameter types
 */
function buildUnifiedContext(endpoint, resolvedUids) {
  const requestSchema = endpoint.requestSchema;
  
  // Extract path parameters from the path
  const pathParamNames = (endpoint.path.match(/\{([a-z_]+)\}/g) || [])
    .map(m => m.slice(1, -1));
  
  // Get path parameter schemas
  const pathParams = (endpoint.parameters?.path || []).map(p => formatParamSchema(p));
  
  // Add any path params that aren't in the schema
  for (const paramName of pathParamNames) {
    if (!pathParams.find(p => p.name === paramName)) {
      pathParams.push({
        name: paramName,
        required: true,
        type: 'string',
        description: `Path parameter: ${paramName}`
      });
    }
  }
  
  return {
    method: endpoint.method,
    path: endpoint.path,
    summary: endpoint.summary || '',
    description: endpoint.description || '',
    pathParameters: pathParams,
    queryParameters: (endpoint.parameters?.query || []).map(p => formatParamSchema(p)),
    requestBodySchema: requestSchema ? formatSchemaFull(requestSchema) : null,
    requestBodyExample: requestSchema?.example || null,
    resolvedUids: resolvedUids,
    currentDate: new Date().toISOString()
  };
}

/**
 * Format a single parameter schema with ALL constraint fields
 */
function formatParamSchema(param) {
  const schema = param.schema || {};
  return {
    name: param.name,
    required: param.required || false,
    description: param.description || '',
    type: schema.type || 'string',
    format: schema.format || null,
    pattern: schema.pattern || null,
    enum: schema.enum || null,
    default: schema.default,
    example: param.example || schema.example,
    minimum: schema.minimum,
    maximum: schema.maximum,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    minItems: schema.minItems,
    maxItems: schema.maxItems
  };
}

/**
 * Format schema for AI context - preserves ALL constraint fields including pattern
 */
function formatSchemaFull(schema, depth = 0) {
  if (depth > 4) return { type: 'object', note: '(nested object - depth limit reached)' };
  
  if (schema.allOf) {
    const merged = { type: 'object', properties: {}, required: [] };
    for (const sub of schema.allOf) {
      const formatted = formatSchemaFull(sub, depth + 1);
      if (formatted.properties) {
        Object.assign(merged.properties, formatted.properties);
      }
      if (formatted.required) {
        merged.required = [...merged.required, ...formatted.required];
      }
      // Copy other fields
      if (formatted.description) merged.description = formatted.description;
      if (formatted.example !== undefined) merged.example = formatted.example;
    }
    merged.required = [...new Set(merged.required)];
    return merged;
  }
  
  if (schema.oneOf || schema.anyOf) {
    const options = schema.oneOf || schema.anyOf;
    return {
      oneOf: options.map(o => formatSchemaFull(o, depth + 1))
    };
  }
  
  if (schema.type === 'object' || schema.properties) {
    const result = {
      type: 'object',
      required: schema.required || [],
      properties: {}
    };
    
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      if (prop.type === 'object' || prop.properties) {
        result.properties[key] = formatSchemaFull(prop, depth + 1);
      } else if (prop.type === 'array' && prop.items) {
        result.properties[key] = {
          type: 'array',
          description: prop.description,
          items: formatSchemaFull(prop.items, depth + 1),
          example: prop.example,
          minItems: prop.minItems,
          maxItems: prop.maxItems,
          uniqueItems: prop.uniqueItems
        };
      } else {
        // Include ALL constraint fields - this is critical for AI reasoning
        result.properties[key] = {
          type: prop.type,
          format: prop.format,
          description: prop.description,
          pattern: prop.pattern,        // CRITICAL: Include pattern constraint
          enum: prop.enum,
          default: prop.default,
          example: prop.example,
          minimum: prop.minimum,
          maximum: prop.maximum,
          minLength: prop.minLength,
          maxLength: prop.maxLength,
          nullable: prop.nullable
        };
      }
    }
    
    return result;
  }
  
  if (schema.type === 'array') {
    return {
      type: 'array',
      description: schema.description,
      items: schema.items ? formatSchemaFull(schema.items, depth + 1) : { type: 'string' },
      example: schema.example,
      minItems: schema.minItems,
      maxItems: schema.maxItems,
      uniqueItems: schema.uniqueItems
    };
  }
  
  // Primitive types - include all constraints
  return {
    type: schema.type,
    format: schema.format,
    description: schema.description,
    pattern: schema.pattern,
    enum: schema.enum,
    default: schema.default,
    example: schema.example,
    minimum: schema.minimum,
    maximum: schema.maximum,
    minLength: schema.minLength,
    maxLength: schema.maxLength
  };
}

/**
 * Build the unified AI prompt for ALL parameter types
 */
function buildUnifiedPrompt(context) {
  return `You are generating test parameters for an API endpoint. Generate realistic, valid values for ALL parameter types.

## Endpoint Information
- **Method**: ${context.method}
- **Path**: ${context.path}
- **Summary**: ${context.summary}
- **Description**: ${context.description}
- **Current Date/Time**: ${context.currentDate}

## Pre-Resolved UIDs (MUST use these for uid/id fields)
These are real values from the test system. Use them for any matching uid/id fields:
\`\`\`json
${JSON.stringify(context.resolvedUids, null, 2)}
\`\`\`

## Path Parameters
\`\`\`json
${JSON.stringify(context.pathParameters, null, 2)}
\`\`\`

## Query Parameters
\`\`\`json
${JSON.stringify(context.queryParameters, null, 2)}
\`\`\`

${context.requestBodySchema ? `## Request Body Schema
\`\`\`json
${JSON.stringify(context.requestBodySchema, null, 2)}
\`\`\`` : '## Request Body Schema\nNo request body required.'}

${context.requestBodyExample ? `## Request Body Example (USE THIS!)
\`\`\`json
${JSON.stringify(context.requestBodyExample, null, 2)}
\`\`\`` : ''}

## CRITICAL INSTRUCTIONS - MINIMAL HAPPY PATH

**GOAL: Generate the BARE MINIMUM parameters needed for a successful request. We want the happy path, not comprehensive coverage.**

1. **ONLY REQUIRED FIELDS**: Include ONLY fields marked as "required". Do NOT include optional query params or body fields unless they are in the "required" array. Empty objects {} are valid if nothing is required.

2. **UIDs/IDs**: For ANY field ending in _uid, _id, or named uid/id, ONLY use values from "Pre-Resolved UIDs". If no match, use null.

3. **Pattern Constraints**: When a field has a "pattern" property, generate a value that MATCHES the regex pattern.
   - Read the description - it explains what the pattern means
   - Example: pattern "^[a-z]{2}(-[A-Z]{2})?$" → use "en" or "en-GB"

4. **Examples**: If a required field has an "example" value, USE IT EXACTLY.
   - **EXCEPTION - Email fields**: For POST requests, email fields must be UNIQUE. Generate a unique email using the current timestamp: \`test.{timestamp}@example.com\` where {timestamp} is the epoch milliseconds from Current Date/Time.
   - **EXCEPTION - Code/identifier fields**: For POST requests creating resources, fields named "code" that are described as "unique" MUST be unique. Generate a unique code using the timestamp: \`test_{resource}_{timestamp}\` (e.g., \`test_role_1706455200000\`). Do NOT use common codes like "admin", "owner", "staff", "manager".

5. **Enums**: If a field has an "enum" array, select the first value.

6. **Arrays**: For required arrays, generate exactly 1 item that matches the items schema.

7. **Dates**: Use dates relative to ${context.currentDate}.

8. **GET requests**: Do NOT add pagination params (page, per_page) unless they are required. Keep query params minimal.

9. **POST/PUT bodies**: Only include required body fields. Do NOT include uid, created_at, updated_at.

10. **IMPORTANT**: When in doubt, OMIT the field. Less is more. We want the simplest valid request.

## Response Format
Return ONLY a JSON object with this exact structure (no explanation):
\`\`\`json
{
  "pathParams": {
    "param_name": "value"
  },
  "queryParams": {
    "param_name": "value"
  },
  "bodyParams": {
    "field_name": "value"
  }
}
\`\`\`

Use empty objects {} for any section with no parameters.
`;
}

/**
 * Step 3: Quick type validation
 * Ensures structural correctness without value validation
 */
function validateTypes(params, endpoint) {
  const result = {
    pathParams: params.pathParams || {},
    queryParams: params.queryParams || {},
    bodyParams: params.bodyParams || {}
  };
  
  // Validate path params are strings
  for (const [key, value] of Object.entries(result.pathParams)) {
    if (value !== null && value !== undefined && typeof value !== 'string') {
      result.pathParams[key] = String(value);
    }
  }
  
  // Validate query params are primitives or arrays
  for (const [key, value] of Object.entries(result.queryParams)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // Convert objects to JSON strings
        result.queryParams[key] = JSON.stringify(value);
      }
    }
  }
  
  // Validate body structure matches schema expectations
  const schema = endpoint.requestSchema;
  if (schema && result.bodyParams) {
    result.bodyParams = validateBodyTypes(result.bodyParams, schema);
  }
  
  return result;
}

/**
 * Validate body params match schema types
 */
function validateBodyTypes(body, schema) {
  if (!body || typeof body !== 'object') return body;
  
  const properties = schema.properties || {};
  
  for (const [key, value] of Object.entries(body)) {
    const propSchema = properties[key];
    if (!propSchema) continue;
    
    // Ensure arrays are arrays
    if (propSchema.type === 'array' && !Array.isArray(value)) {
      if (value !== null && value !== undefined) {
        body[key] = [value];
      } else {
        body[key] = [];
      }
    }
    
    // Ensure objects are objects
    if (propSchema.type === 'object' && typeof value !== 'object') {
      body[key] = {};
    }
    
    // Ensure strings are strings
    if (propSchema.type === 'string' && typeof value !== 'string' && value !== null) {
      body[key] = String(value);
    }
  }
  
  return body;
}

// ============== Basic (Non-AI) Generation Functions - FALLBACK ONLY ==============

/**
 * Basic generation for ALL params (fallback when AI unavailable)
 */
function generateAllParamsBasic(endpoint, resolvedUids = {}) {
  return {
    pathParams: generatePathParamsBasic(endpoint, resolvedUids),
    queryParams: generateQueryParamsBasic(endpoint, resolvedUids, resolvedUids),
    bodyParams: generateRequestBodyBasic(endpoint, resolvedUids)
  };
}

/**
 * Basic path param generation
 */
function generatePathParamsBasic(endpoint, resolvedUids = {}) {
  const pathParams = {};
  const pathParamNames = (endpoint.path.match(/\{([a-z_]+)\}/g) || [])
    .map(m => m.slice(1, -1));
  
  for (const paramName of pathParamNames) {
    if (resolvedUids[paramName]) {
      pathParams[paramName] = resolvedUids[paramName];
    } else {
      // Try alternate forms (uid vs id)
      const altKey = paramName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
      if (resolvedUids[altKey]) {
        pathParams[paramName] = resolvedUids[altKey];
      } else {
        pathParams[paramName] = 'UNRESOLVED_' + paramName;
      }
    }
  }
  
  return pathParams;
}

/**
 * Basic query param generation (non-AI fallback)
 * MINIMAL: Only include REQUIRED query params for happy path
 */
function generateQueryParamsBasic(endpoint, staticParams = {}, dynamicParams = {}) {
  const queryParams = {};
  const endpointQueryParams = endpoint.parameters?.query || [];
  
  for (const param of endpointQueryParams) {
    // ONLY process if param is REQUIRED or explicitly provided
    if (!param.required && !dynamicParams[param.name] && !staticParams[param.name]) {
      continue; // Skip optional params for minimal happy path
    }
    
    // Priority: dynamic > static > default > example > generate
    if (dynamicParams[param.name]) {
      queryParams[param.name] = dynamicParams[param.name];
    } else if (staticParams[param.name]) {
      queryParams[param.name] = staticParams[param.name];
    } else if (param.schema?.default !== undefined) {
      queryParams[param.name] = param.schema.default;
    } else if (param.example !== undefined) {
      queryParams[param.name] = param.example;
    } else if (param.schema?.example !== undefined) {
      queryParams[param.name] = param.schema.example;
    } else if (param.required) {
      queryParams[param.name] = generateBasicValue(param.schema, param.name, dynamicParams);
    }
  }
  
  return queryParams;
}

/**
 * Basic request body generation (non-AI fallback)
 */
function generateRequestBodyBasic(endpoint, resolvedParams = {}) {
  const schema = endpoint.requestSchema;
  if (!schema) return {};
  
  return generateFromSchemaBasic(schema, schema.required || [], resolvedParams);
}

/**
 * Generate from schema (basic)
 */
function generateFromSchemaBasic(schema, requiredFields = [], resolvedParams = {}) {
  if (!schema) return {};
  
  if (schema.allOf) {
    const merged = {};
    let mergedRequired = [...requiredFields];
    for (const sub of schema.allOf) {
      if (sub.required) mergedRequired = [...mergedRequired, ...sub.required];
      Object.assign(merged, generateFromSchemaBasic(sub, mergedRequired, resolvedParams));
    }
    return merged;
  }
  
  if (schema.$ref) return {};
  
  if (schema.type === 'object' || schema.properties) {
    const obj = {};
    const required = schema.required || requiredFields;
    const properties = schema.properties || {};
    
    for (const [propName, propSchema] of Object.entries(properties)) {
      const isRequired = required.includes(propName);
      const isUid = isUidField(propName);
      
      if (isUid) {
        const altKey = propName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        if (resolvedParams[propName]) {
          obj[propName] = resolvedParams[propName];
        } else if (resolvedParams[altKey]) {
          obj[propName] = resolvedParams[altKey];
        } else if (isRequired) {
          obj[propName] = generateBasicValue(propSchema, propName, resolvedParams);
        }
        continue;
      }
      
      // MINIMAL: Only include REQUIRED fields for happy path
      if (isRequired) {
        obj[propName] = generateBasicValue(propSchema, propName, resolvedParams);
      }
    }
    
    return obj;
  }
  
  return generateBasicValue(schema, '', resolvedParams);
}

/**
 * Check if field is uid/id field
 */
function isUidField(propName) {
  const lower = propName.toLowerCase();
  return lower.endsWith('_uid') || lower.endsWith('_id') || lower === 'uid' || lower === 'id';
}

/**
 * Generate basic value from schema (fallback)
 */
function generateBasicValue(schema, propName = '', resolvedParams = {}) {
  if (!schema) return null;
  
  // Handle allOf - merge all sub-schemas and generate from merged
  if (schema.allOf && Array.isArray(schema.allOf)) {
    let mergedSchema = {};
    let mergedRequired = [];
    
    for (const sub of schema.allOf) {
      if (sub.type) mergedSchema.type = sub.type;
      if (sub.format) mergedSchema.format = sub.format;
      if (sub.properties) {
        mergedSchema.properties = { ...mergedSchema.properties, ...sub.properties };
      }
      if (sub.required) {
        mergedRequired = [...mergedRequired, ...sub.required];
      }
      if (sub.example !== undefined) mergedSchema.example = sub.example;
      if (sub.default !== undefined) mergedSchema.default = sub.default;
      if (sub.enum) mergedSchema.enum = sub.enum;
      if (sub.items) mergedSchema.items = sub.items;
      if (sub.minimum !== undefined) mergedSchema.minimum = sub.minimum;
      if (sub.maximum !== undefined) mergedSchema.maximum = sub.maximum;
    }
    
    if (mergedRequired.length > 0) {
      mergedSchema.required = [...new Set(mergedRequired)];
    }
    
    return generateBasicValue(mergedSchema, propName, resolvedParams);
  }
  
  // Handle oneOf/anyOf - use first option
  if (schema.oneOf && Array.isArray(schema.oneOf) && schema.oneOf.length > 0) {
    return generateBasicValue(schema.oneOf[0], propName, resolvedParams);
  }
  if (schema.anyOf && Array.isArray(schema.anyOf) && schema.anyOf.length > 0) {
    return generateBasicValue(schema.anyOf[0], propName, resolvedParams);
  }
  
  // For uid/id fields, try resolved params
  if (propName && isUidField(propName)) {
    const altKey = propName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
    if (resolvedParams[propName]) return resolvedParams[propName];
    if (resolvedParams[altKey]) return resolvedParams[altKey];
  }
  
  // Use example/default/enum if available - ALWAYS prefer these
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length > 0) return schema.enum[0];
  
  // Generate by type
  const format = schema.format;
  switch (schema.type) {
    case 'string':
      if (format === 'date-time') {
        const now = new Date();
        if (propName.includes('start') || propName.includes('from')) {
          return now.toISOString();
        } else if (propName.includes('end') || propName.includes('to')) {
          return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
        }
        return now.toISOString();
      }
      if (format === 'date') return new Date().toISOString().split('T')[0];
      if (format === 'email') return `test.${Date.now()}@example.com`;
      if (format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (format === 'uri') return 'https://example.com';
      return 'test_string';
    
    case 'number':
    case 'integer':
      return schema.minimum ?? 1;
    
    case 'boolean':
      return true;
    
    case 'array':
      // Try to use array-level example first
      if (schema.example && Array.isArray(schema.example)) {
        return schema.example;
      }
      if (schema.items) {
        // Try items example
        if (schema.items.example !== undefined) {
          return [schema.items.example];
        }
        const item = generateBasicValue(schema.items, '', resolvedParams);
        return item !== null ? [item] : [];
      }
      return [];
    
    case 'object':
      return generateFromSchemaBasic(schema, schema.required || [], resolvedParams);
    
    default:
      // If we have properties but no explicit type, treat as object
      if (schema.properties) {
        return generateFromSchemaBasic(schema, schema.required || [], resolvedParams);
      }
      return null;
  }
}

// ============== Legacy API - kept for backwards compatibility ==============

/**
 * @deprecated Use generateAllParams instead
 */
async function generateQueryParams(endpoint, staticParams = {}, dynamicParams = {}, aiConfig = {}) {
  const allResolved = { ...staticParams, ...dynamicParams };
  const result = await generateAllParams(endpoint, allResolved, aiConfig);
  return result.queryParams;
}

/**
 * @deprecated Use generateAllParams instead
 */
async function generateRequestBody(endpoint, staticParams = {}, dynamicParams = {}, aiConfig = {}) {
  const allResolved = { ...staticParams, ...dynamicParams };
  const result = await generateAllParams(endpoint, allResolved, aiConfig);
  return result.bodyParams;
}

/**
 * @deprecated Use generateParamsWithAI via generateAllParams instead
 */
async function generateParamsWithAI(endpoint, resolvedParams = {}, options = {}) {
  return generateWithAI(endpoint, resolvedParams, options);
}

module.exports = {
  initializeClient,
  // New unified API
  generateAllParams,
  // Legacy API (deprecated but maintained for compatibility)
  generateParamsWithAI,
  generateQueryParams,
  generateRequestBody,
  generateQueryParamsBasic,
  generateRequestBodyBasic
};
