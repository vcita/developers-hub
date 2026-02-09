---
endpoint: "POST /business/clients/v1/apps/{app_code_name}/import"
domain: clients
tags: [apps, import]
swagger: swagger/clients/legacy/manage_clients.json
status: skip
savedAt: 2026-01-31T18:01:19.752Z
verifiedAt: 2026-01-31T18:01:19.752Z
---

# Create Import

## Summary
User-approved skip: Manual skip - endpoint not ready for testing

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_import
    method: POST
    path: "/business/clients/v1/apps/{app_code_name}/import"
    expect:
      status: [200, 201]
```
