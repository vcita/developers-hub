/**
 * Fix Runner - UI client for the Auto-Fix system
 * 
 * Manages the SSE connection to fix-report, renders the grouped queue,
 * per-endpoint collapsible log panels, and progress indicators.
 * 
 * Key design: Instead of one continuous thinking stream, each endpoint
 * gets its own collapsible panel with its full agent log. This allows:
 * - Clear separation between fix sessions
 * - Reviewing what happened for any specific endpoint
 * - Detailed failure information for decision-making
 */

const FixRunner = {
  sessionId: null,
  eventSource: null,
  groups: [],
  ungrouped: [],
  endpointResults: {},
  totalEndpoints: 0,

  // Per-endpoint log tracking
  currentEndpoint: null,        // Key of the endpoint currently being fixed
  endpointLogs: {},             // Map<endpointKey, { events: [], status, result, groupId, thinkingBuffer }>
  endpointOrder: [],            // Ordered list of endpoint keys as they are processed

  // ─── Start Fix Session ───────────────────────────────────────────────────

  async startFixSession(failedResults) {
    if (!failedResults || failedResults.length === 0) {
      alert('No failed endpoints to fix.');
      return;
    }

    this.captureOriginalPromptHTML();

    // Read user prompt BEFORE resetState (which restores the section HTML and clears inputs)
    const promptEl = document.getElementById('fix-user-prompt-input');
    const userPrompt = promptEl?.value?.trim() || undefined;

    this.showPanel();
    this.resetState();
    this.setStatus('starting', `Starting fix session for ${failedResults.length} endpoints...`);

    try {
      const response = await fetch('/api/fix-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ failedResults, userPrompt })
      });

      const data = await response.json();
      if (!response.ok) {
        this.setStatus('error', `Failed to start: ${data.error}`);
        return;
      }

      this.sessionId = data.sessionId;
      this.connectSSE(data.sessionId);
      this.setStatus('analyzing', 'Analyzing report and grouping failures...');

    } catch (error) {
      this.setStatus('error', `Network error: ${error.message}`);
    }
  },

  // ─── SSE Connection ──────────────────────────────────────────────────────

  connectSSE(sessionId) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource(`/api/fix-report/stream/${sessionId}`);

    // Initial session status
    this.eventSource.addEventListener('session_status', (e) => {
      const data = JSON.parse(e.data);
      this.totalEndpoints = data.totalEndpoints || 0;
    });

    // Analysis phase
    this.eventSource.addEventListener('analysis_complete', (e) => {
      const data = JSON.parse(e.data);
      this.groups = data.groups || [];
      this.ungrouped = data.ungrouped || [];
      this.totalEndpoints = this.groups.reduce((sum, g) => sum + g.endpointCount, 0) + this.ungrouped.length;
      this.renderQueue();
      this.setStatus('running', `${this.groups.length} groups, ${this.ungrouped.length} ungrouped`);
    });

    // Group lifecycle
    this.eventSource.addEventListener('group_start', (e) => {
      const data = JSON.parse(e.data);
      this.setGroupStatus(data.groupId, 'running');
    });

    this.eventSource.addEventListener('group_complete', (e) => {
      const data = JSON.parse(e.data);
      this.setGroupStatus(data.groupId, 'complete', `${data.fixed}/${data.total} fixed`);
    });

    // Endpoint lifecycle
    this.eventSource.addEventListener('endpoint_start', (e) => {
      const data = JSON.parse(e.data);
      const epKey = data.endpoint;

      // Collapse previous endpoint panel (only if it's a different endpoint)
      if (this.currentEndpoint && this.currentEndpoint !== epKey) {
        this.collapseEndpointPanel(this.currentEndpoint);
      }

      this.currentEndpoint = epKey;

      if (data.isRetry) {
        // Inline retry: reopen the existing panel instead of creating a new one
        this.reopenEndpointForRetry(epKey, data);
      } else {
        // Normal first-run flow
        this.endpointLogs[epKey] = {
          events: [],
          status: 'running',
          result: null,
          groupId: data.groupId,
          isTemplate: data.isTemplate,
          insightAvailable: data.insightAvailable || 0,
          thinkingBuffer: ''
        };
        this.endpointOrder.push(epKey);

        this.setEndpointStatus(epKey, 'running', data.groupId);
        this.createEndpointPanel(epKey, data);
      }
    });

    this.eventSource.addEventListener('endpoint_complete', (e) => {
      const data = JSON.parse(e.data);
      const epKey = data.endpoint;
      const status = data.success ? 'pass' : 'fail';

      this.setEndpointStatus(epKey, status, data.groupId);
      this.endpointResults[epKey] = data;

      if (this.endpointLogs[epKey]) {
        this.endpointLogs[epKey].status = status;
        this.endpointLogs[epKey].result = data;
      }

      this.finalizeEndpointPanel(epKey, data);
      this.updateProgressBar();
    });

    // Thinking stream - routed to current endpoint
    this.eventSource.addEventListener('thinking_delta', (e) => {
      const data = JSON.parse(e.data);
      this.appendEndpointThinking(data.text);
    });

    this.eventSource.addEventListener('thinking', (e) => {
      const data = JSON.parse(e.data);
      this.addEndpointEvent('thinking', data.text);
    });

    // Tool calls
    this.eventSource.addEventListener('tool_call', (e) => {
      const data = JSON.parse(e.data);
      this.addEndpointEvent('tool_call', data);
    });

    this.eventSource.addEventListener('tool_result', (e) => {
      const data = JSON.parse(e.data);
      this.addEndpointEvent('tool_result', data);
    });

    // File changes
    this.eventSource.addEventListener('file_changed', (e) => {
      const data = JSON.parse(e.data);
      this.addEndpointEvent('file_changed', data);
    });

    // Insight captured
    this.eventSource.addEventListener('insight_captured', (e) => {
      const data = JSON.parse(e.data);
      this.addInsightBadge(data.groupId, data.recipesCount);
      this.addEndpointEvent('insight', data);
    });

    // User guidance (from inline retry)
    this.eventSource.addEventListener('user_guidance', (e) => {
      const data = JSON.parse(e.data);
      const epKey = data.endpoint;
      const id = this.sanitizeId(epKey);
      const body = document.getElementById(`ep-log-body-${id}`);
      if (body) {
        const el = document.createElement('div');
        el.className = 'ep-log-entry ep-log-guidance';
        el.innerHTML = `<span class="guidance-icon">💬</span> <strong>User guidance:</strong> ${this.escapeHtml(data.text)}`;
        body.appendChild(el);
        body.scrollTop = body.scrollHeight;
      }
    });

    // Knowledge base updated
    this.eventSource.addEventListener('knowledge_base_updated', (e) => {
      const data = JSON.parse(e.data);
      this.addGlobalEvent(`📚 Knowledge base updated: ${data.newEntries} new entries`);
    });

    // Unification
    this.eventSource.addEventListener('unification_complete', (e) => {
      const data = JSON.parse(e.data);
      this.addGlobalEvent(`🔄 ${data.message}`);
    });

    // Session lifecycle
    this.eventSource.addEventListener('session_stopping', () => {
      this.setStatus('stopping', 'Stopping after current endpoint...');
    });

    this.eventSource.addEventListener('session_complete', (e) => {
      const data = JSON.parse(e.data);
      this.renderSummary(data.summary);
      this.setStatus('completed', 'Session complete');
      // DO NOT close the SSE — keep it alive so inline retries can push events
      // through the same connection without creating a new session.
    });

    // Updated summary after an inline retry completes (stats only, no auto-expand/scroll)
    this.eventSource.addEventListener('session_summary_updated', (e) => {
      const data = JSON.parse(e.data);
      this.renderSummary(data.summary, { autoExpandFailed: false });
      this.setStatus('completed', 'Session complete');
    });

    this.eventSource.addEventListener('session_error', (e) => {
      const data = JSON.parse(e.data);
      this.setStatus('error', `Error: ${data.error}`);
      this.eventSource.close();
      this.eventSource = null;
    });

    this.eventSource.onerror = () => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.setStatus('disconnected', 'Connection lost');
      }
    };
  },

  // ─── Stop Session ────────────────────────────────────────────────────────

  async stopSession() {
    if (!this.sessionId) return;

    try {
      await fetch(`/api/fix-report/stop/${this.sessionId}`, { method: 'POST' });
      this.setStatus('stopping', 'Stopping after current endpoint...');
    } catch (error) {
      console.error('Failed to stop session:', error);
    }
  },

  // ─── Per-Endpoint Log Management ────────────────────────────────────────

  addEndpointEvent(type, data) {
    const epKey = this.currentEndpoint;
    if (!epKey || !this.endpointLogs[epKey]) return;

    // Finalize any in-progress thinking buffer
    const log = this.endpointLogs[epKey];
    if (log.thinkingBuffer && type !== 'thinking_delta') {
      log.events.push({ type: 'thinking', text: log.thinkingBuffer, ts: Date.now() });
      log.thinkingBuffer = '';
    }

    log.events.push({ type, data, ts: Date.now() });
    this.renderEventToPanel(epKey, type, data);
  },

  appendEndpointThinking(text) {
    const epKey = this.currentEndpoint;
    if (!epKey || !this.endpointLogs[epKey]) return;

    const log = this.endpointLogs[epKey];
    log.thinkingBuffer += text;

    // Update the live thinking element in the panel
    const panel = document.getElementById(`ep-log-body-${this.sanitizeId(epKey)}`);
    if (!panel) return;

    let current = panel.querySelector('.ep-thinking-current');
    if (!current) {
      current = document.createElement('div');
      current.className = 'ep-log-entry ep-thinking-current';
      panel.appendChild(current);
    }
    current.textContent = log.thinkingBuffer;

    // Auto-scroll the panel
    panel.scrollTop = panel.scrollHeight;
  },

  // ─── Endpoint Panel DOM ─────────────────────────────────────────────────

  createEndpointPanel(epKey, startData) {
    const stream = document.getElementById('fix-thinking-stream');
    if (!stream) return;

    const id = this.sanitizeId(epKey);
    const panel = document.createElement('div');
    panel.className = 'ep-log-panel ep-log-running';
    panel.id = `ep-log-${id}`;

    const badges = [];
    if (startData.isTemplate) badges.push('<span class="ep-badge ep-badge-template">TEMPLATE</span>');
    if (startData.insightAvailable > 0) badges.push(`<span class="ep-badge ep-badge-insight">💡 ${startData.insightAvailable} recipe${startData.insightAvailable > 1 ? 's' : ''}</span>`);

    panel.innerHTML = `
      <div class="ep-log-header" onclick="FixRunner.toggleEndpointPanel('${id}')">
        <span class="ep-log-status-icon" id="ep-icon-${id}">🔄</span>
        <span class="ep-log-endpoint" title="${this.escapeHtml(epKey)}">${this.escapeHtml(epKey)}</span>
        ${badges.join(' ')}
        <span class="ep-log-summary" id="ep-summary-${id}" title="">Running...</span>
        <span class="ep-log-toggle" id="ep-toggle-${id}">▼</span>
      </div>
      <div class="ep-log-body" id="ep-log-body-${id}"></div>
      <div class="ep-log-failure-card hidden" id="ep-failure-${id}"></div>
    `;

    stream.appendChild(panel);
    // Scroll to the new panel
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /**
   * Reopen an existing endpoint panel for an inline retry.
   * Resets the status indicators, adds a retry separator to the log body,
   * and expands the panel so new events append continuously.
   */
  reopenEndpointForRetry(epKey, startData) {
    const id = this.sanitizeId(epKey);
    const panel = document.getElementById(`ep-log-${id}`);

    if (!panel) {
      // Fallback: create a new panel if the old one is missing
      this.endpointLogs[epKey] = {
        events: [], status: 'running', result: null,
        groupId: startData.groupId, thinkingBuffer: ''
      };
      this.endpointOrder.push(epKey);
      this.createEndpointPanel(epKey, startData);
      return;
    }

    // Reset the endpoint log for the new attempt (DOM history is preserved)
    this.endpointLogs[epKey] = {
      events: [],
      status: 'running',
      result: null,
      groupId: startData.groupId || this.endpointLogs[epKey]?.groupId,
      isTemplate: false,
      insightAvailable: 0,
      thinkingBuffer: ''
    };

    // Update panel styling back to "running"
    panel.className = 'ep-log-panel ep-log-running';

    const icon = document.getElementById(`ep-icon-${id}`);
    if (icon) icon.textContent = '🔄';

    const summary = document.getElementById(`ep-summary-${id}`);
    if (summary) {
      summary.textContent = 'Retrying...';
      summary.className = 'ep-log-summary';
    }

    // Hide the failure card (will be re-rendered on endpoint_complete if it fails again)
    const failureCard = document.getElementById(`ep-failure-${id}`);
    if (failureCard) {
      failureCard.classList.add('hidden');
      failureCard.style.display = 'none';
    }

    // Expand the log body and add a retry separator
    const body = document.getElementById(`ep-log-body-${id}`);
    const toggle = document.getElementById(`ep-toggle-${id}`);
    if (body) {
      body.classList.remove('collapsed');
      const separator = document.createElement('div');
      separator.className = 'ep-log-entry ep-log-retry-separator';
      separator.innerHTML = '<hr><strong>🔄 Retrying with guidance...</strong>';
      body.appendChild(separator);
    }
    if (toggle) toggle.textContent = '▼';

    this.setEndpointStatus(epKey, 'running', startData.groupId);
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  finalizeEndpointPanel(epKey, resultData) {
    const id = this.sanitizeId(epKey);
    const panel = document.getElementById(`ep-log-${id}`);
    if (!panel) return;

    // Finalize any remaining thinking buffer
    const log = this.endpointLogs[epKey];
    if (log?.thinkingBuffer) {
      log.events.push({ type: 'thinking', text: log.thinkingBuffer, ts: Date.now() });
      log.thinkingBuffer = '';
    }

    // Remove the live-typing cursor
    const current = panel.querySelector('.ep-thinking-current');
    if (current) current.classList.remove('ep-thinking-current');

    // Update panel status
    panel.className = `ep-log-panel ${resultData.success ? 'ep-log-pass' : 'ep-log-fail'}`;

    // Update icon
    const icon = document.getElementById(`ep-icon-${id}`);
    if (icon) icon.textContent = resultData.success ? '✅' : '❌';

    // Update summary
    const summary = document.getElementById(`ep-summary-${id}`);
    if (summary) {
      const summaryText = resultData.fixSummary || (resultData.success ? 'Fixed' : 'Failed');
      summary.textContent = summaryText;
      summary.title = summaryText;
      summary.className = `ep-log-summary ${resultData.success ? 'ep-summary-pass' : 'ep-summary-fail'}`;
    }

    // For failed endpoints, render a failure detail card
    if (!resultData.success) {
      this.renderFailureCard(epKey, resultData);
    }

    // Count tool calls and iterations for the header
    const toolCalls = (log?.events || []).filter(e => e.type === 'tool_call').length;
    const iterBadge = document.createElement('span');
    iterBadge.className = 'ep-badge ep-badge-iterations';
    iterBadge.textContent = `${resultData.iterations || '?'} iter, ${toolCalls} tools`;
    const header = panel.querySelector('.ep-log-header');
    if (header) header.insertBefore(iterBadge, header.querySelector('.ep-log-toggle'));

    // Auto-collapse the log body once finalized — UNLESS this is a failed retry,
    // in which case keep the panel expanded so the user can immediately provide
    // new guidance and see what happened.
    if (resultData.isRetry && !resultData.success) {
      // Keep expanded — failure card is visible with retry input
    } else {
      this.collapseEndpointPanel(epKey);
    }
  },

  renderFailureCard(epKey, resultData) {
    const id = this.sanitizeId(epKey);
    const card = document.getElementById(`ep-failure-${id}`);
    if (!card) return;

    const log = this.endpointLogs[epKey];
    const events = log?.events || [];

    // Extract key information from events
    const toolCalls = events.filter(e => e.type === 'tool_call');
    const toolResults = events.filter(e => e.type === 'tool_result');
    const fileChanges = events.filter(e => e.type === 'file_changed');
    const failedAPICalls = toolResults.filter(e => e.data?.result?.error || (e.data?.result?.status && e.data.result.status >= 400));

    // Build the failure card
    let html = `
      <div class="failure-card-header">
        <span class="failure-icon">❌</span>
        <span class="failure-title">Fix Failed: ${this.escapeHtml(resultData.fixSummary || 'Agent could not resolve this endpoint')}</span>
      </div>
      <div class="failure-card-body">
        <div class="failure-stats">
          <span class="failure-stat">🔧 ${toolCalls.length} tool calls</span>
          <span class="failure-stat">📝 ${fileChanges.length} file changes</span>
          <span class="failure-stat">🚫 ${failedAPICalls.length} failed API calls</span>
          <span class="failure-stat">🔄 ${resultData.iterations || '?'} iterations</span>
        </div>`;

    // Show what the agent tried (last few key tool calls)
    if (toolCalls.length > 0) {
      const lastCalls = toolCalls.slice(-5);
      html += `<div class="failure-section">
        <div class="failure-section-title">Last ${lastCalls.length} actions:</div>
        <div class="failure-actions">`;
      for (const tc of lastCalls) {
        const emoji = this.getToolEmoji(tc.data?.tool);
        const summary = this.summarizeToolInput(tc.data?.tool, tc.data?.input);
        html += `<div class="failure-action">${emoji} <strong>${tc.data?.tool}</strong> ${this.escapeHtml(summary)}</div>`;
      }
      html += `</div></div>`;
    }

    // Show failed API responses
    if (failedAPICalls.length > 0) {
      const lastFails = failedAPICalls.slice(-3);
      html += `<div class="failure-section">
        <div class="failure-section-title">Key errors:</div>
        <div class="failure-errors">`;
      for (const fr of lastFails) {
        const status = fr.data?.result?.status ? `HTTP ${fr.data.result.status}` : '';
        const errMsg = fr.data?.result?.error || fr.data?.result?.preview || '';
        html += `<div class="failure-error">${status} ${this.escapeHtml(String(errMsg).substring(0, 150))}</div>`;
      }
      html += `</div></div>`;
    }

    // Retry with guidance
    html += `<div class="failure-retry-section" id="ep-retry-${id}">
      <textarea class="failure-retry-input" id="ep-retry-input-${id}" rows="2" placeholder="Additional guidance for retrying this endpoint..."></textarea>
      <div class="failure-actions-bar">
        <button class="btn btn-sm btn-primary" onclick="FixRunner.retryEndpoint('${this.escapeHtml(epKey)}')">🔄 Retry with Guidance</button>
        <button class="btn btn-sm btn-secondary" onclick="FixRunner.copyEndpointLog('${epKey}')">📋 Copy Full Log</button>
        <button class="btn btn-sm btn-secondary" onclick="FixRunner.expandEndpointPanel('${id}')">📖 View Full Log</button>
      </div>
    </div>`;

    html += `</div>`;
    card.innerHTML = html;
    card.classList.remove('hidden');
  },

  renderEventToPanel(epKey, type, data) {
    const id = this.sanitizeId(epKey);
    const body = document.getElementById(`ep-log-body-${id}`);
    if (!body) return;

    // Remove the live thinking cursor before adding a new block
    const current = body.querySelector('.ep-thinking-current');
    if (current && type !== 'thinking_delta') {
      current.classList.remove('ep-thinking-current');
    }

    const el = document.createElement('div');

    switch (type) {
      case 'thinking':
        el.className = 'ep-log-entry ep-log-thinking';
        el.textContent = data;
        break;

      case 'tool_call': {
        const emoji = this.getToolEmoji(data.tool);
        const summary = this.summarizeToolInput(data.tool, data.input);
        el.className = 'ep-log-entry ep-log-tool-call';
        el.innerHTML = `<span class="tool-emoji">${emoji}</span> <strong>${data.tool}</strong> ${this.escapeHtml(summary)}`;
        break;
      }

      case 'tool_result': {
        const statusIcon = data.result?.success ? '✅' : (data.result?.error ? '❌' : '📋');
        const statusText = data.result?.status ? `HTTP ${data.result.status}` : '';
        el.className = `ep-log-entry ep-log-tool-result ${data.result?.success ? 'tool-success' : 'tool-failure'}`;
        el.textContent = `  ${statusIcon} ${statusText} ${data.result?.preview ? data.result.preview.substring(0, 100) : ''}`;
        break;
      }

      case 'file_changed':
        el.className = 'ep-log-entry ep-log-file-change';
        el.textContent = `📝 File changed: ${data.file} (${data.action})`;
        break;

      case 'insight':
        el.className = 'ep-log-entry ep-log-insight';
        el.textContent = `💡 Pattern learned: ${data.recipe?.fixApplied || ''}`;
        break;

      default:
        el.className = 'ep-log-entry';
        el.textContent = JSON.stringify(data).substring(0, 200);
    }

    body.appendChild(el);

    // Auto-scroll the panel body
    body.scrollTop = body.scrollHeight;
  },

  // ─── Panel Toggle ──────────────────────────────────────────────────────

  toggleEndpointPanel(id) {
    const body = document.getElementById(`ep-log-body-${id}`);
    const toggle = document.getElementById(`ep-toggle-${id}`);
    const failure = document.getElementById(`ep-failure-${id}`);
    if (body) {
      const isCollapsed = body.classList.toggle('collapsed');
      if (toggle) toggle.textContent = isCollapsed ? '▶' : '▼';
      // Show/hide failure card too
      if (failure && !failure.classList.contains('hidden')) {
        failure.style.display = isCollapsed ? 'none' : '';
      }
    }
  },

  collapseEndpointPanel(epKey) {
    const id = this.sanitizeId(epKey);
    const body = document.getElementById(`ep-log-body-${id}`);
    const toggle = document.getElementById(`ep-toggle-${id}`);
    const failure = document.getElementById(`ep-failure-${id}`);
    if (body && !body.classList.contains('collapsed')) {
      body.classList.add('collapsed');
      if (toggle) toggle.textContent = '▶';
      // Hide failure card too (matching toggleEndpointPanel behavior)
      if (failure && !failure.classList.contains('hidden')) {
        failure.style.display = 'none';
      }
    }
  },

  expandEndpointPanel(id) {
    const body = document.getElementById(`ep-log-body-${id}`);
    const toggle = document.getElementById(`ep-toggle-${id}`);
    if (body) {
      body.classList.remove('collapsed');
      if (toggle) toggle.textContent = '▼';
      body.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  scrollToEndpointPanel(epKey) {
    const id = this.sanitizeId(epKey);
    const panel = document.getElementById(`ep-log-${id}`);
    if (panel) {
      // Expand it
      this.expandEndpointPanel(id);
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  // ─── Copy Endpoint Log ─────────────────────────────────────────────────

  copyEndpointLog(epKey) {
    const log = this.endpointLogs[epKey];
    if (!log) return;

    let text = `=== Fix Log: ${epKey} ===\n`;
    text += `Status: ${log.status}\n`;
    if (log.result) {
      text += `Result: ${log.result.success ? 'SUCCESS' : 'FAILED'}\n`;
      text += `Summary: ${log.result.fixSummary || 'No summary'}\n`;
      text += `Iterations: ${log.result.iterations || '?'}\n`;
    }
    text += `\n--- Events ---\n\n`;

    for (const event of log.events) {
      switch (event.type) {
        case 'thinking':
          text += `[Thinking] ${event.text || event.data}\n`;
          break;
        case 'tool_call':
          text += `[Tool Call] ${event.data?.tool} ${this.summarizeToolInput(event.data?.tool, event.data?.input)}\n`;
          break;
        case 'tool_result': {
          const status = event.data?.result?.status ? `HTTP ${event.data.result.status}` : '';
          const err = event.data?.result?.error || '';
          text += `[Tool Result] ${status} ${err}\n`;
          break;
        }
        case 'file_changed':
          text += `[File Changed] ${event.data?.file} (${event.data?.action})\n`;
          break;
        case 'insight':
          text += `[Insight] ${event.data?.recipe?.fixApplied}\n`;
          break;
        default:
          text += `[${event.type}] ${JSON.stringify(event.data).substring(0, 200)}\n`;
      }
    }

    navigator.clipboard.writeText(text).then(() => {
      // Brief visual feedback
      const btn = document.querySelector(`#ep-failure-${this.sanitizeId(epKey)} .btn`);
      if (btn) {
        const orig = btn.textContent;
        btn.textContent = '✅ Copied!';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      }
    });
  },

  // ─── Global Events (not tied to an endpoint) ──────────────────────────

  addGlobalEvent(text) {
    const stream = document.getElementById('fix-thinking-stream');
    if (!stream) return;
    const el = document.createElement('div');
    el.className = 'ep-global-event';
    el.textContent = text;
    stream.appendChild(el);
  },

  // ─── Queue Rendering ────────────────────────────────────────────────────

  renderQueue() {
    const queueEl = document.getElementById('fix-queue');
    if (!queueEl) return;

    let html = '';

    for (const group of this.groups) {
      html += `<div class="fix-group" id="fix-group-${group.id}">
        <div class="fix-group-header" onclick="FixRunner.toggleGroup('${group.id}')">
          <span class="fix-group-arrow">▶</span>
          <span class="fix-group-status-icon" id="fix-group-icon-${group.id}">⏳</span>
          <span class="fix-group-label">${this.escapeHtml(group.label)}</span>
          <span class="fix-group-badge" id="fix-group-badge-${group.id}">${group.endpointCount} endpoints</span>
          <span class="fix-group-insight-badge hidden" id="fix-group-insight-${group.id}"></span>
        </div>
        <div class="fix-group-body hidden" id="fix-group-body-${group.id}">
          ${group.hasKBMatch ? `<div class="fix-group-directive">📖 KB: ${this.escapeHtml(group.directive.substring(0, 120))}...</div>` : ''}
          <div class="fix-endpoint-list">`;

      const endpoints = group.endpoints || [];
      for (let i = 0; i < group.endpointCount; i++) {
        const epLabel = endpoints[i] || `Endpoint ${i + 1}`;
        html += `<div class="fix-endpoint" id="fix-ep-${group.id}-${i}" onclick="FixRunner.scrollToEndpointPanel('${this.escapeHtml(epLabel)}')">
            <span class="fix-ep-status">⏳</span>
            <span class="fix-ep-label" title="${this.escapeHtml(epLabel)}">${this.escapeHtml(epLabel)}</span>
            ${i === 0 ? '<span class="fix-ep-template-badge">TEMPLATE</span>' : ''}
          </div>`;
      }

      html += `</div></div></div>`;
    }

    if (this.ungrouped.length > 0) {
      html += `<div class="fix-group" id="fix-group-ungrouped">
        <div class="fix-group-header" onclick="FixRunner.toggleGroup('ungrouped')">
          <span class="fix-group-arrow">▶</span>
          <span class="fix-group-status-icon">🔹</span>
          <span class="fix-group-label">Unique Failures (${this.ungrouped.length} endpoints)</span>
        </div>
        <div class="fix-group-body hidden" id="fix-group-body-ungrouped">
          <div class="fix-endpoint-list">`;

      for (let i = 0; i < this.ungrouped.length; i++) {
        const ep = this.ungrouped[i];
        html += `<div class="fix-endpoint" id="fix-ep-ungrouped-${i}" onclick="FixRunner.scrollToEndpointPanel('${this.escapeHtml(ep.endpoint)}')">
            <span class="fix-ep-status">⏳</span>
            <span class="fix-ep-label">${this.escapeHtml(ep.endpoint)}</span>
          </div>`;
      }

      html += `</div></div></div>`;
    }

    queueEl.innerHTML = html;
  },

  toggleGroup(groupId) {
    const body = document.getElementById(`fix-group-body-${groupId}`);
    const arrow = document.querySelector(`#fix-group-${groupId} .fix-group-arrow`);
    if (body) {
      body.classList.toggle('hidden');
      if (arrow) arrow.textContent = body.classList.contains('hidden') ? '▶' : '▼';
    }
  },

  setGroupStatus(groupId, status, detail) {
    const icon = document.getElementById(`fix-group-icon-${groupId}`);
    const badge = document.getElementById(`fix-group-badge-${groupId}`);
    if (icon) {
      icon.textContent = status === 'running' ? '🔄' : status === 'complete' ? '✅' : '⏳';
    }
    if (badge && detail) {
      badge.textContent = detail;
    }
    if (status === 'running') {
      const body = document.getElementById(`fix-group-body-${groupId}`);
      const arrow = document.querySelector(`#fix-group-${groupId} .fix-group-arrow`);
      if (body) body.classList.remove('hidden');
      if (arrow) arrow.textContent = '▼';
    }
  },

  setEndpointStatus(endpoint, status, groupId) {
    const statusIcons = { pending: '⏳', running: '🔄', pass: '✅', fail: '❌' };
    const allEps = document.querySelectorAll('.fix-endpoint');
    for (const el of allEps) {
      const label = el.querySelector('.fix-ep-label');
      if (label && label.textContent.includes(endpoint?.split(' ').slice(-1)[0]?.split('/').slice(-1)[0] || '___')) {
        const statusEl = el.querySelector('.fix-ep-status');
        if (statusEl) statusEl.textContent = statusIcons[status] || '⏳';
        el.className = `fix-endpoint fix-ep-${status}`;
        return;
      }
    }
    // Fallback
    const runningEps = document.querySelectorAll('.fix-ep-status');
    for (const el of runningEps) {
      if (el.textContent === '⏳') {
        el.textContent = statusIcons[status] || '⏳';
        el.parentElement.className = `fix-endpoint fix-ep-${status}`;
        const label = el.parentElement.querySelector('.fix-ep-label');
        if (label && endpoint) label.textContent = endpoint;
        return;
      }
    }
  },

  addInsightBadge(groupId, count) {
    const badge = document.getElementById(`fix-group-insight-${groupId}`);
    if (badge) {
      badge.textContent = `💡 ${count} pattern${count > 1 ? 's' : ''} learned`;
      badge.classList.remove('hidden');
    }
  },

  // ─── Progress Bar ────────────────────────────────────────────────────────

  updateProgressBar() {
    const completed = Object.keys(this.endpointResults).length;
    const allCount = this.groups.reduce((sum, g) => sum + g.endpointCount, 0) + this.ungrouped.length;
    const total = allCount > 0 ? allCount : this.totalEndpoints;
    const passed = Object.values(this.endpointResults).filter(r => r.success).length;

    const progressEl = document.getElementById('fix-progress-bar');
    const textEl = document.getElementById('fix-progress-text');

    if (progressEl && total > 0) {
      progressEl.style.width = `${Math.round((completed / total) * 100)}%`;
    }
    if (textEl) {
      textEl.textContent = `${completed}/${total} endpoints (${passed} fixed)`;
    }
  },

  // ─── Summary ─────────────────────────────────────────────────────────────

  renderSummary(summary, { autoExpandFailed = true } = {}) {
    // Store last summary for continue feature
    this.lastSummary = summary;

    // Render summary stats into the top prompt section (replacing the generic input)
    const promptSection = document.getElementById('fix-user-prompt-section');
    if (!promptSection) return;

    const hasFailed = summary.failed > 0;

    let html = `
      <div class="fix-summary-stats">
        <span class="fix-stat fix-stat-pass">✅ Fixed: ${summary.fixed}</span>
        <span class="fix-stat fix-stat-fail">❌ Failed: ${summary.failed}</span>
        <span class="fix-stat">📊 Pass Rate: ${summary.passRate}</span>
        <span class="fix-stat">📂 Groups: ${summary.groupsCompleted}/${summary.groupsTotal}</span>
        <span class="fix-stat">⏱️ Duration: ${Math.round(summary.duration / 1000)}s</span>
        ${summary.stoppedEarly ? '<span class="fix-stat fix-stat-warn">⚠️ Stopped early</span>' : ''}
      </div>`;

    if (hasFailed) {
      html += `<p class="fix-continue-hint" style="margin-top:8px;">Expand any failed endpoint below to provide guidance and retry it individually.</p>`;
    }

    promptSection.innerHTML = html;

    // Auto-expand failed endpoint panels (only on initial session complete, not after retries)
    if (hasFailed && autoExpandFailed) {
      const failedResults = (summary.results || []).filter(r => !r.success);
      for (const r of failedResults) {
        const id = this.sanitizeId(r.endpoint);
        this.expandEndpointPanel(id);
        // Also make the failure card visible
        const failureCard = document.getElementById(`ep-failure-${id}`);
        if (failureCard) {
          failureCard.style.display = '';
        }
      }
      // Scroll to the first failed endpoint
      if (failedResults.length > 0) {
        const firstId = this.sanitizeId(failedResults[0].endpoint);
        const firstPanel = document.getElementById(`ep-log-${firstId}`);
        if (firstPanel) firstPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  },

  // ─── Continue Session ───────────────────────────────────────────────────

  async continueSession(skipPrompt = false) {
    if (!this.sessionId) {
      alert('No session to continue from.');
      return;
    }

    // Gather per-endpoint prompts from the individual textareas
    const endpointPrompts = {};
    if (!skipPrompt) {
      const epInputs = document.querySelectorAll('.fix-ep-prompt-input');
      for (const input of epInputs) {
        const epKey = input.dataset.endpoint;
        const value = input.value?.trim();
        if (epKey && value) {
          endpointPrompts[epKey] = value;
        }
      }
    }

    // Read the general prompt (fallback for endpoints without specific guidance)
    const continuePromptEl = document.getElementById('fix-continue-prompt');
    const panelPromptEl = document.getElementById('fix-user-prompt-input');
    const userPrompt = skipPrompt ? '' : (continuePromptEl?.value?.trim() || panelPromptEl?.value?.trim() || '');

    const hasAnyPrompt = userPrompt || Object.keys(endpointPrompts).length > 0;

    // Disable continue buttons while starting
    const continueSection = document.querySelector('.fix-continue-section');
    if (continueSection) {
      continueSection.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }

    try {
      const response = await fetch(`/api/fix-report/continue/${this.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: userPrompt || undefined,
          endpointPrompts: Object.keys(endpointPrompts).length > 0 ? endpointPrompts : undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(`Failed to continue: ${data.error}`);
        if (continueSection) {
          continueSection.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
        return;
      }

      // Add a visual separator in the thinking stream
      const stream = document.getElementById('fix-thinking-stream');
      if (stream) {
        const separator = document.createElement('div');
        separator.className = 'ep-global-event fix-continue-separator';
        let sepHtml = `<hr><strong>🔄 Continuing session with ${data.totalEndpoints} failed endpoint${data.totalEndpoints > 1 ? 's' : ''}</strong>`;
        if (userPrompt) {
          sepHtml += `<br><em>General: "${this.escapeHtml(userPrompt)}"</em>`;
        }
        const epPromptCount = Object.keys(endpointPrompts).length;
        if (epPromptCount > 0) {
          sepHtml += `<br><em>📝 ${epPromptCount} endpoint-specific prompt${epPromptCount > 1 ? 's' : ''}</em>`;
        }
        separator.innerHTML = sepHtml;
        stream.appendChild(separator);
      }

      // Restore the prompt section to its original generic state
      this.restorePromptSection();

      // Update session ID to the new one and reset progress tracking for the continuation
      this.sessionId = data.sessionId;
      this.endpointResults = {};
      this.totalEndpoints = data.totalEndpoints;
      this.currentEndpoint = null;

      // Connect SSE to the new session
      this.connectSSE(data.sessionId);
      this.setStatus('analyzing', `Continuing: analyzing ${data.totalEndpoints} failed endpoints...`);

    } catch (error) {
      alert(`Network error: ${error.message}`);
      if (continueSection) {
        continueSection.querySelectorAll('button').forEach(btn => btn.disabled = false);
      }
    }
  },

  // ─── Retry Single Endpoint (Inline) ─────────────────────────────────────
  //
  // Sends the retry request to the SAME session. The server re-runs the DocFixer
  // and broadcasts events through the existing SSE connection. The endpoint's
  // panel is reopened and events append continuously — no new session or
  // separate SSE connection is created.

  async retryEndpoint(epKey) {
    if (!this.sessionId) {
      alert('No session to retry from.');
      return;
    }

    // If the SSE connection dropped, reconnect to the same session
    if (!this.eventSource || this.eventSource.readyState === EventSource.CLOSED) {
      this.connectSSE(this.sessionId);
    }

    const id = this.sanitizeId(epKey);
    const inputEl = document.getElementById(`ep-retry-input-${id}`);
    const userPrompt = inputEl?.value?.trim() || '';

    // Disable the retry button while starting
    const retrySection = document.getElementById(`ep-retry-${id}`);
    if (retrySection) {
      retrySection.querySelectorAll('button').forEach(btn => btn.disabled = true);
    }

    try {
      const response = await fetch(`/api/fix-report/retry/${this.sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: epKey, userPrompt })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(`Failed to retry: ${data.error}`);
        if (retrySection) {
          retrySection.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
        return;
      }

      // The server will broadcast events through the existing SSE connection.
      // endpoint_start (with isRetry:true) will reopen the panel automatically.
      this.setStatus('running', `Retrying: ${epKey}`);

    } catch (error) {
      alert(`Network error: ${error.message}`);
      if (retrySection) {
        retrySection.querySelectorAll('button').forEach(btn => btn.disabled = false);
      }
    }
  },

  // ─── Panel Management ────────────────────────────────────────────────────

  showPanel() {
    const panel = document.getElementById('fix-panel');
    if (panel) {
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  hidePanel() {
    const panel = document.getElementById('fix-panel');
    if (panel) panel.classList.add('hidden');
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  },

  togglePromptSection() {
    const body = document.getElementById('fix-user-prompt-body');
    const toggle = document.getElementById('fix-prompt-toggle');
    if (body) {
      const isCollapsed = body.classList.toggle('collapsed');
      if (toggle) toggle.textContent = isCollapsed ? '▶' : '▼';
    }
  },

  setStatus(status, message) {
    const statusEl = document.getElementById('fix-status');
    const stopBtn = document.getElementById('fix-stop-btn');

    if (statusEl) {
      const icons = { starting: '⏳', analyzing: '🔍', running: '🤖', stopping: '⏸️', completed: '✅', error: '❌', disconnected: '🔌' };
      statusEl.innerHTML = `<span class="fix-status-icon">${icons[status] || '🔹'}</span> ${this.escapeHtml(message)}`;
      statusEl.className = `fix-status fix-status-${status}`;
    }

    if (stopBtn) {
      stopBtn.disabled = status !== 'running' && status !== 'analyzing';
    }
  },

  // Original HTML for the user prompt section, captured once on first reset
  _originalPromptHTML: null,

  resetState() {
    this.sessionId = null;
    this.groups = [];
    this.ungrouped = [];
    this.endpointResults = {};
    this.totalEndpoints = 0;
    this.currentEndpoint = null;
    this.endpointLogs = {};
    this.endpointOrder = [];

    const queueEl = document.getElementById('fix-queue');
    const streamEl = document.getElementById('fix-thinking-stream');
    const summaryEl = document.getElementById('fix-summary');
    const progressEl = document.getElementById('fix-progress-bar');
    const textEl = document.getElementById('fix-progress-text');

    if (queueEl) queueEl.innerHTML = '<div class="fix-queue-empty">Analyzing report...</div>';
    if (streamEl) streamEl.innerHTML = '';
    if (summaryEl) { summaryEl.innerHTML = ''; summaryEl.classList.add('hidden'); }
    if (progressEl) progressEl.style.width = '0%';
    if (textEl) textEl.textContent = '';

    // Restore the original user prompt section
    this.restorePromptSection();
  },

  /** Save the original prompt section HTML (called once, lazily) */
  captureOriginalPromptHTML() {
    if (this._originalPromptHTML) return;
    const section = document.getElementById('fix-user-prompt-section');
    if (section) this._originalPromptHTML = section.innerHTML;
  },

  /** Restore the prompt section to its original generic state */
  restorePromptSection() {
    const section = document.getElementById('fix-user-prompt-section');
    if (section && this._originalPromptHTML) {
      section.innerHTML = this._originalPromptHTML;
    }
  },

  // ─── Helpers ─────────────────────────────────────────────────────────────

  sanitizeId(str) {
    return (str || '').replace(/[^a-zA-Z0-9]/g, '-');
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  getToolEmoji(toolName) {
    const map = {
      execute_api: '🌐', read_workflow: '📄', write_workflow: '✏️',
      read_swagger_schema: '📋', update_swagger_field: '📝',
      list_similar_workflows: '🔍', find_service_for_endpoint: '🗺️',
      search_source_code: '🔎', read_source_file: '📄',
      report_fix_result: '📊', test_workflow: '🧪'
    };
    return map[toolName] || '🔧';
  },

  summarizeToolInput(toolName, input) {
    if (!input) return '';
    switch (toolName) {
      case 'execute_api': return `${input.method || ''} ${input.path || ''}`;
      case 'read_workflow': return input.workflow_path || '';
      case 'write_workflow': return input.workflow_path || '';
      case 'read_swagger_schema': return `${input.domain || ''}/${input.file || ''}`;
      case 'search_source_code': return `${input.repository || ''}: "${input.search_pattern || ''}"`;
      case 'read_source_file': return `${input.repository || ''}/${input.file_path || ''}`;
      case 'find_service_for_endpoint': return input.endpoint_path || '';
      case 'list_similar_workflows': return input.path_pattern || '';
      case 'report_fix_result': return input.success ? '✅ Success' : '❌ Failed';
      case 'test_workflow': return input.workflow_path || '';
      default: return JSON.stringify(input).substring(0, 60);
    }
  }
};
