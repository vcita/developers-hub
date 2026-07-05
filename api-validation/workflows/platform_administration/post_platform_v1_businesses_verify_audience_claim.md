---
endpoint: "POST /platform/v1/businesses/verify_audience_claim"
domain: platform_administration
tags: [businesses]
status: skip
savedAt: 2026-02-09T23:55:08.996Z
verifiedAt: 2026-02-09T23:55:08.996Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Create Verify audience claim

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
    description: "Create verify_audience_claim"
    method: POST
    path: "/platform/v1/businesses/verify_audience_claim"
    expect:
      status: [200, 201]
```