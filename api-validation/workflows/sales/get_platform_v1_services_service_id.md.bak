---
endpoint: GET /platform/v1/services/{service_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:06:48.694Z
verifiedAt: 2026-01-26T22:06:48.694Z
timesReused: 0
---
# Get Services

## Summary
Test passes. Service details endpoint works correctly when provided with a valid service_id from GET /platform/v1/services.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_id | GET /platform/v1/services | data.services[0].id | - | Services are business resources that don't need cleanup |

### Resolution Steps

**service_id**:
1. Call `GET /platform/v1/services`
2. Extract from response: `data.services[0].id`

```json
{
  "service_id": {
    "source_endpoint": "GET /platform/v1/services",
    "extract_from": "data.services[0].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Services are business resources that don't need cleanup"
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
  "path": "/platform/v1/services/{{resolved.uid}}"
}
```