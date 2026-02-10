---
endpoint: POST /oauth/service/token
domain: apps
tags: []
status: success
savedAt: 2026-01-25T05:30:54.250Z
verifiedAt: 2026-01-25T05:30:54.250Z
timesReused: 0
---
# Create Token

## Summary
Test passed successfully after resolving OAuth credentials. The endpoint requires valid client_id and client_secret from an actual OAuth app, not test strings.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| service_id | GET /platform/v1/apps | data.client_id | ✓ POST /platform/v1/apps | OAuth apps are typically long-lived resources, no cleanup needed |

### Resolution Steps

**service_id**:
1. **Create fresh test entity**: `POST /platform/v1/apps`
   - Body template: `{"name":"OAuth Token Test App","app_code_name":"oauthtest{{timestamp}}","app_type":"internal","redirect_uri":"https://example.com/oauth/callback"}`
2. Extract UID from creation response: `data.client_id`
3. Run the test with this fresh UID
4. **Cleanup note**: OAuth apps are typically long-lived resources, no cleanup needed

```json
{
  "service_id": {
    "source_endpoint": "GET /platform/v1/apps",
    "extract_from": "data.client_id",
    "fallback_endpoint": "POST /platform/v1/apps",
    "create_fresh": true,
    "create_endpoint": "POST /platform/v1/apps",
    "create_body": {
      "name": "OAuth Token Test App",
      "app_code_name": "oauthtest{{timestamp}}",
      "app_type": "internal",
      "redirect_uri": "https://example.com/oauth/callback"
    },
    "cleanup_endpoint": null,
    "cleanup_note": "OAuth apps are typically long-lived resources, no cleanup needed"
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
  "path": "/oauth/service/token",
  "body": {
    "service_id": "{{resolved.service_id}}",
    "service_secret": "{{resolved.uid}}"
  }
}
```