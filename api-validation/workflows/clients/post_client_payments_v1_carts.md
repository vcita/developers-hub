---
endpoint: "POST /client/payments/v1/carts"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-26T05:16:19.589Z
verifiedAt: 2026-01-26T05:16:19.589Z
---

# Create Carts

## Summary
Successfully created cart using client token with valid entity_type 'ProductOrder' and corresponding entity_uid. The error was caused by using invalid test data ('test_string') for entity_type field.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_carts
    method: POST
    path: "/client/payments/v1/carts"
    body:
      cart:
        currency: USD
        items:
          "0":
            entity_type: ProductOrder
            entity_uid: "{{entity_uid}}"
        matter_uid: "{{matter_uid}}"
    expect:
      status: [200, 201]
```
