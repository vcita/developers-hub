#!/usr/bin/env node

/**
 * README Swagger Update Script (API v2 + Curl)
 * ==============================================
 * 
 * This script updates README.io with swagger files from the mcp_swagger directory
 * using direct README API v2 calls via curl instead of the rdme CLI tool.
 * It handles incremental updates by tracking file modification times and only
 * updates changed specifications.
 * 
 * Features:
 * - Uses README API v2 with Bearer authentication (more reliable than CLI)
 * - Reads API token from .dev file
 * - Tracks last update times to avoid unnecessary uploads
 * - Validates all categories have corresponding swagger files
 * - Creates missing categories automatically
 * - Supports dry-run mode (runs all operations except actual modifications)
 * 
 * Usage:
 * node update-readme-swaggers.js [--dry-run] [--force] [--verbose]
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  mcp_swagger_dir: './mcp_swagger',
  dev_file: './mcp_swagger/.dev',
  state_file: './mcp_swagger/.update-state.json',
  readme_version: 'v3.1',
  dry_run: false,
  force: false,
  verbose: false
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--dry-run':
      config.dry_run = true;
      break;
    case '--force':
      config.force = true;
      break;
    case '--verbose':
      config.verbose = true;
      break;
    case '--help':
      console.log(`
Usage: node update-readme-swaggers.js [options]

Options:
  --dry-run     Run all operations except creating categories and updating swaggers
  --force       Force update all swagger files regardless of modification time
  --verbose     Enable detailed logging
  --help        Show this help message

The script uses README API v2 with Bearer authentication for reliable operations.
API token is read from mcp_swagger/.dev file and updates are made to version ${config.readme_version}.

Dry-run behavior:
  - Executes all operations including API calls to read existing data
  - Skips only the modification operations: creating categories and updating swaggers
  - Does not save state changes
  - Shows exactly what would be created/updated

Note: Uses README API v2 (https://api.readme.com/v2) with Bearer authentication.

State tracking:
  - Last update times are stored in mcp_swagger/.update-state.json
  - Only files modified since last update are processed (unless --force is used)
  - Missing categories are automatically created
`);
      process.exit(0);
      break;
  }
}

// Logging utilities
const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.error(`[ERROR] ${msg}`),
  verbose: (msg) => config.verbose && console.log(`[VERBOSE] ${msg}`),
  debug: (msg) => config.verbose && console.log(`[DEBUG] ${msg}`)
};

// Load README API token from .dev file
function loadReadmeToken() {
  try {
    const devContent = fs.readFileSync(config.dev_file, 'utf8');
    const match = devContent.match(/README_API_TOKEN\s*=\s*"?([^"\r\n]+)"?/);
    if (!match) {
      throw new Error('README_API_TOKEN not found in .dev file');
    }
    return match[1].trim();
  } catch (error) {
    log.error(`Failed to load README API token: ${error.message}`);
    process.exit(1);
  }
}

// Load or initialize update state
async function loadUpdateState() {
  try {
    if (await fs.pathExists(config.state_file)) {
      const state = await fs.readJson(config.state_file);
      log.debug(`Loaded update state with ${Object.keys(state.files || {}).length} tracked files`);
      return state;
    }
  } catch (error) {
    log.warn(`Failed to load update state: ${error.message}`);
  }
  
  return {
    lastUpdate: null,
    files: {},
    categories: {}
  };
}

// Save update state
async function saveUpdateState(state) {
  if (config.dry_run) {
    log.info('[DRY RUN] Would save update state');
    return;
  }
  
  try {
    await fs.writeJson(config.state_file, state, { spaces: 2 });
    log.debug('Saved update state');
  } catch (error) {
    log.error(`Failed to save update state: ${error.message}`);
  }
}

// Get file modification time
async function getFileModTime(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime.getTime();
  } catch (error) {
    return 0;
  }
}

// Execute curl command to README API v2
function executeReadmeApiCall(method, endpoint, description, data = null, isWriteOperation = false) {
  const apiKey = loadReadmeToken();
  let command = `curl -s --request ${method} --url "https://api.readme.com/v2${endpoint}" --header "accept: application/json" --header "authorization: Bearer ${apiKey}"`;
  
  if (data) {
    if (typeof data === 'string' && data.startsWith('@')) {
      // File upload - use multipart/form-data with the correct field name 'schema'
      command += ` --form "schema=${data}"`;
    } else {
      // JSON data
      command += ` --header "content-type: application/json" --data '${JSON.stringify(data)}'`;
    }
  }

  if (config.dry_run && isWriteOperation) {
    log.info(`[DRY RUN] Would execute: ${command.replace(apiKey, 'xxx')}`);
    return { stdout: 'dry-run-output', success: true };
  }

  try {
    log.verbose(`Executing: ${command.replace(apiKey, 'xxx')}`); // Hide API key in logs
    const stdout = execSync(command, { 
      encoding: 'utf8'
    });
    
    // Check if the response indicates an error (README API returns JSON error responses)
    try {
      const response = JSON.parse(stdout);
      if (response.status && response.status >= 400) {
        log.error(`${description} - API Error ${response.status}: ${response.title || response.message}`);
        log.error(`Error detail: ${response.detail || 'No additional details'}`);
        
        // Log detailed validation errors if available
        if (response.errors && Array.isArray(response.errors)) {
          log.error(`Validation errors:`);
          response.errors.forEach((error, index) => {
            log.error(`  ${index + 1}. ${JSON.stringify(error)}`);
          });
        }
        
        // Log the full response for debugging
        log.debug(`Full API error response: ${JSON.stringify(response, null, 2)}`);
        return { stdout, success: false };
      }
    } catch (parseError) {
      // If response isn't JSON, assume it's successful (could be plain text or empty)
    }
    
    log.debug(`${description} - Success`);
    log.debug(`Response: ${stdout}`);  // Log the actual API response
    return { stdout, success: true };
  } catch (error) {
    log.error(`${description} - Failed: ${error.message}`);
    log.error(`Error stdout: ${error.stdout || 'none'}`);
    log.error(`Error stderr: ${error.stderr || 'none'}`);
    return { stdout: error.stdout || '', stderr: error.stderr || '', success: false };
  }
}

// Get existing categories from README
function getExistingCategories() {
  log.verbose('Fetching existing categories from README');
  
  const result = executeReadmeApiCall(
    'GET',
    `/branches/${config.readme_version}/categories/reference`,
    'Get reference categories',
    null,
    false  // This is a read operation
  );
  
  if (!result.success) {
    log.warn('Failed to fetch existing categories - assuming all categories may already exist');
    log.debug('Category fetch error details:', result.stderr);
    // Return null to indicate we couldn't fetch categories, rather than empty array
    return null;
  }
  
  try {
    // Parse the JSON response from README API v2
    const response = JSON.parse(result.stdout);
    const categories = [];
    
    // README API v2 format: {"total": N, "data": [...]}
    if (response.data && Array.isArray(response.data)) {
      categories.push(...response.data.map(cat => cat.title));
    } else if (Array.isArray(response)) {
      // Fallback for direct array format
      categories.push(...response.map(cat => cat.title || cat.name || cat));
    }
    
    log.debug(`Found existing reference categories: ${categories.join(', ')}`);
    return categories;
  } catch (error) {
    log.warn(`Failed to parse categories response: ${error.message}`);
    log.debug('Raw response:', result.stdout);
    return null;
  }
}

// Create category if it doesn't exist
function createCategory(categoryName) {
  if (config.dry_run) {
    log.info(`[DRY RUN] Creating category: ${categoryName}`);
  } else {
    log.info(`Creating category: ${categoryName}`);
  }
  
  const categoryData = {
    title: categoryName,
    type: 'guide' // Default type for categories
  };
  
  const result = executeReadmeApiCall(
    'POST',
    `/branches/${config.readme_version}/categories`,
    `Create category: ${categoryName}`,
    categoryData,
    true  // This is a write operation
  );
  
  return result.success;
}

// Update swagger specification
function updateSwagger(filePath, categoryName) {
  if (config.dry_run) {
    log.info(`[DRY RUN] Updating swagger: ${categoryName} from ${path.basename(filePath)}`);
  } else {
    log.info(`Updating swagger: ${categoryName} from ${path.basename(filePath)}`);
  }
  
  // Use PUT to update existing API definition (filename is the identifier)
  const fileName = path.basename(filePath);
  const result = executeReadmeApiCall(
    'PUT',
    `/branches/${config.readme_version}/apis/${fileName}`,
    `Update swagger: ${categoryName}`,
    `@${filePath}`,
    true  // This is a write operation
  );
  
  return result.success;
}

// Get swagger files from mcp_swagger directory
async function getSwaggerFiles() {
  const files = [];
  
  try {
    const entries = await fs.readdir(config.mcp_swagger_dir);
    
    for (const entry of entries) {
      if (entry.endsWith('.json') && !entry.startsWith('.')) {
        const filePath = path.join(config.mcp_swagger_dir, entry);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const categoryName = path.basename(entry, '.json');
          files.push({
            path: filePath,
            name: entry,
            category: categoryName,
            modTime: stats.mtime.getTime()
          });
        }
      }
    }
  } catch (error) {
    log.error(`Failed to read swagger files: ${error.message}`);
    process.exit(1);
  }
  
  log.debug(`Found ${files.length} swagger files`);
  return files;
}

// Validate swagger file
async function validateSwaggerFile(filePath) {
  try {
    const content = await fs.readJson(filePath);
    
    // Basic validation
    if (!content.openapi && !content.swagger) {
      log.warn(`${path.basename(filePath)}: Not a valid OpenAPI/Swagger file`);
      return false;
    }
    
    if (!content.info || !content.paths) {
      log.warn(`${path.basename(filePath)}: Missing required fields (info or paths)`);
      return false;
    }
    
    return true;
  } catch (error) {
    log.error(`${path.basename(filePath)}: Failed to validate - ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  log.info('Starting README swagger update process...');
  log.info(`Target version: ${config.readme_version}`);
  
  if (config.dry_run) {
    log.info('DRY RUN MODE - No changes will be made');
  }
  
  if (config.force) {
    log.info('FORCE MODE - All files will be updated regardless of modification time');
  }
  
  // Load API token
  const apiToken = loadReadmeToken();
  log.info('README API token loaded successfully');
  
  // Load update state
  const state = await loadUpdateState();
  
  // Get swagger files
  const swaggerFiles = await getSwaggerFiles();
  
  if (swaggerFiles.length === 0) {
    log.warn('No swagger files found');
    return;
  }
  
  // Get existing categories
  const existingCategories = getExistingCategories();
  const canCheckCategories = Array.isArray(existingCategories);
  
  if (!canCheckCategories) {
    log.warn('Unable to fetch existing categories - will attempt to update all files without category validation');
  }
  
  const summary = {
    total: swaggerFiles.length,
    updated: 0,
    skipped: 0,
    failed: 0,
    categoriesCreated: 0
  };
  
  // Process each swagger file
  for (const file of swaggerFiles) {
    log.verbose(`Processing: ${file.name}`);
    
    // Validate swagger file
    if (!await validateSwaggerFile(file.path)) {
      log.error(`Skipping invalid swagger file: ${file.name}`);
      summary.failed++;
      continue;
    }
    
    // Check if file needs update
    const lastUpdateTime = state.files[file.name]?.lastUpdate || 0;
    const needsUpdate = config.force || file.modTime > lastUpdateTime;
    
    if (!needsUpdate) {
      log.verbose(`Skipping ${file.name}: No changes since last update`);
      summary.skipped++;
      continue;
    }
    
    log.info(`File needs update: ${file.name} (modified: ${new Date(file.modTime).toISOString()})`);
    
    // Check if category exists (only if we can check categories)
    if (canCheckCategories) {
      const categoryExists = existingCategories.some(cat => 
        cat.toLowerCase() === file.category.toLowerCase()
      );
      
      if (!categoryExists) {
        log.warn(`Category does not exist: ${file.category}`);
        
        if (createCategory(file.category)) {
          log.info(`Created category: ${file.category}`);
          summary.categoriesCreated++;
          existingCategories.push(file.category);
        } else {
          log.error(`Failed to create category: ${file.category}`);
          summary.failed++;
          continue;
        }
      }
    } else {
      log.verbose(`Skipping category check for ${file.category} - unable to fetch existing categories`);
    }
    
    // Update swagger
    if (updateSwagger(file.path, file.category)) {
      log.info(`Successfully updated: ${file.category}`);
      summary.updated++;
      
      // Update state
      state.files[file.name] = {
        lastUpdate: Date.now(),
        category: file.category,
        lastModTime: file.modTime
      };
    } else {
      log.error(`Failed to update: ${file.category}`);
      summary.failed++;
    }
  }
  
  // Update overall state
  state.lastUpdate = Date.now();
  await saveUpdateState(state);
  
  // Print summary
  console.log('\n=== UPDATE SUMMARY ===');
  console.log(`Total swagger files: ${summary.total}`);
  console.log(`Updated: ${summary.updated}`);
  console.log(`Skipped (no changes): ${summary.skipped}`);
  console.log(`Failed: ${summary.failed}`);
  console.log(`Categories created: ${summary.categoriesCreated}`);
  
  if (!canCheckCategories) {
    console.log('\n⚠️  Note: Could not verify existing categories - some files may have been updated without category validation');
  }
  
  if (summary.failed > 0) {
    console.log('\n⚠️  Some updates failed. Check the logs above for details.');
    process.exit(1);
  }
  
  if (summary.updated > 0 || summary.categoriesCreated > 0) {
    console.log(`\n✅ Successfully updated ${summary.updated} swagger files for README version ${config.readme_version}`);
    if (summary.categoriesCreated > 0) {
      console.log(`📁 Created ${summary.categoriesCreated} new categories`);
    }
  } else {
    console.log('\n📄 All swagger files are up to date');
  }
}

// Error handling
process.on('uncaughtException', (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  if (config.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    log.error(`Process failed: ${error.message}`);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  });
}

module.exports = { main };
