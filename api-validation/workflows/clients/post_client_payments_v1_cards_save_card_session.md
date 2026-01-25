---
endpoint: POST /client/payments/v1/cards/save_card_session
domain: clients
tags: [cards]
status: skip
savedAt: 2026-01-25T19:41:04.333Z
verifiedAt: 2026-01-25T19:41:04.333Z
timesReused: 0
skipReason: This endpoint requires the 'cp_add_new_cof' (Client Portal add new Card on File) feature flag to be enabled on the business. This feature is likely part of a paid plan or special configuration. In a testing environment, it would require administrative privileges to enable this feature flag, which is beyond the scope of normal API testing.
---
# Create Save card session

## Summary
User-approved skip: This endpoint requires the 'cp_add_new_cof' (Client Portal add new Card on File) feature flag to be enabled on the business. This feature is likely part of a paid plan or special configuration. In a testing environment, it would require administrative privileges to enable this feature flag, which is beyond the scope of normal API testing.

## ⚠️ Skip Reason

**This endpoint should be SKIPPED in automated testing.**

This endpoint requires the 'cp_add_new_cof' (Client Portal add new Card on File) feature flag to be enabled on the business. This feature is likely part of a paid plan or special configuration. In a testing environment, it would require administrative privileges to enable this feature flag, which is beyond the scope of normal API testing.

This is typically due to a business constraint where the endpoint works correctly but cannot be tested repeatedly (e.g., one-time operations, unique constraints).

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/client/payments/v1/cards/save_card_session"
}
```