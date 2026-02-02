#!/usr/bin/env node
/**
 * Setup Offering - Simplified
 * 
 * 1. Find existing offering with payment_type=external and SKU=platinum20
 * 2. If not found, create one
 * 3. Subscribe the business to that offering
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

const CONFIG_PATH = path.join(__dirname, '../config/tokens.json');
const BASE_URL = 'https://app.meet2know.com';
const TARGET_SKU = 'platinum20';
const TARGET_PAYMENT_TYPE = 'external';

function makeRequest(method, urlPath, authType, authToken, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + urlPath);
    const isHttps = url.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const authHeader = authType === 'admin' ? `Admin ${authToken}` : `Bearer ${authToken}`;

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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Step 1: Find existing offering with platinum20 SKU and external payment
 * Uses directory token to list, admin token to create
 */
async function findOrCreateOffering(directoryToken, adminToken, directoryUid) {
  console.log(`\n${colors.blue}[1/3]${colors.reset} Looking for existing offering (SKU: ${TARGET_SKU}, payment: ${TARGET_PAYMENT_TYPE})...`);
  
  // Use directory token to list offerings
  const response = await makeRequest('GET', `/apigw/v3/license/offerings`, 'bearer', directoryToken);
  
  if (response.status !== 200) {
    console.log(`${colors.yellow}  ⚠ Could not fetch offerings: ${response.status}${colors.reset}`);
    console.log(`${colors.dim}  Response: ${JSON.stringify(response.data)}${colors.reset}`);
  }

  const offerings = response.data?.data?.offerings || [];
  console.log(`${colors.dim}  Found ${offerings.length} offering(s)${colors.reset}`);
  
  // Find matching offering
  const match = offerings.find(o => 
    o.SKU === TARGET_SKU && o.payment_type === TARGET_PAYMENT_TYPE
  );
  
  if (match) {
    console.log(`${colors.green}  ✓ Found existing offering: ${match.uid}${colors.reset}`);
    return { offering: match, created: false };
  }
  
  // Not found - create one with admin token
  console.log(`${colors.yellow}  Not found. Creating new offering...${colors.reset}`);
  
  const createBody = {
    type: 'package',
    SKU: TARGET_SKU,
    display_name: 'Platinum 20',
    quantity: 1,
    payment_type: TARGET_PAYMENT_TYPE,
    prices: []  // empty for external payment type
  };
  
  const createResponse = await makeRequest('POST', `/apigw/v3/license/offerings`, 'admin', adminToken, createBody);
  
  if (createResponse.status !== 200 && createResponse.status !== 201) {
    throw new Error(`Failed to create offering: ${JSON.stringify(createResponse.data)}`);
  }
  
  const newOffering = createResponse.data?.data;
  console.log(`${colors.green}  ✓ Created offering: ${newOffering.uid}${colors.reset}`);
  return { offering: newOffering, created: true };
}

/**
 * Step 2: Create directory_offering to assign offering to directory (only if new offering was created)
 */
async function createDirectoryOffering(adminToken, directoryUid, offeringUid) {
  console.log(`\n${colors.blue}[2/3]${colors.reset} Assigning offering to directory...`);
  console.log(`${colors.dim}  Directory: ${directoryUid}${colors.reset}`);
  console.log(`${colors.dim}  Offering: ${offeringUid}${colors.reset}`);
  
  const body = {
    directory_uid: directoryUid,
    offering_uid: offeringUid,
    display_name: 'Platinum 20',
    is_published: true
  };
  
  const response = await makeRequest('POST', `/apigw/v3/license/directory_offerings`, 'admin', adminToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    // Check if already exists
    if (JSON.stringify(response.data).includes('already') || 
        JSON.stringify(response.data).includes('duplicate')) {
      console.log(`${colors.yellow}  ⚠ Directory offering already exists${colors.reset}`);
      return { uid: 'existing' };
    }
    throw new Error(`Failed to create directory offering: ${JSON.stringify(response.data)}`);
  }
  
  const dirOffering = response.data?.data;
  console.log(`${colors.green}  ✓ Directory offering created: ${dirOffering?.uid || 'success'}${colors.reset}`);
  return dirOffering;
}

/**
 * Step 3: Subscribe business to the offering (using staff token)
 */
async function subscribeBusinessToOffering(staffToken, offeringUid) {
  console.log(`\n${colors.blue}[3/3]${colors.reset} Subscribing business to offering...`);
  console.log(`${colors.dim}  Offering: ${offeringUid}${colors.reset}`);
  
  const body = {
    offering_uid: offeringUid,
    purchase_currency: 'USD'
  };
  
  const response = await makeRequest('POST', `/apigw/v3/license/subscriptions`, 'bearer', staffToken, body);
  
  if (response.status !== 200 && response.status !== 201) {
    // Check if already subscribed
    if (response.data?.errors?.[0]?.code === 'already_subscribed' || 
        JSON.stringify(response.data).includes('already')) {
      console.log(`${colors.yellow}  ⚠ Business already subscribed${colors.reset}`);
      return { uid: 'existing', business_uid: businessUid };
    }
    throw new Error(`Failed to subscribe: ${JSON.stringify(response.data)}`);
  }
  
  const subscription = response.data?.data;
  console.log(`${colors.green}  ✓ Subscribed: ${subscription?.uid || 'success'}${colors.reset}`);
  return subscription;
}

async function main() {
  console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  Setup Offering${colors.reset}`);
  console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);

  try {
    const config = loadConfig();
    
    if (!config.tokens?.admin) {
      throw new Error('Admin token not found in tokens.json');
    }
    if (!config.tokens?.directory) {
      throw new Error('Directory token not found in tokens.json');
    }
    if (!config.tokens?.staff) {
      throw new Error('Staff token not found in tokens.json. Run setup-business.js first.');
    }
    if (!config.params?.directory_id) {
      throw new Error('Directory ID not found in tokens.json');
    }

    const adminToken = config.tokens.admin;
    const directoryToken = config.tokens.directory;
    const staffToken = config.tokens.staff;
    const directoryUid = config.params.directory_id;

    // Step 1: Find or create offering (directory token to list, admin token to create)
    const { offering, created } = await findOrCreateOffering(directoryToken, adminToken, directoryUid);
    if (!offering) {
      throw new Error('Could not find or create offering');
    }

    // Step 2: If new offering was created, assign it to the directory
    if (created) {
      await createDirectoryOffering(adminToken, directoryUid, offering.uid);
    } else {
      console.log(`\n${colors.dim}[2/3] Skipping directory offering (offering already exists)${colors.reset}`);
    }

    // Step 3: Subscribe business (using staff token)
    const subscription = await subscribeBusinessToOffering(staffToken, offering.uid);

    // Update config
    config.offering = {
      uid: offering.uid,
      sku: TARGET_SKU,
      subscription_uid: subscription?.uid
    };
    saveConfig(config);

    // Summary
    console.log(`\n${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}  Done!${colors.reset}`);
    console.log(`${colors.cyan}════════════════════════════════════════${colors.reset}`);
    console.log(`  Offering UID: ${offering.uid}`);
    console.log(`  New offering created: ${created ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error(`\n${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
