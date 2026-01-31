#!/usr/bin/env node
/**
 * Setup Offering CLI
 * Creates an offering, directory offering, and subscribes a business to it.
 * 
 * Usage:
 *   node api-validation/scripts/setup-offering.js
 *   node api-validation/scripts/setup-offering.js --sku "platinum20"
 *   node api-validation/scripts/setup-offering.js --dry-run
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
  sku: getArgValue('--sku') || `test_offering_${Date.now()}`,
  name: getArgValue('--name') || null, // Will default to SKU-based name
  paymentType: getArgValue('--payment-type') || 'external',
  help: args.includes('--help') || args.includes('-h')
};

// Default name based on SKU if not provided
if (!options.name) {
  options.name = options.sku.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    return args[index + 1];
  }
  return null;
}

if (options.help) {
  console.log(`
${colors.cyan}Setup Offering CLI${colors.reset}
Creates an offering, directory offering, and subscribes a business to it.

${colors.yellow}Usage:${colors.reset}
  node api-validation/scripts/setup-offering.js [options]

${colors.yellow}Options:${colors.reset}
  --sku <sku>              SKU for the offering (default: "test_offering_<timestamp>")
  --name <name>            Display name (default: derived from SKU)
  --payment-type <type>    Payment type: "external" or "vcita" (default: "external")
  --dry-run                Show what would be done without making changes
  -h, --help               Show this help message

${colors.yellow}Requirements:${colors.reset}
  - Admin token in tokens.json (tokens.admin)
  - Directory token in tokens.json (tokens.directory)
  - Staff token in tokens.json (tokens.staff)
  - Business UID in tokens.json (params.business_uid)
  - Directory ID in tokens.json (params.directory_id)

${colors.yellow}Example:${colors.reset}
  node api-validation/scripts/setup-offering.js --sku "platinum20" --name "Platinum 20"
`);
  process.exit(0);
}

// Configuration
const CONFIG_PATH = path.join(__dirname, '../config/tokens.json');
const BASE_URL = 'https://app.meet2know.com';
const APIGW_PATH = '/apigw';

/**
 * Make an HTTP request with support for different auth types
 */
function makeRequest(method, urlPath, authType, authToken, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    // Build authorization header based on type
    let authHeader;
    switch (authType) {
      case 'admin':
        authHeader = `Admin ${authToken}`;
        break;
      case 'bearer':
      default:
        authHeader = `Bearer ${authToken}`;
        break;
    }

    const requestOptions = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
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
    throw new Error(`Config file not found: ${CONFIG_PATH}\nRun setup-business.js first or copy tokens.example.json to tokens.json.`);
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
 * Step 1: Create an offering
 */
async function createOffering(adminToken, sku, displayName, paymentType) {
  console.log(`\n${colors.blue}[1/3]${colors.reset} Creating offering...`);
  console.log(`${colors.dim}  SKU: ${sku}${colors.reset}`);
  console.log(`${colors.dim}  Name: ${displayName}${colors.reset}`);
  console.log(`${colors.dim}  Payment Type: ${paymentType}${colors.reset}`);

  const body = {
    sku: sku,
    display_name: displayName,
    offering_type: 'package',
    payment_type: paymentType,
    prices: [], // Empty for external payment type - system will auto-populate
    features_packages_uids: []
  };

  const response = await makeRequest('POST', `${APIGW_PATH}/v3/license/offerings`, 'admin', adminToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Failed to create offering: ${JSON.stringify(response.data)}`);
  }

  if (!response.data.success) {
    throw new Error(`Failed to create offering: ${JSON.stringify(response.data.errors)}`);
  }

  const offering = response.data.data;
  console.log(`${colors.green}  ✓ Offering created${colors.reset}`);
  console.log(`${colors.dim}    Offering UID: ${offering.uid}${colors.reset}`);

  return offering;
}

/**
 * Step 2: Create a directory offering
 */
async function createDirectoryOffering(adminToken, directoryId, offeringUid, displayName) {
  console.log(`\n${colors.blue}[2/3]${colors.reset} Creating directory offering...`);
  console.log(`${colors.dim}  Directory: ${directoryId}${colors.reset}`);
  console.log(`${colors.dim}  Offering: ${offeringUid}${colors.reset}`);

  const body = {
    directory_uid: directoryId,
    offering_uid: offeringUid,
    display_name: displayName,
    description: `${displayName} offering for directory`,
    is_published: true
  };

  const response = await makeRequest('POST', `${APIGW_PATH}/v3/license/directory_offerings`, 'admin', adminToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Failed to create directory offering: ${JSON.stringify(response.data)}`);
  }

  if (!response.data.success) {
    throw new Error(`Failed to create directory offering: ${JSON.stringify(response.data.errors)}`);
  }

  const directoryOffering = response.data.data;
  console.log(`${colors.green}  ✓ Directory offering created${colors.reset}`);
  console.log(`${colors.dim}    Directory Offering UID: ${directoryOffering.uid}${colors.reset}`);

  return directoryOffering;
}

