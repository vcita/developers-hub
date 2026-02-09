---
endpoint: "PUT /business/payments/v1/deposits/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: success
savedAt: 2026-01-26T22:21:47.859Z
verifiedAt: 2026-01-26T22:21:47.859Z
---

# Update Deposits

## Summary
Test passes after using existing deposit UID and correct amount object structure. Original request failed due to invalid amount format (empty object) and non-existent deposit UID.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: put_deposits
    method: PUT
    path: "/business/payments/v1/deposits/{uid}"
    body:
      deposit:
        amount:
          type: fixed
          value: "150.0"
          total: "150.0"
        can_client_pay: true
        currency: USD
        entity_type: Invoice
    expect:
      status: [200, 201]
```
