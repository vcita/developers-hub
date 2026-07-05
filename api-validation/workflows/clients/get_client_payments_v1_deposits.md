---
endpoint: "GET /client/payments/v1/deposits"
domain: clients
tags: []
swagger: "swagger/clients/legacy/clients_payments.json"
status: verified
savedAt: "2026-01-25T23:15:21.785Z"
verifiedAt: "2026-01-25T23:15:21.785Z"
timesReused: 0
useFallbackApi: true
tokens: [client]
---

# Get Deposits

## Summary
Endpoint works successfully. Lists all deposits for the authenticated client. Returns deposit data whether or not the matter_uid parameter is provided.

**Token Type**: This endpoint requires a **Client token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

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
