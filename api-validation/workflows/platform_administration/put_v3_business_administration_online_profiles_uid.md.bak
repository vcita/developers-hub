---
endpoint: PUT /v3/business_administration/online_profiles/{uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-28T08:04:45.294Z
verifiedAt: 2026-01-28T08:04:45.294Z
timesReused: 0
---
# Update Online profiles

## Summary
Test passes after using valid online profile UID and ISO language codes. The original error was due to using placeholder 'test_string' instead of valid language codes like 'en', 'es'.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| uid | GET /v3/business_administration/online_profiles | data.online_profiles[0].uid | - | - |

### Resolution Steps

**uid**:
1. Call `GET /v3/business_administration/online_profiles`
2. Extract from response: `data.online_profiles[0].uid`

```json
{
  "uid": {
    "source_endpoint": "GET /v3/business_administration/online_profiles",
    "extract_from": "data.online_profiles[0].uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
{
  "method": "PUT",
  "path": "/v3/business_administration/online_profiles/{{resolved.uid}}",
  "body": {
    "supported_languages": [
      "en",
      "es"
    ],
    "privacy_policy_url": "https://example.com"
  }
}
```