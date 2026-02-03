/**
 * Agreement Check Node - Claude Code CLI Version
 *
 * Uses Claude Code CLI (headless mode) for codebase exploration.
 * This gives full Claude Code capabilities including:
 * - Better exploration (Explore subagent)
 * - Edit/Write for fixing swagger and workflows
 * - Better context management
 *
 * Features:
 * - Streaming output for real-time UI updates
 * - Flexible JSON parsing (handles various Claude output formats)
 * - Rich progress events
 */

import { spawn } from 'child_process';
import { Command } from '@langchain/langgraph';
import type { GraphValidationState } from '../state.js';
import type { Workflow, Endpoint, ProgressCallback } from '../../state.js';
import type { AgreementFinding, AgreementFix, CodeAgreement } from '../../verification/types.js';
import * as fs from 'fs';

// Use graph state type
type ValidationState = GraphValidationState;

// =============================================================================
// Configuration
// =============================================================================

const WS2_BASE = '/Users/yehoshua.katz/ws2';
const DEVELOPERS_HUB = `${WS2_BASE}/developers-hub`;
const LOG_FILE = '/tmp/claude-code-cli.log';
const LOG_PREFIX = '[agreement-check]';

// Path routing
const PATH_TO_REPO: Record<string, string> = {
  '/platform/v1/': `${WS2_BASE}/core`,
  '/business/scheduling/': `${WS2_BASE}/core`,
  '/business/clients/': `${WS2_BASE}/core`,
  '/business/staffs/': `${WS2_BASE}/core`,
  '/business/payments/': `${WS2_BASE}/core`,
  '/v3/staff': `${WS2_BASE}/core`,
  '/v3/license/': `${WS2_BASE}/subscriptionsmng`,
  '/v3/communication/voice_calls': `${WS2_BASE}/voicecalls`,
  '/v3/communication/': `${WS2_BASE}/communication-gw`,
  '/v3/scheduling/availability': `${WS2_BASE}/availability`,
  '/v3/scheduling/resources': `${WS2_BASE}/resources`,
  '/v3/scheduling/business_availabilities': `${WS2_BASE}/availability`,
  '/v3/access_control/': `${WS2_BASE}/permissionsmanager`,
  '/v3/ai/': `${WS2_BASE}/aiplatform`,
  '/v3/integrations/': `${WS2_BASE}/integrationshub`,
  '/v3/documents/': `${WS2_BASE}/documentsgenerator`,
  '/v3/payment_processing/': `${WS2_BASE}/core`,
};

function getPrimaryRepo(apiPath: string): string {
  for (const [prefix, repo] of Object.entries(PATH_TO_REPO)) {
    if (apiPath.startsWith(prefix)) {
      return repo;
    }
  }
  return `${WS2_BASE}/core`;
}

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

  // Also send to UI for important messages
  if (level !== 'debug' && currentOnProgress) {
    currentOnProgress({
      type: 'healing_analyzing',
      details: message,
    } as any);
  }
}

function clearLog(): void {
  fs.writeFileSync(LOG_FILE, `Claude Code CLI Log\nStarted: ${new Date().toISOString()}\n\n`);
}

// =============================================================================
// Flexible JSON Parser
// =============================================================================

interface ParsedAgreementResult {
  status: 'match' | 'mismatch' | 'fixed' | 'uncertain';
  controllerFile?: string;
  tokenType?: string;
  findings: Array<{
    category: string;
    severity: string;
    issue: string;
    fixed?: boolean;
  }>;
  filesModified: string[];
  workflowCreated: boolean;
  workflowFile?: string;
  rawOutput?: any;
}

