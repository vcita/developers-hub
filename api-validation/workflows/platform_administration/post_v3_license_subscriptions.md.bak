---
endpoint: POST /v3/license/subscriptions
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T20:45:43.592Z
verifiedAt: 2026-01-28T20:45:43.592Z
timesReused: 0
---
# Create Subscriptions

## Summary
Endpoint works correctly. Successfully created subscription with staff token when no custom price is specified. Custom pricing validation is working as documented - requires directory or admin tokens.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| offering_uid | GET /v3/license/offerings | data.offerings[0].uid | - | Offerings are system entities, no cleanup needed |

### Resolution Steps

**offering_uid**:
1. Call `GET /v3/license/offerings`
2. Extract from response: `data.offerings[0].uid`

```json
{
  "offering_uid": {
    "source_endpoint": "GET /v3/license/offerings",
    "extract_from": "data.offerings[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Offerings are system entities, no cleanup needed"
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
  "path": "/v3/license/subscriptions",
  "body": {
    "offering_uid": "{{resolved.offering_uid}}",
    "purchase_currency": "USD",
    "charged_by": "partner",
    "discount_code_name": "fixed_amount",
    "coupon_code": "MAVCFREE",
    "payment_type": "external"
  }
}
```