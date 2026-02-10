/**
 * AI Doc Fixer Agent (Layer 3)
 * 
 * A clean, streaming AI agent that fixes one endpoint at a time.
 * Uses Anthropic's streaming API for real-time thinking visibility.
 * Receives directives + accumulated insight from the orchestrator.
 * 
 * Architecture:
 *   - Shares infrastructure (client init, source code search, API calls) via shared-tools.js
 *   - Has its own doc-fixer-specific tools (workflow R/W, swagger R/W, etc.)
 *   - Streams thinking tokens and tool calls back via onProgress callback
 */

const fs = require('fs');
const path = require('path');

const { initializeClient, getAIConfig, findServiceForEndpoint, searchSourceCode, readSourceFile, executeApiCall } = require('./shared-tools');
const workflowRepo = require('../workflows/repository');
const { executeWorkflow, createRequestFunction, clearSwaggerCache } = require('../prerequisite');

// ─── Project Paths ───────────────────────────────────────────────────────────

const API_VALIDATION_ROOT = path.join(__dirname, '../../..');
const REPO_ROOT = path.join(API_VALIDATION_ROOT, '..');
const WORKFLOWS_DIR = path.join(API_VALIDATION_ROOT, 'workflows');
const SWAGGER_DIR = path.join(REPO_ROOT, 'swagger');
const TEMPLATE_PATH = path.join(WORKFLOWS_DIR, 'TEMPLATE.md');
const KB_PATH = path.join(API_VALIDATION_ROOT, 'docs/healing-knowledge-base.md');

/**
 * Load the healing knowledge base content.
 * Returns the raw markdown, or empty string if not found.
 */
