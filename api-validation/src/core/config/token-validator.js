/**
 * Token Validator
 * Validates JWT tokens and handles auto-refresh for expired tokens
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TOKENS_CONFIG_PATH = path.join(__dirname, '../../../config/tokens.json');

/**
 * Decode a JWT token without verification (just to read payload)
 * @param {string} token - JWT token string
 * @returns {Object|null} Decoded payload or null if invalid
 */
function decodeJwt(token) {
  if (!token || typeof token !== 'string') return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (second part)
    const payload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payload);
  } catch (error) {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token string
 * @param {number} bufferSeconds - Buffer time before expiration to consider token expired (default: 60)
 * @returns {Object} { valid: boolean, expired: boolean, expiresAt: Date|null, payload: Object|null }
 */
function validateJwtToken(token, bufferSeconds = 60) {
  const payload = decodeJwt(token);
  
  if (!payload) {
    return { valid: false, expired: false, expiresAt: null, payload: null, reason: 'Invalid JWT format' };
  }
  
  if (!payload.exp) {
    // Token has no expiration - consider it valid
    return { valid: true, expired: false, expiresAt: null, payload, reason: null };
  }
  
  const expiresAt = new Date(payload.exp * 1000);
  const now = new Date();
  const bufferMs = bufferSeconds * 1000;
  
  const expired = (expiresAt.getTime() - bufferMs) <= now.getTime();
  
  return {
    valid: !expired,
    expired,
    expiresAt,
    payload,
    reason: expired ? `Token expired at ${expiresAt.toISOString()}` : null
  };
}

/**
 * Check if a token looks like a JWT (starts with eyJ)
 * @param {string} token - Token string
 * @returns {boolean}
 */
function isJwtToken(token) {
  return token && typeof token === 'string' && token.startsWith('eyJ');
}

/**
 * Validate all tokens in config
 * @param {Object} tokens - Token configuration object
 * @returns {Object} { valid: Object, expired: Object, errors: string[] }
 */
function validateAllTokens(tokens) {
  const result = {
    valid: {},
    expired: {},
    invalid: {},
    errors: [],
    warnings: []
  };
  
  for (const [tokenType, token] of Object.entries(tokens)) {
    if (!token || token.includes('your-') || token.includes('...')) {
      // Skip placeholder tokens
      continue;
    }
    
    if (isJwtToken(token)) {
      const validation = validateJwtToken(token);
      
      if (validation.valid) {
        result.valid[tokenType] = {
          expiresAt: validation.expiresAt,
          payload: validation.payload
        };
      } else if (validation.expired) {
        result.expired[tokenType] = {
          expiresAt: validation.expiresAt,
          payload: validation.payload
        };
        result.warnings.push(`${tokenType} token is expired (expired at ${validation.expiresAt?.toISOString()})`);
      } else {
        result.invalid[tokenType] = { reason: validation.reason };
        result.errors.push(`${tokenType} token is invalid: ${validation.reason}`);
      }
    } else {
      // Non-JWT token (e.g., OAuth access token) - assume valid
      result.valid[tokenType] = { isJwt: false };
    }
  }
  
  return result;
}

/**
 * Make an HTTP/HTTPS request
 * @param {string} url - Full URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Generate a new client token using the client authentication API
 * @param {Object} config - Configuration with baseUrl and params
 * @returns {Promise<string|null>} New token or null if failed
 */
async function generateClientToken(config) {
  const { baseUrl, params } = config;
  const { business_uid, client_uid } = params || {};
  
  if (!business_uid || !client_uid) {
    console.log('  Cannot generate client token: missing business_uid or client_uid in config');
    return null;
  }
  
  console.log(`  Attempting to generate new client token for client ${client_uid}...`);
  
  // The baseUrl might be the API gateway (e.g., https://app.meet2know.com/apigw)
  // Client authentication endpoints are at the root (e.g., https://app.meet2know.com/api/...)
  // So we need to extract the root URL
  const rootUrl = baseUrl.replace(/\/apigw\/?$/, '');
  console.log(`  Using root URL: ${rootUrl}`);
  
  try {
    // Try the dev-mode flow (works in development/integration environments)
    // Use api2 instead of api for client authentication endpoints
    const sendCodeUrl = `${rootUrl}/api2/client_api/v1/portals/${business_uid}/authentications/send_code`;
    
    // First, we need to get the client's email - try to fetch the client
    // This endpoint IS through the API gateway
    const clientUrl = `${baseUrl}/platform/v1/clients/${client_uid}`;
    
    // Use staff token to get client info
    const staffToken = config.tokens?.staff;
    if (!staffToken) {
      console.log('  Cannot generate client token: no staff token available to fetch client email');
      return null;
    }
    
    console.log('  Fetching client email using staff token...');
    const clientResponse = await makeRequest(clientUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staffToken}`
      }
    });
    
    // Handle different response structures:
    // - /platform/v1/clients/{uid} returns: { status: "OK", data: { client: { email: "..." } } }
    // - Some endpoints return: { data: { email: "..." } }
    const clientData = clientResponse.data?.data?.client || clientResponse.data?.data || clientResponse.data?.client;
    const clientEmail = clientData?.email;
    
    if (clientResponse.status !== 200 || !clientEmail) {
      console.log(`  Failed to fetch client info: status=${clientResponse.status}, email found=${!!clientEmail}`);
      console.log(`  Response: ${JSON.stringify(clientResponse.data)}`);
      return null;
    }
    console.log(`  Found client email: ${clientEmail}`);
    
    // In dev/integration mode, add .dev suffix to get token directly
    // This triggers the dev mode in the controller that returns the auth token
    const devEmail = clientEmail.endsWith('.dev') ? clientEmail : `${clientEmail}.dev`;
    
    console.log(`  Sending login link to ${devEmail} (dev mode)...`);
    
    // Use send_login_link endpoint which returns token directly in dev mode
    // Client API endpoints use api2 path
    const sendLoginLinkUrl = `${rootUrl}/api2/client_api/v1/portals/${business_uid}/authentications/send_login_link`;
    const sendLoginLinkResponse = await makeRequest(sendLoginLinkUrl, {
      method: 'POST',
      body: { email: devEmail, portal_id: business_uid }
    });
    
    console.log(`  send_login_link response: status=${sendLoginLinkResponse.status}, data=${JSON.stringify(sendLoginLinkResponse.data)}`);
    
    if (sendLoginLinkResponse.status === 200 && sendLoginLinkResponse.data?.token) {
      // In dev mode, we get the auth token directly
      const authToken = sendLoginLinkResponse.data.token;
      console.log(`  Got auth token from dev mode: ${authToken.substring(0, 20)}...`);
      console.log('  Exchanging auth token for JWT...');
      
      // Exchange auth token for JWT
      const exchangeUrl = `${rootUrl}/api2/client_api/v1/portals/${business_uid}/authentications/get_jwt_token_from_authentication_token`;
      const exchangeResponse = await makeRequest(exchangeUrl, {
        method: 'POST',
        body: { auth_token: authToken, portal_id: business_uid }
      });
      
      console.log(`  exchange response: status=${exchangeResponse.status}`);
      
      if (exchangeResponse.status === 200 && exchangeResponse.data?.token) {
        console.log('  ✓ Successfully generated new client token!');
        return exchangeResponse.data.token;
      } else {
        console.log(`  Failed to exchange auth token: ${JSON.stringify(exchangeResponse.data)}`);
      }
    } else {
      // Try send_code as fallback
      console.log(`  send_login_link didn't return token, trying send_code...`);
      const sendCodeResponse = await makeRequest(sendCodeUrl, {
        method: 'POST',
        body: { email: devEmail, portal_id: business_uid }
      });
      
      console.log(`  send_code response: status=${sendCodeResponse.status}, data=${JSON.stringify(sendCodeResponse.data)}`);
      
      if (sendCodeResponse.status === 200 && sendCodeResponse.data?.token) {
        const authToken = sendCodeResponse.data.token;
        console.log(`  Got auth token from send_code: ${authToken.substring(0, 20)}...`);
        
        // Exchange auth token for JWT
        const exchangeUrl = `${rootUrl}/api2/client_api/v1/portals/${business_uid}/authentications/get_jwt_token_from_authentication_token`;
        const exchangeResponse = await makeRequest(exchangeUrl, {
          method: 'POST',
          body: { auth_token: authToken, portal_id: business_uid }
        });
        
        if (exchangeResponse.status === 200 && exchangeResponse.data?.token) {
          console.log('  ✓ Successfully generated new client token!');
          return exchangeResponse.data.token;
        }
      }
    }
    
    console.log('  ');
    console.log('  ┌──────────────────────────────────────────────────────────────┐');
    console.log('  │ Client token auto-refresh failed (endpoints not accessible)  │');
    console.log('  │                                                              │');
    console.log('  │ To manually refresh, run in terminal:                        │');
    console.log('  │                                                              │');
    console.log(`  │ devspace enter -c core -- bash -c "rails runner \\"token =   │`);
    console.log(`  │   Components::AuthenticationAPI::Client.                     │`);
    console.log(`  │   generate_new_token_for_new_client(                         │`);
    console.log(`  │     client_uid: '${client_uid}',                     │`);
    console.log(`  │     business_uid: '${business_uid}'); puts token\\""     │`);
    console.log('  │                                                              │');
    console.log('  │ Then paste the token into tokens.json under "client"         │');
    console.log('  └──────────────────────────────────────────────────────────────┘');
    console.log('  ');
    return null;
  } catch (error) {
    console.log(`  Error generating client token: ${error.message}`);
    return null;
  }
}

