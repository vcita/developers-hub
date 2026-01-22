/**
 * AI Self-Healer Module
 * Analyzes test failures and attempts to fix them by creating prerequisite entities
 */

const Anthropic = require('@anthropic-ai/sdk');

let anthropicClient = null;

/**
 * Initialize the Anthropic client
 * @param {string} apiKey - Anthropic API key
 */
function initializeClient(apiKey) {
  if (!apiKey) return;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
}

/**
 * Documentation issue types that AI can identify
 */
const DOC_ISSUE_TYPES = {
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  WRONG_TYPE: 'WRONG_TYPE',
  UNDOCUMENTED_ERROR: 'UNDOCUMENTED_ERROR',
  WRONG_ENUM: 'WRONG_ENUM',
  MISSING_FIELD_IN_SCHEMA: 'MISSING_FIELD_IN_SCHEMA',
  DEPRECATED_FIELD: 'DEPRECATED_FIELD'
};

/**
 * Check if an error is unrecoverable (should not attempt healing)
 * @param {Object} result - Validation result
 * @returns {boolean}
 */
function isUnrecoverableError(result) {
  const httpStatus = result.httpStatus;
  const reason = result.details?.reason;
  
  // Infrastructure errors - don't retry
  if ([502, 503, 504].includes(httpStatus)) {
    return true;
  }
  
  // Network errors
  if (reason === 'NETWORK_ERROR' || reason === 'TIMEOUT') {
    return true;
  }
  
  // Endpoint not found (path is wrong, not resource)
  if (reason === 'ENDPOINT_NOT_FOUND') {
    return true;
  }
  
  // 404 that indicates the endpoint itself doesn't exist
  if (httpStatus === 404) {
    const responseData = result.details?.response?.data;
    // Check if it's a "route not found" type error vs "resource not found"
    if (responseData?.message?.toLowerCase().includes('route not found') ||
        responseData?.message?.toLowerCase().includes('endpoint not found') ||
        responseData?.message?.toLowerCase().includes('not implemented')) {
      return true;
    }
  }
  
  return false;
}

/**
 * Analyze a failure and suggest how to fix it
 * @param {Object} context - Analysis context
 * @returns {Promise<Object>} Analysis result with prerequisites and doc issues
 */
async function analyzeFailure(context) {
  const { 
    endpoint, 
    result, 
    resolvedParams, 
    availableEndpoints, 
    previousAttempts = [],
    apiKey 
  } = context;
  
  // Initialize client if needed
  initializeClient(apiKey);
  
  if (!anthropicClient) {
    console.log('[Self-Healer] No API key - cannot analyze');
    return {
      canRetry: false,
      rootCause: 'No AI API key configured',
      prerequisites: [],
      documentationIssues: []
    };
  }
  
  try {
    const prompt = buildAnalysisPrompt(context);
    
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    const content = response.content[0]?.text;
    if (!content) {
      return {
        canRetry: false,
        rootCause: 'Empty AI response',
        prerequisites: [],
        documentationIssues: []
      };
    }
    
    // Parse AI response
    return parseAnalysisResponse(content);
    
  } catch (error) {
    console.error('[Self-Healer] Analysis error:', error.message);
    return {
      canRetry: false,
      rootCause: `Analysis failed: ${error.message}`,
      prerequisites: [],
      documentationIssues: []
    };
  }
}

/**
 * Build the analysis prompt for AI (simplified, agentic approach)
 */
