---
endpoint: "POST /business/payments/v1/estimates"
domain: sales
tags: []
swagger: "swagger/sales/legacy/payments.json"
status: verified
savedAt: "2026-01-26T18:42:14.710Z"
verifiedAt: 2026-02-07T07:18:15.000Z
timesReused: 0
---

# Create Estimates

## Summary
Test passes after fixing multiple validation issues. The original request had several problems: entity_uid/entity_type validation, item_index requirements, and notify_recipient constraints.

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
  - id: post_estimates
    method: POST
    path: "/business/payments/v1/estimates"
    body:
      estimate: {"billing_address":"123 Test Street, Test City, TS 12345","business_name":"Test Business","currency":"USD","display_items_total":true,"display_sections_total":true,"due_date":"{{next_month_date}}","estimate_label":"Test Estimate","estimate_number":"{{now_timestamp}}","is_signature_required":true,"issue_date":"{{today_date}}","items":[{"description":"Professional consulting services","discount":{"amount":10},"name":"Consulting Service","quantity":2,"unit_amount":100,"item_index":0}],"matter_uid":"{{matter_uid}}","note":"Test estimate note","notify_recipient":false,"purchase_order":"PO-12345","sections":[{"items":[{"description":"Professional consulting services - section item","name":"Section Consulting Service","quantity":1,"unit_amount":150,"item_index":0}],"name":"Professional Services","section_index":0}],"source_campaign":"test_campaign","source_channel":"web","source_name":"website","source_url":"https://example.com","status":"draft","terms_and_conditions":"Standard terms and conditions apply"}
    expect:
      status: [200, 201]
```
