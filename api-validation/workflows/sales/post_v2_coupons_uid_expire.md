---
endpoint: POST /v2/coupons/{uid}/expire
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-01-26T21:28:12.398Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Expire Coupon

## Summary

Expires an active coupon. Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

## Prerequisites

```yaml
steps:
  - id: create_coupon
    description: "Create a test coupon to expire"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Expire Coupon {{now_timestamp}}"
      coupon_type: "percent"
      amount: 10
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
    method: POST
    path: "/v2/coupons/{{coupon_uid}}/expire"
    expect:
      status: 200
```