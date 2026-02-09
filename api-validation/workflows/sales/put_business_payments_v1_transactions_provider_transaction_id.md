---
endpoint: "PUT /business/payments/v1/transactions/{provider_transaction_id}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T20:22:10.047Z
verifiedAt: 2026-02-07T07:27:46.000Z
timesReused: 0
useFallbackApi: true
---
# Update Transactions

## Summary

PUT /business/payments/v1/transactions/{provider_transaction_id} succeeded (200) after using a real existing provider_transaction_id and sending a minimal body: {transaction:{fee,net}}. Initial 422 was due to missing/not-found provider_transaction_id in the path.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

None required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update transactions"
    method: PUT
    path: "/business/payments/v1/transactions/tx_1770399738"
    body:
      transaction: {"fee":50,"net":150}
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: metadata | string | Hash/object | - |
| validation_rule: payment_method | string (no enum) | enum ['Credit Card','Bank Payment - ACH'] | - |
| validation_rule: card_last4/card_bin | string (no pattern) | digits only | - |
| validation_rule: create_time/settle_time | string (no format) | ISO8601 date-time | - |
