---
endpoint: "PUT /business/payments/v1/carts/{uid}/cancel"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:27:29.913Z
verifiedAt: 2026-02-07T07:14:50.000Z
timesReused: 0
useFallbackApi: true
---
# Update Cancel

## Summary

PUT /business/payments/v1/carts/{uid}/cancel works when a valid sale cart UID is used. The failing test used an invalid/unknown {uid} (vy95sanetdvrvyae), leading to 422 {field: cart_uid, message: Not Found}. Retried with existing cart uid bmn2yncdcvkrgehf and body {cancel_payment_statuses_items:true} → 200 success.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: create_cart
    description: "Create a cart to cancel"
    method: POST
    path: "/business/payments/v1/carts"
    token: staff
    body:
      cart: {"currency":"USD","items":[{"entity_uid":"{{service_id}}","entity_type":"Service","entity_name":"Cancel Cart Service"}],"matter_uid":"{{matter_uid}}"}
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
    description: "Update cancel"
    method: PUT
    path: "/business/payments/v1/carts/{{cart_uid}}/cancel"
    body:
      cancel_payment_statuses_items: true
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: path.uid (cart_uid) | Not emphasized in failing test; placeholder uid used | Path parameter :uid required and must be an existing sale/cart uid | - |
