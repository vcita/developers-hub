---
endpoint: POST /v3/payments/invoices
domain: payments
tags: []
status: pass
savedAt: 2026-01-23T22:38:50.993Z
verifiedAt: 2026-01-23T22:38:50.993Z
timesReused: 0
---
# Create Invoices

## Summary
Successfully created invoice after fixing line item index ordering and field naming issues

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | already_resolved | - | No |
| estimate_uid | already_resolved | - | No |

```json
{
  "matter_uid": {
    "source_endpoint": "already_resolved",
    "resolved_value": "b265c1w0zqokgkz8",
    "used_fallback": false
  },
  "estimate_uid": {
    "source_endpoint": "already_resolved",
    "resolved_value": "on8078b4vx6988ro",
    "used_fallback": false
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Verified Successful Request

```json
{
  "method": "POST",
  "path": "/v3/payments/invoices",
  "body": {
    "matter_uid": "b265c1w0zqokgkz8",
    "issue_date": "2024-01-15",
    "due_date": "2024-02-15",
    "currency": "USD",
    "status": "ISSUED",
    "invoice_number": 2024001,
    "invoice_title": "INVOICE",
    "billing_address": "123 Main St, City, State 12345",
    "purchase_order": "PO-12345",
    "allow_online_payment": true,
    "allow_partial_payment": false,
    "enable_late_fee": false,
    "note": "Thank you for your business",
    "terms_and_conditions": "Payment due within 30 days",
    "notify_recipient": true,
    "additional_recipients": [
      "accounting@example.com"
    ],
    "display_line_item_groups_total": true,
    "display_line_item_total": true,
    "estimate_uid": "on8078b4vx6988ro",
    "source_name": "initiated_by_staff",
    "line_items": [
      {
        "name": "Consulting Services",
        "quantity": 2,
        "unit_amount": 150,
        "description": "Hourly consulting",
        "entity_uid": "3a741e1d-b2d1-49fb-86e2-33a9732c7117",
        "entity_type": "Service",
        "tax_uids": [
          "gs85c7bxa9wfccja"
        ],
        "discount": {
          "discount_type": "percent",
          "amount": 10
        },
        "line_item_index": 0
      },
      {
        "name": "Design materials",
        "quantity": 1,
        "unit_amount": 114,
        "description": "Design materials",
        "entity_uid": "xebbbc9f5hgdgu1a",
        "entity_type": "Product",
        "tax_uids": [
          "gs85c7bxa9wfccja"
        ],
        "discount": null,
        "line_item_index": 1
      }
    ]
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| line_item_index | Documentation doesn't clearly explain that when using both line_item_groups and top-level line_items, ALL line items across both collections must have consecutive indices starting from 0 | Add validation rule example showing that line_item_index values must be consecutive across all items in the request, regardless of whether they're in groups or top-level | critical |
| unique_number vs invoice_number | Swagger example uses 'unique_number' field but API expects 'invoice_number' field as numeric value | Update swagger to use 'invoice_number' instead of 'unique_number' and clarify it must be numeric | major |
| line_item_groups vs line_items combination | Documentation doesn't explain the interaction when both line_item_groups and line_items are provided - the validation applies to all items collectively | Add documentation explaining that line_item_index validation applies across ALL line items in the request, whether in groups or top-level | major |