function loadKnowledgeBase() {
  try {
    if (fs.existsSync(KB_PATH)) {
      return fs.readFileSync(KB_PATH, 'utf8');
    }
  } catch (_e) { /* ignore */ }
  return '';
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const BASE_SYSTEM_PROMPT = `You are a precise API documentation fixer. You fix one endpoint at a time.
Your goal: get a 2xx response from the real API by fixing the workflow file (and swagger if needed).

## RULE #1: ALWAYS CALL report_fix_result
You MUST call report_fix_result before you finish. ALWAYS. Whether you succeeded or failed.
- 2xx response achieved → report_fix_result with success=true and explain the fix
- Could NOT get 2xx → report_fix_result with success=false and explain why
- NEVER end without calling report_fix_result.

## RULE #2: NEVER INVENT UIDs
NEVER use fake UIDs like "test123", "test-uid", "spr_test_missing", "dummy_payment_uid", etc.
Real UIDs look like: "lk9wgeze3ee1nl1v", "fc2ca1c54e528bc4"
If you need a UID, get it from a prerequisite API call. If you can't get one, report failure.

## RULE #3: 2xx IS THE ONLY SUCCESS
A non-2xx response (422, 401, 500, etc.) is NEVER a successful fix, even if the error "makes sense."
- Do NOT report success=true with a non-2xx response.
- If the workflow currently has expectedOutcome: 422, your job is to REMOVE it by fixing the prerequisites so the API returns 2xx.
- "expectedOutcome" is a last resort for truly untestable endpoints (e.g., webhook-only endpoints with no way to create test data). It is NOT acceptable for endpoints that CAN return 2xx with proper setup.
- Before accepting non-2xx, ask yourself: "Can I add a prerequisite step that creates the data this endpoint needs?" If yes, do it.
- If you truly cannot get 2xx after exhausting all options, report success=false and explain what prerequisite data is missing.

## RULE #4: BE THOROUGH BUT STRUCTURED
You have a generous tool-call budget — use it wisely. Do NOT dive deep into source code. Your steps should be:
1. Read existing workflow (if any)
2. Check similar verified workflows via list_similar_workflows
3. Explore with execute_api to find correct token/params/body
4. **If the main gateway fails with 422 "Unauthorized" / "Bad Gateway" / 502:** immediately retry with use_fallback=true. If fallback succeeds, write a minimal workflow with \`useFallbackApi: true\` right away (RULE #8).
5. Write the workflow and run test_workflow to verify the full chain
6. Fix and re-test if test_workflow fails — try different tokens, params, paths, fallback API
7. Call report_fix_result when done
If you are going in circles repeating the same approach, call report_fix_result with success=false and explain what you tried.

## RULE #5: NO SOURCE CODE RABBIT HOLES
Do NOT search for authorize_params, base controllers, authentication modules, etc.
Source code is a LAST resort. Use it only to find:
- How the frontend calls the endpoint (search frontage first)
- What body fields are required (if not clear from swagger/workflow)
Do NOT trace authorization chains or study internal Ruby code.

## Token Patterns (apply directly - no need to investigate)
| Path Pattern | Token | Notes |
|---|---|---|
| /v1/partners/* | directory | Partners API. Auto-routed to partnersUrl with Token auth (RULE #9) |
| /platform/v1/clients/{id}/* | directory | Requires X-On-Behalf-Of: {{business_id}} |
| /platform/v1/* | staff | Use fallback API if 422 "Unauthorized" (RULE #8) |
| /business/payments/v1/* | staff | May need fallback API (RULE #8) |
| /business/clients/v1/* | staff | Staff token with business context |
| /client/* | client | Client JWT token |
| /v3/apps/* | app | OAuth app token |
| /v3/payment_processing/* | app | OAuth app token |

## RULE #7: ADMIN TOKEN FOR CROSS-DIRECTORY OPERATIONS
Some operations require an **admin** token (sent as "Admin <token>" instead of "Bearer <token>").
Use admin token when:
- **App assignments**: Assigning an app that does NOT belong to the current directory. A directory token can only assign its own apps. Use admin token to assign any app.
- **Cross-directory resource management**: Any operation that manipulates resources across directory boundaries.
- **Internal/platform-level operations**: Endpoints documented for "Internal Token" access.

In the workflow, set the token to "admin" on the relevant step:
\`\`\`yaml
steps:
  - id: assign_app
    method: POST
    path: "/v3/apps/assignments"
    token: admin    # Required: directory token cannot assign apps from other directories
    body:
      app_uid: "{{app_uid}}"
      business_uid: "{{business_id}}"
\`\`\`

If a directory-token call returns 403/401 on an app assignment or similar cross-directory operation, **switch to admin token immediately** — do not waste iterations trying other tokens.

## RULE #8: EARLY FALLBACK API DETECTION — SAVE IMMEDIATELY
When you get a gateway error (422 "Unauthorized", "Bad Gateway", 502, or the main API returns a routing error), **immediately** try the same request with use_fallback=true.
If the fallback succeeds (2xx) where the main gateway failed:
1. **Immediately write the workflow** with \`useFallbackApi: true\` in the frontmatter — even if the rest of the fix is incomplete. This ensures that even if the overall fix fails, the next run will not waste time rediscovering the fallback issue.
2. Then continue fixing the rest of the workflow (prerequisites, body fields, etc.).
3. When you later write the final workflow, keep \`useFallbackApi: true\` in the frontmatter.

This is a **save-early** pattern: persist known-good information to disk as soon as you discover it, don't wait until the end.

## RULE #9: PARTNERS API ROUTING
Endpoints with "/partners/" in the URL path (e.g., /v1/partners/accounts/*, /v1/partners/reports/*) are served by a dedicated Partners API at a different base URL (configured as \`partnersUrl\` in config).
- The framework automatically detects partners endpoints and routes them to the Partners API URL.
- Partners API uses **HTTP Token authentication** (\`Token token="..."\`) instead of Bearer. The framework handles this conversion automatically.
- Partners API requires a **directory** token.
- If you see a 404 on a /v1/partners/* endpoint, ensure the partnersUrl is configured. The standard gateway and fallback API do NOT serve partners routes.

## Common Error → Fix Map (apply directly)
| Error | Fix |
|---|---|
| 500 on POST/PUT with empty body | Create workflow with required body fields |
| 422 "Unauthorized" | Wrong token type. Try staff with fallback API — see RULE #8 |
| 401 Unauthorized | Token type mismatch. Check similar verified workflows |
| 422 "param required" | Add missing query/body params to workflow |
| 422 "Not Found" on a UID | UID doesn't exist. Add prerequisite to fetch real UID |
| 404 | Resource doesn't exist. Add prerequisite to create it |
| 404 on /v1/partners/* | Partners API routing. Uses partnersUrl automatically — see RULE #9 |
| 403/401 on app assignment/cross-dir op | Use admin token instead of directory token |
| 502 / Bad Gateway | Main gateway routing issue. Try fallback API — see RULE #8 |

## Reading Swagger Files
The tool searches both root and legacy/ subdirectories automatically.
Use: domain="sales", file="legacy_v1_sales.json" (or "payments.json", "client_cards.json", etc.)

## Workflow File Format (embedded - no need to read TEMPLATE.md)
\`\`\`yaml
---
endpoint: "POST /platform/v1/payments"
domain: sales
tags: [payments]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified          # verified ONLY for reliable 2xx. Use pending for non-2xx.
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
# Optional:
useFallbackApi: true                     # when main gateway doesn't work
tokens: [staff, directory]               # supported token types
# RARE - only for truly untestable endpoints (e.g., webhooks with no test data source):
# expectedOutcome: 422
# expectedOutcomeReason: "Reason here"
---

# Create Payment

## Summary
Brief description. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required (only if useFallbackApi: true)

## Prerequisites
\\\`\`\`yaml
steps:
  - id: get_client
    description: "Fetch a client"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
\\\`\`\`

## Test Request
\\\`\`\`yaml
steps:
  - id: main_request
    method: POST
    path: "/platform/v1/payments"
    body:
      amount: 100
      client_id: "{{client_uid}}"
    expect:
      status: [200, 201]
\\\`\`\`
\`\`\`

## Built-in Variables (available without prerequisites)
{{business_id}}, {{staff_id}}, {{client_id}}, {{matter_uid}}, {{conversation_uid}}
{{tomorrow_date}}, {{tomorrow_datetime}}, {{next_week_date}}, {{future_datetime}}

## RULE #11: IGNORE EXISTING WORKFLOW STATUS — ALWAYS VERIFY
The current status field in a workflow is MEANINGLESS to you. Ignore it completely.
- Even if a workflow says "status: verified", you MUST run test_workflow to confirm it actually passes.
- Even if the healing knowledge base says "already verified" or "verified through manual testing", you MUST still attempt to get test_workflow to pass.
- If test_workflow FAILS, you MUST update the workflow to set \`status: pending\` (not verified).
- Only report success=true if test_workflow returns success=true. "Previously verified" or "manually tested" is NOT success.
- If test_workflow fails and you cannot fix it, write the workflow with \`status: pending\` and report success=false.
- NEVER report "no fix needed" — if the workflow was sent to you, it failed validation. Your job is to make it pass.

## Workflow Status Rules
- verified = test_workflow returned success=true in THIS session
- pending = test_workflow failed or was not run
- NEVER use onFail: skip. Use onFail: abort.
- NEVER keep status: verified on a workflow that fails test_workflow — downgrade it to pending.

## RULE #6: ALWAYS TEST THE WORKFLOW FILE (not just the raw API)
After writing/updating a workflow, you MUST call test_workflow to verify the FULL prerequisite chain works.
- The validator runs the workflow file (prerequisites → extract variables → test request). It does NOT run your manual execute_api calls.
- If you only test via execute_api with hardcoded values, the workflow may still fail because a prerequisite step is broken.
- After write_workflow, always call test_workflow with the same path. If it fails, fix the prerequisite and test again.
- Only report success=true if test_workflow returns success=true.
- If test_workflow fails on a prerequisite step, the error tells you exactly which step and why — fix that step.
- Common prerequisite failures: wrong extract JSONPath, missing token type on step, unresolved {{variables}}, wrong API path.

## RULE #9: NEVER SUBSTITUTE ENDPOINT PATHS
You are fixing the EXACT endpoint path given to you. NEVER decide that the endpoint is "actually" a different one.
- If the endpoint is POST /business/communication/channels, you MUST test POST /business/communication/channels.
- NEVER change the endpoint path to a different endpoint (e.g., /business/messaging/v1/channels).
- Two different paths are two different endpoints, even if they seem related.
- If the given endpoint returns 404 from both primary AND fallback APIs, it means the endpoint is NOT IMPLEMENTED.
  In that case: report_fix_result with success=false and include "ENDPOINT_NOT_IMPLEMENTED" in fix_summary.
  Do NOT go searching for "the real endpoint" — that is endpoint substitution and is strictly forbidden.
- The workflow file's endpoint field MUST match the exact endpoint you were given to fix.

## RULE #10: ENDPOINT NOT IMPLEMENTED — RECOMMEND SWAGGER REMOVAL
If you confirm an endpoint returns 404 on both primary and fallback APIs (not a UID-related 404, but a route-level 404):
1. Report success=false with fix_summary starting with "ENDPOINT_NOT_IMPLEMENTED:"
2. Include a recommendation to remove the endpoint from swagger documentation
3. Do NOT create a workflow file for a non-existent endpoint
4. Do NOT search for alternative endpoints — that violates RULE #9

## RULE #12: ONLY USE DOCUMENTED ENDPOINTS
When writing prerequisite steps or making API calls to fetch data (UIDs, emails, etc.), you MUST only use documented, official API paths that appear in the swagger definitions.
- NEVER use legacy, undocumented, or shorthand paths like /v2/staffs, /v2/clients, etc.
- Use the documented equivalents, e.g. /platform/v1/businesses/{{business_id}}/staffs instead of /v2/staffs.
- If you need data from an endpoint, verify it exists in the swagger documentation first.
- Undocumented paths may not be routed by the API gateway and will result in 404 errors.

## What NOT to do
- Do NOT read TEMPLATE.md (you already have the format above)
- Do NOT search for "authorize_params", "def authorize", "base_controller", "Api::Authentication"
- Do NOT invent UIDs or use test/dummy/fake/placeholder values
- Do NOT endlessly cycle through the same token combinations — if 3-4 different tokens all fail, move on to other approaches
- Do NOT go deep into backend source files — 2-3 files max, and only as a last resort
- Do NOT report success based only on execute_api — you MUST verify with test_workflow
- Do NOT substitute one endpoint for another — see RULE #9
- Do NOT use undocumented or legacy API paths — see RULE #12
`;

/**
 * Build the full system prompt with directive, accumulated insight, and KB injected.
 */
function buildSystemPrompt(directive, accumulatedInsight, referenceWorkflow, knowledgeBaseContent, maxIterations) {
  let prompt = BASE_SYSTEM_PROMPT;

  // Tell the agent its actual iteration budget
  if (maxIterations) {
    prompt += `\n\n## Iteration Budget\nYou have up to **${maxIterations} iterations** available. Use them wisely — don't rush to report failure if you still have approaches to try. Only report failure when you've genuinely exhausted your options.`;
  }

  // Inject the full healing knowledge base so the agent can match patterns
  if (knowledgeBaseContent) {
    prompt += `\n\n## Healing Knowledge Base (consult BEFORE investigating)\nIf any entry below matches your endpoint's symptoms/path, apply the documented resolution as a starting point.\n**IMPORTANT**: KB entries are hints, not free passes. Even if a KB entry says "verified" or "no fix needed", you MUST still run test_workflow. If test_workflow fails, the workflow is NOT verified — set status to pending and report failure.\n\n${knowledgeBaseContent}`;
  }

  if (directive) {
    prompt += `\n\n## Directive from Report Analysis\n${directive}`;
  }

  if (referenceWorkflow) {
    prompt += `\n\n## Reference Workflow (verified, same path pattern)\nEndpoint: ${referenceWorkflow.endpoint}\nToken: ${referenceWorkflow.token}\nHas prerequisites: ${referenceWorkflow.hasPrerequisites}\nFile: ${referenceWorkflow.filePath}`;
  }

  if (accumulatedInsight && accumulatedInsight.length > 0) {
    prompt += `\n\n## Successful Fix Recipes from This Group`;
    prompt += `\nThe following endpoints in the same failure group were already fixed. Apply the same pattern:`;
    for (const recipe of accumulatedInsight) {
      prompt += `\n- ${recipe.endpoint}: ${recipe.fixApplied}`;
      if (recipe.workflowChanges) prompt += `\n  Workflow: ${recipe.workflowChanges}`;
      if (recipe.tokenUsed) prompt += `\n  Token: ${recipe.tokenUsed}`;
    }
  }

  return prompt;
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

const DOC_FIXER_TOOLS = [
  {
    name: 'read_workflow',
    description: 'Read a workflow .md file. Pass the relative path within the workflows directory (e.g., "sales/get_business_payments_v1_invoices.md" or "TEMPLATE.md").',
    input_schema: {
      type: 'object',
      properties: {
        workflow_path: { type: 'string', description: 'Relative path to the workflow file within the workflows directory' }
      },
      required: ['workflow_path']
    }
  },
  {
    name: 'write_workflow',
    description: 'Create or update a workflow .md file. Content should follow the TEMPLATE.md format.',
    input_schema: {
      type: 'object',
      properties: {
        workflow_path: { type: 'string', description: 'Relative path within the workflows directory' },
        content: { type: 'string', description: 'Full markdown content of the workflow file' }
      },
      required: ['workflow_path', 'content']
    }
  },
  {
    name: 'read_swagger_schema',
    description: 'Read the swagger/OpenAPI schema JSON for a given domain and file. Returns the full schema or a specific path within it.',
    input_schema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Swagger domain folder (e.g., "sales", "clients")' },
        file: { type: 'string', description: 'Swagger JSON filename (e.g., "legacy_v1_sales.json")' },
        json_path: { type: 'string', description: 'Optional dot-separated path to extract (e.g., "paths./platform/v1/payments.post")' }
      },
      required: ['domain', 'file']
    }
  },
  {
    name: 'update_swagger_field',
    description: 'Update a specific field in a swagger JSON file. Use JSON path notation to target the field.',
    input_schema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Swagger domain folder' },
        file: { type: 'string', description: 'Swagger JSON filename' },
        json_path: { type: 'string', description: 'Dot-separated path to the field (e.g., "paths./platform/v1/payments.post.parameters")' },
        value: { description: 'New value for the field (any JSON type)' }
      },
      required: ['domain', 'file', 'json_path', 'value']
    }
  },
  {
    name: 'list_similar_workflows',
    description: 'Find verified workflows with similar path patterns. Useful for copying token and prerequisite patterns.',
    input_schema: {
      type: 'object',
      properties: {
        path_pattern: { type: 'string', description: 'Path pattern to search for (e.g., "/platform/v1/clients")' },
        domain: { type: 'string', description: 'Optional domain filter' }
      },
      required: ['path_pattern']
    }
  },
  {
    name: 'execute_api',
    description: 'Execute an API call against the live API to test fixes.',
    input_schema: {
      type: 'object',
      properties: {
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
        path: { type: 'string', description: 'API path (e.g., "/platform/v1/payments")' },
        params: { type: 'object', description: 'Query parameters' },
        body: { type: 'object', description: 'Request body (JSON)' },
        token_type: { type: 'string', enum: ['staff', 'directory', 'admin', 'app', 'client'], default: 'staff' },
        on_behalf_of: { type: 'string', description: 'Business UID for X-On-Behalf-Of header (required for directory tokens)' },
        use_fallback: { type: 'boolean', default: false, description: 'Use fallback API URL instead of primary' }
      },
      required: ['method', 'path']
    }
  },
  {
    name: 'test_workflow',
    description: 'Run the full workflow (prerequisites + test request) exactly as the validator does. Use this AFTER writing a workflow to verify the prerequisite chain works end-to-end. Returns success/failure with details about which step failed.',
    input_schema: {
      type: 'object',
      properties: {
        workflow_path: { type: 'string', description: 'Relative path to the workflow file within the workflows directory (e.g., "sales/get_business_payments_v1_client_packages_uid.md")' }
      },
      required: ['workflow_path']
    }
  },
  {
    name: 'find_service_for_endpoint',
    description: 'Find which microservice handles a given API endpoint path.',
    input_schema: {
      type: 'object',
      properties: {
        endpoint_path: { type: 'string', description: 'API path to look up' }
      },
      required: ['endpoint_path']
    }
  },
  {
    name: 'search_source_code',
    description: 'Search source code in a repository using ripgrep.',
    input_schema: {
      type: 'object',
      properties: {
        repository: { type: 'string', description: 'Repository name (e.g., "core", "frontage", "client-portal")' },
        search_pattern: { type: 'string', description: 'Search pattern (regex supported)' },
        file_glob: { type: 'string', description: 'Optional file glob filter (e.g., "*.rb", "*.js")' }
      },
      required: ['repository', 'search_pattern']
    }
  },
  {
    name: 'read_source_file',
    description: 'Read a source file from a repository.',
    input_schema: {
      type: 'object',
      properties: {
        repository: { type: 'string', description: 'Repository name' },
        file_path: { type: 'string', description: 'Relative file path within the repository' },
        start_line: { type: 'integer', description: 'Optional start line' },
        end_line: { type: 'integer', description: 'Optional end line' }
      },
      required: ['repository', 'file_path']
    }
  },
  {
    name: 'report_fix_result',
    description: 'Report the result of your fix attempt. Call this when done (success or failure).',
    input_schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', description: 'Whether the fix resulted in a 2xx API response' },
        fix_summary: { type: 'string', description: 'Brief description of what was fixed' },
        workflow_changes: { type: 'string', description: 'Description of workflow changes made' },
        swagger_changes: { type: 'string', description: 'Description of swagger changes made (if any)' },
        token_used: { type: 'string', description: 'Token type that worked' },
        source_reference: { type: 'string', description: 'Key source code file that informed the fix' },
        api_response_status: { type: 'integer', description: 'Final HTTP status code from the API' }
      },
      required: ['success', 'fix_summary']
    }
  }
];

