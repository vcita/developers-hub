/**
 * Resource Grouper
 * Groups endpoints by resource for proper test ordering
 */

/**
 * Extract resource path from full endpoint path
 * e.g., /v3/ai/ai_recommendations/{uid} -> /v3/ai/ai_recommendations
 * @param {string} path - Full endpoint path
 * @returns {string} Base resource path
 */
function extractResourcePath(path) {
  // Remove trailing UID parameter
  let resourcePath = path.replace(/\/\{[^}]+\}$/, '');
  
  // Also handle paths that might have nested params
  resourcePath = resourcePath.replace(/\/\{[^}]+\}/g, '');
  
  return resourcePath;
}

/**
 * Parse path to extract resource info
 * @param {string} path - Endpoint path
 * @returns {Object} { version, domain, resource, basePath, isCollection, hasUidParam }
 */
function parseResourcePath(path) {
  // Match patterns like /v3/ai/ai_recommendations or /platform/v1/apps
  const v3Match = path.match(/^\/(v\d)\/([^/]+)\/([^/{]+)/);
  const platformMatch = path.match(/^\/platform\/(v\d)\/([^/{]+)/);
  
  let version, domain, resource;
  
  if (v3Match) {
    version = v3Match[1];
    domain = v3Match[2];
    resource = v3Match[3];
  } else if (platformMatch) {
    version = platformMatch[1];
    domain = 'platform';
    resource = platformMatch[2];
  } else {
    // Fallback for other patterns
    const parts = path.split('/').filter(Boolean);
    version = parts.find(p => /^v\d+$/.test(p)) || 'unknown';
    domain = parts.length > 1 ? parts[0] : 'unknown';
    resource = parts.length > 2 ? parts[2] : parts[1] || 'unknown';
  }
  
  const basePath = extractResourcePath(path);
  const hasUidParam = path.includes('{uid}') || path.includes('{id}');
  const isCollection = !hasUidParam && (path.endsWith(resource) || path.endsWith('/'));
  
  return {
    version,
    domain,
    resource,
    basePath,
    isCollection,
    hasUidParam
  };
}

/**
 * Group endpoints by resource
 * @param {Object[]} endpoints - Array of endpoint objects
 * @returns {Object} Grouped endpoints { resourceKey: { endpoints: [], info: {} } }
 */
function groupByResource(endpoints) {
  const groups = {};
  
  for (const endpoint of endpoints) {
    const resourceInfo = parseResourcePath(endpoint.path);
    const key = `${resourceInfo.domain}/${resourceInfo.resource}`;
    
    if (!groups[key]) {
      groups[key] = {
        key,
        domain: resourceInfo.domain,
        resource: resourceInfo.resource,
        version: resourceInfo.version,
        basePath: resourceInfo.basePath,
        endpoints: []
      };
    }
    
    groups[key].endpoints.push({
      ...endpoint,
      resourceInfo
    });
  }
  
  return groups;
}

/**
 * Group endpoints by domain first, then by resource
 * @param {Object[]} endpoints - Array of endpoint objects
 * @returns {Object} Nested grouping { domain: { resources: { resource: endpoints[] } } }
 */
function groupByDomainAndResource(endpoints) {
  const domains = {};
  
  for (const endpoint of endpoints) {
    const resourceInfo = parseResourcePath(endpoint.path);
    const { domain, resource } = resourceInfo;
    
    if (!domains[domain]) {
      domains[domain] = {
        domain,
        totalEndpoints: 0,
        resources: {}
      };
    }
    
    if (!domains[domain].resources[resource]) {
      domains[domain].resources[resource] = {
        resource,
        basePath: resourceInfo.basePath,
        endpoints: []
      };
    }
    
    domains[domain].resources[resource].endpoints.push({
      ...endpoint,
      resourceInfo
    });
    domains[domain].totalEndpoints++;
  }
  
  return domains;
}

/**
 * Get the CRUD operation type for an endpoint
 * @param {Object} endpoint - Endpoint object
 * @returns {string} Operation type: 'create', 'read', 'update', 'delete', 'list', 'action'
 */
function getCrudOperation(endpoint) {
  const method = endpoint.method.toUpperCase();
  const hasUidParam = endpoint.path.includes('{uid}') || endpoint.path.includes('{id}');
  
  switch (method) {
    case 'POST':
      // POST without UID is typically create
      // POST with UID might be an action (e.g., /items/{uid}/activate)
      if (hasUidParam) {
        return 'action';
      }
      return 'create';
    
    case 'GET':
      if (hasUidParam) {
        return 'read';
      }
      return 'list';
    
    case 'PUT':
    case 'PATCH':
      return 'update';
    
    case 'DELETE':
      return 'delete';
    
    default:
      return 'action';
  }
}

/**
 * Categorize endpoints by CRUD operation
 * @param {Object[]} endpoints - Array of endpoints for a resource
 * @returns {Object} { create: [], list: [], read: [], update: [], delete: [], actions: [] }
 */
function categorizeByOperation(endpoints) {
  const categories = {
    create: [],
    list: [],
    read: [],
    update: [],
    delete: [],
    actions: []
  };
  
  for (const endpoint of endpoints) {
    const operation = getCrudOperation(endpoint);
    
    if (operation === 'action') {
      categories.actions.push(endpoint);
    } else {
      categories[operation].push(endpoint);
    }
  }
  
  return categories;
}

/**
 * Identify resource dependencies based on path parameters
 * e.g., /v3/ai/bizai_chats/{chat_uid}/messages depends on bizai_chats
 * @param {Object[]} endpoints - Array of endpoint objects
 * @returns {Object} Dependency map { resourceKey: [dependsOnKeys] }
 */
function identifyDependencies(endpoints) {
  const dependencies = {};
  const resources = new Set();
  
  // First pass: collect all resource names
  for (const endpoint of endpoints) {
    const info = parseResourcePath(endpoint.path);
    resources.add(info.resource);
  }
  
  // Second pass: identify dependencies from path parameters
  for (const endpoint of endpoints) {
    const info = parseResourcePath(endpoint.path);
    const key = `${info.domain}/${info.resource}`;
    
    if (!dependencies[key]) {
      dependencies[key] = [];
    }
    
    // Check path parameters for resource references
    const pathParams = endpoint.path.match(/\{([^}]+)\}/g) || [];
    for (const param of pathParams) {
      const paramName = param.replace(/[{}]/g, '');
      
      // Check if param name matches another resource (with _uid/_id suffix)
      const matchedResource = paramName.replace(/_(uid|id)$/, '');
      if (resources.has(matchedResource) && matchedResource !== info.resource) {
        const depKey = `${info.domain}/${matchedResource}`;
        if (!dependencies[key].includes(depKey)) {
          dependencies[key].push(depKey);
        }
      }
    }
  }
  
  return dependencies;
}

module.exports = {
  extractResourcePath,
  parseResourcePath,
  groupByResource,
  groupByDomainAndResource,
  getCrudOperation,
  categorizeByOperation,
  identifyDependencies
};
