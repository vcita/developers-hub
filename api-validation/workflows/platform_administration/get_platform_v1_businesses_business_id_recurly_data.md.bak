---
endpoint: GET /platform/v1/businesses/{business_uid}/recurly_data
domain: platform_administration
tags: []
status: success
savedAt: 2026-01-27T09:23:20.187Z
verifiedAt: 2026-01-27T09:23:20.187Z
timesReused: 0
---
# Get Recurly data

## Summary
Test passes after creating the required 'recurlybilling' app with billing_app type and acquiring the proper OAuth app token. The endpoint successfully returns Recurly account data including account codes and legal information.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| recurlybilling_app | - | data.client_id and data.client_secret | - | App created for billing integration - should be kept for subsequent Recurly-related tests |
| app_oauth_token | OAuth via acquire_token(action='app_oauth') | OAuth flow using client_id/client_secret from recurlybilling app | - | - |

### Resolution Steps

**recurlybilling_app**:
1. **Create fresh test entity**: `POST /platform/v1/apps`
   - Body template: `{"app_type":"billing_app","redirect_uri":"https://www.recurly.com/callback","name":"recurlybilling","app_code_name":"recurlybilling"}`
2. Extract UID from creation response: `data.client_id and data.client_secret`
3. Run the test with this fresh UID
4. **Cleanup note**: App created for billing integration - should be kept for subsequent Recurly-related tests

**app_oauth_token**:
1. Call `OAuth via acquire_token(action='app_oauth')`
2. Extract from response: `OAuth flow using client_id/client_secret from recurlybilling app`

```json
{
  "recurlybilling_app": {
    "source_endpoint": null,
    "extract_from": "data.client_id and data.client_secret",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /platform/v1/apps",
    "create_body": {
      "app_type": "billing_app",
      "redirect_uri": "https://www.recurly.com/callback",
      "name": "recurlybilling",
      "app_code_name": "recurlybilling"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "App created for billing integration - should be kept for subsequent Recurly-related tests"
  },
  "app_oauth_token": {
    "source_endpoint": "OAuth via acquire_token(action='app_oauth')",
    "extract_from": "OAuth flow using client_id/client_secret from recurlybilling app",
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
  "method": "GET",
  "path": "/platform/v1/businesses/{{resolved.uid}}/recurly_data"
}
```