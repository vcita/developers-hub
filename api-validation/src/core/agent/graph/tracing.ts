/**
 * LangSmith Tracing for Claude Agent SDK
 *
 * Wraps Claude Agent SDK query() calls with LangSmith traces
 * so they appear in the LangSmith dashboard.
 *
 * Also logs all operations to /tmp/claude-agent-operations.log for debugging.
 */

import { Client } from 'langsmith';
import { RunTree } from 'langsmith/run_trees';
import * as fs from 'fs';
import * as path from 'path';

// Log file path
const LOG_FILE = '/tmp/claude-agent-operations.log';

// Initialize LangSmith client
let client: Client | null = null;

function getClient(): Client {
  if (!client) {
    client = new Client();
  }
  return client;
}

// =============================================================================
// File Logging
// =============================================================================

function formatTimestamp(): string {
  return new Date().toISOString();
}

function logToFile(content: string): void {
  try {
    const timestamp = formatTimestamp();
    const line = `[${timestamp}] ${content}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    // Silently ignore log errors
  }
}

function logSeparator(title: string): void {
  const sep = '='.repeat(80);
  logToFile(`\n${sep}`);
  logToFile(`${title}`);
  logToFile(`${sep}`);
}

function logJson(label: string, data: unknown): void {
  try {
    logToFile(`${label}:`);
    logToFile(JSON.stringify(data, null, 2));
  } catch (e) {
    logToFile(`${label}: [Unable to stringify]`);
  }
}

export function clearAgentLog(): void {
  try {
    fs.writeFileSync(LOG_FILE, `Claude Agent SDK Operations Log\nStarted: ${formatTimestamp()}\n\n`);
  } catch (e) {
    // Ignore
  }
}

/**
 * Log the prompts being sent to the agent
 */
export function logPrompts(name: string, systemPrompt: string | undefined, userPrompt: string): void {
  logSeparator(`PROMPTS FOR: ${name}`);

  if (systemPrompt) {
    logToFile('\n=== SYSTEM PROMPT ===');
    logToFile(systemPrompt);
  }

  logToFile('\n=== USER PROMPT ===');
  logToFile(userPrompt);
  logToFile('\n');
}

/**
 * Create a traced run for a Claude Agent SDK query
 */
export async function createTracedRun(
  name: string,
  runType: 'chain' | 'llm' | 'tool' = 'chain',
  inputs: Record<string, unknown> = {}
): Promise<RunTree> {
  const runTree = new RunTree({
    name,
    run_type: runType,
    inputs,
    client: getClient(),
  });

  await runTree.postRun();
  return runTree;
}

/**
 * Wrap a Claude Agent SDK query() call with LangSmith tracing
 * Also logs all operations to file for debugging
 */
export async function tracedQuery<T>(
  name: string,
  queryFn: () => AsyncIterable<T>,
  metadata: Record<string, unknown> = {}
): Promise<{ result: T[]; runTree: RunTree }> {
  // Log session start
  logSeparator(`AGENT SESSION: ${name}`);
  logJson('Metadata', metadata);

  const runTree = await createTracedRun(name, 'chain', {
    ...metadata,
    timestamp: new Date().toISOString(),
  });

  const results: T[] = [];
  const toolCalls: Array<{ name: string; input: unknown; output?: unknown }> = [];
  let messageIndex = 0;
  let toolCallIndex = 0;

  try {
    for await (const message of queryFn()) {
      results.push(message);
      messageIndex++;

      // Track and log messages
      const msg = message as any;

      // Log user messages
      if (msg.type === 'user') {
        logSeparator(`USER MESSAGE #${messageIndex}`);
        if (msg.message?.content) {
          for (const block of msg.message.content) {
            if (block.type === 'text') {
              logToFile('User prompt:');
              logToFile(block.text);
            }
          }
        }
      }

      // Log assistant messages and tool calls
      if (msg.type === 'assistant' && msg.message?.content) {
        logSeparator(`ASSISTANT MESSAGE #${messageIndex}`);

        for (const block of msg.message.content) {
          if (block.type === 'text') {
            logToFile('Assistant text:');
            logToFile(block.text.substring(0, 2000) + (block.text.length > 2000 ? '...[truncated]' : ''));
          }

          if (block.type === 'tool_use') {
            toolCallIndex++;
            logSeparator(`TOOL CALL #${toolCallIndex}: ${block.name}`);
            logJson('Tool Input', block.input);

            toolCalls.push({
              name: block.name,
              input: block.input,
            });

            // Create child run for tool call
            const toolRun = await runTree.createChild({
              name: `tool:${block.name}`,
              run_type: 'tool',
              inputs: block.input,
            });
            await toolRun.postRun();
            await toolRun.end({ outputs: { status: 'called' } });
            await toolRun.patchRun();
          }
        }
      }

      // Log tool results
      if (msg.type === 'tool_result') {
        const lastTool = toolCalls[toolCalls.length - 1];
        if (lastTool) {
          lastTool.output = msg.result;
        }

        logSeparator(`TOOL RESULT for ${lastTool?.name || 'unknown'}`);
        // Truncate large results
        const resultStr = JSON.stringify(msg.result, null, 2);
        if (resultStr.length > 5000) {
          logToFile(resultStr.substring(0, 5000) + '\n...[truncated]');
        } else {
          logToFile(resultStr);
        }
      }

      // Log result messages
      if (msg.type === 'result') {
        logSeparator(`RESULT: ${msg.subtype || 'final'}`);
        logJson('Result', msg);
      }
    }

    // Log session end
    logSeparator(`SESSION COMPLETE: ${name}`);
    logToFile(`Total messages: ${messageIndex}`);
    logToFile(`Total tool calls: ${toolCallIndex}`);
    logJson('Tool call summary', toolCalls.map(t => ({ name: t.name, inputKeys: Object.keys(t.input as object || {}) })));

    // End the run successfully
    await runTree.end({
      outputs: {
        messageCount: results.length,
        toolCalls: toolCalls.map(t => t.name),
        finalResult: results[results.length - 1],
      },
    });
    await runTree.patchRun();

    return { result: results, runTree };
  } catch (error) {
    // Log error
    logSeparator(`ERROR in ${name}`);
    logToFile(error instanceof Error ? `${error.message}\n${error.stack}` : String(error));

    // End the run with error
    await runTree.end({
      error: error instanceof Error ? error.message : String(error),
    });
    await runTree.patchRun();
    throw error;
  }
}

/**
 * Create a child trace for a specific operation
 */
export async function traceOperation<T>(
  parent: RunTree,
  name: string,
  operation: () => Promise<T>,
  inputs: Record<string, unknown> = {}
): Promise<T> {
  const childRun = await parent.createChild({
    name,
    run_type: 'chain',
    inputs,
  });
  await childRun.postRun();

  try {
    const result = await operation();
    await childRun.end({ outputs: { result } });
    await childRun.patchRun();
    return result;
  } catch (error) {
    await childRun.end({
      error: error instanceof Error ? error.message : String(error),
    });
    await childRun.patchRun();
    throw error;
  }
}

/**
 * Simple trace wrapper for any async function
 */
export async function trace<T>(
  name: string,
  fn: () => Promise<T>,
  metadata: Record<string, unknown> = {}
): Promise<T> {
  const runTree = await createTracedRun(name, 'chain', metadata);

  try {
    const result = await fn();
    await runTree.end({ outputs: { result } });
    await runTree.patchRun();
    return result;
  } catch (error) {
    await runTree.end({
      error: error instanceof Error ? error.message : String(error),
    });
    await runTree.patchRun();
    throw error;
  }
}
