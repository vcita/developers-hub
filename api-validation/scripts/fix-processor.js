#!/usr/bin/env node

/**
 * Fix Processor - Endpoint-by-Endpoint Report Handler
 * 
 * This script processes validation reports one endpoint at a time,
 * generating focused fix instructions based on handle_report.mdc rules.
 * 
 * Usage:
 *   node scripts/fix-processor.js <report-folder>        # Start/resume processing
 *   node scripts/fix-processor.js <report-folder> --status  # Show progress status
 *   node scripts/fix-processor.js <report-folder> --next    # Show next endpoint to fix
 *   node scripts/fix-processor.js <report-folder> --mark-done <endpoint>  # Mark endpoint as done
 *   node scripts/fix-processor.js <report-folder> --instructions <endpoint>  # Get fix instructions for specific endpoint
 *   node scripts/fix-processor.js <report-folder> --reset   # Reset progress
 */

const fs = require('fs');
const path = require('path');

// Severity priority order (from handle_report.mdc)
const SEVERITY_PRIORITY = {
  'warning': 1,
  'major': 2,
  'critical': 3,
  'minor': 4
};

const FIX_PRIORITY_RULES = `
## Fix Priority Order (MUST follow)
1. **WORKFLOW FIRST** - Check if test data is fake (inv_12345, test_abc) → Fix workflow file
2. **SCHEMA SECOND** - If API behavior is unexpected → Fix swagger schema (add required, type, example)
3. **DOCUMENTATION THIRD** - If behavior needs explaining → Add to description
4. **JIRA LAST** - Only after exhausting ALL documentation options

## How to Spot Fake Test Data
| Fake Pattern | Real Pattern |
|--------------|--------------|
| inv_12345 | lk9wgeze3ee1nl1v |
| test_uid | fc2ca1c54e528bc4 |
| example_123 | d290f1ee-6c54-4b01-90e6-d701748f0851 |
| pkg_abc | ppnmz70yqxltzz6j |
`;

class FixProcessor {
  constructor(reportFolder) {
    this.reportFolder = reportFolder;
    this.aiFixes = path.join(reportFolder, 'ai-fixes.md');
    this.progressFile = path.join(reportFolder, 'fix-progress.json');
    this.instructionsFile = path.join(reportFolder, 'current-instructions.md');
    
    if (!fs.existsSync(this.aiFixes)) {
      throw new Error(`ai-fixes.md not found in ${reportFolder}`);
    }
  }

