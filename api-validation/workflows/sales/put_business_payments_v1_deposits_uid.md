---
endpoint: "PUT /business/payments/v1/deposits/{uid}"
domain: sales
tags: [deposits]
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T22:21:47.859Z"
verifiedAt: "2026-01-26T22:21:47.859Z"
timesReused: 0
tokens: [staff]
---

# Update Deposit

## Summary

Updates a specific deposit by UID. This endpoint requires a **staff token**.

**Token Type**: This endpoint requires a **Staff token**.

## Prerequisites

```yaml
steps:
  - id: get_deposit_uid
    description: "Fetch an existing deposit UID"
    method: GET
    path: "/business/payments/v1/deposits"
    token: staff
    params:
      per_page: "1"
    extract:
      deposit_uid: "$.data.deposits[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: put_deposits
    description: "Update the specific deposit"
    method: PUT
    path: "/business/payments/v1/deposits/{{deposit_uid}}"
    token: staff
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

## Parameters Reference

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uid | string | Yes | Deposit unique identifier |

## Response Codes

| Status | Meaning |
|--------|---------|
| 200 | Success - Deposit updated |
| 401 | Unauthorized - Invalid token |
| 404 | Not Found - Deposit doesn't exist |
| 422 | Validation Error - Invalid request data |