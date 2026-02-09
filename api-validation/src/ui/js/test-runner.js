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
      this.updateProgressLog(data.endpoint, 'healing', '🤖 AI Agent starting...');
      
      // Mark the result as being healed in the UI
      ResultsViewer.setResultHealing(data.endpoint, true);
    });
    
    this.eventSource.addEventListener('healing_analyzing', (event) => {
      const data = JSON.parse(event.data);
      const msg = data.thought ? `Thinking: ${data.thought.substring(0, 50)}...` : 
                  data.iteration ? `Iteration ${data.iteration}` : 'Analyzing...';
      this.updateProgressLog(data.endpoint, 'healing', `🤔 ${msg}`);
    });
    
    this.eventSource.addEventListener('healing_creating', (event) => {
      const data = JSON.parse(event.data);
      const action = data.input ? `${data.tool}: ${data.input.method || ''} ${data.input.path || ''}` : data.tool;
      this.updateProgressLog(data.endpoint, 'healing', `🔧 ${action}`);
    });
    
    this.eventSource.addEventListener('healing_created', (event) => {
      const data = JSON.parse(event.data);
      const status = data.success ? '✅' : '❌';
      this.updateProgressLog(data.endpoint, 'healing', `${status} Result: ${data.status || 'done'}`);
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
      this.updateProgressLog(data.endpoint, status, `${icon} ${msg}`);
      
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
    
    if (entry) {
      // Handle healing status differently - show message instead of duration
      if (status === 'healing') {
        entry.innerHTML = `
          <span class="status-icon status-healing">🔄</span>
          <span class="endpoint-name">${endpoint}</span>
          <span class="healing-status">${duration}</span>
          <span class="status-badge status-healing">HEALING</span>
        `;
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
    }
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
   * Stop the currently running tests
   */
  async stop() {
    if (!this.sessionId || !this.isRunning) {
      console.log('No active test session to stop');
      return;
    }
    
    console.log('Stopping test session:', this.sessionId);
    
    try {
      const response = await fetch(`/api/validate/stop/${this.sessionId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      console.log('Stop response:', data);
      
      if (!data.success) {
        console.error('Failed to stop tests:', data.message);
      }
    } catch (error) {
      console.error('Error stopping tests:', error);
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
  }
};
