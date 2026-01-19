/**
 * Results Viewer Component
 * Displays validation results with expandable details
 */

const ResultsViewer = {
  // Store results for lookup
  _results: [],
  
  /**
   * Render results to the results list
   * @param {Object[]} results - Array of result objects
   */
  render(results) {
    // Store results for later lookup
    this._results = results;
    const listEl = document.getElementById('results-list');
    if (!listEl) return;
    
    // Sort: failures first, then passes, then skips
    const sorted = [...results].sort((a, b) => {
      const order = { FAIL: 0, PASS: 1, SKIP: 2 };
      return (order[a.status] || 3) - (order[b.status] || 3);
    });
    
    let html = '';
    
    for (const result of sorted) {
      const statusClass = result.status === 'PASS' ? 'pass' : 
                          (result.status === 'FAIL' ? 'fail' : 'skip');
      const icon = result.status === 'PASS' ? '✓' : 
                   (result.status === 'FAIL' ? '✗' : '○');
      const hasDetails = result.details && (result.details.request || result.details.reason);
      
      html += `
        <div class="result-item result-${statusClass} ${hasDetails ? 'expandable' : ''}" 
             ${hasDetails ? `onclick="ResultsViewer.toggleDetails(this)"` : ''}>
          <div class="result-header">
            <span class="result-icon">${icon}</span>
            <span class="result-endpoint">${result.endpoint}</span>
            <span class="result-meta">
              <span class="http-status">${result.httpStatus || '-'}</span>
              <span class="token-used">${result.tokenUsed || '-'}</span>
              <span class="duration">${result.duration}</span>
            </span>
            <span class="result-status status-${statusClass}">${result.status}</span>
          </div>
          ${hasDetails ? this.renderDetails(result.details, result.status === 'PASS') : ''}
        </div>
      `;
    }
    
    listEl.innerHTML = html || '<div class="empty">No results yet</div>';
  },
  
  /**
   * Render result details
   * @param {Object} details - Result details
   * @param {boolean} isPass - Whether this is a passing result
   * @returns {string} HTML string
   */
  renderDetails(details, isPass = false) {
    // For passing results, show minimal details (just request/response buttons)
    if (isPass) {
      return `
        <div class="result-details hidden">
          <div class="details-section pass-info">
            <div class="detail-label">✓ Validation passed</div>
            <div class="detail-value">Response matches documented schema</div>
          </div>
          
          <div class="details-actions">
            ${details.request ? `
              <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.showRequest(this)">
                View Request
              </button>
            ` : ''}
            ${details.response ? `
              <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.showResponse(this)">
                View Response
              </button>
            ` : ''}
            <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.copyAsCurl(this)">
              Copy as cURL
            </button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="result-details hidden">
        <div class="details-section">
          <div class="detail-label">Reason:</div>
          <div class="detail-value reason">${details.reason || 'Unknown'}</div>
        </div>
        
        <div class="details-section">
          <div class="detail-label">Description:</div>
          <div class="detail-value message">${details.friendlyMessage || 'No details available'}</div>
        </div>
        
        ${details.errors && details.errors.length > 0 ? `
          ${details.errors.some(e => e.reason === 'PARAM_NAME_MISMATCH') ? `
            <div class="details-section doc-issue-section">
              <div class="detail-label">⚠️ Documentation Issues:</div>
              <div class="detail-value doc-issues">
                <ul>
                  ${details.errors.filter(e => e.reason === 'PARAM_NAME_MISMATCH').map(e => `
                    <li class="doc-issue">
                      <strong>${e.message}</strong>
                      ${e.suggestion ? `<div class="fix-suggestion">Fix: ${e.suggestion}</div>` : ''}
                    </li>
                  `).join('')}
                </ul>
              </div>
            </div>
          ` : ''}
          ${details.errors.filter(e => e.reason !== 'PARAM_NAME_MISMATCH').length > 0 ? `
            <div class="details-section">
              <div class="detail-label">Schema Errors:</div>
              <div class="detail-value errors">
                <ul>
                  ${details.errors.filter(e => e.reason !== 'PARAM_NAME_MISMATCH').slice(0, 5).map(e => `
                    <li>
                      <code>${e.path || '/'}</code>: ${e.friendlyMessage || e.message}
                      ${e.keyword ? `<span class="error-keyword">(${e.keyword})</span>` : ''}
                    </li>
                  `).join('')}
                  ${details.errors.filter(e => e.reason !== 'PARAM_NAME_MISMATCH').length > 5 ? `<li class="more-errors">... and ${details.errors.filter(e => e.reason !== 'PARAM_NAME_MISMATCH').length - 5} more errors</li>` : ''}
                </ul>
              </div>
            </div>
          ` : ''}
        ` : ''}
        
        ${details.suggestion ? `
          <div class="details-section suggestion">
            <div class="detail-label">💡 Suggestion:</div>
            <div class="detail-value">${details.suggestion}</div>
          </div>
        ` : ''}
        
        <div class="details-actions">
          ${details.request ? `
            <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.showRequest(this)">
              View Request
            </button>
          ` : ''}
          ${details.response ? `
            <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.showResponse(this)">
              View Response
            </button>
          ` : ''}
          <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.copyAsCurl(this)">
            Copy as cURL
          </button>
        </div>
      </div>
    `;
  },
  
  /**
   * Toggle details visibility
   * @param {HTMLElement} element - Result item element
   */
  toggleDetails(element) {
    const details = element.querySelector('.result-details');
    if (details) {
      details.classList.toggle('hidden');
      element.classList.toggle('expanded');
    }
  },
  
  /**
   * Show request details in modal
   * @param {HTMLElement} button - Button element
   */
  showRequest(button) {
    const resultItem = button.closest('.result-item');
    const endpoint = resultItem?.querySelector('.result-endpoint')?.textContent;
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpoint);
    const requestData = result?.details?.request;
    
    if (requestData) {
      this.showModal('Request Details', requestData);
    } else {
      alert('No request data available');
    }
  },
  
  /**
   * Show response details in modal
   * @param {HTMLElement} button - Button element
   */
  showResponse(button) {
    const resultItem = button.closest('.result-item');
    const endpoint = resultItem?.querySelector('.result-endpoint')?.textContent;
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpoint);
    const responseData = result?.details?.response;
    
    if (responseData) {
      this.showModal('Response Details', responseData);
    } else {
      alert('No response data available');
    }
  },
  
  /**
   * Show a modal with JSON data
   * @param {string} title - Modal title
   * @param {Object} data - Data to display
   */
  showModal(title, data) {
    // Remove existing modal if any
    const existing = document.getElementById('data-modal');
    if (existing) existing.remove();
    
    const modal = document.createElement('div');
    modal.id = 'data-modal';
    modal.innerHTML = `
      <div class="modal-overlay" onclick="ResultsViewer.closeModal()"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="ResultsViewer.closeModal()">×</button>
        </div>
        <div class="modal-body">
          <pre>${this.formatJson(data)}</pre>
        </div>
        <div class="modal-footer">
          <button class="btn btn-small" onclick="ResultsViewer.copyModalContent()">Copy JSON</button>
          <button class="btn btn-secondary btn-small" onclick="ResultsViewer.closeModal()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  },
  
  /**
   * Close the modal
   */
  closeModal() {
    const modal = document.getElementById('data-modal');
    if (modal) modal.remove();
  },
  
  /**
   * Copy modal content to clipboard
   */
  copyModalContent() {
    const pre = document.querySelector('#data-modal pre');
    if (pre) {
      navigator.clipboard.writeText(pre.textContent).then(() => {
        alert('Copied to clipboard!');
      }).catch(err => {
        console.error('Copy failed:', err);
      });
    }
  },
  
  /**
   * Format JSON with syntax highlighting
   * @param {Object} data - Data to format
   * @returns {string} Formatted HTML
   */
  formatJson(data) {
    const json = JSON.stringify(data, null, 2);
    // Simple syntax highlighting
    return json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(".*?")\s*:/g, '<span class="json-key">$1</span>:')
      .replace(/:\s*(".*?")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
  },
  
  /**
   * Copy request as cURL command
   * @param {HTMLElement} button - Button element clicked
   */
  copyAsCurl(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    const request = result?.details?.request;
    
    let curl;
    
    if (request && request.url) {
      // Use actual request details
      const parts = [`curl -X ${request.method || 'GET'}`];
      
      // Full URL with resolved path parameters
      let url = request.url;
      
      // Add query params if present
      if (request.params && Object.keys(request.params).length > 0) {
        const queryString = Object.entries(request.params)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        url += `?${queryString}`;
      }
      parts.push(`'${url}'`);
      
      // Headers with actual token
      if (request.headers) {
        for (const [key, value] of Object.entries(request.headers)) {
          parts.push(`-H '${key}: ${value}'`);
        }
      }
      
      // Content-Type if not already included
      if (!request.headers?.['Content-Type']) {
        parts.push("-H 'Content-Type: application/json'");
      }
      
      // Request body
      if (request.data) {
        const data = typeof request.data === 'string' 
          ? request.data 
          : JSON.stringify(request.data);
        parts.push(`-d '${data}'`);
      }
      
      curl = parts.join(' \\\n  ');
    } else {
      // Fallback: build from endpoint text
      const endpointParts = endpointText.split(' ');
      const method = endpointParts[0] || 'GET';
      const path = endpointParts.slice(1).join(' ') || '';
      const baseUrl = AppState?.config?.baseUrl || 'https://your-api.com';
      
      curl = `curl -X ${method} '${baseUrl}${path}' \\
  -H 'Authorization: Bearer <YOUR_TOKEN>' \\
  -H 'Content-Type: application/json'`;
    }
    
    navigator.clipboard.writeText(curl).then(() => {
      alert('cURL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      // Fallback: show in prompt
      prompt('Copy this cURL command:', curl);
    });
  },
  
  /**
   * Download validation results as Markdown report
   */
  async downloadReport() {
    if (!this._results || this._results.length === 0) {
      alert('No results to download. Run a validation first.');
      return;
    }
    
    try {
      // Build report object
      const report = this.buildReportObject();
      
      // Request markdown generation from server
      const response = await fetch('/api/report/markdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create and trigger download
      const blob = new Blob([data.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to download report:', error);
      alert(`Failed to download report: ${error.message}`);
    }
  },
  
  /**
   * Build a report object from current results
   * @returns {Object} Report object
   */
  buildReportObject() {
    const results = this._results || [];
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    
    // Calculate pass rate
    const testable = results.length - skipped;
    const passRate = testable > 0 ? ((passed / testable) * 100).toFixed(1) + '%' : '0%';
    
    // Group by domain
    const byDomain = {};
    for (const result of results) {
      const domain = result.domain || 'unknown';
      if (!byDomain[domain]) {
        byDomain[domain] = { passed: 0, failed: 0, skipped: 0, total: 0 };
      }
      byDomain[domain].total++;
      if (result.status === 'PASS') byDomain[domain].passed++;
      else if (result.status === 'FAIL') byDomain[domain].failed++;
      else if (result.status === 'SKIP') byDomain[domain].skipped++;
    }
    
    // Calculate domain pass rates
    for (const stats of Object.values(byDomain)) {
      const domainTestable = stats.total - stats.skipped;
      stats.passRate = domainTestable > 0 
        ? ((stats.passed / domainTestable) * 100).toFixed(1) + '%' 
        : 'N/A';
    }
    
    // Calculate total duration
    const totalDurationMs = results.reduce((sum, r) => {
      const ms = parseInt(r.duration) || 0;
      return sum + ms;
    }, 0);
    
    return {
      summary: {
        timestamp: new Date().toISOString(),
        environment: AppState?.config?.environment || 'unknown',
        baseUrl: AppState?.config?.baseUrl || '',
        total: results.length,
        passed,
        failed,
        skipped,
        passRate,
        duration: this.formatDuration(totalDurationMs),
        durationMs: totalDurationMs
      },
      documentationIssues: [],
      results,
      byDomain
    };
  },
  
  /**
   * Format duration in human-readable form
   * @param {number} ms - Duration in milliseconds
   * @returns {string} Formatted duration
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
};
