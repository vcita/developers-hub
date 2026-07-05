---
endpoint: "GET /v3/business_administration/directories"
domain: platform_administration
tags: [directories]
swagger: "swagger/platform_administration/directory.json"
status: verified
savedAt: "2026-02-10T00:00:00.000Z"
verifiedAt: "2026-02-10T00:00:00.000Z"
timesReused: 0
tokens: [admin]
---

# Get Directories

## Summary
Retrieves a filtered, paginated list of directories. **Token Type**: Requires an **admin token** for internal-level permissions.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_directories
    method: GET
    path: "/v3/business_administration/directories"
    token: admin
    expect:
      status: [200, 201]
```