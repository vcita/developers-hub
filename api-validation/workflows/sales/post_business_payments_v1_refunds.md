---
endpoint: "POST /business/payments/v1/refunds"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:31:23.416Z"
verifiedAt: 2026-02-07T07:33:22.000Z
timesReused: 0
---

# Create Refunds

## Summary
Test passes with valid ISO8601 datetime format for refund_time field. Original test used 'test_string' which caused validation error.

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

  - id: get_matter_uid
    description: "Fetch a matter UID for the configured client"
    method: GET
    path: "/business/clients/v1/contacts/{{client_id}}/matters"
    token: staff
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_payment
    description: "Create an offline payment to refund"
    method: POST
    path: "/platform/v1/payments?business_id={{business_id}}"
    token: directory
    x_on_behalf_of: true
    body:
      client_id: "{{client_id}}"
      amount: 1
      currency: "USD"
      title: "Refund Test Payment"
      payment_method: "Cash"
      offline: true
      conversation_id: "{{matter_uid}}"
      staff_id: "{{staff_id}}"
    extract:
      payment_uid: "$.data.payment.payment_id"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: post_refunds
    method: POST
    path: "/business/payments/v1/refunds"
    body:
      refund:
        amount: 1
        payment_uid: "{{payment_uid}}"
        record_refund: true
        refund_time: "{{now_datetime}}"
    expect:
      status: [200, 201]
```
