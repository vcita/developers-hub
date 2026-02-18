---
endpoint: POST /v2/coupons/{uid}/enable
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-01-28T12:00:00.000Z
verifiedAt: 2026-01-28T12:00:00.000Z
timesReused: 0
tokens: [staff]
---

# Enable Coupon

## Summary

Enables a previously disabled coupon, making it redeemable again. Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

## Prerequisites

```yaml
steps:
  - id: create_coupon
    description: "Create a test coupon"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Enable Coupon {{now_timestamp}}"
      coupon_type: "percent"
      amount: 25
      starts_at: "{{current_date}}"
      expires_at: "{{future_datetime}}"
    extract:
      coupon_uid: "$.uid"
    expect:
      status: 200
    onFail: abort

  - id: disable_coupon
    description: "Disable the coupon so we can enable it"
    method: POST
    path: "/v2/coupons/{{coupon_uid}}/disable"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v2/coupons/{{coupon_uid}}/enable"
    expect:
      status: 200
```