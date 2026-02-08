---
endpoint: "POST /business/payments/v1/deposits"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: verified
savedAt: 2026-02-06T21:59:20.652Z
verifiedAt: 2026-02-07T07:32:28.000Z
timesReused: 0
---
# Create Deposits

## Summary

Creates a deposit using a freshly created invoice as the entity. Requires valid `matter_uid` and `entity_uid` (invoice UID).

## Prerequisites

```yaml
steps:
  - id: get_client_uid
    description: "Fetch a client UID for the business"
    method: GET
    path: "/platform/v1/clients"
    token: staff
    params:
      business_id: "{{business_id}}"
      per_page: "1"
    extract:
      client_uid: "$.data.clients[0].id"
    expect:
      status: [200]
    onFail: abort

  - id: get_matter_uid
    description: "Fetch a matter UID for the configured client"
    method: GET
    path: "/business/clients/v1/contacts/{{client_uid}}/matters"
    token: staff
    extract:
      matter_uid: "$.data.matters[0].uid"
    expect:
      status: [200]
    onFail: abort

  - id: create_invoice
    description: "Create an invoice to use as deposit entity"
    method: POST
    path: "/business/payments/v1/invoices"
    token: staff
    body:
      invoice: {"additional_recipients":["test@example.com"],"allow_online_payment":false,"allow_partial_payment":false,"billing_address":"test_string","business_name":"test_string","currency":"USD","display_items_total":true,"display_sections_total":true,"due_date":"{{next_month_date}}","invoice_label":"test_string","invoice_number":"{{now_timestamp}}","issue_date":"{{today_date}}","items":[{"description":"test_string","discount":{"percent":10},"item_index":0,"name":"test_string","quantity":1,"unit_amount":1}],"matter_uid":"{{matter_uid}}","note":"test_string","notify_recipient":true,"purchase_order":"test_string","sections":[{"items":[{"description":"test_string","discount":{"percent":10},"item_index":0,"name":"test_string","quantity":1,"unit_amount":1}],"name":"test_string","section_index":0}],"source_campaign":"test_string","source_channel":"test_string","source_name":"test_string","source_url":"test_string","status":"issued","terms_and_conditions":"test_string"}
    extract:
      invoice_uid: "$.data.invoice.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## UID Resolution Procedure

| UID Field | Source |
|-----------|--------|
| invoice_uid | POST /business/payments/v1/invoices (prerequisite) |
| matter_uid | GET /business/clients/v1/contacts/{client_uid}/matters (prerequisite) |

## Test Request

```yaml
steps:
  - id: main_request
    description: "Create deposits"
    method: POST
    path: "/business/payments/v1/deposits"
    body:
      deposit: {"currency":"USD","matter_uid":"{{matter_uid}}","amount":{"type":"fixed","value":1,"total":1},"entity_uid":"{{invoice_uid}}","entity_type":"Invoice"}
      new_api: true
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| validation_rule: entity_uid | generic entity reference | must reference existing Invoice or Estimate | - |
