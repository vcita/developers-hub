---
endpoint: PUT /platform/v1/apps/{id}
domain: apps
tags: []
status: skip
savedAt: 2026-01-24T13:29:50.496Z
verifiedAt: 2026-01-24T13:29:50.496Z
timesReused: 0
skipReason: The PUT /platform/v1/apps/{id} endpoint requires admin-level authorization to update apps. Staff tokens receive an AuthorizationException when attempting to update apps, which is a business constraint that prevents non-admin users from managing the app marketplace.
---
# Update Apps

## Summary
Skipped based on cached workflow - The PUT /platform/v1/apps/{id} endpoint requires admin-level authorization to update apps. Staff tokens receive an AuthorizationException when attempting to update apps, which is a business constraint that prevents non-admin users from managing the app marketplace.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

The PUT /platform/v1/apps/{id} endpoint requires admin-level authorization to update apps. Staff tokens receive an AuthorizationException when attempting to update apps, which is a business constraint that prevents non-admin users from managing the app marketplace.

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