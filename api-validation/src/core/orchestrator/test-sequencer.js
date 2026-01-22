/**
 * Test Sequencer
 * Orders tests for proper execution (Create before Get) with UID sharing
 */

const { groupByResource, categorizeByOperation, identifyDependencies } = require('./resource-grouper');

// Standard CRUD execution order
const CRUD_ORDER = ['create', 'list', 'read', 'update', 'actions', 'delete'];

/**
 * Build test sequence for a resource group
 * Orders: POST (create) -> GET (list) -> GET (single) -> PUT (update) -> DELETE
 * @param {Object} resourceGroup - Resource group with categorized endpoints
 * @param {Object} options - Sequencing options
 * @returns {Object[]} Ordered array of test items
 */
function buildResourceSequence(resourceGroup, options = {}) {
  const { create, list, read, update, delete: deleteOps, actions } = resourceGroup.operations;
  const sequence = [];
  
  // Determine if we need UID from create
  const needsUid = read.length > 0 || update.length > 0 || deleteOps.length > 0;
  
  // 1. Create operations first (to get UID)
  for (const endpoint of create) {
    sequence.push({
      endpoint,
      phase: 'create',
      captureUid: needsUid,
      requiresUid: false,
      order: 1
    });
  }
  
  // 2. List operations (verify created item exists)
  for (const endpoint of list) {
    sequence.push({
      endpoint,
      phase: 'list',
      captureUid: false,
      requiresUid: false,
      order: 2
    });
  }
  
  // 3. Read single item (using captured UID)
  for (const endpoint of read) {
    sequence.push({
      endpoint,
      phase: 'read',
      captureUid: false,
      requiresUid: true,
      order: 3
    });
  }
  
  // 4. Update operations
  for (const endpoint of update) {
    sequence.push({
      endpoint,
      phase: 'update',
      captureUid: false,
      requiresUid: true,
      order: 4
    });
  }
  
  // 5. Action operations (custom POST endpoints)
  for (const endpoint of actions) {
    sequence.push({
      endpoint,
      phase: 'action',
      captureUid: false,
      requiresUid: endpoint.path.includes('{uid}') || endpoint.path.includes('{id}'),
      order: 5
    });
  }
  
  // 6. Delete operations (if enabled)
  if (options.runDelete) {
    for (const endpoint of deleteOps) {
      sequence.push({
        endpoint,
        phase: 'delete',
        captureUid: false,
        requiresUid: true,
        order: 6
      });
    }
  } else {
    // Mark delete operations as skipped
    for (const endpoint of deleteOps) {
      sequence.push({
        endpoint,
        phase: 'delete',
        captureUid: false,
        requiresUid: true,
        order: 6,
        skip: true,
        skipReason: 'Delete operations disabled by configuration'
      });
    }
  }
  
  return sequence;
}

/**
 * Build complete test sequence from endpoints
 * @param {Object[]} endpoints - Array of endpoint objects
 * @param {Object} options - Sequencing options
 * @returns {Object} { sequence: [], resourceGroups: {} }
 */
function buildTestSequence(endpoints, options = {}) {
  // Group endpoints by resource
  const resourceGroups = groupByResource(endpoints);
  
  // Build sequence for each resource
  const allSequences = {};
  const flatSequence = [];
  
  for (const [key, group] of Object.entries(resourceGroups)) {
    // Categorize endpoints by CRUD operation
    const operations = categorizeByOperation(group.endpoints);
    
    // Build sequence for this resource
    const sequence = buildResourceSequence({
      ...group,
      operations
    }, options);
    
    allSequences[key] = {
      ...group,
      operations,
      sequence
    };
    
    // Add to flat sequence with resource context
    for (const item of sequence) {
      flatSequence.push({
        ...item,
        resourceKey: key,
        resource: group.resource,
        domain: group.domain
      });
    }
  }
  
  // Sort flat sequence by order (maintains CRUD ordering across resources)
  flatSequence.sort((a, b) => {
    // Primary sort by order
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    // Secondary sort by resource key for consistency
    return a.resourceKey.localeCompare(b.resourceKey);
  });
  
  return {
    sequence: flatSequence,
    resourceGroups: allSequences
  };
}

/**
 * Build test sequence respecting resource dependencies
 * @param {Object[]} endpoints - Array of endpoint objects
 * @param {Object} options - Sequencing options
 * @returns {Object[]} Ordered test sequence
 */
