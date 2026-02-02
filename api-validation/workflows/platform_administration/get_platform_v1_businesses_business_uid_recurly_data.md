---
endpoint: "GET /platform/v1/businesses/{business_uid}/recurly_data"
domain: platform_administration
tags: [businesses, recurly-data]
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: skip
savedAt: 2026-01-30T07:24:35.659Z
verifiedAt: 2026-01-30T07:24:35.659Z
---

# Get Recurly data

## Summary
User-approved skip: Endpoint is intentionally internal-only and requires a specific recurlybilling app OAuth token that is not available to the test runner; cannot obtain/impersonate the recurlybilling token via public APIs.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_recurly_data
    method: GET
    path: "/platform/v1/businesses/{business_uid}/recurly_data"
    expect:
      status: [200, 201]
```
