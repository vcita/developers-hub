/**
 * Main Application
 * Initializes the dashboard and coordinates modules
 */

// Application state
const AppState = {
  endpoints: [],
  allEndpoints: [],       // Full endpoint list (for mode switching)
  fallbackEndpoints: [],  // Endpoints with useFallbackApi (for base URL scan mode)
  noTokenInfoEndpoints: [], // Endpoints with no token documentation (for token doc fix mode)
  domains: [],
  selectedEndpoints: new Set(),
  expandedDomains: new Set(), // Track which domain groups are expanded
  validationMode: 'full', // 'full', 'base-url-scan', or 'token-doc-fix'
  filters: {
    domain: '',
    method: '',
    tokenType: '',
    workflowStatus: [],
    search: ''
  },
  rateLimit: {
    preset: 'normal',
    concurrent: 3,
    retryOn429: true
  },
  aiOptions: {
    autoFixSwagger: false
  },
  config: null
};

/**
 * Initialize the application
 */
async function initApp() {
  try {
    // Load configuration
    await loadConfig();
    
    // Load endpoints
    await loadEndpoints();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initial render
    renderEndpoints();
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    showError('Failed to load application. Check console for details.');
  }
}

/**
 * Load configuration from server
 */
async function loadConfig() {
  const response = await fetch('/api/config');
  const data = await response.json();
  
  AppState.config = data.config;
  
  // Update UI
  const envEl = document.getElementById('environment');
  if (envEl && data.config) {
    envEl.textContent = `Environment: ${data.config.baseUrl}`;
  }
  
  // Show warnings if config invalid
  if (!data.valid) {
    showWarning('Configuration issues: ' + data.errors.join(', '));
  }
}

/**
 * Load endpoints from server
 */
async function loadEndpoints() {
  const response = await fetch('/api/endpoints?grouped=true');
  const data = await response.json();
  
  // Flatten endpoints for easier access
  AppState.endpoints = [];
  AppState.allEndpoints = [];
  AppState.domains = [];
  
  for (const domain of data.domains) {
    AppState.domains.push(domain.domain);
    
    for (const resource of domain.resources) {
      for (const endpoint of resource.endpoints) {
        AppState.allEndpoints.push(endpoint);
      }
    }
  }
  
  // Set active endpoints based on mode
  AppState.endpoints = AppState.allEndpoints;
  
  // Update domain filter
  const domainFilter = document.getElementById('domain-filter');
  if (domainFilter) {
    // Clear existing options (except first "All")
    while (domainFilter.options.length > 1) {
      domainFilter.remove(1);
    }
    for (const domain of AppState.domains) {
      const option = document.createElement('option');
      option.value = domain;
      option.textContent = domain.charAt(0).toUpperCase() + domain.slice(1);
      domainFilter.appendChild(option);
    }
  }
  
  // Update count
  const countEl = document.getElementById('endpoint-count');
  if (countEl) {
    countEl.textContent = `Endpoints: ${AppState.endpoints.length}`;
  }
}

/**
 * Load fallback-only endpoints for Base URL Scan mode
 */
async function loadFallbackEndpoints() {
  const response = await fetch('/api/endpoints?grouped=true&fallbackOnly=true');
  const data = await response.json();
  
  AppState.fallbackEndpoints = [];
  
  for (const domain of data.domains) {
    for (const resource of domain.resources) {
      for (const endpoint of resource.endpoints) {
        AppState.fallbackEndpoints.push(endpoint);
      }
    }
  }
  
  return AppState.fallbackEndpoints;
}

/**
 * Load endpoints with no token documentation for Token Doc Fix mode
 */
function loadNoTokenInfoEndpoints() {
  AppState.noTokenInfoEndpoints = AppState.allEndpoints.filter(e => !e.tokenInfo.found);
  return AppState.noTokenInfoEndpoints;
}

/**
 * Set the validation mode (full, base-url-scan, or token-doc-fix)
 * @param {string} mode - 'full', 'base-url-scan', or 'token-doc-fix'
 */
