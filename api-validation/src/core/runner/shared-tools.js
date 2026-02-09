/**
 * Shared Tool Infrastructure
 * 
 * Provides reusable constants, client initialization, and tool execution functions
 * shared between ai-agent-healer.js and ai-doc-fixer.js.
 * 
 * The healer continues to use its own internal copies for now (no refactor risk).
 * The doc-fixer imports from here.
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Singleton Clients ───────────────────────────────────────────────────────

let anthropicClient = null;
let openaiClient = null;

function initializeClient(apiKey, provider = 'anthropic') {
  if (!apiKey) return null;

  if (provider === 'openai') {
    if (!openaiClient) {
      openaiClient = new OpenAI({ apiKey, organization: null, project: null });
    }
    return { client: openaiClient, provider: 'openai' };
  }

  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return { client: anthropicClient, provider: 'anthropic' };
}

/**
 * Get AI config for a specific component.
 * Provider is auto-detected from the model name.
 */
function getAIConfig(config, component = 'healer') {
  const modelMap = {
    healer: config.ai?.models?.healer || 'claude-sonnet-4-20250514',
    paramGenerator: config.ai?.models?.paramGenerator || 'gpt-4o-mini',
    resolver: config.ai?.models?.resolver || 'gpt-4.1-nano',
    docFixer: config.ai?.models?.docFixer || 'claude-sonnet-4-20250514'
  };

  const model = modelMap[component] || modelMap.healer;
  const provider = /^(claude|anthropic)/i.test(model) ? 'anthropic' : 'openai';
  const apiKey = provider === 'anthropic'
    ? config.ai?.anthropicApiKey
    : config.ai?.openaiApiKey;

  return { provider, apiKey, model };
}

// ─── Repository Paths ────────────────────────────────────────────────────────

const GITHUB_BASE = process.env.GITHUB_BASE_PATH || '/Users/ram.almog/Documents/GitHub';
const REPO_PATHS = {
  core: process.env.CORE_REPO_PATH || `${GITHUB_BASE}/core`,
  vcita: process.env.VCITA_REPO_PATH || `${GITHUB_BASE}/vcita`,
  apigw: `${GITHUB_BASE}/apigw`,
  subscriptionsmng: `${GITHUB_BASE}/subscriptionsmng`,
  notificationscenter: `${GITHUB_BASE}/notificationscenter`,
  voicecalls: `${GITHUB_BASE}/voicecalls`,
  availability: `${GITHUB_BASE}/availability`,
  resources: `${GITHUB_BASE}/resources`,
  permissionsmanager: `${GITHUB_BASE}/permissionsmanager`,
  aiplatform: `${GITHUB_BASE}/aiplatform`,
  phonenumbersmanager: `${GITHUB_BASE}/phonenumbersmanager`,
  'communication-gw': `${GITHUB_BASE}/communication-gw`,
  frontage: `${GITHUB_BASE}/frontage`,
  'client-portal': `${GITHUB_BASE}/client-portal`
};

// ─── APIGW Routing ───────────────────────────────────────────────────────────

const APIGW_ROUTING = {
  '/v3/license/': 'subscriptionsmng',
  '/business/subscriptionsmng/': 'subscriptionsmng',
  '/v3/communication/voice_calls': 'voicecalls',
  '/v3/communication/voice_call_quotas': 'voicecalls',
  '/v3/communication/voice_call_recordings': 'voicecalls',
  '/v3/communication/voice_call_settings': 'voicecalls',
  '/v3/communication/available_phone_numbers': 'phonenumbersmanager',
  '/v3/communication/business_phone_numbers': 'phonenumbersmanager',
  '/v3/access_control/': 'permissionsmanager',
  '/access_control/': 'permissionsmanager',
  '/v3/ai/': 'aiplatform',
  '/business/notificationscenter/': 'notificationscenter',
  '/client/notificationscenter/': 'notificationscenter',
  '/directory/notificationscenter/': 'notificationscenter',
  '/v3/communication/staff_notifications': 'notificationscenter',
  '/v3/communication/notification_templates': 'notificationscenter',
  '/v3/scheduling/business_availabilities': 'availability',
  '/v3/scheduling/availability_slots': 'availability',
  '/v3/scheduling/resource_types': 'resources',
  '/v3/scheduling/resources': 'resources',
  '/v3/apps/widgets': 'app-widgets-manager',
  '/v3/apps/staff_widgets_boards': 'app-widgets-manager',
  '/business/communication/': 'communication-gw',
  '/platform/v1/': 'core',
  '/business/scheduling/': 'core',
  '/business/staffs/': 'core',
  '/business/clients/': 'core',
  '/v3/staff': 'core',
  '/v3/business_administration': 'core'
};

