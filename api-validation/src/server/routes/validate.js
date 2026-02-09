/**
 * Validation API Routes
 * POST /api/validate - Run validation for selected endpoints
 * GET /api/validate/stream - SSE stream for real-time progress
 */

const express = require('express');
const router = express.Router();

const { loadConfig, loadConfigWithTokenValidation } = require('../../core/config');
const { validateAndRefreshTokens, validateAllTokens } = require('../../core/config/token-validator');
const { buildTestSequence, createTestContext } = require('../../core/orchestrator/test-sequencer');
const { parseResourcePath } = require('../../core/orchestrator/resource-grouper');
const { createApiClient, buildRequestConfig, buildRequestConfigAsync, executeRequest, extractUidFromResponse } = require('../../core/runner/api-client');
const { createRateLimiter } = require('../../core/runner/rate-limiter');
const { createParamResolver, extractPathParams, hasParamSource, getParamSource, getNestedValue, deriveListEndpoint, generateResourceKey, smartExtractUid, isStaticParam, getListEndpoint, resolveParamByContext } = require('../../core/runner/param-resolver');
const { askAIForListEndpoint, addLearnedMapping, removeLearnedMapping, getLearnedMapping } = require('../../core/resolver/ai-resolver');
const { validateAgainstSchema, validateStatusCode, buildValidationResult, getSuggestion, detectSwaggerTypeMismatch, FAILURE_REASONS } = require('../../core/validator/response-validator');
const { createReport, addResult, finalizeReport } = require('../../core/reporter/report-generator');
const { runAgentHealer, isUnrecoverableError, extractUidFieldsFromSchema, findUidSourceEndpoints } = require('../../core/runner/ai-agent-healer');
const workflowRepo = require('../../core/workflows/repository');
const { filterKnownIssues } = workflowRepo;

// Store for active validation sessions
const activeSessions = new Map();

/**
 * Check if AI is properly configured based on provider
 * @param {Object} config - Application config
 * @returns {boolean} - True if AI is enabled and has the required API key
 */
function isAIConfigured(config) {
  if (!config.ai?.enabled) return false;
  const provider = config.ai?.provider || 'anthropic';
  const apiKey = provider === 'openai' 
    ? config.ai?.openaiApiKey 
    : config.ai?.anthropicApiKey;
  return !!apiKey;
}

/**
 * Get the appropriate API key based on provider config
 * @param {Object} config - Application config
 * @returns {string|null} - The API key for the configured provider
 */
function getAIApiKey(config) {
  const provider = config.ai?.provider || 'anthropic';
  return provider === 'openai' 
    ? config.ai?.openaiApiKey 
    : config.ai?.anthropicApiKey;
}

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
      listeners: new Set(),
      stopped: false  // Flag to stop execution
    };
    
    activeSessions.set(sessionId, session);
    
    // Start validation in background
    runValidation(session, targetEndpoints, appConfig, options, allEndpoints).catch(error => {
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
      warned: session.results.filter(r => r.status === 'WARN').length,
      errored: session.results.filter(r => r.status === 'ERROR').length,
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
 * POST /api/validate/stop/:sessionId
 * Stop a running validation session
 */
router.post('/stop/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    return res.status(404).json({
      error: 'Session not found',
      message: 'The validation session does not exist or has expired'
    });
  }
  
  if (session.status !== 'running') {
    return res.json({
      success: true,
      message: 'Session is already stopped',
      status: session.status
    });
  }
  
  // Set the stopped flag
  session.stopped = true;
  session.status = 'stopped';
  
  // Broadcast stopped event
  broadcastEvent(session, 'stopped', {
    completed: session.completed,
    total: session.total,
    message: 'Validation stopped by user'
  });
  
  console.log(`Session ${sessionId} stopped by user`);
  
  res.json({
    success: true,
    message: 'Validation stopped',
    completed: session.completed,
    total: session.total
  });
});

/**
 * POST /api/validate/approve-skip
 * Approve a skip suggestion and save it as a skip workflow
 */
router.post('/approve-skip', async (req, res) => {
  try {
    const { endpoint, skipReason, method, path: endpointPath, domain } = req.body;
    
    if (!endpoint || !skipReason) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'endpoint and skipReason are required'
      });
    }
    
    // Save skip workflow
    const workflowRepo = require('../../core/workflows/repository');
    const result = workflowRepo.save(endpoint, {
      domain: domain || 'general',
      status: 'skip',
      skipReason: skipReason,
      summary: `User-approved skip: ${skipReason}`,
      successfulRequest: { method, path: endpointPath }
    });
    
    if (result.success) {
      console.log(`✓ Skip approved for ${endpoint}: ${skipReason}`);
      res.json({
        success: true,
        message: `Skip approved and saved for ${endpoint}`,
        workflowFile: result.file
      });
    } else {
      throw new Error(result.error || 'Failed to save skip workflow');
    }
  } catch (error) {
    console.error('Error approving skip:', error);
    res.status(500).json({
      error: 'Failed to approve skip',
      message: error.message
    });
  }
});

/**
 * POST /api/validate/tokens/check
 * Validate tokens and attempt to refresh expired ones
 */