async function setValidationMode(mode) {
  AppState.validationMode = mode;
  AppState.selectedEndpoints.clear();
  
  // Update toggle button states
  document.getElementById('mode-full')?.classList.toggle('active', mode === 'full');
  document.getElementById('mode-base-url')?.classList.toggle('active', mode === 'base-url-scan');
  document.getElementById('mode-token-fix')?.classList.toggle('active', mode === 'token-doc-fix');
  
  // Update mode description
  const modeDescriptions = {
    'full': 'Run full API validation with schema checks and AI healing.',
    'base-url-scan': 'Quick scan to check if fallback URLs are still needed for endpoints.',
    'token-doc-fix': 'Fix missing token documentation: search code, test endpoints, update swagger files.'
  };
  const descEl = document.getElementById('mode-description');
  if (descEl) {
    descEl.textContent = modeDescriptions[mode] || '';
  }
  
  // Update run button text
  const runBtnLabels = {
    'full': 'Run Selected',
    'base-url-scan': 'Run Base URL Scan',
    'token-doc-fix': 'Run Token Doc Fix'
  };
  const runBtn = document.getElementById('run-btn');
  if (runBtn) {
    runBtn.textContent = runBtnLabels[mode] || 'Run Selected';
  }
  
  // Show/hide full validation options
  const fullOptions = document.getElementById('full-validation-options');
  if (fullOptions) {
    fullOptions.classList.toggle('hidden', mode !== 'full');
  }
  
  // Hide all results sections
  document.getElementById('results-section')?.classList.add('hidden');
  document.getElementById('scan-results-section')?.classList.add('hidden');
  document.getElementById('token-fix-results-section')?.classList.add('hidden');
  document.getElementById('progress-section')?.classList.add('hidden');
  
  // Switch endpoint source
  if (mode === 'base-url-scan') {
    await loadFallbackEndpoints();
    AppState.endpoints = AppState.fallbackEndpoints;
  } else if (mode === 'token-doc-fix') {
    loadNoTokenInfoEndpoints();
    AppState.endpoints = AppState.noTokenInfoEndpoints;
  } else {
    AppState.endpoints = AppState.allEndpoints;
  }
  
  // Update count
  const countEl = document.getElementById('endpoint-count');
  if (countEl) {
    countEl.textContent = `Endpoints: ${AppState.endpoints.length}`;
  }
  
  // Re-render
  renderEndpoints();
  updateSelectedCount();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Filter changes
  document.getElementById('domain-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('method-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('token-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('search-filter')?.addEventListener('input', debounce(onFilterChange, 300));

  const statusToggle = document.getElementById('status-filter-toggle');
  const statusMenu = document.getElementById('status-filter-menu');
  if (statusToggle && statusMenu) {
    statusToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleStatusMenu();
    });
    statusMenu.addEventListener('click', (event) => event.stopPropagation());
    statusMenu.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', onFilterChange);
    });
    document.addEventListener('click', closeStatusMenu);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeStatusMenu();
    });
    updateStatusFilterLabel();
  }
  
  // Rate limit changes
  document.getElementById('rate-preset')?.addEventListener('change', onRateLimitChange);
  document.getElementById('concurrent')?.addEventListener('change', onRateLimitChange);
  document.getElementById('retry-429')?.addEventListener('change', onRateLimitChange);
  
  // AI options changes
  document.getElementById('auto-fix-swagger')?.addEventListener('change', onAiOptionsChange);
  
  // Action buttons
  document.getElementById('select-all-btn')?.addEventListener('click', selectAll);
  document.getElementById('deselect-all-btn')?.addEventListener('click', deselectAll);
  document.getElementById('run-btn')?.addEventListener('click', runTests);
  document.getElementById('stop-btn')?.addEventListener('click', stopTests);
  
  // Initialize report modal
  ResultsViewer.initReportModal();
}

/**
 * Handle filter changes
 */
function onFilterChange() {
  AppState.filters.domain = document.getElementById('domain-filter')?.value || '';
  AppState.filters.method = document.getElementById('method-filter')?.value || '';
  AppState.filters.tokenType = document.getElementById('token-filter')?.value || '';
  AppState.filters.workflowStatus = getSelectedStatusValues();
  AppState.filters.search = document.getElementById('search-filter')?.value || '';
  
  updateStatusFilterLabel();
  renderEndpoints();
}

function getSelectedStatusValues() {
  const checkboxes = document.querySelectorAll('#status-filter-menu input[type="checkbox"]:checked');
  return Array.from(checkboxes).map((checkbox) => checkbox.value).filter(Boolean);
}

