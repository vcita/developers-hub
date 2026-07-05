/**
 * Code Searcher
 * Searches local backend repos for auth/token configuration per endpoint.
 * Uses shared APIGW routing from shared-tools.js to map endpoint paths to
 * backend services, then searches controllers for token type restrictions.
 */

const fs = require('fs');
const path = require('path');
const {
  REPO_PATHS,
  REPO_FRAMEWORKS,
  GITHUB_BASE,
  findServiceForEndpoint,
} = require('../runner/shared-tools');

const DEFAULT_TOKENS = ['staff', 'directory', 'client'];

/**
 * Map an endpoint path to the local repo that handles it.
 * Delegates to shared-tools.js findServiceForEndpoint for routing,
 * then enriches with framework info from REPO_FRAMEWORKS.
 * @param {string} endpointPath - e.g. "/v3/ai/bizai_chats"
 * @returns {{ repo: string, repoPath: string|null, framework: string, matched: boolean }}
 */
function mapPathToRepo(endpointPath) {
  const serviceInfo = findServiceForEndpoint(endpointPath);
  const repo = serviceInfo.repository;
  const repoPath = REPO_PATHS[repo];
  const exists = repoPath && fs.existsSync(repoPath);
  const framework = REPO_FRAMEWORKS[repo] || 'rails';

  return {
    repo,
    repoPath: exists ? repoPath : null,
    framework,
    matched: serviceInfo.found
  };
}

/**
 * Search a NestJS repo for token restrictions on a specific endpoint
 * Looks for @Controller decorators and ActorType checks in the handler
 * @param {string} repoPath - Absolute path to the repo
 * @param {string} endpointPath - e.g. "/v3/ai/bizai_chats"
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @returns {{ tokens: string[], source: string|null, confidence: string }}
 */
