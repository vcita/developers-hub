/**
 * AI Agent Healer - Deterministic UID Resolution with Source Code Exploration
 * 
 * The agent follows a strict workflow:
 * 1. Extract all required UIDs from swagger schema
 * 2. For each UID, find GET endpoint to fetch existing entity
 * 3. If empty, find POST endpoint to create entity
 * 4. Only after ALL UIDs are resolved, retry the original request
 * 5. If structure is unclear, explore source code to understand expected format
 * 6. Document findings in workflow AND as doc_issues for documentation improvement
 * 
 * UID resolution steps are NOT counted as retries.
 * Only the actual endpoint retries count toward max iterations.
 */

const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workflowRepo = require('../workflows/repository');
const { groupByResource, parseResourcePath, getCrudOperation } = require('../orchestrator/resource-grouper');

let anthropicClient = null;

// Repository paths for source code access
const GITHUB_BASE = process.env.GITHUB_BASE_PATH || '/Users/ram.almog/Documents/GitHub';
const REPO_PATHS = {
  core: process.env.CORE_REPO_PATH || `${GITHUB_BASE}/core`,
  vcita: process.env.VCITA_REPO_PATH || `${GITHUB_BASE}/vcita`,
  apigw: `${GITHUB_BASE}/apigw`,
  subscriptionsmng: `${GITHUB_BASE}/subscriptionsmng`,
  notificationscenter: `${GITHUB_BASE}/notificationscenter`,
  voicecalls: `${GITHUB_BASE}/voicecalls`,
  availability: `${GITHUB_BASE}/availability`,
  resources: `${GITHUB_BASE}/resources`,
  permissionsmanager: `${GITHUB_BASE}/permissionsmanager`,
  aiplatform: `${GITHUB_BASE}/aiplatform`,
  phonenumbersmanager: `${GITHUB_BASE}/phonenumbersmanager`,
  'communication-gw': `${GITHUB_BASE}/communication-gw`
};

// API Gateway routing configuration - maps path prefixes to services
const APIGW_ROUTING = {
  '/v3/license/': 'subscriptionsmng',
  '/business/subscriptionsmng/': 'subscriptionsmng',
  '/v3/communication/voice_calls': 'voicecalls',
  '/v3/communication/voice_call_quotas': 'voicecalls',
  '/v3/communication/voice_call_recordings': 'voicecalls',
  '/v3/communication/voice_call_settings': 'voicecalls',
  '/v3/communication/available_phone_numbers': 'phonenumbersmanager',
  '/v3/communication/business_phone_numbers': 'phonenumbersmanager',
  '/v3/access_control/': 'permissionsmanager',
  '/access_control/': 'permissionsmanager',
  '/v3/ai/': 'aiplatform',
  '/business/notificationscenter/': 'notificationscenter',
  '/client/notificationscenter/': 'notificationscenter',
  '/directory/notificationscenter/': 'notificationscenter',
  '/v3/communication/staff_notifications': 'notificationscenter',
  '/v3/communication/notification_templates': 'notificationscenter',
  '/v3/scheduling/business_availabilities': 'availability',
  '/v3/scheduling/availability_slots': 'availability',
  '/v3/scheduling/resource_types': 'resources',
  '/v3/scheduling/resources': 'resources',
  '/v3/apps/widgets': 'app-widgets-manager',
  '/v3/apps/staff_widgets_boards': 'app-widgets-manager',
  '/business/communication/': 'communication-gw',
  '/platform/v1/': 'core',
  '/business/scheduling/': 'core',
  '/business/staffs/': 'core',
  '/business/clients/': 'core',
  '/v3/staff': 'core',
  '/v3/business_administration': 'core'
};

