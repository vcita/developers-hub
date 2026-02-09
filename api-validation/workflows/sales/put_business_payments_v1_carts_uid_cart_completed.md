---
endpoint: "PUT /business/payments/v1/carts/{uid}/cart_completed"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:19:04.860Z
verifiedAt: 2026-01-26T22:19:04.860Z
---

# Update Cart completed

## Summary
Test passes with HTTP 200. Used the correct cart_uid from available parameters (36l0jhfysq7nnymo) instead of the generic uid parameter.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_cart_completed
    method: PUT
    path: "/business/payments/v1/carts/{uid}/cart_completed"
    expect:
      status: [200, 201]
```
