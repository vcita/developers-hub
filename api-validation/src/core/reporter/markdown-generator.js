/**
 * Markdown Report Generator
 * Creates formatted Markdown documents from validation results
 */

/**
 * Issue type definitions for columns
 */
const ISSUE_TYPES = {
  STATUS: 'Status',
  SCHEMA: 'Schema Issues',
  PARAM_MISMATCH: 'Param Mismatch',
  TOKEN_DOC: 'Token Documentation',
  AUTH: 'Auth Issues',
  OTHER: 'Other'
};

/**
 * Generate a full Markdown report from validation results
 * @param {Object} report - Report object from report-generator
 * @returns {string} Markdown content
 */
function generateMarkdownReport(report) {
  const sections = [
    generateHeader(report),
    generateSummarySection(report),
    generateDomainSummaryTable(report),
    generateMainResultsTable(report),
    generateHealingSummary(report),
    generateDetailedIssues(report),
    generateFooter(report)
  ];
  
  return sections.filter(Boolean).join('\n\n');
}

/**
 * Generate report header
 * @param {Object} report - Report object
 * @returns {string} Header markdown
 */
function generateHeader(report) {
  const { summary } = report;
  const date = new Date(summary.timestamp).toLocaleString();
  
  return `# API Validation Report

**Generated:** ${date}  
**Environment:** ${summary.environment}  
**Base URL:** \`${summary.baseUrl}\`  
**Duration:** ${summary.duration}`;
}

/**
 * Generate summary section with stats
 * @param {Object} report - Report object
 * @returns {string} Summary markdown
 */
function generateSummarySection(report) {
  const { summary } = report;
  
  // Pass rate indicator
  const passRate = parseFloat(summary.passRate);
  let rateIndicator = '🔴';
  if (passRate >= 90) rateIndicator = '🟢';
  else if (passRate >= 70) rateIndicator = '🟡';
  else if (passRate >= 50) rateIndicator = '🟠';
  
  return `## Summary

| Metric | Count |
|--------|-------|
| Total Endpoints | ${summary.total} |
| ✅ Passed | ${summary.passed} |
| ❌ Failed | ${summary.failed} |
| ⚠️ Warned | ${summary.warned || 0} |
| 🔶 Errors | ${summary.errored || 0} |
| ⏭️ Skipped | ${summary.skipped} |
| ${rateIndicator} **Pass Rate** | **${summary.passRate}** |`;
}

/**
 * Generate domain summary table
 * @param {Object} report - Report object
 * @returns {string} Domain summary markdown
 */
function generateDomainSummaryTable(report) {
  const domains = Object.entries(report.byDomain);
  
  if (domains.length === 0) return '';
  
  const rows = domains.map(([domain, stats]) => {
    const rate = parseFloat(stats.passRate) || 0;
    let status = '🔴';
    if (rate >= 90) status = '🟢';
    else if (rate >= 70) status = '🟡';
    else if (rate >= 50) status = '🟠';
    
    return `| ${domain} | ${stats.total} | ${stats.passed} | ${stats.failed} | ${stats.warned || 0} | ${stats.errored || 0} | ${stats.skipped} | ${status} ${stats.passRate} |`;
  });
  
  return `## Results by Domain

| Domain | Total | ✅ Pass | ❌ Fail | ⚠️ Warn | 🔶 Error | ⏭️ Skip | Rate |
|--------|-------|---------|---------|---------|----------|---------|------|
${rows.join('\n')}`;
}

/**
 * Analyze endpoint and extract issues by type
 * @param {Object} result - Single endpoint result
 * @returns {Object} Issues categorized by type
 */
