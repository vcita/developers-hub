/**
 * Token Doc Fix Routes
 * POST / - Start a token documentation fix scan
 * GET /stream/:sessionId - SSE stream for real-time progress
 * POST /stop/:sessionId - Stop a running scan
 *
 * For each "no token info" endpoint:
 * 1. Search local repos for auth/token configuration
 * 2. If skipped: update swagger immediately
 *    Otherwise: test workflow, update swagger only on 2xx
 * 3. Stream results via SSE
 */

const express = require('express');
const router = express.Router();

const { loadConfig } = require('../../core/config');
const { executeWorkflow, createRequestFunction } = require('../../core/prerequisite');
const { createRateLimiter } = require('../../core/runner/rate-limiter');
const workflowRepo = require('../../core/workflows/repository');
const { searchForTokens } = require('../../core/token-discovery/code-searcher');
const { updateTokenDocumentation } = require('../../core/token-discovery/swagger-updater');
const { runDocFixer } = require('../../core/runner/ai-doc-fixer');

const activeSessions = new Map();

function broadcastEvent(session, event, data) {
  for (const listener of session.listeners) {
    try {
      listener(event, data);
    } catch (error) {
      session.listeners.delete(listener);
    }
  }
}

/**
 * POST /
 * Start a token doc fix scan
 */
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/validate/token-doc-fix received');
    const { endpoints: selectedEndpoints, options = {} } = req.body;
    const { endpoints: allEndpoints } = req.appState;

    if (!selectedEndpoints || selectedEndpoints.length === 0) {
      return res.status(400).json({
        error: 'No endpoints selected',
        message: 'Provide an array of endpoints to fix'
      });
    }

    const sessionId = `tokenfix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const targetEndpoints = allEndpoints.filter(e =>
      selectedEndpoints.some(s =>
        s.path === e.path && s.method.toUpperCase() === e.method
      )
    );

    if (targetEndpoints.length === 0) {
      return res.status(400).json({
        error: 'No matching endpoints found',
        message: 'The selected endpoints do not match any loaded endpoints'
      });
    }

    const session = {
      id: sessionId,
      status: 'running',
      startTime: Date.now(),
      total: targetEndpoints.length,
      completed: 0,
      results: [],
      listeners: new Set(),
      stopped: false
    };

    activeSessions.set(sessionId, session);

    runTokenDocFix(session, targetEndpoints, options).catch(error => {
      console.error('Token doc fix error:', error);
      session.status = 'error';
      session.error = error.message;
      broadcastEvent(session, 'error', { message: error.message });
    });

    res.json({
      sessionId,
      total: targetEndpoints.length,
      message: `Token doc fix started. Connect to /api/validate/token-doc-fix/stream/${sessionId} for progress.`
    });
  } catch (error) {
    console.error('POST /api/validate/token-doc-fix error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /stream/:sessionId
 * SSE stream for token doc fix progress
 */
router.get('/stream/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The session does not exist or has expired'
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    res.write(`event: start\n`);
    res.write(`data: ${JSON.stringify({
      total: session.total,
      timestamp: new Date(session.startTime).toISOString()
    })}\n\n`);

    for (const result of session.results) {
      res.write(`event: token_fix_result\n`);
      res.write(`data: ${JSON.stringify(result)}\n\n`);
    }

    const listener = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    session.listeners.add(listener);

    if (session.status === 'completed' || session.status === 'error') {
      res.write(`event: complete\n`);
      res.write(`data: ${JSON.stringify(buildCompleteSummary(session))}\n\n`);
    }

    req.on('close', () => {
      session.listeners.delete(listener);
      if (session.listeners.size === 0 && session.status !== 'running') {
        setTimeout(() => {
          if (session.listeners.size === 0) {
            activeSessions.delete(sessionId);
          }
        }, 60000);
      }
    });
  } catch (error) {
    console.error('Token doc fix SSE error:', error);
    res.status(500).json({ error: 'SSE error', message: error.message });
  }
});

/**
 * POST /stop/:sessionId
 * Stop a running scan
 */
router.post('/stop/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status !== 'running') {
    return res.json({ success: true, message: 'Session already stopped', status: session.status });
  }

  session.stopped = true;
  session.status = 'stopped';

  broadcastEvent(session, 'stopped', {
    completed: session.completed,
    total: session.total,
    message: 'Token doc fix stopped by user'
  });

  res.json({ success: true, message: 'Stopped', completed: session.completed, total: session.total });
});

function buildCompleteSummary(session) {
  const results = session.results;
  return {
    status: session.status,
    total: results.length,
    swaggerUpdated: results.filter(r => r.swaggerUpdated).length,
    testPassed: results.filter(r => r.testResult === '2xx').length,
    testFailed: results.filter(r => r.testResult === 'error').length,
    skippedNoTest: results.filter(r => r.testResult === 'skipped-no-test').length,
    noWorkflow: results.filter(r => r.testResult === 'no-workflow').length,
    workflowCreated: results.filter(r => r.workflowCreated).length,
    workflowCreationFailed: results.filter(r => r.testResult === 'workflow-creation-failed').length,
    duration: `${Date.now() - session.startTime}ms`
  };
}

/**
 * Run the token doc fix pipeline for each endpoint
 */
async function runTokenDocFix(session, endpoints, options = {}) {
  console.log('runTokenDocFix started for', endpoints.length, 'endpoints');

  const config = loadConfig();
  const rateLimiter = createRateLimiter(options.rateLimitPreset || 'normal', {
    maxConcurrent: options.rateLimit?.maxConcurrent,
    delayBetweenRequests: options.rateLimit?.delayBetweenRequests
  });

  for (const endpoint of endpoints) {
    if (session.stopped) break;

    const endpointKey = `${endpoint.method} ${endpoint.path}`;
    let workflow = workflowRepo.get(endpointKey);
    const workflowStatus = workflow?.status || 'none';
    const isSkipped = workflowStatus === 'skip' || workflowStatus === 'skipped';

    // Phase 1: Code search
    broadcastEvent(session, 'progress', {
      index: session.completed + 1,
      total: session.total,
      endpoint: endpointKey,
      phase: 'code-search'
    });

    const codeSearchResult = searchForTokens(endpoint.path, endpoint.method);

    if (!codeSearchResult.tokens || codeSearchResult.tokens.length === 0) {
      const result = {
        endpoint: endpointKey,
        domain: endpoint.domain,
        discoveredTokens: [],
        codeSearchSource: codeSearchResult.source,
        codeSearchRepo: codeSearchResult.repo,
        codeSearchConfidence: codeSearchResult.confidence,
        testResult: 'no-tokens-found',
        swaggerUpdated: false,
        swaggerFile: endpoint.swaggerFile || null
      };
      session.results.push(result);
      session.completed++;
      broadcastEvent(session, 'token_fix_result', result);
      continue;
    }

    // Phase 2: Decide path based on workflow status
    if (isSkipped) {
      // Skipped endpoints: update swagger immediately, no test needed
      const swaggerResult = tryUpdateSwagger(endpoint, codeSearchResult.tokens);

      const result = {
        endpoint: endpointKey,
        domain: endpoint.domain,
        discoveredTokens: codeSearchResult.tokens,
        codeSearchSource: codeSearchResult.source,
        codeSearchRepo: codeSearchResult.repo,
        codeSearchConfidence: codeSearchResult.confidence,
        testResult: 'skipped-no-test',
        swaggerUpdated: swaggerResult.success,
        swaggerFile: swaggerResult.file || endpoint.swaggerFile || null,
        swaggerMessage: swaggerResult.message
      };
      session.results.push(result);
      session.completed++;
      broadcastEvent(session, 'token_fix_result', result);
      continue;
    }

    // Non-skipped endpoints: create workflow if missing, then test
    let workflowCreated = false;
    if (!workflow || (!workflow.testRequest && !workflow.prerequisites)) {
      broadcastEvent(session, 'progress', {
        index: session.completed + 1,
        total: session.total,
        endpoint: endpointKey,
        phase: 'creating-workflow'
      });

      const creationResult = await createWorkflowViaAgent(
        endpoint, endpointKey, codeSearchResult.tokens, config, session
      );

      if (!creationResult.success) {
        const result = {
          endpoint: endpointKey,
          domain: endpoint.domain,
          discoveredTokens: codeSearchResult.tokens,
          codeSearchSource: codeSearchResult.source,
          codeSearchRepo: codeSearchResult.repo,
          codeSearchConfidence: codeSearchResult.confidence,
          testResult: 'workflow-creation-failed',
          creationError: creationResult.fixSummary,
          swaggerUpdated: false,
          swaggerFile: endpoint.swaggerFile || null
        };
        session.results.push(result);
        session.completed++;
        broadcastEvent(session, 'token_fix_result', result);
        continue;
      }

      // Reload the newly created workflow
      workflowRepo.invalidateIndexCache();
      workflow = workflowRepo.get(endpointKey);

      if (!workflow || (!workflow.testRequest && !workflow.prerequisites)) {
        const result = {
          endpoint: endpointKey,
          domain: endpoint.domain,
          discoveredTokens: codeSearchResult.tokens,
          codeSearchSource: codeSearchResult.source,
          codeSearchRepo: codeSearchResult.repo,
          codeSearchConfidence: codeSearchResult.confidence,
          testResult: 'workflow-creation-failed',
          creationError: 'Agent reported success but workflow is still missing or incomplete',
          swaggerUpdated: false,
          swaggerFile: endpoint.swaggerFile || null
        };
        session.results.push(result);
        session.completed++;
        broadcastEvent(session, 'token_fix_result', result);
        continue;
      }

      workflowCreated = true;
      broadcastEvent(session, 'progress', {
        index: session.completed + 1,
        total: session.total,
        endpoint: endpointKey,
        phase: 'workflow-created',
        workflowCreated: true
      });
    }

    // Phase 2b: Run workflow test
    broadcastEvent(session, 'progress', {
      index: session.completed + 1,
      total: session.total,
      endpoint: endpointKey,
      phase: 'testing'
    });

    let testSuccess = false;
    let testStatus = null;
    let testError = null;
    const testStartTime = Date.now();

    try {
      const baseUrl = workflow.useFallbackApi ? (config.fallbackUrl || config.baseUrl) : config.baseUrl;
      const makeRequest = createRequestFunction(baseUrl, {
        partnersUrl: config.partnersUrl
      });
      const workflowResult = await rateLimiter.execute(() =>
        executeWorkflow(workflow, config, makeRequest, { workflowRepo })
      );
      testSuccess = workflowResult.success;
      testStatus = workflowResult.status;
      testError = workflowResult.success ? null : (workflowResult.failedReason || workflowResult.error || 'Unknown');
    } catch (error) {
      testSuccess = false;
      testError = error.message;
    }
    const testDuration = Date.now() - testStartTime;

    // Phase 3: Update swagger only if 2xx
    let swaggerResult = { success: false, message: 'Test did not return 2xx' };
    if (testSuccess) {
      swaggerResult = tryUpdateSwagger(endpoint, codeSearchResult.tokens);
    }

    const result = {
      endpoint: endpointKey,
      domain: endpoint.domain,
      discoveredTokens: codeSearchResult.tokens,
      codeSearchSource: codeSearchResult.source,
      codeSearchRepo: codeSearchResult.repo,
      codeSearchConfidence: codeSearchResult.confidence,
      testResult: testSuccess ? '2xx' : 'error',
      testStatus,
      testError,
      testDuration: `${testDuration}ms`,
      workflowCreated,
      swaggerUpdated: swaggerResult.success,
      swaggerFile: swaggerResult.file || endpoint.swaggerFile || null,
      swaggerMessage: swaggerResult.message
    };

    session.results.push(result);
    session.completed++;
    broadcastEvent(session, 'token_fix_result', result);
  }

  if (!session.stopped) {
    session.status = 'completed';
    const summary = buildCompleteSummary(session);
    console.log('Token doc fix complete:', summary);
    broadcastEvent(session, 'complete', summary);
  }
}

/**
 * Create a workflow for an endpoint that doesn't have one, using the AI doc fixer agent.
 * Passes the discovered tokens from code search as context so the agent knows what tokens to use.
 */
async function createWorkflowViaAgent(endpoint, endpointKey, discoveredTokens, config, session) {
  const tokenList = discoveredTokens.join(', ');
  const directive = [
    `Create a NEW workflow file for this endpoint. No workflow currently exists.`,
    `Code search discovered these token types: [${tokenList}]. Use the first one (${discoveredTokens[0]}) as the primary token.`,
    `Focus on: 1) finding the swagger schema, 2) creating proper prerequisites to fetch required UIDs,`,
    `3) writing a complete workflow with test request, 4) verifying it passes with test_workflow.`
  ].join('\n');

  const maxIter = config?.ai?.workflowCreationMaxIterations || 10;
  console.log(`[TokenDocFix] Creating workflow for ${endpointKey} (tokens: ${tokenList}, maxIterations: ${maxIter})`);

  try {
    const startTime = Date.now();
    const result = await runDocFixer({
      endpoint: {
        method: endpoint.method,
        path: endpoint.path,
        domain: endpoint.domain,
        swaggerFile: endpoint.swaggerFile
      },
      failureData: {
        reason: 'no-workflow',
        friendlyMessage: `No workflow file exists for this endpoint. Create one from scratch using the swagger schema and similar verified workflows as reference.`
      },
      healerAnalysis: null,
      config,
      directive,
      accumulatedInsight: [],
      referenceWorkflow: null,
      maxIterations: maxIter,
      previousConversation: null,
      onProgress: (event) => {
        if (event.type === 'tool_call') {
          console.log(`[TokenDocFix]   [${endpointKey}] tool: ${event.tool}`);
        }
        broadcastEvent(session, event.type, { ...event, endpoint: endpointKey, phase: 'creating-workflow' });
      }
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[TokenDocFix] Workflow creation for ${endpointKey}: ${result.success ? 'SUCCESS' : 'FAILED'} (${elapsed}s, ${result.iterations} iterations)`);

    return result;
  } catch (error) {
    console.error(`[TokenDocFix] Workflow creation failed for ${endpointKey}:`, error.message);
    return {
      success: false,
      fixSummary: `Workflow creation error: ${error.message}`
    };
  }
}

/**
 * Attempt to update swagger for an endpoint
 * @param {Object} endpoint - Endpoint object (has swaggerFile, path, method)
 * @param {string[]} tokens - Tokens to document
 * @returns {{ success: boolean, message: string, file: string|null }}
 */
function tryUpdateSwagger(endpoint, tokens) {
  const swaggerFile = endpoint.swaggerFile;
  if (!swaggerFile) {
    return { success: false, message: 'No swagger file reference on endpoint', file: null };
  }

  const result = updateTokenDocumentation(swaggerFile, endpoint.path, endpoint.method, tokens);
  return { ...result, file: swaggerFile };
}

module.exports = router;
