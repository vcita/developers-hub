/**
 * Prerequisite Executor
 * 
 * Executes workflow prerequisites deterministically before running the main test.
 * Prerequisites are executed sequentially, extracting variables along the way.
 */

const { query, queryNested, extract } = require('./jsonpath');
const { resolve, resolveObject, findAllUnresolved } = require('./variables');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const swaggerCache = new Map();

function loadSwaggerSpec(swaggerPath) {
  if (!swaggerPath) return null;
  const fullPath = path.resolve(PROJECT_ROOT, swaggerPath);
  if (swaggerCache.has(fullPath)) {
    return swaggerCache.get(fullPath);
  }
  if (!fs.existsSync(fullPath)) {
    swaggerCache.set(fullPath, null);
    return null;
  }
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const spec = JSON.parse(content);
    swaggerCache.set(fullPath, spec);
    return spec;
  } catch (error) {
    console.log(`    [Headers] Failed to parse swagger: ${swaggerPath} (${error.message})`);
    swaggerCache.set(fullPath, null);
    return null;
  }
}

function getSwaggerOperation(spec, method, requestPath) {
  if (!spec?.paths) return null;
  const lowerMethod = method.toLowerCase();
  let lookupPath = requestPath;
  if (!spec.paths[lookupPath] && spec.basePath && lookupPath.startsWith(spec.basePath)) {
    lookupPath = lookupPath.slice(spec.basePath.length) || '/';
  }
  const pathItem = spec.paths[lookupPath];
  return pathItem?.[lowerMethod] || null;
}

function requiresOnBehalfOfFromSwagger(spec, method, requestPath) {
  const operation = getSwaggerOperation(spec, method, requestPath);
  if (!operation) return false;
  if (operation['x-on-behalf-of'] === true) return true;
  const parameters = operation.parameters || [];
  const hasHeader = parameters.some(
    param => param.in === 'header' && param.name?.toLowerCase() === 'x-on-behalf-of'
  );
  if (hasHeader) return true;
  const description = (operation.description || '').toLowerCase();
  return description.includes('x-on-behalf-of');
}

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
 * Execute a single prerequisite step with recursive workflow lookup
 * 
 * If the step's endpoint has its own workflow, that workflow's settings are used:
 * - useFallbackApi: If true, the step uses the fallback URL
 * - prerequisites: Executed recursively before this step
 * 
 * @param {Object} step - The step to execute
 * @param {Object} context - Current context with resolved variables
 * @param {Object} config - Configuration with tokens and baseUrl
 * @param {Function} makeRequest - Function to make HTTP requests
 * @param {Object} options - Additional options
 * @param {Object} options.workflowRepo - Workflow repository for recursive lookup
 * @param {number} options.depth - Current recursion depth (for logging)
 * @returns {Promise<Object>} Result of the step execution
 */