/**
 * Step 3: Subscribe business to offering
 * 
 * Note: Subscription creation requires a Staff token (not Directory token).
 * For "external" payment type offerings, the Staff token must be created by a 
 * Directory token (via POST /platform/v1/tokens), which gives it an "on-behalf-of"
 * relationship. The setup-business script creates this type of token automatically.
 */
async function subscribeToOffering(staffToken, offeringUid) {
  console.log(`\n${colors.blue}[3/3]${colors.reset} Subscribing business to offering...`);
  console.log(`${colors.dim}  Offering: ${offeringUid}${colors.reset}`);

  const body = {
    offering_uid: offeringUid,
    purchase_currency: 'USD'
  };

  const response = await makeRequest('POST', `${APIGW_PATH}/v3/license/subscriptions`, 'bearer', staffToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    throw new Error(`Failed to create subscription: ${JSON.stringify(response.data)}`);
  }

  if (!response.data.success) {
    throw new Error(`Failed to create subscription: ${JSON.stringify(response.data.errors)}`);
  }

  const subscription = response.data.data;
  console.log(`${colors.green}  ✓ Subscription created${colors.reset}`);
  console.log(`${colors.dim}    Subscription UID: ${subscription.uid}${colors.reset}`);
  console.log(`${colors.dim}    Buyer UID: ${subscription.buyer_uid}${colors.reset}`);
  console.log(`${colors.dim}    Business UID: ${subscription.business_uid}${colors.reset}`);

  return subscription;
}

/**
 * Update tokens.json with new offering data
 */
function updateConfig(config, data) {
  // Initialize offerings object if it doesn't exist
  if (!config.offerings) {
    config.offerings = {};
  }

  // Store the offering data keyed by SKU
  config.offerings[data.sku] = {
    offering_uid: data.offeringUid,
    directory_offering_uid: data.directoryOfferingUid,
    subscription_uid: data.subscriptionUid,
    display_name: data.displayName,
    created_at: new Date().toISOString()
  };

  // Also store as "latest" for easy access
  config.offerings._latest = data.sku;

  return config;
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║       Setup Offering CLI               ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}`);

  try {
    // Load configuration
    const config = loadConfig();
    
    // Validate required tokens and params
    if (!config.tokens?.admin) {
      throw new Error('Admin token not found in tokens.json (tokens.admin)');
    }
    if (!config.tokens?.staff) {
      throw new Error('Staff token not found in tokens.json (tokens.staff). Run setup-business.js first.');
    }
    if (!config.params?.directory_id) {
      throw new Error('Directory ID not found in tokens.json (params.directory_id). Run setup-business.js first.');
    }

    const adminToken = config.tokens.admin;
    const staffToken = config.tokens.staff;
    const directoryId = config.params.directory_id;

    console.log(`\n${colors.dim}Using admin token: ${adminToken.substring(0, 10)}...${colors.reset}`);
    console.log(`${colors.dim}Using staff token: ${staffToken.substring(0, 20)}...${colors.reset}`);
    console.log(`${colors.dim}Using directory: ${directoryId}${colors.reset}`);

    if (options.dryRun) {
      console.log(`\n${colors.yellow}DRY RUN MODE - No changes will be made${colors.reset}`);
      console.log(`\nWould create:`);
      console.log(`  - Offering with SKU: ${options.sku}`);
      console.log(`  - Display Name: ${options.name}`);
      console.log(`  - Payment Type: ${options.paymentType}`);
      console.log(`  - Directory Offering for directory: ${directoryId}`);
      console.log(`  - Subscription for the business`);
      console.log(`  - Update tokens.json with offering data`);
      return;
    }

    // Execute setup steps
    const offering = await createOffering(adminToken, options.sku, options.name, options.paymentType);
    const directoryOffering = await createDirectoryOffering(adminToken, directoryId, offering.uid, options.name);
    const subscription = await subscribeToOffering(staffToken, offering.uid);

    // Update configuration
    const updatedConfig = updateConfig(config, {
      sku: options.sku,
      displayName: options.name,
      offeringUid: offering.uid,
      directoryOfferingUid: directoryOffering.uid,
      subscriptionUid: subscription.uid
    });

    saveConfig(updatedConfig);

    // Print summary
    console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Setup completed successfully!${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`\n${colors.yellow}Summary:${colors.reset}`);
    console.log(`  SKU:                    ${options.sku}`);
    console.log(`  Offering UID:           ${offering.uid}`);
    console.log(`  Directory Offering UID: ${directoryOffering.uid}`);
    console.log(`  Subscription UID:       ${subscription.uid}`);
    console.log(`  Business UID:           ${subscription.business_uid}`);
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