function initializeClient(apiKey) {
  if (!apiKey) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Define tools for deterministic UID resolution with source code exploration
 */
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
    description: "Execute an API call. Use this to fetch existing entities (GET) or create new ones (POST) during UID resolution, and to retry the original request once all UIDs are resolved. If primary URL returns 404 or routing error, try with use_fallback=true.",
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
        body: {
          type: "object",
          description: "Request body for POST/PUT/PATCH requests"
        },
        token_type: {
          type: "string",
          enum: ["staff", "directory", "client", "business", "app"],
          description: "Which token to use. Default is 'staff'."
        },
        purpose: {
          type: "string",
          enum: ["uid_resolution", "retry_original"],
          description: "Purpose of this API call. 'uid_resolution' for fetching/creating entities to get UIDs (not counted as retry). 'retry_original' for retrying the failing endpoint (counted as retry)."
        },
        use_fallback: {
          type: "boolean",
          description: "Use the fallback API URL instead of the primary URL. Try this if you get 404/routing errors on the primary URL. Default is false."
        }
      },
      required: ["method", "path", "purpose"]
    }
  },
  {
    name: "find_service_for_endpoint",
    description: "Find which microservice handles a given API endpoint by checking the API gateway routing configuration. CALL THIS FIRST before searching source code to know which repository to search in!",
    input_schema: {
      type: "object",
      properties: {
        endpoint_path: {
          type: "string",
          description: "The API path to look up (e.g., '/v3/license/business_carts', '/v3/communication/voice_calls')"
        }
      },
      required: ["endpoint_path"]
    }
  },
  {
    name: "search_source_code",
    description: "Search for code patterns in a repository. FIRST call find_service_for_endpoint to know which repository handles your endpoint! Use this when API errors are unclear, you need to understand validation rules, or the expected request format differs from documentation.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita", "apigw", "subscriptionsmng", "notificationscenter", "voicecalls", "availability", "resources", "permissionsmanager", "aiplatform", "phonenumbersmanager", "communication-gw"],
          description: "Which repository to search in. Use find_service_for_endpoint first to determine the correct repository!"
        },
        search_pattern: {
          type: "string",
          description: "Text or regex pattern to search for (e.g., 'def create', 'validates :name', 'packages_api', controller names)"
        },
        file_glob: {
          type: "string",
          description: "Optional file pattern to filter (e.g., '*.rb', '*controller*', '*.ts')"
        }
      },
      required: ["repository", "search_pattern"]
    }
  },
  {
    name: "read_source_file",
    description: "Read a specific source file from a repository to understand implementation details. Use this after search_source_code finds relevant files.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita", "apigw", "subscriptionsmng", "notificationscenter", "voicecalls", "availability", "resources", "permissionsmanager", "aiplatform", "phonenumbersmanager", "communication-gw"],
          description: "Which repository to read from"
        },
        file_path: {
          type: "string",
          description: "Path to the file within the repository (e.g., 'modules/payments/app/components/payments/packages_api.rb', 'src/subscriptionsmng/controllers/v3/carts/carts.controller.ts')"
        },
        start_line: {
          type: "integer",
          description: "Optional start line (for large files)"
        },
        end_line: {
          type: "integer",
          description: "Optional end line (for large files)"
        }
      },
      required: ["repository", "file_path"]
    }
  },
  {
    name: "report_result",
    description: "Call this when you're done. Use status='pass' if test passes, status='skip' if the endpoint works correctly but cannot be tested due to business constraints (e.g., resource already exists, one-time operation), or status='fail' if it cannot be fixed. ALWAYS include doc_issues with findings!",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pass", "skip", "fail"],
          description: "pass=test passes with 2xx, skip=endpoint works correctly but cannot test (business constraint like 'already exists'), fail=cannot fix"
        },
        summary: {
          type: "string",
          description: "Brief summary of what happened"
        },
        skip_reason: {
          type: "string",
          description: "Required when status='skip'. Explain why the test should be skipped (e.g., 'Staff already has a business role assigned - each staff can only have one')"
        },
        uid_resolution: {
          type: "object",
          description: "How each required UID was resolved. Keys are UID field names, values describe the resolution method.",
          additionalProperties: {
            type: "object",
            properties: {
              source_endpoint: {
                type: "string",
                description: "GET endpoint used to fetch the UID"
              },
              fallback_endpoint: {
                type: "string",
                description: "POST endpoint used to create entity if GET was empty"
              },
              used_fallback: {
                type: "boolean",
                description: "Whether we had to create a new entity"
              },
              resolved_value: {
                type: "string",
                description: "The actual UID value obtained"
              }
            }
          }
        },
        unresolved_uids: {
          type: "array",
          items: { type: "string" },
          description: "List of UID fields that could not be resolved (if any)"
        },
        doc_issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Which field/parameter has the issue" },
              issue: { type: "string", description: "What's wrong or unclear in the documentation" },
              suggested_fix: { type: "string", description: "How to fix the documentation based on source code findings" },
              severity: { type: "string", enum: ["critical", "major", "minor"], description: "critical=blocks usage, major=causes confusion, minor=improvement" },
              source_code_reference: { type: "string", description: "Optional: file/line in source code that clarifies the correct behavior" }
            }
          },
          description: "Documentation issues discovered - include if you found discrepancies between docs and actual behavior"
        }
        // NOTE: fixed_issues removed - workflows no longer store doc issues
      },
      required: ["status", "summary"]
    }
  }
];

/**
 * Extract all UID/ID fields from a schema
 * @param {Object} schema - JSON schema
 * @param {string[]} requiredFields - Required field names
 * @returns {Object[]} Array of { field, required, type }
 */
function extractUidFieldsFromSchema(schema, requiredFields = []) {
  const uidFields = [];
  
  if (!schema) return uidFields;
  
  // Handle allOf
  if (schema.allOf) {
    let mergedRequired = [...requiredFields];
    for (const subSchema of schema.allOf) {
      if (subSchema.required) {
        mergedRequired = [...mergedRequired, ...subSchema.required];
      }
      uidFields.push(...extractUidFieldsFromSchema(subSchema, mergedRequired));
    }
    return uidFields;
  }
  
  // Handle object with properties
  if (schema.properties) {
    const required = schema.required || requiredFields;
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const isUidField = propName.endsWith('_uid') || propName.endsWith('_id') || 
                        propName === 'uid' || propName === 'id';
      
      if (isUidField) {
        // Skip read-only fields like 'uid' or 'id' that are auto-generated
        if (propName === 'uid' || propName === 'id') {
          // These are usually the entity's own ID, not a reference
          continue;
        }
        
        uidFields.push({
          field: propName,
          required: required.includes(propName),
          type: propSchema.type || 'string',
          description: propSchema.description || ''
        });
      }
      
      // Recursively check nested objects
      if (propSchema.type === 'object' && propSchema.properties) {
        const nested = extractUidFieldsFromSchema(propSchema, propSchema.required || []);
        uidFields.push(...nested.map(f => ({
          ...f,
          field: `${propName}.${f.field}`
        })));
      }
    }
  }
  
  return uidFields;
}

