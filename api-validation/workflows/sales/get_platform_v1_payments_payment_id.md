---
endpoint: "GET /platform/v1/payments/{payment_id}"
domain: sales
tags: []
status: success
savedAt: 2026-01-26T06:38:54.155Z
verifiedAt: 2026-01-26T06:38:54.155Z
---

# Get Payments

## Summary
Test passes successfully. The GET /platform/v1/payments/{payment_id} endpoint returned payment details with HTTP 201 status code.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_payments
    method: GET
    path: "/platform/v1/payments/{payment_id}"
    expect:
      status: [200, 201]
```
