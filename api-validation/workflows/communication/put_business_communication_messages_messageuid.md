---
endpoint: "PUT /business/communication/messages/{messageUid}"
domain: communication
tags: [messages]
status: skip
savedAt: 2026-02-09T07:04:00.529Z
verifiedAt: 2026-02-09T07:04:00.529Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Update Messages

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
    description: "Update messages"
    method: PUT
    path: "/business/communication/messages/{messageUid}"
    expect:
      status: [200, 201]
```