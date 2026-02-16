---
endpoint: "POST /platform/v1/numbers/twilio"
domain: communication
tags: [numbers]
status: skip
savedAt: 2026-02-09T06:50:26.235Z
verifiedAt: 2026-02-09T06:50:26.235Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Create Twilio

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
    description: "Create twilio"
    method: POST
    path: "/platform/v1/numbers/twilio"
    expect:
      status: [200, 201]
```