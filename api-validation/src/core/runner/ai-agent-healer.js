/**
 * AI Agent Healer - Focused on getting a 2xx response
 * 
 * Model: claude-sonnet-4-20250514 (Anthropic) — multi-step agentic reasoning
 * 
 * The agent has ONE mission: get the endpoint to return a 2xx.
 * If that can't be achieved, produce a structured analysis for the doc-fixer.
 * 
 * Workflow:
 * 1. Execute deterministic prerequisites (if workflow exists)
 * 2. Handle type mismatches deterministically
 * 3. AI agent loop: extract UIDs -> resolve UIDs -> retry -> report
 * 
 * Source code exploration, doc issue analysis, and swagger fixes are
 * handled by the doc-fixer (ai-doc-fixer.js), not here.
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const workflowRepo = require('../workflows/repository');
const { groupByResource, parseResourcePath, getCrudOperation } = require('../orchestrator/resource-grouper');
const { 
  detectSwaggerTypeMismatch, 
  applyTypeConversions, 
  convertValueToType 
} = require('../validator/response-validator');
const { executePrerequisites, createRequestFunction, resolveObject } = require('../prerequisite');

let anthropicClient = null;
let openaiClient = null;

function initializeClient(apiKey, provider = 'anthropic') {
  if (!apiKey) return null;
  
  if (provider === 'openai') {
    if (!openaiClient) {
      openaiClient = new OpenAI({ 
        apiKey,
        organization: null,
        project: null
      });
    }
    return { client: openaiClient, provider: 'openai' };
  }
  
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return { client: anthropicClient, provider: 'anthropic' };
}

/**
 * Get AI config for a specific component.
 * Provider is auto-detected from the model name.
 */
function getAIConfig(config, component = 'healer') {
  const modelMap = {
    healer: config.ai?.models?.healer || 'claude-sonnet-4-20250514',
    paramGenerator: config.ai?.models?.paramGenerator || 'gpt-4o-mini',
    resolver: config.ai?.models?.resolver || 'gpt-4.1-nano'
  };
  
  const model = modelMap[component] || modelMap.healer;
  const provider = /^(claude|anthropic)/i.test(model) ? 'anthropic' : 'openai';
  const apiKey = provider === 'anthropic'
    ? config.ai?.anthropicApiKey
    : config.ai?.openaiApiKey;
  
  return { provider, apiKey, model };
}

// ─── Tool Definitions (5 tools) ─────────────────────────────────────────────

const TOOLS = [
  {
    name: "extract_required_uids",
    description: "Extract all required UID/ID fields from the endpoint's swagger schema. Call this FIRST to understand what UIDs you need to resolve before retrying the request.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "find_uid_source",
    description: "Given a UID field name (e.g., 'service_uid'), find the GET and POST endpoints that can provide a valid value. Returns the list endpoint to fetch existing entities and the create endpoint as fallback.",
    input_schema: {
      type: "object",
      properties: {
        uid_field: {
          type: "string",
          description: "The UID field name to resolve (e.g., 'service_uid', 'client_uid', 'product_uid')"
        }
      },
      required: ["uid_field"]
    }
  },
  {
    name: "execute_api",
    description: "Execute an API call. Use this to fetch existing entities (GET) or create new ones (POST) during UID resolution, and to retry the original request once all UIDs are resolved. IMPORTANT: For POST/PUT/PATCH requests, you MUST include the 'body' parameter with all required fields.",
    input_schema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method"
        },
        path: {
          type: "string",
          description: "API path (e.g., /platform/v1/services)"
        },
        params: {
          type: "object",
          description: "Query parameters to append to the URL"
        },
        body: {
          type: "object",
          description: "REQUIRED for POST/PUT/PATCH requests. Include all fields from swagger schema with resolved UIDs."
        },
        token_type: {
          type: "string",
          enum: ["staff", "directory", "client", "business", "app", "admin"],
          description: "Which token to use. Default is 'staff'. 'Internal Token' in swagger means 'admin'."
        },
        on_behalf_of: {
          type: "string",
          description: "Business UID for X-On-Behalf-Of header. ONLY use when swagger explicitly mentions this."
        },
        purpose: {
          type: "string",
          enum: ["uid_resolution", "retry_original"],
          description: "'uid_resolution' for fetching/creating entities (not counted as retry). 'retry_original' for retrying the failing endpoint (counted as retry)."
        },
        use_fallback: {
          type: "boolean",
          description: "Use the fallback API URL instead of the primary URL. Try this if you get 404/routing errors. Default is false. Note: /v1/partners/* endpoints are auto-routed to the Partners API URL with Token auth — no need to set use_fallback for those."
        },
        content_type: {
          type: "string",
          enum: ["json", "multipart"],
          description: "Content type. Use 'multipart' for file uploads. Default is 'json'."
        },
        form_fields: {
          type: "object",
          description: "For multipart requests: key-value pairs for form fields."
        },
        file_fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field_name: { type: "string" },
              file_path: { type: "string" },
              filename: { type: "string" }
            },
            required: ["field_name", "file_path"]
          },
          description: "For multipart requests: array of file attachments."
        }
      },
      required: ["method", "path", "purpose"]
    }
  },
  {
    name: "acquire_token",
    description: "Acquire a specific type of token dynamically. Actions: 'app_oauth' (get APP TOKEN via OAuth), 'client_jwt' (get CLIENT TOKEN for /client/* endpoints), 'list' (list existing tokens), 'create' (create directory/business tokens).",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["app_oauth", "client_jwt", "list", "create"],
          description: "app_oauth=get app token via OAuth, client_jwt=get client JWT, list=list tokens, create=create token"
        },
        client_id: { type: "string", description: "OAuth client_id for action='app_oauth'" },
        client_secret: { type: "string", description: "OAuth client_secret for action='app_oauth'" },
        client_uid: { type: "string", description: "Client UID for action='client_jwt'" },
        business_uid: { type: "string", description: "Business UID for action='client_jwt'" },
        app_id: { type: "string", description: "Numeric App ID for list/create" },
        app_code_name: { type: "string", description: "App code name for lookups" },
        business_id: { type: "string", description: "Business ID for token creation" },
        directory_id: { type: "string", description: "Directory ID for token operations" }
      },
      required: ["action"]
    }
  },
  {
    name: "report_result",
    description: "Call this when you're done. Use status='pass' if test passes with 2xx, status='fail' if it cannot be fixed. When failing, provide analysis_for_fixer with details about what you tried and observed.",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pass", "fail"],
          description: "pass=test passes with 2xx, fail=cannot fix"
        },
        summary: {
          type: "string",
          description: "Brief summary of what happened"
        },
        skip_suggestion: {
          type: "boolean",
          description: "Set to true if you think this test should be skipped (requires user approval)."
        },
        skip_reason: {
          type: "string",
          description: "Required when skip_suggestion=true. Explain why."
        },
        uid_resolution: {
          type: "object",
          description: "PROCEDURE for resolving each UID. Do NOT include actual UID values - only document the steps.",
          additionalProperties: {
            type: "object",
            properties: {
              source_endpoint: { type: "string", description: "GET endpoint to call first" },
              extract_from: { type: "string", description: "How to extract the UID from the response" },
              fallback_endpoint: { type: "string", description: "POST endpoint if GET returns empty" },
              create_fresh: { type: "boolean", description: "If true, always create a fresh entity" },
              create_endpoint: { type: "string", description: "POST endpoint for fresh entity" },
              create_body: { type: "object", description: "Template body for creating entity" },
              cleanup_endpoint: { type: "string", description: "DELETE endpoint for cleanup" },
              cleanup_note: { type: "string", description: "Why cleanup isn't needed/possible" }
            }
          }
        },
        unresolved_uids: {
          type: "array",
          items: { type: "string" },
          description: "List of UID fields that could not be resolved"
        },
        analysis_for_fixer: {
          type: "object",
          description: "Structured analysis to hand off to the doc-fixer agent when the test cannot pass. Include as much detail as possible.",
          properties: {
            error_patterns: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  status: { type: "integer", description: "HTTP status code" },
                  error_type: { type: "string", description: "Category: validation, auth, not_found, conflict, server_error" },
                  message: { type: "string", description: "Error message from the API" }
                }
              },
              description: "All distinct error patterns encountered during healing attempts"
            },
            attempted_approaches: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string", description: "What was tried" },
                  result: { type: "string", description: "What happened" }
                }
              },
              description: "Summary of each approach tried"
            },
            uid_state: {
              type: "object",
              description: "State of UID resolution",
              properties: {
                resolved: { type: "object", description: "UIDs that were resolved and how" },
                unresolved: { type: "array", items: { type: "string" }, description: "UIDs that could not be resolved" }
              }
            },
            tokens_tried: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", description: "Token type tried" },
                  result: { type: "string", description: "What happened with this token" }
                }
              },
              description: "Token types that were tried and their results"
            },
            last_request: {
              type: "object",
              description: "The last request attempted",
              properties: {
                method: { type: "string" },
                path: { type: "string" },
                body: { type: "object" },
                token_type: { type: "string" }
              }
            },
            last_response: {
              type: "object",
              description: "The last response received",
              properties: {
                status: { type: "integer" },
                data: { type: "object" }
              }
            },
            hints: {
              type: "string",
              description: "Free-form observations and suggestions for the fixer agent"
            }
          }
        }
      },
      required: ["status", "summary"]
    }
  }
];

