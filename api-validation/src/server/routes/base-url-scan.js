/**
 * Base URL Scan Routes
 * POST / - Start a base URL scan for selected endpoints
 * GET /stream/:sessionId - SSE stream for real-time progress
 * POST /stop/:sessionId - Stop a running scan
 * POST /quick-fix - Remove useFallbackApi from workflows where primary now works
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

    // Phase 2: Always test primary URL (even if fallback failed)
    if (session.stopped) break;

    broadcastEvent(session, 'progress', {
      index: session.completed + 1,
      total: session.total,
      endpoint: endpointKey,
      phase: fallbackResult.success ? 'primary' : 'fallback_failed_testing_primary'
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

    // Determine recommendation based on both results
    let recommendation;
    if (fallbackResult.success && primaryResult.success) {
      recommendation = 'PRIMARY_NOW_WORKS';
    } else if (fallbackResult.success && !primaryResult.success) {
      recommendation = 'FALLBACK_STILL_NEEDED';
    } else if (!fallbackResult.success && primaryResult.success) {
      recommendation = 'FALLBACK_BROKEN';
    } else {
      recommendation = 'BOTH_FAILING';
    }

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

/**
 * POST /quick-fix
 * Remove useFallbackApi: true from workflow files where primary now works
 * Also removes useFallback: true from individual prerequisite/test steps
 */
router.post('/quick-fix', async (req, res) => {
  try {
    const { endpoints } = req.body;

    if (!endpoints || endpoints.length === 0) {
      return res.status(400).json({
        error: 'No endpoints provided',
        message: 'Provide an array of endpoint strings to fix'
      });
    }

    const fixed = [];
    const skipped = [];

    for (const endpointKey of endpoints) {
      const workflow = workflowRepo.get(endpointKey);

      if (!workflow) {
        skipped.push({ endpoint: endpointKey, reason: 'No workflow found' });
        continue;
      }

      if (!workflow.useFallbackApi) {
        skipped.push({ endpoint: endpointKey, reason: 'useFallbackApi not set' });
        continue;
      }

      // Remove useFallbackApi from frontmatter and useFallback from steps
      const success = removeFallbackFromWorkflow(endpointKey, workflow);

      if (success) {
        fixed.push({ endpoint: endpointKey, file: workflow.file });
      } else {
        skipped.push({ endpoint: endpointKey, reason: 'Failed to update file' });
      }
    }

    // Invalidate workflow cache so changes are picked up
    workflowRepo.invalidateIndexCache();

    console.log(`Quick fix: ${fixed.length} updated, ${skipped.length} skipped`);

    res.json({
      success: true,
      fixed,
      skipped,
      total: endpoints.length
    });
  } catch (error) {
    console.error('Quick fix error:', error);
    res.status(500).json({ error: 'Quick fix failed', message: error.message });
  }
});

/**
 * Remove useFallbackApi: true from workflow frontmatter
 * and useFallback: true from prerequisite/test request steps
 * @param {string} endpointKey - e.g. "POST /business/communication/channels"
 * @param {Object} workflow - Parsed workflow object
 * @returns {boolean} True if updated successfully
 */
function removeFallbackFromWorkflow(endpointKey, workflow) {
  const fs = require('fs');
  const path = require('path');
  const WORKFLOWS_DIR = workflowRepo.WORKFLOWS_DIR;

  const filePath = path.join(WORKFLOWS_DIR, workflow.file);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[QuickFix] File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Remove useFallbackApi line from frontmatter
    content = content.replace(/^useFallbackApi:\s*true\s*\n/m, '');

    // Remove useFallback: true from YAML steps (prerequisite and test request)
    // Matches lines like "    useFallback: true" inside yaml code blocks
    content = content.replace(/^(\s*)useFallback:\s*true\s*\n/gm, '');

    // Remove the fallback notice block from body if present
    content = content.replace(/^> \*\*⚠️ Fallback API Required\*\*\n> This endpoint must use the fallback API URL\.[^\n]*\n\n?/m, '');
    content = content.replace(/^> ⚠️ Fallback API Required\s*\n\n?/m, '');

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[QuickFix] Updated: ${filePath}`);
    return true;

  } catch (error) {
    console.error(`[QuickFix] Error updating ${filePath}: ${error.message}`);
    return false;
  }
}

module.exports = router;
