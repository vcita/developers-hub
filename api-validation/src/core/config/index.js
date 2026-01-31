/**
 * Configuration management for API validation
 * Loads and merges configuration from default.json and tokens.json
 */

const fs = require('fs');
const path = require('path');
const { validateAndRefreshTokens, validateAllTokens } = require('./token-validator');

const CONFIG_DIR = path.join(__dirname, '../../../config');
const DEFAULT_CONFIG_PATH = path.join(CONFIG_DIR, 'default.json');
const TOKENS_CONFIG_PATH = path.join(CONFIG_DIR, 'tokens.json');

// Project root is developers-hub/ (parent of api-validation/)
const PROJECT_ROOT = path.join(__dirname, '../../../../');

// Rate limit presets
const RATE_LIMIT_PRESETS = {
  conservative: {
    requestsPerSecond: 2,
    maxConcurrent: 1,
    delayBetweenRequests: 500
  },
  normal: {
    requestsPerSecond: 5,
    maxConcurrent: 3,
    delayBetweenRequests: 200
  },
  aggressive: {
    requestsPerSecond: 20,
    maxConcurrent: 10,
    delayBetweenRequests: 50
  },
  sequential: {
    requestsPerSecond: 1,
    maxConcurrent: 1,
    delayBetweenRequests: 1000
  }
};

/**
 * Load configuration from JSON file
 * @param {string} filePath - Path to JSON config file
 * @returns {Object} Parsed configuration or empty object
 */
function loadConfigFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.warn(`Warning: Could not load config from ${filePath}: ${error.message}`);
  }
  return {};
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object to merge
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

/**
 * Load and merge all configuration
 * @param {Object} overrides - CLI or runtime overrides
 * @returns {Object} Complete configuration object
 */
function loadConfig(overrides = {}) {
  // Load default configuration
  const defaultConfig = loadConfigFile(DEFAULT_CONFIG_PATH);
  
  // Load tokens (separate file for security)
  const tokensConfig = loadConfigFile(TOKENS_CONFIG_PATH);
  
  // Merge configurations: default -> tokens -> overrides
  let config = deepMerge(defaultConfig, tokensConfig);
  config = deepMerge(config, overrides);
  
  // Apply rate limit preset if specified
  if (overrides.rateLimitPreset && RATE_LIMIT_PRESETS[overrides.rateLimitPreset]) {
    config.rateLimit = deepMerge(
      config.rateLimit || {},
      RATE_LIMIT_PRESETS[overrides.rateLimitPreset]
    );
  }
  
  // Resolve swagger path relative to repo root (developers-hub/)
  if (config.swaggerPath && !path.isAbsolute(config.swaggerPath)) {
    config.swaggerPath = path.resolve(PROJECT_ROOT, config.swaggerPath);
  }
  
  return config;
}

/**
 * Get configuration with tokens and params masked for display
 * @param {Object} config - Full configuration object
 * @returns {Object} Configuration with masked sensitive values
 */
function getMaskedConfig(config) {
  const masked = JSON.parse(JSON.stringify(config));
  
  if (masked.tokens) {
    for (const key of Object.keys(masked.tokens)) {
      if (masked.tokens[key] && masked.tokens[key].length > 0) {
        masked.tokens[key] = masked.tokens[key].substring(0, 10) + '...';
      }
    }
  }
  
  // Mask params (they may contain sensitive IDs)
  if (masked.params) {
    for (const key of Object.keys(masked.params)) {
      if (masked.params[key] && masked.params[key].length > 0 && !masked.params[key].includes('your-')) {
        masked.params[key] = masked.params[key].substring(0, 8) + '...';
      }
    }
  }
  
  // Mask AI API keys
  if (masked.ai) {
    if (masked.ai.anthropicApiKey && masked.ai.anthropicApiKey.length > 0) {
      masked.ai.anthropicApiKey = masked.ai.anthropicApiKey.substring(0, 10) + '...';
    }
    if (masked.ai.openaiApiKey && masked.ai.openaiApiKey.length > 0) {
      masked.ai.openaiApiKey = masked.ai.openaiApiKey.substring(0, 10) + '...';
    }
  }
  
  return masked;
}

/**
 * Validate configuration has required fields
 * @param {Object} config - Configuration to validate
 * @returns {Object} { valid: boolean, errors: string[], warnings: string[] }
 */
function validateConfig(config) {
  const errors = [];
  const warnings = [];
  
  if (!config.baseUrl) {
    errors.push('baseUrl is required');
  }
  
  if (!config.swaggerPath) {
    errors.push('swaggerPath is required');
  } else if (!fs.existsSync(config.swaggerPath)) {
    errors.push(`swaggerPath does not exist: ${config.swaggerPath}`);
  }
  
  if (!config.tokens || Object.keys(config.tokens).length === 0) {
    errors.push('At least one token must be configured');
  }
  
  // Check if at least one token has a value
  const hasToken = config.tokens && Object.values(config.tokens).some(t => t && t.length > 0);
  if (!hasToken) {
    errors.push('At least one token must have a value. Copy tokens.example.json to tokens.json and fill in your tokens.');
  }
  
  // Check for static params - warn if not configured
  const staticParams = ['business_id', 'business_uid', 'staff_id', 'directory_id'];
  const configuredParams = Object.keys(config.params || {}).filter(
    p => config.params[p] && !config.params[p].includes('your-')
  );
  
  if (configuredParams.length === 0) {
    warnings.push(
      'No static params configured (business_id, staff_id, etc.). ' +
      'Add them to tokens.json params section for endpoints that require them.'
    );
  } else {
    const missingStatic = staticParams.filter(p => !configuredParams.includes(p));
    if (missingStatic.length > 0) {
      warnings.push(
        `Some static params not configured: ${missingStatic.join(', ')}. ` +
        'These may be needed for certain endpoints.'
      );
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Load configuration and validate/refresh tokens
 * @param {Object} overrides - CLI or runtime overrides
 * @returns {Promise<Object>} Complete configuration with validated tokens
 */
async function loadConfigWithTokenValidation(overrides = {}) {
  const config = loadConfig(overrides);
  
  // Validate and refresh tokens
  const { config: updatedConfig, validation } = await validateAndRefreshTokens(config);
  
  return {
    config: updatedConfig,
    tokenValidation: validation
  };
}

/**
 * Synchronously validate tokens (for quick checks without refresh)
 * @param {Object} tokens - Token configuration
 * @returns {Object} Validation result
 */
function validateTokensSync(tokens) {
  return validateAllTokens(tokens);
}

module.exports = {
  loadConfig,
  loadConfigWithTokenValidation,
  getMaskedConfig,
  validateConfig,
  validateTokensSync,
  RATE_LIMIT_PRESETS
};