// ─── UID Extraction Helpers ──────────────────────────────────────────────────

function isReferenceFieldByName(propName) {
  const lower = propName.toLowerCase();
  
  if (lower.endsWith('_uid') || lower.endsWith('_id')) return true;
  if (lower === 'uid' || lower === 'id') return true;
  
  const excludedExactNames = ['tag', 'tags', 'type', 'status', 'state', 'role', 'code', 'key', 'name', 'category'];
  if (excludedExactNames.includes(lower)) return false;
  
  const excludedSuffixPatterns = ['_type', '_status', '_state', '_name', '_code', '_key'];
  for (const suffix of excludedSuffixPatterns) {
    if (lower.endsWith(suffix)) return false;
  }
  
  const referenceFieldSuffixes = ['_role_uid', '_role_id', '_category_uid', '_category_id', '_permission_uid', '_permission_id'];
  for (const suffix of referenceFieldSuffixes) {
    if (lower.endsWith(suffix)) return true;
  }
  
  return false;
}

function isReferenceFieldByDescription(description) {
  if (!description) return { isReference: false, referenceType: null };
  
  const referencePatterns = [
    /reference\s+to\s+(\w+)/i,
    /identifier\s+of\s+(?:the\s+)?(\w+)/i,
    /must\s+be\s+(?:a\s+)?valid\s+(\w+)/i,
    /(?:unique\s+)?(?:identifier|id|uid)\s+(?:of|for)\s+(?:the\s+)?(\w+)/i,
    /one\s+of\s+the\s+(?:available\s+)?(\w+)/i,
    /existing\s+(\w+)\s+(?:uid|id|identifier)/i,
    /from\s+(?:the\s+)?(\w+)\s+(?:list|table|entity)/i,
    /belongs\s+to\s+(?:a\s+)?(\w+)/i,
    /foreign\s+key\s+to\s+(\w+)/i,
  ];
  
  for (const pattern of referencePatterns) {
    const match = description.match(pattern);
    if (match) return { isReference: true, referenceType: match[1] || null };
  }
  
  const simpleIndicators = ['must exist', 'valid identifier', 'valid uid', 'valid id', 'references', 'refers to', 'linked to', 'associated with', 'must match'];
  for (const indicator of simpleIndicators) {
    if (description.toLowerCase().includes(indicator)) return { isReference: true, referenceType: null };
  }
  
  return { isReference: false, referenceType: null };
}

function extractUidFieldsFromSchema(schema, requiredFields = [], parentPath = '') {
  const uidFields = [];
  if (!schema) return uidFields;
  
  if (schema.allOf) {
    let mergedRequired = [...requiredFields];
    for (const subSchema of schema.allOf) {
      if (subSchema.required) mergedRequired = [...mergedRequired, ...subSchema.required];
      uidFields.push(...extractUidFieldsFromSchema(subSchema, mergedRequired, parentPath));
    }
    return uidFields;
  }
  
  if (schema.properties) {
    const required = schema.required || requiredFields;
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const fullPath = parentPath ? `${parentPath}.${propName}` : propName;
      const hasExplicitRef = propSchema['x-reference-to'];
      const isEnum = propSchema.enum && propSchema.enum.length > 0;
      const isRefByName = !isEnum && isReferenceFieldByName(propName);
      const { isReference: isRefByDesc, referenceType } = isEnum 
        ? { isReference: false, referenceType: null }
        : isReferenceFieldByDescription(propSchema.description);
      const isAutoGenerated = !parentPath && (propName === 'uid' || propName === 'id');
      
      if (!isAutoGenerated && (hasExplicitRef || isRefByName || isRefByDesc)) {
        let detectionMethod = 'explicit';
        let needsDocumentation = false;
        if (!hasExplicitRef) {
          detectionMethod = isRefByName && !isRefByDesc ? 'name_pattern' : 'description';
          needsDocumentation = true;
        }
        
        uidFields.push({
          field: fullPath,
          required: required.includes(propName),
          type: propSchema.type || 'string',
          description: propSchema.description || '',
          detectionMethod,
          needsDocumentation,
          referenceTarget: hasExplicitRef || referenceType || null
        });
      }
      
      if (propSchema.type === 'object' && propSchema.properties) {
        uidFields.push(...extractUidFieldsFromSchema(propSchema, propSchema.required || [], fullPath));
      }
      if (propSchema.type === 'array' && propSchema.items?.type === 'object' && propSchema.items?.properties) {
        uidFields.push(...extractUidFieldsFromSchema(propSchema.items, propSchema.items.required || [], `${fullPath}[]`));
      }
    }
  }
  
  return uidFields;
}

function uidFieldToResourceName(uidField) {
  let resourceName = uidField.replace(/_(uid|id)$/, '');
  const specialMappings = {
    'business': 'businesses', 'staff': 'staff', 'client': 'clients',
    'service': 'services', 'product': 'products', 'package': 'packages',
    'matter_service': 'matter_services', 'appointment': 'appointments',
    'invoice': 'invoices', 'estimate': 'estimates', 'document': 'documents',
    'form': 'forms', 'payment': 'payments', 'category': 'categories',
    'tag': 'tags', 'business_role': 'business_roles',
    'staff_business_role': 'staff_business_roles',
    'permission': 'permissions', 'staff_permission': 'staff_permissions'
  };
  if (specialMappings[resourceName]) return specialMappings[resourceName];
  if (!resourceName.endsWith('s')) resourceName += 's';
  return resourceName;
}

