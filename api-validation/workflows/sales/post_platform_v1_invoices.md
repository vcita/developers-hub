---
endpoint: POST /platform/v1/invoices
domain: sales
tags: [invoices]
swagger: swagger/sales/legacy/legacy_v1_sales.json
status: verified
savedAt: 2026-02-08T16:37:37.000Z
verifiedAt: 2026-02-08T16:37:37.000Z
timesReused: 0
---

# Create Invoices

## Summary
Creates a new invoice for a client. **Token Type**: Requires a **staff token**.

> This endpoint must use the fallback API URL. The main API gateway returns 422 Unauthorized for Staff tokens.

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
```

## Test Request

```yaml
steps:
  - id: post_invoices
    method: POST
    path: "/platform/v1/invoices"
    token: staff
    body:
      address: "123 Test Street"
      allow_online_payment: false
      client_id: "{{client_id}}"
      conversation_id: "{{matter_uid}}"
      currency: "USD"
      due_date: "{{next_month_date}}"
      invoice_number: "{{now_timestamp}}"
      issued_at: "{{today_date}}"
      items:
        - title: "Test item"
          description: "Test item"
          amount: 1
          quantity: 1
    expect:
      status: [200, 201]
```