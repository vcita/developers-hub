---
endpoint: "POST /v1/partners/accounts/{business_uid}/close"
domain: platform_administration
tags: [partners, close]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: skipped
savedAt: "2026-01-28T15:36:02.150Z"
verifiedAt: "2026-01-28T15:36:02.150Z"
timesReused: 0
---

# Create Close

## Summary
User-approved skip: The endpoint POST /v1/partners/accounts/{business_id}/close returns 404 Not Found, and source code investigation reveals no implementation of the v1/partners API namespace in the core repository. The entire v1/partners API appears to be undocumented or not implemented in the current environment, making this test unworkable until the API is properly deployed.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_close
    method: POST
    path: "/v1/partners/accounts/{{business_uid}}/close"
    expect:
      status: [200, 201]
```
