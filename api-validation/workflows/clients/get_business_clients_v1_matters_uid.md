---
endpoint: "GET /business/clients/v1/matters/{uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-26T05:28:51.365Z
verifiedAt: 2026-01-26T05:28:51.365Z
---

# Get Matters

## Summary
Successfully retrieved matter details using a valid matter UID. The original configured UID was invalid/non-existent, but using an existing matter UID (srwoxbmlnlrpadbj) from GET /business/clients/v1/contacts/{client_uid}/matters returned a complete matter object with all expected fields.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_matters
    method: GET
    path: "/business/clients/v1/matters/{uid}"
    expect:
      status: [200, 201]
```
