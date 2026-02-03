---
endpoint: "POST /v3/license/subscriptions"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-28T20:45:43.592Z
verifiedAt: 2026-01-28T20:45:43.592Z
---

# Create Subscriptions

## Summary
Endpoint works correctly. Successfully created subscription with staff token when no custom price is specified. Custom pricing validation is working as documented - requires directory or admin tokens.

## Prerequisites

No prerequisites required for this endpoint.

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