function buildAnalysisPrompt(context) {
  const { endpoint, result, resolvedParams, availableEndpoints, previousAttempts } = context;
  
  // Filter to only POST endpoints that could create entities
  const postEndpoints = availableEndpoints
    .filter(e => e.method === 'POST')
    .map(e => ({
      method: e.method,
      path: e.path,
      summary: e.summary || '',
      domain: e.domain
    }));
  
  return `You are an API testing agent. Your job is to analyze test failures and determine the best fix.

## Failed Endpoint
- **Method**: ${endpoint.method}
- **Path**: ${endpoint.path}
- **Summary**: ${endpoint.summary || 'N/A'}

## Request Sent
\`\`\`json
${JSON.stringify(result.details?.request || {}, null, 2)}
\`\`\`

## Error Response
- **HTTP Status**: ${result.httpStatus}
- **Response**:
\`\`\`json
${JSON.stringify(result.details?.response?.data || {}, null, 2)}
\`\`\`

## Available UIDs/Parameters
These are real UIDs we already have from the system:
\`\`\`json
${JSON.stringify(resolvedParams, null, 2)}
\`\`\`

## Available POST Endpoints (for creating dependencies)
\`\`\`json
${JSON.stringify(postEndpoints.slice(0, 50), null, 2)}
\`\`\`

${previousAttempts.length > 0 ? `## Previous Attempts (IMPORTANT - these already failed!)
${previousAttempts.map((a, i) => `
### Attempt ${i + 1}
- Action: ${a.description}
- Result: ${a.result?.status || 'Unknown'} - ${a.result?.details?.reason || ''}
${a.requestBody ? `- Request body used:\n\`\`\`json\n${JSON.stringify(a.requestBody, null, 2)}\n\`\`\`` : ''}
`).join('\n')}

**DO NOT repeat the same approaches. Try something different.**
` : ''}

## Your Task
Analyze the error and decide the BEST action:

1. **If IDs/UIDs are wrong**: The request might use placeholder numeric IDs (like 1001, 1002) but the API needs real UIDs. Check if we have matching UIDs in the Available UIDs section.

2. **If dependencies are missing**: Some entities might need to be created first (e.g., need a service before creating a package that references it).

3. **If it's a documentation issue**: The API might behave differently than documented.

## Response Format
Return ONLY a JSON object:
\`\`\`json
{
  "rootCause": "Clear explanation of why the test failed",
  "action": "retry_with_fix" | "create_dependencies" | "cannot_fix",
  "correctedRequestBody": { /* COMPLETE corrected request body if action is retry_with_fix */ },
  "prerequisites": [
    {
      "endpoint": "/path/to/create",
      "method": "POST", 
      "description": "What we're creating and why",
      "extractField": "uid",
      "storeAs": "service_uid"
    }
  ],
  "documentationIssues": [
    {
      "type": "WRONG_ID_FORMAT",
      "field": "field_name",
      "message": "Description of the issue",
      "suggestion": "How to fix the documentation"
    }
  ]
}
\`\`\`

**IMPORTANT**: 
- If action is "retry_with_fix", you MUST provide the complete correctedRequestBody with real UIDs substituted
- If action is "create_dependencies", after we create them, we'll ask you again for the corrected body
- Look at the error message carefully - "must be a valid service id" usually means use service_uid from Available UIDs`;
}

/**
 * Parse AI analysis response (agentic format)
 */
function parseAnalysisResponse(content) {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    const parsed = JSON.parse(jsonStr);
    
    // Map new action format to canRetry
    const action = parsed.action || 'cannot_fix';
    const canRetry = action === 'retry_with_fix' || action === 'create_dependencies';
    
    return {
      rootCause: parsed.rootCause || 'Unknown',
      action,
      canRetry,
      correctedRequestBody: parsed.correctedRequestBody || null,
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites : [],
      documentationIssues: Array.isArray(parsed.documentationIssues) ? parsed.documentationIssues : []
    };
  } catch (error) {
    console.error('[Self-Healer] Failed to parse AI response:', error.message);
    return {
      rootCause: 'Failed to parse AI response',
      action: 'cannot_fix',
      canRetry: false,
      correctedRequestBody: null,
      prerequisites: [],
      documentationIssues: []
    };
  }
}

/**
 * Ask AI to generate the corrected request body (agentic approach)
 * This gives the AI full context and lets it decide how to fix the request
 * @param {Object} context - Context for generating the fix
 * @returns {Promise<Object|null>} Corrected request body or null
 */
