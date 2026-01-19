/**
 * Validation API Routes
 * POST /api/validate - Run validation for selected endpoints
 * GET /api/validate/stream - SSE stream for real-time progress
 */

const express = require('express');
const router = express.Router();

const { loadConfig } = require('../../core/config');
const { buildTestSequence, createTestContext } = require('../../core/orchestrator/test-sequencer');
const { createApiClient, buildRequestConfig, executeRequest, extractUidFromResponse } = require('../../core/runner/api-client');
const { createRateLimiter } = require('../../core/runner/rate-limiter');
const { createParamResolver, extractPathParams, hasParamSource, getParamSource, getNestedValue } = require('../../core/runner/param-resolver');
const { validateAgainstSchema, validateStatusCode, buildValidationResult, getSuggestion, FAILURE_REASONS } = require('../../core/validator/response-validator');
const { createReport, addResult, finalizeReport } = require('../../core/reporter/report-generator');

// Store for active validation sessions
const activeSessions = new Map();

/**
 * POST /api/validate
 * Start validation for selected endpoints
 */
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/validate received');
    const { endpoints: selectedEndpoints, options = {} } = req.body;
    const { endpoints: allEndpoints, config: appConfig } = req.appState;
    
    console.log('Selected endpoints:', selectedEndpoints?.length);
    console.log('All endpoints available:', allEndpoints?.length);
    
    if (!selectedEndpoints || selectedEndpoints.length === 0) {
      return res.status(400).json({
        error: 'No endpoints selected',
        message: 'Provide an array of endpoints to validate'
      });
    }
    
    // Create session ID
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Find matching endpoints from app state
    const targetEndpoints = allEndpoints.filter(e => 
      selectedEndpoints.some(s => 
        s.path === e.path && s.method.toUpperCase() === e.method
      )
    );
    
    console.log('Matched endpoints:', targetEndpoints.length);
    
    if (targetEndpoints.length === 0) {
      console.log('No match found. First selected:', selectedEndpoints[0]);
      console.log('Sample from allEndpoints:', allEndpoints.slice(0, 2).map(e => ({ path: e.path, method: e.method })));
      return res.status(400).json({
        error: 'No matching endpoints found',
        message: 'The selected endpoints do not match any loaded endpoints'
      });
    }
    
    // Initialize session
    const session = {
      id: sessionId,
      status: 'running',
      startTime: Date.now(),
      total: targetEndpoints.length,
      completed: 0,
      results: [],
      listeners: new Set()
    };
    
    activeSessions.set(sessionId, session);
    
    // Start validation in background
    runValidation(session, targetEndpoints, appConfig, options).catch(error => {
      console.error('Validation error:', error);
      session.status = 'error';
      session.error = error.message;
      broadcastEvent(session, 'error', { message: error.message });
    });
    
    // Return session info immediately
    res.json({
      sessionId,
      total: targetEndpoints.length,
      message: `Validation started. Connect to /api/validate/stream/${sessionId} for progress updates.`
    });
  } catch (error) {
    console.error('POST /api/validate error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    });
  }
});

/**
 * GET /api/validate/stream/:sessionId
 * SSE stream for validation progress
 */
router.get('/stream/:sessionId', (req, res) => {
  try {
    console.log('SSE stream requested for:', req.params.sessionId);
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);
    
    if (!session) {
      console.log('Session not found:', sessionId);
      console.log('Active sessions:', Array.from(activeSessions.keys()));
      return res.status(404).json({
        error: 'Session not found',
        message: 'The validation session does not exist or has expired'
      });
    }
    
    console.log('Session found, setting up SSE');
    
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
  
  // Send initial state
  res.write(`event: start\n`);
  res.write(`data: ${JSON.stringify({
    total: session.total,
    timestamp: new Date(session.startTime).toISOString()
  })}\n\n`);
  
  // Send any existing results
  for (const result of session.results) {
    res.write(`event: result\n`);
    res.write(`data: ${JSON.stringify(result)}\n\n`);
  }
  
  // Add listener for new events
  const listener = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  session.listeners.add(listener);
  
  // Send complete event if already done
  if (session.status === 'completed' || session.status === 'error') {
    res.write(`event: complete\n`);
    res.write(`data: ${JSON.stringify({
      status: session.status,
      passed: session.results.filter(r => r.status === 'PASS').length,
      failed: session.results.filter(r => r.status === 'FAIL').length,
      skipped: session.results.filter(r => r.status === 'SKIP').length,
      duration: `${Date.now() - session.startTime}ms`
    })}\n\n`);
  }
  
  // Clean up on close
  req.on('close', () => {
    session.listeners.delete(listener);
    
    // Clean up session after all listeners disconnect and it's complete
    if (session.listeners.size === 0 && session.status !== 'running') {
      setTimeout(() => {
        if (session.listeners.size === 0) {
          activeSessions.delete(sessionId);
        }
      }, 60000); // Keep for 1 minute after completion
    }
  });
  } catch (error) {
    console.error('SSE stream error:', error);
    res.status(500).json({ error: 'SSE error', message: error.message });
  }
});

