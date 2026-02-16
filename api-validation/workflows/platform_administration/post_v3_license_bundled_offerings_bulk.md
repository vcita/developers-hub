---
endpoint: "POST /v3/license/bundled_offerings/bulk"
domain: platform_administration
tags: [license, bulk]
status: skip
savedAt: 2026-02-09T22:09:29.050Z
verifiedAt: 2026-02-09T22:09:29.050Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Create Bulk

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
    description: "Create bulk"
    method: POST
    path: "/v3/license/bundled_offerings/bulk"
    expect:
      status: [200, 201]
```