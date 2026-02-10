---
endpoint: "GET /v3/license/offerings/{uid}"
domain: platform_administration
tags: [license, offerings]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: 2026-01-30T23:07:12.000Z
verifiedAt: 2026-01-30T23:07:12.000Z
timesReused: 0
---

# Get License Offering by UID

## Summary
Retrieves a specific license offering by UID. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_offerings_list
    description: "Fetch license offerings to get a valid UID"
    method: GET
    path: "/v3/license/offerings"
    extract:
      offering_uid: "$.data.offerings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    method: GET
    path: "/v3/license/offerings/{{offering_uid}}"
    expect:
      status: 200
```