/**
 * Derive the resource name from a UID field name
 * e.g., 'service_uid' -> 'services', 'client_id' -> 'clients'
 */
function uidFieldToResourceName(uidField) {
  // Remove _uid or _id suffix
  let resourceName = uidField.replace(/_(uid|id)$/, '');
  
  // Handle special cases
  const specialMappings = {
    'business': 'businesses',
    'staff': 'staff',  // staff is both singular and plural in our API
    'client': 'clients',
    'service': 'services',
    'product': 'products',
    'package': 'packages',
    'matter_service': 'matter_services',
    'appointment': 'appointments',
    'invoice': 'invoices',
    'estimate': 'estimates',
    'document': 'documents',
    'form': 'forms',
    'payment': 'payments',
    'category': 'categories',
    'tag': 'tags'
  };
  
  if (specialMappings[resourceName]) {
    return specialMappings[resourceName];
  }
  
  // Default: just add 's' for pluralization
  if (!resourceName.endsWith('s')) {
    resourceName += 's';
  }
  
  return resourceName;
}

/**
 * Find endpoints that can provide a UID value
 * @param {string} uidField - UID field name (e.g., 'service_uid')
 * @param {Object[]} allEndpoints - All available endpoints
 * @returns {Object} { getEndpoint, postEndpoint, resourceName }
 */
function findUidSourceEndpoints(uidField, allEndpoints) {
  const resourceName = uidFieldToResourceName(uidField);
  
  // Group endpoints by resource
  const grouped = groupByResource(allEndpoints);
  
  // Find matching resource group
  let matchingGroup = null;
  for (const [key, group] of Object.entries(grouped)) {
    if (group.resource === resourceName || 
        group.resource === resourceName.replace(/s$/, '') ||
        key.toLowerCase().includes(resourceName.toLowerCase())) {
      matchingGroup = group;
      break;
    }
  }
  
  // If no direct match, try fuzzy matching
  if (!matchingGroup) {
    for (const [key, group] of Object.entries(grouped)) {
      const singularResource = resourceName.replace(/s$/, '');
      if (group.resource.includes(singularResource) || 
          singularResource.includes(group.resource)) {
        matchingGroup = group;
        break;
      }
    }
  }
  
  if (!matchingGroup) {
    return {
      found: false,
      resourceName,
      message: `No endpoints found for resource '${resourceName}'`
    };
  }
  
  // Find GET (list) and POST (create) endpoints
  let getEndpoint = null;
  let postEndpoint = null;
  
  for (const ep of matchingGroup.endpoints) {
    const operation = getCrudOperation(ep);
    
    if (operation === 'list' && !getEndpoint) {
      getEndpoint = `${ep.method} ${ep.path}`;
    }
    if (operation === 'create' && !postEndpoint) {
      postEndpoint = `${ep.method} ${ep.path}`;
    }
  }
  
  return {
    found: true,
    resourceName,
    getEndpoint,
    postEndpoint,
    basePath: matchingGroup.basePath
  };
}

/**
 * Extract all UIDs from a response
 */
