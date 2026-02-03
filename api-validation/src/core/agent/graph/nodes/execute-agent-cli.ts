/**
 * Execute Agent CLI Node
 *
 * Uses Claude Code CLI (headless mode) for API execution with self-healing.
 * This gives Claude direct shell access to:
 * - Execute APIs with curl
 * - Edit swagger/workflow files if still wrong
 * - Self-heal on failures
 *
 * Features:
 * - Streaming output for real-time UI updates
 * - Flexible JSON parsing (handles various Claude output formats)
 * - Full request/response logging
 * - Self-healing with retry logic
 */

import { spawn } from 'child_process';
import { Command } from '@langchain/langgraph';
import type { GraphValidationState, ExecutionResult } from '../state.js';
import type { ProgressCallback } from '../../state.js';
import * as fs from 'fs';

// =============================================================================
// Configuration
// =============================================================================

const WS2_BASE = '/Users/yehoshua.katz/ws2';
const DEVELOPERS_HUB = `${WS2_BASE}/developers-hub`;
const LOG_FILE = '/tmp/execute-agent-cli.log';
const LOG_PREFIX = '[execute-agent]';

// =============================================================================
// Logging - Dual Channel (File + Console + UI)
// =============================================================================

let currentOnProgress: ProgressCallback | undefined;

function log(message: string, level: 'info' | 'debug' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${LOG_PREFIX} ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);

  switch (level) {
    case 'error':
      console.error(`${LOG_PREFIX} ${message}`);
      break;
    case 'warn':
      console.warn(`${LOG_PREFIX} ${message}`);
      break;
    case 'debug':
      console.log(`${LOG_PREFIX} [DEBUG] ${message}`);
      break;
    default:
      console.log(`${LOG_PREFIX} ${message}`);
  }

  // Send to UI for important messages
  if (level !== 'debug' && currentOnProgress) {
    currentOnProgress({
      type: 'healing_analyzing',
      details: message,
    } as any);
  }
}

function clearLog(): void {
  fs.writeFileSync(LOG_FILE, `Execute Agent CLI Log\nStarted: ${new Date().toISOString()}\n\n`);
}

// =============================================================================
// Flexible JSON Parser
// =============================================================================

interface ParsedExecuteResult {
  status: 'pass' | 'fail' | 'retry';
  httpStatus?: number;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: Record<string, unknown> | null;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    data?: unknown;
  };
  summary: string;
  swaggerFixed?: {
    file: string;
    changes: string;
    ranUnify?: boolean;
  };
  workflowFixed?: {
    file: string;
    action: 'created' | 'updated';
  };
  retryReason?: string;
  learnings?: string[];
  prerequisites?: any[];
}

