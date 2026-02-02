---
endpoint: "GET /business/payments/v1/payment_requests"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:02:43.057Z
verifiedAt: 2026-01-26T22:02:43.057Z
---

# Get Payment requests

## Summary
Test passes successfully. The original HTTP 500 error was due to authentication issues. When using the correct business token, the endpoint returns a list of payment requests with valid data structure.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_payment_requests
    method: GET
    path: "/business/payments/v1/payment_requests"
    expect:
      status: [200, 201]
```