async function generateCorrectedRequestBody(context) {
  const { 
    endpoint, 
    originalRequest, 
    errorResponse, 
    createdEntities, 
    currentParams,
    previousAttempts,
    apiKey 
  } = context;
  
  initializeClient(apiKey);
  
  if (!anthropicClient) {
    console.log('[Self-Healer] No API key - cannot generate corrected body');
    return null;
  }
  
  // Pre-process entities to extract UIDs from responses if they're null
  const processedEntities = createdEntities.map(e => {
    let uid = e.extractedUid;
    
    // If UID is null, try to find it in the response
    if (!uid && e.response) {
      const resp = e.response;
      // Try common paths
      uid = resp.uid || resp.id || 
            resp.data?.uid || resp.data?.id ||
            resp.service_uid || resp.product_uid ||
            resp.data?.service_uid || resp.data?.product_uid ||
            resp.matter_service_uid || resp.data?.matter_service_uid;
      
      // If still not found, search for any *_uid field
      if (!uid) {
        const searchForUid = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          for (const [key, value] of Object.entries(obj)) {
            if ((key.endsWith('_uid') || key === 'uid' || key === 'id') && 
                typeof value === 'string' && value.length > 0) {
              return value;
            }
          }
          return null;
        };
        uid = searchForUid(resp) || searchForUid(resp.data);
      }
      
      if (uid) {
        console.log(`[Self-Healer] Recovered UID from response for ${e.storeAs}: ${uid}`);
      }
    }
    
    return {
      type: e.storeAs,
      uid: uid,
      endpoint: e.endpoint,
      responsePreview: JSON.stringify(e.response).substring(0, 300)
    };
  });
  
  console.log('[Self-Healer] Processed entities for AI:', JSON.stringify(processedEntities, null, 2));
  
  const prompt = `You are an API testing agent. Generate a corrected request body.

## Original Request (Failed)
**Endpoint**: ${endpoint.method} ${endpoint.path}
**Request Body**:
\`\`\`json
${JSON.stringify(originalRequest, null, 2)}
\`\`\`

## Error Response
\`\`\`json
${JSON.stringify(errorResponse, null, 2)}
\`\`\`

## Entities We Just Created (USE THESE UIDs!)
\`\`\`json
${JSON.stringify(processedEntities, null, 2)}
\`\`\`

**CRITICAL**: Use the 'uid' values from the entities above. These are REAL UIDs from the system.

## All Available UIDs/Parameters
\`\`\`json
${JSON.stringify(currentParams, null, 2)}
\`\`\`

${previousAttempts.length > 0 ? `## Previous Failed Attempts
${previousAttempts.map((a, i) => `
Attempt ${i + 1}: ${a.description}
Request: ${JSON.stringify(a.requestBody, null, 2)}
Result: ${a.result?.status} - ${a.result?.details?.reason}
`).join('\n')}
` : ''}

## Your Task
Generate the COMPLETE corrected request body. 

Key things to fix:
- Replace placeholder numeric IDs (like 1001, 1002) with ACTUAL UIDs from the created entities or available parameters
- Use the correct field names (e.g., service_uid instead of id if that's what the API expects)
- Keep all other fields from the original request

Return ONLY a JSON object with the corrected body:
\`\`\`json
{
  "correctedBody": { /* the complete corrected request body */ },
  "changes": ["list of changes made"]
}
\`\`\``;

  try {
    const response = await anthropicClient.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });
    
    const content = response.content[0]?.text;
    if (!content) return null;
    
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const parsed = JSON.parse(jsonStr);
    
    console.log('[Self-Healer] AI generated corrected body:', parsed.changes);
    return parsed.correctedBody;
    
  } catch (error) {
    console.error('[Self-Healer] Failed to generate corrected body:', error.message);
    return null;
  }
}

