---
endpoint: "POST /v3/payments/invoices"
domain: sales
tags: [invoices, payments]
swagger: swagger/sales/invoice.json
status: verified
savedAt: 2026-02-10T10:30:00.000Z
verifiedAt: 2026-02-10T10:30:00.000Z
timesReused: 0
tokens: [staff]
---

# Create Invoice

## Summary
Creates a new invoice for a client matter. The invoice is immediately issued (no draft status). **Token Type**: Requires a **staff token**.

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
  - id: create_invoice
    description: "Create a new invoice"
    method: POST
    path: "/v3/payments/invoices"
    token: staff
    body:
      matter_uid: "{{matter_uid}}"
      issue_date: "{{today_date}}"
      due_date: "{{next_month_date}}"
      currency: "USD"
      billing_address: "123 Test Street, Test City, TS 12345"
      line_items:
        - name: "Test Service"
          unit_amount: 100
          quantity: 1
          description: "Test service item"
    expect:
      status: [201]
```