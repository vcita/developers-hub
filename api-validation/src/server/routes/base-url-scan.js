/**
 * Base URL Scan Routes
 * POST / - Start a base URL scan for selected endpoints
 * GET /stream/:sessionId - SSE stream for real-time progress
 * POST /stop/:sessionId - Stop a running scan
 *
 * Tests endpoints that use useFallbackApi against both the fallback URL
 * and the primary URL to determine if the fallback is still needed.
 */

const express = require('express');
const router = express.Router();

const { loadConfig } = require('../../core/config');
const { executeWorkflow, createRequestFunction } = require('../../core/prerequisite');
const { createRateLimiter } = require('../../core/runner/rate-limiter');
const workflowRepo = require('../../core/workflows/repository');

// Store for active scan sessions
const activeSessions = new Map();

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
      session.listeners.delete(listener);
    }
  }
}

/**
 * POST /
 * Start a base URL scan for selected endpoints
 */
router.post('/', async (req, res) => {
  try {
    console.log('POST /api/validate/base-url-scan received');
    const { endpoints: selectedEndpoints, options = {} } = req.body;
    const { endpoints: allEndpoints } = req.appState;

    if (!selectedEndpoints || selectedEndpoints.length === 0) {
      return res.status(400).json({
        error: 'No endpoints selected',
        message: 'Provide an array of endpoints to scan'
      });
    }

    const sessionId = `scan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Match selected endpoints to loaded endpoints
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

    // Start scan in background
    runBaseUrlScan(session, targetEndpoints, options).catch(error => {
      console.error('Base URL scan error:', error);
      session.status = 'error';
      session.error = error.message;
      broadcastEvent(session, 'error', { message: error.message });
    });

    res.json({
      sessionId,
      total: targetEndpoints.length,
      message: `Scan started. Connect to /api/validate/base-url-scan/stream/${sessionId} for progress updates.`
    });
  } catch (error) {
    console.error('POST /api/validate/base-url-scan error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /stream/:sessionId
 * SSE stream for scan progress
 */
router.get('/stream/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = activeSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        message: 'The scan session does not exist or has expired'
      });
    }

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
      res.write(`event: scan_result\n`);
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
      res.write(`data: ${JSON.stringify(buildCompleteSummary(session))}\n\n`);
    }

    // Clean up on close
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
    console.error('SSE stream error:', error);
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
    return res.status(404).json({
      error: 'Session not found',
      message: 'The scan session does not exist or has expired'
    });
  }

  if (session.status !== 'running') {
    return res.json({
      success: true,
      message: 'Session is already stopped',
      status: session.status
    });
  }

  session.stopped = true;
  session.status = 'stopped';

  broadcastEvent(session, 'stopped', {
    completed: session.completed,
    total: session.total,
    message: 'Scan stopped by user'
  });

  res.json({
    success: true,
    message: 'Scan stopped',
    completed: session.completed,
    total: session.total
  });
});

/**
 * Build completion summary from session results
 * @param {Object} session
 * @returns {Object} summary
 */
function buildCompleteSummary(session) {
  const results = session.results;
  return {
    status: session.status,
    total: results.length,
    primaryNowWorks: results.filter(r => r.recommendation === 'PRIMARY_NOW_WORKS').length,
    fallbackStillNeeded: results.filter(r => r.recommendation === 'FALLBACK_STILL_NEEDED').length,
    fallbackBroken: results.filter(r => r.recommendation === 'FALLBACK_BROKEN').length,
    bothFailing: results.filter(r => r.recommendation === 'BOTH_FAILING').length,
    duration: `${Date.now() - session.startTime}ms`
  };
}

/**
 * Run the base URL scan
 * For each endpoint: execute workflow against fallback URL, then against primary URL
 *
 * @param {Object} session - Scan session
 * @param {Object[]} endpoints - Endpoints to scan
 * @param {Object} options - Scan options
 */
async function runBaseUrlScan(session, endpoints, options = {}) {
  console.log('runBaseUrlScan started for', endpoints.length, 'endpoints');

  const config = loadConfig();

  if (!config.fallbackUrl) {
    throw new Error('No fallbackUrl configured. Base URL scan requires a fallback URL.');
  }

  const rateLimiter = createRateLimiter(options.rateLimitPreset || 'normal', {
    maxConcurrent: options.rateLimit?.maxConcurrent,
    delayBetweenRequests: options.rateLimit?.delayBetweenRequests
  });

  for (const endpoint of endpoints) {
    if (session.stopped) break;

    const endpointKey = `${endpoint.method} ${endpoint.path}`;
    const workflow = workflowRepo.get(endpointKey);

    broadcastEvent(session, 'progress', {
      index: session.completed + 1,
      total: session.total,
      endpoint: endpointKey,
      phase: 'fallback'
    });

    // If no workflow with test request, we cannot meaningfully scan
    if (!workflow || (!workflow.testRequest && !workflow.prerequisites)) {
      const scanResult = {
        endpoint: endpointKey,
        domain: endpoint.domain,
        fallback: { url: config.fallbackUrl, success: false, status: null, duration: null, error: 'No workflow test request available' },
        primary: { url: config.baseUrl, success: false, status: null, duration: null, error: 'Skipped (no workflow)' },
        recommendation: 'NO_WORKFLOW',
        workflowStatus: workflow?.status || 'none',
        hasWorkflowTestRequest: false
      };
      session.results.push(scanResult);
      session.completed++;
      broadcastEvent(session, 'scan_result', scanResult);
      continue;
    }

    // Phase 1: Execute workflow against fallback URL
    let fallbackResult;
    const fallbackStartTime = Date.now();
    try {
      const fallbackMakeRequest = createRequestFunction(config.fallbackUrl, {
        partnersUrl: config.partnersUrl
      });
      fallbackResult = await rateLimiter.execute(() =>
        executeWorkflow(workflow, config, fallbackMakeRequest, { workflowRepo })
      );
    } catch (error) {
      fallbackResult = { success: false, status: null, error: error.message };
    }
    const fallbackDuration = Date.now() - fallbackStartTime;

    const fallbackInfo = {
      url: config.fallbackUrl,
      success: fallbackResult.success,
      status: fallbackResult.status || null,
      duration: `${fallbackDuration}ms`,
      error: fallbackResult.success ? null : (fallbackResult.failedReason || fallbackResult.error || 'Unknown error'),
      phase: fallbackResult.phase || null
    };

    // If fallback failed, skip primary test
    if (!fallbackResult.success) {
      broadcastEvent(session, 'progress', {
        index: session.completed + 1,
        total: session.total,
        endpoint: endpointKey,
        phase: 'fallback_failed'
      });

      const scanResult = {
        endpoint: endpointKey,
        domain: endpoint.domain,
        fallback: fallbackInfo,
        primary: { url: config.baseUrl, success: false, status: null, duration: null, error: 'Skipped (fallback failed)' },
        recommendation: 'FALLBACK_BROKEN',
        workflowStatus: workflow.status || 'unknown',
        hasWorkflowTestRequest: true
      };
      session.results.push(scanResult);
      session.completed++;
      broadcastEvent(session, 'scan_result', scanResult);
      continue;
    }

    // Phase 2: Execute workflow against primary URL
    if (session.stopped) break;

    broadcastEvent(session, 'progress', {
      index: session.completed + 1,
      total: session.total,
      endpoint: endpointKey,
      phase: 'primary'
    });

    let primaryResult;
    const primaryStartTime = Date.now();
    try {
      const primaryMakeRequest = createRequestFunction(config.baseUrl, {
        partnersUrl: config.partnersUrl
      });
      primaryResult = await rateLimiter.execute(() =>
        executeWorkflow(workflow, config, primaryMakeRequest, { workflowRepo })
      );
    } catch (error) {
      primaryResult = { success: false, status: null, error: error.message };
    }
    const primaryDuration = Date.now() - primaryStartTime;

    const primaryInfo = {
      url: config.baseUrl,
      success: primaryResult.success,
      status: primaryResult.status || null,
      duration: `${primaryDuration}ms`,
      error: primaryResult.success ? null : (primaryResult.failedReason || primaryResult.error || 'Unknown error'),
      phase: primaryResult.phase || null
    };

    // Determine recommendation
    const recommendation = primaryResult.success ? 'PRIMARY_NOW_WORKS' : 'FALLBACK_STILL_NEEDED';

    const scanResult = {
      endpoint: endpointKey,
      domain: endpoint.domain,
      fallback: fallbackInfo,
      primary: primaryInfo,
      recommendation,
      workflowStatus: workflow.status || 'unknown',
      hasWorkflowTestRequest: true
    };

    session.results.push(scanResult);
    session.completed++;
    broadcastEvent(session, 'scan_result', scanResult);
  }

  // Complete
  if (!session.stopped) {
    session.status = 'completed';
    const summary = buildCompleteSummary(session);
    console.log(`Base URL scan complete:`, summary);
    broadcastEvent(session, 'complete', summary);
  }
}

module.exports = router;
