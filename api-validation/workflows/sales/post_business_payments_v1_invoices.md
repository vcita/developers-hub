---
endpoint: "POST /business/payments/v1/invoices"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T21:28:12.398Z"
verifiedAt: 2026-02-07T07:20:48.000Z
timesReused: 0
---

# Create Invoices

## Summary
Test passes after resolving multiple validation issues. The main issue was the 'both_fields' validation rule requiring that if entity_type is provided, entity_uid must also be provided (and vice versa). Other issues included email format validation, status-notification compatibility, discount exclusivity, and index validation.

## Prerequisites

```yaml
steps:
  - id: get_client_uid
    description: "Fetch a valid client UID for this business"
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
```

## Test Request

```yaml
steps:
  - id: post_invoices
    method: POST
    path: "/business/payments/v1/invoices"
    body:
      invoice: {"additional_recipients":["test@example.com"],"allow_online_payment":false,"allow_partial_payment":false,"billing_address":"test_string","business_name":"test_string","currency":"USD","display_items_total":true,"display_sections_total":true,"due_date":"{{next_month_date}}","invoice_label":"test_string","invoice_number":"{{now_timestamp}}","issue_date":"{{today_date}}","items":[{"description":"test_string","discount":{"percent":10},"item_index":0,"name":"test_string","quantity":1,"unit_amount":1}],"matter_uid":"{{matter_uid}}","note":"test_string","notify_recipient":true,"purchase_order":"test_string","sections":[{"items":[{"description":"test_string","discount":{"percent":10},"item_index":0,"name":"test_string","quantity":1,"unit_amount":1}],"name":"test_string","section_index":0}],"source_campaign":"test_string","source_channel":"test_string","source_name":"test_string","source_url":"test_string","status":"issued","terms_and_conditions":"test_string"}
    expect:
      status: [200, 201]
```
