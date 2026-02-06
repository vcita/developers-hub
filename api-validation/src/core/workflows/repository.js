/**
 * Workflow Repository
 * 
 * A searchable, LLM-friendly repository for API workflows.
 * Designed to be reusable across agentic frameworks.
 * 
 * IMPORTANT: All workflows follow the canonical format defined in:
 * - TEMPLATE.md: Canonical workflow format
 * - CONSISTENCY_AUDIT.md: Consistency requirements
 * 
 * @see workflows/TEMPLATE.md for the authoritative workflow format
 */

const fs = require('fs');
const path = require('path');
const { parseYamlSteps } = require('../prerequisite/executor');

// Repository paths
const WORKFLOWS_DIR = path.join(__dirname, '../../../workflows');
const INDEX_PATH = path.join(WORKFLOWS_DIR, 'index.json');
const TEMPLATE_PATH = path.join(WORKFLOWS_DIR, 'TEMPLATE.md');

// In-memory cache for the dynamically built index
let cachedIndex = null;

/**
 * Recursively scan a directory for workflow .md files
 * @param {string} dir - Directory to scan
 * @param {string} baseDir - Base directory for relative paths
 * @returns {Array} Array of {filePath, relativePath} objects
 */
function scanWorkflowFiles(dir, baseDir = dir) {
  const files = [];
  
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Recurse into subdirectories
        files.push(...scanWorkflowFiles(fullPath, baseDir));
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'TEMPLATE.md') {
        // Add .md files (except TEMPLATE.md)
        const relativePath = path.relative(baseDir, fullPath);
        files.push({ filePath: fullPath, relativePath });
      }
    }
  } catch (e) {
    console.error(`Failed to scan directory ${dir}:`, e.message);
  }
  
  return files;
}

/**
 * Build the workflow index dynamically from workflow files
 * @returns {Object} Index object
 */
function buildIndexFromFiles() {
  const index = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    workflows: {},
    byDomain: {},
    byTag: {}
  };
  
  const workflowFiles = scanWorkflowFiles(WORKFLOWS_DIR);
  
  for (const { filePath, relativePath } of workflowFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Parse YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) continue;
      
      const frontmatter = frontmatterMatch[1];
      const metadata = {};
      
      // Simple YAML parsing for frontmatter
      let currentArray = null;
      let currentKey = null;
      
      frontmatter.split('\n').forEach(line => {
        // Array item
        if (currentArray && line.match(/^\s+-\s+/)) {
          const value = line.replace(/^\s+-\s+/, '').trim();
          currentArray.push(value);
          return;
        }
        
        // Key-value pair
        const kvMatch = line.match(/^(\w+):\s*(.*)$/);
        if (kvMatch) {
          const [, key, value] = kvMatch;
          currentKey = key;
          
          if (value.startsWith('[') && value.endsWith(']')) {
            // Inline array like [views, crm]
            const items = value.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
            metadata[key] = items;
            currentArray = null;
          } else if (value === '' || value === '[]') {
            // Start of array or empty array
            metadata[key] = [];
            currentArray = metadata[key];
          } else if (value === 'true') {
            metadata[key] = true;
            currentArray = null;
          } else if (value === 'false') {
            metadata[key] = false;
            currentArray = null;
          } else {
            // Remove quotes if present
            metadata[key] = value.replace(/^["']|["']$/g, '');
            currentArray = null;
          }
        }
      });
      
      // Skip if no endpoint defined
      if (!metadata.endpoint) continue;
      
      const endpoint = metadata.endpoint;
      const domain = metadata.domain || 'unknown';
      const tags = metadata.tags || [];
      const status = metadata.status || 'pending';
      
      // Add to index
      index.workflows[endpoint] = {
        file: relativePath,
        domain,
        tags,
        status,
        skipReason: metadata.skipReason || null,
        timesReused: metadata.timesReused || 0,
        savedAt: metadata.savedAt || null,
        verifiedAt: metadata.verifiedAt || null
      };
      
      // Index by domain
      if (!index.byDomain[domain]) {
        index.byDomain[domain] = [];
      }
      index.byDomain[domain].push(endpoint);
      
      // Index by tag
      for (const tag of tags) {
        if (!index.byTag[tag]) {
          index.byTag[tag] = [];
        }
        index.byTag[tag].push(endpoint);
      }
      
    } catch (e) {
      console.error(`Failed to parse workflow ${filePath}:`, e.message);
    }
  }
  
  return index;
}

/**
 * Load the workflow index (dynamically built from files)
 * @param {boolean} forceRebuild - Force rebuild even if cached
 * @returns {Object} Index object
 */
function loadIndex(forceRebuild = false) {
  if (!cachedIndex || forceRebuild) {
    console.log('[Workflow Index] Building index dynamically from workflow files...');
    cachedIndex = buildIndexFromFiles();
    console.log(`[Workflow Index] Indexed ${Object.keys(cachedIndex.workflows).length} workflows`);
  }
  return cachedIndex;
}

/**
 * Invalidate the cached index (call when workflows are modified)
 */
function invalidateIndexCache() {
  cachedIndex = null;
}

