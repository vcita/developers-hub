/**
 * Node 2: Agreement Check
 *
 * Agent node that compares THREE sources for consistency:
 * 1. SWAGGER (documentation we publish)
 * 2. WORKFLOW (our test procedure)
 * 3. CODE (actual implementation)
 *
 * Uses Claude to explore the codebase and find mismatches.
 * Can auto-fix swagger/workflow files when discrepancies found.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ValidationState,
  AgreementResult,
  AgreementFix,
  ProgressCallback,
} from '../state.js';

// =============================================================================
// Routing Map (reuse from ai-agent-healer.js)
// =============================================================================

/**
 * Maps API path prefixes to microservice repositories
 */
export const APIGW_ROUTING: Record<string, string> = {
  '/platform/v1/': 'core',
  '/business/scheduling/': 'core',
  '/business/clients/': 'core',
  '/business/staffs/': 'core',
  '/v3/staff': 'core',
  '/v3/license/': 'subscriptionsmng',
  '/v3/communication/voice_calls': 'voicecalls',
  '/v3/scheduling/availability': 'availability',
  '/v3/scheduling/resources': 'resources',
  '/v3/access_control/': 'permissionsmanager',
  '/v3/ai/': 'aiplatform',
  '/v3/apps/': 'core',
  '/client_api/': 'core',
};

/**
 * Maps service names to local repository paths
 */
export const REPO_PATHS: Record<string, string> = {
  core: '/Users/yehoshua.katz/ws2/core',
  vcita: '/Users/yehoshua.katz/ws2/vcita',
  apigw: '/Users/yehoshua.katz/ws2/apigw',
  subscriptionsmng: '/Users/yehoshua.katz/ws2/subscriptionsmng',
  availability: '/Users/yehoshua.katz/ws2/availability',
  resources: '/Users/yehoshua.katz/ws2/resources',
  voicecalls: '/Users/yehoshua.katz/ws2/voicecalls',
  notificationscenter: '/Users/yehoshua.katz/ws2/notificationscenter',
  permissionsmanager: '/Users/yehoshua.katz/ws2/permissionsmanager',
  aiplatform: '/Users/yehoshua.katz/ws2/aiplatform',
  phonenumbersmanager: '/Users/yehoshua.katz/ws2/phonenumbersmanager',
  'communication-gw': '/Users/yehoshua.katz/ws2/communication-gw',
};

/**
 * Find which service handles an endpoint path
 */
export function findServiceForPath(path: string): { service: string; repoPath: string } | null {
  let matchedService: string | null = null;
  let matchLength = 0;

  for (const [prefix, service] of Object.entries(APIGW_ROUTING)) {
    if (path.startsWith(prefix) && prefix.length > matchLength) {
      matchedService = service;
      matchLength = prefix.length;
    }
  }

  if (matchedService && REPO_PATHS[matchedService]) {
    return {
      service: matchedService,
      repoPath: REPO_PATHS[matchedService],
    };
  }

  // Default to core
  return {
    service: 'core',
    repoPath: REPO_PATHS.core,
  };
}

// =============================================================================
// Agreement Check Prompt
// =============================================================================

