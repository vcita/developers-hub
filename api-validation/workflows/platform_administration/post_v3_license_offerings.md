---
endpoint: "POST /v3/license/offerings"
domain: platform_administration
tags: []
swagger: swagger/platform_administration/license.json
status: success
savedAt: 2026-01-30T10:00:00.000Z
verifiedAt: 2026-01-30T10:00:00.000Z
---

# Create Offerings

## Summary
Creates a new offering in the license system. An offering represents commercial terms for selling a SKU, including pricing, payment type, and other metadata. Requires an **admin token** and a valid SKU from the SKUs endpoint.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_offerings
    method: POST
    path: "/v3/license/offerings"
    body:
      type: addon
      SKU: "{{SKU}}"
      display_name: SMS Pack 100
      quantity: 100
      payment_type: monthly
      is_active: true
      vendor: inTandem
      prices:
        "0":
          price: 5
          currency: USD
        "1":
          price: 5
          currency: EUR
      trial: 14
      reporting_tags:
        "0": business-management
    expect:
      status: [200, 201]
```
