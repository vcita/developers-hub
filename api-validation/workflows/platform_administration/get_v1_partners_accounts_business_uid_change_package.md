---
endpoint: "GET /v1/partners/accounts/{business_uid}/change_package"
domain: platform_administration
tags: [partners, change-package]
status: skip
savedAt: 2026-02-10T15:54:09.367Z
verifiedAt: 2026-02-10T15:54:09.367Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Get Change package

## Summary

User-approved skip: Manual skip - endpoint not ready for testing

## Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Manual skip - endpoint not ready for testing

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get change_package"
    method: GET
    path: "/v1/partners/accounts/{business_uid}/change_package"
    expect:
      status: [200, 201]
```