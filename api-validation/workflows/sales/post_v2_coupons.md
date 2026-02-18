---
endpoint: POST /v2/coupons
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-02-08T19:22:00.000Z
verifiedAt: 2026-02-08T19:22:00.000Z
timesReused: 0
tokens: [staff]
---

# Create Coupon

## Summary

Creates a new coupon for the business. Available for **Staff tokens**.

**Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

> ⚠️ **Important**: Both `starts_at` and `expires_at` are required. The backend decorator crashes with a nil comparison error if either is missing (the frontend always sends both dates). The `expires_at` must be at least 6 hours after `starts_at` and must be in the future.

## Prerequisites

```yaml
steps: []
```

## Test Request

```yaml
steps:
  - id: main_request
    method: POST
    path: "/v2/coupons"
    body:
      name: "Test Coupon {{timestamp}}"
      coupon_type: "percent"
      amount: 25
      starts_at: "{{current_date}}"
      expires_at: "{{future_datetime}}"
    expect:
      status: 200
```