function findUidSourceEndpoints(uidField, allEndpoints) {
  const resourceName = uidFieldToResourceName(uidField);
  console.log(`  [find_uid_source] Looking for resource: ${resourceName} (from field: ${uidField})`);
  
  const grouped = groupByResource(allEndpoints);
  
  let matchingGroup = null;
  for (const [key, group] of Object.entries(grouped)) {
    if (group.resource === resourceName || 
        group.resource === resourceName.replace(/s$/, '') ||
        key.toLowerCase().includes(resourceName.toLowerCase())) {
      matchingGroup = group;
      break;
    }
  }
  
  if (!matchingGroup) {
    // Fuzzy match
    for (const [key, group] of Object.entries(grouped)) {
      if (resourceName.includes(group.resource) || group.resource.includes(resourceName)) {
        matchingGroup = group;
        break;
      }
    }
  }
  
  if (!matchingGroup) {
    return {
      found: false,
      uid_field: uidField,
      resource_name: resourceName,
      message: `No endpoints found for resource '${resourceName}'`,
      suggestion: `Try searching for the UID manually using execute_api with a GET request to a listing endpoint.`,
      available_resources: Object.keys(grouped).slice(0, 20)
    };
  }
  
  const getEndpoint = matchingGroup.endpoints.find(e => e.method === 'GET' && !e.path.includes('{'));
  const getByIdEndpoint = matchingGroup.endpoints.find(e => e.method === 'GET' && e.path.includes('{'));
  const postEndpoint = matchingGroup.endpoints.find(e => e.method === 'POST');
  
  return {
    found: true,
    uid_field: uidField,
    resource_name: resourceName,
    list_endpoint: getEndpoint ? { method: 'GET', path: getEndpoint.path, summary: getEndpoint.summary } : null,
    get_endpoint: getByIdEndpoint ? { method: 'GET', path: getByIdEndpoint.path, summary: getByIdEndpoint.summary } : null,
    create_endpoint: postEndpoint ? { method: 'POST', path: postEndpoint.path, summary: postEndpoint.summary } : null,
    suggestion: getEndpoint 
      ? `Call GET ${getEndpoint.path} to fetch existing ${resourceName}. Extract the uid from the first result.`
      : postEndpoint
        ? `No list endpoint found. Use POST ${postEndpoint.path} to create a new ${resourceName.replace(/s$/, '')}.`
        : `No GET or POST endpoints found. The UID may need to be resolved from a different resource.`
  };
}

function extractAllUids(data) {
  const uids = {};
  const extract = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      if ((key === 'uid' || key === 'id' || key.endsWith('_uid') || key.endsWith('_id')) && 
          typeof value === 'string' && value.length > 0) {
        uids[prefix ? `${prefix}_${key}` : key] = value;
      }
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extract(value, key);
      }
    }
  };
  extract(data);
  extract(data?.data);
  return uids;
}

function formatEndpointsForContext(allEndpoints) {
  const grouped = {};
  allEndpoints.forEach(e => {
    const domain = e.domain || 'other';
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(`${e.method} ${e.path}${e.summary ? ' - ' + e.summary : ''}`);
  });
  let text = '';
  for (const [domain, endpoints] of Object.entries(grouped)) {
    text += `\n### ${domain}\n`;
    endpoints.forEach(ep => { text += `- ${ep}\n`; });
  }
  return text;
}

// ─── Tool Execution ──────────────────────────────────────────────────────────

