---
endpoint: "GET /platform/v1/businesses/{business_uid}/features"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-27T09:21:44.001Z"
verifiedAt: "2026-01-27T09:21:44.001Z"
timesReused: 0
---

# Get Features

## Summary
Test passes with directory token. Returns comprehensive list of business features enabled for the business.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_features
    method: GET
    path: "/platform/v1/businesses/{{business_uid}}/features"
    expect:
      status: [200, 201]
```
