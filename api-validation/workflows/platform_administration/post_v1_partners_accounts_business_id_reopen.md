---
endpoint: "POST /v1/partners/accounts/{business_uid}/reopen"
domain: platform_administration
tags: [partners, reopen]
swagger: swagger/platform_administration/legacy/partners-api.json
status: skip
savedAt: 2026-01-28T15:36:16.088Z
verifiedAt: 2026-01-28T15:36:16.088Z
---

# Create Reopen

## Summary
User-approved skip: Partners API routing/infrastructure issue - the vcita service that hosts this endpoint is not accessible through the current API gateway, and requires special directory-scoped OAuth tokens that are not available in the test environment

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_reopen
    method: POST
    path: "/v1/partners/accounts/{business_uid}/reopen"
    expect:
      status: [200, 201]
```