function toggleStatusMenu() {
  const menu = document.getElementById('status-filter-menu');
  const toggle = document.getElementById('status-filter-toggle');
  if (!menu || !toggle) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    toggle.setAttribute('aria-expanded', 'true');
  } else {
    closeStatusMenu();
  }
}

function closeStatusMenu() {
  const menu = document.getElementById('status-filter-menu');
  const toggle = document.getElementById('status-filter-toggle');
  if (!menu || !toggle) return;
  if (!menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
    toggle.setAttribute('aria-expanded', 'false');
  }
}

function updateStatusFilterLabel() {
  const toggle = document.getElementById('status-filter-toggle');
  const checked = document.querySelectorAll('#status-filter-menu input[type="checkbox"]:checked');
  if (!toggle) return;
  if (checked.length === 0) {
    toggle.textContent = 'All';
    return;
  }
  if (checked.length === 1) {
    const label = checked[0].parentElement?.textContent?.trim();
    toggle.textContent = label || '1 selected';
    return;
  }
  toggle.textContent = `${checked.length} selected`;
}

/**
 * Handle rate limit changes
 */
function onRateLimitChange() {
  AppState.rateLimit.preset = document.getElementById('rate-preset')?.value || 'normal';
  AppState.rateLimit.concurrent = parseInt(document.getElementById('concurrent')?.value || '3', 10);
  AppState.rateLimit.retryOn429 = document.getElementById('retry-429')?.checked ?? true;
}

/**
 * Handle AI options changes
 */
function onAiOptionsChange() {
  AppState.aiOptions.autoFixSwagger = document.getElementById('auto-fix-swagger')?.checked ?? false;
}

/**
 * Select all visible endpoints
 */
function selectAll() {
  const filtered = getFilteredEndpoints();
  for (const endpoint of filtered) {
    AppState.selectedEndpoints.add(endpoint.id);
  }
  renderEndpoints();
  updateSelectedCount();
}

/**
 * Deselect all endpoints
 */
function deselectAll() {
  AppState.selectedEndpoints.clear();
  renderEndpoints();
  updateSelectedCount();
}

/**
 * Update selected count display
 */
function updateSelectedCount() {
  const countEl = document.getElementById('selected-count');
  const runBtn = document.getElementById('run-btn');
  const count = AppState.selectedEndpoints.size;
  
  if (countEl) {
    countEl.textContent = `(${count} selected)`;
  }
  
  if (runBtn) {
    runBtn.disabled = count === 0;
  }
}

/**
 * Get filtered endpoints based on current filters
 */
function getFilteredEndpoints() {
  return AppState.endpoints.filter(endpoint => {
    if (AppState.filters.domain && endpoint.domain !== AppState.filters.domain) {
      return false;
    }
    if (AppState.filters.method && endpoint.method !== AppState.filters.method) {
      return false;
    }
    if (AppState.filters.tokenType && !endpoint.tokenInfo.tokens.includes(AppState.filters.tokenType)) {
      return false;
    }
    const selectedStatuses = AppState.filters.workflowStatus || [];
    if (selectedStatuses.length > 0) {
      const endpointStatus = normalizeStatus(endpoint.workflowStatus || 'none');
      if (!selectedStatuses.includes(endpointStatus)) return false;
    }
    if (AppState.filters.search) {
      const search = AppState.filters.search.toLowerCase();
      const matches = 
        endpoint.path.toLowerCase().includes(search) ||
        endpoint.summary.toLowerCase().includes(search) ||
        endpoint.tags.some(t => t.toLowerCase().includes(search));
      if (!matches) return false;
    }
    return true;
  });
}

/**
 * Toggle endpoint selection
 */
function toggleEndpoint(endpointId) {
  if (AppState.selectedEndpoints.has(endpointId)) {
    AppState.selectedEndpoints.delete(endpointId);
  } else {
    AppState.selectedEndpoints.add(endpointId);
  }
  updateSelectedCount();
}

/**
 * Run setup to create fresh test business and validate tokens
 */
