#!/usr/bin/env node
/**
 * Template Standardization Migration Script
 * 
 * Migrates existing workflows to match TEMPLATE.md format:
 * - Phase 1: Status values, section names, prerequisites text
 * - Phase 2: YAML step fixes (status arrays, path params)
 * - Phase 3: Add missing fields (swagger, timestamps)
 * - Phase 4: Content simplification (JSON blocks, Known Issues format)
 * 
 * Usage:
 *   node scripts/migrate-to-template.js [options]
 * 
 * Options:
 *   --dry-run       Show what would be changed without modifying files
 *   --verbose       Show detailed output
 *   --phase <n>     Only run specific phase (1, 2, 3, or 4)
 *   --domain <name> Only migrate workflows in specified domain
 *   --file <path>   Only migrate a specific file
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '../workflows');
const SWAGGER_DIR = path.join(__dirname, '../../swagger');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  phase: args.includes('--phase') ? parseInt(args[args.indexOf('--phase') + 1]) : null,
  domain: args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null,
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null
};

// Statistics
const stats = {
  total: 0,
  modified: 0,
  skipped: 0,
  failed: 0,
  changes: {
    statusFixed: 0,
    sectionsRenamed: 0,
    prerequisitesFixed: 0,
    yamlStepsFixed: 0,
    fieldsAdded: 0,
    contentSimplified: 0
  },
  errors: []
};

// Domain to swagger file mapping
const DOMAIN_SWAGGER_MAP = {
  sales: [
    'swagger/sales/legacy/payments.json',
    'swagger/sales/legacy/legacy_v1_sales.json',
    'swagger/sales/legacy/legacy_v1_platform_sales.json'
  ],
  clients: [
    'swagger/clients/legacy/manage_clients.json',
    'swagger/clients/legacy/crm_views.json',
    'swagger/clients/legacy/legacy_v1_clients.json',
    'swagger/clients/legacy/legacy_v1_platform_clients.json'
  ],
  scheduling: [
    'swagger/scheduling/legacy/scheduling.json',
    'swagger/scheduling/legacy/legacy_v1_scheduling.json'
  ],
  communication: [
    'swagger/communication/v3/notification_templates.json',
    'swagger/communication/v3/staff_notifications.json'
  ],
  platform_administration: [
    'swagger/platform_administration/legacy/legacy_v1_businesses.json',
    'swagger/platform_administration/legacy/legacy_v1_staffs.json'
  ],
  apps: [
    'swagger/apps/legacy/oauth_apps.json'
  ],
  reviews: [
    'swagger/reviews/v3/business_reviews.json'
  ]
};

/**
 * Parse frontmatter and body from markdown
 */
function parseWorkflow(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: '', metadata: {}, body: content, raw: content };
  }
  
  const frontmatterStr = match[1];
  const body = match[2];
  
  // Parse frontmatter into metadata object
  const metadata = {};
  const lines = frontmatterStr.split('\n');
  
  for (const line of lines) {
    // Handle different formats
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      let [, key, value] = kvMatch;
      value = value.trim();
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        const inner = value.slice(1, -1).trim();
        if (inner === '') {
          metadata[key] = [];
        } else {
          metadata[key] = inner.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        }
      }
      // Handle quoted strings
      else if ((value.startsWith('"') && value.endsWith('"')) || 
               (value.startsWith("'") && value.endsWith("'"))) {
        metadata[key] = value.slice(1, -1);
      }
      // Handle booleans
      else if (value === 'true') {
        metadata[key] = true;
      } else if (value === 'false') {
        metadata[key] = false;
      }
      // Handle numbers
      else if (!isNaN(Number(value)) && value !== '') {
        metadata[key] = Number(value);
      }
      // Plain string
      else {
        metadata[key] = value;
      }
    }
  }
  
  return { frontmatter: frontmatterStr, metadata, body, raw: content };
}

/**
 * Serialize metadata back to frontmatter string
 */
function serializeFrontmatter(metadata) {
  const lines = [];
  
  // Order of fields based on template
  const fieldOrder = [
    'endpoint', 'domain', 'tags', 'swagger', 'status',
    'savedAt', 'verifiedAt', 'timesReused',
    'expectedOutcome', 'expectedOutcomeReason',
    'requiresTestData', 'testDataDescription',
    'useFallbackApi', 'tokens', 'notes'
  ];
  
  // First add fields in order
  for (const key of fieldOrder) {
    if (metadata[key] !== undefined) {
      lines.push(formatMetadataLine(key, metadata[key]));
    }
  }
  
  // Then add any remaining fields not in the order list
  for (const [key, value] of Object.entries(metadata)) {
    if (!fieldOrder.includes(key) && value !== undefined) {
      lines.push(formatMetadataLine(key, value));
    }
  }
  
  return lines.join('\n');
}

