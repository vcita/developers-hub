/**
 * Express Server for API Validation Dashboard
 * Serves the UI and API endpoints for validation
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

const { loadConfig, getMaskedConfig, validateConfig } = require('../core/config');
const { parseAllSwaggersAsync, filterEndpoints, getStatistics } = require('../core/parser/swagger-parser');
const { groupByDomainAndResource } = require('../core/orchestrator/resource-grouper');
const { generateMarkdownReport, generateFilename } = require('../core/reporter/markdown-generator');

// Import routes
const endpointsRouter = require('./routes/endpoints');
const validateRouter = require('./routes/validate');

// Store last validation results for report generation
let lastValidationResults = null;

const app = express();
const PORT = process.env.PORT || 3500;

// Middleware
app.use(express.json({ limit: '10mb' })); // Increased limit for large validation reports
app.use(express.static(path.join(__dirname, '../ui')));

// CORS for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Load configuration and parse swaggers on startup
let appState = {
  config: null,
  endpoints: [],
  byDomain: {},
  domains: {},
  statistics: null,
  configValid: false,
  configErrors: [],
  configWarnings: []
};

async function initializeApp() {
  try {
    // Load configuration
    appState.config = loadConfig();
    
    // Validate configuration
    const validation = validateConfig(appState.config);
    appState.configValid = validation.valid;
    appState.configErrors = validation.errors;
    appState.configWarnings = validation.warnings || [];
    
    // Parse swagger files with $ref dereferencing for schema validation
    console.log('Loading and dereferencing swagger files...');
    const { endpoints, byDomain, domains } = await parseAllSwaggersAsync(appState.config.swaggerPath);
    appState.endpoints = endpoints;
    appState.byDomain = byDomain;
    appState.domains = domains;
    appState.statistics = getStatistics(endpoints);
    
    console.log(`Loaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`);
  } catch (error) {
    console.error('Error initializing app:', error.message);
    appState.configErrors.push(error.message);
  }
}

// Make app state available to routes
app.use((req, res, next) => {
  req.appState = appState;
  next();
});

// API Routes
app.use('/api/endpoints', endpointsRouter);
app.use('/api/validate', validateRouter);

// Config endpoint
app.get('/api/config', (req, res) => {
  if (!appState.config) {
    return res.status(500).json({ 
      error: 'Configuration not loaded',
      errors: appState.configErrors 
    });
  }
  
  res.json({
    config: getMaskedConfig(appState.config),
    valid: appState.configValid,
    errors: appState.configErrors
  });
});

// Statistics endpoint
app.get('/api/statistics', (req, res) => {
  res.json({
    statistics: appState.statistics,
    domains: Object.keys(appState.domains)
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    configValid: appState.configValid,
    endpointsLoaded: appState.endpoints.length,
    timestamp: new Date().toISOString()
  });
});

// Reload swagger files
app.post('/api/reload', async (req, res) => {
  try {
    console.log('Reloading swagger files...');
    
    // Re-parse swagger files with $ref dereferencing
    const { endpoints, byDomain, domains } = await parseAllSwaggersAsync(appState.config.swaggerPath);
    appState.endpoints = endpoints;
    appState.byDomain = byDomain;
    appState.domains = domains;
    appState.statistics = getStatistics(endpoints);
    
    console.log(`Reloaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`);
    
    res.json({
      success: true,
      message: `Reloaded ${endpoints.length} endpoints from ${Object.keys(domains).length} domains`,
      statistics: appState.statistics,
      domains: Object.keys(domains),
      endpointsLoaded: endpoints.length
    });
  } catch (error) {
    console.error('Error reloading swaggers:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Store validation results for report generation
app.post('/api/report/store', (req, res) => {
  try {
    lastValidationResults = req.body;
    res.json({ success: true, message: 'Results stored for report generation' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate Markdown report from stored results
app.get('/api/report/markdown', (req, res) => {
  try {
    if (!lastValidationResults) {
      return res.status(404).json({ 
        error: 'No validation results available',
        message: 'Run a validation first to generate a report'
      });
    }
    
    const markdown = generateMarkdownReport(lastValidationResults);
    const filename = generateFilename(lastValidationResults);
    
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error generating markdown report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate Markdown report from POST body (for immediate download)
app.post('/api/report/markdown', (req, res) => {
  try {
    const report = req.body;
    
    if (!report || !report.results) {
      return res.status(400).json({ 
        error: 'Invalid report data',
        message: 'Request body must contain validation results'
      });
    }
    
    const markdown = generateMarkdownReport(report);
    const filename = generateFilename(report);
    
    res.json({ 
      markdown,
      filename,
      size: markdown.length
    });
  } catch (error) {
    console.error('Error generating markdown report:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reports directory path
const REPORTS_DIR = path.join(__dirname, '../../reports');

// Ensure reports directory exists
function ensureReportsDir() {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    console.log(`📁 Created reports directory: ${REPORTS_DIR}`);
  }
}

// Generate comprehensive full report (for AI agents and JIRA)
app.post('/api/report/full', (req, res) => {
  try {
    const report = req.body;
    
    if (!report || !report.metadata) {
      return res.status(400).json({ 
        error: 'Invalid report data',
        message: 'Request body must contain comprehensive report data'
      });
    }
    
    // Ensure reports directory exists
    ensureReportsDir();
    
    const reportId = `report-${Date.now()}`;
    
    // Use title from metadata (user-provided) - this should always be set by the client
    const title = report.metadata.title || 'untitled';
    
    // Generate date-time suffix (YYYY-MM-DD-HH-MM-SS format)
    const now = new Date();
    const dateTimeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Create a subdirectory for this report run
    const reportDir = path.join(REPORTS_DIR, `${title}-${dateTimeStr}`);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const files = [];
    const savedPaths = [];
    
    // 1. Generate AI Agent Instructions file (Markdown)
    const aiAgentMarkdown = generateAiAgentReport(report);
    const aiFixesFilename = `ai-fixes.md`;
    const aiFixesPath = path.join(reportDir, aiFixesFilename);
    fs.writeFileSync(aiFixesPath, aiAgentMarkdown, 'utf8');
    savedPaths.push(aiFixesPath);
    files.push({
      name: aiFixesFilename,
      path: aiFixesPath,
      content: aiAgentMarkdown,
      mimeType: 'text/markdown'
    });
    
    // 2. Generate JIRA Tickets file (Markdown)
    const jiraMarkdown = generateJiraReport(report);
    const jiraFilename = `jira-tickets.md`;
    const jiraPath = path.join(reportDir, jiraFilename);
    fs.writeFileSync(jiraPath, jiraMarkdown, 'utf8');
    savedPaths.push(jiraPath);
    files.push({
      name: jiraFilename,
      path: jiraPath,
      content: jiraMarkdown,
      mimeType: 'text/markdown'
    });
    
    // 3. Generate JSON data file (for programmatic processing)
    const jsonContent = JSON.stringify(report, null, 2);
    const jsonFilename = `data.json`;
    const jsonPath = path.join(reportDir, jsonFilename);
    fs.writeFileSync(jsonPath, jsonContent, 'utf8');
    savedPaths.push(jsonPath);
    files.push({
      name: jsonFilename,
      path: jsonPath,
      content: jsonContent,
      mimeType: 'application/json'
    });
    
    // 4. Create a summary README
    const readmeContent = generateReportReadme(report, timestamp, environment, files);
    const readmePath = path.join(reportDir, 'README.md');
    fs.writeFileSync(readmePath, readmeContent, 'utf8');
    savedPaths.push(readmePath);
    
    console.log(`📊 Report saved to: ${reportDir}`);
    
    res.json({ 
      success: true,
      reportId,
      reportDir,
      savedPaths,
      files: files.map(f => ({ name: f.name, path: f.path, mimeType: f.mimeType })),
      summary: {
        total: report.summary.total,
        passed: report.summary.passed,
        failed: report.summary.failed,
        documentationIssues: report.summary.documentationIssuesCount
      }
    });
  } catch (error) {
    console.error('Error generating full report:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Generate README for the report directory
 */
