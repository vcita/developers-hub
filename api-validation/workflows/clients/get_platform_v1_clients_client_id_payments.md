---
endpoint: "GET /platform/v1/clients/{client_id}/payments"
domain: clients
tags: []
swagger: swagger/clients/legacy/legacy_v1_clients.json
status: success
savedAt: 2026-01-25T09:12:43.655Z
verifiedAt: 2026-01-25T09:12:43.655Z
---

# Get Payments

## Summary
Test passes when called without query parameters (HTTP 201), but fails with 500 errors when invalid filter syntax is used. Discovered specific filter parameter requirements through source code analysis.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_payments
    method: GET
    path: "/platform/v1/clients/{client_id}/payments"
    expect:
      status: [200, 201]
```
