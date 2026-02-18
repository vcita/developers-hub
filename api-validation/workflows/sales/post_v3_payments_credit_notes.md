---
endpoint: "POST /v3/payments/credit_notes"
domain: sales
tags: [credit_notes, payments]
swagger: swagger/sales/creditNote.json
status: verified
savedAt: 2026-02-18T15:26:48.442Z
verifiedAt: 2026-02-18T15:26:48.442Z
timesReused: 0
tokens: [staff]
---

# Create Credit Note

## Summary
Creates and issues a new credit note against an existing invoice. The credit note is immediately issued (no draft status). **Token Type**: Requires a **staff token**.

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

  - id: create_invoice
    description: "Create an invoice to create credit note against"
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
    extract:
      invoice_uid: "$.data.uid"
    expect:
      status: [201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: create_credit_note
    description: "Create a credit note against the invoice"
    method: POST
    path: "/v3/payments/credit_notes"
    token: staff
    body:
      invoice_uid: "{{invoice_uid}}"
      notes: "Test credit note for refund"
      line_items:
        - name: "Test Credit"
          quantity: 1
          unit_amount: 50
      notify_recipient: false
    expect:
      status: [201]
```