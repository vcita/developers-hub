---
endpoint: "GET /platform/v1/businesses"
domain: platform_administration
tags: []
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: verified
savedAt: "2026-01-31T00:00:00.000Z"
verifiedAt: "2026-01-31T00:00:00.000Z"
timesReused: 0
---

# Get Businesses

## Summary
Searches for businesses using filter parameters. This endpoint requires at least one filter query parameter: `email`, `external_id`, or `external_reference_id`. To test successfully, first retrieve the admin email from a known business using the business_uid from config.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_businesses
    method: GET
    path: "/platform/v1/businesses"
    expect:
      status: [200, 201]
```