// ─── Shared Tool Execution Functions ─────────────────────────────────────────

/**
 * Find which microservice handles a given API endpoint
 */
function findServiceForEndpoint(endpointPath) {
  let matchedService = null;
  let matchedPrefix = null;
  let matchLength = 0;

  for (const [prefix, service] of Object.entries(APIGW_ROUTING)) {
    if (endpointPath.startsWith(prefix) && prefix.length > matchLength) {
      matchedService = service;
      matchedPrefix = prefix;
      matchLength = prefix.length;
    }
  }

  const frontendRepo = endpointPath.startsWith('/client/') ? 'client-portal' : 'frontage';
  const frontendRepoExists = REPO_PATHS[frontendRepo] && fs.existsSync(REPO_PATHS[frontendRepo]);

  if (matchedService) {
    const repoExists = REPO_PATHS[matchedService] && fs.existsSync(REPO_PATHS[matchedService]);
    return {
      found: true,
      service: matchedService,
      matched_prefix: matchedPrefix,
      repository: matchedService,
      repository_path: REPO_PATHS[matchedService] || 'Not configured',
      repository_available: repoExists,
      frontend_repo: frontendRepo,
      frontend_repo_available: frontendRepoExists,
      tip: `Search frontend FIRST with repository="${frontendRepo}". Then backend with repository="${matchedService}".`
    };
  }

  return {
    found: false,
    service: 'core',
    repository: 'core',
    frontend_repo: frontendRepo,
    frontend_repo_available: frontendRepoExists,
    note: `No specific routing found for ${endpointPath}. Defaulting to 'core'.`,
    tip: `Search frontend FIRST with repository="${frontendRepo}".`
  };
}

/**
 * Search source code in a repository using ripgrep
 */
