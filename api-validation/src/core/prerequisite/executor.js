/**
 * Prerequisite Executor
 * 
 * Executes workflow prerequisites deterministically before running the main test.
 * Prerequisites are executed sequentially, extracting variables along the way.
 */

const { query, queryNested, extract } = require('./jsonpath');
const { resolve, resolveObject, findAllUnresolved } = require('./variables');

/**
 * Generate dynamic date variables for workflows
 * These are computed at runtime so they never expire
 * 
 * @returns {Object} Object with date variables
 */
function getDynamicDateVariables() {
  const now = new Date();
  
  // Helper to format date as YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  // Helper to format datetime as ISO 8601
  const formatDateTime = (date) => date.toISOString();
  
  // Today
  const today = new Date(now);
  
  // Tomorrow at 17:00 UTC (noon EST, 9am PST) - a time likely to be available
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setUTCHours(17, 0, 0, 0); // Set to 17:00:00.000 UTC for scheduling
  
  // Next week (7 days from now) at 17:00 UTC
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setUTCHours(17, 0, 0, 0); // Set to 17:00:00.000 UTC for scheduling
  
  // Next month
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  // Yesterday (for testing historical queries)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Start of current month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // End of current month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    // Date strings (YYYY-MM-DD format)
    today_date: formatDate(today),
    tomorrow_date: formatDate(tomorrow),
    next_week_date: formatDate(nextWeek),
    next_month_date: formatDate(nextMonth),
    yesterday_date: formatDate(yesterday),
    start_of_month_date: formatDate(startOfMonth),
    end_of_month_date: formatDate(endOfMonth),
    
    // ISO 8601 datetime strings
    now_datetime: formatDateTime(now),
    tomorrow_datetime: formatDateTime(tomorrow),
    next_week_datetime: formatDateTime(nextWeek),
    
    // Unix timestamps (seconds)
    now_timestamp: Math.floor(now.getTime() / 1000),
    tomorrow_timestamp: Math.floor(tomorrow.getTime() / 1000),
    
    // Year/Month for filtering
    current_year: now.getFullYear().toString(),
    current_month: String(now.getMonth() + 1).padStart(2, '0')
  };
}

/**
 * Execute a single prerequisite step
 * 
 * @param {Object} step - The step to execute
 * @param {Object} context - Current context with resolved variables
 * @param {Object} config - Configuration with tokens and baseUrl
 * @param {Function} makeRequest - Function to make HTTP requests
 * @returns {Promise<Object>} Result of the step execution
 */
async function executeStep(step, context, config, makeRequest) {
  const { id, method, path, params, body, extract: extractConfig, expect, onFail, token } = step;
  
  // Resolve variables in path, params, and body
  const resolvedPath = resolve(path, context);
  const resolvedParams = resolveObject(params || {}, context);
  const resolvedBody = resolveObject(body || {}, context);
  
  // Check for unresolved variables
  const unresolved = findAllUnresolved({ path: resolvedPath, params: resolvedParams, body: resolvedBody }, context);
  if (unresolved.length > 0) {
    console.log(`  [WARN] Step ${id}: Unresolved variables: ${unresolved.join(', ')}`);
  }
  
  // Determine which token to use
  const tokenType = token || 'staff';
  const authToken = config.tokens?.[tokenType];
  
  if (!authToken) {
    return {
      success: false,
      stepId: id,
      error: `No ${tokenType} token available`,
      onFail: onFail || 'abort'
    };
  }
  
  // Build the request
  const requestConfig = {
    method,
    path: resolvedPath,
    params: Object.keys(resolvedParams).length > 0 ? resolvedParams : undefined,
    body: Object.keys(resolvedBody).length > 0 ? resolvedBody : undefined,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };
  
  console.log(`  [${id}] ${method} ${resolvedPath}`);
  
  try {
    // Execute the request
    const response = await makeRequest(requestConfig, config);
    
    // Check expected status
    const expectedStatus = expect?.status || 200;
    const statusOk = Array.isArray(expectedStatus)
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;
    
    if (!statusOk) {
      const errorMsg = response.data?.message || response.data?.error || `Unexpected status ${response.status}`;
      console.log(`    ✗ Expected ${JSON.stringify(expectedStatus)}, got ${response.status}: ${errorMsg}`);
      
      return {
        success: false,
        stepId: id,
        status: response.status,
        error: errorMsg,
        response: response.data,
        onFail: onFail || 'abort'
      };
    }
    
    console.log(`    ✓ Status ${response.status}`);
    
    // Extract values from response
    const extracted = {};
    if (extractConfig && Object.keys(extractConfig).length > 0) {
      for (const [key, jsonPath] of Object.entries(extractConfig)) {
        // Try nested query first (for complex paths)
        let value = queryNested(response.data, jsonPath);
        
        // Fall back to simple query
        if (value === undefined) {
          value = query(response.data, jsonPath);
        }
        
        if (value !== undefined) {
          extracted[key] = value;
          console.log(`    → ${key}: ${JSON.stringify(value).substring(0, 100)}`);
        } else {
          console.log(`    → ${key}: [NOT FOUND] (path: ${jsonPath})`);
        }
      }
    }
    
    return {
      success: true,
      stepId: id,
      status: response.status,
      extracted,
      response: response.data
    };
    
  } catch (error) {
    console.log(`    ✗ Error: ${error.message}`);
    return {
      success: false,
      stepId: id,
      error: error.message,
      onFail: onFail || 'abort'
    };
  }
}

