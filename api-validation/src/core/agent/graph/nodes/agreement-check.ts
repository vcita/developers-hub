/**
 * Agreement Check Node
 *
 * Uses Claude Agent SDK to explore the codebase and verify that
 * swagger documentation matches the actual implementation.
 *
 * If workflow doesn't exist, creates one based on code exploration.
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { Command } from '@langchain/langgraph';
import type { GraphValidationState } from '../state.js';
import type { Workflow, Endpoint, ProgressCallback } from '../../state.js';
import type { AgreementFinding, AgreementFix, CodeAgreement } from '../../verification/types.js';
import { tracedQuery, trace, logPrompts } from '../tracing.js';

// Use graph state type
type ValidationState = GraphValidationState;

// =============================================================================
// Repository Configuration
// =============================================================================

const WS2_BASE = '/Users/yehoshua.katz/ws2';

const ALL_REPOSITORIES = [
  `${WS2_BASE}/developers-hub`,
  `${WS2_BASE}/core`,
  `${WS2_BASE}/vcita`,
  `${WS2_BASE}/apigw`,
  `${WS2_BASE}/subscriptionsmng`,
  `${WS2_BASE}/availability`,
  `${WS2_BASE}/resources`,
  `${WS2_BASE}/voicecalls`,
  `${WS2_BASE}/notificationscenter`,
  `${WS2_BASE}/permissionsmanager`,
  `${WS2_BASE}/aiplatform`,
  `${WS2_BASE}/phonenumbersmanager`,
  `${WS2_BASE}/communication-gw`,
  `${WS2_BASE}/integrationshub`,
  `${WS2_BASE}/documentsgenerator`,
];

// Routing map: path prefix -> primary repository
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
  '/v3/access_control/': `${WS2_BASE}/permissionsmanager`,
  '/v3/ai/': `${WS2_BASE}/aiplatform`,
  '/v3/integrations/': `${WS2_BASE}/integrationshub`,
  '/v3/documents/': `${WS2_BASE}/documentsgenerator`,
  '/v3/payment_processing/': `${WS2_BASE}/core`,
};

function getPrimaryRepo(path: string): string {
  for (const [prefix, repo] of Object.entries(PATH_TO_REPO)) {
    if (path.startsWith(prefix)) {
      return repo;
    }
  }
  return `${WS2_BASE}/core`; // Default to core
}

// =============================================================================
// System Prompt
// =============================================================================

const AGREEMENT_CHECK_SYSTEM = `You are an API documentation verification agent.

## CRITICAL: Repository Locations (USE THESE EXACT PATHS)

All repositories are at: /Users/yehoshua.katz/ws2/

| Repository | Full Path | Contains |
|------------|-----------|----------|
| core | /Users/yehoshua.katz/ws2/core | Main Rails app, /platform/*, /business/*, /v3/staff |
| vcita | /Users/yehoshua.katz/ws2/vcita | Legacy code |
| availability | /Users/yehoshua.katz/ws2/availability | /v3/scheduling/availability* |
| resources | /Users/yehoshua.katz/ws2/resources | /v3/scheduling/resources* |
| subscriptionsmng | /Users/yehoshua.katz/ws2/subscriptionsmng | /v3/license/* |
| communication-gw | /Users/yehoshua.katz/ws2/communication-gw | /v3/communication/* |
| voicecalls | /Users/yehoshua.katz/ws2/voicecalls | /v3/communication/voice_calls |
| aiplatform | /Users/yehoshua.katz/ws2/aiplatform | /v3/ai/* |
| integrationshub | /Users/yehoshua.katz/ws2/integrationshub | /v3/integrations/* |
| permissionsmanager | /Users/yehoshua.katz/ws2/permissionsmanager | /v3/access_control/* |

**NEVER search from "/" - ALWAYS use the full paths above!**

## Your Mission
1. Find the code that implements the endpoint (in the specific repo)
2. Compare swagger documentation with actual code
3. Report mismatches with specific details
4. If no workflow exists, create one

## Key Principle
The CODE is the source of truth. Swagger documentation should match what the code actually does.

## Search Strategy (Follow This Order)
1. **Grep for route** in the primary repo's routes file first
2. **Read the route context** to find controller name
3. **Read the controller file** to check auth and params
4. **Report findings** - don't keep searching if you found it

## Output Format
Always end your analysis with a JSON block:
\`\`\`json
{
  "status": "match" | "mismatch" | "uncertain",
  "controllerFile": "path/to/controller",
  "controllerLine": 42,
  "findings": [
    {
      "category": "auth" | "param_required" | "param_name" | "response",
      "severity": "error" | "warning" | "info",
      "swagger": "what swagger says",
      "code": "what code does",
      "file": "path",
      "line": 42,
      "fix": "suggested fix"
    }
  ],
  "workflowSuggestion": {
    "tokenType": "staff" | "client" | "app" | "admin" | "directory",
    "requiredParams": ["param1", "param2"],
    "prerequisites": [
      {
        "name": "Get service",
        "method": "GET",
        "path": "/v3/scheduling/services",
        "extract": {"service_uid": "$.data[0].uid"}
      }
    ],
    "testRequest": {
      "method": "POST",
      "path": "/v3/scheduling/appointments",
      "body": {"service_uid": "{{service_uid}}"}
    }
  }
}
\`\`\`
`;

// =============================================================================
// User Prompt Builder
// =============================================================================

function buildAgreementPrompt(endpoint: Endpoint, workflow: Workflow | null): string {
  const { method, path, summary, description, parameters, requestSchema, security } = endpoint;

  const pathParams = parameters?.path?.map(p => p.name) || [];
  const queryParams = parameters?.query?.map(p => p.name) || [];
  const requiredQuery = parameters?.query?.filter(p => p.required)?.map(p => p.name) || [];
  const bodyProps = Object.keys(requestSchema?.properties || {});
  const bodyRequired = requestSchema?.required || [];

  // Extract token type from description
  const tokenMatch = description?.match(/Available for \*\*([^*]+)\*\*/);
  const documentedTokenType = tokenMatch?.[1] || 'unknown';

  // Get primary repo for this endpoint
  const primaryRepo = getPrimaryRepo(path);
  const repoName = primaryRepo.split('/').pop();

  // Determine likely route and controller paths
  const isRails = primaryRepo.includes('core') || primaryRepo.includes('vcita');
  const routesFile = isRails
    ? `${primaryRepo}/config/routes.rb`
    : `${primaryRepo}/src/routes.ts`;
  const controllerDir = isRails
    ? `${primaryRepo}/app/controllers/api/`
    : `${primaryRepo}/src/controllers/`;

  return `# Verify Endpoint: ${method} ${path}

## ⚠️ START HERE - Primary Repository

**Repository:** ${repoName}
**Full Path:** ${primaryRepo}
**Routes File:** ${routesFile}
**Controller Dir:** ${controllerDir}

## Step 1: Find the Route (DO THIS FIRST)

Run this Grep command FIRST:
\`\`\`
Grep pattern="${path.split('/').filter(s => s && !s.startsWith('{')).slice(-2).join('.*')}" path="${primaryRepo}" glob="**/routes*.rb"
\`\`\`

Or search in the routes file directly:
\`\`\`
Grep pattern="${path.split('/').pop()?.replace(/[{}]/g, '')}" path="${routesFile}" output_mode="content" -B=5 -A=5
\`\`\`

## Step 2: Read the Controller

Once you find the route, read the controller file to check:
- Authentication (before_action :authenticate_*)
- Parameters (params.require, params.permit)
- Response structure

## Phase 2: Compare Authentication

**Swagger says:** ${documentedTokenType}

**Security definition:** ${JSON.stringify(security || 'none')}

**Find in code - Rails patterns:**
\`\`\`ruby
before_action :authenticate_staff!    # requires staff token
before_action :authenticate_client!   # requires client token
before_action :authenticate_app!      # requires app token
before_action :authenticate_admin!    # requires admin/internal token
before_action :authenticate_directory! # requires directory token
skip_before_action :authenticate_*    # no auth for this action
\`\`\`

**Find in code - TypeScript patterns:**
\`\`\`typescript
@UseGuards(StaffAuthGuard)    // requires staff token
@UseGuards(ClientAuthGuard)   // requires client token
@UseGuards(AppAuthGuard)      // requires app token
@UseGuards(DirectoryAuthGuard) // requires directory token
@Public()                     // no auth required
\`\`\`

## Phase 3: Compare Parameters

**Swagger path params:** ${JSON.stringify(pathParams)}
**Swagger query params:** ${JSON.stringify(queryParams)}
**Swagger required query:** ${JSON.stringify(requiredQuery)}
**Swagger body properties:** ${JSON.stringify(bodyProps)}
**Swagger body required:** ${JSON.stringify(bodyRequired)}

**Find in code - Rails:**
\`\`\`ruby
params.require(:resource)         # resource wrapper required
params.permit(:field1, :field2)   # allowed fields
validates :field, presence: true  # required in model
\`\`\`

**Find in code - TypeScript:**
\`\`\`typescript
@IsNotEmpty() field: string;     // required
@IsOptional() field?: string;    // optional
@Query('param') param: string;   // query parameter
@Param('id') id: string;         // path parameter
\`\`\`

## Phase 4: Create Workflow (if needed)

${workflow?.exists ? `
**Existing workflow:**
\`\`\`yaml
status: ${workflow.status}
tokenType: ${workflow.testRequest?.tokenType || 'unknown'}
prerequisites: ${JSON.stringify(workflow.prerequisites || [], null, 2)}
\`\`\`
` : `
**No workflow exists yet.**

Based on your code exploration, suggest a workflow that includes:
1. The correct token type (from auth check)
2. Any prerequisites needed to get required UIDs
3. A test request template

Look for:
- What UIDs are required (e.g., service_uid, client_uid, staff_uid)
- Where those UIDs can be obtained (GET endpoints that list resources)
- What the request body should look like
`}

