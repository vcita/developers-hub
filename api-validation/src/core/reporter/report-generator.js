/**
 * Report Generator
 * Creates structured JSON reports from validation results
 */

const fs = require('fs');
const path = require('path');

/**
 * Create a new report object
 * @param {Object} config - Configuration used for this run
 * @returns {Object} Empty report structure
 */
function createReport(config) {
  return {
    summary: {
      timestamp: new Date().toISOString(),
      environment: extractEnvironmentName(config.baseUrl),
      baseUrl: config.baseUrl,
      total: 0,
      passed: 0,
      failed: 0,
      warned: 0,
      errored: 0,
      skipped: 0,
      passRate: '0%',
      duration: '0s',
      durationMs: 0
    },
    documentationIssues: [],
    results: [],
    byDomain: {},
    config: {
      swaggerPath: config.swaggerPath,
      rateLimit: config.rateLimit,
      options: config.options
    }
  };
}

/**
 * Extract environment name from base URL
 * @param {string} baseUrl - Base URL
 * @returns {string} Environment name
 */
function extractEnvironmentName(baseUrl) {
  if (!baseUrl) return 'unknown';
  
  if (baseUrl.includes('staging')) return 'staging';
  if (baseUrl.includes('devspace')) return 'devspace';
  if (baseUrl.includes('localhost')) return 'local';
  if (baseUrl.includes('production') || baseUrl.includes('api.vcita.biz')) return 'production';
  
  return 'custom';
}

/**
 * Add a documentation issue to the report
 * @param {Object} report - Report object
 * @param {Object} issue - Documentation issue
 */
function addDocumentationIssue(report, issue) {
  report.documentationIssues.push({
    endpoint: issue.endpoint,
    issue: issue.issue,
    message: issue.message,
    severity: issue.severity || 'error'
  });
}

/**
 * Add a test result to the report
 * @param {Object} report - Report object
 * @param {Object} result - Test result
 */
function addResult(report, result) {
  report.results.push(result);
  
  // Update domain stats
  const domain = result.domain;
  if (!report.byDomain[domain]) {
    report.byDomain[domain] = {
      passed: 0,
      failed: 0,
      warned: 0,
      errored: 0,
      skipped: 0,
      total: 0
    };
  }
  
  report.byDomain[domain].total++;
  
  switch (result.status) {
    case 'PASS':
      report.byDomain[domain].passed++;
      break;
    case 'FAIL':
      report.byDomain[domain].failed++;
      break;
    case 'WARN':
      report.byDomain[domain].warned++;
      break;
    case 'ERROR':
      report.byDomain[domain].errored++;
      break;
    case 'SKIP':
      report.byDomain[domain].skipped++;
      break;
  }
}

/**
 * Finalize the report with summary statistics
 * @param {Object} report - Report object
 * @param {number} durationMs - Total duration in milliseconds
 */
function finalizeReport(report, durationMs) {
  report.summary.total = report.results.length;
  report.summary.passed = report.results.filter(r => r.status === 'PASS').length;
  report.summary.failed = report.results.filter(r => r.status === 'FAIL').length;
  report.summary.warned = report.results.filter(r => r.status === 'WARN').length;
  report.summary.errored = report.results.filter(r => r.status === 'ERROR').length;
  report.summary.skipped = report.results.filter(r => r.status === 'SKIP').length;
  
  // Calculate pass rate (PASS / (PASS + FAIL + WARN))
  const testable = report.summary.total - report.summary.skipped;
  if (testable > 0) {
    const rate = (report.summary.passed / testable * 100).toFixed(1);
    report.summary.passRate = `${rate}%`;
  }
  
  // Format duration
  report.summary.durationMs = durationMs;
  report.summary.duration = formatDuration(durationMs);
  
  // Calculate domain pass rates
  for (const [domain, stats] of Object.entries(report.byDomain)) {
    const domainTestable = stats.total - stats.skipped;
    if (domainTestable > 0) {
      stats.passRate = ((stats.passed / domainTestable) * 100).toFixed(1) + '%';
    } else {
      stats.passRate = 'N/A';
    }
  }
}

/**
 * Format duration in human-readable form
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Save report to JSON file
 * @param {Object} report - Report object
 * @param {string} outputPath - Output file path
 */
function saveReport(report, outputPath) {
  const dir = path.dirname(outputPath);
  
  // Create directory if needed
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
}

/**
 * Load report from JSON file
 * @param {string} filePath - Report file path
 * @returns {Object} Report object
 */