const AGREEMENT_CHECK_PROMPT = `# Agreement Check Agent

You are checking if the API documentation (swagger) matches the actual code implementation.

## Your Task

Compare these THREE sources for the endpoint **{METHOD} {PATH}**:

1. **SWAGGER** (documentation we publish)
2. **WORKFLOW** (our test procedure)
3. **CODE** (actual implementation)

## What to Compare

### 1. TOKEN/AUTHENTICATION

Check which token type the endpoint actually requires:

**In swagger, look for:**
- "Available for **Staff tokens**" → token_type: "staff"
- "Available for **Client tokens**" → token_type: "client"
- "Available for **Internal tokens**" → token_type: "admin"
- "Available for **App tokens**" → token_type: "app"

**In code, look for:**
- Rails: \`before_action :authenticate_staff!\` → requires staff token
- Rails: \`before_action :authenticate_client!\` → requires client token
- Rails: \`before_action :authenticate_admin!\` → requires admin token
- TypeScript: \`@UseGuards(StaffAuthGuard)\` → requires staff token
- TypeScript: \`@UseGuards(ClientAuthGuard)\` → requires client token

**MISMATCH EXAMPLE:**
- Swagger says: "Available for Staff and Client tokens"
- Code has: \`before_action :authenticate_staff!\` (ONLY staff)
- FIX: Update swagger to say "Available for Staff tokens only"

### 2. REQUIRED PARAMETERS

Check which parameters are actually required:

**In swagger, look for:**
- \`required: true\` in parameter definitions
- \`required: ["field1", "field2"]\` in request body schema

**In code, look for:**
- Rails: \`validates :field_name, presence: true\`
- Rails: \`params.require(:object).permit(:field1, :field2)\`
- TypeScript: \`@IsNotEmpty()\` decorator
- TypeScript: \`@IsDefined()\` decorator

### 3. PARAMETER NAMES

Check if parameter names match exactly:

**MISMATCH EXAMPLE:**
- Swagger uses: \`service_id\`
- Code expects: \`service_uid\`
- FIX: Update swagger parameter name to \`service_uid\`

## How to Find the Code

### Service Mapping

The endpoint **{PATH}** is handled by: **{SERVICE}**
Repository path: **{REPO_PATH}**

### For Rails (core):
Look for:
- Route: config/routes.rb or config/routes/*.rb
- Controller: app/controllers/**/*_controller.rb
- Also check: modules/*/app/controllers/**/*_controller.rb (engines)

### For TypeScript microservices:
Look for:
- Route decorator: @Get, @Post, @Put, @Delete
- Controller: src/**/*.controller.ts

## Your Analysis

Based on the endpoint information provided, I want you to:

1. **Identify the likely controller/handler** based on the path
2. **List what swagger claims** (from the schema I provide)
3. **Note any potential mismatches** to investigate
4. **Provide recommendations** if you find issues

## Current Context

**ENDPOINT:** {METHOD} {PATH}

**SWAGGER SCHEMA:**
\`\`\`json
{SWAGGER_SCHEMA}
\`\`\`

**SWAGGER DESCRIPTION:**
{SWAGGER_DESCRIPTION}

**WORKFLOW (if exists):**
{WORKFLOW}

## Output Format

Respond with a JSON object:
\`\`\`json
{
  "validated": true|false,
  "mismatches": [
    {
      "category": "token|parameter|response",
      "swagger": "what swagger says",
      "code": "what code does (if found)",
      "recommendation": "suggested fix"
    }
  ],
  "searchSuggestions": [
    "suggested search patterns to find the code"
  ],
  "notes": "any additional observations"
}
\`\`\`

If you cannot definitively verify (no code access), set validated=false and provide searchSuggestions.
`;

// =============================================================================
// Main Node Function
// =============================================================================

export interface AgreementCheckOptions {
  /** Skip agreement check if workflow already validated */
  skipIfValidated?: boolean;
  /** Maximum tokens to use */
  maxTokens?: number;
  /** Model to use */
  model?: string;
}

/**
 * Agreement Check Node
 *
 * Uses Claude to analyze swagger schema and identify potential mismatches
 * with code implementation. This is a "soft" check that provides
 * recommendations rather than blocking.
 */
