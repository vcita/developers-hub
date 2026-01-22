/**
 * AI Agent Healer - Tool-based approach
 * Give Claude tools and let it figure out how to fix failing tests
 */

const Anthropic = require('@anthropic-ai/sdk');

let anthropicClient = null;

function initializeClient(apiKey) {
  if (!apiKey) return null;
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Define the tools Claude can use
 */
const TOOLS = [
  {
    name: "execute_api",
    description: "Execute an API call. Use this to create entities, fetch data, or retry the original request with modifications.",
    input_schema: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method"
        },
        path: {
          type: "string",
          description: "API path (e.g., /platform/v1/services)"
        },
        body: {
          type: "object",
          description: "Request body for POST/PUT/PATCH requests"
        },
        token_type: {
          type: "string",
          enum: ["staff", "directory", "client", "business", "app"],
          description: "Which token to use. Default is 'staff'."
        }
      },
      required: ["method", "path"]
    }
  },
  {
    name: "mark_success",
    description: "Call this when the test passes (2xx response with valid data).",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Brief summary of what fixed the issue"
        }
      },
      required: ["summary"]
    }
  },
  {
    name: "mark_failure",
    description: "Call this when you've determined the issue cannot be fixed automatically.",
    input_schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Why the issue cannot be fixed"
        },
        documentation_issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string" },
              issue: { type: "string" },
              suggestion: { type: "string" }
            }
          },
          description: "Any documentation issues found"
        }
      },
      required: ["reason"]
    }
  }
];

/**
 * Execute a tool call
 */
