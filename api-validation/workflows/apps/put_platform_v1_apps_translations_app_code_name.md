---
endpoint: PUT /platform/v1/apps/translations/{app_code_name}
domain: apps
tags: []
status: skip
savedAt: 2026-01-24T13:30:14.335Z
verifiedAt: 2026-01-24T13:30:14.335Z
timesReused: 0
skipReason: This endpoint is for app developers/publishers only. It requires: 1) The app to exist and be owned by the requester's directory, 2) Admin-level authorization to update app translations, 3) The directory_id of the app must match the requester's directory. This is not intended for end-user business operations but for app marketplace management.
---
# Update Translations

## Summary
Skipped based on cached workflow - This endpoint is for app developers/publishers only. It requires: 1) The app to exist and be owned by the requester's directory, 2) Admin-level authorization to update app translations, 3) The directory_id of the app must match the requester's directory. This is not intended for end-user business operations but for app marketplace management.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint is for app developers/publishers only. It requires: 1) The app to exist and be owned by the requester's directory, 2) Admin-level authorization to update app translations, 3) The directory_id of the app must match the requester's directory. This is not intended for end-user business operations but for app marketplace management.

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