// ─── Tool Execution ──────────────────────────────────────────────────────────

/**
 * Execute a single tool call and return the result.
 */
async function executeDocFixerTool(toolName, toolInput, context) {
  // NOTE: tool_call and tool_result progress events are emitted by the agent loop
  // in runDocFixer(). Do NOT emit them here to avoid duplication.
  // Only emit unique side-effect events like file_changed.
  const { config, onProgress } = context;

  switch (toolName) {
    case 'read_workflow': {
      const { workflow_path } = toolInput;
      const fullPath = path.join(WORKFLOWS_DIR, workflow_path);
      if (!fs.existsSync(fullPath)) {
        return { error: `Workflow not found: ${workflow_path}`, available_domains: fs.readdirSync(WORKFLOWS_DIR).filter(f => fs.statSync(path.join(WORKFLOWS_DIR, f)).isDirectory()) };
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      return { content, path: workflow_path };
    }

    case 'write_workflow': {
      const { workflow_path, content } = toolInput;

      // RULE #9 GUARD: Prevent endpoint substitution
      // Extract the endpoint from the workflow content's frontmatter
      const workflowEndpointMatch = content.match(/^endpoint:\s*["']?(.+?)["']?\s*$/m);
      if (workflowEndpointMatch && context.targetEndpoint) {
        const workflowEndpoint = workflowEndpointMatch[1].trim();
        const targetNormalized = context.targetEndpoint.trim();
        if (workflowEndpoint !== targetNormalized) {
          console.warn(`[DocFixer] BLOCKED write_workflow: endpoint substitution detected. Workflow has "${workflowEndpoint}" but target is "${targetNormalized}".`);
          return {
            error: `ENDPOINT_SUBSTITUTION_BLOCKED: The workflow endpoint "${workflowEndpoint}" does not match the target endpoint "${targetNormalized}". You MUST NOT substitute one endpoint for another (RULE #9). Fix the EXACT endpoint you were given, or report failure if it cannot be fixed.`,
            blocked: true
          };
        }
      }

      const fullPath = path.join(WORKFLOWS_DIR, workflow_path);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const existed = fs.existsSync(fullPath);
      fs.writeFileSync(fullPath, content, 'utf8');

      // Invalidate workflow index so new workflow is picked up
      workflowRepo.invalidateIndexCache();

      onProgress?.({ type: 'file_changed', file: `workflows/${workflow_path}`, action: existed ? 'updated' : 'created' });
      return { success: true, path: workflow_path, message: 'Workflow saved successfully' };
    }

    case 'read_swagger_schema': {
      const { domain, file, json_path } = toolInput;

      // Try both swagger/ and legacy/ subdirectories
      const candidates = [
        path.join(SWAGGER_DIR, domain, file),
        path.join(SWAGGER_DIR, domain, 'legacy', file)
      ];

      let swaggerContent = null;
      let resolvedPath = null;

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          swaggerContent = fs.readFileSync(candidate, 'utf8');
          resolvedPath = candidate;
          break;
        }
      }

      if (!swaggerContent) {
        const domainDir = path.join(SWAGGER_DIR, domain);
        let available = [];
        if (fs.existsSync(domainDir)) {
          available = listSwaggerFiles(domainDir);
        }
        return { error: `Swagger file not found: ${domain}/${file}`, available };
      }

      try {
        const parsed = JSON.parse(swaggerContent);

        if (json_path) {
          const value = getNestedValue(parsed, json_path);
          return { path: json_path, value, file: resolvedPath };
        }

        // Return truncated version for large schemas
        const str = JSON.stringify(parsed, null, 2);
        if (str.length > 50000) {
          return {
            note: `Schema is large (${str.length} chars). Use json_path to target specific sections.`,
            top_level_keys: Object.keys(parsed),
            paths: parsed.paths ? Object.keys(parsed.paths) : [],
            file: resolvedPath
          };
        }

        return { schema: parsed, file: resolvedPath };
      } catch (e) {
        return { error: `Failed to parse JSON: ${e.message}` };
      }
    }

    case 'update_swagger_field': {
      const { domain, file, json_path, value } = toolInput;

      const candidates = [
        path.join(SWAGGER_DIR, domain, file),
        path.join(SWAGGER_DIR, domain, 'legacy', file)
      ];

      let resolvedPath = null;
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          resolvedPath = candidate;
          break;
        }
      }

      if (!resolvedPath) {
        return { error: `Swagger file not found: ${domain}/${file}` };
      }

      // Safety: never allow writing to mcp_swagger
      if (resolvedPath.includes('mcp_swagger')) {
        return { error: 'Cannot modify mcp_swagger files (auto-generated). Use files under /swagger directory.' };
      }

      try {
        const content = fs.readFileSync(resolvedPath, 'utf8');
        const parsed = JSON.parse(content);

        setNestedValue(parsed, json_path, value);

        fs.writeFileSync(resolvedPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');

        // Invalidate the executor's swagger cache so test_workflow reads fresh data
        const relativeSwaggerPath = path.relative(REPO_ROOT, resolvedPath);
        clearSwaggerCache(relativeSwaggerPath);

        onProgress?.({ type: 'file_changed', file: `swagger/${domain}/${file}`, action: 'updated', field: json_path, domain });

        return { success: true, file: resolvedPath, field: json_path };
      } catch (e) {
        return { error: `Failed to update swagger: ${e.message}` };
      }
    }

    case 'list_similar_workflows': {
      const { path_pattern, domain: filterDomain } = toolInput;

      try {
        const results = workflowRepo.search({
          endpoint: path_pattern,
          domain: filterDomain,
          status: 'verified'
        });

        // Also search by partial path match
        const index = workflowRepo.getIndex();
        const allEndpoints = Object.keys(index.workflows || {});
        const normalizedPattern = path_pattern.replace(/\{[^}]+\}/g, '');

        const matches = allEndpoints
          .filter(ep => {
            const epPath = ep.split(' ').slice(1).join(' ').replace(/\{[^}]+\}/g, '');
            return epPath.includes(normalizedPattern) || normalizedPattern.includes(epPath.split('/').slice(0, 4).join('/'));
          })
          .map(ep => {
            const entry = index.workflows[ep];
            return {
              endpoint: ep,
              status: entry?.displayStatus || entry?.status,
              domain: entry?.domain,
              file: entry?.file
            };
          })
          .filter(w => w.status === 'verified')
          .slice(0, 10);

        return {
          results: matches.length > 0 ? matches : results?.slice(0, 10) || [],
          tip: 'Read a verified workflow to see its token type and prerequisite pattern.'
        };
      } catch (e) {
        return { error: `Search failed: ${e.message}`, results: [] };
      }
    }

    case 'execute_api': {
      const { method, path: apiPath, params, body, token_type, on_behalf_of, use_fallback } = toolInput;

      return await executeApiCall({
        method,
        apiPath,
        params,
        body,
        tokenType: token_type,
        onBehalfOf: on_behalf_of,
        useFallback: use_fallback
      }, config, null);
    }

    case 'test_workflow': {
      const { workflow_path } = toolInput;
      try {
        // Force reload the workflow from disk (the agent may have just written it)
        workflowRepo.invalidateIndexCache();

        // Parse the workflow file using the repo's parser
        const fullPath = path.join(WORKFLOWS_DIR, workflow_path);
        if (!fs.existsSync(fullPath)) {
          return { success: false, error: `Workflow file not found: ${workflow_path}` };
        }

        // Read the endpoint key from the workflow file's front-matter
        const rawContent = fs.readFileSync(fullPath, 'utf8');
        const endpointMatch = rawContent.match(/^endpoint:\s*["']?(.+?)["']?\s*$/m);
        if (!endpointMatch) {
          return { success: false, error: 'Could not parse endpoint from workflow file front-matter' };
        }
        const endpointKey = endpointMatch[1].trim();

        // Load the fully parsed workflow (prerequisites, testRequest, etc.)
        const workflow = workflowRepo.get(endpointKey);
        if (!workflow) {
          return { success: false, error: `Workflow not found in index for endpoint: ${endpointKey}. Make sure the file was saved correctly.` };
        }

        // Build config for the executor (same shape as the validator uses)
        // config comes from loadConfig() which merges default.json + tokens.json
        // It already has: baseUrl, fallbackUrl, tokens, params
        const executorConfig = {
          baseUrl: config.baseUrl,
          fallbackUrl: config.fallbackUrl,
          tokens: config.tokens || {},
          params: config.params || {}
        };

        // Run the full workflow (prerequisites + test request)
        const result = await executeWorkflow(workflow, executorConfig, null, { workflowRepo });

        if (result.success) {
          return {
            success: true,
            phase: result.phase,
            status: result.status,
            message: `Workflow passed! API returned ${result.status}.`,
            variables_resolved: Object.keys(result.variables || {}).filter(k => !['business_uid', 'business_id', 'staff_id', 'client_id'].includes(k)),
            steps_executed: (result.steps || []).length,
            used_fallback: result.usedFallback
          };
        } else {
          return {
            success: false,
            phase: result.phase,
            failed_step: result.failedStep,
            failed_reason: result.failedReason,
            status: result.status,
            message: `Workflow FAILED at phase "${result.phase}"${result.failedStep ? ` on step "${result.failedStep}"` : ''}: ${result.failedReason || 'Unknown error'}`,
            variables_resolved: Object.keys(result.variables || {}).filter(k => !['business_uid', 'business_id', 'staff_id', 'client_id'].includes(k)),
            steps_executed: (result.steps || []).length,
            used_fallback: result.usedFallback,
            tip: result.phase === 'prerequisites'
              ? `The prerequisite step "${result.failedStep}" failed. Fix the prerequisite or add missing steps. Common issues: wrong token type, missing extract JSONPath, unresolved variables.`
              : `The test request failed with status ${result.status}. Check the request body/params and ensure prerequisites extracted the right variables.`
          };
        }
      } catch (e) {
        return { success: false, error: `Workflow test error: ${e.message}` };
      }
    }

    case 'find_service_for_endpoint': {
      const { endpoint_path } = toolInput;
      return findServiceForEndpoint(endpoint_path);
    }

    case 'search_source_code': {
      const { repository, search_pattern, file_glob } = toolInput;
      return searchSourceCode(repository, search_pattern, file_glob);
    }

    case 'read_source_file': {
      const { repository, file_path, start_line, end_line } = toolInput;
      return readSourceFile(repository, file_path, start_line, end_line);
    }

    case 'report_fix_result': {
      // Store the result in context for the orchestrator to capture
      context.fixResult = toolInput;

      // Flag endpoint-not-implemented for downstream swagger removal recommendations
      if (toolInput.fix_summary && toolInput.fix_summary.includes('ENDPOINT_NOT_IMPLEMENTED')) {
        context.fixResult.endpointNotImplemented = true;
        context.fixResult.swaggerRemovalRecommended = true;
      }

      return { acknowledged: true, message: 'Fix result recorded.' };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function getNestedValue(obj, dotPath) {
  const parts = dotPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

function setNestedValue(obj, dotPath, value) {
  const parts = dotPath.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] == null) {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

function listSwaggerFiles(dir, prefix = '') {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        results.push(...listSwaggerFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`));
      } else if (entry.name.endsWith('.json')) {
        results.push(`${prefix}${entry.name}`);
      }
    }
  } catch (_e) { /* ignore */ }
  return results;
}

// ─── Main Agent Loop ─────────────────────────────────────────────────────────

/**
 * Run the doc fixer agent for a single endpoint.
 * 
 * @param {Object} options
 * @param {Object} options.endpoint - The endpoint object with method, path, etc.
 * @param {Object} options.failureData - Failure details (reason, errors, httpStatus, etc.)
 * @param {Object} options.config - Application config (tokens, baseUrl, AI keys)
 * @param {string} options.directive - Directive from the report analyzer
 * @param {Object[]} options.accumulatedInsight - Fix recipes from earlier endpoints in the group
 * @param {Object} options.referenceWorkflow - Reference verified workflow
 * @param {Function} options.onProgress - Callback for streaming events
 * @param {number} [options.maxIterations=20] - Maximum agent loop iterations
 * @returns {Object} Fix result with success, fixSummary, workflowChanges, etc.
 */
async function runDocFixer(options) {
  const {
    endpoint,
    failureData,
    healerAnalysis,
    config,
    directive,
    accumulatedInsight = [],
    referenceWorkflow,
    onProgress,
    maxIterations = 20,
    previousConversation
  } = options;

  const method = endpoint.method || (endpoint.endpoint ? endpoint.endpoint.split(' ')[0] : 'GET');
  const apiPath = endpoint.path || (endpoint.endpoint ? endpoint.endpoint.split(' ').slice(1).join(' ') : '');
  const endpointLabel = `${method} ${apiPath}`;

  onProgress?.({ type: 'agent_start', endpoint: endpointLabel });

  // Initialize AI client
  const aiConfig = getAIConfig(config, 'docFixer');
  const { client } = initializeClient(aiConfig.apiKey, aiConfig.provider);

  if (!client) {
    return {
      success: false,
      endpoint: endpointLabel,
      fixSummary: 'AI client not configured',
      error: 'Missing API key for doc fixer model'
    };
  }

  // Load the healing knowledge base so the agent can consult it
  const knowledgeBaseContent = loadKnowledgeBase();

  // Build system prompt with directive, accumulated insight, and KB
  console.log(`[DocFixer] maxIterations=${maxIterations}`);
  const systemPrompt = buildSystemPrompt(directive, accumulatedInsight, referenceWorkflow, knowledgeBaseContent, maxIterations);

  // Build the initial user message with failure context + healer analysis
  const userMessage = buildUserMessage(endpoint, failureData, healerAnalysis);

  // Context for tool execution
  const context = {
    config,
    onProgress,
    fixResult: null,
    // The exact endpoint being fixed — used by write_workflow guard (RULE #9)
    targetEndpoint: endpointLabel
  };

  // Agent conversation loop
  let messages;
  if (previousConversation && previousConversation.length > 0) {
    // Continue from the previous conversation — the AI retains full context of what it tried
    messages = [...previousConversation];
    messages.push({
      role: 'user',
      content: [
        `Your previous fix attempt for this endpoint has completed, but it was not successful enough. The operator has requested another attempt.`,
        ``,
        `Please continue where you left off. You already know what approaches you tried — try a DIFFERENT approach this time. Do not repeat failed strategies.`,
        ``,
        `Remember:`,
        `- The workflow file on disk reflects any changes from your previous attempt`,
        `- You still MUST call report_fix_result when done`,
        `- Focus on approaches you haven't tried yet`,
        `- Re-read the workflow file to see its current state before making changes`
      ].join('\n')
    });
    // Reset fix result for this new attempt
    context.fixResult = null;
  } else {
    messages = [{ role: 'user', content: userMessage }];
  }
  let iterations = 0;
  let lastResponse = null;

  while (iterations < maxIterations) {
    iterations++;
    onProgress?.({ type: 'iteration_start', iteration: iterations, maxIterations });

    try {
      // Use streaming API for real-time thinking visibility
      const stream = client.messages.stream({
        model: aiConfig.model,
        max_tokens: 16000,
        system: systemPrompt,
        tools: DOC_FIXER_TOOLS,
        messages
      });

      // Stream thinking tokens
      stream.on('text', (text) => {
        onProgress?.({ type: 'thinking_delta', text, iteration: iterations });
      });

      // Wait for the full response
      lastResponse = await stream.finalMessage();

    } catch (apiError) {
      console.error(`[DocFixer] API error on iteration ${iterations}:`, apiError.message);
      onProgress?.({ type: 'agent_error', error: apiError.message, iteration: iterations });
      return {
        success: false,
        endpoint: endpointLabel,
        fixSummary: `API error: ${apiError.message}`,
        error: apiError.message,
        iterations
      };
    }

    // Check if agent wants to stop (end_turn or no tool use)
    const hasToolUse = lastResponse.content?.some(b => b.type === 'tool_use');
    const textBlocks = lastResponse.content?.filter(b => b.type === 'text') || [];

    // Note: text blocks are already streamed via thinking_delta events above.
    // No need to re-emit them here.

    // If no tool use, the agent is done
    if (!hasToolUse || lastResponse.stop_reason === 'end_turn') {
      onProgress?.({ type: 'agent_done', iteration: iterations, reason: lastResponse.stop_reason });
      break;
    }

    // Process tool calls
    const toolUseBlocks = lastResponse.content.filter(b => b.type === 'tool_use');
    const toolResults = [];

    for (const toolBlock of toolUseBlocks) {
      onProgress?.({ type: 'tool_call', tool: toolBlock.name, input: toolBlock.input, iteration: iterations });

      try {
        const result = await executeDocFixerTool(toolBlock.name, toolBlock.input, context);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify(result)
        });

        onProgress?.({
          type: 'tool_result',
          tool: toolBlock.name,
          result: {
            success: result.success !== undefined ? result.success : !result.error,
            status: result.status,
            preview: JSON.stringify(result).substring(0, 200)
          },
          iteration: iterations
        });

        // If report_fix_result was called, we'll break after this iteration
        if (toolBlock.name === 'report_fix_result') {
          onProgress?.({ type: 'fix_reported', result: context.fixResult });
        }
      } catch (toolError) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolBlock.id,
          content: JSON.stringify({ error: toolError.message }),
          is_error: true
        });
        onProgress?.({ type: 'tool_error', tool: toolBlock.name, error: toolError.message, iteration: iterations });
      }
    }

    // Add assistant response and tool results to messages
    messages.push({ role: 'assistant', content: lastResponse.content });

    // If fix result was reported, break the loop
    if (context.fixResult) {
      messages.push({ role: 'user', content: toolResults });
      break;
    }

    // Inject a nudge when approaching the iteration limit
    const remainingIterations = maxIterations - iterations;
    if (remainingIterations <= 3) {
      toolResults.push({
        type: 'text',
        text: `⚠️ SYSTEM: You have ${remainingIterations} iterations remaining. You MUST call report_fix_result on your NEXT response. If you haven't achieved 2xx, report failure with what you learned. Do NOT start new investigations or source code searches.`
      });
    }

    messages.push({ role: 'user', content: toolResults });
  }

  // Build final result
  const fixResult = context.fixResult || {
    success: false,
    fix_summary: 'Agent did not report a fix result',
    workflow_changes: null,
    swagger_changes: null,
    token_used: null,
    source_reference: null
  };

  onProgress?.({ type: 'agent_complete', endpoint: endpointLabel, result: fixResult, iterations });

  return {
    success: fixResult.success,
    endpoint: endpointLabel,
    fixSummary: fixResult.fix_summary,
    workflowChanges: fixResult.workflow_changes,
    swaggerChanges: fixResult.swagger_changes,
    tokenUsed: fixResult.token_used,
    sourceReference: fixResult.source_reference,
    apiResponseStatus: fixResult.api_response_status,
    endpointNotImplemented: fixResult.endpointNotImplemented || false,
    swaggerRemovalRecommended: fixResult.swaggerRemovalRecommended || false,
    iterations,
    conversationHistory: messages
  };
}