/**
 * GET /api/validate/sessions
 * List active validation sessions
 */
router.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.entries()).map(([id, session]) => ({
    id,
    status: session.status,
    total: session.total,
    completed: session.completed,
    startTime: new Date(session.startTime).toISOString()
  }));
  
  res.json({ sessions });
});

/**
 * Broadcast event to all session listeners
 * @param {Object} session - Session object
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function broadcastEvent(session, event, data) {
  for (const listener of session.listeners) {
    try {
      listener(event, data);
    } catch (error) {
      // Listener may have disconnected
      session.listeners.delete(listener);
    }
  }
}

/**
 * Run validation for endpoints
 * @param {Object} session - Session object
 * @param {Object[]} endpoints - Endpoints to validate
 * @param {Object} appConfig - App configuration
 * @param {Object} options - Validation options
 */
async function runValidation(session, endpoints, appConfig, options = {}) {
  console.log('runValidation started for', endpoints.length, 'endpoints');
  
  const config = loadConfig();
  console.log('Config loaded, baseUrl:', config.baseUrl);
  
  const { sequence } = buildTestSequence(endpoints, {
    runDelete: options.runDelete || false
  });
  console.log('Test sequence built:', sequence.length, 'tests');
  
  const apiClient = createApiClient(config);
  const rateLimiter = createRateLimiter(options.rateLimitPreset || 'normal', options.rateLimit || {});
  const testContext = createTestContext();
  const paramResolver = createParamResolver(config);
  const report = createReport(config);
  
  // Pre-flight: Fetch missing dynamic parameters
  const preflightParams = await fetchMissingParams(
    endpoints,
    paramResolver,
    apiClient,
    rateLimiter,
    config,
    (msg) => broadcastEvent(session, 'log', { message: msg })
  );
  
  // Add pre-fetched params to test context
  for (const [param, value] of Object.entries(preflightParams)) {
    testContext.setParam(param, value);
  }
  
  for (const testItem of sequence) {
    const { endpoint, phase, captureUid, requiresUid, skip, skipReason, resourceKey } = testItem;
    
    console.log(`Testing: ${endpoint.method} ${endpoint.path}`);
    
    // Broadcast progress
    broadcastEvent(session, 'progress', {
      endpoint: `${endpoint.method} ${endpoint.path}`,
      status: 'running',
      index: session.completed + 1,
      total: session.total
    });
    
    let result;
    
    // Handle skipped tests
    if (skip) {
      result = {
        endpoint: `${endpoint.method} ${endpoint.path}`,
        domain: endpoint.domain,
        method: endpoint.method,
        path: endpoint.path,
        status: 'SKIP',
        httpStatus: null,
        duration: '0ms',
        tokenUsed: null,
        details: { reason: 'SKIPPED', friendlyMessage: skipReason }
      };
    } else {
      // Build context with resolved params and UID
      const context = {
        params: testContext.getParams() // Include all pre-fetched dynamic params
      };
      
      if (requiresUid) {
        const uid = testContext.getUid(resourceKey);
        if (!uid) {
          result = {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            domain: endpoint.domain,
            method: endpoint.method,
            path: endpoint.path,
            status: 'SKIP',
            httpStatus: null,
            duration: '0ms',
            tokenUsed: null,
            details: {
              reason: 'SKIPPED',
              friendlyMessage: 'Required UID not available'
            }
          };
        } else {
          context.uid = uid;
        }
      }
      
      if (!result) {
        // Build and execute request
        const buildResult = buildRequestConfig(endpoint, config, context);
        const { config: requestConfig, tokenType, hasToken, skip, skipReason, isFallbackToken } = buildResult;
        
        // Handle unresolved path parameters
        if (skip) {
          result = {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            domain: endpoint.domain,
            method: endpoint.method,
            path: endpoint.path,
            status: 'SKIP',
            httpStatus: null,
            duration: '0ms',
            tokenUsed: tokenType,
            details: {
              reason: 'MISSING_PATH_PARAMS',
              friendlyMessage: skipReason
            }
          };
        } else if (!hasToken && endpoint.tokenInfo.found) {
          result = buildValidationResult({
            endpoint,
            status: 'FAIL',
            httpStatus: null,
            duration: 0,
            tokenUsed: tokenType,
            reason: FAILURE_REASONS.AUTH_FAILED,
            suggestion: `Configure a ${tokenType} token`
          });
        } else {
          console.log(`  Executing request to: ${requestConfig.url}`);
          const originalRequired = buildResult.originalRequired;
          if (isFallbackToken && originalRequired) {
            console.log(`  Using token: ${tokenType} (fallback - required '${originalRequired}' is placeholder/missing)`);
          } else if (isFallbackToken) {
            console.log(`  Using token: ${tokenType} (fallback - not documented)`);
          } else {
            console.log(`  Using token: ${tokenType || 'none'}`);
          }
          
          let { success, response, duration, error } = await rateLimiter.execute(
            () => executeRequest(apiClient, requestConfig)
          );
          console.log(`  Response: status=${response?.status}, duration=${duration}ms, error=${error?.message || 'none'}`);
          
          // Build full request info for debugging (including actual URL and token)
          const fullRequestInfo = {
            method: requestConfig.method?.toUpperCase() || endpoint.method,
            url: `${config.baseUrl}${requestConfig.url}`,
            headers: { ...requestConfig.headers },
            params: requestConfig.params,
            data: requestConfig.data
          };
          
          // Track documentation issues found during validation
          let docIssues = [];
          
          // Flag if fallback token was used
          if (isFallbackToken) {
            if (originalRequired) {
              docIssues.push({
                type: 'TOKEN_PLACEHOLDER_USED',
                message: `Required '${originalRequired}' token is placeholder/missing. Using fallback '${tokenType}' token.`,
                suggestion: `Configure a valid '${originalRequired}' token in tokens.json, or update documentation if '${tokenType}' is the correct token type.`
              });
            } else {
              docIssues.push({
                type: 'MISSING_TOKEN_DOCUMENTATION',
                message: `Token type not documented. Using fallback '${tokenType}' token.`,
                suggestion: `Add token availability to the endpoint description (e.g., "Available for **Staff Tokens**")`
              });
            }
          }
          
          // Retry with swapped business_id/business_uid on error responses
          // APIs may return 400, 401, 403, 404, or 422 when business ID format is wrong
          const retryStatusCodes = [400, 401, 403, 404, 422];
          if (response && retryStatusCodes.includes(response.status)) {
            console.log(`  Got ${response.status}, attempting retry with swapped business param...`);
            const retryResult = await retryWithSwappedBusinessParam(
              requestConfig, apiClient, rateLimiter, config
            );
            if (retryResult.success) {
              console.log(`  Retry succeeded! (swap: ${retryResult.swapLocation})`);
              response = retryResult.response;
              duration = retryResult.totalDuration;
              error = null;
              
              let message, suggestion, issueType;
              
              if (retryResult.swapType === 'value') {
                // VALUE SWAP: param name correct, but value format wrong
                // e.g., business_id=5970472 should be business_id=tp3dt4rjazt3frzx
                issueType = 'PARAM_VALUE_FORMAT';
                message = `API expects the UID format value for 'business_id' (${retryResult.newValue}), not the numeric ID (${retryResult.originalValue}).`;
                suggestion = `Update documentation to clarify that 'business_id' should contain the business UID (unique identifier like '${retryResult.newValue}'), not the numeric database ID.`;
              } else {
                // NAME SWAP: param name is wrong
                issueType = 'PARAM_NAME_MISMATCH';
                message = `Documentation specifies '${retryResult.originalParam}' in ${retryResult.swapLocation}, but API expects '${retryResult.swappedParam}'.`;
                suggestion = `Verify documentation. Update docs to use '${retryResult.swappedParam}' if API behavior is correct. Do NOT change the API (breaking change).`;
              }
              
              docIssues.push({
                type: issueType,
                message,
                suggestion,
                location: retryResult.swapLocation,
                swapType: retryResult.swapType,
                originalParam: retryResult.originalParam,
                swappedParam: retryResult.swappedParam,
                originalValue: retryResult.originalValue,
                newValue: retryResult.newValue
              });
            } else {
              console.log(`  Retry did not help (or no swap applicable)`);
            }
          }
          
          if (error && error.isNetworkError) {
            result = buildValidationResult({
              endpoint,
              status: 'FAIL',
              httpStatus: null,
              duration,
              tokenUsed: tokenType,
              reason: FAILURE_REASONS.NETWORK_ERROR,
              request: fullRequestInfo
            });
          } else if (error && error.isTimeout) {
            result = buildValidationResult({
              endpoint,
              status: 'FAIL',
              httpStatus: null,
              duration,
              tokenUsed: tokenType,
              reason: FAILURE_REASONS.TIMEOUT,
              request: fullRequestInfo
            });
          } else if (response) {
            const statusValidation = validateStatusCode(response.status, endpoint.responses);
            
            if (!statusValidation.valid) {
              result = buildValidationResult({
                endpoint,
                status: 'FAIL',
                httpStatus: response.status,
                duration,
                tokenUsed: tokenType,
                reason: statusValidation.error.reason,
                suggestion: getSuggestion(statusValidation.error.reason, { tokenType }),
                request: fullRequestInfo,
                response: { status: response.status, headers: response.headers, data: response.data }
              });
            } else {
              // Validate response body against schema
              const responseSpec = endpoint.responses?.[response.status] || endpoint.responses?.[String(response.status)];
              const responseSchema = responseSpec?.content?.['application/json']?.schema;
              
              let schemaValidation = { valid: true, errors: [] };
              if (responseSchema && response.data) {
                schemaValidation = validateAgainstSchema(response.data, responseSchema);
              }
              
              // Combine schema errors with doc issues
              const allErrors = [...(schemaValidation.errors || [])];
              if (docIssues.length > 0) {
                for (const issue of docIssues) {
                  allErrors.push({
                    reason: issue.type,
                    message: issue.message,
                    friendlyMessage: issue.message,
                    suggestion: issue.suggestion
                  });
                }
              }
              
              // If we have doc issues, always mark as FAIL even if schema passes
              if (docIssues.length > 0) {
                result = buildValidationResult({
                  endpoint,
                  status: 'FAIL',
                  httpStatus: response.status,
                  duration,
                  tokenUsed: tokenType,
                  reason: 'DOC_ISSUE',
                  errors: allErrors,
                  request: fullRequestInfo,
                  response: { status: response.status, headers: response.headers, data: response.data },
                  suggestion: docIssues[0].suggestion
                });
              } else if (!schemaValidation.valid) {
                result = buildValidationResult({
                  endpoint,
                  status: 'FAIL',
                  httpStatus: response.status,
                  duration,
                  tokenUsed: tokenType,
                  reason: FAILURE_REASONS.SCHEMA_MISMATCH,
                  errors: schemaValidation.errors,
                  request: fullRequestInfo,
                  response: { status: response.status, headers: response.headers, data: response.data },
                  suggestion: getSuggestion(FAILURE_REASONS.SCHEMA_MISMATCH)
                });
              } else {
                // Capture UID if needed
                if (captureUid && response.data) {
                  const uid = extractUidFromResponse(response.data);
                  if (uid) {
                    testContext.setUid(resourceKey, uid);
                  }
                }
                
                result = buildValidationResult({
                  endpoint,
                  status: 'PASS',
                  httpStatus: response.status,
                  duration,
                  tokenUsed: tokenType,
                  request: fullRequestInfo,
                  response: { status: response.status, headers: response.headers, data: response.data }
                });
              }
            }
          } else {
            result = buildValidationResult({
              endpoint,
              status: 'FAIL',
              httpStatus: null,
              duration: 0,
              tokenUsed: tokenType,
              reason: FAILURE_REASONS.NETWORK_ERROR
            });
          }
        }
      }
    }
    
    // Update session
    session.results.push(result);
    session.completed++;
    addResult(report, result);
    
    // Broadcast result
    broadcastEvent(session, 'result', result);
  }
  
  // Finalize
  const duration = Date.now() - session.startTime;
  finalizeReport(report, duration);
  session.status = 'completed';
  session.report = report;
  
  // Broadcast completion
  broadcastEvent(session, 'complete', {
    status: 'completed',
    passed: report.summary.passed,
    failed: report.summary.failed,
    skipped: report.summary.skipped,
    passRate: report.summary.passRate,
    duration: report.summary.duration
  });
}

