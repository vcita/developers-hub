---
endpoint: "PUT /business/payments/v1/estimates/{estimate_uid}"
domain: sales
tags: []
swagger: swagger/sales/legacy/payments.json
status: pending
savedAt: 2026-02-06T19:38:27.859Z
verifiedAt: 2026-02-07T07:18:40.000Z
timesReused: 0
---
# Update Estimates

## Summary

PUT /business/payments/v1/estimates/{estimate_uid} succeeds (200) when using a real existing estimate_uid. Initial 422 was due to invalid/nonexistent estimate_uid in test data.

## Prerequisites

```yaml
steps:
  - id: create_estimate
    description: "Create an estimate to update"
    method: POST
    path: "/business/payments/v1/estimates"
    token: staff
    body:
      estimate: {"billing_address":"123 Test Street, Test City, TS 12345","business_name":"Test Business","currency":"USD","display_items_total":true,"display_sections_total":true,"due_date":"{{next_month_date}}","estimate_label":"Test Estimate","estimate_number":"{{now_timestamp}}","is_signature_required":true,"issue_date":"{{today_date}}","items":[{"description":"Professional consulting services","discount":{"amount":10},"name":"Consulting Service","quantity":2,"unit_amount":100,"item_index":0}],"matter_uid":"{{matter_uid}}","note":"Test estimate note","notify_recipient":false,"purchase_order":"PO-12345","sections":[{"items":[{"description":"Professional consulting services - section item","name":"Section Consulting Service","quantity":1,"unit_amount":150,"item_index":0}],"name":"Professional Services","section_index":0}],"source_campaign":"test_campaign","source_channel":"web","source_name":"website","source_url":"https://example.com","status":"draft","terms_and_conditions":"Standard terms and conditions apply"}
    extract:
      estimate_uid: "$.data.estimate.uid"
    expect:
      status: [200, 201]
    onFail: abort
```

## Test Request

```yaml
steps:
  - id: main_request
    description: "Update estimates"
    method: PUT
    path: "/business/payments/v1/estimates/{{estimate_uid}}"
    body:
      estimate: {"items":[{"name":"Legal Consultation","quantity":1,"unit_amount":500,"item_index":0}],"sections":[{"name":"Update Section","section_index":0,"items":[{"name":"Update Section Item","quantity":1,"unit_amount":200,"item_index":0}]}]}
    expect:
      status: [200, 201]
```

## Swagger Discrepancies

| Aspect | Swagger Says | Actual Behavior | Evidence |
|--------|--------------|-----------------|----------|
| missing_field: path param name mapping | path parameter is named {estimate_uid} | controller accesses params[:uid] | - |
