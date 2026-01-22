/**
 * Console Formatter
 * Pretty console output for validation results
 */

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m'
};

// Box drawing characters
const box = {
  topLeft: '╔',
  topRight: '╗',
  bottomLeft: '╚',
  bottomRight: '╝',
  horizontal: '═',
  vertical: '║',
  teeLeft: '╠',
  teeRight: '╣',
  innerTopLeft: '┌',
  innerTopRight: '┐',
  innerBottomLeft: '└',
  innerBottomRight: '┘',
  innerHorizontal: '─',
  innerVertical: '│'
};

/**
 * Print a horizontal line
 * @param {number} width - Line width
 * @param {string} char - Character to use
 */
function horizontalLine(width, char = box.horizontal) {
  return char.repeat(width);
}

/**
 * Center text within a width
 * @param {string} text - Text to center
 * @param {number} width - Total width
 * @returns {string} Centered text
 */
function centerText(text, width) {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return ' '.repeat(left) + text + ' '.repeat(right);
}

/**
 * Pad text to right
 * @param {string} text - Text to pad
 * @param {number} width - Total width
 * @returns {string} Padded text
 */
function padRight(text, width) {
  return text + ' '.repeat(Math.max(0, width - text.length));
}

/**
 * Print report header
 * @param {Object} summary - Report summary
 */
function printHeader(summary) {
  const width = 62;
  
  console.log(colors.cyan + box.topLeft + horizontalLine(width) + box.topRight + colors.reset);
  console.log(colors.cyan + box.vertical + colors.bold + centerText('API VALIDATION REPORT', width) + colors.reset + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.vertical + colors.dim + centerText(summary.timestamp.replace('T', ' ').split('.')[0], width) + colors.reset + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.teeLeft + horizontalLine(width) + box.teeRight + colors.reset);
  console.log(colors.cyan + box.vertical + colors.reset + padRight(`  Environment: ${summary.environment} (${summary.baseUrl})`, width) + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.vertical + colors.reset + padRight(`  Duration: ${summary.duration}`, width) + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.teeLeft + horizontalLine(width) + box.teeRight + colors.reset);
  
  // Stats line
  const passColor = summary.failed === 0 ? colors.green : (summary.passed > summary.failed ? colors.yellow : colors.red);
  const warned = summary.warned || 0;
  const stats = `  PASSED: ${summary.passed}    WARNED: ${warned}    FAILED: ${summary.failed}    SKIPPED: ${summary.skipped}    TOTAL: ${summary.total}`;
  console.log(colors.cyan + box.vertical + passColor + padRight(stats, width) + colors.reset + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.vertical + colors.bold + padRight(`  Pass Rate: ${summary.passRate}`, width) + colors.reset + colors.cyan + box.vertical + colors.reset);
  console.log(colors.cyan + box.bottomLeft + horizontalLine(width) + box.bottomRight + colors.reset);
  console.log();
}

/**
 * Print documentation issues
 * @param {Object[]} issues - Documentation issues
 */
function printDocumentationIssues(issues) {
  if (issues.length === 0) return;
  
  console.log(colors.yellow + `📋 DOCUMENTATION ISSUES (${issues.length})` + colors.reset);
  
  for (const issue of issues) {
    console.log(colors.dim + box.innerTopLeft + horizontalLine(60, box.innerHorizontal) + box.innerTopRight + colors.reset);
    console.log(colors.dim + box.innerVertical + colors.reset + colors.yellow + ` ⚠ ${issue.endpoint}` + colors.reset);
    console.log(colors.dim + box.innerVertical + colors.reset + `   ${issue.message}`);
    console.log(colors.dim + box.innerBottomLeft + horizontalLine(60, box.innerHorizontal) + box.innerBottomRight + colors.reset);
  }
  console.log();
}

/**
 * Print failures
 * @param {Object[]} failures - Failed test results
 */