async function runSetup() {
  const btn = document.getElementById('run-setup-btn');
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Running Setup...';
    }
    
    console.log('Running setup...');
    
    const response = await fetch('/api/validate/setup', { method: 'POST' });
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Setup failed');
    }
    
    // Reload config to pick up new tokens
    await loadConfig();
    
    if (btn) {
      btn.innerHTML = '✅ Setup Complete!';
      setTimeout(() => {
        btn.innerHTML = '⚙️ Run Setup';
        btn.disabled = false;
      }, 3000);
    }
    
    console.log('Setup complete. New business:', data.businessId);
    console.log('Setup output:', data.output);
    
    // Update token status display
    const tokenStatus = document.getElementById('token-status');
    if (tokenStatus) {
      tokenStatus.textContent = `Tokens: ✓ New business ready`;
      tokenStatus.className = 'badge badge-success';
    }
    
    return data;
    
  } catch (error) {
    console.error('Setup failed:', error);
    
    if (btn) {
      btn.innerHTML = '❌ Setup Failed';
      setTimeout(() => {
        btn.innerHTML = '⚙️ Run Setup';
        btn.disabled = false;
      }, 3000);
    }
    
    alert('Setup failed: ' + error.message);
    throw error;
  }
}

/**
 * Run tests for selected endpoints
 */
async function runTests() {
  // Dispatch to base URL scan mode if active
  if (AppState.validationMode === 'base-url-scan') {
    return runBaseUrlScan();
  }
  
  // Dispatch to token doc fix mode if active
  if (AppState.validationMode === 'token-doc-fix') {
    return runTokenDocFix();
  }

  // Check if setup should run first
  const runSetupFirst = document.getElementById('run-setup-before')?.checked;
  
  if (runSetupFirst) {
    console.log('Running setup before tests...');
    try {
      await runSetup();
    } catch (error) {
      alert('Setup failed. Aborting tests.');
      return;
    }
  }
  
  console.log('runTests called, selected:', AppState.selectedEndpoints.size);
  console.log('All endpoints:', AppState.endpoints.length);
  
  const selectedEndpoints = AppState.endpoints.filter(e => 
    AppState.selectedEndpoints.has(e.id)
  );
  
  console.log('Matched endpoints:', selectedEndpoints.length);
  
  if (selectedEndpoints.length === 0) {
    // Debug: show what IDs we have
    console.log('Selected IDs:', Array.from(AppState.selectedEndpoints));
    console.log('Available IDs:', AppState.endpoints.slice(0, 5).map(e => e.id));
    showWarning('No endpoints selected');
    alert('No endpoints matched. Check console for debug info.');
    return;
  }
  
  // Show progress section and scroll to it
  const progressSection = document.getElementById('progress-section');
  const resultsSection = document.getElementById('results-section');
  
  progressSection?.classList.remove('hidden');
  resultsSection?.classList.add('hidden');
  document.getElementById('scan-results-section')?.classList.add('hidden');
  
  // Smooth scroll to progress section
  progressSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    // Start test runner (scrolls to results on completion via SSE callback)
    await TestRunner.run(selectedEndpoints, {
      rateLimitPreset: AppState.rateLimit.preset,
      rateLimit: {
        maxConcurrent: AppState.rateLimit.concurrent,
        retryOn429: AppState.rateLimit.retryOn429
      },
      aiOptions: {
        autoFixSwagger: AppState.aiOptions.autoFixSwagger
      }
    });
  } catch (error) {
    console.error('Test runner error:', error);
    alert('Error running tests: ' + error.message);
  }
}

/**
 * Run base URL scan for selected fallback endpoints
 */
async function runBaseUrlScan() {
  const selectedEndpoints = AppState.endpoints.filter(e =>
    AppState.selectedEndpoints.has(e.id)
  );

  if (selectedEndpoints.length === 0) {
    showWarning('No endpoints selected');
    alert('No endpoints selected for base URL scan.');
    return;
  }

  // Show progress, hide results
  const progressSection = document.getElementById('progress-section');
  progressSection?.classList.remove('hidden');
  document.getElementById('results-section')?.classList.add('hidden');
  document.getElementById('scan-results-section')?.classList.add('hidden');
  progressSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    await TestRunner.runBaseUrlScan(selectedEndpoints, {
      rateLimitPreset: AppState.rateLimit.preset,
      rateLimit: {
        maxConcurrent: AppState.rateLimit.concurrent,
        retryOn429: AppState.rateLimit.retryOn429
      }
    });
  } catch (error) {
    console.error('Base URL scan error:', error);
    alert('Error running scan: ' + error.message);
  }
}

