#!/usr/bin/env node
/**
 * Setup Business CLI
 * Creates a new business with all required test data and updates tokens.json
 * 
 * Usage:
 *   node api-validation/scripts/setup-business.js
 *   node api-validation/scripts/setup-business.js --dry-run
 *   node api-validation/scripts/setup-business.js --name "My Test Business"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  name: getArgValue('--name') || `API Test Business ${Date.now()}`,
  email: getArgValue('--email') || `apitest+${Date.now()}@vcita.com`,
  help: args.includes('--help') || args.includes('-h')
};

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

if (options.help) {
  console.log(`
${colors.cyan}Setup Business CLI${colors.reset}
Creates a new business with test data and updates tokens.json

${colors.yellow}Usage:${colors.reset}
  node api-validation/scripts/setup-business.js [options]

${colors.yellow}Options:${colors.reset}
  --name <name>     Business name (default: "API Test Business <timestamp>")
  --email <email>   Admin email (default: "apitest+<timestamp>@vcita.com")
  --dry-run         Show what would be done without making changes
  -h, --help        Show this help message

${colors.yellow}Example:${colors.reset}
  node api-validation/scripts/setup-business.js --name "My Test Business"
`);
  process.exit(0);
}

// Configuration
const CONFIG_PATH = path.join(__dirname, '../config/tokens.json');
const BASE_URL = 'https://app.meet2know.com';
const API_PATH = '/api2';

/**
 * Make an HTTP request
 */
function makeRequest(method, urlPath, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(body));
    }

    const req = httpModule.request(requestOptions, (res) => {
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
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Load tokens.json configuration
 */
function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}\nCopy tokens.example.json to tokens.json and add your directory token.`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

/**
 * Save configuration to tokens.json
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Step 1: Create a new business
 */
async function createBusiness(directoryToken, businessName, adminEmail) {
  console.log(`\n${colors.blue}[1/4]${colors.reset} Creating new business...`);
  console.log(`${colors.dim}  Name: ${businessName}${colors.reset}`);
  console.log(`${colors.dim}  Admin Email: ${adminEmail}${colors.reset}`);

  const body = {
    admin_account: {
      country_name: 'United States',
      display_name: 'API Test Admin',
      email: adminEmail,
      first_name: 'API',
      language: 'en',
      last_name: 'Test',
      password: 'TestPassword123!',
      phone: '555-0123'
    },
    business: {
      address: '123 Test Street',
      business_category: 'other',
      business_maturity_in_years: '0',
      country_name: 'United States',
      hide_address: false,
      name: businessName,
      phone: '555-0123',
      short_description: 'Test business for API validation',
      time_zone: 'Pacific Time (US & Canada)',
      website_url: 'https://test.vcita.com'
    },
    meta: {
      analytics: {},
      audit: [],
      identities: [],
      in_setup: false,
      intents: ['accept_payments_tile', 'manage_client_records'],
      is_template: false,
      synchronized: true
    }
  };

  const response = await makeRequest('POST', `${API_PATH}/platform/v1/businesses`, directoryToken, body);
  
  if (response.status !== 200 || response.data.status !== 'OK') {
    throw new Error(`Failed to create business: ${JSON.stringify(response.data)}`);
  }

  const businessData = response.data.data.business;
  console.log(`${colors.green}  ✓ Business created${colors.reset}`);
  console.log(`${colors.dim}    Business UID: ${businessData.business.id}${colors.reset}`);
  console.log(`${colors.dim}    Staff UID: ${businessData.admin_account.staff_uid}${colors.reset}`);
  console.log(`${colors.dim}    User ID: ${businessData.admin_account.user_id}${colors.reset}`);

  return {
    businessUid: businessData.business.id,
    staffUid: businessData.admin_account.staff_uid,
    userId: businessData.admin_account.user_id,
    directoryId: businessData.business.directory_id
  };
}

/**
 * Step 2: Create a staff token
 */
async function createStaffToken(directoryToken, businessUid) {
  console.log(`\n${colors.blue}[2/4]${colors.reset} Creating staff token...`);

  const body = { business_id: businessUid };
  const response = await makeRequest('POST', `${API_PATH}/platform/v1/tokens`, directoryToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Failed to create staff token: ${JSON.stringify(response.data)}`);
  }

  const token = response.data.data.token;
  console.log(`${colors.green}  ✓ Staff token created${colors.reset}`);
  console.log(`${colors.dim}    Token: ${token.substring(0, 20)}...${colors.reset}`);

  return token;
}

/**
 * Step 3: Create a test client
 */
