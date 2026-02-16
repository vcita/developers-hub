---
endpoint: PUT /business/accounts/v1/identities
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-29T08:08:29.450Z
verifiedAt: 2026-01-29T08:08:29.450Z
timesReused: 0
---
# Update Identities

## Summary
Endpoint works correctly once proper authentication and valid identity UIDs are used. Initial 401 error was due to missing directory token and on-behalf-of header. The "Content manager identity is missing" errors were due to using invalid identity UIDs.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| identity_uid | GET /directory/v1/identities | data.identities array - use any non-default identity UID | - | No cleanup needed - identities are directory-level resources |

### Resolution Steps

**identity_uid**:
1. Call `GET /directory/v1/identities`
2. Extract from response: `data.identities array - use any non-default identity UID`

```json
{
  "identity_uid": {
    "source_endpoint": "GET /directory/v1/identities",
    "extract_from": "data.identities array - use any non-default identity UID",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": "No cleanup needed - identities are directory-level resources"
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
  "path": "/business/accounts/v1/identities",
  "body": {
    "business": {
      "execute_verti": true,
      "identities": [
        "{{resolved.uid}}"
      ]
    }
  }
}
```