/**
 * Save the workflow index
 * NOTE: With dynamic index building, this is mainly for persisting changes
 * that should survive restarts (like timesReused counters)
 * @param {Object} index - Index object to save
 */
function saveIndex(index) {
  try {
    index.lastUpdated = new Date().toISOString();
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
    // Invalidate cache so next load picks up changes
    invalidateIndexCache();
  } catch (e) {
    console.error('Failed to save workflow index:', e.message);
  }
}

/**
 * Parse a workflow markdown file
 * @param {string} filePath - Path to the markdown file
 * @returns {Object|null} Parsed workflow or null
 */
function parseWorkflowFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { content, metadata: {} };
    }
    
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    // Simple YAML parsing (key: value)
    const metadata = {};
    let currentKey = null;
    let currentArray = null;
    
    frontmatter.split('\n').forEach(line => {
      // Check for array item with key-value pair (e.g., "  - path: /data/offerings/*/type")
      const arrayItemWithKV = line.match(/^\s+-\s+(\w+):\s*(.*)$/);
      if (currentArray && arrayItemWithKV) {
        // Start a new object with the first key-value pair
        const [, key, value] = arrayItemWithKV;
        const newItem = { [key]: value };
        currentArray.push(newItem);
        return;
      }
      
      // Check for array item (starts with "  - " followed by simple value)
      if (currentArray && line.match(/^\s+-\s+[^:]+$/)) {
        // This is an array item with simple string value
        const itemContent = line.replace(/^\s+-\s+/, '').trim();
        currentArray.push(itemContent);
        return;
      }
      
      // Check for nested object property (starts with "    " - more indentation than array item)
      if (currentArray && currentArray.length > 0 && line.match(/^\s{4,}\w+:/)) {
        // This is a property of the current array item
        const propMatch = line.match(/^\s+(\w+):\s*(.*)$/);
        if (propMatch) {
          const lastItem = currentArray[currentArray.length - 1];
          if (typeof lastItem === 'string') {
            // Convert string to object (shouldn't happen with new logic, but keeping for safety)
            currentArray[currentArray.length - 1] = { path: lastItem };
          }
          currentArray[currentArray.length - 1][propMatch[1]] = propMatch[2];
        }
        return;
      }
      
      // Regular key: value line
      const match = line.match(/^(\w+):\s*(.*)$/);
      if (match) {
        const [, key, value] = match;
        currentKey = key;
        currentArray = null;
        
        // Handle arrays like [tag1, tag2]
        if (value.startsWith('[') && value.endsWith(']')) {
          metadata[key] = value.slice(1, -1).split(',').map(s => s.trim());
        } else if (value === '' || value === undefined) {
          // Start of a multi-line array (knownDataIssues:)
          metadata[key] = [];
          currentArray = metadata[key];
        } else {
          metadata[key] = value;
        }
      }
    });
    
    // Extract sections from body
    const sections = {};
    const sectionRegex = /^## (.+)$/gm;
    let lastSection = null;
    let lastIndex = 0;
    let match;
    
    while ((match = sectionRegex.exec(body)) !== null) {
      if (lastSection) {
        sections[lastSection] = body.slice(lastIndex, match.index).trim();
      }
      lastSection = match[1];
      lastIndex = match.index + match[0].length;
    }
    if (lastSection) {
      sections[lastSection] = body.slice(lastIndex).trim();
    }
    
    // Extract JSON from "Verified Successful Request" section
    let successfulRequest = null;
    if (sections['Verified Successful Request']) {
      const jsonMatch = sections['Verified Successful Request'].match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          successfulRequest = JSON.parse(jsonMatch[1]);
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }
    
    // Extract JSON from "UID Resolution" section (new format)
    let uidResolution = null;
    if (sections['UID Resolution']) {
      const jsonMatch = sections['UID Resolution'].match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        try {
          uidResolution = JSON.parse(jsonMatch[1]);
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }
    
    // Extract structured prerequisites (new deterministic format)
    let prerequisites = null;
    if (sections['Prerequisites']) {
      const yamlMatch = sections['Prerequisites'].match(/```yaml\n([\s\S]*?)\n```/);
      if (yamlMatch) {
        try {
          prerequisites = parseYamlSteps(yamlMatch[1]);
        } catch (e) {
          console.error(`Failed to parse prerequisites YAML: ${e.message}`);
        }
      }
    }
    
    // Extract structured test request (new deterministic format)
    let testRequest = null;
    if (sections['Test Request']) {
      const yamlMatch = sections['Test Request'].match(/```yaml\n([\s\S]*?)\n```/);
      if (yamlMatch) {
        try {
          const parsed = parseYamlSteps(yamlMatch[1]);
          testRequest = parsed.steps?.[0] || null;
        } catch (e) {
          console.error(`Failed to parse test request YAML: ${e.message}`);
        }
      }
    }
    
    return {
      metadata,
      sections,
      successfulRequest,
      uidResolution,
      prerequisites,
      testRequest,
      content
    };
  } catch (e) {
    console.error(`Failed to parse workflow file ${filePath}:`, e.message);
    return null;
  }
}

