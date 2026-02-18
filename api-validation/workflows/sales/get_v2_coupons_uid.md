---
endpoint: GET /v2/coupons/{uid}
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-02-08T19:30:00.000Z
verifiedAt: 2026-02-08T19:30:00.000Z
timesReused: 0
tokens: [staff]
---

# Get Coupon

## Summary

Retrieves a single coupon by its UID. Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

## Prerequisites

```yaml
steps:
  - id: create_coupon
    description: "Create a test coupon to retrieve"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Get Coupon {{timestamp}}"
      coupon_type: "percent"
      amount: 15
      starts_at: "{{current_date}}"
      expires_at: "{{future_datetime}}"
    extract:
      coupon_uid: "$.uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v2/coupons/{{coupon_uid}}"
    expect:
      status: 200
```
