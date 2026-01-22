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
    
    // Sort: failures first, then warnings, then passes, then skips
    const sorted = [...results].sort((a, b) => {
      const order = { FAIL: 0, WARN: 1, PASS: 2, SKIP: 3 };
      return (order[a.status] || 4) - (order[b.status] || 4);
    });
    
    let html = '';
    
    for (const result of sorted) {
      const statusClass = result.status === 'PASS' ? 'pass' : 
                          result.status === 'FAIL' ? 'fail' :
                          result.status === 'WARN' ? 'warn' : 
                          result.status === 'ERROR' ? 'error' : 'skip';
      const icon = result.status === 'PASS' ? '✓' : 
                   result.status === 'FAIL' ? '✗' :
                   result.status === 'WARN' ? '⚠' : 
                   result.status === 'ERROR' ? '❌' : '○';
      const hasDetails = result.details && (result.details.request || result.details.reason);
      
      html += `
        <div class="result-item result-${statusClass} ${hasDetails ? 'expandable' : ''}">
          <div class="result-header" ${hasDetails ? `onclick="ResultsViewer.toggleDetails(this.parentElement)"` : ''}>
            <span class="result-icon">${icon}</span>
            <span class="result-endpoint">${result.endpoint}</span>
            <span class="result-meta">
              <span class="http-status">${result.httpStatus || '-'}</span>
              <span class="token-used">${result.tokenUsed || '-'}</span>
              <span class="duration">${result.duration}</span>
            </span>
            <span class="result-status status-${statusClass}">${result.status}</span>
          </div>
          ${result.summary ? `<div class="result-summary">${result.summary}</div>` : ''}
          ${result.description ? `<div class="result-description">${this.truncateText(result.description, 200)}</div>` : ''}
          ${hasDetails ? this.renderDetails(result.details, result.status === 'PASS', result.summary, result.description) : ''}
        </div>
      `;
    }
    
    listEl.innerHTML = html || '<div class="empty">No results yet</div>';
  },
  
  /**
   * Render result details
   * @param {Object} details - Result details
   * @param {boolean} isPass - Whether this is a passing result
   * @param {string} summary - Endpoint summary
   * @param {string} description - Endpoint description
   * @returns {string} HTML string
   */
  renderDetails(details, isPass = false, summary = null, description = null) {
    // Endpoint info section (shown for all results)
    const endpointInfoHtml = (summary || description) ? `
      <div class="details-section endpoint-info">
        ${summary ? `<div class="endpoint-summary"><strong>${summary}</strong></div>` : ''}
        ${description ? `<div class="endpoint-description">${this.formatDescription(description)}</div>` : ''}
      </div>
    ` : '';
    
    // For passing results, show minimal details (plus healing info if applicable)
    if (isPass) {
      return `
        <div class="result-details hidden">
          ${endpointInfoHtml}
          <div class="details-section pass-info">
            <div class="detail-label">✓ Validation passed</div>
            <div class="detail-value">Response matches documented schema</div>
          </div>
          
          ${details.healingInfo ? this.renderHealingInfo(details.healingInfo) : ''}
          
          ${details.documentationIssues?.length > 0 ? this.renderDocumentationIssues(details.documentationIssues) : ''}
          
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
            <button class="btn btn-small btn-retry" onclick="event.stopPropagation(); ResultsViewer.retryEndpoint(this)">
              🔄 Retry
            </button>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="result-details hidden">
        ${endpointInfoHtml}
        
        <div class="details-section">
          <div class="detail-label">Reason:</div>
          <div class="detail-value reason">${details.reason || 'Unknown'}</div>
        </div>
        
        <div class="details-section">
          <div class="detail-label">Error Description:</div>
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
        
        ${details.healingInfo ? this.renderHealingInfo(details.healingInfo) : ''}
        
        ${details.documentationIssues?.length > 0 ? this.renderDocumentationIssues(details.documentationIssues) : ''}
        
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
          <button class="btn btn-small btn-retry" onclick="event.stopPropagation(); ResultsViewer.retryEndpoint(this)">
            🔄 Retry
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
   * Format endpoint description for display
   * Handles newlines, bold markdown, and token info
   * @param {string} description - Raw description text
   * @returns {string} HTML formatted description
   */
  formatDescription(description) {
    if (!description) return '';
    
    return description
      // Convert **text** to bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Convert newlines to <br>
      .replace(/\n/g, '<br>')
      // Trim whitespace
      .trim();
  },
  
  /**
   * Truncate text and strip markdown for preview display
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = 150) {
    if (!text) return '';
    
    // Strip markdown bold markers and clean up
    let clean = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength) + '...';
  },
  
  /**
   * Render healing info section
   * @param {Object} healingInfo - Healing info from result
   * @returns {string} HTML string
   */
  renderHealingInfo(healingInfo) {
    if (!healingInfo) return '';
    
    const isSuccess = !healingInfo.failed;
    const statusIcon = isSuccess ? '✓' : '✗';
    const statusClass = isSuccess ? 'success' : 'failed';
    
    // Build healing history timeline - support both old and new formats
    const historyHtml = healingInfo.agentLog 
      ? this.renderAgentLog(healingInfo.agentLog)
      : this.renderHealingHistory(healingInfo.healingHistory);
    
    return `
      <div class="healing-summary ${statusClass}">
        <h4>${statusIcon} Self-Healing ${isSuccess ? 'Succeeded' : 'Failed'}</h4>
        <div class="healing-stats">
          <div class="stat">
            <span class="label">Attempts</span>
            <span class="value">${healingInfo.attempts || healingInfo.iterations || 1}</span>
          </div>
          ${healingInfo.prerequisitesCreated?.length > 0 ? `
            <div class="stat">
              <span class="label">Prerequisites</span>
              <span class="value">${healingInfo.prerequisitesCreated.length}</span>
            </div>
          ` : ''}
          ${healingInfo.summary ? `
            <div class="stat full-width">
              <span class="label">Summary</span>
              <span class="value">${this.escapeHtml(healingInfo.summary)}</span>
            </div>
          ` : ''}
          ${healingInfo.reason ? `
            <div class="stat full-width">
              <span class="label">Reason</span>
              <span class="value">${this.escapeHtml(healingInfo.reason)}</span>
            </div>
          ` : ''}
        </div>
        ${healingInfo.prerequisitesCreated?.length > 0 ? `
          <div class="prerequisites-created">
            <h5>Prerequisites Created:</h5>
            <ol>
              ${healingInfo.prerequisitesCreated.map(p => `<li><code>${p}</code></li>`).join('')}
            </ol>
          </div>
        ` : ''}
        ${historyHtml}
      </div>
    `;
  },
  
  /**
   * Render agent log (new tool-based format)
   * @param {Array} agentLog - Array of agent log entries
   * @returns {string} HTML string
   */
  renderAgentLog(agentLog) {
    if (!agentLog || agentLog.length === 0) return '';
    
    const entries = agentLog.map((entry, index) => {
      let icon, title, content, typeClass;
      
      switch (entry.type) {
        case 'thought':
          icon = '🤔';
          title = `AI Thinking (Iteration ${entry.iteration})`;
          content = entry.content;
          typeClass = 'thought';
          break;
        case 'tool_call':
          icon = '🔧';
          title = `Tool: ${entry.tool}`;
          content = JSON.stringify(entry.input, null, 2);
          typeClass = 'tool-call';
          break;
        case 'tool_result':
          const isSuccess = entry.result?.success;
          icon = isSuccess ? '✅' : '❌';
          title = `Result: ${entry.tool}`;
          typeClass = isSuccess ? 'success' : 'failed';
          // Format the result nicely
          if (entry.result?.status) {
            content = `HTTP ${entry.result.status}\n${JSON.stringify(entry.result.data || entry.result.error, null, 2)}`;
          } else {
            content = JSON.stringify(entry.result, null, 2);
          }
          break;
        case 'no_action':
          icon = '⚠️';
          title = 'Agent Stopped';
          content = entry.content;
          typeClass = 'warning';
          break;
        default:
          icon = '•';
          title = entry.type;
          content = JSON.stringify(entry, null, 2);
          typeClass = '';
      }
      
      return `
        <div class="history-entry ${typeClass}">
          <div class="history-icon">${icon}</div>
          <div class="history-content">
            <div class="history-title">${this.escapeHtml(title)}</div>
            ${content ? `<pre class="history-code">${this.escapeHtml(content).substring(0, 500)}${content.length > 500 ? '...' : ''}</pre>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="healing-history agent-log">
        <h5>🤖 AI Agent Log</h5>
        <div class="history-timeline">
          ${entries}
        </div>
      </div>
    `;
  },
  
  /**
   * Render healing history timeline
   * @param {Array} history - Array of healing history entries
   * @returns {string} HTML string
   */
  renderHealingHistory(history) {
    if (!history || history.length === 0) return '';
    
    const entries = history.map((entry, index) => {
      const typeClass = this.getHistoryTypeClass(entry.type);
      return `
        <div class="history-entry ${typeClass}">
          <div class="history-icon">${entry.icon || '•'}</div>
          <div class="history-content">
            <div class="history-title">${this.escapeHtml(entry.title)}</div>
            ${entry.description ? `<div class="history-description">${this.escapeHtml(entry.description)}</div>` : ''}
            ${entry.details ? `<div class="history-details">${this.escapeHtml(entry.details)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="healing-history">
        <h5>📜 Healing Process Log</h5>
        <div class="history-timeline">
          ${entries}
        </div>
      </div>
    `;
  },
  
  /**
   * Get CSS class for history entry type
   */
  getHistoryTypeClass(type) {
    const typeClasses = {
      'error': 'history-error',
      'analyzing': 'history-analyzing',
      'analysis_result': 'history-info',
      'creating': 'history-creating',
      'created': 'history-success',
      'mapping': 'history-mapping',
      'retrying': 'history-retrying',
      'success': 'history-success',
      'failed': 'history-error',
      'retry_failed': 'history-warning',
      'no_fix': 'history-warning',
      'stopped': 'history-error',
      'exhausted': 'history-error'
    };
    return typeClasses[type] || '';
  },
  
  /**
   * Render documentation issues section
   * @param {Array} issues - Documentation issues from AI analysis
   * @returns {string} HTML string
   */
  renderDocumentationIssues(issues) {
    if (!issues || issues.length === 0) return '';
    
    return `
      <div class="documentation-issues">
        <h4>📝 Documentation Issues Found</h4>
        ${issues.map(issue => `
          <div class="issue-card">
            <div class="issue-header">
              <span class="issue-type">${this.escapeHtml(issue.type)}</span>
              ${issue.field ? `<span class="issue-field">${this.escapeHtml(issue.field)}</span>` : ''}
            </div>
            <div class="issue-message">${this.escapeHtml(issue.message)}</div>
            ${issue.suggestion ? `
              <div class="issue-suggestion">
                <strong>Suggestion:</strong> ${this.escapeHtml(issue.suggestion)}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },
  
  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
   * Retry a single endpoint with full self-healing
   * @param {HTMLElement} button - The retry button element
   */
  async retryEndpoint(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    if (!result) {
      alert('Could not find endpoint data');
      return;
    }
    
    // Extract method and path from endpoint text (e.g., "GET /v3/clients")
    const [method, ...pathParts] = endpointText.split(' ');
    const path = pathParts.join(' ');
    
    if (!method || !path) {
      alert('Invalid endpoint format');
      return;
    }
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Retrying...';
    
    try {
      // Start validation for just this endpoint
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: [{
            method,
            path,
            domain: result.domain || 'unknown'
          }],
          options: {
            enableHealing: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      const sessionId = data.sessionId;
      
      // Connect to SSE stream for this retry
      const eventSource = new EventSource(`/api/validate/stream/${sessionId}`);
      
      // Show progress in button
      eventSource.addEventListener('healing_start', () => {
        button.innerHTML = '🔧 Healing...';
      });
      
      eventSource.addEventListener('healing_analyzing', () => {
        button.innerHTML = '🤖 AI Analyzing...';
      });
      
      eventSource.addEventListener('healing_creating', () => {
        button.innerHTML = '📦 Creating...';
      });
      
      eventSource.addEventListener('healing_retry', () => {
        button.innerHTML = '🔄 Retrying...';
      });
      
      // Handle completion
      eventSource.addEventListener('result', (event) => {
        const newResult = JSON.parse(event.data);
        
        // Update the result in our list
        const index = this._results.findIndex(r => r.endpoint === endpointText);
        if (index !== -1) {
          this._results[index] = newResult;
        }
        
        // Re-render all results
        this.render(this._results);
        
        // Show status
        const statusIcon = newResult.status === 'PASS' ? '✅' : 
                          newResult.status === 'WARN' ? '⚠️' :
                          newResult.status === 'ERROR' ? '🔶' : '❌';
        button.innerHTML = `${statusIcon} ${newResult.status}`;
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      });
      
      eventSource.addEventListener('complete', () => {
        eventSource.close();
        
        // Update summary counts
        this.updateSummaryCounts();
      });
      
      eventSource.addEventListener('error', () => {
        eventSource.close();
        button.innerHTML = '❌ Error';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      });
      
    } catch (error) {
      console.error('Retry failed:', error);
      button.innerHTML = '❌ Failed';
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);
    }
  },
  
  /**
   * Update the summary counts in the header
   */
  updateSummaryCounts() {
    const results = this._results || [];
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;
    const errored = results.filter(r => r.status === 'ERROR').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    
    document.getElementById('results-passed').textContent = passed;
    document.getElementById('results-failed').textContent = failed;
    document.getElementById('results-warned').textContent = warned;
    document.getElementById('results-errored').textContent = errored;
    document.getElementById('results-skipped').textContent = skipped;
  },
  
  /**
   * Preview validation results as Markdown report in modal
   */
  async previewReport() {
    if (!this._results || this._results.length === 0) {
      alert('No results to preview. Run a validation first.');
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
      
      // Store for download
      this._currentReport = data;
      
      // Convert markdown to HTML and show in modal
      const html = this.markdownToHtml(data.markdown);
      document.getElementById('report-preview').innerHTML = html;
      document.getElementById('report-modal').classList.remove('hidden');
      
    } catch (error) {
      console.error('Failed to preview report:', error);
      alert(`Failed to preview report: ${error.message}`);
    }
  },
  
  /**
   * Close the report preview modal
   */
  closeReportModal() {
    document.getElementById('report-modal').classList.add('hidden');
  },
  
  /**
   * Initialize modal close on backdrop click and escape key
   */
  initReportModal() {
    const modal = document.getElementById('report-modal');
    if (modal) {
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeReportModal();
        }
      });
      
      // Close on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
          this.closeReportModal();
        }
      });
    }
  },
  
  /**
   * Download the report from the modal
   */
  downloadReportFromModal() {
    if (!this._currentReport) {
      alert('No report available to download.');
      return;
    }
    
    const blob = new Blob([this._currentReport.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this._currentReport.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
  
  /**
   * Simple markdown to HTML converter
   * @param {string} markdown - Markdown content
   * @returns {string} HTML content
   */
  markdownToHtml(markdown) {
    if (!markdown) return '';
    
    // Process tables first (before escaping, to handle them properly)
    let html = this.processMarkdownTables(markdown);
    
    html = html
      // Escape HTML (but not in already processed tables)
      .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
      
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      
      // Bold and italic
      .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
      
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      
      // Line breaks (paragraphs)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraph
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs and fix wrapping
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[123]>)/g, '$1');
    html = html.replace(/(<\/h[123]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<table)/g, '$1');
    html = html.replace(/(<\/table>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    
    // Remove excess breaks around tables and headings
    html = html.replace(/<br><table/g, '<table');
    html = html.replace(/<\/table><br>/g, '</table>');
    html = html.replace(/(<\/h[123]>)<br>/g, '$1');
    html = html.replace(/<br>(<h[123]>)/g, '$1');
    html = html.replace(/<br><br>/g, '<br>');
    html = html.replace(/(<\/h[123]>)(<br>)+(<table)/g, '$1$3');
    
    return html;
  },
  
  /**
   * Process markdown tables into HTML tables
   * @param {string} markdown - Markdown content
   * @returns {string} Markdown with tables converted to HTML
   */
  processMarkdownTables(markdown) {
    // Normalize line endings
    const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalized.split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];
    let headerProcessed = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if line is a table row (starts and ends with |, has content)
      const isTableRow = trimmedLine.startsWith('|') && trimmedLine.endsWith('|') && trimmedLine.length > 2;
      
      // Check if it's a separator row (only contains |, -, :, and spaces)
      const isSeparator = isTableRow && /^\|[\s\-:|]+\|$/.test(trimmedLine);
      
      if (isTableRow) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
          headerProcessed = false;
        }
        
        if (isSeparator) {
          // Skip separator row but mark that we've seen it (header is before separator)
          continue;
        }
        
        // Extract cells - remove first and last |, then split
        const innerContent = trimmedLine.slice(1, -1);
        const cells = innerContent.split('|').map(c => c.trim());
        
        // First non-separator row is the header
        const tag = !headerProcessed ? 'th' : 'td';
        const cellsHtml = cells.map(c => `<${tag}>${c}</${tag}>`).join('');
        tableRows.push(`<tr>${cellsHtml}</tr>`);
        headerProcessed = true;
      } else {
        // Not a table row
        if (inTable && tableRows.length > 0) {
          // End of table, output it
          result.push(`<table class="md-table">${tableRows.join('')}</table>`);
          inTable = false;
          tableRows = [];
          headerProcessed = false;
        }
        result.push(line);
      }
    }
    
    // Handle table at end of content
    if (inTable && tableRows.length > 0) {
      result.push(`<table class="md-table">${tableRows.join('')}</table>`);
    }
    
    return result.join('\n');
  },
  
  /**
   * Download validation results as CSV
   */
  downloadCSV() {
    if (!this._results || this._results.length === 0) {
      alert('No results to download. Run a validation first.');
      return;
    }
    
    try {
      const results = this._results;
      
      // CSV headers
      const headers = [
        'Status',
        'Method',
        'Endpoint',
        'Domain',
        'HTTP Status',
        'Duration',
        'Token Used',
        'Reason',
        'Description',
        'Errors',
        'Suggestion',
        'Healed',
        'Healing Attempts',
        'Prerequisites Created',
        'Doc Issues',
        'Request JSON',
        'Response JSON'
      ];
      
      // Build CSV rows
      const rows = results.map(result => {
        const details = result.details || {};
        
        // Combine all errors into a single string
        const errors = (details.errors || [])
          .map(e => {
            const path = e.path || '';
            const msg = e.friendlyMessage || e.message || '';
            return path ? `${path}: ${msg}` : msg;
          })
          .join('; ');
        
        // Healing info
        const healingInfo = details.healingInfo || {};
        const healed = healingInfo.attempts ? 'Yes' : (healingInfo.attempted ? 'Failed' : 'No');
        const healingAttempts = healingInfo.attempts || '';
        const prerequisitesCreated = (healingInfo.prerequisitesCreated || []).join('; ');
        
        // Documentation issues
        const docIssues = (details.documentationIssues || [])
          .map(i => `${i.type}: ${i.field || ''} - ${i.message}`)
          .join('; ');
        
        // Safely stringify request and response
        let requestJson = '';
        let responseJson = '';
        
        try {
          if (details.request) {
            requestJson = JSON.stringify(details.request);
          }
        } catch (e) {
          requestJson = '[Error serializing request]';
        }
        
        try {
          if (details.response) {
            responseJson = JSON.stringify(details.response);
          }
        } catch (e) {
          responseJson = '[Error serializing response]';
        }
        
        return [
          result.status,
          result.method,
          result.path,
          result.domain || '',
          result.httpStatus || '',
          result.duration || '',
          result.tokenUsed || '',
          details.reason || '',
          details.friendlyMessage || '',
          errors,
          details.suggestion || '',
          healed,
          healingAttempts,
          prerequisitesCreated,
          docIssues,
          requestJson,
          responseJson
        ];
      });
      
      // Convert to CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(','))
      ].join('\n');
      
      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const environment = AppState?.config?.environment || 'unknown';
      a.download = `api-validation-${environment}-${timestamp}.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to download CSV:', error);
      alert(`Failed to download CSV: ${error.message}`);
    }
  },
  
  /**
   * Escape a value for CSV (handle commas, quotes, newlines)
   * @param {*} value - Value to escape
   * @returns {string} Escaped CSV value
   */
  escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape existing quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  },
  
  /**
   * Build a report object from current results
   * @returns {Object} Report object
   */
  buildReportObject() {
    const results = this._results || [];
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;
    const errored = results.filter(r => r.status === 'ERROR').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    
    // Calculate pass rate
    const testable = results.length - skipped;
    const passRate = testable > 0 ? ((passed / testable) * 100).toFixed(1) + '%' : '0%';
    
    // Group by domain
    const byDomain = {};
    for (const result of results) {
      const domain = result.domain || 'unknown';
      if (!byDomain[domain]) {
        byDomain[domain] = { passed: 0, failed: 0, warned: 0, errored: 0, skipped: 0, total: 0 };
      }
      byDomain[domain].total++;
      if (result.status === 'PASS') byDomain[domain].passed++;
      else if (result.status === 'FAIL') byDomain[domain].failed++;
      else if (result.status === 'WARN') byDomain[domain].warned++;
      else if (result.status === 'ERROR') byDomain[domain].errored++;
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
        warned,
        errored,
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
