---
endpoint: "PUT /v3/communication/business_phone_numbers/{uid}"
domain: communication
tags: [communication]
status: skip
savedAt: 2026-02-08T21:57:22.513Z
verifiedAt: 2026-02-08T21:57:22.513Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Update Business phone numbers

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
    description: "Update business_phone_numbers"
    method: PUT
    path: "/v3/communication/business_phone_numbers/{uid}"
    expect:
      status: [200, 201]
```