/**
 * Run token doc fix for selected endpoints with no token info
 */
async function runTokenDocFix() {
  const selectedEndpoints = AppState.endpoints.filter(e =>
    AppState.selectedEndpoints.has(e.id)
  );

  if (selectedEndpoints.length === 0) {
    showWarning('No endpoints selected');
    alert('No endpoints selected for token doc fix.');
    return;
  }

  const progressSection = document.getElementById('progress-section');
  progressSection?.classList.remove('hidden');
  document.getElementById('results-section')?.classList.add('hidden');
  document.getElementById('scan-results-section')?.classList.add('hidden');
  document.getElementById('token-fix-results-section')?.classList.add('hidden');
  progressSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  try {
    await TestRunner.runTokenDocFix(selectedEndpoints, {
      rateLimitPreset: AppState.rateLimit.preset,
      rateLimit: {
        maxConcurrent: AppState.rateLimit.concurrent,
        retryOn429: AppState.rateLimit.retryOn429
      }
    });
  } catch (error) {
    console.error('Token doc fix error:', error);
    alert('Error running token doc fix: ' + error.message);
  }
}

/**
 * Stop running tests
 */
async function stopTests() {
  console.log('stopTests called');
  await TestRunner.stop();
}

/**
 * Show warning message
 */
function showWarning(message) {
  console.warn(message);
  // Could add toast notification here
}

/**
 * Show error message
 */
function showError(message) {
  console.error(message);
  const listEl = document.getElementById('endpoints-list');
  if (listEl) {
    listEl.innerHTML = `<div class="error">${message}</div>`;
  }
}

/**
 * Debounce helper
 */
function debounce(fn, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Reload swagger files from the server
 * Use this after updating documentation to pick up changes without restarting
 */
async function reloadSwaggers() {
  const btn = document.getElementById('reload-swaggers-btn');
  const countEl = document.getElementById('endpoint-count');
  
  try {
    // Show loading state
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Reloading...';
    }
    
    // Call reload endpoint
    const response = await fetch('/api/reload', { method: 'POST' });
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to reload swaggers');
    }
    
    // Reload endpoints in the app
    await loadEndpoints();
    
    // Re-render with current filters
    renderEndpoints();
    
    // Show success message
    if (btn) {
      btn.innerHTML = '✅ Reloaded!';
      setTimeout(() => {
        btn.innerHTML = '🔄 Reload Docs';
        btn.disabled = false;
      }, 2000);
    }
    
    console.log(`Swagger files reloaded: ${data.message}`);
    
  } catch (error) {
    console.error('Failed to reload swaggers:', error);
    
    if (btn) {
      btn.innerHTML = '❌ Failed';
      setTimeout(() => {
        btn.innerHTML = '🔄 Reload Docs';
        btn.disabled = false;
      }, 2000);
    }
    
    alert('Failed to reload swagger files: ' + error.message);
  }
}

/**
 * Check and validate tokens, refresh expired ones
 */
async function checkTokens() {
  const btn = document.getElementById('check-tokens-btn');
  const statusEl = document.getElementById('token-status');
  
  try {
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳ Checking...';
    }
    
    const response = await fetch('/api/validate/tokens/check', { method: 'POST' });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to check tokens');
    }
    
    // Update status badge
    const validCount = data.valid?.length || 0;
    const expiredCount = data.expired?.length || 0;
    const invalidCount = data.invalid?.length || 0;
    
    if (statusEl) {
      if (expiredCount > 0 || invalidCount > 0) {
        statusEl.textContent = `Tokens: ${validCount}✓ ${expiredCount + invalidCount}✗`;
        statusEl.className = 'badge badge-warn';
      } else {
        statusEl.textContent = `Tokens: ${validCount}✓`;
        statusEl.className = 'badge badge-pass';
      }
    }
    
    // Show result
    if (btn) {
      if (data.tokensRefreshed) {
        btn.innerHTML = '✅ Refreshed!';
      } else if (expiredCount === 0 && invalidCount === 0) {
        btn.innerHTML = '✅ All Valid!';
      } else {
        btn.innerHTML = '⚠️ Issues Found';
      }
      setTimeout(() => {
        btn.innerHTML = '🔐 Check Tokens';
        btn.disabled = false;
      }, 2000);
    }
    
    // Log details
    if (data.warnings?.length > 0) {
      console.warn('Token warnings:', data.warnings);
    }
    if (data.errors?.length > 0) {
      console.error('Token errors:', data.errors);
      alert('Token issues:\n' + data.errors.join('\n'));
    }
    
  } catch (error) {
    console.error('Failed to check tokens:', error);
    
    if (btn) {
      btn.innerHTML = '❌ Failed';
      setTimeout(() => {
        btn.innerHTML = '🔐 Check Tokens';
        btn.disabled = false;
      }, 2000);
    }
  }
}

