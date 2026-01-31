/**
 * AI Agent Healer - Deterministic UID Resolution with Source Code Exploration
 * 
 * The agent follows a strict workflow:
 * 1. Extract all required UIDs from swagger schema
 * 2. For each UID, find GET endpoint to fetch existing entity
 * 3. If empty, find POST endpoint to create entity
 * 4. Only after ALL UIDs are resolved, retry the original request
 * 5. If structure is unclear, explore source code to understand expected format
 * 6. Document findings in workflow AND as doc_issues for documentation improvement
 * 
 * UID resolution steps are NOT counted as retries.
 * Only the actual endpoint retries count toward max iterations.
 * 
 * WORKFLOW-AWARE BEHAVIOR:
 * - If a verified workflow exists, compare AI actions against documented procedure
 * - If AI follows the workflow successfully → PASS (no false doc issues)
 * - If AI deviates from workflow → WARN with note to update workflow
 * - Doc issues are filtered against existing swagger documentation
 */

const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const workflowRepo = require('../workflows/repository');
const { groupByResource, parseResourcePath, getCrudOperation } = require('../orchestrator/resource-grouper');
const { 
  detectSwaggerTypeMismatch, 
  applyTypeConversions, 
  convertValueToType 
} = require('../validator/response-validator');

let anthropicClient = null;
let openaiClient = null;

// Repository paths for source code access
const GITHUB_BASE = process.env.GITHUB_BASE_PATH || '/Users/ram.almog/Documents/GitHub';
const REPO_PATHS = {
  core: process.env.CORE_REPO_PATH || `${GITHUB_BASE}/core`,
  vcita: process.env.VCITA_REPO_PATH || `${GITHUB_BASE}/vcita`,
  apigw: `${GITHUB_BASE}/apigw`,
  subscriptionsmng: `${GITHUB_BASE}/subscriptionsmng`,
  notificationscenter: `${GITHUB_BASE}/notificationscenter`,
  voicecalls: `${GITHUB_BASE}/voicecalls`,
  availability: `${GITHUB_BASE}/availability`,
  resources: `${GITHUB_BASE}/resources`,
  permissionsmanager: `${GITHUB_BASE}/permissionsmanager`,
  aiplatform: `${GITHUB_BASE}/aiplatform`,
  phonenumbersmanager: `${GITHUB_BASE}/phonenumbersmanager`,
  'communication-gw': `${GITHUB_BASE}/communication-gw`
};

// API Gateway routing configuration - maps path prefixes to services
const APIGW_ROUTING = {
  '/v3/license/': 'subscriptionsmng',
  '/business/subscriptionsmng/': 'subscriptionsmng',
  '/v3/communication/voice_calls': 'voicecalls',
  '/v3/communication/voice_call_quotas': 'voicecalls',
  '/v3/communication/voice_call_recordings': 'voicecalls',
  '/v3/communication/voice_call_settings': 'voicecalls',
  '/v3/communication/available_phone_numbers': 'phonenumbersmanager',
  '/v3/communication/business_phone_numbers': 'phonenumbersmanager',
  '/v3/access_control/': 'permissionsmanager',
  '/access_control/': 'permissionsmanager',
  '/v3/ai/': 'aiplatform',
  '/business/notificationscenter/': 'notificationscenter',
  '/client/notificationscenter/': 'notificationscenter',
  '/directory/notificationscenter/': 'notificationscenter',
  '/v3/communication/staff_notifications': 'notificationscenter',
  '/v3/communication/notification_templates': 'notificationscenter',
  '/v3/scheduling/business_availabilities': 'availability',
  '/v3/scheduling/availability_slots': 'availability',
  '/v3/scheduling/resource_types': 'resources',
  '/v3/scheduling/resources': 'resources',
  '/v3/apps/widgets': 'app-widgets-manager',
  '/v3/apps/staff_widgets_boards': 'app-widgets-manager',
  '/business/communication/': 'communication-gw',
  '/platform/v1/': 'core',
  '/business/scheduling/': 'core',
  '/business/staffs/': 'core',
  '/business/clients/': 'core',
  '/v3/staff': 'core',
  '/v3/business_administration': 'core'
};

function initializeClient(apiKey, provider = 'anthropic') {
  if (!apiKey) return null;
  
  if (provider === 'openai') {
    if (!openaiClient) {
      openaiClient = new OpenAI({ 
        apiKey,
        organization: null,  // Explicitly disable organization
        project: null        // Explicitly disable project
      });
    }
    return { client: openaiClient, provider: 'openai' };
  }
  
  // Default to Anthropic
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey });
  }
  return { client: anthropicClient, provider: 'anthropic' };
}

/**
 * Get the appropriate API key based on provider config
 */
function getAIConfig(config) {
  const provider = config.ai?.provider || 'anthropic';
  const apiKey = provider === 'openai' 
    ? config.ai?.openaiApiKey 
    : config.ai?.anthropicApiKey;
  const model = provider === 'openai'
    ? (config.ai?.model?.openai || 'gpt-4o')
    : (config.ai?.model?.anthropic || 'claude-sonnet-4-20250514');
  
  return { provider, apiKey, model };
}

/**
 * Define tools for deterministic UID resolution with source code exploration
 */
const TOOLS = [
  {
    name: "extract_required_uids",
    description: "Extract all required UID/ID fields from the endpoint's swagger schema. Call this FIRST to understand what UIDs you need to resolve before retrying the request.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "find_uid_source",
    description: "Given a UID field name (e.g., 'service_uid'), find the GET and POST endpoints that can provide a valid value. Returns the list endpoint to fetch existing entities and the create endpoint as fallback.",
    input_schema: {
      type: "object",
      properties: {
        uid_field: {
          type: "string",
          description: "The UID field name to resolve (e.g., 'service_uid', 'client_uid', 'product_uid')"
        }
      },
      required: ["uid_field"]
    }
  },
  {
    name: "execute_api",
    description: "Execute an API call. Use this to fetch existing entities (GET) or create new ones (POST) during UID resolution, and to retry the original request once all UIDs are resolved. If primary URL returns 404 or routing error, try with use_fallback=true.",
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
          enum: ["staff", "directory", "client", "business", "app", "admin"],
          description: "Which token to use. Default is 'staff'. IMPORTANT: In swagger documentation, 'Internal Token' means 'admin' token. Use 'admin' for endpoints that say 'Available for Internal Tokens only'."
        },
        on_behalf_of: {
          type: "string",
          description: "Business UID to use with X-On-Behalf-Of header. ONLY use this when the endpoint's swagger documentation explicitly mentions 'X-On-Behalf-Of' or 'directory token'. Do NOT use this as a fallback when other auth methods fail - that would mask the real authentication issue."
        },
        purpose: {
          type: "string",
          enum: ["uid_resolution", "retry_original"],
          description: "Purpose of this API call. 'uid_resolution' for fetching/creating entities to get UIDs (not counted as retry). 'retry_original' for retrying the failing endpoint (counted as retry)."
        },
        use_fallback: {
          type: "boolean",
          description: "Use the fallback API URL instead of the primary URL. Try this if you get 404/routing errors on the primary URL. Default is false."
        }
      },
      required: ["method", "path", "purpose"]
    }
  },
  {
    name: "find_service_for_endpoint",
    description: "Find which microservice handles a given API endpoint by checking the API gateway routing configuration. CALL THIS FIRST before searching source code to know which repository to search in!",
    input_schema: {
      type: "object",
      properties: {
        endpoint_path: {
          type: "string",
          description: "The API path to look up (e.g., '/v3/license/business_carts', '/v3/communication/voice_calls')"
        }
      },
      required: ["endpoint_path"]
    }
  },
  {
    name: "search_source_code",
    description: "Search for code patterns in a repository. FIRST call find_service_for_endpoint to know which repository handles your endpoint! Use this when API errors are unclear, you need to understand validation rules, or the expected request format differs from documentation.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita", "apigw", "subscriptionsmng", "notificationscenter", "voicecalls", "availability", "resources", "permissionsmanager", "aiplatform", "phonenumbersmanager", "communication-gw"],
          description: "Which repository to search in. Use find_service_for_endpoint first to determine the correct repository!"
        },
        search_pattern: {
          type: "string",
          description: "Text or regex pattern to search for (e.g., 'def create', 'validates :name', 'packages_api', controller names)"
        },
        file_glob: {
          type: "string",
          description: "Optional file pattern to filter (e.g., '*.rb', '*controller*', '*.ts')"
        }
      },
      required: ["repository", "search_pattern"]
    }
  },
  {
    name: "read_source_file",
    description: "Read a specific source file from a repository to understand implementation details. Use this after search_source_code finds relevant files.",
    input_schema: {
      type: "object",
      properties: {
        repository: {
          type: "string",
          enum: ["core", "vcita", "apigw", "subscriptionsmng", "notificationscenter", "voicecalls", "availability", "resources", "permissionsmanager", "aiplatform", "phonenumbersmanager", "communication-gw"],
          description: "Which repository to read from"
        },
        file_path: {
          type: "string",
          description: "Path to the file within the repository (e.g., 'modules/payments/app/components/payments/packages_api.rb', 'src/subscriptionsmng/controllers/v3/carts/carts.controller.ts')"
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
    name: "acquire_token",
    description: "Acquire a specific type of token dynamically. Actions: 1) 'app_oauth' - Get an APP TOKEN using client_id and client_secret via POST /oauth/service/token (REQUIRED for endpoints like POST /v3/apps/widgets), 2) 'client_jwt' - Get a CLIENT TOKEN for /client/* endpoints (automatically fetches client, sends login link, exchanges for JWT), 3) 'list' - List existing tokens, 4) 'create' - Create directory/business tokens via /platform/v1/tokens.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["app_oauth", "client_jwt", "list", "create"],
          description: "app_oauth=get app token via OAuth (use client_id+client_secret), client_jwt=get client JWT token for /client/* endpoints, list=list existing tokens, create=create directory/business token"
        },
        client_id: {
          type: "string",
          description: "OAuth client_id (returned when creating an app via POST /platform/v1/apps). Required for action='app_oauth'."
        },
        client_secret: {
          type: "string",
          description: "OAuth client_secret (returned when creating an app via POST /platform/v1/apps). Required for action='app_oauth'."
        },
        client_uid: {
          type: "string",
          description: "Client UID for action='client_jwt'. If not provided, will fetch from GET /platform/v1/clients."
        },
        business_uid: {
          type: "string",
          description: "Business UID for action='client_jwt'. If not provided, will use config.params.business_uid."
        },
        app_id: {
          type: "string",
          description: "Numeric App ID for list/create actions. NOT the app_code_name string!"
        },
        app_code_name: {
          type: "string",
          description: "App code name - use this to look up apps, but use numeric app_id for token operations"
        },
        business_id: {
          type: "string",
          description: "Business ID to create a business token for"
        },
        directory_id: {
          type: "string",
          description: "Directory ID to filter tokens or create directory token"
        }
      },
      required: ["action"]
    }
  },
  {
    name: "report_result",
    description: "Call this when you're done. Use status='pass' if test passes, status='fail' if it cannot be fixed (add skip_suggestion=true if you think it should be skippable). NEVER use status='skip' directly - skips require user approval!",
    input_schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pass", "fail"],
          description: "pass=test passes with 2xx, fail=cannot fix (use skip_suggestion if you think it should be skipped)"
        },
        summary: {
          type: "string",
          description: "Brief summary of what happened"
        },
        skip_suggestion: {
          type: "boolean",
          description: "Set to true if you think this test should be skipped (requires user approval). Must also provide skip_reason."
        },
        skip_reason: {
          type: "string",
          description: "Required when skip_suggestion=true. Explain why user might want to skip this test."
        },
        uid_resolution: {
          type: "object",
          description: "PROCEDURE for resolving each UID. Do NOT include actual UID values - only document the steps to obtain them dynamically.",
          additionalProperties: {
            type: "object",
            properties: {
              source_endpoint: {
                type: "string",
                description: "GET endpoint to call first (e.g., 'GET /v3/apps/widgets')"
              },
              extract_from: {
                type: "string",
                description: "How to extract the UID from the response (e.g., 'data.widgets[0].uid', 'first item uid')"
              },
              fallback_endpoint: {
                type: "string",
                description: "POST endpoint to create entity if GET returns empty (e.g., 'POST /v3/apps/widgets')"
              },
              create_fresh: {
                type: "boolean",
                description: "If true, ALWAYS create a fresh entity for this test (don't use existing)"
              },
              create_endpoint: {
                type: "string",
                description: "POST endpoint to create fresh test entity (e.g., 'POST /platform/v1/businesses/{business_id}/staffs')"
              },
              create_body: {
                type: "object",
                description: "Template body for creating fresh entity (use {{timestamp}} for unique values)"
              },
              cleanup_endpoint: {
                type: "string",
                description: "DELETE endpoint to cleanup after test (e.g., 'DELETE /platform/v1/staffs/{uid}')"
              },
              cleanup_note: {
                type: "string",
                description: "If no DELETE endpoint, note why cleanup isn't needed or possible"
              }
            }
          }
        },
        unresolved_uids: {
          type: "array",
          items: { type: "string" },
          description: "List of UID fields that could not be resolved (if any)"
        },
        doc_issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Which field/parameter has the issue" },
              issue: { type: "string", description: "What's wrong or unclear in the documentation" },
              suggested_fix: { type: "string", description: "How to fix the documentation based on source code findings" },
              severity: { type: "string", enum: ["critical", "major", "minor"], description: "critical=blocks usage, major=causes confusion, minor=improvement" },
              source_code_reference: { type: "string", description: "Optional: file/line in source code that clarifies the correct behavior" }
            }
          },
          description: "Documentation issues discovered - include if you found discrepancies between docs and actual behavior"
        }
        // NOTE: fixed_issues removed - workflows no longer store doc issues
      },
      required: ["status", "summary"]
    }
  }
];

