---
endpoint: "POST /oauth/token"
domain: platform_administration
tags: [oauth]
swagger: "swagger/platform_administration/legacy/oauth.json"
status: verified
savedAt: 2026-01-30T15:17:12.398Z
verifiedAt: 2026-01-30T15:17:12.398Z
timesReused: 0
---

# Create OAuth Token

## Summary
This endpoint exchanges OAuth client credentials for an Access Token using the client_credentials grant type. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: create_oauth_app
    description: "Create an OAuth app to get client credentials"
    method: POST
    path: "/platform/v1/apps"
    body:
      name: "Test OAuth App {{now_timestamp}}"
      redirect_uri: "https://example.com/callback"
      scopes:
        "0": "openid"
    extract:
      client_id: "$.data.client_id"
      client_secret: "$.data.client_secret"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_oauth_token
    method: POST
    path: "/oauth/token"
    body:
      grant_type: "client_credentials"
      client_id: "{{client_id}}"
      client_secret: "{{client_secret}}"
    expect:
      status: [200, 201]
```