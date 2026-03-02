---
endpoint: "POST /v1/partners/accounts/{business_uid}/reopen"
domain: platform_administration
tags: [partners, reopen]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: verified
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: 2026-03-02T05:37:38.027Z
timesReused: 0
tokens: [directory]
expectedOutcome: 
expectedOutcomeReason: 
---

# Reopen Account

## Summary
POST /v1/partners/accounts/{business_uid}/reopen reopens a previously closed business account. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

> **Note**: This endpoint returns 422 when the account is already open. Testing requires a closed account, but closing is destructive, so automated testing is not safe.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_reopen
    method: POST
    path: "/v1/partners/accounts/{{business_uid}}/reopen"
    token: directory
    expect:
      status: [200, 422]
```
