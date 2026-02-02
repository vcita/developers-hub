---
endpoint: "GET /v3/license/directory_offerings"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-28T07:30:58.566Z
verifiedAt: 2026-01-28T07:30:58.566Z
---

# Get Directory offerings

## Summary
Test passes with admin token. Endpoint requires admin-level permissions to list directory offerings.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_directory_offerings
    method: GET
    path: "/v3/license/directory_offerings"
    expect:
      status: [200, 201]
```
