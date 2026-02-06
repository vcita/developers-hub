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

# Get Directory offerings

## Summary
Test passes. The original UID didn't exist, so I resolved it by fetching a valid UID from the list endpoint. The endpoint works correctly with admin token as documented.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_directory_offerings
    method: GET
    path: "/v3/license/directory_offerings/{{uid}}"
    expect:
      status: [200, 201]
```
