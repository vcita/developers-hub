---
endpoint: GET /v3/payment_processing/payment_gateways
domain: sales
tags: []
status: verified
savedAt: 2026-01-23T08:39:05.554Z
verifiedAt: 2026-01-23T08:39:05.554Z
timesReused: 0
---
# Get Payment gateways

## Summary
Successfully resolved authorization issue by using directory token instead of staff token. The endpoint requires directory-level access to retrieve payment gateways.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/payment_processing/payment_gateways"
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| authorization | Documentation doesn't specify that this endpoint requires directory-level access rather than business-level access | Add authorization requirements section specifying that directory token is required for this endpoint | major |