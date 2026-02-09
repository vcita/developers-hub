---
endpoint: "PUT /platform/v1/numbers/dedicated_numbers/set_two_way_texting_status"
domain: communication
tags: [numbers, set-two-way-texting-status]
status: skip
savedAt: 2026-02-09T07:02:23.996Z
verifiedAt: 2026-02-09T07:02:23.996Z
timesReused: 0
skipReason: "Manual skip - endpoint not ready for testing"
---
# Update Set two way texting status

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
    description: "Update set_two_way_texting_status"
    method: PUT
    path: "/platform/v1/numbers/dedicated_numbers/set_two_way_texting_status"
    expect:
      status: [200, 201]
```