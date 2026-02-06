---
endpoint: "POST /business/payments/v1/deposits"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:24:04.562Z"
verifiedAt: "2026-01-26T21:24:04.562Z"
timesReused: 0
---

# Create Deposits

## Summary
Test passes. The deposit was created successfully using valid amount object format, invoice entity_uid, and matter_uid. Payment_uid is optional.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_deposits
    method: POST
    path: "/business/payments/v1/deposits"
    body:
      deposit:
        amount:
          value: 200
          type: fixed
          total: 200
        can_client_pay: true
        currency: USD
        entity_type: Invoice
        entity_uid: "{{entity_uid}}"
        matter_uid: "{{matter_uid}}"
    expect:
      status: [200, 201]
```
