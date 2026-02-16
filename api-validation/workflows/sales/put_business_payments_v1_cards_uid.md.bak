---
endpoint: PUT /business/payments/v1/cards/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:17:47.209Z
verifiedAt: 2026-01-26T22:17:47.209Z
timesReused: 0
---
# Update Cards

## Summary
Test passes after using valid usage_permission value. The original request used 'test_string' which is invalid - only 'all' and 'client' are accepted.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| card_uid | Used existing card_id from parameters | card_id parameter | - | - |

### Resolution Steps

**card_uid**:
1. Call `Used existing card_id from parameters`
2. Extract from response: `card_id parameter`

```json
{
  "card_uid": {
    "source_endpoint": "Used existing card_id from parameters",
    "extract_from": "card_id parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
  "method": "PUT",
  "path": "/business/payments/v1/cards/{{resolved.uid}}",
  "body": {
    "card": {
      "default": true,
      "usage_permission": "all"
    }
  }
}
```