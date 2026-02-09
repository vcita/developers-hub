---
endpoint: "GET /v3/communication/available_phone_numbers"
domain: communication
tags: [communication]
status: skip
savedAt: 2026-02-08T21:59:12.133Z
verifiedAt: 2026-02-08T21:59:12.133Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Get Available phone numbers

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
    description: "Get available_phone_numbers"
    method: GET
    path: "/v3/communication/available_phone_numbers"
    expect:
      status: [200, 201]
```