function extractAllUids(data) {
  const uids = {};
  
  const extract = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const [key, value] of Object.entries(obj)) {
      if ((key === 'uid' || key === 'id' || key.endsWith('_uid') || key.endsWith('_id')) && 
          typeof value === 'string' && value.length > 0) {
        const uidKey = prefix ? `${prefix}_${key}` : key;
        uids[uidKey] = value;
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

/**
 * Execute a tool call
 */
async function executeTool(toolName, toolInput, context) {
  const { apiClient, config, resolvedParams, onProgress, endpoint, allEndpoints } = context;
  
  switch (toolName) {
    case "extract_required_uids": {
      onProgress?.({
        type: 'agent_action',
        action: 'extract_required_uids',
        details: 'Analyzing swagger schema for required UIDs'
      });
      
      const schema = endpoint.requestSchema;
      const uidFields = extractUidFieldsFromSchema(schema, schema?.required || []);
      
      // Also check path parameters
      const pathParams = endpoint.path.match(/\{([^}]+)\}/g) || [];
      for (const param of pathParams) {
        const paramName = param.replace(/[{}]/g, '');
        if (paramName.endsWith('_uid') || paramName.endsWith('_id') || paramName === 'uid') {
          const existing = uidFields.find(f => f.field === paramName);
          if (!existing) {
            uidFields.push({
              field: paramName,
              required: true,
              type: 'string',
              description: 'Path parameter',
              isPathParam: true
            });
          }
        }
      }
      
      // Check which UIDs we already have resolved
      const resolvedUids = [];
      const unresolvedUids = [];
      
      for (const uidField of uidFields) {
        const fieldName = uidField.field;
        const altFieldName = fieldName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        
        if (resolvedParams[fieldName] || resolvedParams[altFieldName]) {
          resolvedUids.push({
            ...uidField,
            currentValue: resolvedParams[fieldName] || resolvedParams[altFieldName]
          });
        } else {
          unresolvedUids.push(uidField);
        }
      }
      
      return {
        totalUidFields: uidFields.length,
        alreadyResolved: resolvedUids,
        needsResolution: unresolvedUids,
        note: unresolvedUids.length === 0 
          ? 'All required UIDs are already resolved! You can retry the original request.'
          : `You need to resolve ${unresolvedUids.length} UID(s) before retrying.`
      };
    }
    
    case "find_uid_source": {
      const { uid_field } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'find_uid_source',
        details: `Finding endpoints for ${uid_field}`
      });
      
      const result = findUidSourceEndpoints(uid_field, allEndpoints);
      
      return result;
    }
    
    case "find_service_for_endpoint": {
      const { endpoint_path } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'find_service_for_endpoint',
        details: `Looking up service for: ${endpoint_path}`
      });
      
      // Find the matching service by checking path prefixes
      let matchedService = null;
      let matchedPrefix = null;
      let matchLength = 0;
      
      for (const [prefix, service] of Object.entries(APIGW_ROUTING)) {
        if (endpoint_path.startsWith(prefix) && prefix.length > matchLength) {
          matchedService = service;
          matchedPrefix = prefix;
          matchLength = prefix.length;
        }
      }
      
      if (matchedService) {
        const repoExists = REPO_PATHS[matchedService] && fs.existsSync(REPO_PATHS[matchedService]);
        return {
          found: true,
          service: matchedService,
          matched_prefix: matchedPrefix,
          repository: matchedService,
          repository_path: REPO_PATHS[matchedService] || 'Not configured',
          repository_available: repoExists,
          tip: repoExists 
            ? `Use search_source_code with repository="${matchedService}" to find the implementation.`
            : `Repository ${matchedService} is not available locally. Try searching in 'core' as a fallback.`,
          search_suggestions: [
            `Search for controller: search_source_code(repository="${matchedService}", search_pattern="${endpoint_path.split('/').pop()}")`,
            `Search for route definition: search_source_code(repository="${matchedService}", search_pattern="${endpoint_path}")`
          ]
        };
      }
      
      // Default to core if no specific mapping found
      return {
        found: false,
        service: 'core',
        repository: 'core',
        note: `No specific routing found for ${endpoint_path}. Defaulting to 'core' repository.`,
        tip: 'Most /platform/v1/* and /business/* endpoints are served by core.',
        all_known_routes: Object.keys(APIGW_ROUTING)
      };
    }
    
    case "execute_api": {
      const { method, path: apiPath, body, token_type = 'staff', purpose, use_fallback = false } = toolInput;
      
      // Track whether this counts as a retry
      const isRetry = purpose === 'retry_original';
      if (isRetry) {
        context.retryCount = (context.retryCount || 0) + 1;
      }
      
      // Determine base URL - use fallback if requested and available
      const primaryUrl = apiClient._config?.baseUrl || config.baseUrl;
      const fallbackUrl = apiClient._config?.fallbackUrl || config.fallbackUrl;
      const baseUrl = use_fallback && fallbackUrl ? fallbackUrl : primaryUrl;
      
      onProgress?.({
        type: 'agent_action',
        action: 'execute_api',
        details: `${method} ${apiPath}${use_fallback ? ' (fallback)' : ''}`,
        purpose,
        isRetry,
        useFallback: use_fallback
      });
      
      try {
        const token = config.tokens?.[token_type] || config.tokens?.staff;
        
        // Build full URL if using fallback
        const requestConfig = {
          method: method.toLowerCase(),
          url: use_fallback ? `${baseUrl}${apiPath}` : apiPath,
          data: body,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        // If using fallback, we need to use axios directly with full URL
        const response = use_fallback 
          ? await require('axios').request(requestConfig)
          : await apiClient.request(requestConfig);
        
        // Store any UIDs from the response
        const extractedUids = extractAllUids(response.data);
        if (response.data) {
          Object.assign(resolvedParams, extractedUids);
        }
        
        // Track successful retry of original endpoint
        if (isRetry && response.status >= 200 && response.status < 300) {
          context.hasSuccessfulRetry = true;
          context.successfulRequest = { method, path: apiPath, body };
          context.lastSuccessfulResponse = response.data;
        }
        
        return {
          success: true,
          status: response.status,
          data: response.data,
          extracted_uids: extractedUids,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          baseUrl: baseUrl
        };
      } catch (error) {
        const status = error.response?.status;
        const is404OrRouting = status === 404 || status === 502 || status === 503;
        const fallbackAvailable = !use_fallback && fallbackUrl;
        
        return {
          success: false,
          status: status,
          error: error.response?.data || error.message,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          baseUrl: baseUrl,
          hint: is404OrRouting && fallbackAvailable
            ? `Got ${status} error. Try again with use_fallback=true to use the fallback API URL (${fallbackUrl}).`
            : 'If the error is unclear or unexpected, use search_source_code to explore the backend implementation and understand the expected format.'
        };
      }
    }
    
    case "search_source_code": {
      const { repository, search_pattern, file_glob } = toolInput;
      const repoPath = REPO_PATHS[repository];
      
      onProgress?.({
        type: 'agent_action',
        action: 'search_source_code',
        details: `Searching ${repository} for: ${search_pattern}`
      });
      
      if (!repoPath || !fs.existsSync(repoPath)) {
        return { error: `Repository ${repository} not found at ${repoPath}` };
      }
      
      try {
        const escapedPattern = search_pattern.replace(/"/g, '\\"').replace(/'/g, "'\\''");
        let cmd;
        let result;
        
        // Try ripgrep first, fall back to grep if not available
        try {
          execSync('which rg', { encoding: 'utf8' });
          const globArg = file_glob ? `--glob "${file_glob}"` : '';
          cmd = `rg --max-count 30 -n ${globArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        } catch (rgError) {
          const includeArg = file_glob ? `--include="${file_glob}"` : '--include="*.rb" --include="*.js" --include="*.ts"';
          cmd = `grep -rn ${includeArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        }
        
        if (!result || result.trim() === '') {
          return { 
            results: 'No matches found',
            searched_in: repoPath,
            tip: 'Try broader search terms or different patterns. The code might be in a different service.',
            note: 'Some endpoints like /business/communication/* are served by separate gateway services.'
          };
        }
        
        return { 
          results: result,
          tip: 'Use read_source_file to examine specific files in detail. Document any findings as doc_issues!'
        };
      } catch (e) {
        return { 
          results: 'No matches found', 
          searched_in: repoPath,
          error_hint: e.message,
          tip: 'Try broader search terms or different file patterns.'
        };
      }
    }
    
    case "read_source_file": {
      const { repository, file_path, start_line, end_line } = toolInput;
      const repoPath = REPO_PATHS[repository];
      const fullPath = path.join(repoPath, file_path);
      
      onProgress?.({
        type: 'agent_action',
        action: 'read_source_file',
        details: `Reading ${repository}/${file_path}`
      });
      
      if (!fs.existsSync(fullPath)) {
        return { error: `File not found: ${file_path}` };
      }
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        if (start_line && end_line) {
          const slice = lines.slice(start_line - 1, end_line);
          return {
            file: file_path,
            lines: `${start_line}-${end_line}`,
            content: slice.map((line, i) => `${start_line + i}| ${line}`).join('\n'),
            reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
          };
        }
        
        // For large files, return first 150 lines with a note
        if (lines.length > 150) {
          return {
            file: file_path,
            total_lines: lines.length,
            content: lines.slice(0, 150).map((line, i) => `${i + 1}| ${line}`).join('\n'),
            note: `File has ${lines.length} lines. Showing first 150. Use start_line/end_line for specific sections.`,
            reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
          };
        }
        
        return {
          file: file_path,
          content: lines.map((line, i) => `${i + 1}| ${line}`).join('\n'),
          reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
        };
      } catch (e) {
        return { error: `Error reading file: ${e.message}` };
      }
    }
    
    case "report_result": {
      const { status, summary, skip_reason, uid_resolution, unresolved_uids, doc_issues } = toolInput;
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      
      // Map status to result
      const isSuccess = status === 'pass';
      const isSkip = status === 'skip';
      const isFail = status === 'fail';
      
      onProgress?.({
        type: 'agent_action',
        action: 'report_result',
        details: status,
        summary
      });
      
      // Save workflow for both success AND skip - so we remember this for future runs
      // NOTE: Doc issues are NOT stored in workflows - they're transient findings
      if ((isSuccess || isSkip) && (uid_resolution || skip_reason)) {
        const workflowData = {
          summary,
          status,  // Store the status so we know this is a skip
          skipReason: skip_reason || null,
          uidResolution: uid_resolution,
          successfulRequest: context.successfulRequest,
          domain: endpoint.domain,
          tags: []
          // docFixes intentionally NOT included - workflows are success paths only
        };
        
        workflowRepo.save(endpointKey, workflowData);
        context.savedWorkflow = true;
      }
      
      // Store doc issues - ALWAYS store them, even if the fix failed
      // This helps improve documentation even when we can't fix the test
      // Ensure doc_issues is an array before processing
      const docIssuesArray = Array.isArray(doc_issues) ? doc_issues : [];
      if (docIssuesArray.length > 0) {
        context.docFixSuggestions = docIssuesArray.map(issue => ({
          ...issue,
          endpoint: endpointKey,
          verified: isSuccess || isSkip,
          verifiedAt: new Date().toISOString()
        }));
      }
      
      return {
        done: true,
        status,
        success: isSuccess,
        skip: isSkip,
        skipReason: skip_reason,
        summary,
        unresolvedUids: unresolved_uids || [],
        docIssuesRecorded: docIssuesArray.length
      };
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Build the deterministic UID resolution prompt with source code exploration
 */
function buildSystemPrompt(endpoint, allEndpoints, config, resolvedParams) {
  const endpointsContext = formatEndpointsForContext(allEndpoints);
  
  // Check for existing workflow
  const endpointKey = `${endpoint.method} ${endpoint.path}`;
  const existingWorkflow = workflowRepo.get(endpointKey);
  
  let workflowContext = '';
  if (existingWorkflow) {
    if (existingWorkflow.status === 'skip' || existingWorkflow.skipReason) {
      // This endpoint was previously determined to be skippable
      workflowContext = `
## CACHED SKIP WORKFLOW - This endpoint should be SKIPPED!

A previous run determined this endpoint should be skipped due to business constraints:

**Skip Reason**: ${existingWorkflow.skipReason || existingWorkflow.summary}

**Action**: Call \`report_result\` immediately with:
- status: "skip"
- skip_reason: "${existingWorkflow.skipReason || existingWorkflow.summary}"
- summary: "Skipped based on cached workflow - ${existingWorkflow.skipReason || existingWorkflow.summary}"

Do NOT waste retries - just report skip immediately.
`;
    } else if (existingWorkflow.uidResolution) {
      workflowContext = `
## CACHED WORKFLOW - Use This First!

A previous successful run documented how to resolve UIDs for this endpoint:

${JSON.stringify(existingWorkflow.uidResolution, null, 2)}

Try using these same endpoints to resolve the UIDs. If they still work, you can skip the discovery phase.
`;
    }
    // NOTE: Doc issues are no longer stored in workflows
    // Workflows are success paths only - doc issues are transient findings reported once
  }

  return `You are an API testing agent that follows a DETERMINISTIC UID resolution workflow with SOURCE CODE EXPLORATION capabilities.

## Your Tools

1. **extract_required_uids** - Extract all UID/ID fields needed by the failing endpoint (call FIRST)
2. **find_uid_source** - Find GET/POST endpoints that can provide a specific UID value
3. **execute_api** - Make API calls to fetch/create entities or retry the original request
4. **find_service_for_endpoint** - Find which microservice handles an endpoint (call BEFORE searching code!)
5. **search_source_code** - Search backend code (use correct repository from find_service_for_endpoint!)
6. **read_source_file** - Read specific source files for implementation details
7. **report_result** - Report success/failure and document findings (ALWAYS include doc_issues!)

## Available Tokens
${Object.keys(config.tokens || {}).join(', ')}

## API URLs
- **Primary URL**: ${config.baseUrl}
- **Fallback URL**: ${config.fallbackUrl || 'Not configured'}

If an API call returns 404 or routing errors (502/503), try using \`use_fallback: true\` in execute_api to use the fallback URL.
Some legacy endpoints may only be available on the fallback URL.

## Available Parameters (already resolved)
\`\`\`json
${JSON.stringify(resolvedParams, null, 2)}
\`\`\`
${workflowContext}
## MANDATORY WORKFLOW - Follow This Exactly!

### Phase 1: UID Discovery (No retry counting)

1. **FIRST**: Call \`extract_required_uids\` to get all UID/ID fields needed
2. Review which UIDs are already resolved vs need resolution

### Phase 2: UID Resolution (No retry counting)

For EACH unresolved UID field:
1. Call \`find_uid_source\` with the UID field name
2. Call \`execute_api\` with GET on the list endpoint (purpose: "uid_resolution")
3. If response has data, extract the UID from the first item
4. If response is empty, call \`execute_api\` with POST to create entity (purpose: "uid_resolution")
5. Continue to next UID - do NOT stop until you've attempted ALL required UIDs

**CRITICAL**: Do NOT proceed to retry until ALL required UIDs have been attempted!

### Phase 3: Retry Original Request (Retry counting starts here)

Once all UIDs are resolved:
1. Call \`execute_api\` with the original endpoint using resolved UIDs (purpose: "retry_original")
2. If 2xx response: Call \`report_result\` with success=true and document uid_resolution + doc_issues
3. If still failing with unclear error: **USE SOURCE CODE EXPLORATION!**

### Phase 4: Source Code Exploration (When Needed)

**IMPORTANT**: If you encounter:
- Unknown or unexpected request format
- Validation errors that don't match documentation
- Unclear error messages (especially 500 errors)
- Missing required fields not documented

Then you MUST follow this process:

1. **FIRST**: Call \`find_service_for_endpoint\` with the endpoint path to discover which microservice handles it
   - Different endpoints are served by different services (subscriptionsmng, voicecalls, core, etc.)
   - The API gateway routes requests to the appropriate service
   
2. Call \`search_source_code\` with the **correct repository** returned by find_service_for_endpoint
   - For /v3/license/* → use repository="subscriptionsmng"
   - For /v3/communication/voice_* → use repository="voicecalls"
   - For /v3/access_control/* → use repository="permissionsmanager"
   - For /platform/v1/* → use repository="core"
   
3. Call \`read_source_file\` to examine the controller, DTO, and service files
4. Retry with the correct format based on source code
5. **ALWAYS** document your findings in \`doc_issues\` - this helps fix the documentation!

### Phase 5: Report Results

**ALWAYS** call \`report_result\` with:
- \`status\`: "pass", "skip", or "fail"
- \`summary\`: what happened
- \`skip_reason\`: required if status="skip" - explain the business constraint
- \`uid_resolution\`: how UIDs were resolved
- \`doc_issues\`: **CRITICAL** - include ANY discrepancies you found between docs and actual behavior!

## When to Use Each Status

### status: "pass"
- The endpoint returned a 2xx response with valid data
- The test is successful

### status: "skip" (IMPORTANT!)
Use "skip" when the endpoint is **working correctly** but cannot be tested due to business constraints:
- **Resource already exists**: e.g., "Staff already has a business role - each staff can only have one"
- **One-time operations**: e.g., "Account already activated - can only activate once"
- **Unique constraints**: e.g., "Email already registered - cannot create duplicate"
- **State-dependent**: e.g., "Invoice already paid - cannot pay again"

When using skip:
1. The endpoint IS working correctly (it's enforcing business rules)
2. Document the constraint in \`doc_issues\` if not in swagger
3. This will be saved in workflow so future runs don't retry

### status: "fail"
- The endpoint has a real bug or documentation is fundamentally wrong
- Cannot make progress even after trying all options

## Documentation Issues (doc_issues)

You MUST report doc_issues when you discover:
- Fields required in code but not documented
- Different field names than documented
- Different data types or formats
- Missing enum values
- Undocumented validation rules
- Any behavior that differs from swagger/documentation

Example doc_issues format:
\`\`\`json
[{
  "field": "products",
  "issue": "Documentation says products can be null, but API requires empty array []",
  "suggested_fix": "Update swagger to show products as required array, default []",
  "severity": "critical",
  "source_code_reference": "modules/payments/app/components/packages_api.rb:45"
}]
\`\`\`

## Critical Rules

- **ALWAYS** call \`extract_required_uids\` first
- **NEVER** retry the original endpoint before resolving UIDs
- **ALWAYS** try GET first, then POST as fallback for UIDs
- **ALWAYS** use search_source_code when errors are unclear
- **ALWAYS** document doc_issues - even if you can't fix the test!
- When API says "business_id", use business_uid value (the string UID)
- Same for other entities: "service_id" usually means service_uid

## All Available API Endpoints (${allEndpoints.length} total)
${endpointsContext}`;
}

/**
 * Format all endpoints for context
 */
function formatEndpointsForContext(allEndpoints) {
  // Group by domain
  const grouped = {};
  
  allEndpoints.forEach(e => {
    const domain = e.domain || 'other';
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(`${e.method} ${e.path}${e.summary ? ' - ' + e.summary : ''}`);
  });
  
  // Format as readable text
  let text = '';
  for (const [domain, endpoints] of Object.entries(grouped)) {
    text += `\n### ${domain}\n`;
    endpoints.forEach(ep => {
      text += `- ${ep}\n`;
    });
  }
  
  return text;
}

/**
 * Run the agent to fix a failing test using deterministic UID resolution
 */
async function runAgentHealer(options) {
  const {
    endpoint,
    result,
    resolvedParams,
    allEndpoints,
    config,
    apiClient,
    maxRetries = 30,  // Increased to allow more exploration attempts
    onProgress
  } = options;
  
  const client = initializeClient(config.ai?.anthropicApiKey);
  if (!client) {
    return {
      success: false,
      reason: 'No AI API key configured'
    };
  }
  
  // Build initial context
  const allParams = {
    ...config.params,
    ...resolvedParams
  };
  
  const context = {
    apiClient,
    config,
    endpoint,
    resolvedParams: { ...allParams },
    allEndpoints,
    onProgress,
    retryCount: 0,
    hasSuccessfulRetry: false,
    successfulRequest: null,
    lastSuccessfulResponse: null,
    savedWorkflow: false,
    docFixSuggestions: []
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

Follow the MANDATORY WORKFLOW:
1. Call extract_required_uids
2. For each unresolved UID: find_uid_source → execute_api (GET) → execute_api (POST if needed)
3. Once ALL UIDs resolved: execute_api with retry_original
4. If errors are unclear (especially 500 errors):
   a. FIRST call find_service_for_endpoint to discover which service handles this endpoint
   b. Then use search_source_code with the CORRECT repository
   c. Use read_source_file to examine the actual implementation
5. Call report_result with your findings - ALWAYS include doc_issues for any documentation discrepancies!`;

  const messages = [{ role: "user", content: userMessage }];
  const healingLog = [];
  let iterations = 0;
  const maxIterations = 100; // High limit since UID resolution doesn't count toward retries
  
  onProgress?.({
    type: 'agent_start',
    endpoint: `${endpoint.method} ${endpoint.path}`,
    maxRetries
  });
  
  // Agent loop
  while (iterations < maxIterations) {
    iterations++;
    
    // Check retry limit
    if (context.retryCount > maxRetries) {
      healingLog.push({
        type: 'max_retries',
        iteration: iterations,
        retryCount: context.retryCount
      });
      break;
    }
    
    onProgress?.({
      type: 'agent_thinking',
      iteration: iterations,
      retryCount: context.retryCount
    });
    
    // Call Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      tools: TOOLS,
      messages
    });
    
    // Check if Claude wants to use tools
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
    const textBlocks = response.content.filter(block => block.type === 'text');
    
    // Log any text response
    if (textBlocks.length > 0) {
      const thought = textBlocks.map(b => b.text).join('\n');
      healingLog.push({
        type: 'thought',
        iteration: iterations,
        content: thought
      });
      onProgress?.({
        type: 'agent_thought',
        iteration: iterations,
        thought: thought.substring(0, 200)
      });
    }
    
    // If no tool calls, Claude is done thinking
    if (toolUseBlocks.length === 0) {
      healingLog.push({
        type: 'no_action',
        iteration: iterations,
        content: 'Agent stopped without reporting result'
      });
      break;
    }
    
    // Execute each tool call
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      healingLog.push({
        type: 'tool_call',
        iteration: iterations,
        tool: toolUse.name,
        input: toolUse.input
      });
      
      onProgress?.({
        type: 'agent_tool_call',
        iteration: iterations,
        tool: toolUse.name,
        input: toolUse.input
      });
      
      const toolResult = await executeTool(toolUse.name, toolUse.input, context);
      
      healingLog.push({
        type: 'tool_result',
        iteration: iterations,
        tool: toolUse.name,
        result: toolResult
      });
      
      onProgress?.({
        type: 'agent_tool_result',
        iteration: iterations,
        tool: toolUse.name,
        success: toolResult.success,
        status: toolResult.status
      });
      
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolResult)
      });
      
      // Check if done
      if (toolResult.done) {
        onProgress?.({
          type: 'agent_complete',
          status: toolResult.status,
          success: toolResult.success,
          skip: toolResult.skip,
          summary: toolResult.summary,
          retryCount: context.retryCount,
          workflowSaved: context.savedWorkflow,
          docIssuesCount: context.docFixSuggestions.length
        });
        
        return {
          status: toolResult.status,  // 'pass', 'skip', or 'fail'
          success: toolResult.success,
          skip: toolResult.skip,
          skipReason: toolResult.skipReason,
          summary: toolResult.summary,
          reason: toolResult.success ? null : toolResult.summary,
          docFixSuggestions: context.docFixSuggestions,
          savedWorkflows: context.savedWorkflow ? [{ endpoint: `${endpoint.method} ${endpoint.path}` }] : [],
          iterations,
          retryCount: context.retryCount,
          healingLog,
          resolvedParams: context.resolvedParams,
          unresolvedUids: toolResult.unresolvedUids || []
        };
      }
    }
    
    // Add assistant response and tool results to messages
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }
  
  // Max iterations or retries reached
  onProgress?.({
    type: 'agent_complete',
    success: false,
    summary: context.retryCount > maxRetries 
      ? `Exceeded maximum ${maxRetries} retries`
      : `Reached maximum ${maxIterations} iterations`,
    retryCount: context.retryCount,
    workflowSaved: context.savedWorkflow,
    docIssuesCount: context.docFixSuggestions.length
  });
  
  return {
    success: false,
    reason: context.retryCount > maxRetries 
      ? `Exceeded maximum ${maxRetries} retries`
      : `Reached maximum ${maxIterations} iterations without resolution`,
    docFixSuggestions: context.docFixSuggestions,
    savedWorkflows: [],
    iterations,
    retryCount: context.retryCount,
    healingLog,
    resolvedParams: context.resolvedParams
  };
}

/**
 * Check if an error is unrecoverable (should not attempt healing)
 * @param {Object} result - Validation result
 * @returns {boolean}
 */
function isUnrecoverableError(result) {
  const httpStatus = result.httpStatus;
  const reason = result.details?.reason;
  
  // Infrastructure errors - don't retry
  if ([502, 503, 504].includes(httpStatus)) {
    return true;
  }
  
  // Network errors
  if (reason === 'NETWORK_ERROR' || reason === 'TIMEOUT') {
    return true;
  }
  
  // Endpoint not found (path is wrong, not resource)
  if (reason === 'ENDPOINT_NOT_FOUND') {
    return true;
  }
  
  // 404 that indicates the endpoint itself doesn't exist
  if (httpStatus === 404) {
    const responseData = result.details?.response?.data;
    if (responseData?.message?.toLowerCase().includes('route not found') ||
        responseData?.message?.toLowerCase().includes('endpoint not found') ||
        responseData?.message?.toLowerCase().includes('not implemented')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Lookup workflow from repository
 */
function lookupWorkflow(endpoint) {
  return workflowRepo.get(endpoint);
}

module.exports = {
  runAgentHealer,
  isUnrecoverableError,
  lookupWorkflow,
  extractUidFieldsFromSchema,
  findUidSourceEndpoints,
  TOOLS
};
