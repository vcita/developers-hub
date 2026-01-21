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
 * Build the analysis prompt for AI
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
  
  return `You are an API testing expert. Analyze this test failure and determine:
1. The root cause of the failure
2. Whether this is a missing dependency issue (can be fixed by creating entities) or a documentation issue
3. What prerequisite API calls are needed to fix it (if any)
4. Any documentation issues you notice

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

## Available Resolved Parameters
These are UIDs/IDs we already have:
\`\`\`json
${JSON.stringify(resolvedParams, null, 2)}
\`\`\`

## Available POST Endpoints
These can be used to create missing entities:
\`\`\`json
${JSON.stringify(postEndpoints.slice(0, 50), null, 2)}
\`\`\`

${previousAttempts.length > 0 ? `## Previous Attempts (Failed)
These approaches were already tried and didn't work:
${previousAttempts.map((a, i) => `${i + 1}. ${a.description}`).join('\n')}
` : ''}

## Instructions
Analyze the error and respond with a JSON object. Consider:
- If the error mentions a missing UID/ID (e.g., "resource_type_uid not found"), suggest creating that entity first
- If the error is about validation (wrong type, missing field), check if it's a documentation issue
- If you can't determine a fix, set canRetry to false

## Documentation Issue Types to Identify
- MISSING_REQUIRED_FIELD: API requires field but docs might say it's optional
- WRONG_TYPE: Type mismatch between what API expects vs what was sent
- UNDOCUMENTED_ERROR: This error status code might not be documented
- WRONG_ENUM: API rejected a value that might be documented as valid
- MISSING_FIELD_IN_SCHEMA: API returns fields not in documentation
- DEPRECATED_FIELD: A documented field has no effect

## Response Format
Return ONLY a JSON object:
\`\`\`json
{
  "rootCause": "Brief description of why the test failed",
  "analysisType": "missing_dependency" | "documentation_issue" | "both" | "unknown",
  "canRetry": true/false,
  "prerequisites": [
    {
      "endpoint": "/v3/path/to/create",
      "method": "POST",
      "description": "Why this needs to be created",
      "extractField": "uid",
      "storeAs": "parameter_name_uid"
    }
  ],
  "documentationIssues": [
    {
      "type": "MISSING_REQUIRED_FIELD",
      "field": "field_name",
      "message": "Human readable description",
      "suggestion": "How to fix the documentation"
    }
  ]
}
\`\`\``;
}

/**
 * Parse AI analysis response
 */
function parseAnalysisResponse(content) {
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    
    const parsed = JSON.parse(jsonStr);
    
    return {
      rootCause: parsed.rootCause || 'Unknown',
      analysisType: parsed.analysisType || 'unknown',
      canRetry: parsed.canRetry === true,
      prerequisites: Array.isArray(parsed.prerequisites) ? parsed.prerequisites : [],
      documentationIssues: Array.isArray(parsed.documentationIssues) ? parsed.documentationIssues : []
    };
  } catch (error) {
    console.error('[Self-Healer] Failed to parse AI response:', error.message);
    return {
      rootCause: 'Failed to parse AI response',
      analysisType: 'unknown',
      canRetry: false,
      prerequisites: [],
      documentationIssues: []
    };
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
    const response = await apiClient.request(requestConfig);
    
    // Extract the UID from response
    let extractedUid = null;
    if (extractField && response.data) {
      extractedUid = extractUidFromResponse(response.data, extractField);
    }
    
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
 * Extract UID from API response
 */
function extractUidFromResponse(data, fieldName) {
  // Try direct field
  if (data[fieldName]) return data[fieldName];
  
  // Try in data wrapper
  if (data.data?.[fieldName]) return data.data[fieldName];
  
  // Try uid/id at root or in data
  if (fieldName === 'uid' || fieldName === 'id') {
    if (data.uid) return data.uid;
    if (data.id) return data.id;
    if (data.data?.uid) return data.data.uid;
    if (data.data?.id) return data.data.id;
  }
  
  // Try first item in array (for list responses)
  const arrayKeys = Object.keys(data.data || data).filter(k => Array.isArray((data.data || data)[k]));
  if (arrayKeys.length > 0) {
    const arr = (data.data || data)[arrayKeys[0]];
    if (arr.length > 0 && arr[0][fieldName]) {
      return arr[0][fieldName];
    }
  }
  
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
    
    // Execute prerequisites
    if (analysis.prerequisites.length > 0) {
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
          createdEntities.push(prereqResult);
          
          // Add success to history
          healingHistory.push({
            type: 'created',
            icon: '✅',
            title: `Created Successfully`,
            description: `${prereq.method || 'POST'} ${prereq.endpoint}`,
            details: prereqResult.extractedUid 
              ? `Extracted: ${prereqResult.storeAs || 'uid'} = ${prereqResult.extractedUid}`
              : null,
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
      
      // Retry the original test with new params
      healingHistory.push({
        type: 'retrying',
        icon: '🔄',
        title: 'Retrying Original Request',
        description: `${endpoint.method} ${endpoint.path}`,
        details: `With resolved parameters: ${Object.keys(currentParams).filter(k => currentParams[k]).join(', ')}`,
        timestamp: new Date().toISOString()
      });
      
      onProgress?.({ type: 'retrying', attempt, newParams: currentParams, healingHistory });
      
      const retryResult = await retryTest(endpoint, currentParams);
      
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
          createdEntities
        });
      }
    } else {
      // No prerequisites suggested, can't fix
      healingHistory.push({
        type: 'no_fix',
        icon: '🤷',
        title: 'No Fix Available',
        description: analysis.rootCause,
        timestamp: new Date().toISOString()
      });
      
      attempts.push({
        attempt,
        description: `No prerequisites suggested: ${analysis.rootCause}`,
        analysis
      });
      break;
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
  executePrerequisite,
  attemptSelfHealing,
  DOC_ISSUE_TYPES
};