/**
 * Build the user message with full failure context for the agent.
 */
function buildUserMessage(endpoint, failureData, healerAnalysis) {
  const method = endpoint.method || (endpoint.endpoint ? endpoint.endpoint.split(' ')[0] : 'GET');
  const apiPath = endpoint.path || (endpoint.endpoint ? endpoint.endpoint.split(' ').slice(1).join(' ') : '');
  const domain = endpoint.domain || 'unknown';

  let msg = `Fix this API endpoint documentation:\n\n`;
  msg += `## Endpoint\n- Method: ${method}\n- Path: ${apiPath}\n- Domain: ${domain}\n`;

  if (failureData) {
    msg += `\n## Failure Details\n`;
    msg += `- Reason: ${failureData.reason || 'Unknown'}\n`;
    msg += `- HTTP Status: ${failureData.httpStatus || 'N/A'}\n`;

    if (failureData.friendlyMessage) {
      msg += `\n## Error Description\n${failureData.friendlyMessage}\n`;
    }

    if (failureData.errors && failureData.errors.length > 0) {
      msg += `\n## Validation Errors\n`;
      for (const err of failureData.errors) {
        msg += `- [${err.path || '/'}]: ${err.message || err.reason || 'Unknown'}\n`;
      }
    }

    if (failureData.docFixSuggestions && failureData.docFixSuggestions.length > 0) {
      msg += `\n## AI-Detected Documentation Issues\n`;
      for (const issue of failureData.docFixSuggestions) {
        msg += `- Field: ${issue.field || '/'}\n  Issue: ${issue.issue || 'N/A'}\n`;
        if (issue.suggestedFix) msg += `  Suggested Fix: ${issue.suggestedFix}\n`;
      }
    }

    if (failureData.suggestion) {
      msg += `\n## Suggested Fix\n${failureData.suggestion}\n`;
    }

    if (failureData.agentSummary) {
      msg += `\n## Previous AI Agent Summary\n${failureData.agentSummary}\n`;
    }
  }

  // Include structured healer analysis if available
  if (healerAnalysis) {
    msg += `\n## Healer Analysis (from upstream healing agent)\n`;
    msg += `The healer agent attempted to get a 2xx response but failed. Here is its structured analysis:\n\n`;

    if (healerAnalysis.error_patterns && healerAnalysis.error_patterns.length > 0) {
      msg += `### Error Patterns Observed\n`;
      for (const ep of healerAnalysis.error_patterns) {
        msg += `- HTTP ${ep.status} (${ep.error_type}): ${ep.message}\n`;
      }
    }

    if (healerAnalysis.attempted_approaches && healerAnalysis.attempted_approaches.length > 0) {
      msg += `\n### Approaches Already Tried\n`;
      for (const approach of healerAnalysis.attempted_approaches) {
        msg += `- ${approach.description} → ${approach.result}\n`;
      }
    }

    if (healerAnalysis.tokens_tried && healerAnalysis.tokens_tried.length > 0) {
      msg += `\n### Tokens Tried\n`;
      for (const token of healerAnalysis.tokens_tried) {
        msg += `- ${token.type}: ${token.result}\n`;
      }
    }

    if (healerAnalysis.uid_state) {
      if (healerAnalysis.uid_state.resolved && Object.keys(healerAnalysis.uid_state.resolved).length > 0) {
        msg += `\n### Resolved UIDs\n\`\`\`json\n${JSON.stringify(healerAnalysis.uid_state.resolved, null, 2)}\n\`\`\`\n`;
      }
      if (healerAnalysis.uid_state.unresolved && healerAnalysis.uid_state.unresolved.length > 0) {
        msg += `\n### Unresolved UIDs\n${healerAnalysis.uid_state.unresolved.map(u => `- ${u}`).join('\n')}\n`;
      }
    }

    if (healerAnalysis.last_request) {
      msg += `\n### Last Request Attempted\n\`\`\`json\n${JSON.stringify(healerAnalysis.last_request, null, 2)}\n\`\`\`\n`;
    }

    if (healerAnalysis.last_response) {
      msg += `\n### Last Response Received\n\`\`\`json\n${JSON.stringify(healerAnalysis.last_response, null, 2)}\n\`\`\`\n`;
    }

    if (healerAnalysis.hints) {
      msg += `\n### Healer Hints\n${healerAnalysis.hints}\n`;
    }
  }

  if (endpoint.swaggerFile) {
    msg += `\n## Swagger File\n${endpoint.swaggerFile}\n`;
  }

  if (endpoint.tokenUsed) {
    msg += `\n## Token Used During Test\n${endpoint.tokenUsed}\n`;
  }

  msg += `\n## Step-by-Step Instructions (follow this order exactly)\n`;
  msg += `⚠️ IMPORTANT: This endpoint FAILED validation. Even if the existing workflow says "status: verified", it DOES NOT PASS. Ignore the status field — your job is to make test_workflow succeed.\n`;
  msg += `1. Read the existing workflow file for this endpoint (read_workflow with the workflow filename)\n`;
  msg += `   - IGNORE the status field. Even if it says "verified", the endpoint is failing. Do NOT report "no fix needed."\n`;
  msg += `2. Call list_similar_workflows to find verified workflows with similar path patterns — copy their token type and pattern\n`;
  msg += `3. Use execute_api to explore the API and figure out the correct token, params, body, and prerequisites\n`;
  msg += `4. Write/update the workflow file with correct prerequisites, token type, and test request\n`;
  msg += `   - Add prerequisite steps to create/fetch the data the endpoint needs\n`;
  msg += `   - Each prerequisite must use extract: to save variables that later steps reference via {{variable_name}}\n`;
  msg += `   - Fix token type, add missing body fields, resolve real UIDs\n`;
  msg += `   - If the workflow has "expectedOutcome" with a non-2xx status, try to REMOVE it by adding proper prerequisites\n`;
  msg += `5. **CRITICAL**: Call test_workflow to run the FULL workflow (prerequisites + test request) — this is what the validator runs\n`;
  msg += `   - If test_workflow fails, read the error (it tells you which step failed and why)\n`;
  msg += `   - Fix the failing prerequisite step, write_workflow again, and test_workflow again\n`;
  msg += `   - Repeat until test_workflow returns success=true\n`;
  msg += `6. Call report_fix_result (MANDATORY — even if you couldn't get test_workflow to pass)\n`;
  msg += `\n## SUCCESS CRITERIA\n`;
  msg += `- success=true ONLY if test_workflow returned success=true (which means the full prerequisite chain + test request got 2xx)\n`;
  msg += `- Testing via execute_api alone is NOT sufficient — the workflow file must pass test_workflow\n`;
  msg += `- A 422 or 401 response is NOT success, even if the error message "makes sense"\n`;
  msg += `- If the workflow had "expectedOutcome: 422", that means the PREVIOUS fixer gave up. You should try harder.\n`;
  msg += `- If the workflow had "status: verified" but test_workflow fails, you MUST update it to "status: pending" and report success=false\n`;
  msg += `- "Already verified" or "manually tested" is NOT a valid success reason — only test_workflow passing counts\n`;
  msg += `\n## ANTI-PATTERNS — do NOT do these:\n`;
  msg += `- Do NOT report success based only on execute_api — you MUST verify with test_workflow\n`;
  msg += `- Do NOT accept non-2xx as "expected behavior" unless the endpoint is truly untestable (e.g., webhooks)\n`;
  msg += `- Do NOT read TEMPLATE.md (the format is in your system prompt)\n`;
  msg += `- Do NOT search for "authorize_params", "def authorize", "base_controller", or "Api::Authentication"\n`;
  msg += `- Do NOT use fake UIDs like "test123", "test-uid", or "dummy_uid" — always resolve via prerequisite API calls\n`;
  msg += `- Do NOT search more than 2 backend source files — focus on workflow fixes, not code investigation\n`;
  msg += `- Do NOT try more than 3 different token types — use the pattern from similar verified workflows\n`;
  msg += `- Do NOT substitute the endpoint path for a different one — if the endpoint 404s, report ENDPOINT_NOT_IMPLEMENTED, do NOT look for "the real endpoint"\n`;
  msg += `- Do NOT report "no fix needed" or "already verified" — if the endpoint is here, it FAILED. Your job is to make it pass test_workflow.\n`;
  msg += `- Do NOT trust the existing workflow status — even "verified" workflows can fail. Always run test_workflow to confirm.\n`;

  return msg;
}

module.exports = { runDocFixer };