function analyzeEndpointIssues(result) {
  const issues = {
    status: null,
    schema: [],
    paramMismatch: null,
    tokenDoc: null,
    auth: null,
    other: []
  };
  
  if (result.status === 'PASS') {
    return issues;
  }
  
  if (result.status === 'SKIP') {
    issues.other.push(result.details?.friendlyMessage || 'Skipped');
    return issues;
  }
  
  // Both FAIL and WARN can have issues
  
  const reason = result.details?.reason;
  const errors = result.details?.errors || [];
  
  // Categorize main reason
  switch (reason) {
    case 'UNEXPECTED_STATUS_CODE':
      issues.status = `Expected 2xx, got ${result.httpStatus}`;
      break;
    case 'AUTH_FAILED':
      issues.auth = result.details?.friendlyMessage || 'Authentication failed';
      break;
    case 'SCHEMA_MISMATCH':
    case 'DOC_ISSUE':
      // Will be populated from errors
      break;
    default:
      if (reason && reason !== 'DOC_ISSUE') {
        issues.other.push(result.details?.friendlyMessage || reason);
      }
  }
  
  // Categorize individual errors
  for (const error of errors) {
    if (error.reason === 'PARAM_NAME_MISMATCH') {
      // Include location (path vs body) if available
      const location = error.location ? ` (${error.location})` : '';
      issues.paramMismatch = error.message + location;
    } else if (error.reason === 'MISSING_TOKEN_DOCUMENTATION' || error.reason === 'TOKEN_PLACEHOLDER_USED') {
      issues.tokenDoc = error.message;
    } else if (error.keyword || error.path) {
      // Schema validation error
      const path = error.path || '/';
      const msg = error.message || error.friendlyMessage || 'Schema error';
      issues.schema.push(`\`${path}\`: ${msg}`);
    } else if (error.message) {
      issues.other.push(error.message);
    }
  }
  
  return issues;
}

/**
 * Format issues for table cell
 * @param {*} issue - Issue value (string, array, or null)
 * @returns {string} Formatted cell content
 */
function formatIssueCell(issue) {
  if (!issue) return '✅';
  if (Array.isArray(issue)) {
    if (issue.length === 0) return '✅';
    if (issue.length === 1) return `⚠️ ${issue[0]}`;
    return `⚠️ ${issue.length} issues`;
  }
  return `⚠️ ${issue}`;
}

/**
 * Format issues for table cell (compact)
 * @param {*} issue - Issue value
 * @returns {string} Compact cell content
 */
function formatIssueCellCompact(issue) {
  if (!issue) return '✅';
  if (Array.isArray(issue)) {
    if (issue.length === 0) return '✅';
    return `⚠️ (${issue.length})`;
  }
  return '⚠️';
}

/**
 * Generate main results table
 * @param {Object} report - Report object
 * @returns {string} Results table markdown
 */
function generateMainResultsTable(report) {
  const results = report.results || [];
  
  if (results.length === 0) return '';
  
  // Group by domain for better organization
  const byDomain = {};
  for (const result of results) {
    const domain = result.domain || 'unknown';
    if (!byDomain[domain]) byDomain[domain] = [];
    byDomain[domain].push(result);
  }
  
  let tables = [];
  
  for (const [domain, domainResults] of Object.entries(byDomain)) {
    const rows = domainResults.map(result => {
      const status = result.status === 'PASS' ? '✅' : 
                     result.status === 'FAIL' ? '❌' : 
                     result.status === 'WARN' ? '⚠️' : 
                     result.status === 'ERROR' ? '🔶' : '⏭️';
      const issues = analyzeEndpointIssues(result);
      
      // Determine if we got a successful HTTP response (2xx)
      const httpStatus = result.httpStatus;
      const isSuccessResponse = httpStatus && httpStatus >= 200 && httpStatus < 300;
      const wasSkipped = result.status === 'SKIP';
      
      // For non-2xx responses or skipped tests, we can't validate schema/params against success schema
      // Show '-' instead of misleading ✅
      let schemaCell, paramsCell;
      if (wasSkipped) {
        schemaCell = '-';
        paramsCell = '-';
      } else if (!isSuccessResponse) {
        // Non-2xx: can't validate success schema, but we can show if there were doc issues
        schemaCell = '-';
        paramsCell = issues.paramMismatch ? '⚠️' : '-';
      } else {
        // 2xx response: show actual validation results
        schemaCell = formatIssueCellCompact(issues.schema);
        paramsCell = formatIssueCellCompact(issues.paramMismatch);
      }
      
      return `| ${status} | \`${result.method}\` | \`${result.path}\` | ${httpStatus || '-'} | ${schemaCell} | ${paramsCell} | ${formatIssueCellCompact(issues.tokenDoc)} | ${formatIssueCellCompact(issues.auth)} | ${result.duration} |`;
    });
    
    tables.push(`### ${domain}

| | Method | Endpoint | HTTP | Schema | Params | Token | Auth | Time |
|-|--------|----------|------|--------|--------|-------|------|------|
${rows.join('\n')}`);
  }
  
  return `## Validation Results

${tables.join('\n\n')}`;
}

/**
 * Generate detailed issues section for failed/warned endpoints
 * @param {Object} report - Report object
 * @returns {string} Detailed issues markdown
 */