/**
 * Get a specific workflow by endpoint
 * @param {string} endpoint - Endpoint like "POST /platform/v1/payment/packages"
 * @returns {Object|null} Workflow data or null
 */
function get(endpoint) {
  const index = loadIndex();
  const entry = index.workflows[endpoint];
  
  if (!entry) {
    return null;
  }
  
  const filePath = path.join(WORKFLOWS_DIR, entry.file);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const parsed = parseWorkflowFile(filePath);
  if (!parsed) {
    return null;
  }
  
  // Parse useFallbackApi - handle both boolean and string 'true'
  const rawUseFallbackApi = parsed.metadata?.useFallbackApi;
  const useFallbackApi = rawUseFallbackApi === true || rawUseFallbackApi === 'true';
  
  console.log(`  [workflow.get] ${endpoint} - raw useFallbackApi: "${rawUseFallbackApi}" (${typeof rawUseFallbackApi}) -> resolved: ${useFallbackApi}`);
  
  return {
    endpoint,
    file: entry.file,
    domain: entry.domain,
    tags: entry.tags,
    status: entry.status,
    skipReason: entry.skipReason || parsed.metadata?.skipReason || null,  // Include skip reason
    knownIssues: parsed.metadata?.knownIssues || [],  // Include known issues to suppress in validation
    timesReused: entry.timesReused || 0,
    useFallbackApi,  // Include useFallbackApi flag for workflows that require fallback URL
    uidResolution: parsed.uidResolution || null,  // Include UID resolution mappings
    prerequisites: parsed.prerequisites || null,  // Include structured prerequisites for deterministic execution
    testRequest: parsed.testRequest || null,  // Include structured test request
    // NOTE: docFixes intentionally not returned - workflows are success paths only
    ...parsed
  };
}

/**
 * Check if a validation error matches a known issue pattern
 * @param {Object} error - Validation error with path property
 * @param {Array} knownIssues - Array of known issue objects with path patterns
 * @returns {boolean} True if error matches a known issue
 */
