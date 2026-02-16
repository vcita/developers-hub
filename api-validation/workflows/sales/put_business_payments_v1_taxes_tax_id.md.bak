---
endpoint: PUT /business/payments/v1/taxes/{tax_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:39:39.810Z
verifiedAt: 2026-01-26T22:39:39.810Z
timesReused: 0
---
# Update Taxes

## Summary
Test passes after correcting default_for_categories from string to array format. The API expects an array of category strings, not a string value.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| tax_id | GET /business/payments/v1/taxes | data.taxes[].id | - | - |

### Resolution Steps

**tax_id**:
1. Call `GET /business/payments/v1/taxes`
2. Extract from response: `data.taxes[].id`

```json
{
  "tax_id": {
    "source_endpoint": "GET /business/payments/v1/taxes",
    "extract_from": "data.taxes[].id",
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
  "path": "/business/payments/v1/taxes/{{resolved.uid}}",
  "body": {
    "tax": {
      "default_for_categories": [],
      "name": "Updated Test Tax Name",
      "rate": 12.5
    }
  }
}
```