function searchNestController(repoPath, endpointPath, method) {
  const srcDir = path.join(repoPath, 'src');
  if (!fs.existsSync(srcDir)) {
    return { tokens: DEFAULT_TOKENS, source: null, confidence: 'default' };
  }

  // Extract the controller route segment from the endpoint path
  // e.g. "/v3/ai/bizai_chats" -> "bizai_chats" or "v3/ai/bizai_chats"
  const pathSegments = endpointPath.replace(/^\//, '').split('/');

  // Try to find controller files
  const controllerFiles = findFilesRecursive(srcDir, '.controller.ts');

  for (const file of controllerFiles) {
    const content = fs.readFileSync(file, 'utf8');

    // Check if this controller handles the endpoint path
    const controllerPathMatch = content.match(/@Controller\(['"`]([^'"`]+)['"`]\)/);
    if (!controllerPathMatch) continue;

    const controllerPath = controllerPathMatch[1];
    if (!endpointPath.includes(controllerPath)) continue;

    // Found the controller - now look for ActorType restrictions
    const restrictedTokens = extractActorTypeRestrictions(content, method);
    if (restrictedTokens.length > 0) {
      return {
        tokens: restrictedTokens,
        source: path.relative(GITHUB_BASE, file),
        confidence: 'explicit'
      };
    }

    // No explicit restriction found in this controller
    return {
      tokens: DEFAULT_TOKENS,
      source: path.relative(GITHUB_BASE, file),
      confidence: 'default'
    };
  }

  // Check for authExcludePaths in app.module.ts
  const appModulePath = path.join(srcDir, 'app.module.ts');
  if (fs.existsSync(appModulePath)) {
    const appModule = fs.readFileSync(appModulePath, 'utf8');
    const excludeMatch = appModule.match(/authExcludePaths\s*:\s*\[([^\]]+)\]/);
    if (excludeMatch) {
      const excludePatterns = excludeMatch[1];
      // Check if our endpoint is excluded from auth
      for (const segment of pathSegments) {
        if (excludePatterns.includes(segment)) {
          return {
            tokens: [],
            source: path.relative(GITHUB_BASE, appModulePath),
            confidence: 'excluded'
          };
        }
      }
    }
  }

  return { tokens: DEFAULT_TOKENS, source: null, confidence: 'default' };
}

/**
 * Extract ActorType restrictions from controller source code
 * @param {string} content - Controller file content
 * @param {string} method - HTTP method
 * @returns {string[]} Token types found, or empty if no restrictions
 */
function extractActorTypeRestrictions(content, method) {
  const tokens = new Set();
  const typeMap = {
    'DIRECTORY': 'directory',
    'STAFF': 'staff',
    'BUSINESS': 'staff',
    'APP': 'app',
    'CLIENT': 'client',
    'OPERATOR': 'operator',
    'ADMIN': 'admin'
  };

  // Look for ActorType.X patterns near the relevant method decorator
  const methodDecorator = `@${method.charAt(0) + method.slice(1).toLowerCase()}`;
  const actorTypePattern = /ActorType\.(\w+)/g;

  let match;
  while ((match = actorTypePattern.exec(content)) !== null) {
    const actorType = match[1];
    if (typeMap[actorType]) {
      tokens.add(typeMap[actorType]);
    }
  }

  // If we found explicit checks with !== (exclusion), invert
  // e.g. "auth.actor.type !== ActorType.DIRECTORY" means ONLY directory
  const exclusionPattern = /!==\s*ActorType\.(\w+)/g;
  const exclusions = new Set();
  while ((match = exclusionPattern.exec(content)) !== null) {
    const actorType = match[1];
    if (typeMap[actorType]) {
      exclusions.add(typeMap[actorType]);
    }
  }

  if (exclusions.size > 0 && tokens.size === exclusions.size) {
    // All found types are exclusions: return only the excluded type
    return Array.from(exclusions);
  }

  return Array.from(tokens);
}

/**
 * Search a Rails repo for token restrictions on a specific endpoint
 * Looks at routes.rb to find controller, then checks before_actions
 * @param {string} repoPath - Absolute path to the repo
 * @param {string} endpointPath - e.g. "/platform/v1/conversations"
 * @param {string} method - HTTP method
 * @returns {{ tokens: string[], source: string|null, confidence: string }}
 */
function searchRailsController(repoPath, endpointPath, method) {
  // In Rails core, most endpoints accept all standard tokens through doorkeeper
  // Explicit restrictions are rare and happen at the business logic layer
  // We default to [staff, directory, client] for most endpoints

  const controllersDir = path.join(repoPath, 'app', 'controllers');
  if (!fs.existsSync(controllersDir)) {
    return { tokens: DEFAULT_TOKENS, source: null, confidence: 'default' };
  }

  // Try to derive controller path from endpoint URL
  // /platform/v1/conversations -> platform/v1/conversations_controller.rb
  const pathWithoutLeadingSlash = endpointPath.replace(/^\//, '');
  const segments = pathWithoutLeadingSlash.split('/').filter(s => !s.startsWith('{') && !s.startsWith(':'));

  // Try various controller path patterns
  const candidatePaths = buildRailsControllerCandidates(controllersDir, segments);

  for (const candidate of candidatePaths) {
    if (!fs.existsSync(candidate)) continue;

    const content = fs.readFileSync(candidate, 'utf8');
    const restrictions = extractRailsTokenRestrictions(content);

    if (restrictions.length > 0) {
      return {
        tokens: restrictions,
        source: path.relative(GITHUB_BASE, candidate),
        confidence: 'explicit'
      };
    }

    return {
      tokens: DEFAULT_TOKENS,
      source: path.relative(GITHUB_BASE, candidate),
      confidence: 'default'
    };
  }

  return { tokens: DEFAULT_TOKENS, source: null, confidence: 'default' };
}

/**
 * Build candidate controller file paths from URL segments
 */
function buildRailsControllerCandidates(controllersDir, segments) {
  const candidates = [];

  if (segments.length >= 2) {
    // Try: namespace/version/resource_controller.rb
    const last = segments[segments.length - 1];
    const namespacePath = segments.slice(0, -1).join('/');
    candidates.push(path.join(controllersDir, namespacePath, `${last}_controller.rb`));

    // Try without version: namespace/resource_controller.rb
    if (segments.length >= 3) {
      const withoutVersion = [...segments.slice(0, 1), ...segments.slice(2)];
      candidates.push(path.join(controllersDir, withoutVersion.slice(0, -1).join('/'), `${withoutVersion[withoutVersion.length - 1]}_controller.rb`));
    }
  }

  if (segments.length >= 1) {
    const last = segments[segments.length - 1];
    candidates.push(path.join(controllersDir, `${last}_controller.rb`));
  }

  return candidates;
}

/**
 * Extract token restrictions from a Rails controller
 */
function extractRailsTokenRestrictions(content) {
  const tokens = new Set();

  // Look for explicit token type checks
  const patterns = [
    /authorize_params\[:type\]\s*==\s*['"](\w+)['"]/g,
    /token_type\s*==\s*['"](\w+)['"]/g,
    /scope.*includes?\(['"](\w+)['"]\)/g,
  ];

  const typeMap = {
    'user': 'staff',
    'staff': 'staff',
    'directory': 'directory',
    'app': 'app',
    'application': 'app',
    'client': 'client',
    'admin': 'admin',
    'operator': 'operator'
  };

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const type = match[1].toLowerCase();
      if (typeMap[type]) {
        tokens.add(typeMap[type]);
      }
    }
  }

  return Array.from(tokens);
}

/**
 * Recursively find files matching a suffix
 */
function findFilesRecursive(dir, suffix, maxDepth = 6, depth = 0) {
  if (depth > maxDepth) return [];
  const results = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...findFilesRecursive(fullPath, suffix, maxDepth, depth + 1));
      } else if (entry.name.endsWith(suffix)) {
        results.push(fullPath);
      }
    }
  } catch {
    // Permission errors, etc.
  }

  return results;
}

/**
 * Search for token information for a given endpoint
 * @param {string} endpointPath - e.g. "/v3/ai/bizai_chats"
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @returns {{ tokens: string[], source: string|null, repo: string|null, confidence: string, repoFound: boolean }}
 */
function searchForTokens(endpointPath, method) {
  const mapping = mapPathToRepo(endpointPath);

  if (!mapping.matched) {
    return {
      tokens: DEFAULT_TOKENS,
      source: null,
      repo: null,
      confidence: 'unmapped',
      repoFound: false
    };
  }

  if (!mapping.repoPath) {
    return {
      tokens: DEFAULT_TOKENS,
      source: null,
      repo: mapping.repo,
      confidence: 'repo-not-found',
      repoFound: false
    };
  }

  let result;
  if (mapping.framework === 'nestjs') {
    result = searchNestController(mapping.repoPath, endpointPath, method);
  } else {
    result = searchRailsController(mapping.repoPath, endpointPath, method);
  }

  return {
    ...result,
    repo: mapping.repo,
    repoFound: true
  };
}

module.exports = {
  searchForTokens,
  mapPathToRepo,
  searchNestController,
  searchRailsController,
  DEFAULT_TOKENS
};
