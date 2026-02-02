/**
 * Parameter Resolver
 * Maps dynamic path parameters to their source endpoints and handles resolution
 */

/**
 * Mapping of dynamic parameter names to their source endpoints
 * Each entry specifies:
 * - endpoint: The API endpoint to call to get sample data
 * - method: HTTP method (default: GET)
 * - field: The field name to extract from the response (supports dot notation)
 * - arrayPath: Path to the array in response (e.g., 'data', 'data.items')
 */
const PARAM_SOURCES = {
  // CRM
  client_uid: { 
    endpoint: '/v3/crm/clients', 
    field: 'uid',
    arrayPath: 'data.clients'
  },
  client_id: { 
    endpoint: '/v3/crm/clients', 
    field: 'uid',
    arrayPath: 'data.clients'
  },
  
  // Scheduling
  booking_id: { 
    endpoint: '/business/scheduling/v1/bookings', 
    field: 'uid',
    arrayPath: 'data.bookings'
  },
  booking_uid: { 
    endpoint: '/business/scheduling/v1/bookings', 
    field: 'uid',
    arrayPath: 'data.bookings'
  },
  appointment_id: { 
    endpoint: '/platform/v1/scheduling/appointments', 
    field: 'id',
    arrayPath: 'data.appointments'
  },
  time_slot_uid: { 
    endpoint: '/business/scheduling/v1/time_slots', 
    field: 'uid',
    arrayPath: 'data.time_slots'
  },
  event_instance_id: { 
    endpoint: '/v3/scheduling/events', 
    field: 'uid',
    arrayPath: 'data.events'
  },
  event_attendance_uid: { 
    endpoint: '/platform/v1/scheduling/event_attendances', 
    field: 'uid',
    arrayPath: 'data.event_attendances'
  },
  resource_type_uid: { 
    endpoint: '/v3/scheduling/resource_types', 
    field: 'uid',
    arrayPath: 'data.resource_types'
  },
  
  // Payments / Sales
  invoice_id: { 
    endpoint: '/business/payments/v1/invoices', 
    field: 'uid',
    arrayPath: 'data.invoices'
  },
  invoice_uid: { 
    endpoint: '/business/payments/v1/invoices', 
    field: 'uid',
    arrayPath: 'data.invoices'
  },
  payment_id: { 
    endpoint: '/business/payments/v1/payments', 
    field: 'uid',
    arrayPath: 'data.payments'
  },
  payment_uid: { 
    endpoint: '/business/payments/v1/payments', 
    field: 'uid',
    arrayPath: 'data.payments'
  },
  service_id: { 
    endpoint: '/platform/v1/services', 
    field: 'id',
    arrayPath: 'data.services'
  },
  service_uid: { 
    endpoint: '/platform/v1/services', 
    field: 'id',
    arrayPath: 'data.services'
  },
  card_id: { 
    endpoint: '/business/payments/v1/cards', 
    field: 'uid',
    arrayPath: 'data.cards'
  },
  package_id: { 
    endpoint: '/platform/v1/payment/packages', 
    field: 'id',
    arrayPath: 'data.packages'
  },
  product_id: { 
    endpoint: '/business/payments/v1/products', 
    field: 'id',
    arrayPath: 'data.products'
  },
  product_order_id: { 
    endpoint: '/business/payments/v1/product_orders', 
    field: 'id',
    arrayPath: 'data.product_orders'
  },
  estimate_uid: { 
    endpoint: '/platform/v1/estimates', 
    field: 'id',
    arrayPath: 'data.estimates'
  },
  deposit_uid: { 
    endpoint: '/business/payments/v1/deposits', 
    field: 'uid',
    arrayPath: 'data.deposits'
  },
  tax_id: { 
    endpoint: '/business/payments/v1/taxes', 
    field: 'id',
    arrayPath: 'data.taxes'
  },
  client_package_id: { 
    endpoint: '/business/payments/v1/client_packages', 
    field: 'id',
    arrayPath: 'data.client_packages'
  },
  payment_request_uid: { 
    endpoint: '/business/payments/v1/payment_requests', 
    field: 'uid',
    arrayPath: 'data.payment_requests'
  },
  payment_request_id: { 
    endpoint: '/business/payments/v1/payment_requests', 
    field: 'uid',
    arrayPath: 'data.payment_requests'
  },
  scheduled_payments_rule_uid: { 
    endpoint: '/business/payments/v1/scheduled_payments_rules', 
    field: 'uid',
    arrayPath: 'data.scheduled_payments_rules'
  },
  
  // AI / BizAI
  ai_chat_uid: { 
    endpoint: '/v3/ai/bizai_chats', 
    field: 'uid',
    arrayPath: 'data.bizai_chats'  // Note: no underscore between "biz" and "ai"
  },
  bizai_chat_uid: { 
    endpoint: '/v3/ai/bizai_chats', 
    field: 'uid',
    arrayPath: 'data.bizai_chats'  // Note: no underscore between "biz" and "ai"
  },
  
  // Apps
  app_code_name: { 
    endpoint: '/platform/v1/apps', 
    field: 'app_code_name',
    arrayPath: 'apps'
  },
  
  // Generic uid/id - these are typically resource-specific
  // and will be resolved from context or skipped
  uid: { 
    endpoint: null, // Resolved from context 
    field: 'uid'
  },
  id: { 
    endpoint: null, // Resolved from context
    field: 'id'
  }
};