function parseClaudeOutput(rawJson: any): ParsedAgreementResult {
  const result: ParsedAgreementResult = {
    status: 'uncertain',
    findings: [],
    filesModified: [],
    workflowCreated: false,
  };

  if (!rawJson) return result;

  // Store raw for debugging
  result.rawOutput = rawJson;

  // === STATUS MAPPING ===
  // Handle various status formats Claude might output
  if (rawJson.status) {
    const statusMap: Record<string, ParsedAgreementResult['status']> = {
      'match': 'match',
      'mismatch': 'mismatch',
      'fixed': 'fixed',
      'uncertain': 'uncertain',
      'PASSED': 'match',
      'FAILED': 'mismatch',
      'pass': 'match',
      'fail': 'mismatch',
    };
    result.status = statusMap[rawJson.status] || 'uncertain';
  } else if (rawJson.verification_status) {
    const statusMap: Record<string, ParsedAgreementResult['status']> = {
      'PASSED': 'match',
      'FAILED': 'mismatch',
      'FIXED': 'fixed',
    };
    result.status = statusMap[rawJson.verification_status] || 'uncertain';
  } else if (rawJson.swagger_updates_needed === false && rawJson.mismatches?.length === 0) {
    result.status = 'match';
  } else if (rawJson.swagger_updates_needed === true) {
    result.status = rawJson.fixes_applied ? 'fixed' : 'mismatch';
  }

  // === CONTROLLER FILE ===
  result.controllerFile = rawJson.controllerFile ||
    rawJson.controller_file ||
    rawJson.implementation?.file ||
    rawJson.controller?.file;

  // === TOKEN TYPE ===
  result.tokenType = rawJson.tokenType ||
    rawJson.token_type ||
    rawJson.comparison?.token_type?.code?.replace(/[^a-zA-Z]/g, '').toLowerCase();

  // === FINDINGS ===
  // Handle various finding formats
  if (rawJson.findings && Array.isArray(rawJson.findings)) {
    result.findings = rawJson.findings.map((f: any) => ({
      category: f.category || 'param',
      severity: f.severity || 'warning',
      issue: f.issue || f.description || f.message || JSON.stringify(f),
      fixed: f.fixed || false,
    }));
  } else if (rawJson.mismatches && Array.isArray(rawJson.mismatches)) {
    result.findings = rawJson.mismatches.map((m: any) => ({
      category: m.field || m.category || 'param',
      severity: 'error',
      issue: typeof m === 'string' ? m : (m.issue || m.description || JSON.stringify(m)),
      fixed: false,
    }));
  } else if (rawJson.comparison) {
    // Parse comparison object for mismatches
    for (const [key, value] of Object.entries(rawJson.comparison)) {
      const comp = value as any;
      if (comp && typeof comp === 'object' && comp.match === false) {
        result.findings.push({
          category: key.includes('token') ? 'auth' : 'param',
          severity: 'warning',
          issue: `${key}: swagger=${JSON.stringify(comp.swagger)}, code=${JSON.stringify(comp.code)}`,
          fixed: false,
        });
      }
    }
  }

  // === FILES MODIFIED ===
  if (rawJson.filesModified && Array.isArray(rawJson.filesModified)) {
    result.filesModified = rawJson.filesModified;
  } else if (rawJson.files_modified && Array.isArray(rawJson.files_modified)) {
    result.filesModified = rawJson.files_modified;
  }
  // Add swagger_file if it was modified
  if (rawJson.swagger_file && rawJson.swagger_updates_needed) {
    result.filesModified.push(rawJson.swagger_file);
  }

  // === WORKFLOW ===
  if (rawJson.workflowCreated === true || rawJson.workflow_created) {
    result.workflowCreated = true;
    result.workflowFile = rawJson.workflow_file || rawJson.workflowFile;
  } else if (typeof rawJson.workflow_created === 'string') {
    // Claude sometimes outputs the path directly
    result.workflowCreated = true;
    result.workflowFile = rawJson.workflow_created;
    result.filesModified.push(rawJson.workflow_created);
  }

  log(`Parsed result: status=${result.status}, controller=${result.controllerFile}, findings=${result.findings.length}, workflow=${result.workflowCreated}`);
  return result;
}

// =============================================================================
// Prompt Builder
// =============================================================================

