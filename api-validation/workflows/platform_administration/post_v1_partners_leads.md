---
endpoint: "POST /v1/partners/leads"
domain: platform_administration
tags: [partners, leads]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: pending
savedAt: 2026-01-26T21:28:12.398Z
verifiedAt: null
timesReused: 0
tokens: [directory]
---

# Create Partner Lead

## Summary
POST /v1/partners/leads injects a new lead into a business account under the directory. **Token Type**: Requires a **Directory** token.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

## Prerequisites
```yaml
steps:
  - id: get_staff
    description: "Get staff to extract business context"
    method: GET
    path: "/v2/staffs"
    token: staff
    useFallback: true
    params:
      per_page: "1"
    extract:
      business_id: "$.data[0].business_id"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: create_lead
    method: POST
    path: "/v1/partners/leads"
    token: directory
    body:
      email: "test-lead-{{now_timestamp}}@example.com"
      first_name: "Test"
      last_name: "Lead"
      business_id: "{{business_id}}"
      identifier_type: "email"
      request_title: "Test Lead Creation"
      system_message: "Test lead created via API validation"
    expect:
      status: [200, 201]
```