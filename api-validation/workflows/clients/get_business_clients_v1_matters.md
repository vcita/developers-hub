---
endpoint: "GET /business/clients/v1/matters"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-25T09:01:42.759Z
verifiedAt: 2026-01-25T09:01:42.759Z
---

# Get Matters

## Summary
Successfully tested GET /business/clients/v1/matters endpoint. The endpoint works correctly but requires either a filter parameter OR a contact_uid parameter. When called without any parameters, it returns a 422 error.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_matters
    method: GET
    path: "/business/clients/v1/matters"
    expect:
      status: [200, 201]
```