/**
 * Execute a prerequisite API call to create a dependency
 * @param {Object} prerequisite - Prerequisite definition
 * @param {Object} apiClient - Axios instance
 * @param {Object} config - App config
 * @param {Object} resolvedParams - Currently resolved params
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Result with extracted UID
 */
async function executePrerequisite(prerequisite, apiClient, config, resolvedParams, onProgress) {
  const { endpoint, method, extractField, storeAs, description } = prerequisite;
  
  onProgress?.({ 
    type: 'creating', 
    endpoint: `${method} ${endpoint}`,
    description 
  });
  
  try {
    // Import the AI param generator for creating the request
    const { generateRequestBody, generateQueryParams } = require('./ai-param-generator');
    
    // Build minimal endpoint object
    const endpointObj = {
      method,
      path: endpoint,
      parameters: { query: [] },
      requestSchema: null  // Will use AI to generate
    };
    
    // Generate request body using AI
    const aiConfig = {
      enabled: !!config.ai?.anthropicApiKey,
      apiKey: config.ai?.anthropicApiKey
    };
    
    const body = await generateRequestBody(endpointObj, config.params || {}, resolvedParams, aiConfig);
    
    // Build the request
    const token = config.tokens?.staff || config.tokens?.directory;
    const requestConfig = {
      method: method.toLowerCase(),
      url: endpoint,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body && Object.keys(body).length > 0) {
      requestConfig.data = body;
    }
    
    // Execute the request
    console.log(`[Self-Healer] Executing prerequisite: ${method} ${endpoint}`);
    const response = await apiClient.request(requestConfig);
    console.log(`[Self-Healer] Prerequisite response status: ${response.status}`);
    console.log(`[Self-Healer] Prerequisite response data:`, JSON.stringify(response.data).substring(0, 500));
    
    // Extract the UID from response
    let extractedUid = null;
    if (response.data) {
      // Always try to extract, use extractField as a hint but also try common fields
      extractedUid = extractUidFromResponse(response.data, extractField || 'uid');
    }
    
    console.log(`[Self-Healer] Extracted UID: ${extractedUid}, storeAs: ${storeAs}`);
    
    onProgress?.({ 
      type: 'created', 
      endpoint: `${method} ${endpoint}`,
      extractedUid,
      storeAs 
    });
    
    return {
      success: true,
      endpoint: `${method} ${endpoint}`,
      response: response.data,
      extractedUid,
      storeAs: storeAs || extractField
    };
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error(`[Self-Healer] Failed to execute prerequisite ${endpoint}:`, errorMessage);
    
    onProgress?.({ 
      type: 'create_failed', 
      endpoint: `${method} ${endpoint}`,
      error: errorMessage 
    });
    
    return {
      success: false,
      endpoint: `${method} ${endpoint}`,
      error: errorMessage
    };
  }
}

/**
 * Extract UID from API response - smart extraction that tries multiple paths
 */