/**
 * Update tokens.json with a new token value
 * @param {string} tokenType - Token type to update
 * @param {string} newToken - New token value
 * @returns {boolean} Success status
 */
function updateTokensFile(tokenType, newToken) {
  try {
    let config = {};
    
    if (fs.existsSync(TOKENS_CONFIG_PATH)) {
      const content = fs.readFileSync(TOKENS_CONFIG_PATH, 'utf8');
      config = JSON.parse(content);
    }
    
    if (!config.tokens) {
      config.tokens = {};
    }
    
    config.tokens[tokenType] = newToken;
    
    fs.writeFileSync(TOKENS_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`  ✓ Updated ${tokenType} token in tokens.json`);
    return true;
  } catch (error) {
    console.error(`  Failed to update tokens.json: ${error.message}`);
    return false;
  }
}

/**
 * Validate tokens and attempt to refresh expired ones
 * @param {Object} config - Full configuration object
 * @returns {Promise<Object>} Updated config with refreshed tokens
 */
async function validateAndRefreshTokens(config) {
  console.log('\n🔐 Validating tokens...');
  
  const validation = validateAllTokens(config.tokens || {});
  
  // Log valid tokens
  for (const tokenType of Object.keys(validation.valid)) {
    const info = validation.valid[tokenType];
    if (info.expiresAt) {
      console.log(`  ✓ ${tokenType}: valid (expires ${info.expiresAt.toISOString()})`);
    } else {
      console.log(`  ✓ ${tokenType}: valid`);
    }
  }
  
  // Handle expired tokens
  for (const tokenType of Object.keys(validation.expired)) {
    const info = validation.expired[tokenType];
    console.log(`  ✗ ${tokenType}: EXPIRED (was valid until ${info.expiresAt?.toISOString()})`);
    
    // Try to auto-generate for supported token types
    if (tokenType === 'client') {
      const newToken = await generateClientToken(config);
      if (newToken) {
        config.tokens.client = newToken;
        updateTokensFile('client', newToken);
        validation.valid.client = validateJwtToken(newToken);
        delete validation.expired.client;
      } else {
        console.log(`  ⚠ Could not auto-generate ${tokenType} token. Please refresh manually.`);
      }
    } else {
      console.log(`  ⚠ Auto-refresh not supported for ${tokenType} tokens. Please refresh manually.`);
    }
  }
  
  // Log invalid tokens
  for (const tokenType of Object.keys(validation.invalid)) {
    console.log(`  ✗ ${tokenType}: INVALID (${validation.invalid[tokenType].reason})`);
  }
  
  return {
    config,
    validation: {
      ...validation,
      hasExpiredTokens: Object.keys(validation.expired).length > 0,
      hasInvalidTokens: Object.keys(validation.invalid).length > 0
    }
  };
}

module.exports = {
  decodeJwt,
  validateJwtToken,
  isJwtToken,
  validateAllTokens,
  generateClientToken,
  updateTokensFile,
  validateAndRefreshTokens
};
