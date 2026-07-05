/**
 * Swagger Updater
 * Updates swagger JSON files with token documentation.
 * Appends "Available for **X tokens**" to operation descriptions.
 *
 * When the active swaggerPath is mcp_swagger/ (a generated directory),
 * this module resolves the original source file under swagger/ and writes
 * the fix there so changes survive regeneration. It also updates the
 * mcp_swagger file so the running process sees the fix immediately.
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');
const SOURCE_SWAGGER_DIR = path.resolve(PROJECT_ROOT, 'swagger');
const MCP_SWAGGER_DIR = path.resolve(PROJECT_ROOT, 'mcp_swagger');

/**
 * Build the token documentation string from an array of token types
 * @param {string[]} tokens - e.g. ['staff', 'directory', 'client']
 * @returns {string} e.g. "Available for **Staff, Directory, and Client tokens**"
 */
function buildTokenDocString(tokens) {
  if (!tokens || tokens.length === 0) return '';

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const names = tokens.map(capitalize);

  let joined;
  if (names.length === 1) {
    joined = names[0];
  } else if (names.length === 2) {
    joined = `${names[0]} and ${names[1]}`;
  } else {
    joined = names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
  }

  return `Available for **${joined} tokens**`;
}

/**
 * Recursively search a directory for a file by name.
 * @returns {string|null} Full path if found
 */
function findFileRecursive(dir, fileName) {
  if (!fs.existsSync(dir)) return null;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findFileRecursive(full, fileName);
      if (found) return found;
    } else if (entry.name === fileName) {
      return full;
    }
  }
  return null;
}

/**
 * Given an mcp_swagger file and a normalized endpoint path, resolve the
 * original source swagger file and the original (pre-normalization) path.
 *
 * Uses the x-generated metadata embedded by unify-openapi.js:
 *  - pathNormalizations[].transformations maps normalized → original paths
 *  - sourceFiles lists every source file that was merged
 *
 * @param {string} mcpSwaggerFile - Relative path, e.g. "mcp_swagger/sales.json"
 * @param {string} normalizedPath  - The path key as it appears in the mcp_swagger spec
 * @returns {{ sourceFile: string, originalPath: string } | null}
 */
function resolveSourceSwagger(mcpSwaggerFile, normalizedPath) {
  const fullPath = path.resolve(PROJECT_ROOT, mcpSwaggerFile);
  if (!fs.existsSync(fullPath)) return null;

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch { return null; }

  const xGenerated = spec.info?.['x-generated'];
  if (!xGenerated) return null;

  const domain = path.basename(mcpSwaggerFile, '.json');
  const domainDir = path.join(SOURCE_SWAGGER_DIR, domain);

  // 1) Check pathNormalizations for a matching normalized path
  for (const group of (xGenerated.pathNormalizations || [])) {
    for (const t of (group.transformations || [])) {
      if (t.normalized === normalizedPath) {
        const sourceFilePath = findFileRecursive(domainDir, group.file);
        if (sourceFilePath) {
          return {
            sourceFile: path.relative(PROJECT_ROOT, sourceFilePath),
            originalPath: t.original
          };
        }
      }
    }
  }

  // 2) Path wasn't normalized – scan source files for an exact path match
  for (const sourceFileName of (xGenerated.sourceFiles || [])) {
    const sourceFilePath = findFileRecursive(domainDir, sourceFileName);
    if (!sourceFilePath) continue;
    try {
      const sourceSpec = JSON.parse(fs.readFileSync(sourceFilePath, 'utf8'));
      if (sourceSpec.paths?.[normalizedPath]) {
        return {
          sourceFile: path.relative(PROJECT_ROOT, sourceFilePath),
          originalPath: normalizedPath
        };
      }
    } catch { continue; }
  }

  return null;
}

/**
 * Check whether a relative swagger path points inside the mcp_swagger directory.
 */
function isMcpSwaggerFile(swaggerFile) {
  const full = path.resolve(PROJECT_ROOT, swaggerFile);
  return full.startsWith(MCP_SWAGGER_DIR + path.sep) || full === MCP_SWAGGER_DIR;
}

/**
 * Apply token documentation to a single swagger file + path.
 * Low-level helper – does NOT attempt source resolution.
 *
 * @returns {{ success: boolean, message: string }}
 */
