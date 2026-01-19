/**
 * Swagger Parser
 * Parses OpenAPI specs from mcp_swagger folder and extracts endpoints
 */

const fs = require('fs');
const path = require('path');
const SwaggerParser = require('@apidevtools/swagger-parser');
const { extractTokenInfo } = require('./token-parser');

// Project root directory (developers-hub)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

/**
 * Custom resolver to translate GitHub Pages URLs to local entity files
 * Converts: https://vcita.github.io/developers-hub/entities/... 
 * To local: /path/to/developers-hub/entities/...
 */
const localEntityResolver = {
  order: 1, // Run before default resolvers
  canRead: /^https?:\/\/vcita\.github\.io\/developers-hub\//i,
  read: (file) => {
    // Extract the path after 'developers-hub/'
    const match = file.url.match(/vcita\.github\.io\/developers-hub\/(.+)$/i);
    if (match) {
      const relativePath = match[1];
      const localPath = path.join(PROJECT_ROOT, relativePath);
      
      console.log(`  [Resolver] Resolving ${file.url}`);
      console.log(`  [Resolver] → Local: ${localPath}`);
      
      if (fs.existsSync(localPath)) {
        const content = fs.readFileSync(localPath, 'utf8');
        return content;
      } else {
        console.warn(`  [Resolver] ⚠️ Local file not found: ${localPath}`);
        throw new Error(`Local entity file not found: ${localPath}`);
      }
    }
    throw new Error(`Cannot resolve URL: ${file.url}`);
  }
};

/**
 * Load all swagger files from a directory (sync version for initial load)
 * @param {string} swaggerPath - Path to swagger directory
 * @returns {Object[]} Array of { domain, spec, filePath }
 */
function loadSwaggerFiles(swaggerPath) {
  const files = fs.readdirSync(swaggerPath)
    .filter(f => f.endsWith('.json') && !f.startsWith('.')); // Exclude hidden files
  
  const specs = [];
  
  for (const file of files) {
    const filePath = path.join(swaggerPath, file);
    const domain = path.basename(file, '.json');
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const spec = JSON.parse(content);
      
      specs.push({
        domain,
        spec,
        filePath
      });
    } catch (error) {
      console.error(`Error loading ${file}: ${error.message}`);
    }
  }
  
  return specs;
}

/**
 * Load and dereference all swagger files (async - resolves all $refs)
 * Uses custom resolver to translate GitHub URLs to local entity files
 * @param {string} swaggerPath - Path to swagger directory
 * @returns {Promise<Object[]>} Array of { domain, spec, filePath }
 */
