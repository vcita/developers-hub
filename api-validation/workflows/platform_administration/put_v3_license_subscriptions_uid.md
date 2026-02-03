---
endpoint: "PUT /v3/license/subscriptions/{uid}"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-31T00:00:00.000Z
verifiedAt: 2026-01-31T00:00:00.000Z
---

# Update Subscriptions

## Summary
Test passes when using an active subscription UID. The endpoint works correctly but requires the subscription to be in a modifiable state (not already canceled).

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_subscriptions
    method: PUT
    path: "/v3/license/subscriptions/{uid}"
    body:
      purchase_state: canceled
    expect:
      status: [200, 201]
```
