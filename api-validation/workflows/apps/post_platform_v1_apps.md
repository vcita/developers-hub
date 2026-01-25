---
endpoint: POST /platform/v1/apps
domain: apps
tags: []
status: success
savedAt: 2026-01-24T22:42:07.630Z
verifiedAt: 2026-01-24T22:42:07.630Z
timesReused: 0
---
# Create Apps

## Summary
The POST /platform/v1/apps endpoint works correctly. The original test failed because it used invalid scope values. When using valid scopes like 'openid' or omitting scopes entirely, the endpoint returns 201 with proper app creation response including client_id and client_secret.

## Prerequisites
No specific prerequisites documented.

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "POST",
  "path": "/platform/v1/apps",
  "body": {
    "name": "Test App With OpenID",
    "redirect_uri": "https://example.com/callback",
    "scopes": [
      "openid"
    ]
  }
}
```