function buildExplorationPrompt(endpoint: Endpoint, workflow: Workflow | null, swaggerFile?: string): string {
  const { method, path: apiPath, summary, description, parameters, requestSchema } = endpoint;

  const pathParams = parameters?.path?.map(p => p.name) || [];
  const queryParams = parameters?.query?.map(p => p.name) || [];
  const requiredQuery = parameters?.query?.filter(p => p.required)?.map(p => p.name) || [];
  const bodyProps = Object.keys(requestSchema?.properties || {});
  const bodyRequired = requestSchema?.required || [];

  const tokenMatch = description?.match(/Available for \*\*([^*]+)\*\*/);
  const documentedTokenType = tokenMatch?.[1] || 'unknown';

  const primaryRepo = getPrimaryRepo(apiPath);

  return `# API Documentation Verification Task

## Endpoint
- Method: ${method}
- Path: ${apiPath}
- Summary: ${summary || 'N/A'}

## Primary Repository
${primaryRepo}

## Task 1: Find the Implementation

Search in ${primaryRepo} for the controller that handles ${method} ${apiPath}.

**EFFICIENCY TIP:** Use the Task tool with subagent_type="scout" for parallel exploration:
\`\`\`
Task tool: {
  "subagent_type": "scout",
  "prompt": "Find the controller for ${method} ${apiPath} in this Rails codebase. Check config/routes.rb for routing, then find the controller file.",
  "description": "Find controller"
}
\`\`\`

**Or use tldr CLI for fast AST-based search:**
\`\`\`bash
tldr search "${apiPath.split('/').pop()}" ${primaryRepo}
tldr structure ${primaryRepo}/app/controllers --lang ruby
\`\`\`

**For Rails (core):**
1. Routes: \`grep -n "${apiPath.replace('/platform/', '').replace('/v1/', '')}" config/routes.rb\`
2. Controllers: \`find app/controllers modules/*/app/controllers -name "*${apiPath.split('/').slice(-1)[0]}*" -type f\`

**For TypeScript:**
1. Routes: \`grep -n "${apiPath}" src/routes.ts\`
2. Controllers: \`find src/controllers -name "*.ts" -exec grep -l "${apiPath}" {} \\;\`

## Task 2: Compare with Swagger Documentation

**Swagger says:**
- Token type: ${documentedTokenType}
- Path params: ${JSON.stringify(pathParams)}
- Query params: ${JSON.stringify(queryParams)}
- Required query: ${JSON.stringify(requiredQuery)}
- Body properties: ${JSON.stringify(bodyProps)}
- Body required: ${JSON.stringify(bodyRequired)}

**Find in code:**
- What auth/token does the code require?
- What parameters are actually required?
- Any validation rules not in swagger?

## Task 3: Fix Documentation (if needed)

${swaggerFile ? `
**IMPORTANT:** Edit the SOURCE swagger files, NOT mcp_swagger!

Source swagger files are in: ${DEVELOPERS_HUB}/swagger/
- scheduling endpoints → swagger/scheduling/*.json
- platform endpoints → swagger/scheduling/legacy/legacy_v1_scheduling.json or swagger/scheduling/*.json

To find the correct source file:
\`\`\`bash
grep -r "${apiPath}" ${DEVELOPERS_HUB}/swagger/ --include="*.json" | head -5
\`\`\`

If you find mismatches, UPDATE the SOURCE swagger file:
- Add missing parameters
- Fix token type descriptions
- Add validation rules (e.g., "max 7 days")
- Add missing response codes (e.g., 429)

After editing, run: \`cd ${DEVELOPERS_HUB} && npm run unify\` to regenerate mcp_swagger.
` : 'Note: Swagger file path not provided, just report findings.'}

## Task 4: Create/Update Workflow

${workflow?.exists ? `
Existing workflow found. Update if needed.
` : `
No workflow exists. Create one at (USE THIS EXACT ABSOLUTE PATH):
${DEVELOPERS_HUB}/api-validation/workflows/${endpoint.domain || 'other'}/${method.toLowerCase()}_${apiPath.replace(/\//g, '_').replace(/[{}]/g, '')}.md

Include:
- Correct token type
- Required parameters
- Prerequisites (if UIDs needed)
- Test request example
`}

## Output Format

After completing your analysis, output a JSON block with ANY of these formats (I'll parse flexibly):

\`\`\`json
{
  "status": "match" | "mismatch" | "fixed",
  "controllerFile": "path/to/controller",
  "tokenType": "staff|client|app|admin|directory",
  "findings": [
    {
      "category": "auth|param|response",
      "severity": "error|warning|info",
      "issue": "description",
      "fixed": true|false
    }
  ],
  "filesModified": ["path1", "path2"],
  "workflowCreated": true|false
}
\`\`\`

OR the detailed comparison format:
\`\`\`json
{
  "verification_status": "PASSED" | "FAILED",
  "implementation": { "file": "...", "line": 123 },
  "comparison": { ... },
  "mismatches": [],
  "swagger_updates_needed": false,
  "workflow_created": "/path/to/workflow.md"
}
\`\`\`

## Strategy

1. **Use Task tool with scout agent** for parallel exploration - much faster than sequential grep
2. **Use tldr CLI** for AST-aware search: \`tldr search "pattern" path\` or \`tldr structure path\`
3. Read files only after you know the exact path
4. Use Edit to fix swagger, Write to create workflow

Start now. Be efficient - spawn a scout agent to find the controller quickly.
`;
}

// =============================================================================
// Claude Code CLI Execution with Streaming
// =============================================================================

interface CLIResult {
  success: boolean;
  output: string;
  parsedResult: ParsedAgreementResult;
  error?: string;
  sessionId?: string;
  durationMs?: number;
}

async function runClaudeCodeCLI(
  prompt: string,
  cwd: string,
  onProgress?: ProgressCallback,
  allowEdit: boolean = true
): Promise<CLIResult> {
  log(`\n${'='.repeat(60)}`);
  log(`CLAUDE CODE CLI - Starting`);
  log(`CWD: ${cwd}`);
  log(`${'='.repeat(60)}`);

  onProgress?.({
    type: 'healing_start',
    details: `Starting Claude Code CLI analysis`,
  } as any);

  const startTime = Date.now();

  return new Promise((resolve) => {
    const allowedTools = allowEdit
      ? 'Glob,Grep,Read,Edit,Write,Bash,Task'
      : 'Glob,Grep,Read,Bash,Task';

    // Write prompt to temp file to avoid shell escaping issues
    const promptFile = `/tmp/claude-prompt-${Date.now()}.txt`;
    fs.writeFileSync(promptFile, prompt);
    log(`Prompt written to ${promptFile}`);

    // Build command as single string for shell
    // Note: --verbose is required when using stream-json with piped input
    const cmd = `cat "${promptFile}" | claude --output-format stream-json --verbose --allowedTools "${allowedTools}" --max-turns 50`;
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
                const toolInput = JSON.stringify(block.input).substring(0, 100);
                log(`Tool: ${toolName} - ${toolInput}...`, 'debug');
                onProgress?.({
                  type: 'healing_creating',
                  action: toolName,
                  details: toolInput,
                } as any);
              } else if (block.type === 'text') {
                // Log thinking/text (truncated)
                const text = block.text.substring(0, 200);
                if (text.length > 50) {
                  log(`Claude: ${text}...`, 'debug');
                }
              }
            }
          } else if (event.type === 'result') {
            lastResultJson = event;
            sessionId = event.session_id;
            log(`Result received (${event.subtype})`);
          }
        } catch {
          // Not JSON, log raw if interesting
          if (line.length > 10 && !line.startsWith('{')) {
            log(`CLI: ${line.substring(0, 100)}`, 'debug');
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
      const parsedResult = parseClaudeOutput(rawJson);

      onProgress?.({
        type: 'healing_complete',
        success: code === 0,
        details: `Completed in ${durationMs}ms - Status: ${parsedResult.status}`,
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
        parsedResult: parseClaudeOutput(null),
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
// Agreement Check Node
// =============================================================================

export interface AgreementCheckResult {
  agreement: {
    validated: boolean;
    findings: AgreementFinding[];
    fixes: AgreementFix[];
    mismatches: AgreementFinding[];
    controllerFile?: string;
    codeAgreement?: CodeAgreement;
  };
  workflowSuggestion?: {
    tokenType: string;
    requiredParams: string[];
    prerequisites: Array<{
      name: string;
      method: string;
      path: string;
      extract?: Record<string, string>;
    }>;
    testRequest?: {
      method: string;
      path: string;
      body?: Record<string, unknown>;
      params?: Record<string, unknown>;
    };
  };
}

export async function agreementCheckCLINode(
  state: ValidationState
): Promise<Command> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;
  currentOnProgress = state.onProgress;

  clearLog();
  log(`\n${'━'.repeat(60)}`);
  log(`Agreement Check (CLI) starting for: ${endpointKey}`);
  log(`${'━'.repeat(60)}`);

  state.onProgress?.({
    type: 'agent_action',
    action: 'agreement_check_cli',
    details: `Using Claude Code CLI for ${endpointKey}`,
  });

  const primaryRepo = getPrimaryRepo(state.endpoint.path);

  // Build prompt
  const prompt = buildExplorationPrompt(
    state.endpoint,
    state.workflow,
    state.endpoint.swaggerFile
  );

  // Run Claude Code CLI with streaming
  const result = await runClaudeCodeCLI(prompt, primaryRepo, state.onProgress, true);

  // Convert parsed result to internal format
  const { parsedResult } = result;

  const findings: AgreementFinding[] = parsedResult.findings.map(f => ({
    category: f.category as AgreementFinding['category'],
    severity: f.severity as AgreementFinding['severity'],
    swagger: f.issue,
    code: f.issue,
    fix: f.fixed ? 'Fixed' : undefined,
  }));

  const fixes: AgreementFix[] = parsedResult.filesModified.map(file => ({
    type: file.includes('swagger') ? 'swagger' : 'workflow',
    file,
    action: file.includes('workflow') ? 'create_workflow' : 'update_description',
    details: { modified: true },
  })) as AgreementFix[];

  // Build code agreement record
  const codeAgreement: CodeAgreement = {
    checked: true,
    controllerFile: parsedResult.controllerFile,
    matches: parsedResult.status === 'match' || parsedResult.status === 'fixed',
    findings,
  };

  state.onProgress?.({
    type: 'agent_action',
    action: 'agreement_check_complete',
    details: `Status: ${parsedResult.status}, Controller: ${parsedResult.controllerFile || 'unknown'}, Findings: ${findings.length}, Workflow: ${parsedResult.workflowCreated}`,
  });

  // Determine routing
  const hasBlockingIssues = parsedResult.status === 'mismatch' &&
    findings.some(f => f.severity === 'error' && !f.fix);

  if (hasBlockingIssues) {
    log(`Blocking issues found - routing to updateVerification`);
    return new Command({
      update: {
        agreement: {
          validated: false,
          findings,
          fixes,
          mismatches: findings.filter(f => f.severity === 'error'),
          controllerFile: parsedResult.controllerFile,
          codeAgreement,
        },
        result: {
          status: 'BLOCKED',
          reason: `Documentation errors found: ${findings.filter(f => f.severity === 'error').map(f => f.swagger).join(', ')}`,
          docIssues: findings.map(f => ({
            field: f.category,
            issue: f.swagger,
            suggestedFix: f.fix,
            severity: f.severity === 'error' ? 'critical' : 'minor',
          })),
        },
      },
      goto: 'updateVerification',
    });
  }

  // No blocking issues - continue to execute loop
  log(`No blocking issues - routing to executeLoop`);
  return new Command({
    update: {
      agreement: {
        validated: true,
        findings,
        fixes,
        mismatches: [],
        controllerFile: parsedResult.controllerFile,
        codeAgreement,
      },
    },
    goto: 'executeLoop',
  });
}

// =============================================================================
// Export for graph
// =============================================================================

export { agreementCheckCLINode as agreementCheckNode };
