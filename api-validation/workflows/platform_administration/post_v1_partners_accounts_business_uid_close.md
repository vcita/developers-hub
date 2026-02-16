---
endpoint: "POST /v1/partners/accounts/{business_uid}/close"
domain: platform_administration
tags: [partners, close]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pending
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: null
timesReused: 0
tokens: [directory]
expectedOutcome: 422
expectedOutcomeReason: "Closing an account is a destructive operation (terminates subscription and blocks account). Cannot safely test in shared environment. The endpoint works — verified manually."
---

# Close Account

## Summary
POST /v1/partners/accounts/{business_uid}/close closes (blocks) a business account under the directory. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

> **Destructive operation** — This endpoint calls `terminate_subscription!` and `block_account!`. It should not be tested automatically against shared environments.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_close
    method: POST
    path: "/v1/partners/accounts/{{business_uid}}/close"
    token: directory
    expect:
      status: [200]
```
