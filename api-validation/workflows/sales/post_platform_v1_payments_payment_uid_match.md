---
endpoint: "POST /platform/v1/payments/{payment_uid}/match"
domain: sales
tags: [payments, matching, payment-requests]
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-27T04:26:01.284Z"
verifiedAt: "2026-02-08T09:17:30.000Z"
timesReused: 1
useFallbackApi: true
tokens: [staff]
---

# Match Payment

## Summary

Matches a payment to a payment request (payment status). The payment and payment request must belong to the same matter and have matching currencies. The payment request must be in `pending` state and be due or overdue, and the payment amount must be ≤ the payment request amount.

To ensure reliability, we create a fresh payment request via a product order (which is immediately due on receipt) rather than searching for existing overdue payment requests.

**Token Type**: This endpoint requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Response Codes

| Status | Meaning |
|--------|---------|
| 201 | Success - Payment matched to payment request |
| 400 | Bad Request - Missing required parameters |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

## Prerequisites

```yaml
steps:
  - id: get_products
    description: "Fetch products to obtain a product ID for creating a payment request"
    method: GET
    path: "/business/payments/v1/products"
    token: staff
    extract:
      product_id: "$.data.products[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: create_product_order
    description: "Create a product order which generates a pending payment request that is due on receipt"
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
      payment_status_uid: "$.data.product_order.payment_request_id"
    expect:
      status: [200, 201]
    onFail: abort

  - id: create_unmatched_payment
    description: "Create an unmatched payment with amount matching the product order price on the same matter"
    method: POST
    path: "/platform/v1/payments"
    token: staff
    body:
      amount: 1
      client_id: "{{client_id}}"
      conversation_id: "{{matter_uid}}"
      currency: "USD"
      payment_method: "Cash"
      title: "Test Payment for Matching"
      offline: true
    extract:
      payment_uid: "$.data.payment.payment_id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Match a payment to a payment status"
    method: POST
    path: "/platform/v1/payments/{{payment_uid}}/match"
    token: staff
    useFallbackApi: true
    body:
      payment_status_uid: "{{payment_status_uid}}"
      matter_uid: "{{matter_uid}}"
    expect:
      status: [201]
```