/**
 * Pre-flight: Fetch missing dynamic parameters from source endpoints
 * @param {Object[]} endpoints - Endpoints to be tested
 * @param {Object} paramResolver - Parameter resolver instance
 * @param {Object} apiClient - Axios client
 * @param {Object} rateLimiter - Rate limiter
 * @param {Object} config - Configuration
 * @param {Function} log - Logging function
 * @returns {Promise<Object>} Resolved parameters
 */
async function fetchMissingParams(endpoints, paramResolver, apiClient, rateLimiter, config, log) {
  const resolvedParams = {};
  const fetchedEndpoints = new Set();
  
  // Collect all required params from all endpoints
  const allRequiredParams = new Set();
  for (const endpoint of endpoints) {
    const params = extractPathParams(endpoint.path);
    for (const param of params) {
      allRequiredParams.add(param);
    }
  }
  
  // Filter to only dynamic params that have sources and aren't already configured
  const staticParams = config.params || {};
  const paramsToFetch = [];
  
  for (const param of allRequiredParams) {
    // Skip if already in static config
    if (staticParams[param] && !staticParams[param].includes('your-')) {
      continue;
    }
    
    // Check if we have a source for this param
    if (hasParamSource(param)) {
      const source = getParamSource(param);
      if (source.endpoint && !fetchedEndpoints.has(source.endpoint)) {
        paramsToFetch.push({ param, ...source });
        fetchedEndpoints.add(source.endpoint);
      }
    }
  }
  
  if (paramsToFetch.length === 0) {
    return resolvedParams;
  }
  
  log(`Pre-flight: Fetching ${paramsToFetch.length} dynamic parameter(s)...`);
  
  // Fetch each source endpoint
  for (const { param, endpoint, field, arrayPath } of paramsToFetch) {
    try {
      log(`  Fetching ${param} from ${endpoint}...`);
      
      // Build a simple GET request with the first available token
      const token = config.tokens?.staff || config.tokens?.directory || Object.values(config.tokens || {})[0];
      
      const requestConfig = {
        method: 'get',
        url: endpoint,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        params: { page: 1, per_page: 1 }
      };
      
      const { response, error } = await rateLimiter.execute(
        () => executeRequest(apiClient, requestConfig)
      );
      
      if (response && response.status >= 200 && response.status < 300 && response.data) {
        // Extract the value
        let items = arrayPath ? getNestedValue(response.data, arrayPath) : response.data;
        
        // Handle nested data wrapper
        if (!items && response.data.data) {
          items = arrayPath ? getNestedValue(response.data.data, arrayPath.replace('data.', '')) : response.data.data;
        }
        
        // Get first item from array
        if (Array.isArray(items) && items.length > 0) {
          const value = items[0][field];
          if (value) {
            resolvedParams[param] = value;
            log(`    ✓ Got ${param}=${value}`);
          } else {
            log(`    ✗ No ${field} field in response`);
          }
        } else if (items && typeof items === 'object' && items[field]) {
          resolvedParams[param] = items[field];
          log(`    ✓ Got ${param}=${items[field]}`);
        } else {
          log(`    ✗ No data found in response`);
        }
      } else {
        log(`    ✗ Request failed: ${error?.message || response?.status || 'unknown error'}`);
      }
    } catch (err) {
      log(`    ✗ Error fetching ${param}: ${err.message}`);
    }
  }
  
  return resolvedParams;
}

