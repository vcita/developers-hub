---
endpoint: PUT /business/payments/v1/estimates/{estimate_uid}
domain: sales
tags: []
status: success
savedAt: 2026-01-26T22:24:06.349Z
verifiedAt: 2026-01-26T22:24:06.349Z
timesReused: 0
---
# Update Estimates

## Summary
Test passes after fixing several validation issues found through source code exploration. The endpoint successfully updates estimates when valid data is provided.

## Prerequisites
No specific prerequisites documented.

## UID Resolution Procedure

How to dynamically obtain required UIDs for this endpoint:

| UID Field | GET Endpoint | Extract From | Create Fresh | Cleanup |
|-----------|--------------|--------------|--------------|---------|
| estimate_uid | GET /business/payments/v1/estimates/{estimate_uid} | data.estimate.uid | - | - |

### Resolution Steps

**estimate_uid**:
1. Call `GET /business/payments/v1/estimates/{estimate_uid}`
2. Extract from response: `data.estimate.uid`

```json
{
  "estimate_uid": {
    "source_endpoint": "GET /business/payments/v1/estimates/{estimate_uid}",
    "extract_from": "data.estimate.uid",
    "fallback_endpoint": null,
    "create_fresh": false,
    "create_endpoint": null,
    "create_body": null,
    "cleanup_endpoint": null,
    "cleanup_note": null
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
  "path": "/business/payments/v1/estimates/{{resolved.uid}}",
  "body": {
    "estimate": {
      "billing_address": "123 Updated Test St",
      "business_name": "Updated Business Name",
      "currency": "USD",
      "display_items_total": true,
      "display_sections_total": true,
      "due_date": "2024-12-31",
      "estimate_label": "Updated Estimate",
      "estimate_number": 10123457,
      "is_signature_required": false,
      "issue_date": "2024-01-15",
      "items": [
        {
          "description": "Updated item description",
          "discount": {
            "percent": 5
          },
          "item_index": 0,
          "name": "Updated Item",
          "quantity": 2,
          "unit_amount": 150
        }
      ],
      "note": "Updated estimate note",
      "notify_recipient": false,
      "purchase_order": "PO-UPDATED",
      "sections": [
        {
          "items": [
            {
              "description": "Updated section item",
              "discount": {
                "amount": 10
              },
              "item_index": 0,
              "name": "Updated Section Item",
              "quantity": 1,
              "unit_amount": 200
            }
          ],
          "name": "Updated Section",
          "section_index": 0
        }
      ],
      "status": "DRAFT",
      "terms_and_conditions": "Updated terms and conditions"
    }
  }
}
```