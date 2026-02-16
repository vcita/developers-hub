---
endpoint: "POST /v1/partners/accounts"
domain: platform_administration
tags: [partners, accounts]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pending
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: null
timesReused: 0
tokens: [directory]
expectedOutcome: 422
expectedOutcomeReason: "Creating a new business account is a side-effect-heavy operation that provisions a full business. Cannot safely create accounts in shared test environments."
---

# Create Partner Account

## Summary
POST /v1/partners/accounts creates a new business account under the directory. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

> **Side-effect-heavy operation** — This endpoint creates a full business account with provisioning. Should not be tested automatically against shared environments.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_create_account
    method: POST
    path: "/v1/partners/accounts"
    token: directory
    body:
      email: "test@example.com"
      first_name: "Test"
      last_name: "User"
    expect:
      status: [200, 201]
```
