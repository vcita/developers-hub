/**
 * Fix Report Route (Layer 2 - Orchestrator)
 * 
 * Manages fix sessions: runs the analyzer, processes groups sequentially,
 * propagates accumulated insight, and enriches the knowledge base.
 * 
 * Endpoints:
 *   POST /api/fix-report          - Start a fix session
 *   GET  /api/fix-report/stream/:sessionId - SSE stream
 *   POST /api/fix-report/stop/:sessionId   - Stop after current endpoint
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const { analyzeReport } = require('../../core/analyzer/report-analyzer');
const { runDocFixer } = require('../../core/runner/ai-doc-fixer');
const { loadConfig } = require('../../core/config');

const REPO_ROOT = path.resolve(__dirname, '../../../../');

const KB_PATH = path.join(__dirname, '../../../docs/healing-knowledge-base.md');

// ─── Session Management ──────────────────────────────────────────────────────

const activeSessions = new Map();

function createSession(id, failedResults, config) {
  const session = {
    id,
    status: 'pending',       // pending | analyzing | running | stopping | completed
    failedResults,
    config,
    results: [],
    groups: [],
    ungrouped: [],
    stopped: false,
    startedAt: Date.now(),
    listeners: new Set(),
    eventBuffer: [],          // Buffer events before any SSE client connects
    swaggerDomainsModified: new Set()  // Track domains with swagger changes for unifier
  };
  activeSessions.set(id, session);
  return session;
}

function broadcastEvent(session, eventType, data) {
  const payload = { type: eventType, timestamp: Date.now(), ...data };

  if (session.listeners.size === 0) {
    // No SSE clients connected yet -- buffer the event for replay
    session.eventBuffer.push({ eventType, payload });
  } else {
    for (const listener of session.listeners) {
      try {
        listener(eventType, payload);
      } catch (_e) { /* listener disconnected */ }
    }
  }
}

