/**
 * Token Parser
 * Extracts token availability information from endpoint descriptions
 */

// Token type normalization map
const TOKEN_NORMALIZATION = {
  'staff tokens': 'staff',
  'staff token': 'staff',
  'staff': 'staff',
  'directory tokens': 'directory',
  'directory token': 'directory',
  'directory': 'directory',
  'client tokens': 'client',
  'client token': 'client',
  'client': 'client',
  'business tokens': 'business',
  'business token': 'business',
  'business': 'business',
  'app tokens': 'app',
  'app token': 'app',
  'app': 'app',
  'application tokens': 'app',
  'application token': 'app',
  'application': 'app',
  'internal tokens': 'internal',
  'internal token': 'internal',
  'internal': 'internal',
  'operator tokens': 'operator',
  'operator token': 'operator',
  'operator': 'operator',
  'application & application user': 'app',
  'appstaff': 'app'
};

// Regex patterns for extracting token information from descriptions
const TOKEN_PATTERNS = [
  // Pattern: "Available for **Staff Tokens**"
  /[Aa]vailable for \*\*([^*]+)\*\*/g,
  // Pattern: "**Available for Staff tokens only**"
  /\*\*[Aa]vailable for ([^*]+?)(?:\s+only)?\*\*/g,
  // Pattern: "**Only available for Directory Tokens**"
  /\*\*[Oo]nly [Aa]vailable for ([^*]+)\*\*/g,
  // Pattern: "Only available for **Directory Tokens**"
  /[Oo]nly [Aa]vailable for \*\*([^*]+)\*\*/g,
  // Pattern: Simple "Available for Staff and Directory tokens"
  /[Aa]vailable for ([A-Za-z,\s&]+(?:tokens?|Tokens?))/gi
];

/**
 * Normalize a token type string to standard format
 * @param {string} tokenStr - Raw token string
 * @returns {string|null} Normalized token type or null
 */
function normalizeTokenType(tokenStr) {
  if (!tokenStr) return null;
  
  const normalized = tokenStr.toLowerCase().trim();
  return TOKEN_NORMALIZATION[normalized] || null;
}

/**
 * Parse token types from a matched string
 * Handles combinations like "Directory, Business, and Client Tokens"
 * @param {string} tokenMatch - Matched token string
 * @returns {string[]} Array of normalized token types
 */
function parseTokenTypes(tokenMatch) {
  if (!tokenMatch) return [];
  
  // Clean up the match
  let cleaned = tokenMatch
    .replace(/tokens?/gi, '')
    .replace(/only/gi, '')
    .trim();
  
  // Split on various separators: ", ", " and ", " or ", " & "
  const parts = cleaned.split(/\s*(?:,\s*|\s+and\s+|\s+or\s+|\s*&\s*)\s*/i);
  
  const tokens = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed) {
      const normalized = normalizeTokenType(trimmed + ' tokens');
      if (normalized && !tokens.includes(normalized)) {
        tokens.push(normalized);
      }
    }
  }
  
  return tokens;
}

/**
 * Extract token availability from endpoint description
 * @param {string} description - Endpoint description text
 * @returns {Object} { found: boolean, tokens: string[], raw: string|null }
 */
function extractFromDescription(description) {
  if (!description) {
    return { found: false, tokens: [], raw: null };
  }
  
  const allTokens = new Set();
  let rawMatch = null;
  
  for (const pattern of TOKEN_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    
    let match;
    while ((match = pattern.exec(description)) !== null) {
      rawMatch = match[1];
      const tokens = parseTokenTypes(match[1]);
      tokens.forEach(t => allTokens.add(t));
    }
  }
  
  return {
    found: allTokens.size > 0,
    tokens: Array.from(allTokens),
    raw: rawMatch
  };
}

/**
 * Extract token availability from x-auth-type field (legacy v1 endpoints)
 * @param {string} authType - x-auth-type field value
 * @returns {Object} { found: boolean, tokens: string[], raw: string|null }
 */
function extractFromAuthType(authType) {
  if (!authType) {
    return { found: false, tokens: [], raw: null };
  }
  
  const tokens = parseTokenTypes(authType);
  
  // Special handling for "Application & Application User"
  if (authType.toLowerCase().includes('application')) {
    if (!tokens.includes('app')) {
      tokens.push('app');
    }
  }
  
  return {
    found: tokens.length > 0,
    tokens,
    raw: authType
  };
}

