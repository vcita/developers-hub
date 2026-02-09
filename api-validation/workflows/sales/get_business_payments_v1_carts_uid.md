---
endpoint: "GET /business/payments/v1/carts/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:10:26.635Z
verifiedAt: 2026-01-26T22:10:26.635Z
---

# Get Carts

## Summary
Test passes with valid cart_uid. The original request used a generic UID instead of the specific cart_uid parameter.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_carts
    method: GET
    path: "/business/payments/v1/carts/{uid}"
    expect:
      status: [200, 201]
```
