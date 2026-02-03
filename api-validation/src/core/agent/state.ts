/**
 * Validation Agent State Types
 *
 * State flows through all 5 nodes:
 * 1. Token Prep -> tokens, params
 * 2. Agreement Check -> agreement
 * 3. Workflow Prerequisites -> params (enriched)
 * 4. Pre-Flight Hook -> (validates before execute_api)
 * 5. Execute Loop -> result
 */

// =============================================================================
// Endpoint Types
// =============================================================================

export interface EndpointParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: {
    type: string;
    format?: string;
    enum?: string[];
    default?: unknown;
  };
}

export interface EndpointSchema {
  type: string;
  properties?: Record<string, {
    type: string;
    description?: string;
    required?: boolean;
    'x-reference-to'?: string;
    enum?: string[];
    format?: string;
  }>;
  required?: string[];
}

export interface Endpoint {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  domain?: string;
  swaggerFile?: string;
  parameters?: {
    path?: EndpointParameter[];
    query?: EndpointParameter[];
    header?: EndpointParameter[];
  };
  requestSchema?: EndpointSchema;
  responseSchema?: EndpointSchema;
  security?: Array<Record<string, string[]>>;
  tokenInfo?: {
    found: boolean;
    required?: string;
    signer?: string;
  };
}

// =============================================================================
// Workflow Types
// =============================================================================

export interface WorkflowPrerequisite {
  name: string;
  method: string;
  path: string;
  extract?: Record<string, string>;
  body?: Record<string, unknown>;
  condition?: string;
}

export interface Workflow {
  exists: boolean;
  status?: 'success' | 'skip';
  skipReason?: string;
  summary?: string;
  prerequisites?: WorkflowPrerequisite[];
  uidResolution?: Record<string, {
    source: string;
    path: string;
    extract: string;
  }>;
  sections?: Record<string, string>;
  testRequest?: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
    tokenType?: string;
  };
}

// =============================================================================
// Config Types
// =============================================================================

export interface TokenConfig {
  staff?: string;
  client?: string;
  app?: string;
  admin?: string;
  directory?: string;
  internal?: string;
}

export interface ValidationConfig {
  baseUrl: string;
  fallbackUrl?: string;
  tokens: TokenConfig;
  params: Record<string, string>;
  staffAuth?: {
    oauth_client_id: string;
    oauth_client_secret: string;
    username: string;
    password: string;
    autoRefresh?: boolean;
  };
  clientAuth?: {
    email?: string;
    autoRefresh?: boolean;
  };
  ai?: {
    enabled: boolean;
    provider?: 'anthropic' | 'openai';
    anthropicApiKey?: string;
    openaiApiKey?: string;
    model?: string;
  };
}

// =============================================================================
// Result Types
// =============================================================================

export interface DocIssue {
  field: string;
  issue: string;
  suggestedFix?: string;
  severity?: 'minor' | 'major' | 'critical';
  endpoint?: string;
  verified?: boolean;
  verifiedAt?: string;
}

export interface AgreementFix {
  type: 'swagger' | 'workflow' | 'code';
  file: string;
  change: string;
  applied: boolean;
}

export interface AgreementResult {
  validated: boolean;
  fixes: AgreementFix[];
  mismatches?: Array<{
    category: 'token' | 'parameter' | 'response';
    swagger: string;
    code: string;
    resolution: string;
  }>;
}

export interface ValidationResult {
  status: 'PASS' | 'FAIL' | 'SKIP' | 'BLOCKED' | 'ERROR';
  reason: string;
  docIssues?: DocIssue[];
  skipSuggestion?: boolean;
  skipReason?: string;
  uidResolution?: Record<string, unknown>;
  successfulRequest?: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
    params?: Record<string, unknown>;
  };
  retryCount?: number;
  // UI display fields
  httpStatus?: number;
  durationMs?: number;
  tokenUsed?: string;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    data?: Record<string, unknown>;
  };
  response?: {
    status: number;
    headers?: Record<string, string>;
    data?: unknown;
  };
}

export interface HealingLogEntry {
  action: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  timestamp: string;
}

// =============================================================================
// Progress Callback Types
// =============================================================================

export interface ProgressEvent {
  type: 'preflight' | 'progress' | 'agent_action' | 'agent_complete' | 'result' | 'error';
  action?: string;
  details?: string;
  status?: string;
  success?: boolean;
  summary?: string;
  endpoint?: string;
  index?: number;
  total?: number;
  error?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;

// =============================================================================
// Main State Interface
// =============================================================================

/**
 * ValidationState flows through all nodes in the agent pipeline.
 * Each node reads from state and returns a partial update.
 */
export interface ValidationState {
  // Input (set at start)
  endpoint: Endpoint;
  allEndpoints: Endpoint[];
  config: ValidationConfig;

  // Node 1 output: tokens and params
  tokens: TokenConfig;
  params: Record<string, string>;

  // Node 2 output: agreement check result
  agreement: AgreementResult | null;

  // Node 3 output: workflow info
  workflow: Workflow;

  // Node 5 output: final result
  result: ValidationResult | null;

  // Healing log for tracking all tool calls
  healingLog: HealingLogEntry[];

  // Control flow
  retryCount: number;
  done: boolean;

  // Progress callback (passed through)
  onProgress?: ProgressCallback;
}

// =============================================================================
// State Factory
// =============================================================================

export function createInitialState(
  endpoint: Endpoint,
  allEndpoints: Endpoint[],
  config: ValidationConfig,
  onProgress?: ProgressCallback
): ValidationState {
  return {
    endpoint,
    allEndpoints,
    config,
    tokens: config.tokens || {},
    params: config.params || {},
    agreement: null,
    workflow: { exists: false },
    result: null,
    healingLog: [],
    retryCount: 0,
    done: false,
    onProgress,
  };
}
