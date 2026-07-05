/**
 * Report Analyzer (Layer 1)
 * 
 * Deterministic (no AI) module that groups failed endpoints by failure pattern.
 * Produces ordered fix groups with directives based on:
 *   - Failure reason + HTTP status
 *   - Path pattern similarity
 *   - Knowledge base matches
 *   - Reference workflows with same pattern
 */

const fs = require('fs');
const path = require('path');
const workflowRepo = require('../workflows/repository');

const KB_PATH = path.join(__dirname, '../../../docs/healing-knowledge-base.md');

// ─── Path Pattern Extraction ─────────────────────────────────────────────────

/**
 * Extract a generalized path pattern from an API path.
 * e.g. "/business/payments/v1/invoices/{uid}" → "/business/payments/v1/*"
 *      "/platform/v1/clients/{client_id}/estimates" → "/platform/v1/clients/{id}/*"
 */
function extractPathPattern(apiPath) {
  if (!apiPath) return 'unknown';

  // Normalize: replace all {param} tokens with {id}
  let normalized = apiPath.replace(/\{[^}]+\}/g, '{id}');

  // Split into segments
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 2) return '/' + parts.join('/');

  // Keep first 3 meaningful segments (e.g. platform/v1/clients) + wildcard
  // For /business/payments/v1/* keep 3
  // For /platform/v1/clients/{id}/* keep 4
  let keepCount = 3;
  // If 4th segment is {id}, keep it as it creates a meaningful sub-pattern
  if (parts.length > 3 && parts[3] === '{id}') {
    keepCount = 4;
  }

  const pattern = '/' + parts.slice(0, keepCount).join('/') + (parts.length > keepCount ? '/*' : '');
  return pattern;
}

/**
 * Determine the HTTP method ordering priority (simpler first).
 * GET < DELETE < PUT < PATCH < POST
 */
function methodPriority(method) {
  const order = { GET: 0, DELETE: 1, PUT: 2, PATCH: 3, POST: 4 };
  return order[(method || '').toUpperCase()] ?? 5;
}

// ─── Knowledge Base Parsing ──────────────────────────────────────────────────

/**
 * Parse healing-knowledge-base.md into structured entries.
 */
