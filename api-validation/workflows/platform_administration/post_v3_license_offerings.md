---
endpoint: "POST /v3/license/offerings"
domain: platform_administration
tags: [license, offerings]
swagger: "swagger/platform_administration/license.json"
status: verified
savedAt: 2026-02-09T23:03:52.000Z
verifiedAt: 2026-02-09T23:03:52.000Z
timesReused: 0
---

# Create License Offering

## Summary
Creates a new offering in the license system. An offering represents commercial terms for selling a SKU, including pricing, payment type, and other metadata. **Token Type**: Requires an **admin token**.

## Prerequisites

```yaml
steps:
  - id: get_sku
    description: "Fetch available SKUs to get a valid SKU code"
    method: GET
    path: "/v3/license/skus"
    token: admin
    extract:
      sku_code: "$.data.skus[?(@.type=='addon')].code_name | [0]"
    expect:
      status: 200
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_offerings
    method: POST
    path: "/v3/license/offerings"
    token: admin
    body:
      type: addon
      SKU: "{{sku_code}}"
      display_name: "SMS Pack 100"
      quantity: 100
      payment_type: monthly
      is_active: true
      vendor: inTandem
      prices:
        - price: "5.00"
          currency: USD
      trial_period: 14
    expect:
      status: [200, 201]
```