/**
 * AI Parameter Generator
 * Uses AI to intelligently fill request parameters based on documentation
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
 * Generate request parameters using AI
 * @param {Object} endpoint - Endpoint object with path, method, parameters, requestSchema
 * @param {Object} resolvedParams - Already resolved parameters (business_uid, client_uid, etc.)
 * @param {Object} options - Options including apiKey
 * @returns {Promise<Object>} { queryParams, bodyParams }
 */
async function generateParamsWithAI(endpoint, resolvedParams = {}, options = {}) {
  // Initialize client if needed
  if (!anthropicClient && options.apiKey) {
    initializeClient(options.apiKey);
  }
  
  if (!anthropicClient) {
    console.log('[AI Param Gen] No API key - falling back to basic generation');
    return null;
  }
  
  try {
    // Build context for AI
    const context = buildAIContext(endpoint, resolvedParams);
    
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: buildPrompt(context)
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
 * Build context object for AI
 */
function buildAIContext(endpoint, resolvedParams) {
  const requestSchema = endpoint.requestSchema;
  
  return {
    method: endpoint.method,
    path: endpoint.path,
    summary: endpoint.summary || '',
    description: endpoint.description || '',
    queryParameters: formatQueryParams(endpoint.parameters?.query || []),
    requestBodySchema: requestSchema ? formatSchema(requestSchema) : null,
    // Include root-level example if available - this is critical for POST/PUT requests
    requestBodyExample: requestSchema?.example || null,
    resolvedParams: resolvedParams,
    currentDate: new Date().toISOString()
  };
}

/**
 * Format query parameters for AI context
 */
function formatQueryParams(params) {
  return params.map(p => ({
    name: p.name,
    required: p.required || false,
    description: p.description || '',
    type: p.schema?.type || 'string',
    format: p.schema?.format || null,
    enum: p.schema?.enum || null,
    default: p.schema?.default,
    example: p.example || p.schema?.example,
    minimum: p.schema?.minimum,
    maximum: p.schema?.maximum
  }));
}

/**
 * Format schema for AI context (simplified view)
 */
function formatSchema(schema, depth = 0) {
  if (depth > 3) return { type: 'object', note: '(nested object)' };
  
  if (schema.allOf) {
    const merged = {};
    for (const sub of schema.allOf) {
      Object.assign(merged, formatSchema(sub, depth + 1));
    }
    return merged;
  }
  
  if (schema.oneOf || schema.anyOf) {
    const options = schema.oneOf || schema.anyOf;
    return {
      oneOf: options.map(o => formatSchema(o, depth + 1))
    };
  }
  
  if (schema.type === 'object' || schema.properties) {
    const result = {
      type: 'object',
      required: schema.required || [],
      properties: {}
    };
    
    for (const [key, prop] of Object.entries(schema.properties || {})) {
      result.properties[key] = {
        type: prop.type,
        format: prop.format,
        description: prop.description,
        enum: prop.enum,
        default: prop.default,
        example: prop.example,
        minimum: prop.minimum,
        maximum: prop.maximum
      };
      
      if (prop.type === 'object' || prop.properties) {
        result.properties[key] = formatSchema(prop, depth + 1);
      }
      if (prop.type === 'array' && prop.items) {
        result.properties[key].items = formatSchema(prop.items, depth + 1);
      }
    }
    
    return result;
  }
  
  return {
    type: schema.type,
    format: schema.format,
    description: schema.description,
    enum: schema.enum,
    default: schema.default,
    example: schema.example,
    minimum: schema.minimum,
    maximum: schema.maximum
  };
}

/**
 * Build the AI prompt
 */
function buildPrompt(context) {
  return `You are an API testing assistant. Generate valid parameter values for an API endpoint based on its documentation.

## Endpoint Information
- **Method**: ${context.method}
- **Path**: ${context.path}
- **Summary**: ${context.summary}
- **Description**: ${context.description}
- **Current Date/Time**: ${context.currentDate}

## Available Resolved Parameters
These are real values from the test system that should be used for uid/id fields:
\`\`\`json
${JSON.stringify(context.resolvedParams, null, 2)}
\`\`\`

## Query Parameters Schema
\`\`\`json
${JSON.stringify(context.queryParameters, null, 2)}
\`\`\`

${context.requestBodySchema ? `## Request Body Schema
\`\`\`json
${JSON.stringify(context.requestBodySchema, null, 2)}
\`\`\`` : ''}

${context.requestBodyExample ? `## REQUEST BODY EXAMPLE (USE THIS!)
This is a complete, valid example from the documentation. **USE THIS EXACT STRUCTURE** and only modify uid/id fields with resolved params:
\`\`\`json
${JSON.stringify(context.requestBodyExample, null, 2)}
\`\`\`` : ''}

## CRITICAL INSTRUCTIONS - READ CAREFULLY

1. **FOR POST/PUT/PATCH - USE THE REQUEST BODY EXAMPLE**: If a "REQUEST BODY EXAMPLE" section is provided above, USE IT AS YOUR BASE. Copy the entire structure and only replace uid/id fields with values from resolved parameters. Do NOT modify other values.

2. **USE EXAMPLES EXACTLY AS PROVIDED** - If a parameter has an "example" value in the schema, USE THAT EXACT VALUE. Do NOT invent similar-looking values. Examples are real, valid values from the production system.

3. **For array parameters with an example**: If the example is a single value like "payments.invoices.export", use an array containing ONLY that value: ["payments.invoices.export"]. Do NOT generate additional similar-looking values.

4. **For uid/id fields**: Use matching values from resolved parameters if available. Otherwise, use the example value if provided.

5. **For date/time fields**: Use appropriate values relative to the current date (${context.currentDate}).

6. **For enums**: Select the first enum value unless the context suggests otherwise.

7. **For strings with formats** (email, uri, etc.): Generate valid examples only if no example is provided.

8. **Do NOT invent reference data**: If a field requires system-specific identifiers (like permission keys, feature names, etc.) and no example is provided, use a generic placeholder like "test" or skip the field if optional.

9. **Pagination**: Use page=1 and per_page=10 unless specified otherwise.

10. **Omit read-only fields from POST requests**: Do not include uid, created_at, updated_at in request bodies for POST - these are server-generated.

11. **NEVER INVENT uid/id VALUES**: For any field ending in _uid or _id (like client_uid, staff_uid, business_uid), ONLY use values from the "Available Resolved Parameters" section above. If no matching value exists in resolved parameters, set the field to null. Do NOT generate fake UIDs like "d290f1ee-6c54-4b01-90e6-d701748f0851" or similar.

## Response Format
Return ONLY a JSON object with this structure (no explanation):
\`\`\`json
{
  "queryParams": {
    "param_name": "value"
  },
  "bodyParams": {
    "field_name": "value"
  }
}
\`\`\`

If there are no query params needed, use empty object for queryParams.
If there's no request body needed, use empty object for bodyParams.
`;
}

/**
 * Generate query parameters with AI fallback to basic generation
 * @param {Object} endpoint - Endpoint object
 * @param {Object} staticParams - Static params from config
 * @param {Object} dynamicParams - Dynamically resolved params
 * @param {Object} aiConfig - AI configuration { enabled, apiKey }
 * @returns {Promise<Object>} Query parameters object
 */
async function generateQueryParams(endpoint, staticParams = {}, dynamicParams = {}, aiConfig = {}) {
  const allResolved = { ...staticParams, ...dynamicParams };
  
  // Try AI generation if enabled
  if (aiConfig.enabled && aiConfig.apiKey) {
    const aiResult = await generateParamsWithAI(endpoint, allResolved, { apiKey: aiConfig.apiKey });
    if (aiResult?.queryParams && Object.keys(aiResult.queryParams).length > 0) {
      console.log('[AI Param Gen] Using AI-generated query params');
      return aiResult.queryParams;
    }
  }
  
  // Fallback to basic generation
  return generateQueryParamsBasic(endpoint, staticParams, dynamicParams);
}

/**
 * Generate request body with schema-first approach
 * 
 * IMPORTANT: We prefer schema-based generation over AI because:
 * 1. Schema has the exact structure (allOf, object types, nested properties)
 * 2. AI doesn't see the full schema and generates generic/incorrect formats
 * 
 * @param {Object} endpoint - Endpoint object
 * @param {Object} staticParams - Static params from config
 * @param {Object} dynamicParams - Dynamically resolved params
 * @param {Object} aiConfig - AI configuration { enabled, apiKey }
 * @returns {Promise<Object>} Request body object
 */
async function generateRequestBody(endpoint, staticParams = {}, dynamicParams = {}, aiConfig = {}) {
  const allResolved = { ...staticParams, ...dynamicParams };
  
  // ALWAYS prefer schema-based generation when schema is available
  // This ensures correct handling of allOf, object types, nested structures
  const hasSchema = endpoint.requestSchema && 
    (endpoint.requestSchema.properties || 
     endpoint.requestSchema.allOf || 
     endpoint.requestSchema.type === 'object');
  
  if (hasSchema) {
    console.log('[AI Param Gen] Using schema-based body generation (schema available)');
    return generateRequestBodyBasic(endpoint, allResolved);
  }
  
  // Only use AI when no schema is available
  if (aiConfig.enabled && aiConfig.apiKey) {
    console.log('[AI Param Gen] No schema available, trying AI generation');
    const aiResult = await generateParamsWithAI(endpoint, allResolved, { apiKey: aiConfig.apiKey });
    if (aiResult?.bodyParams && Object.keys(aiResult.bodyParams).length > 0) {
      console.log('[AI Param Gen] Using AI-generated body params');
      return aiResult.bodyParams;
    }
  }
  
  // Final fallback to basic generation
  return generateRequestBodyBasic(endpoint, allResolved);
}

// ============== Basic (Non-AI) Generation Functions ==============

/**
 * Basic query param generation (non-AI fallback)
 */
function generateQueryParamsBasic(endpoint, staticParams = {}, dynamicParams = {}) {
  const queryParams = {};
  const endpointQueryParams = endpoint.parameters?.query || [];
  
  for (const param of endpointQueryParams) {
    // Priority: dynamic > static > default > example > generate
    if (dynamicParams[param.name]) {
      queryParams[param.name] = dynamicParams[param.name];
    } else if (staticParams[param.name]) {
      queryParams[param.name] = staticParams[param.name];
    } else if (param.schema?.default !== undefined) {
      queryParams[param.name] = param.schema.default;
    } else if (param.example !== undefined) {
      queryParams[param.name] = param.example;
    } else if (param.required) {
      queryParams[param.name] = generateBasicValue(param.schema, param.name);
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
          obj[propName] = generateBasicValue(propSchema, propName);
        }
        continue;
      }
      
      obj[propName] = generateBasicValue(propSchema, propName, resolvedParams);
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
 * Generate basic value from schema
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
    
    // Recurse with merged schema
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
  
  // Use example/default/enum if available
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
      if (format === 'email') return 'test@example.com';
      if (format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      if (format === 'uri') return 'https://example.com';
      return 'test_string';
    
    case 'number':
    case 'integer':
      return schema.minimum ?? 1;
    
    case 'boolean':
      return true;
    
    case 'array':
      if (schema.items) {
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

module.exports = {
  initializeClient,
  generateParamsWithAI,
  generateQueryParams,
  generateRequestBody,
  generateQueryParamsBasic,
  generateRequestBodyBasic
};
