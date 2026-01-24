---
endpoint: POST /business/scheduling/v1/time_slots
domain: scheduling
tags: []
status: skip
savedAt: 2026-01-23T22:18:41.747Z
verifiedAt: 2026-01-23T22:18:41.747Z
timesReused: 0
skipReason: Staff member has no weekly availability record created - the API requires weekly_availability_uid parameter to be a valid UID of an existing WeeklyAvailability that belongs to the authenticated staff member. Without this prerequisite record, the endpoint correctly returns 401 Unauthorized as it cannot authorize the action on a null/nonexistent weekly availability.
---
# Create Time slots

## Summary
Skipped based on cached workflow - Staff member has no weekly availability record created - the API requires weekly_availability_uid parameter to be a valid UID of an existing WeeklyAvailability that belongs to the authenticated staff member. Without this prerequisite record, the endpoint correctly returns 401 Unauthorized as it cannot authorize the action on a null/nonexistent weekly availability.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Staff member has no weekly availability record created - the API requires weekly_availability_uid parameter to be a valid UID of an existing WeeklyAvailability that belongs to the authenticated staff member. Without this prerequisite record, the endpoint correctly returns 401 Unauthorized as it cannot authorize the action on a null/nonexistent weekly availability.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
null
```

## Documentation Fix Suggestions

No documentation issues found.