function buildDependencyAwareSequence(endpoints, options = {}) {
  const { sequence, resourceGroups } = buildTestSequence(endpoints, options);
  const dependencies = identifyDependencies(endpoints);
  
  // Topological sort resources based on dependencies
  const sortedResources = topologicalSort(Object.keys(resourceGroups), dependencies);
  
  // Rebuild sequence in dependency order
  const orderedSequence = [];
  
  for (const resourceKey of sortedResources) {
    const group = resourceGroups[resourceKey];
    if (group) {
      for (const item of group.sequence) {
        orderedSequence.push({
          ...item,
          resourceKey,
          resource: group.resource,
          domain: group.domain
        });
      }
    }
  }
  
  return orderedSequence;
}

/**
 * Topological sort for resource dependencies
 * @param {string[]} nodes - Resource keys
 * @param {Object} dependencies - Dependency map
 * @returns {string[]} Sorted resource keys
 */
function topologicalSort(nodes, dependencies) {
  const visited = new Set();
  const result = [];
  
  function visit(node) {
    if (visited.has(node)) return;
    visited.add(node);
    
    const deps = dependencies[node] || [];
    for (const dep of deps) {
      if (nodes.includes(dep)) {
        visit(dep);
      }
    }
    
    result.push(node);
  }
  
  for (const node of nodes) {
    visit(node);
  }
  
  return result;
}

/**
 * Filter sequence for selected endpoints only
 * @param {Object[]} fullSequence - Complete test sequence
 * @param {Object[]} selectedEndpoints - Array of { path, method } objects
 * @returns {Object[]} Filtered sequence maintaining order
 */
function filterSequence(fullSequence, selectedEndpoints) {
  const selected = new Set(
    selectedEndpoints.map(e => `${e.method.toUpperCase()} ${e.path}`)
  );
  
  return fullSequence.filter(item => 
    selected.has(`${item.endpoint.method} ${item.endpoint.path}`)
  );
}

/**
 * Create a test context for sharing UIDs and parameters between tests
 * @returns {Object} Test context object
 */
function createTestContext() {
  const uidMap = {};
  const paramMap = {};
  
  return {
    /**
     * Store a captured UID for a resource
     * @param {string} resourceKey - Resource identifier
     * @param {string} uid - Captured UID
     */
    setUid(resourceKey, uid) {
      uidMap[resourceKey] = uid;
    },
    
    /**
     * Get UID for a resource
     * @param {string} resourceKey - Resource identifier
     * @returns {string|null} UID or null
     */
    getUid(resourceKey) {
      return uidMap[resourceKey] || null;
    },
    
    /**
     * Check if UID exists for resource
     * @param {string} resourceKey - Resource identifier
     * @returns {boolean}
     */
    hasUid(resourceKey) {
      return !!uidMap[resourceKey];
    },
    
    /**
     * Get all stored UIDs
     * @returns {Object} UID map
     */
    getAllUids() {
      return { ...uidMap };
    },
    
    /**
     * Store a resolved parameter
     * @param {string} paramName - Parameter name (e.g., 'client_uid')
     * @param {string} value - Parameter value
     */
    setParam(paramName, value) {
      paramMap[paramName] = value;
    },
    
    /**
     * Get a resolved parameter
     * @param {string} paramName - Parameter name
     * @returns {string|null} Parameter value or null
     */
    getParam(paramName) {
      return paramMap[paramName] || null;
    },
    
    /**
     * Get all resolved parameters
     * @returns {Object} Parameter map
     */
    getParams() {
      return { ...paramMap };
    },
    
    /**
     * Set multiple resolved parameters at once
     * @param {Object} params - Object of param name -> value pairs
     */
    setParams(params) {
      for (const [key, value] of Object.entries(params)) {
        paramMap[key] = value;
      }
    },
    
    /**
     * Check if a parameter is resolved
     * @param {string} paramName - Parameter name
     * @returns {boolean}
     */
    hasParam(paramName) {
      return !!paramMap[paramName];
    },
    
    /**
     * Clear all UIDs and params
     */
    clear() {
      for (const key of Object.keys(uidMap)) {
        delete uidMap[key];
      }
      for (const key of Object.keys(paramMap)) {
        delete paramMap[key];
      }
    }
  };
}

/**
 * Substitute path parameters with actual values
 * @param {string} path - Path template with {uid} etc.
 * @param {Object} params - Parameter values
 * @returns {string} Path with substituted values
 */
function substitutePath(path, params) {
  let result = path;
  
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  
  return result;
}

module.exports = {
  buildResourceSequence,
  buildTestSequence,
  buildDependencyAwareSequence,
  filterSequence,
  createTestContext,
  substitutePath,
  CRUD_ORDER
};
