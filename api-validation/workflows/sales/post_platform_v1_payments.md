---
endpoint: "POST /platform/v1/payments"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-26T21:58:21.948Z"
verifiedAt: "2026-01-26T21:58:21.948Z"
timesReused: 0
---

# Create Payments

## Summary
Test passes after using correct client_uid instead of client_id. The API expects client_id field to contain the client UID, not the client ID hash.

## Prerequisites

```yaml
steps:
  - id: get_clients
    description: "Fetch available clients"
    method: GET
    path: "/platform/v1/clients"
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_payments
    method: POST
    path: "/platform/v1/payments"
    body:
      amount: 100
      client_id: "{{client_id}}"
      currency: USD
      payment_method: Cash
      title: Test Payment
      send_receipt: false
    expect:
      status: [200, 201]
```