/**
 * Format a single metadata line
 */
function formatMetadataLine(key, value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${key}: []`;
    }
    return `${key}: [${value.join(', ')}]`;
  }
  if (typeof value === 'string') {
    // Quote strings that contain spaces or special chars
    if (value.includes(' ') || value.includes(':') || value.includes('/') || value.includes('{')) {
      return `${key}: "${value}"`;
    }
    return `${key}: ${value}`;
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return `${key}: ${value}`;
  }
  return `${key}: ${value}`;
}

/**
 * Phase 1: Fix status values
 */
function fixStatus(metadata, changes) {
  if (metadata.status === 'success' || metadata.status === 'working') {
    changes.push(`status: ${metadata.status} → verified`);
    metadata.status = 'verified';
    stats.changes.statusFixed++;
    return true;
  }
  // Fix typo: skip → skipped
  if (metadata.status === 'skip') {
    changes.push(`status: skip → skipped`);
    metadata.status = 'skipped';
    stats.changes.statusFixed++;
    return true;
  }
  return false;
}

/**
 * Phase 1: Rename sections
 */
function renameSections(body, changes) {
  const replacements = [
    { from: /^## Overview$/gm, to: '## Summary' },
    { from: /^## Request Template$/gm, to: '## Test Request' },
    { from: /^## Token Requirements$/gm, to: '## Authentication' },
    { from: /^## Parameter Reference$/gm, to: '## Parameters Reference' }
  ];
  
  let modified = body;
  let changed = false;
  
  for (const { from, to } of replacements) {
    if (from.test(modified)) {
      modified = modified.replace(from, to);
      changes.push(`Section: "${from.source.replace(/[\\^$]/g, '')}" → "${to}"`);
      stats.changes.sectionsRenamed++;
      changed = true;
    }
  }
  
  return { body: modified, changed };
}

/**
 * Phase 1: Fix prerequisites text
 */
function fixPrerequisitesText(body, changes) {
  const oldTexts = [
    'No specific prerequisites documented.',
    'No prerequisites documented.',
    'Prerequisites not documented.'
  ];
  
  let modified = body;
  let changed = false;
  
  for (const oldText of oldTexts) {
    if (modified.includes(oldText)) {
      modified = modified.replace(oldText, 'None required for this endpoint.');
      changes.push(`Prerequisites text standardized`);
      stats.changes.prerequisitesFixed++;
      changed = true;
    }
  }
  
  return { body: modified, changed };
}

/**
 * Phase 2: Fix status arrays in YAML blocks
 */
function fixYamlStatusArrays(body, changes) {
  // Find all YAML code blocks
  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let modified = body;
  let changed = false;
  
  modified = modified.replace(yamlBlockRegex, (match, yamlContent) => {
    // Fix status: 200 to status: [200]
    const statusRegex = /(\s+status:\s+)(\d+)(\s*$)/gm;
    if (statusRegex.test(yamlContent)) {
      const newYaml = yamlContent.replace(statusRegex, (m, prefix, code, suffix) => {
        return `${prefix}[${code}]${suffix}`;
      });
      if (newYaml !== yamlContent) {
        changes.push(`YAML: status: X → status: [X]`);
        stats.changes.yamlStepsFixed++;
        changed = true;
        return '```yaml\n' + newYaml + '```';
      }
    }
    return match;
  });
  
  return { body: modified, changed };
}

/**
 * Phase 2: Fix path parameter syntax in YAML blocks ({var} → {{var}})
 */
function fixPathParameters(body, changes) {
  const yamlBlockRegex = /```yaml\n([\s\S]*?)```/g;
  let modified = body;
  let changed = false;
  
  modified = modified.replace(yamlBlockRegex, (match, yamlContent) => {
    // Find path: lines with single braces
    const pathRegex = /(path:\s*["']?)([^"'\n]+)(["']?\s*$)/gm;
    let newYaml = yamlContent.replace(pathRegex, (m, prefix, pathValue, suffix) => {
      // Replace {param} with {{param}} but not already {{param}}
      const fixedPath = pathValue.replace(/\{([^{}]+)\}/g, (braceMatch, param) => {
        // Check if it's already double-braced
        const beforeIndex = pathValue.indexOf(braceMatch) - 1;
        const afterIndex = pathValue.indexOf(braceMatch) + braceMatch.length;
        if (beforeIndex >= 0 && pathValue[beforeIndex] === '{') {
          return braceMatch; // Already double-braced
        }
        return `{{${param}}}`;
      });
      
      if (fixedPath !== pathValue) {
        return prefix + fixedPath + suffix;
      }
      return m;
    });
    
    if (newYaml !== yamlContent) {
      changes.push(`YAML: path parameters {var} → {{var}}`);
      stats.changes.yamlStepsFixed++;
      changed = true;
      return '```yaml\n' + newYaml + '```';
    }
    return match;
  });
  
  return { body: modified, changed };
}

/**
 * Phase 3: Add missing fields to metadata
 */
function addMissingFields(metadata, domain, changes) {
  let changed = false;
  
  // Add savedAt if missing
  if (!metadata.savedAt) {
    const now = new Date().toISOString();
    metadata.savedAt = now;
    changes.push(`Added: savedAt: ${now}`);
    stats.changes.fieldsAdded++;
    changed = true;
  }
  
  // Add timesReused if missing
  if (metadata.timesReused === undefined) {
    metadata.timesReused = 0;
    changes.push('Added: timesReused: 0');
    stats.changes.fieldsAdded++;
    changed = true;
  }
  
  // Add verifiedAt if missing but savedAt exists and status is verified
  if (!metadata.verifiedAt && metadata.savedAt && metadata.status === 'verified') {
    metadata.verifiedAt = metadata.savedAt;
    changes.push(`Added: verifiedAt: ${metadata.savedAt}`);
    stats.changes.fieldsAdded++;
    changed = true;
  }
  
  // Add swagger if missing
  if (!metadata.swagger && domain && DOMAIN_SWAGGER_MAP[domain]) {
    const swaggerPath = DOMAIN_SWAGGER_MAP[domain][0];
    if (swaggerPath) {
      metadata.swagger = swaggerPath;
      changes.push(`Added: swagger: ${swaggerPath}`);
      stats.changes.fieldsAdded++;
      changed = true;
    }
  }
  
  // Add domain if missing (infer from file path)
  if (!metadata.domain && domain) {
    metadata.domain = domain;
    changes.push(`Added: domain: ${domain}`);
    stats.changes.fieldsAdded++;
    changed = true;
  }
  
  return changed;
}

/**
 * Phase 3b: Add missing Prerequisites section
 */
function addMissingPrerequisites(body, changes) {
  // Check if Prerequisites section exists
  if (/^## Prerequisites/m.test(body)) {
    return { body, changed: false };
  }
  
  // Find the position after Summary section to insert Prerequisites
  const summaryMatch = body.match(/^## Summary[\s\S]*?(?=\n## |\n$)/m);
  if (summaryMatch) {
    const insertPosition = body.indexOf(summaryMatch[0]) + summaryMatch[0].length;
    const newBody = body.slice(0, insertPosition) + 
                    '\n\n## Prerequisites\n\nNone required for this endpoint.\n' + 
                    body.slice(insertPosition);
    changes.push('Added missing ## Prerequisites section');
    stats.changes.sectionsRenamed++; // Using sectionsRenamed counter for this
    return { body: newBody, changed: true };
  }
  
  return { body, changed: false };
}

/**
 * Phase 4: Remove redundant JSON blocks from UID Resolution section
 */
function removeRedundantJsonBlocks(body, changes) {
  // Pattern to match JSON blocks in UID Resolution sections
  const uidResolutionPattern = /(## UID Resolution Procedure[\s\S]*?)```json\n\{[\s\S]*?"source_endpoint"[\s\S]*?\}\n```/g;
  
  let modified = body;
  let changed = false;
  
  if (uidResolutionPattern.test(modified)) {
    modified = modified.replace(uidResolutionPattern, '$1');
    changes.push('Removed redundant JSON block from UID Resolution');
    stats.changes.contentSimplified++;
    changed = true;
  }
  
  return { body: modified, changed };
}

/**
 * Phase 4: Standardize Known Issues format (YAML → Markdown)
 */
function standardizeKnownIssues(body, changes) {
  // Find Known Issues sections with YAML format
  const knownIssuesYamlPattern = /## Known Issues\s*\n\s*```yaml\s*\n\s*knownIssues:\s*\n([\s\S]*?)```/g;
  
  let modified = body;
  let changed = false;
  
  modified = modified.replace(knownIssuesYamlPattern, (match, yamlContent) => {
    // Parse the YAML-style issues
    const issues = [];
    const issuePattern = /- (?:path|issue):\s*["']?([^"'\n]+)["']?\s*\n\s*reason:\s*["']?([^"'\n]+)["']?/g;
    
    let issueMatch;
    while ((issueMatch = issuePattern.exec(yamlContent)) !== null) {
      issues.push({
        title: issueMatch[1],
        reason: issueMatch[2]
      });
    }
    
    if (issues.length === 0) {
      return match; // Keep original if can't parse
    }
    
    // Generate markdown format
    let markdown = '## Known Issues\n\n';
    for (const issue of issues) {
      markdown += `### Issue: ${issue.title}\n\n`;
      markdown += `**Description**: ${issue.reason}\n\n`;
    }
    
    changes.push('Converted Known Issues from YAML to Markdown format');
    stats.changes.contentSimplified++;
    changed = true;
    
    return markdown.trim();
  });
  
  return { body: modified, changed };
}

