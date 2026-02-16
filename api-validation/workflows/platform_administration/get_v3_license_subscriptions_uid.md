---
endpoint: "GET /v3/license/subscriptions/{uid}"
domain: platform_administration
tags: [license, subscriptions]
swagger: swagger/platform_administration/license.json
status: verified
savedAt: 2026-02-11T10:29:42.984Z
verifiedAt: 2026-02-11T10:29:42.984Z
timesReused: 0
---

# Get License Subscription

## Summary
Retrieves a specific license subscription by UID. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_subscriptions
    description: "Fetch subscriptions list to get a valid subscription UID"
    method: GET
    path: "/v3/license/subscriptions"
    extract:
      subscription_uid: "$.data.subscriptions[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_subscription_details
    method: GET
    path: "/v3/license/subscriptions/{{subscription_uid}}"
    expect:
      status: 200
```