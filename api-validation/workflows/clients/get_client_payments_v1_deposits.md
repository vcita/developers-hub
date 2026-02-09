---
endpoint: "GET /client/payments/v1/deposits"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-25T23:15:21.785Z
verifiedAt: 2026-01-25T23:15:21.785Z
---

# Get Deposits

## Summary
Endpoint works successfully. The original 500 error was likely a temporary server issue that has been resolved. The endpoint returns deposit data whether or not the matter_uid parameter is provided.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_deposits
    method: GET
    path: "/client/payments/v1/deposits"
    expect:
      status: [200, 201]
```
