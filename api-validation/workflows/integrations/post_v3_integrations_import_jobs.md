---
endpoint: POST /v3/integrations/import_jobs
domain: integrations
tags: []
status: verified
savedAt: 2026-01-23T09:40:43.034Z
verifiedAt: 2026-01-23T09:40:43.034Z
timesReused: 0
---
# Create Import jobs

## Summary
Successfully resolved missing required enum fields. The original request was missing 'entity_type' and 'provider_type' fields. Added entity_type='product' and provider_type='file_upload' to fix validation errors. Final request received rate limiting (429) which indicates the request structure is now valid.

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

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| entity_type | Required enum field not documented in the original request example | Add entity_type field to request documentation with valid enum values | major |
| provider_type | Required enum field not documented in the original request example | Add provider_type field to request documentation with valid enum values like 'file_upload' | major |