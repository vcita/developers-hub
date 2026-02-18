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
      const resultId = `result-${result.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
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
        <div id="${resultId}" class="result-item result-${statusClass} ${hasDetails ? 'expandable' : ''}" data-status="${result.status}">
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
   * Add a single result to the list (for incremental rendering during test run)
   * @param {Object} result - Single result object
   */
  addResult(result) {
    const listEl = document.getElementById('results-list');
    if (!listEl) return;
    
    // Create unique ID for this result item
    const resultId = `result-${result.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    // Check if this result already exists - if so, update instead of adding
    if (document.getElementById(resultId)) {
      this.updateResult(result);
      return;
    }
    
    this._results.push(result);
    
    // Remove loading message if present
    const loadingMsg = listEl.querySelector('.results-loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }
    
    const statusClass = result.status === 'PASS' ? 'pass' : 
                        result.status === 'FAIL' ? 'fail' :
                        result.status === 'WARN' ? 'warn' : 
                        result.status === 'ERROR' ? 'error' : 'skip';
    const icon = result.status === 'PASS' ? '✓' : 
                 result.status === 'FAIL' ? '✗' :
                 result.status === 'WARN' ? '⚠' : 
                 result.status === 'ERROR' ? '❌' : '○';
    const hasDetails = result.details && (result.details.request || result.details.reason);
    
    const html = `
      <div id="${resultId}" class="result-item result-${statusClass} ${hasDetails ? 'expandable' : ''}" data-status="${result.status}">
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
    
    // Insert at appropriate position based on status (failures first)
    const statusOrder = { FAIL: 0, ERROR: 1, WARN: 2, PASS: 3, SKIP: 4 };
    const currentOrder = statusOrder[result.status] ?? 5;
    
    const existingItems = listEl.querySelectorAll('.result-item');
    let insertBefore = null;
    
    for (const item of existingItems) {
      const itemStatus = item.getAttribute('data-status');
      const itemOrder = statusOrder[itemStatus] ?? 5;
      if (itemOrder > currentOrder) {
        insertBefore = item;
        break;
      }
    }
    
    if (insertBefore) {
      insertBefore.insertAdjacentHTML('beforebegin', html);
    } else {
      listEl.insertAdjacentHTML('beforeend', html);
    }
  },
  
  /**
   * Update a result in place (used when healing completes)
   * @param {Object} result - Updated result object
   */
  updateResult(result) {
    const resultId = `result-${result.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const existingEl = document.getElementById(resultId);
    
    if (existingEl) {
      // Update internal storage
      const idx = this._results.findIndex(r => r.endpoint === result.endpoint);
      if (idx >= 0) {
        this._results[idx] = result;
      }
      
      const statusClass = result.status === 'PASS' ? 'pass' : 
                          result.status === 'FAIL' ? 'fail' :
                          result.status === 'WARN' ? 'warn' : 
                          result.status === 'ERROR' ? 'error' : 'skip';
      const icon = result.status === 'PASS' ? '✓' : 
                   result.status === 'FAIL' ? '✗' :
                   result.status === 'WARN' ? '⚠' : 
                   result.status === 'ERROR' ? '❌' : '○';
      const hasDetails = result.details && (result.details.request || result.details.reason);
      
      existingEl.className = `result-item result-${statusClass} ${hasDetails ? 'expandable' : ''}`;
      existingEl.setAttribute('data-status', result.status);
      
      existingEl.innerHTML = `
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
      `;
      
      // Re-sort if needed (status changed from FAIL to PASS due to healing)
      this.sortResults();
    } else {
      // If not found, add it
      this.addResult(result);
    }
  },
  
  /**
   * Sort results list in DOM (failures first, then errors, warnings, passes, skips)
   */
  sortResults() {
    const listEl = document.getElementById('results-list');
    if (!listEl) return;
    
    const statusOrder = { FAIL: 0, ERROR: 1, WARN: 2, PASS: 3, SKIP: 4 };
    const items = Array.from(listEl.querySelectorAll('.result-item'));
    
    items.sort((a, b) => {
      const aStatus = a.getAttribute('data-status');
      const bStatus = b.getAttribute('data-status');
      return (statusOrder[aStatus] ?? 5) - (statusOrder[bStatus] ?? 5);
    });
    
    // Re-append in sorted order
    items.forEach(item => listEl.appendChild(item));
  },
  
  /**
   * Clear all results (for new test run)
   */
  clearResults() {
    this._results = [];
    const listEl = document.getElementById('results-list');
    if (listEl) {
      listEl.innerHTML = '';
    }
  },
  
  /**
   * Set/remove healing indicator on a result item
   * @param {string} endpoint - The endpoint string
   * @param {boolean} isHealing - Whether healing is in progress
   */
  setResultHealing(endpoint, isHealing) {
    const resultId = `result-${endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const resultEl = document.getElementById(resultId);
    
    if (resultEl) {
      if (isHealing) {
        resultEl.classList.add('result-healing');
        // Add a healing badge to the header
        const header = resultEl.querySelector('.result-header');
        if (header && !header.querySelector('.healing-badge')) {
          const badge = document.createElement('span');
          badge.className = 'healing-badge';
          badge.innerHTML = '🔄 Healing...';
          header.appendChild(badge);
        }
      } else {
        resultEl.classList.remove('result-healing');
        // Remove the healing badge
        const badge = resultEl.querySelector('.healing-badge');
        if (badge) {
          badge.remove();
        }
      }
    }
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
          
          ${details.executionLog?.length > 0 ? this.renderExecutionLog(details.executionLog) : ''}
          
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
            <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.copyJiraPrompt(this)">
              📋 JIRA Prompt
            </button>
            <button class="btn btn-small btn-fix" onclick="event.stopPropagation(); ResultsViewer.copyFixPrompt(this)">
              🔧 Fix Prompt
            </button>
            <button class="btn btn-small btn-retry" onclick="event.stopPropagation(); ResultsViewer.retryEndpoint(this)">
              🔄 Retry
            </button>
            <button class="btn btn-small btn-skip" onclick="event.stopPropagation(); ResultsViewer.skipEndpoint(this)">
              ⏭️ Skip
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
                  ${details.errors.filter(e => e.reason !== 'PARAM_NAME_MISMATCH').map(e => `
                    <li>
                      <code>${e.path || '/'}</code>: ${e.friendlyMessage || e.message}
                      ${e.keyword ? `<span class="error-keyword">(${e.keyword})</span>` : ''}
                    </li>
                  `).join('')}
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
        
        ${details.executionLog?.length > 0 ? this.renderExecutionLog(details.executionLog) : ''}
        
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
          <button class="btn btn-small" onclick="event.stopPropagation(); ResultsViewer.copyJiraPrompt(this)">
            📋 JIRA Prompt
          </button>
          <button class="btn btn-small btn-fix" onclick="event.stopPropagation(); ResultsViewer.copyFixPrompt(this)">
            🔧 Fix Prompt
          </button>
          <button class="btn btn-small btn-retry" onclick="event.stopPropagation(); ResultsViewer.retryEndpoint(this)">
            🔄 Retry
          </button>
          <button class="btn btn-small btn-skip" onclick="event.stopPropagation(); ResultsViewer.skipEndpoint(this)">
            ⏭️ Skip
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
   * Render execution log section (calls made before healer)
   * @param {Array} executionLog - Array of execution log entries
   * @returns {string} HTML string
   */
  renderExecutionLog(executionLog) {
    if (!executionLog || executionLog.length === 0) return '';
    
    const entries = executionLog.map((entry, index) => {
      let icon, title, content, typeClass;
      
      switch (entry.type) {
        case 'workflow_start':
          icon = '📋';
          title = 'Workflow Started';
          content = entry.hasPrerequisites 
            ? `Executing workflow with ${entry.prerequisiteCount} prerequisite(s)`
            : 'Executing workflow (no prerequisites)';
          typeClass = 'workflow-start';
          break;
        case 'workflow_step_success':
          icon = '✅';
          title = `Step: ${entry.stepId}`;
          content = `${entry.method || 'REQUEST'} → Status ${entry.status}`;
          if (entry.extracted && Object.keys(entry.extracted).length > 0) {
            content += `\nExtracted: ${Object.keys(entry.extracted).join(', ')}`;
          }
          typeClass = 'success';
          break;
        case 'workflow_step_failed':
          icon = '❌';
          title = `Step Failed: ${entry.stepId}`;
          content = entry.error || `Status ${entry.status}`;
          typeClass = 'failed';
          break;
        case 'workflow_complete':
          icon = entry.success ? '✅' : '⚠️';
          title = entry.success ? 'Workflow Completed' : 'Workflow Incomplete';
          content = entry.success 
            ? `Status ${entry.status} (${entry.duration})`
            : `Stopped at phase: ${entry.phase}`;
          typeClass = entry.success ? 'success' : 'warning';
          break;
        case 'workflow_failed':
          icon = '❌';
          title = 'Workflow Failed';
          content = `Phase: ${entry.phase}\nStep: ${entry.failedStep || 'unknown'}\nReason: ${entry.reason}`;
          typeClass = 'failed';
          break;
        case 'workflow_error':
          icon = '⚠️';
          title = 'Workflow Error';
          content = entry.error;
          typeClass = 'warning';
          break;
        case 'api_request':
          icon = '🔗';
          title = `${entry.method} Request`;
          content = `URL: ${entry.url}\nToken: ${entry.tokenType || 'none'}`;
          if (entry.bodyPreview) {
            content += `\nBody: ${entry.bodyPreview}${entry.bodyPreview.length >= 200 ? '...' : ''}`;
          }
          typeClass = 'request';
          break;
        case 'api_response':
          icon = entry.success ? '✅' : '⚠️';
          title = `Response: ${entry.status}`;
          content = `Duration: ${entry.duration}`;
          if (entry.usedFallback) {
            content += '\n(Used fallback URL)';
          }
          if (entry.responsePreview) {
            content += `\n${entry.responsePreview}${entry.responsePreview.length >= 300 ? '...' : ''}`;
          }
          typeClass = entry.success ? 'success' : 'warning';
          break;
        case 'api_error':
          icon = '❌';
          title = 'Request Error';
          content = entry.error || 'Network error';
          typeClass = 'failed';
          break;
        default:
          icon = '•';
          title = entry.type;
          content = JSON.stringify(entry, null, 2);
          typeClass = '';
      }
      
      return `
        <div class="execution-entry ${typeClass}">
          <div class="execution-icon">${icon}</div>
          <div class="execution-content">
            <div class="execution-title">${this.escapeHtml(title)}</div>
            ${content ? `<pre class="execution-code">${this.escapeHtml(content)}</pre>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div class="execution-log">
        <h5>📝 Execution Log (Pre-Healer)</h5>
        <div class="execution-timeline">
          ${entries}
        </div>
      </div>
    `;
  },
  
  /**
   * Render healing info section
   * @param {Object} healingInfo - Healing info from result
   * @returns {string} HTML string
   */
  renderHealingInfo(healingInfo) {
    if (!healingInfo) return '';
    
    const isSuccess = !healingInfo.failed && !healingInfo.skipSuggestion;
    const isSkipSuggestion = healingInfo.skipSuggestion;
    const statusIcon = isSuccess ? '✓' : (isSkipSuggestion ? '⏭️' : '✗');
    const statusClass = isSuccess ? 'success' : (isSkipSuggestion ? 'skip-suggestion' : 'failed');
    const statusText = isSuccess ? 'Succeeded' : (isSkipSuggestion ? 'Suggests Skip' : 'Failed');
    
    // Build healing history timeline - support both old and new formats
    const historyHtml = healingInfo.agentLog 
      ? this.renderAgentLog(healingInfo.agentLog)
      : this.renderHealingHistory(healingInfo.healingHistory);
    
    // Skip suggestion button
    const skipSuggestionHtml = isSkipSuggestion ? `
      <div class="skip-suggestion-box">
        <div class="skip-reason">
          <strong>⚠️ AI suggests this test should be skipped:</strong>
          <p>${this.escapeHtml(healingInfo.skipReason || 'No reason provided')}</p>
        </div>
        <button class="btn btn-warning btn-approve-skip" onclick="event.stopPropagation(); ResultsViewer.approveSkip(this)">
          ✓ Approve Skip
        </button>
        <small class="skip-note">Approving will save this as a skip workflow for future runs</small>
      </div>
    ` : '';
    
    return `
      <div class="healing-summary ${statusClass}">
        <h4>${statusIcon} Self-Healing ${statusText}</h4>
        ${skipSuggestionHtml}
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
   * Copy JIRA ticket creation prompt to clipboard
   * @param {HTMLElement} button - Button element clicked
   */
  async copyJiraPrompt(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    if (!result) {
      alert('Could not find endpoint data');
      return;
    }
    
    const details = result.details || {};
    const healingInfo = details.healingInfo || {};
    const request = details.request || {};
    const response = details.response || {};
    
    // Build error list (include all errors, not just first 5)
    const errors = (details.errors || [])
      .map(e => `- ${e.path || '/'}: ${e.friendlyMessage || e.message}`)
      .join('\n');
    
    // Build documentation issues list from AI agent
    const docIssues = (healingInfo.docFixSuggestions || details.documentationIssues || [])
      .map(d => `- **${d.field || '/'}**: ${d.issue || d.message}\n  - Suggested fix: ${d.suggested_fix || d.suggestedFix || d.suggestion || 'N/A'}${d.source_code_reference || d.sourceCodeReference ? `\n  - Source: \`${d.source_code_reference || d.sourceCodeReference}\`` : ''}`)
      .join('\n');
    
    // Format request body (truncate if too large)
    let requestBody = '';
    if (request.body || request.data) {
      const bodyStr = JSON.stringify(request.body || request.data, null, 2);
      requestBody = bodyStr.length > 2000 ? bodyStr.substring(0, 2000) + '\n... [truncated]' : bodyStr;
    }
    
    // Format response data (truncate if too large)
    let responseData = '';
    if (response.data) {
      const dataStr = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
      responseData = dataStr.length > 2000 ? dataStr.substring(0, 2000) + '\n... [truncated]' : dataStr;
    }
    
    // Build agent log summary
    const agentLogSummary = this.formatAgentLogForPrompt(healingInfo.agentLog || []);
    
    // Build the comprehensive prompt
    const prompt = `Fix this documentation error:
- Look at api-validation/docs/healing-knowledge-base for possible common scenarios.
- Make sure to dig deep into the code start with frontage to see how this is implemented in the frontend and then move to the controller code.
- Never alter mcp_swagger files (auto-generated). Always use /swagger directory

Create a JIRA ticket for the following API validation failure.

## Epic
Associate this ticket with epic: https://myvcita.atlassian.net/browse/VCITA2-11611

## Failure Details

**Endpoint**: ${result.endpoint}
**HTTP Status**: ${result.httpStatus || 'N/A'}
**Status**: ${result.status}
**Failure Reason**: ${details.reason || 'Unknown'}

## Error Description
${details.friendlyMessage || 'No details available'}

${errors ? `## Validation Errors\n${errors}\n` : ''}
${docIssues ? `## Documentation Issues (AI-Detected)\n${docIssues}\n` : ''}
${details.suggestion ? `## Suggested Fix\n${details.suggestion}\n` : ''}
${healingInfo.attempted || healingInfo.iterations > 0 ? `## Self-Healing Attempt
- Attempted: ${healingInfo.attempted || healingInfo.iterations > 0}
- Iterations: ${healingInfo.iterations || 0}
- Retries: ${healingInfo.retryCount || 0}
- Result: ${healingInfo.summary || healingInfo.reason || 'No summary'}
` : ''}
${request.method ? `## Request Details
- Method: ${request.method}
- Path: ${request.path || request.url || 'N/A'}
${requestBody ? `- Body:\n\`\`\`json\n${requestBody}\n\`\`\`` : ''}
` : ''}
${response.status ? `## Response Details
- Status: ${response.status}
- Data:
\`\`\`json
${responseData || 'N/A'}
\`\`\`
` : ''}
${agentLogSummary ? `## 🤖 AI Agent Log
${agentLogSummary}
` : ''}
## Instructions
1. Investigate the root cause of this failure
2. Assume this is a documentation bug
3. Fix either the documentation or the workflow. do not change source code.
4. Make sure to validate your fixes with the source code

## Token Used
${result.tokenUsed || 'Unknown'}

## Swagger File
${result.swaggerFile || result.domain || 'Unknown'}`;

    try {
      await navigator.clipboard.writeText(prompt);
      
      // Visual feedback
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.backgroundColor = '#4caf50';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: show in a textarea modal
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;z-index:10000;padding:20px;font-family:monospace;font-size:12px;';
      document.body.appendChild(textarea);
      textarea.select();
      alert('Press Ctrl+C to copy, then click OK to close');
      document.body.removeChild(textarea);
    }
  },
  
  /**
   * Format agent log for JIRA prompt (readable summary)
   * @param {Array} agentLog - Array of agent log entries
   * @returns {string} Formatted log summary
   */
  formatAgentLogForPrompt(agentLog) {
    if (!agentLog || agentLog.length === 0) return '';
    
    const lines = [];
    
    for (const entry of agentLog) {
      const iteration = entry.iteration || '?';
      
      switch (entry.type) {
        case 'thought':
          // Include first 200 chars of thought
          const thoughtText = (entry.content || '').substring(0, 200);
          lines.push(`🔧 **Tool: \`${entry.tool}\`**`);
          if (entry.input && Object.keys(entry.input).length > 0) {
            const inputStr = JSON.stringify(entry.input, null, 2);
            lines.push('```json');
            lines.push(inputStr.length > 500 ? inputStr.substring(0, 500) + '\n...' : inputStr);
            lines.push('```');
          }
          break;
          
        case 'tool_call':
          lines.push(`🔧 **Tool: \`${entry.tool}\`**`);
          if (entry.input && Object.keys(entry.input).length > 0) {
            const inputStr = JSON.stringify(entry.input, null, 2);
            lines.push('```json');
            lines.push(inputStr.length > 500 ? inputStr.substring(0, 500) + '\n...' : inputStr);
            lines.push('```');
          }
          break;
          
        case 'tool_result':
          const resultIcon = entry.result?.success ? '✅' : '❌';
          const httpStatus = entry.result?.status ? ` (HTTP ${entry.result.status})` : '';
          lines.push(`${resultIcon} **Result: \`${entry.tool}\`${httpStatus}**`);
          
          if (entry.result) {
            const resultStr = JSON.stringify(entry.result, null, 2);
            lines.push('```json');
            lines.push(resultStr.length > 800 ? resultStr.substring(0, 800) + '\n... [truncated]' : resultStr);
            lines.push('```');
          }
          break;
          
        case 'no_action':
          lines.push(`⚠️ **Agent Stopped:** ${entry.content || 'No action taken'}`);
          break;
          
        case 'max_retries':
          lines.push(`⛔ **Max Retries Reached** (${entry.retryCount} retries)`);
          break;
      }
    }
    
    return lines.join('\n');
  },
  
  /**
   * Copy fix documentation prompt to clipboard
   * @param {HTMLElement} button - Button element clicked
   */
  async copyFixPrompt(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    if (!result) {
      alert('Could not find endpoint data');
      return;
    }
    
    const details = result.details || {};
    const healingInfo = details.healingInfo || {};
    const request = details.request || {};
    const response = details.response || {};
    
    // Build error list (include all)
    const errors = (details.errors || [])
      .map(e => `- ${e.path || '/'}: ${e.friendlyMessage || e.message}`)
      .join('\n');
    
    // Build documentation issues list from AI agent
    const docIssues = (healingInfo.docFixSuggestions || details.documentationIssues || [])
      .map(d => `- **${d.field || '/'}**: ${d.issue || d.message}\n  - Suggested fix: ${d.suggested_fix || d.suggestedFix || d.suggestion || 'N/A'}${d.source_code_reference || d.sourceCodeReference ? `\n  - Source: \`${d.source_code_reference || d.sourceCodeReference}\`` : ''}`)
      .join('\n');
    
    // Format request body
    let requestBody = '';
    if (request.body || request.data) {
      const bodyStr = JSON.stringify(request.body || request.data, null, 2);
      requestBody = bodyStr.length > 2000 ? bodyStr.substring(0, 2000) + '\n... [truncated]' : bodyStr;
    }
    
    // Truncate response data if too long
    let responseData = '';
    if (response.data) {
      const jsonStr = typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data;
      responseData = jsonStr.length > 2000 ? jsonStr.substring(0, 2000) + '... [truncated]' : jsonStr;
    }
    
    // Build agent log summary (condensed for fix prompt)
    const agentLogSummary = this.formatAgentLogForPrompt(healingInfo.agentLog || []);
    
    // Build the prompt
    const prompt = `Fix this documentation error:
- Look at api-validation/docs/healing-knowledge-base for possible common scenarios.
- Make sure to dig deep into the code start with frontage to see how this is implemented in the frontend and then move to the controller code.
- Never alter mcp_swagger files (auto-generated). Always use /swagger directory

## Failure Details

**Endpoint**: ${result.endpoint}
**HTTP Status**: ${result.httpStatus || 'N/A'}
**Status**: ${result.status}
**Failure Reason**: ${details.reason || 'Unknown'}

## Error Description
${details.friendlyMessage || 'No details available'}

${errors ? `## Validation Errors\n${errors}\n` : ''}
${docIssues ? `## Documentation Issues (AI-Detected)\n${docIssues}\n` : ''}
${details.suggestion ? `## Suggested Fix\n${details.suggestion}\n` : ''}
${healingInfo.summary ? `## AI Agent Summary\n${healingInfo.summary}\n` : ''}
${request.method ? `## Request Details
- Method: ${request.method}
- Path: ${request.path || request.url || 'N/A'}
${requestBody ? `- Body:\n\`\`\`json\n${requestBody}\n\`\`\`` : ''}
` : ''}
${response.status ? `## Response Details
- Status: ${response.status}
- Data:
\`\`\`json
${responseData || 'N/A'}
\`\`\`
` : ''}
${agentLogSummary ? `## 🤖 AI Agent Log
${agentLogSummary}
` : ''}
## Instructions
1. Investigate the root cause of this failure
2. Assume this is a documentation bug
3. Fix either the documentation or the workflow. do not change source code.
4. Make sure to validate your fixes with the source code
5. **Test your fix by running the actual workflow against the real API**
6. **Definition of Done: A 200 (or 2xx) response from the API**

