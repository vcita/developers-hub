---
endpoint: "POST /oauth/token"
domain: platform_administration
tags: [oauth, requires-manual-testing]
swagger: swagger/platform_administration/legacy/oauth.json
status: skip
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
---

# Create Token

## Summary
This endpoint exchanges an OAuth Authorization Code for an Access Token. It implements the OAuth 2.0 Authorization Code flow and **cannot be tested in isolation** because obtaining an authorization code requires interactive user authorization through a browser.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_token
    method: POST
    path: "/oauth/token"
    body:
      grant_type: authorization_code
      client_id: "{{app.client_id}}"
      client_secret: "{{app.client_secret}}"
      code: "{{authorization_code_from_user_flow}}"
      redirect_uri: https://myapp.example.com/oauth/callback
    expect:
      status: [200, 201]
```
