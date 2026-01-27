---
endpoint: GET /platform/v1/payment_statuses/{id}/validate_coupon
domain: sales
tags: []
status: success
savedAt: 2026-01-27T04:30:17.718Z
verifiedAt: 2026-01-27T04:30:17.718Z
timesReused: 0
---
# Get Validate coupon

## Summary
Test passes. The coupon validation endpoint works correctly with payment status UID and coupon code parameters. Returns expected validation errors for expired coupons.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| payment_status_uid | Used configured client_package_payment_status_id: 49shhb1hd1a3f3bv | Configuration parameters | - | - |
| coupon_code | GET /v3/sales/coupons | data.coupons[0].coupon_code | - | - |

### Resolution Steps

**payment_status_uid**:
1. Call `Used configured client_package_payment_status_id: 49shhb1hd1a3f3bv`
2. Extract from response: `Configuration parameters`

**coupon_code**:
1. Call `GET /v3/sales/coupons`
2. Extract from response: `data.coupons[0].coupon_code`
3. If empty, create via `Used existing expired coupon for validation testing`

```json
{
  "payment_status_uid": {
    "source_endpoint": "Used configured client_package_payment_status_id: 49shhb1hd1a3f3bv",
    "extract_from": "Configuration parameters",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
  },
  "coupon_code": {
    "source_endpoint": "GET /v3/sales/coupons",
    "extract_from": "data.coupons[0].coupon_code",
    "fallback_endpoint": "Used existing expired coupon for validation testing",
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
null
```