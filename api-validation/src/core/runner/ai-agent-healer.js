/**
 * AI Agent Healer - Tool-based approach with source code access and workflow repository
 * Give Claude tools and let it figure out how to fix failing tests
 */

const Anthropic = require('@anthropic-ai/sdk');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workflowRepo = require('../workflows/repository');

let anthropicClient = null;

// Repository paths for source code access
const REPO_PATHS = {
  core: process.env.CORE_REPO_PATH || '/Users/ram.almog/Documents/GitHub/core',
  vcita: process.env.VCITA_REPO_PATH || '/Users/ram.almog/Documents/GitHub/vcita'
};

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
    name: "search_source_code",
    description: "Search for code patterns in the core or vcita repositories. Use this to understand server-side validation, required parameters, actual data types, or why certain errors occur.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita"],
          description: "Which repository to search in"
        },
        search_pattern: {
          type: "string",
          description: "Text or regex pattern to search for (e.g., 'def create', 'validates :name', 'packages_api')"
        },
        file_glob: {
          type: "string",
          description: "Optional file pattern to filter (e.g., '*.rb', '*controller*')"
        }
      },
      required: ["repository", "search_pattern"]
    }
  },
  {
    name: "read_source_file",
    description: "Read a specific source file from core or vcita repositories to understand implementation details.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita"],
          description: "Which repository to read from"
        },
        file_path: {
          type: "string",
          description: "Path to the file within the repository (e.g., 'modules/payments/app/components/payments/packages_api.rb')"
        },
        start_line: {
          type: "integer",
          description: "Optional start line (for large files)"
        },
        end_line: {
          type: "integer",
          description: "Optional end line (for large files)"
        }
      },
      required: ["repository", "file_path"]
    }
  },
  {
    name: "lookup_workflow",
    description: "Search the workflow repository for existing verified workflows. Check this FIRST before trying to fix - a previous solution may exist.",
    input_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "Exact endpoint to lookup (e.g., 'POST /platform/v1/payment/packages')"
        },
        domain: {
          type: "string",
          description: "Search by domain (e.g., 'sales', 'clients')"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Search by tags (e.g., ['payments', 'packages'])"
        },
        text: {
          type: "string",
          description: "Full-text search in workflow content"
        }
      }
    }
  },
  {
    name: "save_workflow",
    description: "Save a verified workflow to the repository for future reuse. ONLY call this AFTER getting a successful 2xx response.",
    input_schema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Brief description of what this endpoint does"
        },
        prerequisites: {
          type: "string",
          description: "What's needed before calling this endpoint (e.g., 'Need a valid service_uid from GET /services')"
        },
        how_to_resolve: {
          type: "string",
          description: "Step-by-step guide to resolve required parameters"
        },
        learnings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" }
            }
          },
          description: "Critical learnings discovered (e.g., 'products must be [] not null')"
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Tags for searching (e.g., ['payments', 'packages'])"
        }
      },
      required: ["summary", "how_to_resolve"]
    }
  },
  {
    name: "suggest_doc_fix",
    description: "Suggest documentation improvements. ONLY call this AFTER getting a successful 2xx response to verify your findings.",
    input_schema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Which field has the issue" },
              issue: { type: "string", description: "What's wrong with the current doc" },
              suggested_fix: { type: "string", description: "How to fix the documentation" },
              severity: { type: "string", enum: ["critical", "major", "minor"] }
            },
            required: ["field", "issue", "suggested_fix", "severity"]
          },
          description: "List of documentation issues found"
        }
      },
      required: ["issues"]
    }
  },
  {
    name: "mark_success",
    description: "Call this when the test passes (2xx response with valid data). Call save_workflow and suggest_doc_fix BEFORE this if you have findings.",
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
  const { apiClient, config, resolvedParams, onProgress, endpoint, docFixSuggestions, savedWorkflows } = context;
  
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
        
        // Track successful API calls for verification gate
        if (response.status >= 200 && response.status < 300) {
          context.hasSuccessfulApiCall = true;
          context.successfulRequest = { method, path, body };
          context.lastSuccessfulResponse = response.data;
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
    
    case "search_source_code": {
      const { repository, search_pattern, file_glob } = toolInput;
      const repoPath = REPO_PATHS[repository];
      
      onProgress?.({
        type: 'agent_action',
        action: 'search_source_code',
        details: `Searching ${repository} for: ${search_pattern}`
      });
      
      if (!repoPath || !fs.existsSync(repoPath)) {
        return { error: `Repository ${repository} not found at ${repoPath}` };
      }
      
      try {
        const escapedPattern = search_pattern.replace(/"/g, '\\"').replace(/'/g, "'\\''");
        let cmd;
        let result;
        
        // Try ripgrep first, fall back to grep if not available
        try {
          // Check if rg is available
          execSync('which rg', { encoding: 'utf8' });
          const globArg = file_glob ? `--glob "${file_glob}"` : '';
          cmd = `rg --max-count 30 -n ${globArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        } catch (rgError) {
          // ripgrep not available, fall back to grep
          const includeArg = file_glob ? `--include="${file_glob}"` : '--include="*.rb" --include="*.js" --include="*.ts"';
          cmd = `grep -rn ${includeArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        }
        
        if (!result || result.trim() === '') {
          return { 
            results: 'No matches found',
            searched_in: repoPath,
            tip: 'The code might be in a different service/microservice. Check if this is a gateway endpoint.',
            note: 'Some endpoints like /business/communication/* are served by separate gateway services, not by core Ruby code.'
          };
        }
        
        return { 
          results: result,
          tip: 'Use read_source_file to examine specific files in detail'
        };
      } catch (e) {
        return { 
          results: 'No matches found', 
          searched_in: repoPath,
          error_hint: e.message,
          tip: 'The code might be in a different service/microservice. Check if this is a gateway endpoint.'
        };
      }
    }
    
    case "read_source_file": {
      const { repository, file_path, start_line, end_line } = toolInput;
      const repoPath = REPO_PATHS[repository];
      const fullPath = path.join(repoPath, file_path);
      
      onProgress?.({
        type: 'agent_action',
        action: 'read_source_file',
        details: `Reading ${repository}/${file_path}`
      });
      
      if (!fs.existsSync(fullPath)) {
        return { error: `File not found: ${file_path}` };
      }
      
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        
        if (start_line && end_line) {
          const slice = lines.slice(start_line - 1, end_line);
          return {
            file: file_path,
            lines: `${start_line}-${end_line}`,
            content: slice.map((line, i) => `${start_line + i}| ${line}`).join('\n')
          };
        }
        
        // For large files, return first 150 lines with a note
        if (lines.length > 150) {
          return {
            file: file_path,
            total_lines: lines.length,
            content: lines.slice(0, 150).map((line, i) => `${i + 1}| ${line}`).join('\n'),
            note: `File has ${lines.length} lines. Showing first 150. Use start_line/end_line for specific sections.`
          };
        }
        
        return {
          file: file_path,
          content: lines.map((line, i) => `${i + 1}| ${line}`).join('\n')
        };
      } catch (e) {
        return { error: `Error reading file: ${e.message}` };
      }
    }
    
    case "lookup_workflow": {
      const { endpoint: searchEndpoint, domain, tags, text } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'lookup_workflow',
        details: searchEndpoint || domain || (tags && tags.join(', ')) || text || 'all'
      });
      
      // Exact endpoint lookup
      if (searchEndpoint) {
        const workflow = workflowRepo.get(searchEndpoint);
        if (workflow) {
          // Increment reuse counter
          workflowRepo.incrementReuse(searchEndpoint);
          return {
            found: true,
            workflow: {
              endpoint: workflow.endpoint,
              domain: workflow.domain,
              tags: workflow.tags,
              successfulRequest: workflow.successfulRequest,
              prerequisites: workflow.sections?.['Prerequisites'],
              howToResolve: workflow.sections?.['How to Resolve Parameters'],
              learnings: workflow.sections?.['Critical Learnings'],
              timesReused: workflow.timesReused
            }
          };
        }
        return { found: false, message: `No workflow found for ${searchEndpoint}` };
      }
      
      // Search by criteria
      const results = workflowRepo.search({ domain, tags, text });
      if (results.length === 0) {
        return { found: false, results: [], message: 'No matching workflows found' };
      }
      
      return {
        found: true,
        count: results.length,
        results: results.map(r => ({
          endpoint: r.endpoint,
          domain: r.domain,
          tags: r.tags,
          timesReused: r.timesReused
        }))
      };
    }
    
    case "save_workflow": {
      // Verification gate: must have successful API call first
      if (!context.hasSuccessfulApiCall) {
        return {
          error: "Cannot save workflow without verification. You must get a 2xx response first to prove the workflow works.",
          hint: "Use execute_api to verify your fix works, then call save_workflow."
        };
      }
      
      const { summary, prerequisites, how_to_resolve, learnings, tags } = toolInput;
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      
      onProgress?.({
        type: 'agent_action',
        action: 'save_workflow',
        details: `Saving workflow for ${endpointKey}`
      });
      
      const result = workflowRepo.save(endpointKey, {
        summary,
        prerequisites,
        howToResolve: how_to_resolve,
        learnings: learnings || [],
        tags: tags || [],
        successfulRequest: context.successfulRequest,
        domain: endpoint.domain
      });
      
      if (result.success) {
        savedWorkflows.push({
          endpoint: endpointKey,
          file: result.file
        });
      }
      
      return result;
    }
    
    case "suggest_doc_fix": {
      // Verification gate: must have successful API call first
      if (!context.hasSuccessfulApiCall) {
        return {
          error: "Cannot suggest doc fixes without verification. You must get a 2xx response first to prove your findings.",
          hint: "Fix the test first (get 2xx response), then call suggest_doc_fix with verified findings."
        };
      }
      
      const { issues } = toolInput;
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      
      onProgress?.({
        type: 'agent_action',
        action: 'suggest_doc_fix',
        details: `${issues.length} suggestion(s) for ${endpointKey}`
      });
      
      // Store suggestions
      docFixSuggestions.push(...issues.map(issue => ({
        ...issue,
        endpoint: endpointKey,
        verified: true,
        verifiedAt: new Date().toISOString()
      })));
      
      return {
        success: true,
        message: `Recorded ${issues.length} verified documentation fix suggestion(s)`,
        note: 'These will be included in the validation report and CSV export'
      };
    }
    
    case "mark_success": {
      return { done: true, success: true, summary: toolInput.summary };
    }
    
    case "mark_failure": {
      return { 
        done: true, 
        success: false, 
        reason: toolInput.reason
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
 * Build existing workflow context if available
 */
function buildWorkflowContext(endpoint) {
  const endpointKey = `${endpoint.method} ${endpoint.path}`;
  const workflow = workflowRepo.get(endpointKey);
  
  if (!workflow) {
    return '';
  }
  
  return `
## SAVED WORKFLOW - TRY THIS FIRST

A previous run saved this verified workflow for this endpoint:

**Prerequisites**: ${workflow.sections?.['Prerequisites'] || 'None documented'}

**How to Resolve Parameters**:
${workflow.sections?.['How to Resolve Parameters'] || 'Not documented'}

**Critical Learnings**:
${workflow.sections?.['Critical Learnings'] || 'None documented'}

**Verified Successful Request**:
\`\`\`json
${JSON.stringify(workflow.successfulRequest, null, 2)}
\`\`\`

**Times Reused**: ${workflow.timesReused || 0}

Try this workflow first by executing the same API calls. If it still works, call mark_success.
If it no longer works, proceed to analyze and find a new solution.
`;
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
  
  // Storage for doc fix suggestions and saved workflows
  const docFixSuggestions = [];
  const savedWorkflows = [];
  
  // Build initial context with ALL endpoints and config params
  const context = {
    apiClient,
    config,
    endpoint,
    resolvedParams: { 
      ...config.params,  // business_id, business_uid, staff_id, etc
      ...resolvedParams 
    },
    allEndpoints,
    onProgress,
    docFixSuggestions,
    savedWorkflows,
    hasSuccessfulApiCall: false,
    successfulRequest: null,
    lastSuccessfulResponse: null
  };
  
  // Format all endpoints for the prompt
  const endpointsContext = formatEndpointsForContext(allEndpoints);
  
  // Check for existing workflow
  const workflowContext = buildWorkflowContext(endpoint);
  
  const systemPrompt = `You are an API testing and documentation improvement agent. A test has failed and you need to fix it.

## Your Tools
1. **execute_api** - Make any API call (GET, POST, PUT, DELETE)
2. **search_source_code** - Search backend Ruby/JS code to understand validation rules
3. **read_source_file** - Read specific source files for implementation details
4. **lookup_workflow** - Search the workflow repository for existing solutions
5. **save_workflow** - Save your solution for future reuse (AFTER 2xx verification)
6. **suggest_doc_fix** - Suggest documentation improvements (AFTER 2xx verification)
7. **mark_success** - Call when test passes
8. **mark_failure** - Call when test cannot be fixed

## Available Tokens
${Object.keys(config.tokens || {}).join(', ')}

## Source Code Access
You can search and read the backend code in 'core' and 'vcita' repositories when:
- API errors are unclear or undocumented
- You need to understand validation rules
- Parameter types in docs don't match actual requirements

Example: If packages creation fails, search for "packages_api" or "def create" in core.

**IMPORTANT - Gateway Endpoints**: Some endpoints are served by separate microservices, not core Ruby code:
- \`/business/communication/*\` - Communication Gateway service
- \`/business/payments/*\` - Payment Gateway service
If search_source_code returns no results, the endpoint might be a gateway route. In this case:
1. Try different query parameters based on the endpoint pattern
2. Use mark_failure explaining the code is in a separate service

## All Available API Endpoints (${allEndpoints.length} total)
${endpointsContext}
${workflowContext}
## WORKFLOW REPOSITORY

1. **FIRST**: Use lookup_workflow to check for existing solutions
2. If found, try the verified request from the workflow
3. If it works, just call mark_success

When creating new solutions:
1. Must get 2xx response first (verification)
2. THEN call save_workflow with your findings
3. THEN call suggest_doc_fix with documentation issues
4. THEN call mark_success

## VERIFICATION REQUIRED

You MUST get a 2xx response BEFORE calling:
- save_workflow
- suggest_doc_fix

Order: analyze → fix → verify (2xx) → save_workflow → suggest_doc_fix → mark_success

If you cannot get a 2xx response, just call mark_failure.

## Strategy
1. Check lookup_workflow first for existing solutions
2. Analyze the error - what's wrong?
3. If error is unclear, use search_source_code to find the controller/service
4. Find relevant endpoints to resolve parameters
5. Use execute_api to GET existing entities or POST to create new ones
6. Retry the original request with correct data
7. Once successful (2xx), save the workflow and suggest doc fixes

## Important Notes
- **CRITICAL**: When API says "business_id", use business_uid value (the string UID, not numeric ID)
- Same for other entities: "service_id" usually means service_uid, "client_id" means client_uid
- For arrays like "products": use empty array [] not null when no items needed

Maximum ${maxIterations} API calls allowed.`;

  // Include config params (business_id, staff_id, etc.) in resolved params
  const allParams = {
    ...config.params,
    ...resolvedParams
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

**Available IDs and UIDs you can use**:
\`\`\`json
${JSON.stringify(allParams, null, 2)}
\`\`\`

Key parameters:
- business_uid: ${allParams.business_uid || 'not set'} ← USE THIS for most "business_id" parameters!
- business_id (numeric): ${allParams.business_id || 'not set'}
- staff_uid: ${allParams.staff_uid || allParams.staff_id || 'not set'}
- client_uid: ${allParams.client_uid || 'not set'}

Fix this test. Remember:
1. First check lookup_workflow for existing solutions
2. After getting 2xx, call save_workflow and suggest_doc_fix
3. Then call mark_success`;

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
      
      const toolResult = await executeTool(toolUse.name, toolUse.input, context);
      
      healingLog.push({
        type: 'tool_result',
        iteration: iterations,
        tool: toolUse.name,
        result: toolResult
      });
      
      onProgress?.({
        type: 'agent_tool_result',
        iteration: iterations,
        tool: toolUse.name,
        success: toolResult.success,
        status: toolResult.status
      });
      
      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolResult)
      });
      
      // Check if done
      if (toolResult.done) {
        onProgress?.({
          type: 'agent_complete',
          success: toolResult.success,
          summary: toolResult.summary || toolResult.reason,
          docFixCount: docFixSuggestions.length,
          workflowSaved: savedWorkflows.length > 0
        });
        
        return {
          success: toolResult.success,
          summary: toolResult.summary,
          reason: toolResult.reason,
          docFixSuggestions,
          savedWorkflows,
          iterations,
          healingLog,
          resolvedParams: context.resolvedParams,
          workflowReused: context.workflowReused || false
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
    summary: `Reached maximum ${maxIterations} iterations`,
    docFixCount: docFixSuggestions.length,
    workflowSaved: savedWorkflows.length > 0
  });
  
  return {
    success: false,
    reason: `Reached maximum ${maxIterations} iterations without resolution`,
    docFixSuggestions,
    savedWorkflows,
    iterations,
    healingLog,
    resolvedParams: context.resolvedParams
  };
}

/**
 * Check if an error is unrecoverable
 */
function isUnrecoverableError(status, data) {
  // 401/403 = auth issues, not fixable by AI
  if (status === 401 || status === 403) return true;
  return false;
}

/**
 * Lookup workflow from repository (exported for use in validate.js)
 */
function lookupWorkflow(endpoint) {
  return workflowRepo.get(endpoint);
}

module.exports = {
  runAgentHealer,
  isUnrecoverableError,
  lookupWorkflow,
  TOOLS
};