/**
 * Execute all prerequisites for a workflow
 * 
 * @param {Object} workflow - The workflow object with prerequisites
 * @param {Object} config - Configuration with tokens, params, and baseUrl
 * @param {Function} makeRequest - Function to make HTTP requests
 * @returns {Promise<Object>} Result containing success status, extracted variables, and any errors
 */
async function executePrerequisites(workflow, config, makeRequest) {
  const prerequisites = workflow.prerequisites?.steps || [];
  
  if (prerequisites.length === 0) {
    console.log('  No prerequisites defined');
    return {
      success: true,
      variables: { ...config.params },
      steps: []
    };
  }
  
  console.log(`\n📋 Executing ${prerequisites.length} prerequisite(s)...`);
  
  // Initialize context with config params and dynamic date variables
  const context = { 
    ...config.params,
    ...getDynamicDateVariables()
  };
  const results = [];
  
  for (const step of prerequisites) {
    const result = await executeStep(step, context, config, makeRequest);
    results.push(result);
    
    if (result.success) {
      // Merge extracted values into context
      Object.assign(context, result.extracted || {});
    } else {
      // Handle failure based on onFail strategy
      if (result.onFail === 'abort') {
        console.log(`\n  ⛔ Prerequisite '${result.stepId}' failed - aborting workflow`);
        return {
          success: false,
          failed: true,
          failedStep: result.stepId,
          failedReason: result.error,
          variables: context,
          steps: results
        };
      } else if (result.onFail === 'skip') {
        console.log(`  ⚠ Prerequisite '${result.stepId}' failed - skipping (onFail: skip)`);
        continue;
      } else if (result.onFail === 'warn') {
        console.log(`  ⚠ Prerequisite '${result.stepId}' failed - continuing with warning`);
        continue;
      }
    }
  }
  
  console.log(`\n✓ All prerequisites completed successfully`);
  console.log(`  Variables available: ${Object.keys(context).join(', ')}`);
  
  return {
    success: true,
    failed: false,
    variables: context,
    steps: results
  };
}

/**
 * Create a default HTTP request function using axios
 * Falls back to native http/https if axios not available
 * 
 * @param {string} baseUrl - Base URL for requests
 * @returns {Function} Request function
 */
function createRequestFunction(baseUrl) {
  // Try to use axios if available
  try {
    const axios = require('axios');
    
    return async (requestConfig, config) => {
      const url = `${config.baseUrl || baseUrl}${requestConfig.path}`;
      
      const axiosConfig = {
        method: requestConfig.method,
        url,
        headers: requestConfig.headers,
        validateStatus: () => true // Don't throw on any status
      };
      
      // Add query params for GET requests
      if (requestConfig.method === 'GET' && requestConfig.params) {
        axiosConfig.params = requestConfig.params;
      }
      
      // Add body for non-GET requests
      if (requestConfig.method !== 'GET' && requestConfig.body) {
        axiosConfig.data = requestConfig.body;
      }
      
      const response = await axios(axiosConfig);
      return {
        status: response.status,
        data: response.data
      };
    };
  } catch (e) {
    // Fall back to native http/https
    const https = require('https');
    const http = require('http');
    
    return async (requestConfig, config) => {
      return new Promise((resolve, reject) => {
        const url = new URL(`${config.baseUrl || baseUrl}${requestConfig.path}`);
        
        // Add query params
        if (requestConfig.params) {
          for (const [key, value] of Object.entries(requestConfig.params)) {
            url.searchParams.append(key, value);
          }
        }
        
        const protocol = url.protocol === 'https:' ? https : http;
        
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname + url.search,
          method: requestConfig.method,
          headers: requestConfig.headers
        };
        
        const req = protocol.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve({
                status: res.statusCode,
                data: JSON.parse(data)
              });
            } catch (e) {
              resolve({
                status: res.statusCode,
                data: data
              });
            }
          });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        if (requestConfig.body && requestConfig.method !== 'GET') {
          req.write(JSON.stringify(requestConfig.body));
        }
        
        req.end();
      });
    };
  }
}

/**
 * Parse YAML-like prerequisite content from markdown
 * 
 * @param {string} yamlContent - YAML content as string
 * @returns {Object} Parsed steps
 */
