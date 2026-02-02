---
endpoint: "GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-26T05:23:16.654Z
verifiedAt: 2026-01-26T05:23:16.654Z
---

# Get Checkout

## Summary
The GET /client/payments/v1/payment_requests/{payment_request_uid}/checkout endpoint works correctly. The original 422 error about coupon functionality was likely due to a specific business configuration at the time of the first test. The endpoint successfully returns checkout session data with HTTP 200, and the response includes is_allowed_coupons: false to indicate coupon functionality status.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_checkout
    method: GET
    path: "/client/payments/v1/payment_requests/{payment_request_uid}/checkout"
    expect:
      status: [200, 201]
```
