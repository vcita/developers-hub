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
  'appstaff': 'app'
};

// Legacy x-auth-type values that should use staff token but are NOT proper documentation
// These will be treated as "missing token documentation" and fallback to staff
const LEGACY_AUTH_TYPES = [
  'application & application user',
  'application user',
  'none'
];

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
 * @returns {Object} { found: boolean, tokens: string[], raw: string|null, isLegacy: boolean }
 */
function extractFromAuthType(authType) {
  if (!authType) {
    return { found: false, tokens: [], raw: null, isLegacy: false };
  }
  
  const authTypeLower = authType.toLowerCase().trim();
  
  // Check if this is a legacy x-auth-type that doesn't provide proper token documentation
  // These endpoints typically accept staff tokens but the x-auth-type doesn't document it properly
  // Return found: false and empty tokens so:
  // 1. Tests will use staff token via fallback mechanism
  // 2. "missing token documentation" warning will be triggered
  if (LEGACY_AUTH_TYPES.includes(authTypeLower)) {
    return {
      found: false,
      tokens: [], // Empty - let fallback mechanism choose staff token
      raw: authType,
      isLegacy: true
    };
  }
  
  const tokens = parseTokenTypes(authType);
  
  return {
    found: tokens.length > 0,
    tokens,
    raw: authType,
    isLegacy: false
  };
}

/**
 * Extract token availability from an endpoint operation
 * Checks both description and x-auth-type
 * @param {Object} operation - OpenAPI operation object
 * @returns {Object} { found: boolean, tokens: string[], source: string, raw: string|null, isLegacy: boolean }
 */