/**
 * Process a single workflow file
 */
function processWorkflow(filePath) {
  const relativePath = path.relative(WORKFLOWS_DIR, filePath);
  const domain = relativePath.split(path.sep)[0];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { metadata, body } = parseWorkflow(content);
    
    const changes = [];
    let newMetadata = { ...metadata };
    let newBody = body;
    
    // Phase 1: Status and sections
    if (!options.phase || options.phase === 1) {
      fixStatus(newMetadata, changes);
      const sectionsResult = renameSections(newBody, changes);
      newBody = sectionsResult.body;
      const prereqResult = fixPrerequisitesText(newBody, changes);
      newBody = prereqResult.body;
    }
    
    // Phase 2: YAML step fixes
    if (!options.phase || options.phase === 2) {
      const statusResult = fixYamlStatusArrays(newBody, changes);
      newBody = statusResult.body;
      const pathResult = fixPathParameters(newBody, changes);
      newBody = pathResult.body;
    }
    
    // Phase 3: Missing fields
    if (!options.phase || options.phase === 3) {
      addMissingFields(newMetadata, domain, changes);
      const prereqResult = addMissingPrerequisites(newBody, changes);
      newBody = prereqResult.body;
    }
    
    // Phase 4: Content simplification
    if (!options.phase || options.phase === 4) {
      const jsonResult = removeRedundantJsonBlocks(newBody, changes);
      newBody = jsonResult.body;
      const knownIssuesResult = standardizeKnownIssues(newBody, changes);
      newBody = knownIssuesResult.body;
    }
    
    // Check if anything changed
    if (changes.length === 0) {
      if (options.verbose) {
        console.log(`  [SKIP] ${relativePath} - No changes needed`);
      }
      stats.skipped++;
      return { status: 'skipped' };
    }
    
    // Generate new content
    const newFrontmatter = serializeFrontmatter(newMetadata);
    const newContent = `---\n${newFrontmatter}\n---\n${newBody}`;
    
    if (options.dryRun) {
      console.log(`  [WOULD MODIFY] ${relativePath}`);
      for (const change of changes) {
        console.log(`    - ${change}`);
      }
    } else {
      fs.writeFileSync(filePath, newContent);
      console.log(`  [MODIFIED] ${relativePath}`);
      if (options.verbose) {
        for (const change of changes) {
          console.log(`    - ${change}`);
        }
      }
    }
    
    stats.modified++;
    return { status: 'modified', changes };
    
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
  console.log('Template Standardization Migration');
  console.log('='.repeat(60));
  
  if (options.dryRun) {
    console.log('\n[DRY RUN] No files will be modified\n');
  }
  
  if (options.phase) {
    console.log(`Running Phase ${options.phase} only\n`);
  }
  
  let files;
  
  if (options.file) {
    const filePath = path.resolve(options.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }
    files = [filePath];
  } else {
    files = getWorkflowFiles(WORKFLOWS_DIR);
  }
  
  stats.total = files.length;
  console.log(`Found ${files.length} workflow file(s) to process\n`);
  
  // Process each file
  for (const filePath of files) {
    processWorkflow(filePath);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total files:     ${stats.total}`);
  console.log(`Modified:        ${stats.modified}`);
  console.log(`Skipped:         ${stats.skipped}`);
  console.log(`Failed:          ${stats.failed}`);
  
  console.log('\nChanges by type:');
  console.log(`  Status fixed:        ${stats.changes.statusFixed}`);
  console.log(`  Sections renamed:    ${stats.changes.sectionsRenamed}`);
  console.log(`  Prerequisites fixed: ${stats.changes.prerequisitesFixed}`);
  console.log(`  YAML steps fixed:    ${stats.changes.yamlStepsFixed}`);
  console.log(`  Fields added:        ${stats.changes.fieldsAdded}`);
  console.log(`  Content simplified:  ${stats.changes.contentSimplified}`);
  
  if (stats.errors.length > 0) {
    console.log('\nErrors:');
    for (const { file, error } of stats.errors) {
      console.log(`  ${file}: ${error}`);
    }
  }
  
  if (options.dryRun) {
    console.log('\n[DRY RUN] No files were modified. Run without --dry-run to apply changes.');
  }
}

// Run
main().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