// ─── POST /api/fix-report ────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  try {
    const { failedResults, userPrompt, endpointPrompts } = req.body;

    if (!failedResults || failedResults.length === 0) {
      return res.status(400).json({ error: 'No failed results provided' });
    }

    // Load fresh config (includes tokens)
    const config = loadConfig();

    const sessionId = `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session = createSession(sessionId, failedResults, config);

    // Start processing in background
    processFixSession(session, userPrompt, endpointPrompts).catch(err => {
      console.error(`[FixReport] Session ${sessionId} error:`, err);
      broadcastEvent(session, 'session_error', { error: err.message });
      session.status = 'completed';
    });

    res.json({
      sessionId,
      message: 'Fix session started',
      totalEndpoints: failedResults.length
    });
  } catch (error) {
    console.error('[FixReport] Error starting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/fix-report/stream/:sessionId ───────────────────────────────────

router.get('/stream/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial status
  res.write(`event: session_status\n`);
  res.write(`data: ${JSON.stringify({ status: session.status, totalEndpoints: session.failedResults.length })}\n\n`);

  // Register listener
  const listener = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (_e) { /* connection closed */ }
  };

  session.listeners.add(listener);

  // Replay any events that were buffered before we connected
  if (session.eventBuffer.length > 0) {
    for (const { eventType, payload } of session.eventBuffer) {
      try {
        res.write(`event: ${eventType}\n`);
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (_e) { break; }
    }
    session.eventBuffer = [];
  }

  // Cleanup on disconnect
  req.on('close', () => {
    session.listeners.delete(listener);
  });

  // Keep-alive ping
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch (_e) {
      clearInterval(keepAlive);
    }
  }, 15000);

  req.on('close', () => clearInterval(keepAlive));
});

// ─── POST /api/fix-report/stop/:sessionId ────────────────────────────────────

router.post('/stop/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.stopped = true;
  session.status = 'stopping';
  broadcastEvent(session, 'session_stopping', { message: 'Will stop after current endpoint completes' });

  res.json({ success: true, message: 'Stop requested' });
});

// ─── POST /api/fix-report/continue/:sessionId ────────────────────────────────

router.post('/continue/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userPrompt, endpointPrompts } = req.body;
    const oldSession = activeSessions.get(sessionId);

    if (!oldSession) {
      return res.status(404).json({ error: 'Session not found (may have expired)' });
    }

    if (oldSession.status !== 'completed') {
      return res.status(400).json({ error: 'Session is still running. Stop it first.' });
    }

    // Extract only the failed endpoints from the completed session
    const failedEndpointKeys = new Set(
      oldSession.results.filter(r => !r.success).map(r => r.endpoint)
    );

    if (failedEndpointKeys.size === 0) {
      return res.status(400).json({ error: 'No failed endpoints to continue with' });
    }

    // Rebuild the failedResults array from the original session data
    const allOriginalEndpoints = [
      ...oldSession.groups.flatMap(g => g.endpoints),
      ...oldSession.ungrouped
    ];

    const failedResults = allOriginalEndpoints.filter(ep => {
      const key = ep.endpointKey || `${ep.method} ${ep.path}`;
      return failedEndpointKeys.has(key);
    });

    if (failedResults.length === 0) {
      return res.status(400).json({ error: 'Could not match failed endpoints to original data' });
    }

    // Load fresh config
    const config = loadConfig();

    const newSessionId = `fix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSession = createSession(newSessionId, failedResults, config);

    // Start processing with user prompt and per-endpoint prompts
    processFixSession(newSession, userPrompt, endpointPrompts).catch(err => {
      console.error(`[FixReport] Continue session ${newSessionId} error:`, err);
      broadcastEvent(newSession, 'session_error', { error: err.message });
      newSession.status = 'completed';
    });

    res.json({
      sessionId: newSessionId,
      previousSessionId: sessionId,
      message: 'Continue session started',
      totalEndpoints: failedResults.length,
      userPrompt: userPrompt || null,
      endpointPromptsCount: endpointPrompts ? Object.keys(endpointPrompts).length : 0
    });
  } catch (error) {
    console.error('[FixReport] Error continuing session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ─── Core Processing Loop ────────────────────────────────────────────────────

async function processFixSession(session, userPrompt, endpointPrompts) {
  // Phase 1: Analyze and group
  session.status = 'analyzing';
  broadcastEvent(session, 'phase_start', { phase: 'analysis' });

  // Helper: resolve the prompt for a specific endpoint
  // Per-endpoint prompt takes priority, then falls back to general userPrompt
  const resolvePromptForEndpoint = (ep) => {
    const epKey = ep.endpointKey || `${ep.method} ${ep.path}`;
    if (endpointPrompts && endpointPrompts[epKey]) {
      return endpointPrompts[epKey];
    }
    return userPrompt || null;
  };

  const { groups, ungrouped } = analyzeReport(session.failedResults);
  session.groups = groups;
  session.ungrouped = ungrouped;

  broadcastEvent(session, 'analysis_complete', {
    groupCount: groups.length,
    ungroupedCount: ungrouped.length,
    groups: groups.map(g => ({
      id: g.id,
      label: g.label,
      reason: g.reason,
      httpStatus: g.httpStatus,
      pathPattern: g.pathPattern,
      endpointCount: g.endpoints.length,
      endpoints: g.endpoints.map(ep => ep.endpointKey || `${ep.method} ${ep.path}`),
      hasKBMatch: !!g.knowledgeBaseMatch,
      hasRefWorkflow: !!g.referenceWorkflow,
      directive: g.directive
    })),
    ungrouped: ungrouped.map(ep => ({
      endpoint: ep.endpointKey || `${ep.method} ${ep.path}`,
      reason: ep.reason,
      httpStatus: ep.httpStatus
    }))
  });

  // Phase 2: Process each group
  session.status = 'running';

  for (const group of groups) {
    if (session.stopped) break;
    broadcastEvent(session, 'group_start', {
      groupId: group.id,
      label: group.label,
      endpointCount: group.endpoints.length,
      directive: group.directive
    });

    // Accumulated insight for this group
    const groupInsight = {
      directive: group.directive,
      knowledgeBaseMatch: group.knowledgeBaseMatch,
      referenceWorkflow: group.referenceWorkflow,
      fixRecipes: []
    };

    for (let i = 0; i < group.endpoints.length; i++) {
      if (session.stopped) break;

      const ep = group.endpoints[i];
      const isTemplate = (i === 0);

      broadcastEvent(session, 'endpoint_start', {
        endpoint: ep.endpointKey || `${ep.method} ${ep.path}`,
        groupId: group.id,
        isTemplate,
        insightAvailable: groupInsight.fixRecipes.length,
        index: i,
        total: group.endpoints.length
      });

      const result = await runDocFixer({
        endpoint: ep,
        failureData: {
          reason: ep.reason,
          httpStatus: ep.httpStatus,
          errors: ep.details?.errors || [],
          friendlyMessage: ep.details?.friendlyMessage,
          suggestion: ep.details?.suggestion,
          docFixSuggestions: ep.healingInfo?.docFixSuggestions || ep.details?.docFixSuggestions || [],
          agentSummary: ep.healingInfo?.summary
        },
        healerAnalysis: ep.healingInfo?.analysisForFixer || null,
        config: session.config,
        directive: groupInsight.directive,
        accumulatedInsight: groupInsight.fixRecipes,
        referenceWorkflow: groupInsight.referenceWorkflow,
        userPrompt: resolvePromptForEndpoint(ep),
        onProgress: (event) => {
          // Track swagger domain modifications for the unifier
          if (event.type === 'file_changed' && event.file?.startsWith('swagger/') && event.domain) {
            session.swaggerDomainsModified.add(event.domain);
          }
          broadcastEvent(session, event.type, { ...event, groupId: group.id });
        }
      });

      // Capture fix recipe if successful
      if (result.success) {
        const recipe = {
          endpoint: result.endpoint,
          fixApplied: result.fixSummary,
          workflowChanges: result.workflowChanges,
          swaggerChanges: result.swaggerChanges,
          sourceReference: result.sourceReference,
          tokenUsed: result.tokenUsed
        };
        groupInsight.fixRecipes.push(recipe);

        broadcastEvent(session, 'insight_captured', {
          groupId: group.id,
          recipe,
          recipesCount: groupInsight.fixRecipes.length
        });
      }

      session.results.push({
        ...result,
        groupId: group.id,
        isTemplate,
        reason: ep.reason,
        httpStatus: ep.httpStatus,
        pathPattern: group.pathPattern
      });

      broadcastEvent(session, 'endpoint_complete', {
        endpoint: result.endpoint,
        success: result.success,
        fixSummary: result.fixSummary,
        groupId: group.id,
        isTemplate,
        iterations: result.iterations
      });
    }

    broadcastEvent(session, 'group_complete', {
      groupId: group.id,
      fixed: groupInsight.fixRecipes.length,
      total: group.endpoints.length
    });
  }

  // Phase 3: Process ungrouped endpoints (no insight propagation)
  if (ungrouped.length > 0 && !session.stopped) {
    broadcastEvent(session, 'phase_start', { phase: 'ungrouped', count: ungrouped.length });

    for (const ep of ungrouped) {
      if (session.stopped) break;

      broadcastEvent(session, 'endpoint_start', {
        endpoint: ep.endpointKey || `${ep.method} ${ep.path}`,
        groupId: null,
        isTemplate: false,
        insightAvailable: 0
      });

      const result = await runDocFixer({
        endpoint: ep,
        failureData: {
          reason: ep.reason,
          httpStatus: ep.httpStatus,
          errors: ep.details?.errors || [],
          friendlyMessage: ep.details?.friendlyMessage,
          suggestion: ep.details?.suggestion,
          docFixSuggestions: ep.healingInfo?.docFixSuggestions || ep.details?.docFixSuggestions || [],
          agentSummary: ep.healingInfo?.summary
        },
        config: session.config,
        directive: null,
        accumulatedInsight: [],
        referenceWorkflow: null,
        userPrompt: resolvePromptForEndpoint(ep),
        onProgress: (event) => {
          if (event.type === 'file_changed' && event.file?.startsWith('swagger/') && event.domain) {
            session.swaggerDomainsModified.add(event.domain);
          }
          broadcastEvent(session, event.type, event);
        }
      });

      session.results.push({ ...result, groupId: null, isTemplate: false });

      broadcastEvent(session, 'endpoint_complete', {
        endpoint: result.endpoint,
        success: result.success,
        fixSummary: result.fixSummary,
        groupId: null,
        isTemplate: false,
        iterations: result.iterations
      });
    }
  }

  // Phase 4: Enrich knowledge base
  const newPatterns = extractNewPatterns(session.results, groups);
  if (newPatterns.length > 0) {
    await appendToKnowledgeBase(newPatterns);
    broadcastEvent(session, 'knowledge_base_updated', {
      newEntries: newPatterns.length,
      patterns: newPatterns.map(p => p.title)
    });
  }

  // Phase 5: Run the OpenAPI unifier if any swagger files were modified
  if (session.swaggerDomainsModified.size > 0) {
    const domains = [...session.swaggerDomainsModified];
    broadcastEvent(session, 'phase_start', { phase: 'unification', domains });
    console.log(`[FixReport] Running OpenAPI unifier for modified domains: ${domains.join(', ')}`);

    try {
      await runUnifier();
      broadcastEvent(session, 'unification_complete', {
        domains,
        message: `Unified swagger updated for: ${domains.join(', ')}`
      });
      console.log(`[FixReport] OpenAPI unifier completed successfully`);
    } catch (err) {
      console.error(`[FixReport] OpenAPI unifier failed:`, err.message);
      broadcastEvent(session, 'unification_error', {
        domains,
        error: err.message
      });
    }
  }

  // Phase 6: Session complete
  session.status = 'completed';
  const summary = buildSessionSummary(session);
  broadcastEvent(session, 'session_complete', { summary });

  // Clean up session after 30 minutes (extended to allow continue/resume)
  setTimeout(() => activeSessions.delete(session.id), 30 * 60 * 1000);
}

// ─── OpenAPI Unifier ─────────────────────────────────────────────────────────

/**
 * Run the OpenAPI unifier script to regenerate mcp_swagger/ from swagger/.
 * Executed from the repo root so relative paths in the script resolve correctly.
 */
function runUnifier() {
  return new Promise((resolve, reject) => {
    exec('node scripts/unify-openapi.js', { cwd: REPO_ROOT, timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Unifier] stderr: ${stderr}`);
        return reject(error);
      }
      if (stdout) console.log(`[Unifier] ${stdout.trim()}`);
      resolve(stdout);
    });
  });
}

// ─── Knowledge Base Enrichment ───────────────────────────────────────────────

/**
 * Extract new fix patterns from session results that should be added to the KB.
 * Only creates entries when 2+ endpoints were fixed with the same pattern.
 */
function extractNewPatterns(results, groups) {
  const successfulByGroup = {};

  for (const result of results.filter(r => r.success && r.groupId)) {
    const group = groups.find(g => g.id === result.groupId);
    if (!group) continue;

    if (!successfulByGroup[group.id]) {
      successfulByGroup[group.id] = { group, results: [] };
    }
    successfulByGroup[group.id].results.push(result);
  }

  const newPatterns = [];

  for (const { group, results: groupResults } of Object.values(successfulByGroup)) {
    // Only create KB entry if 2+ endpoints were fixed with same pattern
    if (groupResults.length < 2) continue;
    // Skip if knowledge base already has a matching entry
    if (group.knowledgeBaseMatch) continue;

    newPatterns.push({
      title: summarizeGroupFix(group, groupResults),
      symptoms: group.label,
      sampleEndpoints: groupResults.slice(0, 3).map(r => r.endpoint),
      pathPatterns: [group.pathPattern],
      resolution: groupResults[0].fixSummary || 'See sample endpoints for fix pattern.'
    });
  }

  return newPatterns;
}

function summarizeGroupFix(group, results) {
  const fixTypes = results.map(r => r.fixSummary || '').filter(Boolean);
  // Try to find common keywords
  const keywords = {};
  for (const fix of fixTypes) {
    for (const word of fix.toLowerCase().split(/\s+/)) {
      if (word.length > 3) {
        keywords[word] = (keywords[word] || 0) + 1;
      }
    }
  }
  const topKeyword = Object.entries(keywords)
    .sort(([, a], [, b]) => b - a)
    .find(([word]) => !['the', 'and', 'for', 'with', 'from', 'that', 'this'].includes(word));

  return `${group.httpStatus} ${group.reason} on ${group.pathPattern}${topKeyword ? ` (${topKeyword[0]})` : ''}`;
}

/**
 * Append new entries to healing-knowledge-base.md
 */
async function appendToKnowledgeBase(patterns) {
  try {
    let content = '';
    if (fs.existsSync(KB_PATH)) {
      content = fs.readFileSync(KB_PATH, 'utf8');
    }

    const newEntries = patterns.map(p => {
      let entry = `\n## Entry - ${p.title}\n`;
      entry += `- Symptoms: ${p.symptoms}\n`;
      entry += `- Sample endpoints:\n`;
      for (const ep of p.sampleEndpoints) {
        entry += `  - ${ep}\n`;
      }
      entry += `- Common path patterns:\n`;
      for (const pp of p.pathPatterns) {
        entry += `  - ${pp}\n`;
      }
      entry += `- Resolution: ${p.resolution}\n`;
      return entry;
    });

    fs.writeFileSync(KB_PATH, content + '\n' + newEntries.join('\n'), 'utf8');
    console.log(`[KnowledgeBase] Added ${patterns.length} new entries`);
  } catch (e) {
    console.error(`[KnowledgeBase] Failed to append:`, e.message);
  }
}

// ─── Summary Builder ─────────────────────────────────────────────────────────

function buildSessionSummary(session) {
  const totalEndpoints = session.results.length;
  const fixed = session.results.filter(r => r.success).length;
  const failed = session.results.filter(r => !r.success).length;
  const groupsCompleted = session.groups.filter(g => {
    const groupResults = session.results.filter(r => r.groupId === g.id);
    return groupResults.length === g.endpoints.length;
  }).length;

  return {
    totalEndpoints,
    fixed,
    failed,
    passRate: totalEndpoints > 0 ? `${Math.round((fixed / totalEndpoints) * 100)}%` : '0%',
    groupsTotal: session.groups.length,
    groupsCompleted,
    ungroupedTotal: session.ungrouped.length,
    stoppedEarly: session.stopped,
    duration: Date.now() - session.startedAt,
    results: session.results.map(r => ({
      endpoint: r.endpoint,
      success: r.success,
      fixSummary: r.fixSummary,
      groupId: r.groupId,
      isTemplate: r.isTemplate
    }))
  };
}

module.exports = router;
