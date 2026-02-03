/**
 * Execute Loop Node (LangGraph Version)
 *
 * Uses Claude Agent SDK for API execution with MCP tools.
 * Routes based on result: success → updateVerification, retry → executeLoop, fail → analyzeFailure
 */

import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { Command } from '@langchain/langgraph';
import type { GraphValidationState, ExecutionResult } from '../state.js';
import { tracedQuery, logPrompts } from '../tracing.js';

// =============================================================================
// Types
// =============================================================================

interface ExecuteContext {
  state: GraphValidationState;
  retryCount: number;
  lastResult?: ExecutionResult;
}

// =============================================================================
// Tool Definitions
// =============================================================================

function createValidationTools(context: ExecuteContext) {
  // Dynamic imports
  let executeTool: Function;
  let apiClient: any;

  async function ensureImports() {
    if (!executeTool) {
      const aiAgentHealer = await import('../../../runner/ai-agent-healer.js');
      executeTool = aiAgentHealer.executeTool;

      const apiClientModule = await import('../../../runner/api-client.js');
      apiClient = apiClientModule.createApiClient({
        baseUrl: context.state.config.baseUrl,
        tokens: context.state.tokens,
      });
    }
  }

  function buildToolContext() {
    return {
      apiClient,
      config: context.state.config,
      resolvedParams: { ...context.state.params },
      onProgress: context.state.onProgress,
      endpoint: context.state.endpoint,
      allEndpoints: context.state.allEndpoints,
      healingLog: [],
      retryCount: context.retryCount,
    };
  }

  // Tool: Extract Required UIDs
  const extractRequiredUids = tool(
    'extract_required_uids',
    "Extract all required UID/ID fields from the endpoint's swagger schema. Call this FIRST.",
    {},
    async () => {
      await ensureImports();
      const result = await executeTool('extract_required_uids', {}, buildToolContext());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Find UID Source
  const findUidSource = tool(
    'find_uid_source',
    "Given a UID field name, find GET/POST endpoints that can provide a valid value.",
    { uid_field: z.string().describe("The UID field name to resolve") },
    async ({ uid_field }) => {
      await ensureImports();
      const result = await executeTool('find_uid_source', { uid_field }, buildToolContext());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Execute API
  const executeApi = tool(
    'execute_api',
    "Execute an API call. Use for UID resolution (GET/POST) or retry_original.",
    {
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
      path: z.string(),
      params: z.record(z.unknown()).optional(),
      body: z.record(z.unknown()).optional(),
      token_type: z.enum(['staff', 'client', 'app', 'admin', 'directory']).optional().default('staff'),
      purpose: z.enum(['uid_resolution', 'retry_original']).optional().default('uid_resolution'),
      use_fallback: z.boolean().optional().default(false),
      on_behalf_of: z.string().optional(),
    },
    async (input) => {
      await ensureImports();

      if (input.purpose === 'retry_original') {
        context.retryCount++;
        context.state.onProgress?.({
          type: 'agent_action',
          action: 'execute_api',
          details: `Retry ${context.retryCount}: ${input.method} ${input.path}`,
        });
      }

      const result = await executeTool('execute_api', input, buildToolContext());

      // Track last result
      if (input.purpose === 'retry_original') {
        context.lastResult = {
          success: result.success,
          status: result.status,
          httpStatus: result.status,
          data: result.data,
          error: result.error,
          requestConfig: {
            method: input.method,
            url: input.path,
            data: input.body,
          },
        };
      }

      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Report Result
  const reportResult = tool(
    'report_result',
    "Report the final validation result.",
    {
      status: z.enum(['pass', 'fail', 'skip']),
      summary: z.string(),
      doc_issues: z.array(z.object({
        field: z.string(),
        issue: z.string(),
        suggested_fix: z.string().optional(),
      })).optional(),
    },
    async ({ status, summary, doc_issues }) => {
      context.state.onProgress?.({
        type: 'agent_action',
        action: 'report_result',
        details: `${status}: ${summary}`,
      });

      return { content: [{ type: 'text', text: `Reported: ${status} - ${summary}` }] };
    }
  );

  // Tool: Find Service for Endpoint
  const findServiceForEndpoint = tool(
    'find_service_for_endpoint',
    "Find which microservice handles an endpoint path.",
    { path: z.string() },
    async ({ path }) => {
      await ensureImports();
      const result = await executeTool('find_service_for_endpoint', { path }, buildToolContext());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Search Source Code
  const searchSourceCode = tool(
    'search_source_code',
    "Search for code patterns in source repositories.",
    {
      query: z.string(),
      repository: z.string().optional(),
      file_pattern: z.string().optional(),
    },
    async (input) => {
      await ensureImports();
      const result = await executeTool('search_source_code', input, buildToolContext());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  // Tool: Read Source File
  const readSourceFile = tool(
    'read_source_file',
    "Read a source file from repositories.",
    {
      file_path: z.string(),
      start_line: z.number().optional(),
      end_line: z.number().optional(),
    },
    async (input) => {
      await ensureImports();
      const result = await executeTool('read_source_file', input, buildToolContext());
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

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
  state: GraphValidationState
): Promise<Command> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;
  const maxRetries = state.maxRetries || 5;

  console.log(`\n--- Execute Loop for ${endpointKey} (attempt ${state.retryCount + 1}/${maxRetries}) ---`);

  state.onProgress?.({
    type: 'agent_action',
    action: 'execute_loop_start',
    details: `Starting validation (attempt ${state.retryCount + 1})`,
  });

  // Create context
  const context: ExecuteContext = {
    state,
    retryCount: state.retryCount,
  };

  // Create tools
  const tools = createValidationTools(context);

  // Create MCP server
  const validationMcp = createSdkMcpServer({
    name: 'api-validation',
    version: '1.0.0',
    tools,
  });

  // Build system prompt
  let systemPrompt = '';
  try {
    const { buildSystemPrompt } = await import('../../../runner/ai-agent-healer.js');
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
  const userPrompt = `## Validate Endpoint

**Endpoint**: ${state.endpoint.method} ${state.endpoint.path}
**Summary**: ${state.endpoint.summary || 'N/A'}
**Description**: ${state.endpoint.description || 'N/A'}

${state.workflowSuggestion ? `
## Suggested Workflow (from code analysis)
Token type: ${state.workflowSuggestion.tokenType}
Required params: ${state.workflowSuggestion.requiredParams.join(', ')}
Prerequisites: ${state.workflowSuggestion.prerequisites.map(p => `${p.method} ${p.path}`).join(', ')}
` : ''}

## Instructions
1. Call extract_required_uids to understand what UIDs are needed
2. Resolve any missing UIDs using find_uid_source and execute_api (purpose: uid_resolution)
3. Retry the endpoint with execute_api (purpose: retry_original)
4. Report the result with report_result

You have ${maxRetries - state.retryCount} retries remaining.`;

  // Result tracking
  let finalResult: ExecutionResult | null = null;
  let reportedStatus: string | null = null;
  let reportedSummary: string | null = null;

  // Log prompts for debugging
  logPrompts(`execute-loop:${endpointKey}`, systemPrompt || undefined, userPrompt);

  try {
    // Run with LangSmith tracing
    const { result: messages } = await tracedQuery(
      `execute-loop:${endpointKey}`,
      () => query({
        prompt: userPrompt,
        options: {
          cwd: process.cwd(),
          model: 'claude-opus-4-5-20251101',
          maxTurns: 20,
          mcpServers: {
            'api-validation': validationMcp,
          },
          systemPrompt: systemPrompt || undefined,
          hooks: {
            PreToolUse: [{
              matcher: 'execute_api',
              hooks: [async (input: any) => {
                const toolInput = input.tool_input;
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
          persistSession: false,
          permissionMode: 'bypassPermissions',
          allowDangerouslySkipPermissions: true,
        },
      }),
      { endpoint: endpointKey, node: 'executeLoop', attempt: state.retryCount + 1 }
    );

    for (const message of messages) {
      if (message.type === 'assistant') {
        for (const block of (message as any).message.content) {
          if (block.type === 'tool_use') {
            state.onProgress?.({
              type: 'agent_action',
              action: block.name,
              details: JSON.stringify(block.input).substring(0, 200),
            });

            // Check for report_result
            if (block.name === 'report_result' || block.name.endsWith('__report_result')) {
              const input = block.input as { status: string; summary: string };
              reportedStatus = input.status;
              reportedSummary = input.summary;
            }
          }
        }
      }

      if (message.type === 'result') {
        console.log('Agent completed:', (message as any).subtype);
      }
    }
  } catch (error) {
    console.error('Execute loop error:', error);
    return new Command({
      update: {
        executionResult: {
          success: false,
          error: `Agent error: ${error}`,
        },
        retryCount: context.retryCount,
      },
      goto: 'analyzeFailure',
    });
  }

  // Determine result
  finalResult = context.lastResult || {
    success: reportedStatus === 'pass',
    error: reportedStatus !== 'pass' ? reportedSummary || 'No result' : undefined,
    summary: reportedSummary || undefined,
  };

  // Route based on result
  if (reportedStatus === 'pass' || finalResult.success) {
    return new Command({
      update: {
        executionResult: finalResult,
        retryCount: context.retryCount,
        result: {
          status: 'PASS',
          reason: reportedSummary || 'Test passed',
          httpStatus: finalResult.httpStatus,
          request: finalResult.requestConfig,
          response: finalResult.data ? {
            status: finalResult.status || 200,
            data: finalResult.data,
          } : undefined,
        },
      },
      goto: 'updateVerification',
    });
  }

  // Check if we should retry
  if (context.retryCount < maxRetries && reportedStatus !== 'fail') {
    return new Command({
      update: {
        executionResult: finalResult,
        retryCount: context.retryCount + 1,
      },
      goto: 'executeLoop',
    });
  }

  // Out of retries or explicit fail - analyze
  return new Command({
    update: {
      executionResult: finalResult,
      retryCount: context.retryCount,
    },
    goto: 'analyzeFailure',
  });
}
