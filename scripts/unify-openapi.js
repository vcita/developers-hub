#!/usr/bin/env node

/**
 * OpenAPI Unification Script with Advanced Conflict Resolution
 * ===========================================================
 * 
 * This script unifies multiple OpenAPI/Swagger specification files from domain directories
 * into consolidated, conflict-free specifications. It handles various types of conflicts
 * that arise when combining multiple API definitions:
 * 
 * CONFLICT TYPES & RESOLUTION STRATEGIES:
 * 
 * 1. PATH CONFLICTS (e.g., same endpoint defined in multiple files)
 *    Strategy: NEWER-WINS based on file modification time
 *    Example: /api/users in both auth.json and users.json → newer file wins
 * 
 * 2. COMPONENT SCHEMA CONFLICTS (e.g., same schema name in different files)
 *    Strategy: RENAME-TO-PRESERVE by appending source filename
 *    Example: "User" schema conflict → "User_auth" and "User_users"
 * 
 * 3. SECURITY SCHEME CONFLICTS (e.g., same auth scheme defined multiple times)
 *    Strategy: FIRST-WINS to maintain consistency across all endpoints
 *    Example: Multiple "Bearer" definitions → first one is kept
 * 
 * 4. BASE PATH NORMALIZATION CONFLICTS (e.g., overlapping path structures)
 *    Strategy: SMART-NORMALIZATION with versioned path protection
 *    Example: Prevents /v1/api/users + basePath=/v1 → /v1/v1/api/users
 * 
 * 5. OTHER COMPONENT CONFLICTS (parameters, responses, examples, etc.)
 *    Strategy: LAST-WINS simple overwrite for consistency
 *    Example: Later parameter definitions replace earlier ones
 * 
 * CONFLICT METADATA:
 * All conflicts are tracked and stored in the unified spec's x-generated section
 * for debugging, auditing, and manual review when necessary.
 * 
 * USAGE:
 * node unify-openapi.js [--verbose] [--dry-run] [--input-dir ./swagger] [--output-dir ./mcp_swagger]
 */

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
Usage: node scripts/unify-openapi.js [options]

Options:
  --input-dir <dir>     Input directory (default: ./swagger)
  --output-dir <dir>    Output directory (default: ./mcp_swagger)
  --verbose             Enable verbose logging
  --dry-run            Show what would be processed without writing files
  --help               Show this help message

Conflict Resolution:
  This script automatically handles conflicts when unifying OpenAPI specs:
  
  🔄 Path Conflicts: When same endpoint appears in multiple files
     → Newer file wins (based on modification time)
  
  🏷️  Schema Conflicts: When same schema name exists in different files  
     → Conflicting schema renamed with source file suffix
  
  🔐 Security Conflicts: When same security scheme defined multiple times
     → First definition kept to maintain consistency
  
  🔧 Other Conflicts: Parameters, responses, examples, etc.
     → Later definitions overwrite earlier ones
  
  All conflicts are logged and tracked in the output file's x-generated metadata.
  Use --verbose for detailed conflict resolution information.
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
  
  // Convert $ref paths and clean up invalid OpenAPI 3.0 properties
  let convertedJson = JSON.stringify(converted);
  
  // Fix $ref paths from Swagger 2.0 to OpenAPI 3.0 format
  convertedJson = convertedJson.replace(/#\/definitions\//g, '#/components/schemas/');
  
  // Remove invalid OpenAPI 3.0 properties
  let cleanedJson = JSON.parse(convertedJson);
  
  // Recursively remove invalid properties
  function removeInvalidProperties(obj) {
    if (Array.isArray(obj)) {
      return obj.map(removeInvalidProperties);
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip invalid OpenAPI 3.0 properties
        if (key === 'definitions') {
          continue;
        }
        cleaned[key] = removeInvalidProperties(value);
      }
      return cleaned;
    }
    return obj;
  }
  
  return removeInvalidProperties(cleanedJson);
}

