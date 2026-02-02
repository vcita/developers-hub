---
endpoint: "POST /client/payments/v1/cards/save_card_session"
domain: clients
tags: [cards]
swagger: swagger/clients/legacy/clients_payments.json
status: skip
savedAt: 2026-01-25T22:22:50.511Z
verifiedAt: 2026-01-25T22:22:50.511Z
---

# Create Save card session

## Summary
User-approved skip: This endpoint requires the 'cp_add_new_cof' (Client Portal add new Card on File) feature flag to be enabled on the business. This feature is likely part of a paid plan or special configuration. In a testing environment, it would require administrative privileges to enable this feature flag, which is beyond the scope of normal API testing.

## Prerequisites

No prerequisites required for this endpoint.

## Test Request

```yaml
steps:
  - id: post_save_card_session
    method: POST
    path: "/client/payments/v1/cards/save_card_session"
    expect:
      status: [200, 201]
```
