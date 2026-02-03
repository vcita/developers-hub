---
endpoint: "GET /v3/license/offerings"
domain: platform_administration
tags: [license, offerings]
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-28T07:31:54.815Z
verifiedAt: 2026-01-28T07:31:54.815Z
---

# Get Offerings

## Summary
Test passes. The endpoint works correctly when called without invalid query parameters. The original error was caused by passing 'directory_uid' instead of the correct 'directory_id' parameter.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_offerings
    method: GET
    path: "/v3/license/offerings"
    expect:
      status: [200, 201]
```
