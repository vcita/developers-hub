/**
 * Workflow Repository
 * 
 * A searchable, LLM-friendly repository for API workflows.
 * Designed to be reusable across agentic frameworks.
 */

const fs = require('fs');
const path = require('path');

// Repository paths
const WORKFLOWS_DIR = path.join(__dirname, '../../../workflows');
const INDEX_PATH = path.join(WORKFLOWS_DIR, 'index.json');

/**
 * Load the workflow index
 * @returns {Object} Index object
 */
function loadIndex() {
  try {
    if (fs.existsSync(INDEX_PATH)) {
      return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load workflow index:', e.message);
  }
  return {
    version: '1.0',
    lastUpdated: null,
    workflows: {},
    byDomain: {},
    byTag: {}
  };
}

/**
 * Save the workflow index
 * @param {Object} index - Index object to save
 */
function saveIndex(index) {
  try {
    index.lastUpdated = new Date().toISOString();
    fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
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
    
    return {
      metadata,
      sections,
      successfulRequest,
      uidResolution,
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
  
  return {
    endpoint,
    file: entry.file,
    domain: entry.domain,
    tags: entry.tags,
    status: entry.status,
    skipReason: entry.skipReason || parsed.metadata?.skipReason || null,  // Include skip reason
    knownIssues: parsed.metadata?.knownIssues || [],  // Include known issues to suppress in validation
    timesReused: entry.timesReused || 0,
    uidResolution: parsed.uidResolution || null,  // Include UID resolution mappings
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
 * Generate markdown content for a workflow
 * @param {Object} data - Workflow data
 * @returns {string} Markdown content
 */
function generateMarkdown(data) {
  const {
    endpoint,
    domain,
    tags = [],
    summary = '',
    prerequisites = '',
    howToResolve = '',
    learnings = [],
    successfulRequest = {},
    uidResolution = null,  // UID resolution mappings
    status = 'verified',   // 'verified' or 'skip'
    skipReason = null      // Reason for skipping (if status is 'skip')
    // NOTE: docFixes intentionally NOT stored in workflows
    // Workflows are success paths only - doc issues are transient findings
  } = data;
  
  const now = new Date().toISOString();
  
  // Build frontmatter
  const frontmatterLines = [
    '---',
    `endpoint: ${endpoint}`,
    `domain: ${domain}`,
    `tags: [${tags.join(', ')}]`,
    `status: ${status}`,
    `savedAt: ${now}`,
    `verifiedAt: ${now}`,
    `timesReused: 0`
  ];
  
  // Add skipReason if present
  if (skipReason) {
    frontmatterLines.push(`skipReason: ${skipReason}`);
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
  
  // Build body
  const body = [
    '',
    `# ${title}`,
    '',
    '## Summary',
    summary || `${action} operation for ${resourceName}`,
    ''
  ];
  
  // Add skip reason section if this is a skipped endpoint
  if (status === 'skip' && skipReason) {
    body.push('## ⚠️ Skip Reason');
    body.push('');
    body.push(`**This endpoint should be SKIPPED in automated testing.**`);
    body.push('');
    body.push(skipReason);
    body.push('');
    body.push('This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).');
    body.push('');
  }
  
  body.push('## Prerequisites');
  body.push(prerequisites || 'No specific prerequisites documented.');
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
  
  body.push('## How to Resolve Parameters');
  body.push(howToResolve || 'Parameters were resolved automatically.');
  body.push('');
  body.push('## Critical Learnings');
  body.push('');
  
  if (learnings.length > 0) {
    learnings.forEach(l => {
      body.push(`- **${l.title || 'Note'}** - ${l.description || l}`);
    });
  } else {
    body.push('No specific learnings documented.');
  }
  
  body.push('');
  body.push('## Request Template');
  body.push('');
  body.push('Use this template with dynamically resolved UIDs:');
  body.push('');
  
  // Sanitize the successful request to replace hardcoded UIDs with placeholders
  const sanitizedRequest = sanitizeRequestForTemplate(successfulRequest);
  body.push('```json');
  body.push(JSON.stringify(sanitizedRequest, null, 2));
  body.push('```');
  
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

module.exports = {
  get,
  list,
  search,
  save,
  exists,
  getIndex,
  incrementReuse,
  loadIndex,
  parseWorkflowFile,
  generateMarkdown,
  matchesKnownIssue,
  filterKnownIssues,
  WORKFLOWS_DIR
};
