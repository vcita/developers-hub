---
endpoint: "GET /v3/payments/credit_notes/{uid}"
domain: sales
tags: [credit_notes, payments]
swagger: swagger/sales/creditNote.json
status: verified
savedAt: 2026-02-18T15:29:10.000Z
verifiedAt: 2026-02-18T15:29:10.000Z
timesReused: 0
tokens: [staff]
---

# Get Credit Note

## Summary
Retrieves details of a specific credit note by its UID. **Token Type**: Requires a **staff token**.

## Prerequisites

```yaml
steps:
  - id: fetch_client
    description: "Get a client for creating an invoice"
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

  - id: fetch_matter
    description: "Get a matter for the client"
    method: GET
    path: "/business/clients/v1/contacts/{{client_id}}/matters"
    token: staff
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_invoice_for_credit_note
    description: "Create an invoice that can receive a credit note"
    method: POST
    path: "/v3/payments/invoices"
    token: staff
    body:
      matter_uid: "{{matter_uid}}"
      issue_date: "2026-02-18"
      due_date: "2026-03-18"
      currency: "USD"
      billing_address: "123 Test Street, Test City, TS 12345"
      line_items:
        - name: "Test Service for Credit Note"
          unit_amount: 100
          quantity: 1
          description: "Test service to credit"
    extract:
      invoice_uid: "$.data.uid"
    expect:
      status: [201]
    onFail: abort

  - id: issue_credit_note
    description: "Create the credit note to test retrieval"
    method: POST
    path: "/v3/payments/credit_notes"
    token: staff
    body:
      invoice_uid: "{{invoice_uid}}"
      notes: "Test credit note for GET endpoint test"
      line_items:
        - name: "Test Credit Item"
          quantity: 1
          unit_amount: 50
      notify_recipient: false
    extract:
      credit_note_uid: "$.data.uid"
    expect:
      status: [201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: retrieve_credit_note
    description: "Get the credit note by its UID"
    method: GET
    path: "/v3/payments/credit_notes/{{credit_note_uid}}"
    token: staff
    expect:
      status: [200]
```