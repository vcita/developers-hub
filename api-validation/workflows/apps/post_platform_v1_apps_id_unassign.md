---
endpoint: POST /platform/v1/apps/{id}/unassign
domain: apps
tags: []
status: skip
savedAt: 2026-01-24T13:30:36.890Z
verifiedAt: 2026-01-24T13:30:36.890Z
timesReused: 0
skipReason: App can only be unassigned by the directory that created it. Test apps in the system were not created by our test directory, so unassign operations are correctly rejected for security reasons
---
# Create Unassign

## Summary
Skipped based on cached workflow - App can only be unassigned by the directory that created it. Test apps in the system were not created by our test directory, so unassign operations are correctly rejected for security reasons

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

App can only be unassigned by the directory that created it. Test apps in the system were not created by our test directory, so unassign operations are correctly rejected for security reasons

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