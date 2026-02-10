---
endpoint: "POST /v3/license/subscriptions"
domain: platform_administration
tags: [license, subscriptions]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: "2026-02-09T23:04:36.310Z"
verifiedAt: "2026-02-09T23:04:36.310Z"
timesReused: 0
---

# Create License Subscription

## Summary
Creates a new license subscription for an offering. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: get_offerings
    description: "Fetch offerings to get an offering UID"
    method: GET
    path: "/v3/license/offerings"
    extract:
      offering_uid: "$.data.offerings[0].uid"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_subscriptions
    method: POST
    path: "/v3/license/subscriptions"
    body:
      offering_uid: "{{offering_uid}}"
      purchase_currency: USD
      charged_by: partner
      discount_code_name: fixed_amount
      coupon_code: MAVCFREE
      payment_type: external
    expect:
      status: [200, 201]
```