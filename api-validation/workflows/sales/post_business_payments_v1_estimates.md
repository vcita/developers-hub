---
endpoint: POST /business/payments/v1/estimates
domain: sales
tags: []
status: pass
savedAt: 2026-01-23T22:08:36.117Z
verifiedAt: 2026-01-23T22:08:36.117Z
timesReused: 0
---
# Create Estimates

## Summary
Successfully created estimate after fixing validation issues. The API requires both entity_uid and entity_type to be provided together for items, item_index must start from 0, and estimate_number must be unique (or omitted for auto-generation).

## Prerequisites
No specific prerequisites documented.

## UID Resolution

How to obtain required UIDs for this endpoint:

| UID Field | Source Endpoint | Fallback (Create) | Used Fallback |
|-----------|-----------------|-------------------|---------------|
| matter_uid | Already available in parameters | - | No |

```json
{
  "matter_uid": {
    "resolved_value": "b265c1w0zqokgkz8",
    "source_endpoint": "Already available in parameters",
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
  "path": "/business/payments/v1/estimates",
  "body": {
    "estimate": {
      "matter_uid": "b265c1w0zqokgkz8",
      "issue_date": "2026-01-23",
      "due_date": "2026-02-22",
      "currency": "USD",
      "billing_address": "123 Main St, Suite 100, New York, NY 10001",
      "business_name": "Legal Services LLC",
      "display_items_total": true,
      "display_sections_total": true,
      "estimate_label": "ESTIMATE",
      "is_signature_required": true,
      "items": [
        {
          "name": "Legal Consultation",
          "description": "Initial legal consultation and case review",
          "quantity": 2,
          "unit_amount": 350,
          "item_index": 0,
          "entity_type": "Service",
          "entity_uid": "3a741e1d-b2d1-49fb-86e2-33a9732c7117"
        },
        {
          "name": "Document Preparation",
          "description": "Preparation of legal documents",
          "quantity": 1,
          "unit_amount": 500,
          "item_index": 1
        }
      ],
      "note": "Thank you for choosing our legal services. Please review the estimate and let us know if you have any questions.",
      "notify_recipient": true,
      "purchase_order": "PO-2026-001",
      "status": "ISSUED",
      "terms_and_conditions": "Payment is due within 30 days of estimate acceptance. All services subject to standard terms and conditions.",
      "source_campaign": "Legal Services Campaign",
      "source_channel": "Website",
      "source_name": "Contact Form",
      "source_url": "https://example.com/contact"
    }
  }
}
```

## Documentation Fix Suggestions

| Field | Issue | Suggested Fix | Severity |
|-------|-------|---------------|----------|
| items[].entity_uid and items[].entity_type | Documentation doesn't clearly state that entity_uid and entity_type must both be provided together if either is specified. The validation error 'Both fields are required: entity_uid and entity_type' only appears at runtime. | Add validation note in swagger: 'When using entity_uid or entity_type, both fields must be provided together' | major |
| items[].item_index | Documentation doesn't specify that item_index must start from 0 (zero-based indexing) | Add validation note: 'item_index must start from 0 and increment sequentially' | major |
| estimate_number | Documentation doesn't mention that estimate_number must be unique within the business or that it can be omitted for auto-generation | Add note: 'estimate_number must be unique within the business. If omitted, a number will be auto-generated' | minor |
| items[].entity_uid and items[].entity_type in response | When entity_uid and entity_type are provided in request, they appear as null in the response, suggesting they may not be stored or returned as expected | Clarify the purpose and storage behavior of entity_uid/entity_type in the documentation | minor |