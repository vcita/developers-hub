---
endpoint: "POST /platform/v1/payment/packages"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-27T04:23:18.093Z
verifiedAt: 2026-01-27T04:23:18.093Z
---

# Create Packages

## Summary
Test passes after resolving service ID and using valid currency, discount_unit, and expiration_unit values.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_packages
    method: POST
    path: "/platform/v1/payment/packages"
    body:
      currency: USD
      description: test_string
      discount_amount: 1
      discount_unit: F
      expiration: 1
      expiration_unit: M
      image_path: test_string
      items:
        "0":
          services:
            "0":
              id: "{{id}}"
          total_bookings: 1
      name: test_string
      online_payment_enabled: true
      price: 1
      products: {}
    expect:
      status: [200, 201]
```
