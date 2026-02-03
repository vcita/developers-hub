---
endpoint: "GET /platform/v1/businesses/{business_uid}/recurly_data"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/legacy/legacy_v1_platform.json
status: success
savedAt: 2026-01-27T09:23:20.187Z
verifiedAt: 2026-01-27T09:23:20.187Z
---

# Get Recurly data

## Summary
Test passes after creating the required 'recurlybilling' app with billing_app type and acquiring the proper OAuth app token. The endpoint successfully returns Recurly account data including account codes and legal information.

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
