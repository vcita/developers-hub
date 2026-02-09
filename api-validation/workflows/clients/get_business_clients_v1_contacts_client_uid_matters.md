---
endpoint: "GET /business/clients/v1/contacts/{client_uid}/matters"
domain: clients
tags: [matters]
swagger: swagger/clients/legacy/manage_clients.json
status: pending
savedAt: 2026-02-07T07:00:00.000Z
timesReused: 0
useFallbackApi: true
tokens: [staff]
---
# Get Contact Matters

## Summary

Lists matters for a specific client contact. This endpoint is routed via the fallback API.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "List matters for the configured client"
    method: GET
    path: "/business/clients/v1/contacts/{{config.params.client_uid}}/matters"
    params:
      per_page: "1"
    expect:
      status: [200, 201]
```
