---
endpoint: "POST /oauth/service/token"
domain: apps
tags: [oauth]
swagger: "swagger/apps/legacy/legacy_token.json"
status: verified
savedAt: "2026-01-30T19:16:12.398Z"
verifiedAt: "2026-01-30T19:16:12.398Z"
timesReused: 0
---

# Generate App Access Token

## Summary
This endpoint generates an app access token using OAuth client credentials flow. **Token Type**: **No bearer token required** - authentication is via service_id and service_secret in the request body.

## Prerequisites

```yaml
steps:
  - id: create_oauth_app
    description: "Create an OAuth app to get client credentials"
    method: POST
    path: "/platform/v1/apps"
    token: directory
    body:
      name: "Test OAuth App {{now_timestamp}}"
      redirect_uri: "https://example.com/callback"
      app_type:
        - widgets
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
  - id: generate_service_token
    method: POST
    path: "/oauth/service/token"
    body:
      service_id: "{{client_id}}"
      service_secret: "{{client_secret}}"
    expect:
      status: [200, 201]
```