function extractUidFromResponse(data, fieldName) {
  console.log('[Self-Healer] Extracting UID, fieldName:', fieldName, 'from response:', JSON.stringify(data).substring(0, 500));
  
  // Try direct field
  if (data[fieldName]) {
    console.log('[Self-Healer] Found at root:', data[fieldName]);
    return data[fieldName];
  }
  
  // Try in data wrapper
  if (data.data?.[fieldName]) {
    console.log('[Self-Healer] Found in data wrapper:', data.data[fieldName]);
    return data.data[fieldName];
  }
  
  // Try uid/id at root or in data
  if (fieldName === 'uid' || fieldName === 'id') {
    if (data.uid) return data.uid;
    if (data.id) return data.id;
    if (data.data?.uid) return data.data.uid;
    if (data.data?.id) return data.data.id;
  }
  
  // Try common UID field names
  const uidFields = ['uid', 'id', 'service_uid', 'product_uid', 'matter_service_uid', 'package_uid'];
  for (const field of uidFields) {
    if (data[field]) {
      console.log(`[Self-Healer] Found UID in field '${field}':`, data[field]);
      return data[field];
    }
    if (data.data?.[field]) {
      console.log(`[Self-Healer] Found UID in data.${field}:`, data.data[field]);
      return data.data[field];
    }
  }
  
  // Try first item in array (for list responses)
  const arrayKeys = Object.keys(data.data || data).filter(k => Array.isArray((data.data || data)[k]));
  if (arrayKeys.length > 0) {
    const arr = (data.data || data)[arrayKeys[0]];
    if (arr.length > 0) {
      // Try the specified field first, then common UID fields
      if (arr[0][fieldName]) return arr[0][fieldName];
      for (const field of uidFields) {
        if (arr[0][field]) {
          console.log(`[Self-Healer] Found UID in array[0].${field}:`, arr[0][field]);
          return arr[0][field];
        }
      }
    }
  }
  
  // Last resort: look for any field ending in '_uid' or 'uid'
  const findUidInObject = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    for (const [key, value] of Object.entries(obj)) {
      if ((key.endsWith('_uid') || key === 'uid') && typeof value === 'string' && value.length > 0) {
        console.log(`[Self-Healer] Found UID field '${key}':`, value);
        return value;
      }
    }
    return null;
  };
  
  let found = findUidInObject(data);
  if (found) return found;
  
  found = findUidInObject(data.data);
  if (found) return found;
  
  console.log('[Self-Healer] Could not extract UID from response');
  return null;
}

/**
 * Attempt to self-heal a failing test
 * @param {Object} options - Healing options
 * @returns {Promise<Object>} Healing result
 */
