---
endpoint: "PUT /business/clients/v1/matters/{uid}"
domain: clients
tags: []
swagger: swagger/clients/legacy/manage_clients.json
status: success
savedAt: 2026-01-26T05:33:48.499Z
verifiedAt: 2026-01-26T05:33:48.499Z
---

# Update Matters

## Summary
Successfully updated a Matter after resolving UID issues. Created a new matter and used an existing field UID for the update operation.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_matters
    method: PUT
    path: "/business/clients/v1/matters/{uid}"
    body:
      matter:
        fields:
          "0":
            uid: "{{uid}}"
            value: Updated Matter Name
    expect:
      status: [200, 201]
```
