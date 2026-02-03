/**
 * Verification Index Types
 *
 * Tracks documentation verification status per endpoint.
 * Separate from workflow - this tracks if swagger matches code.
 */

export type VerificationStatus = 'verified' | 'unverified' | 'needs_fix' | 'stale';
export type FailureReason = 'doc_mismatch' | 'missing_test_data' | 'auth_issue' | 'transient' | 'unknown';
export type FindingSeverity = 'error' | 'warning' | 'info';
export type FindingCategory = 'auth' | 'param_required' | 'param_name' | 'response' | 'path';

export interface AgreementFinding {
  category: FindingCategory;
  severity: FindingSeverity;
  swagger: string;
  code: string;
  file?: string;
  line?: number;
  fix?: string;
}

export interface AgreementFix {
  type: 'swagger' | 'workflow';
  file: string;
  action: 'update_description' | 'add_param' | 'remove_param' | 'change_required' | 'create_workflow';
  details: Record<string, unknown>;
  applied?: boolean;
}

export interface CodeAgreement {
  checked: boolean;
  controllerFile?: string;
  lastCodeHash?: string;
  matches: boolean;
  findings: AgreementFinding[];
}

export interface DocumentationStatus {
  status: VerificationStatus;
  verifiedAt?: string;
  validUntil?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface LastTestResult {
  result: string;
  failureReason?: FailureReason;
  testedAt: string;
  details: string;
  httpStatus?: number;
  retryCount?: number;
}

export interface VerificationEntry {
  endpointKey: string;
  swaggerFile?: string;
  swaggerHash?: string;
  workflowFile?: string;
  documentation: DocumentationStatus;
  lastTest?: LastTestResult;
  codeAgreement?: CodeAgreement;
  docIssues: AgreementFinding[];
  createdAt: string;
  updatedAt: string;
}

export interface VerificationIndex {
  version: string;
  lastUpdated: string;
  endpoints: Record<string, VerificationEntry>;
}
