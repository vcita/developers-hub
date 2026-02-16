---
endpoint: POST /platform/v1/tokens
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
timesReused: 0
---
# Create Token

## Summary
Creates an authentication token for a business, application, or directory. At least one identifier must be provided. The created token can be used for API authentication or revoked using the `/tokens/revoke` endpoint.

## Prerequisites
Requires a valid `business_id`, `app_id`, or `directory_id` that the authenticated token has access to.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| business_id | Config | config.business_id | - | None - business already exists |

### Resolution Steps

**business_id**:
1. Use the pre-configured `config.business_id` value
2. Or call `GET /platform/v1/businesses` to retrieve available businesses

## How to Resolve Parameters
Parameters can be obtained from config or via API calls.

## Critical Learnings
- At least one of `business_id`, `app_id`, or `directory_id` must be provided
- The token returned in `data.token` is the actual token string to use for authentication
- Tokens created can be revoked via `POST /platform/v1/tokens/revoke`

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/platform/v1/tokens",
  "body": {
    "business_id": "{{config.business_id}}"
  }
}
```

## Expected Response

```json
{
  "status": "OK",
  "data": {
    "token": "abc123def456ghi789...",
    "expires_in": null,
    "token_object_id": 12345,
    "token_object_type": "user",
    "scopes": ["user"],
    "application_id": 67890
  }
}
```