/**
 * Static parameters that should come from config, not API calls
 */
const STATIC_PARAMS = [
  'business_id',
  'business_uid',
  'staff_id',
  'directory_id',
  'directory_uid'
];

/**
 * Override list endpoints for Phase 2 auto-derivation
 * Maps detail endpoint patterns to their actual list endpoints
 * when the list is at a different path than would be derived
 */
const LIST_ENDPOINT_OVERRIDES = {
  // Estimates: detail is at /business/payments/v1, list is at /platform/v1
  '/business/payments/v1/estimates': '/platform/v1/estimates',
  
  // Add more overrides as needed:
  // '/some/path/to/resource': '/different/path/to/list',
};

/**
 * Query parameter sources for endpoints that need query params from other API calls
 * Maps endpoint patterns to their prerequisite calls and parameter extraction
 * Format: 'endpoint_pattern': { param_name: { prerequisite_endpoint, extract_from, use_config_param } }
 */
const QUERY_PARAM_PREREQUISITES = {
  // GET /platform/v1/businesses needs email filter from an existing business
  '/platform/v1/businesses': {
    email: {
      // First call this endpoint to get data
      prerequisite_endpoint: '/platform/v1/businesses/{business_uid}',
      // The config param to substitute in the prerequisite endpoint
      use_config_param: 'business_uid',
      // Path to extract the value from the prerequisite response
      extract_from: 'data.business.admin_account.email',
      // Description for documentation
      description: 'Admin email from existing business'
    }
  }
};

/**
 * Context-aware parameter mapping
 * When a generic param like {uid} appears in a path, this maps it to a specific param name
 * based on the path context (e.g., /contacts/{uid} -> client_uid)
 * Format: { pathContains: paramName }
 */
const PATH_CONTEXT_PARAMS = {
  // contacts == clients, so {uid} in /contacts/ paths should use client_uid
  '/contacts/': 'client_uid',
  '/clients/': 'client_uid',
  
  // Add more context mappings as needed:
  // '/invoices/': 'invoice_uid',
  // '/bookings/': 'booking_uid',
};

/**
 * Resolve a generic parameter name to a specific one based on path context
 * @param {string} paramName - The generic param name (e.g., 'uid')
 * @param {string} path - The full API path
 * @returns {string} The resolved param name (e.g., 'client_uid')
 */
function resolveParamByContext(paramName, path) {
  // Only apply context resolution for generic params like 'uid' or 'id'
  if (paramName !== 'uid' && paramName !== 'id') {
    return paramName;
  }
  
  // Check each path context pattern
  for (const [pathPattern, mappedParam] of Object.entries(PATH_CONTEXT_PARAMS)) {
    if (path.includes(pathPattern)) {
      console.log(`[Param Resolver] Context mapping: ${paramName} -> ${mappedParam} (path contains "${pathPattern}")`);
      return mappedParam;
    }
  }
  
  return paramName;
}

