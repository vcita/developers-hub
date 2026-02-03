/**
 * Node 5: Execute Loop - Claude Agent SDK Implementation
 *
 * Uses @anthropic-ai/claude-agent-sdk for proper agent execution with:
 * - MCP server for custom tools
 * - Pre-flight hooks
 * - Built-in tracing (LangSmith compatible)
 * - Streaming progress to UI
 */

import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import type {
  ValidationState,
  ValidationResult,
  ProgressCallback,
  HealingLogEntry,
} from '../state.js';

// =============================================================================
// Types
// =============================================================================

interface ExecuteContext {
  state: ValidationState;
  onProgress?: ProgressCallback;
  retryCount: number;
  healingLog: HealingLogEntry[];
  lastExecuteApiResult?: {
    success: boolean;
    status?: number;
    data?: unknown;
    requestConfig?: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      data?: Record<string, unknown>;
    };
  };
}

export interface ExecuteLoopOptions {
  maxRetries?: number;
  maxTurns?: number;
  model?: string;
}

export interface ExecuteApiInput {
  method: string;
  path: string;
  params?: Record<string, unknown>;
  body?: Record<string, unknown>;
  token_type?: string;
  purpose?: 'uid_resolution' | 'retry_original';
  use_fallback?: boolean;
  on_behalf_of?: string;
}

// =============================================================================
// Tool Definitions using Claude Agent SDK
// =============================================================================

