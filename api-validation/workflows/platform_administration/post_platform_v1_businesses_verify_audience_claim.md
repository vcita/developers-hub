---
endpoint: "POST /platform/v1/businesses/verify_audience_claim"
domain: platform_administration
tags: [businesses]
swagger: "swagger/platform_administration/legacy/legacy_v1_platform.json"
status: skipped
savedAt: "2026-01-29T08:16:57.062Z"
verifiedAt: "2026-01-29T08:16:57.062Z"
timesReused: 0
---

# Create Businesses

## Summary
User-approved skip: This endpoint requires partners to pre-load audience data via CSV upload or Audiences API (operator-level functionality). The test directory has no pre-loaded audience records, so any unique_validation_identifier will return 'Audience not found'. This is expected behavior, not a bug. Testing this endpoint would require either: 1) Access to operator-level audience management APIs to create test data, or 2) Pre-seeded test audience data for the test directory.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_verify_audience_claim
    method: POST
    path: "/platform/v1/businesses/verify_audience_claim"
    expect:
      status: [200, 201]
```
