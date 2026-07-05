---
endpoint: POST /business/payments/v1/scheduled_payments_rules
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-01-27T05:37:36.671Z
verifiedAt: 2026-02-08T00:38:20.000Z
timesReused: 0
---

# Create Scheduled payments rules

## Summary
Creates a one-time scheduled payment rule. Requires a client with a saved payment card. The `frequency_type` field accepts snake_case values: `one_time`, `weekly`, `bi_weekly`, `monthly`.

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

  - id: get_payment_card
    description: "Fetch a payment card for the client"
    method: GET
    path: "/platform/v1/clients/{{client_id}}/payment/cards"
    token: directory
    x_on_behalf_of: true
    extract:
      payment_method_uid: "$.data.cards[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_matter_uid
    description: "Fetch a matter UID for the client"
    method: GET
    path: "/business/clients/v1/contacts/{{client_id}}/matters"
    token: staff
    extract:
      client_matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_scheduled_payments_rules
    method: POST
    path: "/business/payments/v1/scheduled_payments_rules"
    body:
      scheduled_payments_rule: {"amount":100,"currency":"USD","cycles":1,"description":"Test scheduled payment rule","frequency_type":"one_time","matter_uid":"{{client_matter_uid}}","name":"Test Scheduled Payment","payment_method":{"type":"card","uid":"{{payment_method_uid}}"},"send_receipt":true,"start_date":"{{tomorrow_datetime}}"}
    expect:
      status: [200, 201]
```
