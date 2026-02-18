---
endpoint: "GET /business/payments/v1/transactions/{provider_transaction_id}"
domain: sales
tags: [transactions]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: 2026-02-18T06:17:33.000Z
verifiedAt: 2026-02-18T06:17:33.000Z
timesReused: 0
tokens: [staff]
---

# Get Transaction

## Summary

Retrieves a specific transaction by provider_transaction_id. This endpoint requires a **staff token**.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: create_transaction
    description: "Create a transaction to get a valid provider_transaction_id"
    method: POST
    path: "/business/payments/v1/transactions"
    token: staff
    body:
      transaction:
        provider_transaction_id: "test_tx_{{now_timestamp}}"
        total_amount: "100.0"
        currency: "USD"
        transaction_type: "sale"
        provider: "stripe"
        status: "settled"
    extract:
      provider_transaction_id: "$.data.transaction.provider_transaction_id"
    expect:
      status: [201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_transaction
    description: "Get the specific transaction by provider_transaction_id"
    method: GET
    path: "/business/payments/v1/transactions/{{provider_transaction_id}}"
    token: staff
    expect:
      status: [200]
```

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| provider_transaction_id | string | Yes | Provider transaction identifier |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Transaction retrieved |
| 401 | Unauthorized - Invalid token |
| 422 | Not Found - Transaction doesn't exist or doesn't belong to current business |