## Swagger Context

**Summary:** ${summary || 'N/A'}

**Description:**

---

## Phase 2: Compare Authentication

**Swagger says:** ${documentedTokenType}

**Security definition:** ${JSON.stringify(security || 'none')}

**Find in code - Rails patterns:**
\`\`\`ruby
before_action :authenticate_staff!    # requires staff token
before_action :authenticate_client!   # requires client token
before_action :authenticate_app!      # requires app token
before_action :authenticate_admin!    # requires admin/internal token
before_action :authenticate_directory! # requires directory token
skip_before_action :authenticate_*    # no auth for this action
\`\`\`

**Find in code - TypeScript patterns:**
\`\`\`typescript
@UseGuards(StaffAuthGuard)    // requires staff token
@UseGuards(ClientAuthGuard)   // requires client token
@UseGuards(AppAuthGuard)      // requires app token
@UseGuards(DirectoryAuthGuard) // requires directory token
@Public()                     // no auth required
\`\`\`

---

## Phase 3: Compare Parameters

**Swagger path params:** ${JSON.stringify(pathParams)}
**Swagger query params:** ${JSON.stringify(queryParams)}
**Swagger required query:** ${JSON.stringify(requiredQuery)}
**Swagger body properties:** ${JSON.stringify(bodyProps)}
**Swagger body required:** ${JSON.stringify(bodyRequired)}

**Find in code - Rails:**
\`\`\`ruby
params.require(:resource)         # resource wrapper required
params.permit(:field1, :field2)   # allowed fields
validates :field, presence: true  # required in model
\`\`\`

**Find in code - TypeScript:**
\`\`\`typescript
@IsNotEmpty() field: string;     // required
@IsOptional() field?: string;    // optional
@Query('param') param: string;   // query parameter
@Param('id') id: string;         // path parameter
\`\`\`

---

## Phase 4: Create Workflow (if needed)

${workflow?.exists ? `
**Existing workflow:**
\`\`\`yaml
status: ${workflow.status}
tokenType: ${workflow.testRequest?.tokenType || 'unknown'}
prerequisites: ${JSON.stringify(workflow.prerequisites || [], null, 2)}
\`\`\`
` : `
**No workflow exists yet.**

Based on your code exploration, suggest a workflow that includes:
1. The correct token type (from auth check)
2. Any prerequisites needed to get required UIDs
3. A test request template

Look for:
- What UIDs are required (e.g., service_uid, client_uid, staff_uid)
- Where those UIDs can be obtained (GET endpoints that list resources)
- What the request body should look like
`}