async function executeTool(toolName, toolInput, context) {
  const { apiClient, config, resolvedParams, onProgress, endpoint, allEndpoints } = context;
  
  switch (toolName) {
    case "extract_required_uids": {
      onProgress?.({ type: 'agent_action', action: 'extract_required_uids', details: 'Analyzing swagger schema for required UIDs' });
      
      const schema = endpoint.requestSchema;
      const uidFields = extractUidFieldsFromSchema(schema, schema?.required || []);
      
      // Also check path parameters
      const pathParams = endpoint.path.match(/\{([^}]+)\}/g) || [];
      for (const param of pathParams) {
        const paramName = param.replace(/[{}]/g, '');
        if (paramName.endsWith('_uid') || paramName.endsWith('_id') || paramName === 'uid') {
          if (!uidFields.find(f => f.field === paramName)) {
            uidFields.push({ field: paramName, required: true, type: 'string', description: 'Path parameter', isPathParam: true, detectionMethod: 'path_param', needsDocumentation: false });
          }
        }
      }
      
      const resolvedUids = [];
      const unresolvedUids = [];
      for (const uidField of uidFields) {
        const fieldName = uidField.field;
        const baseName = fieldName.replace(/\[\]\./, '_').replace(/\./g, '_');
        const altFieldName = baseName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        if (resolvedParams[fieldName] || resolvedParams[baseName] || resolvedParams[altFieldName]) {
          resolvedUids.push({ ...uidField, currentValue: resolvedParams[fieldName] || resolvedParams[baseName] || resolvedParams[altFieldName] });
        } else {
          unresolvedUids.push(uidField);
        }
      }
      
      return {
        totalUidFields: uidFields.length,
        alreadyResolved: resolvedUids,
        needsResolution: unresolvedUids,
        note: unresolvedUids.length === 0 
          ? 'All required UIDs are resolved! You can retry the original request.'
          : `You need to resolve ${unresolvedUids.length} UID field(s) before retrying.`
      };
    }
    
    case "find_uid_source": {
      const { uid_field } = toolInput;
      onProgress?.({ type: 'agent_action', action: 'find_uid_source', details: `Finding endpoints for ${uid_field}` });
      return findUidSourceEndpoints(uid_field, allEndpoints);
    }
    
    case "execute_api": {
      const { method, path: apiPath, params, body, token_type = 'staff', on_behalf_of, purpose, use_fallback = false, content_type = 'json', form_fields, file_fields } = toolInput;
      
      const isRetry = purpose === 'retry_original';
      
      // GUARD: Prevent endpoint substitution on retry_original
      if (isRetry && endpoint) {
        const targetPath = endpoint.path;
        // Normalize paths for comparison (remove trailing slashes, query strings)
        const normalizedApiPath = apiPath.split('?')[0].replace(/\/+$/, '');
        const normalizedTargetPath = targetPath.split('?')[0].replace(/\/+$/, '');
        if (normalizedApiPath !== normalizedTargetPath) {
          console.warn(`[AI Healer] BLOCKED retry_original: path "${apiPath}" does not match target "${targetPath}". Endpoint substitution is forbidden.`);
          return {
            success: false,
            error: `ENDPOINT_SUBSTITUTION_BLOCKED: You tried to retry with path "${apiPath}" but the target endpoint is "${targetPath}". You MUST retry the EXACT endpoint path. Do NOT substitute one endpoint for another.`,
            blocked: true
          };
        }
      }
      
      if (isRetry) {
        context.retryCount = (context.retryCount || 0) + 1;
      }
      
      const primaryUrl = apiClient._config?.baseUrl || config.baseUrl;
      const fallbackUrl = apiClient._config?.fallbackUrl || config.fallbackUrl;
      const partnersUrl = apiClient._config?.partnersUrl || config.partnersUrl;
      
      // Partners API endpoints use dedicated URL
      const isPartnersEndpoint = apiPath && apiPath.includes('/partners/');
      let baseUrl;
      if (isPartnersEndpoint && partnersUrl) {
        baseUrl = partnersUrl;
        console.log(`  [Partners] Healer using Partners API URL for ${apiPath}: ${partnersUrl}`);
      } else {
        baseUrl = use_fallback && fallbackUrl ? fallbackUrl : primaryUrl;
      }
      
      let queryString = '';
      if (params && typeof params === 'object' && Object.keys(params).length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (value !== undefined && value !== null) searchParams.append(key, String(value));
        }
        queryString = '?' + searchParams.toString();
      }
      
      const fullPath = apiPath + queryString;
      const isMultipart = content_type === 'multipart';
      
      onProgress?.({
        type: 'agent_action', action: 'execute_api',
        details: `${method} ${fullPath}${use_fallback ? ' (fallback)' : ''}${on_behalf_of ? ` (on-behalf-of: ${on_behalf_of})` : ''}`,
        purpose, isRetry, useFallback: use_fallback
      });
      
      try {
        const token = config.tokens?.[token_type] || config.tokens?.staff;
        
        // Partners API uses HTTP Token authentication: Token token="..."
        let authHeader;
        if (isPartnersEndpoint && partnersUrl) {
          authHeader = `Token token="${token}"`;
          console.log(`  [Partners] Healer switched auth to Token format`);
        } else {
          const authPrefix = token_type === 'admin' ? 'Admin' : 'Bearer';
          authHeader = `${authPrefix} ${token}`;
        }
        const headers = { 'Authorization': authHeader };
        
        if (on_behalf_of) {
          headers['X-On-Behalf-Of'] = on_behalf_of;
        }
        
        let requestData = body;
        
        if (isMultipart) {
          const FormData = require('form-data');
          const pathModule = require('path');
          const formData = new FormData();
          if (form_fields && typeof form_fields === 'object') {
            for (const [key, value] of Object.entries(form_fields)) {
              formData.append(key, String(value));
            }
          }
          if (file_fields && Array.isArray(file_fields)) {
            for (const file of file_fields) {
              const absolutePath = pathModule.resolve(__dirname, '../../../test-files', file.file_path);
              if (fs.existsSync(absolutePath)) {
                formData.append(file.field_name, fs.createReadStream(absolutePath), file.filename || pathModule.basename(file.file_path));
              }
            }
          }
          requestData = formData;
          Object.assign(headers, formData.getHeaders());
        } else {
          headers['Content-Type'] = 'application/json';
        }
        
        const useDirectUrl = use_fallback || isPartnersEndpoint;
        const requestConfig = {
          method: method.toLowerCase(),
          url: useDirectUrl ? `${baseUrl}${fullPath}` : fullPath,
          data: requestData,
          headers
        };
        if (isMultipart) {
          requestConfig.maxContentLength = Infinity;
          requestConfig.maxBodyLength = Infinity;
        }
        
        const response = useDirectUrl 
          ? await require('axios').request(requestConfig)
          : await apiClient.request(requestConfig);
        
        const extractedUids = extractAllUids(response.data);
        if (response.data) Object.assign(resolvedParams, extractedUids);
        
        if (isRetry && response.status >= 200 && response.status < 300) {
          context.hasSuccessfulRetry = true;
          context.successfulRequest = { method, path: fullPath, body, params };
          context.lastSuccessfulResponse = response.data;
          if (use_fallback) context.usedFallbackApi = true;
        }
        
        // Track approach for analysis
        context.analysisForFixer.attempted_approaches.push({
          description: `${method} ${fullPath} with ${token_type} token${isRetry ? ' (retry)' : ' (uid_resolution)'}`,
          result: `${response.status} OK`
        });
        
        console.log(`  [AI Healer] execute_api ${method} ${fullPath} => ${response.status}${isRetry ? ' (retry)' : ''}`);
        
        return {
          success: true,
          status: response.status,
          data: response.data,
          extracted_uids: extractedUids,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          baseUrl,
          requestConfig: {
            method: method.toUpperCase(),
            url: use_fallback ? `${baseUrl}${fullPath}` : `${primaryUrl}${fullPath}`,
            headers: { ...headers, 'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json' },
            data: isMultipart ? { form_fields, file_fields, note: 'Multipart form-data request' } : body
          }
        };
      } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' 
          ? (errorData?.errors?.[0]?.message || errorData?.message || JSON.stringify(errorData))
          : (errorData || error.message);
        const isAlreadyExistsError = /already exists/i.test(errorMessage);
        const fallbackAvailable = !use_fallback && fallbackUrl;
        
        // Track error pattern for analysis
        context.analysisForFixer.error_patterns.push({
          status: status || 0,
          error_type: status === 400 || status === 422 ? 'validation' : status === 401 || status === 403 ? 'auth' : status === 404 ? 'not_found' : 'server_error',
          message: typeof errorMessage === 'string' ? errorMessage.substring(0, 500) : JSON.stringify(errorMessage).substring(0, 500)
        });
        context.analysisForFixer.attempted_approaches.push({
          description: `${method} ${fullPath} with ${token_type} token${isRetry ? ' (retry)' : ' (uid_resolution)'}`,
          result: `${status} Error: ${typeof errorMessage === 'string' ? errorMessage.substring(0, 200) : JSON.stringify(errorMessage).substring(0, 200)}`
        });
        
        // Track last request/response for fixer
        if (isRetry) {
          context.analysisForFixer.last_request = { method, path: fullPath, body, token_type };
          context.analysisForFixer.last_response = { status, data: errorData };
        }
        
        console.log(`  [AI Healer] execute_api ${method} ${apiPath} => ERROR ${status}${isRetry ? ' (retry)' : ''}`);
        
        let hint;
        if (isAlreadyExistsError && method.toUpperCase() === 'POST') {
          hint = 'ALREADY EXISTS: Entity already exists due to uniqueness constraint. Try a different combination or report PASS if documented.';
        } else if (status === 404 && fallbackAvailable) {
          hint = `Got 404. Try use_fallback=true to use fallback API URL (${fallbackUrl}).`;
        } else if ((status === 502 || status === 503) && fallbackAvailable) {
          hint = `Got ${status}. Try use_fallback=true to use fallback API URL (${fallbackUrl}).`;
        } else if (status === 404) {
          hint = 'Got 404. This usually means a required entity/UID does not exist. Resolve UIDs first.';
        } else {
          hint = 'Analyze the error and adjust your approach.';
        }
        
        return {
          success: false,
          status,
          error: errorData || error.message,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          hint,
          isAlreadyExistsError,
          errorType: isAlreadyExistsError ? 'UNIQUENESS_CONSTRAINT' : undefined
        };
      }
    }
    
    case "acquire_token": {
      const { action, client_id, client_secret, client_uid, business_uid, app_id, app_code_name, business_id, directory_id } = toolInput;
      
      onProgress?.({ type: 'agent_action', action: 'acquire_token', details: `${action} token` });
      
      const baseUrl = config.baseUrl;
      const axios = require('axios');
      
      try {
        if (action === 'app_oauth') {
          if (!client_id || !client_secret) {
            return { success: false, error: 'client_id and client_secret are required for app_oauth.' };
          }
          const response = await axios.post(`${baseUrl}/oauth/service/token`, 
            `service_id=${encodeURIComponent(client_id)}&service_secret=${encodeURIComponent(client_secret)}`,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
          );
          const appToken = response.data?.data?.token;
          if (appToken) {
            context.acquiredTokens = context.acquiredTokens || {};
            context.acquiredTokens['app'] = appToken;
            config.tokens = config.tokens || {};
            config.tokens.app = appToken;
            context.analysisForFixer.tokens_tried.push({ type: 'app (OAuth)', result: 'acquired' });
            return { success: true, action: 'app_oauth', token_acquired: true, token_preview: `${appToken.substring(0, 20)}...`, hint: 'Use token_type="app" in execute_api calls.' };
          }
          return { success: false, error: 'OAuth response did not contain a token.' };
        }
        
        if (action === 'client_jwt') {
          const staffToken = config.tokens?.staff || config.tokens?.directory;
          if (!staffToken) return { success: false, error: 'No staff or directory token configured.' };
          
          let targetBusinessUid = business_uid || config.params?.business_uid;
          if (!targetBusinessUid) return { success: false, error: 'business_uid is required.' };
          
          let clientEmail = null;
          let targetClientUid = client_uid || config.params?.client_uid;
          
          if (targetClientUid) {
            try {
              const clientResponse = await axios.get(`${baseUrl}/platform/v1/clients/${targetClientUid}`, {
                headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
              });
              clientEmail = clientResponse.data?.data?.email;
              if (!clientEmail || !clientEmail.includes('@')) clientEmail = null;
            } catch (e) { /* will search */ }
          }
          
          if (!clientEmail) {
            try {
              const clientsResponse = await axios.get(`${baseUrl}/platform/v1/clients?per_page=50`, {
                headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
              });
              const clients = clientsResponse.data?.data?.clients || [];
              const clientWithEmail = clients.find(c => c.email && c.email.includes('@'));
              if (clientWithEmail) {
                targetClientUid = clientWithEmail.uid || clientWithEmail.id;
                clientEmail = clientWithEmail.email;
              }
            } catch (e) { /* fall through */ }
          }
          
          if (!clientEmail) return { success: false, error: 'No clients with valid email found.' };
          
          const devEmail = clientEmail.endsWith('.dev') ? clientEmail : `${clientEmail}.dev`;
          let authToken = null;
          try {
            const loginLinkResponse = await axios.post(
              `${baseUrl}/client_api/v1/portals/${targetBusinessUid}/authentications/send_login_link`,
              { email: devEmail },
              { headers: { 'Content-Type': 'application/json' } }
            );
            authToken = loginLinkResponse.data?.token;
            if (!authToken) return { success: false, error: 'Login link sent but no token returned.' };
          } catch (e) {
            return { success: false, error: `Failed to send login link: ${e.response?.data?.error || e.message}` };
          }
          
          let clientJwt = null;
          try {
            const jwtResponse = await axios.post(
              `${baseUrl}/client_api/v1/portals/${targetBusinessUid}/authentications/get_jwt_token_from_authentication_token`,
              { auth_token: authToken },
              { headers: { 'Content-Type': 'application/json' } }
            );
            clientJwt = jwtResponse.data?.token;
            if (!clientJwt) return { success: false, error: 'Auth token exchange did not return JWT.' };
          } catch (e) {
            return { success: false, error: `Failed to exchange auth token: ${e.response?.data?.error || e.message}` };
          }
          
          context.acquiredTokens = context.acquiredTokens || {};
          context.acquiredTokens['client'] = clientJwt;
          config.tokens = config.tokens || {};
          config.tokens.client = clientJwt;
          context.analysisForFixer.tokens_tried.push({ type: 'client (JWT)', result: 'acquired' });
          return { success: true, action: 'client_jwt', token_acquired: true, token_preview: `${clientJwt.substring(0, 30)}...`, client_uid: targetClientUid, hint: 'Use token_type="client" in execute_api calls.' };
        }
        
        const directoryToken = config.tokens?.directory;
        if (!directoryToken) return { success: false, error: 'No directory token configured.' };
        
        if (action === 'list') {
          const params = new URLSearchParams();
          if (app_id) params.append('app_id', app_id);
          if (app_code_name) params.append('app_id', app_code_name);
          if (directory_id) params.append('directory_id', directory_id);
          
          const response = await axios.get(`${baseUrl}/platform/v1/tokens?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${directoryToken}`, 'Content-Type': 'application/json' }
          });
          const tokens = response.data?.data?.tokens || [];
          if (tokens.length > 0 && tokens[0].token) {
            context.acquiredTokens = context.acquiredTokens || {};
            context.acquiredTokens[app_id || app_code_name || 'app'] = tokens[0].token;
            config.tokens = config.tokens || {};
            config.tokens.app = tokens[0].token;
          }
          return {
            success: true, action: 'list', tokens_found: tokens.length,
            tokens: tokens.map(t => ({ token: t.token ? `${t.token.substring(0, 20)}...` : null, app_id: t.app_id })),
            hint: tokens.length > 0 ? 'Token found! Use token_type="app".' : 'No tokens found. Use app_oauth instead.'
          };
        }
        
        if (action === 'create') {
          const body = {};
          if (app_id) body.app_id = parseInt(app_id) || app_id;
          if (business_id) body.business_id = business_id;
          if (directory_id) body.directory_id = directory_id;
          if (Object.keys(body).length === 0) return { success: false, error: 'At least one identifier required.' };
          
          const response = await axios.post(`${baseUrl}/platform/v1/tokens`, body, {
            headers: { 'Authorization': `Bearer ${directoryToken}`, 'Content-Type': 'application/json' }
          });
          const newToken = response.data?.data?.token;
          if (newToken) {
            context.acquiredTokens = context.acquiredTokens || {};
            context.acquiredTokens[app_id || business_id || 'acquired'] = newToken;
            config.tokens = config.tokens || {};
            if (business_id) config.tokens.business = newToken;
          }
          return { success: true, action: 'create', token_created: !!newToken, token_preview: newToken ? `${newToken.substring(0, 20)}...` : null };
        }
        
        return { success: false, error: `Unknown action: ${action}` };
      } catch (error) {
        context.analysisForFixer.tokens_tried.push({ type: `${action}`, result: `Error: ${error.response?.status || error.message}` });
        return { success: false, status: error.response?.status, error: error.response?.data || error.message };
      }
    }
    
    case "report_result": {
      const { status, summary, skip_reason, skip_suggestion, uid_resolution, unresolved_uids, analysis_for_fixer } = toolInput;
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      const isSuccess = status === 'pass';
      const isSkipSuggestion = skip_suggestion === true;
      
      onProgress?.({ type: 'agent_action', action: 'report_result', details: isSkipSuggestion ? 'skip_suggestion' : status, summary });
      
      // Save workflow on success
      if (isSuccess) {
        const workflowData = {
          summary,
          status: 'success',
          uidResolution: uid_resolution || {},
          successfulRequest: context.successfulRequest,
          domain: endpoint.domain,
          tags: [],
          useFallbackApi: context.usedFallbackApi || false,
          swagger: endpoint.swaggerFile || null
        };
        workflowRepo.save(endpointKey, workflowData);
        context.savedWorkflow = true;
      }
      
      // Merge AI-provided analysis with accumulated context analysis
      const finalAnalysis = {
        error_patterns: [
          ...(context.analysisForFixer?.error_patterns || []),
          ...(analysis_for_fixer?.error_patterns || [])
        ],
        attempted_approaches: [
          ...(context.analysisForFixer?.attempted_approaches || []),
          ...(analysis_for_fixer?.attempted_approaches || [])
        ],
        uid_state: analysis_for_fixer?.uid_state || context.analysisForFixer?.uid_state || { resolved: {}, unresolved: unresolved_uids || [] },
        tokens_tried: [
          ...(context.analysisForFixer?.tokens_tried || []),
          ...(analysis_for_fixer?.tokens_tried || [])
        ],
        last_request: analysis_for_fixer?.last_request || context.analysisForFixer?.last_request || null,
        last_response: analysis_for_fixer?.last_response || context.analysisForFixer?.last_response || null,
        hints: analysis_for_fixer?.hints || null
      };
      
      // Deduplicate error patterns
      const seenErrors = new Set();
      finalAnalysis.error_patterns = finalAnalysis.error_patterns.filter(ep => {
        const key = `${ep.status}-${ep.error_type}-${ep.message?.substring(0, 100)}`;
        if (seenErrors.has(key)) return false;
        seenErrors.add(key);
        return true;
      });
      
      return {
        done: true,
        status,
        success: isSuccess,
        skipSuggestion: isSkipSuggestion,
        skipReason: skip_reason,
        summary,
        unresolvedUids: unresolved_uids || [],
        analysisForFixer: isSuccess ? null : finalAnalysis
      };
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── System Prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(endpoint, allEndpoints, config, resolvedParams) {
  const endpointsContext = formatEndpointsForContext(allEndpoints);
  const endpointKey = `${endpoint.method} ${endpoint.path}`;
  const existingWorkflow = workflowRepo.get(endpointKey);
  
  let workflowContext = '';
  if (existingWorkflow) {
    if (existingWorkflow.status === 'skip' || existingWorkflow.skipReason) {
      workflowContext = `
## CACHED SKIP - User Previously Approved Skip
Skip Reason: ${existingWorkflow.skipReason || existingWorkflow.summary}
Action: Call report_result immediately with status="fail", skip_suggestion=true, skip_reason="${existingWorkflow.skipReason || existingWorkflow.summary}"
`;
    } else if (existingWorkflow.uidResolution || existingWorkflow.content) {
      let details = '';
      if (existingWorkflow.uidResolution) {
        details += `\n### UID Resolution\n${JSON.stringify(existingWorkflow.uidResolution, null, 2)}`;
      }
      if (existingWorkflow.sections) {
        const exampleSection = existingWorkflow.sections['Example Request'] ||
          Object.entries(existingWorkflow.sections).find(([k]) => k.toLowerCase().includes('example'))?.[1];
        if (exampleSection) details += `\n### Example Request\n${exampleSection}`;
        const prereqSection = existingWorkflow.sections['Pre-requisites'] || existingWorkflow.sections['Prerequisites'];
        if (prereqSection) details += `\n### Prerequisites\n${prereqSection}`;
        const notesSection = existingWorkflow.sections['Notes'];
        if (notesSection) details += `\n### Notes\n${notesSection}`;
      }
      workflowContext = `\n## CACHED WORKFLOW\n${details}\n`;
    }
  }

  return `You are an API testing agent. Your ONLY goal is to get the endpoint to return a 2xx response.

## Mission
1. Resolve any required UIDs/IDs by fetching or creating entities
2. Retry the failing endpoint with correct parameters
3. If you achieve a 2xx: report PASS
4. If you cannot achieve a 2xx: report FAIL with a detailed analysis_for_fixer

Do NOT investigate source code, analyze swagger discrepancies, or report documentation issues.
Your job is purely to make the API call succeed. The doc-fixer agent handles deeper analysis.

## Token Terminology
- "Internal Token" in swagger means "admin" token (use token_type="admin")
- Staff and directory are separate token types

## Available Tokens
${Object.entries(config.tokens || {}).map(([type, token]) => {
  if (token && typeof token === 'string' && token.length > 10) return `- **${type}**: Available`;
  return null;
}).filter(Boolean).join('\n')}

## API URLs
- Primary: ${config.baseUrl}
- Fallback: ${config.fallbackUrl || 'Not configured'}
- Partners API: ${config.partnersUrl || 'Not configured'} (auto-used for /v1/partners/* endpoints with Token auth)

## Resolved Parameters
\`\`\`json
${JSON.stringify(resolvedParams, null, 2)}
\`\`\`
${workflowContext}
## CRITICAL: NEVER SUBSTITUTE ENDPOINT PATHS
You MUST only retry the EXACT endpoint path given to you (${endpoint.method} ${endpoint.path}).
- NEVER change the endpoint path to a different one, even if they seem related.
- If the endpoint returns 404 on both primary and fallback, report FAIL — do NOT search for a "real" endpoint.
- Two different paths = two different endpoints. Period.

## Strategy

1. Call extract_required_uids to see what UIDs are needed
2. For each unresolved UID: find_uid_source -> execute_api (GET to list, POST to create if needed)
3. Once UIDs are resolved: execute_api with purpose="retry_original"
4. If retry fails with 404: try use_fallback=true
5. If retry fails with 401/403: try a different token or acquire_token
6. For POST that returns "already exists": try different values or report pass (uniqueness constraint)
7. Keep request bodies MINIMAL - use only required fields with simple safe values
8. Report result when done

## Available Endpoints
${endpointsContext}
`;
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

async function runAgentHealer(options) {
  const {
    endpoint,
    result,
    resolvedParams,
    allEndpoints,
    config,
    apiClient,
    maxRetries = 30,
    onProgress
  } = options;
  
  // PHASE 0: DETERMINISTIC PREREQUISITE EXECUTION
  const existingWorkflow = workflowRepo.get(`${endpoint.method} ${endpoint.path}`);
  
  if (existingWorkflow?.prerequisites?.steps?.length > 0) {
    onProgress?.({ type: 'agent_action', action: 'prerequisite_start', details: `Executing ${existingWorkflow.prerequisites.steps.length} prerequisite step(s)` });
    
    const useFallbackApi = existingWorkflow.useFallbackApi === true;
    const baseUrl = useFallbackApi && config.fallbackUrl ? config.fallbackUrl : config.baseUrl;
    
    const makeRequest = async (requestConfig, cfg) => {
      const url = requestConfig.path;
      const method = requestConfig.method.toLowerCase();
      let fullUrl = `${baseUrl}${url}`;
      if (method === 'get' && requestConfig.params) {
        fullUrl = `${fullUrl}?${new URLSearchParams(requestConfig.params).toString()}`;
      }
      try {
        const axios = require('axios');
        const response = await axios({
          method, url: fullUrl,
          data: method !== 'get' ? requestConfig.body : undefined,
          headers: { ...requestConfig.headers, ...apiClient.defaults.headers.common },
          validateStatus: () => true
        });
        return { status: response.status, data: response.data };
      } catch (error) {
        if (error.response) return { status: error.response.status, data: error.response.data };
        throw error;
      }
    };
    
    const prereqResult = await executePrerequisites(
      existingWorkflow,
      { ...config, params: { ...config.params, ...resolvedParams } },
      makeRequest,
      { workflowRepo }
    );
    
    if (prereqResult.failed) {
      onProgress?.({ type: 'agent_complete', status: 'blocked', success: false, summary: `Prerequisite '${prereqResult.failedStep}' failed: ${prereqResult.failedReason}` });
      return {
        success: false, status: 'BLOCKED',
        reason: `Prerequisite '${prereqResult.failedStep}' failed`,
        failedStep: prereqResult.failedStep, failedReason: prereqResult.failedReason,
        suggestion: 'Fix the prerequisite endpoint before testing this endpoint',
        healingLog: [{ type: 'prerequisite_failed', step: prereqResult.failedStep, reason: prereqResult.failedReason }]
      };
    }
    
    Object.assign(resolvedParams, prereqResult.variables);
    onProgress?.({ type: 'agent_action', action: 'prerequisite_complete', details: `Variables: ${Object.keys(prereqResult.variables).join(', ')}` });
    
    // Execute workflow test request if defined
    if (existingWorkflow.testRequest) {
      const { resolve, resolveObject } = require('../prerequisite/variables');
      const axios = require('axios');
      const testReq = existingWorkflow.testRequest;
      const resolvedBody = resolveObject(testReq.body || {}, resolvedParams);
      const resolvedPath = resolve(testReq.path || endpoint.path, resolvedParams);
      const tokenType = testReq.token || 'staff';
      const authToken = config.tokens?.[tokenType];
      const useFallback = existingWorkflow.metadata?.useFallbackApi === true || existingWorkflow.metadata?.useFallbackApi === 'true';
      const testBaseUrl = useFallback ? config.fallbackUrl : config.baseUrl;
      
      if (authToken) {
        onProgress?.({ type: 'agent_action', action: 'workflow_test_request', details: `Testing with ${tokenType} token${useFallback ? ' (fallback)' : ''}` });
        
        try {
          const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';
          const testResponse = await axios.request({
            method: (testReq.method || endpoint.method).toLowerCase(),
            url: `${testBaseUrl}${resolvedPath}`,
            data: resolvedBody,
            headers: { 'Authorization': `${authPrefix} ${authToken}`, 'Content-Type': 'application/json' },
            validateStatus: () => true
          });
          
          const expectedStatus = testReq.expect?.status || [200, 201];
          const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
          
          if (expectedStatuses.includes(testResponse.status)) {
            onProgress?.({ type: 'agent_complete', status: 'success', success: true, summary: 'Workflow test request succeeded' });
            return {
              success: true, status: 'PASS',
              reason: 'Workflow test request succeeded',
              summary: `Test passed using workflow with ${tokenType} token after resolving ${Object.keys(prereqResult.variables).length} prerequisite variables${useFallback ? ' (fallback API)' : ''}`,
              followedWorkflow: true, usedFallback: useFallback,
              finalRequest: { method: testReq.method || endpoint.method, path: resolvedPath, body: resolvedBody, token: tokenType, baseUrl: testBaseUrl },
              finalResponse: { status: testResponse.status, data: testResponse.data }
            };
          }
          // Workflow test request failed - continue to AI healing
        } catch (error) {
          // Continue to AI healing
        }
      }
    }
  }
  
  // PHASE 1: DETERMINISTIC TYPE MISMATCH HANDLING
  if (result.details?.reason === 'SWAGGER_TYPE_MISMATCH') {
    const collectedTypeMismatches = [];
    const healingLog = [];
    let currentRequestBody = result.details?.request?.data || {};
    let retryCount = 0;
    const maxTypeRetries = 10;
    
    const errors = result.details?.errors || [];
    for (const err of errors) {
      if (err.field && err.swaggerType && err.apiExpectedType) {
        collectedTypeMismatches.push({ field: err.field, swaggerType: err.swaggerType, apiExpectedType: err.apiExpectedType, message: err.message || err.friendlyMessage });
      }
    }
    
    while (retryCount < maxTypeRetries) {
      retryCount++;
      const convertedBody = applyTypeConversions(currentRequestBody, collectedTypeMismatches);
      healingLog.push({ type: 'type_conversion_applied', iteration: retryCount, conversions: collectedTypeMismatches.map(m => ({ field: m.field, from: m.swaggerType, to: m.apiExpectedType })) });
      
      try {
        const tokenType = endpoint.tokenType || 'staff';
        const token = config.tokens?.[tokenType] || config.tokens?.staff;
        const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';
        const response = await apiClient.request({
          method: endpoint.method.toLowerCase(), url: endpoint.path,
          data: convertedBody,
          headers: { 'Authorization': `${authPrefix} ${token}`, 'Content-Type': 'application/json' }
        });
        
        if (response.status >= 200 && response.status < 300) {
          return {
            status: 'pass', success: true,
            summary: `Request succeeded after fixing ${collectedTypeMismatches.length} type mismatch(es).`,
            reason: 'SWAGGER_TYPE_MISMATCH',
            docFixSuggestions: collectedTypeMismatches.map(m => ({
              field: m.field,
              issue: `Type mismatch - swagger: '${m.swaggerType}', API expects: '${m.apiExpectedType}'`,
              suggested_fix: `Update swagger to change '${m.field}' from '${m.swaggerType}' to '${m.apiExpectedType}'`
            })),
            iterations: retryCount, retryCount, healingLog, resolvedParams
          };
        }
      } catch (error) {
        const responseData = error.response?.data;
        const requestSchema = endpoint.requestBody?.content?.['application/json']?.schema;
        const newMismatches = detectSwaggerTypeMismatch(responseData, convertedBody, requestSchema, true);
        
        if (newMismatches && newMismatches.length > 0) {
          const existingFields = new Set(collectedTypeMismatches.map(m => m.field));
          const uniqueNew = newMismatches.filter(m => !existingFields.has(m.field));
          if (uniqueNew.length > 0) {
            collectedTypeMismatches.push(...uniqueNew);
            currentRequestBody = convertedBody;
            continue;
          }
        }
        break;
      }
    }
    
    return {
      status: 'fail', success: false,
      summary: `Found ${collectedTypeMismatches.length} type mismatch(es): ${collectedTypeMismatches.map(m => m.field).join(', ')}`,
      reason: 'SWAGGER_TYPE_MISMATCH',
      docFixSuggestions: collectedTypeMismatches.map(m => ({
        field: m.field,
        issue: `Type mismatch - swagger: '${m.swaggerType}', API expects: '${m.apiExpectedType}'`,
        suggested_fix: `Update swagger to change '${m.field}' from '${m.swaggerType}' to '${m.apiExpectedType}'`
      })),
      iterations: retryCount, retryCount, healingLog, resolvedParams
    };
  }
  
  // PHASE 2: AI AGENT LOOP
  const aiConfig = getAIConfig(config);
  const clientInfo = initializeClient(aiConfig.apiKey, aiConfig.provider);
  if (!clientInfo) return { success: false, reason: 'No AI API key configured' };
  
  const { client, provider } = clientInfo;
  const aiModel = aiConfig.model;
  const allParams = { ...config.params, ...resolvedParams };
  const healingLog = [];
  
  const context = {
    apiClient, config, endpoint,
    resolvedParams: { ...allParams },
    allEndpoints, onProgress,
    retryCount: 0, hasSuccessfulRetry: false,
    successfulRequest: null, lastSuccessfulResponse: null,
    savedWorkflow: false, healingLog,
    usedFallbackApi: false,
    // Analysis accumulator for fixer handoff
    analysisForFixer: {
      error_patterns: [],
      attempted_approaches: [],
      uid_state: { resolved: {}, unresolved: [] },
      tokens_tried: [],
      last_request: null,
      last_response: null,
      hints: null
    }
  };
  
  const systemPrompt = buildSystemPrompt(endpoint, allEndpoints, config, allParams);
  
  const userMessage = `## Failing Test

**Endpoint**: ${endpoint.method} ${endpoint.path}
**Summary**: ${endpoint.summary || 'N/A'}

**Request that failed**:
\`\`\`json
${JSON.stringify(result.details?.request?.data || {}, null, 2)}
\`\`\`

**Error Response** (HTTP ${result.httpStatus}):
\`\`\`json
${JSON.stringify(result.details?.response?.data || {}, null, 2)}
\`\`\`

Get this endpoint to return a 2xx. If you can't, report fail with a detailed analysis_for_fixer.`;

  const messages = [{ role: "user", content: userMessage }];
  let iterations = 0;
  const maxIterations = config?.ai?.healerMaxIterations || 10;
  
  onProgress?.({ type: 'agent_start', endpoint: `${endpoint.method} ${endpoint.path}`, maxRetries });
  
  while (iterations < maxIterations) {
    iterations++;
    if (context.retryCount > maxRetries) {
      healingLog.push({ type: 'max_retries', iteration: iterations, retryCount: context.retryCount });
      break;
    }
    
    onProgress?.({ type: 'agent_thinking', iteration: iterations, retryCount: context.retryCount });
    
    // Truncate conversation history to stay within token limits
    const MAX_MESSAGE_CHARS = 600000;
    const totalChars = messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).length, 0);
    if (totalChars > MAX_MESSAGE_CHARS && messages.length > 3) {
      while (messages.length > 3) {
        const currentChars = messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)).length, 0);
        if (currentChars <= MAX_MESSAGE_CHARS) break;
        messages.splice(1, 1);
      }
    }
    
    let response, toolUseBlocks, textBlocks;
    
    if (provider === 'openai') {
      const openaiTools = TOOLS.map(tool => ({ type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.input_schema } }));
      const openaiMessages = messages.map(m => {
        if (m.role === 'assistant' && m.tool_calls) return { role: 'assistant', content: m.content, tool_calls: m.tool_calls };
        if (m.role === 'tool') return { role: 'tool', tool_call_id: m.tool_call_id, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) };
        return { role: m.role, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) };
      });
      const openaiResponse = await client.chat.completions.create({
        model: aiModel, max_completion_tokens: 4000,
        messages: [{ role: 'system', content: systemPrompt }, ...openaiMessages],
        tools: openaiTools, tool_choice: 'auto'
      });
      const choice = openaiResponse.choices[0];
      toolUseBlocks = (choice.message.tool_calls || []).map(tc => ({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || '{}') }));
      textBlocks = choice.message.content ? [{ type: 'text', text: choice.message.content }] : [];
      response = { content: [...textBlocks, ...toolUseBlocks] };
    } else {
      response = await client.messages.create({ model: aiModel, max_tokens: 4000, system: systemPrompt, tools: TOOLS, messages });
      toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      textBlocks = response.content.filter(block => block.type === 'text');
    }
    
    if (textBlocks.length > 0) {
      const thought = textBlocks.map(b => b.text).join('\n');
      healingLog.push({ type: 'thought', iteration: iterations, content: thought });
      onProgress?.({ type: 'agent_thought', iteration: iterations, thought: thought.substring(0, 200) });
    }
    
    if (toolUseBlocks.length === 0) {
      healingLog.push({ type: 'no_action', iteration: iterations, content: 'Agent stopped without reporting result' });
      break;
    }
    
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      healingLog.push({ type: 'tool_call', iteration: iterations, tool: toolUse.name, input: toolUse.input });
      onProgress?.({ type: 'agent_tool_call', iteration: iterations, tool: toolUse.name, input: toolUse.input });
      
      const toolResult = await executeTool(toolUse.name, toolUse.input, context);
      
      healingLog.push({ type: 'tool_result', iteration: iterations, tool: toolUse.name, result: toolResult });
      onProgress?.({ type: 'agent_tool_result', iteration: iterations, tool: toolUse.name, success: toolResult.success, status: toolResult.status });
      
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: JSON.stringify(toolResult) });
      
      if (toolResult.done) {
        onProgress?.({
          type: 'agent_complete', status: toolResult.status, success: toolResult.success,
          skipSuggestion: toolResult.skipSuggestion, summary: toolResult.summary,
          retryCount: context.retryCount, workflowSaved: context.savedWorkflow
        });
        
        return {
          status: toolResult.status,
          success: toolResult.success,
          skipSuggestion: toolResult.skipSuggestion,
          skipReason: toolResult.skipReason,
          summary: toolResult.summary,
          reason: toolResult.success ? null : toolResult.summary,
          savedWorkflows: context.savedWorkflow ? [{ endpoint: `${endpoint.method} ${endpoint.path}` }] : [],
          iterations, retryCount: context.retryCount,
          healingLog,
          resolvedParams: context.resolvedParams,
          unresolvedUids: toolResult.unresolvedUids || [],
          analysisForFixer: toolResult.analysisForFixer || null
        };
      }
    }
    
    // Add to conversation history
    if (provider === 'openai') {
      messages.push({
        role: "assistant", content: textBlocks.length > 0 ? textBlocks[0].text : null,
        tool_calls: toolUseBlocks.map(tb => ({ id: tb.id, type: 'function', function: { name: tb.name, arguments: JSON.stringify(tb.input) } }))
      });
      for (const result of toolResults) {
        messages.push({ role: "tool", tool_call_id: result.tool_use_id, content: typeof result.content === 'string' ? result.content : JSON.stringify(result.content) });
      }
    } else {
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }
  }
  
  // Max iterations reached
  onProgress?.({
    type: 'agent_complete', success: false, status: 'EXHAUSTED_RETRIES',
    summary: `Reached maximum ${maxIterations} iterations`,
    retryCount: context.retryCount
  });
  
  return {
    success: false, status: 'EXHAUSTED_RETRIES',
    reason: `Reached maximum ${maxIterations} iterations without resolution`,
    suggestion: 'The AI healer exhausted available approaches. The doc-fixer will investigate further.',
    savedWorkflows: [],
    iterations, retryCount: context.retryCount,
    healingLog,
    resolvedParams: context.resolvedParams,
    analysisForFixer: context.analysisForFixer
  };
}

// ─── Utility Functions (used by validate.js) ─────────────────────────────────

function isUnrecoverableError(result) {
  const httpStatus = result.httpStatus;
  const reason = result.details?.reason;
  
  if ([502, 503, 504].includes(httpStatus)) return true;
  if (reason === 'NETWORK_ERROR' || reason === 'TIMEOUT') return true;
  
  if (reason === 'ENDPOINT_NOT_FOUND') {
    if (result.details?.routingInfo) return true;
  }
  
  if (httpStatus === 404) {
    const responseData = result.details?.response?.data;
    const message = responseData?.message?.toLowerCase() || '';
    if (message.includes('route not found') || message.includes('cannot post') ||
        message.includes('cannot get') || message.includes('cannot put') ||
        message.includes('cannot delete') || message.includes('not implemented') ||
        message.includes('method not allowed')) return true;
    if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE')) return true;
  }
  
  return false;
}

function lookupWorkflow(endpoint) {
  return workflowRepo.get(endpoint);
}

module.exports = {
  runAgentHealer,
  isUnrecoverableError,
  lookupWorkflow,
  extractUidFieldsFromSchema,
  findUidSourceEndpoints,
  getAIConfig,
  TOOLS
};