## Token Used
${result.tokenUsed || 'Unknown'}

## Swagger File
${result.swaggerFile || result.domain || 'Unknown'}`;

    try {
      await navigator.clipboard.writeText(prompt);
      
      // Visual feedback
      const originalText = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.backgroundColor = '#4caf50';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: show in a textarea modal
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      textarea.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:80%;height:60%;z-index:10000;padding:20px;font-family:monospace;font-size:12px;';
      document.body.appendChild(textarea);
      textarea.select();
      alert('Press Ctrl+C to copy, then click OK to close');
      document.body.removeChild(textarea);
    }
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
    button.innerHTML = '📄 Reloading Swagger...';
    
    try {
      // First, reload swagger files to pick up any documentation changes
      const reloadResponse = await fetch('/api/reload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (reloadResponse.ok) {
        const reloadData = await reloadResponse.json();
        console.log(`Swagger reloaded: ${reloadData.endpointsLoaded} endpoints from ${reloadData.domains?.length || 0} domains`);
      } else {
        console.warn('Failed to reload swagger files, proceeding with cached version');
      }
      
      button.innerHTML = '⏳ Retrying...';
      
      // Clear old progress log entry for this endpoint so only the new retry's log is shown
      const entryId = endpointText.replace(/[^a-zA-Z0-9]/g, '-');
      const oldLogEntry = document.getElementById(`log-${entryId}`);
      if (oldLogEntry) {
        oldLogEntry.remove();
      }
      
      // Collapse and reset the old result details to avoid showing stale data
      const resultId = `result-${entryId}`;
      const resultEl = document.getElementById(resultId);
      if (resultEl) {
        resultEl.classList.remove('expanded');
        // Clear old details content
        const oldDetails = resultEl.querySelector('.result-details');
        if (oldDetails) {
          oldDetails.remove();
        }
        // Update status to show retrying
        const statusEl = resultEl.querySelector('.result-status');
        if (statusEl) {
          statusEl.className = 'result-status status-healing';
          statusEl.textContent = 'RETRYING';
        }
      }
      
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
            enableHealing: true,
            aiOptions: {
              autoFixSwagger: document.getElementById('auto-fix-swagger')?.checked ?? false
            }
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
      
      // Show progress section without scrolling the page
      const scrollY = window.scrollY;
      document.getElementById('progress-section')?.classList.remove('hidden');
      window.scrollTo(0, scrollY);
      
      // Wire healing events into the TestRunner healing log
      eventSource.addEventListener('healing_start', (event) => {
        const data = JSON.parse(event.data);
        button.innerHTML = '🔧 Healing...';
        TestRunner.initHealingLog(data.endpoint);
        TestRunner.appendHealingLog(data.endpoint, '🤖', 'AI Agent starting...', 'start');
        ResultsViewer.setResultHealing(data.endpoint, true);
      });
      
      eventSource.addEventListener('healing_analyzing', (event) => {
        const data = JSON.parse(event.data);
        button.innerHTML = '🤖 AI Analyzing...';
        const msg = data.thought ? `Thinking: ${data.thought.substring(0, 80)}...` : 
                    data.iteration ? `Iteration ${data.iteration}` : 'Analyzing...';
        TestRunner.appendHealingLog(data.endpoint || endpointText, '🤔', msg, 'thinking');
      });
      
      eventSource.addEventListener('healing_action', (event) => {
        const data = JSON.parse(event.data);
        const { icon, label } = TestRunner.getHealingActionDisplay(data.action);
        const detail = data.details ? `: ${data.details.substring(0, 120)}${data.details.length > 120 ? '...' : ''}` : '';
        TestRunner.appendHealingLog(data.endpoint || endpointText, icon, `${label}${detail}`, data.action);
      });
      
      eventSource.addEventListener('healing_creating', (event) => {
        const data = JSON.parse(event.data);
        button.innerHTML = '📦 Creating...';
        const action = data.input ? `${data.tool}: ${data.input.method || ''} ${data.input.path || ''}` : data.tool;
        TestRunner.appendHealingLog(data.endpoint || endpointText, '🔧', action, 'tool-call');
      });
      
      eventSource.addEventListener('healing_created', (event) => {
        const data = JSON.parse(event.data);
        const icon = data.success ? '✅' : '❌';
        TestRunner.appendHealingLog(data.endpoint || endpointText, icon, `Result: ${data.status || 'done'}`, data.success ? 'success' : 'failed');
      });
      
      eventSource.addEventListener('swagger_file_updated', (event) => {
        const data = JSON.parse(event.data);
        TestRunner.appendHealingLog(data.endpoint || endpointText, '📝', `Updated: ${data.file} - ${data.description}`, 'swagger');
      });
      
      eventSource.addEventListener('healing_complete', (event) => {
        const data = JSON.parse(event.data);
        let status, icon, msg;
        if (data.success) {
          status = data.hasDocumentationIssues ? 'WARN' : 'PASS';
          icon = data.hasDocumentationIssues ? '⚠️' : '✅';
          msg = data.hasDocumentationIssues ? `Fixed but docs need update! ${data.summary || ''}` : `Fixed! ${data.summary || ''}`;
        } else {
          status = 'FAIL';
          icon = '❌';
          msg = `Failed: ${data.reason || ''}`;
        }
        TestRunner.appendHealingLog(data.endpoint || endpointText, icon, msg, status === 'PASS' ? 'success' : 'failed');
        TestRunner.finalizeHealingLog(data.endpoint || endpointText, status, `${icon} ${msg}`);
        ResultsViewer.setResultHealing(data.endpoint || endpointText, false);
      });
      
      // Handle completion
      eventSource.addEventListener('result', (event) => {
        const newResult = JSON.parse(event.data);
        
        // Update the result in our list
        const index = this._results.findIndex(r => r.endpoint === endpointText);
        if (index !== -1) {
          this._results[index] = newResult;
        } else {
          // If not found, add it
          this._results.push(newResult);
        }
        
        // Update just this result (not entire list) to preserve DOM references
        this.updateResult(newResult);
        
        // Update summary counts immediately
        this.updateSummaryCounts();
        
        // Find the new button after DOM update
        const newResultId = `result-${newResult.endpoint.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const newResultEl = document.getElementById(newResultId);
        const newButton = newResultEl?.querySelector('.btn-retry');
        
        // Show status on the new button
        const statusIcon = newResult.status === 'PASS' ? '✅' : 
                          newResult.status === 'WARN' ? '⚠️' :
                          newResult.status === 'ERROR' ? '🔶' : '❌';
        
        if (newButton) {
          newButton.innerHTML = `${statusIcon} ${newResult.status}`;
          newButton.disabled = true;
          
          setTimeout(() => {
            newButton.innerHTML = originalText;
            newButton.disabled = false;
          }, 2000);
        }
      });
      
      eventSource.addEventListener('complete', () => {
        eventSource.close();
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
   * Approve a skip suggestion and save it as a workflow
   * @param {HTMLElement} button - The approve skip button element
   */
  async approveSkip(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    if (!result) {
      alert('Could not find endpoint data');
      return;
    }
    
    const healingInfo = result.details?.healingInfo;
    const skipReason = healingInfo?.skipReason || 'User approved skip';
    
    // Extract method and path from endpoint text
    const [method, ...pathParts] = endpointText.split(' ');
    const path = pathParts.join(' ');
    
    // Confirm with user
    if (!confirm(`Approve skip for ${endpointText}?\n\nReason: ${skipReason}\n\nThis will save a skip workflow for future runs.`)) {
      return;
    }
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Saving...';
    
    try {
      const response = await fetch('/api/validate/approve-skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: endpointText,
          method,
          path,
          domain: result.domain || 'general',
          skipReason
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update result status to SKIP
        result.status = 'SKIP';
        result.reason = 'EXPECTED_ERROR';
        result.details.healingInfo.skipped = true;
        result.details.healingInfo.skipSuggestion = false;
        
        // Update the result in the DOM
        const statusBadge = resultItem.querySelector('.status-badge');
        if (statusBadge) {
          statusBadge.className = 'status-badge status-skip';
          statusBadge.textContent = '⏭️ SKIP';
        }
        resultItem.className = resultItem.className.replace(/result-\w+/, 'result-skip');
        
        // Hide the approve button and show confirmation
        const skipBox = button.closest('.skip-suggestion-box');
        if (skipBox) {
          skipBox.innerHTML = `
            <div class="skip-approved">
              ✅ Skip approved and saved to workflow
              <small>Workflow: ${data.workflowFile}</small>
            </div>
          `;
        }
        
        // Update summary counts
        this.updateSummaryCounts();
        
        button.innerHTML = '✅ Approved';
      } else {
        throw new Error(data.message || 'Failed to approve skip');
      }
      
    } catch (error) {
      console.error('Approve skip failed:', error);
      button.innerHTML = '❌ Failed';
      alert(`Failed to approve skip: ${error.message}`);
      setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
      }, 2000);
    }
  },
  
  /**
   * Skip an endpoint manually (available for all endpoints)
   * @param {HTMLElement} button - The skip button element
   */
  async skipEndpoint(button) {
    const resultItem = button.closest('.result-item');
    const endpointText = resultItem?.querySelector('.result-endpoint')?.textContent || '';
    
    // Find the result data
    const result = this._results.find(r => r.endpoint === endpointText);
    if (!result) {
      alert('Could not find endpoint data');
      return;
    }
    
    // Extract method and path from endpoint text
    const [method, ...pathParts] = endpointText.split(' ');
    const path = pathParts.join(' ');
    
    // Prompt user for skip reason
    const skipReason = prompt(
      `Enter reason for skipping ${endpointText}:\n\n(This will save a skip workflow for future runs)`,
      'Manual skip - endpoint not ready for testing'
    );
    
    if (!skipReason) {
      return; // User cancelled
    }
    
    // Disable button and show loading state
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Saving...';
    
    try {
      const response = await fetch('/api/validate/approve-skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: endpointText,
          method,
          path,
          domain: result.domain || 'general',
          skipReason
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update result status to SKIP
        result.status = 'SKIP';
        result.reason = 'USER_SKIPPED';
        if (!result.details) result.details = {};
        if (!result.details.healingInfo) result.details.healingInfo = {};
        result.details.healingInfo.skipped = true;
        result.details.healingInfo.skipReason = skipReason;
        
        // Update the result in the DOM
        resultItem.className = resultItem.className.replace(/result-(pass|fail|warn|error)/, 'result-skip');
        resultItem.setAttribute('data-status', 'SKIP');
        
        const statusBadge = resultItem.querySelector('.result-status');
        if (statusBadge) {
          statusBadge.className = 'result-status status-skip';
          statusBadge.textContent = 'SKIP';
        }
        
        const iconSpan = resultItem.querySelector('.result-icon');
        if (iconSpan) {
          iconSpan.textContent = '○';
        }
        
        // Update summary counts
        this.updateSummaryCounts();
        
        // Re-sort results (skips go to end)
        this.sortResults();
        
        button.innerHTML = '✅ Skipped';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.disabled = false;
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to skip endpoint');
      }
      
    } catch (error) {
      console.error('Skip endpoint failed:', error);
      button.innerHTML = '❌ Failed';
      alert(`Failed to skip endpoint: ${error.message}`);
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
        'Doc Fix Suggestions',
        'Workflow Status',
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
        
        // Doc fix suggestions (verified by AI agent)
        const docFixSuggestions = (healingInfo.docFixSuggestions || [])
          .map(s => `[${s.severity}] ${s.field}: ${s.issue} → ${s.suggested_fix || s.suggestedFix}`)
          .join('; ');
        
        // Workflow status
        const workflowStatus = healingInfo.workflowStatus || 'N/A';
        
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
          docFixSuggestions,
          workflowStatus,
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
      const environment = AppState?.config?.environment || 'dev';
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
        environment: AppState?.config?.environment || 'dev',
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
      swaggerFileChanges: TestRunner.getSwaggerFileChanges(),
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
  },

  /**
   * Save a comprehensive report optimized for AI agents and JIRA tickets
   */
  async saveFullReport() {
    if (!this._results || this._results.length === 0) {
      alert('No results to save. Run a validation first.');
      return;
    }
    
    // Prompt user for a test title
    this.showReportTitleDialog();
  },
  
  /**
   * Show a dialog to get the report title from the user
   */
  showReportTitleDialog() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('report-title-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'report-title-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content report-title-modal-content">
          <div class="modal-header">
            <h2>💾 Save Test Report</h2>
            <button class="modal-close" onclick="document.getElementById('report-title-modal').classList.add('hidden')">&times;</button>
          </div>
          <div class="modal-body">
            <p>Enter a title for this test run. The date will be added automatically.</p>
            <div class="form-group">
              <label for="report-title-input">Report Title</label>
              <input type="text" id="report-title-input" class="form-input" 
                placeholder="e.g., ai-endpoints, billing-api, user-auth" 
                autocomplete="off" />
              <small class="form-hint">Use lowercase with hyphens (e.g., "ai-endpoints")</small>
            </div>
            <div class="form-preview">
              <strong>Folder preview:</strong>
              <code id="report-folder-preview">-</code>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="document.getElementById('report-title-modal').classList.add('hidden')">Cancel</button>
            <button class="btn btn-primary" onclick="ResultsViewer.confirmSaveReport()">Save Report</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Add input event listener to update preview
      const input = document.getElementById('report-title-input');
      input.addEventListener('input', () => {
        this.updateReportFolderPreview();
      });
      
      // Handle enter key
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.confirmSaveReport();
        }
      });
    }
    
    // Reset input
    const input = document.getElementById('report-title-input');
    input.value = '';
    this.updateReportFolderPreview();
    
    // Show modal and focus input
    modal.classList.remove('hidden');
    setTimeout(() => input.focus(), 100);
  },
  
  /**
   * Update the folder name preview based on user input
   */
  updateReportFolderPreview() {
    const input = document.getElementById('report-title-input');
    const preview = document.getElementById('report-folder-preview');
    
    // Sanitize title: lowercase, replace spaces with hyphens, remove special chars
    let title = (input.value || 'untitled')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!title) title = 'untitled';
    
    // Generate timestamp preview
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-'); // HH-MM-SS
    
    preview.textContent = `${title}-${dateStr}-${timeStr}`;
  },
  
  /**
   * Confirm and actually save the report
   */
  async confirmSaveReport() {
    const input = document.getElementById('report-title-input');
    
    // Sanitize title
    let title = (input.value || 'untitled')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    if (!title) title = 'untitled';
    
    // Hide the title dialog
    document.getElementById('report-title-modal').classList.add('hidden');
    
    try {
      // Build comprehensive report object with the user-provided title
      const report = this.buildComprehensiveReport(title);
      
      // Request report generation from server
      const response = await fetch('/api/report/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Show success modal with file locations
        this.showReportSavedModal(result);
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
      
    } catch (error) {
      console.error('Failed to save report:', error);
      alert(`Failed to save report: ${error.message}`);
    }
  },

  /**
   * Show modal with saved report information
   * @param {Object} result - Server response with file paths
   */
  showReportSavedModal(result) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('report-saved-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'report-saved-modal';
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content report-saved-modal-content">
          <div class="modal-header">
            <h2>📊 Report Saved Successfully</h2>
            <button class="modal-close" onclick="document.getElementById('report-saved-modal').classList.add('hidden')">&times;</button>
          </div>
          <div class="modal-body" id="report-saved-body"></div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    // Build content
    const summary = result.summary || {};
    const bodyContent = `
      <div class="report-saved-summary">
        <h3>Summary</h3>
        <div class="summary-stats">
          <span class="stat">📋 Total: ${summary.total || 0}</span>
          <span class="stat pass">✅ Passed: ${summary.passed || 0}</span>
          <span class="stat fail">❌ Failed: ${summary.failed || 0}</span>
          <span class="stat">📝 Doc Issues: ${summary.documentationIssues || 0}</span>
        </div>
      </div>
      
      <div class="report-saved-location">
        <h3>📁 Report Location</h3>
        <code class="report-path">${result.reportDir || 'Unknown'}</code>
      </div>
      
      <div class="report-saved-files">
        <h3>Files Generated</h3>
        <table class="files-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><code>ai-fixes.md</code></td>
              <td>Documentation issues for AI agent to fix</td>
            </tr>
            <tr>
              <td><code>test-failures.md</code></td>
              <td>Test failures grouped by failure reason with severity</td>
            </tr>
            <tr>
              <td><code>data.json</code></td>
              <td>Raw JSON data for automation</td>
            </tr>
            <tr>
              <td><code>README.md</code></td>
              <td>Report summary and usage instructions</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div class="report-saved-actions">
        <h3>Quick Actions</h3>
        <div class="action-buttons">
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('${result.reportDir}'); this.textContent='Copied!'">
            📋 Copy Path
          </button>
          <button class="btn btn-secondary" onclick="navigator.clipboard.writeText('cursor ${result.reportDir}/ai-fixes.md @handle_report'); this.textContent='Copied!'">
            🤖 Copy AI Fix Command
          </button>
        </div>
        <div class="action-hint">
          <small>💡 The AI Fix command includes <code>@handle_report</code> directive which ensures:</small>
          <ul>
            <li>Only documentation changes (no code fixes)</li>
            <li>Never removes endpoints</li>
            <li>Creates JIRA tickets for code issues</li>
          </ul>
        </div>
      </div>
    `;
    
    document.getElementById('report-saved-body').innerHTML = bodyContent;
    modal.classList.remove('hidden');
  },

  /**
   * Build a comprehensive report object optimized for AI agents and JIRA
   * @param {string} [title] - Optional report title provided by user
   * @returns {Object} Comprehensive report object
   */
  buildComprehensiveReport(title = null) {
    const results = this._results || [];
    const timestamp = new Date().toISOString();
    const environment = AppState?.config?.environment || 'dev';
    
    // Basic stats
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    const warned = results.filter(r => r.status === 'WARN').length;
    const errored = results.filter(r => r.status === 'ERROR').length;
    const skipped = results.filter(r => r.status === 'SKIP').length;
    const testable = results.length - skipped;
    const passRate = testable > 0 ? ((passed / testable) * 100).toFixed(1) : 0;
    
    // Collect all documentation issues for AI fixing
    const documentationIssues = [];
    const failedTests = [];
    const erroredTests = [];
    const warnedTests = [];
    
    for (const result of results) {
      const details = result.details || {};
      const healingInfo = details.healingInfo || {};
      
      // Collect doc fix suggestions (verified by AI healing agent)
      if (healingInfo.docFixSuggestions?.length > 0) {
        for (const fix of healingInfo.docFixSuggestions) {
          documentationIssues.push({
            endpoint: result.endpoint,
            method: result.method,
            path: result.path,
            domain: result.domain,
            field: fix.field,
            issue: fix.issue,
            suggestedFix: fix.suggested_fix || fix.suggestedFix,
            severity: fix.severity || 'minor',
            sourceCodeReference: fix.source_code_reference,
            swaggerFile: result.swaggerFile
          });
        }
      }
      
      // Collect documentation issues from validation
      if (details.documentationIssues?.length > 0) {
        for (const issue of details.documentationIssues) {
          documentationIssues.push({
            endpoint: result.endpoint,
            method: result.method,
            path: result.path,
            domain: result.domain,
            field: issue.field,
            issue: issue.message || issue.issue,
            suggestedFix: issue.suggestion || issue.suggested_fix,
            severity: issue.severity || 'minor',
            swaggerFile: result.swaggerFile,
            type: issue.type
          });
        }
      }
      
      // Collect schema validation errors as documentation issues
      // These indicate mismatches between API response and swagger schema
      if (details.errors?.length > 0) {
        for (const error of details.errors) {
          // Skip if this error is already in documentationIssues
          const alreadyIncluded = documentationIssues.some(
            d => d.endpoint === result.endpoint && d.field === error.path && d.issue === error.message
          );
          if (alreadyIncluded) continue;
          
          // Determine severity based on error type
          let severity = 'minor';
          if (error.reason === 'SCHEMA_MISMATCH') {
            severity = 'major';
          } else if (error.reason === 'ENDPOINT_NOT_FOUND' || error.reason === 'SERVER_ERROR') {
            severity = 'critical';
          }
          
          // Build suggested fix based on error type
          let suggestedFix = error.suggestion || '';
          if (!suggestedFix && error.reason === 'SCHEMA_MISMATCH') {
            suggestedFix = `Update swagger schema to match actual API response. Field ${error.path || '/'}: ${error.friendlyMessage || error.message}`;
          } else if (!suggestedFix && error.reason === 'TOKEN_TYPE_NOT_DOCUMENTED') {
            suggestedFix = 'Add token availability to the endpoint description (e.g., "Available for **Staff Tokens**")';
          }
          
          documentationIssues.push({
            endpoint: result.endpoint,
            method: result.method,
            path: result.path,
            domain: result.domain,
            field: error.path || '/',
            issue: error.friendlyMessage || error.message,
            suggestedFix: suggestedFix,
            severity: severity,
            swaggerFile: result.swaggerFile,
            type: error.reason || 'VALIDATION_ERROR',
            keyword: error.keyword
          });
        }
      }
      
      // Categorize failed tests for JIRA
      if (result.status === 'FAIL') {
        failedTests.push(this.buildJiraItem(result));
      } else if (result.status === 'ERROR') {
        erroredTests.push(this.buildJiraItem(result));
      } else if (result.status === 'WARN') {
        warnedTests.push(this.buildJiraItem(result));
      }
    }
    
    // Group documentation issues by swagger file (for AI agent)
    const docIssuesByFile = {};
    for (const issue of documentationIssues) {
      const file = issue.swaggerFile || issue.domain || 'unknown';
      if (!docIssuesByFile[file]) {
        docIssuesByFile[file] = [];
      }
      docIssuesByFile[file].push(issue);
    }
    
    // Group failed tests by reason (for JIRA tickets)
    const failuresByReason = {};
    for (const item of [...failedTests, ...erroredTests]) {
      const reason = item.reason || 'UNKNOWN';
      if (!failuresByReason[reason]) {
        failuresByReason[reason] = [];
      }
      failuresByReason[reason].push(item);
    }
    
    // Group by domain
    const byDomain = {};
    for (const result of results) {
      const domain = result.domain || 'unknown';
      if (!byDomain[domain]) {
        byDomain[domain] = { passed: 0, failed: 0, warned: 0, errored: 0, skipped: 0, total: 0, items: [] };
      }
      byDomain[domain].total++;
      byDomain[domain].items.push({
        endpoint: result.endpoint,
        status: result.status,
        httpStatus: result.httpStatus,
        reason: result.details?.reason
      });
      if (result.status === 'PASS') byDomain[domain].passed++;
      else if (result.status === 'FAIL') byDomain[domain].failed++;
      else if (result.status === 'WARN') byDomain[domain].warned++;
      else if (result.status === 'ERROR') byDomain[domain].errored++;
      else if (result.status === 'SKIP') byDomain[domain].skipped++;
    }
    
    return {
      metadata: {
        title: title || environment,  // User-provided title or fall back to environment
        timestamp,
        environment,
        baseUrl: AppState?.config?.baseUrl || '',
        generatedBy: 'API Validation Tool',
        version: '1.0.0'
      },
      summary: {
        total: results.length,
        passed,
        failed,
        warned,
        errored,
        skipped,
        passRate: `${passRate}%`,
        documentationIssuesCount: documentationIssues.length
      },
      // Section for AI agent to fix documentation
      forAiAgent: {
        description: 'Documentation issues discovered during API validation. Each issue includes the endpoint, field, problem description, and suggested fix. Use this to update swagger/openapi specification files.',
        issuesByFile: docIssuesByFile,
        allIssues: documentationIssues
      },
      // Section for JIRA ticket creation
      forJira: {
        description: 'Failed and errored tests grouped by failure reason. Each group can become a JIRA ticket.',
        failuresByReason,
        failedTests,
        erroredTests,
        warnedTests,
        byDomain
      },
      // Raw results for reference
      rawResults: results.map(r => ({
        endpoint: r.endpoint,
        method: r.method,
        path: r.path,
        domain: r.domain,
        status: r.status,
        httpStatus: r.httpStatus,
        duration: r.duration,
        tokenUsed: r.tokenUsed,
        reason: r.details?.reason,
        errors: r.details?.errors,
        healingInfo: r.details?.healingInfo ? {
          attempted: r.details.healingInfo.attempted,
          iterations: r.details.healingInfo.iterations,
          retryCount: r.details.healingInfo.retryCount,
          summary: r.details.healingInfo.summary,
          docFixSuggestions: r.details.healingInfo.docFixSuggestions,
          agentLog: r.details.healingInfo.agentLog // Full agent history
        } : null
      }))
    };
  },

  /**
   * Build a JIRA-friendly item from a result
   * @param {Object} result - Test result
   * @returns {Object} JIRA item
   */
  buildJiraItem(result) {
    const details = result.details || {};
    const healingInfo = details.healingInfo || {};
    
    // Build error summary
    const errorSummary = (details.errors || [])
      .slice(0, 3)
      .map(e => e.friendlyMessage || e.message || e.reason)
      .join('; ');
    
    // Build list of all errors (not just summary)
    const allErrors = (details.errors || []).map(e => ({
      path: e.path || '/',
      message: e.friendlyMessage || e.message,
      reason: e.reason,
      keyword: e.keyword,
      suggestion: e.suggestion
    }));
    
    // Collect documentation issues from multiple sources
    const documentationIssues = [
      ...(healingInfo.docFixSuggestions || []),
      ...(details.documentationIssues || [])
    ].map(d => ({
      field: d.field || '/',
      issue: d.issue || d.message,
      suggestedFix: d.suggested_fix || d.suggestedFix || d.suggestion,
      sourceCodeReference: d.source_code_reference || d.sourceCodeReference,
      severity: d.severity,
      type: d.type
    }));
    
    return {
      endpoint: result.endpoint,
      method: result.method,
      path: result.path,
      domain: result.domain,
      swaggerFile: result.swaggerFile || result.domain, // Fallback to domain if swagger file not set
      status: result.status,
      httpStatus: result.httpStatus,
      tokenUsed: result.tokenUsed,
      duration: result.duration,
      reason: details.reason,
      reasonDescription: details.friendlyMessage,
      errorSummary,
      allErrors,
      documentationIssues,
      suggestion: details.suggestion,
      // Healing attempt info
      healingAttempted: healingInfo.attempted || healingInfo.iterations > 0 || false,
      healingIterations: healingInfo.iterations,
      healingRetryCount: healingInfo.retryCount,
      healingFailed: healingInfo.failed,
      healingReason: healingInfo.reason,
      healingSummary: healingInfo.summary,
      // Full agent log for analysis
      agentLog: healingInfo.agentLog || [],
      // Request/response for debugging (full objects)
      request: details.request ? {
        method: details.request.method,
        url: details.request.url,
        path: details.request.path,
        headers: details.request.headers,
        params: details.request.params,
        body: details.request.body,
        data: details.request.data
      } : null,
      response: details.response ? {
        status: details.response.status,
        headers: details.response.headers,
        data: details.response.data
      } : null
    };
  },

  /**
   * Download report files
   * @param {Array} files - Array of file objects with name and content
   * @param {string} reportId - Report ID for filenames
   */
  downloadReportFiles(files, reportId) {
    for (const file of files) {
      const blob = new Blob([file.content], { type: file.mimeType || 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  },

  /**
   * Auto-fix all failed endpoints using the AI doc fixer agent.
   * Collects FAIL/ERROR/WARN results from TestRunner and sends them to the fix-report orchestrator.
   */
  autoFixAllFailed() {
    // Results are stored on TestRunner, not ResultsViewer
    const allResults = (typeof TestRunner !== 'undefined' && TestRunner.results) ? TestRunner.results : [];

    if (!allResults || allResults.length === 0) {
      alert('No results available. Run a validation first.');
      return;
    }

    // Collect failed, errored, and warned results
    const failedResults = allResults.filter(r => 
      r.status === 'FAIL' || r.status === 'ERROR' || r.status === 'WARN'
    ).map(r => ({
      endpoint: r.endpoint,
      method: r.method || (r.endpoint ? r.endpoint.split(' ')[0] : 'GET'),
      path: r.path || (r.endpoint ? r.endpoint.split(' ').slice(1).join(' ') : ''),
      status: r.status,
      httpStatus: r.httpStatus,
      domain: r.domain,
      swaggerFile: r.swaggerFile,
      tokenUsed: r.tokenUsed,
      reason: r.details?.reason || r.reason,
      details: r.details || {},
      healingInfo: r.healingInfo || {}
    }));

    if (failedResults.length === 0) {
      alert('No failed or warned endpoints to fix. All tests passed!');
      return;
    }

    // Start the fix session via FixRunner
    if (typeof FixRunner !== 'undefined') {
      FixRunner.startFixSession(failedResults);
    } else {
      alert('Fix runner module not loaded.');
    }
  },

  /**
   * Collect failed endpoints from Base URL Scan results and send to FixRunner.
   * "Failed" = BOTH_FAILING or FALLBACK_BROKEN. Skipped (NO_WORKFLOW) are ignored.
   */
  autoFixScanFailed() {
    const allResults = (typeof TestRunner !== 'undefined' && TestRunner.scanResults) ? TestRunner.scanResults : [];

    if (!allResults || allResults.length === 0) {
      alert('No scan results available. Run a base URL scan first.');
      return;
    }

    const failedResults = allResults.filter(r =>
      r.recommendation === 'BOTH_FAILING' || r.recommendation === 'FALLBACK_BROKEN'
    ).map(r => {
      const parts = r.endpoint.split(' ');
      const method = parts[0] || 'GET';
      const path = parts.slice(1).join(' ') || '';
      const primaryError = r.primary?.error || '';
      const fallbackError = r.fallback?.error || '';
      const reason = r.recommendation === 'BOTH_FAILING'
        ? `Both URLs failing. Primary: ${r.primary?.status || '?'} ${primaryError}. Fallback: ${r.fallback?.status || '?'} ${fallbackError}`
        : `Fallback broken (${r.fallback?.status || '?'} ${fallbackError}), primary works`;

      return {
        endpoint: r.endpoint,
        method,
        path,
        status: r.recommendation === 'BOTH_FAILING' ? 'FAIL' : 'WARN',
        httpStatus: r.primary?.status || r.fallback?.status,
        domain: r.domain,
        swaggerFile: null,
        tokenUsed: null,
        reason,
        details: { recommendation: r.recommendation, primary: r.primary, fallback: r.fallback },
        healingInfo: {}
      };
    });

    if (failedResults.length === 0) {
      alert('No failed scan endpoints to fix. All scans passed or were skipped.');
      return;
    }

    if (typeof FixRunner !== 'undefined') {
      FixRunner.startFixSession(failedResults);
    } else {
      alert('Fix runner module not loaded.');
    }
  },

  /**
   * Collect failed endpoints from Token Doc Fix results and send to FixRunner.
   * "Failed" = testResult === 'error'. Skipped/no-workflow/no-tokens are ignored.
   */
  autoFixTokenFixFailed() {
    const allResults = (typeof TestRunner !== 'undefined' && TestRunner.tokenFixResults) ? TestRunner.tokenFixResults : [];

    if (!allResults || allResults.length === 0) {
      alert('No token fix results available. Run a token doc fix first.');
      return;
    }

    const failedResults = allResults.filter(r =>
      r.testResult === 'error'
    ).map(r => {
      const parts = r.endpoint.split(' ');
      const method = parts[0] || 'GET';
      const path = parts.slice(1).join(' ') || '';

      return {
        endpoint: r.endpoint,
        method,
        path,
        status: 'FAIL',
        httpStatus: r.testStatus,
        domain: r.domain,
        swaggerFile: r.swaggerFile || null,
        tokenUsed: null,
        reason: r.testError || `Test failed with status ${r.testStatus || 'unknown'}`,
        details: {
          discoveredTokens: r.discoveredTokens,
          codeSearchSource: r.codeSearchSource,
          codeSearchConfidence: r.codeSearchConfidence,
          testResult: r.testResult,
          testError: r.testError
        },
        healingInfo: {}
      };
    });

    if (failedResults.length === 0) {
      alert('No failed token-fix endpoints to fix. All tests passed or were skipped.');
      return;
    }

    if (typeof FixRunner !== 'undefined') {
      FixRunner.startFixSession(failedResults);
    } else {
      alert('Fix runner module not loaded.');
    }
  },

  // ========================
  // Base URL Scan Results
  // ========================

  _scanResults: [],

  /**
   * Add a single scan result to the scan results list
   * @param {Object} result - Scan result object
   */
  addScanResult(result) {
    const listEl = document.getElementById('scan-results-list');
    if (!listEl) return;

    // Show scan results section
    document.getElementById('scan-results-section')?.classList.remove('hidden');

    // Remove "loading" placeholder if present
    const loading = listEl.querySelector('.results-loading');
    if (loading) loading.remove();

    this._scanResults.push(result);

    const recClass = this.getScanRecommendationClass(result.recommendation);
    const recLabel = this.getScanRecommendationLabel(result.recommendation);
    const recIcon = this.getScanRecommendationIcon(result.recommendation);

    const card = document.createElement('div');
    card.className = `scan-result-card scan-${recClass}`;
    card.dataset.recommendation = result.recommendation;
    card.innerHTML = `
      <div class="scan-result-header">
        <span class="scan-result-icon">${recIcon}</span>
        <span class="scan-result-endpoint">${result.endpoint}</span>
        <span class="scan-result-domain">${result.domain || ''}</span>
        <span class="scan-recommendation-badge scan-badge-${recClass}">${recLabel}</span>
      </div>
      <div class="scan-result-comparison">
        <div class="scan-url-result scan-url-fallback ${result.fallback.success ? 'success' : 'failure'}">
          <span class="scan-url-label">Fallback</span>
          <span class="scan-url-value">${result.fallback.url || ''}</span>
          <span class="scan-url-status">${result.fallback.success ? '✓' : '✗'} ${result.fallback.status || ''}</span>
          <span class="scan-url-duration">${result.fallback.duration || '-'}</span>
          ${result.fallback.error ? `<span class="scan-url-error">${this.truncateText(result.fallback.error, 120)}</span>` : ''}
        </div>
        <div class="scan-url-separator">→</div>
        <div class="scan-url-result scan-url-primary ${result.primary.success ? 'success' : 'failure'}">
          <span class="scan-url-label">Primary</span>
          <span class="scan-url-value">${result.primary.url || ''}</span>
          <span class="scan-url-status">${result.primary.success ? '✓' : '✗'} ${result.primary.status || ''}</span>
          <span class="scan-url-duration">${result.primary.duration || '-'}</span>
          ${result.primary.error ? `<span class="scan-url-error">${this.truncateText(result.primary.error, 120)}</span>` : ''}
        </div>
      </div>
    `;

    listEl.appendChild(card);
  },

  /**
   * Sort scan results: PRIMARY_NOW_WORKS first, then broken, then still needed
   */
  sortScanResults() {
    const listEl = document.getElementById('scan-results-list');
    if (!listEl) return;

    const order = {
      'PRIMARY_NOW_WORKS': 0,
      'FALLBACK_BROKEN': 1,
      'BOTH_FAILING': 2,
      'FALLBACK_STILL_NEEDED': 3,
      'NO_WORKFLOW': 4
    };

    const cards = Array.from(listEl.querySelectorAll('.scan-result-card'));
    cards.sort((a, b) => {
      return (order[a.dataset.recommendation] ?? 99) - (order[b.dataset.recommendation] ?? 99);
    });

    for (const card of cards) {
      listEl.appendChild(card);
    }
  },

  /**
   * Get CSS class for a scan recommendation
   */
  getScanRecommendationClass(recommendation) {
    const map = {
      'PRIMARY_NOW_WORKS': 'primary-works',
      'FALLBACK_STILL_NEEDED': 'fallback-needed',
      'FALLBACK_BROKEN': 'fallback-broken',
      'BOTH_FAILING': 'both-failing',
      'NO_WORKFLOW': 'no-workflow'
    };
    return map[recommendation] || 'unknown';
  },

  /**
   * Get human-readable label for a scan recommendation
   */
  getScanRecommendationLabel(recommendation) {
    const map = {
      'PRIMARY_NOW_WORKS': 'Primary Now Works',
      'FALLBACK_STILL_NEEDED': 'Fallback Still Needed',
      'FALLBACK_BROKEN': 'Fallback Broken, Primary Works',
      'BOTH_FAILING': 'Both Failing',
      'NO_WORKFLOW': 'No Workflow'
    };
    return map[recommendation] || recommendation;
  },

  /**
   * Get icon for a scan recommendation
   */
  getScanRecommendationIcon(recommendation) {
    const map = {
      'PRIMARY_NOW_WORKS': '🟢',
      'FALLBACK_STILL_NEEDED': '🟡',
      'FALLBACK_BROKEN': '🟠',
      'BOTH_FAILING': '🔴',
      'NO_WORKFLOW': '⚪'
    };
    return map[recommendation] || '❓';
  },

  // ========================
  // Token Doc Fix Results
  // ========================

  _tokenFixResults: [],

  /**
   * Add a single token fix result to the results list
   * @param {Object} result - Token fix result object
   */
  addTokenFixResult(result) {
    const listEl = document.getElementById('token-fix-results-list');
    if (!listEl) return;

    document.getElementById('token-fix-results-section')?.classList.remove('hidden');

    const loading = listEl.querySelector('.results-loading');
    if (loading) loading.remove();

    this._tokenFixResults.push(result);

    const { cssClass, icon, label } = this.getTokenFixStatusDisplay(result);

    const tokensHtml = result.discoveredTokens && result.discoveredTokens.length > 0
      ? result.discoveredTokens.map(t =>
          `<span class="token-fix-token-badge">${t.charAt(0).toUpperCase() + t.slice(1)}</span>`
        ).join(' ')
      : '<span class="token-fix-no-tokens">No tokens found</span>';

    const sourceHtml = result.codeSearchSource
      ? `<span class="token-fix-source" title="${result.codeSearchSource}">${result.codeSearchRepo || '?'}/${this.truncateText(result.codeSearchSource.split('/').pop(), 30)}</span>`
      : `<span class="token-fix-source">${result.codeSearchRepo || 'unmapped'} (${result.codeSearchConfidence || 'default'})</span>`;

    const testHtml = this.getTokenFixTestHtml(result);

    const card = document.createElement('div');
    card.className = `token-fix-result-card token-fix-${cssClass}`;
    card.dataset.status = result.testResult;
    card.dataset.updated = result.swaggerUpdated ? 'true' : 'false';
    card.innerHTML = `
      <div class="token-fix-result-header">
        <span class="token-fix-result-icon">${icon}</span>
        <span class="token-fix-result-endpoint">${result.endpoint}</span>
        <span class="token-fix-result-domain">${result.domain || ''}</span>
        <span class="token-fix-status-badge token-fix-badge-${cssClass}">${label}</span>
      </div>
      <div class="token-fix-result-body">
        <div class="token-fix-row">
          <span class="token-fix-label">Discovered Tokens:</span>
          <span class="token-fix-value">${tokensHtml}</span>
        </div>
        <div class="token-fix-row">
          <span class="token-fix-label">Source:</span>
          <span class="token-fix-value">${sourceHtml}</span>
        </div>
        <div class="token-fix-row">
          <span class="token-fix-label">Test:</span>
          <span class="token-fix-value">${testHtml}</span>
        </div>
        <div class="token-fix-row">
          <span class="token-fix-label">Swagger Updated:</span>
          <span class="token-fix-value">${result.swaggerUpdated
            ? `<span class="token-fix-updated-yes">✅ Yes</span> <span class="token-fix-file">${result.swaggerFile || ''}</span>`
            : `<span class="token-fix-updated-no">❌ No</span> <span class="token-fix-reason">${result.swaggerMessage || ''}</span>`
          }</span>
        </div>
      </div>
    `;

    listEl.appendChild(card);
  },

  /**
   * Get display properties for a token fix result status
   */
  getTokenFixStatusDisplay(result) {
    if (result.swaggerUpdated) {
      return { cssClass: 'updated', icon: '✅', label: 'Swagger Updated' };
    }
    if (result.testResult === '2xx') {
      return { cssClass: 'passed', icon: '🧪', label: 'Test Passed' };
    }
    if (result.testResult === 'skipped-no-test') {
      return { cssClass: 'skipped', icon: '⏭️', label: 'Skipped' };
    }
    if (result.testResult === 'no-workflow') {
      return { cssClass: 'no-workflow', icon: '⚪', label: 'No Workflow' };
    }
    if (result.testResult === 'no-tokens-found') {
      return { cssClass: 'no-tokens', icon: '❓', label: 'No Tokens Found' };
    }
    if (result.testResult === 'error') {
      return { cssClass: 'failed', icon: '❌', label: 'Test Failed' };
    }
    return { cssClass: 'unknown', icon: '❓', label: result.testResult || 'Unknown' };
  },

  /**
   * Get HTML for the test result column
   */
  getTokenFixTestHtml(result) {
    if (result.testResult === '2xx') {
      return `<span class="token-fix-test-pass">✓ ${result.testStatus || '2xx'}</span> <span class="token-fix-duration">${result.testDuration || ''}</span>`;
    }
    if (result.testResult === 'error') {
      return `<span class="token-fix-test-fail">✗ ${this.truncateText(result.testError || 'Error', 60)}</span> <span class="token-fix-duration">${result.testDuration || ''}</span>`;
    }
    if (result.testResult === 'skipped-no-test') {
      return '<span class="token-fix-test-skip">Skipped (workflow status: skip)</span>';
    }
    if (result.testResult === 'no-workflow') {
      return '<span class="token-fix-test-skip">No workflow available</span>';
    }
    if (result.testResult === 'no-tokens-found') {
      return '<span class="token-fix-test-skip">N/A (no tokens discovered)</span>';
    }
    return `<span>${result.testResult || '-'}</span>`;
  },

  /**
   * Sort token fix results: updated first, then passed, skipped, failed, no-workflow
   */
  sortTokenFixResults() {
    const listEl = document.getElementById('token-fix-results-list');
    if (!listEl) return;

    const order = { 'true': 0, 'false': 1 };
    const testOrder = { '2xx': 0, 'skipped-no-test': 1, 'error': 2, 'no-workflow': 3, 'no-tokens-found': 4 };

    const cards = Array.from(listEl.querySelectorAll('.token-fix-result-card'));
    cards.sort((a, b) => {
      const aUpdated = order[a.dataset.updated] ?? 99;
      const bUpdated = order[b.dataset.updated] ?? 99;
      if (aUpdated !== bUpdated) return aUpdated - bUpdated;
      return (testOrder[a.dataset.status] ?? 99) - (testOrder[b.dataset.status] ?? 99);
    });

    for (const card of cards) {
      listEl.appendChild(card);
    }
  }
};
