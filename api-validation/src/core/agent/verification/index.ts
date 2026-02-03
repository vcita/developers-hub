/**
 * Verification Index Module
 *
 * Manages the verification-index.json file that tracks
 * documentation verification status per endpoint.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type {
  VerificationIndex,
  VerificationEntry,
  VerificationStatus,
  AgreementFinding,
  LastTestResult,
  CodeAgreement,
} from './types.js';

const VERIFICATION_INDEX_PATH = path.join(
  process.cwd(),
  'api-validation',
  'verification-index.json'
);

// Cache for in-memory access
let indexCache: VerificationIndex | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 5000; // 5 seconds

/**
 * Load the verification index from disk
 */
export async function loadVerificationIndex(): Promise<VerificationIndex> {
  // Check cache
  if (indexCache && Date.now() - cacheTime < CACHE_TTL) {
    return indexCache;
  }

  try {
    const content = await fs.readFile(VERIFICATION_INDEX_PATH, 'utf-8');
    indexCache = JSON.parse(content);
    cacheTime = Date.now();
    return indexCache!;
  } catch (error) {
    // Create new index if doesn't exist
    const newIndex: VerificationIndex = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      endpoints: {},
    };
    await saveVerificationIndex(newIndex);
    return newIndex;
  }
}

/**
 * Save the verification index to disk
 */
export async function saveVerificationIndex(index: VerificationIndex): Promise<void> {
  index.lastUpdated = new Date().toISOString();
  await fs.writeFile(
    VERIFICATION_INDEX_PATH,
    JSON.stringify(index, null, 2),
    'utf-8'
  );
  indexCache = index;
  cacheTime = Date.now();
}

/**
 * Load verification entry for a specific endpoint
 */
export async function loadVerification(endpointKey: string): Promise<VerificationEntry | null> {
  const index = await loadVerificationIndex();
  return index.endpoints[endpointKey] || null;
}

/**
 * Save verification entry for a specific endpoint
 */
export async function saveVerification(
  endpointKey: string,
  entry: Partial<VerificationEntry>
): Promise<VerificationEntry> {
  const index = await loadVerificationIndex();
  const now = new Date().toISOString();

  const existing = index.endpoints[endpointKey];
  const defaults: VerificationEntry = {
    endpointKey,
    documentation: {
      status: 'unverified',
      confidence: 'low',
    },
    docIssues: [],
    createdAt: now,
    updatedAt: now,
  };
  const updated: VerificationEntry = {
    ...defaults,
    ...existing,
    ...entry,
    endpointKey, // Always use provided key
    createdAt: existing?.createdAt || now, // Keep original created date
    updatedAt: now, // Always update
  };

  index.endpoints[endpointKey] = updated;
  await saveVerificationIndex(index);
  return updated;
}

/**
 * Check if an endpoint should skip agreement check
 * Returns { skip: true, reason } if should skip
 */
export async function shouldSkipAgreementCheck(
  endpointKey: string,
  swaggerFile?: string,
  controllerFile?: string
): Promise<{ skip: boolean; reason?: string }> {
  const verification = await loadVerification(endpointKey);

  // No verification record -> run check
  if (!verification) {
    return { skip: false };
  }

  // Needs fix -> run check (maybe it's fixed now)
  if (verification.documentation.status === 'needs_fix') {
    return { skip: false };
  }

  // Not verified -> run check
  if (verification.documentation.status !== 'verified') {
    return { skip: false };
  }

  // Check if expired
  if (verification.documentation.validUntil) {
    const validUntil = new Date(verification.documentation.validUntil);
    if (validUntil < new Date()) {
      return { skip: false };
    }
  }

  // Verified and not expired -> skip agreement check
  // Note: We skip hash checks because if docs are verified, we trust them
  // until the validity period expires. This allows quick re-runs.
  return {
    skip: true,
    reason: `Verified on ${verification.documentation.verifiedAt}, valid until ${verification.documentation.validUntil}`,
  };
}

/**
 * Update verification after successful test
 */
export async function markVerified(
  endpointKey: string,
  options: {
    swaggerFile?: string;
    controllerFile?: string;
    codeAgreement?: CodeAgreement;
    validDays?: number;
  } = {}
): Promise<VerificationEntry> {
  const { swaggerFile, controllerFile, codeAgreement, validDays = 7 } = options;
  const now = new Date();
  const validUntil = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

  const entry: Partial<VerificationEntry> = {
    documentation: {
      status: 'verified',
      verifiedAt: now.toISOString(),
      validUntil: validUntil.toISOString(),
      confidence: 'high',
    },
    lastTest: {
      result: 'pass',
      testedAt: now.toISOString(),
      details: 'Test passed successfully',
    },
    docIssues: [],
  };

  if (swaggerFile) {
    entry.swaggerFile = swaggerFile;
    entry.swaggerHash = await getFileHash(swaggerFile);
  }

  if (controllerFile && codeAgreement) {
    entry.codeAgreement = {
      ...codeAgreement,
      lastCodeHash: await getFileHash(controllerFile),
    };
  }

  return saveVerification(endpointKey, entry);
}

/**
 * Update verification after failed test
 */
export async function markFailed(
  endpointKey: string,
  failureReason: LastTestResult['failureReason'],
  details: string,
  docIssues: AgreementFinding[] = []
): Promise<VerificationEntry> {
  const now = new Date().toISOString();

  // Only mark needs_fix if it's a doc mismatch
  const status: VerificationStatus =
    failureReason === 'doc_mismatch' ? 'needs_fix' : 'unverified';

  const entry: Partial<VerificationEntry> = {
    documentation: {
      status,
      confidence: 'low',
    },
    lastTest: {
      result: 'fail',
      failureReason,
      testedAt: now,
      details,
    },
    docIssues,
  };

  return saveVerification(endpointKey, entry);
}

/**
 * Get hash of a file for change detection
 */
export async function getFileHash(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 12);
  } catch {
    return 'unknown';
  }
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Re-export types
export * from './types.js';