function generateReportReadme(report, timestamp, environment, files) {
  const lines = [];
  
  lines.push('# API Validation Report');
  lines.push('');
  lines.push(`**Generated**: ${timestamp.replace(/-/g, ':').replace('T', ' ')}`);
  lines.push(`**Environment**: ${environment}`);
  lines.push(`**Base URL**: ${report.metadata?.baseUrl || 'N/A'}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Endpoints | ${report.summary.total} |`);
  lines.push(`| ✅ Passed | ${report.summary.passed} |`);
  lines.push(`| ❌ Failed | ${report.summary.failed} |`);
  lines.push(`| ⚠️ Warnings | ${report.summary.warned} |`);
  lines.push(`| 🔶 Errors | ${report.summary.errored} |`);
  lines.push(`| ⏭️ Skipped | ${report.summary.skipped} |`);
  lines.push(`| **Pass Rate** | ${report.summary.passRate} |`);
  lines.push(`| 📝 Documentation Issues | ${report.summary.documentationIssuesCount} |`);
  lines.push('');
  
  // Files in this report
  lines.push('## Files in This Report');
  lines.push('');
  lines.push('| File | Description |');
  lines.push('|------|-------------|');
  lines.push('| [ai-fixes.md](./ai-fixes.md) | Documentation issues for AI agent to fix |');
  lines.push('| [jira-tickets.md](./jira-tickets.md) | Failed tests formatted as JIRA tickets |');
  lines.push('| [data.json](./data.json) | Raw JSON data for programmatic processing |');
  lines.push('');
  
  // How to use
  lines.push('## How to Use');
  lines.push('');
  lines.push('### Fix Documentation Issues');
  lines.push('```bash');
  lines.push('# Run an AI agent to fix documentation:');
  lines.push('cursor ai-fixes.md');
  lines.push('# Or use Claude/GPT with the file contents');
  lines.push('```');
  lines.push('');
  lines.push('### Create JIRA Tickets');
  lines.push('```bash');
  lines.push('# Review and create tickets from jira-tickets.md');
  lines.push('# Each "Ticket N" section can be copy-pasted as a new JIRA issue');
  lines.push('```');
  lines.push('');
  lines.push('### Programmatic Processing');
  lines.push('```javascript');
  lines.push('const report = require(\'./data.json\');');
  lines.push('');
  lines.push('// Get all documentation issues');
  lines.push('const docIssues = report.forAiAgent.allIssues;');
  lines.push('');
  lines.push('// Get failed tests by reason');
  lines.push('const failuresByReason = report.forJira.failuresByReason;');
  lines.push('```');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate AI Agent Instructions Report
 * Optimized for running an agent to fix documentation issues
 */
function generateAiAgentReport(report) {
  const lines = [];
  
  lines.push('# API Documentation Fix Instructions');
  lines.push('');
  lines.push('> **Purpose**: This file contains documentation issues discovered during API validation.');
  lines.push('> An AI agent can use this to automatically fix swagger/OpenAPI specification files.');
  lines.push('');
  lines.push(`**Generated**: ${report.metadata.timestamp}`);
  lines.push(`**Environment**: ${report.metadata.environment}`);
  lines.push(`**Total Issues**: ${report.summary.documentationIssuesCount}`);
  lines.push('');
  lines.push('## ⚠️ Important Rules');
  lines.push('');
  lines.push('1. **NEVER remove an endpoint from documentation**, even if it returns 404 (not implemented)');
  lines.push('2. If an endpoint is documented but not implemented, create a JIRA ticket to implement it');
  lines.push('3. Only fix documentation issues like schema mismatches, missing fields, incorrect types');
  lines.push('4. For unimplemented endpoints, see the `jira-tickets.md` file in this report');
  lines.push('');
  
  // Quick summary
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Total endpoints tested: ${report.summary.total}`);
  lines.push(`- Passed: ${report.summary.passed}`);
  lines.push(`- Failed: ${report.summary.failed}`);
  lines.push(`- Warnings (with doc issues): ${report.summary.warned}`);
  lines.push(`- Documentation issues found: ${report.summary.documentationIssuesCount}`);
  lines.push('');
  
  if (!report.forAiAgent?.allIssues?.length) {
    lines.push('## No Documentation Issues Found');
    lines.push('');
    lines.push('All tested endpoints have accurate documentation. 🎉');
    return lines.join('\n');
  }
  
  // Issues by swagger file (for targeted fixes)
  lines.push('## Issues by File');
  lines.push('');
  lines.push('Each section below represents issues found in a specific swagger/OpenAPI file.');
  lines.push('');
  
  const issuesByFile = report.forAiAgent.issuesByFile || {};
  
  for (const [file, issues] of Object.entries(issuesByFile)) {
    lines.push(`### 📁 ${file}`);
    lines.push('');
    lines.push('| Endpoint | Field | Issue | Suggested Fix | Severity |');
    lines.push('|----------|-------|-------|---------------|----------|');
    
    for (const issue of issues) {
      const endpoint = issue.endpoint || `${issue.method} ${issue.path}`;
      const field = issue.field || '-';
      const issueText = (issue.issue || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const fix = (issue.suggestedFix || '-').replace(/\|/g, '\\|').replace(/\n/g, ' ');
      const severity = issue.severity || 'minor';
      lines.push(`| ${endpoint} | ${field} | ${issueText} | ${fix} | ${severity} |`);
    }
    lines.push('');
  }
  
  // Detailed issue list (for agent processing)
  lines.push('## Detailed Issues (JSON)');
  lines.push('');
  lines.push('Use this structured data to programmatically update swagger files:');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(report.forAiAgent.allIssues, null, 2));
  lines.push('```');
  lines.push('');
  
  // Agent insights from healing attempts (source code discoveries)
  const agentInsights = extractAgentInsights(report);
  if (agentInsights.length > 0) {
    lines.push('## 🔬 Agent Insights from Source Code');
    lines.push('');
    lines.push('During self-healing attempts, the AI agent explored source code and discovered the following:');
    lines.push('');
    
    for (const insight of agentInsights) {
      lines.push(`### ${insight.endpoint}`);
      lines.push('');
      if (insight.sourceCodeRefs.length > 0) {
        lines.push('**Source Code References:**');
        for (const ref of insight.sourceCodeRefs) {
          lines.push(`- \`${ref}\``);
        }
        lines.push('');
      }
      if (insight.discoveries.length > 0) {
        lines.push('**Key Discoveries:**');
        for (const discovery of insight.discoveries) {
          lines.push(`- ${discovery}`);
        }
        lines.push('');
      }
      if (insight.agentSummary) {
        lines.push(`**Agent Summary:** ${insight.agentSummary}`);
        lines.push('');
      }
    }
  }
  
  // Full agent analysis logs for deep investigation
  const allAgentLogs = extractAllAgentLogs(report);
  if (allAgentLogs.length > 0) {
    lines.push('## 🤖 Full Agent Analysis Logs');
    lines.push('');
    lines.push('Complete history of what the self-healing agent tried for each endpoint:');
    lines.push('');
    
    for (const { endpoint, agentLog, summary } of allAgentLogs) {
      lines.push(`### ${endpoint}`);
      lines.push('');
      if (summary) {
        lines.push(`**Summary:** ${summary}`);
        lines.push('');
      }
      lines.push('<details>');
      lines.push('<summary>Click to expand full agent log</summary>');
      lines.push('');
      lines.push(renderAgentLogMarkdown(agentLog));
      lines.push('</details>');
      lines.push('');
    }
  }

  // Agent instructions
  lines.push('## Instructions for AI Agent');
  lines.push('');
  lines.push('1. **For each issue**, locate the corresponding swagger/OpenAPI file in the `swagger/` directory');
  lines.push('2. **Find the endpoint** definition matching the `method` and `path`');
  lines.push('3. **Apply the suggested fix** to the appropriate field (requestBody, parameters, responses, etc.)');
  lines.push('4. **Validate the swagger file** after making changes');
  lines.push('5. **Create a PR** with the documentation fixes');
  lines.push('');
  lines.push('### Common Fix Types');
  lines.push('');
  lines.push('- **Missing required field**: Add the field to the schema\'s `required` array');
  lines.push('- **Wrong type**: Update the field\'s `type` property');
  lines.push('- **Missing enum value**: Add value to the `enum` array');
  lines.push('- **Incorrect nesting**: Restructure the schema to match actual API behavior');
  lines.push('- **Missing description**: Add or update the `description` property');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Extract agent insights from source code exploration
 */
function extractAgentInsights(report) {
  const insights = [];
  const rawResults = report.rawResults || [];
  
  for (const result of rawResults) {
    if (!result.healingInfo?.agentLog) continue;
    
    const insight = {
      endpoint: result.endpoint,
      sourceCodeRefs: [],
      discoveries: [],
      agentSummary: result.healingInfo.summary
    };
    
    for (const entry of result.healingInfo.agentLog) {
      // Extract source code references
      if (entry.type === 'tool_call' && entry.tool === 'read_source_file') {
        const filePath = entry.input?.file_path;
        const repo = entry.input?.repository;
        if (filePath && repo) {
          insight.sourceCodeRefs.push(`${repo}/${filePath}`);
        }
      }
      
      // Extract discoveries from thoughts mentioning code findings
      if (entry.type === 'thought' && entry.content) {
        const content = entry.content.toLowerCase();
        if (content.includes('found') || content.includes('discover') || 
            content.includes('the code') || content.includes('source code') ||
            content.includes('expected format') || content.includes('actual format')) {
          // Extract first sentence as discovery
          const firstSentence = entry.content.split(/[.!?]/)[0].trim();
          if (firstSentence.length > 20 && firstSentence.length < 200) {
            insight.discoveries.push(firstSentence);
          }
        }
      }
      
      // Extract doc issues reported
      if (entry.type === 'tool_call' && entry.tool === 'report_result' && entry.input?.doc_issues) {
        for (const issue of entry.input.doc_issues) {
          if (issue.source_code_reference) {
            insight.sourceCodeRefs.push(issue.source_code_reference);
          }
        }
      }
    }
    
    // Only include if we have meaningful insights
    if (insight.sourceCodeRefs.length > 0 || insight.discoveries.length > 0) {
      // Deduplicate
      insight.sourceCodeRefs = [...new Set(insight.sourceCodeRefs)];
      insight.discoveries = [...new Set(insight.discoveries)];
      insights.push(insight);
    }
  }
  
  return insights;
}

/**
 * Extract all agent logs from results
 */
function extractAllAgentLogs(report) {
  const logs = [];
  const rawResults = report.rawResults || [];
  
  for (const result of rawResults) {
    if (result.healingInfo?.agentLog && result.healingInfo.agentLog.length > 0) {
      logs.push({
        endpoint: result.endpoint,
        agentLog: result.healingInfo.agentLog,
        summary: result.healingInfo.summary
      });
    }
  }
  
  return logs;
}

/**
 * Generate JIRA Tickets Report
 * Optimized for creating JIRA tickets for engineering teams
 */
function generateJiraReport(report) {
  const lines = [];
  
  lines.push('# API Validation - JIRA Tickets');
  lines.push('');
  lines.push('> **Purpose**: This file contains failed API tests grouped by failure reason.');
  lines.push('> Each group can be converted into a JIRA ticket for the engineering team.');
  lines.push('');
  lines.push(`**Generated**: ${report.metadata.timestamp}`);
  lines.push(`**Environment**: ${report.metadata.environment}`);
  lines.push(`**Base URL**: ${report.metadata.baseUrl}`);
  lines.push('');
  
  // Overall summary
  lines.push('## Executive Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Endpoints | ${report.summary.total} |`);
  lines.push(`| ✅ Passed | ${report.summary.passed} |`);
  lines.push(`| ❌ Failed | ${report.summary.failed} |`);
  lines.push(`| ⚠️ Warnings | ${report.summary.warned} |`);
  lines.push(`| 🔶 Errors | ${report.summary.errored} |`);
  lines.push(`| ⏭️ Skipped | ${report.summary.skipped} |`);
  lines.push(`| **Pass Rate** | ${report.summary.passRate} |`);
  lines.push('');
  
  // No issues case
  const failedTests = report.forJira?.failedTests || [];
  const erroredTests = report.forJira?.erroredTests || [];
  
  if (failedTests.length === 0 && erroredTests.length === 0) {
    lines.push('## 🎉 All Tests Passed!');
    lines.push('');
    lines.push('No JIRA tickets needed - all API endpoints are working correctly.');
    return lines.join('\n');
  }
  
  // Tickets by failure reason
  lines.push('## Tickets by Failure Reason');
  lines.push('');
  
  const failuresByReason = report.forJira?.failuresByReason || {};
  let ticketNumber = 1;
  
  for (const [reason, items] of Object.entries(failuresByReason)) {
    lines.push(`### Ticket ${ticketNumber}: ${formatReasonTitle(reason)}`);
    lines.push('');
    
    // Special note for unimplemented endpoints
    if (reason === 'ENDPOINT_NOT_FOUND') {
      lines.push('> ⚠️ **Important**: These endpoints are documented but NOT implemented in the backend.');
      lines.push('> **Do NOT remove them from documentation.** Create a JIRA ticket to implement the missing endpoint(s).');
      lines.push('');
    }
    
    lines.push('**JIRA Fields:**');
    lines.push('');
    lines.push(`- **Type**: ${reason === 'ENDPOINT_NOT_FOUND' ? 'Task' : 'Bug'}`);
    lines.push(`- **Priority**: ${getPriorityFromReason(reason)}`);
    lines.push(`- **Labels**: api-validation, ${reason.toLowerCase()}`);
    lines.push(`- **Component**: API`);
    lines.push('');
    lines.push('**Summary:**');
    lines.push(`> API Validation: ${items.length} endpoint(s) failing with ${formatReasonTitle(reason)}`);
    lines.push('');
    lines.push('**Description:**');
    lines.push('');
    lines.push('The following API endpoints are failing validation:');
    lines.push('');
    lines.push('| Endpoint | HTTP Status | Error Summary |');
    lines.push('|----------|-------------|---------------|');
    
    for (const item of items) {
      const endpoint = item.endpoint || `${item.method} ${item.path}`;
      const httpStatus = item.httpStatus || '-';
      const errorSummary = (item.errorSummary || item.reasonDescription || '-').substring(0, 80).replace(/\|/g, '\\|');
      lines.push(`| ${endpoint} | ${httpStatus} | ${errorSummary} |`);
    }
    lines.push('');
    
    // Detailed failures for this reason
    lines.push('**Detailed Failures:**');
    lines.push('');
    
    for (const item of items) {
      lines.push(`#### ${item.endpoint}`);
      lines.push('');
      lines.push(`- **Domain**: ${item.domain || 'N/A'}`);
      lines.push(`- **HTTP Status**: ${item.httpStatus || 'N/A'}`);
      lines.push(`- **Reason**: ${item.reason || 'N/A'}`);
      if (item.reasonDescription) {
        lines.push(`- **Description**: ${item.reasonDescription}`);
      }
      if (item.suggestion) {
        lines.push(`- **Suggestion**: ${item.suggestion}`);
      }
      if (item.healingAttempted) {
        lines.push(`- **Self-Healing**: Attempted (${item.healingIterations || '?'} iterations, ${item.healingRetryCount || 0} retries) - ${item.healingFailed ? 'Failed: ' + (item.healingReason || 'unknown') : 'Success'}`);
        if (item.healingSummary) {
          lines.push(`- **Agent Summary**: ${item.healingSummary}`);
        }
      }
      lines.push('');
      
      if (item.request) {
        lines.push('<details>');
        lines.push('<summary>Request Details</summary>');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(item.request, null, 2));
        lines.push('```');
        lines.push('</details>');
        lines.push('');
      }
      
      if (item.response) {
        lines.push('<details>');
        lines.push('<summary>Response Details</summary>');
        lines.push('');
        lines.push('```json');
        lines.push(JSON.stringify(item.response, null, 2));
        lines.push('```');
        lines.push('</details>');
        lines.push('');
      }
      
      // Add Self-Healing Agent Analysis
      if (item.agentLog && item.agentLog.length > 0) {
        lines.push('<details>');
        lines.push('<summary>🤖 Self-Healing Agent Analysis (Full History)</summary>');
        lines.push('');
        lines.push(renderAgentLogMarkdown(item.agentLog));
        lines.push('</details>');
        lines.push('');
      }
    }
    
    lines.push('---');
    lines.push('');
    ticketNumber++;
  }
  
  // Domain breakdown
  lines.push('## Breakdown by Domain');
  lines.push('');
  
  const byDomain = report.forJira?.byDomain || {};
  lines.push('| Domain | Total | Passed | Failed | Warned | Errored | Skipped |');
  lines.push('|--------|-------|--------|--------|--------|---------|---------|');
  
  for (const [domain, stats] of Object.entries(byDomain)) {
    lines.push(`| ${domain} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.warned} | ${stats.errored} | ${stats.skipped} |`);
  }
  lines.push('');
  
  // Warnings section (documentation issues but tests passed)
  const warnedTests = report.forJira?.warnedTests || [];
  if (warnedTests.length > 0) {
    lines.push('## ⚠️ Warnings (Tests Passed with Documentation Issues)');
    lines.push('');
    lines.push('These endpoints passed but have documentation discrepancies:');
    lines.push('');
    
    for (const item of warnedTests) {
      lines.push(`- **${item.endpoint}**: ${item.errorSummary || 'Documentation issue'}`);
    }
    lines.push('');
    lines.push('> See the AI Agent report for details on fixing documentation.');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Render agent log as markdown for reports
 * @param {Array} agentLog - Array of agent log entries
 * @returns {string} Markdown formatted log
 */
function renderAgentLogMarkdown(agentLog) {
  if (!agentLog || agentLog.length === 0) {
    return '*No agent log available*';
  }
  
  const lines = [];
  lines.push('**Agent Execution Timeline:**');
  lines.push('');
  
  for (const entry of agentLog) {
    const iteration = entry.iteration || '?';
    
    switch (entry.type) {
      case 'thought':
        lines.push(`**[Iteration ${iteration}] 🤔 Agent Thinking:**`);
        lines.push('');
        lines.push(`> ${(entry.content || '').replace(/\n/g, '\n> ')}`);
        lines.push('');
        break;
        
      case 'tool_call':
        const toolEmoji = getToolEmoji(entry.tool);
        lines.push(`**[Iteration ${iteration}] ${toolEmoji} Tool Call: \`${entry.tool}\`**`);
        lines.push('');
        if (entry.input && Object.keys(entry.input).length > 0) {
          lines.push('Input:');
          lines.push('```json');
          lines.push(JSON.stringify(entry.input, null, 2));
          lines.push('```');
        }
        lines.push('');
        break;
        
      case 'tool_result':
        const resultIcon = entry.result?.success ? '✅' : (entry.result?.error ? '❌' : '📋');
        const httpStatus = entry.result?.status ? ` (HTTP ${entry.result.status})` : '';
        lines.push(`**[Iteration ${iteration}] ${resultIcon} Result: \`${entry.tool}\`${httpStatus}**`);
        lines.push('');
        if (entry.result) {
          // Truncate large results
          const resultStr = JSON.stringify(entry.result, null, 2);
          if (resultStr.length > 1500) {
            lines.push('```json');
            lines.push(resultStr.substring(0, 1500) + '\n... (truncated)');
            lines.push('```');
          } else {
            lines.push('```json');
            lines.push(resultStr);
            lines.push('```');
          }
        }
        lines.push('');
        break;
        
      case 'max_retries':
        lines.push(`**[Iteration ${iteration}] ⛔ Max Retries Reached** (${entry.retryCount} retries)`);
        lines.push('');
        break;
        
      case 'no_action':
        lines.push(`**[Iteration ${iteration}] ⚠️ Agent Stopped:** ${entry.content || 'No action taken'}`);
        lines.push('');
        break;
        
      default:
        lines.push(`**[Iteration ${iteration}] ${entry.type}:**`);
        if (entry.content) {
          lines.push(`> ${entry.content}`);
        }
        lines.push('');
    }
  }
  
  return lines.join('\n');
}

/**
 * Get emoji for tool name
 */
function getToolEmoji(toolName) {
  const emojis = {
    'extract_required_uids': '🔍',
    'find_uid_source': '🔗',
    'execute_api': '🌐',
    'report_result': '📝',
    'search_source_code': '🔎',
    'read_source_file': '📄',
    'find_service_for_endpoint': '🗺️'
  };
  return emojis[toolName] || '🔧';
}

/**
 * Format failure reason as readable title
 */
function formatReasonTitle(reason) {
  const titles = {
    'SERVER_ERROR': 'Server Error (5xx)',
    'AUTH_FAILED': 'Authentication/Authorization Failed',
    'ENDPOINT_NOT_FOUND': 'Endpoint Not Found',
    'RESOURCE_NOT_FOUND': 'Resource Not Found',
    'SCHEMA_MISMATCH': 'Request/Response Schema Mismatch',
    'VALIDATION_ERROR': 'Validation Error',
    'UNKNOWN_ERROR': 'Unknown Error'
  };
  return titles[reason] || reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get JIRA priority from failure reason
 */
function getPriorityFromReason(reason) {
  const priorities = {
    'SERVER_ERROR': 'High',
    'AUTH_FAILED': 'High',
    'ENDPOINT_NOT_FOUND': 'Medium',
    'RESOURCE_NOT_FOUND': 'Low',
    'SCHEMA_MISMATCH': 'Medium',
    'VALIDATION_ERROR': 'Medium',
    'UNKNOWN_ERROR': 'Medium'
  };
  return priorities[reason] || 'Medium';
}

// Serve UI for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../ui/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Initialize and start server
async function startServer() {
  await initializeApp();
  
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════╗
║         API Validation Dashboard                     ║
╠══════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}            ║
║  Endpoints loaded: ${String(appState.endpoints.length).padEnd(4)}                            ║
║  Domains: ${Object.keys(appState.domains).join(', ').substring(0, 30).padEnd(30)}  ║
╚══════════════════════════════════════════════════════╝
    `);
    
    if (!appState.configValid) {
      console.log('\n❌ Configuration errors:');
      for (const error of appState.configErrors) {
        console.log(`   • ${error}`);
      }
      console.log('\n');
    }
    
    if (appState.configWarnings && appState.configWarnings.length > 0) {
      console.log('\n⚠️  Configuration warnings:');
      for (const warning of appState.configWarnings) {
        console.log(`   • ${warning}`);
      }
      console.log('\n');
    }
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
