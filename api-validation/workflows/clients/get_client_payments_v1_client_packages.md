---
endpoint: "GET /client/payments/v1/client_packages"
domain: clients
tags: []
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-26T05:22:28.017Z"
verifiedAt: "2026-01-26T05:22:28.017Z"
timesReused: 0
---

# Get Client packages

## Summary
Test passes when matter_uid parameter is included in query string. The endpoint requires matter_uid to function correctly, returning client packages for that matter. Without matter_uid, the endpoint returns 'Unauthorized' instead of the expected data.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_client_packages
    method: GET
    path: "/client/payments/v1/client_packages"
    expect:
      status: [200, 201]
```
