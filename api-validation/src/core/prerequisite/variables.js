/**
 * Variable Resolver
 * 
 * Handles variable substitution in workflow templates.
 * Variables use the format: {{variable_name}}
 */

/**
 * Built-in variable generators
 */
const BUILT_IN_GENERATORS = {
  // Generate a random first name
  random_firstname: () => 'APITest',
  
  // Generate a random last name
  random_lastname: () => 'User',
  
  // Generate a random email with timestamp for uniqueness
  random_email: () => `apitest_${Date.now()}@example.com`,
  
  // Generate a datetime 24 hours in the future
  future_datetime: () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return future.toISOString();
  },
  
  // Generate a datetime 48 hours in the future (for longer scheduling)
  future_datetime_48h: () => {
    const future = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return future.toISOString();
  },
  
  // Generate a unique ID based on timestamp
  unique_id: () => String(Date.now()),
  
  // Generate a random phone number
  random_phone: () => `+1555${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
  
  // Generate current timestamp
  timestamp: () => String(Date.now()),
  
  // Generate current ISO date
  current_date: () => new Date().toISOString().split('T')[0],
  
  // Generate a random string for testing
  random_string: () => `test_${Math.random().toString(36).substring(2, 10)}`,
  
  // Generate a random number
  random_number: () => String(Math.floor(Math.random() * 10000)),
  
  // Generate a random address
  random_address: () => `${Math.floor(Math.random() * 9999)} Test Street`,
  
  // Generate a random URL
  random_url: () => `https://test-${Date.now()}.example.com`
};

/**
 * Resolve a single string template with variables
 * 
 * @param {string} template - String with {{variable}} placeholders
 * @param {Object} context - Variable values from config and previous steps
 * @returns {string} Resolved string
 * 
 * @example
 * resolve("Hello {{name}}", { name: "World" }) // "Hello World"
 * resolve("Email: {{random_email}}", {}) // "Email: apitest_1234567890@example.com"
 */
function resolve(template, context = {}) {
  if (typeof template !== 'string') {
    return template;
  }
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // Check context first (allows overriding built-ins)
    if (context[key] !== undefined) {
      return String(context[key]);
    }
    
    // Check built-in generators
    if (BUILT_IN_GENERATORS[key]) {
      return BUILT_IN_GENERATORS[key]();
    }
    
    // Return original placeholder if not found (for debugging)
    console.warn(`  [WARN] Unresolved variable: ${key}`);
    return match;
  });
}

/**
 * Recursively resolve all variables in an object
 * 
 * @param {Object|Array|string} obj - Object to resolve
 * @param {Object} context - Variable values
 * @returns {Object|Array|string} Resolved object
 */
function resolveObject(obj, context = {}) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return resolve(obj, context);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => resolveObject(item, context));
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Keys can also contain variables (for dynamic field IDs)
      const resolvedKey = resolve(key, context);
      result[resolvedKey] = resolveObject(value, context);
    }
    return result;
  }
  
  return obj;
}

/**
 * Check if a string contains unresolved variables
 * 
 * @param {string} str - String to check
 * @returns {string[]} Array of unresolved variable names
 */
function findUnresolved(str) {
  if (typeof str !== 'string') {
    return [];
  }
  
  const matches = str.match(/\{\{(\w+)\}\}/g) || [];
  return matches.map(m => m.slice(2, -2));
}

/**
 * Check if an object has any unresolved variables
 * 
 * @param {Object} obj - Object to check
 * @param {Object} context - Current context to check against
 * @returns {string[]} Array of unresolved variable names (excluding built-ins and context)
 */
function findAllUnresolved(obj, context = {}) {
  const unresolved = new Set();
  
  function traverse(value) {
    if (typeof value === 'string') {
      const vars = findUnresolved(value);
      vars.forEach(v => {
        // Only flag as unresolved if not in context and not a built-in
        if (context[v] === undefined && !BUILT_IN_GENERATORS[v]) {
          unresolved.add(v);
        }
      });
    } else if (Array.isArray(value)) {
      value.forEach(traverse);
    } else if (value && typeof value === 'object') {
      Object.keys(value).forEach(k => {
        findUnresolved(k).forEach(v => {
          if (context[v] === undefined && !BUILT_IN_GENERATORS[v]) {
            unresolved.add(v);
          }
        });
        traverse(value[k]);
      });
    }
  }
  
  traverse(obj);
  return [...unresolved];
}

/**
 * List all available built-in variables
 * 
 * @returns {string[]} Array of built-in variable names
 */
function listBuiltIns() {
  return Object.keys(BUILT_IN_GENERATORS);
}

/**
 * Add a custom variable generator
 * 
 * @param {string} name - Variable name
 * @param {Function} generator - Function that returns the value
 */
function addGenerator(name, generator) {
  if (typeof generator === 'function') {
    BUILT_IN_GENERATORS[name] = generator;
  }
}

module.exports = {
  resolve,
  resolveObject,
  findUnresolved,
  findAllUnresolved,
  listBuiltIns,
  addGenerator,
  BUILT_IN_GENERATORS
};
