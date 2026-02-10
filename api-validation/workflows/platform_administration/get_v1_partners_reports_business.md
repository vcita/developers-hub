---
endpoint: "GET /v1/partners/reports/business"
domain: platform_administration
tags: [partners, reports, business]
swagger: swagger/platform_administration/legacy/partners-api.json
status: verified
savedAt: 2026-02-10T12:00:00.000Z
verifiedAt: 2026-02-10T12:00:00.000Z
timesReused: 0
tokens: [directory]
---

# Get Business Info Report

## Summary
Query a business's basic information via the Partners API. Returns business details including business_id, contact information, account status, and package information when provided with a valid business owner email.

**Token Type**: Requires a **directory token** with HTTP Token authentication.

> **Partners API** — This endpoint is served by the Partners API. The framework automatically routes `/v1/partners/*` paths to the dedicated Partners API URL and converts the auth header to `Token token="..."` format.

## Prerequisites
```yaml
steps:
  - id: get_staff_email
    description: "Get the business owner's email from the staff list"
    method: GET
    path: "/platform/v1/businesses/{{business_uid}}/staffs"
    token: staff
    params:
      per_page: "1"
    extract:
      owner_email: "$.data.staff[0].email"
    expect:
      status: 200
    onFail: abort
```

## Test Request
```yaml
steps:
  - id: main_request
    description: "Get business info report from Partners API"
    method: GET
    path: "/v1/partners/reports/business"
    token: directory
    params:
      email: "{{owner_email}}"
    expect:
      status: [200]
```
