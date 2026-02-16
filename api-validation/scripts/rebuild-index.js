#!/usr/bin/env node
/**
 * Rebuild Index Script
 * 
 * Regenerates index.json from workflow files.
 * 
 * Usage:
 *   node scripts/rebuild-index.js [options]
 * 
 * Options:
 *   --dry-run  Show what would be written without modifying files
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '../workflows');
const INDEX_FILE = path.join(WORKFLOWS_DIR, 'index.json');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run')
};

/**
 * Parse frontmatter from markdown
 */
function parseWorkflow(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  
  const metadata = {};
  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      let [, key, value] = kvMatch;
      value = value.trim();
      
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        metadata[key] = inner === '' ? [] : inner.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      } else if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        metadata[key] = value.slice(1, -1);
      } else if (value === 'true') {
        metadata[key] = true;
      } else if (value === 'false') {
        metadata[key] = false;
      } else if (!isNaN(Number(value)) && value !== '') {
        metadata[key] = Number(value);
      } else {
        metadata[key] = value;
      }
    }
  }
  
  return metadata;
}

/**
 * Get all workflow files
 */
function getWorkflowFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.isFile() && 
                 entry.name.endsWith('.md') && 
                 !entry.name.endsWith('.bak') &&
                 entry.name !== 'README.md' &&
                 entry.name !== 'TEMPLATE.md' &&
                 entry.name !== 'CONSISTENCY_AUDIT.md') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Main entry point
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Rebuild Workflow Index');
  console.log('='.repeat(60));
  
  const files = getWorkflowFiles(WORKFLOWS_DIR);
  console.log(`Found ${files.length} workflow files\n`);
  
  const workflows = {};
  let count = 0;
  
  for (const filePath of files) {
    const relativePath = path.relative(WORKFLOWS_DIR, filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const metadata = parseWorkflow(content);
      
      if (!metadata.endpoint) {
        console.log(`  [SKIP] ${relativePath} - No endpoint`);
        continue;
      }
      
      workflows[metadata.endpoint] = {
        file: relativePath,
        domain: metadata.domain || null,
        tags: metadata.tags || [],
        status: metadata.status || 'pending',
        skipReason: metadata.skipReason || null,
        timesReused: metadata.timesReused || 0,
        savedAt: metadata.savedAt || null,
        verifiedAt: metadata.verifiedAt || null
      };
      
      count++;
    } catch (error) {
      console.error(`  [ERROR] ${relativePath}: ${error.message}`);
    }
  }
  
  // Build index object
  const index = {
    version: '1.0',
    lastUpdated: new Date().toISOString(),
    workflows
  };
  
  // Sort workflows by endpoint for consistent output
  const sortedWorkflows = {};
  for (const key of Object.keys(workflows).sort()) {
    sortedWorkflows[key] = workflows[key];
  }
  index.workflows = sortedWorkflows;
  
  const indexContent = JSON.stringify(index, null, 2);
  
  if (options.dryRun) {
    console.log(`\n[DRY RUN] Would write ${count} workflows to index.json`);
    console.log(`Index size: ${(indexContent.length / 1024).toFixed(2)} KB`);
  } else {
    fs.writeFileSync(INDEX_FILE, indexContent);
    console.log(`\nWrote ${count} workflows to index.json`);
    console.log(`Index size: ${(indexContent.length / 1024).toFixed(2)} KB`);
  }
  
  // Print summary by status
  const byStatus = {};
  for (const workflow of Object.values(workflows)) {
    byStatus[workflow.status] = (byStatus[workflow.status] || 0) + 1;
  }
  
  console.log('\nWorkflows by status:');
  for (const [status, count] of Object.entries(byStatus).sort()) {
    console.log(`  ${status}: ${count}`);
  }
  
  // Print summary by domain
  const byDomain = {};
  for (const workflow of Object.values(workflows)) {
    const domain = workflow.domain || 'unknown';
    byDomain[domain] = (byDomain[domain] || 0) + 1;
  }
  
  console.log('\nWorkflows by domain:');
  for (const [domain, count] of Object.entries(byDomain).sort()) {
    console.log(`  ${domain}: ${count}`);
  }
}

// Run
main().catch(error => {
  console.error('Rebuild failed:', error);
  process.exit(1);
});
