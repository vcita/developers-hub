---
endpoint: "GET /platform/v1/businesses/{business_uid}/wizards"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-27T09:24:23.044Z
verifiedAt: 2026-01-27T09:24:23.044Z
---

# Get Wizards

## Summary
Test passes with HTTP 200. Required directory token authentication - staff token was insufficient.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_wizards
    method: GET
    path: "/platform/v1/businesses/{business_uid}/wizards"
    expect:
      status: [200, 201]
```
