---
endpoint: POST /platform/v1/businesses/{business_uid}
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:54:45.682Z
verifiedAt: 2026-01-29T08:54:45.682Z
timesReused: 0
---
# Create Businesses

## Summary
Endpoint works correctly with directory token. The original failure was due to using staff token which lacks sufficient permissions. Found validation issues with email reuse and business category values.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| directory_token | Available in test environment | Use token_type='directory' parameter | - | Directory token is reusable and doesn't require cleanup |

### Resolution Steps

**directory_token**:
1. Call `Available in test environment`
2. Extract from response: `Use token_type='directory' parameter`

```json
{
  "directory_token": {
    "source_endpoint": "Available in test environment",
    "extract_from": "Use token_type='directory' parameter",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "Directory token is reusable and doesn't require cleanup"
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
  "method": "POST",
  "path": "/platform/v1/businesses/{{resolved.uid}}",
  "body": {
    "business": {
      "business": {
        "name": "Smith Legal Associates Updated"
      }
    }
  }
}
```