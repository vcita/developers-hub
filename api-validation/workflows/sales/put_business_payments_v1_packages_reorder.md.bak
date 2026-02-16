---
endpoint: PUT /business/payments/v1/packages/reorder
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:28:03.824Z
verifiedAt: 2026-01-26T22:28:03.824Z
timesReused: 0
---
# Update Reorder

## Summary
Test passes after resolving valid package IDs. The original request used a placeholder package ID that doesn't exist, but when using real package IDs from GET /platform/v1/payment/packages, the endpoint works correctly and returns HTTP 200.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| package_id | GET /platform/v1/payment/packages | data.packages[].id | - | No cleanup needed - packages are persistent business resources |

### Resolution Steps

**package_id**:
1. Call `GET /platform/v1/payment/packages`
2. Extract from response: `data.packages[].id`

```json
{
  "package_id": {
    "source_endpoint": "GET /platform/v1/payment/packages",
    "extract_from": "data.packages[].id",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - packages are persistent business resources"
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
  "path": "/business/payments/v1/packages/reorder",
  "body": {
    "packages": [
      {
        "id": "{{resolved.id}}",
        "order": 1
      },
      {
        "id": "{{resolved.id}}",
        "order": 2
      }
    ]
  }
}
```