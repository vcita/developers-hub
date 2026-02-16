#!/usr/bin/env node
/**
 * Workflow Executor POC
 * 
 * Executes API validation workflows with deterministic prerequisite resolution.
 * 
 * Usage:
 *   node poc/workflow-executor.js <workflow-file>
 *   node poc/workflow-executor.js workflows/scheduling/post_business_scheduling_v1_bookings.md
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { query, queryNested, extract } = require('./jsonpath-extractor');
const { resolve, resolveObject, findAllUnresolved } = require('./variable-resolver');

// Configuration
const CONFIG_PATH = path.join(__dirname, '../config/tokens.json');
const BASE_URL = process.env.API_BASE_URL || 'https://app.meet2know.com/apigw';

/**
 * Load configuration from tokens.json
 */
function loadConfig() {
  try {
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configContent);
    return {
      tokens: config.tokens || {},
      params: config.params || {},
      baseUrl: BASE_URL
    };
  } catch (error) {
    console.error(`Failed to load config from ${CONFIG_PATH}:`, error.message);
    process.exit(1);
  }
}

/**
 * Parse YAML-like content from markdown code blocks
 * Simple parser for our specific format
 */
function parseYamlBlock(content) {
  const lines = content.split('\n');
  const result = { steps: [] };
  let currentStep = null;
  let currentKey = null;
  let inExtract = false;
  let inParams = false;
  let inBody = false;
  let inExpect = false;
  let bodyIndent = 0;
  let bodyLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;
    
    // Check for step start
    if (trimmed.startsWith('- id:')) {
      if (currentStep) {
        if (bodyLines.length > 0) {
          currentStep.body = parseSimpleYamlObject(bodyLines.join('\n'));
          bodyLines = [];
        }
        result.steps.push(currentStep);
      }
      currentStep = { id: trimmed.split(':')[1].trim() };
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
      continue;
    }
    
    if (!currentStep) continue;
    
    // Parse step properties
    const indent = line.search(/\S/);
    
    if (trimmed.startsWith('description:')) {
      currentStep.description = trimmed.split(':').slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed.startsWith('method:')) {
      currentStep.method = trimmed.split(':')[1].trim();
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed.startsWith('path:')) {
      currentStep.path = trimmed.split(':').slice(1).join(':').trim().replace(/^["']|["']$/g, '');
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed.startsWith('token:')) {
      currentStep.token = trimmed.split(':')[1].trim();
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed.startsWith('onFail:')) {
      currentStep.onFail = trimmed.split(':')[1].trim();
      inExtract = false;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed === 'extract:') {
      currentStep.extract = {};
      inExtract = true;
      inParams = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed === 'params:') {
      currentStep.params = {};
      inParams = true;
      inExtract = false;
      inBody = false;
      inExpect = false;
    } else if (trimmed === 'body:') {
      currentStep.body = {};
      inBody = true;
      bodyIndent = indent + 2;
      bodyLines = [];
      inExtract = false;
      inParams = false;
      inExpect = false;
    } else if (trimmed === 'expect:') {
      currentStep.expect = {};
      inExpect = true;
      inExtract = false;
      inParams = false;
      inBody = false;
    } else if (inExtract && indent > 4) {
      const match = trimmed.match(/^(\w+):\s*["']?(.+?)["']?$/);
      if (match) {
        currentStep.extract[match[1]] = match[2];
      }
    } else if (inParams && indent > 4) {
      const match = trimmed.match(/^(\w+):\s*["']?(.+?)["']?$/);
      if (match) {
        currentStep.params[match[1]] = match[2];
      }
    } else if (inExpect && indent > 4) {
      const match = trimmed.match(/^(\w+):\s*(.+)$/);
      if (match) {
        let value = match[2].trim();
        // Parse array like [200, 201]
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => parseInt(v.trim(), 10));
        } else if (!isNaN(parseInt(value, 10))) {
          value = parseInt(value, 10);
        }
        currentStep.expect[match[1]] = value;
      }
    } else if (inBody) {
      bodyLines.push(line);
    }
  }
  
  // Don't forget the last step
  if (currentStep) {
    if (bodyLines.length > 0) {
      currentStep.body = parseSimpleYamlObject(bodyLines.join('\n'));
    }
    result.steps.push(currentStep);
  }
  
  return result;
}

/**
 * Parse simple YAML object (for body content)
 */
function parseSimpleYamlObject(content) {
  const result = {};
  const lines = content.split('\n');
  const stack = [{ obj: result, indent: -1 }];
  
  for (const line of lines) {
    if (!line.trim()) continue;
    
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    
    // Pop stack until we find parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }
    
    const parent = stack[stack.length - 1].obj;
    
    // Check for key: value
    const match = trimmed.match(/^["']?([^"':]+)["']?:\s*(.*)$/);
    if (match) {
      let [, key, value] = match;
      key = key.trim();
      value = value.trim();
      
      if (value === '' || value === '|') {
        // Object or multiline string
        parent[key] = {};
        stack.push({ obj: parent[key], indent });
      } else {
        // Remove quotes
        value = value.replace(/^["']|["']$/g, '');
        parent[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Parse workflow file
 */
function parseWorkflow(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const metadata = {};
  if (frontmatterMatch) {
    frontmatterMatch[1].split('\n').forEach(line => {
      const match = line.match(/^(\w+):\s*(.+)$/);
      if (match) {
        let value = match[2].trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(v => v.trim());
        }
        metadata[match[1]] = value;
      }
    });
  }
  
  // Extract Prerequisites YAML block
  const prereqMatch = content.match(/## Prerequisites[\s\S]*?```yaml\n([\s\S]*?)\n```/);
  let prerequisites = { steps: [] };
  if (prereqMatch) {
    prerequisites = parseYamlBlock(prereqMatch[1]);
  }
  
  // Extract Test Request YAML block
  const testMatch = content.match(/## Test Request[\s\S]*?```yaml\n([\s\S]*?)\n```/);
  let testRequest = null;
  if (testMatch) {
    const parsed = parseYamlBlock(testMatch[1]);
    testRequest = parsed.steps[0] || null;
  }
  
  return {
    metadata,
    prerequisites,
    testRequest,
    raw: content
  };
}

/**
 * Make an HTTP request
 */
async function makeRequest(method, path, params, body, config, tokenType = 'staff') {
  const url = `${config.baseUrl}${path}`;
  const token = config.tokens[tokenType];
  
  if (!token) {
    throw new Error(`No token available for type: ${tokenType}`);
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
  
  // Build query string for GET requests
  let fullUrl = url;
  if (method === 'GET' && params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(params).toString();
    fullUrl = `${url}?${queryString}`;
  }
  
  console.log(`  Request: ${method} ${fullUrl}`);
  if (body && Object.keys(body).length > 0) {
    console.log(`  Body: ${JSON.stringify(body, null, 2).split('\n').map((l, i) => i === 0 ? l : '        ' + l).join('\n')}`);
  }
  
  try {
    const response = await axios({
      method,
      url: fullUrl,
      headers,
      data: method !== 'GET' ? body : undefined,
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log(`  Status: ${response.status}`);
    
    return {
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      status: 0,
      error: error.message
    };
  }
}

/**
 * Extract values from response using JSONPath
 */
function extractValues(data, expressions) {
  const result = {};
  
  for (const [key, path] of Object.entries(expressions || {})) {
    // Try nested query first (for complex paths)
    let value = queryNested(data, path);
    
    // Fall back to simple query
    if (value === undefined) {
      value = query(data, path);
    }
    
    if (value !== undefined) {
      result[key] = value;
      console.log(`    ${key}: ${JSON.stringify(value)}`);
    } else {
      console.log(`    ${key}: [NOT FOUND] (path: ${path})`);
    }
  }
  
  return result;
}

/**
 * Execute a workflow
 */
async function executeWorkflow(workflowPath) {
  console.log('='.repeat(60));
  console.log('Workflow Executor POC');
  console.log('='.repeat(60));
  console.log(`\nWorkflow: ${workflowPath}\n`);
  
  // Load config
  const config = loadConfig();
  console.log('Config loaded:');
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Tokens: ${Object.keys(config.tokens).filter(k => config.tokens[k]).join(', ')}`);
  console.log(`  Params: ${JSON.stringify(config.params)}\n`);
  
  // Parse workflow
  const workflow = parseWorkflow(workflowPath);
  console.log(`Workflow metadata: ${JSON.stringify(workflow.metadata)}`);
  console.log(`Prerequisites: ${workflow.prerequisites.steps.length} steps`);
  console.log(`Test request: ${workflow.testRequest ? 'defined' : 'NOT DEFINED'}\n`);
  
  // Initialize context with config params
  const context = { ...config.params };
  
  // Execute prerequisites
  console.log('-'.repeat(60));
  console.log('PHASE 1: Execute Prerequisites');
  console.log('-'.repeat(60));
  
  for (const step of workflow.prerequisites.steps) {
    console.log(`\n[${step.id}] ${step.description}`);
    
    // Resolve variables in path and params
    const resolvedPath = resolve(step.path, context);
    const resolvedParams = resolveObject(step.params || {}, context);
    const resolvedBody = resolveObject(step.body || {}, context);
    
    // Check for unresolved variables
    const unresolved = findAllUnresolved({ path: resolvedPath, params: resolvedParams, body: resolvedBody });
    if (unresolved.length > 0) {
      console.log(`  [WARN] Unresolved variables: ${unresolved.join(', ')}`);
    }
    
    // Make request
    const response = await makeRequest(
      step.method,
      resolvedPath,
      resolvedParams,
      Object.keys(resolvedBody).length > 0 ? resolvedBody : null,
      config,
      step.token || 'staff'
    );
    
    // Check expected status
    const expectedStatus = step.expect?.status || 200;
    const statusOk = Array.isArray(expectedStatus) 
      ? expectedStatus.includes(response.status)
      : response.status === expectedStatus;
    
    if (!statusOk) {
      console.log(`  [FAIL] Expected status ${expectedStatus}, got ${response.status}`);
      if (response.data) {
        console.log(`  Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
      
      if (step.onFail === 'abort' || !step.onFail) {
        console.log('\n[ABORT] Prerequisite failed, stopping execution');
        return {
          success: false,
          failedStep: step.id,
          reason: 'PREREQUISITE_FAILED',
          response
        };
      }
      continue;
    }
    
    // Extract values
    if (step.extract && Object.keys(step.extract).length > 0) {
      console.log('  Extracted:');
      const extracted = extractValues(response.data, step.extract);
      Object.assign(context, extracted);
    }
  }
  
  // Execute test request
  if (!workflow.testRequest) {
    console.log('\n[SKIP] No test request defined');
    return {
      success: true,
      reason: 'NO_TEST_REQUEST',
      context
    };
  }
  
  console.log('\n' + '-'.repeat(60));
  console.log('PHASE 2: Execute Test Request');
  console.log('-'.repeat(60));
  
  const test = workflow.testRequest;
  console.log(`\n[TEST] ${test.method} ${test.path}`);
  
  // Resolve all variables
  const resolvedPath = resolve(test.path, context);
  const resolvedBody = resolveObject(test.body || {}, context);
  
  // Check for unresolved variables
  const unresolved = findAllUnresolved({ path: resolvedPath, body: resolvedBody });
  if (unresolved.length > 0) {
    console.log(`  [WARN] Unresolved variables: ${unresolved.join(', ')}`);
  }
  
  // Make test request
  const response = await makeRequest(
    test.method,
    resolvedPath,
    {},
    Object.keys(resolvedBody).length > 0 ? resolvedBody : null,
    config,
    test.token || 'staff'
  );
  
  // Check result
  const expectedStatus = test.expect?.status || [200, 201];
  const statusOk = Array.isArray(expectedStatus)
    ? expectedStatus.includes(response.status)
    : response.status === expectedStatus;
  
  console.log('\n' + '='.repeat(60));
  if (statusOk) {
    console.log('RESULT: SUCCESS');
    console.log(`Status: ${response.status}`);
    if (response.data) {
      console.log(`Response: ${JSON.stringify(response.data, null, 2).substring(0, 500)}`);
    }
  } else {
    console.log('RESULT: FAILED');
    console.log(`Expected: ${JSON.stringify(expectedStatus)}, Got: ${response.status}`);
    if (response.data) {
      console.log(`Response: ${JSON.stringify(response.data, null, 2)}`);
    }
  }
  console.log('='.repeat(60));
  
  return {
    success: statusOk,
    status: response.status,
    response: response.data,
    context
  };
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log('Usage: node workflow-executor.js <workflow-file>');
  console.log('Example: node workflow-executor.js workflows/scheduling/post_business_scheduling_v1_bookings.md');
  process.exit(1);
}

const workflowPath = path.resolve(process.cwd(), args[0]);
if (!fs.existsSync(workflowPath)) {
  console.error(`Workflow file not found: ${workflowPath}`);
  process.exit(1);
}

executeWorkflow(workflowPath)
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
