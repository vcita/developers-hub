/**
 * Main Application
 * Initializes the dashboard and coordinates modules
 */

// Application state
const AppState = {
  endpoints: [],
  domains: [],
  selectedEndpoints: new Set(),
  filters: {
    domain: '',
    method: '',
    tokenType: '',
    search: ''
  },
  rateLimit: {
    preset: 'normal',
    concurrent: 3,
    retryOn429: true
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
  AppState.domains = [];
  
  for (const domain of data.domains) {
    AppState.domains.push(domain.domain);
    
    for (const resource of domain.resources) {
      for (const endpoint of resource.endpoints) {
        AppState.endpoints.push(endpoint);
      }
    }
  }
  
  // Update domain filter
  const domainFilter = document.getElementById('domain-filter');
  if (domainFilter) {
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
 * Set up event listeners
 */
function setupEventListeners() {
  // Filter changes
  document.getElementById('domain-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('method-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('token-filter')?.addEventListener('change', onFilterChange);
  document.getElementById('search-filter')?.addEventListener('input', debounce(onFilterChange, 300));
  
  // Rate limit changes
  document.getElementById('rate-preset')?.addEventListener('change', onRateLimitChange);
  document.getElementById('concurrent')?.addEventListener('change', onRateLimitChange);
  document.getElementById('retry-429')?.addEventListener('change', onRateLimitChange);
  
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
  AppState.filters.search = document.getElementById('search-filter')?.value || '';
  
  renderEndpoints();
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
 * Run tests for selected endpoints
 */
async function runTests() {
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
  
  // Smooth scroll to progress section
  progressSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  
  try {
    // Start test runner (scrolls to results on completion via SSE callback)
    await TestRunner.run(selectedEndpoints, {
      rateLimitPreset: AppState.rateLimit.preset,
      rateLimit: {
        maxConcurrent: AppState.rateLimit.concurrent,
        retryOn429: AppState.rateLimit.retryOn429
      }
    });
  } catch (error) {
    console.error('Test runner error:', error);
    alert('Error running tests: ' + error.message);
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

// Expose functions to window.App for onclick handlers
window.App = {
  reloadSwaggers
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
