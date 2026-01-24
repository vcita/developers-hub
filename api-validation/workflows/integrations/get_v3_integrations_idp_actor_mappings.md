---
endpoint: GET /v3/integrations/idp_actor_mappings
domain: integrations
tags: []
status: verified
savedAt: 2026-01-23T08:38:03.735Z
verifiedAt: 2026-01-23T08:38:03.735Z
timesReused: 0
---
# Get Idp actor mappings

## Summary
Successfully resolved the failing test by providing the required actor_uid parameter using the existing staff_uid value.

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| actor_uid | existing parameter | - | No |

```json
{
  "actor_uid": {
    "resolved_value": "guwtwt70kxgic65r",
    "source_endpoint": "existing parameter",
    "used_fallback": false
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "GET",
  "path": "/v3/integrations/idp_actor_mappings",
  "body": {
    "actor_uid": "guwtwt70kxgic65r"
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| actor_uid | Required parameter not documented in the extract_required_uids function but required by the endpoint | Update schema to reflect that actor_uid is a required query parameter | major |