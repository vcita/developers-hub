---
endpoint: "GET /business/payments/v1/deposits"
domain: sales
tags: [deposits]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T14:44:39.415Z"
verifiedAt: "2026-02-06T20:52:00.000Z"
timesReused: 0
---

# Get Deposits

## Summary
Test passes successfully. The GET /business/payments/v1/deposits endpoint works correctly with an empty request body when using a business token. Returns a list of deposits with HTTP 200.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_deposits
    method: GET
    path: "/business/payments/v1/deposits"
    expect:
      status: [200, 201]
```