/**
 * Check if a documentation issue is already addressed in the swagger description
 * @param {Object} docIssue - The doc issue to check
 * @param {Object} endpoint - The endpoint with its swagger description
 * @param {Object} existingWorkflow - The existing workflow if any
 * @returns {Object} { isAlreadyDocumented: boolean, reason: string }
 */
function checkIfDocIssueAlreadyDocumented(docIssue, endpoint, existingWorkflow) {
  const description = (endpoint.description || '').toLowerCase();
  const summary = (endpoint.summary || '').toLowerCase();
  const issue = (docIssue.issue || '').toLowerCase();
  const suggestedFix = (docIssue.suggested_fix || docIssue.suggestedFix || '').toLowerCase();
  const field = (docIssue.field || '').toLowerCase();
  
  // Also check request schema descriptions if available
  let schemaDescriptions = '';
  if (endpoint.requestSchema) {
    schemaDescriptions = JSON.stringify(endpoint.requestSchema).toLowerCase();
  }
  
  const allDocs = description + ' ' + schemaDescriptions;
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 1: Test data issues
  // These are NOT documentation issues - they're test framework problems
  // =====================================================
  
  // 1a. Test used placeholder/test values - not a doc issue
  if (issue.includes('test_string') || issue.includes('placeholder') || 
      issue.includes('test data used') || issue.includes('used placeholder values')) {
    return { 
      isAlreadyDocumented: true, 
      reason: 'Test data issue - placeholder values are not real documentation problems' 
    };
  }
  
  // 1b. Example format issues - not critical documentation problems
  if (issue.includes('example should use') || issue.includes('example shows')) {
    // Only a real issue if the description doesn't explain the format
    if (allDocs.includes('must be') || allDocs.includes('valid') || allDocs.includes('format')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Example format is a minor issue - validation rules are documented' 
      };
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 2: "Doesn't specify valid values" but values ARE listed
  // =====================================================
  
  // 2a. Check if issue claims values aren't documented but they are
  if (issue.includes("doesn't specify") || issue.includes("doesn't document") || 
      issue.includes('not specified') || issue.includes('not documented')) {
    
    // Check if the field's valid values are actually in the description
    // Look for patterns like "Valid values are:", "Valid values:", "[value1, value2]", etc.
    const hasValidValuesList = /valid values[:\s]|allowed values[:\s]|\[["'][^"'\]]+["'],|valid.*are:/i.test(allDocs);
    
    if (hasValidValuesList) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger description already contains valid values list' 
      };
    }
    
    // Check for specific field mentions with their valid values
    const fieldLower = field.toLowerCase().replace(/[^a-z_]/g, '');
    if (fieldLower && allDocs.includes(fieldLower) && 
        (allDocs.includes('valid') || allDocs.includes('allowed') || allDocs.includes('must be'))) {
      return { 
        isAlreadyDocumented: true, 
        reason: `Field ${field} validation is already documented` 
      };
    }
  }
  
  // 2b. Enum/scope values - check if field description contains the values list
  const enumFields = ['scopes', 'demand_scopes', 'url_params', 'category', 'permissions', 'app_type', 'locales'];
  for (const enumField of enumFields) {
    if (field.includes(enumField) || issue.includes(enumField)) {
      // Check if the description mentions valid values for this field
      if (allDocs.includes(enumField) && 
          (allDocs.includes('valid values') || allDocs.includes('allowed') || 
           allDocs.includes('[') || allDocs.includes('enum'))) {
        return { 
          isAlreadyDocumented: true, 
          reason: `${enumField} valid values are documented in description` 
        };
      }
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 3: OAuth/credential issues
  // =====================================================
  
  // 3a. OAuth credential format issues where docs explain it
  if (issue.includes('service_id') || issue.includes('service_secret') || 
      issue.includes('client_id') || issue.includes('client_secret') ||
      issue.includes('oauth') || issue.includes('credential')) {
    if (allDocs.includes('oauth') || allDocs.includes('client_id') || 
        allDocs.includes('credential') || allDocs.includes('post /platform/v1/apps')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'OAuth credential requirements are documented' 
      };
    }
  }
  
  // 3b. "Documentation is correct" statements from the AI itself
  if (issue.includes('documentation is actually correct') || 
      issue.includes('no changes needed') ||
      suggestedFix.includes('documentation is actually correct') ||
      suggestedFix.includes('no changes needed')) {
    return { 
      isAlreadyDocumented: true, 
      reason: 'AI acknowledged documentation is correct' 
    };
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 4: Minor HTTP status code differences
  // =====================================================
  
  if ((issue.includes('http 200') || issue.includes('http 201')) && 
      (issue.includes('but actually returns') || issue.includes('returns http'))) {
    // 200 vs 201 is very minor - both indicate success
    return { 
      isAlreadyDocumented: true, 
      reason: 'Minor HTTP status code difference (200 vs 201) - both indicate success' 
    };
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 5: WORKFLOW ISSUES (not documentation issues)
  // These are resolved by updating the workflow, not the documentation
  // =====================================================
  
  // 5a. UID/resource existence issues - these are WORKFLOW issues, not doc issues
  // "Resources must exist to be updated" is OBVIOUS and doesn't need documentation
  // "Request didn't include required params" is a test issue, not doc issue
  const workflowIssuePatterns = [
    // Resource/UID existence
    'must be from existing', 'must exist', 'does not exist', "doesn't exist",
    'not found', '404', 'uid validation', 'uids must be', 'must reference existing',
    'existing resources', 'placeholder', 'valid uid', 'real uid', 'actual uid',
    'doesn\'t clearly specify that', 'used placeholder values', 'test data used',
    // Missing parameters in test request (not doc issue if params ARE documented)
    'original test request didn\'t include', 'request didn\'t include', 
    'request was missing', 'missing the mandatory', 'wasn\'t included',
    'weren\'t included', 'not provided in request', 'required query parameters',
    // Successfully resolved via workflow
    'after providing required', 'after adding', 'resolved by providing'
  ];
  
  for (const pattern of workflowIssuePatterns) {
    if (issue.includes(pattern)) {
      return { 
        isAlreadyDocumented: true, 
        reason: `Workflow issue, not documentation issue: "${pattern}" - resolved via UID resolution` 
      };
    }
  }
  
  // 5b. If test passed and there's a successful workflow, UID-related issues are workflow issues
  if (existingWorkflow) {
    const workflowSummary = (existingWorkflow.summary || '').toLowerCase();
    const workflowStatus = (existingWorkflow.status || '').toLowerCase();
    
    // If workflow is successful and issue is about UIDs/resolution
    if ((workflowStatus === 'success' || workflowSummary.includes('pass')) && existingWorkflow.uidResolution) {
      if (issue.includes('uid') || issue.includes('id') || issue.includes('doesn\'t specify') ||
          issue.includes('doesn\'t clearly') || issue.includes('validation')) {
        return { 
          isAlreadyDocumented: true, 
          reason: 'Workflow documents UID resolution - this is a workflow issue, not a doc issue' 
        };
      }
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 6: Uniqueness constraints
  // =====================================================
  
  // Check for uniqueness constraint issues
  if (issue.includes('uniqueness') || issue.includes('unique') || issue.includes('only have one') || issue.includes('one board per')) {
    if (allDocs.includes('uniqueness constraint') || allDocs.includes('only have one') || allDocs.includes('can only have one')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger already documents the uniqueness constraint' 
      };
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 7: UID validation already documented
  // =====================================================
  
  // Check for UID validation issues
  if (issue.includes('uid must') || issue.includes('must reference') || issue.includes('valid uid') || issue.includes('existing widget')) {
    if (allDocs.includes('must be a valid uid') || allDocs.includes('valid uid') || 
        allDocs.includes('existing widget') || allDocs.includes('must reference')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger already documents the UID validation requirement' 
      };
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 8: Path parameter UID issues
  // =====================================================
  
  // Check for path parameter UID issues
  if (field.includes('path') && (field.includes('uid') || field.includes('parameter'))) {
    if (allDocs.includes('must be a valid uid') || allDocs.includes('valid uid') || 
        allDocs.includes('use get') || allDocs.includes('find valid uid') ||
        allDocs.includes('app_code_name') || allDocs.includes('code name')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger already documents path parameter validation' 
      };
    }
  }
  
  // =====================================================
  // FALSE POSITIVE CATEGORY 9: Authentication/token issues
  // =====================================================
  
  // Authentication/token related issues
  if (field === 'authentication' || issue.includes('token') || issue.includes('app_type')) {
    // Check if swagger already mentions app_type requirements
    if (issue.includes('app_type') && allDocs.includes('app_type')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger description already documents app_type requirement' 
      };
    }
    
    // Check if swagger mentions the specific token requirement
    if (issue.includes('app token') && (allDocs.includes('app token') || allDocs.includes('available for app'))) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Swagger description already documents App Token requirement' 
      };
    }
    
    // Check for staff token vs app token clarifications
    if (issue.includes('staff token') || issue.includes('directory token')) {
      if (allDocs.includes('staff token') || allDocs.includes('directory token') || 
          allDocs.includes('available for staff') || allDocs.includes('available for directory')) {
        return { 
          isAlreadyDocumented: true, 
          reason: 'Swagger description already documents token requirements' 
        };
      }
    }
  }
  
  // 9. Check for specific error messages mentioned in the issue
  const errorMessageMatch = issue.match(/['"]([^'"]+)['"]/);
  if (errorMessageMatch) {
    const errorMessage = errorMessageMatch[1].toLowerCase();
    if (errorMessage.length > 5 && allDocs.includes(errorMessage)) {
      return { 
        isAlreadyDocumented: true, 
        reason: `Swagger already mentions: "${errorMessageMatch[1]}"` 
      };
    }
  }
  
  // 10. Check if the workflow already documents this requirement
  if (existingWorkflow && existingWorkflow.status === 'success') {
    const workflowSummary = (existingWorkflow.summary || '').toLowerCase();
    const workflowContent = (existingWorkflow.content || '').toLowerCase();
    
    // If workflow summary mentions the same requirement
    if (issue.includes('app_type') && workflowSummary.includes('app_type')) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Workflow already documents this requirement - test followed documented procedure' 
      };
    }
    
    // If the workflow content explains this
    if (workflowContent && workflowContent.includes(field)) {
      return { 
        isAlreadyDocumented: true, 
        reason: 'Workflow documentation covers this field' 
      };
    }
  }
  
  // 11. Extract key concepts from the issue and check if they're documented
  const keyConcepts = [
    { pattern: /each staff member can only have one/i, docCheck: /each staff member can only have one|only have one board/i },
    { pattern: /widget_uid must/i, docCheck: /widget_uid|valid uid from a widget/i },
    { pattern: /must be a valid/i, docCheck: /must be a valid|valid uid/i },
    { pattern: /duplication error/i, docCheck: /duplication error|duplicate/i },
    { pattern: /board per type/i, docCheck: /per.*type|one board|uniqueness/i },
    { pattern: /app_code_name.*not.*app_id/i, docCheck: /app_code_name|code.?name/i },
    { pattern: /must reference.*existing/i, docCheck: /must.*reference|existing.*uid|valid.*uid/i },
    // "already exists" patterns - match documented uniqueness constraints
    { pattern: /already exists/i, docCheck: /must be unique|duplicate|already exists|combination.*unique|unique.*combination/i },
    { pattern: /with uid .* already exists/i, docCheck: /duplicate.*400|400.*duplicate|unique|already exists/i },
  ];
  
  for (const { pattern, docCheck } of keyConcepts) {
    if (pattern.test(issue) && docCheck.test(allDocs)) {
      return { 
        isAlreadyDocumented: true, 
        reason: `Swagger already documents this concept (matched: ${pattern.source})` 
      };
    }
  }
  
  // 12. If the suggested fix content is already in the description
  if (suggestedFix) {
    // Extract key phrases from suggested fix
    const keyPhrases = suggestedFix.match(/['"]([^'"]+)['"]/g) || [];
    for (const phrase of keyPhrases) {
      const cleanPhrase = phrase.replace(/['"]/g, '').toLowerCase();
      if (cleanPhrase.length > 10 && allDocs.includes(cleanPhrase)) {
        return { 
          isAlreadyDocumented: true, 
          reason: `Swagger already contains: "${cleanPhrase}"` 
        };
      }
    }
  }
  
  // 13. Generic "field description" check - if field description exists and is substantial
  if (field && field !== '/' && field !== 'authentication') {
    // Check if the specific field has a description in the schema
    const fieldPattern = new RegExp(`"${field.replace(/[^a-z_]/gi, '')}[^"]*"\\s*:\\s*\\{[^}]*"description"\\s*:`, 'i');
    if (fieldPattern.test(schemaDescriptions)) {
      // The field has a description - check if the issue is about something already there
      const fieldDesc = schemaDescriptions.match(new RegExp(`"${field.replace(/[^a-z_]/gi, '')}[^"]*"[^}]*"description"\\s*:\\s*"([^"]+)"`, 'i'));
      if (fieldDesc && fieldDesc[1]) {
        const existingDesc = fieldDesc[1].toLowerCase();
        // If the existing description is substantial (>50 chars) and covers validation
        if (existingDesc.length > 50 && 
            (existingDesc.includes('valid') || existingDesc.includes('must') || existingDesc.includes('required'))) {
          return { 
            isAlreadyDocumented: true, 
            reason: `Field ${field} already has validation documentation` 
          };
        }
      }
    }
  }
  
  return { isAlreadyDocumented: false, reason: null };
}

/**
 * Check if AI actions match the documented workflow
 * @param {Object[]} healingLog - The AI agent's action log
 * @param {Object} existingWorkflow - The documented workflow
 * @returns {Object} { followedWorkflow: boolean, deviations: string[] }
 */
function compareActionsToWorkflow(healingLog, existingWorkflow) {
  if (!existingWorkflow || !existingWorkflow.uidResolution) {
    return { followedWorkflow: false, deviations: ['No existing workflow to compare against'] };
  }
  
  const deviations = [];
  const workflowSteps = existingWorkflow.uidResolution;
  
  // Extract API calls from healing log
  const apiCalls = healingLog
    .filter(entry => entry.type === 'tool_call' && entry.tool === 'execute_api')
    .map(entry => ({
      method: entry.input?.method,
      path: entry.input?.path,
      purpose: entry.input?.purpose
    }));
  
  // Check if the key workflow steps were followed
  for (const [uidField, resolution] of Object.entries(workflowSteps)) {
    // Check if source_endpoint was called
    if (resolution.source_endpoint) {
      const [expectedMethod, expectedPath] = resolution.source_endpoint.split(' ');
      const wasSourceCalled = apiCalls.some(call => 
        call.method === expectedMethod && call.path === expectedPath
      );
      
      // It's OK if the source wasn't called IF the create_fresh was called instead
      if (!wasSourceCalled && !resolution.create_fresh) {
        deviations.push(`Expected to call ${resolution.source_endpoint} for ${uidField}`);
      }
    }
    
    // Check if create endpoint was used when create_fresh is required
    if (resolution.create_fresh && resolution.create_body) {
      const createEndpoint = resolution.source_endpoint || '';
      // For OAuth tokens, we use acquire_token instead of execute_api
      const isOAuthFlow = uidField.toLowerCase().includes('oauth') || uidField.toLowerCase().includes('token');
      
      if (!isOAuthFlow) {
        const wasCreateCalled = apiCalls.some(call => 
          call.method === 'POST' && call.purpose === 'uid_resolution'
        );
        
        if (!wasCreateCalled) {
          deviations.push(`Expected to create fresh entity for ${uidField}`);
        }
      }
    }
  }
  
  return {
    followedWorkflow: deviations.length === 0,
    deviations
  };
}

/**
 * Check if a field name matches common reference field patterns
 * @param {string} propName - Property name
 * @returns {boolean}
 */
function isReferenceFieldByName(propName) {
  const lower = propName.toLowerCase();
  
  // Standard UID/ID patterns
  if (lower.endsWith('_uid') || lower.endsWith('_id')) return true;
  if (lower === 'uid' || lower === 'id') return true;
  
  // Common reference field names that typically reference other entities
  const referenceFieldPatterns = [
    'key',           // permission key, config key, etc.
    'code',          // role code, status code, etc.
    'type',          // entity type references
    'role',          // role references
    'permission',    // permission references
    'status',        // status references (when enum-like)
    'category',      // category references
    'tag',           // tag references
  ];
  
  // Check if field name matches or ends with these patterns
  for (const pattern of referenceFieldPatterns) {
    if (lower === pattern || lower.endsWith(`_${pattern}`)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a field description indicates it's a reference to another entity
 * @param {string} description - Field description
 * @returns {{ isReference: boolean, referenceType: string|null }}
 */
function isReferenceFieldByDescription(description) {
  if (!description) return { isReference: false, referenceType: null };
  
  const lower = description.toLowerCase();
  
  // Patterns that indicate a reference field
  const referencePatterns = [
    /reference\s+to\s+(\w+)/i,
    /identifier\s+of\s+(?:the\s+)?(\w+)/i,
    /must\s+be\s+(?:a\s+)?valid\s+(\w+)/i,
    /(?:unique\s+)?(?:identifier|id|uid)\s+(?:of|for)\s+(?:the\s+)?(\w+)/i,
    /one\s+of\s+the\s+(?:available\s+)?(\w+)/i,
    /existing\s+(\w+)\s+(?:uid|id|identifier)/i,
    /from\s+(?:the\s+)?(\w+)\s+(?:list|table|entity)/i,
    /belongs\s+to\s+(?:a\s+)?(\w+)/i,
    /foreign\s+key\s+to\s+(\w+)/i,
  ];
  
  for (const pattern of referencePatterns) {
    const match = description.match(pattern);
    if (match) {
      return { isReference: true, referenceType: match[1] || null };
    }
  }
  
  // Check for simpler indicators without capturing the type
  const simpleIndicators = [
    'must exist',
    'valid identifier',
    'valid uid',
    'valid id',
    'references',
    'refers to',
    'linked to',
    'associated with',
    'must match',
  ];
  
  for (const indicator of simpleIndicators) {
    if (lower.includes(indicator)) {
      return { isReference: true, referenceType: null };
    }
  }
  
  return { isReference: false, referenceType: null };
}

/**
 * Extract all UID/ID/reference fields from a schema
 * @param {Object} schema - JSON schema
 * @param {string[]} requiredFields - Required field names
 * @param {string} parentPath - Parent path for nested fields
 * @returns {Object[]} Array of { field, required, type, description, detectionMethod, needsDocumentation }
 */
function extractUidFieldsFromSchema(schema, requiredFields = [], parentPath = '') {
  const uidFields = [];
  
  if (!schema) return uidFields;
  
  // Handle allOf
  if (schema.allOf) {
    let mergedRequired = [...requiredFields];
    for (const subSchema of schema.allOf) {
      if (subSchema.required) {
        mergedRequired = [...mergedRequired, ...subSchema.required];
      }
      uidFields.push(...extractUidFieldsFromSchema(subSchema, mergedRequired, parentPath));
    }
    return uidFields;
  }
  
  // Handle object with properties
  if (schema.properties) {
    const required = schema.required || requiredFields;
    
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const fullPath = parentPath ? `${parentPath}.${propName}` : propName;
      
      // Check for explicit x-reference-to annotation (best practice)
      const hasExplicitRef = propSchema['x-reference-to'];
      
      // Check by field name pattern
      const isRefByName = isReferenceFieldByName(propName);
      
      // Check by description content
      const { isReference: isRefByDesc, referenceType } = isReferenceFieldByDescription(propSchema.description);
      
      // Skip auto-generated entity IDs (uid, id at root level without parent)
      const isAutoGenerated = !parentPath && (propName === 'uid' || propName === 'id');
      
      if (!isAutoGenerated && (hasExplicitRef || isRefByName || isRefByDesc)) {
        // Determine detection method for documentation suggestions
        let detectionMethod = 'explicit'; // x-reference-to
        let needsDocumentation = false;
        
        if (!hasExplicitRef) {
          if (isRefByName && !isRefByDesc) {
            detectionMethod = 'name_pattern';
            needsDocumentation = true; // Suggest adding x-reference-to
          } else if (isRefByDesc) {
            detectionMethod = 'description';
            needsDocumentation = true; // Suggest adding x-reference-to for clarity
          }
        }
        
        uidFields.push({
          field: fullPath,
          required: required.includes(propName),
          type: propSchema.type || 'string',
          description: propSchema.description || '',
          detectionMethod,
          needsDocumentation,
          referenceTarget: hasExplicitRef || referenceType || null
        });
      }
      
      // Recursively check nested objects
      if (propSchema.type === 'object' && propSchema.properties) {
        const nested = extractUidFieldsFromSchema(propSchema, propSchema.required || [], fullPath);
        uidFields.push(...nested);
      }
      
      // Handle arrays with object items
      if (propSchema.type === 'array' && propSchema.items) {
        const itemSchema = propSchema.items;
        if (itemSchema.type === 'object' && itemSchema.properties) {
          const nested = extractUidFieldsFromSchema(itemSchema, itemSchema.required || [], `${fullPath}[]`);
          uidFields.push(...nested);
        }
      }
    }
  }
  
  return uidFields;
}

/**
 * Derive the resource name from a UID field name
 * e.g., 'service_uid' -> 'services', 'client_id' -> 'clients'
 */
function uidFieldToResourceName(uidField) {
  // Remove _uid or _id suffix
  let resourceName = uidField.replace(/_(uid|id)$/, '');
  
  // Handle special cases
  const specialMappings = {
    'business': 'businesses',
    'staff': 'staff',  // staff is both singular and plural in our API
    'client': 'clients',
    'service': 'services',
    'product': 'products',
    'package': 'packages',
    'matter_service': 'matter_services',
    'appointment': 'appointments',
    'invoice': 'invoices',
    'estimate': 'estimates',
    'document': 'documents',
    'form': 'forms',
    'payment': 'payments',
    'category': 'categories',
    'tag': 'tags',
    'business_role': 'business_roles',
    'staff_business_role': 'staff_business_roles',
    'permission': 'permissions',
    'staff_permission': 'staff_permissions'
  };
  
  if (specialMappings[resourceName]) {
    return specialMappings[resourceName];
  }
  
  // Default: just add 's' for pluralization
  if (!resourceName.endsWith('s')) {
    resourceName += 's';
  }
  
  return resourceName;
}

/**
 * Find endpoints that can provide a UID value
 * @param {string} uidField - UID field name (e.g., 'service_uid')
 * @param {Object[]} allEndpoints - All available endpoints
 * @returns {Object} { getEndpoint, postEndpoint, resourceName }
 */
function findUidSourceEndpoints(uidField, allEndpoints) {
  const resourceName = uidFieldToResourceName(uidField);
  
  console.log(`  [find_uid_source] Looking for resource: ${resourceName} (from field: ${uidField})`);
  console.log(`  [find_uid_source] Total endpoints available: ${allEndpoints?.length || 0}`);
  
  // Group endpoints by resource
  const grouped = groupByResource(allEndpoints);
  const groupKeys = Object.keys(grouped);
  console.log(`  [find_uid_source] Grouped into ${groupKeys.length} groups: ${groupKeys.slice(0, 10).join(', ')}${groupKeys.length > 10 ? '...' : ''}`);
  
  // Find matching resource group
  let matchingGroup = null;
  let matchedKey = null;
  for (const [key, group] of Object.entries(grouped)) {
    if (group.resource === resourceName || 
        group.resource === resourceName.replace(/s$/, '') ||
        key.toLowerCase().includes(resourceName.toLowerCase())) {
      matchingGroup = group;
      matchedKey = key;
      console.log(`  [find_uid_source] Direct match found: ${key} (resource: ${group.resource})`);
      break;
    }
  }
  
  // If no direct match, try fuzzy matching
  if (!matchingGroup) {
    console.log(`  [find_uid_source] No direct match, trying fuzzy matching...`);
    for (const [key, group] of Object.entries(grouped)) {
      const singularResource = resourceName.replace(/s$/, '');
      if (group.resource.includes(singularResource) || 
          singularResource.includes(group.resource)) {
        matchingGroup = group;
        matchedKey = key;
        console.log(`  [find_uid_source] Fuzzy match found: ${key} (resource: ${group.resource})`);
        break;
      }
    }
  }
  
  if (!matchingGroup) {
    console.log(`  [find_uid_source] NO MATCH FOUND for ${resourceName}`);
    // Log groups that contain similar names for debugging
    const similar = groupKeys.filter(k => 
      k.toLowerCase().includes(resourceName.substring(0, 5).toLowerCase()) ||
      resourceName.toLowerCase().includes(k.split('/').pop().substring(0, 5).toLowerCase())
    );
    if (similar.length > 0) {
      console.log(`  [find_uid_source] Similar groups that might be related: ${similar.join(', ')}`);
    }
    return {
      found: false,
      resourceName,
      message: `No endpoints found for resource '${resourceName}'`,
      availableGroups: groupKeys.slice(0, 20)
    };
  }
  
  // Find GET (list) and POST (create) endpoints
  let getEndpoint = null;
  let postEndpoint = null;
  
  console.log(`  [find_uid_source] Matched group ${matchedKey} has ${matchingGroup.endpoints.length} endpoints`);
  
  for (const ep of matchingGroup.endpoints) {
    const operation = getCrudOperation(ep);
    console.log(`  [find_uid_source]   - ${ep.method} ${ep.path} (operation: ${operation})`);
    
    if (operation === 'list' && !getEndpoint) {
      getEndpoint = `${ep.method} ${ep.path}`;
    }
    if (operation === 'create' && !postEndpoint) {
      postEndpoint = `${ep.method} ${ep.path}`;
    }
  }
  
  console.log(`  [find_uid_source] Result: GET=${getEndpoint}, POST=${postEndpoint}`);
  
  return {
    found: true,
    resourceName,
    getEndpoint,
    postEndpoint,
    basePath: matchingGroup.basePath
  };
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
 * Execute a tool call
 */
async function executeTool(toolName, toolInput, context) {
  const { apiClient, config, resolvedParams, onProgress, endpoint, allEndpoints } = context;
  
  switch (toolName) {
    case "extract_required_uids": {
      onProgress?.({
        type: 'agent_action',
        action: 'extract_required_uids',
        details: 'Analyzing swagger schema for required UIDs and reference fields'
      });
      
      const schema = endpoint.requestSchema;
      console.log(`  [extract_required_uids] Endpoint: ${endpoint.method} ${endpoint.path}`);
      console.log(`  [extract_required_uids] Schema exists: ${!!schema}`);
      if (schema) {
        console.log(`  [extract_required_uids] Schema type: ${schema.type}`);
        console.log(`  [extract_required_uids] Schema has properties: ${!!schema.properties}`);
        if (schema.properties) {
          console.log(`  [extract_required_uids] Properties: ${Object.keys(schema.properties).join(', ')}`);
        }
        console.log(`  [extract_required_uids] Schema required: ${JSON.stringify(schema.required || [])}`);
      }
      const uidFields = extractUidFieldsFromSchema(schema, schema?.required || []);
      console.log(`  [extract_required_uids] Found ${uidFields.length} UID fields: ${uidFields.map(f => f.field).join(', ') || 'none'}`);
      
      // Also check path parameters
      const pathParams = endpoint.path.match(/\{([^}]+)\}/g) || [];
      for (const param of pathParams) {
        const paramName = param.replace(/[{}]/g, '');
        if (paramName.endsWith('_uid') || paramName.endsWith('_id') || paramName === 'uid') {
          const existing = uidFields.find(f => f.field === paramName);
          if (!existing) {
            uidFields.push({
              field: paramName,
              required: true,
              type: 'string',
              description: 'Path parameter',
              isPathParam: true,
              detectionMethod: 'path_param',
              needsDocumentation: false
            });
          }
        }
      }
      
      // Check which UIDs we already have resolved
      const resolvedUids = [];
      const unresolvedUids = [];
      const documentationSuggestions = [];
      
      for (const uidField of uidFields) {
        const fieldName = uidField.field;
        // For nested fields like permissions[].key, extract the base name
        const baseName = fieldName.replace(/\[\]\./, '_').replace(/\./g, '_');
        const altFieldName = baseName.replace(/_uid$/, '_id').replace(/_id$/, '_uid');
        
        if (resolvedParams[fieldName] || resolvedParams[baseName] || resolvedParams[altFieldName]) {
          resolvedUids.push({
            ...uidField,
            currentValue: resolvedParams[fieldName] || resolvedParams[baseName] || resolvedParams[altFieldName]
          });
        } else {
          unresolvedUids.push(uidField);
        }
        
        // Collect documentation suggestions for fields detected by heuristics
        if (uidField.needsDocumentation) {
          const suggestion = {
            field: uidField.field,
            detectedBy: uidField.detectionMethod,
            suggestion: `Add "x-reference-to": "${uidField.referenceTarget || '<entity_name>'}" to the swagger schema for field "${uidField.field}"`,
            example: uidField.referenceTarget 
              ? `"${fieldName.split('.').pop()}": { "type": "string", "x-reference-to": "${uidField.referenceTarget}", "description": "..." }`
              : `"${fieldName.split('.').pop()}": { "type": "string", "x-reference-to": "permissions", "description": "Reference to a valid permission key" }`
          };
          documentationSuggestions.push(suggestion);
        }
      }
      
      let note = '';
      if (unresolvedUids.length === 0) {
        note = 'All required UIDs/references are already resolved! You can retry the original request.';
      } else {
        note = `You need to resolve ${unresolvedUids.length} UID/reference field(s) before retrying.`;
      }
      
      if (documentationSuggestions.length > 0) {
        note += `\n\n⚠️ DOCUMENTATION ISSUE: ${documentationSuggestions.length} field(s) were detected as references using heuristics. `;
        note += 'Consider adding explicit "x-reference-to" annotations in the swagger schema for better documentation.';
      }
      
      // Store documentation suggestions in context for later inclusion in doc_issues
      if (documentationSuggestions.length > 0) {
        context.referenceFieldDocSuggestions = documentationSuggestions;
      }
      
      return {
        totalUidFields: uidFields.length,
        alreadyResolved: resolvedUids,
        needsResolution: unresolvedUids,
        documentationSuggestions: documentationSuggestions.length > 0 ? documentationSuggestions : undefined,
        note
      };
    }
    
    case "find_uid_source": {
      const { uid_field } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'find_uid_source',
        details: `Finding endpoints for ${uid_field}`
      });
      
      const result = findUidSourceEndpoints(uid_field, allEndpoints);
      
      return result;
    }
    
    case "find_service_for_endpoint": {
      const { endpoint_path } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'find_service_for_endpoint',
        details: `Looking up service for: ${endpoint_path}`
      });
      
      // Find the matching service by checking path prefixes
      let matchedService = null;
      let matchedPrefix = null;
      let matchLength = 0;
      
      for (const [prefix, service] of Object.entries(APIGW_ROUTING)) {
        if (endpoint_path.startsWith(prefix) && prefix.length > matchLength) {
          matchedService = service;
          matchedPrefix = prefix;
          matchLength = prefix.length;
        }
      }
      
      if (matchedService) {
        const repoExists = REPO_PATHS[matchedService] && fs.existsSync(REPO_PATHS[matchedService]);
        return {
          found: true,
          service: matchedService,
          matched_prefix: matchedPrefix,
          repository: matchedService,
          repository_path: REPO_PATHS[matchedService] || 'Not configured',
          repository_available: repoExists,
          tip: repoExists 
            ? `Use search_source_code with repository="${matchedService}" to find the implementation.`
            : `Repository ${matchedService} is not available locally. Try searching in 'core' as a fallback.`,
          search_suggestions: [
            `Search for controller: search_source_code(repository="${matchedService}", search_pattern="${endpoint_path.split('/').pop()}")`,
            `Search for route definition: search_source_code(repository="${matchedService}", search_pattern="${endpoint_path}")`
          ]
        };
      }
      
      // Default to core if no specific mapping found
      return {
        found: false,
        service: 'core',
        repository: 'core',
        note: `No specific routing found for ${endpoint_path}. Defaulting to 'core' repository.`,
        tip: 'Most /platform/v1/* and /business/* endpoints are served by core.',
        all_known_routes: Object.keys(APIGW_ROUTING)
      };
    }
    
    case "execute_api": {
      const { method, path: apiPath, body, token_type = 'staff', on_behalf_of, purpose, use_fallback = false } = toolInput;
      
      // Track whether this counts as a retry
      const isRetry = purpose === 'retry_original';
      if (isRetry) {
        context.retryCount = (context.retryCount || 0) + 1;
      }
      
      // Determine base URL - use fallback if requested and available
      const primaryUrl = apiClient._config?.baseUrl || config.baseUrl;
      const fallbackUrl = apiClient._config?.fallbackUrl || config.fallbackUrl;
      const baseUrl = use_fallback && fallbackUrl ? fallbackUrl : primaryUrl;
      
      onProgress?.({
        type: 'agent_action',
        action: 'execute_api',
        details: `${method} ${apiPath}${use_fallback ? ' (fallback)' : ''}${on_behalf_of ? ` (on-behalf-of: ${on_behalf_of})` : ''}`,
        purpose,
        isRetry,
        useFallback: use_fallback,
        onBehalfOf: on_behalf_of
      });
      
      try {
        const token = config.tokens?.[token_type] || config.tokens?.staff;
        // Admin tokens use "Admin" prefix, all others use "Bearer"
        const authPrefix = token_type === 'admin' ? 'Admin' : 'Bearer';
        
        // Build headers
        const headers = {
          'Authorization': `${authPrefix} ${token}`,
          'Content-Type': 'application/json'
        };
        
        // Add X-On-Behalf-Of header when explicitly requested
        // Required for directory tokens acting on behalf of a specific business
        // See: https://developers.intandem.tech/docs/directory-owners-partners
        if (on_behalf_of) {
          headers['X-On-Behalf-Of'] = on_behalf_of;
          console.log(`  [AI Healer] Using X-On-Behalf-Of header: ${on_behalf_of}`);
        }
        
        // Build full URL if using fallback
        const requestConfig = {
          method: method.toLowerCase(),
          url: use_fallback ? `${baseUrl}${apiPath}` : apiPath,
          data: body,
          headers
        };
        
        // If using fallback, we need to use axios directly with full URL
        const response = use_fallback 
          ? await require('axios').request(requestConfig)
          : await apiClient.request(requestConfig);
        
        // Store any UIDs from the response
        const extractedUids = extractAllUids(response.data);
        if (response.data) {
          Object.assign(resolvedParams, extractedUids);
        }
        
        // Track successful retry of original endpoint
        if (isRetry && response.status >= 200 && response.status < 300) {
          context.hasSuccessfulRetry = true;
          context.successfulRequest = { method, path: apiPath, body };
          context.lastSuccessfulResponse = response.data;
        }
        
        console.log(`  [AI Healer] execute_api ${method} ${apiPath} => ${response.status}${isRetry ? ' (retry)' : ''}`);
        if (body) {
          console.log(`  [AI Healer] Request body:`, JSON.stringify(body, null, 2).substring(0, 300));
        }
        
        return {
          success: true,
          status: response.status,
          data: response.data,
          extracted_uids: extractedUids,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          baseUrl: baseUrl
        };
      } catch (error) {
        const status = error.response?.status;
        const is404OrRouting = status === 404 || status === 502 || status === 503;
        const fallbackAvailable = !use_fallback && fallbackUrl;
        
        // Check for "already exists" errors - these indicate uniqueness constraint violations
        const errorData = error.response?.data;
        const errorMessage = typeof errorData === 'object' 
          ? (errorData?.errors?.[0]?.message || errorData?.message || JSON.stringify(errorData))
          : (errorData || error.message);
        const isAlreadyExistsError = /already exists/i.test(errorMessage);
        
        console.log(`  [AI Healer] execute_api ${method} ${apiPath} => ERROR ${status}${isRetry ? ' (retry)' : ''}${isAlreadyExistsError ? ' (ALREADY_EXISTS)' : ''}`);
        if (body) {
          console.log(`  [AI Healer] Request body:`, JSON.stringify(body, null, 2).substring(0, 300));
        }
        console.log(`  [AI Healer] Error response:`, JSON.stringify(error.response?.data, null, 2)?.substring(0, 300) || error.message);
        
        // Build context-specific hint based on error type
        let hint;
        
        // SPECIAL HANDLING: "already exists" errors on POST endpoints
        if (isAlreadyExistsError && method.toUpperCase() === 'POST') {
          hint = `ALREADY EXISTS: This error indicates the entity already exists due to a uniqueness constraint. This is EXPECTED BEHAVIOR if documented in swagger! Check if swagger documents uniqueness constraint (e.g., "combination must be unique", "duplicate will return 400"). If documented: (1) Try a DIFFERENT combination - get another UID from a LIST endpoint that isn't already used, OR (2) Report PASS - the endpoint correctly enforces the documented uniqueness constraint. Do NOT suggest skip for this - it's not an infrastructure issue!`;
        } else if (status === 404) {
          if (fallbackAvailable) {
            hint = `Got 404 error. First, try use_fallback=true to use fallback API URL (${fallbackUrl}). If that also fails, INVESTIGATE by calling find_service_for_endpoint to find which service handles this path, then search_source_code for "NotFoundException" or "DoesNotExist" to understand what entity is missing.`;
          } else {
            hint = `Got 404 error. This usually means a required entity/UID doesn't exist, NOT that the endpoint path is wrong. INVESTIGATE: 1) Call find_service_for_endpoint to find which microservice handles this endpoint. 2) Call search_source_code with query="NotFoundException" or "DoesNotExist" to find what entity is being looked up. 3) Read the controller/service to understand prerequisites. 4) Create the missing entity first, then retry.`;
          }
        } else if (is404OrRouting && fallbackAvailable) {
          hint = `Got ${status} error. Try again with use_fallback=true to use the fallback API URL (${fallbackUrl}).`;
        } else {
          hint = 'If the error is unclear or unexpected, use search_source_code to explore the backend implementation and understand the expected format.';
        }
        
        return {
          success: false,
          status: status,
          error: error.response?.data || error.message,
          isRetry,
          retryCount: context.retryCount || 0,
          usedFallback: use_fallback,
          baseUrl: baseUrl,
          hint,
          // Flag to help AI recognize uniqueness constraint errors
          isAlreadyExistsError: isAlreadyExistsError,
          errorType: isAlreadyExistsError ? 'UNIQUENESS_CONSTRAINT' : undefined
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
          execSync('which rg', { encoding: 'utf8' });
          const globArg = file_glob ? `--glob "${file_glob}"` : '';
          cmd = `rg --max-count 30 -n ${globArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        } catch (rgError) {
          const includeArg = file_glob ? `--include="${file_glob}"` : '--include="*.rb" --include="*.js" --include="*.ts"';
          cmd = `grep -rn ${includeArg} "${escapedPattern}" "${repoPath}" 2>/dev/null | head -80`;
          result = execSync(cmd, { encoding: 'utf8', maxBuffer: 1024 * 1024 });
        }
        
        if (!result || result.trim() === '') {
          return { 
            results: 'No matches found',
            searched_in: repoPath,
            tip: 'Try broader search terms or different patterns. The code might be in a different service.',
            note: 'Some endpoints like /business/communication/* are served by separate gateway services.'
          };
        }
        
        return { 
          results: result,
          tip: 'Use read_source_file to examine specific files in detail. Document any findings as doc_issues!'
        };
      } catch (e) {
        return { 
          results: 'No matches found', 
          searched_in: repoPath,
          error_hint: e.message,
          tip: 'Try broader search terms or different file patterns.'
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
            content: slice.map((line, i) => `${start_line + i}| ${line}`).join('\n'),
            reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
          };
        }
        
        // For large files, return first 150 lines with a note
        if (lines.length > 150) {
          return {
            file: file_path,
            total_lines: lines.length,
            content: lines.slice(0, 150).map((line, i) => `${i + 1}| ${line}`).join('\n'),
            note: `File has ${lines.length} lines. Showing first 150. Use start_line/end_line for specific sections.`,
            reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
          };
        }
        
        return {
          file: file_path,
          content: lines.map((line, i) => `${i + 1}| ${line}`).join('\n'),
          reminder: 'If you found something that differs from the documentation, add it to doc_issues in report_result!'
        };
      } catch (e) {
        return { error: `Error reading file: ${e.message}` };
      }
    }
    
    case "acquire_token": {
      const { action, client_id, client_secret, client_uid, business_uid, app_id, app_code_name, business_id, directory_id } = toolInput;
      
      onProgress?.({
        type: 'agent_action',
        action: 'acquire_token',
        details: action === 'client_jwt' 
          ? `client_jwt token for client=${client_uid || 'auto'}, business=${business_uid || 'from config'}`
          : `${action} token${client_id ? ' via OAuth' : ''} for app=${app_id || app_code_name || client_id}, business=${business_id}, directory=${directory_id}`
      });
      
      const baseUrl = config.baseUrl;
      const axios = require('axios');
      
      try {
        // ACTION: app_oauth - Get app token via OAuth using client_id and client_secret
        // This is the CORRECT way to get an app token for endpoints like POST /v3/apps/widgets
        if (action === 'app_oauth') {
          if (!client_id || !client_secret) {
            return {
              success: false,
              error: 'client_id and client_secret are required for app_oauth action.',
              hint: 'When you create an app via POST /platform/v1/apps, save the returned client_id and client_secret, then use them here.'
            };
          }
          
          // Use POST /oauth/service/token to get an app token
          const response = await axios.post(`${baseUrl}/oauth/service/token`, 
            `service_id=${encodeURIComponent(client_id)}&service_secret=${encodeURIComponent(client_secret)}`,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }
          );
          
          const appToken = response.data?.data?.token;
          
          if (appToken) {
            // Store the acquired app token
            context.acquiredTokens = context.acquiredTokens || {};
            context.acquiredTokens['app'] = appToken;
            
            // Add to config.tokens for execute_api to use
            config.tokens = config.tokens || {};
            config.tokens.app = appToken;
            
            return {
              success: true,
              action: 'app_oauth',
              token_acquired: true,
              token_preview: `${appToken.substring(0, 20)}...`,
              expires_in: response.data?.data?.expires_in,
              hint: 'App token acquired via OAuth! You can now use token_type="app" in execute_api calls.'
            };
          } else {
            return {
              success: false,
              error: 'OAuth response did not contain a token.',
              response_data: response.data
            };
          }
        }
        
        // ACTION: client_jwt - Get a client JWT token for /client/* endpoints
        // Flow: 1) Get client info, 2) Send login link with .dev suffix, 3) Exchange auth token for JWT
        if (action === 'client_jwt') {
          const staffToken = config.tokens?.staff || config.tokens?.directory;
          if (!staffToken) {
            return {
              success: false,
              error: 'No staff or directory token configured. Cannot fetch client info.',
              hint: 'Configure a staff or directory token in tokens.json first.'
            };
          }
          
          // Step 1: Get business_uid from config or params
          let targetBusinessUid = toolInput.business_uid || config.params?.business_uid;
          if (!targetBusinessUid) {
            return {
              success: false,
              error: 'business_uid is required for client_jwt action.',
              hint: 'Provide business_uid in the action params or configure params.business_uid in tokens.json.'
            };
          }
          
          // Step 2: Get client info - either from provided client_uid or fetch from API
          let clientEmail = null;
          let targetClientUid = toolInput.client_uid || config.params?.client_uid;
          
          // First, try to get email from provided/configured client
          if (targetClientUid) {
            try {
              const clientResponse = await axios.get(`${baseUrl}/platform/v1/clients/${targetClientUid}`, {
                headers: {
                  'Authorization': `Bearer ${staffToken}`,
                  'Content-Type': 'application/json'
                }
              });
              clientEmail = clientResponse.data?.data?.email;
              // If email contains @ it's likely valid
              if (clientEmail && clientEmail.includes('@')) {
                // Good, we have a valid email
              } else {
                // No email on configured client, will search for another
                clientEmail = null;
              }
            } catch (e) {
              // Configured client fetch failed, will try to find another
            }
          }
          
          // If no email found yet, search for a client with email
          if (!clientEmail) {
            try {
              const clientsResponse = await axios.get(`${baseUrl}/platform/v1/clients?per_page=50`, {
                headers: {
                  'Authorization': `Bearer ${staffToken}`,
                  'Content-Type': 'application/json'
                }
              });
              const clients = clientsResponse.data?.data?.clients || [];
              // Find client with a valid-looking email (contains @)
              const clientWithEmail = clients.find(c => c.email && c.email.includes('@'));
              if (clientWithEmail) {
                targetClientUid = clientWithEmail.uid || clientWithEmail.id;
                clientEmail = clientWithEmail.email;
              }
            } catch (e) {
              // Will fall through to error below
            }
          }
          
          if (!clientEmail) {
            return {
              success: false,
              error: 'No clients with valid email found in the business.',
              hint: 'Create a client with an email first using POST /platform/v1/clients with body: {"email":"test@example.com","first_name":"Test"}'
            };
          }
          
          // Step 3: Send login link with .dev suffix to get auth token directly
          // In dev/integration environments, adding .dev suffix returns the token
          const devEmail = clientEmail.endsWith('.dev') ? clientEmail : `${clientEmail}.dev`;
          let authToken = null;
          
          try {
            const loginLinkResponse = await axios.post(
              `${baseUrl}/client_api/v1/portals/${targetBusinessUid}/authentications/send_login_link`,
              { email: devEmail },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            authToken = loginLinkResponse.data?.token;
            if (!authToken) {
              return {
                success: false,
                error: 'Login link sent but no token returned. This may not be a dev/integration environment.',
                hint: 'The .dev email suffix trick only works in development/integration environments.',
                response: loginLinkResponse.data
              };
            }
          } catch (e) {
            return {
              success: false,
              error: `Failed to send login link: ${e.response?.data?.error || e.message}`,
              hint: 'Verify the business_uid and client email are correct.',
              status: e.response?.status
            };
          }
          
          // Step 4: Exchange auth token for JWT
          let clientJwt = null;
          try {
            const jwtResponse = await axios.post(
              `${baseUrl}/client_api/v1/portals/${targetBusinessUid}/authentications/get_jwt_token_from_authentication_token`,
              { auth_token: authToken },
              {
                headers: {
                  'Content-Type': 'application/json'
                }
              }
            );
            clientJwt = jwtResponse.data?.token;
            if (!clientJwt) {
              return {
                success: false,
                error: 'Auth token exchange did not return a JWT.',
                response: jwtResponse.data
              };
            }
          } catch (e) {
            return {
              success: false,
              error: `Failed to exchange auth token for JWT: ${e.response?.data?.error || e.message}`,
              status: e.response?.status
            };
          }
          
          // Step 5: Store the acquired client token
          context.acquiredTokens = context.acquiredTokens || {};
          context.acquiredTokens['client'] = clientJwt;
          
          // Add to config.tokens for execute_api to use
          config.tokens = config.tokens || {};
          config.tokens.client = clientJwt;
          
          return {
            success: true,
            action: 'client_jwt',
            token_acquired: true,
            token_preview: `${clientJwt.substring(0, 30)}...`,
            client_uid: targetClientUid,
            client_email: clientEmail,
            business_uid: targetBusinessUid,
            hint: 'Client JWT acquired! You can now use token_type="client" in execute_api calls for /client/* endpoints.'
          };
        }
        
        // For list/create actions, we need a directory token
        const directoryToken = config.tokens?.directory;
        if (!directoryToken) {
          return {
            success: false,
            error: 'No directory token configured. Cannot list/create tokens without directory-level access.',
            hint: 'Configure a directory token in tokens.json, OR use action="app_oauth" with client_id and client_secret.'
          };
        }
        
        if (action === 'list') {
          // GET /platform/v1/tokens to list existing tokens
          const params = new URLSearchParams();
          if (app_id) params.append('app_id', app_id);
          if (app_code_name) params.append('app_id', app_code_name);
          if (directory_id) params.append('directory_id', directory_id);
          
          const response = await axios.get(`${baseUrl}/platform/v1/tokens?${params.toString()}`, {
            headers: {
              'Authorization': `Bearer ${directoryToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const tokens = response.data?.data?.tokens || [];
          
          // If we found tokens, store the first one for use
          if (tokens.length > 0) {
            const firstToken = tokens[0];
            if (firstToken.token) {
              // Store the acquired token
              context.acquiredTokens = context.acquiredTokens || {};
              const tokenKey = app_id || app_code_name || 'app';
              context.acquiredTokens[tokenKey] = firstToken.token;
              
              // Also add to config.tokens for execute_api to use
              config.tokens = config.tokens || {};
              config.tokens.app = firstToken.token;
            }
          }
          
          return {
            success: true,
            action: 'list',
            tokens_found: tokens.length,
            tokens: tokens.map(t => ({
              token: t.token ? `${t.token.substring(0, 20)}...` : null,
              app_id: t.app_id,
              user_id: t.user_id,
              directory_id: t.directory_id,
              created_at: t.created_at
            })),
            hint: tokens.length > 0 
              ? 'Token found! You can now use token_type="app" in execute_api calls.'
              : 'No tokens found. For app tokens, use action="app_oauth" with client_id and client_secret from POST /platform/v1/apps.'
          };
        } else if (action === 'create') {
          // POST /platform/v1/tokens to create a new directory/business token
          // NOTE: This does NOT create app tokens! Use app_oauth for that.
          const body = {};
          if (app_id) body.app_id = parseInt(app_id) || app_id; // Try to parse as number
          if (business_id) body.business_id = business_id;
          if (directory_id) body.directory_id = directory_id;
          
          if (Object.keys(body).length === 0) {
            return {
              success: false,
              error: 'At least one identifier (app_id, business_id, or directory_id) must be provided.',
              hint: 'For APP tokens, use action="app_oauth" with client_id and client_secret instead!'
            };
          }
          
          const response = await axios.post(`${baseUrl}/platform/v1/tokens`, body, {
            headers: {
              'Authorization': `Bearer ${directoryToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          const newToken = response.data?.data?.token;
          
          if (newToken) {
            // Store the acquired token
            context.acquiredTokens = context.acquiredTokens || {};
            const tokenKey = app_id || business_id || 'acquired';
            context.acquiredTokens[tokenKey] = newToken;
            
            // Also add to config.tokens for execute_api to use
            config.tokens = config.tokens || {};
            if (business_id) {
              config.tokens.business = newToken;
            }
          }
          
          return {
            success: true,
            action: 'create',
            token_created: !!newToken,
            token_preview: newToken ? `${newToken.substring(0, 20)}...` : null,
            hint: newToken 
              ? 'Token created! You can now use it in execute_api calls.'
              : 'Token creation returned but no token found in response.',
            note: 'For APP tokens, use action="app_oauth" with client_id and client_secret instead of "create"!'
          };
        }
        
        return {
          success: false,
          error: `Unknown action: ${action}. Use "app_oauth", "client_jwt", "list", or "create".`
        };
      } catch (error) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        
        return {
          success: false,
          status,
          error: errorData || error.message,
          hint: action === 'app_oauth'
            ? 'OAuth failed. Verify client_id and client_secret are correct (from POST /platform/v1/apps response).'
            : status === 401 
              ? 'Directory token may be invalid or expired. Check tokens.json configuration.'
              : status === 404
                ? 'The app or resource was not found. Verify the app_id exists.'
                : status === 422
                  ? 'Unauthorized. For APP tokens, use action="app_oauth" with client_id and client_secret!'
                  : 'Check if the directory has permission for this operation.'
        };
      }
    }
    
    case "report_result": {
      const { status, summary, skip_reason, skip_suggestion, uid_resolution, unresolved_uids, doc_issues } = toolInput;
      const endpointKey = `${endpoint.method} ${endpoint.path}`;
      
      // Map status to result
      // Note: Agent should NEVER use status="skip" directly anymore
      // Instead, use status="fail" with skip_suggestion=true
      const isSuccess = status === 'pass';
      const isSkipSuggestion = skip_suggestion === true;
      const isFail = status === 'fail';
      
      onProgress?.({
        type: 'agent_action',
        action: 'report_result',
        details: isSkipSuggestion ? 'skip_suggestion' : status,
        summary
      });
      
      // Check if we have an existing workflow to compare against
      const existingWorkflow = workflowRepo.get(endpointKey);
      
      // Compare AI actions to documented workflow
      let workflowComparison = { followedWorkflow: false, deviations: [] };
      if (existingWorkflow && existingWorkflow.status === 'success' && context.healingLog) {
        workflowComparison = compareActionsToWorkflow(context.healingLog || [], existingWorkflow);
        console.log(`  [AI Healer] Workflow comparison: followed=${workflowComparison.followedWorkflow}, deviations=${workflowComparison.deviations.length}`);
      }
      
      // Only save workflow for SUCCESS - skip suggestions require user approval
      // Skip workflows will be saved via the /approve-skip endpoint after user approves
      // NOTE: Doc issues are NOT stored in workflows - they're transient findings
      if (isSuccess && uid_resolution) {
        const workflowData = {
          summary,
          status: 'success',
          uidResolution: uid_resolution,
          successfulRequest: context.successfulRequest,
          domain: endpoint.domain,
          tags: []
          // docFixes intentionally NOT included - workflows are success paths only
        };
        
        workflowRepo.save(endpointKey, workflowData);
        context.savedWorkflow = true;
      }
      
      // Store doc issues - but FILTER OUT issues that are already documented
      // This prevents false positives when AI follows the documented workflow
      const docIssuesArray = Array.isArray(doc_issues) ? doc_issues : [];
      
      // Add reference field documentation suggestions from extract_required_uids
      if (context.referenceFieldDocSuggestions && context.referenceFieldDocSuggestions.length > 0) {
        for (const suggestion of context.referenceFieldDocSuggestions) {
          docIssuesArray.push({
            type: 'missing_reference_annotation',
            field: suggestion.field,
            issue: `Reference field detected by ${suggestion.detectedBy} heuristic - consider adding explicit x-reference-to annotation`,
            suggestion: suggestion.suggestion,
            example: suggestion.example,
            severity: 'warning'
          });
        }
        console.log(`  [AI Healer] Added ${context.referenceFieldDocSuggestions.length} reference field documentation suggestions`);
      }
      
      console.log(`  [AI Healer] report_result called with status=${status}, doc_issues count=${docIssuesArray.length}`);
      
      // Filter doc issues to remove those already documented in swagger
      const filteredDocIssues = [];
      const filteredOutIssues = [];
      
      for (const issue of docIssuesArray) {
        const checkResult = checkIfDocIssueAlreadyDocumented(issue, endpoint, existingWorkflow);
        
        if (checkResult.isAlreadyDocumented) {
          console.log(`  [AI Healer] Doc issue filtered out (already documented): ${issue.field} - ${checkResult.reason}`);
          filteredOutIssues.push({ ...issue, filterReason: checkResult.reason });
        } else {
          filteredDocIssues.push(issue);
        }
      }
      
      // If AI followed the workflow successfully, this is a clean PASS
      // Even if AI reported doc_issues, they should be filtered out since the workflow worked
      let finalStatus = status;
      let finalSummary = summary;
      
      if (isSuccess && existingWorkflow && existingWorkflow.status === 'success') {
        if (workflowComparison.followedWorkflow) {
          // AI followed documented workflow - clean PASS, no doc issues
          console.log(`  [AI Healer] ✓ AI followed documented workflow - clean PASS`);
          finalSummary = `${summary} (followed documented workflow)`;
          // Clear all doc issues since workflow was followed
          filteredDocIssues.length = 0;
        } else if (workflowComparison.deviations.length > 0 && filteredDocIssues.length === 0) {
          // AI deviated but still succeeded - this is a WARN case
          // The workflow might need updating
          console.log(`  [AI Healer] ⚠ AI deviated from workflow but succeeded - consider updating workflow`);
          context.workflowDeviation = {
            deviations: workflowComparison.deviations,
            suggestion: 'Consider updating the workflow to match the successful approach'
          };
        }
      }
      
      if (filteredDocIssues.length > 0) {
        console.log(`  [AI Healer] doc_issues after filtering:`, JSON.stringify(filteredDocIssues, null, 2));
        context.docFixSuggestions = filteredDocIssues.map(issue => ({
          ...issue,
          endpoint: endpointKey,
          verified: isSuccess,  // Only verified if test passed
          verifiedAt: new Date().toISOString()
        }));
      } else {
        context.docFixSuggestions = [];
      }
      
      // Track filtered issues for reporting
      context.filteredOutDocIssues = filteredOutIssues;
      
      return {
        done: true,
        status: finalStatus,
        success: isSuccess,
        skipSuggestion: isSkipSuggestion,  // Agent suggests skip (requires user approval)
        skipReason: skip_reason,
        summary: finalSummary,
        unresolvedUids: unresolved_uids || [],
        docIssuesRecorded: filteredDocIssues.length,
        docIssuesFiltered: filteredOutIssues.length,
        followedWorkflow: workflowComparison.followedWorkflow,
        workflowDeviations: workflowComparison.deviations
      };
    }
    
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Build the deterministic UID resolution prompt with source code exploration
 */
function buildSystemPrompt(endpoint, allEndpoints, config, resolvedParams) {
  const endpointsContext = formatEndpointsForContext(allEndpoints);
  
  // Check for existing workflow
  const endpointKey = `${endpoint.method} ${endpoint.path}`;
  const existingWorkflow = workflowRepo.get(endpointKey);
  
  // Include swagger description for the AI to check before reporting doc issues
  const swaggerDescription = endpoint.description || '';
  const swaggerSummary = endpoint.summary || '';
  
  let swaggerContext = '';
  if (swaggerDescription || swaggerSummary) {
    swaggerContext = `
## SWAGGER DOCUMENTATION (Check Before Reporting Doc Issues!)

**Summary**: ${swaggerSummary}

**Description**:
${swaggerDescription}

**IMPORTANT**: Before reporting ANY doc_issues, verify the issue is NOT already documented above!
If the swagger description already mentions the requirement you discovered, DO NOT report it as a doc_issue.
`;
  }
  
  let workflowContext = '';
  if (existingWorkflow) {
    if (existingWorkflow.status === 'skip' || existingWorkflow.skipReason) {
      // This endpoint has a user-approved skip workflow
      // User has already approved this skip, so we can use it
      workflowContext = `
## CACHED SKIP WORKFLOW - User Previously Approved Skip

This endpoint has a user-approved skip workflow:

**Skip Reason**: ${existingWorkflow.skipReason || existingWorkflow.summary}

**Action**: Call \`report_result\` immediately with:
- status: "fail"
- skip_suggestion: true
- skip_reason: "${existingWorkflow.skipReason || existingWorkflow.summary}"
- summary: "Skip workflow cached - ${existingWorkflow.skipReason || existingWorkflow.summary}"

Note: Skip was previously approved by user. No need to explore alternatives.
`;
    } else if (existingWorkflow.uidResolution) {
      workflowContext = `
## CACHED WORKFLOW - Use This First!

A previous successful run documented how to resolve UIDs for this endpoint:

${JSON.stringify(existingWorkflow.uidResolution, null, 2)}

Try using these same endpoints to resolve the UIDs. If they still work, you can skip the discovery phase.

**IMPORTANT**: If this workflow succeeds, the test is a clean PASS.
Do NOT report doc_issues for requirements that are already documented in the swagger description above.
`;
    }
    // NOTE: Doc issues are no longer stored in workflows
    // Workflows are success paths only - doc issues are transient findings reported once
  }

  return `You are an API testing agent with a simple error handling philosophy.

## CORE PRINCIPLE

**Assume endpoints fundamentally work. Most errors are documentation issues.**

## Your Tools

1. **extract_required_uids** - Extract all UID/ID fields needed by the failing endpoint
2. **find_uid_source** - Find GET/POST endpoints that can provide a specific UID value
3. **execute_api** - Make API calls to fetch/create entities or retry the original request
4. **acquire_token** - Dynamically acquire tokens when needed
5. **find_service_for_endpoint** - Find which microservice handles an endpoint
6. **search_source_code** - Search backend code for implementation details
7. **read_source_file** - Read specific source files
8. **report_result** - Report success/failure and document findings

## API Documentation Terminology

**IMPORTANT**: In swagger/OpenAPI documentation:
- "**Internal Token**" means "**admin**" token (use token_type="admin")
- "Internal" and "Admin" are interchangeable terms for the same token type
- If documentation says "Available for Internal Tokens only", use token_type="admin"

## Available Tokens

${Object.entries(config.tokens || {}).map(([type, token]) => {
  if (token && typeof token === 'string' && token.length > 10) {
    return `- **${type}**: ✓ Available (use token_type="${type}")`;
  }
  return null;
}).filter(Boolean).join('\n')}

## API URLs
- **Primary URL**: ${config.baseUrl}
- **Fallback URL**: ${config.fallbackUrl || 'Not configured'}

## Available Parameters (already resolved)
\`\`\`json
${JSON.stringify(resolvedParams, null, 2)}
\`\`\`
${swaggerContext}
${workflowContext}

## SIMPLIFIED WORKFLOW

### Step 1: Resolve UIDs
1. Call \`extract_required_uids\` to identify needed UIDs
2. For each unresolved UID, use \`find_uid_source\` then \`execute_api\` to get valid values
3. UIDs resolution calls use purpose: "uid_resolution" (not counted as retries)

### Step 2: Retry with Valid Data
1. Once UIDs are resolved, retry the original request with purpose: "retry_original"
2. If successful (2xx), report PASS

### Minimal Request Bodies (PUT/PATCH/POST)

**IMPORTANT**: When constructing request bodies for mutation endpoints:
- **Prefer minimal changes** - update only ONE or TWO fields, not all fields from the schema
- **Use simple, safe fields first** - prefer \`display_name\`, \`name\`, \`description\` over complex/sensitive fields
- **Avoid** fields that have special handling: \`email\` (notifications), \`role\` (permissions), \`status\` (state machines)
- **Avoid** fields that reference other entities unless explicitly testing that relationship

This reduces the chance of triggering validation edge cases and makes failures easier to diagnose.

### Step 3: Handle Errors

**ERROR HANDLING PHILOSOPHY:**

When the endpoint returns an error, assume it's a **documentation issue** unless it's one of these 2 exceptions:

#### Exception 1: BAD GATEWAY (Infrastructure Issue)
- Response message contains "bad gateway", "502 Bad Gateway", or similar
- This is infrastructure/routing, NOT an endpoint issue
- Action: Report FAIL with skip_suggestion: true, reason: "Infrastructure issue - bad gateway"

#### Exception 2: UNDOCUMENTED AUTHENTICATION (401/403 with no token docs)

**When swagger does NOT specify which token to use:**

1. **Default to staff token** - try with token_type="staff" first
2. **If staff fails (401/403)** - search source code to find correct token:
   - \`find_service_for_endpoint\` to locate the service
   - \`search_source_code\` for authentication/authorization logic
   - Look for: \`@Auth\`, \`requiresToken\`, \`authorize\`, permission checks
3. **Try the correct token** - use the token found in source code
4. **Complete the test** - aim for PASS, not skip
5. **Document the finding** - report doc_issue: "Token requirement not documented. Source code shows requires [token_type] token."

**Example flow:**
\`\`\`
1. POST /v3/some/endpoint fails with 401 (no token docs in swagger)
2. Try staff token → 401
3. find_service_for_endpoint → "subscriptionsmng"
4. search_source_code(repo="subscriptionsmng", pattern="@Auth|authorize") 
   → Found: requires directory token
5. execute_api(..., token_type="directory") → 201 Success
6. report_result(status="pass", doc_issues=[{
     field: "authentication",
     issue: "Token requirement not documented",
     suggested_fix: "Add: 'Available for Directory tokens only'"
   }])
\`\`\`

**If swagger DOES specify token** (e.g., "Available for Staff tokens") and it fails:
- That's a regular doc issue, NOT this exception
- Investigate reference fields and scope first (see ALL OTHER ERRORS below)

#### Exception 3: PERMISSION-BASED 403 ERRORS

**When you get a 403 with a valid token, investigate permissions before assuming it's a documentation issue:**

1. **Check actual staff permissions** - call \`GET /v3/access_control/staff_permissions/\` to see what permissions the token's user actually has
2. **Check feature flags** - call \`GET /platform/v1/businesses/{business_id}/features\` to verify the feature is enabled for the business
3. **Check for self-modification constraints** - some endpoints don't allow users to modify their own data:
   - Staff cannot change their own role (PUT /v3/access_control/staff_business_roles/{staff_uid} where staff_uid matches the token owner)
   - Business owners cannot be demoted or have their role changed
   - If the path parameter UID matches the token's user UID, this might be a self-modification restriction

**Example flow for 403 errors:**
\`\`\`
1. PUT /v3/access_control/staff_business_roles/abc123 fails with 403
2. GET /v3/access_control/staff_permissions/ → check if user has 'account.staff.manage'
3. If permission exists but still 403 → check if abc123 is the same as the token owner's UID
4. If self-modification detected → report doc_issue about constraint, or suggest skip with clear reason
5. If permission missing → that's the issue, document it
\`\`\`

#### Exception 4: 404 ERRORS ON PUT/PATCH/DELETE ENDPOINTS

**A 404 on a mutation endpoint (PUT/PATCH/DELETE) usually means the UID is invalid. ALWAYS resolve UIDs first!**

**CRITICAL: READ THE ERROR MESSAGE CAREFULLY!** The error response often tells you EXACTLY what's wrong:
- "Subscription X is not active for this business" → need an ACTIVE subscription for THIS business
- "Resource not found" → need to get a valid UID from the LIST endpoint
- "X does not belong to this business" → need a resource owned by the test business

**Before reporting a 404 as a documentation issue:**
1. **Read the error message** - it often tells you the exact constraint (status, ownership, etc.)
2. **Call the LIST endpoint with appropriate filters**:
   - If error says "not active" → \`GET /v3/license/subscriptions?status=active\`
   - If error says "not found" → \`GET /v3/license/subscriptions\` to get any valid UID
   - If error mentions business ownership → ensure you're using the right business context
3. **Retry with the correctly filtered UID**

**Example flow:**
\`\`\`
1. PUT /v3/license/subscriptions/some-uid → 404 "Subscription X is not active for this business"
2. READ THE MESSAGE! It says "not active for this business"
3. GET /v3/license/subscriptions?status=active → find an ACTIVE subscription
4. PUT /v3/license/subscriptions/active-subscription-uid → 200 Success
5. Report PASS
\`\`\`

**Only report 404 as documentation issue if:**
- You already resolved the UID with the correct filters (based on error message) AND it still returns 404
- The LIST endpoint returns empty (no resources matching the criteria exist to test with)

#### Exception 5: "ALREADY EXISTS" ERRORS ON POST ENDPOINTS (400)

**When a POST endpoint returns 400 with "already exists" message:**

This typically means the endpoint has a uniqueness constraint (documented in swagger). **This is NOT a failure - the endpoint is working correctly!**

**How to handle:**
1. **READ THE ERROR MESSAGE** - it tells you the uniqueness constraint
2. **Check swagger documentation** - if it documents the uniqueness constraint (e.g., "combination must be unique", "duplicate will return 400"), this is expected behavior
3. **Try to create a non-duplicate:**
   - Identify which field(s) cause uniqueness (e.g., "directory_uid + offering_uid must be unique")
   - Fetch a DIFFERENT value for one of the unique fields from a LIST endpoint
   - Retry with the new combination
4. **If you CANNOT find a non-duplicate combination** (all combinations already exist):
   - This is still a PASS - the endpoint correctly enforces the documented constraint
   - Report status="pass" with summary="Endpoint correctly enforces uniqueness constraint as documented"

**Example flow:**
\`\`\`
1. POST /v3/license/directory_offerings → 400 "directoryOffering already exists"
2. READ SWAGGER: "combination of directory_uid and offering_uid must be unique"
3. This error MATCHES the documented behavior → endpoint works correctly!
4. GET /v3/license/offerings → find an offering_uid NOT yet linked to this directory
5. Retry with new offering_uid → 201 Success OR
6. If all offerings already linked → report PASS (constraint works as documented)
\`\`\`

**CRITICAL: Do NOT report "already exists" as:**
- A skip_suggestion (this is NOT an infrastructure issue)
- A documentation issue (if the constraint IS documented)
- A failure (the endpoint IS working correctly)

#### ALL OTHER ERRORS → Documentation Issue
For ANY other error (400, 422, 500, etc.) or 404 after UID resolution:
1. Analyze the error message
2. Compare to swagger documentation
3. Report as doc_issue with suggested fix
4. Status: PASS if you can work around it, FAIL if you cannot

### Step 4: Source Code Escalation (When Needed)

**If swagger analysis alone doesn't explain the error:**

1. Use \`find_service_for_endpoint\` to identify which microservice handles the endpoint
2. Use \`search_source_code\` to investigate:
   - Validation rules in the controller
   - Required fields not in swagger
   - Business logic constraints
   - Actual authentication requirements
3. Use findings to either:
   - Fix the request and retry → PASS with doc_issues
   - Report accurate doc_issues with source code references → FAIL

## Reporting Results

### status: "pass"
- Endpoint returned 2xx with valid data
- May include doc_issues for discrepancies found

### status: "fail"
Use with \`skip_suggestion: true\` when:
- Bad gateway / infrastructure issue (only real infrastructure failure)
- Cannot resolve after exhaustive source code investigation
- Complex prerequisites that require external actions (e.g., payment card on file)

**Note:** Undocumented authentication is NOT a skip reason - investigate source code and find the correct token!

**Always include \`doc_issues\`** - document what's wrong with the swagger!

## Documentation Issues (doc_issues)

**Report doc_issues when:**
- Schema type is wrong (swagger says string, API needs number)
- Required fields are undocumented
- Validation rules are not documented
- Error responses don't match swagger

**Do NOT report doc_issues for:**
- Test data issues ("test_string" not being valid) - that's test framework
- Workflow issues (need to call GET before POST) - that's uid_resolution
- Already documented requirements - check swagger first!

Example doc_issue:
\`\`\`json
{
  "field": "supported_languages",
  "issue": "Pattern constraint not documented - requires ISO 639-1 codes",
  "suggested_fix": "Add pattern: '^[a-z]{2}(-[A-Z]{2})?$' and update description",
  "severity": "minor"
}
\`\`\`

## Token Acquisition (When Needed)

**For App Tokens** (endpoints requiring app_type):
1. Create app: \`POST /platform/v1/apps\` with directory token
2. Get token: \`acquire_token(action="app_oauth", client_id="...", client_secret="...")\`
3. Use: \`execute_api(..., token_type="app")\`

**For Client Tokens** (/client/* endpoints):
\`acquire_token(action="client_jwt")\` then \`token_type="client"\`

## Critical Rules

- When API says "business_id", use business_uid value (the string UID)
- Try fallback URL (\`use_fallback: true\`) if primary returns routing errors
- Document uid_resolution as PROCEDURE, not specific values
- **NEVER use X-On-Behalf-Of as a fallback** when other auth methods fail. Only use \`on_behalf_of\` when the endpoint's swagger documentation explicitly mentions "X-On-Behalf-Of" or "directory token". If staff token returns 401, report it as an auth failure - don't try directory+X-On-Behalf-Of to "work around" the issue.

## All Available API Endpoints (${allEndpoints.length} total)
${endpointsContext}`;
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
 * Run the agent to fix a failing test using deterministic UID resolution
 */
async function runAgentHealer(options) {
  const {
    endpoint,
    result,
    resolvedParams,
    allEndpoints,
    config,
    apiClient,
    maxRetries = 30,  // Increased to allow more exploration attempts
    onProgress
  } = options;
  
  // SMART TYPE MISMATCH HANDLING: Instead of short-circuiting, convert types and retry
  // This allows us to discover ALL type mismatches in one validation run
  if (result.details?.reason === 'SWAGGER_TYPE_MISMATCH') {
    const collectedTypeMismatches = [];
    const healingLog = [];
    let currentRequestBody = result.details?.request?.data || {};
    let lastResponse = result;
    let retryCount = 0;
    const maxTypeRetries = 10; // Limit retries for type mismatches
    
    onProgress?.({
      type: 'agent_action',
      action: 'type_mismatch_retry',
      details: 'Detected type mismatch - will convert and retry to find all issues'
    });
    
    // Collect initial type mismatch(es)
    const errors = result.details?.errors || [];
    for (const err of errors) {
      if (err.field && err.swaggerType && err.apiExpectedType) {
        collectedTypeMismatches.push({
          field: err.field,
          swaggerType: err.swaggerType,
          apiExpectedType: err.apiExpectedType,
          message: err.message || err.friendlyMessage
        });
      }
    }
    
    // Retry loop: convert types and keep retrying until 200 or no more type mismatches
    while (retryCount < maxTypeRetries) {
      retryCount++;
      
      // Apply all collected type conversions to the request body
      const convertedBody = applyTypeConversions(currentRequestBody, collectedTypeMismatches);
      
      healingLog.push({
        type: 'type_conversion_applied',
        iteration: retryCount,
        conversions: collectedTypeMismatches.map(m => ({
          field: m.field,
          from: m.swaggerType,
          to: m.apiExpectedType
        }))
      });
      
      onProgress?.({
        type: 'agent_action',
        action: 'type_mismatch_retry',
        details: `Retry ${retryCount}: Converted ${collectedTypeMismatches.length} field(s) and retrying`
      });
      
      // Retry the API call with converted types
      try {
        const tokenType = endpoint.tokenType || 'staff';
        const token = config.tokens?.[tokenType] || config.tokens?.staff;
        // Admin tokens use "Admin" prefix, all others use "Bearer"
        const authPrefix = tokenType === 'admin' ? 'Admin' : 'Bearer';
        const response = await apiClient.request({
          method: endpoint.method.toLowerCase(),
          url: endpoint.path,
          data: convertedBody,
          headers: {
            'Authorization': `${authPrefix} ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // SUCCESS! We got a 200-level response
        const isSuccess = response.status >= 200 && response.status < 300;
        if (isSuccess) {
          healingLog.push({
            type: 'type_conversion_success',
            iteration: retryCount,
            status: response.status,
            totalMismatches: collectedTypeMismatches.length
          });
          
          onProgress?.({
            type: 'agent_complete',
            status: 'pass',
            success: true,
            summary: `Request succeeded after fixing ${collectedTypeMismatches.length} type mismatch(es)`,
            docIssuesCount: collectedTypeMismatches.length
          });
          
          // Return success but with doc fix suggestions for ALL collected mismatches
          return {
            status: 'pass',
            success: true,
            skipSuggestion: false,
            summary: `Request succeeded after type conversion. Found ${collectedTypeMismatches.length} swagger type mismatch(es) that need fixing.`,
            reason: 'SWAGGER_TYPE_MISMATCH',
            docFixSuggestions: collectedTypeMismatches.map(m => ({
              field: m.field,
              issue: `Type mismatch - swagger defines field as '${m.swaggerType}' but API expects '${m.apiExpectedType}'`,
              suggested_fix: `Update swagger schema to change '${m.field}' from type '${m.swaggerType}' to type '${m.apiExpectedType}'`,
              apiErrorMessage: m.message
            })),
            filteredOutDocIssues: [],
            savedWorkflows: [],
            iterations: retryCount,
            retryCount: retryCount,
            healingLog,
            resolvedParams: resolvedParams
          };
        }
      } catch (error) {
        const responseData = error.response?.data;
        const requestSchema = endpoint.requestBody?.content?.['application/json']?.schema;
        
        // Check for more type mismatches in the error response
        const newMismatches = detectSwaggerTypeMismatch(responseData, convertedBody, requestSchema, true);
        
        if (newMismatches && newMismatches.length > 0) {
          // Filter out already collected mismatches
          const existingFields = new Set(collectedTypeMismatches.map(m => m.field));
          const uniqueNewMismatches = newMismatches.filter(m => !existingFields.has(m.field));
          
          if (uniqueNewMismatches.length > 0) {
            // Found more type mismatches - add them and continue
            collectedTypeMismatches.push(...uniqueNewMismatches);
            currentRequestBody = convertedBody;
            
            healingLog.push({
              type: 'new_type_mismatches_found',
              iteration: retryCount,
              newMismatches: uniqueNewMismatches.map(m => m.field)
            });
            
            onProgress?.({
              type: 'agent_action',
              action: 'type_mismatch_found',
              details: `Found ${uniqueNewMismatches.length} more type mismatch(es): ${uniqueNewMismatches.map(m => m.field).join(', ')}`
            });
            
            continue; // Retry with the new conversions
          }
        }
        
        // No more type mismatches found, but still failing - break out
        healingLog.push({
          type: 'type_conversion_failed',
          iteration: retryCount,
          status: error.response?.status,
          error: responseData
        });
        break;
      }
    }
    
    // Exhausted retries or no more type mismatches to fix
    onProgress?.({
      type: 'agent_complete',
      status: 'fail',
      success: false,
      summary: `Found ${collectedTypeMismatches.length} swagger type mismatch(es)`,
      docIssuesCount: collectedTypeMismatches.length
    });
    
    return {
      status: 'fail',
      success: false,
      skipSuggestion: false,
      summary: `Found ${collectedTypeMismatches.length} swagger type mismatch(es): ${collectedTypeMismatches.map(m => m.field).join(', ')}`,
      reason: 'SWAGGER_TYPE_MISMATCH',
      docFixSuggestions: collectedTypeMismatches.map(m => ({
        field: m.field,
        issue: `Type mismatch - swagger defines field as '${m.swaggerType}' but API expects '${m.apiExpectedType}'`,
        suggested_fix: `Update swagger schema to change '${m.field}' from type '${m.swaggerType}' to type '${m.apiExpectedType}'`,
        apiErrorMessage: m.message
      })),
      filteredOutDocIssues: [],
      savedWorkflows: [],
      iterations: retryCount,
      retryCount: retryCount,
      healingLog,
      resolvedParams: resolvedParams
    };
  }
  
  const aiConfig = getAIConfig(config);
  const clientInfo = initializeClient(aiConfig.apiKey, aiConfig.provider);
  if (!clientInfo) {
    return {
      success: false,
      reason: 'No AI API key configured'
    };
  }
  const { client, provider } = clientInfo;
  const aiModel = aiConfig.model;
  
  // Build initial context
  const allParams = {
    ...config.params,
    ...resolvedParams
  };
  
  const healingLog = [];
  
  const context = {
    apiClient,
    config,
    endpoint,
    resolvedParams: { ...allParams },
    allEndpoints,
    onProgress,
    retryCount: 0,
    hasSuccessfulRetry: false,
    successfulRequest: null,
    lastSuccessfulResponse: null,
    savedWorkflow: false,
    docFixSuggestions: [],
    healingLog,  // Track actions for workflow comparison
    filteredOutDocIssues: [],
    workflowDeviation: null
  };
  
  const systemPrompt = buildSystemPrompt(endpoint, allEndpoints, config, allParams);
  
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

Follow the MANDATORY WORKFLOW:
1. Call extract_required_uids
2. For each unresolved UID: find_uid_source → execute_api (GET) → execute_api (POST if needed)
3. Once ALL UIDs resolved: execute_api with retry_original
4. If errors are unclear (especially 500 errors):
   a. FIRST call find_service_for_endpoint to discover which service handles this endpoint
   b. Then use search_source_code with the CORRECT repository
   c. Use read_source_file to examine the actual implementation
5. Call report_result with your findings - ALWAYS include doc_issues for any documentation discrepancies!`;

  const messages = [{ role: "user", content: userMessage }];
  // healingLog is now tracked in context for workflow comparison
  let iterations = 0;
  const maxIterations = 100; // High limit since UID resolution doesn't count toward retries
  
  onProgress?.({
    type: 'agent_start',
    endpoint: `${endpoint.method} ${endpoint.path}`,
    maxRetries
  });
  
  // Agent loop
  while (iterations < maxIterations) {
    iterations++;
    
    // Check retry limit
    if (context.retryCount > maxRetries) {
      context.healingLog.push({
        type: 'max_retries',
        iteration: iterations,
        retryCount: context.retryCount
      });
      break;
    }
    
    onProgress?.({
      type: 'agent_thinking',
      iteration: iterations,
      retryCount: context.retryCount
    });
    
    // Call AI provider
    let response;
    let toolUseBlocks;
    let textBlocks;
    
    if (provider === 'openai') {
      // OpenAI format
      const openaiTools = TOOLS.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.input_schema
        }
      }));
      
      // Format messages for OpenAI, preserving tool_calls and tool_call_id
      const openaiMessages = messages.map(m => {
        if (m.role === 'assistant' && m.tool_calls) {
          // Assistant message with tool calls - preserve structure
          return {
            role: 'assistant',
            content: m.content,
            tool_calls: m.tool_calls
          };
        } else if (m.role === 'tool') {
          // Tool result message - preserve tool_call_id
          return {
            role: 'tool',
            tool_call_id: m.tool_call_id,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          };
        } else {
          // User or other messages
          return {
            role: m.role,
            content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
          };
        }
      });
      
      const openaiResponse = await client.chat.completions.create({
        model: aiModel,
        max_completion_tokens: 4000,
        messages: [
          { role: 'system', content: systemPrompt },
          ...openaiMessages
        ],
        tools: openaiTools,
        tool_choice: 'auto'
      });
      
      const choice = openaiResponse.choices[0];
      const message = choice.message;
      
      // Convert OpenAI format to unified format
      toolUseBlocks = (message.tool_calls || []).map(tc => ({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}')
      }));
      
      textBlocks = message.content ? [{ type: 'text', text: message.content }] : [];
      
      response = { content: [...textBlocks, ...toolUseBlocks] };
    } else {
      // Anthropic format (default)
      response = await client.messages.create({
        model: aiModel,
        max_tokens: 4000,
        system: systemPrompt,
        tools: TOOLS,
        messages
      });
      
      toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      textBlocks = response.content.filter(block => block.type === 'text');
    }
    
    // Log any text response
    if (textBlocks.length > 0) {
      const thought = textBlocks.map(b => b.text).join('\n');
      context.healingLog.push({
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
      context.healingLog.push({
        type: 'no_action',
        iteration: iterations,
        content: 'Agent stopped without reporting result'
      });
      break;
    }
    
    // Execute each tool call
    const toolResults = [];
    for (const toolUse of toolUseBlocks) {
      context.healingLog.push({
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
      
      context.healingLog.push({
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
          status: toolResult.status,
          success: toolResult.success,
          skipSuggestion: toolResult.skipSuggestion,
          summary: toolResult.summary,
          retryCount: context.retryCount,
          workflowSaved: context.savedWorkflow,
          docIssuesCount: context.docFixSuggestions.length
        });
        
        return {
          status: toolResult.status,  // 'pass' or 'fail' (skip_suggestion is a flag)
          success: toolResult.success,
          skipSuggestion: toolResult.skipSuggestion,  // Agent suggests skip (requires user approval)
          skipReason: toolResult.skipReason,
          summary: toolResult.summary,
          reason: toolResult.success ? null : toolResult.summary,
          docFixSuggestions: context.docFixSuggestions,
          filteredOutDocIssues: context.filteredOutDocIssues,
          followedWorkflow: toolResult.followedWorkflow,
          workflowDeviations: toolResult.workflowDeviations,
          savedWorkflows: context.savedWorkflow ? [{ endpoint: `${endpoint.method} ${endpoint.path}` }] : [],
          iterations,
          retryCount: context.retryCount,
          healingLog: context.healingLog,
          resolvedParams: context.resolvedParams,
          unresolvedUids: toolResult.unresolvedUids || []
        };
      }
    }
    
    // Add assistant response and tool results to messages
    if (provider === 'openai') {
      // OpenAI format: assistant message with tool_calls, then tool results as separate messages
      const assistantMessage = {
        role: "assistant",
        content: textBlocks.length > 0 ? textBlocks[0].text : null,
        tool_calls: toolUseBlocks.map(tb => ({
          id: tb.id,
          type: 'function',
          function: {
            name: tb.name,
            arguments: JSON.stringify(tb.input)
          }
        }))
      };
      messages.push(assistantMessage);
      
      // Add tool results
      for (const result of toolResults) {
        messages.push({
          role: "tool",
          tool_call_id: result.tool_use_id,
          content: typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
        });
      }
    } else {
      // Anthropic format
      messages.push({ role: "assistant", content: response.content });
      messages.push({ role: "user", content: toolResults });
    }
  }
  
  // Max iterations or retries reached
  onProgress?.({
    type: 'agent_complete',
    success: false,
    summary: context.retryCount > maxRetries 
      ? `Exceeded maximum ${maxRetries} retries`
      : `Reached maximum ${maxIterations} iterations`,
    retryCount: context.retryCount,
    workflowSaved: context.savedWorkflow,
    docIssuesCount: context.docFixSuggestions.length
  });
  
  return {
    success: false,
    reason: context.retryCount > maxRetries 
      ? `Exceeded maximum ${maxRetries} retries`
      : `Reached maximum ${maxIterations} iterations without resolution`,
    docFixSuggestions: context.docFixSuggestions,
    filteredOutDocIssues: context.filteredOutDocIssues,
    savedWorkflows: [],
    iterations,
    retryCount: context.retryCount,
    healingLog: context.healingLog,
    resolvedParams: context.resolvedParams
  };
}

/**
 * Check if an error is unrecoverable (should not attempt healing)
 * @param {Object} result - Validation result
 * @returns {boolean}
 */
function isUnrecoverableError(result) {
  const httpStatus = result.httpStatus;
  const reason = result.details?.reason;
  
  // Infrastructure errors - don't retry
  if ([502, 503, 504].includes(httpStatus)) {
    return true;
  }
  
  // Network errors
  if (reason === 'NETWORK_ERROR' || reason === 'TIMEOUT') {
    return true;
  }
  
  // ENDPOINT_NOT_FOUND is now only set when we detect explicit routing errors
  // (e.g., "route not found", "Cannot POST", HTML error pages)
  // In these cases, we're confident the path is wrong, not just a missing resource
  if (reason === 'ENDPOINT_NOT_FOUND') {
    // Check if we have routing info that confirms it's truly a routing error
    const routingInfo = result.details?.routingInfo;
    if (routingInfo) {
      return true;
    }
    // Otherwise, let the healer investigate - it might be a resource not found
    // that was misclassified due to unusual error format
  }
  
  // 404 with explicit routing error messages - don't retry
  if (httpStatus === 404) {
    const responseData = result.details?.response?.data;
    const message = responseData?.message?.toLowerCase() || '';
    
    // Only unrecoverable if we see explicit routing/gateway errors
    if (message.includes('route not found') ||
        message.includes('cannot post') ||
        message.includes('cannot get') ||
        message.includes('cannot put') ||
        message.includes('cannot delete') ||
        message.includes('not implemented') ||
        message.includes('method not allowed')) {
      return true;
    }
    
    // Check for HTML error pages (gateway errors)
    if (typeof responseData === 'string' && responseData.includes('<!DOCTYPE')) {
      return true;
    }
  }
  
  // All other 404s should be investigated by the healer
  // - Resource not found (missing UID)
  // - Entity not found (need to create first)
  // - Unknown 404s (need source code investigation)
  
  return false;
}

/**
 * Lookup workflow from repository
 */
function lookupWorkflow(endpoint) {
  return workflowRepo.get(endpoint);
}

module.exports = {
  runAgentHealer,
  isUnrecoverableError,
  lookupWorkflow,
  extractUidFieldsFromSchema,
  findUidSourceEndpoints,
  TOOLS
};
