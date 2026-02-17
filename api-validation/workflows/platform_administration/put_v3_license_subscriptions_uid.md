---
endpoint: "PUT /v3/license/subscriptions/{uid}"
domain: platform_administration
tags: [license, subscriptions]
swagger: swagger/platform_administration/license.json
status: verified
savedAt: 2026-02-09T23:42:30.000Z
verifiedAt: 2026-02-09T23:42:30.000Z
timesReused: 0
---

# Update Subscription

## Summary
Updates a license subscription's purchase state. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_offerings
    description: "Fetch offerings to get an offering UID for creating subscription"
    method: GET
    path: "/v3/license/offerings"
    token: staff
    extract:
      offering_uid: "$.data.offerings[0].uid"
    expect:
      status: 200
    onFail: abort

  - id: create_subscription
    description: "Create a subscription to update"
    method: POST
    path: "/v3/license/subscriptions"
    token: staff
    body:
      offering_uid: "{{offering_uid}}"
      purchase_currency: "USD"
      charged_by: "partner"
      payment_type: "external"
    extract:
      subscription_uid: "$.data.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_subscription
    method: PUT
    path: "/v3/license/subscriptions/{{subscription_uid}}"
    token: staff
    body:
      purchase_state: "canceled"
    expect:
      status: [200, 201]
```