---
endpoint: "GET /v1/partners/accounts/{business_uid}/change_addons"
domain: platform_administration
tags: [partners, change-addons]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pass
savedAt: "2026-02-10T12:00:00.000Z"
verifiedAt: null
timesReused: 0
tokens: [directory]
expectedOutcome: 401
expectedOutcomeReason: "This endpoint is deprecated and has been replaced by the Subscription API. Returns 401 as the directory is not permitted to change addons. This is expected behavior and counts as a pass."
---

# Get Change Addons

## Summary
GET /v1/partners/accounts/{business_uid}/change_addons retrieves the available addon changes for a business account. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

> **Deprecated**: This endpoint is deprecated. Addon management is now implemented using the Subscription API. A 401 response is expected and treated as a pass.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_change_addons
    method: GET
    path: "/v1/partners/accounts/{{business_id}}/change_addons"
    token: directory
    params:
      staff: "1"
    expect:
      status: [200, 401]
```