  /**
   * Parse the ai-fixes.md file and extract issues from JSON section
   */
  parseReport() {
    const content = fs.readFileSync(this.aiFixes, 'utf-8');
    
    // Extract JSON section
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      throw new Error('Could not find JSON section in ai-fixes.md');
    }
    
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      throw new Error(`Failed to parse JSON section: ${e.message}`);
    }
  }

  /**
   * Group issues by endpoint
   */
  groupByEndpoint(issues) {
    const grouped = {};
    
    for (const issue of issues) {
      const key = `${issue.method} ${issue.path}`;
      if (!grouped[key]) {
        grouped[key] = {
          endpoint: key,
          method: issue.method,
          path: issue.path,
          domain: issue.domain,
          issues: []
        };
      }
      grouped[key].issues.push(issue);
    }
    
    return grouped;
  }

  /**
   * Sort issues by severity priority
   */
  sortBySeverity(issues) {
    return issues.sort((a, b) => {
      const priorityA = SEVERITY_PRIORITY[a.severity] || 999;
      const priorityB = SEVERITY_PRIORITY[b.severity] || 999;
      return priorityA - priorityB;
    });
  }

  /**
   * Get or initialize progress state
   */
  getProgress() {
    if (fs.existsSync(this.progressFile)) {
      return JSON.parse(fs.readFileSync(this.progressFile, 'utf-8'));
    }
    
    const issues = this.parseReport();
    const grouped = this.groupByEndpoint(issues);
    const endpoints = Object.keys(grouped).sort();
    
    const progress = {
      totalEndpoints: endpoints.length,
      totalIssues: issues.length,
      completed: [],
      skipped: [],
      needsJira: [],
      currentIndex: 0,
      endpoints: endpoints.map(ep => ({
        endpoint: ep,
        domain: grouped[ep].domain,
        issueCount: grouped[ep].issues.length,
        severities: this.getSeverityCounts(grouped[ep].issues),
        status: 'pending'
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.saveProgress(progress);
    return progress;
  }

  /**
   * Get severity breakdown for issues
   */
  getSeverityCounts(issues) {
    const counts = { warning: 0, major: 0, critical: 0, minor: 0 };
    for (const issue of issues) {
      if (counts[issue.severity] !== undefined) {
        counts[issue.severity]++;
      }
    }
    return counts;
  }

  /**
   * Save progress state
   */
  saveProgress(progress) {
    progress.updatedAt = new Date().toISOString();
    fs.writeFileSync(this.progressFile, JSON.stringify(progress, null, 2));
  }

  /**
   * Get next endpoint to process
   */
  getNextEndpoint() {
    const progress = this.getProgress();
    
    for (let i = progress.currentIndex; i < progress.endpoints.length; i++) {
      if (progress.endpoints[i].status === 'pending') {
        return {
          index: i,
          ...progress.endpoints[i]
        };
      }
    }
    
    return null;
  }

  /**
   * Generate detailed fix instructions for an endpoint
   */
  generateInstructions(endpointKey) {
    const issues = this.parseReport();
    const grouped = this.groupByEndpoint(issues);
    
    if (!grouped[endpointKey]) {
      throw new Error(`Endpoint not found: ${endpointKey}`);
    }
    
    const endpoint = grouped[endpointKey];
    const sortedIssues = this.sortBySeverity(endpoint.issues);
    
    // Deduplicate issues by unique combination of field + issue text
    const seen = new Set();
    const uniqueIssues = sortedIssues.filter(issue => {
      const key = `${issue.field}:${issue.issue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    const workflowPath = `api-validation/workflows/${endpoint.domain}/${this.pathToFilename(endpoint.path)}.md`;
    
    let instructions = `# Fix Instructions: ${endpointKey}\n\n`;
    instructions += `**Domain:** ${endpoint.domain}\n`;
    instructions += `**Issues:** ${uniqueIssues.length} unique issues\n`;
    instructions += `**Workflow file:** \`${workflowPath}\`\n\n`;
    
    instructions += FIX_PRIORITY_RULES + '\n\n';
    
    instructions += `---\n\n`;
    instructions += `## Step 1: Check Workflow File First\n\n`;
    instructions += `Read the workflow file at \`${workflowPath}\` and check:\n`;
    instructions += `- Are there fake UIDs like \`inv_12345\`, \`test_abc\`?\n`;
    instructions += `- Is the test data valid and real?\n`;
    instructions += `- Are prerequisites documented?\n\n`;
    
    instructions += `## Step 2: Review Each Issue\n\n`;
    
    // Group by severity for clearer processing
    const bySeverity = {
      warning: uniqueIssues.filter(i => i.severity === 'warning'),
      major: uniqueIssues.filter(i => i.severity === 'major'),
      critical: uniqueIssues.filter(i => i.severity === 'critical'),
      minor: uniqueIssues.filter(i => i.severity === 'minor')
    };
    
    for (const [severity, sevIssues] of Object.entries(bySeverity)) {
      if (sevIssues.length === 0) continue;
      
      instructions += `### ${severity.toUpperCase()} Issues (${sevIssues.length})\n\n`;
      
      for (let i = 0; i < sevIssues.length; i++) {
        const issue = sevIssues[i];
        instructions += `#### Issue ${i + 1}: ${issue.field || 'General'}\n\n`;
        instructions += `**Problem:**\n${issue.issue}\n\n`;
        
        if (issue.suggestedFix) {
          instructions += `**Suggested Fix:**\n${issue.suggestedFix}\n\n`;
        }
        
        if (issue.sourceCodeReference) {
          instructions += `**Source Code Reference:**\n${issue.sourceCodeReference}\n\n`;
        }
        
        if (issue.type) {
          instructions += `**Type:** ${issue.type}\n\n`;
        }
        
        instructions += `---\n\n`;
      }
    }
    
    instructions += `## Step 3: After Fixing\n\n`;
    instructions += `Run this command to mark this endpoint as done:\n`;
    instructions += `\`\`\`bash\n`;
    instructions += `node api-validation/scripts/fix-processor.js "${this.reportFolder}" --mark-done "${endpointKey}"\n`;
    instructions += `\`\`\`\n\n`;
    
    instructions += `Then get the next endpoint:\n`;
    instructions += `\`\`\`bash\n`;
    instructions += `node api-validation/scripts/fix-processor.js "${this.reportFolder}" --next\n`;
    instructions += `\`\`\`\n`;
    
    return instructions;
  }

  /**
   * Convert API path to workflow filename
   */
  pathToFilename(apiPath) {
    return apiPath
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\{([^}]+)\}/g, '$1');
  }

  /**
   * Mark an endpoint as completed
   */
  markDone(endpointKey, status = 'completed') {
    const progress = this.getProgress();
    
    const epIndex = progress.endpoints.findIndex(e => e.endpoint === endpointKey);
    if (epIndex === -1) {
      throw new Error(`Endpoint not found: ${endpointKey}`);
    }
    
    progress.endpoints[epIndex].status = status;
    progress.endpoints[epIndex].completedAt = new Date().toISOString();
    
    if (status === 'completed') {
      progress.completed.push(endpointKey);
    } else if (status === 'skipped') {
      progress.skipped.push(endpointKey);
    } else if (status === 'needs_jira') {
      progress.needsJira.push(endpointKey);
    }
    
    // Move to next pending endpoint
    while (progress.currentIndex < progress.endpoints.length && 
           progress.endpoints[progress.currentIndex].status !== 'pending') {
      progress.currentIndex++;
    }
    
    this.saveProgress(progress);
    return progress;
  }

  /**
   * Get status summary
   */
  getStatus() {
    const progress = this.getProgress();
    
    const pending = progress.endpoints.filter(e => e.status === 'pending').length;
    const completed = progress.completed.length;
    const skipped = progress.skipped.length;
    const needsJira = progress.needsJira.length;
    
    let output = `\n## Fix Progress Report\n\n`;
    output += `**Report:** ${this.reportFolder}\n`;
    output += `**Total Endpoints:** ${progress.totalEndpoints}\n`;
    output += `**Total Issues:** ${progress.totalIssues}\n\n`;
    
    output += `### Status Breakdown\n\n`;
    output += `| Status | Count | Percentage |\n`;
    output += `|--------|-------|------------|\n`;
    output += `| Completed | ${completed} | ${(completed / progress.totalEndpoints * 100).toFixed(1)}% |\n`;
    output += `| Pending | ${pending} | ${(pending / progress.totalEndpoints * 100).toFixed(1)}% |\n`;
    output += `| Skipped | ${skipped} | ${(skipped / progress.totalEndpoints * 100).toFixed(1)}% |\n`;
    output += `| Needs JIRA | ${needsJira} | ${(needsJira / progress.totalEndpoints * 100).toFixed(1)}% |\n`;
    
    output += `\n### Progress: ${completed}/${progress.totalEndpoints} (${(completed / progress.totalEndpoints * 100).toFixed(1)}%)\n`;
    
    // Show next few pending endpoints
    const nextPending = progress.endpoints
      .filter(e => e.status === 'pending')
      .slice(0, 5);
    
    if (nextPending.length > 0) {
      output += `\n### Next Pending Endpoints\n\n`;
      for (const ep of nextPending) {
        output += `- **${ep.endpoint}** (${ep.domain}) - ${ep.issueCount} issues `;
        output += `[C:${ep.severities.critical} M:${ep.severities.major} W:${ep.severities.warning} m:${ep.severities.minor}]\n`;
      }
    }
    
    return output;
  }

  /**
   * Reset progress
   */
  reset() {
    if (fs.existsSync(this.progressFile)) {
      fs.unlinkSync(this.progressFile);
    }
    if (fs.existsSync(this.instructionsFile)) {
      fs.unlinkSync(this.instructionsFile);
    }
    console.log('Progress reset. Run again to start fresh.');
  }

  /**
   * Generate a focused Cursor prompt for a specific endpoint
   */
  generateCursorPrompt(endpointKey) {
    const issues = this.parseReport();
    const grouped = this.groupByEndpoint(issues);
    
    if (!grouped[endpointKey]) {
      throw new Error(`Endpoint not found: ${endpointKey}`);
    }
    
    const endpoint = grouped[endpointKey];
    const sortedIssues = this.sortBySeverity(endpoint.issues);
    
    // Deduplicate issues
    const seen = new Set();
    const uniqueIssues = sortedIssues.filter(issue => {
      const key = `${issue.field}:${issue.issue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    const workflowPath = `api-validation/workflows/${endpoint.domain}/${this.pathToFilename(endpoint.path)}.md`;
    
    // Find the swagger file
    const swaggerPath = this.findSwaggerPath(endpoint.domain, endpoint.path);
    
    let prompt = `Fix validation issues for: **${endpointKey}**\n\n`;
    prompt += `Follow @developers-hub/.cursor/rules/handle_report.mdc rules.\n\n`;
    
    prompt += `## Files to check:\n`;
    prompt += `1. Workflow: \`${workflowPath}\`\n`;
    prompt += `2. Swagger: \`${swaggerPath}\`\n\n`;
    
    prompt += `## Issues to fix (${uniqueIssues.length}):\n\n`;
    
    for (let i = 0; i < uniqueIssues.length; i++) {
      const issue = uniqueIssues[i];
      prompt += `### ${i + 1}. [${issue.severity.toUpperCase()}] ${issue.field || 'General'}\n`;
      prompt += `**Problem:** ${issue.issue}\n`;
      if (issue.suggestedFix) {
        prompt += `**Fix:** ${issue.suggestedFix}\n`;
      }
      prompt += `\n`;
    }
    
    prompt += `## After fixing:\n`;
    prompt += `Run: \`node api-validation/scripts/fix-processor.js "${this.reportFolder}" --mark-done "${endpointKey}"\`\n`;
    
    return prompt;
  }

  /**
   * Find swagger file path for a domain and endpoint
   */
  findSwaggerPath(domain, apiPath) {
    // Common swagger file locations based on domain
    const swaggerBase = 'swagger';
    
    // Map path prefixes to swagger files
    const pathMappings = [
      { prefix: '/business/clients/', file: `${swaggerBase}/${domain}/legacy/manage_clients.json` },
      { prefix: '/business/search/', file: `${swaggerBase}/${domain}/legacy/crm_views.json` },
      { prefix: '/client/payments/', file: `${swaggerBase}/${domain}/legacy/clients_payments.json` },
      { prefix: '/platform/v1/clients/', file: `${swaggerBase}/${domain}/legacy/legacy_v1_clients.json` },
      { prefix: '/client_api/', file: `${swaggerBase}/${domain}/legacy/client_communication.json` },
      { prefix: '/business/staffs/', file: `${swaggerBase}/platform_administration/legacy/staff.json` },
      { prefix: '/v3/access_control/', file: `${swaggerBase}/platform_administration/access_control.json` },
    ];
    
    for (const mapping of pathMappings) {
      if (apiPath.startsWith(mapping.prefix)) {
        return mapping.file;
      }
    }
    
    return `${swaggerBase}/${domain}/*.json (search for endpoint)`;
  }

  /**
   * Generate endpoints to retest file
   */
  generateRetestList() {
    const progress = this.getProgress();
    const completed = progress.endpoints.filter(e => e.status === 'completed');
    
    let output = `# Endpoints to Retest\n\n`;
    output += `Generated: ${new Date().toISOString()}\n\n`;
    
    output += `## Summary\n`;
    output += `- Fixed endpoints: ${completed.length}\n\n`;
    
    output += `## Detailed List\n\n`;
    output += `| Endpoint | Method | Domain | Issues Fixed |\n`;
    output += `|----------|--------|--------|-------------|\n`;
    
    for (const ep of completed) {
      const parts = ep.endpoint.split(' ');
      output += `| ${parts[1]} | ${parts[0]} | ${ep.domain} | ${ep.issueCount} |\n`;
    }
    
    output += `\n## Quick Copy (for Validator UI)\n\n`;
    output += '```\n';
    output += completed.map(ep => ep.endpoint).join(', ');
    output += '\n```\n';
    
    return output;
  }
}

// CLI
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    Fix Processor - Endpoint-by-Endpoint                        ║
║                        API Documentation Fix Handler                           ║
╚═══════════════════════════════════════════════════════════════════════════════╝

This script processes validation reports one endpoint at a time, preventing
Cursor from getting overwhelmed by large reports.

USAGE:
  node scripts/fix-processor.js <report-folder> <command> [args]

COMMANDS:
  --status           Show overall progress status
  --next             Get detailed instructions for next pending endpoint
  --cursor           Generate a focused Cursor-friendly prompt for next endpoint
  --list             List all endpoints with their status
  --instructions <endpoint>   Get instructions for specific endpoint
  --mark-done <endpoint>      Mark endpoint as completed
  --mark-skip <endpoint>      Mark endpoint as skipped (won't be processed)
  --mark-jira <endpoint>      Mark endpoint as needing JIRA ticket
  --batch [N]        Generate prompts for N endpoints (default: 3)
  --retest           Generate list of endpoints to retest after fixes
  --reset            Reset all progress (start fresh)

RECOMMENDED WORKFLOW:

  1. Check status:
     node scripts/fix-processor.js <report> --status

  2. Get next endpoint prompt:
     node scripts/fix-processor.js <report> --cursor
     
  3. Copy the prompt and paste to Cursor to fix that endpoint
  
  4. After fixing, mark as done:
     node scripts/fix-processor.js <report> --mark-done "<METHOD /path>"
     
  5. Repeat steps 2-4 until all endpoints are processed

EXAMPLES:
  # Status check
  node scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --status
  
  # Get cursor prompt for next endpoint
  node scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --cursor
  
  # Mark endpoint as done
  node scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --mark-done "POST /business/clients/v1/matters/{matter_uid}/notes"
  
  # Get instructions for specific endpoint
  node scripts/fix-processor.js api-validation/reports/clients-2026-01-31-20-22-18 --instructions "GET /client/payments/v1/invoices"

`);
    process.exit(1);
  }
  
  const reportFolder = args[0];
  const processor = new FixProcessor(reportFolder);
  
  const command = args[1] || '--next';
  
  switch (command) {
    case '--status':
      console.log(processor.getStatus());
      break;
      
    case '--next': {
      const next = processor.getNextEndpoint();
      if (!next) {
        console.log('\n✅ All endpoints processed!');
        console.log(processor.getStatus());
      } else {
        const instructions = processor.generateInstructions(next.endpoint);
        
        // Save instructions to file for easy access
        const instructionsFile = path.join(reportFolder, 'current-instructions.md');
        fs.writeFileSync(instructionsFile, instructions);
        
        console.log(`\n📋 Instructions saved to: ${instructionsFile}\n`);
        console.log(`Next endpoint: ${next.endpoint}`);
        console.log(`Domain: ${next.domain}`);
        console.log(`Issues: ${next.issueCount}`);
        console.log(`Severity breakdown: Critical=${next.severities.critical}, Major=${next.severities.major}, Warning=${next.severities.warning}, Minor=${next.severities.minor}`);
        console.log(`\nProgress: ${next.index + 1}/${processor.getProgress().totalEndpoints}\n`);
        console.log('─'.repeat(60));
        console.log(instructions);
      }
      break;
    }
    
    case '--mark-done': {
      const endpoint = args[2];
      if (!endpoint) {
        console.error('Error: Endpoint required. Usage: --mark-done "<METHOD /path>"');
        process.exit(1);
      }
      processor.markDone(endpoint, 'completed');
      console.log(`✅ Marked as done: ${endpoint}`);
      
      const next = processor.getNextEndpoint();
      if (next) {
        console.log(`\nNext endpoint: ${next.endpoint}`);
      } else {
        console.log('\n🎉 All endpoints processed!');
      }
      break;
    }
    
    case '--mark-skip': {
      const endpoint = args[2];
      if (!endpoint) {
        console.error('Error: Endpoint required');
        process.exit(1);
      }
      processor.markDone(endpoint, 'skipped');
      console.log(`⏭️ Marked as skipped: ${endpoint}`);
      break;
    }
    
    case '--mark-jira': {
      const endpoint = args[2];
      if (!endpoint) {
        console.error('Error: Endpoint required');
        process.exit(1);
      }
      processor.markDone(endpoint, 'needs_jira');
      console.log(`📝 Marked as needs JIRA: ${endpoint}`);
      break;
    }
    
    case '--instructions': {
      const endpoint = args[2];
      if (!endpoint) {
        console.error('Error: Endpoint required');
        process.exit(1);
      }
      console.log(processor.generateInstructions(endpoint));
      break;
    }
    
    case '--retest':
      console.log(processor.generateRetestList());
      break;
    
    case '--reset':
      processor.reset();
      break;
    
    case '--list': {
      const progress = processor.getProgress();
      console.log('\n## All Endpoints\n');
      for (const ep of progress.endpoints) {
        const status = ep.status === 'pending' ? '⏳' : 
                       ep.status === 'completed' ? '✅' :
                       ep.status === 'skipped' ? '⏭️' : '📝';
        console.log(`${status} ${ep.endpoint} (${ep.domain}) - ${ep.issueCount} issues`);
      }
      break;
    }
    
    case '--cursor': {
      // Generate a cursor-friendly prompt for the next endpoint
      const next = processor.getNextEndpoint();
      if (!next) {
        console.log('All endpoints processed!');
        break;
      }
      
      const cursorPrompt = processor.generateCursorPrompt(next.endpoint);
      const promptFile = path.join(reportFolder, 'cursor-prompt.md');
      fs.writeFileSync(promptFile, cursorPrompt);
      
      console.log(`\n📋 Cursor prompt saved to: ${promptFile}`);
      console.log(`\nCopy this prompt to Cursor:\n`);
      console.log('─'.repeat(60));
      console.log(cursorPrompt);
      break;
    }
    
    case '--batch': {
      // Generate a batch of endpoints for parallel processing
      const batchSize = parseInt(args[2]) || 3;
      const progress = processor.getProgress();
      const pending = progress.endpoints.filter(e => e.status === 'pending').slice(0, batchSize);
      
      if (pending.length === 0) {
        console.log('All endpoints processed!');
        break;
      }
      
      console.log(`\n## Batch of ${pending.length} Endpoints\n`);
      for (const ep of pending) {
        console.log(`\n### ${ep.endpoint}\n`);
        console.log(processor.generateCursorPrompt(ep.endpoint));
        console.log('\n---\n');
      }
      break;
    }
    
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main();
