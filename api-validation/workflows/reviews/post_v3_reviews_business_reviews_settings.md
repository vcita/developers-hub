---
endpoint: POST /v3/reviews/business_reviews_settings
domain: reviews
tags: []
swagger: swagger/reviews/business_reviews_settings.json
status: success
savedAt: 2026-01-25T23:02:03.338Z
verifiedAt: 2026-01-25T23:02:03.338Z
timesReused: 0
---
# Create Business reviews settings

## Summary
POST /v3/reviews/business_reviews_settings works correctly. Returns HTTP 409 (Conflict) when trying to create settings for a business that already has reviews settings, as documented in the swagger description. The API properly enforces the uniqueness constraint per business.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_uid | Already provided in test configuration | config parameter | - | Business UIDs are provided by test configuration and should not be deleted |

### Resolution Steps

**business_uid**:
1. Call `Already provided in test configuration`
2. Extract from response: `config parameter`

```json
{
  "business_uid": {
    "source_endpoint": "Already provided in test configuration",
    "extract_from": "config parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Business UIDs are provided by test configuration and should not be deleted"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
null
```