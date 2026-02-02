#!/usr/bin/env node

/**
 * Migration script to add swagger field to all workflow files
 * 
 * This script:
 * 1. Parses mcp_swagger files to extract path-to-source-file mappings
 * 2. For each workflow file, looks up the endpoint and determines the source swagger file
 * 3. Updates the YAML frontmatter with the swagger field
 * 
 * Usage:
 *   node migrate-workflow-swagger.js [--dry-run] [--verbose]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MCP_SWAGGER_DIR = path.join(__dirname, '../../mcp_swagger');
const SWAGGER_DIR = path.join(__dirname, '../../swagger');
const WORKFLOWS_DIR = path.join(__dirname, '../workflows');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');

/**
 * Build a map from normalized endpoint paths to source swagger file paths
 */
function buildPathToSourceMap() {
  const pathToSource = {};
  
  // Read all mcp_swagger files
  const mcpFiles = fs.readdirSync(MCP_SWAGGER_DIR)
    .filter(f => f.endsWith('.json') && !f.startsWith('.'));
  
  for (const mcpFile of mcpFiles) {
    const domain = mcpFile.replace('.json', '');
    const mcpPath = path.join(MCP_SWAGGER_DIR, mcpFile);
    
    try {
      const content = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
      const xGenerated = content.info?.['x-generated'];
      
      if (!xGenerated) {
        if (VERBOSE) console.log(`  No x-generated metadata in ${mcpFile}`);
        continue;
      }
      
      // Process pathNormalizations (for legacy APIs with basePath)
      if (xGenerated.pathNormalizations) {
        for (const normalization of xGenerated.pathNormalizations) {
          const sourceFile = normalization.file;
          const sourceSwaggerPath = resolveSourcePath(domain, sourceFile);
          
          if (normalization.transformations) {
            for (const transform of normalization.transformations) {
              pathToSource[transform.normalized] = sourceSwaggerPath;
            }
          }
        }
      }
      
      // For paths not in normalizations, we need to find them in source files
      // Parse the paths from the mcp_swagger and check which source file contains them
      const paths = Object.keys(content.paths || {});
      const normalizedPaths = new Set(Object.keys(pathToSource));
      
      for (const apiPath of paths) {
        if (!normalizedPaths.has(apiPath)) {
          // This path wasn't normalized - find its source file
          const sourceFile = findSourceFileForPath(domain, apiPath, xGenerated.sourceFiles);
          if (sourceFile) {
            pathToSource[apiPath] = sourceFile;
          }
        }
      }
      
      if (VERBOSE) {
        console.log(`  Processed ${mcpFile}: ${Object.keys(content.paths || {}).length} paths`);
      }
    } catch (err) {
      console.error(`Error processing ${mcpFile}: ${err.message}`);
    }
  }
  
  return pathToSource;
}

/**
 * Resolve the full source swagger path from domain and filename
 */
function resolveSourcePath(domain, sourceFile) {
  // Check if it's in the legacy subfolder
  const legacyPath = path.join(SWAGGER_DIR, domain, 'legacy', sourceFile);
  const regularPath = path.join(SWAGGER_DIR, domain, sourceFile);
  
  if (fs.existsSync(legacyPath)) {
    return `swagger/${domain}/legacy/${sourceFile}`;
  } else if (fs.existsSync(regularPath)) {
    return `swagger/${domain}/${sourceFile}`;
  }
  
  // Fallback: check if filename starts with legacy_
  if (sourceFile.startsWith('legacy')) {
    return `swagger/${domain}/legacy/${sourceFile}`;
  }
  
  return `swagger/${domain}/${sourceFile}`;
}

/**
 * Find which source file contains a specific path
 */
function findSourceFileForPath(domain, apiPath, sourceFiles) {
  if (!sourceFiles || !sourceFiles.length) return null;
  
  for (const sourceFile of sourceFiles) {
    const possiblePaths = [
      path.join(SWAGGER_DIR, domain, 'legacy', sourceFile),
      path.join(SWAGGER_DIR, domain, sourceFile)
    ];
    
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        try {
          const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const paths = Object.keys(content.paths || {});
          
          // For v3 APIs, the path in source file is the same as normalized path
          if (paths.includes(apiPath)) {
            return filePath.replace(SWAGGER_DIR + '/', 'swagger/');
          }
        } catch (err) {
          // Skip files that can't be parsed
        }
      }
    }
  }
  
  return null;
}

/**
 * Get all workflow files recursively
 */
