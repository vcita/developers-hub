/**
 * JSONPath Extractor
 * 
 * Extracts values from JSON responses using JSONPath-like expressions.
 * Uses a simple implementation to avoid external dependencies.
 */

/**
 * Execute a JSONPath query on data
 * Supports:
 * - $.data.field - Simple path navigation
 * - $.data.array[0] - Array index access
 * - $.data.array[?(@.type=='value')] - Filter by property
 * 
 * @param {Object} data - The data to query
 * @param {string} path - JSONPath expression
 * @returns {*} The extracted value or undefined
 */
function query(data, path) {
  if (!path || !path.startsWith('$')) {
    return undefined;
  }
  
  // Remove the leading $
  let expression = path.slice(1);
  let current = data;
  
  // Split by . but preserve array accessors
  const parts = [];
  let buffer = '';
  let depth = 0;
  
  for (const char of expression) {
    if (char === '[') {
      depth++;
      buffer += char;
    } else if (char === ']') {
      depth--;
      buffer += char;
    } else if (char === '.' && depth === 0) {
      if (buffer) parts.push(buffer);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  if (buffer) parts.push(buffer);
  
  // Navigate through each part
  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }
    
    // Check for array filter: [?(@.type=='value')]
    const filterMatch = part.match(/^(\w+)\[\?\(@\.(\w+)==['"](.*)['"]\)\]$/);
    if (filterMatch) {
      const [, arrayName, filterProp, filterValue] = filterMatch;
      const array = current[arrayName];
      if (!Array.isArray(array)) {
        return undefined;
      }
      // Find first matching item
      current = array.find(item => item && item[filterProp] === filterValue);
      continue;
    }
    
    // Check for simple array index: array[0]
    const indexMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (indexMatch) {
      const [, arrayName, index] = indexMatch;
      const array = current[arrayName];
      if (!Array.isArray(array)) {
        return undefined;
      }
      current = array[parseInt(index, 10)];
      continue;
    }
    
    // Check for filter on current array: [?(@.type=='value')]
    const directFilterMatch = part.match(/^\[\?\(@\.(\w+)==['"](.*)['"]\)\]$/);
    if (directFilterMatch) {
      const [, filterProp, filterValue] = directFilterMatch;
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current.find(item => item && item[filterProp] === filterValue);
      continue;
    }
    
    // Check for simple index on current: [0]
    const directIndexMatch = part.match(/^\[(\d+)\]$/);
    if (directIndexMatch) {
      const index = parseInt(directIndexMatch[1], 10);
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    
    // Simple property access
    current = current[part];
  }
  
  return current;
}

/**
 * Extract multiple values from data using JSONPath expressions
 * 
 * @param {Object} data - The data to extract from
 * @param {Object} expressions - Object mapping variable names to JSONPath expressions
 * @returns {Object} Object with extracted values
 * 
 * @example
 * const result = extract(response, {
 *   service_id: "$.data.services[0].id",
 *   service_type: "$.data.services[?(@.type=='AppointmentService')].type"
 * });
 */
function extract(data, expressions) {
  if (!expressions || typeof expressions !== 'object') {
    return {};
  }
  
  const result = {};
  for (const [key, path] of Object.entries(expressions)) {
    const value = query(data, path);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Navigate nested arrays with filters
 * Handles complex paths like: $.data.sections[?(@.type=='fields')].fields[?(@.type=='firstname')].id
 * 
 * @param {Object} data - The data to query
 * @param {string} path - Complex JSONPath with nested filters
 * @returns {*} The extracted value
 */
function queryNested(data, path) {
  if (!path || !path.startsWith('$')) {
    return undefined;
  }
  
  // Handle the special case of nested filtered arrays
  // $.data.sections[?(@.type=='fields')].fields[?(@.type=='firstname')].id
  
  let current = data;
  const segments = parseNestedPath(path.slice(1)); // Remove leading $
  
  for (const segment of segments) {
    if (current === undefined || current === null) {
      return undefined;
    }
    
    if (segment.type === 'property') {
      current = current[segment.name];
    } else if (segment.type === 'index') {
      if (Array.isArray(current)) {
        current = current[segment.index];
      } else if (current[segment.arrayName]) {
        current = current[segment.arrayName][segment.index];
      } else {
        return undefined;
      }
    } else if (segment.type === 'filter') {
      const array = segment.arrayName ? current[segment.arrayName] : current;
      if (!Array.isArray(array)) {
        // If it's an array of arrays (like fields), flatten and search
        if (Array.isArray(current)) {
          const flattened = current.flat();
          current = flattened.find(item => item && item[segment.filterProp] === segment.filterValue);
        } else {
          return undefined;
        }
      } else {
        // Check if array contains arrays (nested arrays)
        const flatArray = array.flat();
        current = flatArray.find(item => item && item[segment.filterProp] === segment.filterValue);
      }
    }
  }
  
  return current;
}

/**
 * Parse a complex JSONPath into segments
 */
function parseNestedPath(path) {
  const segments = [];
  let remaining = path;
  
  while (remaining.length > 0) {
    // Remove leading dot
    if (remaining.startsWith('.')) {
      remaining = remaining.slice(1);
    }
    
    // Check for filter: arrayName[?(@.prop=='value')] or [?(@.prop=='value')]
    const filterMatch = remaining.match(/^(\w+)?\[\?\(@\.(\w+)==['"](.*?)['"]\)\]/);
    if (filterMatch) {
      const [fullMatch, arrayName, filterProp, filterValue] = filterMatch;
      segments.push({
        type: 'filter',
        arrayName: arrayName || null,
        filterProp,
        filterValue
      });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }
    
    // Check for index: arrayName[0] or [0]
    const indexMatch = remaining.match(/^(\w+)?\[(\d+)\]/);
    if (indexMatch) {
      const [fullMatch, arrayName, index] = indexMatch;
      segments.push({
        type: 'index',
        arrayName: arrayName || null,
        index: parseInt(index, 10)
      });
      remaining = remaining.slice(fullMatch.length);
      continue;
    }
    
    // Simple property
    const propMatch = remaining.match(/^(\w+)/);
    if (propMatch) {
      segments.push({
        type: 'property',
        name: propMatch[1]
      });
      remaining = remaining.slice(propMatch[1].length);
      continue;
    }
    
    // Shouldn't reach here, but break to avoid infinite loop
    break;
  }
  
  return segments;
}

module.exports = {
  query,
  queryNested,
  extract
};
