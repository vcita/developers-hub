---
endpoint: "GET /business/payments/v1/carts/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:16:30.985Z
verifiedAt: 2026-02-07T07:34:35.000Z
timesReused: 0
useFallbackApi: true
---
# Get Carts

## Summary

GET /business/payments/v1/carts/{uid} works when a valid cart UID is provided. The failure was due to missing path parameter; API returned 422 with error field name 'cart_uid'. Retry with /business/payments/v1/carts/bmn2yncdcvkrgehf returned 200 and cart data.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: create_cart
    description: "Create a cart to fetch"
    method: POST
    path: "/business/payments/v1/carts"
    token: staff
    body:
      cart: {"currency":"USD","items":[{"entity_uid":"{{service_id}}","entity_type":"Service","entity_name":"Get Cart Service"}],"matter_uid":"{{matter_uid}}"}
      is_sale: true
    extract:
      cart_uid: "$.data.cart.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get carts"
    method: GET
    path: "/business/payments/v1/carts/{{cart_uid}}"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: uid | Path param uid required; expected 404 if not found | Controller passes params[:uid] as cart_uid to CartsAPI; missing uid surfaces as 422 with field 'cart_uid' | - |
| missing_field: cart_uid | Path parameter named 'uid' | Downstream validation uses field name 'cart_uid' | - |
