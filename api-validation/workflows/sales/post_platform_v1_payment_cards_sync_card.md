---
endpoint: "POST /platform/v1/payment/cards/sync_card"
domain: sales
tags: []
swagger: "swagger/sales/legacy/legacy_v1_sales.json"
status: verified
savedAt: "2026-01-27T04:21:19.647Z"
verifiedAt: "2026-01-27T04:21:19.647Z"
timesReused: 0
---

# Create Sync card

## Summary
Test passes after fixing typo and providing proper card details structure. Original request had 'datails' (typo) and empty details object causing slice! method error on nil.

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
  - id: post_sync_card
    method: POST
    path: "/platform/v1/payment/cards/sync_card"
    body:
      client_id: "{{client_id}}"
      customer_id: cus_test_customer_456
      details:
        exp_month: 6
        exp_year: 2026
        last_4: "1234"
        cardholder_name: John Doe
        card_brand: mastercard
      default: true
      external_card_id: card_test_789012
    expect:
      status: [200, 201]
```