function searchSourceCode(repository, searchPattern, fileGlob) {
  const repoPath = REPO_PATHS[repository];

  if (!repoPath || !fs.existsSync(repoPath)) {
    return { error: `Repository ${repository} not found at ${repoPath}` };
  }

  try {
    const escapedPattern = searchPattern.replace(/"/g, '\\"').replace(/'/g, "'\\''");
    let cmd;
    let result;

    try {
      execSync('which rg', { encoding: 'utf8' });
      const globArg = fileGlob ? `--glob "${fileGlob}"` : '';
      cmd = `rg --max-count 30 -n ${globArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
      result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    } catch (_rgError) {
      const includeArg = fileGlob ? `--include="${fileGlob}"` : '--include="*.rb" --include="*.js" --include="*.ts"';
      cmd = `grep -rn ${includeArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
      result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
    }

    if (!result || result.trim() === '') {
      return { results: 'No matches found', searched_in: repoPath };
    }
    return { results: result };
  } catch (_e) {
    return { results: 'No matches found', searched_in: repoPath };
  }
}

/**
 * Read a source file from a repository
 */
function readSourceFile(repository, filePath, startLine, endLine) {
  const repoPath = REPO_PATHS[repository];
  const fullPath = path.join(repoPath, filePath);

  if (!fs.existsSync(fullPath)) {
    return { error: `File not found: ${filePath}` };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    if (startLine && endLine) {
      const slice = lines.slice(startLine - 1, endLine);
      return {
        file: filePath,
        lines: `${startLine}-${endLine}`,
        content: slice.map((line, i) => `${startLine + i}| ${line}`).join('\n')
      };
    }

    if (lines.length > 150) {
      return {
        file: filePath,
        total_lines: lines.length,
        content: lines.slice(0, 150).map((line, i) => `${i + 1}| ${line}`).join('\n'),
        note: `File has ${lines.length} lines. Showing first 150. Use start_line/end_line for specific sections.`
      };
    }

    return {
      file: filePath,
      content: lines.map((line, i) => `${i + 1}| ${line}`).join('\n')
    };
  } catch (e) {
    return { error: `Error reading file: ${e.message}` };
  }
}

/**
 * Execute an API call against the live API
 */
async function executeApiCall({ method, apiPath, params, body, tokenType = 'staff', onBehalfOf, useFallback = false, contentType = 'json', formFields, fileFields }, config, apiClient) {
  const primaryUrl = config.baseUrl;
  const fallbackUrl = config.fallbackUrl;
  const baseUrl = useFallback && fallbackUrl ? fallbackUrl : primaryUrl;

  // Build query string
  let queryString = '';
  if (params && typeof params === 'object' && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    queryString = '?' + searchParams.toString();
  }

  const fullPath = apiPath + queryString;

  try {
    const token = config.tokens?.[tokenType] || config.tokens?.staff;
    const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';

    const headers = { 'Authorization': `${authPrefix} ${token}` };

    if (onBehalfOf) {
      headers['X-On-Behalf-Of'] = onBehalfOf;
    }

    let requestData = body;
    const isMultipart = contentType === 'multipart';

    if (isMultipart) {
      const FormData = require('form-data');
      const formData = new FormData();

      if (formFields && typeof formFields === 'object') {
        for (const [key, value] of Object.entries(formFields)) {
          formData.append(key, String(value));
        }
      }

      if (fileFields && Array.isArray(fileFields)) {
        for (const file of fileFields) {
          const absolutePath = path.resolve(__dirname, '../../../test-files', file.file_path);
          if (fs.existsSync(absolutePath)) {
            formData.append(file.field_name, fs.createReadStream(absolutePath), file.filename || path.basename(file.file_path));
          }
        }
      }

      requestData = formData;
      Object.assign(headers, formData.getHeaders());
    } else {
      headers['Content-Type'] = 'application/json';
    }

    const requestConfig = {
      method: method.toLowerCase(),
      url: useFallback ? `${baseUrl}${fullPath}` : fullPath,
      data: requestData,
      headers
    };

    if (isMultipart) {
      requestConfig.maxContentLength = Infinity;
      requestConfig.maxBodyLength = Infinity;
    }

    const response = useFallback
      ? await require('axios').request(requestConfig)
      : await (apiClient || require('axios')).request({ ...requestConfig, url: `${baseUrl}${fullPath}` });

    return {
      success: true,
      status: response.status,
      data: response.data,
      usedFallback: useFallback,
      requestConfig: {
        method: method.toUpperCase(),
        url: `${baseUrl}${fullPath}`,
        headers: { ...headers, 'Content-Type': isMultipart ? 'multipart/form-data' : 'application/json' },
        data: isMultipart ? { formFields, fileFields, note: 'Multipart form-data request' } : body
      }
    };
  } catch (error) {
    const status = error.response?.status;
    const is404OrRouting = status === 404 || status === 502 || status === 503;
    const fallbackAvailable = !useFallback && fallbackUrl;

    let hint = 'If the error is unclear, use search_source_code to explore the backend.';
    if (status === 404 && fallbackAvailable) {
      hint = `Got 404. Try use_fallback=true to use fallback API URL (${fallbackUrl}).`;
    } else if (is404OrRouting && fallbackAvailable) {
      hint = `Got ${status}. Try again with use_fallback=true.`;
    }

    return {
      success: false,
      status,
      error: error.response?.data || error.message,
      usedFallback: useFallback,
      hint
    };
  }
}

module.exports = {
  initializeClient,
  getAIConfig,
  REPO_PATHS,
  APIGW_ROUTING,
  GITHUB_BASE,
  findServiceForEndpoint,
  searchSourceCode,
  readSourceFile,
  executeApiCall
};