function createValidationTools(context: ExecuteContext) {
  // Dynamic import functions - will be loaded on first use
  let executeTool: Function;
  let buildSystemPrompt: Function;
  let apiClient: any;

  // Helper to ensure imports are loaded
  async function ensureImports() {
    if (!executeTool) {
      const aiAgentHealer = await import('../../runner/ai-agent-healer.js');
      executeTool = aiAgentHealer.executeTool;
      buildSystemPrompt = aiAgentHealer.buildSystemPrompt;

      const apiClientModule = await import('../../runner/api-client.js');
      apiClient = apiClientModule.createApiClient({
        baseUrl: context.state.config.baseUrl,
        tokens: context.state.tokens,
      });
    }
  }

  // Tool: Extract Required UIDs
  const extractRequiredUids = tool(
    'extract_required_uids',
    "Extract all required UID/ID fields and required query parameters from the endpoint's swagger schema. Call this FIRST to understand what UIDs and parameters you need.",
    {},
    async () => {
      await ensureImports();
      const toolContext = buildToolContext();
      const result = await executeTool('extract_required_uids', {}, toolContext);
      logToolCall('extract_required_uids', {}, result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Find UID Source
  const findUidSource = tool(
    'find_uid_source',
    "Given a UID field name (e.g., 'service_uid'), find the GET and POST endpoints that can provide a valid value.",
    { uid_field: z.string().describe("The UID field name to resolve") },
    async ({ uid_field }) => {
      await ensureImports();
      const toolContext = buildToolContext();
      const result = await executeTool('find_uid_source', { uid_field }, toolContext);
      logToolCall('find_uid_source', { uid_field }, result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Execute API
  const executeApi = tool(
    'execute_api',
    "Execute an API call. Use this to fetch existing entities (GET) or create new ones (POST) during UID resolution, and to retry the original request once all UIDs are resolved. IMPORTANT: For POST/PUT/PATCH requests, include the 'body' parameter!",
    {
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).describe('HTTP method'),
      path: z.string().describe('API path (e.g., /platform/v1/services)'),
      params: z.record(z.unknown()).optional().describe('Query parameters'),
      body: z.record(z.unknown()).optional().describe('Request body for POST/PUT/PATCH'),
      token_type: z.enum(['staff', 'client', 'app', 'admin', 'directory']).optional().default('staff'),
      purpose: z.enum(['uid_resolution', 'retry_original']).optional().default('uid_resolution'),
      use_fallback: z.boolean().optional().default(false),
      on_behalf_of: z.string().optional(),
    },
    async (input) => {
      await ensureImports();

      // Pre-flight check for retry_original
      if (input.purpose === 'retry_original') {
        context.retryCount++;
        context.onProgress?.({
          type: 'agent_action',
          action: 'execute_api',
          details: JSON.stringify(input).substring(0, 200),
        });
      }

      const toolContext = buildToolContext();
      const result = await executeTool('execute_api', input, toolContext);
      logToolCall('execute_api', input, result);

      // Track last execute_api result for UI display
      if (input.purpose === 'retry_original') {
        context.lastExecuteApiResult = result;
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Report Result
  const reportResult = tool(
    'report_result',
    "Report the final validation result. Call this when you've completed testing the endpoint.",
    {
      status: z.enum(['pass', 'fail', 'skip']).describe('Test result status'),
      summary: z.string().describe('Summary of what happened'),
      doc_issues: z.array(z.object({
        field: z.string(),
        issue: z.string(),
        suggested_fix: z.string().optional(),
      })).optional().describe('Documentation issues found'),
    },
    async ({ status, summary, doc_issues }) => {
      logToolCall('report_result', { status, summary }, { reported: true });

      context.onProgress?.({
        type: 'agent_action',
        action: 'report_result',
        details: status,
        summary,
      });

      return {
        content: [{ type: 'text', text: `Result reported: ${status} - ${summary}` }],
        isError: false,
      };
    }
  );

  // Tool: Find Service for Endpoint
  const findServiceForEndpoint = tool(
    'find_service_for_endpoint',
    "Find which microservice handles a given endpoint path. Returns the service name and repository path.",
    {
      path: z.string().describe('API path to look up'),
    },
    async ({ path }) => {
      await ensureImports();
      const toolContext = buildToolContext();
      const result = await executeTool('find_service_for_endpoint', { path }, toolContext);
      logToolCall('find_service_for_endpoint', { path }, result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Search Source Code
  const searchSourceCode = tool(
    'search_source_code',
    "Search for code patterns in the source repositories. Use this to find implementations, validations, or error handling.",
    {
      query: z.string().describe('Search query (regex supported)'),
      repository: z.string().optional().describe('Specific repository to search'),
      file_pattern: z.string().optional().describe('File pattern to match (e.g., *.rb, *.ts)'),
    },
    async (input) => {
      await ensureImports();
      const toolContext = buildToolContext();
      const result = await executeTool('search_source_code', input, toolContext);
      logToolCall('search_source_code', input, result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Read Source File
  const readSourceFile = tool(
    'read_source_file',
    "Read a source file from the repositories to understand implementation details.",
    {
      file_path: z.string().describe('Path to the file to read'),
      start_line: z.number().optional().describe('Start line number'),
      end_line: z.number().optional().describe('End line number'),
    },
    async (input) => {
      await ensureImports();
      const toolContext = buildToolContext();
      const result = await executeTool('read_source_file', input, toolContext);
      logToolCall('read_source_file', input, result);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Helper: Build tool context
  function buildToolContext() {
    return {
      apiClient,
      config: context.state.config,
      resolvedParams: { ...context.state.params },
      onProgress: context.onProgress,
      endpoint: context.state.endpoint,
      allEndpoints: context.state.allEndpoints,
      healingLog: context.healingLog,
      retryCount: context.retryCount,
    };
  }

  // Helper: Log tool calls
  function logToolCall(action: string, input: Record<string, unknown>, output: unknown) {
    context.healingLog.push({
      action,
      input,
      output: output as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    });

    context.onProgress?.({
      type: 'agent_action',
      action,
      details: JSON.stringify(input).substring(0, 200),
    });
  }

  return [
    extractRequiredUids,
    findUidSource,
    executeApi,
    reportResult,
    findServiceForEndpoint,
    searchSourceCode,
    readSourceFile,
  ];
}

// =============================================================================
// Execute Loop Node
// =============================================================================

export async function executeLoopNode(
  state: ValidationState,
  onProgress?: ProgressCallback,
  options: ExecuteLoopOptions = {}
): Promise<{ result: ValidationResult; retryCount: number }> {
  console.log('\n===== NODE 5: EXECUTE LOOP (Claude Agent SDK) =====');

  const maxRetries = options.maxRetries ?? 5;
  const maxTurns = options.maxTurns ?? 20;
  const model = options.model ?? 'claude-sonnet-4-20250514';

  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;

  // Create execution context
  const context: ExecuteContext = {
    state,
    onProgress,
    retryCount: 0,
    healingLog: [],
  };

  // Create tools
  const tools = createValidationTools(context);

  // Create MCP server with our tools
  const validationMcp = createSdkMcpServer({
    name: 'api-validation',
    version: '1.0.0',
    tools,
  });

  // Build system prompt (reuse existing logic)
  let systemPrompt = '';
  try {
    const { buildSystemPrompt } = await import('../../runner/ai-agent-healer.js');
    systemPrompt = buildSystemPrompt(
      state.endpoint,
      state.allEndpoints,
      state.config,
      state.params
    );
  } catch (error) {
    console.log(`Warning: Could not build system prompt: ${error}`);
  }

  // User prompt
  const userPrompt = `## Failing Test

**Endpoint**: ${state.endpoint.method} ${state.endpoint.path}
**Summary**: ${state.endpoint.summary || 'N/A'}
**Description**: ${state.endpoint.description || 'N/A'}

The test failed. Please:
1. Call extract_required_uids to understand what UIDs are needed
2. Resolve any missing UIDs using find_uid_source and execute_api
3. Retry the endpoint with purpose="retry_original"
4. Report the result with report_result

You have a maximum of ${maxRetries} retries.`;

  // Run the agent using Claude Agent SDK
  let result: ValidationResult = {
    status: 'ERROR',
    reason: 'Agent did not complete',
  };

  try {
    console.log('Starting Claude Agent SDK query...');

    const agentResult = query({
      prompt: userPrompt,
      options: {
        cwd: process.cwd(),
        model,
        maxTurns,
        mcpServers: {
          'api-validation': validationMcp,
        },
        systemPrompt: systemPrompt || undefined,
        // Pre-flight hook for execute_api
        hooks: {
          PreToolUse: [{
            matcher: 'execute_api',
            hooks: [async (input, toolUseID, opts) => {
              const toolInput = (input as any).tool_input as ExecuteApiInput;

              // Check retry limit
              if (toolInput.purpose === 'retry_original' && context.retryCount >= maxRetries) {
                return {
                  hookSpecificOutput: {
                    hookEventName: 'PreToolUse',
                    permissionDecision: 'deny',
                    permissionDecisionReason: `Maximum retry limit (${maxRetries}) reached. Please report the result.`,
                  },
                };
              }

              return { continue: true };
            }],
          }],
        },
        // Don't persist session for API validation
        persistSession: false,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
      },
    });

    // Process streaming results
    for await (const message of agentResult) {
      if (message.type === 'assistant') {
        // Extract tool calls from assistant message
        for (const block of message.message.content) {
          if (block.type === 'tool_use') {
            onProgress?.({
              type: 'agent_action',
              action: block.name,
              details: JSON.stringify(block.input).substring(0, 200),
            });

            // Check if it's report_result (handles both direct and MCP tool names)
            if (block.name === 'report_result' || block.name.endsWith('__report_result')) {
              const input = block.input as { status: string; summary: string };
              result = {
                status: input.status.toUpperCase() as 'PASS' | 'FAIL' | 'SKIP',
                reason: input.summary,
              };
              console.log(`Report result captured: ${result.status} - ${result.reason}`);
            }
          }
        }
      }

      if (message.type === 'result') {
        console.log('Agent completed:', message.subtype);

        // If we got a result from report_result, use that
        if (result.status !== 'ERROR') {
          onProgress?.({
            type: 'agent_complete',
            status: result.status.toLowerCase(),
            success: result.status === 'PASS',
            summary: result.reason,
          });
        }
      }
    }
  } catch (error) {
    console.error('Agent error:', error);
    result = {
      status: 'ERROR',
      reason: `Agent error: ${error}`,
    };
  }

  // Enrich result with request/response from last execute_api
  if (context.lastExecuteApiResult) {
    result.httpStatus = context.lastExecuteApiResult.status;
    result.request = context.lastExecuteApiResult.requestConfig;
    result.response = context.lastExecuteApiResult.success ? {
      status: context.lastExecuteApiResult.status || 200,
      data: context.lastExecuteApiResult.data,
    } : undefined;
  }

  console.log(`\nResult: ${result.status} - ${result.reason}`);
  console.log('===== EXECUTE LOOP COMPLETE =====\n');

  return {
    result,
    retryCount: context.retryCount,
  };
}

// Parse report_result output
function parseReportResult(output: unknown): ValidationResult {
  const result = output as {
    status?: string;
    summary?: string;
    success?: boolean;
  };

  return {
    status: result.success || result.status === 'pass'
      ? 'PASS'
      : result.status === 'skip'
        ? 'SKIP'
        : 'FAIL',
    reason: result.summary || 'Unknown',
  };
}