function extractTokenInfo(operation) {
  if (!operation) {
    return { found: false, tokens: [], source: null, raw: null, isLegacy: false };
  }
  
  // First try description
  const fromDescription = extractFromDescription(operation.description);
  if (fromDescription.found) {
    return {
      ...fromDescription,
      source: 'description',
      isLegacy: false
    };
  }
  
  // Fall back to x-auth-type (legacy v1 endpoints)
  const authType = operation['x-auth-type'];
  if (authType) {
    const fromAuthType = extractFromAuthType(authType);
    // If it's a legacy auth type, return it even though found is false
    // This allows the test to use staff token fallback while still flagging missing docs
    if (fromAuthType.found || fromAuthType.isLegacy) {
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
    raw: null,
    isLegacy: false
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
 * Decode a JWT token without verification (for inspection only)
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
function decodeJWT(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

/**
 * Check if a client JWT token is valid (not expired and matches business)
 * @param {string} token - Client JWT token
 * @param {Object} configParams - Config params containing business_uid
 * @returns {Object} { valid: boolean, reason: string|null }
 */
function isValidClientToken(token, configParams) {
  if (!token) return { valid: false, reason: 'no_token' };
  
  const decoded = decodeJWT(token);
  if (!decoded) return { valid: false, reason: 'invalid_jwt' };
  
  // Check expiration
  if (decoded.exp) {
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    if (now > expiresAt) {
      const expiredAgo = Math.floor((now - expiresAt) / (1000 * 60 * 60 * 24));
      return { valid: false, reason: `expired_${expiredAgo}_days_ago` };
    }
  }
  
  // Check if token matches configured business_uid
  const tokenBusinessUid = decoded.extra?.business_uid;
  const configBusinessUid = configParams?.business_uid;
  
  if (configBusinessUid && tokenBusinessUid && tokenBusinessUid !== configBusinessUid) {
    return { 
      valid: false, 
      reason: `wrong_business_${tokenBusinessUid}_vs_${configBusinessUid}` 
    };
  }
  
  return { valid: true, reason: null };
}

/**
 * Get a valid (non-placeholder) token from config
 * @param {string} tokenType - Token type to get
 * @param {Object} configuredTokens - Token configuration object
 * @param {Object} configParams - Config params (optional, for client token validation)
 * @returns {string|null} Token value or null if placeholder/missing/invalid
 */
function getValidToken(tokenType, configuredTokens, configParams = null) {
  const token = configuredTokens?.[tokenType];
  if (!token || isPlaceholderToken(token)) {
    return null;
  }
  
  // For client tokens, perform additional validation
  if (tokenType === 'client' && configParams) {
    const { valid, reason } = isValidClientToken(token, configParams);
    if (!valid) {
      console.log(`  [Token] Client token invalid: ${reason}`);
      return null;
    }
  }
  
  return token;
}

// Privileged token types that should NOT use fallback
// These tokens have special permissions that other tokens don't have
const PRIVILEGED_TOKENS = ['internal', 'operator'];

/**
 * Get the first available token type that matches configured tokens
 * @param {string[]} requiredTokens - Token types required by endpoint
 * @param {Object} configuredTokens - Token configuration object
 * @param {Object} options - Additional options
 * @param {boolean} options.useFallback - Use fallback token when no required tokens specified or when required token is missing
 * @param {string} options.path - Endpoint path for path-based token preference
 * @param {Object} options.configParams - Config params for client token validation (business_uid, etc.)
 * @returns {Object} { tokenType: string|null, token: string|null, isFallback: boolean, shouldSkip: boolean, needsClientToken: boolean }
 */
function selectToken(requiredTokens, configuredTokens, options = {}) {
  const { useFallback = true, path = '', configParams = null } = options;
  
  // Check if this is a client-specific endpoint (either by path or documentation)
  const isClientPath = path.startsWith('/client');
  const requiresClientToken = requiredTokens && requiredTokens.includes('client');
  const isClientEndpoint = isClientPath || requiresClientToken;
  
  // Determine fallback order based on path
  // For /client/* paths, prioritize client token
  let fallbackOrder;
  if (isClientPath) {
    fallbackOrder = ['client', 'staff', 'directory', 'app', 'business', 'operator', 'internal'];
  } else {
    // Default priority order for fallback: staff, directory, app, business, client
    fallbackOrder = ['staff', 'directory', 'app', 'business', 'client', 'operator', 'internal'];
  }
  
  // If we have required tokens, try to match them
  if (requiredTokens && requiredTokens.length > 0) {
    for (const tokenType of requiredTokens) {
      // For client tokens, pass configParams for validation (expiry, business_uid match)
      const token = getValidToken(tokenType, configuredTokens, tokenType === 'client' ? configParams : null);
      if (token) {
        return {
          tokenType,
          token,
          isFallback: false,
          shouldSkip: false,
          needsClientToken: false
        };
      }
    }
    
    // Check if ALL required tokens are privileged (internal/operator only)
    // If so, don't use fallback - skip the test instead
    const allPrivileged = requiredTokens.every(t => PRIVILEGED_TOKENS.includes(t));
    if (allPrivileged) {
      return {
        tokenType: requiredTokens[0],
        token: null,
        isFallback: false,
        shouldSkip: true,
        skipReason: `Requires ${requiredTokens.join(' or ')} token (not configured)`,
        needsClientToken: false
      };
    }
    
    // If documentation explicitly requires client token and we don't have one,
    // signal that a client token needs to be acquired (don't fall back to staff)
    if (requiresClientToken) {
      // Check if client is the ONLY required token type
      const clientOnlyRequired = requiredTokens.length === 1 && requiredTokens[0] === 'client';
      if (clientOnlyRequired || isClientPath) {
        return {
          tokenType: 'client',
          token: null,
          isFallback: false,
          shouldSkip: false,
          needsClientToken: true,
          skipReason: 'Requires client token - use acquire_token(action="client_jwt") to obtain one'
        };
      }
    }
    
    // Required token not found/placeholder - try fallback if enabled
    if (useFallback) {
      for (const tokenType of fallbackOrder) {
        const token = getValidToken(tokenType, configuredTokens, tokenType === 'client' ? configParams : null);
        if (token) {
          return {
            tokenType,
            token,
            isFallback: true,
            shouldSkip: false,
            originalRequired: requiredTokens[0], // Track what was originally required
            needsClientToken: isClientEndpoint && tokenType !== 'client'
          };
        }
      }
    }
    
    // No matching token found for required types and no fallback available
    return {
      tokenType: requiredTokens[0], // Return first required for error message
      token: null,
      isFallback: false,
      shouldSkip: false,
      needsClientToken: requiresClientToken
    };
  }
  
  // No required tokens specified - use fallback if enabled
  // But if it's a /client/* path, prefer client token or signal we need one
  if (useFallback && configuredTokens) {
    for (const tokenType of fallbackOrder) {
      const token = getValidToken(tokenType, configuredTokens, tokenType === 'client' ? configParams : null);
      if (token) {
        return {
          tokenType,
          token,
          isFallback: true,
          needsClientToken: isClientPath && tokenType !== 'client'
        };
      }
    }
  }
  
  return { 
    tokenType: null, 
    token: null, 
    isFallback: false,
    needsClientToken: isClientPath
  };
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
  isValidClientToken,
  decodeJWT,
  TOKEN_NORMALIZATION,
  LEGACY_AUTH_TYPES
};
