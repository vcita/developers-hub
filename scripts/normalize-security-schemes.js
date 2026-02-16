#!/usr/bin/env node

/**
 * Normalize securitySchemes in swagger files
 * - Adds default Bearer scheme to all files
 * - Preserves custom securitySchemes in specified files (e.g., partners-api.json)
 */

const fs = require('fs-extra');
const path = require('path');

const SWAGGER_DIR = './swagger';
const PRESERVE_FILES = ['partners-api.json']; // Files to keep their custom securitySchemes

// Default Bearer security scheme
const DEFAULT_BEARER_SCHEME = {
  Bearer: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Provide a valid bearer token in the Authorization header. Example: \'Authorization: Bearer {app_token}\''
  }
};

async function findJsonFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

async function normalizeSecuritySchemes(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip files we want to preserve (they have custom security schemes)
  if (PRESERVE_FILES.includes(fileName)) {
    console.log(`[SKIP] ${filePath} - preserved (custom security scheme)`);
    return { skipped: true };
  }
  
  try {
    const content = await fs.readJson(filePath);
    
    // Ensure components object exists
    if (!content.components) {
      content.components = {};
    }
    
    // Check if already has the default scheme
    const currentScheme = content.components.securitySchemes?.Bearer;
    if (currentScheme && 
        currentScheme.type === 'http' && 
        currentScheme.scheme === 'bearer' &&
        currentScheme.bearerFormat === 'JWT') {
      console.log(`[SKIP] ${filePath} - already has default Bearer scheme`);
      return { skipped: true };
    }
    
    // Set the default Bearer security scheme
    content.components.securitySchemes = DEFAULT_BEARER_SCHEME;
    
    // Write back
    await fs.writeJson(filePath, content, { spaces: 2 });
    console.log(`[UPDATED] ${filePath} - added default Bearer scheme`);
    return { updated: true };
    
  } catch (error) {
    console.error(`[ERROR] ${filePath}: ${error.message}`);
    return { error: true };
  }
}

async function main() {
  console.log('Normalizing securitySchemes in swagger files...');
  console.log(`Preserving custom schemes in: ${PRESERVE_FILES.join(', ')}\n`);
  
  const files = await findJsonFiles(SWAGGER_DIR);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const file of files) {
    const result = await normalizeSecuritySchemes(file);
    if (result.updated) updated++;
    else if (result.skipped) skipped++;
    else if (result.error) errors++;
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