/**
 * Open the paste endpoints modal
 */
function openPasteModal() {
  const modal = document.getElementById('paste-endpoints-modal');
  const input = document.getElementById('paste-endpoints-input');
  const preview = document.getElementById('paste-preview');
  
  if (modal) {
    modal.classList.remove('hidden');
  }
  if (input) {
    input.value = '';
    input.focus();
    // Add live preview on input
    input.oninput = updatePastePreview;
  }
  if (preview) {
    preview.classList.add('hidden');
  }
}

/**
 * Close the paste endpoints modal
 */
function closePasteModal() {
  const modal = document.getElementById('paste-endpoints-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

/**
 * Update paste preview with match count
 */
function updatePastePreview() {
  const input = document.getElementById('paste-endpoints-input');
  const preview = document.getElementById('paste-preview');
  const countEl = document.getElementById('paste-match-count');
  
  if (!input || !preview || !countEl) return;
  
  const text = input.value.trim();
  if (!text) {
    preview.classList.add('hidden');
    return;
  }
  
  const matchedEndpoints = parseAndMatchEndpoints(text);
  
  preview.classList.remove('hidden');
  countEl.textContent = `${matchedEndpoints.length} endpoint${matchedEndpoints.length !== 1 ? 's' : ''}`;
  countEl.className = matchedEndpoints.length > 0 ? 'preview-count match' : 'preview-count no-match';
}

/**
 * Parse comma-separated endpoints and match them to available endpoints
 */
function parseAndMatchEndpoints(text) {
  // Split by comma, handling various formats
  const parts = text.split(',').map(p => p.trim()).filter(p => p);
  
  const matched = [];
  
  for (const part of parts) {
    // Parse "METHOD /path" format
    const match = part.match(/^(GET|POST|PUT|PATCH|DELETE)\s+(.+)$/i);
    if (match) {
      const method = match[1].toUpperCase();
      const path = match[2].trim();
      
      // Find matching endpoint
      const endpoint = AppState.endpoints.find(e => 
        e.method.toUpperCase() === method && 
        (e.path === path || e.path === path.replace(/\/$/, '')) // Handle trailing slash
      );
      
      if (endpoint) {
        matched.push(endpoint);
      }
    } else {
      // Try to match just by path (any method)
      const pathOnly = part.trim();
      const endpoints = AppState.endpoints.filter(e => 
        e.path === pathOnly || e.path === pathOnly.replace(/\/$/, '')
      );
      matched.push(...endpoints);
    }
  }
  
  return matched;
}

/**
 * Apply pasted endpoints - select them in the UI
 */
function applyPastedEndpoints() {
  const input = document.getElementById('paste-endpoints-input');
  if (!input) return;
  
  const text = input.value.trim();
  if (!text) {
    alert('Please paste a list of endpoints');
    return;
  }
  
  const matchedEndpoints = parseAndMatchEndpoints(text);
  
  if (matchedEndpoints.length === 0) {
    alert('No matching endpoints found. Make sure the format is correct:\nGET /v1/path, POST /v1/other-path');
    return;
  }
  
  // Clear current selection and add matched endpoints
  AppState.selectedEndpoints.clear();
  for (const endpoint of matchedEndpoints) {
    AppState.selectedEndpoints.add(endpoint.id);
  }
  
  // Re-render and close modal
  renderEndpoints();
  updateSelectedCount();
  closePasteModal();
  
  // Show success message
  console.log(`Selected ${matchedEndpoints.length} endpoints from pasted list`);
}

/**
 * Export base URL scan results as CSV
 * Columns: endpoint, fallback, primary
 */
function exportScanCsv() {
  const scanResults = TestRunner.scanResults;

  if (!scanResults || scanResults.length === 0) {
    alert('No scan results to export. Run a base URL scan first.');
    return;
  }

  const rows = [['endpoint', 'fallback', 'primary']];

  for (const result of scanResults) {
    const fallbackStatus = result.fallback.success
      ? `PASS (${result.fallback.status || 'ok'})`
      : `FAIL (${result.fallback.error || result.fallback.status || 'error'})`;
    const primaryStatus = result.primary.success
      ? `PASS (${result.primary.status || 'ok'})`
      : `FAIL (${result.primary.error || result.primary.status || 'error'})`;

    rows.push([
      `"${result.endpoint}"`,
      `"${fallbackStatus}"`,
      `"${primaryStatus}"`
    ]);
  }

  const csvContent = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  link.download = `base-url-scan-${timestamp}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Quick Fix: remove useFallbackApi: true from workflows where primary now works
 */
async function quickFixFallbacks() {
  const scanResults = TestRunner.scanResults;

  if (!scanResults || scanResults.length === 0) {
    alert('No scan results available. Run a base URL scan first.');
    return;
  }

  const primaryWorksEndpoints = scanResults
    .filter(r => r.recommendation === 'PRIMARY_NOW_WORKS' || r.recommendation === 'FALLBACK_BROKEN')
    .map(r => r.endpoint);

  if (primaryWorksEndpoints.length === 0) {
    alert('No endpoints found where primary works. Nothing to fix.');
    return;
  }

  const confirmed = confirm(
    `This will remove "useFallbackApi: true" from ${primaryWorksEndpoints.length} workflow file(s) where the primary URL works (including cases where fallback is broken but primary works):\n\n` +
    primaryWorksEndpoints.map(e => `  - ${e}`).join('\n') +
    '\n\nProceed?'
  );

  if (!confirmed) return;

  const btn = document.getElementById('scan-quick-fix-btn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Fixing...';
  }

  try {
    const response = await fetch('/api/validate/base-url-scan/quick-fix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoints: primaryWorksEndpoints })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Quick fix failed');
    }

    // Show result summary below the scan results
    const resultEl = document.createElement('div');
    resultEl.className = 'scan-quick-fix-result success';

    const fixedList = data.fixed.map(f => `<li>${f.endpoint} - ${f.file}</li>`).join('');
    const skippedList = data.skipped.map(s => `<li>${s.endpoint} - ${s.reason}</li>`).join('');

    resultEl.innerHTML = `
      <strong>Quick Fix Complete</strong>
      <p>${data.fixed.length} workflow(s) updated, ${data.skipped.length} skipped.</p>
      ${fixedList ? `<details><summary>Updated files</summary><ul>${fixedList}</ul></details>` : ''}
      ${skippedList ? `<details><summary>Skipped</summary><ul>${skippedList}</ul></details>` : ''}
    `;

    const scanSection = document.getElementById('scan-results-section');
    const existingResult = scanSection?.querySelector('.scan-quick-fix-result');
    if (existingResult) existingResult.remove();
    scanSection?.querySelector('.results-header')?.after(resultEl);

    if (btn) {
      btn.textContent = 'Done!';
      setTimeout(() => {
        btn.textContent = 'Quick Fix';
        btn.disabled = false;
      }, 3000);
    }

  } catch (error) {
    console.error('Quick fix error:', error);

    const resultEl = document.createElement('div');
    resultEl.className = 'scan-quick-fix-result error';
    resultEl.innerHTML = `<strong>Quick Fix Failed</strong><p>${error.message}</p>`;

    const scanSection = document.getElementById('scan-results-section');
    const existingResult = scanSection?.querySelector('.scan-quick-fix-result');
    if (existingResult) existingResult.remove();
    scanSection?.querySelector('.results-header')?.after(resultEl);

    if (btn) {
      btn.textContent = 'Quick Fix';
      btn.disabled = false;
    }
  }
}

// Expose functions to window.App for onclick handlers
window.App = {
  reloadSwaggers,
  checkTokens,
  runSetup,
  openPasteModal,
  closePasteModal,
  applyPastedEndpoints,
  setValidationMode,
  exportScanCsv,
  quickFixFallbacks,
  runTokenDocFix
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
