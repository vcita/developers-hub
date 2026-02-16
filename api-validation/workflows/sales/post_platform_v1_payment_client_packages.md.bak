---
endpoint: POST /platform/v1/payment/client_packages
domain: sales
tags: []
status: success
savedAt: 2026-01-27T04:22:09.837Z
verifiedAt: 2026-01-27T04:22:09.837Z
timesReused: 0
---
# Create Client packages

## Summary
Test passes after correcting date format. The valid_from and valid_until fields require ISO 8601 date format (YYYY-MM-DD), not placeholder strings.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| client_id | - | data[0].uid or data[0].id | - | - |
| package_id | - | data[0].uid or data[0].id | - | - |
| date_format | - | data[0].uid or data[0].id | - | - |

### Resolution Steps

**client_id**:

**package_id**:

**date_format**:

```json
{
  "client_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "package_id": {
    "source_endpoint": null,
    "extract_from": "first item uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "date_format": {
    "source_endpoint": null,
    "extract_from": "first item uid",
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
  "method": "POST",
  "path": "/platform/v1/payment/client_packages",
  "body": {
    "client_id": "{{config.params.client_id}}",
    "package_id": "{{resolved.package_id}}",
    "price": 1,
    "valid_from": "2024-01-01",
    "valid_until": "2024-12-31"
  }
}
```