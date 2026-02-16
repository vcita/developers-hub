---
endpoint: GET /platform/v1/businesses/{business_uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-27T09:21:27.777Z
verifiedAt: 2026-01-27T09:21:27.777Z
timesReused: 0
---
# Get Businesses

## Summary
Test passes with directory token. The GET /platform/v1/businesses/{business_id} endpoint requires directory-level permissions and returns detailed business information including admin account details and business metadata.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_id | Already configured | config.params.business_id | - | No cleanup needed - using existing business |

### Resolution Steps

**business_id**:
1. Call `Already configured`
2. Extract from response: `config.params.business_id`

```json
{
  "business_id": {
    "source_endpoint": "Already configured",
    "extract_from": "config.params.business_id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - using existing business"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "GET",
  "path": "/platform/v1/businesses/{{resolved.uid}}"
}
```