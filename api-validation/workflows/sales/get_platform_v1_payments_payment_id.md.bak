---
endpoint: GET /platform/v1/payments/{payment_id}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T06:38:54.155Z
verifiedAt: 2026-01-26T06:38:54.155Z
timesReused: 0
---
# Get Payments

## Summary
Test passes successfully. The GET /platform/v1/payments/{payment_id} endpoint returned payment details with HTTP 201 status code.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_id | Already available in config parameters | Pre-configured value | - | No cleanup needed - GET endpoint doesn't modify data |

### Resolution Steps

**payment_id**:
1. Call `Already available in config parameters`
2. Extract from response: `Pre-configured value`

```json
{
  "payment_id": {
    "source_endpoint": "Already available in config parameters",
    "extract_from": "Pre-configured value",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - GET endpoint doesn't modify data"
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
  "path": "/platform/v1/payments/{{resolved.uid}}"
}
```