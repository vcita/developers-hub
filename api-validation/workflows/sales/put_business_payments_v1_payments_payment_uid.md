---
endpoint: "PUT /business/payments/v1/payments/{payment_uid}"
domain: sales
tags: [payments]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-02-08T22:28:33.765Z"
verifiedAt: "2026-02-08T22:28:33.765Z"
timesReused: 0
useFallbackApi: true
tokens: [staff]
---

# Update Payment

## Summary

Updates a payment by its UID. Only fields appropriate for the payment's current state can be updated (e.g., you cannot update amount on a paid payment). The endpoint works via the fallback API; APIGW returns 401.

**Token Type**: This endpoint requires a **Staff token** (via fallback API).

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens.

## Prerequisites

```yaml
steps:
  - id: get_existing_payment
    description: "Fetch an existing payment to update"
    method: GET
    path: "/business/payments/v1/payments"
    token: staff
    params:
      per_page: "1"
    extract:
      payment_uid: "$.data.payments[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_payment
    method: PUT
    path: "/business/payments/v1/payments/{{payment_uid}}"
    token: staff
    body:
      payment:
        reference: "Updated reference"
    expect:
      status: [200]
```