/**
 * AI-Assisted Endpoint Resolver
 * Uses AI to intelligently find list endpoints for detail endpoints
 * 
 * Model: gpt-4.1-nano (OpenAI) — trivial pattern-matching task, cheapest model suffices
 * Excellent alternatives: gpt-4o-mini (OpenAI)
 */

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Default model for this component
const DEFAULT_MODEL = 'gpt-4.1-nano';

// Path to learned mappings file
const LEARNED_MAPPINGS_FILE = path.join(__dirname, '../../config/learned-mappings.json');

// In-memory cache for current session
let sessionCache = {};

/**
 * Load learned mappings from file
 * @returns {Object} Learned mappings { detailPath: listPath }
 */
function loadLearnedMappings() {
  try {
    if (fs.existsSync(LEARNED_MAPPINGS_FILE)) {
      const data = fs.readFileSync(LEARNED_MAPPINGS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('[AI Resolver] Error loading learned mappings:', err.message);
  }
  return {};
}

/**
 * Save learned mappings to file
 * @param {Object} mappings - Mappings to save
 */
function saveLearnedMappings(mappings) {
  try {
    const dir = path.dirname(LEARNED_MAPPINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LEARNED_MAPPINGS_FILE, JSON.stringify(mappings, null, 2));
    console.log('[AI Resolver] Saved learned mappings to file');
  } catch (err) {
    console.error('[AI Resolver] Error saving learned mappings:', err.message);
  }
}

/**
 * Add a successful mapping
 * @param {string} detailPath - Detail endpoint path (e.g., /business/payments/v1/estimates/{estimate_uid})
 * @param {string} listPath - List endpoint path
 */
function addLearnedMapping(detailPath, listPath) {
  const mappings = loadLearnedMappings();
  
  // Store by the base path (without trailing param)
  const basePath = detailPath.replace(/\/\{[^}]+\}$/, '');
  mappings[basePath] = {
    listEndpoint: listPath,
    learnedAt: new Date().toISOString(),
    source: 'ai'
  };
  
  saveLearnedMappings(mappings);
  sessionCache[basePath] = listPath;
  
  console.log(`[AI Resolver] ✓ Learned: ${basePath} → ${listPath}`);
}

/**
 * Remove a failed mapping
 * @param {string} detailPath - Detail endpoint path
 */
function removeLearnedMapping(detailPath) {
  const mappings = loadLearnedMappings();
  const basePath = detailPath.replace(/\/\{[^}]+\}$/, '');
  
  if (mappings[basePath]) {
    delete mappings[basePath];
    saveLearnedMappings(mappings);
    delete sessionCache[basePath];
    console.log(`[AI Resolver] ✗ Removed failed mapping: ${basePath}`);
  }
}

/**
 * Get a learned mapping if available
 * @param {string} detailPath - Detail endpoint path
 * @returns {string|null} List endpoint or null
 */
function getLearnedMapping(detailPath) {
  const basePath = detailPath.replace(/\/\{[^}]+\}$/, '');
  
  // Check session cache first
  if (sessionCache[basePath]) {
    return sessionCache[basePath];
  }
  
  // Check persisted mappings
  const mappings = loadLearnedMappings();
  if (mappings[basePath]) {
    sessionCache[basePath] = mappings[basePath].listEndpoint;
    return mappings[basePath].listEndpoint;
  }
  
  return null;
}

/**
 * Extract available list endpoints from swagger endpoints
 * @param {Object[]} endpoints - All swagger endpoints
 * @returns {string[]} List of GET endpoints without trailing params
 */
function extractListEndpoints(endpoints) {
  return endpoints
    .filter(ep => {
      // GET methods only
      if (ep.method !== 'GET') return false;
      // Exclude endpoints with trailing {param}
      if (/\/\{[^}]+\}$/.test(ep.path)) return false;
      return true;
    })
    .map(ep => ep.path)
    .sort();
}

/**
 * Build prompt for AI
 * @param {string} detailPath - Detail endpoint path
 * @param {string} paramName - Parameter name (e.g., estimate_uid)
 * @param {string[]} availableEndpoints - List of available GET list endpoints
 * @returns {string} Prompt
 */
function buildPrompt(detailPath, paramName, availableEndpoints) {
  return `You are helping identify API endpoint relationships.

Given this detail endpoint that requires a specific ID:
  ${detailPath}

The endpoint needs a value for parameter: ${paramName}

Here are available GET list endpoints in this API that might return items with this ID:
${availableEndpoints.map(ep => `  - ${ep}`).join('\n')}

Which endpoint would return a list containing items with a '${paramName}' or 'uid' or 'id' field that could be used for the detail endpoint?

Rules:
- Look for endpoints that seem to manage the same resource type
- The list endpoint might be at a different path prefix (e.g., /platform/v1 vs /business/payments/v1)
- Consider the resource name in the path (e.g., "estimates" should match "estimates")

Respond with ONLY the endpoint path (e.g., /platform/v1/estimates), or "NONE" if no suitable endpoint exists.`;
}

/**
 * Ask AI to find the list endpoint for a detail endpoint
 * @param {string} detailPath - Detail endpoint path
 * @param {string} paramName - Parameter name
 * @param {Object[]} allEndpoints - All swagger endpoints
 * @param {string} apiKey - OpenAI API key
 * @param {string} [model] - Model override (defaults to gpt-4.1-nano)
 * @returns {Promise<string|null>} Suggested list endpoint or null
 */
async function askAIForListEndpoint(detailPath, paramName, allEndpoints, apiKey, model) {
  if (!apiKey) {
    console.log('[AI Resolver] No API key configured, skipping AI resolution');
    return null;
  }
  
  // Check learned mappings first
  const learned = getLearnedMapping(detailPath);
  if (learned) {
    console.log(`[AI Resolver] Using learned mapping: ${detailPath} → ${learned}`);
    return learned;
  }
  
  // Check session cache
  const basePath = detailPath.replace(/\/\{[^}]+\}$/, '');
  if (sessionCache[basePath] === 'NONE') {
    console.log(`[AI Resolver] Skipping (previously returned NONE): ${detailPath}`);
    return null;
  }
  
  const resolverModel = model || DEFAULT_MODEL;
  
  try {
    const client = new OpenAI({ apiKey });
    
    const availableEndpoints = extractListEndpoints(allEndpoints);
    const prompt = buildPrompt(detailPath, paramName, availableEndpoints);
    
    console.log(`[AI Resolver] Asking AI (${resolverModel}) for list endpoint for: ${detailPath}`);
    
    const completion = await client.chat.completions.create({
      model: resolverModel,
      max_tokens: 100,
      messages: [
        { role: 'user', content: prompt }
      ]
    });
    
    const response = completion.choices[0]?.message?.content?.trim();
    console.log(`[AI Resolver] AI response: ${response}`);
    
    if (!response || response === 'NONE' || response.toUpperCase() === 'NONE') {
      sessionCache[basePath] = 'NONE';
      return null;
    }
    
    // Validate the response is a valid endpoint
    const isValidEndpoint = availableEndpoints.includes(response);
    if (!isValidEndpoint) {
      console.log(`[AI Resolver] AI suggested invalid endpoint: ${response}`);
      return null;
    }
    
    return response;
    
  } catch (err) {
    console.error('[AI Resolver] Error calling AI:', err.message);
    return null;
  }
}

module.exports = {
  askAIForListEndpoint,
  addLearnedMapping,
  removeLearnedMapping,
  getLearnedMapping,
  loadLearnedMappings,
  extractListEndpoints
};
