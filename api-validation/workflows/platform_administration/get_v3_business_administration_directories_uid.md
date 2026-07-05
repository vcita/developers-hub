---
endpoint: "GET /v3/business_administration/directories/{uid}"
domain: platform_administration
tags: [directories]
swagger: "swagger/platform_administration/directory.json"
status: verified
savedAt: "2026-02-10T00:00:00.000Z"
verifiedAt: "2026-02-10T00:00:00.000Z"
timesReused: 0
tokens: [admin]
---

# Get Directory by UID

## Summary
Retrieves details of a specific directory by its unique identifier. **Token Type**: Requires an **admin token** for internal-level permissions.

## Prerequisites

```yaml
steps:
  - id: get_directories
    description: "Fetch directories to get a valid UID"
    method: GET
    path: "/v3/business_administration/directories"
    token: admin
    params:
      per_page: "1"
    extract:
      directory_uid: "$.data[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_directory
    method: GET
    path: "/v3/business_administration/directories/{{directory_uid}}"
    token: admin
    expect:
      status: [200, 201]
```