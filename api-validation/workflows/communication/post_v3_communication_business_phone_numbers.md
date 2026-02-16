---
endpoint: "POST /v3/communication/business_phone_numbers"
domain: communication
tags: [communication]
status: skip
savedAt: 2026-02-08T21:58:59.808Z
verifiedAt: 2026-02-08T21:58:59.808Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Create Business phone numbers

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
    description: "Create business_phone_numbers"
    method: POST
    path: "/v3/communication/business_phone_numbers"
    expect:
      status: [200, 201]
```