function printFailures(failures) {
  if (failures.length === 0) return;
  
  console.log(colors.red + `❌ FAILURES (${failures.length})` + colors.reset);
  
  for (let i = 0; i < failures.length; i++) {
    const result = failures[i];
    const details = result.details || {};
    
    console.log(colors.dim + box.innerTopLeft + horizontalLine(60, box.innerHorizontal) + box.innerTopRight + colors.reset);
    console.log(colors.dim + box.innerVertical + colors.reset + colors.red + ` ${i + 1}. ${result.endpoint}` + colors.reset);
    console.log(colors.dim + box.innerVertical + colors.reset + colors.dim + `    Status: ${result.httpStatus || 'N/A'} | Token: ${result.tokenUsed || 'N/A'} | Duration: ${result.duration}` + colors.reset);
    console.log(colors.dim + box.innerVertical + horizontalLine(60, box.innerHorizontal) + colors.reset);
    console.log(colors.dim + box.innerVertical + colors.reset + colors.yellow + `    Reason: ${details.reason || 'UNKNOWN'}` + colors.reset);
    
    if (details.friendlyMessage) {
      // Word wrap the friendly message
      const lines = wordWrap(details.friendlyMessage, 54);
      for (const line of lines) {
        console.log(colors.dim + box.innerVertical + colors.reset + `    ${line}`);
      }
    }
    
    // Print expected vs actual for schema mismatches
    if (details.errors && details.errors.length > 0) {
      console.log(colors.dim + box.innerVertical + colors.reset);
      for (const error of details.errors.slice(0, 3)) { // Limit to 3 errors
        console.log(colors.dim + box.innerVertical + colors.reset + colors.dim + `    • ${error.path || 'root'}: ${error.message}` + colors.reset);
      }
      if (details.errors.length > 3) {
        console.log(colors.dim + box.innerVertical + colors.reset + colors.dim + `    ... and ${details.errors.length - 3} more errors` + colors.reset);
      }
    }
    
    // Print suggestion
    if (details.suggestion) {
      console.log(colors.dim + box.innerVertical + colors.reset);
      console.log(colors.dim + box.innerVertical + colors.reset + colors.green + `    💡 ${details.suggestion}` + colors.reset);
    }
    
    console.log(colors.dim + box.innerBottomLeft + horizontalLine(60, box.innerHorizontal) + box.innerBottomRight + colors.reset);
  }
  console.log();
}

/**
 * Print domain summary
 * @param {Object} byDomain - Results grouped by domain
 */
function printDomainSummary(byDomain) {
  console.log(colors.green + '✓ BY DOMAIN' + colors.reset);
  
  const domains = Object.entries(byDomain).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [domain, stats] of domains) {
    const testable = stats.total - stats.skipped;
    const rate = testable > 0 ? ((stats.passed / testable) * 100).toFixed(0) : 0;
    const color = rate === '100' ? colors.green : (rate >= 80 ? colors.yellow : colors.red);
    
    console.log(`  ${padRight(domain + ':', 20)} ${color}${stats.passed}/${testable} passed (${rate}%)${colors.reset}`);
  }
  console.log();
}

/**
 * Print progress update (for real-time output)
 * @param {number} current - Current test number
 * @param {number} total - Total tests
 * @param {Object} result - Latest result
 */
function printProgress(current, total, result) {
  const percent = Math.round((current / total) * 100);
  const status = result.status === 'PASS' ? colors.green + '✓' : 
                 result.status === 'WARN' ? colors.yellow + '⚠' : colors.red + '✗';
  
  process.stdout.write(`\r${colors.dim}[${current}/${total}]${colors.reset} ${percent}% ${status} ${result.endpoint}${colors.reset}`.padEnd(80));
}

/**
 * Clear progress line
 */
function clearProgress() {
  process.stdout.write('\r' + ' '.repeat(80) + '\r');
}

/**
 * Print full report to console
 * @param {Object} report - Full report object
 * @param {Object} options - Print options
 */
function printReport(report, options = {}) {
  const { quiet = false, showPassing = false } = options;
  
  if (quiet) {
    // Minimal output
    console.log(`${report.summary.passed}/${report.summary.total} passed (${report.summary.passRate})`);
    return;
  }
  
  console.log();
  printHeader(report.summary);
  
  if (report.documentationIssues.length > 0) {
    printDocumentationIssues(report.documentationIssues);
  }
  
  const failures = report.results.filter(r => r.status === 'FAIL');
  if (failures.length > 0) {
    printFailures(failures);
  }
  
  if (showPassing) {
    const passing = report.results.filter(r => r.status === 'PASS');
    if (passing.length > 0) {
      console.log(colors.green + `✓ PASSING (${passing.length})` + colors.reset);
      for (const result of passing) {
        console.log(`  ${colors.green}✓${colors.reset} ${result.endpoint} ${colors.dim}(${result.duration})${colors.reset}`);
      }
      console.log();
    }
  }
  
  printDomainSummary(report.byDomain);
  
  // Final status
  if (report.summary.failed === 0) {
    console.log(colors.green + colors.bold + '✓ All tests passed!' + colors.reset);
  } else {
    console.log(colors.red + colors.bold + `✗ ${report.summary.failed} test(s) failed` + colors.reset);
  }
  console.log();
}

/**
 * Word wrap text to specified width
 * @param {string} text - Text to wrap
 * @param {number} width - Max width per line
 * @returns {string[]} Array of lines
 */
function wordWrap(text, width) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

module.exports = {
  printHeader,
  printDocumentationIssues,
  printFailures,
  printDomainSummary,
  printProgress,
  clearProgress,
  printReport,
  colors,
  box
};