function applyTokenDocToFile(swaggerFile, endpointPath, method, tokens) {
  const fullPath = path.resolve(PROJECT_ROOT, swaggerFile);

  if (!fs.existsSync(fullPath)) {
    return { success: false, message: `Swagger file not found: ${swaggerFile}` };
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    return { success: false, message: `Failed to parse swagger: ${error.message}` };
  }

  if (!spec.paths) {
    return { success: false, message: 'Swagger file has no paths' };
  }

  const methodLower = method.toLowerCase();
  let pathObj = spec.paths[endpointPath];

  if (!pathObj) {
    for (const [specPath, specPathObj] of Object.entries(spec.paths)) {
      if (normalizePath(specPath) === normalizePath(endpointPath)) {
        pathObj = specPathObj;
        endpointPath = specPath;
        break;
      }
    }
  }

  if (!pathObj) {
    return { success: false, message: `Path not found in swagger: ${endpointPath}` };
  }

  const operation = pathObj[methodLower];
  if (!operation) {
    return { success: false, message: `Method ${method} not found for path ${endpointPath}` };
  }

  const tokenDocString = buildTokenDocString(tokens);
  const existingDesc = operation.description || '';

  // Upsert behavior:
  // - If a token-availability sentence already exists but is malformed (e.g. missing "tokens"),
  //   replace it with the canonical string so token parsing will detect it.
  // - If it doesn't exist, append it.
  const upsertTokenDoc = (desc, canonical) => {
    const patterns = [
      // Bold patterns
      /[Aa]vailable for \*\*[^*]+\*\*/,
      /\*\*[Aa]vailable for [^*]+\*\*/,
      /\*\*[Oo]nly [Aa]vailable for [^*]+\*\*/,
      /[Oo]nly [Aa]vailable for \*\*[^*]+\*\*/,
      // Non-bold patterns
      /[Aa]vailable for [A-Za-z,\s&]+(?:tokens?|Tokens?)/i,
      /[Oo]nly [Aa]vailable for [A-Za-z,\s&]+(?:tokens?|Tokens?)/i,
    ];

    for (const re of patterns) {
      if (re.test(desc)) {
        return desc.replace(re, canonical);
      }
    }

    if (desc.trim()) {
      return desc.trimEnd() + '\n\n' + canonical;
    }
    return canonical;
  };

  const updatedDesc = upsertTokenDoc(existingDesc, tokenDocString);

  // If nothing changed, treat as success (already canonical / already present)
  if ((existingDesc || '').trim() === (updatedDesc || '').trim()) {
    return { success: true, message: 'Token documentation already up to date (no change)' };
  }

  operation.description = updatedDesc;

  try {
    fs.writeFileSync(fullPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  } catch (error) {
    return { success: false, message: `Failed to write swagger: ${error.message}` };
  }

  return {
    success: true,
    message: `Updated ${swaggerFile}: ${methodLower} ${endpointPath} -> ${tokenDocString}`
  };
}

/**
 * Update the token documentation for a specific operation in a swagger file.
 *
 * When the target is an mcp_swagger file, the fix is FIRST written to the
 * original source file under swagger/ so it persists across regeneration,
 * and THEN also applied to the mcp_swagger file for immediate effect.
 *
 * @param {string} swaggerFile - Relative path to swagger JSON (from project root)
 * @param {string} endpointPath - The path key in swagger (e.g. "/v3/ai/bizai_chats")
 * @param {string} method - HTTP method lowercase (e.g. "get")
 * @param {string[]} tokens - Token types to document
 * @returns {{ success: boolean, message: string }}
 */
function updateTokenDocumentation(swaggerFile, endpointPath, method, tokens) {
  if (!tokens || tokens.length === 0) {
    return { success: false, message: 'No tokens provided' };
  }

  // If the target is an mcp_swagger file, resolve and update the source first
  if (isMcpSwaggerFile(swaggerFile)) {
    const source = resolveSourceSwagger(swaggerFile, endpointPath);
    if (source) {
      const sourceResult = applyTokenDocToFile(source.sourceFile, source.originalPath, method, tokens);
      if (sourceResult.success) {
        console.log(`[swagger-updater] Source updated: ${source.sourceFile} (${source.originalPath})`);
      } else {
        console.warn(`[swagger-updater] Source update failed for ${source.sourceFile}: ${sourceResult.message}`);
      }
    } else {
      console.warn(`[swagger-updater] Could not resolve source swagger for ${endpointPath} in ${swaggerFile}`);
    }
  }

  // Always update the target file (mcp_swagger or direct source) for immediate effect
  return applyTokenDocToFile(swaggerFile, endpointPath, method, tokens);
}

/**
 * Normalize a path for comparison (strip trailing slash, lowercase params)
 */
function normalizePath(p) {
  return p.replace(/\/+$/, '').replace(/\{[^}]+\}/g, '{id}').toLowerCase();
}

module.exports = {
  updateTokenDocumentation,
  buildTokenDocString,
  normalizePath,
  resolveSourceSwagger,
  isMcpSwaggerFile
};