async function loadSwaggerFilesAsync(swaggerPath) {
  const files = fs.readdirSync(swaggerPath)
    .filter(f => f.endsWith('.json') && !f.startsWith('.')); // Exclude hidden files
  
  const specs = [];
  
  // Configure parser options with custom resolver
  const parserOptions = {
    resolve: {
      http: localEntityResolver  // Use local resolver for HTTP(S) URLs
    }
  };
  
  for (const file of files) {
    const filePath = path.join(swaggerPath, file);
    const domain = path.basename(file, '.json');
    
    try {
      console.log(`Parsing ${domain}...`);
      // Use swagger-parser to dereference all $refs with custom resolver
      const spec = await SwaggerParser.dereference(filePath, parserOptions);
      
      specs.push({
        domain,
        spec,
        filePath
      });
    } catch (error) {
      console.error(`Error loading/dereferencing ${file}: ${error.message}`);
      // Fall back to basic JSON parse
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const spec = JSON.parse(content);
        specs.push({ domain, spec, filePath });
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${file}: ${fallbackError.message}`);
      }
    }
  }
  
  return specs;
}

/**
 * Extract endpoints from a swagger spec
 * @param {Object} spec - OpenAPI specification object
 * @param {string} domain - Domain name
 * @returns {Object[]} Array of endpoint objects
 */
function extractEndpoints(spec, domain) {
  const endpoints = [];
  const paths = spec.paths || {};
  
  for (const [path, pathItem] of Object.entries(paths)) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    
    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;
      
      // Extract token info
      const tokenInfo = extractTokenInfo(operation);
      
      // Extract tags
      const tags = operation.tags || [];
      
      // Extract parameters
      const parameters = operation.parameters || [];
      const pathParams = parameters.filter(p => p.in === 'path');
      const queryParams = parameters.filter(p => p.in === 'query');
      
      // Extract request body schema
      const requestBody = operation.requestBody;
      let requestSchema = null;
      if (requestBody?.content?.['application/json']?.schema) {
        requestSchema = requestBody.content['application/json'].schema;
      }
      
      // Extract response schema (200 or 201)
      const responses = operation.responses || {};
      const successResponse = responses['200'] || responses['201'];
      let responseSchema = null;
      if (successResponse?.content?.['application/json']?.schema) {
        responseSchema = successResponse.content['application/json'].schema;
      }
      
      // Determine API version from path
      let version = 'unknown';
      if (path.includes('/v3/')) {
        version = 'v3';
      } else if (path.includes('/v1/') || path.includes('/platform/v1/')) {
        version = 'v1';
      }
      
      // Determine resource name from path
      const resourceMatch = path.match(/\/v\d\/(?:[^/]+\/)?([^/{]+)/);
      const resource = resourceMatch ? resourceMatch[1] : null;
      
      // Check if path has UID parameter
      const hasUidParam = path.includes('{uid}') || path.includes('{id}');
      
      endpoints.push({
        domain,
        path,
        method: method.toUpperCase(),
        summary: operation.summary || '',
        description: operation.description || '',
        tags,
        version,
        resource,
        hasUidParam,
        tokenInfo,
        parameters: {
          path: pathParams,
          query: queryParams
        },
        requestSchema,
        responseSchema,
        responses, // Full responses object for status code validation
        security: operation.security || [],
        operationId: operation.operationId || null,
        deprecated: operation.deprecated || false
      });
    }
  }
  
  return endpoints;
}

/**
 * Load and parse all swagger files (sync)
 * @param {string} swaggerPath - Path to swagger directory
 * @returns {Object} { domains: Object, endpoints: Object[], byDomain: Object }
 */
function parseAllSwaggers(swaggerPath) {
  const swaggerFiles = loadSwaggerFiles(swaggerPath);
  
  const domains = {};
  const allEndpoints = [];
  const byDomain = {};
  
  for (const { domain, spec, filePath } of swaggerFiles) {
    domains[domain] = {
      title: spec.info?.title || domain,
      description: spec.info?.description || '',
      version: spec.info?.version || '',
      servers: spec.servers || [],
      filePath
    };
    
    const endpoints = extractEndpoints(spec, domain);
    allEndpoints.push(...endpoints);
    byDomain[domain] = endpoints;
  }
  
  return {
    domains,
    endpoints: allEndpoints,
    byDomain
  };
}

/**
 * Load and parse all swagger files with $ref dereferencing (async)
 * This resolves all $ref references inline so schemas can be validated without external refs
 * @param {string} swaggerPath - Path to swagger directory
 * @returns {Promise<Object>} { domains: Object, endpoints: Object[], byDomain: Object }
 */
async function parseAllSwaggersAsync(swaggerPath) {
  const swaggerFiles = await loadSwaggerFilesAsync(swaggerPath);
  
  const domains = {};
  const allEndpoints = [];
  const byDomain = {};
  
  for (const { domain, spec, filePath } of swaggerFiles) {
    domains[domain] = {
      title: spec.info?.title || domain,
      description: spec.info?.description || '',
      version: spec.info?.version || '',
      servers: spec.servers || [],
      filePath
    };
    
    const endpoints = extractEndpoints(spec, domain);
    allEndpoints.push(...endpoints);
    byDomain[domain] = endpoints;
  }
  
  return {
    domains,
    endpoints: allEndpoints,
    byDomain
  };
}

/**
 * Get endpoints grouped by domain
 * @param {Object[]} endpoints - Array of endpoints
 * @returns {Object} Endpoints grouped by domain
 */
function groupByDomain(endpoints) {
  const grouped = {};
  
  for (const endpoint of endpoints) {
    if (!grouped[endpoint.domain]) {
      grouped[endpoint.domain] = [];
    }
    grouped[endpoint.domain].push(endpoint);
  }
  
  return grouped;
}

/**
 * Get endpoints grouped by resource
 * @param {Object[]} endpoints - Array of endpoints
 * @returns {Object} Endpoints grouped by resource
 */
function groupByResource(endpoints) {
  const grouped = {};
  
  for (const endpoint of endpoints) {
    const key = `${endpoint.domain}/${endpoint.resource || 'unknown'}`;
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(endpoint);
  }
  
  return grouped;
}

/**
 * Filter endpoints by various criteria
 * @param {Object[]} endpoints - Array of endpoints
 * @param {Object} filters - Filter criteria
 * @returns {Object[]} Filtered endpoints
 */
function filterEndpoints(endpoints, filters = {}) {
  let filtered = [...endpoints];
  
  if (filters.domain) {
    filtered = filtered.filter(e => e.domain === filters.domain);
  }
  
  if (filters.method) {
    filtered = filtered.filter(e => e.method === filters.method.toUpperCase());
  }
  
  if (filters.version) {
    filtered = filtered.filter(e => e.version === filters.version);
  }
  
  if (filters.tokenType) {
    filtered = filtered.filter(e => 
      e.tokenInfo.tokens.includes(filters.tokenType)
    );
  }
  
  if (filters.hasTokenDoc !== undefined) {
    filtered = filtered.filter(e => e.tokenInfo.found === filters.hasTokenDoc);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(e => 
      e.path.toLowerCase().includes(searchLower) ||
      e.summary.toLowerCase().includes(searchLower) ||
      e.description.toLowerCase().includes(searchLower) ||
      e.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  }
  
  return filtered;
}

/**
 * Get statistics about parsed endpoints
 * @param {Object[]} endpoints - Array of endpoints
 * @returns {Object} Statistics object
 */
function getStatistics(endpoints) {
  const stats = {
    total: endpoints.length,
    byDomain: {},
    byMethod: {},
    byVersion: {},
    withTokenDoc: 0,
    withoutTokenDoc: 0,
    deprecated: 0
  };
  
  for (const endpoint of endpoints) {
    // By domain
    stats.byDomain[endpoint.domain] = (stats.byDomain[endpoint.domain] || 0) + 1;
    
    // By method
    stats.byMethod[endpoint.method] = (stats.byMethod[endpoint.method] || 0) + 1;
    
    // By version
    stats.byVersion[endpoint.version] = (stats.byVersion[endpoint.version] || 0) + 1;
    
    // Token documentation
    if (endpoint.tokenInfo.found) {
      stats.withTokenDoc++;
    } else {
      stats.withoutTokenDoc++;
    }
    
    // Deprecated
    if (endpoint.deprecated) {
      stats.deprecated++;
    }
  }
  
  return stats;
}

module.exports = {
  loadSwaggerFiles,
  loadSwaggerFilesAsync,
  extractEndpoints,
  parseAllSwaggers,
  parseAllSwaggersAsync,
  groupByDomain,
  groupByResource,
  filterEndpoints,
  getStatistics
};
