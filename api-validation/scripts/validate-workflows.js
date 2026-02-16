#!/usr/bin/env node
/**
 * Workflow Validation Script
 * 
 * Validates workflow files against the TEMPLATE.md format.
 * 
 * Usage:
 *   node scripts/validate-workflows.js [options]
 * 
 * Options:
 *   --verbose       Show detailed output
 *   --domain <name> Only validate workflows in specified domain
 *   --file <path>   Only validate a specific file
 *   --fix           Show suggested fixes (doesn't modify files)
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, '../workflows');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose'),
  domain: args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null,
  file: args.includes('--file') ? args[args.indexOf('--file') + 1] : null,
  fix: args.includes('--fix')
};

// Valid values for enums
const VALID_STATUS = ['verified', 'pending', 'failed', 'skip'];
const VALID_DOMAINS = ['sales', 'clients', 'scheduling', 'communication', 'platform_administration', 'apps', 'reviews'];

// Required frontmatter fields
const REQUIRED_FIELDS = ['endpoint', 'domain', 'tags', 'status', 'savedAt'];

// Required sections
const REQUIRED_SECTIONS = ['Summary', 'Prerequisites', 'Test Request'];

// Statistics
const stats = {
  total: 0,
  valid: 0,
  warnings: 0,
  errors: 0,
  issues: []
};

/**
 * Parse frontmatter and body from markdown
 */
function parseWorkflow(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { metadata: {}, body: content, hasFrontmatter: false };
  }
  
  const frontmatterStr = match[1];
  const body = match[2];
  const metadata = {};
  
  for (const line of frontmatterStr.split('\n')) {
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
  
  return { metadata, body, hasFrontmatter: true };
}

/**
 * Extract section headings from body
 */
function extractSections(body) {
  const sectionRegex = /^## (.+)$/gm;
  const sections = [];
  let match;
  while ((match = sectionRegex.exec(body)) !== null) {
    sections.push(match[1]);
  }
  return sections;
}

/**
 * Validate a workflow file
 */
function validateWorkflow(filePath) {
  const relativePath = path.relative(WORKFLOWS_DIR, filePath);
  const issues = [];
  const warnings = [];
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { metadata, body, hasFrontmatter } = parseWorkflow(content);
    
    // Check frontmatter exists
    if (!hasFrontmatter) {
      issues.push('Missing YAML frontmatter');
      return { valid: false, issues, warnings };
    }
    
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (metadata[field] === undefined) {
        issues.push(`Missing required field: ${field}`);
      }
    }
    
    // Validate status value
    if (metadata.status && !VALID_STATUS.includes(metadata.status)) {
      issues.push(`Invalid status value: "${metadata.status}" (expected: ${VALID_STATUS.join(', ')})`);
    }
    
    // Validate domain value
    if (metadata.domain && !VALID_DOMAINS.includes(metadata.domain)) {
      issues.push(`Invalid domain value: "${metadata.domain}" (expected: ${VALID_DOMAINS.join(', ')})`);
    }
    
    // Check tags is an array
    if (metadata.tags !== undefined && !Array.isArray(metadata.tags)) {
      issues.push('tags should be an array');
    }
    
    // Check for swagger field (warning)
    if (!metadata.swagger) {
      warnings.push('Missing swagger field (recommended)');
    }
    
    // Check for timesReused (warning)
    if (metadata.timesReused === undefined) {
      warnings.push('Missing timesReused field (should be 0)');
    }
    
    // Extract and validate sections
    const sections = extractSections(body);
    
    for (const required of REQUIRED_SECTIONS) {
      if (!sections.includes(required)) {
        issues.push(`Missing required section: ## ${required}`);
      }
    }
    
    // Check for old section names
    const oldSections = {
      'Overview': 'Should be "## Summary"',
      'Request Template': 'Should be "## Test Request"',
      'Token Requirements': 'Should be "## Authentication"',
      'Parameter Reference': 'Should be "## Parameters Reference"'
    };
    
    for (const [oldName, suggestion] of Object.entries(oldSections)) {
      if (sections.includes(oldName)) {
        issues.push(`Found old section name "## ${oldName}": ${suggestion}`);
      }
    }
    
    // Check YAML blocks for status format
    const yamlBlocks = content.match(/```yaml\n[\s\S]*?```/g) || [];
    for (const block of yamlBlocks) {
      // Check for single status numbers (not arrays)
      if (/status:\s+\d+\s*$/m.test(block)) {
        warnings.push('YAML block has status as number instead of array (e.g., status: [200])');
      }
      
      // Check for path params with single braces
      if (/path:.*\{[^{}]+\}[^}]/.test(block) && !/path:.*\{\{/.test(block)) {
        warnings.push('YAML block may have path params with single braces instead of double ({{var}})');
      }
    }
    
    // Check for old prerequisites text
    if (body.includes('No specific prerequisites documented.')) {
      warnings.push('Prerequisites text should be "None required for this endpoint."');
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
    
  } catch (error) {
    return {
      valid: false,
      issues: [`Error reading file: ${error.message}`],
      warnings: []
    };
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
        if (options.domain && entry.name !== options.domain) continue;
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
  console.log('Workflow Validation');
  console.log('='.repeat(60));
  
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
  console.log(`Found ${files.length} workflow file(s) to validate\n`);
  
  // Validate each file
  for (const filePath of files) {
    const relativePath = path.relative(WORKFLOWS_DIR, filePath);
    const result = validateWorkflow(filePath);
    
    if (result.valid && result.warnings.length === 0) {
      stats.valid++;
      if (options.verbose) {
        console.log(`  [VALID] ${relativePath}`);
      }
    } else if (result.valid && result.warnings.length > 0) {
      stats.warnings++;
      console.log(`  [WARN]  ${relativePath}`);
      for (const warning of result.warnings) {
        console.log(`          - ${warning}`);
      }
    } else {
      stats.errors++;
      console.log(`  [ERROR] ${relativePath}`);
      for (const issue of result.issues) {
        console.log(`          - ${issue}`);
      }
      if (result.warnings.length > 0 && options.verbose) {
        for (const warning of result.warnings) {
          console.log(`          - (warn) ${warning}`);
        }
      }
      stats.issues.push({ file: relativePath, issues: result.issues, warnings: result.warnings });
    }
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Validation Summary');
  console.log('='.repeat(60));
  console.log(`Total files:    ${stats.total}`);
  console.log(`Valid:          ${stats.valid}`);
  console.log(`Warnings only:  ${stats.warnings}`);
  console.log(`Errors:         ${stats.errors}`);
  
  if (stats.errors > 0) {
    console.log('\n⚠️  Some workflows have validation errors.');
    console.log('Run with --verbose for more details or --fix for suggested fixes.');
    process.exit(1);
  } else if (stats.warnings > 0) {
    console.log('\n✓ All workflows valid (with some warnings).');
  } else {
    console.log('\n✓ All workflows fully compliant with template!');
  }
}

// Run
main().catch(error => {
  console.error('Validation failed:', error);
  process.exit(1);
});
