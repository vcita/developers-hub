---
endpoint: "POST /business/payments/v1/carts"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T21:21:40.109Z
verifiedAt: 2026-01-26T21:21:40.109Z
---

# Create Carts

## Summary
Test passes after fixing entity_type validation and discount structure. Used valid Service entity_type with existing service UID and corrected discount to use only percent (not both percent and amount).

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_carts
    method: POST
    path: "/business/payments/v1/carts"
    body:
      cart:
        currency: USD
        items:
          "0":
            amount: 100
            description: Test service item
            discount:
              percent: 10
            entity_name: Demo class / event
            entity_type: Service
            entity_uid: "{{entity_uid}}"
            taxes:
              "0":
                name: Test Tax
                rate: 10
        matter_uid: "{{matter_uid}}"
      is_sale: true
    expect:
      status: [200, 201]
```