export async function agreementCheckNode(
  state: ValidationState,
  onProgress?: ProgressCallback,
  options: AgreementCheckOptions = {}
): Promise<Partial<ValidationState>> {
  console.log('\n===== NODE 2: AGREEMENT CHECK =====');

  const { endpoint, workflow, config } = state;
  const endpointKey = `${endpoint.method} ${endpoint.path}`;

  onProgress?.({
    type: 'agent_action',
    action: 'agreement_check_start',
    details: `Checking agreement for ${endpointKey}`,
  });

  // Skip if workflow is already marked as validated
  if (options.skipIfValidated && workflow.exists && workflow.status === 'success') {
    console.log('Workflow already validated, skipping agreement check');
    onProgress?.({
      type: 'agent_action',
      action: 'agreement_check_skip',
      details: 'Workflow already validated',
    });

    return {
      agreement: {
        validated: true,
        fixes: [],
        mismatches: [],
      },
    };
  }

  // Find service for this endpoint
  const serviceInfo = findServiceForPath(endpoint.path);
  if (!serviceInfo) {
    console.log('Could not determine service for endpoint');
    return {
      agreement: {
        validated: false,
        fixes: [],
        mismatches: [],
      },
    };
  }

  console.log(`Service: ${serviceInfo.service}`);
  console.log(`Repo: ${serviceInfo.repoPath}`);

  // Build the prompt
  const prompt = AGREEMENT_CHECK_PROMPT
    .replace(/{METHOD}/g, endpoint.method)
    .replace(/{PATH}/g, endpoint.path)
    .replace('{SERVICE}', serviceInfo.service)
    .replace('{REPO_PATH}', serviceInfo.repoPath)
    .replace(
      '{SWAGGER_SCHEMA}',
      endpoint.requestSchema ? JSON.stringify(endpoint.requestSchema, null, 2) : 'No schema defined'
    )
    .replace('{SWAGGER_DESCRIPTION}', endpoint.description || 'No description')
    .replace(
      '{WORKFLOW}',
      workflow.exists
        ? `Status: ${workflow.status}\nSummary: ${workflow.summary || 'N/A'}\nPrerequisites: ${workflow.prerequisites?.length || 0}`
        : 'No workflow exists yet'
    );

  // Check if AI is configured
  const apiKey = config.ai?.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log('No Anthropic API key configured, skipping agreement check');
    return {
      agreement: {
        validated: false,
        fixes: [],
        mismatches: [],
      },
    };
  }

  try {
    // Call Claude for analysis
    const client = new Anthropic({ apiKey });

    console.log('Calling Claude for agreement analysis...');

    const response = await client.messages.create({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = parseAgreementResponse(content.text);

    console.log(`Agreement check complete: validated=${result.validated}`);
    if (result.mismatches && result.mismatches.length > 0) {
      console.log(`Found ${result.mismatches.length} potential mismatches`);
      for (const mismatch of result.mismatches) {
        console.log(`  - [${mismatch.category}] ${mismatch.swagger} vs ${mismatch.code}`);
      }
    }

    onProgress?.({
      type: 'agent_action',
      action: 'agreement_check_complete',
      details: `Validated: ${result.validated}, Mismatches: ${result.mismatches?.length || 0}`,
    });

    return {
      agreement: result,
    };
  } catch (error) {
    console.log(`Agreement check error: ${error}`);
    onProgress?.({
      type: 'agent_action',
      action: 'agreement_check_error',
      details: String(error),
    });

    return {
      agreement: {
        validated: false,
        fixes: [],
        mismatches: [],
      },
    };
  }
}

// =============================================================================
// Response Parsing
// =============================================================================

function parseAgreementResponse(text: string): AgreementResult {
  // Try to extract JSON from the response
  const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return {
        validated: parsed.validated ?? false,
        fixes: [],
        mismatches: parsed.mismatches || [],
      };
    } catch {
      // Fall through to default
    }
  }

  // Try to parse the whole text as JSON
  try {
    const parsed = JSON.parse(text);
    return {
      validated: parsed.validated ?? false,
      fixes: [],
      mismatches: parsed.mismatches || [],
    };
  } catch {
    // Return default
  }

  // Default response if parsing fails
  return {
    validated: false,
    fixes: [],
    mismatches: [],
  };
}

// =============================================================================
// Exports
// =============================================================================

export { AGREEMENT_CHECK_PROMPT };
