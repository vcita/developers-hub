#!/usr/bin/env node
/**
 * Workflow Migration Script
 * 
 * Converts existing workflow files from the old format (JSON request templates)
 * to the new deterministic format (YAML steps with prerequisites).
 * 
 * Usage:
 *   node scripts/migrate-workflows.js [options]
 * 
 * Options:
 *   --dry-run       Show what would be changed without modifying files
 *   --verbose       Show detailed output
 *   --domain <name> Only migrate workflows in specified domain
 *   --file <path>   Only migrate a specific file
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const WORKFLOWS_DIR = path.join(__dirname, '../workflows');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  domain: args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null,
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null
};

// Statistics
const stats = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  alreadyMigrated: 0,
  errors: []
};

/**
 * Parse the old format frontmatter
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };
  
  const metadata = {};
  match[1].split('\n').forEach(line => {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      let [, key, value] = kvMatch;
      value = value.trim();
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(v => v.trim());
      }
      metadata[key] = value;
    }
  });
  
  return { metadata, body: match[2] };
}

/**
 * Extract JSON request template from old format
 */
function extractRequestTemplate(body) {
  // Look for ```json block under "Request Template" section
  const jsonMatch = body.match(/## Request Template[\s\S]*?```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

/**
 * Extract summary from old format
 */
function extractSummary(body) {
  const summaryMatch = body.match(/## Summary\n+([\s\S]*?)(?=\n## |\n$)/);
  if (summaryMatch) {
    return summaryMatch[1].trim().split('\n')[0];
  }
  return null;
}

/**
 * Infer prerequisites from the request template and endpoint
 */
function inferPrerequisites(template, endpoint) {
  const steps = [];
  const body = template?.body || {};
  
  // Extract method and path from endpoint
  const [method, endpointPath] = endpoint.split(' ');
  
  // Check for common reference fields that need prerequisites
  if (body.service_id || body.service_uid || endpointPath.includes('{service')) {
    steps.push({
      id: 'get_services',
      description: 'Fetch available services',
      method: 'GET',
      path: '/platform/v1/services',
      params: { business_id: '{{business_id}}', per_page: 1 },
      extract: { service_id: '$.data.services[0].id' },
      expect: { status: 200 },
      onFail: 'abort'
    });
  }
  
  if (body.client_id || body.client_uid || endpointPath.includes('{client')) {
    steps.push({
      id: 'get_clients',
      description: 'Fetch available clients',
      method: 'GET',
      path: '/platform/v1/clients',
      params: { business_id: '{{business_id}}', per_page: 1 },
      extract: { client_id: '$.data.clients[0].id' },
      expect: { status: 200 },
      onFail: 'abort'
    });
  }
  
  if (body.matter_uid || endpointPath.includes('{matter')) {
    steps.push({
      id: 'get_matters',
      description: 'Fetch available matters',
      method: 'GET',
      path: '/platform/v1/matters',
      params: { business_id: '{{business_id}}', per_page: 1 },
      extract: { matter_uid: '$.data.matters[0].uid' },
      expect: { status: 200 },
      onFail: 'abort'
    });
  }
  
  if (body.staff_id || body.staff_uid || endpointPath.includes('{staff')) {
    steps.push({
      id: 'get_staffs',
      description: 'Fetch available staff members',
      method: 'GET',
      path: '/platform/v1/businesses/{{business_id}}/staffs',
      params: { per_page: 1 },
      extract: { staff_id: '$.data.staffs[0].uid' },
      expect: { status: 200 },
      onFail: 'abort'
    });
  }
  
  return steps;
}

/**
 * Convert template body to use double braces for variables
 */
function convertBodyToTemplate(body) {
  if (!body || typeof body !== 'object') return body;
  
  const result = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Convert {{config.params.xxx}} to {{xxx}}
      result[key] = value.replace(/\{\{config\.params\.(\w+)\}\}/g, '{{$1}}');
      // Convert {{resolved.xxx}} to {{xxx}}
      result[key] = result[key].replace(/\{\{resolved\.(\w+)\}\}/g, '{{$1}}');
    } else if (typeof value === 'object' && value !== null) {
      result[key] = convertBodyToTemplate(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Build the test request step from template
 */
function buildTestRequest(template, endpoint) {
  const [method, path] = endpoint.split(' ');
  
  const step = {
    id: method.toLowerCase() + '_' + path.split('/').filter(p => p && !p.startsWith('{')).pop()?.replace(/[^a-z0-9]/gi, '_') || 'test',
    method,
    path
  };
  
  // Add body if present
  if (template?.body && Object.keys(template.body).length > 0) {
    step.body = convertBodyToTemplate(template.body);
  }
  
  // Default expect
  step.expect = { status: [200, 201] };
  
  return step;
}

/**
 * Generate new format content
 */
function generateNewFormat(metadata, summary, prerequisites, testRequest) {
  const lines = [];
  
  // Frontmatter
  lines.push('---');
  lines.push(`endpoint: "${metadata.endpoint}"`);
  lines.push(`domain: ${metadata.domain || 'general'}`);
  lines.push(`tags: [${(metadata.tags || []).join(', ')}]`);
  lines.push(`status: ${metadata.status || 'pending'}`);
  if (metadata.savedAt) lines.push(`savedAt: ${metadata.savedAt}`);
  if (metadata.verifiedAt) lines.push(`verifiedAt: ${metadata.verifiedAt}`);
  lines.push('---');
  lines.push('');
  
  // Title
  const [method, path] = (metadata.endpoint || '').split(' ');
  const resourceName = path?.split('/').filter(p => p && !p.startsWith('{') && !p.startsWith('v')).pop() || 'Resource';
  const titleMap = { GET: 'Get', POST: 'Create', PUT: 'Update', PATCH: 'Update', DELETE: 'Delete' };
  lines.push(`# ${titleMap[method] || method} ${resourceName.charAt(0).toUpperCase() + resourceName.slice(1).replace(/_/g, ' ')}`);
  lines.push('');
  
  // Summary
  lines.push('## Summary');
  lines.push(summary || 'API validation workflow for this endpoint.');
  lines.push('');
  
  // Prerequisites
  lines.push('## Prerequisites');
  lines.push('');
  if (prerequisites.length > 0) {
    lines.push('```yaml');
    lines.push('steps:');
    for (const step of prerequisites) {
      lines.push(`  - id: ${step.id}`);
      if (step.description) lines.push(`    description: "${step.description}"`);
      lines.push(`    method: ${step.method}`);
      lines.push(`    path: "${step.path}"`);
      if (step.params && Object.keys(step.params).length > 0) {
        lines.push('    params:');
        for (const [k, v] of Object.entries(step.params)) {
          lines.push(`      ${k}: "${v}"`);
        }
      }
      if (step.extract && Object.keys(step.extract).length > 0) {
        lines.push('    extract:');
        for (const [k, v] of Object.entries(step.extract)) {
          lines.push(`      ${k}: "${v}"`);
        }
      }
      if (step.expect) {
        lines.push('    expect:');
        if (typeof step.expect.status === 'number') {
          lines.push(`      status: ${step.expect.status}`);
        } else if (Array.isArray(step.expect.status)) {
          lines.push(`      status: [${step.expect.status.join(', ')}]`);
        }
      }
      if (step.onFail) lines.push(`    onFail: ${step.onFail}`);
    }
    lines.push('```');
  } else {
    lines.push('No prerequisites required for this endpoint.');
  }
  lines.push('');
  
  // Test Request
  lines.push('## Test Request');
  lines.push('');
  lines.push('```yaml');
  lines.push('steps:');
  lines.push(`  - id: ${testRequest.id}`);
  lines.push(`    method: ${testRequest.method}`);
  lines.push(`    path: "${testRequest.path}"`);
  if (testRequest.body && Object.keys(testRequest.body).length > 0) {
    lines.push('    body:');
    const bodyYaml = yaml.stringify(testRequest.body, { indent: 2 }).split('\n');
    for (const line of bodyYaml) {
      if (line.trim()) lines.push('      ' + line);
    }
  }
  lines.push('    expect:');
  if (Array.isArray(testRequest.expect.status)) {
    lines.push(`      status: [${testRequest.expect.status.join(', ')}]`);
  } else {
    lines.push(`      status: ${testRequest.expect.status}`);
  }
  lines.push('```');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Check if a workflow is already in the new format
 */
function isAlreadyMigrated(content) {
  // Check if it has the new format YAML blocks under Prerequisites and Test Request
  return content.includes('## Prerequisites') && 
         content.includes('```yaml\nsteps:') &&
         content.includes('## Test Request');
}

/**
 * Migrate a single workflow file
 */
function migrateWorkflow(filePath) {
  const relativePath = path.relative(WORKFLOWS_DIR, filePath);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already migrated
    if (isAlreadyMigrated(content)) {
      if (options.verbose) {
        console.log(`  [SKIP] ${relativePath} - Already migrated`);
      }
      stats.alreadyMigrated++;
      return { status: 'already_migrated' };
    }
    
    // Parse old format
    const { metadata, body } = parseFrontmatter(content);
    
    if (!metadata.endpoint) {
      if (options.verbose) {
        console.log(`  [SKIP] ${relativePath} - No endpoint in frontmatter`);
      }
      stats.skipped++;
      return { status: 'skipped', reason: 'No endpoint in frontmatter' };
    }
    
    // Extract request template
    const requestTemplate = extractRequestTemplate(body);
    
    if (!requestTemplate) {
      if (options.verbose) {
        console.log(`  [SKIP] ${relativePath} - No request template found`);
      }
      stats.skipped++;
      return { status: 'skipped', reason: 'No request template' };
    }
    
    // Extract summary
    const summary = extractSummary(body);
    
    // Infer prerequisites
    const prerequisites = inferPrerequisites(requestTemplate, metadata.endpoint);
    
    // Build test request
    const testRequest = buildTestRequest(requestTemplate, metadata.endpoint);
    
    // Generate new format content
    const newContent = generateNewFormat(metadata, summary, prerequisites, testRequest);
    
    if (options.dryRun) {
      console.log(`  [WOULD MIGRATE] ${relativePath}`);
      if (options.verbose) {
        console.log(`    Prerequisites: ${prerequisites.length} step(s)`);
        console.log(`    Test request: ${testRequest.method} ${testRequest.path}`);
      }
    } else {
      // Create backup
      const backupPath = filePath + '.bak';
      fs.writeFileSync(backupPath, content);
      
      // Write new content
      fs.writeFileSync(filePath, newContent);
      console.log(`  [MIGRATED] ${relativePath}`);
    }
    
    stats.migrated++;
    return { status: 'migrated', prerequisites: prerequisites.length };
    
  } catch (error) {
    console.error(`  [ERROR] ${relativePath}: ${error.message}`);
    stats.failed++;
    stats.errors.push({ file: relativePath, error: error.message });
    return { status: 'error', error: error.message };
  }
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
        // Skip if domain filter is set and doesn't match
        if (options.domain && entry.name !== options.domain) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'README.md') {
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
  console.log('Workflow Migration Script');
  console.log('='.repeat(60));
  
  if (options.dryRun) {
    console.log('\n[DRY RUN] No files will be modified\n');
  }
  
  let files;
  
  if (options.file) {
    // Single file migration
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    // Get all workflow files
    files = getWorkflowFiles(WORKFLOWS_DIR);
  }
  
  stats.total = files.length;
  console.log(`Found ${files.length} workflow file(s) to process\n`);
  
  // Process each file
  for (const filePath of files) {
    migrateWorkflow(filePath);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files:       ${stats.total}`);
  console.log(`Migrated:          ${stats.migrated}`);
  console.log(`Already migrated:  ${stats.alreadyMigrated}`);
  console.log(`Skipped:           ${stats.skipped}`);
  console.log(`Failed:            ${stats.failed}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    for (const { file, error } of stats.errors) {
      console.log(`  ${file}: ${error}`);
    }
  }
  
  if (options.dryRun) {
    console.log('\n[DRY RUN] No files were modified. Run without --dry-run to apply changes.');
  } else if (stats.migrated > 0) {
    console.log('\nBackup files created with .bak extension.');
    console.log('Review the migrated files and delete backups when satisfied.');
  }
}

// Run
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