---

## Swagger Context

**Summary:** ${summary || 'N/A'}

**Description:**
${description || 'N/A'}

**Request Schema:**
\`\`\`json
${JSON.stringify(requestSchema, null, 2)}
\`\`\`

---

## Your Task

1. **Find the controller** - Use Grep to search for the route, then Read the controller
2. **Check authentication** - What token type does the code actually require?
3. **Check parameters** - What parameters does the code actually validate?
4. **Report findings** - Output the JSON with status, findings, and workflow suggestion

Start exploring now.
`;
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

export async function agreementCheckNode(
  state: ValidationState
): Promise<Command> {
  const endpointKey = `${state.endpoint.method} ${state.endpoint.path}`;
  const onProgress = state.onProgress;

  onProgress?.({
    type: 'agent_action',
    action: 'agreement_check',
    details: `Verifying ${endpointKey} against codebase`,
  });

  // Get primary repo for this endpoint
  const primaryRepo = getPrimaryRepo(state.endpoint.path);

  const findings: AgreementFinding[] = [];
  const fixes: AgreementFix[] = [];
  let controllerFile: string | undefined;
  let workflowSuggestion: AgreementCheckResult['workflowSuggestion'] | undefined;
  let status: 'match' | 'mismatch' | 'uncertain' = 'uncertain';

  // Build prompt and log it for debugging
  const agreementPrompt = buildAgreementPrompt(state.endpoint, state.workflow);
  logPrompts(`agreement-check:${endpointKey}`, AGREEMENT_CHECK_SYSTEM, agreementPrompt);

  try {
    // Run Claude Agent SDK query to explore codebase (with LangSmith tracing)
    const { result: messages } = await tracedQuery(
      `agreement-check:${endpointKey}`,
      () => query({
        prompt: agreementPrompt,
        options: {
          model: 'claude-opus-4-5-20251101',
          maxTurns: 25,
          cwd: `${WS2_BASE}/developers-hub`,
          additionalDirectories: ALL_REPOSITORIES,
          allowedTools: ['Glob', 'Grep', 'Read'],
          systemPrompt: AGREEMENT_CHECK_SYSTEM,
          permissionMode: 'bypassPermissions',
          persistSession: false,
        },
      }),
      { endpoint: endpointKey, node: 'agreementCheck' }
    );

    for (const message of messages) {
      if (message.type === 'assistant') {
        // Track tool usage for UI
        for (const block of (message as any).message.content) {
          if (block.type === 'tool_use') {
            onProgress?.({
              type: 'agent_action',
              action: `agreement:${block.name}`,
              details: JSON.stringify(block.input).substring(0, 150),
            });
          }

          // Parse JSON output from text blocks
          if (block.type === 'text') {
            const jsonMatch = block.text.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[1]);

                if (result.status) status = result.status;
                if (result.controllerFile) controllerFile = result.controllerFile;
                if (result.findings) findings.push(...result.findings);
                if (result.workflowSuggestion) workflowSuggestion = result.workflowSuggestion;
              } catch (e) {
                console.log('Failed to parse agreement check JSON:', e);
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Agreement check error:', error);
    // Continue with uncertain status
  }

  // Determine if there are critical mismatches
  const errorFindings = findings.filter(f => f.severity === 'error');
  const hasMismatch = status === 'mismatch' || errorFindings.length > 0;

  // Build code agreement record
  const codeAgreement: CodeAgreement = {
    checked: true,
    controllerFile,
    matches: !hasMismatch,
    findings,
  };

  onProgress?.({
    type: 'agent_action',
    action: 'agreement_check_complete',
    details: hasMismatch
      ? `Found ${errorFindings.length} errors, ${findings.length} total findings`
      : `Verified - ${findings.length} findings (no errors)`,
  });

  // If no workflow and we have a suggestion, create one
  if (!state.workflow.exists && workflowSuggestion) {
    onProgress?.({
      type: 'agent_action',
      action: 'workflow_creation',
      details: `Creating workflow for ${endpointKey}`,
    });

    fixes.push({
      type: 'workflow',
      file: `api-validation/workflows/${state.endpoint.domain || 'other'}/${state.endpoint.method.toLowerCase()}_${state.endpoint.path.replace(/\//g, '_').replace(/[{}]/g, '')}.md`,
      action: 'create_workflow',
      details: workflowSuggestion,
    });
  }

  // Route based on findings
  if (hasMismatch) {
    return new Command({
      update: {
        agreement: {
          validated: false,
          findings,
          fixes,
          mismatches: errorFindings,
          controllerFile,
          codeAgreement,
        },
        result: {
          status: 'BLOCKED',
          reason: `Documentation mismatch: ${errorFindings.map(f => f.fix || f.swagger).join(', ')}`,
          docIssues: errorFindings.map(f => ({
            field: f.category,
            issue: `Swagger: ${f.swagger}, Code: ${f.code}`,
            suggestedFix: f.fix,
            severity: f.severity === 'error' ? 'critical' : 'minor',
          })),
        },
      },
      goto: 'updateVerification',
    });
  }

  // No critical mismatches - continue to execute loop
  return new Command({
    update: {
      agreement: {
        validated: true,
        findings,
        fixes,
        mismatches: [],
        controllerFile,
        codeAgreement,
      },
      // If workflow was suggested, store it
      workflowSuggestion: workflowSuggestion || undefined,
    },
    goto: 'executeLoop',
  });
}

// =============================================================================
// Workflow Creation Helper
// =============================================================================

export async function createWorkflowFile(
  endpointKey: string,
  suggestion: NonNullable<AgreementCheckResult['workflowSuggestion']>,
  domain: string = 'other'
): Promise<string> {
  const { promises: fs } = await import('fs');
  const path = await import('path');

  const [method, ...pathParts] = endpointKey.split(' ');
  const apiPath = pathParts.join(' ');

  // Generate filename
  const safePath = apiPath
    .replace(/^\//, '')
    .replace(/\//g, '_')
    .replace(/[{}]/g, '');
  const filename = `${method.toLowerCase()}_${safePath}.md`;
  const workflowDir = path.join(process.cwd(), 'api-validation', 'workflows', domain);
  const filepath = path.join(workflowDir, filename);

  // Ensure directory exists
  await fs.mkdir(workflowDir, { recursive: true });

  // Generate YAML frontmatter
  const prerequisites = suggestion.prerequisites.map(p => {
    let prereq = `  - name: "${p.name}"\n    method: ${p.method}\n    path: ${p.path}`;
    if (p.extract) {
      prereq += `\n    extract:\n`;
      for (const [key, value] of Object.entries(p.extract)) {
        prereq += `      ${key}: "${value}"\n`;
      }
    }
    return prereq;
  }).join('\n');

  const testRequest = suggestion.testRequest
    ? `test_request:
  method: ${suggestion.testRequest.method}
  path: ${suggestion.testRequest.path}
${suggestion.testRequest.body ? `  body: ${JSON.stringify(suggestion.testRequest.body)}` : ''}
${suggestion.testRequest.params ? `  params: ${JSON.stringify(suggestion.testRequest.params)}` : ''}`
    : '';

  const content = `---
status: pending
token_type: ${suggestion.tokenType}
required_params: ${JSON.stringify(suggestion.requiredParams)}
prerequisites:
${prerequisites || '  # No prerequisites needed'}
${testRequest}
created_at: ${new Date().toISOString()}
---

# ${method} ${apiPath}

## Overview
Auto-generated workflow based on code analysis.

## Prerequisites
${suggestion.prerequisites.length > 0
    ? suggestion.prerequisites.map(p => `- **${p.name}**: ${p.method} ${p.path}`).join('\n')
    : 'No prerequisites required.'}

## Test Request
\`\`\`json
${JSON.stringify(suggestion.testRequest || { method, path: apiPath }, null, 2)}
\`\`\`

## Notes
- Token type: ${suggestion.tokenType}
- Required params: ${suggestion.requiredParams.join(', ') || 'none'}
`;

  await fs.writeFile(filepath, content, 'utf-8');

  console.log(`Created workflow: ${filepath}`);
  return filepath;
}
