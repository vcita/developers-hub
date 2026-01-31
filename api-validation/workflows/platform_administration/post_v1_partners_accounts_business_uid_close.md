---
endpoint: POST /v1/partners/accounts/{business_uid}/close
domain: platform_administration
tags: [partners, close]
status: skip
savedAt: 2026-01-28T15:36:02.150Z
verifiedAt: 2026-01-28T15:36:02.150Z
timesReused: 0
skipReason: The endpoint POST /v1/partners/accounts/{business_id}/close returns 404 Not Found, and source code investigation reveals no implementation of the v1/partners API namespace in the core repository. The entire v1/partners API appears to be undocumented or not implemented in the current environment, making this test unworkable until the API is properly deployed.
---
# Create Close

## Summary
User-approved skip: The endpoint POST /v1/partners/accounts/{business_id}/close returns 404 Not Found, and source code investigation reveals no implementation of the v1/partners API namespace in the core repository. The entire v1/partners API appears to be undocumented or not implemented in the current environment, making this test unworkable until the API is properly deployed.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The endpoint POST /v1/partners/accounts/{business_id}/close returns 404 Not Found, and source code investigation reveals no implementation of the v1/partners API namespace in the core repository. The entire v1/partners API appears to be undocumented or not implemented in the current environment, making this test unworkable until the API is properly deployed.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/v1/partners/accounts/{business_id}/close"
}
```