async function executeTool(toolName, toolInput, context) {
  const { apiClient, config, resolvedParams, onProgress } = context;
  
  switch (toolName) {
    case "execute_api": {
      const { method, path, body, token_type = 'staff' } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'execute_api',
        details: `${method} ${path}`
      });
      
      try {
        const token = config.tokens?.[token_type] || config.tokens?.staff;
        const response = await apiClient.request({
          method: method.toLowerCase(),
          url: path,
          data: body,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Store any UIDs from the response
        if (response.data) {
          const extractedUids = extractAllUids(response.data);
          Object.assign(resolvedParams, extractedUids);
        }
        
        return {
          success: true,
          status: response.status,
          data: response.data,
          extracted_uids: extractAllUids(response.data)
        };
      } catch (error) {
        return {
          success: false,
          status: error.response?.status,
          error: error.response?.data || error.message
        };
      }
    }
    
    case "mark_success": {
      return { done: true, success: true, summary: toolInput.summary };
    }
    
    case "mark_failure": {
      return { 
        done: true, 
        success: false, 
        reason: toolInput.reason,
        documentation_issues: toolInput.documentation_issues 
      };
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Extract all UIDs from a response
 */
function extractAllUids(data) {
  const uids = {};
  
  const extract = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    
    for (const [key, value] of Object.entries(obj)) {
      if ((key === 'uid' || key === 'id' || key.endsWith('_uid') || key.endsWith('_id')) && 
          typeof value === 'string' && value.length > 0) {
        const uidKey = prefix ? `${prefix}_${key}` : key;
        uids[uidKey] = value;
      }
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        extract(value, key);
      }
    }
  };
  
  extract(data);
  extract(data?.data);
  
  return uids;
}

/**
 * Format all endpoints for context
 */
function formatEndpointsForContext(allEndpoints) {
  // Group by domain
  const grouped = {};
  
  allEndpoints.forEach(e => {
    const domain = e.domain || 'other';
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(`${e.method} ${e.path}${e.summary ? ' - ' + e.summary : ''}`);
  });
  
  // Format as readable text
  let text = '';
  for (const [domain, endpoints] of Object.entries(grouped)) {
    text += `\n### ${domain}\n`;
    endpoints.forEach(ep => {
      text += `- ${ep}\n`;
    });
  }
  
  return text;
}

/**
 * Run the agent to fix a failing test
 */
async function runAgentHealer(options) {
  const {
    endpoint,
    result,
    resolvedParams,
    allEndpoints,
    config,
    apiClient,
    maxIterations = 15,
    onProgress
  } = options;
  
  const client = initializeClient(config.ai?.anthropicApiKey);
  if (!client) {
    return {
      success: false,
      reason: 'No AI API key configured'
    };
  }
  
  // Build initial context with ALL endpoints and config params
  const context = {
    apiClient,
    config,
    resolvedParams: { 
      ...config.params,  // business_id, business_uid, staff_id, etc
      ...resolvedParams 
    },
    allEndpoints,
    onProgress
  };
  
  // Format all endpoints for the prompt
  const endpointsContext = formatEndpointsForContext(allEndpoints);
  
  const systemPrompt = `You are an API testing agent. A test has failed and you need to fix it.

## Your Tools
1. execute_api - Make any API call (GET, POST, PUT, DELETE)
2. mark_success - Call when you've fixed the test
3. mark_failure - Call when it cannot be fixed

## Available Tokens
${Object.keys(config.tokens || {}).join(', ')}

## All Available API Endpoints (${allEndpoints.length} total)
${endpointsContext}

## Strategy
1. Analyze the error - what's wrong? (invalid ID, missing entity, wrong format?)
2. Find relevant endpoints above that can help:
   - If service ID is invalid → find /services endpoints to GET list or POST create
   - If product ID is invalid → find /products endpoints
3. Use execute_api to:
   - GET existing entities to find valid IDs
   - POST to create new entities if needed
4. Extract UIDs from responses and use them in retry
5. Retry the original failing request with correct data

## Important Notes
- **CRITICAL**: When API says "business_id", use business_uid value (the string UID, not numeric ID)
- Same for other entities: "service_id" usually means service_uid, "client_id" means client_uid
- Pay attention to field names: API might want 'service_uid' not 'id'
- Check response data for UIDs: look for 'uid', 'id', 'service_uid', etc.
- Try listing existing entities before creating new ones
- For GET requests with business_id: /endpoint?business_id={business_uid}

Maximum ${maxIterations} API calls allowed.`;

  // Include config params (business_id, staff_id, etc.) in resolved params
  const allParams = {
    ...config.params,  // business_id, business_uid, staff_id, etc from tokens.json
    ...resolvedParams  // Any dynamically resolved params
  };
  
  const userMessage = `## Failing Test

**Endpoint**: ${endpoint.method} ${endpoint.path}
**Summary**: ${endpoint.summary || 'N/A'}

**Request that failed**:
\`\`\`json
${JSON.stringify(result.details?.request?.data || {}, null, 2)}
\`\`\`

**Error Response** (HTTP ${result.httpStatus}):
\`\`\`json
${JSON.stringify(result.details?.response?.data || {}, null, 2)}
\`\`\`

**IMPORTANT - Available IDs and UIDs you can use**:
\`\`\`json
${JSON.stringify(allParams, null, 2)}
\`\`\`

These are REAL IDs from the system:
- business_uid: ${allParams.business_uid || 'not set'} ← USE THIS for most "business_id" parameters!
- business_id (numeric): ${allParams.business_id || 'not set'}
- staff_uid: ${allParams.staff_uid || allParams.staff_id || 'not set'}
- client_uid: ${allParams.client_uid || 'not set'}
- directory_id: ${allParams.directory_id || 'not set'}

**IMPORTANT NAMING CONVENTION**: In this API, when a parameter is called "business_id", it usually expects the business_uid value (string like "${allParams.business_uid}"), NOT the numeric ID. Same for other entities - "service_id" often means service_uid, "client_id" often means client_uid, etc.

Fix this test. Use business_uid for business_id parameters:
- GET /platform/v1/services?business_id=${allParams.business_uid}
- POST endpoints with business_id in body should use: "business_id": "${allParams.business_uid}"`;

  const messages = [{ role: "user", content: userMessage }];
  const healingLog = [];
  let iterations = 0;
  
  onProgress?.({
    type: 'agent_start',
    endpoint: `${endpoint.method} ${endpoint.path}`,
    maxIterations
  });
  
  // Agent loop
  while (iterations < maxIterations) {
    iterations++;
    
    onProgress?.({
      type: 'agent_thinking',
      iteration: iterations
    });
    
    // Call Claude
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: systemPrompt,
      tools: TOOLS,
      messages
    });
    
    // Check if Claude wants to use tools
    const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
    const textBlocks = response.content.filter(block => block.type === 'text');
    
    // Log any text response
    if (textBlocks.length > 0) {
      const thought = textBlocks.map(b => b.text).join('\n');
      healingLog.push({
        type: 'thought',
        iteration: iterations,
        content: thought
      });
      onProgress?.({
        type: 'agent_thought',
        iteration: iterations,
        thought: thought.substring(0, 200)
      });
    }
    
    // If no tool calls, Claude is done thinking
    if (toolUseBlocks.length === 0) {
      healingLog.push({
        type: 'no_action',
        iteration: iterations,
        content: 'Agent stopped without marking success or failure'
      });
      break;
    }
    
    // Execute each tool call
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      healingLog.push({
        type: 'tool_call',
        iteration: iterations,
        tool: toolUse.name,
        input: toolUse.input
      });
      
      onProgress?.({
        type: 'agent_tool_call',
        iteration: iterations,
        tool: toolUse.name,
        input: toolUse.input
      });
      
      const result = await executeTool(toolUse.name, toolUse.input, context);
      
      healingLog.push({
        type: 'tool_result',
        iteration: iterations,
        tool: toolUse.name,
        result: result
      });
      
      onProgress?.({
        type: 'agent_tool_result',
        iteration: iterations,
        tool: toolUse.name,
        success: result.success,
        status: result.status
      });
      
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result)
      });
      
      // Check if done
      if (result.done) {
        onProgress?.({
          type: 'agent_complete',
          success: result.success,
          summary: result.summary || result.reason
        });
        
        return {
          success: result.success,
          summary: result.summary,
          reason: result.reason,
          documentationIssues: result.documentation_issues || [],
          iterations,
          healingLog,
          resolvedParams: context.resolvedParams
        };
      }
    }
    
    // Add assistant response and tool results to messages
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }
  
  // Max iterations reached
  onProgress?.({
    type: 'agent_complete',
    success: false,
    summary: `Reached maximum ${maxIterations} iterations`
  });
  
  return {
    success: false,
    reason: `Reached maximum ${maxIterations} iterations without resolution`,
    iterations,
    healingLog,
    resolvedParams: context.resolvedParams
  };
}

module.exports = {
  runAgentHealer,
  TOOLS
};
