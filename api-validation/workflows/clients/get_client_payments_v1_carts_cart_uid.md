---
endpoint: "GET /client/payments/v1/carts/{cart_uid}?matter_uid={matter_uid}"
domain: clients
tags: []
swagger: /Users/ram.almog/Documents/GitHub/developers-hub/mcp_swagger/clients.json
status: success
savedAt: 2026-02-06T07:56:33.876Z
verifiedAt: 2026-02-06T07:56:33.876Z
timesReused: 0
---
# Get Carts

## Summary

GET /client/payments/v1/carts/{uid}?matter_uid=... succeeded (200) after resolving a valid cart_uid by creating a cart from an existing invoice. Initial failure stemmed from missing/invalid path/query params in the test request.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get carts"
    method: GET
    path: "/client/payments/v1/carts/gm44v0zblmjbkum7?matter_uid=t1wszezxa4ahym73"
    expect:
      status: [200, 201]
```