---
endpoint: PUT /v2/coupons/{uid}
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-01-27T00:00:00.000Z
verifiedAt: 2026-01-27T00:00:00.000Z
timesReused: 0
tokens: [staff]
---

# Update Coupon

## Summary

Updates an existing coupon by its UID. Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

## Prerequisites

```yaml
steps:
  - id: create_coupon
    description: "Create a test coupon to update"
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Update Coupon {{timestamp}}"
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
    method: PUT
    path: "/v2/coupons/{{coupon_uid}}"
    body:
      name: "Updated Test Coupon {{timestamp}}"
      amount: 20
    expect:
      status: 200
```