async function createClient(staffToken, staffUid) {
  console.log(`\n${colors.blue}[3/4]${colors.reset} Creating test client...`);

  const timestamp = Date.now();
  const body = {
    address: '456 Client Street',
    email: `testclient+${timestamp}@example.com`,
    first_name: 'Test',
    last_name: 'Client',
    phone: '+1234567890',
    staff_id: staffUid,
    status: 'lead'
  };

  const response = await makeRequest('POST', `${API_PATH}/platform/v1/clients`, staffToken, body);
  
  if (response.status !== 200 || response.data.status !== 'OK') {
    throw new Error(`Failed to create client: ${JSON.stringify(response.data)}`);
  }

  const clientData = response.data.data;
  console.log(`${colors.green}  ✓ Client created${colors.reset}`);
  console.log(`${colors.dim}    Client UID: ${clientData.client.id}${colors.reset}`);

  return {
    clientUid: clientData.client.id,
    clientToken: clientData.token
  };
}

/**
 * Step 4: Get matter UID from client
 */
async function getMatterUid(staffToken, clientUid) {
  console.log(`\n${colors.blue}[4/4]${colors.reset} Getting matter UID...`);

  const response = await makeRequest('GET', `${API_PATH}/business/clients/v1/contacts/${clientUid}/matters`, staffToken);
  
  if (response.status !== 200 || !response.data.success) {
    console.log(`${colors.yellow}  ⚠ Could not get matter UID${colors.reset}`);
    return null;
  }

  const matters = response.data.data?.matters || [];
  if (matters.length === 0) {
    console.log(`${colors.yellow}  ⚠ No matters found for client${colors.reset}`);
    return null;
  }

  const matterUid = matters[0].uid;
  console.log(`${colors.green}  ✓ Matter found${colors.reset}`);
  console.log(`${colors.dim}    Matter UID: ${matterUid}${colors.reset}`);

  return matterUid;
}

/**
 * Update tokens.json with new values
 */
function updateConfig(config, data) {
  config.tokens.staff = data.staffToken;
  config.tokens.business = data.staffToken;
  config.tokens.client = data.clientToken;
  
  config.params.business_id = data.businessUid;
  config.params.business_uid = data.businessUid;
  config.params.staff_id = data.staffUid;
  config.params.staff_uid = data.staffUid;
  config.params.directory_id = data.directoryId;
  config.params.client_uid = data.clientUid;
  config.params.client_id = data.clientUid;
  
  if (data.matterUid) {
    config.params.matter_uid = data.matterUid;
  }

  // Update admin URL if we have user ID
  if (data.userId && config.tokens.admin_url) {
    config.tokens.admin_url = config.tokens.admin_url.replace(/user_id=\d+/, `user_id=${data.userId}`);
  }

  return config;
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       Setup Business CLI               ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

  try {
    // Load configuration
    const config = loadConfig();
    
    if (!config.tokens?.directory) {
      throw new Error('Directory token not found in tokens.json');
    }

    const directoryToken = config.tokens.directory;
    console.log(`\n${colors.dim}Using directory token: ${directoryToken.substring(0, 20)}...${colors.reset}`);

    if (options.dryRun) {
      console.log(`\n${colors.yellow}DRY RUN MODE - No changes will be made${colors.reset}`);
      console.log(`\nWould create:`);
      console.log(`  - Business: ${options.name}`);
      console.log(`  - Admin Email: ${options.email}`);
      console.log(`  - Staff token for the business`);
      console.log(`  - Test client with matter`);
      console.log(`  - Update tokens.json with new values`);
      return;
    }

    // Execute setup steps
    const businessData = await createBusiness(directoryToken, options.name, options.email);
    const staffToken = await createStaffToken(directoryToken, businessData.businessUid);
    const clientData = await createClient(staffToken, businessData.staffUid);
    const matterUid = await getMatterUid(staffToken, clientData.clientUid);

    // Update configuration
    const updatedConfig = updateConfig(config, {
      businessUid: businessData.businessUid,
      staffUid: businessData.staffUid,
      userId: businessData.userId,
      directoryId: businessData.directoryId,
      staffToken: staffToken,
      clientUid: clientData.clientUid,
      clientToken: clientData.clientToken,
      matterUid: matterUid
    });

    saveConfig(updatedConfig);

    // Print summary
    console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Setup completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`\n${colors.yellow}Summary:${colors.reset}`);
    console.log(`  Business UID:   ${businessData.businessUid}`);
    console.log(`  Staff UID:      ${businessData.staffUid}`);
    console.log(`  Client UID:     ${clientData.clientUid}`);
    console.log(`  Matter UID:     ${matterUid || 'N/A'}`);
    console.log(`\n${colors.dim}Updated: ${CONFIG_PATH}${colors.reset}`);

  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run
main();