function parseYamlSteps(yamlContent) {
  const lines = yamlContent.split('\n');
  const result = { steps: [] };
  let currentStep = null;
  let inSection = null; // 'extract', 'params', 'body', 'expect'
  let bodyLines = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    const indent = line.search(/\S/);
    
    // Check for new step
    if (trimmed.startsWith('- id:')) {
      if (currentStep) {
        if (bodyLines.length > 0) {
          currentStep.body = parseSimpleYaml(bodyLines.join('\n'));
          bodyLines = [];
        }
        result.steps.push(currentStep);
      }
      currentStep = { id: trimmed.split(':')[1].trim() };
      inSection = null;
      continue;
    }
    
    if (!currentStep) continue;
    
    // Parse step properties
    if (trimmed.startsWith('description:')) {
      currentStep.description = trimmed.split(':').slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      inSection = null;
    } else if (trimmed.startsWith('method:')) {
      currentStep.method = trimmed.split(':')[1].trim();
      inSection = null;
    } else if (trimmed.startsWith('path:')) {
      currentStep.path = trimmed.split(':').slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      inSection = null;
    } else if (trimmed.startsWith('token:')) {
      currentStep.token = trimmed.split(':')[1].trim();
      inSection = null;
    } else if (trimmed.startsWith('onFail:')) {
      currentStep.onFail = trimmed.split(':')[1].trim();
      inSection = null;
    } else if (trimmed === 'extract:' && inSection !== 'expect') {
      currentStep.extract = {};
      inSection = 'extract';
    } else if (trimmed === 'params:' && inSection !== 'expect') {
      currentStep.params = {};
      inSection = 'params';
    } else if (trimmed === 'body:' && inSection !== 'expect') {
      // Only start body section if not inside expect (expect can have its own body assertions)
      currentStep.body = {};
      inSection = 'body';
      bodyLines = [];
    } else if (trimmed === 'expect:') {
      currentStep.expect = {};
      inSection = 'expect';
    } else if (inSection && indent > 4) {
      const match = trimmed.match(/^["']?([^"':]+)["']?:\s*["']?(.+?)["']?$/);
      if (match) {
        let [, key, value] = match;
        value = value.replace(/^["']|["']$/g, '');
        
        // Parse arrays like [200, 201]
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => {
            const trimmedV = v.trim();
            return !isNaN(parseInt(trimmedV, 10)) ? parseInt(trimmedV, 10) : trimmedV;
          });
        } else if (!isNaN(parseInt(value, 10))) {
          value = parseInt(value, 10);
        }
        
        if (inSection === 'body') {
          bodyLines.push(line);
        } else {
          currentStep[inSection][key] = value;
        }
      } else if (inSection === 'body') {
        bodyLines.push(line);
      }
    }
  }
  
  // Add last step
  if (currentStep) {
    if (bodyLines.length > 0) {
      currentStep.body = parseSimpleYaml(bodyLines.join('\n'));
    }
    result.steps.push(currentStep);
  }
  
  return result;
}

/**
 * Parse simple YAML key-value pairs
 */
function parseSimpleYaml(content) {
  const result = {};
  const lines = content.split('\n');
  const stack = [{ obj: result, indent: -1 }];
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    
    // Get indentation level
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    
    // Pop stack until we find parent with smaller indent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parent = stack[stack.length - 1].obj;
    
    // Parse key: value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = trimmed.substring(0, colonIdx).replace(/^["']|["']$/g, '').trim();
    const valueStr = trimmed.substring(colonIdx + 1).trim();
    
    if (valueStr === '' || valueStr === '{}' || valueStr === '[]') {
      // Empty object or array - create nested structure
      const newObj = valueStr === '[]' ? [] : {};
      parent[key] = newObj;
      stack.push({ obj: newObj, indent: indent, key: key });
    } else if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
      // Inline JSON object
      try {
        parent[key] = JSON.parse(valueStr);
      } catch (e) {
        parent[key] = valueStr;
      }
    } else if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      // Inline JSON array
      try {
        parent[key] = JSON.parse(valueStr);
      } catch (e) {
        parent[key] = valueStr;
      }
    } else if (valueStr === 'null') {
      parent[key] = null;
    } else if (valueStr === 'true') {
      parent[key] = true;
    } else if (valueStr === 'false') {
      parent[key] = false;
    } else if (/^-?\d+$/.test(valueStr)) {
      parent[key] = parseInt(valueStr, 10);
    } else if (/^-?\d+\.\d+$/.test(valueStr)) {
      parent[key] = parseFloat(valueStr);
    } else {
      // String value - remove quotes if present
      parent[key] = valueStr.replace(/^["']|["']$/g, '');
    }
  }
  
  return result;
}

module.exports = {
  executeStep,
  executePrerequisites,
  createRequestFunction,
  parseYamlSteps
};
