/**
 * Test Runner Component
 * Handles test execution and progress updates via SSE
 */

const TestRunner = {
  eventSource: null,
  results: [],
  sessionId: null,
  isRunning: false,
  
  /**
   * Run tests for selected endpoints
   * @param {Object[]} endpoints - Endpoints to test
   * @param {Object} options - Test options
   */
  async run(endpoints, options = {}) {
    console.log('TestRunner.run called with', endpoints.length, 'endpoints');
    this.results = [];
    this.sessionId = null;
    this.isRunning = true;
    this.swaggerFileChanges = [];  // Clear swagger changes for new run
    this.clearPreflightLog();
    this.updateProgress(0, endpoints.length, 'Starting...');
    
    // Update button states
    this.updateButtonStates();
    
    // Show progress section
    document.getElementById('progress-section')?.classList.remove('hidden');
    
    // Show results section immediately so users can explore results as they come in
    this.showResultsSectionEarly();
    
    try {
      console.log('Sending POST to /api/validate');
      
      // Start validation
      const response = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: endpoints.map(e => ({ path: e.path, method: e.method })),
          options
        })
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start validation');
      }
      
      // Store session ID and connect to SSE stream
      this.sessionId = data.sessionId;
      console.log('Connecting to SSE stream:', data.sessionId);
      this.connectToStream(data.sessionId, endpoints.length);
      
    } catch (error) {
      console.error('Test run error:', error);
      this.updateProgress(0, 0, `Error: ${error.message}`);
      this.isRunning = false;
      this.updateButtonStates();
      alert('Test runner error: ' + error.message);
    }
  },
  
  /**
   * Connect to SSE stream for progress updates
   * @param {string} sessionId - Validation session ID
   * @param {number} total - Total endpoints
   */
  connectToStream(sessionId, total) {
    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    this.eventSource = new EventSource(`/api/validate/stream/${sessionId}`);
    
    this.eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      this.updateProgress(0, data.total, 'Running tests...');
    });
    
    this.eventSource.addEventListener('preflight', (event) => {
      const data = JSON.parse(event.data);
      this.updatePreflightProgress(data);
    });
    
    this.eventSource.addEventListener('log', (event) => {
      const data = JSON.parse(event.data);
      this.addPreflightLog(data.message);
    });
    
    this.eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      this.hidePreflightSection();
      this.updateProgress(data.index, total, `Testing: ${data.endpoint}`);
      this.addProgressLog(data.endpoint, 'running');
    });
    
    this.eventSource.addEventListener('result', (event) => {
      const result = JSON.parse(event.data);
      
      // Check if result already exists (could have been added by healing_complete)
      const existingIdx = this.results.findIndex(r => r.endpoint === result.endpoint);
      if (existingIdx >= 0) {
        // Update existing result
        this.results[existingIdx] = result;
      } else {
        // Add new result
        this.results.push(result);
      }
      
      this.updateProgressLog(result.endpoint, result.status, result.duration);
      
      // Render this result immediately so users can explore while test runs
      // addResult will update if it already exists
      ResultsViewer.addResult(result);
      this.updateResultsSummary();
    });
    
    // Agent healing events
    this.eventSource.addEventListener('healing_start', (event) => {
      const data = JSON.parse(event.data);
      this.initHealingLog(data.endpoint);
      this.appendHealingLog(data.endpoint, '🤖', 'AI Agent starting...', 'start');
      
      // Mark the result as being healed in the UI
      ResultsViewer.setResultHealing(data.endpoint, true);
    });
    
    this.eventSource.addEventListener('healing_analyzing', (event) => {
      const data = JSON.parse(event.data);
      const msg = data.thought ? `Thinking: ${data.thought.substring(0, 80)}...` : 
                  data.iteration ? `Iteration ${data.iteration}` : 'Analyzing...';
      this.appendHealingLog(data.endpoint, '🤔', msg, 'thinking');
    });
    
    // Rich agent action events with specific icons per action type
    this.eventSource.addEventListener('healing_action', (event) => {
      const data = JSON.parse(event.data);
      const { icon, label } = this.getHealingActionDisplay(data.action);
      const detail = data.details ? `: ${data.details.substring(0, 120)}${data.details.length > 120 ? '...' : ''}` : '';
      this.appendHealingLog(data.endpoint, icon, `${label}${detail}`, data.action);
    });
    
    this.eventSource.addEventListener('healing_creating', (event) => {
      const data = JSON.parse(event.data);
      const action = data.input ? `${data.tool}: ${data.input.method || ''} ${data.input.path || ''}` : data.tool;
      this.appendHealingLog(data.endpoint, '🔧', action, 'tool-call');
    });
    
    this.eventSource.addEventListener('healing_created', (event) => {
      const data = JSON.parse(event.data);
      const icon = data.success ? '✅' : '❌';
      this.appendHealingLog(data.endpoint, icon, `Result: ${data.status || 'done'}`, data.success ? 'success' : 'failed');
    });
    
    this.eventSource.addEventListener('swagger_file_updated', (event) => {
      const data = JSON.parse(event.data);
      // Track swagger file changes
      if (!this.swaggerFileChanges) {
        this.swaggerFileChanges = [];
      }
      this.swaggerFileChanges.push({
        endpoint: data.endpoint,
        file: data.file,
        operation: data.operation,
        description: data.description,
        evidence: data.evidence
      });
      
      // Show in healing log
      this.appendHealingLog(data.endpoint, '📝', `Updated: ${data.file} - ${data.description}`, 'swagger');
      
      // Update the swagger changes count in UI
      this.updateSwaggerChangesCount();
    });
    
    this.eventSource.addEventListener('healing_complete', (event) => {
      const data = JSON.parse(event.data);
      // Determine status: WARN if success with doc issues, PASS if clean success, FAIL otherwise
      let status, icon, msg;
      if (data.success) {
        if (data.hasDocumentationIssues) {
          status = 'WARN';
          icon = '⚠️';
          msg = `Fixed but docs need update! ${data.summary || ''}`;
        } else {
          status = 'PASS';
          icon = '✅';
          msg = `Fixed! ${data.summary || ''}`;
        }
      } else {
        status = 'FAIL';
        icon = '❌';
        msg = `Failed: ${data.reason || ''}`;
      }
      
      // Add final entry to healing log and finalize it
      this.appendHealingLog(data.endpoint, icon, msg, status === 'PASS' ? 'success' : 'failed');
      this.finalizeHealingLog(data.endpoint, status, `${icon} ${msg}`);
      
      // Remove the healing indicator
      ResultsViewer.setResultHealing(data.endpoint, false);
      
      // Update the result in both local array and the results viewer
      if (data.updatedResult) {
        // Update local results array
        const idx = this.results.findIndex(r => r.endpoint === data.endpoint);
        if (idx >= 0) {
          this.results[idx] = data.updatedResult;
        }
        
        ResultsViewer.updateResult(data.updatedResult);
        this.updateResultsSummary();
      }
    });
    
    this.eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();
      
      this.updateProgress(total, total, 'Complete!');
      this.showResults(data);
    });
    
    this.eventSource.addEventListener('stopped', (event) => {
      const data = JSON.parse(event.data);
      console.log('Tests stopped:', data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();
      
      this.updateProgress(data.completed, data.total, '⏹ Stopped by user');
      
      // Show partial results
      this.showResults({
        status: 'stopped',
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        warned: this.results.filter(r => r.status === 'WARN').length,
        errored: this.results.filter(r => r.status === 'ERROR').length,
        skipped: this.results.filter(r => r.status === 'SKIP').length,
        message: data.message
      });
    });
    
    this.eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();
    });
    
    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.isRunning = false;
      this.updateButtonStates();
    };
  },
  
  /**
   * Update progress display
   */
  updateProgress(current, total, message) {
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    
    document.getElementById('progress-text').textContent = `Running: ${current}/${total}`;
    document.getElementById('progress-percent').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
  },
  
  /**
   * Update pre-flight progress display
   */
  updatePreflightProgress(data) {
    const section = document.getElementById('preflight-section');
    if (!section) return;
    
    section.classList.remove('hidden');
    
    const phaseEl = document.getElementById('preflight-phase');
    const statusEl = document.getElementById('preflight-status');
    
    if (phaseEl) phaseEl.textContent = data.phase || 'Resolving parameters...';
    if (statusEl) statusEl.textContent = data.status || '';
    
    // Update progress bar for pre-flight
    document.getElementById('progress-text').textContent = data.phase || 'Pre-flight...';
    document.getElementById('progress-percent').textContent = '...';
  },
  
  /**
   * Add log entry to pre-flight section
   */
  addPreflightLog(message) {
    const logEl = document.getElementById('preflight-log');
    if (!logEl) return;
    
    const entry = document.createElement('div');
    entry.className = 'preflight-entry';
    
    // Color code based on content
    if (message.includes('✓')) {
      entry.classList.add('success');
    } else if (message.includes('✗')) {
      entry.classList.add('error');
    } else if (message.includes('Phase')) {
      entry.classList.add('phase');
    }
    
    entry.textContent = message;
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
  },
  
  /**
   * Hide pre-flight section when resolving is done and tests start
   */
  hidePreflightSection() {
    const section = document.getElementById('preflight-section');
    if (section) {
      section.classList.add('hidden');
    }
  },
  
  /**
   * Clear pre-flight log for new run
   */
  clearPreflightLog() {
    const logEl = document.getElementById('preflight-log');
    if (logEl) logEl.innerHTML = '';
    
    const progressLog = document.getElementById('progress-log');
    if (progressLog) progressLog.innerHTML = '';
    
    const section = document.getElementById('preflight-section');
    if (section) {
      section.classList.remove('hidden', 'collapsed');
    }
  },
  
  /**
   * Add entry to progress log
   */
  addProgressLog(endpoint, status) {
    const logEl = document.getElementById('progress-log');
    if (!logEl) return;
    
    const entryId = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    
    // Check if entry exists
    let entry = document.getElementById(`log-${entryId}`);
    if (!entry) {
      entry = document.createElement('div');
      entry.id = `log-${entryId}`;
      entry.className = 'progress-entry';
      logEl.appendChild(entry);
    }
    
    entry.innerHTML = `
      <span class="status-icon status-${status}">●</span>
      <span class="endpoint-name">${endpoint}</span>
      <span class="duration">...</span>
    `;
    
    // Auto-scroll
    logEl.scrollTop = logEl.scrollHeight;
  },
  
  /**
   * Update progress log entry with result
   */
  updateProgressLog(endpoint, status, duration) {
    const entryId = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    const entry = document.getElementById(`log-${entryId}`);
    if (!entry) return;
    
    // If this entry has a healing log, don't overwrite it -- finalize instead
    if (entry.classList.contains('progress-entry-healing')) {
      this.finalizeHealingLog(endpoint, status, `${duration || status}`);
      return;
    }
    
    const statusClass = status === 'PASS' ? 'pass' : 
                        status === 'FAIL' ? 'fail' : 
                        status === 'WARN' ? 'warn' : 'skip';
    const icon = status === 'PASS' ? '✓' : 
                 status === 'FAIL' ? '✗' : 
                 status === 'WARN' ? '⚠' : '○';
    
    entry.innerHTML = `
      <span class="status-icon status-${statusClass}">${icon}</span>
      <span class="endpoint-name">${endpoint}</span>
      <span class="duration">${duration || '-'}</span>
      <span class="status-badge status-${statusClass}">${status}</span>
    `;
  },
  
  /**
   * Initialize a healing log container for an endpoint (replaces the simple progress row)
   * @param {string} endpoint - The endpoint string
   */
  initHealingLog(endpoint) {
    const logEl = document.getElementById('progress-log');
    if (!logEl) return;
    
    const entryId = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    let entry = document.getElementById(`log-${entryId}`);
    
    if (!entry) {
      entry = document.createElement('div');
      entry.id = `log-${entryId}`;
      logEl.appendChild(entry);
    }
    
    // Replace simple row with healing log structure (open by default)
    entry.className = 'progress-entry progress-entry-healing';
    entry.innerHTML = `
      <div class="healing-log-header" onclick="TestRunner.toggleHealingLog('${entryId}')">
        <span class="status-icon status-healing">🔄</span>
        <span class="endpoint-name">${endpoint}</span>
        <span class="healing-log-count" id="healing-count-${entryId}">0 steps</span>
        <span class="status-badge status-healing">HEALING</span>
        <span class="healing-log-toggle" id="healing-toggle-${entryId}">▼</span>
      </div>
      <div class="healing-log-entries" id="healing-entries-${entryId}">
      </div>
    `;
    
    logEl.scrollTop = logEl.scrollHeight;
  },
  
  /**
   * Append an entry to the healing log for an endpoint
   * @param {string} endpoint - The endpoint string
   * @param {string} icon - Emoji icon for this entry
   * @param {string} text - Description text
   * @param {string} type - Entry type for styling (e.g., 'start', 'thinking', 'success', 'failed')
   */
  appendHealingLog(endpoint, icon, text, type) {
    const entryId = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    const entriesEl = document.getElementById(`healing-entries-${entryId}`);
    if (!entriesEl) return;
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    const logEntry = document.createElement('div');
    logEntry.className = `healing-log-entry healing-log-${type || 'default'}`;
    logEntry.innerHTML = `
      <span class="healing-log-icon">${icon}</span>
      <span class="healing-log-text">${text}</span>
      <span class="healing-log-time">${timeStr}</span>
    `;
    entriesEl.appendChild(logEntry);
    
    // Update step count
    const count = entriesEl.children.length;
    const countEl = document.getElementById(`healing-count-${entryId}`);
    if (countEl) {
      countEl.textContent = `${count} step${count !== 1 ? 's' : ''}`;
    }
    
    // Auto-scroll the entries container and the parent progress log
    entriesEl.scrollTop = entriesEl.scrollHeight;
    const logEl = document.getElementById('progress-log');
    if (logEl) logEl.scrollTop = logEl.scrollHeight;
  },
  
  /**
   * Finalize the healing log after healing completes (update header, collapse)
   * @param {string} endpoint - The endpoint string
   * @param {string} finalStatus - Final status (PASS, FAIL, WARN)
   * @param {string} summary - Summary text
   */
  finalizeHealingLog(endpoint, finalStatus, summary) {
    const entryId = endpoint.replace(/[^a-zA-Z0-9]/g, '-');
    const entry = document.getElementById(`log-${entryId}`);
    if (!entry) return;
    
    const statusClass = finalStatus === 'PASS' ? 'pass' : 
                        finalStatus === 'FAIL' ? 'fail' : 
                        finalStatus === 'WARN' ? 'warn' : 'skip';
    const statusIcon = finalStatus === 'PASS' ? '✓' : 
                       finalStatus === 'FAIL' ? '✗' : 
                       finalStatus === 'WARN' ? '⚠' : '○';
    
    // Update the header to show final status
    const header = entry.querySelector('.healing-log-header');
    if (header) {
      const iconEl = header.querySelector('.status-icon');
      if (iconEl) {
        iconEl.className = `status-icon status-${statusClass}`;
        iconEl.textContent = statusIcon;
      }
      const badgeEl = header.querySelector('.status-badge');
      if (badgeEl) {
        badgeEl.className = `status-badge status-${statusClass}`;
        badgeEl.textContent = finalStatus;
      }
    }
    
    // Update the entry class
    entry.className = `progress-entry progress-entry-healing healing-done healing-done-${statusClass}`;
    
    // Collapse the log after completion
    const entriesEl = document.getElementById(`healing-entries-${entryId}`);
    if (entriesEl) {
      entriesEl.classList.add('collapsed');
    }
    const toggleEl = document.getElementById(`healing-toggle-${entryId}`);
    if (toggleEl) {
      toggleEl.textContent = '▶';
    }
  },
  
  /**
   * Toggle the healing log entries visibility
   * @param {string} entryId - The sanitized entry ID
   */
  toggleHealingLog(entryId) {
    const entriesEl = document.getElementById(`healing-entries-${entryId}`);
    const toggleEl = document.getElementById(`healing-toggle-${entryId}`);
    if (!entriesEl) return;
    
    const isCollapsed = entriesEl.classList.toggle('collapsed');
    if (toggleEl) {
      toggleEl.textContent = isCollapsed ? '▶' : '▼';
    }
  },
  
  /**
   * Get icon and label for a healing action type
   * @param {string} action - The action type
   * @returns {{ icon: string, label: string }}
   */
  getHealingActionDisplay(action) {
    const actionMap = {
      'extract_required_uids':    { icon: '📋', label: 'Extracting UIDs' },
      'find_uid_source':          { icon: '🔍', label: 'Finding UID source' },
      'find_service_for_endpoint':{ icon: '🗺️', label: 'Finding service' },
      'search_source_code':       { icon: '🔎', label: 'Searching code' },
      'read_source_file':         { icon: '📖', label: 'Reading source' },
      'execute_api':              { icon: '⚡', label: 'API call' },
      'analyze_discrepancies':    { icon: '🔬', label: 'Analyzing discrepancies' },
      'investigate_failure':      { icon: '🕵️', label: 'Investigating failure' },
      'acquire_token':            { icon: '🔑', label: 'Acquiring token' },
      'app_oauth':                { icon: '🔐', label: 'App OAuth' },
      'client_jwt':               { icon: '🎫', label: 'Client JWT' },
      'list':                     { icon: '📃', label: 'Listing entities' },
      'create':                   { icon: '➕', label: 'Creating entity' },
      'update_swagger_file':      { icon: '📝', label: 'Updating swagger' },
      'report_result':            { icon: '📊', label: 'Reporting result' },
      'prerequisite_start':       { icon: '⏳', label: 'Running prerequisites' },
      'prerequisite_complete':    { icon: '✅', label: 'Prerequisites done' },
      'workflow_test_request':    { icon: '🧪', label: 'Testing workflow' }
    };
    return actionMap[action] || { icon: '🤖', label: action || 'Working' };
  },
  
  /**
   * Show results section early (before tests complete) so users can explore
   */
  showResultsSectionEarly() {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) {
      resultsSection.classList.remove('hidden');
      
      // Clear previous results
      const listEl = document.getElementById('results-list');
      if (listEl) {
        listEl.innerHTML = '<div class="empty results-loading">Results will appear here as tests complete...</div>';
      }
      
      // Reset counters
      document.getElementById('results-passed').textContent = '0';
      document.getElementById('results-failed').textContent = '0';
      document.getElementById('results-warned').textContent = '0';
      document.getElementById('results-errored').textContent = '0';
      document.getElementById('results-skipped').textContent = '0';
    }
  },
  
  /**
   * Update results summary counts incrementally
   */
  updateResultsSummary() {
    const counts = { pass: 0, fail: 0, warn: 0, error: 0, skip: 0 };
    
    for (const result of this.results) {
      const status = result.status?.toLowerCase() || 'error';
      if (status === 'pass') counts.pass++;
      else if (status === 'fail') counts.fail++;
      else if (status === 'warn') counts.warn++;
      else if (status === 'error') counts.error++;
      else if (status === 'skip') counts.skip++;
    }
    
    document.getElementById('results-passed').textContent = counts.pass;
    document.getElementById('results-failed').textContent = counts.fail;
    document.getElementById('results-warned').textContent = counts.warn;
    document.getElementById('results-errored').textContent = counts.error;
    document.getElementById('results-skipped').textContent = counts.skip;
  },
  
  /**
   * Show final results
   */
  showResults(summary) {
    // Hide the preflight section completely when tests are done
    const preflightSection = document.getElementById('preflight-section');
    if (preflightSection) {
      preflightSection.classList.add('hidden');
    }
    
    // Results section is already visible, just update final summary
    const resultsSection = document.getElementById('results-section');
    resultsSection?.classList.remove('hidden');
    
    // Update summary with final counts from server
    document.getElementById('results-passed').textContent = summary.passed;
    document.getElementById('results-failed').textContent = summary.failed;
    document.getElementById('results-warned').textContent = summary.warned || 0;
    document.getElementById('results-errored').textContent = summary.errored || 0;
    document.getElementById('results-skipped').textContent = summary.skipped;
    
    // Sort results (failures first) now that all are in
    ResultsViewer.sortResults();
    
    // Remove the "loading" message if still there
    const listEl = document.getElementById('results-list');
    const loadingMsg = listEl?.querySelector('.results-loading');
    if (loadingMsg) {
      loadingMsg.remove();
    }
    
    // Smooth scroll to results section
    setTimeout(() => {
      resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },
  
  /**
   * Stop the currently running tests or scan
   */
  async stop() {
    // Determine which session to stop
    const activeSessionId = this.sessionId || this.scanSessionId || this.tokenFixSessionId;
    if (!activeSessionId || !this.isRunning) {
      console.log('No active session to stop');
      return;
    }
    
    // Determine the correct stop endpoint based on session type
    const isScan = activeSessionId.startsWith('scan-');
    const isTokenFix = activeSessionId.startsWith('tokenfix-');
    const stopUrl = isTokenFix
      ? `/api/validate/token-doc-fix/stop/${activeSessionId}`
      : isScan
        ? `/api/validate/base-url-scan/stop/${activeSessionId}`
        : `/api/validate/stop/${activeSessionId}`;
    
    console.log('Stopping session:', activeSessionId, isScan ? '(scan)' : '(validation)');
    
    try {
      const response = await fetch(stopUrl, {
        method: 'POST'
      });
      
      const data = await response.json();
      console.log('Stop response:', data);
      
      if (!data.success) {
        console.error('Failed to stop session:', data.message);
      }
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  },
  
  /**
   * Update the Run/Stop button states based on isRunning
   */
  updateButtonStates() {
    const runBtn = document.getElementById('run-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (this.isRunning) {
      // Running - show stop button, disable run button
      runBtn?.classList.add('hidden');
      stopBtn?.classList.remove('hidden');
    } else {
      // Not running - show run button, hide stop button
      runBtn?.classList.remove('hidden');
      stopBtn?.classList.add('hidden');
    }
  },
  
  /**
   * Update swagger changes count display
   */
  updateSwaggerChangesCount() {
    const countEl = document.getElementById('results-swagger-changes');
    if (countEl) {
      const count = this.swaggerFileChanges?.length || 0;
      countEl.textContent = count;
      
      // Show/hide the swagger changes badge
      const badge = countEl.closest('.badge');
      if (badge) {
        badge.classList.toggle('hidden', count === 0);
      }
    }
  },
  
  /**
   * Get swagger file changes for report
   */
  getSwaggerFileChanges() {
    return this.swaggerFileChanges || [];
  },

  // ========================
  // Base URL Scan Methods
  // ========================

  scanResults: [],
  scanSessionId: null,

  /**
   * Run base URL scan for selected fallback endpoints
   * @param {Object[]} endpoints - Endpoints to scan
   * @param {Object} options - Scan options
   */
  async runBaseUrlScan(endpoints, options = {}) {
    console.log('TestRunner.runBaseUrlScan called with', endpoints.length, 'endpoints');
    this.scanResults = [];
    this.scanSessionId = null;
    this.sessionId = null;
    this.isRunning = true;
    this.clearPreflightLog();
    this.updateProgress(0, endpoints.length, 'Starting base URL scan...');
    this.updateButtonStates();

    // Clear previous scan results
    ResultsViewer._scanResults = [];
    const scanList = document.getElementById('scan-results-list');
    if (scanList) scanList.innerHTML = '<div class="empty results-loading">Scan results will appear here...</div>';

    // Reset scan summary counters
    document.getElementById('scan-primary-works').textContent = '0';
    document.getElementById('scan-fallback-needed').textContent = '0';
    document.getElementById('scan-fallback-broken').textContent = '0';
    document.getElementById('scan-both-failing').textContent = '0';
    document.getElementById('scan-no-workflow').textContent = '0';

    // Show scan results section early
    document.getElementById('scan-results-section')?.classList.remove('hidden');
    document.getElementById('progress-section')?.classList.remove('hidden');

    try {
      const response = await fetch('/api/validate/base-url-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: endpoints.map(e => ({ path: e.path, method: e.method })),
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start base URL scan');
      }

      this.scanSessionId = data.sessionId;
      this.connectToScanStream(data.sessionId, endpoints.length);

    } catch (error) {
      console.error('Base URL scan error:', error);
      this.updateProgress(0, 0, `Error: ${error.message}`);
      this.isRunning = false;
      this.updateButtonStates();
      alert('Base URL scan error: ' + error.message);
    }
  },

  /**
   * Connect to SSE stream for base URL scan progress
   * @param {string} sessionId - Scan session ID
   * @param {number} total - Total endpoints
   */
  connectToScanStream(sessionId, total) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/validate/base-url-scan/stream/${sessionId}`);

    this.eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      this.updateProgress(0, data.total, 'Running base URL scan...');
    });

    this.eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      const phaseLabel = data.phase === 'fallback' ? '(testing fallback)' :
                         data.phase === 'primary' ? '(testing primary)' :
                         data.phase === 'fallback_failed_testing_primary' ? '(fallback failed, testing primary)' :
                         data.phase === 'fallback_failed' ? '(fallback failed)' : '';
      this.updateProgress(data.index, total, `Scanning: ${data.endpoint} ${phaseLabel}`);
      this.addProgressLog(`${data.endpoint} ${phaseLabel}`, 'running');
    });

    this.eventSource.addEventListener('scan_result', (event) => {
      const result = JSON.parse(event.data);
      this.scanResults.push(result);
      
      // Update progress log with result
      const statusClass = result.recommendation === 'PRIMARY_NOW_WORKS' ? 'pass' :
                          result.recommendation === 'FALLBACK_STILL_NEEDED' ? 'warn' : 'fail';
      const icon = result.recommendation === 'PRIMARY_NOW_WORKS' ? '✓' :
                   result.recommendation === 'FALLBACK_STILL_NEEDED' ? '⚠' : '✗';
      this.updateProgressLog(result.endpoint, statusClass === 'pass' ? 'PASS' : statusClass === 'warn' ? 'WARN' : 'FAIL',
        result.fallback.duration || '-');

      // Render scan result immediately
      ResultsViewer.addScanResult(result);
      this.updateScanSummary();
    });

    this.eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();

      this.updateProgress(total, total, 'Base URL scan complete!');
      this.showScanResults(data);
    });

    this.eventSource.addEventListener('stopped', (event) => {
      const data = JSON.parse(event.data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();

      this.updateProgress(data.completed, data.total, 'Scan stopped by user');
      this.showScanResults({
        status: 'stopped',
        ...this.getScanCounts()
      });
    });

    this.eventSource.addEventListener('error', (event) => {
      console.error('Scan SSE error:', event);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();
    });

    this.eventSource.onerror = (error) => {
      console.error('Scan EventSource error:', error);
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.isRunning = false;
      this.updateButtonStates();
    };
  },

  /**
   * Get scan result counts
   */
  getScanCounts() {
    return {
      total: this.scanResults.length,
      primaryNowWorks: this.scanResults.filter(r => r.recommendation === 'PRIMARY_NOW_WORKS').length,
      fallbackStillNeeded: this.scanResults.filter(r => r.recommendation === 'FALLBACK_STILL_NEEDED').length,
      fallbackBroken: this.scanResults.filter(r => r.recommendation === 'FALLBACK_BROKEN').length,
      bothFailing: this.scanResults.filter(r => r.recommendation === 'BOTH_FAILING').length,
      noWorkflow: this.scanResults.filter(r => r.recommendation === 'NO_WORKFLOW').length
    };
  },

  /**
   * Update scan summary counters incrementally
   */
  updateScanSummary() {
    const counts = this.getScanCounts();
    document.getElementById('scan-primary-works').textContent = counts.primaryNowWorks;
    document.getElementById('scan-fallback-needed').textContent = counts.fallbackStillNeeded;
    document.getElementById('scan-fallback-broken').textContent = counts.fallbackBroken;
    document.getElementById('scan-both-failing').textContent = counts.bothFailing;
    document.getElementById('scan-no-workflow').textContent = counts.noWorkflow;
  },

  /**
   * Show final scan results
   */
  showScanResults(summary) {
    const preflightSection = document.getElementById('preflight-section');
    if (preflightSection) preflightSection.classList.add('hidden');

    const scanResultsSection = document.getElementById('scan-results-section');
    scanResultsSection?.classList.remove('hidden');

    // Update summary from server
    if (summary.primaryNowWorks !== undefined) {
      document.getElementById('scan-primary-works').textContent = summary.primaryNowWorks;
      document.getElementById('scan-fallback-needed').textContent = summary.fallbackStillNeeded;
      document.getElementById('scan-fallback-broken').textContent = summary.fallbackBroken;
      document.getElementById('scan-both-failing').textContent = summary.bothFailing || 0;
      document.getElementById('scan-no-workflow').textContent = summary.noWorkflow || 0;
    }

    // Sort: PRIMARY_NOW_WORKS first, then FALLBACK_BROKEN, then FALLBACK_STILL_NEEDED
    ResultsViewer.sortScanResults();

    setTimeout(() => {
      scanResultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },

  // ========================
  // Token Doc Fix Methods
  // ========================

  tokenFixResults: [],
  tokenFixSessionId: null,

  /**
   * Run token doc fix for selected endpoints
   * @param {Object[]} endpoints - Endpoints to fix
   * @param {Object} options - Options
   */
  async runTokenDocFix(endpoints, options = {}) {
    console.log('TestRunner.runTokenDocFix called with', endpoints.length, 'endpoints');
    this.tokenFixResults = [];
    this.tokenFixSessionId = null;
    this.sessionId = null;
    this.isRunning = true;
    this.clearPreflightLog();
    this.updateProgress(0, endpoints.length, 'Starting token doc fix...');
    this.updateButtonStates();

    ResultsViewer._tokenFixResults = [];
    const fixList = document.getElementById('token-fix-results-list');
    if (fixList) fixList.innerHTML = '<div class="empty results-loading">Token fix results will appear here...</div>';

    document.getElementById('token-fix-updated').textContent = '0';
    document.getElementById('token-fix-test-passed').textContent = '0';
    document.getElementById('token-fix-test-failed').textContent = '0';
    document.getElementById('token-fix-skipped').textContent = '0';
    document.getElementById('token-fix-no-workflow').textContent = '0';

    document.getElementById('token-fix-results-section')?.classList.remove('hidden');
    document.getElementById('progress-section')?.classList.remove('hidden');

    try {
      const response = await fetch('/api/validate/token-doc-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoints: endpoints.map(e => ({ path: e.path, method: e.method })),
          options
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start token doc fix');
      }

      this.tokenFixSessionId = data.sessionId;
      this.connectToTokenFixStream(data.sessionId, endpoints.length);

    } catch (error) {
      console.error('Token doc fix error:', error);
      this.updateProgress(0, 0, `Error: ${error.message}`);
      this.isRunning = false;
      this.updateButtonStates();
      alert('Token doc fix error: ' + error.message);
    }
  },

  /**
   * Connect to SSE stream for token doc fix progress
   */
  connectToTokenFixStream(sessionId, total) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/validate/token-doc-fix/stream/${sessionId}`);

    this.eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      this.updateProgress(0, data.total, 'Running token doc fix...');
    });

    this.eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      const phaseLabel = data.phase === 'code-search' ? '(searching code)' :
                         data.phase === 'testing' ? '(testing workflow)' : '';
      this.updateProgress(data.index, total, `Fixing: ${data.endpoint} ${phaseLabel}`);
      this.addProgressLog(`${data.endpoint} ${phaseLabel}`, 'running');
    });

    this.eventSource.addEventListener('token_fix_result', (event) => {
      const result = JSON.parse(event.data);
      this.tokenFixResults.push(result);

      const statusClass = result.swaggerUpdated ? 'PASS' :
                          result.testResult === 'error' ? 'FAIL' : 'SKIP';
      this.updateProgressLog(result.endpoint, statusClass, result.testDuration || '-');

      ResultsViewer.addTokenFixResult(result);
      this.updateTokenFixSummary();
    });

    this.eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();

      this.updateProgress(total, total, 'Token doc fix complete!');
      this.showTokenFixResults(data);
    });

    this.eventSource.addEventListener('stopped', (event) => {
      const data = JSON.parse(event.data);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();

      this.updateProgress(data.completed, data.total, 'Token doc fix stopped by user');
      this.showTokenFixResults({
        status: 'stopped',
        ...this.getTokenFixCounts()
      });
    });

    this.eventSource.addEventListener('error', (event) => {
      console.error('Token fix SSE error:', event);
      this.eventSource.close();
      this.eventSource = null;
      this.isRunning = false;
      this.updateButtonStates();
    });

    this.eventSource.onerror = (error) => {
      console.error('Token fix EventSource error:', error);
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
      this.isRunning = false;
      this.updateButtonStates();
    };
  },

  getTokenFixCounts() {
    return {
      total: this.tokenFixResults.length,
      swaggerUpdated: this.tokenFixResults.filter(r => r.swaggerUpdated).length,
      testPassed: this.tokenFixResults.filter(r => r.testResult === '2xx').length,
      testFailed: this.tokenFixResults.filter(r => r.testResult === 'error').length,
      skippedNoTest: this.tokenFixResults.filter(r => r.testResult === 'skipped-no-test').length,
      noWorkflow: this.tokenFixResults.filter(r => r.testResult === 'no-workflow').length
    };
  },

  updateTokenFixSummary() {
    const counts = this.getTokenFixCounts();
    document.getElementById('token-fix-updated').textContent = counts.swaggerUpdated;
    document.getElementById('token-fix-test-passed').textContent = counts.testPassed;
    document.getElementById('token-fix-test-failed').textContent = counts.testFailed;
    document.getElementById('token-fix-skipped').textContent = counts.skippedNoTest;
    document.getElementById('token-fix-no-workflow').textContent = counts.noWorkflow;
  },

  showTokenFixResults(summary) {
    const preflightSection = document.getElementById('preflight-section');
    if (preflightSection) preflightSection.classList.add('hidden');

    const tokenFixSection = document.getElementById('token-fix-results-section');
    tokenFixSection?.classList.remove('hidden');

    if (summary.swaggerUpdated !== undefined) {
      document.getElementById('token-fix-updated').textContent = summary.swaggerUpdated;
      document.getElementById('token-fix-test-passed').textContent = summary.testPassed;
      document.getElementById('token-fix-test-failed').textContent = summary.testFailed;
      document.getElementById('token-fix-skipped').textContent = summary.skippedNoTest || 0;
      document.getElementById('token-fix-no-workflow').textContent = summary.noWorkflow || 0;
    }

    ResultsViewer.sortTokenFixResults();

    const loading = document.querySelector('#token-fix-results-list .results-loading');
    if (loading) loading.remove();

    setTimeout(() => {
      tokenFixSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
};
