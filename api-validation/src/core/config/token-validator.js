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
      // If body is already a string (e.g., form-urlencoded), write it directly
      // Otherwise, stringify it as JSON
      const bodyData = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      req.write(bodyData);
    }

    req.end();
  });
}

/**
 * Generate a new staff JWT token using OAuth flow
 * Step 1: Get OAuth access token using client_id/client_secret + username/password
 * Step 2: Exchange access token for JWT via /api2/v2/staff_authentications/jwt_login
 *
 * @param {Object} config - Configuration with baseUrl and staffAuth credentials
 * @returns {Promise<string|null>} New JWT token or null if failed
 */
async function generateStaffJwt(config) {
  const { baseUrl, staffAuth } = config;

  if (!staffAuth?.oauth_client_id || !staffAuth?.oauth_client_secret || !staffAuth?.username || !staffAuth?.password) {
    console.log('  Cannot generate staff JWT: missing staffAuth credentials in config');
    console.log('  Required: oauth_client_id, oauth_client_secret, username, password');
    return null;
  }

  if (!staffAuth.autoRefresh) {
    console.log('  Staff JWT auto-refresh is disabled');
    return null;
  }

  console.log('  🔄 Generating new staff JWT token...');

  // Extract root URL (remove /apigw if present)
  const rootUrl = baseUrl?.replace(/\/apigw\/?$/, '') || 'https://app.meet2know.com';

  try {
    // Step 1: Get OAuth access token
    console.log('  Step 1: Getting OAuth access token...');

    const basicAuth = Buffer.from(`${staffAuth.oauth_client_id}:${staffAuth.oauth_client_secret}`).toString('base64');
    const oauthUrl = `${rootUrl}/apigw/oauth/token`;

    const oauthResponse = await makeRequest(oauthUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=password&username=${encodeURIComponent(staffAuth.username)}&password=${encodeURIComponent(staffAuth.password)}`
    });

    if (oauthResponse.status !== 200 || !oauthResponse.data?.access_token) {
      console.log(`  ✗ OAuth failed: status=${oauthResponse.status}`);
      console.log(`    Response: ${JSON.stringify(oauthResponse.data)}`);
      return null;
    }

    const accessToken = oauthResponse.data.access_token;
    console.log(`  ✓ Got OAuth access token: ${accessToken.substring(0, 20)}...`);

    // Step 2: Exchange for JWT
    console.log('  Step 2: Exchanging for JWT...');

    const jwtUrl = `${rootUrl}/api2/v2/staff_authentications/jwt_login`;
    const jwtResponse = await makeRequest(jwtUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (jwtResponse.status !== 200 && jwtResponse.status !== 201) {
      console.log(`  ✗ JWT exchange failed: status=${jwtResponse.status}`);
      console.log(`    Response: ${JSON.stringify(jwtResponse.data)}`);
      return null;
    }

    const jwtToken = jwtResponse.data?.token || jwtResponse.data?.data?.token;

    if (!jwtToken) {
      console.log(`  ✗ No JWT token in response: ${JSON.stringify(jwtResponse.data)}`);
      return null;
    }

    console.log(`  ✓ Got new staff JWT: ${jwtToken.substring(0, 30)}...`);

    // Decode to show expiry
    const payload = decodeJwt(jwtToken);
    if (payload?.exp) {
      const expiresAt = new Date(payload.exp * 1000);
      console.log(`  ✓ JWT expires at: ${expiresAt.toISOString()}`);
    }

    return jwtToken;

  } catch (error) {
    console.log(`  ✗ Error generating staff JWT: ${error.message}`);
    return null;
  }
}

/**
 * Generate a new client token using the client authentication API
 * Uses .dev suffix trick for development/integration environments
 *
 * @param {Object} config - Configuration with baseUrl, params, and clientAuth
 * @returns {Promise<string|null>} New JWT token or null if failed
 */
async function generateClientToken(config) {
  const { baseUrl, params, clientAuth } = config;
  const { business_uid } = params || {};

  if (!business_uid) {
    console.log('  Cannot generate client token: missing business_uid in config');
    return null;
  }

  if (!clientAuth?.autoRefresh) {
    console.log('  Client token auto-refresh is disabled');
    return null;
  }

  // Get client email from clientAuth config or fetch it via API
  let clientEmail = clientAuth?.email;

  console.log('  🔄 Generating new client JWT token...');

  // Extract root URL (remove /apigw if present)
  const rootUrl = baseUrl?.replace(/\/apigw\/?$/, '') || 'https://app.meet2know.com';

  // If no email in clientAuth, try to fetch it using client_uid
  if (!clientEmail && params?.client_uid) {
    const staffToken = config.tokens?.staff;
    if (!staffToken) {
      console.log('  Cannot generate client token: no email in clientAuth and no staff token to fetch it');
      return null;
    }

    console.log(`  Fetching client email for ${params.client_uid}...`);
    const clientUrl = `${baseUrl}/platform/v1/clients/${params.client_uid}`;
    const clientResponse = await makeRequest(clientUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });

    const clientData = clientResponse.data?.data?.client || clientResponse.data?.data || clientResponse.data?.client;
    clientEmail = clientData?.email;

    if (!clientEmail) {
      console.log(`  Failed to fetch client email: ${JSON.stringify(clientResponse.data)}`);
      return null;
    }
    console.log(`  Found client email: ${clientEmail}`);
  }

  if (!clientEmail) {
    console.log('  Cannot generate client token: no email available');
    return null;
  }

  try {
    // In dev/integration mode, add .dev suffix to get token directly
    const devEmail = clientEmail.endsWith('.dev') ? clientEmail : `${clientEmail}.dev`;
    console.log(`  Step 1: Getting auth token for ${devEmail} (dev mode)...`);
    
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
  
  // Log valid tokens and check for soon-to-expire tokens
  const PROACTIVE_REFRESH_BUFFER_MS = 2 * 60 * 1000; // Refresh if expiring within 2 minutes

  for (const tokenType of Object.keys(validation.valid)) {
    const info = validation.valid[tokenType];
    if (info.expiresAt) {
      const timeUntilExpiry = info.expiresAt.getTime() - Date.now();
      const expiresInMinutes = Math.round(timeUntilExpiry / 60000);

      if (timeUntilExpiry < PROACTIVE_REFRESH_BUFFER_MS && timeUntilExpiry > 0) {
        // Token is about to expire - refresh proactively
        console.log(`  ⚠ ${tokenType}: expiring soon (${expiresInMinutes} min) - refreshing proactively...`);

        if (tokenType === 'staff') {
          const newToken = await generateStaffJwt(config);
          if (newToken) {
            config.tokens.staff = newToken;
            updateTokensFile('staff', newToken);
            validation.valid.staff = validateJwtToken(newToken);
            console.log(`  ✓ ${tokenType}: refreshed successfully`);
          } else {
            console.log(`  ⚠ ${tokenType}: proactive refresh failed, using existing token`);
          }
        } else if (tokenType === 'client') {
          const newToken = await generateClientToken(config);
          if (newToken) {
            config.tokens.client = newToken;
            updateTokensFile('client', newToken);
            validation.valid.client = validateJwtToken(newToken);
            console.log(`  ✓ ${tokenType}: refreshed successfully`);
          } else {
            console.log(`  ⚠ ${tokenType}: proactive refresh failed, using existing token`);
          }
        }
      } else {
        console.log(`  ✓ ${tokenType}: valid (expires in ${expiresInMinutes} min)`);
      }
    } else {
      console.log(`  ✓ ${tokenType}: valid (no expiry)`);
    }
  }

  // Handle expired tokens
  for (const tokenType of Object.keys(validation.expired)) {
    const info = validation.expired[tokenType];
    console.log(`  ✗ ${tokenType}: EXPIRED (was valid until ${info.expiresAt?.toISOString()})`);
    
    // Try to auto-generate for supported token types
    if (tokenType === 'staff') {
      const newToken = await generateStaffJwt(config);
      if (newToken) {
        config.tokens.staff = newToken;
        updateTokensFile('staff', newToken);
        validation.valid.staff = validateJwtToken(newToken);
        delete validation.expired.staff;
      } else {
        console.log(`  ⚠ Could not auto-generate ${tokenType} token. Please refresh manually.`);
      }
    } else if (tokenType === 'client') {
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

/**
 * Validate that the staff token is associated with the configured business
 * This catches the subtle case where a staff token exists but belongs to a different business
 * 
 * @param {Object} config - Full configuration object with tokens and params
 * @returns {Promise<Object>} { valid: boolean, error: string|null }
 */
async function validateTokenBusinessAssociation(config) {
  const { tokens, params, baseUrl } = config;
  const staffToken = tokens?.staff;
  const businessId = params?.business_id || params?.business_uid;
  
  if (!staffToken) {
    return { valid: false, error: 'No staff token configured' };
  }
  
  if (!businessId) {
    return { valid: false, error: 'No business_id configured' };
  }
  
  console.log('\n🔗 Validating token-business association...');
  console.log(`  Business ID: ${businessId}`);
  console.log(`  Staff Token: ${staffToken.substring(0, 20)}...`);
  
  // Use the base URL from config, falling back to environment or default
  const apiBaseUrl = baseUrl || process.env.API_BASE_URL || 'https://app.meet2know.com/api2';
  
  // Call a simple endpoint that requires staff-business association
  // /platform/v1/services is a good test because it requires the staff to belong to the business
  const testUrl = `${apiBaseUrl}/platform/v1/services?business_id=${businessId}&per_page=1`;
  
  try {
    const response = await makeRequest(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${staffToken}`
      }
    });
    
    if (response.status === 401 || response.status === 403) {
      const error = `Staff token is not associated with business ${businessId}. Run setup-business.js to create a properly associated token.`;
      console.log(`  ✗ ${error}`);
      return { valid: false, error };
    }
    
    if (response.status === 200) {
      console.log(`  ✓ Token is valid for business ${businessId}`);
      return { valid: true, error: null };
    }
    
    // Unexpected status
    const error = `Unexpected response status ${response.status} when validating token-business association`;
    console.log(`  ⚠ ${error}`);
    return { valid: false, error };
    
  } catch (error) {
    const errorMsg = `Failed to validate token-business association: ${error.message}`;
    console.log(`  ✗ ${errorMsg}`);
    return { valid: false, error: errorMsg };
  }
}

module.exports = {
  decodeJwt,
  validateJwtToken,
  isJwtToken,
  validateAllTokens,
  generateStaffJwt,
  generateClientToken,
  updateTokensFile,
  validateAndRefreshTokens,
  validateTokenBusinessAssociation
};
