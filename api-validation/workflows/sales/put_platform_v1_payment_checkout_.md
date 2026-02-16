---
endpoint: "PUT /platform/v1/payment/checkout/"
domain: sales
tags: [payment]
status: skip
savedAt: 2026-02-08T15:33:28.032Z
verifiedAt: 2026-02-08T15:33:28.032Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Update Checkout

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
    description: "Update checkout"
    method: PUT
    path: "/platform/v1/payment/checkout/"
    expect:
      status: [200, 201]
```