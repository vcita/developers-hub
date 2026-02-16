---
endpoint: PUT /business/payments/v1/invoices/{invoice_uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-27T05:08:36.251Z
verifiedAt: 2026-01-27T05:08:36.251Z
timesReused: 0
---
# Update Invoices

## Summary
Test passes after removing the entity_type field without corresponding entity_uid. The validation requires both entity_type and entity_uid to be provided together, or both omitted.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

⚠️ **This test requires creating fresh test data to avoid "already exists" errors.**

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| invoice_uid | POST /business/payments/v1/invoices | data.invoice.uid | - | Invoice will remain for future tests |

### Resolution Steps

**invoice_uid**:
1. **Create fresh test entity**: `POST /business/payments/v1/invoices`
   - Body template: `{"invoice":{"client_uid":"3lf5pm2472o5g895","matter_uid":"gu7odiatpdjn5vk9","invoice_number":174021450,"issue_date":"2024-01-15","due_date":"2024-02-15","currency":"USD","billing_address":"123 Test Street, Test City, TS 12345","items":[{"name":"Test Service","description":"Test invoice item","quantity":1,"unit_amount":100,"item_index":0}]}}`
2. Extract UID from creation response: `data.invoice.uid`
3. Run the test with this fresh UID
4. **Cleanup note**: Invoice will remain for future tests

```json
{
  "invoice_uid": {
    "source_endpoint": "POST /business/payments/v1/invoices",
    "extract_from": "data.invoice.uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": "POST /business/payments/v1/invoices",
    "create_body": {
      "invoice": {
        "client_uid": "3lf5pm2472o5g895",
        "matter_uid": "gu7odiatpdjn5vk9",
        "invoice_number": 174021450,
        "issue_date": "2024-01-15",
        "due_date": "2024-02-15",
        "currency": "USD",
        "billing_address": "123 Test Street, Test City, TS 12345",
        "items": [
          {
            "name": "Test Service",
            "description": "Test invoice item",
            "quantity": 1,
            "unit_amount": 100,
            "item_index": 0
          }
        ]
      }
    },
    "cleanup_endpoint": null,
    "cleanup_note": "Invoice will remain for future tests"
  }
}
```

## How to Resolve Parameters
Parameters were resolved automatically.

## Critical Learnings

No specific learnings documented.

## Request Template

Use this template with dynamically resolved UIDs:

```json
{
  "method": "PUT",
  "path": "/business/payments/v1/invoices/{{resolved.uid}}",
  "body": {
    "invoice": {
      "additional_recipients": [
        "test@example.com"
      ],
      "allow_online_payment": true,
      "allow_partial_payment": true,
      "billing_address": "456 Updated Street",
      "business_name": "Updated Business Name",
      "currency": "USD",
      "display_items_total": true,
      "display_sections_total": true,
      "due_date": "2024-03-15",
      "invoice_label": "UPDATED INVOICE",
      "invoice_number": 174021451,
      "issue_date": "2024-01-20",
      "items": [
        {
          "description": "Updated service description",
          "item_index": 0,
          "name": "Updated Service Name",
          "quantity": 2,
          "unit_amount": 150
        }
      ],
      "note": "Updated invoice note",
      "notify_recipient": true,
      "purchase_order": "PO-12345",
      "sections": [
        {
          "items": [
            {
              "description": "Section item description",
              "item_index": 0,
              "name": "Section Service",
              "quantity": 1,
              "unit_amount": 200
            }
          ],
          "name": "Section 1",
          "section_index": 0
        }
      ],
      "status": "issued",
      "terms_and_conditions": "Updated terms and conditions"
    }
  }
}
```