---
endpoint: POST /business/payments/v1/payment_requests/{payment_request_uid}/send_link
domain: sales
tags: [payment_requests]
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-02-07T07:05:00.000Z
verifiedAt: 2026-02-07T07:08:41.000Z
timesReused: 0
tokens: [staff]
useFallbackApi: true
---
# Send Payment Request Link

## Summary

The endpoint requires a pending payment request and a channel in the request body. Use a product order to create a pending payment request, reassign the matter to the active staff member to ensure conversation ownership, then send the link using a **Staff token** via the fallback API.

## Prerequisites

```yaml
steps:
  - id: get_products
    description: "Fetch products to obtain a product ID"
    method: GET
    path: "/business/payments/v1/products"
    token: staff
    extract:
      product_id: "$.data.products[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: create_product_order
    description: "Create a product order to obtain a pending payment request UID"
    method: POST
    path: "/business/payments/v1/product_orders"
    token: staff
    body:
      product_order:
        client_id: "{{client_id}}"
        matter_uid: "{{matter_uid}}"
        price: 1
        product_id: "{{product_id}}"
    extract:
      payment_request_uid: "$.data.product_order.payment_request_id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: reassign_matter
    description: "Reassign matter to the staff member to ensure message sender context"
    method: PUT
    path: "/business/clients/v1/matters/{{matter_uid}}/reassign"
    token: staff
    body:
      staff_uid: "{{staff_uid}}"
      reassign_future_meetings: false
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Send payment request link"
    method: POST
    path: "/business/payments/v1/payment_requests/{{payment_request_uid}}/send_link"
    token: staff
    body:
      channel: "email"
      channel_value: "test@example.com"
    expect:
      status: [201]
```