function loadReport(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Get failures from report
 * @param {Object} report - Report object
 * @returns {Object[]} Failed results
 */
function getFailures(report) {
  return report.results.filter(r => r.status === 'FAIL');
}

/**
 * Get results by reason code
 * @param {Object} report - Report object
 * @param {string} reason - Failure reason code
 * @returns {Object[]} Matching results
 */
function getByReason(report, reason) {
  return report.results.filter(r => 
    r.status === 'FAIL' && r.details?.reason === reason
  );
}

/**
 * Generate summary text
 * @param {Object} report - Report object
 * @returns {string} Summary text
 */
function generateSummaryText(report) {
  const { summary } = report;
  
  return [
    `API Validation Report - ${summary.timestamp}`,
    `Environment: ${summary.environment} (${summary.baseUrl})`,
    `Duration: ${summary.duration}`,
    '',
    `Total: ${summary.total} | ✅ Passed: ${summary.passed} | ❌ Failed: ${summary.failed} | ⚠️ Warned: ${summary.warned} | 🔶 Errors: ${summary.errored} | ⏭️ Skipped: ${summary.skipped}`,
    `Pass Rate: ${summary.passRate}`,
    '',
    'By Domain:',
    ...Object.entries(report.byDomain).map(([domain, stats]) => 
      `  ${domain}: ${stats.passed}/${stats.total - stats.skipped} passed (${stats.passRate})`
    )
  ].join('\n');
}

/**
 * Merge multiple reports into one
 * @param {Object[]} reports - Array of reports to merge
 * @returns {Object} Merged report
 */
function mergeReports(reports) {
  if (reports.length === 0) return null;
  if (reports.length === 1) return reports[0];
  
  const merged = createReport({
    baseUrl: reports[0].summary.baseUrl,
    swaggerPath: reports[0].config?.swaggerPath
  });
  
  let totalDuration = 0;
  
  for (const report of reports) {
    // Merge documentation issues
    merged.documentationIssues.push(...report.documentationIssues);
    
    // Merge results
    for (const result of report.results) {
      addResult(merged, result);
    }
    
    totalDuration += report.summary.durationMs || 0;
  }
  
  finalizeReport(merged, totalDuration);
  
  return merged;
}

/**
 * Compare two reports to find differences
 * @param {Object} oldReport - Previous report
 * @param {Object} newReport - New report
 * @returns {Object} Comparison result
 */
function compareReports(oldReport, newReport) {
  const oldResults = new Map(
    oldReport.results.map(r => [`${r.method} ${r.path}`, r])
  );
  
  const newResults = new Map(
    newReport.results.map(r => [`${r.method} ${r.path}`, r])
  );
  
  const comparison = {
    improved: [], // Was failing, now passing
    regressed: [], // Was passing, now failing
    fixed: [],    // New endpoints that pass
    broken: [],   // New endpoints that fail
    unchanged: {
      passing: 0,
      failing: 0
    }
  };
  
  // Check existing endpoints
  for (const [key, oldResult] of oldResults) {
    const newResult = newResults.get(key);
    
    if (!newResult) continue; // Endpoint removed
    
    if (oldResult.status === 'FAIL' && newResult.status === 'PASS') {
      comparison.improved.push({ endpoint: key, old: oldResult, new: newResult });
    } else if (oldResult.status === 'PASS' && newResult.status === 'FAIL') {
      comparison.regressed.push({ endpoint: key, old: oldResult, new: newResult });
    } else if (oldResult.status === 'PASS' && newResult.status === 'PASS') {
      comparison.unchanged.passing++;
    } else if (oldResult.status === 'FAIL' && newResult.status === 'FAIL') {
      comparison.unchanged.failing++;
    }
  }
  
  // Check new endpoints
  for (const [key, newResult] of newResults) {
    if (!oldResults.has(key)) {
      if (newResult.status === 'PASS') {
        comparison.fixed.push({ endpoint: key, result: newResult });
      } else if (newResult.status === 'FAIL') {
        comparison.broken.push({ endpoint: key, result: newResult });
      }
    }
  }
  
  return comparison;
}

module.exports = {
  createReport,
  addDocumentationIssue,
  addResult,
  finalizeReport,
  saveReport,
  loadReport,
  getFailures,
  getByReason,
  generateSummaryText,
  mergeReports,
  compareReports,
  formatDuration,
  extractEnvironmentName
};
