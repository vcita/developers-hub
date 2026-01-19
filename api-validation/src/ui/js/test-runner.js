/**
 * Test Runner Component
 * Handles test execution and progress updates via SSE
 */

const TestRunner = {
  eventSource: null,
  results: [],
  
  /**
   * Run tests for selected endpoints
   * @param {Object[]} endpoints - Endpoints to test
   * @param {Object} options - Test options
   */
  async run(endpoints, options = {}) {
    console.log('TestRunner.run called with', endpoints.length, 'endpoints');
    this.results = [];
    this.updateProgress(0, endpoints.length, 'Starting...');
    
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
    
    this.eventSource = new EventSource(`/api/validate/stream/${sessionId}`);
    
    this.eventSource.addEventListener('start', (event) => {
      const data = JSON.parse(event.data);
      this.updateProgress(0, data.total, 'Running tests...');
    });
    
    this.eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
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
      this.eventSource.close();
      this.eventSource = null;
      
      this.updateProgress(total, total, 'Complete!');
      this.showResults(data);
    });
    
    this.eventSource.addEventListener('error', (event) => {
      console.error('SSE error:', event);
      this.eventSource.close();
      this.eventSource = null;
    });
    
    this.eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      if (this.eventSource) {
        this.eventSource.close();
        this.eventSource = null;
      }
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
      const statusClass = status === 'PASS' ? 'pass' : (status === 'FAIL' ? 'fail' : 'skip');
      const icon = status === 'PASS' ? '✓' : (status === 'FAIL' ? '✗' : '○');
      
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
    // Show results section
    const resultsSection = document.getElementById('results-section');
    resultsSection?.classList.remove('hidden');
    
    // Update summary
    document.getElementById('results-passed').textContent = summary.passed;
    document.getElementById('results-failed').textContent = summary.failed;
    document.getElementById('results-skipped').textContent = summary.skipped;
    
    // Render results
    ResultsViewer.render(this.results);
    
    // Smooth scroll to results section
    setTimeout(() => {
      resultsSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
};