function parseKnowledgeBase() {
  try {
    if (!fs.existsSync(KB_PATH)) return [];

    const content = fs.readFileSync(KB_PATH, 'utf8');
    const entries = [];
    const entryBlocks = content.split(/^## Entry - /m).slice(1); // skip preamble

    for (const block of entryBlocks) {
      const lines = block.split('\n');
      const title = lines[0].trim();

      const symptomsMatch = block.match(/- Symptoms:\s*(.*)/i);
      const pathPatternsMatch = block.match(/- Common path patterns:\s*([\s\S]*?)(?=\n- Resolution:)/i);
      const resolutionMatch = block.match(/- Resolution:\s*([\s\S]*?)(?=\n## |$)/i);
      const sampleEndpointsSection = block.match(/- Sample endpoints:\s*([\s\S]*?)(?=\n- Common path patterns:)/i);

      const sampleEndpoints = [];
      if (sampleEndpointsSection) {
        const epLines = sampleEndpointsSection[1].split('\n').filter(l => l.trim().startsWith('-'));
        for (const l of epLines) {
          sampleEndpoints.push(l.replace(/^\s*-\s*/, '').trim());
        }
      }

      const pathPatterns = [];
      if (pathPatternsMatch) {
        const ppLines = pathPatternsMatch[1].split('\n').filter(l => l.trim().startsWith('-'));
        for (const l of ppLines) {
          pathPatterns.push(l.replace(/^\s*-\s*/, '').trim());
        }
      }

      entries.push({
        title,
        symptoms: symptomsMatch ? symptomsMatch[1].trim() : '',
        sampleEndpoints,
        pathPatterns,
        resolution: resolutionMatch ? resolutionMatch[1].trim() : ''
      });
    }

    return entries;
  } catch (_e) {
    return [];
  }
}

/**
 * Find a knowledge base entry that matches a group's characteristics.
 */
function findKBMatch(reason, httpStatus, pathPattern, kbEntries) {
  for (const entry of kbEntries) {
    const symptoms = entry.symptoms.toLowerCase();
    const resolution = entry.resolution.toLowerCase();

    // Match by HTTP status in symptoms
    const statusMatch = symptoms.includes(String(httpStatus));

    // Match by path pattern
    const patternMatch = entry.pathPatterns.some(pp => {
      const ppNorm = pp.replace(/\*/g, '');
      const patNorm = pathPattern.replace(/\*/g, '').replace(/\{id\}/g, '');
      return patNorm.includes(ppNorm) || ppNorm.includes(patNorm);
    });

    // Match by failure reason keywords
    const reasonKeywords = {
      AUTH_FAILED: ['401', 'unauthorized', 'auth', 'token'],
      SERVER_ERROR: ['500', 'server error', 'blank', 'internal'],
      VALIDATION_ERROR: ['422', 'validation', 'missing field', 'required'],
      UNEXPECTED_STATUS_CODE: ['status code', 'unexpected'],
      BAD_GATEWAY_FALLBACK: ['bad gateway', '502', 'fallback'],
      ENDPOINT_NOT_FOUND: ['404', 'not found']
    };

    const keywords = reasonKeywords[reason] || [];
    const keywordMatch = keywords.some(kw => symptoms.includes(kw) || resolution.includes(kw));

    // Need at least 2 signals to match
    const matchCount = [statusMatch, patternMatch, keywordMatch].filter(Boolean).length;
    if (matchCount >= 2) {
      return entry;
    }
  }
  return null;
}

// ─── Token Pattern Heuristics ────────────────────────────────────────────────

const TOKEN_PATTERN_HINTS = {
  '/platform/v1/clients/{id}/': 'directory token + X-On-Behalf-Of header',
  '/platform/v1/': 'staff token (or directory + X-On-Behalf-Of for cross-business)',
  '/business/clients/v1/': 'staff token with business context',
  '/client/': 'client JWT token',
  '/v3/access_control/': 'staff or directory token',
  '/v3/apps/': 'app token via OAuth',
  '/business/payments/v1/': 'staff token',
  '/business/scheduling/': 'staff token',
};

function getTokenHint(pathPattern) {
  for (const [prefix, hint] of Object.entries(TOKEN_PATTERN_HINTS)) {
    if (pathPattern.includes(prefix.replace(/\{id\}/, ''))) {
      return hint;
    }
  }
  return null;
}

// ─── Reference Workflow Lookup ───────────────────────────────────────────────

/**
 * Find a verified workflow with a similar path pattern.
 */
function findReferenceWorkflow(pathPattern, endpoints) {
  // Extract the common prefix from the pattern (remove wildcard)
  const prefix = pathPattern.replace(/\/\*$/, '').replace(/\{id\}/g, '');

  try {
    const index = workflowRepo.getIndex();
    const allWorkflows = Object.keys(index.workflows || {});

    for (const wfKey of allWorkflows) {
      const wf = index.workflows[wfKey];
      if (wf.status !== 'verified') continue;

      // Check if this workflow's endpoint matches our path pattern
      const wfPath = wfKey.split(' ').slice(1).join(' ');
      const wfPathNorm = wfPath.replace(/\{[^}]+\}/g, '');

      if (wfPathNorm.includes(prefix) || prefix.includes(wfPathNorm.split('/').slice(0, 4).join('/'))) {
        // Found a verified workflow with similar pattern
        const fullWorkflow = workflowRepo.get(wfKey);
        if (fullWorkflow) {
          return {
            endpoint: wfKey,
            status: wf.status,
            token: fullWorkflow.metadata?.token || fullWorkflow.testRequest?.token || 'unknown',
            summary: fullWorkflow.metadata?.description || wf.description || '',
            hasPrerequisites: !!(fullWorkflow.prerequisites?.steps?.length),
            filePath: wf.file
          };
        }
      }
    }
  } catch (_e) {
    // Workflow repo not available
  }

  return null;
}

// ─── Directive Builder ───────────────────────────────────────────────────────

function buildDirective(group) {
  const parts = [];

  // Strong opening directive based on failure reason
  if (group.reason === 'EXPECTED_ERROR') {
    parts.push(`⚠️ THESE ENDPOINTS RETURN ${group.httpStatus} BECAUSE THE WORKFLOW IS INCOMPLETE. Your job is to FIX the workflow so it returns 2xx. Do NOT accept ${group.httpStatus} as "expected behavior". Add prerequisite steps to create the data the endpoint needs. Remove any "expectedOutcome" field if you can get 2xx`);
  } else if (group.reason === 'AUTH_FAILED') {
    parts.push(`These endpoints fail authentication. Use the correct token pattern from similar verified workflows. Do NOT investigate auth source code — just try the right token type + fallback API`);
  } else if (group.reason === 'VALIDATION_ERROR' || group.reason === 'SERVER_ERROR') {
    parts.push(`These endpoints fail because the request data is wrong or missing. Fix the workflow body/params and add prerequisites to resolve real UIDs. Do NOT use fake UIDs`);
  }

  if (group.knowledgeBaseMatch) {
    parts.push(`KB entry "${group.knowledgeBaseMatch.title}" applies: ${group.knowledgeBaseMatch.resolution}`);
  }

  if (group.referenceWorkflow) {
    parts.push(`Reference verified workflow: ${group.referenceWorkflow.endpoint} (token: ${group.referenceWorkflow.token}${group.referenceWorkflow.hasPrerequisites ? ', has prerequisites' : ''})`);
  }

  const tokenHint = getTokenHint(group.pathPattern);
  if (tokenHint) {
    parts.push(`Token pattern hint: ${tokenHint}`);
  }

  if (parts.length === 0) {
    parts.push(`${group.endpoints.length} endpoints failing with ${group.httpStatus} ${group.reason} on ${group.pathPattern}. Fix the workflow to get a 2xx response. Investigate starting with the simplest endpoint.`);
  }

  return parts.join('. ');
}

// ─── Main Analyzer ───────────────────────────────────────────────────────────

/**
 * Analyze a set of failed results and produce ordered fix groups.
 * 
 * @param {Object[]} failedResults - Array of failed test result objects.
 *   Each must have: { endpoint, method, path, status, httpStatus, domain,
 *                     details: { reason, errors, healingInfo } }
 * @returns {{ groups: Object[], ungrouped: Object[] }}
 */
function analyzeReport(failedResults) {
  if (!failedResults || failedResults.length === 0) {
    return { groups: [], ungrouped: [] };
  }

  const kbEntries = parseKnowledgeBase();

  // Step 1: Enrich each result with extracted pattern and workflow existence
  const enriched = failedResults.map(r => {
    const reason = r.details?.reason || r.reason || 'UNKNOWN';
    const httpStatus = r.httpStatus || 0;
    const apiPath = r.path || (r.endpoint ? r.endpoint.split(' ').slice(1).join(' ') : '');
    const method = r.method || (r.endpoint ? r.endpoint.split(' ')[0] : 'GET');
    const pathPattern = extractPathPattern(apiPath);
    const domain = r.domain || 'unknown';

    // Check if workflow exists
    const endpointKey = `${method} ${apiPath}`;
    let hasWorkflow = false;
    try {
      hasWorkflow = !!workflowRepo.get(endpointKey);
    } catch (_e) { /* ignore */ }

    return {
      ...r,
      method,
      path: apiPath,
      reason,
      httpStatus,
      pathPattern,
      domain,
      hasWorkflow,
      endpointKey
    };
  });

  // Step 2: Group by composite key (reason, httpStatus, pathPattern)
  const groupMap = {};
  for (const ep of enriched) {
    const key = `${ep.reason}|${ep.httpStatus}|${ep.pathPattern}`;
    if (!groupMap[key]) {
      groupMap[key] = {
        reason: ep.reason,
        httpStatus: ep.httpStatus,
        pathPattern: ep.pathPattern,
        endpoints: []
      };
    }
    groupMap[key].endpoints.push(ep);
  }

  // Step 3: Separate groups (2+ endpoints) from ungrouped (1 endpoint)
  const rawGroups = [];
  const ungrouped = [];

  for (const group of Object.values(groupMap)) {
    if (group.endpoints.length >= 2) {
      rawGroups.push(group);
    } else {
      ungrouped.push(...group.endpoints);
    }
  }

  // Step 4: Enrich each group with KB match, reference workflow, and directive
  const groups = rawGroups.map((group, i) => {
    // Sort endpoints: simplest method first (GET before POST)
    group.endpoints.sort((a, b) => methodPriority(a.method) - methodPriority(b.method));

    const kbMatch = findKBMatch(group.reason, group.httpStatus, group.pathPattern, kbEntries);
    const refWorkflow = findReferenceWorkflow(group.pathPattern, group.endpoints);

    const enrichedGroup = {
      id: `group-${i + 1}`,
      label: `${group.httpStatus} ${group.reason} on ${group.pathPattern} (${group.endpoints.length} endpoints)`,
      reason: group.reason,
      httpStatus: group.httpStatus,
      pathPattern: group.pathPattern,
      endpoints: group.endpoints,
      knowledgeBaseMatch: kbMatch,
      referenceWorkflow: refWorkflow,
      directive: '' // filled below
    };

    enrichedGroup.directive = buildDirective(enrichedGroup);
    return enrichedGroup;
  });

  // Step 5: Order groups by size (largest first for maximum leverage)
  groups.sort((a, b) => b.endpoints.length - a.endpoints.length);

  return { groups, ungrouped };
}

module.exports = {
  analyzeReport,
  extractPathPattern,
  parseKnowledgeBase,
  findKBMatch,
  findReferenceWorkflow
};