function matchesKnownIssue(error, knownIssues) {
  if (!error || !knownIssues || knownIssues.length === 0) {
    return false;
  }
  
  const errorPath = error.path || error.instancePath || '';
  
  for (const issue of knownIssues) {
    const pattern = issue.path || issue;
    if (typeof pattern !== 'string') continue;
    
    // Convert pattern like "/data/offerings/*/type" to regex
    // * matches any array index like [0], [11], etc.
    const regexPattern = pattern
      .replace(/\//g, '\\/')  // Escape forward slashes
      .replace(/\*/g, '\\d+');  // * matches array indices (digits)
    
    const regex = new RegExp(`^${regexPattern}$`);
    
    if (regex.test(errorPath)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter out validation errors that match known issues
 * @param {Array} errors - Array of validation errors
 * @param {Array} knownIssues - Array of known issue patterns
 * @returns {Object} { filteredErrors: Array, suppressedCount: number }
 */
function filterKnownIssues(errors, knownIssues) {
  if (!errors || errors.length === 0 || !knownIssues || knownIssues.length === 0) {
    return { filteredErrors: errors || [], suppressedCount: 0 };
  }
  
  const filteredErrors = [];
  let suppressedCount = 0;
  
  for (const error of errors) {
    if (matchesKnownIssue(error, knownIssues)) {
      suppressedCount++;
      console.log(`  [KnownIssue] Suppressed error at path: ${error.path || error.instancePath}`);
    } else {
      filteredErrors.push(error);
    }
  }
  
  return { filteredErrors, suppressedCount };
}

/**
 * List all workflows in a domain
 * @param {string} domain - Domain name (e.g., 'sales', 'clients')
 * @returns {Array} Array of workflow summaries
 */
function list(domain) {
  const index = loadIndex();
  const endpoints = index.byDomain[domain] || [];
  
  return endpoints.map(endpoint => {
    const entry = index.workflows[endpoint];
    return {
      endpoint,
      file: entry?.file,
      domain: entry?.domain,
      tags: entry?.tags,
      status: entry?.status,
      timesReused: entry?.timesReused || 0
    };
  });
}

/**
 * Search workflows by various criteria
 * @param {Object} query - Search query
 * @param {string} query.endpoint - Partial endpoint match
 * @param {string} query.domain - Domain filter
 * @param {string[]} query.tags - Tags to match (any)
 * @param {string} query.status - Status filter
 * @param {string} query.text - Full-text search in content
 * @returns {Array} Matching workflows
 */
function search(query = {}) {
  const index = loadIndex();
  let results = Object.keys(index.workflows);
  
  // Filter by endpoint (partial match)
  if (query.endpoint) {
    const searchEndpoint = query.endpoint.toLowerCase();
    results = results.filter(ep => ep.toLowerCase().includes(searchEndpoint));
  }
  
  // Filter by domain
  if (query.domain) {
    const domainEndpoints = new Set(index.byDomain[query.domain] || []);
    results = results.filter(ep => domainEndpoints.has(ep));
  }
  
  // Filter by tags (any match)
  if (query.tags && query.tags.length > 0) {
    const searchTags = new Set(query.tags.map(t => t.toLowerCase()));
    results = results.filter(ep => {
      const entry = index.workflows[ep];
      const entryTags = (entry.tags || []).map(t => t.toLowerCase());
      return entryTags.some(t => searchTags.has(t));
    });
  }
  
  // Filter by status
  if (query.status) {
    results = results.filter(ep => index.workflows[ep].status === query.status);
  }
  
  // Full-text search in content
  if (query.text) {
    const searchText = query.text.toLowerCase();
    results = results.filter(ep => {
      const entry = index.workflows[ep];
      const filePath = path.join(WORKFLOWS_DIR, entry.file);
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      return content.includes(searchText);
    });
  }
  
  // Return full workflow data
  return results.map(endpoint => {
    const entry = index.workflows[endpoint];
    return {
      endpoint,
      file: entry.file,
      domain: entry.domain,
      tags: entry.tags,
      status: entry.status,
      timesReused: entry.timesReused || 0
    };
  });
}

/**
 * Convert uidResolution documentation into executable YAML prerequisites
 * This bridges the gap between AI healer findings and executable workflows
 * @param {Object} uidResolution - UID resolution mappings from healer
 * @param {string} tokenType - Token type to use for requests (default: 'staff')
 * @returns {string|null} YAML prerequisites string or null if none needed
 */
function generateExecutablePrerequisites(uidResolution, tokenType = 'staff') {
  if (!uidResolution || Object.keys(uidResolution).length === 0) {
    return null;
  }
  
  const steps = [];
  let stepIndex = 1;
  
  for (const [field, resolution] of Object.entries(uidResolution)) {
    // Normalize field name to valid variable name (remove brackets, dots)
    const varName = field.replace(/\[\]/g, '').replace(/\./g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    
    if (resolution.create_fresh && resolution.create_endpoint) {
      // Fresh data creation workflow
      const [method, ...pathParts] = resolution.create_endpoint.split(' ');
      const path = pathParts.join(' ') || resolution.create_endpoint;
      
      const step = {
        id: `create_${varName}`,
        description: `Create fresh ${field} for testing`,
        method: method || 'POST',
        path: path.startsWith('/') ? path : `/${path}`,
        token: tokenType,
        expect: { status: [200, 201] },
        extract: {}
      };
      
      // Add body if provided
      if (resolution.create_body) {
        step.body = resolution.create_body;
      }
      
      // Add extraction - determine the response path
      const extractPath = resolution.extract_from || 'data.uid';
      step.extract[varName] = extractPath;
      
      steps.push(step);
      
      // Add cleanup step if endpoint provided
      if (resolution.cleanup_endpoint) {
        // Note: cleanup would need to reference the created UID
        // We'll document this but not add as a step (cleanup happens post-test)
      }
    } else if (resolution.source_endpoint) {
      // Standard GET and extract workflow
      const [method, ...pathParts] = resolution.source_endpoint.split(' ');
      const path = pathParts.join(' ') || resolution.source_endpoint;
      
      const step = {
        id: `get_${varName}`,
        description: `Fetch ${field} from existing data`,
        method: method || 'GET',
        path: path.startsWith('/') ? path : `/${path}`,
        token: tokenType,
        expect: { status: [200] },
        extract: {},
        onFail: 'abort'
      };
      
      // Add extraction
      const extractPath = resolution.extract_from || 'data[0].uid';
      step.extract[varName] = extractPath;
      
      steps.push(step);
    }
    
    stepIndex++;
  }
  
  if (steps.length === 0) {
    return null;
  }
  
  // Generate YAML string
  const yamlLines = ['```yaml', 'steps:'];
  
  for (const step of steps) {
    yamlLines.push(`  - id: ${step.id}`);
    yamlLines.push(`    description: "${step.description}"`);
    yamlLines.push(`    method: ${step.method}`);
    yamlLines.push(`    path: "${step.path}"`);
    yamlLines.push(`    token: ${step.token}`);
    
    // Expect section
    yamlLines.push(`    expect:`);
    yamlLines.push(`      status: [${step.expect.status.join(', ')}]`);
    
    // Extract section
    yamlLines.push(`    extract:`);
    for (const [varName, extractPath] of Object.entries(step.extract)) {
      yamlLines.push(`      ${varName}: "${extractPath}"`);
    }
    
    // OnFail if present
    if (step.onFail) {
      yamlLines.push(`    onFail: ${step.onFail}`);
    }
    
    // Body if present (inline JSON for simplicity)
    if (step.body) {
      yamlLines.push(`    body: ${JSON.stringify(step.body)}`);
    }
  }
  
  yamlLines.push('```');
  
  return yamlLines.join('\n');
}

/**
 * Generate markdown content for a workflow
 * Following the canonical format defined in workflows/TEMPLATE.md
 * @param {Object} data - Workflow data
 * @returns {string} Markdown content
 */
function generateMarkdown(data) {
  const {
    endpoint,
    domain,
    tags = [],
    swagger = null,
    summary = '',
    prerequisites = '',
    howToResolve = '',
    learnings = [],
    successfulRequest = {},
    uidResolution = null,  // UID resolution mappings
    status = 'verified',   // 'verified', 'pending', 'failed', 'skipped'
    skipReason = null,     // Reason for skipping (if status is 'skipped')
    tokenType = null,      // Token type required for this endpoint
    responseCodes = null,  // Response codes table data
    discrepancies = [],    // Swagger vs actual behavior discrepancies (for Swagger Discrepancies section)
    useFallbackApi = false // Whether this endpoint requires the fallback API URL
    // NOTE: codeAnalysis, swaggerChangesRequired, workflowChangesRequired removed
    // Workflows are test definitions only - not logs of healer process
  } = data;
  
  const now = new Date().toISOString();
  
  // Build frontmatter - following TEMPLATE.md format
  const frontmatterLines = [
    '---',
    `endpoint: "${endpoint}"`,  // Quote the endpoint for consistency
    `domain: ${domain}`,
    `tags: [${tags.join(', ')}]`
  ];
  
  // Add swagger reference if provided
  if (swagger) {
    frontmatterLines.push(`swagger: ${swagger}`);
  }
  
  frontmatterLines.push(`status: ${status}`);
  frontmatterLines.push(`savedAt: ${now}`);
  frontmatterLines.push(`verifiedAt: ${now}`);
  frontmatterLines.push(`timesReused: 0`);
  
  // Add skipReason if present
  if (skipReason) {
    frontmatterLines.push(`skipReason: "${skipReason}"`);
  }
  
  // Add useFallbackApi if this endpoint requires the fallback API URL
  if (useFallbackApi) {
    frontmatterLines.push(`useFallbackApi: true`);
  }
  
  frontmatterLines.push('---');
  const frontmatter = frontmatterLines.join('\n');
  
  // Build title from endpoint
  const [method, ...pathParts] = endpoint.split(' ');
  const pathStr = pathParts.join(' ');
  const resourceName = pathStr.split('/').filter(p => p && !p.startsWith('{')).pop() || 'Resource';
  const actionMap = { GET: 'Get', POST: 'Create', PUT: 'Update', PATCH: 'Update', DELETE: 'Delete' };
  const action = actionMap[method] || method;
  const title = `${action} ${resourceName.charAt(0).toUpperCase() + resourceName.slice(1).replace(/_/g, ' ')}`;
  
  // Build body - following TEMPLATE.md section order
  const body = [
    '',
    `# ${title}`,
    '',
    '## Summary',
    '',
    summary || `${action} operation for ${resourceName}.`
  ];
  
  // Add token type if provided
  if (tokenType) {
    body.push('');
    body.push(`**Token Type**: This endpoint requires a **${tokenType} token**.`);
  }
  body.push('');
  
  // Add Fallback API Notice if this endpoint requires the fallback API URL
  if (useFallbackApi) {
    body.push('> **⚠️ Fallback API Required**');
    body.push('> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.');
    body.push('');
  }
  
  // Add skip reason section if this is a skipped endpoint
  if ((status === 'skip' || status === 'skipped') && skipReason) {
    body.push('## Skip Reason');
    body.push('');
    body.push(`**This endpoint should be SKIPPED in automated testing.**`);
    body.push('');
    body.push(skipReason);
    body.push('');
    body.push('This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).');
    body.push('');
  }
  
  // Add Response Codes section if provided
  if (responseCodes && responseCodes.length > 0) {
    body.push('## Response Codes');
    body.push('');
    body.push('| Status | Meaning |');
    body.push('|--------|---------|');
    responseCodes.forEach(rc => {
      body.push(`| ${rc.status} | ${rc.meaning} |`);
    });
    body.push('');
  }
  
  // Prerequisites section - generate executable YAML if uidResolution is available
  body.push('## Prerequisites');
  body.push('');
  
  // First check if explicit prerequisites were provided
  if (prerequisites) {
    body.push(prerequisites);
  } else if (uidResolution && Object.keys(uidResolution).length > 0) {
    // Auto-generate executable prerequisites from uidResolution
    const executablePrereqs = generateExecutablePrerequisites(uidResolution, tokenType || 'staff');
    if (executablePrereqs) {
      body.push(executablePrereqs);
    } else {
      body.push('None required for this endpoint.');
    }
  } else {
    body.push('None required for this endpoint.');
  }
  body.push('');
  
  // Add UID Resolution section if present - PROCEDURES ONLY, NO VALUES
  if (uidResolution && Object.keys(uidResolution).length > 0) {
    body.push('## UID Resolution Procedure');
    body.push('');
    body.push('How to dynamically obtain required UIDs for this endpoint:');
    body.push('');
    
    // Check if any fields require fresh data creation
    const hasFreshDataCreation = Object.values(uidResolution).some(r => r.create_fresh || r.create_endpoint);
    
    if (hasFreshDataCreation) {
      body.push('⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**');
      body.push('');
    }
    
    body.push('| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |');
    body.push('|-----------|--------------|--------------|--------------|---------|');
    
    // Strip out any hardcoded values, keep only procedures
    const procedureData = {};
    for (const [field, resolution] of Object.entries(uidResolution)) {
      const source = resolution.source_endpoint || '-';
      const extractFrom = resolution.extract_from || 'data[0].uid or data[0].id';
      const createFresh = resolution.create_fresh ? `✓ ${resolution.create_endpoint || 'Yes'}` : '-';
      const cleanup = resolution.cleanup_endpoint || resolution.cleanup_note || '-';
      body.push(`| ${field} | ${source} | ${extractFrom} | ${createFresh} | ${cleanup} |`);
      
      // Store procedure-only data (no resolved_value)
      procedureData[field] = {
        source_endpoint: resolution.source_endpoint || null,
        extract_from: resolution.extract_from || 'first item uid',
        fallback_endpoint: resolution.fallback_endpoint || null,
        create_fresh: resolution.create_fresh || false,
        create_endpoint: resolution.create_endpoint || null,
        create_body: resolution.create_body || null,
        cleanup_endpoint: resolution.cleanup_endpoint || null,
        cleanup_note: resolution.cleanup_note || null
      };
    }
    body.push('');
    
    body.push('### Resolution Steps');
    body.push('');
    for (const [field, resolution] of Object.entries(uidResolution)) {
      body.push(`**${field}**:`);
      
      if (resolution.create_fresh || resolution.create_endpoint) {
        // Fresh data creation workflow
        body.push(`1. **Create fresh test entity**: \`${resolution.create_endpoint}\``);
        if (resolution.create_body) {
          body.push(`   - Body template: \`${JSON.stringify(resolution.create_body)}\``);
        }
        body.push(`2. Extract UID from creation response: \`${resolution.extract_from || 'data.uid'}\``);
        body.push(`3. Run the test with this fresh UID`);
        if (resolution.cleanup_endpoint) {
          body.push(`4. **Cleanup**: \`${resolution.cleanup_endpoint}\``);
        } else if (resolution.cleanup_note) {
          body.push(`4. **Cleanup note**: ${resolution.cleanup_note}`);
        }
      } else {
        // Standard resolution workflow
        if (resolution.source_endpoint) {
          body.push(`1. Call \`${resolution.source_endpoint}\``);
          body.push(`2. Extract from response: \`${resolution.extract_from || 'data[0].uid'}\``);
        }
        if (resolution.fallback_endpoint) {
          body.push(`3. If empty, create via \`${resolution.fallback_endpoint}\``);
        }
      }
      body.push('');
    }
    
    // Store procedure-only JSON (no hardcoded UIDs)
    body.push('```json');
    body.push(JSON.stringify(procedureData, null, 2));
    body.push('```');
    body.push('');
  }
  
  // How to Resolve Parameters - only include if there's content
  if (howToResolve) {
    body.push('## How to Resolve Parameters');
    body.push('');
    body.push(howToResolve);
    body.push('');
  }
  
  // Critical Learnings - only include if there are learnings
  if (learnings.length > 0) {
    body.push('## Critical Learnings');
    body.push('');
    learnings.forEach(l => {
      body.push(`- **${l.title || 'Note'}**: ${l.description || l}`);
    });
    body.push('');
  }
  
  // Test Request section - YAML format per TEMPLATE.md
  body.push('## Test Request');
  body.push('');
  
  // Convert successful request to YAML step format
  const sanitizedRequest = sanitizeRequestForTemplate(successfulRequest);
  body.push('```yaml');
  body.push('steps:');
  body.push(`  - id: main_request`);
  body.push(`    description: "${action} ${resourceName}"`);
  body.push(`    method: ${sanitizedRequest.method || method}`);
  body.push(`    path: "${sanitizedRequest.path || pathStr}"`);
  
  // Add body if present
  if (sanitizedRequest.body && Object.keys(sanitizedRequest.body).length > 0) {
    body.push('    body:');
    for (const [key, value] of Object.entries(sanitizedRequest.body)) {
      if (typeof value === 'object') {
        body.push(`      ${key}: ${JSON.stringify(value)}`);
      } else if (typeof value === 'string') {
        body.push(`      ${key}: "${value}"`);
      } else {
        body.push(`      ${key}: ${value}`);
      }
    }
  }
  
  // Add params if present
  if (sanitizedRequest.params && Object.keys(sanitizedRequest.params).length > 0) {
    body.push('    params:');
    for (const [key, value] of Object.entries(sanitizedRequest.params)) {
      body.push(`      ${key}: "${value}"`);
    }
  }
  
  body.push('    expect:');
  body.push('      status: [200, 201]');
  body.push('```');
  
  // Add Swagger Discrepancies section if present (documentation vs actual behavior)
  if (discrepancies && discrepancies.length > 0) {
    body.push('');
    body.push('## Swagger Discrepancies');
    body.push('');
    body.push('| Aspect | Swagger Says | Actual Behavior | Evidence |');
    body.push('|--------|--------------|-----------------|----------|');
    
    discrepancies.forEach(d => {
      const aspect = d.field ? `${d.aspect || 'Field'}: ${d.field}` : (d.aspect || '-');
      body.push(`| ${aspect} | ${d.swagger_says || '-'} | ${d.code_says || '-'} | ${d.evidence || '-'} |`);
    });
    body.push('');
  }
  
  // NOTE: Documentation issues are NOT stored in workflows
  // Workflows are success paths only - doc issues are reported once and not cached
  
  return frontmatter + body.join('\n');
}

/**
 * Replace hardcoded UIDs with placeholders for workflow templates
 * UIDs from config (business_uid, staff_uid, client_uid, etc.) are kept as config references
 * Other UIDs are replaced with descriptive placeholders
 */
function sanitizeRequestForTemplate(request) {
  if (!request) return request;
  
  // Config params that should reference config
  const configParams = ['business_uid', 'business_id', 'staff_uid', 'staff_id', 'client_uid', 'client_id', 'directory_id', 'matter_uid'];
  
  // Patterns that look like UIDs (not in config)
  const uidPatterns = [
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,  // UUID
    /^[a-z0-9]{16,}$/i,  // Long alphanumeric strings (like vcita UIDs)
  ];
  
  function sanitize(obj, keyPath = '') {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map((item, i) => sanitize(item, `${keyPath}[${i}]`));
    }
    
    if (typeof obj === 'object') {
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = keyPath ? `${keyPath}.${key}` : key;
        
        // Check if this is a UID field
        if (typeof value === 'string' && (key.endsWith('_uid') || key.endsWith('_id') || key === 'uid' || key === 'id')) {
          // Is it a config param?
          if (configParams.includes(key)) {
            result[key] = `{{config.params.${key}}}`;
          } else if (uidPatterns.some(p => p.test(value))) {
            // It's a dynamically resolved UID
            result[key] = `{{resolved.${key}}}`;
          } else {
            result[key] = value;
          }
        } else {
          result[key] = sanitize(value, fullKey);
        }
      }
      return result;
    }
    
    // Check if string value looks like a UID
    if (typeof obj === 'string' && uidPatterns.some(p => p.test(obj))) {
      return '{{resolved.uid}}';
    }
    
    return obj;
  }
  
  // Sanitize the request
  const sanitized = { ...request };
  
  // Sanitize path (replace UUID-like segments)
  if (sanitized.path) {
    sanitized.path = sanitized.path.replace(
      /\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi,
      '/{{resolved.uid}}'
    ).replace(
      /\/([a-z0-9]{16,})(?=\/|$)/gi,
      '/{{resolved.uid}}'
    );
  }
  
  // Sanitize body
  if (sanitized.body) {
    sanitized.body = sanitize(sanitized.body);
  }
  
  return sanitized;
}

/**
 * Save a workflow to the repository
 * @param {string} endpoint - Endpoint like "POST /platform/v1/payment/packages"
 * @param {Object} data - Workflow data
 * @returns {Object} Result with success status
 */
function save(endpoint, data) {
  try {
    const index = loadIndex();
    const domain = data.domain || extractDomain(endpoint);
    const tags = data.tags || extractTags(endpoint);
    
    // Generate filename from endpoint
    const filename = endpointToFilename(endpoint);
    const domainDir = path.join(WORKFLOWS_DIR, domain);
    const filePath = path.join(domainDir, filename);
    const relativeFile = `${domain}/${filename}`;
    
    // Ensure domain directory exists
    if (!fs.existsSync(domainDir)) {
      fs.mkdirSync(domainDir, { recursive: true });
    }
    
    // Generate markdown content
    const markdown = generateMarkdown({
      endpoint,
      domain,
      tags,
      ...data
    });
    
    // Write the file
    fs.writeFileSync(filePath, markdown);
    
    // Update index - include skip status if present
    index.workflows[endpoint] = {
      file: relativeFile,
      domain,
      tags,
      status: data.status || 'verified',  // 'verified', 'skip', etc.
      skipReason: data.skipReason || null,
      timesReused: 0,
      savedAt: new Date().toISOString()
    };
    
    // Update byDomain
    if (!index.byDomain[domain]) {
      index.byDomain[domain] = [];
    }
    if (!index.byDomain[domain].includes(endpoint)) {
      index.byDomain[domain].push(endpoint);
    }
    
    // Update byTag
    tags.forEach(tag => {
      if (!index.byTag[tag]) {
        index.byTag[tag] = [];
      }
      if (!index.byTag[tag].includes(endpoint)) {
        index.byTag[tag].push(endpoint);
      }
    });
    
    saveIndex(index);
    
    return {
      success: true,
      file: relativeFile,
      message: `Workflow saved to ${relativeFile}`
    };
  } catch (e) {
    console.error('Failed to save workflow:', e.message);
    return {
      success: false,
      error: e.message
    };
  }
}

/**
 * Increment the reuse counter for a workflow
 * @param {string} endpoint - Endpoint
 */
function incrementReuse(endpoint) {
  const index = loadIndex();
  if (index.workflows[endpoint]) {
    index.workflows[endpoint].timesReused = (index.workflows[endpoint].timesReused || 0) + 1;
    saveIndex(index);
  }
}

/**
 * Get the full index
 * @returns {Object} Full index
 */
function getIndex() {
  return loadIndex();
}

/**
 * Extract domain from endpoint path
 * @param {string} endpoint - Endpoint like "POST /platform/v1/payment/packages"
 * @returns {string} Domain name
 */
function extractDomain(endpoint) {
  const pathMatch = endpoint.match(/(?:GET|POST|PUT|PATCH|DELETE)\s+\/([^\/]+)/);
  if (pathMatch) {
    const firstSegment = pathMatch[1];
    // Map common prefixes to domains
    const domainMap = {
      'platform': 'sales',
      'business': 'business',
      'client': 'clients',
      'v1': 'general',
      'v2': 'general',
      'v3': 'general'
    };
    return domainMap[firstSegment] || firstSegment;
  }
  return 'general';
}

/**
 * Extract tags from endpoint
 * @param {string} endpoint - Endpoint
 * @returns {string[]} Tags
 */
function extractTags(endpoint) {
  const tags = [];
  const lower = endpoint.toLowerCase();
  
  // Extract resource names from path
  const resourceMatch = lower.match(/\/([a-z_]+)(?:\/|$)/g);
  if (resourceMatch) {
    resourceMatch.forEach(m => {
      const resource = m.replace(/\//g, '').replace(/_/g, '-');
      if (resource && !['v1', 'v2', 'v3', 'platform', 'business', 'client'].includes(resource)) {
        tags.push(resource);
      }
    });
  }
  
  return [...new Set(tags)];
}

/**
 * Convert endpoint to filename
 * @param {string} endpoint - Endpoint like "POST /platform/v1/payment/packages"
 * @returns {string} Filename
 */
function endpointToFilename(endpoint) {
  const [method, ...pathParts] = endpoint.split(' ');
  const pathStr = pathParts.join('_');
  
  // Clean up path for filename
  const cleaned = pathStr
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/[{}]/g, '')
    .replace(/_+/g, '_')
    .toLowerCase();
  
  return `${method.toLowerCase()}_${cleaned}.md`;
}

/**
 * Check if a workflow exists for an endpoint
 * @param {string} endpoint - Endpoint
 * @returns {boolean}
 */
function exists(endpoint) {
  const index = loadIndex();
  return !!index.workflows[endpoint];
}

// NOTE: updateDocFixes removed - workflows no longer store doc issues
// Workflows are success paths only - doc issues are transient findings

/**
 * Update workflow metadata (e.g., add useFallbackApi: true)
 * @param {string} endpoint - Endpoint like "POST /platform/v1/scheduling/bookings"
 * @param {Object} metadataUpdates - Object with metadata fields to add/update
 * @returns {boolean} True if updated successfully
 */
function updateWorkflowMetadata(endpoint, metadataUpdates) {
  const index = loadIndex();
  const entry = index.workflows[endpoint];
  
  if (!entry || !entry.file) {
    console.log(`[Workflow] No workflow file found for ${endpoint}`);
    return false;
  }
  
  const filePath = path.join(WORKFLOWS_DIR, entry.file);
  
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[Workflow] File not found: ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      console.log(`[Workflow] No frontmatter found in ${filePath}`);
      return false;
    }
    
    const frontmatter = frontmatterMatch[1];
    const body = frontmatterMatch[2];
    
    // Check if metadata already has the values we want to add
    let updatedFrontmatter = frontmatter;
    let hasChanges = false;
    
    for (const [key, value] of Object.entries(metadataUpdates)) {
      // Check if key already exists
      const keyRegex = new RegExp(`^${key}:.*$`, 'm');
      if (keyRegex.test(updatedFrontmatter)) {
        // Update existing key
        updatedFrontmatter = updatedFrontmatter.replace(keyRegex, `${key}: ${value}`);
        hasChanges = true;
      } else {
        // Add new key at the end of frontmatter
        updatedFrontmatter = updatedFrontmatter.trimEnd() + `\n${key}: ${value}`;
        hasChanges = true;
      }
    }
    
    if (!hasChanges) {
      console.log(`[Workflow] No changes needed for ${endpoint}`);
      return false;
    }
    
    // Write updated file
    const updatedContent = `---\n${updatedFrontmatter}\n---\n${body}`;
    fs.writeFileSync(filePath, updatedContent, 'utf8');
    
    // Invalidate cache so changes are picked up
    invalidateIndexCache();
    
    console.log(`[Workflow] Updated metadata for ${endpoint}: ${JSON.stringify(metadataUpdates)}`);
    return true;
    
  } catch (error) {
    console.error(`[Workflow] Failed to update ${endpoint}: ${error.message}`);
    return false;
  }
}

/**
 * Get the workflow template content
 * @returns {string|null} Template markdown content or null if not found
 */
function getTemplate() {
  try {
    if (fs.existsSync(TEMPLATE_PATH)) {
      return fs.readFileSync(TEMPLATE_PATH, 'utf8');
    }
  } catch (e) {
    console.error('Failed to read workflow template:', e.message);
  }
  return null;
}

module.exports = {
  get,
  list,
  search,
  save,
  exists,
  getIndex,
  incrementReuse,
  loadIndex,
  invalidateIndexCache,
  parseWorkflowFile,
  generateMarkdown,
  matchesKnownIssue,
  filterKnownIssues,
  updateWorkflowMetadata,
  getTemplate,
  WORKFLOWS_DIR,
  TEMPLATE_PATH
};