async function attemptSelfHealing(options) {
  const {
    endpoint,
    result,
    resolvedParams,
    allEndpoints,
    config,
    apiClient,
    maxRetries = 5,
    onProgress,
    retryTest
  } = options;
  
  const attempts = [];
  let currentParams = { ...resolvedParams };
  let attempt = 0;
  let allDocIssues = [];
  
  // Track detailed healing history for UI display
  const healingHistory = [];
  
  // Add initial error to history
  healingHistory.push({
    type: 'error',
    icon: '❌',
    title: 'Initial Error',
    description: `${result.httpStatus || 'Error'} - ${result.details?.reason || 'Unknown error'}`,
    details: result.details?.friendlyMessage || result.details?.errors?.[0]?.message,
    timestamp: new Date().toISOString()
  });
  
  while (attempt < maxRetries) {
    attempt++;
    
    onProgress?.({ 
      type: 'attempt_start', 
      attempt, 
      maxRetries,
      endpoint: `${endpoint.method} ${endpoint.path}`
    });
    
    // Analyze the failure
    onProgress?.({ type: 'analyzing', attempt });
    
    healingHistory.push({
      type: 'analyzing',
      icon: '🤖',
      title: `AI Analysis (Attempt ${attempt})`,
      description: 'Analyzing failure to identify root cause...',
      timestamp: new Date().toISOString()
    });
    
    const analysis = await analyzeFailure({
      endpoint,
      result: attempt === 1 ? result : attempts[attempts.length - 1]?.result,
      resolvedParams: currentParams,
      availableEndpoints: allEndpoints,
      previousAttempts: attempts,
      apiKey: config.ai?.anthropicApiKey
    });
    
    // Update history with analysis result
    healingHistory.push({
      type: 'analysis_result',
      icon: '💡',
      title: 'Root Cause Identified',
      description: analysis.rootCause,
      details: analysis.analysisType === 'missing_dependency' 
        ? `Missing dependency detected. ${analysis.prerequisites?.length || 0} prerequisite(s) needed.`
        : analysis.analysisType === 'documentation_issue'
        ? 'Documentation issue detected.'
        : null,
      timestamp: new Date().toISOString()
    });
    
    // Collect documentation issues
    if (analysis.documentationIssues?.length > 0) {
      allDocIssues = [...allDocIssues, ...analysis.documentationIssues];
    }
    
    onProgress?.({ 
      type: 'analysis_complete', 
      attempt,
      rootCause: analysis.rootCause,
      canRetry: analysis.canRetry,
      prerequisites: analysis.prerequisites,
      documentationIssues: analysis.documentationIssues,
      healingHistory
    });
    
    // If AI says we can't retry, stop
    if (!analysis.canRetry) {
      healingHistory.push({
        type: 'stopped',
        icon: '⛔',
        title: 'Cannot Auto-Fix',
        description: analysis.rootCause,
        timestamp: new Date().toISOString()
      });
      
      attempts.push({
        attempt,
        description: `AI determined cannot retry: ${analysis.rootCause}`,
        analysis
      });
      break;
    }
    
    // Get the original request body for context
    const originalRequest = attempts.length > 0 
      ? attempts[attempts.length - 1]?.result?.details?.request?.data 
      : result.details?.request?.data;
    
    // ============== ACTION: RETRY WITH AI-GENERATED FIX ==============
    if (analysis.action === 'retry_with_fix' && analysis.correctedRequestBody) {
      healingHistory.push({
        type: 'ai_fix',
        icon: '🤖',
        title: 'AI Generated Fix',
        description: 'Retrying with AI-corrected request body',
        details: `Changes applied by AI`,
        timestamp: new Date().toISOString()
      });
      
      onProgress?.({ 
        type: 'trying_ai_fix', 
        attempt,
        healingHistory
      });
      
      // Retry with AI-generated body
      const retryResult = await retryTest(endpoint, currentParams, analysis.correctedRequestBody);
      
      if (retryResult.status === 'PASS' || retryResult.status === 'WARN') {
        healingHistory.push({
          type: 'success',
          icon: '🎉',
          title: 'AI Fix Worked!',
          description: `Test passed after AI corrected the request`,
          timestamp: new Date().toISOString()
        });
        
        onProgress?.({ 
          type: 'healing_success', 
          attempt,
          resolvedVia: 'ai_correction',
          healingHistory
        });
        
        return {
          success: true,
          attempts: attempt,
          attemptDetails: [...attempts, { attempt, description: 'AI correction succeeded', analysis }],
          documentationIssues: allDocIssues,
          healingHistory,
          result: retryResult
        };
      } else {
        // AI fix didn't work, record and continue
        healingHistory.push({
          type: 'ai_fix_failed',
          icon: '⚠️',
          title: 'AI Fix Did Not Work',
          description: `${retryResult.status}: ${retryResult.details?.reason || 'Unknown error'}`,
          timestamp: new Date().toISOString()
        });
        
        attempts.push({
          attempt,
          description: `AI correction failed: ${retryResult.details?.reason}`,
          analysis,
          result: retryResult,
          requestBody: analysis.correctedRequestBody // Track what we tried
        });
        continue; // Go to next attempt for re-analysis
      }
    }
    
    // ============== ACTION: CREATE DEPENDENCIES ==============
    if (analysis.action === 'create_dependencies' && analysis.prerequisites.length > 0) {
      let allPrereqsSucceeded = true;
      const createdEntities = [];
      
      for (let i = 0; i < analysis.prerequisites.length; i++) {
        const prereq = analysis.prerequisites[i];
        
        // Add to history: attempting to create
        healingHistory.push({
          type: 'creating',
          icon: '📦',
          title: `Creating: ${prereq.method || 'POST'} ${prereq.endpoint}`,
          description: prereq.description || `Creating prerequisite to obtain ${prereq.storeAs || prereq.extractField || 'uid'}`,
          timestamp: new Date().toISOString()
        });
        
        onProgress?.({ 
          type: 'creating_prerequisite', 
          attempt,
          step: i + 1,
          totalSteps: analysis.prerequisites.length,
          prerequisite: prereq,
          healingHistory
        });
        
        const prereqResult = await executePrerequisite(
          prereq,
          apiClient,
          config,
          currentParams,
          (progress) => onProgress?.({ ...progress, attempt, step: i + 1, totalSteps: analysis.prerequisites.length })
        );
        
        if (prereqResult.success) {
          // Try to recover UID if it wasn't extracted
          let recoveredUid = prereqResult.extractedUid;
          if (!recoveredUid && prereqResult.response) {
            const resp = prereqResult.response;
            recoveredUid = resp.uid || resp.id || 
                          resp.data?.uid || resp.data?.id ||
                          resp.service_uid || resp.product_uid ||
                          resp.data?.service_uid || resp.data?.product_uid;
            
            // Search for any *_uid field
            if (!recoveredUid) {
              const searchForUid = (obj) => {
                if (!obj || typeof obj !== 'object') return null;
                for (const [key, value] of Object.entries(obj)) {
                  if ((key.endsWith('_uid') || key === 'uid' || key === 'id') && 
                      typeof value === 'string' && value.length > 0) {
                    return value;
                  }
                }
                return null;
              };
              recoveredUid = searchForUid(resp) || searchForUid(resp.data);
            }
            
            if (recoveredUid) {
              console.log(`[Self-Healer] Recovered UID from response: ${recoveredUid}`);
              prereqResult.extractedUid = recoveredUid;
            }
          }
          
          createdEntities.push(prereqResult);
          
          // Add success to history
          const uidDisplay = prereqResult.extractedUid || 'UID_NOT_FOUND (check logs)';
          healingHistory.push({
            type: 'created',
            icon: '✅',
            title: `Created Successfully`,
            description: `${prereq.method || 'POST'} ${prereq.endpoint}`,
            details: `Extracted: ${prereqResult.storeAs || 'uid'} = ${uidDisplay}`,
            timestamp: new Date().toISOString()
          });
          
          // Add mapping info to history
          if (prereqResult.extractedUid && prereqResult.storeAs) {
            healingHistory.push({
              type: 'mapping',
              icon: '🔗',
              title: 'Added Mapping',
              description: `${prereqResult.storeAs} → ${prereqResult.extractedUid}`,
              timestamp: new Date().toISOString()
            });
            
            currentParams[prereqResult.storeAs] = prereqResult.extractedUid;
          }
        } else {
          // Add failure to history
          healingHistory.push({
            type: 'failed',
            icon: '❌',
            title: `Failed to Create`,
            description: `${prereq.method || 'POST'} ${prereq.endpoint}`,
            details: prereqResult.error,
            timestamp: new Date().toISOString()
          });
          
          allPrereqsSucceeded = false;
          attempts.push({
            attempt,
            description: `Failed to create prerequisite: ${prereq.endpoint} - ${prereqResult.error}`,
            analysis,
            prerequisiteError: prereqResult
          });
          break;
        }
      }
      
      if (!allPrereqsSucceeded) {
        continue; // Try again with new analysis
      }
      
      // ============== ASK AI FOR CORRECTED BODY ==============
      // Now that we've created the dependencies, ask AI to generate the corrected request
      healingHistory.push({
        type: 'generating_fix',
        icon: '🤖',
        title: 'Generating Corrected Request',
        description: 'Asking AI to generate request body with new UIDs',
        timestamp: new Date().toISOString()
      });
      
      onProgress?.({ type: 'generating_corrected_body', attempt, healingHistory });
      
      const errorResponse = attempts.length > 0 
        ? attempts[attempts.length - 1]?.result?.details?.response?.data 
        : result.details?.response?.data;
      
      const correctedBody = await generateCorrectedRequestBody({
        endpoint,
        originalRequest,
        errorResponse,
        createdEntities,
        currentParams,
        previousAttempts: attempts,
        apiKey: config.ai?.anthropicApiKey
      });
      
        if (correctedBody) {
        // Log the entities and their UIDs for debugging
        const uidSummary = createdEntities.map(e => {
          if (e.extractedUid) {
            return `${e.storeAs}=${e.extractedUid}`;
          } else {
            // Try to find UID in response as fallback
            const respUid = e.response?.data?.uid || e.response?.uid || 'NOT_FOUND';
            return `${e.storeAs}=${respUid} (from response)`;
          }
        }).join(', ');
        
        healingHistory.push({
          type: 'body_generated',
          icon: '📝',
          title: 'AI Generated Corrected Body',
          description: 'Request body updated with real UIDs',
          details: `Using: ${uidSummary}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Retry the original test with AI-generated body
      healingHistory.push({
        type: 'retrying',
        icon: '🔄',
        title: 'Retrying Original Request',
        description: `${endpoint.method} ${endpoint.path}`,
        details: `With resolved parameters: ${Object.keys(currentParams).filter(k => currentParams[k]).join(', ')}`,
        timestamp: new Date().toISOString()
      });
      
      onProgress?.({ type: 'retrying', attempt, newParams: currentParams, healingHistory });
      
      const retryResult = await retryTest(endpoint, currentParams, correctedBody);
      
      if (retryResult.status === 'PASS' || retryResult.status === 'WARN') {
        // Success!
        healingHistory.push({
          type: 'success',
          icon: '🎉',
          title: 'Test Passed!',
          description: `${endpoint.method} ${endpoint.path} now returns ${retryResult.httpStatus || retryResult.status}`,
          timestamp: new Date().toISOString()
        });
        
        onProgress?.({ 
          type: 'healed', 
          attempt,
          createdEntities,
          documentationIssues: allDocIssues,
          healingHistory
        });
        
        return {
          success: true,
          finalResult: retryResult,
          attempts: attempt,
          createdEntities,
          documentationIssues: allDocIssues,
          healingHistory,
          workflow: {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            prerequisites: analysis.prerequisites,
            paramMapping: Object.fromEntries(
              createdEntities
                .filter(e => e.extractedUid && e.storeAs)
                .map(e => [e.storeAs, e.extractedUid])
            )
          }
        };
      } else {
        // Still failing, record and try again
        healingHistory.push({
          type: 'retry_failed',
          icon: '⚠️',
          title: 'Retry Still Failed',
          description: `${retryResult.status}: ${retryResult.details?.reason || 'Unknown error'}`,
          details: retryResult.details?.friendlyMessage,
          timestamp: new Date().toISOString()
        });
        
        attempts.push({
          attempt,
          description: `Retry failed with status ${retryResult.status}: ${retryResult.details?.reason}`,
          analysis,
          result: retryResult,
          requestBody: correctedBody, // Track what body we tried
          createdEntities
        });
      }
    } else {
      // No valid action from AI, can't fix
      healingHistory.push({
        type: 'no_fix',
        icon: '🤷',
        title: 'No Fix Available',
        description: analysis.rootCause || 'AI could not determine a fix',
        timestamp: new Date().toISOString()
      });
      
      attempts.push({
        attempt,
        description: `AI action: ${analysis.action || 'none'} - ${analysis.rootCause}`,
        analysis
      });
      
      // If AI explicitly said cannot_fix, don't retry
      if (analysis.action === 'cannot_fix') {
        break;
      }
    }
  }
  
  // Failed after all attempts
  healingHistory.push({
    type: 'exhausted',
    icon: '💀',
    title: 'Self-Healing Failed',
    description: `Could not fix after ${attempt} attempt(s)`,
    timestamp: new Date().toISOString()
  });
  
  onProgress?.({ 
    type: 'healing_failed', 
    attempts: attempt,
    documentationIssues: allDocIssues,
    healingHistory
  });
  
  return {
    success: false,
    attempts: attempt,
    attemptDetails: attempts,
    documentationIssues: allDocIssues,
    healingHistory
  };
}

module.exports = {
  isUnrecoverableError,
  analyzeFailure,
  generateCorrectedRequestBody,
  executePrerequisite,
  attemptSelfHealing,
  DOC_ISSUE_TYPES
};