/**
 * Generate healing summary section
 * Shows endpoints that were self-healed and AI-detected documentation issues
 * @param {Object} report - Report object
 * @returns {string} Healing summary markdown
 */
function generateHealingSummary(report) {
  const results = report.results || [];
  
  // Find healed endpoints
  const healedResults = results.filter(r => r.details?.healingInfo);
  
  // Find all AI-detected documentation issues
  const allDocIssues = [];
  for (const result of results) {
    const docIssues = result.details?.documentationIssues || [];
    for (const issue of docIssues) {
      allDocIssues.push({
        endpoint: `${result.method} ${result.path}`,
        ...issue
      });
    }
  }
  
  if (healedResults.length === 0 && allDocIssues.length === 0) {
    return '';
  }
  
  let output = '## 🔧 Self-Healing Summary\n\n';
  
  // Healed endpoints section
  if (healedResults.length > 0) {
    output += `### Healed Endpoints (${healedResults.length})\n\n`;
    output += `*These endpoints initially failed but were automatically fixed by creating required dependencies.*\n\n`;
    output += '| Endpoint | Attempts | Prerequisites Created | Workflow |\n';
    output += '|----------|----------|----------------------|----------|\n';
    
    for (const result of healedResults) {
      const healing = result.details.healingInfo;
      const prereqs = healing.prerequisitesCreated?.join(', ') || '-';
      const workflow = healing.workflowSaved ? '💾 Saved' : 
                       healing.usedCachedWorkflow ? '📦 Cached' : '-';
      
      output += `| \`${result.method} ${result.path}\` | ${healing.attempts || 1} | ${prereqs} | ${workflow} |\n`;
    }
    output += '\n';
  }
  
  // AI-detected documentation issues section
  if (allDocIssues.length > 0) {
    output += `### 📝 AI-Detected Documentation Issues (${allDocIssues.length})\n\n`;
    output += `*These issues were identified by AI during testing and should be reviewed.*\n\n`;
    output += '| Endpoint | Type | Field | Issue | Suggestion |\n';
    output += '|----------|------|-------|-------|------------|\n';
    
    for (const issue of allDocIssues) {
      const field = issue.field ? `\`${issue.field}\`` : '-';
      const message = issue.message?.replace(/\|/g, '\\|') || '-';
      const suggestion = issue.suggestion?.replace(/\|/g, '\\|') || '-';
      
      output += `| \`${issue.endpoint}\` | ${issue.type} | ${field} | ${message} | ${suggestion} |\n`;
    }
  }
  
  return output;
}

function generateDetailedIssues(report) {
  // Include FAIL, WARN, and ERROR in detailed issues
  const failures = (report.results || []).filter(r => r.status === 'FAIL');
  const warnings = (report.results || []).filter(r => r.status === 'WARN');
  const errors = (report.results || []).filter(r => r.status === 'ERROR');
  
  if (failures.length === 0 && warnings.length === 0) {
    return `## Detailed Issues

🎉 **No issues found!** All tested endpoints passed validation.`;
  }
  
  // Separate tables for failures (HTTP errors) and warnings (doc issues)
  const failureRows = [];
  const warningRows = [];
  
  // Process failures (HTTP errors)
  for (const result of failures) {
    const issues = analyzeEndpointIssues(result);
    const allIssues = [];
    
    if (issues.status) allIssues.push(`**Status:** ${issues.status}`);
    if (issues.paramMismatch) allIssues.push(`**Param Mismatch:** ${issues.paramMismatch}`);
    if (issues.tokenDoc) allIssues.push(`**Token Doc:** ${issues.tokenDoc}`);
    if (issues.auth) allIssues.push(`**Auth:** ${issues.auth}`);
    if (issues.schema.length > 0) {
      allIssues.push(`**Schema (${issues.schema.length}):** ${issues.schema.slice(0, 3).join('; ')}${issues.schema.length > 3 ? '...' : ''}`);
    }
    if (issues.other.length > 0) {
      allIssues.push(`**Other:** ${issues.other.join('; ')}`);
    }
    
    if (allIssues.length > 0) {
      failureRows.push(`| \`${result.method} ${result.path}\` | ${allIssues.join('<br>') || '-'} | ${result.details?.suggestion || '-'} |`);
    }
  }
  
  // Process warnings (doc issues with successful HTTP)
  for (const result of warnings) {
    const issues = analyzeEndpointIssues(result);
    const allIssues = [];
    
    if (issues.paramMismatch) allIssues.push(`**Param Mismatch:** ${issues.paramMismatch}`);
    if (issues.tokenDoc) allIssues.push(`**Token Doc:** ${issues.tokenDoc}`);
    if (issues.schema.length > 0) {
      allIssues.push(`**Schema (${issues.schema.length}):** ${issues.schema.slice(0, 3).join('; ')}${issues.schema.length > 3 ? '...' : ''}`);
    }
    if (issues.other.length > 0) {
      allIssues.push(`**Other:** ${issues.other.join('; ')}`);
    }
    
    if (allIssues.length > 0) {
      warningRows.push(`| \`${result.method} ${result.path}\` | ${allIssues.join('<br>') || '-'} | ${result.details?.suggestion || '-'} |`);
    }
  }
  
  let output = '## Detailed Issues\n\n';
  
  if (failureRows.length > 0) {
    output += `### ❌ Failures (HTTP Errors)

| Endpoint | Issues | Suggested Fix |
|----------|--------|---------------|
${failureRows.join('\n')}

`;
  }
  
  if (warningRows.length > 0) {
    output += `### ⚠️ Warnings (Documentation Issues)

*These endpoints returned successful HTTP responses but have documentation discrepancies.*

| Endpoint | Issues | Suggested Fix |
|----------|--------|---------------|
${warningRows.join('\n')}`;
  }
  
  return output;
}

