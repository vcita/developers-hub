---
endpoint: GET /business/payments/v1/scheduled_payments_rules/{uid}
domain: sales
tags: [payments, scheduled_payments]
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-01-27T05:22:05.868Z
verifiedAt: 2026-03-01T00:00:00.000Z
timesReused: 0
---

# Get Scheduled Payment Rule

## Summary
Retrieves a specific scheduled payment rule by UID. Requires a staff token. Prerequisites find a client with a saved payment card and create a fresh scheduled payment rule to obtain a valid UID.

## Prerequisites

```yaml
steps:
  - id: get_client_with_card
    description: "Fetch a client that has payment cards on file"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "50"
    extract:
      card_client_id: "$.data.clients[?(@.last_name=='Card Client')].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_payment_card
    description: "Fetch a payment card for the client"
    method: GET
    path: "/platform/v1/clients/{{card_client_id}}/payment/cards"
    token: directory
    x_on_behalf_of: true
    extract:
      payment_method_uid: "$.data.cards[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_matter_uid
    description: "Fetch a matter UID for the client with cards"
    method: GET
    path: "/business/clients/v1/contacts/{{card_client_id}}/matters"
    token: staff
    extract:
      client_matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_scheduled_payment_rule
    description: "Create a scheduled payment rule to get a valid UID"
    method: POST
    path: "/business/payments/v1/scheduled_payments_rules"
    token: staff
    body:
      scheduled_payments_rule: {"amount":100,"currency":"USD","cycles":1,"description":"Test rule for GET validation","frequency_type":"one_time","matter_uid":"{{client_matter_uid}}","name":"Test GET Rule {{now_timestamp}}","payment_method":{"type":"card","uid":"{{payment_method_uid}}"},"send_receipt":true,"start_date":"{{tomorrow_datetime}}"}
    extract:
      scheduled_payment_rule_uid: "$.data.scheduled_payments_rule.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: get_scheduled_payments_rule
    method: GET
    path: "/business/payments/v1/scheduled_payments_rules/{{scheduled_payment_rule_uid}}"
    expect:
      status: [200]
```