function getWorkflowFiles(dir) {
  const files = [];
  
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md') && !entry.name.endsWith('.bak.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

/**
 * Parse YAML frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  
  const frontmatter = {};
  const lines = match[1].split('\n');
  
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();
      
      // Handle arrays - YAML format [tag1, tag2] or ["tag1", "tag2"]
      if (value.startsWith('[') && value.endsWith(']')) {
        // Parse YAML-style array: [item1, item2, item3]
        const inner = value.slice(1, -1).trim();
        if (inner === '') {
          value = [];
        } else {
          value = inner.split(',').map(item => {
            item = item.trim();
            // Remove quotes if present
            if ((item.startsWith('"') && item.endsWith('"')) ||
                (item.startsWith("'") && item.endsWith("'"))) {
              return item.slice(1, -1);
            }
            return item;
          });
        }
      }
      // Remove quotes
      else if ((value.startsWith('"') && value.endsWith('"')) ||
               (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      frontmatter[key] = value;
    }
  }
  
  return {
    data: frontmatter,
    raw: match[1],
    fullMatch: match[0]
  };
}

/**
 * Extract path from endpoint string
 * "GET /platform/v1/apps" -> "/platform/v1/apps"
 */
function extractPath(endpoint) {
  if (!endpoint) return null;
  const parts = endpoint.split(' ');
  return parts.length > 1 ? parts.slice(1).join(' ') : endpoint;
}

/**
 * Update frontmatter with swagger field
 */
function updateFrontmatter(content, frontmatter, swaggerPath) {
  // Check if swagger field already exists
  if (frontmatter.raw.includes('swagger:')) {
    // Update existing swagger field
    const updatedRaw = frontmatter.raw.replace(
      /swagger:.*$/m,
      `swagger: ${swaggerPath}`
    );
    return content.replace(frontmatter.raw, updatedRaw);
  }
  
  // Add swagger field after domain or after endpoint
  let insertAfter = 'domain:';
  if (frontmatter.raw.includes('tags:')) {
    insertAfter = 'tags:';
  }
  
  const lines = frontmatter.raw.split('\n');
  const newLines = [];
  let inserted = false;
  
  for (const line of lines) {
    newLines.push(line);
    if (!inserted && line.startsWith(insertAfter)) {
      // Insert swagger after the array line if tags is an array spanning multiple lines
      if (insertAfter === 'tags:' && !line.includes(']')) {
        // Multi-line array, skip for now and insert after domain instead
        continue;
      }
      newLines.push(`swagger: ${swaggerPath}`);
      inserted = true;
    }
  }
  
  // If not inserted yet, add at the end of frontmatter
  if (!inserted) {
    newLines.push(`swagger: ${swaggerPath}`);
  }
  
  const newRaw = newLines.join('\n');
  return content.replace(frontmatter.raw, newRaw);
}

/**
 * Main migration function
 */
function migrate() {
  console.log('Building path-to-source map from mcp_swagger files...');
  const pathToSource = buildPathToSourceMap();
  console.log(`  Found ${Object.keys(pathToSource).length} endpoint-to-source mappings\n`);
  
  if (VERBOSE) {
    console.log('Sample mappings:');
    const samples = Object.entries(pathToSource).slice(0, 5);
    for (const [path, source] of samples) {
      console.log(`  ${path} -> ${source}`);
    }
    console.log('');
  }
  
  console.log('Processing workflow files...');
  const workflowFiles = getWorkflowFiles(WORKFLOWS_DIR);
  console.log(`  Found ${workflowFiles.length} workflow files\n`);
  
  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let errors = 0;
  const notFoundEndpoints = [];
  
  for (const filePath of workflowFiles) {
    const relativePath = path.relative(WORKFLOWS_DIR, filePath);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const frontmatter = parseFrontmatter(content);
      
      if (!frontmatter) {
        if (VERBOSE) console.log(`  Skipping ${relativePath}: no frontmatter`);
        skipped++;
        continue;
      }
      
      const endpoint = frontmatter.data.endpoint;
      if (!endpoint) {
        if (VERBOSE) console.log(`  Skipping ${relativePath}: no endpoint field`);
        skipped++;
        continue;
      }
      
      const apiPath = extractPath(endpoint);
      const sourceSwagger = pathToSource[apiPath];
      
      if (!sourceSwagger) {
        if (VERBOSE) console.log(`  Not found: ${relativePath} (${apiPath})`);
        notFound++;
        notFoundEndpoints.push({ file: relativePath, endpoint: apiPath });
        continue;
      }
      
      // Check if already has correct swagger field
      if (frontmatter.data.swagger === sourceSwagger) {
        if (VERBOSE) console.log(`  Already correct: ${relativePath}`);
        skipped++;
        continue;
      }
      
      // Update the file
      const newContent = updateFrontmatter(content, frontmatter, sourceSwagger);
      
      if (DRY_RUN) {
        console.log(`  [DRY-RUN] Would update: ${relativePath}`);
        console.log(`    swagger: ${sourceSwagger}`);
      } else {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`  Updated: ${relativePath}`);
        if (VERBOSE) console.log(`    swagger: ${sourceSwagger}`);
      }
      
      updated++;
    } catch (err) {
      console.error(`  Error processing ${relativePath}: ${err.message}`);
      errors++;
    }
  }
  
  // Summary
  console.log('\n========== MIGRATION SUMMARY ==========');
  console.log(`Total workflow files: ${workflowFiles.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already correct or no endpoint): ${skipped}`);
  console.log(`Not found (no source swagger): ${notFound}`);
  console.log(`Errors: ${errors}`);
  
  if (DRY_RUN) {
    console.log('\n[DRY-RUN MODE] No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
  
  if (notFoundEndpoints.length > 0 && VERBOSE) {
    console.log('\nEndpoints without source swagger mapping:');
    for (const item of notFoundEndpoints.slice(0, 20)) {
      console.log(`  ${item.endpoint} (${item.file})`);
    }
    if (notFoundEndpoints.length > 20) {
      console.log(`  ... and ${notFoundEndpoints.length - 20} more`);
    }
  }
  
  return { updated, skipped, notFound, errors };
}

// Run the migration
migrate();