/**
 * Get the list endpoint for a given detail endpoint path
 * Returns override if available, otherwise returns the derived path
 * @param {string} derivedListPath - The path derived by stripping trailing param
 * @returns {string} The actual list endpoint to use
 */
function getListEndpoint(derivedListPath) {
  return LIST_ENDPOINT_OVERRIDES[derivedListPath] || derivedListPath;
}

/**
 * Derive list endpoint from a detail endpoint path
 * Works for any path ending with a parameter like /{uid}, /{id}, /{client_package_id}, etc.
 * @param {string} path - API path (e.g., '/v3/license/subscriptions/{uid}' or '/business/payments/v1/client_packages/{client_package_id}')
 * @returns {Object|null} { listEndpoint, paramName } or null if not derivable
 */
function deriveListEndpoint(path) {
  // Match paths ending with any /{param_name} pattern
  const match = path.match(/^(.+)\/\{([a-z_]+)\}$/);
  if (!match) return null;
  
  return {
    listEndpoint: match[1],
    paramName: match[2]
  };
}

/**
 * Generate a resource-specific key for caching derived UIDs
 * @param {string} path - Original path with {uid} or {id}
 * @returns {string} Cache key like 'license_subscriptions_uid'
 */
function generateResourceKey(path) {
  // Remove version prefix and parameter placeholders
  const cleaned = path
    .replace(/^\/v\d+\//, '')  // Remove /v3/ etc
    .replace(/^\/business\//, '')  // Remove /business/ prefix
    .replace(/^\/platform\/v\d+\//, '')  // Remove /platform/v1/ etc
    .replace(/\{[^}]+\}/g, '')  // Remove all {param} placeholders
    .replace(/\/+/g, '_')  // Replace slashes with underscores
    .replace(/^_|_$/g, '');  // Trim leading/trailing underscores
  
  // Extract the param name (uid or id)
  const match = path.match(/\{(uid|id)\}$/);
  const paramName = match ? match[1] : 'uid';
  
  return `${cleaned}_${paramName}`;
}

/**
 * Smart extraction of uid/id from API response
 * Handles various common response patterns
 * @param {Object} response - API response data
 * @param {string} paramName - Parameter name (e.g., 'uid', 'id', 'client_package_id')
 * @returns {string|null} Extracted value or null
 */
function smartExtractUid(response, paramName = 'uid') {
  if (!response || typeof response !== 'object') return null;
  
  // Build list of fields to check - try the param name and common id fields
  const fieldsToCheck = [
    paramName,           // e.g., 'client_package_id'
    'uid',               // Common standard field
    'id',                // Another common field
  ];
  
  // If param ends with _id or _uid, also try without suffix
  // e.g., 'client_package_id' → also try 'client_package_uid'
  if (paramName.endsWith('_id')) {
    fieldsToCheck.push(paramName.replace(/_id$/, '_uid'));
  } else if (paramName.endsWith('_uid')) {
    fieldsToCheck.push(paramName.replace(/_uid$/, '_id'));
  }
  
  /**
   * Extract first matching field from an item
   */
  function extractFromItem(item) {
    if (!item || typeof item !== 'object') return null;
    for (const field of fieldsToCheck) {
      if (item[field]) return item[field];
    }
    return null;
  }
  
  // Try common patterns in order of likelihood
  const patterns = [
    // Pattern 1: { data: { items: [...] } }
    () => {
      const items = response.data?.items;
      if (Array.isArray(items) && items.length > 0) {
        return extractFromItem(items[0]);
      }
      return null;
    },
    // Pattern 2: { data: { <resource_name>: [...] } } - find first array in data
    () => {
      if (response.data && typeof response.data === 'object') {
        for (const [key, value] of Object.entries(response.data)) {
          if (Array.isArray(value) && value.length > 0) {
            return extractFromItem(value[0]);
          }
        }
      }
      return null;
    },
    // Pattern 3: { data: [...] } - data is directly an array
    () => {
      if (Array.isArray(response.data) && response.data.length > 0) {
        return extractFromItem(response.data[0]);
      }
      return null;
    },
    // Pattern 4: { items: [...] }
    () => {
      if (Array.isArray(response.items) && response.items.length > 0) {
        return extractFromItem(response.items[0]);
      }
      return null;
    },
    // Pattern 5: Response is directly an array
    () => {
      if (Array.isArray(response) && response.length > 0) {
        return extractFromItem(response[0]);
      }
      return null;
    },
    // Pattern 6: Fallback - find first array anywhere in response
    () => {
      for (const [key, value] of Object.entries(response)) {
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
          const extracted = extractFromItem(value[0]);
          if (extracted) return extracted;
        }
      }
      return null;
    }
  ];
  
  // Try each pattern until one works
  for (const pattern of patterns) {
    const result = pattern();
    if (result) return result;
  }
  
  return null;
}

/**
 * Extract a value from an object using dot notation path
 * @param {Object} obj - Object to extract from
 * @param {string} path - Dot notation path (e.g., 'data.items')
 * @returns {*} Extracted value
 */
function getNestedValue(obj, path) {
  if (!path) return obj;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Check if a parameter is static (should come from config)
 * @param {string} paramName - Parameter name
 * @returns {boolean}
 */
function isStaticParam(paramName) {
  return STATIC_PARAMS.includes(paramName);
}

/**
 * Check if a parameter has a known source endpoint
 * @param {string} paramName - Parameter name
 * @returns {boolean}
 */
function hasParamSource(paramName) {
  return paramName in PARAM_SOURCES && PARAM_SOURCES[paramName].endpoint !== null;
}

/**
 * Get the source configuration for a parameter
 * @param {string} paramName - Parameter name
 * @returns {Object|null}
 */
function getParamSource(paramName) {
  return PARAM_SOURCES[paramName] || null;
}

/**
 * Extract path parameters from an endpoint path
 * @param {string} path - API path (e.g., '/v3/businesses/{business_id}/clients/{client_uid}')
 * @returns {string[]} Array of parameter names
 */
function extractPathParams(path) {
  const matches = path.match(/\{([a-z_]+)\}/g) || [];
  return matches.map(m => m.slice(1, -1)); // Remove { and }
}

/**
 * Check which parameters are missing from the available params
 * @param {string} path - API path
 * @param {Object} staticParams - Static params from config
 * @param {Object} dynamicParams - Dynamic params from context
 * @returns {Object} { missing: string[], static: string[], dynamic: string[], resolved: string[] }
 */
function analyzePathParams(path, staticParams = {}, dynamicParams = {}) {
  const requiredParams = extractPathParams(path);
  const result = {
    required: requiredParams,
    missing: [],
    static: [],
    dynamic: [],
    resolved: []
  };
  
  for (const param of requiredParams) {
    if (param in staticParams) {
      result.static.push(param);
      result.resolved.push(param);
    } else if (param in dynamicParams) {
      result.dynamic.push(param);
      result.resolved.push(param);
    } else if (isStaticParam(param)) {
      // Should be in config but isn't
      result.missing.push(param);
    } else if (hasParamSource(param)) {
      // Can be fetched dynamically
      result.missing.push(param);
    } else {
      // Unknown param with no source
      result.missing.push(param);
    }
  }
  
  return result;
}

/**
 * Substitute parameters in a path
 * @param {string} path - API path with placeholders
 * @param {Object} staticParams - Static params from config
 * @param {Object} dynamicParams - Dynamic params from context
 * @returns {Object} { path: string, unresolved: string[] }
 */
function substitutePath(path, staticParams = {}, dynamicParams = {}) {
  let result = path;
  const allParams = { ...staticParams, ...dynamicParams };
  
  for (const [param, value] of Object.entries(allParams)) {
    result = result.replace(`{${param}}`, value);
  }
  
  // Check for unresolved params
  const unresolved = extractPathParams(result);
  
  return {
    path: result,
    unresolved
  };
}

/**
 * Extract a parameter value from an API response
 * @param {Object} response - API response data
 * @param {string} paramName - Parameter name to extract
 * @returns {string|null} Extracted value
 */
function extractParamFromResponse(response, paramName) {
  const source = PARAM_SOURCES[paramName];
  if (!source) return null;
  
  const { field, arrayPath } = source;
  
  // Get the array from response
  let items = arrayPath ? getNestedValue(response, arrayPath) : response;
  
  // If response is wrapped in data
  if (!items && response.data) {
    items = arrayPath ? getNestedValue(response.data, arrayPath) : response.data;
  }
  
  // Handle array - get first item
  if (Array.isArray(items) && items.length > 0) {
    return items[0][field] || null;
  }
  
  // Handle single object
  if (items && typeof items === 'object') {
    return items[field] || null;
  }
  
  return null;
}

/**
 * Create a parameter resolver instance for a test run
 * @param {Object} config - Configuration with static params
 * @returns {Object} Resolver instance
 */
function createParamResolver(config) {
  const staticParams = config.params || {};
  const resolvedParams = { ...staticParams };
  const fetchedEndpoints = new Set();
  
  return {
    /**
     * Get all currently resolved parameters
     */
    getResolvedParams() {
      return { ...resolvedParams };
    },
    
    /**
     * Get static parameters from config
     */
    getStaticParams() {
      return { ...staticParams };
    },
    
    /**
     * Add a resolved parameter
     */
    addParam(name, value) {
      resolvedParams[name] = value;
    },
    
    /**
     * Check what params are needed for a path
     */
    analyzeRequired(path) {
      return analyzePathParams(path, staticParams, resolvedParams);
    },
    
    /**
     * Substitute params in a path
     */
    substitute(path) {
      return substitutePath(path, staticParams, resolvedParams);
    },
    
    /**
     * Get endpoints that need to be called to resolve params
     */
    getRequiredFetches(paths) {
      const needed = new Set();
      
      for (const path of paths) {
        const analysis = analyzePathParams(path, staticParams, resolvedParams);
        
        for (const param of analysis.missing) {
          const source = getParamSource(param);
          if (source && source.endpoint && !fetchedEndpoints.has(source.endpoint)) {
            needed.add({ param, ...source });
          }
        }
      }
      
      return Array.from(needed);
    },
    
    /**
     * Mark an endpoint as fetched
     */
    markFetched(endpoint) {
      fetchedEndpoints.add(endpoint);
    },
    
    /**
     * Process a response and extract any useful params
     */
    processResponse(response, paramName) {
      const value = extractParamFromResponse(response, paramName);
      if (value) {
        resolvedParams[paramName] = value;
      }
      return value;
    }
  };
}

/**
 * Get query parameter prerequisites for an endpoint path
 * @param {string} path - API path (e.g., '/platform/v1/businesses')
 * @returns {Object|null} Prerequisites object or null if none needed
 */
function getQueryParamPrerequisites(path) {
  // Remove query string if present
  const basePath = path.split('?')[0];
  return QUERY_PARAM_PREREQUISITES[basePath] || null;
}

/**
 * Build prerequisite endpoint path with config params substituted
 * @param {Object} prereq - Prerequisite config object
 * @param {Object} configParams - Config params (e.g., { business_uid: '00wutb5f1a08a8kn' })
 * @returns {string|null} Full prerequisite endpoint path or null
 */
function buildPrerequisiteEndpoint(prereq, configParams) {
  if (!prereq || !prereq.prerequisite_endpoint) return null;
  
  let endpoint = prereq.prerequisite_endpoint;
  
  // Substitute config params
  if (prereq.use_config_param && configParams[prereq.use_config_param]) {
    endpoint = endpoint.replace(
      `{${prereq.use_config_param}}`, 
      configParams[prereq.use_config_param]
    );
  }
  
  return endpoint;
}

module.exports = {
  PARAM_SOURCES,
  STATIC_PARAMS,
  LIST_ENDPOINT_OVERRIDES,
  PATH_CONTEXT_PARAMS,
  QUERY_PARAM_PREREQUISITES,
  isStaticParam,
  hasParamSource,
  getParamSource,
  getListEndpoint,
  extractPathParams,
  analyzePathParams,
  substitutePath,
  extractParamFromResponse,
  createParamResolver,
  getNestedValue,
  deriveListEndpoint,
  generateResourceKey,
  smartExtractUid,
  resolveParamByContext,
  getQueryParamPrerequisites,
  buildPrerequisiteEndpoint
};
