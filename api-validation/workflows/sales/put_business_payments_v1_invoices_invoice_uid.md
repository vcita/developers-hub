---
endpoint: "PUT /business/payments/v1/invoices/{invoice_uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:40:10.151Z
verifiedAt: 2026-02-07T07:21:16.000Z
timesReused: 0
useFallbackApi: true
---
# Update Invoices

## Summary

PUT /business/payments/v1/invoices/{invoice_uid} works when a real invoice_uid is provided. The failing test sent body {"invoice":{}} but the error 422 'invoice_uid Not Found' indicates the path parameter was missing/invalid. Resolved by creating an invoice via POST /business/payments/v1/invoices (required matter_uid and billing_address) and then updating it with a minimal payload.

> **⚠️ Fallback API Required**
> This endpoint must use the fallback API URL. The main API gateway does not support this endpoint.

## Prerequisites

```yaml
steps:
  - id: create_invoice
    description: "Create an invoice to update"
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

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update invoices"
    method: PUT
    path: "/business/payments/v1/invoices/{{invoice_uid}}"
    body:
      invoice: {"notify_recipient":false}
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| required_field: invoice_uid | Path param is documented, but failing test indicates it wasn’t provided/valid. | invoice_uid is mandatory and passed as params[:id] to update. | - |
| validation_rule: items/sections.item_index | Schema requires item_index only for section items; description notes item_index required for ordering items. | Frontend indicates item_index importance when items are updated; downstream may require it if items included. | - |
