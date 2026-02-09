---
endpoint: "PUT /platform/v1/payment/packages/{package_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: success
savedAt: 2026-01-26T22:47:12.384Z
verifiedAt: 2026-01-26T22:47:12.384Z
---

# Update Packages

## Summary
Test passes after resolving token issue and using valid enum values for expiration_unit and discount_unit fields

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_packages
    method: PUT
    path: "/platform/v1/payment/packages/{package_id}"
    body:
      package:
        currency: USD
        description: Updated test package
        discount_amount: 10
        discount_unit: F
        expiration: 30
        expiration_unit: M
        image_path: test_image.jpg
        items:
          "0":
            services:
              "0":
                id: "{{id}}"
            total_bookings: 5
        name: Updated Test Package
        online_payment_enabled: true
        price: 99.99
        products: {}
    expect:
      status: [200, 201]
```
