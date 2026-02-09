---
endpoint: "PUT /business/payments/v1/cards/{uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-01-26T22:17:47.209Z
verifiedAt: 2026-02-07T07:49:05.000Z
timesReused: 0
tokens: [staff]
useFallbackApi: true
---

# Update Card

## Summary
Updates a card's default status and usage permission. **Token Type**: Requires a **Staff token**.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway returns 401 for staff tokens on `/business/payments/v1/*` paths.

## Prerequisites

```yaml
steps:
  - id: get_client_id
    description: "Fetch a client ID for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_id: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_existing_card
    description: "Get an existing card to update"
    method: GET
    path: "/platform/v1/payment/cards"
    token: staff
    useFallbackApi: true
    params:
      client_id: "{{client_id}}"
    extract:
      card_uid: "$.data.cards[1].id"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: update_card
    method: PUT
    path: "/business/payments/v1/cards/{{card_uid}}"
    token: staff
    useFallbackApi: true
    body:
      card:
        default: true
        usage_permission: "all"
    expect:
      status: [200, 201]
```