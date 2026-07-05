---
endpoint: GET /v2/coupons/valid_coupons
domain: sales
tags: [coupons]
swagger: swagger/sales/legacy/coupons.json
status: verified
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: 2026-03-01T00:00:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Get Valid Coupons for Entity (Deprecated)

## Summary

**DEPRECATED** - Use the v3 alternative `GET /v3/sales/coupons` instead.

Retrieves a list of valid (redeemable) coupons for a specific entity. **Token Type**: Requires a **staff token**.

> ⚠️ Fallback API Required: This endpoint requires the fallback API to function properly.

> ⚠️ Deprecated: This endpoint is deprecated. Use GET /v3/sales/coupons instead.

## Prerequisites

```yaml
steps:
  - id: get_payment
    description: "Fetch a payment to use as entity"
    method: GET
    path: "/platform/v1/payments"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      payment_id: "$.data.payments[0].id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v2/coupons/valid_coupons"
    params:
      entity_id: "{{payment_id}}"
      entity_type: "payment"
    expect:
      status: 200
```