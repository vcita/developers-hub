---
endpoint: "POST /v1/partners/accounts/{business_uid}/set_setup_completed"
domain: platform_administration
tags: [partners, set-setup-completed]
swagger: "swagger/platform_administration/legacy/partners-api.json"
status: skipped
savedAt: "2026-01-28T15:24:39.276Z"
verifiedAt: "2026-01-28T15:24:39.276Z"
timesReused: 0
---

# Create Set setup completed

## Summary
User-approved skip: This is a Partners API that requires special OAuth setup and may need different routing/subdomain configuration that's not available in the current test environment

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_set_setup_completed
    method: POST
    path: "/v1/partners/accounts/{{business_uid}}/set_setup_completed"
    expect:
      status: [200, 201]
```
