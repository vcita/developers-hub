#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

// CLI Configuration
const config = {
  inputDir: './swagger',
  outputDir: './mcp_swagger',
  verbose: false,
  dryRun: false
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--input-dir':
      config.inputDir = args[++i];
      break;
    case '--output-dir':
      config.outputDir = args[++i];
      break;
    case '--verbose':
      config.verbose = true;
      break;
    case '--dry-run':
      config.dryRun = true;
      break;
    case '--help':
      console.log(`
Usage: node unify-openapi.js [options]

Options:
  --input-dir <dir>     Input directory (default: ./swagger)
  --output-dir <dir>    Output directory (default: ./mcp_swagger)
  --verbose             Enable verbose logging
  --dry-run            Show what would be processed without writing files
  --help               Show this help message
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

// Extract base path from OpenAPI spec
function extractBasePath(content, fileName) {
  if (content.swagger) { // Swagger 2.0
    const basePath = content.basePath || '';
    log.debug(`Swagger 2.0 file ${fileName}: basePath="${basePath}"`);
    return basePath;
  } else if (content.openapi) { // OpenAPI 3.0+
    const serverUrl = content.servers?.[0]?.url || 'https://api.vcita.biz';
    try {
      const url = new URL(serverUrl);
      const basePath = url.pathname.replace(/\/$/, ''); // Remove trailing slash
      log.debug(`OpenAPI 3.0 file ${fileName}: server="${serverUrl}" → basePath="${basePath}"`);
      return basePath;
    } catch (error) {
      log.warn(`Invalid server URL in ${fileName}: ${serverUrl}`);
      return '';
    }
  }
  return '';
}

// Convert Swagger 2.0 operation to OpenAPI 3.0
function convertSwaggerToOpenAPI(operation, fileName) {
  if (!operation) return operation;
  
  const converted = JSON.parse(JSON.stringify(operation)); // Deep copy
  
  // Convert consumes/produces to requestBody/responses
  if (operation.consumes || operation.produces) {
    log.debug(`Converting consumes/produces in ${fileName}`);
    
    // Handle consumes -> requestBody
    if (operation.consumes && operation.parameters) {
      const bodyParam = operation.parameters.find(p => p.in === 'body');
      if (bodyParam) {
        converted.requestBody = {
          content: {}
        };
        
        operation.consumes.forEach(mediaType => {
          converted.requestBody.content[mediaType] = {
            schema: bodyParam.schema || { type: 'object' }
          };
        });
        
        // Remove body parameter and consumes
        converted.parameters = operation.parameters.filter(p => p.in !== 'body');
      }
    }
    
    // Handle produces -> responses content
    if (operation.produces && operation.responses) {
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        if (response.schema || response.examples) {
          converted.responses[statusCode] = {
            ...response,
            content: {}
          };
          
          operation.produces.forEach(mediaType => {
            const contentEntry = {
              ...(response.schema && { schema: response.schema })
            };
            
            // Convert Swagger 2.0 examples to OpenAPI 3.0 format
            if (response.examples && response.examples[mediaType]) {
              contentEntry.example = response.examples[mediaType];
            }
            
            converted.responses[statusCode].content[mediaType] = contentEntry;
          });
          
          // Remove the old schema and examples properties
          delete converted.responses[statusCode].schema;
          delete converted.responses[statusCode].examples;
        }
      }
    }
    
    // Handle responses with examples but no produces (fallback to application/json)
    if (!operation.produces && operation.responses) {
      for (const [statusCode, response] of Object.entries(operation.responses)) {
        if (response.examples) {
          if (!converted.responses[statusCode].content) {
            converted.responses[statusCode] = {
              ...response,
              content: {}
            };
          }
          
          // Handle examples for common media types
          Object.keys(response.examples).forEach(mediaType => {
            if (!converted.responses[statusCode].content[mediaType]) {
              converted.responses[statusCode].content[mediaType] = {};
            }
            converted.responses[statusCode].content[mediaType].example = response.examples[mediaType];
          });
          
          delete converted.responses[statusCode].examples;
        }
      }
    }
    
    // Remove Swagger 2.0 properties
    delete converted.consumes;
    delete converted.produces;
  }
  
  // Convert ALL parameters to ensure no direct 'type' properties remain
  if (converted.parameters) {
    converted.parameters = converted.parameters.map(param => {
      let newParam;
      
      // Always ensure parameters use schema format (even if already partially converted)
      if (param.type) {
        const { type, format, enum: enumValues, items, collectionFormat, ...rest } = param;
        newParam = {
          ...rest,
          schema: param.schema || {
            type,
            ...(format && { format }),
            ...(enumValues && { enum: enumValues }),
            ...(items && { items })
          }
        };
        
        // Convert Swagger 2.0 collectionFormat to OpenAPI 3.0 style/explode
        if (collectionFormat) {
          switch (collectionFormat) {
            case 'multi':
              newParam.style = 'form';
              newParam.explode = true;
              break;
            case 'csv':
              newParam.style = 'simple';
              newParam.explode = false;
              break;
            case 'ssv':
              newParam.style = 'spaceDelimited';
              newParam.explode = false;
              break;
            case 'tsv':
              newParam.style = 'form';
              newParam.explode = false;
              break;
            case 'pipes':
              newParam.style = 'pipeDelimited';
              newParam.explode = false;
              break;
            default:
              // Default to form/true for unknown formats
              newParam.style = 'form';
              newParam.explode = true;
          }
        }
      } else {
        newParam = param;
        
        // Handle collectionFormat even if no type conversion needed
        if (param.collectionFormat) {
          const { collectionFormat, ...rest } = param;
          newParam = { ...rest };
          
          switch (collectionFormat) {
            case 'multi':
              newParam.style = 'form';
              newParam.explode = true;
              break;
            case 'csv':
              newParam.style = 'simple';
              newParam.explode = false;
              break;
            case 'ssv':
              newParam.style = 'spaceDelimited';
              newParam.explode = false;
              break;
            case 'tsv':
              newParam.style = 'form';
              newParam.explode = false;
              break;
            case 'pipes':
              newParam.style = 'pipeDelimited';
              newParam.explode = false;
              break;
            default:
              newParam.style = 'form';
              newParam.explode = true;
          }
        }
      }
      
      return newParam;
    });
  }
  
  // Convert $ref paths from Swagger 2.0 to OpenAPI 3.0 format
  const convertedJson = JSON.stringify(converted);
  const updatedJson = convertedJson.replace(/#\/definitions\//g, '#/components/schemas/');
  
  return JSON.parse(updatedJson);
}

// Normalize paths by combining base path with endpoint paths
function normalizeEndpoints(fileContent, fileName) {
  const basePath = extractBasePath(fileContent, fileName);
  const normalizedPaths = {};
  const transformationLog = [];

  if (!fileContent.paths) {
    log.warn(`No paths found in ${fileName}`);
    return { paths: {}, transformations: [] };
  }

  const isSwagger2 = !!fileContent.swagger;

  for (const [originalPath, methods] of Object.entries(fileContent.paths)) {
    // Smart path normalization - avoid double prefixes and versioned API conflicts
    let fullPath;
    if (basePath && !originalPath.startsWith(basePath)) {
      // Don't add basePath if the original path looks like a complete versioned API path
      const isVersionedPath = /^\/v\d+\//.test(originalPath);
      if (isVersionedPath) {
        fullPath = originalPath;  // Use as-is for versioned paths
        log.verbose(`Skipping basePath for versioned API path: "${originalPath}"`);
      } else {
        fullPath = basePath + originalPath;
      }
    } else {
      fullPath = originalPath;
    }
    
    // Convert Swagger 2.0 operations to OpenAPI 3.0 if needed
    const convertedMethods = {};
    
    // Convert path-level parameters first (if any)
    if (methods.parameters && isSwagger2) {
      convertedMethods.parameters = methods.parameters.map(param => {
        if (param.type) {
          const { type, format, enum: enumValues, items, ...rest } = param;
          return {
            ...rest,
            schema: {
              type,
              ...(format && { format }),
              ...(enumValues && { enum: enumValues }),
              ...(items && { items })
            }
          };
        }
        return param;
      });
    } else if (methods.parameters) {
      convertedMethods.parameters = methods.parameters;
    }
    
    for (const [httpMethod, operation] of Object.entries(methods)) {
      if (httpMethod === 'parameters') continue; // Skip parameters, already handled
      
      if (isSwagger2) {
        convertedMethods[httpMethod] = convertSwaggerToOpenAPI(operation, fileName);
      } else {
        convertedMethods[httpMethod] = operation;
      }
    }
    
    normalizedPaths[fullPath] = convertedMethods;
    
    // Only log transformation if the path was actually changed
    if (basePath && fullPath !== originalPath) {
      transformationLog.push({
        original: originalPath,
        normalized: fullPath,
        basePath: basePath
      });
      log.verbose(`Path normalization: "${originalPath}" → "${fullPath}"`);
    }
  }

  return {
    paths: normalizedPaths,
    transformations: transformationLog
  };
}

// Convert Swagger 2.0 definitions to OpenAPI 3.0 components
function convertDefinitionsToComponents(fileContent, fileName) {
  if (!fileContent.definitions && !fileContent.components) {
    return {};
  }
  
  let components = fileContent.components || {};
  
  // Convert Swagger 2.0 definitions to OpenAPI 3.0 components.schemas
  if (fileContent.definitions) {
    log.debug(`Converting definitions to components.schemas in ${fileName}`);
    components.schemas = { ...components.schemas, ...fileContent.definitions };
  }
  
  return components;
}

// Merge components from multiple files
function mergeComponents(components1, components2, fileName1, fileName2) {
  if (!components1) return components2 || {};
  if (!components2) return components1;

  const merged = JSON.parse(JSON.stringify(components1)); // Deep copy
  const conflicts = [];

  // Merge schemas
  if (components2.schemas) {
    if (!merged.schemas) merged.schemas = {};
    for (const [schemaName, schemaDefinition] of Object.entries(components2.schemas)) {
      if (merged.schemas[schemaName]) {
        // Handle schema name conflict
        const conflictName = `${schemaName}_${path.basename(fileName2, '.json')}`;
        merged.schemas[conflictName] = schemaDefinition;
        conflicts.push({
          type: 'schema',
          name: schemaName,
          resolution: `Renamed to ${conflictName}`,
          files: [fileName1, fileName2]
        });
        log.warn(`Schema conflict: ${schemaName} renamed to ${conflictName} (from ${fileName2})`);
      } else {
        merged.schemas[schemaName] = schemaDefinition;
      }
    }
  }

  // Merge security schemes
  if (components2.securitySchemes) {
    if (!merged.securitySchemes) merged.securitySchemes = {};
    for (const [schemeName, schemeDefinition] of Object.entries(components2.securitySchemes)) {
      if (!merged.securitySchemes[schemeName]) {
        merged.securitySchemes[schemeName] = schemeDefinition;
      }
    }
  }

  // Merge other component types (parameters, responses, etc.)
  ['parameters', 'responses', 'examples', 'requestBodies', 'headers', 'links', 'callbacks'].forEach(componentType => {
    if (components2[componentType]) {
      if (!merged[componentType]) merged[componentType] = {};
      Object.assign(merged[componentType], components2[componentType]);
    }
  });

  return { merged, conflicts };
}

// Merge tags and deduplicate
function mergeTags(tags1, tags2) {
  const tagsMap = new Map();
  
  // Add tags from first array
  (tags1 || []).forEach(tag => {
    tagsMap.set(tag.name, tag);
  });
  
  // Add tags from second array (merge descriptions if names match)
  (tags2 || []).forEach(tag => {
    if (tagsMap.has(tag.name)) {
      const existing = tagsMap.get(tag.name);
      if (tag.description && !existing.description) {
        existing.description = tag.description;
      } else if (tag.description && existing.description && tag.description !== existing.description) {
        existing.description += ` | ${tag.description}`;
      }
    } else {
      tagsMap.set(tag.name, tag);
    }
  });
  
  return Array.from(tagsMap.values());
}

// Find all JSON files in a directory recursively
async function findJsonFiles(dir) {
  const files = [];
  
  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.includes('.bak')) {
        files.push(fullPath);
      }
    }
  }
  
  await scan(dir);
  return files;
}

// Validate if a JSON file is a valid OpenAPI/Swagger spec
function isValidOpenAPISpec(content) {
  return (content.swagger && content.info && content.paths) || 
         (content.openapi && content.info && content.paths);
}

// Get file modification time for conflict resolution
async function getFileModificationTime(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch (error) {
    return new Date(0); // Return epoch if file doesn't exist
  }
}

// Process a single domain directory
async function processDomain(domainPath, domainName) {
  log.info(`Processing domain: ${domainName}`);
  
  // Find all JSON files in the domain directory
  const jsonFiles = await findJsonFiles(domainPath);
  
  if (jsonFiles.length === 0) {
    log.warn(`No JSON files found in ${domainPath}`);
    return null;
  }
  
  const validFiles = [];
  const allPathTransformations = [];
  let mergedComponents = {};
  let mergedTags = [];
  let allPaths = {};
  const pathConflicts = [];
  const componentConflicts = [];
  
  // Process each file
  for (const filePath of jsonFiles) {
    const fileName = path.basename(filePath);
    log.verbose(`Processing file: ${fileName}`);
    
    try {
      const content = await fs.readJson(filePath);
      
      if (!isValidOpenAPISpec(content)) {
        log.warn(`Skipping ${fileName}: Not a valid OpenAPI/Swagger spec`);
        continue;
      }
      
      validFiles.push({
        path: filePath,
        name: fileName,
        content: content,
        modificationTime: await getFileModificationTime(filePath)
      });
      
    } catch (error) {
      log.error(`Error reading ${fileName}: ${error.message}`);
      continue;
    }
  }
  
  if (validFiles.length === 0) {
    log.warn(`No valid OpenAPI specs found in ${domainName}`);
    return null;
  }
  
  // Sort files by modification time (newest first) for conflict resolution
  validFiles.sort((a, b) => b.modificationTime - a.modificationTime);
  
  // Process each valid file
  for (const file of validFiles) {
    const { paths, transformations } = normalizeEndpoints(file.content, file.name);
    
    // Track path transformations
    if (transformations.length > 0) {
      allPathTransformations.push({
        file: file.name,
        basePath: extractBasePath(file.content, file.name),
        transformations: transformations
      });
    }
    
    // Merge paths with conflict detection
    for (const [pathKey, pathValue] of Object.entries(paths)) {
      if (allPaths[pathKey]) {
        // Path conflict detected
        const existingFile = pathConflicts.find(c => c.path === pathKey)?.winner || 'unknown';
        pathConflicts.push({
          path: pathKey,
          files: [existingFile, file.name],
          winner: file.name,
          resolution: `Used ${file.name} (newer modification date)`,
          timestamp: new Date().toISOString()
        });
        log.warn(`Path conflict: ${pathKey} - using ${file.name} over existing`);
      }
      allPaths[pathKey] = pathValue;
    }
    
    // Merge components (convert Swagger 2.0 definitions if needed)
    const fileComponents = convertDefinitionsToComponents(file.content, file.name);
    if (Object.keys(fileComponents).length > 0) {
      const componentResult = mergeComponents(mergedComponents, fileComponents, 
                                           'merged', file.name);
      mergedComponents = componentResult.merged;
      componentConflicts.push(...componentResult.conflicts);
    }
    
    // Merge tags
    mergedTags = mergeTags(mergedTags, file.content.tags);
  }
  
  // Create unified specification
  const unifiedSpec = {
    openapi: "3.0.0",
    info: {
      title: `${domainName.charAt(0).toUpperCase() + domainName.slice(1)}`,
      description: `Unified OpenAPI specification for ${domainName} domain`,
      version: "3.0",
      "x-generated": {
        timestamp: new Date().toISOString(),
        sourceFiles: validFiles.map(f => f.name),
        pathNormalizations: allPathTransformations,
        pathConflicts: pathConflicts,
        componentConflicts: componentConflicts,
        totalPaths: Object.keys(allPaths).length,
        totalComponents: Object.keys(mergedComponents.schemas || {}).length
      }
    },
    servers: [
      {
        url: "https://api.vcita.biz",
        description: "Unified API Gateway server"
      }
    ],
    paths: allPaths,
    components: mergedComponents,
    tags: mergedTags
  };
  
  log.info(`Domain ${domainName}: Unified ${validFiles.length} files into ${Object.keys(allPaths).length} paths`);
  
  if (pathConflicts.length > 0) {
    log.warn(`Domain ${domainName}: Resolved ${pathConflicts.length} path conflicts`);
  }
  
  if (componentConflicts.length > 0) {
    log.warn(`Domain ${domainName}: Resolved ${componentConflicts.length} component conflicts`);
  }
  
  // Convert ALL remaining $ref paths from Swagger 2.0 to OpenAPI 3.0 format
  const specJson = JSON.stringify(unifiedSpec);
  const fixedSpec = JSON.parse(specJson.replace(/#\/definitions\//g, '#/components/schemas/'));
  
  return {
    domain: domainName,
    spec: fixedSpec,
    stats: {
      filesProcessed: validFiles.length,
      pathsGenerated: Object.keys(allPaths).length,
      pathConflicts: pathConflicts.length,
      componentConflicts: componentConflicts.length
    }
  };
}

// Main function
async function main() {
  log.info('Starting OpenAPI unification process...');
  log.info(`Input directory: ${config.inputDir}`);
  log.info(`Output directory: ${config.outputDir}`);
  
  if (config.dryRun) {
    log.info('DRY RUN MODE - No files will be written');
  }
  
  try {
    // Check if input directory exists
    if (!await fs.pathExists(config.inputDir)) {
      log.error(`Input directory does not exist: ${config.inputDir}`);
      process.exit(1);
    }
    
    // Get all domain directories
    const entries = await fs.readdir(config.inputDir, { withFileTypes: true });
    const domains = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    
    log.info(`Found domains: ${domains.join(', ')}`);
    
    // Create output directory if it doesn't exist
    if (!config.dryRun) {
      await fs.ensureDir(config.outputDir);
    }
    
    const results = [];
    const summary = {
      totalDomains: 0,
      successfulDomains: 0,
      totalFiles: 0,
      totalPaths: 0,
      totalConflicts: 0
    };
    
    // Process each domain
    for (const domain of domains) {
      const domainPath = path.join(config.inputDir, domain);
      summary.totalDomains++;
      
      try {
        const result = await processDomain(domainPath, domain);
        
        if (result) {
          results.push(result);
          summary.successfulDomains++;
          summary.totalFiles += result.stats.filesProcessed;
          summary.totalPaths += result.stats.pathsGenerated;
          summary.totalConflicts += result.stats.pathConflicts + result.stats.componentConflicts;
          
          // Write unified file
          if (!config.dryRun) {
            const outputFile = path.join(config.outputDir, `${domain}.json`);
            await fs.writeJson(outputFile, result.spec, { spaces: 2 });
            log.info(`Created unified file: ${outputFile}`);
          } else {
            log.info(`[DRY RUN] Would create: ${domain}.json with ${result.stats.pathsGenerated} paths`);
          }
        }
        
      } catch (error) {
        log.error(`Failed to process domain ${domain}: ${error.message}`);
      }
    }
    
    // Print summary
    console.log('\n=== UNIFICATION SUMMARY ===');
    console.log(`Domains processed: ${summary.successfulDomains}/${summary.totalDomains}`);
    console.log(`Total files processed: ${summary.totalFiles}`);
    console.log(`Total paths generated: ${summary.totalPaths}`);
    console.log(`Total conflicts resolved: ${summary.totalConflicts}`);
    
    if (results.length > 0) {
      console.log('\nDomain breakdown:');
      results.forEach(result => {
        console.log(`  ${result.domain}: ${result.stats.filesProcessed} files → ${result.stats.pathsGenerated} paths`);
        if (result.stats.pathConflicts > 0 || result.stats.componentConflicts > 0) {
          console.log(`    (${result.stats.pathConflicts} path conflicts, ${result.stats.componentConflicts} component conflicts)`);
        }
      });
    }
    
    if (!config.dryRun) {
      log.info(`\nUnified OpenAPI specifications written to: ${config.outputDir}`);
    }
    
  } catch (error) {
    log.error(`Process failed: ${error.message}`);
    if (config.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { 
  main, 
  processDomain, 
  normalizeEndpoints, 
  extractBasePath, 
  convertSwaggerToOpenAPI,
  convertDefinitionsToComponents 
};
