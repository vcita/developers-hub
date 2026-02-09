---
endpoint: "PUT /business/payments/v1/carts/{uid}/cart_completed"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:31:22.970Z
verifiedAt: 2026-02-07T07:03:44.000Z
timesReused: 0
useFallbackApi: true
---
# Update Cart completed

## Summary

PUT /business/payments/v1/carts/{uid}/cart_completed works. Original failure was due to missing path parameter (cart uid). After creating a sale cart via POST /business/payments/v1/carts and using the returned cart.uid in the path, completion returned 200 with message 'Cart completed successfully'.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: create_cart
    description: "Create a cart to complete"
    method: POST
    path: "/business/payments/v1/carts"
    token: staff
    body:
      cart: {"currency":"USD","items":[{"entity_uid":"{{service_id}}","entity_type":"Service","entity_name":"Completion Test Service"}],"matter_uid":"{{matter_uid}}"}
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
    description: "Update cart_completed"
    method: PUT
    path: "/business/payments/v1/carts/{{cart_uid}}/cart_completed"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: uid (path parameter) | required path parameter | required; blank/missing triggers ValidationErrors on field cart_uid | - |
