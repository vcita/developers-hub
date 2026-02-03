---
endpoint: "GET /v3/license/subscriptions"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-28T10:15:18.371Z
verifiedAt: 2026-01-28T10:15:18.371Z
---

# Get Subscriptions

## Summary
Test passes with directory token. The original error occurred because the configured app/staff tokens are associated with app_id 'appwidgetsmanager' which lacks a required purchasable record for accessing subscription data.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_subscriptions
    method: GET
    path: "/v3/license/subscriptions"
    expect:
      status: [200, 201]
```
