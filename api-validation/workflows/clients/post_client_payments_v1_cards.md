---
endpoint: "POST /client/payments/v1/cards"
domain: clients
tags: [cards]
swagger: swagger/clients/legacy/clients_payments.json
status: skip
savedAt: 2026-01-25T22:22:38.333Z
verifiedAt: 2026-01-25T22:22:38.333Z
---

# Create Cards

## Summary
User-approved skip: This endpoint requires a payment processor to be connected to the business account before cards can be stored. This involves external integrations (Stripe, vcitaPayments, etc.) that cannot be set up through the API alone. The business needs proper payment gateway credentials and configuration.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_cards
    method: POST
    path: "/client/payments/v1/cards"
    expect:
      status: [200, 201]
```
