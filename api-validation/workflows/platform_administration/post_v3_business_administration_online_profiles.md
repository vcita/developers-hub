---
endpoint: POST /v3/business_administration/online_profiles
domain: platform_administration
tags: []
status: skip
savedAt: 2026-01-23T21:50:26.185Z
verifiedAt: 2026-01-23T21:50:26.185Z
timesReused: 0
skipReason: Business already has an online profile (UID: u2p9a4kwxp8e4h3s) - each business can only have one. The endpoint is working correctly by rejecting duplicate creation and suggesting to use PUT to update the existing profile.
---
# Create Online profiles

## Summary
Skipped based on cached workflow - Business already has an online profile (UID: u2p9a4kwxp8e4h3s) - each business can only have one. The endpoint is working correctly by rejecting duplicate creation and suggesting to use PUT to update the existing profile.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

Business already has an online profile (UID: u2p9a4kwxp8e4h3s) - each business can only have one. The endpoint is working correctly by rejecting duplicate creation and suggesting to use PUT to update the existing profile.

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