router.post('/tokens/check', async (req, res) => {
  try {
    const config = loadConfig();
    const { config: updatedConfig, validation } = await validateAndRefreshTokens(config);
    
    res.json({
      success: true,
      valid: Object.keys(validation.valid),
      expired: Object.keys(validation.expired),
      invalid: Object.keys(validation.invalid),
      warnings: validation.warnings,
      errors: validation.errors,
      tokensRefreshed: validation.tokensRefreshed || false
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/setup
 * Run setup-business.js then setup-offering.js to create fresh test business with subscription
 */
router.post('/setup', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const path = require('path');
    const { validateTokenBusinessAssociation } = require('../../core/config/token-validator');
    
    const scriptsDir = path.resolve(__dirname, '../../../scripts');
    let businessOutput = '';
    let offeringOutput = '';
    
    // Step 1: Run setup-business.js
    console.log('Running setup-business.js...');
    businessOutput = execSync('node setup-business.js', { 
      encoding: 'utf8',
      cwd: scriptsDir,
      timeout: 120000, // 2 minutes timeout
      stdio: ['pipe', 'pipe', 'pipe']
    });
    console.log('setup-business.js completed');
    
    // Step 2: Run setup-offering.js to create subscription (optional - may fail if no admin token)
    console.log('Running setup-offering.js...');
    try {
      offeringOutput = execSync('node setup-offering.js', { 
        encoding: 'utf8',
        cwd: scriptsDir,
        timeout: 120000, // 2 minutes timeout
        stdio: ['pipe', 'pipe', 'pipe']
      });
      console.log('setup-offering.js completed');
    } catch (offeringError) {
      // Offering setup is optional - may fail if admin token not configured
      console.log('setup-offering.js failed (optional):', offeringError.message);
      offeringOutput = `[Skipped - ${offeringError.message}]`;
    }
    
    console.log('Setup scripts completed, validating tokens...');
    
    // Reload config to pick up new tokens
    const config = loadConfig();
    
    // Validate token-business association
    const validation = await validateTokenBusinessAssociation(config);
    
    if (!validation.valid) {
      console.error('Token validation failed after setup:', validation.error);
      return res.status(500).json({
        success: false,
        error: validation.error,
        output: (businessOutput + '\n---\n' + offeringOutput).substring(0, 3000),
        message: 'Setup completed but token validation failed'
      });
    }
    
    console.log('Setup complete. Tokens validated.');
    
    res.json({
      success: true,
      message: 'Setup complete. Fresh test business created with subscription and tokens validated.',
      output: (businessOutput + '\n---\n' + offeringOutput).substring(0, 3000),
      businessId: config.params?.business_id || config.params?.business_uid,
      staffId: config.params?.staff_id || config.params?.staff_uid,
      clientId: config.params?.client_id || config.params?.client_uid,
      serviceId: config.params?.service_id,
      hasSubscription: !offeringOutput.startsWith('[Skipped')
    });
    
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
      message: 'Setup failed'
    });
  }
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
 * @param {Object[]} allEndpoints - All available endpoints (for AI resolver)
 */
async function runValidation(session, endpoints, appConfig, options = {}, allEndpoints = []) {
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
  broadcastEvent(session, 'preflight', { 
    phase: 'Analyzing required parameters...', 
    status: 'Preparing tests',
    progress: { current: 0, total: 0 }
  });
  
  const preflightParams = await fetchMissingParams(
    endpoints,
    paramResolver,
    apiClient,
    rateLimiter,
    config,
    (msg) => broadcastEvent(session, 'log', { message: msg }),
    testContext,
    allEndpoints,
    // Progress callback for UI updates
    (progress) => broadcastEvent(session, 'preflight', progress)
  );
  
  broadcastEvent(session, 'preflight', { 
    phase: 'Parameters resolved', 
    status: `Ready to test ${endpoints.length} endpoint(s)`,
    progress: { current: 100, total: 100, done: true }
  });
  
  // Add pre-fetched params to test context
  for (const [param, value] of Object.entries(preflightParams)) {
    testContext.setParam(param, value);
  }
  
  for (const testItem of sequence) {
    // Check if execution was stopped
    if (session.stopped) {
      console.log(`Session ${session.id} stopped - aborting remaining tests`);
      break;
    }
    
    let { endpoint, phase, captureUid, requiresUid, skip, skipReason, resourceKey } = testItem;
    
    // Check for user-approved skip workflows BEFORE running the test
    if (!skip) {
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      const existingWorkflow = workflowRepo.get(endpointKey);
      if (existingWorkflow && existingWorkflow.status === 'skip') {
        skip = true;
        skipReason = existingWorkflow.skipReason || existingWorkflow.summary || 'User-approved skip workflow';
        console.log(`⏭️ Skipping ${endpointKey}: ${skipReason}`);
      }
    }
    
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
          // Don't skip immediately - let the AI healer try to resolve the UID
          // Only skip if healing is disabled
          if (!isAIConfigured(config)) {
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
                friendlyMessage: 'Required UID not available (healing disabled)'
              }
            };
          } else {
            // Mark that we need UID resolution - healer will handle it
            context.needsUidResolution = true;
            context.missingUidParam = resourceKey;
          }
        } else {
          context.uid = uid;
        }
      }
      
      if (!result) {
        // Build and execute request (use async version with AI if enabled)
        const useAI = isAIConfigured(config);
        let buildResult = useAI 
          ? await buildRequestConfigAsync(endpoint, config, context)
          : buildRequestConfig(endpoint, config, context);
        
        // If endpoint needs a client token and we don't have one, try to acquire it
        if (buildResult.needsClientToken && !config.tokens?.client) {
          console.log(`  [Token] Endpoint requires client token - attempting to acquire one...`);
          try {
            const axios = require('axios');
            const baseUrl = config.baseUrl;
            const staffToken = config.tokens?.staff || config.tokens?.directory;
            const businessUid = config.params?.business_uid;
            
            if (staffToken && businessUid) {
              // First, check if we have a specific client_uid configured
              let clientEmail = null;
              const configuredClientUid = config.params?.client_uid;
              
              if (configuredClientUid) {
                // Try to get email from configured client
                try {
                  const clientResponse = await axios.get(`${baseUrl}/platform/v1/clients/${configuredClientUid}`, {
                    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
                  });
                  clientEmail = clientResponse.data?.data?.email;
                  console.log(`  [Token] Configured client ${configuredClientUid} email: ${clientEmail || 'NONE'}`);
                } catch (e) {
                  console.log(`  [Token] Failed to fetch configured client: ${e.message}`);
                }
              }
              
              // If no email from configured client, search for a client with email
              if (!clientEmail) {
                const clientsResponse = await axios.get(`${baseUrl}/platform/v1/clients?per_page=50`, {
                  headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' }
                });
                const clients = clientsResponse.data?.data?.clients || [];
                console.log(`  [Token] Found ${clients.length} clients, checking for emails...`);
                
                // Log all clients and their emails for debugging
                clients.forEach((c, i) => {
                  if (i < 5) console.log(`  [Token] Client ${c.id || c.uid}: email=${c.email || 'NONE'}`);
                });
                
                const clientWithEmail = clients.find(c => c.email && c.email.includes('@'));
                if (clientWithEmail) {
                  clientEmail = clientWithEmail.email;
                  console.log(`  [Token] Found client with email: ${clientEmail}`);
                } else {
                  console.log(`  [Token] No clients with valid email found. Cannot acquire client token.`);
                }
              }
              
              if (clientEmail) {
                // Step 2: Send login link with .dev suffix
                const devEmail = clientEmail.endsWith('.dev') ? clientEmail : `${clientEmail}.dev`;
                console.log(`  [Token] Sending login link to: ${devEmail}`);
                
                const loginResponse = await axios.post(
                  `${baseUrl}/client_api/v1/portals/${businessUid}/authentications/send_login_link`,
                  { email: devEmail },
                  { headers: { 'Content-Type': 'application/json' } }
                );
                
                if (loginResponse.data?.token) {
                  // Step 3: Exchange for JWT
                  const jwtResponse = await axios.post(
                    `${baseUrl}/client_api/v1/portals/${businessUid}/authentications/get_jwt_token_from_authentication_token`,
                    { auth_token: loginResponse.data.token },
                    { headers: { 'Content-Type': 'application/json' } }
                  );
                  
                  if (jwtResponse.data?.token) {
                    console.log(`  [Token] Successfully acquired client JWT for ${clientEmail}`);
                    config.tokens = config.tokens || {};
                    config.tokens.client = jwtResponse.data.token;
                    
                    // Rebuild request config with new token
                    buildResult = useAI 
                      ? await buildRequestConfigAsync(endpoint, config, context)
                      : buildRequestConfig(endpoint, config, context);
                  } else {
                    console.log(`  [Token] JWT exchange failed - no token in response`);
                  }
                } else {
                  console.log(`  [Token] Login link response did not contain token. Environment may not support .dev suffix.`);
                }
              }
            } else {
              console.log(`  [Token] Cannot acquire client token: missing staffToken (${!!staffToken}) or businessUid (${businessUid})`);
            }
          } catch (tokenError) {
            console.log(`  [Token] Failed to acquire client token: ${tokenError.message}`);
            if (tokenError.response?.data) {
              console.log(`  [Token] Error response: ${JSON.stringify(tokenError.response.data)}`);
            }
          }
        }
        
        const { config: requestConfig, tokenType, hasToken, skip, skipReason, isFallbackToken } = buildResult;
        
        // Log request body for debugging
        if (requestConfig && requestConfig.data) {
          console.log(`  [DEBUG] Request body generated:`, JSON.stringify(requestConfig.data, null, 2).substring(0, 500));
        }
        
        // Handle unresolved path parameters
        if (skip) {
          // If AI healing is enabled, mark as FAIL (not SKIP) so healer can resolve
          const shouldHeal = isAIConfigured(config);
          result = {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            domain: endpoint.domain,
            method: endpoint.method,
            path: endpoint.path,
            status: shouldHeal ? 'FAIL' : 'SKIP',  // FAIL triggers healing
            httpStatus: null,
            duration: '0ms',
            tokenUsed: tokenType,
            details: {
              reason: shouldHeal ? 'MISSING_PARAMS_NEED_HEALING' : 'MISSING_PATH_PARAMS',
              friendlyMessage: skipReason,
              needsUidResolution: shouldHeal
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
          
          let { success, response, duration, error, usedFallback, fallbackInfo } = await rateLimiter.execute(
            () => executeRequest(apiClient, requestConfig)
          );
          console.log(`  Response: status=${response?.status}, duration=${duration}ms, error=${error?.message || 'none'}${usedFallback ? ', usedFallback=true' : ''}`);
          
          // Build full request info for debugging (including actual URL and token)
          const fullRequestInfo = {
            method: requestConfig.method?.toUpperCase() || endpoint.method,
            url: usedFallback ? `${fallbackInfo.fallbackUrl}${requestConfig.url}` : `${config.baseUrl}${requestConfig.url}`,
            headers: { ...requestConfig.headers },
            params: requestConfig.params,
            data: requestConfig.data
          };
          
          // Track documentation issues found during validation
          let docIssues = [];
          
          // Track if fallback URL was used due to bad gateway error (502 or 404 with "bad gateway" message)
          if (usedFallback && fallbackInfo) {
            console.log(`  [Fallback] Primary URL returned bad gateway error (status ${fallbackInfo.primaryStatus}), succeeded on fallback URL`);
            docIssues.push({
              type: FAILURE_REASONS.BAD_GATEWAY_FALLBACK,
              message: `Primary URL (${fallbackInfo.primaryUrl}) returned bad gateway error (status ${fallbackInfo.primaryStatus}). Request succeeded using fallback URL (${fallbackInfo.fallbackUrl}).`,
              suggestion: `Investigate gateway/load balancer issues on the primary URL. The fallback URL is working correctly.`,
              primaryUrl: fallbackInfo.primaryUrl,
              fallbackUrl: fallbackInfo.fallbackUrl,
              primaryStatus: fallbackInfo.primaryStatus,
              fallbackStatus: fallbackInfo.fallbackStatus,
              fallbackDuration: fallbackInfo.fallbackDuration
            });
          }
          
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
              
              // Update fullRequestInfo with the successful retry request config
              if (retryResult.requestConfig) {
                fullRequestInfo.method = retryResult.requestConfig.method?.toUpperCase() || fullRequestInfo.method;
                fullRequestInfo.url = `${config.baseUrl}${retryResult.requestConfig.url}`;
                fullRequestInfo.params = retryResult.requestConfig.params;
                fullRequestInfo.data = retryResult.requestConfig.data;
              }
              
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
            const statusValidation = validateStatusCode(response.status, endpoint.responses, response.data);
            const isSuccessStatus = response.status >= 200 && response.status < 300;
            
            if (!statusValidation.valid) {
              // Status code is NOT documented in the spec
              // Check if this is an expected business error (409 Conflict, 404 Resource Not Found)
              const isExpectedError = statusValidation.error?.isExpectedError || 
                                      statusValidation.error?.reason === FAILURE_REASONS.RESOURCE_NOT_FOUND ||
                                      statusValidation.error?.reason === FAILURE_REASONS.CONFLICT;
              
              result = buildValidationResult({
                endpoint,
                status: isExpectedError ? 'ERROR' : 'FAIL',
                httpStatus: response.status,
                duration,
                tokenUsed: tokenType,
                reason: statusValidation.error.reason,
                suggestion: getSuggestion(statusValidation.error.reason, { tokenType }),
                request: fullRequestInfo,
                response: { status: response.status, headers: response.headers, data: response.data }
              });
            } else {
              // Status code IS documented - validate response body against schema
              const responseSpec = endpoint.responses?.[response.status] || endpoint.responses?.[String(response.status)];
              const responseSchema = responseSpec?.content?.['application/json']?.schema;
              
              let schemaValidation = { valid: true, errors: [], warnings: [] };
              if (responseSchema && response.data) {
                schemaValidation = validateAgainstSchema(response.data, responseSchema);
              }
              
              // Check for known issues from workflow and filter them out
              const endpointKey = `${endpoint.method} ${endpoint.path}`;
              const existingWorkflowForFilter = workflowRepo.get(endpointKey);
              const knownIssues = existingWorkflowForFilter?.knownIssues || [];
              
              let suppressedCount = 0;
              if (knownIssues.length > 0 && schemaValidation.errors?.length > 0) {
                const filterResult = filterKnownIssues(schemaValidation.errors, knownIssues);
                schemaValidation.errors = filterResult.filteredErrors;
                suppressedCount = filterResult.suppressedCount;
                
                // If all errors were known issues, mark validation as valid
                if (schemaValidation.errors.length === 0 && suppressedCount > 0) {
                  schemaValidation.valid = true;
                  console.log(`  [KnownIssue] All ${suppressedCount} schema error(s) matched known issues - treating as PASS`);
                }
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
              
              // Add undocumented field warnings as doc issues
              const undocumentedWarnings = schemaValidation.warnings || [];
              if (undocumentedWarnings.length > 0) {
                for (const warning of undocumentedWarnings) {
                  allErrors.push({
                    reason: warning.reason,
                    message: warning.message,
                    friendlyMessage: warning.friendlyMessage,
                    suggestion: 'Add this field to the entity schema documentation.'
                  });
                }
              }
              
              // Determine status based on HTTP status and validation results:
              // - PASS: 2xx + schema OK + no doc issues
              // - WARN: 2xx + (doc issues OR schema issues)
              // - ERROR: non-2xx + schema OK (expected error response)
              // - FAIL: non-2xx + schema mismatch
              
              if (isSuccessStatus) {
                // 2xx response
                const hasDocIssues = docIssues.length > 0 || undocumentedWarnings.length > 0;
                
                if (hasDocIssues) {
                  const primaryIssue = docIssues[0] || undocumentedWarnings[0];
                  result = buildValidationResult({
                    endpoint,
                    status: 'WARN',
                    httpStatus: response.status,
                    duration,
                    tokenUsed: tokenType,
                    reason: primaryIssue.type || primaryIssue.reason || 'DOC_ISSUE',
                    errors: allErrors,
                    request: fullRequestInfo,
                    response: { status: response.status, headers: response.headers, data: response.data },
                    suggestion: primaryIssue.suggestion || 'Update the API documentation to match the actual response.'
                  });
                } else if (!schemaValidation.valid) {
                  result = buildValidationResult({
                    endpoint,
                    status: 'WARN',
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
              } else {
                // Non-2xx response (but status IS documented)
                // First, check if this is a swagger type mismatch (validation error due to wrong type in swagger)
                const typeMismatch = detectSwaggerTypeMismatch(
                  response.data, 
                  fullRequestInfo.data, 
                  endpoint.requestSchema
                );
                
                if (typeMismatch) {
                  // FAIL: Swagger has wrong type definition - this is a documentation bug
                  result = buildValidationResult({
                    endpoint,
                    status: 'FAIL',
                    httpStatus: response.status,
                    duration,
                    tokenUsed: tokenType,
                    reason: FAILURE_REASONS.SWAGGER_TYPE_MISMATCH,
                    errors: [{
                      reason: FAILURE_REASONS.SWAGGER_TYPE_MISMATCH,
                      field: typeMismatch.field,
                      swaggerType: typeMismatch.swaggerType,
                      apiExpectedType: typeMismatch.apiExpectedType,
                      message: typeMismatch.message,
                      friendlyMessage: `Swagger type mismatch: Field '${typeMismatch.field}' is defined as '${typeMismatch.swaggerType}' in swagger, but API expects '${typeMismatch.apiExpectedType}'.`
                    }],
                    request: fullRequestInfo,
                    response: { status: response.status, headers: response.headers, data: response.data },
                    suggestion: typeMismatch.suggestion || getSuggestion(FAILURE_REASONS.SWAGGER_TYPE_MISMATCH, typeMismatch)
                  });
                } else if (schemaValidation.valid) {
                  // ERROR: API returned documented error with correct schema (no type mismatch detected)
                  result = buildValidationResult({
                    endpoint,
                    status: 'ERROR',
                    httpStatus: response.status,
                    duration,
                    tokenUsed: tokenType,
                    reason: FAILURE_REASONS.EXPECTED_ERROR,
                    request: fullRequestInfo,
                    response: { status: response.status, headers: response.headers, data: response.data }
                  });
                } else {
                  // FAIL: Non-2xx AND schema mismatch
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
                }
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
    
    // ============== SELF-HEALING LOGIC ==============
    // Deterministic UID resolution approach:
    // 1. Agent extracts required UIDs from swagger schema
    // 2. For each UID: GET existing entity, or POST to create
    // 3. Only after ALL UIDs resolved, retry original request
    // 4. UID resolution steps are NOT counted as retries
    if ((result.status === 'FAIL' || result.status === 'ERROR') && config.ai?.enabled) {
      // Check if this is an unrecoverable error
      if (!isUnrecoverableError(result)) {
        const endpointKey = `${endpoint.method} ${endpoint.path}`;
        
        // Broadcast healing start
        console.log(`\n=== AI HEALER TRIGGERED for ${endpointKey} ===`);
        console.log(`  Original Error: ${result.httpStatus} - ${result.details?.reason || 'Unknown error'}`);
        console.log(`  Original Request Body:`, JSON.stringify(result.details?.request?.data, null, 2)?.substring(0, 500) || 'none');
        console.log(`  Original Response:`, JSON.stringify(result.details?.response, null, 2)?.substring(0, 300) || 'none');
        
        broadcastEvent(session, 'healing_start', {
          endpoint: endpointKey,
          originalError: `${result.httpStatus} - ${result.details?.reason || 'Unknown error'}`,
          maxRetries: 30,
          mode: 'deterministic_uid_resolution'
        });
        
        // Run the AI Agent healer with deterministic UID resolution
        const healingResult = await runAgentHealer({
          endpoint,
          result,
          resolvedParams: testContext.getParams(),
          allEndpoints,
          config,
          apiClient,
          maxRetries: 30,  // Increased to allow source code exploration
          onProgress: (progress) => {
            // Map agent events to SSE
            const eventMap = {
              'agent_start': 'healing_analyzing',
              'agent_thinking': 'healing_analyzing',
              'agent_thought': 'healing_analyzing',
              'agent_tool_call': 'healing_creating',
              'agent_tool_result': 'healing_created',
              'agent_complete': 'healing_complete'
            };
            
            broadcastEvent(session, eventMap[progress.type] || 'healing_analyzing', {
              endpoint: endpointKey,
              ...progress
            });
          }
        });
        
        // Process doc fix suggestions
        console.log(`\n=== AI HEALER COMPLETED ===`);
        console.log(`  Success: ${healingResult.success}`);
        console.log(`  Summary: ${healingResult.summary}`);
        console.log(`  Doc Issues Count: ${healingResult.docFixSuggestions?.length || 0}`);
        if (healingResult.docFixSuggestions?.length > 0) {
          console.log(`  Doc Issues:`, JSON.stringify(healingResult.docFixSuggestions, null, 2));
        }
        
        if (healingResult.docFixSuggestions?.length > 0) {
          result.details = result.details || {};
          result.details.documentationIssues = healingResult.docFixSuggestions;
          result.details.errors = [
            ...(result.details.errors || []),
            ...healingResult.docFixSuggestions.map(issue => ({
              reason: issue.type || 'DOCUMENTATION_ISSUE',
              message: issue.issue,
              friendlyMessage: issue.issue,
              suggestion: issue.suggested_fix,
              field: issue.field
            }))
          ];
        }
        
        if (healingResult.success) {
          // Check for documentation issues - use for status determination
          const hasDocIssues = healingResult.docFixSuggestions?.length > 0;
          
          // Agent fixed it! Get the last successful retry from the log
          const lastSuccess = healingResult.healingLog
            ?.filter(l => l.type === 'tool_result' && l.result?.success && l.result?.status >= 200 && l.result?.status < 300 && l.result?.isRetry)
            ?.pop();
          
          if (lastSuccess) {
            // Set status to WARN if there are documentation issues, otherwise PASS
            result.status = hasDocIssues ? 'WARN' : 'PASS';
            result.httpStatus = lastSuccess.result.status;
            // Clear the old failure reason since we succeeded
            result.reason = hasDocIssues ? 'DOCUMENTATION_ISSUES' : null;
            // Update errors to show doc issues instead of original validation errors
            result.errors = hasDocIssues 
              ? healingResult.docFixSuggestions.map(d => ({ path: '/', message: d.issue }))
              : [];
            result.details = result.details || {};
            result.details.response = { data: lastSuccess.result.data };
            // Store the retry request info for UI display (cURL generation, view request/response)
            if (lastSuccess.result.requestConfig) {
              result.details.request = lastSuccess.result.requestConfig;
            }
            result.details.healingInfo = {
              mode: 'deterministic_uid_resolution',
              iterations: healingResult.iterations,
              retryCount: healingResult.retryCount,
              summary: healingResult.summary,
              agentLog: healingResult.healingLog,
              docFixSuggestions: healingResult.docFixSuggestions || [],
              savedWorkflows: healingResult.savedWorkflows || [],
              workflowStatus: healingResult.savedWorkflows?.length > 0 ? 'New' : 'N/A',
              hasDocumentationIssues: hasDocIssues
            };
          } else if (healingResult.finalResponse) {
            // Workflow test request succeeded directly (without going through AI healing log)
            result.status = hasDocIssues ? 'WARN' : 'PASS';
            result.httpStatus = healingResult.finalResponse.status;
            // Clear the old failure reason since we succeeded
            result.reason = hasDocIssues ? 'DOCUMENTATION_ISSUES' : null;
            // Update errors to show doc issues instead of original validation errors
            result.errors = hasDocIssues 
              ? healingResult.docFixSuggestions.map(d => ({ path: '/', message: d.issue }))
              : [];
            result.details = result.details || {};
            result.details.response = { data: healingResult.finalResponse.data };
            // Store the workflow request info for UI display
            if (healingResult.finalRequest) {
              result.details.request = {
                method: healingResult.finalRequest.method,
                url: `${healingResult.finalRequest.baseUrl}${healingResult.finalRequest.path}`,
                body: healingResult.finalRequest.body,
                headers: { 'Content-Type': 'application/json' }
              };
            }
            result.details.healingInfo = {
              mode: 'workflow_test_request',
              followedWorkflow: healingResult.followedWorkflow,
              usedFallback: healingResult.usedFallback,
              summary: healingResult.summary,
              agentLog: healingResult.healingLog || [],
              docFixSuggestions: healingResult.docFixSuggestions || [],
              savedWorkflows: healingResult.savedWorkflows || [],
              workflowStatus: healingResult.followedWorkflow ? 'Followed' : 'N/A',
              hasDocumentationIssues: hasDocIssues
            };
          }
          
          // Update resolved params with what the agent learned
          if (healingResult.resolvedParams) {
            testContext.setParams({ ...testContext.getParams(), ...healingResult.resolvedParams });
          }
          broadcastEvent(session, 'healing_complete', {
            endpoint: endpointKey,
            success: true,
            status: hasDocIssues ? 'WARN' : 'PASS',
            hasDocumentationIssues: hasDocIssues,
            iterations: healingResult.iterations,
            retryCount: healingResult.retryCount,
            summary: healingResult.summary,
            workflowSaved: healingResult.savedWorkflows?.length > 0,
            docFixCount: healingResult.docFixSuggestions?.length || 0,
            // Include updated result so UI can update in place
            updatedResult: result
          });
        } else if (healingResult.skip || healingResult.skipSuggestion) {
          // Agent suggests this should be skipped (requires user approval)
          // Mark as FAIL with skipSuggestion flag - user can approve skip in UI
          result.status = 'FAIL';  // Mark as FAIL, not SKIP - user must approve
          result.details = result.details || {};
          result.details.healingInfo = {
            mode: 'deterministic_uid_resolution',
            skipSuggestion: true,  // Flag for UI to show "Approve Skip" button
            skipReason: healingResult.skipReason,
            iterations: healingResult.iterations,
            retryCount: healingResult.retryCount,
            summary: healingResult.summary,
            agentLog: healingResult.healingLog,
            docFixSuggestions: healingResult.docFixSuggestions || [],
            savedWorkflows: [],  // Don't save skip workflows automatically
            workflowStatus: 'Pending Skip Approval'
          };
          
          // Update resolved params with what the agent learned
          if (healingResult.resolvedParams) {
            testContext.setParams({ ...testContext.getParams(), ...healingResult.resolvedParams });
          }
          
          broadcastEvent(session, 'healing_complete', {
            endpoint: endpointKey,
            success: false,
            skipSuggestion: true,  // UI will show "Approve Skip" button
            skipReason: healingResult.skipReason,
            iterations: healingResult.iterations,
            retryCount: healingResult.retryCount,
            summary: healingResult.summary,
            workflowSaved: false,
            docFixCount: healingResult.docFixSuggestions?.length || 0,
            // Include updated result so UI can update in place
            updatedResult: result
          });
        } else {
          // Agent couldn't fix it
          result.details = result.details || {};
          result.details.healingInfo = {
            mode: 'deterministic_uid_resolution',
            attempted: true,
            iterations: healingResult.iterations,
            retryCount: healingResult.retryCount,
            failed: true,
            reason: healingResult.reason,
            unresolvedUids: healingResult.unresolvedUids || [],
            agentLog: healingResult.healingLog,
            docFixSuggestions: healingResult.docFixSuggestions || [],
            workflowStatus: 'Failed'
          };
          
          broadcastEvent(session, 'healing_complete', {
            endpoint: endpointKey,
            success: false,
            iterations: healingResult.iterations,
            retryCount: healingResult.retryCount,
            reason: healingResult.reason,
            unresolvedUids: healingResult.unresolvedUids || [],
            docFixCount: healingResult.docFixSuggestions?.length || 0,
            // Include updated result so UI can update in place (shows healing info even if failed)
            updatedResult: result
          });
        }
      }
    }
    // ============== END SELF-HEALING LOGIC ==============
    
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
  
  // Don't override status if already stopped
  if (session.status !== 'stopped') {
    session.status = 'completed';
  }
  session.report = report;
  
  // Broadcast completion (only if not already stopped)
  if (!session.stopped) {
    broadcastEvent(session, 'complete', {
      status: 'completed',
      passed: report.summary.passed,
      failed: report.summary.failed,
      warned: report.summary.warned,
      errored: report.summary.errored,
      skipped: report.summary.skipped,
      passRate: report.summary.passRate,
      duration: report.summary.duration
    });
  }
}

/**
 * Retry an endpoint test with new parameters
 * Used by self-healing to re-test after creating prerequisites
 * @param {Object} endpoint - Endpoint to test
 * @param {Object} newParams - New resolved parameters
 * @param {Object} config - App config
 * @param {Object} apiClient - Axios instance
 * @param {Object} testContext - Test context
 * @returns {Promise<Object>} Test result
 */
async function retryEndpointTest(endpoint, newParams, config, apiClient, testContext, bodyOverride = null) {
  const startTime = Date.now();
  
  try {
    // Build request with new params
    const context = {
      params: { ...testContext.getParams(), ...newParams }
    };
    
    let { config: requestConfig, tokenType, hasToken, skip, skipReason } = 
      await buildRequestConfigAsync(endpoint, config, context);
    
    // Apply body override if provided (for parameter variations)
    if (bodyOverride && requestConfig.data) {
      requestConfig.data = bodyOverride;
    }
    
    if (skip) {
      return buildValidationResult({
        endpoint,
        status: 'SKIP',
        httpStatus: null,
        duration: Date.now() - startTime,
        tokenUsed: tokenType,
        reason: 'SKIPPED',
        errors: [{ message: skipReason }]
      });
    }
    
    // Execute request
    const response = await executeRequest(apiClient, requestConfig);
    const duration = Date.now() - startTime;
    
    // Validate response
    const isSuccessStatus = response.status >= 200 && response.status < 300;
    const statusValidation = validateStatusCode(response.status, endpoint.responses, response.data);
    
    if (isSuccessStatus) {
      // Get response schema and validate
      const responseSpec = endpoint.responses?.[response.status] || endpoint.responses?.[String(response.status)];
      const responseSchema = responseSpec?.content?.['application/json']?.schema;
      
      let schemaValidation = { valid: true, errors: [], warnings: [] };
      if (responseSchema && response.data) {
        schemaValidation = validateAgainstSchema(response.data, responseSchema);
      }
      
      if (!schemaValidation.valid) {
        return buildValidationResult({
          endpoint,
          status: 'WARN',
          httpStatus: response.status,
          duration,
          tokenUsed: tokenType,
          reason: FAILURE_REASONS.SCHEMA_MISMATCH,
          errors: schemaValidation.errors,
          request: requestConfig,
          response: { status: response.status, headers: response.headers, data: response.data },
          suggestion: getSuggestion(FAILURE_REASONS.SCHEMA_MISMATCH)
        });
      }
      
      return buildValidationResult({
        endpoint,
        status: 'PASS',
        httpStatus: response.status,
        duration,
        tokenUsed: tokenType,
        request: requestConfig,
        response: { status: response.status, headers: response.headers, data: response.data }
      });
    } else {
      // Non-success status
      return buildValidationResult({
        endpoint,
        status: statusValidation.error?.isExpectedError ? 'ERROR' : 'FAIL',
        httpStatus: response.status,
        duration,
        tokenUsed: tokenType,
        reason: statusValidation.error?.reason || FAILURE_REASONS.UNEXPECTED_STATUS_CODE,
        request: requestConfig,
        response: { status: response.status, headers: response.headers, data: response.data },
        suggestion: getSuggestion(statusValidation.error?.reason || FAILURE_REASONS.UNEXPECTED_STATUS_CODE)
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    
    return buildValidationResult({
      endpoint,
      status: 'FAIL',
      httpStatus: error.response?.status || null,
      duration,
      tokenUsed: null,
      reason: error.code === 'ECONNABORTED' ? FAILURE_REASONS.TIMEOUT : FAILURE_REASONS.NETWORK_ERROR,
      errors: [{ message: error.message }]
    });
  }
}

/**
 * Extract uid/id field names from a request body schema
 * @param {Object} schema - JSON schema for request body
 * @param {string} prefix - Property path prefix
 * @returns {string[]} Array of uid/id field names
 */
function extractBodyUidFields(schema, prefix = '') {
  const fields = [];
  if (!schema) return fields;
  
  // Handle allOf
  if (schema.allOf) {
    for (const subSchema of schema.allOf) {
      fields.push(...extractBodyUidFields(subSchema, prefix));
    }
    return fields;
  }
  
  // Handle properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const fullPath = prefix ? `${prefix}.${propName}` : propName;
      
      // Check if this is a uid/id field
      if (propName.endsWith('_uid') || propName.endsWith('_id') || propName === 'uid' || propName === 'id') {
        // Only add if it's not a read-only field (uid, created_at, updated_at are typically read-only)
        if (propName !== 'uid' && propName !== 'id') {
          fields.push(propName);
        }
      }
      
      // Recurse into nested objects (but not too deep)
      if (propSchema.type === 'object' && propSchema.properties && !prefix.includes('.')) {
        fields.push(...extractBodyUidFields(propSchema, fullPath));
      }
    }
  }
  
  return fields;
}

/**
 * Pre-flight: Fetch missing dynamic parameters from source endpoints
 * @param {Object[]} endpoints - Endpoints to be tested
 * @param {Object} paramResolver - Parameter resolver instance
 * @param {Object} apiClient - Axios client
 * @param {Object} rateLimiter - Rate limiter
 * @param {Object} config - Configuration
 * @param {Function} log - Logging function
 * @param {Object} testContext - Test context for storing UIDs
 * @param {Object[]} allEndpoints - All available endpoints (for AI resolver)
 * @returns {Promise<Object>} Resolved parameters
 */
async function fetchMissingParams(endpoints, paramResolver, apiClient, rateLimiter, config, log, testContext, allEndpoints, onProgress) {
  console.log(`\n========== PRE-FLIGHT PHASE ==========`);
  console.log(`[Pre-flight] Processing ${endpoints.length} endpoint(s):`);
  endpoints.forEach(e => console.log(`  - ${e.method} ${e.path}`));
  
  // Progress tracking
  let totalParamsToResolve = 0;
  let resolvedCount = 0;
  
  // Helper to report progress
  const reportProgress = (phase, status, details = {}) => {
    if (typeof onProgress === 'function') {
      onProgress({ 
        phase, 
        status, 
        progress: { 
          resolved: resolvedCount, 
          total: totalParamsToResolve,
          ...details 
        } 
      });
    }
  };
  
  const resolvedParams = {};
  const fetchedEndpoints = new Set();
  
  // Collect all required params from all endpoints (path params + required query params + body uid fields)
  const allRequiredParams = new Set();
  // Map generic params to their context-specific versions for substitution
  const paramContextMap = {};
  
  for (const endpoint of endpoints) {
    // Path parameters (e.g., {client_uid} or generic {uid})
    const pathParams = extractPathParams(endpoint.path);
    for (const param of pathParams) {
      // Apply context-aware resolution for generic params like 'uid' or 'id'
      const resolvedParam = resolveParamByContext(param, endpoint.path);
      allRequiredParams.add(resolvedParam);
      
      // Store mapping so we know to substitute {uid} with client_uid value later
      if (resolvedParam !== param) {
        paramContextMap[`${endpoint.path}:${param}`] = resolvedParam;
        console.log(`[Pre-flight] Context mapping for ${endpoint.path}: {${param}} -> ${resolvedParam}`);
      }
    }
    
    // Required query parameters (e.g., ai_chat_uid for bizai_chat_messages)
    const queryParams = endpoint.parameters?.query || [];
    console.log(`[Pre-flight] ${endpoint.method} ${endpoint.path} has ${queryParams.length} query params`);
    for (const qp of queryParams) {
      console.log(`[Pre-flight]   - ${qp.name} (required: ${qp.required})`);
      if (qp.required && qp.name) {
        allRequiredParams.add(qp.name);
      }
    }
    
    // Request body uid/id fields for POST/PUT/PATCH (to pre-fetch values)
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestSchema) {
      const bodyUidFields = extractBodyUidFields(endpoint.requestSchema);
      for (const field of bodyUidFields) {
        console.log(`[Pre-flight]   - body field: ${field} (uid/id)`);
        allRequiredParams.add(field);
      }
    }
  }
  
  console.log(`[Pre-flight] All required params: [${Array.from(allRequiredParams).join(', ')}]`);
  console.log(`[Pre-flight] hasParamSource('ai_chat_uid'): ${hasParamSource('ai_chat_uid')}`);
  console.log(`[Pre-flight] hasParamSource('bizai_chat_uid'): ${hasParamSource('bizai_chat_uid')}`);
  if (hasParamSource('ai_chat_uid')) {
    console.log(`[Pre-flight] ai_chat_uid source:`, JSON.stringify(getParamSource('ai_chat_uid')));
  }
  
  // Filter to only dynamic params that have sources and aren't already configured
  const staticParams = config.params || {};
  const paramsToFetch = [];
  
  // Track which params share the same endpoint so we can store values under all of them
  const endpointToParams = new Map(); // endpoint -> [param1, param2, ...]
  
  for (const param of allRequiredParams) {
    // Skip if already in static config
    if (staticParams[param] && !staticParams[param].includes('your-')) {
      continue;
    }
    
    // Check if we have a source for this param
    if (hasParamSource(param)) {
      const source = getParamSource(param);
      if (source.endpoint) {
        // Track all params that use this endpoint
        if (!endpointToParams.has(source.endpoint)) {
          endpointToParams.set(source.endpoint, []);
        }
        endpointToParams.get(source.endpoint).push(param);
        
        // Only add to fetch list if not already fetched
        if (!fetchedEndpoints.has(source.endpoint)) {
          paramsToFetch.push({ param, ...source });
          fetchedEndpoints.add(source.endpoint);
        }
      }
    }
  }
  
  console.log(`[Pre-flight] paramsToFetch: ${JSON.stringify(paramsToFetch.map(p => p.param))}`);
  console.log(`[Pre-flight] endpointToParams map: ${JSON.stringify(Array.from(endpointToParams.entries()))}`);
  
  // Count total params to resolve (from PARAM_SOURCES + derivations needed)
  totalParamsToResolve = paramsToFetch.length;
  reportProgress('Analyzing', `Found ${totalParamsToResolve} parameter(s) to resolve`);
  
  // ========== PHASE 1: Resolve params from PARAM_SOURCES ==========
  if (paramsToFetch.length > 0) {
    console.log(`[Pre-flight Phase 1] Fetching ${paramsToFetch.length} known parameter(s)...`);
    reportProgress('Phase 1: Known sources', `Fetching from known endpoints...`);
    // Broadcast preflight progress to UI
    if (typeof log === 'function') {
      log(`Pre-flight Phase 1: Fetching ${paramsToFetch.length} known parameter(s)...`);
    }
    
    // Fetch each source endpoint
    for (const { param, endpoint, field, arrayPath } of paramsToFetch) {
      try {
        reportProgress('Phase 1: Known sources', `Fetching ${param}...`);
        console.log(`[Pre-flight Phase 1] Fetching ${param} from ${endpoint}...`);
        log(`  Fetching ${param} from ${endpoint}...`);
        
        // Build a simple GET request with the first available token
        const token = config.tokens?.staff || config.tokens?.directory || Object.values(config.tokens || {})[0];
        console.log(`[Pre-flight Phase 1] Using token: ${token ? 'yes' : 'NO TOKEN'}`);
        
        const requestConfig = {
          method: 'get',
          url: endpoint,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          params: { page: 1, per_page: 1 }
        };
        
        console.log(`[Pre-flight Phase 1] Making request to: ${endpoint}`);
        const { response, error } = await rateLimiter.execute(
          () => executeRequest(apiClient, requestConfig)
        );
        
        console.log(`[Pre-flight Phase 1] Response: status=${response?.status}, error=${error?.message || 'none'}`);
        
        if (response && response.status >= 200 && response.status < 300 && response.data) {
          console.log(`[Pre-flight Phase 1] Got successful response, data keys: ${Object.keys(response.data).join(', ')}`);
          console.log(`[Pre-flight Phase 1] Looking for arrayPath: ${arrayPath}`);
          // Extract the value
          let items = arrayPath ? getNestedValue(response.data, arrayPath) : response.data;
          
          // Handle nested data wrapper
          if (!items && response.data.data) {
            items = arrayPath ? getNestedValue(response.data.data, arrayPath.replace('data.', '')) : response.data.data;
          }
          
          // Build list of fields to try (configured field + common alternatives)
          const fieldsToTry = [field, 'uid', 'id'];
          // Also try the param name without _uid/_id suffix as a field
          if (param.endsWith('_uid')) {
            fieldsToTry.push(param, param.replace(/_uid$/, '_id'));
          } else if (param.endsWith('_id')) {
            fieldsToTry.push(param, param.replace(/_id$/, '_uid'));
          }
          
          // Get first item from array
          if (Array.isArray(items) && items.length > 0) {
            let value = null;
            let usedField = null;
            for (const f of fieldsToTry) {
              if (items[0][f]) {
                value = items[0][f];
                usedField = f;
                break;
              }
            }
            if (value) {
              // Store under ALL param names that share this endpoint
              const allParamsForEndpoint = endpointToParams.get(endpoint) || [param];
              for (const p of allParamsForEndpoint) {
                resolvedParams[p] = value;
              }
              resolvedCount++;
              reportProgress('Phase 1: Known sources', `✓ Resolved ${param}`);
              log(`    ✓ Got ${allParamsForEndpoint.join(', ')}=${value}${usedField !== field ? ` (via '${usedField}' field)` : ''}`);
            } else {
              log(`    ✗ No ${fieldsToTry.join('/')} field in response`);
            }
          } else if (items && typeof items === 'object') {
            let value = null;
            for (const f of fieldsToTry) {
              if (items[f]) {
                value = items[f];
                break;
              }
            }
            if (value) {
              // Store under ALL param names that share this endpoint
              const allParamsForEndpoint = endpointToParams.get(endpoint) || [param];
              for (const p of allParamsForEndpoint) {
                resolvedParams[p] = value;
              }
              resolvedCount++;
              reportProgress('Phase 1: Known sources', `✓ Resolved ${param}`);
              log(`    ✓ Got ${allParamsForEndpoint.join(', ')}=${value}`);
            } else {
              log(`    ✗ No data found in response`);
            }
          } else {
            console.log(`[Pre-flight Phase 1] No data found in response`);
            log(`    ✗ No data found in response`);
          }
        } else {
          console.log(`[Pre-flight Phase 1] Request failed: status=${response?.status}, error=${error?.message}`);
          log(`    ✗ Request failed: ${error?.message || response?.status || 'unknown error'}`);
        }
      } catch (err) {
        console.log(`[Pre-flight Phase 1] Exception: ${err.message}`);
        log(`    ✗ Error fetching ${param}: ${err.message}`);
      }
    }
  }
  
  // ========== PHASE 2: Auto-derive IDs for paths with unresolved trailing params ==========
  // Handles any trailing param like {uid}, {id}, {client_package_id}, etc.
  const allResolved = { ...staticParams, ...resolvedParams };
  const derivedEndpoints = new Set(); // Track derived list endpoints to avoid duplicates
  
  reportProgress('Phase 2: Auto-derivation', 'Analyzing paths...');
  log(`Pre-flight Phase 2: Auto-deriving IDs for ${endpoints.length} endpoint(s)...`);
  
  // Find endpoints with unresolved trailing params (any {param} at end of path)
  const endpointsNeedingDerivation = [];
  for (const endpoint of endpoints) {
    const derived = deriveListEndpoint(endpoint.path);
    if (!derived) continue; // Path doesn't end with a parameter
    
    // Get resource key in same format as test sequencer (domain/resource)
    const resourceInfo = parseResourcePath(endpoint.path);
    const resourceKey = `${resourceInfo.domain}/${resourceInfo.resource}`;
    
    // Skip static params (like business_id, staff_id) - these should come from config
    if (isStaticParam(derived.paramName)) continue;
    
    // Check if we already have a UID for this resource in testContext
    if (testContext && testContext.hasUid(resourceKey)) continue;
    
    // Skip if param is already resolved (in config or Phase 1)
    if (allResolved[derived.paramName]) continue;
    
    // Get the list endpoint (may be overridden for different paths)
    let listPath = getListEndpoint(derived.listEndpoint);
    if (listPath !== derived.listEndpoint) {
      console.log(`[Phase 2] Using override: ${derived.listEndpoint} → ${listPath}`);
    }
    
    // Substitute any already-resolved params in the list endpoint path
    for (const [param, value] of Object.entries(allResolved)) {
      listPath = listPath.replace(`{${param}}`, value);
    }
    
    // Check if list path still has unresolved params
    const unresolvedParams = extractPathParams(listPath);
    if (unresolvedParams.length > 0) {
      log(`  Skipping ${endpoint.path}: list endpoint ${listPath} has unresolved params: ${unresolvedParams.join(', ')}`);
      continue;
    }
    
    // Add to derivation queue if not already fetched
    if (!derivedEndpoints.has(listPath)) {
      endpointsNeedingDerivation.push({
        originalPath: endpoint.path,
        listPath,
        paramName: derived.paramName,
        resourceKey
      });
      derivedEndpoints.add(listPath);
    }
  }
  
  
  if (endpointsNeedingDerivation.length > 0) {
    // Add Phase 2 params to total count
    totalParamsToResolve += endpointsNeedingDerivation.length;
    reportProgress('Phase 2: Auto-derivation', `Deriving ${endpointsNeedingDerivation.length} param(s) from list endpoints`);
    log(`Pre-flight Phase 2: Auto-deriving ${endpointsNeedingDerivation.length} uid/id param(s) from list endpoints...`);
    
    // Helper to select appropriate token based on path
    const selectTokenForPath = (path) => {
      if (path.startsWith('/client')) {
        return config.tokens?.client || config.tokens?.staff;
      }
      return config.tokens?.staff || config.tokens?.directory || Object.values(config.tokens || {})[0];
    };
    
    for (const { originalPath, listPath, paramName, resourceKey } of endpointsNeedingDerivation) {
      try {
        log(`  Deriving ${paramName} for ${originalPath} from ${listPath}...`);
        
        // Select appropriate token based on path (client token for /client/* paths)
        const token = selectTokenForPath(listPath);
        
        const requestConfig = {
          method: 'get',
          url: listPath,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          params: { page: 1, per_page: 1 }
        };
        
        const { response, error } = await rateLimiter.execute(
          () => executeRequest(apiClient, requestConfig)
        );
        
        if (response && response.status >= 200 && response.status < 300 && response.data) {
          // Use smart extraction to find uid/id in response
          const value = smartExtractUid(response.data, paramName);
          
          if (value) {
            // Store UID in testContext with the proper resource key
            if (testContext) {
              testContext.setUid(resourceKey, value);
              resolvedCount++;
              reportProgress('Phase 2: Auto-derivation', `✓ Resolved ${paramName}`);
              log(`    ✓ Got UID for ${resourceKey}=${value}`);
            } else {
              resolvedParams[resourceKey] = value;
              resolvedCount++;
              reportProgress('Phase 2: Auto-derivation', `✓ Resolved ${paramName}`);
              log(`    ✓ Got ${resourceKey}=${value}`);
            }
          } else {
            log(`    ✗ Could not extract ${paramName} from response`);
          }
        } else {
          log(`    ✗ Request failed: ${error?.message || response?.status || 'unknown error'}`);
        }
      } catch (err) {
        log(`    ✗ Error deriving ${paramName} for ${originalPath}: ${err.message}`);
      }
    }
  }
  
  
  // ========== PHASE 2.5: Request Body Reference Field Resolution ==========
  // Resolves reference fields in POST/PUT request bodies BEFORE making the initial call
  reportProgress('Phase 2.5: Body References', 'Analyzing request body schemas...');
  log(`Pre-flight Phase 2.5: Resolving request body reference fields...`);
  
  // Find POST/PUT endpoints with request bodies (use requestSchema like existing code)
  const endpointsWithBodies = endpoints.filter(ep => 
    ['POST', 'PUT', 'PATCH'].includes(ep.method) && ep.requestSchema
  );
  
  console.log(`[Phase 2.5] Found ${endpointsWithBodies.length} endpoint(s) with request bodies`);
  
  if (endpointsWithBodies.length > 0) {
    const bodyRefFields = new Set(); // Track unique reference fields across all endpoints
    
    for (const endpoint of endpointsWithBodies) {
      const schema = endpoint.requestSchema;
      const requiredFields = schema.required || [];
      
      console.log(`[Phase 2.5] Processing ${endpoint.method} ${endpoint.path}`);
      console.log(`[Phase 2.5]   Schema properties: ${schema.properties ? Object.keys(schema.properties).join(', ') : 'none'}`);
      console.log(`[Phase 2.5]   Required fields: ${requiredFields.join(', ') || 'none'}`);
      
      // Extract reference fields from the schema
      const uidFields = extractUidFieldsFromSchema(schema, requiredFields, '');
      console.log(`[Phase 2.5]   Extracted UID fields: ${uidFields.map(f => f.path || f.field).join(', ') || 'none'}`);
      
      for (const field of uidFields) {
        // Skip if already resolved or it's for the current entity being created
        const fieldName = field.path || field.field;
        console.log(`[Phase 2.5]   Checking field: ${fieldName}`);
        
        if (resolvedParams[fieldName] || allResolved[fieldName]) {
          console.log(`[Phase 2.5]     -> Already resolved, skipping`);
          continue;
        }
        
        // Skip self-referential fields (e.g., creating a business_role doesn't need business_role_uid pre-resolved)
        const pathResource = endpoint.path.split('/').filter(p => p && !p.startsWith('{') && p !== 'v3').pop();
        if (fieldName === `${pathResource}_uid`) {
          console.log(`[Phase 2.5]     -> Self-referential (${pathResource}_uid), skipping`);
          continue;
        }
        
        console.log(`[Phase 2.5]     -> Adding to resolution queue`);
        bodyRefFields.add(JSON.stringify({ ...field, endpoint: endpoint.path }));
      }
    }
    
    const uniqueRefFields = Array.from(bodyRefFields).map(f => JSON.parse(f));
    console.log(`[Phase 2.5] Unique body ref fields to resolve: ${uniqueRefFields.length}`);
    
    if (uniqueRefFields.length > 0) {
      totalParamsToResolve += uniqueRefFields.length;
      console.log(`[Phase 2.5] Resolving ${uniqueRefFields.length} body reference field(s)...`);
      log(`  Found ${uniqueRefFields.length} body reference field(s) to resolve`);
      
      // Helper to select appropriate token based on path
      const selectTokenForPath = (path) => {
        if (path.startsWith('/client')) {
          return config.tokens?.client || config.tokens?.staff;
        }
        return config.tokens?.staff || config.tokens?.directory || Object.values(config.tokens || {})[0];
      };
      
      for (const fieldInfo of uniqueRefFields) {
        const fieldName = fieldInfo.path || fieldInfo.field;
        console.log(`[Phase 2.5] Resolving body reference: ${fieldName}...`);
        log(`  Resolving body reference: ${fieldName}...`);
        
        // Find source endpoints for this reference field
        // Returns { found, resourceName, getEndpoint, postEndpoint }
        const sourceResult = findUidSourceEndpoints(fieldName, allEndpoints);
        
        if (!sourceResult.found || !sourceResult.getEndpoint) {
          console.log(`[Phase 2.5]   ✗ No source endpoint found for ${fieldName}`);
          log(`    ✗ No source endpoint found for ${fieldName}`);
          continue;
        }
        
        console.log(`[Phase 2.5]   Found source: ${sourceResult.getEndpoint}`);
        
        // Parse the GET endpoint (format: "GET /v3/access_control/business_roles")
        const [method, ...pathParts] = sourceResult.getEndpoint.split(' ');
        let sourcePath = pathParts.join(' ');
        
        // Substitute known params in the source path
        for (const [param, value] of Object.entries({ ...staticParams, ...resolvedParams })) {
          sourcePath = sourcePath.replace(`{${param}}`, value);
        }
        
        // Skip if path still has unresolved params
        const unresolvedInPath = extractPathParams(sourcePath);
        if (unresolvedInPath.length > 0) {
          console.log(`[Phase 2.5]   Skipping ${sourcePath}: has unresolved params ${unresolvedInPath.join(', ')}`);
          log(`    Skipping ${sourcePath}: has unresolved params ${unresolvedInPath.join(', ')}`);
          continue;
        }
        
        // Make the request
        const token = selectTokenForPath(sourcePath);
        const requestConfig = {
          method: 'get',
          url: sourcePath,
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          params: { page: 1, per_page: 1 }
        };
        
        console.log(`[Phase 2.5]   Making request to: ${sourcePath}`);
        
        try {
          const { response, error } = await rateLimiter.execute(
            () => executeRequest(apiClient, requestConfig)
          );
          
          if (response && response.status >= 200 && response.status < 300 && response.data) {
            // Extract the UID from the response
            const value = smartExtractUid(response.data, fieldName);
            
            if (value) {
              resolvedParams[fieldName] = value;
              resolvedCount++;
              console.log(`[Phase 2.5]   ✓ Resolved ${fieldName}=${value} from ${sourcePath}`);
              reportProgress('Phase 2.5: Body References', `✓ Resolved ${fieldName}`);
              log(`    ✓ Got ${fieldName}=${value} from ${sourcePath}`);
            } else {
              console.log(`[Phase 2.5]   ✗ Could not extract ${fieldName} from response`);
              log(`    ✗ Could not extract ${fieldName} from ${sourcePath}`);
            }
          } else {
            console.log(`[Phase 2.5]   ✗ Request failed: ${response?.status || error?.message || 'unknown'}`);
            log(`    ✗ Request to ${sourcePath} failed: ${response?.status || error?.message || 'unknown'}`);
          }
        } catch (err) {
          console.log(`[Phase 2.5]   ✗ Error: ${err.message}`);
          log(`    ✗ Error resolving ${fieldName} from ${sourcePath}: ${err.message}`);
        }
      }
    } else {
      log(`  No body reference fields need resolution`);
    }
  } else {
    log(`  No POST/PUT endpoints with request bodies`);
  }
  
  // Update allResolved to include Phase 2.5 results for Phase 3
  Object.assign(allResolved, resolvedParams);
  
  // ========== PHASE 3: AI-Assisted Resolution for remaining unresolved endpoints ==========
  // Only runs if AI is enabled and we have endpoints that still need UIDs
  const aiEnabled = isAIConfigured(config);
  
  if (aiEnabled && allEndpoints && allEndpoints.length > 0) {
    reportProgress('Phase 3: AI Resolution', 'Checking for unresolved parameters...');
    // Find endpoints that still need UIDs (weren't resolved in Phase 1 or 2)
    const stillUnresolved = [];
    for (const endpoint of endpoints) {
      const derived = deriveListEndpoint(endpoint.path);
      if (!derived) continue;
      
      // Skip static params
      if (isStaticParam(derived.paramName)) continue;
      
      const resourceInfo = parseResourcePath(endpoint.path);
      const resourceKey = `${resourceInfo.domain}/${resourceInfo.resource}`;
      
      // Check if already resolved
      if (testContext && testContext.hasUid(resourceKey)) continue;
      if (allResolved[derived.paramName]) continue;
      
      stillUnresolved.push({
        endpoint,
        resourceKey,
        paramName: derived.paramName
      });
    }
    
    if (stillUnresolved.length > 0) {
      // Add Phase 3 params to total count
      totalParamsToResolve += stillUnresolved.length;
      reportProgress('Phase 3: AI Resolution', `Resolving ${stillUnresolved.length} param(s) with AI...`);
      log(`Pre-flight Phase 3: AI-assisted resolution for ${stillUnresolved.length} endpoint(s)...`);
      console.log(`[Phase 3] Starting AI resolution for ${stillUnresolved.length} endpoints`);
      
      // Helper to select appropriate token based on path (same as Phase 2)
      const selectTokenForPathPhase3 = (path) => {
        if (path.startsWith('/client')) {
          return config.tokens?.client || config.tokens?.staff;
        }
        return config.tokens?.staff || config.tokens?.directory || Object.values(config.tokens || {})[0];
      };
      
      for (const { endpoint, resourceKey, paramName } of stillUnresolved) {
        try {
          // First check if we have a learned mapping
          const learnedPath = getLearnedMapping(endpoint.path);
          let aiSuggestedPath = learnedPath;
          
          if (!learnedPath) {
            // Ask AI for suggestion
            console.log(`[Phase 3] Asking AI for: ${endpoint.path}`);
            log(`  Asking AI for list endpoint for ${endpoint.path}...`);
            
            aiSuggestedPath = await askAIForListEndpoint(
              endpoint.path,
              paramName,
              allEndpoints,
              getAIApiKey(config)
            );
          } else {
            console.log(`[Phase 3] Using learned mapping: ${endpoint.path} → ${learnedPath}`);
            log(`  Using learned mapping: ${endpoint.path} → ${learnedPath}`);
          }
          
          if (!aiSuggestedPath) {
            console.log(`[Phase 3] AI returned no suggestion for ${endpoint.path}`);
            log(`    ✗ No suitable list endpoint found`);
            continue;
          }
          
          console.log(`[Phase 3] AI suggested: ${aiSuggestedPath}`);
          log(`    AI suggests: ${aiSuggestedPath}`);
          
          // Try the suggested endpoint (use appropriate token based on path)
          const token = selectTokenForPathPhase3(aiSuggestedPath);
          const requestConfig = {
            method: 'get',
            url: aiSuggestedPath,
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            params: { page: 1, per_page: 1 }
          };
          
          const { response, error } = await rateLimiter.execute(
            () => executeRequest(apiClient, requestConfig)
          );
          
          if (response && response.status >= 200 && response.status < 300 && response.data) {
            const value = smartExtractUid(response.data, paramName);
            
            if (value) {
              if (testContext) {
                testContext.setUid(resourceKey, value);
              }
              
              // Save successful mapping for future use
              if (!learnedPath) {
                addLearnedMapping(endpoint.path, aiSuggestedPath);
              }
              
              resolvedCount++;
              reportProgress('Phase 3: AI Resolution', `✓ Resolved ${paramName}`);
              console.log(`[Phase 3] ✓ AI resolution success: ${resourceKey}=${value}`);
              log(`    ✓ Got UID via AI: ${resourceKey}=${value}`);
            } else {
              console.log(`[Phase 3] ✗ Could not extract ${paramName} from AI-suggested endpoint`);
              log(`    ✗ Could not extract ${paramName} from response`);
              
              // Remove failed learned mapping
              if (learnedPath) {
                removeLearnedMapping(endpoint.path);
              }
            }
          } else if (response && response.status >= 400) {
            console.log(`[Phase 3] ✗ AI suggestion failed with ${response.status}`);
            log(`    ✗ AI suggestion failed: HTTP ${response.status}`);
            
            // Remove failed learned mapping
            if (learnedPath) {
              removeLearnedMapping(endpoint.path);
              log(`    Removed failed mapping from cache`);
            }
          } else {
            console.log(`[Phase 3] ✗ Request failed: ${error?.message || 'unknown'}`);
            log(`    ✗ Request failed: ${error?.message || 'unknown error'}`);
          }
        } catch (err) {
          console.log(`[Phase 3] ✗ Error: ${err.message}`);
          log(`    ✗ Error in AI resolution: ${err.message}`);
        }
      }
    }
  }
  
  // Report final summary
  if (totalParamsToResolve > 0) {
    reportProgress('Complete', `Resolved ${resolvedCount}/${totalParamsToResolve} parameter(s)`);
    log(`Pre-flight complete: ${resolvedCount}/${totalParamsToResolve} parameters resolved`);
  } else {
    reportProgress('Complete', 'No parameters needed resolution');
    log(`Pre-flight complete: No parameters needed resolution`);
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
        isQuerySwap: swapInfo.swapLocation.includes('query'),
        // Include the modified request config for UI display
        requestConfig: retryConfig
      };
    }
  }
  
  return { success: false };
}

module.exports = router;