function parseClaudeExecuteOutput(rawJson: any): ParsedExecuteResult {
  const result: ParsedExecuteResult = {
    status: 'fail',
    summary: 'No result parsed',
  };

  if (!rawJson) return result;

  // === STATUS MAPPING ===
  if (rawJson.status) {
    const statusMap: Record<string, ParsedExecuteResult['status']> = {
      'pass': 'pass',
      'fail': 'fail',
      'retry': 'retry',
      'success': 'pass',
      'error': 'fail',
      'PASS': 'pass',
      'FAIL': 'fail',
    };
    result.status = statusMap[rawJson.status] || 'fail';
  }

  // === HTTP STATUS ===
  result.httpStatus = rawJson.httpStatus ||
    rawJson.http_status ||
    rawJson.response?.status ||
    rawJson.response?.statusCode;

  // === REQUEST ===
  if (rawJson.request) {
    result.request = {
      method: rawJson.request.method || 'GET',
      url: rawJson.request.url || rawJson.request.path || '',
      headers: rawJson.request.headers,
      body: rawJson.request.body || rawJson.request.data,
    };
  } else if (rawJson.curl_command || rawJson.curlCommand) {
    // Try to parse from curl command
    const curl = rawJson.curl_command || rawJson.curlCommand;
    const methodMatch = curl.match(/-X\s+(\w+)/);
    const urlMatch = curl.match(/https?:\/\/[^\s"']+/);
    result.request = {
      method: methodMatch?.[1] || 'GET',
      url: urlMatch?.[0] || '',
    };
  }

  // === RESPONSE ===
  if (rawJson.response) {
    result.response = {
      status: rawJson.response.status || rawJson.response.statusCode || result.httpStatus || 0,
      headers: rawJson.response.headers,
      data: rawJson.response.data || rawJson.response.body || rawJson.response,
    };
  }

  // === SUMMARY ===
  result.summary = rawJson.summary ||
    rawJson.message ||
    rawJson.description ||
    (result.status === 'pass' ? `HTTP ${result.httpStatus} OK` : `HTTP ${result.httpStatus || 'error'}`);

  // === SWAGGER FIXED ===
  if (rawJson.swaggerFixed || rawJson.swagger_fixed) {
    const sf = rawJson.swaggerFixed || rawJson.swagger_fixed;
    result.swaggerFixed = {
      file: sf.file || sf.path || '',
      changes: sf.changes || sf.description || 'Modified',
      ranUnify: sf.ranUnify ?? sf.ran_unify ?? true,
    };
  }

  // === WORKFLOW FIXED ===
  if (rawJson.workflowFixed || rawJson.workflow_fixed || rawJson.workflowUpdate) {
    const wf = rawJson.workflowFixed || rawJson.workflow_fixed || {};
    result.workflowFixed = {
      file: wf.file || wf.path || '',
      action: wf.action || 'updated',
    };
  }

  // === RETRY REASON ===
  result.retryReason = rawJson.retryReason || rawJson.retry_reason;

  // === EXTRA DATA ===
  if (rawJson.learnings) {
    result.learnings = rawJson.learnings;
  }
  if (rawJson.prerequisites) {
    result.prerequisites = rawJson.prerequisites;
  }

  log(`Parsed result: status=${result.status}, httpStatus=${result.httpStatus}, summary=${result.summary.substring(0, 50)}...`);
  return result;
}

// =============================================================================
// Prompt Builder
// =============================================================================

interface ExecutionPromptParams {
  endpoint: GraphValidationState['endpoint'];
  tokens: GraphValidationState['tokens'];
  params: GraphValidationState['params'];
  workflow: GraphValidationState['workflow'];
  config: GraphValidationState['config'];
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

function buildExecutionPrompt(params: ExecutionPromptParams): string {
  const { endpoint, tokens, params: resolvedParams, workflow, config, retryCount, maxRetries, lastError } = params;
  const { method, path: apiPath, requestSchema, description } = endpoint;

  // Extract token type from description
  const tokenMatch = description?.match(/Available for \*\*([^*]+)\*\*/);
  const documentedTokenType = tokenMatch?.[1]?.toLowerCase() || 'staff';

  // Build body template from schema
  const bodyProps = requestSchema?.properties || {};
  const bodyRequired = requestSchema?.required || [];

  // Build path with resolved params
  let resolvedPath = apiPath;
  for (const [key, value] of Object.entries(resolvedParams)) {
    resolvedPath = resolvedPath.replace(`{${key}}`, String(value));
  }

  // Format prerequisites from workflow
  const prerequisitesSection = workflow?.prerequisites && workflow.prerequisites.length > 0
    ? workflow.prerequisites.map((p, i) => {
        const extract = p.extract ? Object.entries(p.extract).map(([k, v]) => `${k}=${v}`).join(', ') : 'none';
        return `${i + 1}. ${p.method} ${p.path} -> extract: ${extract}`;
      }).join('\n')
    : 'No prerequisites defined';

  // Format test request from workflow
  const testRequestSection = workflow?.testRequest
    ? JSON.stringify(workflow.testRequest, null, 2)
    : 'No test request defined in workflow';

  // Format resolved params
  const resolvedParamsSection = Object.entries(resolvedParams).length > 0
    ? Object.entries(resolvedParams).map(([k, v]) => `- ${k}: ${v}`).join('\n')
    : 'No resolved parameters yet';

  // Get the appropriate token
  const tokenTypeKey = documentedTokenType.replace(/ /g, '_').toLowerCase();
  const selectedToken = (tokens as Record<string, string>)?.[tokenTypeKey] ||
                        (tokens as Record<string, string>)?.staff ||
                        'NO_TOKEN_AVAILABLE';

  const prompt = `# API Execution Task

## Endpoint (from agreement check)
- Method: ${method}
- Path: ${apiPath}
- Resolved Path: ${resolvedPath}
- **Primary Base URL**: ${config.baseUrl}
- **Fallback Base URL**: ${(config as any).fallbackUrl || 'https://app.meet2know.com/api2'}
- Swagger File: ${endpoint.swaggerFile || 'unknown'}
- Domain: ${endpoint.domain || 'unknown'}

**IMPORTANT:** If the primary base URL returns 401/403/404, try the fallback URL before reporting failure.

## Documented Token Type
${documentedTokenType}

## Available Tokens (FULL - use these directly, do NOT re-read tokens.json)
- Staff: ${tokens?.staff || 'NOT SET'}
- Client: ${tokens?.client || 'NOT SET'}
- App: ${tokens?.app || 'NOT SET'}
- Admin: ${tokens?.admin || 'NOT SET'}
- Directory: ${tokens?.directory || 'NOT SET'}

**Use this token for the ${documentedTokenType} type:**
\`${selectedToken}\`

**CRITICAL:** Use the token above EXACTLY as provided. Do NOT read tokens.json or truncate tokens.

## Workflow (created by agreement check)
${workflow?.exists ? `
### Prerequisites
${prerequisitesSection}

### Test Request
${testRequestSection}
` : 'No workflow exists - create one if request fails'}

## Resolved Parameters (from state)
${resolvedParamsSection}

## Request Body Schema
Properties: ${JSON.stringify(bodyProps, null, 2)}
Required: ${JSON.stringify(bodyRequired)}

${lastError ? `
## Last Error (retry ${retryCount}/${maxRetries})
${lastError}
` : ''}

## Instructions

### Step 1: Execute Prerequisites (if any)
For each prerequisite in the workflow:
1. Execute the curl command with FULL logging
2. Extract the required values (UIDs, etc.)
3. Store extracted values for the main request

**IMPORTANT:** Log the COMPLETE request AND response for EVERY curl call:
\`\`\`bash
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "REQUEST: <METHOD> <URL>"
echo "Headers:"
echo "  Authorization: Bearer <first 20 chars>..."
echo "  Content-Type: application/json"
echo "Body:"
echo '<full body JSON>'
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Execute and capture
response=$(curl -s -w "\\n%{http_code}" -X <METHOD> "<URL>" \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '<body>')

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | sed '$d')

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESPONSE: $http_code"
echo "Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
\`\`\`

### Step 2: Execute Target Request
Use the same full logging pattern for the main request.

### Step 3: Self-Heal (ONLY if needed)
If the request fails and swagger or workflow is STILL wrong after agreement check:

**For 400/422 errors (validation):**
1. Check if swagger schema matches actual API requirements
2. If swagger is wrong, edit the SOURCE file: \`${DEVELOPERS_HUB}/swagger/<domain>/*.json\`
3. Run: \`cd ${DEVELOPERS_HUB} && npm run unify\`
4. Update workflow if needed
5. Set status='retry'

**For 401/403 errors (auth):**
1. Check if token type in swagger description is correct
2. If wrong, edit swagger source file
3. Run unify
4. Try with correct token
5. Set status='retry'

**For 404 errors:**
1. Check if path parameters are correct
2. Check if the resource exists (may need to create via prerequisite)
3. Update workflow with missing prerequisite if needed
4. Set status='retry'

**Workflow location:** \`${DEVELOPERS_HUB}/api-validation/workflows/<domain>/<method>_<path>.md\`

### Step 4: Output Result

**CRITICAL:** At the end, output this EXACT JSON format:

\`\`\`json
{
  "status": "pass|fail|retry",
  "httpStatus": <number>,
  "request": {
    "method": "${method}",
    "url": "${config.baseUrl}${resolvedPath}",
    "headers": {
      "Authorization": "Bearer <truncated>...",
      "Content-Type": "application/json"
    },
    "body": <request body object or null>
  },
  "response": {
    "status": <http status>,
    "headers": {},
    "data": <full response body>
  },
  "summary": "Description of what happened",
  "swaggerFixed": {
    "file": "path/to/swagger.json",
    "changes": "what was changed",
    "ranUnify": true
  },
  "workflowFixed": {
    "file": "path/to/workflow.md",
    "action": "created|updated"
  },
  "retryReason": "Why retry is needed (only if status=retry)"
}
\`\`\`

## Decision Rules

- **2xx response** → status: "pass"
- **4xx/5xx AND can fix** → status: "retry" (if retryCount < ${maxRetries})
- **4xx/5xx AND cannot fix OR max retries** → status: "fail"
- **retries remaining: ${maxRetries - retryCount}**

Start execution now. Remember to log FULL request AND response for EVERY curl call.
`;

  return prompt;
}

// =============================================================================
// Claude Code CLI Execution with Streaming
// =============================================================================

interface CLIResult {
  success: boolean;
  output: string;
  parsedResult: ParsedExecuteResult;
  error?: string;
  sessionId?: string;
  durationMs?: number;
}

async function runClaudeCodeCLI(
  prompt: string,
  cwd: string,
  onProgress?: ProgressCallback
): Promise<CLIResult> {
  log(`\n${'='.repeat(60)}`);
  log(`CLAUDE CODE CLI - Execute Agent Starting`);
  log(`CWD: ${cwd}`);
  log(`${'='.repeat(60)}`);

  onProgress?.({
    type: 'healing_start',
    details: `Starting Claude Code CLI for API execution`,
  } as any);

  const startTime = Date.now();

  return new Promise((resolve) => {
    const allowedTools = 'Glob,Grep,Read,Edit,Write,Bash,Task';

    // Write prompt to temp file to avoid shell escaping issues
    const promptFile = `/tmp/claude-exec-prompt-${Date.now()}.txt`;
    fs.writeFileSync(promptFile, prompt);
    log(`Prompt written to ${promptFile}`);

    // Build command as single string for shell
    // Note: --verbose is required when using stream-json with piped input
    const cmd = `cat "${promptFile}" | claude --output-format stream-json --verbose --allowedTools "${allowedTools}" --max-turns 30`;
    log(`Command: cat prompt | claude --output-format stream-json --verbose ...`);

    // Use spawn with shell command
    const claude = spawn('bash', ['-c', cmd], {
      cwd,
      env: {
        ...process.env,
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      },
    });

    let fullOutput = '';
    let lastResultJson: any = null;
    let sessionId: string | undefined;

    // Stream stdout
    claude.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      fullOutput += chunk;

      // Parse streaming JSON lines
      const lines = chunk.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const event = JSON.parse(line);

          // Log different event types
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'tool_use') {
                const toolName = block.name;
                const toolInput = JSON.stringify(block.input).substring(0, 150);
                log(`Tool: ${toolName} - ${toolInput}...`, 'debug');
                onProgress?.({
                  type: 'healing_creating',
                  action: toolName,
                  details: toolInput,
                } as any);
              } else if (block.type === 'text') {
                // Log curl commands and responses
                const text = block.text;
                if (text.includes('REQUEST:') || text.includes('RESPONSE:')) {
                  log(text.substring(0, 500), 'info');
                  onProgress?.({
                    type: 'agent_action',
                    action: 'curl_output',
                    details: text.substring(0, 500),
                  } as any);
                } else if (text.length > 50) {
                  log(`Claude: ${text.substring(0, 200)}...`, 'debug');
                }
              }
            }
          } else if (event.type === 'result') {
            lastResultJson = event;
            sessionId = event.session_id;
            log(`Result received (${event.subtype})`);
          }
        } catch {
          // Not JSON, log raw if interesting (curl output etc)
          if (line.includes('REQUEST:') || line.includes('RESPONSE:') || line.includes('HTTP')) {
            log(`CLI: ${line.substring(0, 200)}`, 'info');
          }
        }
      }
    });

    // Stream stderr
    claude.stderr.on('data', (data: Buffer) => {
      const error = data.toString().trim();
      if (error) {
        log(`STDERR: ${error}`, 'warn');
      }
    });

    // Handle completion
    claude.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      log(`\nCLI completed in ${durationMs}ms with code ${code}`);

      // Extract JSON from result
      let rawJson: any = null;
      if (lastResultJson?.result) {
        const jsonMatch = lastResultJson.result.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          try {
            rawJson = JSON.parse(jsonMatch[1]);
          } catch (e) {
            log(`Failed to parse JSON from result: ${e}`, 'warn');
          }
        }
      }

      // Parse with flexible parser
      const parsedResult = parseClaudeExecuteOutput(rawJson);

      onProgress?.({
        type: 'healing_complete',
        success: code === 0 && parsedResult.status === 'pass',
        details: `Completed in ${durationMs}ms - Status: ${parsedResult.status}, HTTP: ${parsedResult.httpStatus}`,
      } as any);

      resolve({
        success: code === 0,
        output: fullOutput,
        parsedResult,
        sessionId,
        durationMs,
        error: code !== 0 ? `CLI exited with code ${code}` : undefined,
      });
    });

    // Handle errors
    claude.on('error', (err) => {
      log(`CLI spawn error: ${err.message}`, 'error');
      resolve({
        success: false,
        output: fullOutput,
        parsedResult: parseClaudeExecuteOutput(null),
        error: err.message,
      });
    });

    // Timeout after 10 minutes
    setTimeout(() => {
      if (!claude.killed) {
        log('CLI timeout - killing process', 'warn');
        claude.kill('SIGTERM');
      }
    }, 10 * 60 * 1000);
  });
}

