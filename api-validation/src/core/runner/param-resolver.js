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
    arrayPath: 'data.resourceTypes'
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
    endpoint: '/business/payments/v1/estimates', 
    field: 'uid',
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

module.exports = {
  PARAM_SOURCES,
  STATIC_PARAMS,
  isStaticParam,
  hasParamSource,
  getParamSource,
  extractPathParams,
  analyzePathParams,
  substitutePath,
  extractParamFromResponse,
  createParamResolver,
  getNestedValue
};
