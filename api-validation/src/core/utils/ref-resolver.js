/**
 * Reference Resolver
 * Resolves $ref URLs to their actual schemas
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Cache for resolved schemas
const schemaCache = new Map();

/**
 * Fetch a remote schema
 * @param {string} url - URL to fetch
 * @returns {Promise<Object>} Parsed JSON schema
 */
function fetchRemoteSchema(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // Follow redirect
        return fetchRemoteSchema(res.headers.location).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Load a local schema file
 * @param {string} filePath - Path to schema file
 * @returns {Object} Parsed JSON schema
 */
function loadLocalSchema(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Resolve a $ref to its schema
 * @param {string} ref - Reference URL or path
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Promise<Object>} Resolved schema
 */
async function resolveRef(ref, baseDir = null) {
  // Check cache first
  if (schemaCache.has(ref)) {
    return schemaCache.get(ref);
  }
  
  let schema;
  
  if (ref.startsWith('http://') || ref.startsWith('https://')) {
    // Remote URL
    schema = await fetchRemoteSchema(ref);
  } else if (ref.startsWith('#/')) {
    // Local reference within same document - return as-is for now
    return { $ref: ref };
  } else {
    // Local file path
    const fullPath = baseDir ? path.resolve(baseDir, ref) : ref;
    schema = loadLocalSchema(fullPath);
  }
  
  // Cache the result
  schemaCache.set(ref, schema);
  
  return schema;
}

/**
 * Resolve all $refs in a schema recursively
 * @param {Object} schema - Schema with potential $refs
 * @param {string} baseDir - Base directory for relative paths
 * @param {Set} visited - Set of visited refs to prevent infinite loops
 * @returns {Promise<Object>} Resolved schema
 */
async function resolveAllRefs(schema, baseDir = null, visited = new Set()) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  
  // Handle array
  if (Array.isArray(schema)) {
    return Promise.all(schema.map(item => resolveAllRefs(item, baseDir, visited)));
  }
  
  // Handle $ref
  if (schema.$ref) {
    const ref = schema.$ref;
    
    // Skip local references and already visited refs
    if (ref.startsWith('#/') || visited.has(ref)) {
      return schema;
    }
    
    visited.add(ref);
    
    try {
      const resolved = await resolveRef(ref, baseDir);
      // Recursively resolve any nested refs
      return resolveAllRefs(resolved, baseDir, visited);
    } catch (error) {
      // Return the original ref with an error marker
      return {
        ...schema,
        _resolveError: error.message
      };
    }
  }
  
  // Handle object - resolve each property
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = await resolveAllRefs(value, baseDir, visited);
  }
  
  return result;
}

/**
 * Build a complete schema by resolving allOf compositions
 * @param {Object} schema - Schema potentially containing allOf
 * @returns {Object} Merged schema
 */
function mergeAllOf(schema) {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }
  
  if (Array.isArray(schema)) {
    return schema.map(mergeAllOf);
  }
  
  // Handle allOf
  if (schema.allOf && Array.isArray(schema.allOf)) {
    let merged = {};
    
    for (const subSchema of schema.allOf) {
      const resolved = mergeAllOf(subSchema);
      merged = mergeSchemas(merged, resolved);
    }
    
    // Include any other properties from the original schema
    for (const [key, value] of Object.entries(schema)) {
      if (key !== 'allOf') {
        merged[key] = mergeAllOf(value);
      }
    }
    
    return merged;
  }
  
  // Recursively process object properties
  const result = {};
  for (const [key, value] of Object.entries(schema)) {
    result[key] = mergeAllOf(value);
  }
  
  return result;
}

/**
 * Merge two schemas together
 * @param {Object} base - Base schema
 * @param {Object} extension - Schema to merge in
 * @returns {Object} Merged schema
 */
function mergeSchemas(base, extension) {
  const result = { ...base };
  
  for (const [key, value] of Object.entries(extension)) {
    if (key === 'properties' && result.properties) {
      result.properties = { ...result.properties, ...value };
    } else if (key === 'required' && result.required) {
      result.required = [...new Set([...result.required, ...value])];
    } else if (typeof value === 'object' && !Array.isArray(value) && result[key]) {
      result[key] = mergeSchemas(result[key], value);
    } else {
      result[key] = value;
    }
  }
  
  return result;
}

/**
 * Extract all external refs from a schema
 * @param {Object} schema - Schema to scan
 * @param {Set} refs - Set to collect refs
 * @returns {Set} Set of external refs
 */
function collectExternalRefs(schema, refs = new Set()) {
  if (!schema || typeof schema !== 'object') {
    return refs;
  }
  
  if (Array.isArray(schema)) {
    for (const item of schema) {
      collectExternalRefs(item, refs);
    }
    return refs;
  }
  
  if (schema.$ref && !schema.$ref.startsWith('#/')) {
    refs.add(schema.$ref);
  }
  
  for (const value of Object.values(schema)) {
    collectExternalRefs(value, refs);
  }
  
  return refs;
}

/**
 * Clear the schema cache
 */
function clearCache() {
  schemaCache.clear();
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
function getCacheStats() {
  return {
    size: schemaCache.size,
    keys: Array.from(schemaCache.keys())
  };
}

module.exports = {
  resolveRef,
  resolveAllRefs,
  mergeAllOf,
  mergeSchemas,
  collectExternalRefs,
  clearCache,
  getCacheStats,
  fetchRemoteSchema,
  loadLocalSchema
};
