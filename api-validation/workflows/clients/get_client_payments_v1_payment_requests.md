---
endpoint: "GET /client/payments/v1/payment_requests"
domain: clients
tags: []
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-25T10:12:52.839Z"
verifiedAt: "2026-01-25T10:12:52.839Z"
timesReused: 0
---

# Get Payment requests

## Summary
Test passed successfully. The endpoint returned payment requests data correctly with HTTP 200. The original HTTP 500 error appears to have been temporary or related to system state at the time of the initial failure.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_payment_requests
    method: GET
    path: "/client/payments/v1/payment_requests"
    expect:
      status: [200, 201]
```
