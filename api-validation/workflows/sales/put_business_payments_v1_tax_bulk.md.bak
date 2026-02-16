---
endpoint: PUT /business/payments/v1/tax_bulk
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:38:36.467Z
verifiedAt: 2026-01-26T22:38:36.467Z
timesReused: 0
---
# Update Tax bulk

## Summary
Test passes after fixing documentation issue. The swagger shows default_for_categories as type 'string' but the API expects an array. Fixed by using correct array format and existing tax ID for bulk update.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| tax_id | GET /business/payments/v1/taxes | data.taxes[0].id | - | - |

### Resolution Steps

**tax_id**:
1. Call `GET /business/payments/v1/taxes`
2. Extract from response: `data.taxes[0].id`
3. If empty, create via `POST /business/payments/v1/taxes`

```json
{
  "tax_id": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[0].id",
    "fallback_endpoint": "POST /business/payments/v1/taxes",
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
  "path": "/business/payments/v1/tax_bulk",
  "body": {
    "data": [
      {
        "id": "{{resolved.id}}",
        "default_for_categories": [],
        "name": "Updated Test Tax",
        "rate": 8.75
      }
    ]
  }
}
```