---
endpoint: "POST /v1/partners/accounts/{business_uid}/reopen"
domain: platform_administration
tags: [partners, reopen]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pending
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: null
timesReused: 0
tokens: [directory]
expectedOutcome: 422
expectedOutcomeReason: "Reopening requires the account to be closed first. Test account is already open, so returns 422 'Invalid request - this business is already open'. Cannot close first because close is destructive."
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