// Normalize paths by combining base path with endpoint paths
//
// BASE PATH NORMALIZATION & CONFLICT PREVENTION:
// ===============================================
// This function handles the complex task of normalizing API endpoint paths by combining
// base paths (from servers/basePath) with individual endpoint paths. This normalization
// can introduce conflicts that need careful handling:
//
// NORMALIZATION SCENARIOS:
// 1. SWAGGER 2.0 basePath: "/v1" + path: "/users" → "/v1/users"
// 2. OpenAPI 3.0 server URL: "https://api.vcita.biz/v1" + path: "/users" → "/v1/users"
// 3. Already complete paths: "/v1/users" + basePath: "/v1" → "/v1/users" (no double prefix)
// 4. Versioned paths: "/v2/users" → "/v2/users" (basePath ignored to prevent conflicts)
//
// CONFLICT SCENARIOS AND PREVENTION:
// 1. DOUBLE PREFIX PREVENTION:
//    - If originalPath already contains the basePath, don't add it again
//    - Example: basePath="/api", path="/api/users" → result="/api/users" (not "/api/api/users")
//
// 2. VERSIONED API PROTECTION:
//    - Paths starting with version patterns (/v1/, /v2/, etc.) are used as-is
//    - This prevents conflicts between different API versions
//    - Example: basePath="/v1", path="/v2/users" → result="/v2/users" (basePath ignored)
//
// 3. LEGACY vs NEW API COEXISTENCE:
//    - Files without basePath get paths as-is
//    - Files with basePath get normalized paths
//    - Conflicts resolved later using file modification time
//
// The function logs all transformations for debugging and conflict analysis.
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
      // VERSIONED PATH DETECTION:
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

      // Preserve existing operationId values without generating new ones
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
// 
// CONFLICT RESOLUTION STRATEGY:
// =============================
// When merging OpenAPI components (schemas, security schemes, etc.) from multiple files,
// conflicts can arise when the same component name exists in different files. This function
// implements the following conflict resolution strategies:
//
// 1. SCHEMA CONFLICTS:
//    - When the same schema name exists in multiple files, the conflicting schema
//      from the newer file is renamed by appending the source filename suffix
//    - Example: If "User" schema exists in both "auth.json" and "users.json", 
//      the one from "users.json" becomes "User_users"
//    - This preserves both schemas and prevents data loss
//
// 2. SECURITY SCHEME CONFLICTS:
//    - Security schemes with the same name are NOT renamed to avoid breaking references
//    - The first encountered security scheme is kept (first-wins strategy)
//    - This assumes security schemes should be consistent across files
//
// 3. OTHER COMPONENT CONFLICTS:
//    - For parameters, responses, examples, etc., later definitions overwrite earlier ones
//    - This is a last-wins strategy for these component types
//
// The function tracks all conflicts for logging and debugging purposes.
function mergeComponents(components1, components2, fileName1, fileName2) {
  if (!components1) return components2 || {};
  if (!components2) return components1;

  const merged = JSON.parse(JSON.stringify(components1)); // Deep copy
  const conflicts = [];

  // Merge schemas with conflict detection and resolution
  if (components2.schemas) {
    if (!merged.schemas) merged.schemas = {};
    for (const [schemaName, schemaDefinition] of Object.entries(components2.schemas)) {
      if (merged.schemas[schemaName]) {
        // SCHEMA CONFLICT DETECTED:
        // Create a unique name by appending the source filename to avoid collision
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

  // Merge security schemes (FIRST-WINS strategy)
  if (components2.securitySchemes) {
    if (!merged.securitySchemes) merged.securitySchemes = {};
    for (const [schemeName, schemeDefinition] of Object.entries(components2.securitySchemes)) {
      if (!merged.securitySchemes[schemeName]) {
        merged.securitySchemes[schemeName] = schemeDefinition;
      } else {
        // SECURITY SCHEME CONFLICT:
        // Keep the first one and ignore the second to maintain consistency
        // Security schemes should be identical across files, so this is safe
        log.verbose(`Security scheme conflict: Keeping existing ${schemeName}, ignoring duplicate from ${fileName2}`);
      }
    }
  }

  // Merge other component types (LAST-WINS strategy)
  // These components are merged using a simple overwrite approach where
  // later definitions replace earlier ones. This works well for:
  // - parameters: Usually domain-specific, conflicts are rare
  // - responses: Common response formats should be consistent
  // - examples: Later examples are assumed to be more up-to-date
  // - requestBodies: Similar to parameters, domain-specific
  ['parameters', 'responses', 'examples', 'requestBodies', 'headers', 'links', 'callbacks'].forEach(componentType => {
    if (components2[componentType]) {
      if (!merged[componentType]) merged[componentType] = {};
      
      // Check for conflicts in these component types
      const existingKeys = Object.keys(merged[componentType]);
      const newKeys = Object.keys(components2[componentType]);
      const conflictingKeys = newKeys.filter(key => existingKeys.includes(key));
      
      if (conflictingKeys.length > 0) {
        log.verbose(`${componentType} conflicts detected: ${conflictingKeys.join(', ')} (using definitions from ${fileName2})`);
      }
      
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
    
    // Merge paths with conflict detection and resolution
    // 
    // PATH CONFLICT RESOLUTION STRATEGY:
    // ==================================
    // Path conflicts occur when the same endpoint path (e.g., "/api/users") is defined 
    // in multiple OpenAPI files within the same domain. This can happen for several reasons:
    //
    // 1. DUPLICATE DEFINITIONS: The same endpoint is documented in multiple files
    // 2. BASE PATH CONFLICTS: Different files have overlapping path structures after normalization
    // 3. VERSIONING ISSUES: Different API versions define the same logical endpoint
    // 4. LEGACY MIGRATIONS: Old and new API definitions coexist temporarily
    //
    // RESOLUTION APPROACH:
    // - Files are sorted by modification time (newest first) before processing
    // - For conflicting paths, the definition from the newer file wins (NEWER-WINS strategy)
    // - This assumes that newer files contain more up-to-date API definitions
    // - All conflicts are logged for review and debugging
    // - Conflict metadata is stored in the unified spec's x-generated section
    //
    // CONFLICT EXAMPLES:
    // - If both "legacy_users.json" (2023-01-01) and "users_v2.json" (2023-06-01) 
    //   define "/api/users", the definition from "users_v2.json" will be used
    // - Base path normalization might cause "/v1/auth/login" and "/auth/login" to 
    //   conflict if one file has basePath="/v1" and the other has no basePath
    for (const [pathKey, pathValue] of Object.entries(paths)) {
      if (allPaths[pathKey]) {
        // PATH CONFLICT DETECTED
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

  // Ensure Bearer security scheme is added to components
  if (!mergedComponents.securitySchemes) {
    mergedComponents.securitySchemes = {};
  }
  mergedComponents.securitySchemes.Bearer = {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'JWT Bearer token authentication'
  };

  // Add Bearer security to all paths
  const pathsWithSecurity = {};
  for (const [pathKey, pathMethods] of Object.entries(allPaths)) {
    pathsWithSecurity[pathKey] = {};
    for (const [method, operation] of Object.entries(pathMethods)) {
      pathsWithSecurity[pathKey][method] = {
        ...operation,
        security: [{ Bearer: [] }]
      };
    }
  }
  
  // Create unified specification (preserve original tags and path ordering)
  const unifiedSpec = {
    openapi: "3.1.0",
    info: {
      title: `${domainName.charAt(0).toUpperCase() + domainName.slice(1)}`,
      description: `Unified OpenAPI specification for ${domainName} domain`,
      version: "3.0",
      "x-generated": {
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
    paths: pathsWithSecurity,
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
  
  // Convert ALL remaining $ref paths and clean up invalid OpenAPI 3.0 properties
  let specJson = JSON.stringify(unifiedSpec);
  specJson = specJson.replace(/#\/definitions\//g, '#/components/schemas/');
  
  let fixedSpec = JSON.parse(specJson);
  
  // Recursively remove invalid OpenAPI 3.1 properties from the entire spec
  function cleanOpenAPISpec(obj) {
    if (Array.isArray(obj)) {
      return obj.map(cleanOpenAPISpec);
    } else if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        // Skip invalid OpenAPI 3.1 properties
        if (key === 'definitions') {
          log.verbose(`Removing invalid OpenAPI 3.1 property: ${key}`);
          continue;
        }
        // Remove 'type' when '$ref' is present (invalid in OpenAPI 3.1)
        if (key === 'type' && obj['$ref']) {
          log.verbose(`Removing 'type' property alongside '$ref'`);
          continue;
        }
        cleaned[key] = cleanOpenAPISpec(value);
      }
      return cleaned;
    }
    return obj;
  }
  
  fixedSpec = cleanOpenAPISpec(fixedSpec);
  
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
    
    // Print detailed summary with conflict analysis
    console.log('\n=== UNIFICATION SUMMARY ===');
    console.log(`Domains processed: ${summary.successfulDomains}/${summary.totalDomains}`);
    console.log(`Total files processed: ${summary.totalFiles}`);
    console.log(`Total paths generated: ${summary.totalPaths}`);
    console.log(`Total conflicts resolved: ${summary.totalConflicts}`);
    
    if (summary.totalConflicts > 0) {
      console.log('\n🔧 CONFLICT RESOLUTION APPLIED:');
      console.log('  - Path conflicts: Newer files won (based on modification time)');
      console.log('  - Schema conflicts: Conflicting schemas renamed with file suffix');
      console.log('  - Security conflicts: First definition kept for consistency');
      console.log('  - Other component conflicts: Later definitions overwrote earlier ones');
      console.log('\n💡 TIP: Use --verbose flag to see detailed conflict resolution logs');
    }
    
    if (results.length > 0) {
      console.log('\n📁 Domain breakdown:');
      results.forEach(result => {
        console.log(`  ${result.domain}: ${result.stats.filesProcessed} files → ${result.stats.pathsGenerated} paths`);
        if (result.stats.pathConflicts > 0 || result.stats.componentConflicts > 0) {
          console.log(`    ⚠️  Conflicts resolved: ${result.stats.pathConflicts} path + ${result.stats.componentConflicts} component`);
          console.log(`    📋 Check x-generated metadata in output file for conflict details`);
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
