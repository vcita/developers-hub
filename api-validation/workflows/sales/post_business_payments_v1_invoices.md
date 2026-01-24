---
endpoint: POST /business/payments/v1/invoices
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:10:17.577Z
verifiedAt: 2026-01-23T22:10:17.577Z
timesReused: 0
---
# Create Invoices

## Summary
Invoice creation successful after correcting item_index validation - item indexes must start from 0, not 1

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | Already provided in request | N/A - value was already provided | No |

```json
{
  "matter_uid": {
    "source_endpoint": "Already provided in request",
    "resolved_value": "b265c1w0zqokgkz8",
    "used_fallback": false,
    "fallback_endpoint": "N/A - value was already provided"
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
  "path": "/business/payments/v1/invoices",
  "body": {
    "invoice": {
      "matter_uid": "b265c1w0zqokgkz8",
      "issue_date": "2026-01-23",
      "due_date": "2026-02-22",
      "currency": "USD",
      "billing_address": "123 Main Street\nSuite 100\nNew York, NY 10001",
      "items": [
        {
          "name": "Legal Consultation",
          "description": "Initial consultation regarding contract review",
          "quantity": 2,
          "unit_amount": 250,
          "item_index": 0
        }
      ],
      "business_name": "Legal Services Inc.",
      "invoice_label": "INVOICE",
      "status": "ISSUED",
      "notify_recipient": true,
      "allow_online_payment": true,
      "allow_partial_payment": true,
      "display_items_total": true,
      "display_sections_total": true,
      "note": "Thank you for your business. Payment is due within 30 days.",
      "terms_and_conditions": "Payment terms: Net 30 days. Late payments may incur additional fees."
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| items[].item_index | Documentation does not specify that item_index must start from 0 and be consecutive. The API returned 422 error 'order must start with index zero' when item_index was set to 1. | Add validation rules to swagger documentation: 'item_index: Must start from 0 and be consecutive integers (0, 1, 2, etc.) when provided. If not provided, items will be ordered as they appear in the array.' | critical |
| items[].item_index | The validation error message 'order must start with index zero' suggests that item ordering/indexing is a system requirement but this is not documented in the API specification. | Document the item_index field purpose and validation rules: when multiple items need specific ordering for display or processing, use item_index starting from 0. If omitted, natural array order will be used. | major |