// =============================================================================
// Execute Agent CLI Node
// =============================================================================

export async function executeAgentCLINode(
  state: GraphValidationState
): Promise<Command> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;
  const maxRetries = state.maxRetries || 5;
  const retryCount = state.retryCount || 0;
  currentOnProgress = state.onProgress;

  clearLog();
  log(`\n${'━'.repeat(60)}`);
  log(`Execute Agent CLI starting for: ${endpointKey}`);
  log(`Attempt ${retryCount + 1}/${maxRetries}`);
  log(`${'━'.repeat(60)}`);

  state.onProgress?.({
    type: 'agent_action',
    action: 'execute_start',
    details: `Executing ${endpointKey} (attempt ${retryCount + 1}/${maxRetries})`,
  });

  // Build prompt with all context from agreement check
  const prompt = buildExecutionPrompt({
    endpoint: state.endpoint,
    tokens: state.tokens,
    params: state.params,
    workflow: state.workflow,
    config: state.config,
    retryCount,
    maxRetries,
    lastError: state.executionResult?.error,
  });

  // Run Claude Code CLI with streaming
  const result = await runClaudeCodeCLI(prompt, DEVELOPERS_HUB, state.onProgress);
  const { parsedResult } = result;

  // Log swagger/workflow fixes
  if (parsedResult.swaggerFixed) {
    log(`Swagger fixed: ${parsedResult.swaggerFixed.file}`);
    log(`Changes: ${parsedResult.swaggerFixed.changes}`);
    state.onProgress?.({
      type: 'agent_action',
      action: 'swagger_fix',
      details: `Fixed ${parsedResult.swaggerFixed.file}: ${parsedResult.swaggerFixed.changes}`,
    });
  }

  if (parsedResult.workflowFixed) {
    log(`Workflow ${parsedResult.workflowFixed.action}: ${parsedResult.workflowFixed.file}`);
    state.onProgress?.({
      type: 'agent_action',
      action: 'workflow_fix',
      details: `${parsedResult.workflowFixed.action} ${parsedResult.workflowFixed.file}`,
    });
  }

  // Build execution result
  const executionResult: ExecutionResult = {
    success: parsedResult.status === 'pass',
    httpStatus: parsedResult.httpStatus,
    status: parsedResult.httpStatus,
    data: parsedResult.response?.data,
    error: parsedResult.status === 'fail' ? parsedResult.summary : undefined,
    summary: parsedResult.summary,
    requestConfig: parsedResult.request ? {
      method: parsedResult.request.method,
      url: parsedResult.request.url,
      headers: parsedResult.request.headers,
      data: parsedResult.request.body || undefined,
    } : undefined,
  };

  // Route based on status
  if (parsedResult.status === 'pass') {
    log(`\n✓ PASS - ${parsedResult.summary}`);

    state.onProgress?.({
      type: 'agent_complete',
      status: 'pass',
      success: true,
      summary: parsedResult.summary,
      request: parsedResult.request,
      response: parsedResult.response,
    } as any);

    return new Command({
      update: {
        executionResult,
        retryCount,
        result: {
          status: 'PASS',
          reason: parsedResult.summary,
          httpStatus: parsedResult.httpStatus,
          request: parsedResult.request,
          response: parsedResult.response,
        },
      },
      goto: 'updateVerification',
    });
  }

  if (parsedResult.status === 'retry' && retryCount + 1 < maxRetries) {
    log(`\n↻ RETRY - ${parsedResult.retryReason || parsedResult.summary}`);

    state.onProgress?.({
      type: 'agent_action',
      action: 'retry',
      details: `Retry ${retryCount + 1}/${maxRetries}: ${parsedResult.retryReason || parsedResult.summary}`,
    });

    return new Command({
      update: {
        executionResult,
        retryCount: retryCount + 1,
      },
      goto: 'executeLoop',
    });
  }

  // Fail - either explicit fail or max retries reached
  log(`\n✗ FAIL - ${parsedResult.summary}`);

  state.onProgress?.({
    type: 'agent_complete',
    status: 'fail',
    success: false,
    summary: parsedResult.summary,
    request: parsedResult.request,
    response: parsedResult.response,
  } as any);

  return new Command({
    update: {
      executionResult,
      retryCount,
      result: {
        status: 'FAIL',
        reason: parsedResult.summary,
        httpStatus: parsedResult.httpStatus,
        request: parsedResult.request,
        response: parsedResult.response,
      },
    },
    goto: 'analyzeFailure',
  });
}

// =============================================================================
// Export
// =============================================================================

export { executeAgentCLINode as executeAgentNode };
