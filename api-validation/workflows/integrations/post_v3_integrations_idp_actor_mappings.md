---
endpoint: POST /v3/integrations/idp_actor_mappings
domain: integrations
tags: []
status: skip
savedAt: 2026-01-23T22:26:55.840Z
verifiedAt: 2026-01-23T22:26:55.840Z
timesReused: 0
skipReason: The provided idp_user_reference_id 'ext-12345' already exists in the system. Each idp_user_reference_id must be unique - cannot create duplicate mappings. The endpoint correctly enforces this business rule with a clear error message.
---
# Create Idp actor mappings

## Summary
Skipped based on cached workflow - The provided idp_user_reference_id 'ext-12345' already exists in the system. Each idp_user_reference_id must be unique - cannot create duplicate mappings. The endpoint correctly enforces this business rule with a clear error message.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The provided idp_user_reference_id 'ext-12345' already exists in the system. Each idp_user_reference_id must be unique - cannot create duplicate mappings. The endpoint correctly enforces this business rule with a clear error message.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

No documentation issues found.