---
endpoint: "GET /v3/license/directory_offerings/{uid}"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-01-29T09:06:49.080Z"
verifiedAt: "2026-01-29T09:06:49.080Z"
timesReused: 0
---

# Get Directory Offering

## Summary
Retrieves a specific directory offering by UID. **Token Type**: Requires an **admin token**.

## Prerequisites

```yaml
steps:
  - id: get_directory_offerings_list
    description: "Fetch directory offerings to get a valid UID"
    method: GET
    path: "/v3/license/directory_offerings"
    token: admin
    extract:
      directory_offering_uid: "$.data.directory_offerings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/license/directory_offerings/{{directory_offering_uid}}"
    token: admin
    expect:
      status: 200
```