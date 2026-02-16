---
endpoint: GET /business/payments/v1/transactions/{provider_transaction_id}
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-02-06T18:32:48.178Z
verifiedAt: 2026-02-07T07:47:18.000Z
timesReused: 0
---
# Get Transactions

## Summary

PASS: Successfully retrieved a Transaction after resolving a valid provider_transaction_id by creating a transaction, then calling GET /business/payments/v1/transactions/{provider_transaction_id} -> 200.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: main_request
    description: "Get transactions"
    method: GET
    path: "/business/payments/v1/transactions/tx_1770399738"
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: provider_transaction_id | Not clear what happens when provider_transaction_id is not found / not belonging to current business | Raises Api::ValidationErrors error(code: :missing, field: :provider_transaction_id, message: I18n.t('payments-api-errors.not_found')) | - |
| missing_field: business_uid scoping | Not explicit that lookup is scoped to business context (business_uid) | show() queries ProviderTransaction where provider_transaction_id AND business_uid | - |
