---
endpoint: "GET /client/payments/v1/cards/get_new_card"
domain: clients
tags: []
swagger: swagger/clients/legacy/clients_payments.json
status: success
savedAt: 2026-01-25T15:47:54.190Z
verifiedAt: 2026-01-25T15:47:54.190Z
---

# Get Get new card

## Summary
Test passes. Used client token to successfully GET /client/payments/v1/cards/get_new_card, which returned HTTP 200 with data indicating no pending cards (card: null).

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_get_new_card
    method: GET
    path: "/client/payments/v1/cards/get_new_card"
    expect:
      status: [200, 201]
```