/**
 * Retry a failed request by swapping business_id ↔ business_uid
 * This handles TWO scenarios:
 * 1. Name swap: param name is wrong (business_id should be business_uid)
 * 2. Value swap: param name is correct but value should use UID format (business_id=<uid_value>)
 * @param {Object} originalConfig - Original request config
 * @param {Object} apiClient - Axios client
 * @param {Object} rateLimiter - Rate limiter
 * @param {Object} config - App config with params
 * @returns {Promise<Object>} Retry result
 */
async function retryWithSwappedBusinessParam(originalConfig, apiClient, rateLimiter, config) {
  const url = originalConfig.url;
  const body = originalConfig.data;
  const queryParams = originalConfig.params || {}; // Query parameters from request
  const configParams = config.params || {}; // Configured values like business_id, business_uid
  
  console.log(`  [Retry] Checking URL: ${url}`);
  console.log(`  [Retry] Has request body: ${!!body}`);
  console.log(`  [Retry] Has query params: ${JSON.stringify(queryParams)}`);
  console.log(`  [Retry] Available config params: business_id=${configParams.business_id}, business_uid=${configParams.business_uid}`);
  
  const businessId = configParams.business_id;
  const businessUid = configParams.business_uid;
  
  if (!businessId || !businessUid) {
    console.log(`  [Retry] Skip: missing business_id or business_uid in config`);
    return { success: false };
  }
  
  // Try different swap strategies
  const strategies = [];
  
  // Strategy 1a: VALUE SWAP - keep param name "business_id" but use UID value
  // This handles: API accepts business_id param but wants the UID format value
  if (queryParams.business_id === businessId) {
    strategies.push({
      name: 'value_swap_query_id_to_uid',
      description: 'Keep business_id param name, use UID value',
      apply: (config) => {
        config.params = { ...queryParams, business_id: businessUid };
        return { swapLocation: 'query (value)', swapType: 'value', originalValue: businessId, newValue: businessUid };
      }
    });
  }
  
  // Strategy 1b: VALUE SWAP - keep param name "business_uid" but use numeric ID value
  if (queryParams.business_uid === businessUid) {
    strategies.push({
      name: 'value_swap_query_uid_to_id',
      description: 'Keep business_uid param name, use numeric ID value',
      apply: (config) => {
        config.params = { ...queryParams, business_uid: businessId };
        return { swapLocation: 'query (value)', swapType: 'value', originalValue: businessUid, newValue: businessId };
      }
    });
  }
  
  // Strategy 2: NAME SWAP in query - change param name from business_id to business_uid
  if (queryParams.hasOwnProperty('business_id')) {
    strategies.push({
      name: 'name_swap_query_id_to_uid',
      description: 'Change param name business_id → business_uid',
      apply: (config) => {
        config.params = { ...queryParams };
        delete config.params.business_id;
        config.params.business_uid = businessUid;
        return { swapLocation: 'query (name)', swapType: 'name', originalParam: 'business_id', swappedParam: 'business_uid' };
      }
    });
  }
  
  // Strategy 3: NAME SWAP in query - change param name from business_uid to business_id
  if (queryParams.hasOwnProperty('business_uid')) {
    strategies.push({
      name: 'name_swap_query_uid_to_id',
      description: 'Change param name business_uid → business_id',
      apply: (config) => {
        config.params = { ...queryParams };
        delete config.params.business_uid;
        config.params.business_id = businessId;
        return { swapLocation: 'query (name)', swapType: 'name', originalParam: 'business_uid', swappedParam: 'business_id' };
      }
    });
  }
  
  // Strategy 4: VALUE SWAP in URL path (numeric ID → UID)
  if (url.includes(businessId)) {
    strategies.push({
      name: 'value_swap_path_id_to_uid',
      description: 'Replace numeric ID with UID in path',
      apply: (config) => {
        config.url = url.replace(businessId, businessUid);
        return { swapLocation: 'path (value)', swapType: 'value', originalValue: businessId, newValue: businessUid };
      }
    });
  }
  
  // Strategy 5: VALUE SWAP in URL path (UID → numeric ID) - reverse direction
  if (url.includes(businessUid)) {
    strategies.push({
      name: 'value_swap_path_uid_to_id',
      description: 'Replace UID with numeric ID in path',
      apply: (config) => {
        config.url = url.replace(businessUid, businessId);
        return { swapLocation: 'path (value)', swapType: 'value', originalValue: businessUid, newValue: businessId };
      }
    });
  }
  
  // Strategy 6: VALUE SWAP in body (keep field name, swap value)
  if (body && typeof body === 'object') {
    if (body.business_id === businessId) {
      strategies.push({
        name: 'value_swap_body_id',
        description: 'Keep business_id field, use UID value in body',
        apply: (config) => {
          config.data = { ...body, business_id: businessUid };
          return { swapLocation: 'body (value)', swapType: 'value', originalValue: businessId, newValue: businessUid };
        }
      });
    }
    if (body.business_uid === businessUid) {
      strategies.push({
        name: 'value_swap_body_uid',
        description: 'Keep business_uid field, use numeric ID value in body',
        apply: (config) => {
          config.data = { ...body, business_uid: businessId };
          return { swapLocation: 'body (value)', swapType: 'value', originalValue: businessUid, newValue: businessId };
        }
      });
    }
    
    // Strategy 7: NAME SWAP in body (business_id → business_uid)
    if (body.hasOwnProperty('business_id')) {
      strategies.push({
        name: 'name_swap_body_id_to_uid',
        description: 'Change field name business_id → business_uid in body',
        apply: (config) => {
          config.data = { ...body };
          delete config.data.business_id;
          config.data.business_uid = businessUid;
          return { swapLocation: 'body (name)', swapType: 'name', originalParam: 'business_id', swappedParam: 'business_uid' };
        }
      });
    }
    
    // Strategy 8: NAME SWAP in body (business_uid → business_id)
    if (body.hasOwnProperty('business_uid')) {
      strategies.push({
        name: 'name_swap_body_uid_to_id',
        description: 'Change field name business_uid → business_id in body',
        apply: (config) => {
          config.data = { ...body };
          delete config.data.business_uid;
          config.data.business_id = businessId;
          return { swapLocation: 'body (name)', swapType: 'name', originalParam: 'business_uid', swappedParam: 'business_id' };
        }
      });
    }
  }
  
  // Try each strategy
  for (const strategy of strategies) {
    console.log(`  [Retry] Trying strategy: ${strategy.description}`);
    
    const retryConfig = { 
      ...originalConfig,
      params: originalConfig.params ? { ...originalConfig.params } : undefined,
      data: originalConfig.data ? JSON.parse(JSON.stringify(originalConfig.data)) : undefined
    };
    
    const swapInfo = strategy.apply(retryConfig);
    
    console.log(`  [Retry] Executing: ${strategy.name}`);
    
    const startTime = Date.now();
    const { response, error } = await rateLimiter.execute(
      () => executeRequest(apiClient, retryConfig)
    );
    const retryDuration = Date.now() - startTime;
    
    console.log(`  [Retry] Response: status=${response?.status}, error=${error?.message || 'none'}`);
    
    if (response && response.status >= 200 && response.status < 300) {
      return {
        success: true,
        response,
        totalDuration: retryDuration,
        swapLocation: swapInfo.swapLocation,
        swapType: swapInfo.swapType,
        originalParam: swapInfo.originalParam || 'business_id',
        swappedParam: swapInfo.swappedParam || 'business_id',
        originalValue: swapInfo.originalValue,
        newValue: swapInfo.newValue,
        isBodySwap: swapInfo.swapLocation.includes('body'),
        isQuerySwap: swapInfo.swapLocation.includes('query')
      };
    }
  }
  
  return { success: false };
}

module.exports = router;
