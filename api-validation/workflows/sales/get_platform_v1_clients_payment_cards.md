---
endpoint: "GET /platform/v1/clients/payment/cards"
domain: sales
tags: []
swagger: "swagger/sales/legacy/client_cards.json"
status: verified
savedAt: "2026-01-26T14:46:59.973Z"
verifiedAt: "2026-01-26T14:46:59.973Z"
timesReused: 0
---

# Get Cards

## Summary
Test passes with client token. The endpoint requires client authentication, not staff authentication.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: get_cards
    method: GET
    path: "/platform/v1/clients/payment/cards"
    expect:
      status: [200, 201]
```
