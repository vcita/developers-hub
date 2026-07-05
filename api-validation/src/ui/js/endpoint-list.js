/**
 * Endpoint List Component
 * Renders the endpoint list with grouping and selection
 */

/**
 * Render endpoints to the list
 */
function renderEndpoints() {
  const listEl = document.getElementById('endpoints-list');
  if (!listEl) return;
  
  const filtered = getFilteredEndpoints();
  
  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty">No endpoints match the current filters</div>';
    return;
  }
  
  // Group by domain
  const grouped = {};
  for (const endpoint of filtered) {
    if (!grouped[endpoint.domain]) {
      grouped[endpoint.domain] = [];
    }
    grouped[endpoint.domain].push(endpoint);
  }
  
  // Render grouped endpoints
  let html = '';
  
  for (const [domain, endpoints] of Object.entries(grouped)) {
    const domainSelected = endpoints.filter(e => AppState.selectedEndpoints.has(e.id)).length;
    const isExpanded = AppState.expandedDomains.has(domain); // Check tracked state (default collapsed)
    
    html += `
      <div class="domain-group ${isExpanded ? 'expanded' : ''}">
        <div class="domain-header" onclick="toggleDomainGroup('${domain}')">
          <span class="expand-icon">${isExpanded ? '▼' : '▶'}</span>
          <span class="domain-name">${domain.toUpperCase()}</span>
          <span class="domain-count">(${endpoints.length} endpoints, ${domainSelected} selected)</span>
          <button class="btn btn-small" onclick="event.stopPropagation(); event.preventDefault(); selectDomain('${domain}')">Select All</button>
        </div>
        <div class="domain-endpoints">
    `;
    
    for (const endpoint of endpoints) {
      const isSelected = AppState.selectedEndpoints.has(endpoint.id);
      const methodClass = `method-${endpoint.method.toLowerCase()}`;
      const tokenBadge = endpoint.tokenInfo.found 
        ? endpoint.tokenInfo.tokens.join(', ')
        : 'No token info';
      const tokenClass = endpoint.tokenInfo.found ? '' : 'missing-token';
      
      // Workflow verification status
      const status = endpoint.workflowStatus || 'none';
      const statusLabel = getWorkflowStatusLabel(status);
      const statusClass = `workflow-status-${normalizeStatus(status)}`;
      
      html += `
        <div class="endpoint ${isSelected ? 'selected' : ''}" data-endpoint-id="${endpoint.id}" onclick="toggleEndpointSelection('${endpoint.id}')">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onclick="event.stopPropagation(); toggleEndpointSelection('${endpoint.id}')">
          <span class="method ${methodClass}">${endpoint.method}</span>
          <span class="path">${endpoint.path}</span>
          <span class="workflow-status ${statusClass}" title="Workflow status: ${status}">${statusLabel}</span>
          <span class="token-badge ${tokenClass}">${tokenBadge}</span>
          <span class="summary">${endpoint.summary || ''}</span>
        </div>
      `;
    }
    
    html += `
        </div>
      </div>
    `;
  }
  
  listEl.innerHTML = html;
  updateSelectedCount();
}

/**
 * Toggle domain group expansion
 */
function toggleDomainGroup(domain) {
  // Update the state (persisted across re-renders)
  if (AppState.expandedDomains.has(domain)) {
    AppState.expandedDomains.delete(domain);
  } else {
    AppState.expandedDomains.add(domain);
  }
  
  // Update DOM directly for immediate feedback
  const groups = document.querySelectorAll('.domain-group');
  for (const group of groups) {
    if (group.querySelector('.domain-name')?.textContent === domain.toUpperCase()) {
      const isExpanded = AppState.expandedDomains.has(domain);
      group.classList.toggle('expanded', isExpanded);
      const icon = group.querySelector('.expand-icon');
      if (icon) {
        icon.textContent = isExpanded ? '▼' : '▶';
      }
    }
  }
}

/**
 * Select all endpoints in a domain
 */
function selectDomain(domain) {
  const filtered = getFilteredEndpoints().filter(e => e.domain === domain);
  for (const endpoint of filtered) {
    AppState.selectedEndpoints.add(endpoint.id);
  }
  renderEndpoints();
}

/**
 * Toggle single endpoint selection
 */
function toggleEndpointSelection(endpointId) {
  toggleEndpoint(endpointId);
  
  // Update checkbox visually - use data attribute for exact match
  const el = document.querySelector(`.endpoint[data-endpoint-id="${endpointId}"]`);
  if (el) {
    const checkbox = el.querySelector('input[type="checkbox"]');
    const isSelected = AppState.selectedEndpoints.has(endpointId);
    if (checkbox) checkbox.checked = isSelected;
    el.classList.toggle('selected', isSelected);
  }
}

/**
 * Normalize workflow status to a CSS-friendly key
 * Merges similar statuses (e.g., "skip" and "skipped")
 */
function normalizeStatus(status) {
  if (!status) return 'none';
  const s = status.toLowerCase().trim();
  if (s === 'skip' || s === 'skipped') return 'skipped';
  if (s === 'verified' || s === 'success') return 'verified';
  if (s === 'pending') return 'pending';
  if (s === 'failed') return 'failed';
  if (s === 'deprecated') return 'deprecated';
  if (s === 'none') return 'none';
  return 'none';
}

/**
 * Get a display label for a workflow status
 */
function getWorkflowStatusLabel(status) {
  const normalized = normalizeStatus(status);
  const labels = {
    'verified': 'Verified',
    'pending': 'Pending',
    'failed': 'Failed',
    'skipped': 'Skipped',
    'deprecated': 'Deprecated',
    'none': 'No Workflow'
  };
  return labels[normalized] || status;
}
