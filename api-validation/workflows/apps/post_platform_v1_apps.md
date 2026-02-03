---
endpoint: "POST /platform/v1/apps"
domain: apps
tags: []
swagger: swagger/apps/legacy/legacy_v1_apps.json
status: success
savedAt: 2026-01-24T22:42:07.630Z
verifiedAt: 2026-01-24T22:42:07.630Z
---

# Create Apps

## Summary
The POST /platform/v1/apps endpoint works correctly. The original test failed because it used invalid scope values. When using valid scopes like 'openid' or omitting scopes entirely, the endpoint returns 201 with proper app creation response including client_id and client_secret.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_apps
    method: POST
    path: "/platform/v1/apps"
    body:
      name: Test App With OpenID
      redirect_uri: https://example.com/callback
      scopes:
        "0": openid
    expect:
      status: [200, 201]
```
