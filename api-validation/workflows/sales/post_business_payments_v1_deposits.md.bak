---
endpoint: POST /business/payments/v1/deposits
domain: sales
tags: []
status: success
savedAt: 2026-01-26T21:24:04.562Z
verifiedAt: 2026-01-26T21:24:04.562Z
timesReused: 0
---
# Create Deposits

## Summary
Test passes. The deposit was created successfully using valid amount object format, invoice entity_uid, and matter_uid. Payment_uid is optional.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| entity_uid | GET /platform/v1/invoices | data.invoices[0].id | - | - |
| matter_uid | - | data[0].uid or data[0].id | - | - |

### Resolution Steps

**entity_uid**:
1. Call `GET /platform/v1/invoices`
2. Extract from response: `data.invoices[0].id`
3. If empty, create via `POST /platform/v1/invoices`

**matter_uid**:

```json
{
  "entity_uid": {
    "source_endpoint": "GET /platform/v1/invoices",
    "extract_from": "data.invoices[0].id",
    "fallback_endpoint": "POST /platform/v1/invoices",
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "matter_uid": {
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
  "path": "/business/payments/v1/deposits",
  "body": {
    "deposit": {
      "amount": {
        "value": 200,
        "type": "fixed",
        "total": 200
      },
      "can_client_pay": true,
      "currency": "USD",
      "entity_type": "Invoice",
      "entity_uid": "{{resolved.entity_uid}}",
      "matter_uid": "{{config.params.matter_uid}}"
    }
  }
}
```