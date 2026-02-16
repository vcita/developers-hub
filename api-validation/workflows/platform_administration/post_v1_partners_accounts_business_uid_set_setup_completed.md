---
endpoint: "POST /v1/partners/accounts/{business_uid}/set_setup_completed"
domain: platform_administration
tags: [partners, set-setup-completed]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pending
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: null
timesReused: 0
tokens: [directory]
---

# Set Setup Completed

## Summary
POST /v1/partners/accounts/{business_uid}/set_setup_completed marks a business account's setup/onboarding as completed. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_set_setup_completed
    method: POST
    path: "/v1/partners/accounts/{{business_uid}}/set_setup_completed"
    token: directory
    expect:
      status: [200]
```