/**
 * Generate footer
 * @param {Object} report - Report object
 * @returns {string} Footer markdown
 */
function generateFooter(report) {
  // Count issue types across all results
  const issueCounts = {
    schema: 0,
    paramMismatch: 0,
    tokenDoc: 0,
    auth: 0,
    status: 0,
    other: 0
  };
  
  for (const result of (report.results || [])) {
    // Include FAIL, WARN, and ERROR in issue counts
    if (result.status !== 'FAIL' && result.status !== 'WARN' && result.status !== 'ERROR') continue;
    const issues = analyzeEndpointIssues(result);
    if (issues.schema.length > 0) issueCounts.schema++;
    if (issues.paramMismatch) issueCounts.paramMismatch++;
    if (issues.tokenDoc) issueCounts.tokenDoc++;
    if (issues.auth) issueCounts.auth++;
    if (issues.status) issueCounts.status++;
    if (issues.other.length > 0) issueCounts.other++;
  }
  
  const hasIssues = Object.values(issueCounts).some(c => c > 0);
  
  let issuesSummary = '';
  if (hasIssues) {
    issuesSummary = `
## Issue Type Summary

| Issue Type | Endpoints Affected |
|------------|-------------------|
| Schema Validation | ${issueCounts.schema} |
| Parameter Mismatch | ${issueCounts.paramMismatch} |
| Token Documentation | ${issueCounts.tokenDoc} |
| Authentication | ${issueCounts.auth} |
| Status Code | ${issueCounts.status} |
| Other | ${issueCounts.other} |
`;
  }

  return `${issuesSummary}
---

*Report generated by API Validation Tool*  
*Timestamp: ${report.summary.timestamp}*`;
}

/**
 * Generate a compact summary for quick reference
 * @param {Object} report - Report object
 * @returns {string} Compact summary markdown
 */
function generateCompactSummary(report) {
  const { summary } = report;
  
  const passRate = parseFloat(summary.passRate);
  let emoji = '🔴';
  if (passRate >= 90) emoji = '🟢';
  else if (passRate >= 70) emoji = '🟡';
  else if (passRate >= 50) emoji = '🟠';
  
  return `${emoji} **${summary.passRate}** | ✅ ${summary.passed} | ❌ ${summary.failed} | ⚠️ ${summary.warned || 0} | 🔶 ${summary.errored || 0} | ⏭️ ${summary.skipped} | Total: ${summary.total}`;
}

/**
 * Generate filename for report
 * @param {Object} report - Report object
 * @returns {string} Suggested filename
 */
function generateFilename(report) {
  const date = new Date(report.summary.timestamp);
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const env = report.summary.environment;
  
  return `api-validation-${env}-${dateStr}-${timeStr}.md`;
}

module.exports = {
  generateMarkdownReport,
  generateCompactSummary,
  generateFilename,
  generateHeader,
  generateSummarySection,
  generateDomainSummaryTable,
  generateMainResultsTable,
  generateDetailedIssues,
  analyzeEndpointIssues,
  ISSUE_TYPES
};
