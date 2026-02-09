---
endpoint: GET /business/payments/v1/client_packages/{uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:11:55.113Z
verifiedAt: 2026-01-26T22:11:55.113Z
timesReused: 0
---
# Get Client packages

## Summary
Test passes. The endpoint works correctly when using a valid client package UID that exists in the system. The original failure was due to using a placeholder UID that doesn't exist.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_package_uid | GET /platform/v1/clients/{client_id}/payment/client_packages | data.client_packages[0].id | - | - |

### Resolution Steps

**client_package_uid**:
1. Call `GET /platform/v1/clients/{client_id}/payment/client_packages`
2. Extract from response: `data.client_packages[0].id`
3. If empty, create via `POST /platform/v1/payment/client_packages`

```json
{
  "client_package_uid": {
    "source_endpoint": "GET /platform/v1/clients/{client_id}/payment/client_packages",
    "extract_from": "data.client_packages[0].id",
    "fallback_endpoint": "POST /platform/v1/payment/client_packages",
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
  "method": "GET",
  "path": "/business/payments/v1/client_packages/{{resolved.uid}}"
}
```