/**
 * Extract token availability from an endpoint operation
 * Checks both description and x-auth-type
 * @param {Object} operation - OpenAPI operation object
 * @returns {Object} { found: boolean, tokens: string[], source: string, raw: string|null }
 */
function extractTokenInfo(operation) {
  if (!operation) {
    return { found: false, tokens: [], source: null, raw: null };
  }
  
  // First try description
  const fromDescription = extractFromDescription(operation.description);
  if (fromDescription.found) {
    return {
      ...fromDescription,
      source: 'description'
    };
  }
  
  // Fall back to x-auth-type (legacy v1 endpoints)
  const authType = operation['x-auth-type'];
  if (authType) {
    const fromAuthType = extractFromAuthType(authType);
    if (fromAuthType.found) {
      return {
        ...fromAuthType,
        source: 'x-auth-type'
      };
    }
  }
  
  // Not found in either location
  return {
    found: false,
    tokens: [],
    source: null,
    raw: null
  };
}

/**
 * Check if a token value is a placeholder (not a real token)
 * @param {string} token - Token value to check
 * @returns {boolean} True if placeholder
 */
function isPlaceholderToken(token) {
  if (!token || typeof token !== 'string') return true;
  
  // Common placeholder patterns
  const placeholderPatterns = [
    /your[- ]/i,           // "your-token", "your token"
    /\(your /i,            // "(your client JWT token)"
    /placeholder/i,
    /example/i,
    /xxx+/i,
    /^\s*$/,               // Empty or whitespace
    /^eyJ\.\.\./i,         // "eyJ..." truncated
  ];
  
  return placeholderPatterns.some(pattern => pattern.test(token));
}

/**
 * Get a valid (non-placeholder) token from config
 * @param {string} tokenType - Token type to get
 * @param {Object} configuredTokens - Token configuration object
 * @returns {string|null} Token value or null if placeholder/missing
 */
function getValidToken(tokenType, configuredTokens) {
  const token = configuredTokens?.[tokenType];
  if (!token || isPlaceholderToken(token)) {
    return null;
  }
  return token;
}

/**
 * Get the first available token type that matches configured tokens
 * @param {string[]} requiredTokens - Token types required by endpoint
 * @param {Object} configuredTokens - Token configuration object
 * @param {Object} options - Additional options
 * @param {boolean} options.useFallback - Use fallback token when no required tokens specified or when required token is missing
 * @returns {Object} { tokenType: string|null, token: string|null, isFallback: boolean }
 */
function selectToken(requiredTokens, configuredTokens, options = {}) {
  const { useFallback = true } = options;
  
  // Priority order for fallback: staff, directory, app, business, client
  const fallbackOrder = ['staff', 'directory', 'app', 'business', 'client', 'operator', 'internal'];
  
  // If we have required tokens, try to match them
  if (requiredTokens && requiredTokens.length > 0) {
    for (const tokenType of requiredTokens) {
      const token = getValidToken(tokenType, configuredTokens);
      if (token) {
        return {
          tokenType,
          token,
          isFallback: false
        };
      }
    }
    
    // Required token not found/placeholder - try fallback if enabled
    if (useFallback) {
      for (const tokenType of fallbackOrder) {
        const token = getValidToken(tokenType, configuredTokens);
        if (token) {
          return {
            tokenType,
            token,
            isFallback: true,
            originalRequired: requiredTokens[0] // Track what was originally required
          };
        }
      }
    }
    
    // No matching token found for required types and no fallback available
    return {
      tokenType: requiredTokens[0], // Return first required for error message
      token: null,
      isFallback: false
    };
  }
  
  // No required tokens specified - use fallback if enabled
  if (useFallback && configuredTokens) {
    for (const tokenType of fallbackOrder) {
      const token = getValidToken(tokenType, configuredTokens);
      if (token) {
        return {
          tokenType,
          token,
          isFallback: true
        };
      }
    }
  }
  
  return { tokenType: null, token: null, isFallback: false };
}

module.exports = {
  extractFromDescription,
  extractFromAuthType,
  extractTokenInfo,
  normalizeTokenType,
  parseTokenTypes,
  selectToken,
  isPlaceholderToken,
  getValidToken,
  TOKEN_NORMALIZATION
};