async function executeStep(step, context, config, makeRequest, options = {}) {
  const { workflowRepo, depth = 0 } = options;
  const { id, method, path, params, body, extract: extractConfig, expect, onFail, token, content_type, form_fields, file_fields, x_on_behalf_of, sleep } = step;
  
  // Resolve variables in path, params, and body
  const resolvedPath = resolve(path, context);
  const resolvedParams = resolveObject(params || {}, context);
  const resolvedBody = resolveObject(body || {}, context);
  
  // Resolve variables in form_fields if present
  const resolvedFormFields = form_fields ? resolveObject(form_fields, context) : null;
  
  // Check for unresolved variables
  const unresolved = findAllUnresolved({ path: resolvedPath, params: resolvedParams, body: resolvedBody }, context);
  if (unresolved.length > 0) {
    console.log(`  [WARN] Step ${id}: Unresolved variables: ${unresolved.join(', ')}`);
  }
  
  // RECURSIVE WORKFLOW LOOKUP: Check if this step's endpoint has its own workflow
  let effectiveMakeRequest = makeRequest;
  const endpointKey = `${method} ${resolvedPath}`;
  
  let stepWorkflow = null;
  if (workflowRepo) {
    stepWorkflow = workflowRepo.get(endpointKey);
    
    if (stepWorkflow) {
      const indent = '  '.repeat(depth + 1);
      
      // Check if step's workflow requires fallback API
      if (stepWorkflow.useFallbackApi === true && config.fallbackUrl) {
        console.log(`${indent}[Workflow] ${endpointKey} requires fallback API`);
        console.log(`${indent}[Workflow] Will use fallback URL: ${config.fallbackUrl}`);
        
        // Create a new makeRequest that uses the fallback URL
        const axios = require('axios');
        effectiveMakeRequest = async (requestConfig, cfg) => {
          const url = `${config.fallbackUrl}${requestConfig.path}`;
          console.log(`    [DEBUG] effectiveMakeRequest: ${requestConfig.method} ${url}`);
          console.log(`    [DEBUG] Body: ${JSON.stringify(requestConfig.body)?.substring(0, 200)}`);
          console.log(`    [DEBUG] Has auth header: ${requestConfig.headers?.Authorization ? 'Yes' : 'No'}`);
          try {
            const response = await axios({
              method: requestConfig.method,
              url,
              data: requestConfig.body,
              headers: requestConfig.headers,
              params: requestConfig.params,
              validateStatus: () => true
            });
            console.log(`    [DEBUG] Response status: ${response.status}`);
            if (response.status >= 400) {
              console.log(`    [DEBUG] Response error data: ${JSON.stringify(response.data)?.substring(0, 300)}`);
            }
            return { status: response.status, data: response.data };
          } catch (error) {
            console.log(`    [DEBUG] Request error: ${error.message}`);
            if (error.response) {
              return { status: error.response.status, data: error.response.data };
            }
            throw error;
          }
        };
      }
      
      // Check if step's endpoint is a Partners API endpoint (path contains /partners/)
      // Partners API uses a dedicated base URL and Token authentication
      const isPartnersPath = resolvedPath && resolvedPath.includes('/partners/');
      if (isPartnersPath && config.partnersUrl) {
        console.log(`${indent}[Workflow] ${endpointKey} is a Partners API endpoint`);
        console.log(`${indent}[Workflow] Will use Partners URL: ${config.partnersUrl}`);
        
        const axios = require('axios');
        effectiveMakeRequest = async (requestConfig, cfg) => {
          const url = `${config.partnersUrl}${requestConfig.path}`;
          console.log(`    [DEBUG] effectiveMakeRequest (Partners): ${requestConfig.method} ${url}`);
          
          // Partners API uses Token auth instead of Bearer
          const headers = { ...requestConfig.headers };
          if (headers['Authorization'] && headers['Authorization'].startsWith('Bearer ')) {
            const token = headers['Authorization'].replace('Bearer ', '');
            headers['Authorization'] = `Token token="${token}"`;
            console.log(`    [DEBUG] Switched auth to Token format for Partners API`);
          }
          
          try {
            const response = await axios({
              method: requestConfig.method,
              url,
              data: requestConfig.body,
              headers,
              params: requestConfig.params,
              validateStatus: () => true
            });
            console.log(`    [DEBUG] Response status: ${response.status}`);
            if (response.status >= 400) {
              console.log(`    [DEBUG] Response error data: ${JSON.stringify(response.data)?.substring(0, 300)}`);
            }
            return { status: response.status, data: response.data };
          } catch (error) {
            console.log(`    [DEBUG] Request error: ${error.message}`);
            if (error.response) {
              return { status: error.response.status, data: error.response.data };
            }
            throw error;
          }
        };
      }
      
      // Check if step's workflow has its own prerequisites (recursive)
      if (stepWorkflow.prerequisites?.steps?.length > 0 && depth < 5) {
        console.log(`${indent}[Workflow] ${endpointKey} has ${stepWorkflow.prerequisites.steps.length} prerequisite(s) - executing recursively`);
        
        const prereqResult = await executePrerequisites(
          stepWorkflow,
          { ...config, params: { ...config.params, ...context } },
          effectiveMakeRequest,
          { workflowRepo, depth: depth + 1, workflow: stepWorkflow }
        );
        
        if (prereqResult.failed) {
          console.log(`${indent}[Workflow] Recursive prerequisite failed: ${prereqResult.failedReason}`);
          return {
            success: false,
            stepId: id,
            error: `Recursive prerequisite '${prereqResult.failedStep}' failed: ${prereqResult.failedReason}`,
            onFail: onFail || 'abort'
          };
        }
        
        // Merge extracted variables from recursive prerequisites
        Object.assign(context, prereqResult.variables || {});
      }
    }
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
  
  // Build the request - handle multipart vs JSON
  const isMultipart = content_type === 'multipart';
  let requestData;
  
  // Admin/internal tokens use "Admin" prefix; all others use "Bearer"
  const isAdminToken = tokenType === 'admin' || tokenType === 'internal';
  const authPrefix = isAdminToken ? 'Admin' : 'Bearer';
  let requestHeaders = {
    'Authorization': `${authPrefix} ${authToken}`
  };

  // Directory tokens acting on behalf of a business must include X-On-Behalf-Of.
  // Source of truth is config.params.business_uid (merged into params/context by executePrerequisites).
  let swaggerRequiresOnBehalfOf = false;
  const workflowForSwagger = stepWorkflow || options.workflow;
  const swaggerPath = workflowForSwagger?.metadata?.swagger || workflowForSwagger?.swagger || null;
  if (swaggerPath) {
    const swaggerSpec = loadSwaggerSpec(swaggerPath);
    swaggerRequiresOnBehalfOf = requiresOnBehalfOfFromSwagger(swaggerSpec, method, resolvedPath);
  }

  const useOnBehalfOf =
    x_on_behalf_of === true ||
    x_on_behalf_of === 'true' ||
    (x_on_behalf_of === undefined && swaggerRequiresOnBehalfOf);

  if (tokenType === 'directory' && useOnBehalfOf) {
    // Prefer context (extracted from prerequisites) over config.params so that
    // a freshly-created business_uid from a prerequisite step takes effect.
    const onBehalfOf = context?.business_uid || config?.params?.business_uid || config?.params?.business_id;
    if (onBehalfOf) {
      requestHeaders['X-On-Behalf-Of'] = onBehalfOf;
      console.log(`    [Headers] Added X-On-Behalf-Of for directory token: ${onBehalfOf}`);
    } else {
      console.log(`    [Headers] WARNING: directory token used but no business_uid available for X-On-Behalf-Of`);
    }
  } else if (tokenType === 'directory' && !useOnBehalfOf) {
    console.log('    [Headers] X-On-Behalf-Of not requested for directory token');
  }
  
  if (isMultipart) {
    // Build multipart form data
    const FormData = require('form-data');
    const fs = require('fs');
    const pathModule = require('path');
    const formData = new FormData();
    
    // Add form fields (resolved text fields)
    if (resolvedFormFields && typeof resolvedFormFields === 'object') {
      for (const [key, value] of Object.entries(resolvedFormFields)) {
        formData.append(key, String(value));
        console.log(`    [Multipart] Adding form field: ${key}=${String(value).substring(0, 50)}`);
      }
    }
    
    // Add file fields
    if (file_fields && Array.isArray(file_fields)) {
      const filesDir = pathModule.resolve(__dirname, '../../test-files');
      for (const file of file_fields) {
        const { field_name, file_path, filename } = file;
        const absolutePath = pathModule.resolve(filesDir, file_path);
        
        if (fs.existsSync(absolutePath)) {
          const fileStream = fs.createReadStream(absolutePath);
          const uploadFilename = filename || pathModule.basename(file_path);
          formData.append(field_name, fileStream, uploadFilename);
          console.log(`    [Multipart] Adding file: ${field_name} -> ${uploadFilename}`);
        } else {
          console.log(`    [Multipart] WARNING: File not found: ${absolutePath}`);
        }
      }
    }
    
    requestData = formData;
    Object.assign(requestHeaders, formData.getHeaders());
  } else {
    // Standard JSON request
    requestData = Object.keys(resolvedBody).length > 0 ? resolvedBody : undefined;
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  const requestConfig = {
    method,
    path: resolvedPath,
    params: Object.keys(resolvedParams).length > 0 ? resolvedParams : undefined,
    body: requestData,
    headers: requestHeaders,
    isMultipart
  };
  
  console.log(`  [${id}] ${method} ${resolvedPath}${isMultipart ? ' (multipart)' : ''}`);
  if (!isMultipart) {
    console.log(`    [DEBUG] Using effectiveMakeRequest, body keys: ${Object.keys(resolvedBody).join(', ') || 'none'}`);
  } else {
    console.log(`    [DEBUG] Using effectiveMakeRequest, multipart with ${Object.keys(resolvedFormFields || {}).length} form fields and ${(file_fields || []).length} files`);
  }
  
  try {
    // Execute the request using effectiveMakeRequest (may use fallback URL from step's workflow)
    const response = await effectiveMakeRequest(requestConfig, config);
    
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
      // Log response structure for debugging
      console.log(`    [DEBUG] Response data keys: ${JSON.stringify(Object.keys(response.data || {}))}`);
      if (response.data?.data) {
        console.log(`    [DEBUG] data.* keys: ${JSON.stringify(Object.keys(response.data.data || {}))}`);
      }
      
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
          console.log(`    [DEBUG] Response data: ${JSON.stringify(response.data).substring(0, 300)}`);
        }
      }
    }
    
    // Sleep after successful step if configured
    if (sleep && sleep > 0) {
      console.log(`    ⏳ Sleeping ${sleep}ms...`);
      await new Promise(resolve => setTimeout(resolve, sleep));
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
 * @param {Object} options - Additional options
 * @param {Object} options.workflowRepo - Workflow repository for recursive lookup
 * @param {number} options.depth - Current recursion depth (for logging)
 * @returns {Promise<Object>} Result containing success status, extracted variables, and any errors
 */
async function executePrerequisites(workflow, config, makeRequest, options = {}) {
  const { workflowRepo, depth = 0 } = options;
  const prerequisites = workflow.prerequisites?.steps || [];
  const indent = '  '.repeat(depth);
  
  if (prerequisites.length === 0) {
    console.log(`${indent}  No prerequisites defined`);
    return {
      success: true,
      variables: { ...config.params },
      steps: []
    };
  }
  
  console.log(`${depth === 0 ? '\n' : ''}${indent}📋 Executing ${prerequisites.length} prerequisite(s)...`);
  
  // Initialize context with config params and dynamic date variables
  const context = { 
    ...config.params,
    ...getDynamicDateVariables()
  };
  const results = [];
  
  for (const step of prerequisites) {
    // Pass workflowRepo and current workflow for swagger-based headers
    const result = await executeStep(step, context, config, makeRequest, {
      workflowRepo,
      depth,
      workflow
    });
    results.push(result);
    
    if (result.success) {
      // Merge extracted values into context
      Object.assign(context, result.extracted || {});
    } else {
      // Handle failure based on onFail strategy
      if (result.onFail === 'abort') {
        console.log(`\n${indent}  ⛔ Prerequisite '${result.stepId}' failed - aborting workflow`);
        return {
          success: false,
          failed: true,
          failedStep: result.stepId,
          failedReason: result.error,
          variables: context,
          steps: results
        };
      } else if (result.onFail === 'skip') {
        console.log(`${indent}  ⚠ Prerequisite '${result.stepId}' failed - skipping (onFail: skip)`);
        continue;
      } else if (result.onFail === 'warn') {
        console.log(`${indent}  ⚠ Prerequisite '${result.stepId}' failed - continuing with warning`);
        continue;
      }
    }
  }
  
  console.log(`\n${indent}✓ All prerequisites completed successfully`);
  console.log(`${indent}  Variables available: ${Object.keys(context).join(', ')}`);
  
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
 * @param {Object} options - Options
 * @param {string} options.fallbackUrl - Fallback URL to use instead of baseUrl when useFallback is true
 * @param {boolean} options.useFallback - If true, use fallbackUrl as the base URL
 * @returns {Function} Request function
 */
function createRequestFunction(baseUrl, options = {}) {
  const { fallbackUrl, useFallback = false, partnersUrl } = options;
  
  // Determine which URL to use as the base
  const effectiveBaseUrl = useFallback && fallbackUrl ? fallbackUrl : baseUrl;
  
  if (useFallback && fallbackUrl) {
    console.log(`  [RequestFunction] Using fallback URL: ${effectiveBaseUrl}`);
  }
  
  // Try to use axios if available
  try {
    const axios = require('axios');
    
    return async (requestConfig, config) => {
      // Partners API endpoints use dedicated URL and Token authentication
      const isPartnersPath = requestConfig.path && requestConfig.path.includes('/partners/');
      const effectivePartnersUrl = partnersUrl || config.partnersUrl;
      
      let urlBase;
      if (isPartnersPath && effectivePartnersUrl) {
        urlBase = effectivePartnersUrl;
        console.log(`    [makeRequest] Partners API detected, using: ${urlBase}`);
        
        // Switch from Bearer to Token auth for Partners API
        if (requestConfig.headers?.['Authorization']?.startsWith('Bearer ')) {
          const token = requestConfig.headers['Authorization'].replace('Bearer ', '');
          requestConfig.headers['Authorization'] = `Token token="${token}"`;
          console.log(`    [makeRequest] Switched auth to Token format for Partners API`);
        }
      } else {
        urlBase = useFallback && fallbackUrl 
          ? fallbackUrl 
          : (config.baseUrl || effectiveBaseUrl);
      }
      const url = `${urlBase}${requestConfig.path}`;
      console.log(`    [makeRequest] ${requestConfig.method} ${url} (useFallback=${useFallback}, base=${urlBase})`);
      
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
        
        // For multipart requests, set unlimited content length
        if (requestConfig.isMultipart) {
          axiosConfig.maxContentLength = Infinity;
          axiosConfig.maxBodyLength = Infinity;
        }
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
        const urlBase = useFallback && fallbackUrl 
          ? fallbackUrl 
          : (config.baseUrl || effectiveBaseUrl);
        const url = new URL(`${urlBase}${requestConfig.path}`);
        
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
          console.log(`[DEBUG parseYamlSteps] Mid-parse body lines:\n${bodyLines.join('\n')}`);
          currentStep.body = parseSimpleYaml(bodyLines.join('\n'));
          console.log(`[DEBUG parseYamlSteps] Mid-parse body: ${JSON.stringify(currentStep.body)}`);
          bodyLines = [];
        }
        result.steps.push(currentStep);
      }
      currentStep = { id: trimmed.split(':')[1].trim() };
      inSection = null;
      continue;
    }
    
    if (!currentStep) continue;
    
    // IMPORTANT: Check for section content FIRST (deeply indented lines)
    // This prevents nested body fields like "description:" from being misinterpreted
    // as step-level properties
    if (inSection && indent > 4) {
      // Handle file_fields array items (- field_name: "...")
      if (inSection === 'file_fields') {
        if (trimmed.startsWith('- field_name:')) {
          // Start new file field item
          const value = trimmed.split(':').slice(1).join(':').trim().replace(/^["']|["']$/g, '');
          currentStep.file_fields.push({ field_name: value });
        } else if (currentStep.file_fields.length > 0) {
          // Add properties to current file field item
          const propMatch = trimmed.match(/^(\w+):\s*["']?(.+?)["']?$/);
          if (propMatch) {
            const [, key, value] = propMatch;
            currentStep.file_fields[currentStep.file_fields.length - 1][key] = value.replace(/^["']|["']$/g, '');
          }
        }
        continue;
      }
      
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
          console.log(`[DEBUG parseYamlSteps] Added body line (matched): ${line.trim()}`);
        } else if (inSection === 'form_fields') {
          currentStep.form_fields[key] = value;
        } else {
          currentStep[inSection][key] = value;
        }
      } else if (inSection === 'body') {
        bodyLines.push(line);
        console.log(`[DEBUG parseYamlSteps] Added body line (no match): ${line.trim()}`);
      }
      continue;
    }
    
    // Parse step-level properties (only at step indent level, not nested)
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
    } else if (trimmed.startsWith('x_on_behalf_of:')) {
      const value = trimmed.split(':')[1].trim();
      currentStep.x_on_behalf_of = value === 'true';
      inSection = null;
    } else if (trimmed.startsWith('content_type:')) {
      currentStep.content_type = trimmed.split(':')[1].trim();
      inSection = null;
    } else if (trimmed.startsWith('sleep:')) {
      currentStep.sleep = parseInt(trimmed.split(':')[1].trim(), 10);
      inSection = null;
    } else if (trimmed === 'form_fields:') {
      currentStep.form_fields = {};
      inSection = 'form_fields';
    } else if (trimmed === 'file_fields:') {
      currentStep.file_fields = [];
      inSection = 'file_fields';
    } else if (trimmed === 'extract:') {
      currentStep.extract = {};
      inSection = 'extract';
    } else if (trimmed === 'params:') {
      currentStep.params = {};
      inSection = 'params';
    } else if (trimmed === 'body:') {
      currentStep.body = {};
      inSection = 'body';
      bodyLines = [];
    } else if (trimmed === 'expect:') {
      currentStep.expect = {};
      inSection = 'expect';
    }
  }
  
  // Add last step
  if (currentStep) {
    if (bodyLines.length > 0) {
      console.log(`[DEBUG parseYamlSteps] Body lines to parse:\n${bodyLines.join('\n')}`);
      currentStep.body = parseSimpleYaml(bodyLines.join('\n'));
      console.log(`[DEBUG parseYamlSteps] Parsed body: ${JSON.stringify(currentStep.body)}`);
    }
    result.steps.push(currentStep);
  }
  
  return result;
}

/**
 * Parse a YAML primitive value string into the appropriate JS type
 */
function parseYamlPrimitive(valueStr) {
  if (valueStr === '' || valueStr === undefined) return '';
  if (valueStr === 'null') return null;
  if (valueStr === 'true') return true;
  if (valueStr === 'false') return false;
  if (/^-?\d+$/.test(valueStr)) return parseInt(valueStr, 10);
  if (/^-?\d+\.\d+$/.test(valueStr)) return parseFloat(valueStr);
  
  // Inline JSON object
  if (valueStr.startsWith('{') && valueStr.endsWith('}')) {
    try { return JSON.parse(valueStr); } catch (e) { /* fall through */ }
  }
  // Inline JSON array
  if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
    try { return JSON.parse(valueStr); } catch (e) { /* fall through */ }
  }
  
  // String value - remove surrounding quotes if present
  return valueStr.replace(/^["']|["']$/g, '');
}

/**
 * Parse simple YAML key-value pairs (with array support)
 * 
 * Supports:
 *   key: value                   -> { key: value }
 *   parent:                      -> nested object or array (auto-detected)
 *     child: value               -> { parent: { child: value } }
 *   list:
 *     - value1                   -> { list: ["value1", "value2"] }
 *     - value2
 *   objects:
 *     - uid: "abc"               -> { objects: [{ uid: "abc", enabled: true }] }
 *       enabled: true
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
    
    const parentEntry = stack[stack.length - 1];
    let parent = parentEntry.obj;
    
    // ── Handle YAML array items (lines starting with "- ") ──
    if (trimmed.startsWith('- ')) {
      const itemContent = trimmed.substring(2).trim();
      
      // Determine target array
      let targetArray;
      if (Array.isArray(parent)) {
        targetArray = parent;
      } else if (typeof parent === 'object' && parent !== null
                 && Object.keys(parent).length === 0 && stack.length > 1) {
        // Parent was created as {} for a key with empty value (e.g., "staff_data:")
        // but the children are array items — convert to []
        const arr = [];
        const grandparentEntry = stack[stack.length - 2];
        if (parentEntry.key != null && !Array.isArray(grandparentEntry.obj)) {
          grandparentEntry.obj[parentEntry.key] = arr;
        }
        parentEntry.obj = arr;
        parent = arr;
        targetArray = arr;
      } else {
        // Cannot determine array context, skip line
        continue;
      }
      
      // Check if item is a key:value pair (→ object array item) or a simple value
      const colonIdx = itemContent.indexOf(':');
      const isQuoted = itemContent.startsWith('"') || itemContent.startsWith("'");
      
      if (colonIdx > 0 && !isQuoted) {
        // Object array item, e.g. "- uid: abc"
        const key = itemContent.substring(0, colonIdx).replace(/^["']|["']$/g, '').trim();
        const valueStr = itemContent.substring(colonIdx + 1).trim();
        const newObj = {};
        newObj[key] = parseYamlPrimitive(valueStr);
        targetArray.push(newObj);
        // Push onto stack so subsequent deeper-indented lines become properties of this object
        stack.push({ obj: newObj, indent: indent, key: null });
      } else {
        // Simple value item, e.g. "- tag1"
        targetArray.push(parseYamlPrimitive(itemContent));
      }
      continue;
    }
    
    // ── Only process key:value for object parents ──
    if (Array.isArray(parent)) continue;
    
    // Parse key: value
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    
    const key = trimmed.substring(0, colonIdx).replace(/^["']|["']$/g, '').trim();
    const valueStr = trimmed.substring(colonIdx + 1).trim();
    
    if (valueStr === '' || valueStr === '{}') {
      // Empty value — create nested object (may be converted to array later if children are "- " items)
      const newObj = {};
      parent[key] = newObj;
      stack.push({ obj: newObj, indent: indent, key: key });
    } else if (valueStr === '[]') {
      // Explicit empty array
      const newArr = [];
      parent[key] = newArr;
      stack.push({ obj: newArr, indent: indent, key: key });
    } else {
      parent[key] = parseYamlPrimitive(valueStr);
    }
  }
  
  return result;
}

/**
 * Clear cached swagger spec(s) so that modified files are re-read on next use.
 * @param {string} [swaggerPath] - Relative path (e.g. "swagger/sales/legacy/payments.json").
 *   If omitted, the entire cache is cleared.
 */
function clearSwaggerCache(swaggerPath) {
  if (swaggerPath) {
    const fullPath = path.resolve(PROJECT_ROOT, swaggerPath);
    swaggerCache.delete(fullPath);
  } else {
    swaggerCache.clear();
  }
}

module.exports = {
  executeStep,
  executePrerequisites,
  createRequestFunction,
  parseYamlSteps,
  clearSwaggerCache
};
