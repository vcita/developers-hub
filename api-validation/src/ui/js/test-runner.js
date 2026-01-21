/**
 * Test Runner Component
 * Handles test execution and progress updates via SSE
 */

const TestRunner = {
  eventSource: null,
  results: [],
  currentSessionId: null,
  isRunning: false,
  
  /**
   * Run tests for selected endpoints
   * @param {Object[]} endpoints - Endpoints to test
   * @param {Object} options - Test options
   */
  async run(endpoints, options = {}) {
    console.log('TestRunner.run called with', endpoints.length, 'endpoints');
    this.results = [];
    this.isRunning = true;
    this.clearPreflightLog();
    this.updateProgress(0, endpoints.length, 'Starting...');
    this.showStopButton(true);
    
    // Show progress section
    document.getElementById('progress-section')?.classList.remove('hidden');
    
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
      
      // Connect to SSE stream
      console.log('Connecting to SSE stream:', data.sessionId);
      this.connectToStream(data.sessionId, endpoints.length);
      
    } catch (error) {
      console.error('Test run error:', error);
      this.updateProgress(0, 0, `Error: ${error.message}`);
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
    
    this.currentSessionId = sessionId;
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
      this.results.push(result);
      this.updateProgressLog(result.endpoint, result.status, result.duration);
    });
    
    this.eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.cleanup();
      
      this.updateProgress(total, total, 'Complete!');
      this.showResults(data);
    });
    
    this.eventSource.addEventListener('stopped', (event) => {
      const data = JSON.parse(event.data);
      this.cleanup();
      
      this.updateProgress(data.completed || 0, total, '⏹ Stopped');
      if (this.results.length > 0) {
        this.showResults({ results: this.results, summary: { total: this.results.length } });
      }
    });
    
    // Healing events
    this.eventSource.addEventListener('healing_start', (event) => {
      const data = JSON.parse(event.data);
      this.showHealingPanel(data);
    });
    
    this.eventSource.addEventListener('healing_analyzing', (event) => {
      const data = JSON.parse(event.data);
      this.updateHealingStep(data, 'analyzing');
    });
    
    this.eventSource.addEventListener('healing_solution', (event) => {
      const data = JSON.parse(event.data);
      this.updateHealingStep(data, 'solution');
    });
    
    this.eventSource.addEventListener('healing_creating', (event) => {
      const data = JSON.parse(event.data);
      this.updateHealingStep(data, 'creating');
    });
    
    this.eventSource.addEventListener('healing_created', (event) => {
      const data = JSON.parse(event.data);
      this.updateHealingStep(data, 'created');
    });
    
    this.eventSource.addEventListener('healing_retry', (event) => {
      const data = JSON.parse(event.data);
      this.updateHealingStep(data, 'retry');
    });
    
    this.eventSource.addEventListener('healing_complete', (event) => {
      const data = JSON.parse(event.data);
      this.completeHealing(data);
    });
    
    this.eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      this.cleanup();
    });
    
    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      this.cleanup();
    };
  },
  
  /**
   * Stop the current test execution
   */
  async stop() {
    if (!this.isRunning || !this.currentSessionId) {
      console.log('No test running to stop');
      return;
    }
    
    console.log('Stopping test session:', this.currentSessionId);
    
    try {
      await fetch(`/api/validate/stop/${this.currentSessionId}`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error stopping test:', error);
    }
    
    // Close SSE connection immediately
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.cleanup();
    this.updateProgress(this.results.length, this.results.length, '⏹ Stopped by user');
    
    // Show partial results if any
    if (this.results.length > 0) {
      this.showResults({ results: this.results, summary: { total: this.results.length } });
    }
  },
  
  /**
   * Cleanup after test completes or stops
   */
  cleanup() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isRunning = false;
    this.currentSessionId = null;
    this.showStopButton(false);
  },
  
  /**
   * Show or hide the stop button
   */
  showStopButton(show) {
    const stopBtn = document.getElementById('stop-btn');
    const runBtn = document.getElementById('run-btn');
    
    if (stopBtn) {
      stopBtn.classList.toggle('hidden', !show);
    }
    if (runBtn) {
      runBtn.disabled = show;
    }
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
    const progressEl = document.getElementById('preflight-progress');
    const counterEl = document.getElementById('preflight-counter');
    
    if (phaseEl) phaseEl.textContent = data.phase || 'Resolving parameters...';
    if (statusEl) statusEl.textContent = data.status || '';
    
    // Update progress indicator if progress data is available
    if (data.progress) {
      const { resolved, total } = data.progress;
      
      // Update counter
      if (counterEl) {
        if (total > 0) {
          counterEl.textContent = `${resolved}/${total} resolved`;
          counterEl.className = 'preflight-counter';
          if (resolved === total) {
            counterEl.classList.add('complete');
          }
        } else {
          counterEl.textContent = 'Analyzing...';
        }
      }
      
      // Update progress bar
      if (progressEl && total > 0) {
        const percent = Math.round((resolved / total) * 100);
        progressEl.innerHTML = `
          <div class="progress-bar-mini">
            <div class="progress-fill" style="width: ${percent}%"></div>
          </div>
        `;
      } else if (progressEl) {
        progressEl.innerHTML = '<span class="progress-spinner">⟳</span>';
      }
    }
    
    // Update main progress bar for pre-flight
    document.getElementById('progress-text').textContent = data.phase || 'Pre-flight...';
    document.getElementById('progress-percent').textContent = data.progress?.total > 0 
      ? `${data.progress.resolved}/${data.progress.total}` 
      : '...';
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
      const statusClass = status === 'PASS' ? 'pass' : 
                          status === 'FAIL' ? 'fail' : 
                          status === 'WARN' ? 'warn' : 
                          status === 'ERROR' ? 'error' : 'skip';
      const icon = status === 'PASS' ? '✓' : 
                   status === 'FAIL' ? '✗' : 
                   status === 'WARN' ? '⚠' : 
                   status === 'ERROR' ? '❌' : '○';
      
      entry.innerHTML = `
        <span class="status-icon status-${statusClass}">${icon}</span>
        <span class="endpoint-name">${endpoint}</span>
        <span class="duration">${duration || '-'}</span>
        <span class="status-badge status-${statusClass}">${status}</span>
      `;
    }
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
    
    // Hide any healing panels
    this.hideHealingPanel();
    
    // Show results section
    const resultsSection = document.getElementById('results-section');
    resultsSection?.classList.remove('hidden');
    
    // Update summary
    document.getElementById('results-passed').textContent = summary.passed;
    document.getElementById('results-failed').textContent = summary.failed;
    document.getElementById('results-warned').textContent = summary.warned || 0;
    document.getElementById('results-errored').textContent = summary.errored || 0;
    document.getElementById('results-skipped').textContent = summary.skipped;
    
    // Render results
    ResultsViewer.render(this.results);
    
    // Smooth scroll to results section
    setTimeout(() => {
      resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  },
  
  // ============== HEALING PANEL METHODS ==============
  
  /**
   * Show the healing panel for an endpoint
   */
  showHealingPanel(data) {
    // Remove any existing healing panel
    this.hideHealingPanel();
    
    const progressSection = document.getElementById('progress-section');
    if (!progressSection) return;
    
    const panel = document.createElement('div');
    panel.id = 'healing-panel';
    panel.className = 'healing-panel';
    panel.dataset.endpoint = data.endpoint;
    
    panel.innerHTML = `
      <div class="healing-header">
        <span class="healing-icon spinning">🔧</span>
        <span class="healing-title">Self-Healing in Progress</span>
        <span class="healing-attempt">Attempt 0/5</span>
      </div>
      
      <div class="healing-timeline">
        <div class="timeline-step error">
          <div class="step-icon">❌</div>
          <div class="step-content">
            <div class="step-title">Original Error</div>
            <div class="step-detail">${this.escapeHtml(data.originalError || 'Unknown error')}</div>
          </div>
        </div>
        
        <div class="timeline-step active" id="healing-step-analyzing">
          <div class="step-icon spinning">🤖</div>
          <div class="step-content">
            <div class="step-title">AI Analyzing...</div>
            <div class="step-detail">Identifying root cause and prerequisites</div>
          </div>
        </div>
        
        <div class="timeline-step pending" id="healing-step-creating">
          <div class="step-icon">📦</div>
          <div class="step-content">
            <div class="step-title">Creating Prerequisites</div>
            <div class="step-detail">Waiting...</div>
          </div>
        </div>
        
        <div class="timeline-step pending" id="healing-step-retry">
          <div class="step-icon">🔄</div>
          <div class="step-content">
            <div class="step-title">Retry Original Request</div>
            <div class="step-detail"></div>
          </div>
        </div>
      </div>
      
      <div class="healing-docs-issues hidden" id="healing-docs-issues">
        <div class="docs-header">📝 Documentation Issues Found</div>
        <div class="docs-list"></div>
      </div>
    `;
    
    progressSection.appendChild(panel);
    
    // Update progress text
    document.getElementById('progress-text').textContent = `🔧 Healing: ${data.endpoint}`;
  },
  
  /**
   * Update a healing step
   */
  updateHealingStep(data, step) {
    const panel = document.getElementById('healing-panel');
    if (!panel) return;
    
    // Update attempt counter
    const attemptEl = panel.querySelector('.healing-attempt');
    if (attemptEl && data.attempt) {
      attemptEl.textContent = `Attempt ${data.attempt}/5`;
    }
    
    switch (step) {
      case 'analyzing':
        this.setStepActive('healing-step-analyzing', data.message || 'AI Analyzing...');
        break;
        
      case 'solution':
        this.setStepCompleted('healing-step-analyzing');
        
        // Show root cause
        const analyzingStep = document.getElementById('healing-step-analyzing');
        if (analyzingStep) {
          const detail = analyzingStep.querySelector('.step-detail');
          if (detail) detail.textContent = data.rootCause || 'Analysis complete';
        }
        
        // Update creating step with prerequisites
        if (data.prerequisites?.length > 0) {
          const prereqNames = data.prerequisites.map(p => `${p.method || 'POST'} ${p.endpoint}`).join(', ');
          const creatingStep = document.getElementById('healing-step-creating');
          if (creatingStep) {
            const title = creatingStep.querySelector('.step-title');
            if (title) title.textContent = `Creating: ${prereqNames}`;
          }
        }
        
        // Show documentation issues if any
        if (data.documentationIssues?.length > 0) {
          this.showDocumentationIssues(data.documentationIssues);
        }
        break;
        
      case 'creating':
        this.setStepActive('healing-step-creating', 
          `Step ${data.step || 1}/${data.totalSteps || 1}: ${data.creating || data.prerequisite?.endpoint || ''}`);
        break;
        
      case 'created':
        if (data.extractedUid) {
          const creatingStep = document.getElementById('healing-step-creating');
          if (creatingStep) {
            const detail = creatingStep.querySelector('.step-detail');
            if (detail) detail.textContent = `Created! Extracted: ${data.storeAs || 'uid'} = ${data.extractedUid}`;
          }
        }
        // If all prerequisites created, mark as completed
        if (data.step === data.totalSteps) {
          this.setStepCompleted('healing-step-creating');
        }
        break;
        
      case 'retry':
        this.setStepCompleted('healing-step-creating');
        this.setStepActive('healing-step-retry', data.message || 'Retrying with resolved dependencies...');
        break;
    }
  },
  
  /**
   * Set a step as active
   */
  setStepActive(stepId, message) {
    const step = document.getElementById(stepId);
    if (!step) return;
    
    step.classList.remove('pending', 'completed', 'error');
    step.classList.add('active');
    
    const icon = step.querySelector('.step-icon');
    if (icon) icon.classList.add('spinning');
    
    if (message) {
      const detail = step.querySelector('.step-detail');
      if (detail) detail.textContent = message;
    }
  },
  
  /**
   * Set a step as completed
   */
  setStepCompleted(stepId) {
    const step = document.getElementById(stepId);
    if (!step) return;
    
    step.classList.remove('pending', 'active', 'error');
    step.classList.add('completed');
    
    const icon = step.querySelector('.step-icon');
    if (icon) {
      icon.classList.remove('spinning');
      icon.textContent = '✓';
    }
  },
  
  /**
   * Show documentation issues in the healing panel
   */
  showDocumentationIssues(issues) {
    const container = document.getElementById('healing-docs-issues');
    if (!container) return;
    
    container.classList.remove('hidden');
    const list = container.querySelector('.docs-list');
    if (!list) return;
    
    list.innerHTML = issues.map(issue => `
      <div class="docs-issue">
        <span class="issue-type">${this.escapeHtml(issue.type)}</span>
        ${issue.field ? `<span class="issue-field">${this.escapeHtml(issue.field)}</span>` : ''}
        <span class="issue-message">${this.escapeHtml(issue.message)}</span>
      </div>
    `).join('');
  },
  
  /**
   * Complete the healing process
   */
  completeHealing(data) {
    const panel = document.getElementById('healing-panel');
    if (!panel) return;
    
    if (data.success) {
      panel.classList.add('success');
      this.setStepCompleted('healing-step-retry');
      
      const retryStep = document.getElementById('healing-step-retry');
      if (retryStep) {
        const detail = retryStep.querySelector('.step-detail');
        if (detail) detail.textContent = '✓ Test passed after healing!';
      }
      
      // Show workflow saved message
      const header = panel.querySelector('.healing-header');
      if (header && data.workflowSaved) {
        header.innerHTML += '<span class="workflow-saved">💾 Workflow saved for future</span>';
      }
    } else {
      panel.classList.add('failed');
      
      const retryStep = document.getElementById('healing-step-retry');
      if (retryStep) {
        retryStep.classList.remove('pending', 'active');
        retryStep.classList.add('error');
        
        const icon = retryStep.querySelector('.step-icon');
        if (icon) icon.textContent = '✗';
        
        const detail = retryStep.querySelector('.step-detail');
        if (detail) detail.textContent = `Failed after ${data.attempts || 5} attempts`;
      }
    }
    
    // Show documentation issues if any
    if (data.documentationIssues?.length > 0) {
      this.showDocumentationIssues(data.documentationIssues);
    }
    
    // Update progress text
    const statusText = data.success ? '✓ Healed' : '✗ Could not heal';
    document.getElementById('progress-text').textContent = `${statusText}: ${data.endpoint}`;
    
    // Auto-hide panel after a delay
    setTimeout(() => {
      this.hideHealingPanel();
    }, data.success ? 2000 : 5000);
  },
  
  /**
   * Hide the healing panel
   */
  hideHealingPanel() {
    const panel = document.getElementById('healing-panel');
    if (panel) {
      panel.remove();
    }
  },
  
  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
